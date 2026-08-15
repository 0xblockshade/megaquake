import { describe, expect, it } from 'vitest'
import { getSourceLabel, getSourcePageLabel } from '@/lib/source'

describe('source', () => {
	it('labels catalog sources', () => {
		expect(getSourceLabel('usgs')).toBe('USGS')
		expect(getSourceLabel('emsc')).toBe('EMSC')
		expect(getSourceLabel('igp')).toBe('IGP Peru')
	})

	it('labels outbound event pages', () => {
		expect(getSourcePageLabel('usgs')).toBe('USGS event page')
		expect(getSourcePageLabel('emsc')).toBe('EMSC event page')
		expect(getSourcePageLabel('igp')).toBe('IGP report')
	})
})
