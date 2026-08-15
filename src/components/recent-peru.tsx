'use client'

import { formatRelativeTime } from '@/lib/format'
import { formatMagnitude, getMagnitudeColor } from '@/lib/magnitude'
import { isPeruEvent } from '@/lib/region'
import type { QuakeEvent } from '@/lib/types'

interface RecentPeruProps {
	events: QuakeEvent[]
	selectedId: string | null
	onSelect: (event: QuakeEvent) => void
}

export function RecentPeru({
	events,
	selectedId,
	onSelect,
}: RecentPeruProps) {
	const peruEvents = events.filter(isPeruEvent).slice(0, 20)

	if (peruEvents.length === 0) return null

	return (
		<section
			className="rounded-md border border-[#262626] bg-[#111111] p-3"
			aria-label="Recent earthquakes in Peru"
		>
			<h3 className="mb-2 text-[10px] uppercase tracking-wider text-[#888888]">
				Peru · {peruEvents.length} in view
			</h3>
			<ul className="max-h-56 space-y-1 overflow-y-auto overscroll-contain">
				{peruEvents.map((event) => {
					const isSelected = selectedId === event.id
					const color = getMagnitudeColor(event.mag)

					return (
						<li key={event.id}>
							<button
								type="button"
								onClick={() => onSelect(event)}
								className={`flex w-full items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
									isSelected
										? 'border-[#404040] bg-[#0a0a0a]'
										: 'border-transparent hover:border-[#262626] hover:bg-[#0a0a0a]'
								}`}
							>
								<span className="min-w-0 truncate text-[#ededed]">
									{event.place}
								</span>
								<span
									className="shrink-0 font-mono"
									style={{ color }}
								>
									M{formatMagnitude(event.mag)}
									<span className="ml-2 text-[#888888]">
										{formatRelativeTime(event.time)}
									</span>
								</span>
							</button>
						</li>
					)
				})}
			</ul>
		</section>
	)
}
