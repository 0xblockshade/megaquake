/** The token associated with this site.
 *
 * Set TOKEN_MINT to "" and the contract element disappears everywhere — the
 * component renders nothing rather than an empty slot.
 */
/** Typed as string, not inferred as a literal, so swapping the value in and out
 * does not narrow every comparison against it to `never`. */
export const TOKEN_MINT: string = ''

export function explorerUrl(mint: string): string {
	return `https://solscan.io/token/${mint}`
}

/** Middle-truncate for the stats bar, which has no room for 43 characters. */
export function shortMint(mint: string): string {
	return mint.length <= 16 ? mint : `${mint.slice(0, 5)}…${mint.slice(-5)}`
}
