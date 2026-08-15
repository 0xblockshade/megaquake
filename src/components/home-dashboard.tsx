'use client'

import featuredEvents from '@/config/featured-events.json'
import {
	QuakeDashboard,
	useSelectedQuakeRegion,
} from '@/components/quake-dashboard'
import {
	TweetFeedDrawer,
	TweetFeedSidebar,
} from '@/components/tweet-feed'
import type { QuakeEvent } from '@/lib/types'
import { useMemo, useState } from 'react'

export function HomeDashboard() {
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [selectedEvent, setSelectedEvent] = useState<QuakeEvent | null>(null)
	const region = useSelectedQuakeRegion(selectedId)

	const selectedLabel = useMemo(() => {
		if (selectedEvent) return selectedEvent.place
		if (!selectedId) return null
		const featured = featuredEvents.find((event) => event.id === selectedId)
		return featured?.label ?? null
	}, [selectedEvent, selectedId])

	const handleSelectionChange = (event: QuakeEvent | null) => {
		setSelectedId(event?.id ?? null)
		setSelectedEvent(event)
	}

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<div className="flex min-h-0 flex-1 overflow-hidden">
				<div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
					<QuakeDashboard onSelectionChange={handleSelectionChange} />
				</div>
				<TweetFeedSidebar
					eventId={selectedId}
					region={region}
					selectedLabel={selectedLabel}
					includeGlobal
				/>
			</div>
			<TweetFeedDrawer
				eventId={selectedId}
				region={region}
				selectedLabel={selectedLabel}
				includeGlobal
			/>
		</div>
	)
}
