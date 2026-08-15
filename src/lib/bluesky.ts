/**
 * Live post search via Bluesky's public AT Protocol API.
 *
 * Why Bluesky and not X: X requires an authenticated (paid) key for keyword
 * search. FxTwitter can resolve a post whose URL you already have, but its
 * /2/search returns an empty result set and it exposes no user timeline. So X
 * stays hand-curated, and the live half of the feed comes from Bluesky, whose
 * search is public, unauthenticated, and free.
 *
 * Use api.bsky.app — public.api.bsky.app returns 403 on searchPosts.
 */
import type { CuratedTweet, TweetMedia } from '@/lib/types'

const BSKY_BASE = 'https://api.bsky.app/xrpc'
const SEARCH_LIMIT = 25
export const LIVE_CACHE_SECONDS = 60

/** A five-language global sweep returns ~100 posts. Rendering all of them with
 * media is more than the sidebar needs, so keep the newest slice. */
export const MAX_LIVE_POSTS = 60

/** Multilingual global sweep. More languages means more genuinely new posts per
 * refresh, which is the point — a single English query goes stale quickly. */
export const GLOBAL_QUERIES = [
	'earthquake',
	'terremoto',
	'sismo',
	'deprem',
	'地震',
]

/** Terms that mark a post as actually about seismic activity. Search returns
 * plenty of metaphorical "earthquake" posts, so this is the main noise filter. */
const QUAKE_TERMS = [
	'earthquake',
	'quake',
	'seismic',
	'magnitude',
	'aftershock',
	'foreshock',
	'epicenter',
	'epicentre',
	'tsunami',
	'terremoto',
	'sismo',
	'temblor',
	'séisme',
	'seisme',
	'erdbeben',
	'deprem',
	'地震',
	'지진',
]

/** US state codes that show up in USGS place strings often enough to be worth
 * expanding — "CA earthquake" is a useless query, "California earthquake" is not. */
const US_STATES: Record<string, string> = {
	AK: 'Alaska',
	CA: 'California',
	HI: 'Hawaii',
	ID: 'Idaho',
	MT: 'Montana',
	NV: 'Nevada',
	OK: 'Oklahoma',
	OR: 'Oregon',
	TX: 'Texas',
	UT: 'Utah',
	WA: 'Washington',
	WY: 'Wyoming',
	PR: 'Puerto Rico',
}

export interface BlueskyAuthor {
	did: string
	handle: string
	displayName?: string
	avatar?: string
}

export interface BlueskyPost {
	uri: string
	cid: string
	author: BlueskyAuthor
	record: { text?: string; createdAt?: string }
	embed?: {
		$type?: string
		images?: { thumb?: string; fullsize?: string; alt?: string }[]
		external?: { thumb?: string; title?: string }
	}
	replyCount?: number
	repostCount?: number
	likeCount?: number
	quoteCount?: number
	indexedAt?: string
}

interface SearchResponse {
	posts?: BlueskyPost[]
	cursor?: string
}

/**
 * Turn a USGS place string into a searchable region.
 * "68 km NNW of Ende, Indonesia" -> "Indonesia"
 * "3 km SSE of Devore, CA"       -> "California"
 */
export function regionFromPlace(place: string | null | undefined): string | null {
	if (!place) return null

	const parts = place
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean)
	if (parts.length === 0) return null

	const tail = parts[parts.length - 1]
	const expanded = US_STATES[tail.toUpperCase()]
	if (expanded) return expanded

	// No comma at all: strip the "68 km NNW of " distance prefix if present.
	if (parts.length === 1) {
		const stripped = tail.replace(/^\d+\s*km\s+[A-Z]{1,3}\s+of\s+/i, '').trim()
		return stripped || null
	}

	return tail
}

/** Queries for the live half of the feed. Scoped to a place when one is
 * selected, otherwise a multilingual global sweep. */
export function buildQueries(place?: string | null): string[] {
	const region = regionFromPlace(place)
	if (!region) return GLOBAL_QUERIES
	return [`${region} earthquake`, `${region} sismo`]
}

export function mentionsQuake(text: string): boolean {
	const lower = text.toLowerCase()
	return QUAKE_TERMS.some((term) => lower.includes(term))
}

