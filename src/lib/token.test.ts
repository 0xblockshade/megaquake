import { describe, expect, it } from 'vitest'
import { TOKEN_MINT, explorerUrl, shortMint } from '@/lib/token'

describe('token', () => {
	it('builds a Solscan token URL', () => {
		expect(explorerUrl('abc123')).toBe('https://solscan.io/token/abc123')
	})

	it('middle-truncates a full-length mint', () => {
		const short = shortMint('asNXLJWpuKkAAH8U97K4xzdhcQCX9sPDMBWtqPXquak')
		expect(short).toBe('asNXL…Xquak')
		expect(short.length).toBeLessThan(16)
	})

	it('leaves short values alone', () => {
		expect(shortMint('abc')).toBe('abc')
	})

	/**
	 * An empty mint is a valid, supported state: it means no token is attached
	 * and the contract element renders nothing at all. Anything else must be a
	 * plausible Solana address, so a typo cannot reach the site.
	 */
	it('is either empty or a plausible base58 Solana address', () => {
		if (TOKEN_MINT === '') return

		expect(TOKEN_MINT.length).toBeGreaterThanOrEqual(32)
		expect(TOKEN_MINT.length).toBeLessThanOrEqual(44)
		// Base58 excludes 0, O, I and l.
		expect(TOKEN_MINT).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/)
	})
})
