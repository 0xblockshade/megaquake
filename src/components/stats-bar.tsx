'use client'

import { formatMagnitude } from '@/lib/magnitude'
import type { QuakeStats } from '@/lib/types'

interface StatsBarProps {
	stats: QuakeStats | undefined
	isLoading: boolean
}

function StatItem({
	label,
	value,
	mono = false,
}: {
	label: string
	value: string
	mono?: boolean
}) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-[10px] uppercase tracking-wider text-[#888888]">
				{label}
			</span>
			<span
				className={`text-sm text-[#ededed] ${mono ? 'font-mono' : ''}`}
			>
				{value}
			</span>
		</div>
	)
}

export function StatsBar({ stats, isLoading }: StatsBarProps) {
	const strongest =
		stats?.strongestMag != null
			? `M${formatMagnitude(stats.strongestMag)}`
			: '—'

	const strongestDetail =
		stats?.strongestPlace != null
			? stats.strongestPlace.split(',')[0]
			: ''

	return (
		<div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-[#262626] bg-[#0a0a0a] px-4 py-2">
			<StatItem
				label="Today"
				value={isLoading ? '…' : String(stats?.today ?? 0)}
				mono
			/>
			<StatItem
				label="This week"
				value={isLoading ? '…' : String(stats?.thisWeek ?? 0)}
				mono
			/>
			<StatItem
				label="Strongest"
				value={
					isLoading
						? '…'
						: strongestDetail
							? `${strongest} · ${strongestDetail}`
							: strongest
				}
				mono
			/>
			<StatItem
				label="M7+ this year"
				value={isLoading ? '…' : String(stats?.m7PlusThisYear ?? 0)}
				mono
			/>
		</div>
	)
}
