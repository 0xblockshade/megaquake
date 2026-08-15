export function getMagnitudeColor(mag: number): string {
	if (mag >= 7) return '#dc2626'
	if (mag >= 6) return '#ef4444'
	if (mag >= 5) return '#f97316'
	if (mag >= 4) return '#eab308'
	return '#888888'
}

export function getMagnitudeCoreColor(mag: number): string {
	if (mag >= 7) return '#fecaca'
	if (mag >= 6) return '#fecaca'
	if (mag >= 5) return '#fed7aa'
	if (mag >= 4) return '#fde68a'
	return '#d4d4d4'
}

export function getMagnitudeRadius(mag: number): number {
	if (mag >= 7) return 22
	if (mag >= 6) return 16
	if (mag >= 5) return 12
	if (mag >= 4) return 8
	return 5
}

/**
 * Depth band. Shallow quakes do far more damage at the surface than deep ones of
 * the same magnitude, so depth is worth showing rather than discarding — the data
 * was already being fetched and thrown away.
 */
export type DepthBand = 'shallow' | 'intermediate' | 'deep'

export function getDepthBand(depthKm: number): DepthBand {
	if (depthKm < 70) return 'shallow'
	if (depthKm < 300) return 'intermediate'
	return 'deep'
}

/** Ring style per depth band: solid for shallow, progressively fainter with depth. */
export function getDepthRingOpacity(depthKm: number): number {
	switch (getDepthBand(depthKm)) {
		case 'shallow':
			return 0.95
		case 'intermediate':
			return 0.6
		case 'deep':
			return 0.35
	}
}

export function formatDepth(depthKm: number): string {
	return `${depthKm.toFixed(depthKm < 10 ? 1 : 0)} km`
}

/**
 * Age in hours, used to fade older events so new ones stand out. Returns 0 for
 * anything in the future (USGS occasionally publishes a few seconds ahead).
 */
export function getAgeHours(time: string, now: number = Date.now()): number {
	return Math.max(0, (now - new Date(time).getTime()) / 3_600_000)
}

/** 1 for a brand-new event, easing down to 0.45 for anything over ~48h old. */
export function getRecencyOpacity(ageHours: number): number {
	if (ageHours <= 1) return 1
	if (ageHours >= 48) return 0.45
	return 1 - 0.55 * ((ageHours - 1) / 47)
}

export function passesMagnitudeFilter(
	mag: number,
	filter: 'all' | '4.5' | '7.0',
): boolean {
	switch (filter) {
		case 'all':
			return true
		case '4.5':
			return mag >= 4.5
		case '7.0':
			return mag >= 7
		default: {
			const exhaustive: never = filter
			return exhaustive
		}
	}
}

export function formatMagnitude(mag: number): string {
	return mag.toFixed(1)
}
