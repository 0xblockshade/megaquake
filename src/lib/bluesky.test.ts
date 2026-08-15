import { describe, expect, it } from 'vitest'
import {
	GLOBAL_QUERIES,
	buildQueries,
	dedupePosts,
	isUsefulPost,
	mentionsQuake,
	normalizeBlueskyPost,
	postWebUrl,
	regionFromPlace,
	strippedLength,
	type BlueskyPost,
} from '@/lib/bluesky'
import type { CuratedTweet } from '@/lib/types'

function makePost(overrides: Partial<BlueskyPost> = {}): BlueskyPost {
	return {
		uri: 'at://did:plc:abc123/app.bsky.feed.post/3kxyz',
		cid: 'cid1',
		author: {
			did: 'did:plc:abc123',
			handle: 'seismo.bsky.social',
			displayName: 'Seismo Watch',
			avatar: 'https://cdn.bsky.app/avatar.jpg',
		},
		record: {
			text: 'A magnitude 6.2 earthquake struck off the coast this morning.',
			createdAt: '2026-08-15T17:30:00.000Z',
		},
		likeCount: 4,
		repostCount: 2,
		replyCount: 1,
		...overrides,
	}
}

describe('regionFromPlace', () => {
	it('takes the country after the last comma', () => {
		expect(regionFromPlace('68 km NNW of Ende, Indonesia')).toBe('Indonesia')
	})

	it('expands US state codes into searchable names', () => {
		expect(regionFromPlace('3 km SSE of Devore, CA')).toBe('California')
		expect(regionFromPlace('90 km W of Anchorage, AK')).toBe('Alaska')
	})

	it('strips the distance prefix when there is no comma', () => {
		expect(regionFromPlace('120 km SW of Tonga')).toBe('Tonga')
	})

	it('returns null for empty input', () => {
		expect(regionFromPlace(null)).toBeNull()
		expect(regionFromPlace('')).toBeNull()
	})
})

describe('buildQueries', () => {
	it('sweeps globally when no place is selected', () => {
		expect(buildQueries(null)).toEqual(GLOBAL_QUERIES)
	})

	it('scopes to the region when a place is selected', () => {
		expect(buildQueries('68 km NNW of Ende, Indonesia')).toEqual([
			'Indonesia earthquake',
			'Indonesia sismo',
		])
	})
})

describe('mentionsQuake', () => {
	it('matches across languages', () => {
		expect(mentionsQuake('Fuerte sismo en Colombia')).toBe(true)
		expect(mentionsQuake('地震がありました')).toBe(true)
		expect(mentionsQuake('Big deprem in Istanbul')).toBe(true)
	})

	it('rejects unrelated text', () => {
		expect(mentionsQuake('what a great concert last night')).toBe(false)
	})
})

describe('strippedLength', () => {
	it('ignores URLs and handles', () => {
		expect(strippedLength('https://example.com/a/very/long/path')).toBe(0)
		expect(strippedLength('@someone.bsky.social')).toBe(0)
	})
})

describe('isUsefulPost', () => {
	it('keeps a substantive quake post', () => {
		expect(isUsefulPost(makePost())).toBe(true)
	})

	it('drops link-only posts', () => {
		expect(
			isUsefulPost(
				makePost({
					record: {
						text: 'https://youtu.be/abc123',
						createdAt: '2026-08-15T17:30:00.000Z',
					},
				}),
			),
		).toBe(false)
	})

	it('drops posts that only use earthquake metaphorically', () => {
		expect(
			isUsefulPost(
				makePost({
					record: {
						text: 'That transfer news was a total bombshell for the league',
						createdAt: '2026-08-15T17:30:00.000Z',
					},
				}),
			),
		).toBe(false)
	})

	it('drops posts too short to say anything', () => {
		expect(
			isUsefulPost(
				makePost({
					record: { text: 'quake', createdAt: '2026-08-15T17:30:00.000Z' },
				}),
			),
		).toBe(false)
	})
})

describe('postWebUrl', () => {
	it('builds a bsky.app permalink from the at:// uri', () => {
		expect(postWebUrl(makePost())).toBe(
			'https://bsky.app/profile/seismo.bsky.social/post/3kxyz',
		)
	})
})

describe('normalizeBlueskyPost', () => {
	it('maps a post onto the shared feed shape', () => {
		const tweet = normalizeBlueskyPost(makePost())

		expect(tweet.source).toBe('bluesky')
		expect(tweet.live).toBe(true)
		expect(tweet.authorName).toBe('Seismo Watch')
		expect(tweet.profileUrl).toBe(
			'https://bsky.app/profile/seismo.bsky.social',
		)
		expect(tweet.likes).toBe(4)
		expect(tweet.createdAt).toBe('2026-08-15T17:30:00.000Z')
	})

	it('falls back to the handle when there is no display name', () => {
		const tweet = normalizeBlueskyPost(
			makePost({
				author: { did: 'did:plc:x', handle: 'nodisplay.bsky.social' },
			}),
		)
		expect(tweet.authorName).toBe('nodisplay.bsky.social')
	})

	it('maps image embeds to media', () => {
		const tweet = normalizeBlueskyPost(
			makePost({
				embed: {
					images: [{ thumb: 'https://cdn/thumb.jpg', alt: 'damage' }],
				},
			}),
		)
		expect(tweet.media).toEqual([
			{ type: 'photo', url: 'https://cdn/thumb.jpg', alt: 'damage' },
		])
	})
})

describe('dedupePosts', () => {
	const base: CuratedTweet = {
		id: 'a',
		url: 'https://bsky.app/1',
		text: 'M6.2 earthquake reported near the coast',
		authorName: 'A',
		authorHandle: 'a.bsky.social',
		createdAt: '2026-08-15T17:30:00.000Z',
		likes: 0,
		reposts: 0,
		replies: 0,
		media: [],
		category: 'commentary',
		label: 'Live · Bluesky',
		source: 'bluesky',
		profileUrl: 'https://bsky.app/profile/a.bsky.social',
		live: true,
	}

	it('drops repeats of the same id', () => {
		expect(dedupePosts([base, { ...base }])).toHaveLength(1)
	})

	it('drops near-identical text from different ids', () => {
		expect(dedupePosts([base, { ...base, id: 'b' }])).toHaveLength(1)
	})

	it('keeps genuinely different posts', () => {
		const other = { ...base, id: 'c', text: 'Tsunami advisory issued for Japan' }
		expect(dedupePosts([base, other])).toHaveLength(2)
	})
})
