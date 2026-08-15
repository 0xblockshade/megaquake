import { passesMagnitudeFilter } from '@/lib/magnitude'
import type {
	MagnitudeFilter,
	QuakeEvent,
	QuakeQueryParams,
	QuakeStats,
	TimeRange,
} from '@/lib/types'

const USGS_BASE = 'https://earthquake.usgs.gov'
const CACHE_SECONDS = 60

interface UsgsFeature {
	type: 'Feature'
	id: string
	geometry: {
		type: 'Point'
		coordinates: [number, number, number]
	}
	properties: {
		mag: number | null
		place: string
		time: number
		url: string
		tsunami?: number
		title?: string
		alert?: string | null
		status?: string
	}
}

interface UsgsGeoJson {
	type: 'FeatureCollection'
	features: UsgsFeature[]
}

/**
 * Feed matrix, keyed by the filter the user actually chose.
 *
 * Every time range used to read one fixed feed regardless of magnitude, so the
 * high-magnitude filters paid to download and parse the full low-magnitude feed.
 * Choosing by magnitude too means M4.5+ and M7.0+ read the 4.5 feeds, which are
 * a fraction of the size.
 *
 * The M2.5 baseline for "all" is deliberate and matches minMagnitudeForFilter:
 * the all_* feeds go down to M-1.2 and reach ~11,000 events over 30 days, which
 * is noise rather than signal on a world map.
 *
 * M7.0+ reads the 4.5 feeds and filters down, since USGS publishes no 7.0 feed
 * and every M7 event is by definition in the M4.5 one.
 */
const FEED_NAMES: Record<MagnitudeFilter, Record<TimeRange, string>> = {
	all: { '24h': '2.5_day', '7d': '2.5_week', '30d': '2.5_month' },
	'3.0': { '24h': '2.5_day', '7d': '2.5_week', '30d': '2.5_month' },
	'4.5': { '24h': '4.5_day', '7d': '4.5_week', '30d': '4.5_month' },
	'7.0': { '24h': '4.5_day', '7d': '4.5_week', '30d': '4.5_month' },
}

/**
 * Revalidation windows, in seconds. USGS republishes the summary feeds about
 * once a minute, so the day feeds are polled tightly for freshness. The month
 * feeds are megabytes and mostly historical, so they are cached hard — a quake
 * from three weeks ago is not going to change.
 */
const FEED_TTL: Record<TimeRange, number> = {
	'24h': 30,
	'7d': 120,
	'30d': 600,
}

export function parseMagnitudeFilter(value: string | null): MagnitudeFilter | null {
	if (
		value === 'all' ||
		value === '3.0' ||
		value === '4.5' ||
		value === '7.0'
	) {
		return value
	}
	return null
}

export function parseTimeRange(value: string | null): TimeRange | null {
	if (value === '24h' || value === '7d' || value === '30d') return value
	return null
}

export function parseQuakeQueryParams(
	searchParams: URLSearchParams,
): QuakeQueryParams | null {
	const magnitude = parseMagnitudeFilter(searchParams.get('magnitude'))
	const timeRange = parseTimeRange(searchParams.get('timeRange'))

	if (!magnitude || !timeRange) return null
	return { magnitude, timeRange }
}

export function selectFeedUrl(
	timeRange: TimeRange,
	magnitude: MagnitudeFilter = 'all',
): string {
	const name = FEED_NAMES[magnitude][timeRange]
	return `${USGS_BASE}/earthquakes/feed/v1.0/summary/${name}.geojson`
}

export function selectFeedTtl(timeRange: TimeRange): number {
	return FEED_TTL[timeRange]
}

export function normalizeUsgsFeature(feature: UsgsFeature): QuakeEvent | null {
	const mag = feature.properties.mag
	if (mag === null || Number.isNaN(mag)) return null

	const [lon, lat, depthKm = 0] = feature.geometry.coordinates

	return {
		id: feature.id,
		mag,
		place: feature.properties.place,
		time: new Date(feature.properties.time).toISOString(),
		lat,
		lon,
		depthKm,
		tsunami: feature.properties.tsunami === 1,
		url: feature.properties.url,
		source: 'usgs',
		title: feature.properties.title,
		alert: feature.properties.alert ?? null,
		status: feature.properties.status,
	}
}

export function normalizeUsgsCollection(
	data: UsgsGeoJson,
	magnitude: MagnitudeFilter,
): QuakeEvent[] {
	return data.features
		.map(normalizeUsgsFeature)
		.filter((event): event is QuakeEvent => event !== null)
		.filter((event) => passesMagnitudeFilter(event.mag, magnitude))
		.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}

