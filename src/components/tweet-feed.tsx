'use client'

import { Drawer } from 'vaul'
import useSWR from 'swr'
import { TweetCard } from '@/components/tweet-card'
import type { CuratedTweet, TweetsResponse } from '@/lib/types'

const fetcher = (url: string) =>
	fetch(url).then((response) => {
		if (!response.ok) throw new Error('Failed to fetch tweets')
		return response.json() as Promise<TweetsResponse>
	})

function tweetMatchesSelection(
	tweet: CuratedTweet,
	eventId?: string | null,
	region?: string | null,
): boolean {
	if (eventId && tweet.eventId === eventId) return true
	if (region && tweet.region === region) return true
	return false
}

interface TweetFeedProps {
	eventId?: string | null
	region?: string | null
	selectedLabel?: string | null
	mobileOnly?: boolean
	includeGlobal?: boolean
}

function FeedContent({
	eventId,
	region,
	selectedLabel,
	includeGlobal = false,
}: Omit<TweetFeedProps, 'mobileOnly'>) {
	const query = includeGlobal
		? '/api/tweets'
		: eventId
			? `/api/tweets?eventId=${encodeURIComponent(eventId)}`
			: region
				? `/api/tweets?region=${encodeURIComponent(region)}`
				: '/api/tweets'

	const { data, error, isLoading, isValidating } = useSWR(
		query,
		fetcher,
		{ refreshInterval: 120_000 },
	)

	const relatedTweets =
		includeGlobal && (eventId || region)
			? (data?.tweets.filter((tweet) =>
					tweetMatchesSelection(tweet, eventId, region),
				) ?? [])
			: []

	const remainingTweets = includeGlobal
		? (data?.tweets.filter(
				(tweet) =>
					!relatedTweets.some((related) => related.id === tweet.id),
			) ?? [])
		: (data?.tweets ?? [])

	const hasRelated = relatedTweets.length > 0
	const isScoped = Boolean(eventId || region) && !includeGlobal

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<header className="shrink-0 border-b border-[#262626] px-4 py-3">
				<h2 className="text-sm font-medium text-[#ededed]">
					{isScoped ? 'Curated posts' : 'Global feed'}
				</h2>
				<p className="mt-1 text-xs text-[#888888]">
					{selectedLabel && hasRelated
						? `Showing tracked posts for ${selectedLabel}, then the rest of the curated feed.`
						: selectedLabel
							? `No posts are tracked for ${selectedLabel} yet. Showing the global curated feed.`
							: 'Official USGS posts tracked across current hotspots.'}
				</p>
				<p className="mt-1 text-[11px] text-[#888888]">
					This is a curated feed, not a live search. Earthquakes
					cannot be reliably predicted.
				</p>
			</header>

			<div className="feed-scroll h-0 min-h-0 flex-1 p-3">
				{isLoading && !data ? (
					<p className="text-sm text-[#888888]">Loading posts…</p>
				) : null}

				{error ? (
					<p className="text-sm text-[#ef4444]">
						Unable to load curated posts right now.
					</p>
				) : null}

				{data && data.tweets.length === 0 ? (
					<p className="text-sm text-[#888888]">
						No curated posts are configured yet.
					</p>
				) : null}

				{data?.errors && data.errors.length > 0 ? (
					<p className="mb-3 text-xs text-[#888888]">
						Some tracked posts could not be resolved.
					</p>
				) : null}

				{hasRelated ? (
					<section className="mb-4 space-y-3">
						<h3 className="text-[10px] uppercase tracking-wider text-[#888888]">
							This event
						</h3>
						{relatedTweets.map((tweet) => (
							<TweetCard key={tweet.id} tweet={tweet} />
						))}
					</section>
				) : null}

				{remainingTweets.length > 0 ? (
					<section className="space-y-3">
						{includeGlobal && hasRelated ? (
							<h3 className="text-[10px] uppercase tracking-wider text-[#888888]">
								All tracked posts
							</h3>
						) : null}
						{remainingTweets.map((tweet) => (
							<TweetCard key={tweet.id} tweet={tweet} />
						))}
					</section>
				) : null}

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
		<aside className="hidden h-full min-h-0 w-full shrink-0 overflow-hidden border-l border-[#262626] bg-[#0a0a0a] xl:flex xl:w-[360px] xl:flex-col">
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
						Curated feed
					</button>
				</Drawer.Trigger>
				<Drawer.Portal>
					<Drawer.Overlay className="fixed inset-0 z-40 bg-black/60" />
					<Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex h-[85vh] max-h-[85vh] flex-col overflow-hidden rounded-t-xl border border-[#262626] bg-[#0a0a0a] outline-none">
						<div className="mx-auto mt-3 h-1 w-12 shrink-0 rounded-full bg-[#262626]" />
						<div className="min-h-0 flex-1 overflow-hidden">
							<FeedContent {...props} />
						</div>
					</Drawer.Content>
				</Drawer.Portal>
			</Drawer.Root>
		</div>
	)
}
