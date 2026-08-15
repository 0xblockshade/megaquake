import { describe, expect, it } from 'vitest'
import { isWithinTimeRange, startTimeForRange } from '@/lib/time-range'

describe('time-range', () => {
	const now = Date.parse('2026-08-15T18:00:00.000Z')

	it('computes range starts', () => {
		expect(startTimeForRange('24h', now).toISOString()).toBe(
			'2026-08-14T18:00:00.000Z',
		)
		expect(startTimeForRange('7d', now).toISOString()).toBe(
			'2026-08-08T18:00:00.000Z',
		)
	})

	it('includes events inside the window', () => {
		expect(
			isWithinTimeRange('2026-08-14T17:29:13.000Z', '7d', now),
		).toBe(true)
		expect(
			isWithinTimeRange('2026-08-01T00:00:00.000Z', '7d', now),
		).toBe(false)
	})
})
