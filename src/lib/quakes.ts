import {
	fetchEmscQuakeById,
	fetchEmscQuakes,
	parseEmscEventId,
} from '@/lib/emsc'
import {
	fetchIgpQuakeById,
	fetchIgpQuakes,
	parseIgpEventId,
} from '@/lib/igp'
import { mergeQuakeEvents } from '@/lib/merge-quakes'
import { isWithinTimeRange } from '@/lib/time-range'
import {
	fetchUsgsQuakes,
	fetchQuakeById as fetchUsgsQuakeById,
} from '@/lib/usgs'
import type { QuakeEvent, QuakeQueryParams } from '@/lib/types'

function fulfilledEvents(
	result: PromiseSettledResult<QuakeEvent[]>,
): QuakeEvent[] {
	return result.status === 'fulfilled' ? result.value : []
}

export async function fetchQuakes(
	params: QuakeQueryParams,
): Promise<QuakeEvent[]> {
	const results = await Promise.allSettled([
		fetchUsgsQuakes(params),
		fetchEmscQuakes(params),
		fetchIgpQuakes(params),
	])

	const collected = results.flatMap(fulfilledEvents)
	const allFailed = results.every((result) => result.status === 'rejected')

	if (allFailed) {
		throw new Error('All earthquake sources failed')
	}

	return mergeQuakeEvents(collected).filter((event) =>
		isWithinTimeRange(event.time, params.timeRange),
	)
}

export async function fetchQuakeById(
	id: string,
): Promise<QuakeEvent | null> {
	if (parseIgpEventId(id)) return fetchIgpQuakeById(id)
	if (parseEmscEventId(id)) return fetchEmscQuakeById(id)
	return fetchUsgsQuakeById(id)
}
