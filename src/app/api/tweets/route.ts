import {
	filterTrackedPosts,
	resolveTrackedPosts,
} from '@/lib/fxtwitter'
import type { TweetsResponse } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const eventId = searchParams.get('eventId')
	const region = searchParams.get('region')

	const configs = filterTrackedPosts({ eventId, region })
	const { tweets, errors } = await resolveTrackedPosts(configs)

	const body: TweetsResponse = {
		tweets,
		curated: true,
		generatedAt: new Date().toISOString(),
		...(errors.length > 0 ? { errors } : {}),
	}

	return Response.json(body, {
		headers: {
			'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
		},
	})
}
