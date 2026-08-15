'use client'

import Link from 'next/link'
import {
	formatCoordinates,
	formatLocalTime,
	formatUtcTime,
} from '@/lib/format'
import { formatMagnitude, getMagnitudeColor } from '@/lib/magnitude'
import type { QuakeEvent } from '@/lib/types'

interface QuakeDetailPanelProps {
	event: QuakeEvent | null
	isFeatured?: boolean
}

export function QuakeDetailPanel({
	event,
	isFeatured = false,
}: QuakeDetailPanelProps) {
	if (!event) {
		return (
			<div className="rounded-md border border-[#262626] bg-[#111111] p-4">
				<p className="text-sm text-[#888888]">
					Select an earthquake on the map to view details and curated
					posts.
				</p>
			</div>
		)
	}

	const color = getMagnitudeColor(event.mag)

	return (
		<article className="rounded-md border border-[#262626] bg-[#111111] p-4">
			<div className="mb-3 flex items-start justify-between gap-3">
				<div>
					{isFeatured ? (
						<span className="mb-1 inline-block rounded border border-[#262626] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#888888]">
							Featured hotspot
						</span>
					) : null}
					<h2 className="text-base font-medium text-[#ededed]">
						{event.title ?? event.place}
					</h2>
				</div>
				<span
					className="font-mono text-2xl font-semibold"
					style={{ color }}
				>
					M{formatMagnitude(event.mag)}
				</span>
			</div>

			<dl className="grid grid-cols-2 gap-3 text-sm">
				<div>
					<dt className="text-[10px] uppercase tracking-wider text-[#888888]">
						Location
					</dt>
					<dd className="text-[#ededed]">{event.place}</dd>
				</div>
				<div>
					<dt className="text-[10px] uppercase tracking-wider text-[#888888]">
						Depth
					</dt>
					<dd className="font-mono text-[#ededed]">
						{event.depthKm.toFixed(1)} km
					</dd>
				</div>
				<div>
					<dt className="text-[10px] uppercase tracking-wider text-[#888888]">
						Coordinates
					</dt>
					<dd className="font-mono text-[#ededed]">
						{formatCoordinates(event.lat, event.lon)}
					</dd>
				</div>
				<div>
					<dt className="text-[10px] uppercase tracking-wider text-[#888888]">
						Tsunami
					</dt>
					<dd className="text-[#ededed]">
						{event.tsunami ? 'Possible' : 'None reported'}
					</dd>
				</div>
				<div className="col-span-2">
					<dt className="text-[10px] uppercase tracking-wider text-[#888888]">
						Time (local)
					</dt>
					<dd className="font-mono text-[#ededed]">
						{formatLocalTime(event.time)}
					</dd>
				</div>
				<div className="col-span-2">
					<dt className="text-[10px] uppercase tracking-wider text-[#888888]">
						Time (UTC)
					</dt>
					<dd className="font-mono text-[#ededed]">
						{formatUtcTime(event.time)}
					</dd>
				</div>
			</dl>

			<div className="mt-4 flex flex-wrap gap-2">
				<Link
					href={`/quake/${event.id}`}
					className="rounded-md border border-[#262626] px-3 py-1.5 text-xs text-[#ededed] transition-colors hover:border-[#404040] hover:bg-[#0a0a0a]"
				>
					Full details
				</Link>
				<a
					href={event.url}
					target="_blank"
					rel="noopener noreferrer"
					className="rounded-md border border-[#262626] px-3 py-1.5 text-xs text-[#ededed] transition-colors hover:border-[#404040] hover:bg-[#0a0a0a]"
				>
					USGS event page
				</a>
			</div>
		</article>
	)
}
