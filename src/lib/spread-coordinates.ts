import type { QuakeEvent } from '@/lib/types'

const CLUSTER_DEG = 0.12
const RING_DEG = 0.07

export interface MapCoordinate {
	lat: number
	lon: number
}

function clusterKey(event: QuakeEvent): string {
	const lat = Math.round(event.lat / CLUSTER_DEG)
	const lon = Math.round(event.lon / CLUSTER_DEG)
	return `${lat}:${lon}`
}

/** Nudge stacked epicenters apart on the map only. */
export function spreadMapCoordinates(
	events: QuakeEvent[],
): Map<string, MapCoordinate> {
	const groups = new Map<string, QuakeEvent[]>()

	for (const event of events) {
		const key = clusterKey(event)
		const group = groups.get(key)
		if (group) group.push(event)
		else groups.set(key, [event])
	}

	const coordinates = new Map<string, MapCoordinate>()

	for (const group of groups.values()) {
		if (group.length === 1) {
			const event = group[0]
			if (!event) continue
			coordinates.set(event.id, { lat: event.lat, lon: event.lon })
			continue
		}

		const sorted = [...group].sort(
			(a, b) =>
				new Date(b.time).getTime() - new Date(a.time).getTime(),
		)

		sorted.forEach((event, index) => {
			const angle = (2 * Math.PI * index) / sorted.length
			const radius = RING_DEG + Math.min(sorted.length - 2, 4) * 0.015
			coordinates.set(event.id, {
				lat: event.lat + Math.sin(angle) * radius,
				lon: event.lon + Math.cos(angle) * radius,
			})
		})
	}

	return coordinates
}
