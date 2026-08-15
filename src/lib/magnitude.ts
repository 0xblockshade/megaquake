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

export function minMagnitudeForFilter(
	filter: 'all' | '3.0' | '4.5' | '7.0',
): number {
	switch (filter) {
		case 'all':
			return 2.5
		case '3.0':
			return 3
		case '4.5':
			return 4.5
		case '7.0':
			return 7
		default: {
			const exhaustive: never = filter
			return exhaustive
		}
	}
}

export function passesMagnitudeFilter(
	mag: number,
	filter: 'all' | '3.0' | '4.5' | '7.0',
): boolean {
	if (filter === 'all') return true
	return mag >= minMagnitudeForFilter(filter)
}

export function formatMagnitude(mag: number): string {
	return mag.toFixed(1)
}
