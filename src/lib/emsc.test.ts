import { describe, expect, it } from 'vitest'
import {
	emscEventId,
	normalizeEmscCollection,
	normalizeEmscFeature,
	parseEmscEventId,
} from '@/lib/emsc'

const sampleFeature = {
	type: 'Feature' as const,
	id: '20260814_0000001',
	geometry: {
		type: 'Point' as const,
		coordinates: [-73.25, -15.42, -40] as [number, number, number],
	},
	properties: {
		mag: 4.0,
		time: '2026-08-14T17:29:13.0Z',
		flynn_region: 'SOUTHERN PERU',
		lat: -15.42,
		lon: -73.25,
		depth: 40,
		unid: '20260814_0000001',
		auth: 'EMSC',
	},
}

describe('emsc', () => {
	it('parses prefixed event ids', () => {
		expect(emscEventId('20260814_0000001')).toBe('emsc-20260814_0000001')
		expect(parseEmscEventId('emsc-20260814_0000001')).toBe(
			'20260814_0000001',
		)
		expect(parseEmscEventId('us6000tip9')).toBeNull()
	})

	it('normalizes EMSC features', () => {
		const event = normalizeEmscFeature(sampleFeature)
		expect(event).toMatchObject({
			id: 'emsc-20260814_0000001',
			mag: 4,
			place: 'SOUTHERN PERU',
			source: 'emsc',
			lat: -15.42,
			lon: -73.25,
			depthKm: 40,
		})
	})

	it('drops incomplete records and applies magnitude filters', () => {
		const collection = normalizeEmscCollection(
			{
				type: 'FeatureCollection',
				features: [
					sampleFeature,
					{
						...sampleFeature,
						properties: { ...sampleFeature.properties, mag: 2.4 },
					},
					{
						...sampleFeature,
						properties: {
							...sampleFeature.properties,
							unid: undefined,
							mag: null,
						},
					},
				],
			},
			'3.0',
		)

		expect(collection).toHaveLength(1)
		expect(collection[0]?.id).toBe('emsc-20260814_0000001')
	})
})
