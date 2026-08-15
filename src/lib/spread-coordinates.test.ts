import { describe, expect, it } from 'vitest'
import { spreadMapCoordinates } from '@/lib/spread-coordinates'
import type { QuakeEvent } from '@/lib/types'

function event(overrides: Partial<QuakeEvent>): QuakeEvent {
	return {
		id: 'a',
		mag: 3.4,
		place: 'Huancayo',
		time: '2026-08-15T04:54:30.000Z',
		lat: -12.25,
		lon: -75.33,
		depthKm: 10,
		tsunami: false,
		url: 'https://example.com',
		source: 'igp',
		...overrides,
	}
}

describe('spread-coordinates', () => {
	it('leaves isolated events in place', () => {
		const coords = spreadMapCoordinates([event({ id: 'solo' })])
		expect(coords.get('solo')).toEqual({ lat: -12.25, lon: -75.33 })
	})

	it('separates stacked Peru aftershocks', () => {
		const coords = spreadMapCoordinates([
			event({ id: 'igp-2026-555' }),
			event({
				id: 'igp-2026-554',
				lat: -12.22,
				lon: -75.33,
				time: '2026-08-15T00:11:24.000Z',
			}),
		])

		const first = coords.get('igp-2026-555')
		const second = coords.get('igp-2026-554')
		expect(first).toBeDefined()
		expect(second).toBeDefined()
		expect(first).not.toEqual(second)
		expect(
			Math.hypot(
				(first?.lat ?? 0) - (second?.lat ?? 0),
				(first?.lon ?? 0) - (second?.lon ?? 0),
			),
		).toBeGreaterThan(0.05)
	})
})
