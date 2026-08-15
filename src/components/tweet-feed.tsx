'use client'

import { Drawer } from 'vaul'
import useSWR from 'swr'
import { TweetCard } from '@/components/tweet-card'
import type { TweetsResponse } from '@/lib/types'

const fetcher = (url: string) =>
	fetch(url).then((response) => {
		if (!response.ok) throw new Error('Failed to fetch tweets')
		return response.json() as Promise<TweetsResponse>
	})

interface TweetFeedProps {
	eventId?: string | null
	region?: string | null
	selectedLabel?: string | null
	mobileOnly?: boolean
}

function FeedContent({
	eventId,
	region,
	selectedLabel,
}: Omit<TweetFeedProps, 'mobileOnly'>) {
	const query = eventId
		? `/api/tweets?eventId=${encodeURIComponent(eventId)}`
		: region
			? `/api/tweets?region=${encodeURIComponent(region)}`
			: null

	const { data, error, isLoading, isValidating } = useSWR(
		query,
		fetcher,
		{ refreshInterval: 120_000 },
	)

	return (
		<div className="flex h-full min-h-0 flex-col">
			<header className="border-b border-[#262626] px-4 py-3">
				<h2 className="text-sm font-medium text-[#ededed]">
					Curated posts
				</h2>
				<p className="mt-1 text-xs text-[#888888]">
					{selectedLabel
						? `Official and on-the-ground posts tracked for ${selectedLabel}.`
						: 'Select an earthquake to view tracked posts.'}
				</p>
				<p className="mt-1 text-[11px] text-[#888888]">
					This is a curated feed, not a live search. Earthquakes
					cannot be reliably predicted.
				</p>
			</header>

			<div className="min-h-0 flex-1 overflow-y-auto p-3">
				{!query ? (
					<p className="text-sm text-[#888888]">
						Select an earthquake marker to load related curated
						posts.
					</p>
				) : null}

				{query && isLoading && !data ? (
					<p className="text-sm text-[#888888]">Loading posts…</p>
				) : null}

				{query && error ? (
					<p className="text-sm text-[#ef4444]">
						Unable to load curated posts right now.
					</p>
				) : null}

				{query && data && data.tweets.length === 0 ? (
					<p className="text-sm text-[#888888]">
						No curated posts are configured for this event yet.
					</p>
				) : null}

				{data?.errors && data.errors.length > 0 ? (
					<p className="mb-3 text-xs text-[#888888]">
						Some tracked posts could not be resolved.
					</p>
				) : null}

				<div className="space-y-3">
					{data?.tweets.map((tweet) => (
						<TweetCard key={tweet.id} tweet={tweet} />
					))}
				</div>

				{isValidating && data ? (
					<p className="mt-3 text-center text-[10px] text-[#888888]">
						Refreshing…
					</p>
				) : null}
			</div>
		</div>
	)
}

export function TweetFeedSidebar(props: TweetFeedProps) {
	return (
		<aside className="hidden h-full min-h-0 w-[360px] shrink-0 flex-col border-l border-[#262626] bg-[#0a0a0a] xl:flex">
			<FeedContent {...props} />
		</aside>
	)
}

export function TweetFeedDrawer(props: TweetFeedProps) {
	return (
		<div className="xl:hidden">
			<Drawer.Root>
				<Drawer.Trigger asChild>
					<button
						type="button"
						className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-md border border-[#262626] bg-[#111111] px-4 py-2 text-sm text-[#ededed] shadow-none transition-colors hover:border-[#404040]"
					>
						Curated posts
					</button>
				</Drawer.Trigger>
				<Drawer.Portal>
					<Drawer.Overlay className="fixed inset-0 z-40 bg-black/60" />
					<Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-xl border border-[#262626] bg-[#0a0a0a] outline-none">
						<div className="mx-auto mt-3 h-1 w-12 rounded-full bg-[#262626]" />
						<div className="min-h-0 flex-1">
							<FeedContent {...props} />
						</div>
					</Drawer.Content>
				</Drawer.Portal>
			</Drawer.Root>
		</div>
	)
}
