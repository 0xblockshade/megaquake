import trackedPostsConfig from '@/config/tracked-posts.json'
import type {
	CuratedTweet,
	TrackedPostConfig,
	TweetMedia,
} from '@/lib/types'

const trackedPosts = trackedPostsConfig.posts as TrackedPostConfig[]

const FXTWITTER_BASE = 'https://api.fxtwitter.com'
const CACHE_SECONDS = 300
const STATUS_URL_PATTERN =
	/^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/i

interface FxTwitterAuthor {
	screen_name: string
	name: string
	avatar_url?: string
}

interface FxTwitterMediaItem {
	type?: string
	url?: string
	thumbnail_url?: string
}

interface FxTwitterStatus {
	id: string
	url: string
	text: string
	created_at: string
	likes?: number
	reposts?: number
	replies?: number
	views?: number | null
	author?: FxTwitterAuthor
	media?: {
		photos?: FxTwitterMediaItem[]
		videos?: FxTwitterMediaItem[]
		all?: FxTwitterMediaItem[]
	}
}

interface FxTwitterResponse {
	code: number
	status?: FxTwitterStatus
	message?: string
}

export function extractTweetId(url: string): string | null {
	const match = url.match(STATUS_URL_PATTERN)
	return match?.[1] ?? null
}

export function getTrackedPosts(): TrackedPostConfig[] {
	return trackedPosts
}

export function filterTrackedPosts(options: {
	eventId?: string | null
	region?: string | null
}): TrackedPostConfig[] {
	const posts = getTrackedPosts()

	return posts.filter((post) => {
		if (options.eventId && post.eventId === options.eventId) return true
		if (options.region && post.region === options.region) return true
		return !options.eventId && !options.region
	})
}

function normalizeMedia(status: FxTwitterStatus): TweetMedia[] {
	const media: TweetMedia[] = []
	const photos = status.media?.photos ?? []
	const videos = status.media?.videos ?? []

	for (const photo of photos) {
		if (!photo.url) continue
		media.push({ type: 'photo', url: photo.url })
	}

	for (const video of videos) {
		const url = video.thumbnail_url ?? video.url
		if (!url) continue
		media.push({ type: 'video', url })
	}

	return media
}

export function normalizeFxTwitterStatus(
	status: FxTwitterStatus,
	config: TrackedPostConfig,
): CuratedTweet {
	const author = status.author

	return {
		id: status.id,
		url: status.url,
		text: status.text,
		authorName: author?.name ?? 'Unknown author',
		authorHandle: author?.screen_name ?? 'unknown',
		authorAvatar: author?.avatar_url,
		createdAt: new Date(status.created_at).toISOString(),
		likes: status.likes ?? 0,
		reposts: status.reposts ?? 0,
		replies: status.replies ?? 0,
		views: status.views ?? null,
		media: normalizeMedia(status),
		category: config.category,
		label: config.label,
		disclaimer: config.disclaimer,
		eventId: config.eventId,
		region: config.region,
	}
}

export async function fetchTweetById(
	id: string,
): Promise<FxTwitterStatus | null> {
	const response = await fetch(`${FXTWITTER_BASE}/2/status/${id}`, {
		next: { revalidate: CACHE_SECONDS },
	})

	if (!response.ok) return null

	const data = (await response.json()) as FxTwitterResponse
	if (data.code !== 200 || !data.status) return null
	return data.status
}

export async function resolveTrackedPost(
	config: TrackedPostConfig,
): Promise<{ tweet: CuratedTweet | null; error?: string }> {
	const id = extractTweetId(config.url)
	if (!id) {
		return { tweet: null, error: `Invalid tweet URL: ${config.url}` }
	}

	try {
		const status = await fetchTweetById(id)
		if (!status) {
			return { tweet: null, error: `Tweet unavailable: ${config.url}` }
		}

		return { tweet: normalizeFxTwitterStatus(status, config) }
	} catch {
		return { tweet: null, error: `Failed to resolve tweet: ${config.url}` }
	}
}

export async function resolveTrackedPosts(
	configs: TrackedPostConfig[],
): Promise<{ tweets: CuratedTweet[]; errors: string[] }> {
	const results = await Promise.all(configs.map(resolveTrackedPost))
	const tweets: CuratedTweet[] = []
	const errors: string[] = []

	for (const result of results) {
		if (result.tweet) tweets.push(result.tweet)
		if (result.error) errors.push(result.error)
	}

	tweets.sort(
		(a, b) =>
			new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	)

	return { tweets, errors }
}
