'use client'

import { formatRelativeTime } from '@/lib/format'
import type { CuratedTweet } from '@/lib/types'

interface TweetCardProps {
	tweet: CuratedTweet
}

function formatCount(value: number): string {
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
	if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
	return String(value)
}

export function TweetCard({ tweet }: TweetCardProps) {
	return (
		<article className="rounded-md border border-[#262626] bg-[#111111] p-3">
			<div className="mb-2 flex items-start gap-2">
				{tweet.authorAvatar ? (
					// eslint-disable-next-line @next/next/no-img-element -- external avatar URLs
					<img
						src={tweet.authorAvatar}
						alt=""
						className="h-8 w-8 rounded-full border border-[#262626]"
					/>
				) : (
					<div
						className="flex h-8 w-8 items-center justify-center rounded-full border border-[#262626] bg-[#0a0a0a] text-xs text-[#888888]"
						aria-hidden="true"
					>
						@
					</div>
				)}
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
						<a
							href={tweet.profileUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="truncate text-sm font-medium text-[#ededed] hover:underline"
						>
							{tweet.authorName}
						</a>
						<a
							href={tweet.profileUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="font-mono text-xs text-[#888888] hover:underline"
						>
							@{tweet.authorHandle}
						</a>
					</div>
					<div className="flex flex-wrap items-center gap-x-2">
						<span
							className={
								tweet.source === 'x'
									? 'rounded-sm border border-[#404040] px-1 text-[9px] font-medium uppercase tracking-wider text-[#ededed]'
									: 'rounded-sm border border-[#1d4ed8] px-1 text-[9px] font-medium uppercase tracking-wider text-[#60a5fa]'
							}
						>
							{tweet.source === 'x' ? 'X' : 'Bluesky'}
						</span>
						<p className="text-[10px] uppercase tracking-wider text-[#888888]">
							{tweet.label}
						</p>
					</div>
				</div>
				<a
					href={tweet.url}
					target="_blank"
					rel="noopener noreferrer"
					className="shrink-0 font-mono text-[10px] text-[#888888] hover:text-[#ededed]"
				>
					{formatRelativeTime(tweet.createdAt)}
				</a>
			</div>

			<p className="whitespace-pre-wrap text-sm leading-relaxed text-[#ededed]">
				{tweet.text}
			</p>

			{tweet.media.length > 0 ? (
				<div className="mt-3 grid gap-2">
					{tweet.media.map((item) => (
						// eslint-disable-next-line @next/next/no-img-element -- external media URLs
						<img
							key={item.url}
							src={item.url}
							alt={item.alt ?? 'Post media'}
							className="max-h-48 w-full rounded-md border border-[#262626] object-cover"
						/>
					))}
				</div>
			) : null}

			{tweet.disclaimer ? (
				<p className="mt-2 rounded border border-[#262626] bg-[#0a0a0a] px-2 py-1 text-[11px] text-[#888888]">
					{tweet.disclaimer}
				</p>
			) : null}

			{tweet.category === 'commentary' ? (
				<p className="mt-2 text-[11px] text-[#888888]">
					Unverified social commentary — not a validated forecast.
				</p>
			) : null}

			<div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] text-[#888888]">
				<span>{formatCount(tweet.replies)} replies</span>
				<span>{formatCount(tweet.reposts)} reposts</span>
				<span>{formatCount(tweet.likes)} likes</span>
				{tweet.views != null ? (
					<span>{formatCount(tweet.views)} views</span>
				) : null}
			</div>
		</article>
	)
}
