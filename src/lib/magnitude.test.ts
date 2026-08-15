import { describe, expect, it } from 'vitest'
import {
	formatDepth,
	formatMagnitude,
	getAgeHours,
	getDepthBand,
	getDepthRingOpacity,
	getMagnitudeColor,
	getMagnitudeCoreColor,
	getMagnitudeRadius,
	getRecencyOpacity,
	minMagnitudeForFilter,
	passesMagnitudeFilter,
} from '@/lib/magnitude'

describe('depth', () => {
	it('bands by the standard shallow/intermediate/deep cutoffs', () => {
		expect(getDepthBand(10)).toBe('shallow')
		expect(getDepthBand(69.9)).toBe('shallow')
		expect(getDepthBand(70)).toBe('intermediate')
		expect(getDepthBand(299)).toBe('intermediate')
		expect(getDepthBand(300)).toBe('deep')
	})

	it('fades the ring as depth increases', () => {
		expect(getDepthRingOpacity(5)).toBeGreaterThan(getDepthRingOpacity(150))
		expect(getDepthRingOpacity(150)).toBeGreaterThan(getDepthRingOpacity(500))
	})

	it('shows one decimal only for very shallow events', () => {
		expect(formatDepth(4.23)).toBe('4.2 km')
		expect(formatDepth(120.6)).toBe('121 km')
	})
})

describe('recency', () => {
	const now = Date.parse('2026-08-15T12:00:00.000Z')

	it('measures age in hours', () => {
		expect(getAgeHours('2026-08-15T09:00:00.000Z', now)).toBeCloseTo(3)
	})

	it('never returns a negative age for events published slightly ahead', () => {
		expect(getAgeHours('2026-08-15T12:00:30.000Z', now)).toBe(0)
	})

	it('keeps brand-new events at full opacity and fades old ones', () => {
		expect(getRecencyOpacity(0)).toBe(1)
		expect(getRecencyOpacity(1)).toBe(1)
		expect(getRecencyOpacity(200)).toBe(0.45)
		const day = getRecencyOpacity(24)
		expect(day).toBeLessThan(1)
		expect(day).toBeGreaterThan(0.45)
	})
})

describe('magnitude', () => {
	it('returns magnitude colors by threshold', () => {
		expect(getMagnitudeColor(3.9)).toBe('#888888')
		expect(getMagnitudeColor(4.5)).toBe('#eab308')
		expect(getMagnitudeColor(6.2)).toBe('#ef4444')
		expect(getMagnitudeColor(7.1)).toBe('#dc2626')
	})

	it('returns brighter core colors for the map markers', () => {
		expect(getMagnitudeCoreColor(7.1)).toBe('#fecaca')
		expect(getMagnitudeCoreColor(4.5)).toBe('#fde68a')
	})

	it('returns radius scales', () => {
		expect(getMagnitudeRadius(7)).toBeGreaterThan(getMagnitudeRadius(4))
	})

	it('maps filters to query floors', () => {
		expect(minMagnitudeForFilter('all')).toBe(2.5)
		expect(minMagnitudeForFilter('3.0')).toBe(3)
		expect(minMagnitudeForFilter('4.5')).toBe(4.5)
		expect(minMagnitudeForFilter('7.0')).toBe(7)
	})

	it('filters magnitudes exactly', () => {
		expect(passesMagnitudeFilter(6.9, '7.0')).toBe(false)
		expect(passesMagnitudeFilter(7.0, '7.0')).toBe(true)
		expect(passesMagnitudeFilter(4.4, '4.5')).toBe(false)
		expect(passesMagnitudeFilter(2.9, '3.0')).toBe(false)
		expect(passesMagnitudeFilter(3.0, '3.0')).toBe(true)
	})

	it('formats magnitudes to one decimal', () => {
		expect(formatMagnitude(7.74)).toBe('7.7')
	})
})
