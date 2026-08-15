'use client'

import type { MagnitudeFilter } from '@/lib/types'

interface MagnitudeFilterProps {
	value: MagnitudeFilter
	onChange: (value: MagnitudeFilter) => void
}

const OPTIONS: { value: MagnitudeFilter; label: string }[] = [
	{ value: '7.0', label: 'M7.0+' },
	{ value: '4.5', label: 'M4.5+' },
	{ value: 'all', label: 'All' },
]

export function MagnitudeFilterControl({
	value,
	onChange,
}: MagnitudeFilterProps) {
	return (
		<div
			className="flex items-center gap-1"
			role="group"
			aria-label="Minimum magnitude filter"
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
