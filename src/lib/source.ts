import type { QuakeSource } from '@/lib/types'

export function getSourceLabel(source: QuakeSource): string {
	switch (source) {
		case 'usgs':
			return 'USGS'
		case 'emsc':
			return 'EMSC'
		case 'igp':
			return 'IGP Peru'
		default: {
			const exhaustive: never = source
			return exhaustive
		}
	}
}

export function getSourcePageLabel(source: QuakeSource): string {
	switch (source) {
		case 'usgs':
			return 'USGS event page'
		case 'emsc':
			return 'EMSC event page'
		case 'igp':
			return 'IGP report'
		default: {
			const exhaustive: never = source
			return exhaustive
		}
	}
}
