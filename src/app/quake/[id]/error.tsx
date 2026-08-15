'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function QuakeDetailError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<div className="flex h-full flex-col items-center justify-center gap-4 bg-[#000000] px-4 text-center">
			<h1 className="text-lg font-medium text-[#ededed]">
				Unable to load earthquake details
			</h1>
			<p className="max-w-md text-sm text-[#888888]">
				The event page could not be loaded. The earthquake may no
				longer be available from USGS.
			</p>
			<div className="flex gap-2">
				<button
					type="button"
					onClick={reset}
					className="rounded-md border border-[#262626] px-4 py-2 text-sm text-[#ededed] hover:border-[#404040]"
				>
					Try again
				</button>
				<Link
					href="/"
					className="rounded-md border border-[#262626] px-4 py-2 text-sm text-[#ededed] hover:border-[#404040]"
				>
					Back to map
				</Link>
			</div>
		</div>
	)
}