/**
 * In-process cache for feeds Next refuses to store.
 *
 * Next's data cache rejects anything over 2MB, and all_week is ~2.2MB while
 * all_month is ~7.8MB — so `revalidate` silently does nothing for them and every
 * request re-downloads from USGS. Holding the parsed result in module scope
 * skips both the download and the JSON parse for the life of the instance.
 *
 * Deliberately unbounded in entry count: there are six feed URLs in total.
 */
const memoryCache = new Map<string, { expires: number; data: UsgsGeoJson }>()

/** Above this, Next silently declines to cache and we fall back to memory. */
const NEXT_CACHE_LIMIT_BYTES = 2_000_000

export function __clearFeedCache() {
	memoryCache.clear()
}

async function fetchUsgsJson(
	url: string,
	ttlSeconds: number = CACHE_SECONDS,
): Promise<UsgsGeoJson> {
	const cached = memoryCache.get(url)
	if (cached && cached.expires > Date.now()) return cached.data

	// Previously the month feed used cache: 'no-store', which re-downloaded 7.8MB
	// on every request for data that is almost entirely historical.
	// Replaces cache: 'no-store' for the large feeds, which re-downloaded several
	// megabytes on every request for data that is almost entirely historical.
	const response = await fetch(url, { next: { revalidate: ttlSeconds } })

	if (!response.ok) {
		throw new Error(`USGS request failed: ${response.status}`)
	}

	const text = await response.text()
	const data = JSON.parse(text) as UsgsGeoJson

	// Only the feeds Next cannot cache are worth holding in memory; the small
	// ones are already served from the data cache without the duplication.
	if (text.length > NEXT_CACHE_LIMIT_BYTES) {
		memoryCache.set(url, {
			expires: Date.now() + ttlSeconds * 1000,
			data,
		})
	}

	return data
}

export async function fetchUsgsQuakes(
	params: QuakeQueryParams,
): Promise<QuakeEvent[]> {
	const url = selectFeedUrl(params.timeRange, params.magnitude)
	const data = await fetchUsgsJson(url, selectFeedTtl(params.timeRange))
	return normalizeUsgsCollection(data, params.magnitude)
}

export async function fetchQuakeById(id: string): Promise<QuakeEvent | null> {
	const url =
		`${USGS_BASE}/fdsnws/event/1/query?format=geojson&eventid=${encodeURIComponent(id)}`

	try {
		const data = await fetchUsgsJson(url)
		const feature = data.features[0]
		if (!feature) return null
		return normalizeUsgsFeature(feature)
	} catch {
		return null
	}
}

function startOfUtcDay(date: Date): Date {
	return new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
	)
}

function startOfUtcWeek(date: Date): Date {
	const day = date.getUTCDay()
	const diff = day === 0 ? 6 : day - 1
	const monday = new Date(date)
	monday.setUTCDate(date.getUTCDate() - diff)
	return startOfUtcDay(monday)
}

export function computeStatsFromEvents(events: QuakeEvent[]): QuakeStats {
	const now = new Date()
	const dayStart = startOfUtcDay(now).getTime()
	const weekStart = startOfUtcWeek(now).getTime()

	let strongestMag: number | null = null
	let strongestPlace: string | null = null

	for (const event of events) {
		const time = new Date(event.time).getTime()
		if (strongestMag === null || event.mag > strongestMag) {
			strongestMag = event.mag
			strongestPlace = event.place
		}

		void time
	}

	const today = events.filter(
		(event) => new Date(event.time).getTime() >= dayStart,
	).length

	const thisWeek = events.filter(
		(event) => new Date(event.time).getTime() >= weekStart,
	).length

	return {
		today,
		thisWeek,
		strongestMag,
		strongestPlace,
		m7PlusThisYear: 0,
	}
}

export async function fetchM7PlusYearCount(): Promise<number> {
	const year = new Date().getUTCFullYear()
	const url =
		`${USGS_BASE}/fdsnws/event/1/query?format=geojson&starttime=${year}-01-01&minmagnitude=7&limit=20000`

	try {
		const data = await fetchUsgsJson(url)
		return data.features.length
	} catch {
		return 0
	}
}

export async function fetchQuakeStats(
	events: QuakeEvent[],
): Promise<QuakeStats> {
	const base = computeStatsFromEvents(events)
	const m7PlusThisYear = await fetchM7PlusYearCount()
	return { ...base, m7PlusThisYear }
}

export async function fetchFeaturedEvents(
	ids: string[],
): Promise<QuakeEvent[]> {
	const results = await Promise.all(ids.map((id) => fetchQuakeById(id)))
	return results.filter((event): event is QuakeEvent => event !== null)
}
