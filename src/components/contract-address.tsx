'use client'

import { useEffect, useRef, useState } from 'react'
import { TOKEN_MINT, explorerUrl, shortMint } from '@/lib/token'

/** Contract address with copy-to-clipboard and a Solscan link.
 *
 * Sits at the end of the stats bar rather than in the header, which is already
 * carrying the title, live status, and both filter controls.
 */
export function ContractAddress() {
	const [copied, setCopied] = useState(false)
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current)
		},
		[],
	)

	if (!TOKEN_MINT) return null

	async function copy() {
		try {
			await navigator.clipboard.writeText(TOKEN_MINT)
			setCopied(true)
			if (timer.current) clearTimeout(timer.current)
			timer.current = setTimeout(() => setCopied(false), 1600)
		} catch {
			// Clipboard is unavailable on insecure origins or when denied. The
			// address stays selectable, so failing quietly beats an alert.
		}
	}

	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-[10px] uppercase tracking-wider text-[#888888]">
				Contract
			</span>
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={copy}
					title={TOKEN_MINT}
					aria-label="Copy the contract address"
					className="font-mono text-sm text-[#ededed] transition-colors hover:text-[#888888]"
				>
					{shortMint(TOKEN_MINT)}
				</button>
				<span
					className={`font-mono text-[10px] uppercase tracking-wider ${
						copied ? 'text-[#22c55e]' : 'text-[#888888]'
					}`}
					aria-hidden="true"
				>
					{copied ? 'copied' : 'copy'}
				</span>
				<a
					href={explorerUrl(TOKEN_MINT)}
					target="_blank"
					rel="noopener noreferrer"
					className="text-[10px] uppercase tracking-wider text-[#888888] transition-colors hover:text-[#ededed]"
				>
					Solscan
				</a>
			</div>
			<span aria-live="polite" className="sr-only">
				{copied ? 'Contract address copied to clipboard' : ''}
			</span>
		</div>
	)
}
