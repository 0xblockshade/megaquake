import type { QuakeEvent } from '@/lib/types'

export function isPeruEvent(event: QuakeEvent): boolean {
	if (event.source === 'igp') return true
	const text = `${event.place} ${event.title ?? ''}`
	return /\bperu\b/i.test(text)
}
