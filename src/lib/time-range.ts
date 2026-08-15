import type { TimeRange } from '@/lib/types'

const RANGE_MS: Record<TimeRange, number> = {
	'24h': 24 * 60 * 60 * 1000,
	'7d': 7 * 24 * 60 * 60 * 1000,
	'30d': 30 * 24 * 60 * 60 * 1000,
}

export function startTimeForRange(
	timeRange: TimeRange,
	now = Date.now(),
): Date {
	return new Date(now - RANGE_MS[timeRange])
}

export function isWithinTimeRange(
	isoTime: string,
	timeRange: TimeRange,
	now = Date.now(),
): boolean {
	return new Date(isoTime).getTime() >= now - RANGE_MS[timeRange]
}
