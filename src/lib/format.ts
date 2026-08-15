export function formatUtcTime(iso: string): string {
	return new Intl.DateTimeFormat('en-US', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'UTC',
	}).format(new Date(iso))
}

export function formatLocalTime(iso: string): string {
	return new Intl.DateTimeFormat('en-US', {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(new Date(iso))
}

export function formatRelativeTime(iso: string): string {
	const diffMs = Date.now() - new Date(iso).getTime()
	const minutes = Math.floor(diffMs / 60_000)

	if (minutes < 1) return 'just now'
	if (minutes < 60) return `${minutes}m ago`

	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours}h ago`

	const days = Math.floor(hours / 24)
	return `${days}d ago`
}

export function formatCoordinates(lat: number, lon: number): string {
	const latDir = lat >= 0 ? 'N' : 'S'
	const lonDir = lon >= 0 ? 'E' : 'W'
	return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`
}
