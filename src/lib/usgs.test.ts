import { describe, expect, it } from 'vitest'
import {
	normalizeUsgsCollection,
	normalizeUsgsFeature,
	parseMagnitudeFilter,
	parseQuakeQueryParams,
	parseTimeRange,
	selectFeedTtl,
	selectFeedUrl,
} from '@/lib/usgs'

const sampleFeature = {
	type: 'Feature' as const,
	id: 'us6000tkt2',
	geometry: {
		type: 'Point' as const,
		coordinates: [121.3517, -8.3101, 10] as [number, number, number],
	},
	properties: {
		mag: 7.7,
		place: '68 km NNW of Ende, Indonesia',
		time: 1786744701564,
		url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us6000tkt2',
		tsunami: 0,
		title: 'M 7.7 - 68 km NNW of Ende, Indonesia',
		alert: 'orange',
		status: 'reviewed',
	},
}

describe('usgs', () => {
	it('parses valid query params', () => {
		const params = new URLSearchParams({
			magnitude: '7.0',
			timeRange: '7d',
		})
		expect(parseQuakeQueryParams(params)).toEqual({
			magnitude: '7.0',
			timeRange: '7d',
		})
	})

	it('rejects invalid query params', () => {
		const params = new URLSearchParams({
			magnitude: 'invalid',
			timeRange: '7d',
		})
		expect(parseQuakeQueryParams(params)).toBeNull()
	})

	it('parses magnitude and time range enums', () => {
		expect(parseMagnitudeFilter('3.0')).toBe('3.0')
		expect(parseMagnitudeFilter('4.5')).toBe('4.5')
		expect(parseMagnitudeFilter('bad')).toBeNull()
		expect(parseTimeRange('30d')).toBe('30d')
		expect(parseTimeRange('bad')).toBeNull()
	})

	it('selects feed URLs by time range and magnitude', () => {
		expect(selectFeedUrl('24h', 'all')).toContain('earthquakes/feed')

		// "all" is the M2.5 baseline, matching minMagnitudeForFilter. The all_*
		// feeds reach M-1.2 and ~11,000 events over 30 days, which is noise.
		expect(selectFeedUrl('24h', 'all')).toContain('2.5_day.geojson')
		expect(selectFeedUrl('7d', 'all')).toContain('2.5_week.geojson')
		expect(selectFeedUrl('30d', 'all')).toContain('2.5_month.geojson')

		// M3.0+ needs the same feed, then filters down.
		expect(selectFeedUrl('7d', '3.0')).toContain('2.5_week.geojson')

		// The higher filters read the far smaller 4.5 feeds instead of paying to
		// download and parse the full 2.5 feed only to discard most of it.
		expect(selectFeedUrl('24h', '4.5')).toContain('4.5_day.geojson')
		expect(selectFeedUrl('7d', '4.5')).toContain('4.5_week.geojson')
		expect(selectFeedUrl('30d', '4.5')).toContain('4.5_month.geojson')
	})

	it('reads M7.0+ from the 4.5 feeds, since USGS publishes no 7.0 feed', () => {
		expect(selectFeedUrl('24h', '7.0')).toContain('4.5_day.geojson')
		expect(selectFeedUrl('30d', '7.0')).toContain('4.5_month.geojson')
	})

	it('caches the heavy month feed far longer than the live day feed', () => {
		expect(selectFeedTtl('24h')).toBeLessThan(selectFeedTtl('7d'))
		expect(selectFeedTtl('7d')).toBeLessThan(selectFeedTtl('30d'))
	})

	it('normalizes USGS features', () => {
		const event = normalizeUsgsFeature(sampleFeature)
		expect(event).toMatchObject({
			id: 'us6000tkt2',
			mag: 7.7,
			source: 'usgs',
			tsunami: false,
		})
	})

	it('filters null magnitude records', () => {
		const collection = normalizeUsgsCollection(
			{
				type: 'FeatureCollection',
				features: [
					sampleFeature,
					{
						...sampleFeature,
						id: 'bad',
						properties: { ...sampleFeature.properties, mag: null },
					},
				],
			},
			'all',
		)

		expect(collection).toHaveLength(1)
	})

	it('applies magnitude thresholds', () => {
		const collection = normalizeUsgsCollection(
			{
				type: 'FeatureCollection',
				features: [
					sampleFeature,
					{
						...sampleFeature,
						id: 'small',
						properties: { ...sampleFeature.properties, mag: 4.2 },
					},
				],
			},
			'7.0',
		)

		expect(collection).toHaveLength(1)
		expect(collection[0]?.id).toBe('us6000tkt2')
	})

	it('keeps events at M3.0 and above', () => {
		const collection = normalizeUsgsCollection(
			{
				type: 'FeatureCollection',
				features: [
					{
						...sampleFeature,
						id: 'below',
						properties: { ...sampleFeature.properties, mag: 2.9 },
					},
					{
						...sampleFeature,
						id: 'edge',
						properties: { ...sampleFeature.properties, mag: 3.0 },
					},
				],
			},
			'3.0',
		)

		expect(collection.map((event) => event.id)).toEqual(['edge'])
	})
})
