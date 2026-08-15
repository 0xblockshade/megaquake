import { minMagnitudeForFilter, passesMagnitudeFilter } from '@/lib/magnitude'
import type { MagnitudeFilter, QuakeEvent, TimeRange } from '@/lib/types'

const EMSC_BASE = 'https://www.seismicportal.eu/fdsnws/event/1/query'
const EMSC_EVENT_PAGE = 'https://www.seismicportal.eu/eventdetails.html'
const EMSC_LIMIT = 1000

interface EmscFeature {
	type: 'Feature'
	id?: string
	geometry?: {
		type: 'Point'
		coordinates: [number, number, number?]
	}
	properties: {
		mag?: number | null
		time?: string
		flynn_region?: string
		lat?: number
		lon?: number
		depth?: number | null
		unid?: string
		auth?: string
	}
}

interface EmscGeoJson {
	type: 'FeatureCollection'
	features?: EmscFeature[]
}

export function emscEventId(unid: string): string {
	return `emsc-${unid}`
}

export function parseEmscEventId(id: string): string | null {
	if (!id.startsWith('emsc-')) return null
	const unid = id.slice('emsc-'.length)
	return unid.length > 0 ? unid : null
}

export function normalizeEmscFeature(
	feature: EmscFeature,
): QuakeEvent | null {
	const properties = feature.properties
	const mag = properties.mag
	const unid = properties.unid ?? feature.id
	const lat = properties.lat ?? feature.geometry?.coordinates[1]
	const lon = properties.lon ?? feature.geometry?.coordinates[0]
	const depthKm = properties.depth
	const time = properties.time

	if (
		mag == null ||
		Number.isNaN(mag) ||
		!unid ||
		lat == null ||
		lon == null ||
		!time
	) {
		return null
	}

	const place = properties.flynn_region?.trim() || 'Unknown region'

	return {
		id: emscEventId(unid),
		mag,
		place,
		time: new Date(time).toISOString(),
		lat,
		lon,
		depthKm: depthKm == null || Number.isNaN(depthKm) ? 0 : depthKm,
		tsunami: false,
		url: `${EMSC_EVENT_PAGE}?unid=${encodeURIComponent(unid)}`,
		source: 'emsc',
		title: `M ${mag.toFixed(1)} - ${place}`,
		alert: null,
		status: properties.auth,
	}
}

export function normalizeEmscCollection(
	data: EmscGeoJson,
	magnitude: MagnitudeFilter,
): QuakeEvent[] {
	return (data.features ?? [])
		.map(normalizeEmscFeature)
		.filter((event): event is QuakeEvent => event !== null)
		.filter((event) => passesMagnitudeFilter(event.mag, magnitude))
}

function toEmscStartTime(date: Date): string {
	return date.toISOString().replace(/\.\d{3}Z$/, '')
}

export async function fetchEmscQuakes(params: {
	magnitude: MagnitudeFilter
	timeRange: TimeRange
}): Promise<QuakeEvent[]> {
	// EMSC is used as a near-real-time fill, not a week/month catalog.
	const recentHours = params.timeRange === '24h' ? 24 : 48
	const start = new Date(Date.now() - recentHours * 60 * 60 * 1000)
	const minmag = minMagnitudeForFilter(params.magnitude)
	const url =
		`${EMSC_BASE}?format=json&orderby=time` +
		`&minmag=${minmag}` +
		`&starttime=${encodeURIComponent(toEmscStartTime(start))}` +
		`&limit=${EMSC_LIMIT}`

	const response = await fetch(url, { cache: 'no-store' })
	if (!response.ok) {
		throw new Error(`EMSC request failed: ${response.status}`)
	}

	const data = (await response.json()) as EmscGeoJson
	return normalizeEmscCollection(data, params.magnitude)
}

export async function fetchEmscQuakeById(
	id: string,
): Promise<QuakeEvent | null> {
	const unid = parseEmscEventId(id)
	if (!unid) return null

	const url =
		`${EMSC_BASE}?format=json&eventid=${encodeURIComponent(unid)}`

	try {
		const response = await fetch(url, { cache: 'no-store' })
		if (!response.ok) return null
		const data = (await response.json()) as EmscGeoJson
		const feature = data.features?.[0]
		return feature ? normalizeEmscFeature(feature) : null
	} catch {
		return null
	}
}
