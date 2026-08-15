import { describe, expect, it } from 'vitest'
import { isPeruEvent } from '@/lib/region'
import type { QuakeEvent } from '@/lib/types'

function event(overrides: Partial<QuakeEvent>): QuakeEvent {
	return {
		id: 'x',
		mag: 4,
		place: 'Unknown',
		time: '2026-08-15T00:00:00.000Z',
		lat: 0,
		lon: 0,
		depthKm: 10,
		tsunami: false,
		url: 'https://example.com',
		source: 'usgs',
		...overrides,
	}
}

describe('region', () => {
	it('treats IGP events as Peru', () => {
		expect(isPeruEvent(event({ source: 'igp', place: 'Lima' }))).toBe(true)
	})

	it('matches Peru in USGS/EMSC place names', () => {
		expect(
			isPeruEvent(event({ place: '27 km E of Chuquitira, Peru' })),
		).toBe(true)
		expect(isPeruEvent(event({ place: 'SOUTHERN PERU' }))).toBe(true)
		expect(isPeruEvent(event({ place: 'TARAPACA, CHILE' }))).toBe(false)
	})
})
