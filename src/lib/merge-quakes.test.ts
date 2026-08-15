import { describe, expect, it } from 'vitest'
import { isSameQuake, mergeQuakeEvents } from '@/lib/merge-quakes'
import type { QuakeEvent } from '@/lib/types'

function event(overrides: Partial<QuakeEvent>): QuakeEvent {
	return {
		id: 'us-1',
		mag: 4.6,
		place: 'Central Peru',
		time: '2026-08-14T17:29:13.000Z',
		lat: -15.42,
		lon: -73.25,
		depthKm: 20,
		tsunami: false,
		url: 'https://example.com',
		source: 'usgs',
		...overrides,
	}
}

describe('merge-quakes', () => {
	it('treats nearby same-time events as duplicates', () => {
		expect(
			isSameQuake(
				event({ source: 'usgs' }),
				event({
					id: 'igp-2026-551',
					source: 'igp',
					lat: -15.4,
					lon: -73.2,
					time: '2026-08-14T17:30:00.000Z',
				}),
			),
		).toBe(true)
	})

	it('keeps distant or later events', () => {
		expect(
			isSameQuake(
				event({ source: 'usgs' }),
				event({
					id: 'igp-other',
					source: 'igp',
					lat: -12.2,
					lon: -75.3,
				}),
			),
		).toBe(false)
	})

	it('prefers USGS over IGP and EMSC for the same quake', () => {
		const merged = mergeQuakeEvents([
			event({
				id: 'igp-2026-551',
				source: 'igp',
				place: 'Pausa, Ayacucho',
			}),
			event({
				id: 'emsc-20260814_0000001',
				source: 'emsc',
				place: 'SOUTHERN PERU',
			}),
			event({ id: 'us6000abcd', source: 'usgs', place: 'Peru' }),
		])

		expect(merged).toHaveLength(1)
		expect(merged[0]?.id).toBe('us6000abcd')
		expect(merged[0]?.source).toBe('usgs')
	})

	it('keeps unique IGP events that USGS missed', () => {
		const merged = mergeQuakeEvents([
			event({ id: 'us6000abcd', source: 'usgs' }),
			event({
				id: 'igp-2026-550',
				source: 'igp',
				place: 'Ichuña, Moquegua',
				time: '2026-08-14T07:48:10.000Z',
				lat: -16.2,
				lon: -70.56,
				mag: 3.4,
			}),
		])

		expect(merged.map((item) => item.id)).toEqual([
			'us6000abcd',
			'igp-2026-550',
		])
	})
})
