import { fetchLivePosts } from '@/lib/bluesky'
import { filterTrackedPosts, resolveTrackedPosts } from '@/lib/fxtwitter'
import type { TweetsResponse } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * The social feed: hand-curated X posts plus live Bluesky search results.
 *
 * The two halves are fetched concurrently and merged. Curated X posts keep their
 * order at the top — official USGS posts outrank a stranger's reaction — and the
 * live half follows, newest first. `place` scopes the live search to a specific
 * quake; without it the search sweeps globally in five languages.
 */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const eventId = searchParams.get('eventId')
	const region = searchParams.get('region')
	const place = searchParams.get('place')

	const configs = filterTrackedPosts({ eventId, region })

	const [curated, live] = await Promise.all([
		resolveTrackedPosts(configs),
		fetchLivePosts(place ?? region),
	])

	const errors = [...curated.errors, ...live.errors]

	const body: TweetsResponse = {
		tweets: [...curated.tweets, ...live.tweets],
		curated: true,
		generatedAt: new Date().toISOString(),
		counts: { x: curated.tweets.length, bluesky: live.tweets.length },
		queries: live.queries,
		...(errors.length > 0 ? { errors } : {}),
	}

	return Response.json(body, {
		headers: {
			// Short window: the live half is the point, so staleness is the enemy.
			'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
		},
	})
}
