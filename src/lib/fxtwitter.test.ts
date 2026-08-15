import { describe, expect, it } from 'vitest'
import {
	extractTweetId,
	filterTrackedPosts,
	normalizeFxTwitterStatus,
} from '@/lib/fxtwitter'
import type { TrackedPostConfig } from '@/lib/types'

describe('fxtwitter', () => {
	it('extracts tweet id from x.com URLs', () => {
		expect(
			extractTweetId('https://x.com/USGS_Quakes/status/2088390971364917312'),
		).toBe('2088390971364917312')
	})

	it('extracts tweet id from twitter.com URLs', () => {
		expect(
			extractTweetId(
				'https://twitter.com/USGS_Quakes/status/2088390971364917312',
			),
		).toBe('2088390971364917312')
	})

	it('returns null for invalid URLs', () => {
		expect(extractTweetId('https://example.com')).toBeNull()
	})

	it('normalizes FxTwitter status payloads', () => {
		const config: TrackedPostConfig = {
			url: 'https://x.com/USGS_Quakes/status/20',
			category: 'official',
			label: 'USGS test',
		}

		const tweet = normalizeFxTwitterStatus(
			{
				id: '20',
				url: 'https://x.com/jack/status/20',
				text: 'just setting up my twttr',
				created_at: 'Tue Mar 21 20:50:14 +0000 2006',
				likes: 1,
				reposts: 2,
				replies: 3,
				author: {
					screen_name: 'jack',
					name: 'jack',
					avatar_url: 'https://example.com/avatar.jpg',
				},
			},
			config,
		)

		expect(tweet.authorHandle).toBe('jack')
		expect(tweet.text).toBe('just setting up my twttr')
		expect(tweet.category).toBe('official')
		expect(tweet.eventId).toBeUndefined()
	})

	it('filters tracked posts by event id', () => {
		const posts = filterTrackedPosts({ eventId: 'us6000tkt2' })
		expect(posts.every((post) => post.eventId === 'us6000tkt2')).toBe(true)
		expect(posts.length).toBeGreaterThan(0)
	})

	it('returns the full curated list for the global feed', () => {
		const posts = filterTrackedPosts({})
		expect(posts.length).toBeGreaterThan(1)
	})
})
