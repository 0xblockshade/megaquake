export type QuakeSource = 'usgs' | 'emsc'

export type MagnitudeFilter = 'all' | '4.5' | '7.0'

export type TimeRange = '24h' | '7d' | '30d'

export interface QuakeEvent {
	id: string
	mag: number
	place: string
	time: string
	lat: number
	lon: number
	depthKm: number
	tsunami: boolean
	url: string
	source: QuakeSource
	title?: string
	alert?: string | null
	status?: string
}

export interface QuakeStats {
	today: number
	thisWeek: number
	strongestMag: number | null
	strongestPlace: string | null
	m7PlusThisYear: number
}

export interface QuakesResponse {
	events: QuakeEvent[]
	stats: QuakeStats
	generatedAt: string
	filters: {
		magnitude: MagnitudeFilter
		timeRange: TimeRange
	}
	featuredIds: string[]
}

export interface QuakesErrorResponse {
	error: string
	code: 'INVALID_PARAMS' | 'UPSTREAM_ERROR'
}

export type TweetCategory = 'official' | 'on-the-ground' | 'commentary'

export interface TrackedPostConfig {
	eventId?: string
	region?: string
	url: string
	category: TweetCategory
	label: string
	disclaimer?: string
}

export interface TweetMedia {
	type: 'photo' | 'video' | 'gif'
	url: string
	alt?: string
}

export interface CuratedTweet {
	id: string
	url: string
	text: string
	authorName: string
	authorHandle: string
	authorAvatar?: string
	createdAt: string
	likes: number
	reposts: number
	replies: number
	views?: number | null
	media: TweetMedia[]
	category: TweetCategory
	label: string
	disclaimer?: string
}

export interface TweetsResponse {
	tweets: CuratedTweet[]
	curated: true
	generatedAt: string
	errors?: string[]
}

export interface FeaturedEvent {
	id: string
	label: string
	region: string
}

export interface QuakeQueryParams {
	magnitude: MagnitudeFilter
	timeRange: TimeRange
}
