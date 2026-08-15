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

/** Matches the server's Cache-Control window, so a refresh can actually return
 * something new rather than re-reading the same cached payload. */
const REFRESH_MS = 60_000

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
	/** USGS place string for the selected quake — scopes the live Bluesky search. */
	place?: string | null
	mobileOnly?: boolean
	includeGlobal?: boolean
}

function buildQuery({
	eventId,
	region,
	place,
	includeGlobal,
}: Omit<TweetFeedProps, 'mobileOnly' | 'selectedLabel'>): string {
	const params = new URLSearchParams()

	// Curated posts are filtered by event/region; the live search is scoped by
	// place. When showing the global feed we still send place, so selecting a
	// quake narrows the live half without hiding the curated half.
	if (!includeGlobal && eventId) params.set('eventId', eventId)
	if (!includeGlobal && !eventId && region) params.set('region', region)
	if (place) params.set('place', place)

	const qs = params.toString()
	return qs ? `/api/tweets?${qs}` : '/api/tweets'
}

function FeedContent({
	eventId,
	region,
	selectedLabel,
	place,
	includeGlobal = false,
}: Omit<TweetFeedProps, 'mobileOnly'>) {
	const query = buildQuery({ eventId, region, place, includeGlobal })

	const { data, error, isLoading, isValidating } = useSWR(query, fetcher, {
		refreshInterval: REFRESH_MS,
		keepPreviousData: true,
	})

	const curatedTweets = data?.tweets.filter((tweet) => !tweet.live) ?? []
	const liveTweets = data?.tweets.filter((tweet) => tweet.live) ?? []

	const relatedTweets =
		includeGlobal && (eventId || region)
			? curatedTweets.filter((tweet) =>
					tweetMatchesSelection(tweet, eventId, region),
				)
			: []

	const remainingCurated = curatedTweets.filter(
		(tweet) => !relatedTweets.some((related) => related.id === tweet.id),
	)

	const hasRelated = relatedTweets.length > 0
	const isScoped = Boolean(eventId || region) && !includeGlobal

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<header className="shrink-0 border-b border-[#262626] px-4 py-3">
				<div className="flex items-center justify-between gap-2">
					<h2 className="text-sm font-medium text-[#ededed]">
						{isScoped ? 'Curated posts' : 'Global feed'}
					</h2>
					{liveTweets.length > 0 ? (
						<span className="flex items-center gap-1.5 font-mono text-[10px] text-[#888888]">
							<span
								className="h-1.5 w-1.5 rounded-full bg-[#22c55e]"
								aria-hidden="true"
							/>
							LIVE
						</span>
					) : null}
				</div>
				<p className="mt-1 text-xs text-[#888888]">
					{selectedLabel
						? `Curated posts for ${selectedLabel}, then live posts about it.`
						: 'Official X posts, then live posts from across Bluesky.'}
				</p>
				<p className="mt-1 text-[11px] text-[#888888]">
					Live posts are unverified public search results. Earthquakes
					cannot be reliably predicted.
				</p>
			</header>

			<div className="feed-scroll h-0 min-h-0 flex-1 p-3">
				{isLoading && !data ? (
					<p className="text-sm text-[#888888]">Loading posts…</p>
				) : null}

				{error ? (
					<p className="text-sm text-[#ef4444]">
						Unable to load posts right now.
					</p>
				) : null}

				{data && data.tweets.length === 0 ? (
					<p className="text-sm text-[#888888]">
						No posts found yet. The live feed refreshes every minute.
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

				{remainingCurated.length > 0 ? (
					<section className="mb-4 space-y-3">
						<h3 className="text-[10px] uppercase tracking-wider text-[#888888]">
							{hasRelated ? 'Other tracked posts' : 'Tracked posts'}
						</h3>
						{remainingCurated.map((tweet) => (
							<TweetCard key={tweet.id} tweet={tweet} />
						))}
					</section>
				) : null}

				{liveTweets.length > 0 ? (
					<section className="space-y-3">
						<h3 className="text-[10px] uppercase tracking-wider text-[#888888]">
							Live · {liveTweets.length} post
							{liveTweets.length === 1 ? '' : 's'}
						</h3>
						{liveTweets.map((tweet) => (
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
						Live feed
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
