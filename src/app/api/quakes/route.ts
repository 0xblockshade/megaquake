import featuredEvents from '@/config/featured-events.json'
import {
	fetchFeaturedEvents,
	fetchQuakeStats,
	fetchQuakes,
	parseQuakeQueryParams,
} from '@/lib/usgs'
import type { QuakesErrorResponse, QuakesResponse } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const params = parseQuakeQueryParams(searchParams)

	if (!params) {
		const body: QuakesErrorResponse = {
			error: 'Invalid magnitude or timeRange query parameters',
			code: 'INVALID_PARAMS',
		}
		return Response.json(body, { status: 400 })
	}

	try {
		const [events, featured] = await Promise.all([
			fetchQuakes(params),
			fetchFeaturedEvents(featuredEvents.map((event) => event.id)),
		])

		const eventIds = new Set(events.map((event) => event.id))
		const mergedEvents = [
			...events,
			...featured.filter((event) => !eventIds.has(event.id)),
		].sort(
			(a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
		)

		const stats = await fetchQuakeStats(mergedEvents)

		const body: QuakesResponse = {
			events: mergedEvents,
			stats,
			generatedAt: new Date().toISOString(),
			filters: params,
			featuredIds: featuredEvents.map((event) => event.id),
		}

		return Response.json(body, {
			headers: {
				'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
			},
		})
	} catch {
		const body: QuakesErrorResponse = {
			error: 'Failed to fetch earthquake data from USGS',
			code: 'UPSTREAM_ERROR',
		}
		return Response.json(body, { status: 502 })
	}
}
