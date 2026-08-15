import { describe, expect, it } from 'vitest'
import {
	igpEventId,
	normalizeIgpCollection,
	normalizeIgpFeature,
	parseIgpEventId,
} from '@/lib/igp'

const sampleFeature = {
	attributes: {
		code: '2026-551',
		magnitud: 4.0,
		ref: '19 km al SE de Pausa, Paucar del Sara Sara - Ayacucho',
		departamento: 'Ayacucho',
		fechaevento: Date.parse('2026-08-14T17:29:13.000Z'),
		lat: -15.42,
		lon: -73.25,
		prof: 18,
	},
}

describe('igp', () => {
	it('parses prefixed event ids', () => {
		expect(igpEventId('2026-551')).toBe('igp-2026-551')
		expect(parseIgpEventId('igp-2026-551')).toBe('2026-551')
		expect(parseIgpEventId('us6000tip9')).toBeNull()
	})

	it('normalizes IGP features', () => {
		const event = normalizeIgpFeature(sampleFeature)
		expect(event).toMatchObject({
			id: 'igp-2026-551',
			mag: 4,
			place: '19 km al SE de Pausa, Paucar del Sara Sara - Ayacucho',
			source: 'igp',
			depthKm: 18,
		})
		expect(event?.url).toContain('2026-551')
	})

	it('skips legend rows without coordinates', () => {
		expect(
			normalizeIgpFeature({
				attributes: { magnitud: 7, lat: null, lon: null },
			}),
		).toBeNull()
	})

	it('filters by magnitude and time window', () => {
		const now = Date.parse('2026-08-15T18:00:00.000Z')
		const collection = normalizeIgpCollection(
			{
				features: [
					sampleFeature,
					{
						attributes: {
							...sampleFeature.attributes,
							code: '2026-500',
							fechaevento: Date.parse(
								'2026-07-01T00:00:00.000Z',
							),
						},
					},
					{
						attributes: {
							...sampleFeature.attributes,
							code: '2026-400',
							magnitud: 2.8,
						},
					},
				],
			},
			'3.0',
			'7d',
			now,
		)

		expect(collection.map((event) => event.id)).toEqual(['igp-2026-551'])
	})
})
