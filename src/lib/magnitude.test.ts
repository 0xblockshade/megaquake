import { describe, expect, it } from 'vitest'
import {
	formatMagnitude,
	getMagnitudeColor,
	getMagnitudeCoreColor,
	getMagnitudeRadius,
	minMagnitudeForFilter,
	passesMagnitudeFilter,
} from '@/lib/magnitude'

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
