'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import featuredEvents from '@/config/featured-events.json'
import { FeaturedHotspots } from '@/components/featured-hotspots'
import { RecentPeru } from '@/components/recent-peru'
import { LiveStatus } from '@/components/live-status'
import { MagnitudeFilterControl } from '@/components/magnitude-filter'
import { QuakeDetailPanel } from '@/components/quake-detail-panel'
import { StatsBar } from '@/components/stats-bar'
import { TimeRangeFilterControl } from '@/components/time-range-filter'
import type {
	MagnitudeFilter,
	QuakeEvent,
	QuakesResponse,
	TimeRange,
} from '@/lib/types'

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

const fetcher = (url: string) =>
	fetch(url).then((response) => {
		if (!response.ok) throw new Error('Failed to fetch quakes')
		return response.json() as Promise<QuakesResponse>
	})

interface QuakeDashboardProps {
	initialMagnitude?: MagnitudeFilter
	initialTimeRange?: TimeRange
	initialSelectedId?: string | null
	showFeaturedList?: boolean
	onSelectionChange?: (event: QuakeEvent | null) => void
}

export function QuakeDashboard({
	// Not M7.0+: that is 1-3 events worldwide over a week, so the map opened
	// looking broken rather than quiet.
	initialMagnitude = '3.0',
	initialTimeRange = '7d',
	initialSelectedId = null,
	showFeaturedList = true,
	onSelectionChange,
}: QuakeDashboardProps) {
	const [magnitude, setMagnitude] =
		useState<MagnitudeFilter>(initialMagnitude)
	const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange)
	const [selectedId, setSelectedId] = useState<string | null>(
		initialSelectedId,
	)
	const [pulsingIds, setPulsingIds] = useState<string[]>([])
	const knownIdsRef = useRef<Set<string>>(new Set())
	const initializedRef = useRef(false)

	const query = `/api/quakes?magnitude=${magnitude}&timeRange=${timeRange}`

	const { data, error, isLoading, isValidating } = useSWR(query, fetcher, {
		// USGS republishes the summary feeds roughly once a minute and the 24h feed
		// is now revalidated server-side every 30s, so poll at the same rate.
		refreshInterval: 30_000,
		keepPreviousData: true,
	})

	const events = useMemo(() => data?.events ?? [], [data?.events])
	const selectedEvent = useMemo(
		() => events.find((event) => event.id === selectedId) ?? null,
		[events, selectedId],
	)

	useEffect(() => {
		if (!data) return

		const currentIds = new Set(data.events.map((event) => event.id))

		if (!initializedRef.current) {
			knownIdsRef.current = currentIds
			initializedRef.current = true
			return
		}

		const newIds = data.events
			.map((event) => event.id)
			.filter((id) => !knownIdsRef.current.has(id))

		if (newIds.length > 0) {
			setPulsingIds((prev) => [...new Set([...prev, ...newIds])])
			window.setTimeout(() => {
				setPulsingIds((prev) =>
					prev.filter((id) => !newIds.includes(id)),
				)
			}, 8_000)
		}

		knownIdsRef.current = currentIds
	}, [data])

	const handleSelect = useCallback(
		(event: QuakeEvent) => {
			setSelectedId(event.id)
			onSelectionChange?.(event)
		},
		[onSelectionChange],
	)

	const isFeatured = selectedId
		? (data?.featuredIds.includes(selectedId) ?? false)
		: false

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#262626] bg-[#0a0a0a] px-4 py-3">
				<div className="flex items-center gap-3">
					<h1 className="text-sm font-semibold tracking-tight text-[#ededed]">
						MegaQuake
					</h1>
					<LiveStatus
						lastUpdated={data?.generatedAt ?? null}
						isValidating={isValidating}
						error={Boolean(error)}
					/>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<MagnitudeFilterControl
						value={magnitude}
						onChange={setMagnitude}
					/>
					<TimeRangeFilterControl
						value={timeRange}
						onChange={setTimeRange}
					/>
				</div>
			</header>

			<StatsBar stats={data?.stats} isLoading={isLoading && !data} />

			<div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]">
				<div className="relative min-h-[50vh] overflow-hidden lg:min-h-0">
					<EarthquakeMap
						events={events}
						selectedId={selectedId}
						pulsingIds={pulsingIds}
						onSelect={handleSelect}
						focusEvent={selectedEvent}
					/>
				</div>

				<aside className="hidden min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain border-l border-[#262626] bg-[#0a0a0a] p-3 lg:flex">
					<RecentPeru
						events={events}
						selectedId={selectedId}
						onSelect={handleSelect}
					/>
					{showFeaturedList ? (
						<FeaturedHotspots
							events={events}
							featuredIds={data?.featuredIds ?? featuredEvents.map((e) => e.id)}
							selectedId={selectedId}
							onSelect={handleSelect}
						/>
					) : null}
					<QuakeDetailPanel
						event={selectedEvent}
						isFeatured={isFeatured}
					/>
				</aside>
			</div>
		</div>
	)
}

export function useSelectedQuakeRegion(selectedId: string | null) {
	return useMemo(() => {
		if (!selectedId) return null
		const featured = featuredEvents.find((event) => event.id === selectedId)
		return featured?.region ?? null
	}, [selectedId])
}
