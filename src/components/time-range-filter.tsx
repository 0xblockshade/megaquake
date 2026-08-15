'use client'

import type { TimeRange } from '@/lib/types'

interface TimeRangeFilterProps {
	value: TimeRange
	onChange: (value: TimeRange) => void
}

const OPTIONS: { value: TimeRange; label: string }[] = [
	{ value: '24h', label: '24h' },
	{ value: '7d', label: '7 days' },
	{ value: '30d', label: '30 days' },
]

export function TimeRangeFilterControl({
	value,
	onChange,
}: TimeRangeFilterProps) {
	return (
		<div
			className="flex items-center gap-1"
			role="group"
			aria-label="Time range filter"
		>
			{OPTIONS.map((option) => {
				const isActive = value === option.value
				return (
					<button
						key={option.value}
						type="button"
						onClick={() => onChange(option.value)}
						aria-pressed={isActive}
						className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
							isActive
								? 'border-[#ededed] bg-[#111111] text-[#ededed]'
								: 'border-[#262626] bg-transparent text-[#888888] hover:border-[#404040] hover:bg-[#111111] hover:text-[#ededed]'
						}`}
					>
						{option.label}
					</button>
				)
			})}
		</div>
	)
}
