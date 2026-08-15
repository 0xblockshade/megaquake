'use client'

import featuredEvents from '@/config/featured-events.json'
import { formatRelativeTime } from '@/lib/format'
import { formatMagnitude, getMagnitudeColor } from '@/lib/magnitude'
import type { QuakeEvent } from '@/lib/types'

interface FeaturedHotspotsProps {
	events: QuakeEvent[]
	featuredIds: string[]
	selectedId: string | null
	onSelect: (event: QuakeEvent) => void
}

export function FeaturedHotspots({
	events,
	featuredIds,
	selectedId,
	onSelect,
}: FeaturedHotspotsProps) {
	const featured = featuredIds
		.map((id) => {
			const config = featuredEvents.find((item) => item.id === id)
			const event = events.find((item) => item.id === id)
			if (!config || !event) return null
			return { config, event }
		})
		.filter((item): item is NonNullable<typeof item> => item !== null)

	if (featured.length === 0) return null

	return (
		<section
			className="rounded-md border border-[#262626] bg-[#111111] p-3"
			aria-label="Featured earthquake hotspots"
		>
			<h3 className="mb-2 text-[10px] uppercase tracking-wider text-[#888888]">
				Featured hotspots
			</h3>
			<ul className="space-y-1">
				{featured.map(({ config, event }) => {
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
								<span className="truncate text-[#ededed]">
									{config.label}
								</span>
								<span className="shrink-0 font-mono" style={{ color }}>
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
