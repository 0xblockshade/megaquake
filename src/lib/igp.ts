import { passesMagnitudeFilter } from '@/lib/magnitude'
import type { MagnitudeFilter, QuakeEvent, TimeRange } from '@/lib/types'
import { startTimeForRange } from '@/lib/time-range'

const IGP_QUERY =
	'https://ide.igp.gob.pe/arcgis/rest/services/monitoreocensis/Sismicidad/MapServer/0/query'
const IGP_EVENT_PAGE =
	'https://ultimosismo.igp.gob.pe/ultimo-sismo/sismo'

interface IgpAttributes {
	code?: string | null
	magnitud?: number | null
	ref?: string | null
	departamento?: string | null
	fechaevento?: number | null
	lat?: number | null
	lon?: number | null
	prof?: number | null
}

interface IgpFeature {
	attributes?: IgpAttributes
}

interface IgpQueryResponse {
	features?: IgpFeature[]
	error?: { message?: string }
}

export function igpEventId(code: string): string {
	return `igp-${code}`
}

export function parseIgpEventId(id: string): string | null {
	if (!id.startsWith('igp-')) return null
	const code = id.slice('igp-'.length)
	return code.length > 0 ? code : null
}

export function normalizeIgpFeature(
	feature: IgpFeature,
): QuakeEvent | null {
	const attributes = feature.attributes
	if (!attributes) return null

	const mag = attributes.magnitud
	const code = attributes.code?.trim()
	const lat = attributes.lat
	const lon = attributes.lon
	const timeMs = attributes.fechaevento

	if (
		mag == null ||
		Number.isNaN(mag) ||
		!code ||
		lat == null ||
		lon == null ||
		timeMs == null
	) {
		return null
	}

	const place =
		attributes.ref?.trim() ||
		attributes.departamento?.trim() ||
		'Peru'

	return {
		id: igpEventId(code),
		mag,
		place,
		time: new Date(timeMs).toISOString(),
		lat,
		lon,
		depthKm: attributes.prof ?? 0,
		tsunami: false,
		url: `${IGP_EVENT_PAGE}/${encodeURIComponent(code)}`,
		source: 'igp',
		title: `M ${mag.toFixed(1)} - ${place}`,
		alert: null,
		status: 'reviewed',
	}
}

export function normalizeIgpCollection(
	data: IgpQueryResponse,
	magnitude: MagnitudeFilter,
	timeRange: TimeRange,
	now = Date.now(),
): QuakeEvent[] {
	const startMs = startTimeForRange(timeRange, now).getTime()

	return (data.features ?? [])
		.map(normalizeIgpFeature)
		.filter((event): event is QuakeEvent => event !== null)
		.filter((event) => passesMagnitudeFilter(event.mag, magnitude))
		.filter((event) => new Date(event.time).getTime() >= startMs)
}

async function queryIgp(where: string): Promise<IgpQueryResponse> {
	const url = new URL(IGP_QUERY)
	url.searchParams.set('where', where)
	url.searchParams.set('outFields', '*')
	url.searchParams.set('orderByFields', 'fechaevento DESC')
	url.searchParams.set('resultRecordCount', '500')
	url.searchParams.set('f', 'json')

	const response = await fetch(url, { cache: 'no-store' })
	if (!response.ok) {
		throw new Error(`IGP request failed: ${response.status}`)
	}

	const data = (await response.json()) as IgpQueryResponse
	if (data.error) {
		throw new Error(data.error.message ?? 'IGP query error')
	}

	return data
}

export async function fetchIgpQuakes(params: {
	magnitude: MagnitudeFilter
	timeRange: TimeRange
}): Promise<QuakeEvent[]> {
	const data = await queryIgp('lat IS NOT NULL AND magnitud IS NOT NULL')
	return normalizeIgpCollection(data, params.magnitude, params.timeRange)
}

export async function fetchIgpQuakeById(
	id: string,
): Promise<QuakeEvent | null> {
	const code = parseIgpEventId(id)
	if (!code) return null

	try {
		const escaped = code.replaceAll("'", "''")
		const data = await queryIgp(`code='${escaped}'`)
		const feature = data.features?.[0]
		return feature ? normalizeIgpFeature(feature) : null
	} catch {
		return null
	}
}
