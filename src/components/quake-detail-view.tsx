'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { QuakeDetailPanel } from '@/components/quake-detail-panel'
import { TweetFeedSidebar } from '@/components/tweet-feed'
import featuredEvents from '@/config/featured-events.json'
import type { QuakeEvent } from '@/lib/types'

const EarthquakeMap = dynamic(
	() =>
		import('@/components/earthquake-map').then((mod) => mod.EarthquakeMap),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-full items-center justify-center bg-[#0a0a0a] text-sm text-[#888888]">
				Loading map…
			</div>
		),
	},
)

interface QuakeDetailViewProps {
	event: QuakeEvent
}

export function QuakeDetailView({ event }: QuakeDetailViewProps) {
	const featured = featuredEvents.find((item) => item.id === event.id)
	const region = featured?.region ?? null

	return (
		<div className="flex h-dvh min-h-0 flex-col overflow-hidden">
			<header className="flex items-center justify-between border-b border-[#262626] bg-[#0a0a0a] px-4 py-3">
				<div>
					<Link
						href="/"
						className="text-xs text-[#888888] transition-colors hover:text-[#ededed]"
					>
						← Back to map
					</Link>
					<h1 className="mt-1 text-sm font-semibold text-[#ededed]">
						{event.title ?? event.place}
					</h1>
				</div>
			</header>

			<div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
				<div className="grid min-h-0 grid-rows-[minmax(240px,1fr)_auto]">
					<div className="relative min-h-[240px]">
						<EarthquakeMap
							events={[event]}
							selectedId={event.id}
							pulsingIds={[]}
							onSelect={() => {}}
							focusEvent={event}
						/>
					</div>
					<div className="border-t border-[#262626] p-4">
						<QuakeDetailPanel
							event={event}
							isFeatured={Boolean(featured)}
						/>
					</div>
				</div>
				<TweetFeedSidebar
					eventId={event.id}
					region={region}
					selectedLabel={featured?.label ?? event.place}
				/>
			</div>
		</div>
	)
}
