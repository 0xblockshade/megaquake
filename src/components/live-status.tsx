'use client'

interface LiveStatusProps {
	lastUpdated: string | null
	isValidating: boolean
	error?: boolean
}

export function LiveStatus({
	lastUpdated,
	isValidating,
	error,
}: LiveStatusProps) {
	return (
		<div className="flex items-center gap-2 text-xs text-[#888888]">
			<span
				className={`inline-block h-2 w-2 rounded-full ${
					error
						? 'bg-[#ef4444]'
						: isValidating
							? 'animate-pulse bg-[#eab308]'
							: 'bg-[#22c55e]'
				}`}
				aria-hidden="true"
			/>
			<span className="font-mono">
				{error
					? 'Feed unavailable'
					: isValidating
						? 'Updating…'
						: lastUpdated
							? `Live · ${new Date(lastUpdated).toLocaleTimeString()}`
							: 'Connecting…'}
			</span>
		</div>
	)
}
