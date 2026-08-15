import type { QuakeEvent, QuakeSource } from '@/lib/types'

const SOURCE_RANK: Record<QuakeSource, number> = {
	usgs: 0,
	emsc: 1,
	igp: 2,
}

const MAX_TIME_DIFF_MS = 3 * 60 * 1000
const MAX_DISTANCE_KM = 80

function toRadians(degrees: number): number {
	return (degrees * Math.PI) / 180
}

export function distanceKm(
	a: Pick<QuakeEvent, 'lat' | 'lon'>,
	b: Pick<QuakeEvent, 'lat' | 'lon'>,
): number {
	const dLat = toRadians(b.lat - a.lat)
	const dLon = toRadians(b.lon - a.lon)
	const lat1 = toRadians(a.lat)
	const lat2 = toRadians(b.lat)
	const hav =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

	return 2 * 6371 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav))
}

export function isSameQuake(a: QuakeEvent, b: QuakeEvent): boolean {
	const timeDiff = Math.abs(
		new Date(a.time).getTime() - new Date(b.time).getTime(),
	)
	if (timeDiff > MAX_TIME_DIFF_MS) return false
	return distanceKm(a, b) <= MAX_DISTANCE_KM
}

export function mergeQuakeEvents(events: QuakeEvent[]): QuakeEvent[] {
	const ranked = [...events].sort((a, b) => {
		const rankDiff = SOURCE_RANK[a.source] - SOURCE_RANK[b.source]
		if (rankDiff !== 0) return rankDiff
		return new Date(b.time).getTime() - new Date(a.time).getTime()
	})

	const merged: QuakeEvent[] = []

	for (const event of ranked) {
		const duplicate = merged.find((kept) => isSameQuake(kept, event))
		if (!duplicate) merged.push(event)
	}

	return merged.sort(
		(a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
	)
}
