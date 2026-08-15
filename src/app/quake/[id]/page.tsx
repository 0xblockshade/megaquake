import { notFound } from 'next/navigation'
import { QuakeDetailView } from '@/components/quake-detail-view'
import { fetchQuakeById } from '@/lib/quakes'

interface QuakeDetailPageProps {
	params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: QuakeDetailPageProps) {
	const { id } = await params
	const event = await fetchQuakeById(id)

	if (!event) {
		return { title: 'Earthquake not found — MegaQuake' }
	}

	return {
		title: `${event.title ?? event.place} — MegaQuake`,
		description: `M${event.mag.toFixed(1)} earthquake details, map, and curated posts.`,
	}
}

export default async function QuakeDetailPage({
	params,
}: QuakeDetailPageProps) {
	const { id } = await params
	const event = await fetchQuakeById(id)

	if (!event) notFound()

	return (
		<div className="h-dvh overflow-hidden">
			<QuakeDetailView event={event} />
		</div>
	)
}