/** Text with URLs and handles removed, to judge whether a post says anything. */
export function strippedLength(text: string): number {
	return text
		.replace(/https?:\/\/\S+/g, '')
		.replace(/@[\w.]+/g, '')
		.replace(/#/g, '')
		.trim().length
}

/** Drop link-dumps, one-word replies, and posts only metaphorically about quakes. */
export function isUsefulPost(post: BlueskyPost): boolean {
	const text = post.record?.text ?? ''
	if (!text) return false
	if (strippedLength(text) < 15) return false
	return mentionsQuake(text)
}

/** at://did:plc:xxx/app.bsky.feed.post/RKEY -> https://bsky.app/profile/<handle>/post/RKEY */
export function postWebUrl(post: BlueskyPost): string {
	const rkey = post.uri.split('/').pop() ?? ''
	return `https://bsky.app/profile/${post.author.handle}/post/${rkey}`
}

function normalizeMedia(post: BlueskyPost): TweetMedia[] {
	const images = post.embed?.images ?? []
	const media: TweetMedia[] = []

	for (const image of images) {
		const url = image.thumb ?? image.fullsize
		if (!url) continue
		media.push({ type: 'photo', url, alt: image.alt })
	}

	return media
}

export function normalizeBlueskyPost(post: BlueskyPost): CuratedTweet {
	const handle = post.author.handle

	return {
		id: post.uri,
		url: postWebUrl(post),
		text: post.record?.text ?? '',
		authorName: post.author.displayName?.trim() || handle,
		authorHandle: handle,
		authorAvatar: post.author.avatar,
		createdAt: new Date(
			post.record?.createdAt ?? post.indexedAt ?? Date.now(),
		).toISOString(),
		likes: post.likeCount ?? 0,
		reposts: post.repostCount ?? 0,
		replies: post.replyCount ?? 0,
		views: null,
		media: normalizeMedia(post),
		category: 'commentary',
		label: 'Live · Bluesky',
		source: 'bluesky',
		profileUrl: `https://bsky.app/profile/${handle}`,
		live: true,
	}
}

/** Same post can surface under several language queries; also collapses bots
 * that post near-identical text repeatedly. */
export function dedupePosts(tweets: CuratedTweet[]): CuratedTweet[] {
	const seenIds = new Set<string>()
	const seenText = new Set<string>()
	const out: CuratedTweet[] = []

	for (const tweet of tweets) {
		const textKey = tweet.text.toLowerCase().replace(/\s+/g, ' ').slice(0, 80)
		if (seenIds.has(tweet.id) || seenText.has(textKey)) continue
		seenIds.add(tweet.id)
		seenText.add(textKey)
		out.push(tweet)
	}

	return out
}

export async function searchPosts(query: string): Promise<BlueskyPost[]> {
	const url = new URL(`${BSKY_BASE}/app.bsky.feed.searchPosts`)
	url.searchParams.set('q', query)
	url.searchParams.set('limit', String(SEARCH_LIMIT))
	url.searchParams.set('sort', 'latest')

	const response = await fetch(url, {
		headers: { Accept: 'application/json' },
		next: { revalidate: LIVE_CACHE_SECONDS },
	})

	if (!response.ok) return []

	const data = (await response.json()) as SearchResponse
	return data.posts ?? []
}

/**
 * Live posts for the feed. Queries run concurrently and a failing query yields
 * nothing rather than sinking the request — a partial live feed beats none.
 */
export async function fetchLivePosts(
	place?: string | null,
): Promise<{ tweets: CuratedTweet[]; queries: string[]; errors: string[] }> {
	const queries = buildQueries(place)
	const errors: string[] = []

	const results = await Promise.all(
		queries.map(async (query) => {
			try {
				return await searchPosts(query)
			} catch {
				errors.push(`Bluesky search failed: ${query}`)
				return [] as BlueskyPost[]
			}
		}),
	)

	const tweets = dedupePosts(
		results
			.flat()
			.filter(isUsefulPost)
			.map(normalizeBlueskyPost),
	)
		.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		)
		.slice(0, MAX_LIVE_POSTS)

	return { tweets, queries, errors }
}
