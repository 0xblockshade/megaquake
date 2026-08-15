'use client'

import { useEffect, useRef, useState } from 'react'
import {
	Map as MapLibreMap,
	NavigationControl,
	setWorkerUrl,
	type GeoJSONSource,
	type MapLayerMouseEvent,
	type StyleSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
	CORE_HOVER_FACTOR,
	RING_HOVER_FACTOR,
	RING_STROKE_OPACITY,
	zoomScaledRadius,
} from '@/lib/map-style'
import {
	getAgeHours,
	getDepthRingOpacity,
	getMagnitudeColor,
	getMagnitudeCoreColor,
	getMagnitudeRadius,
	getRecencyOpacity,
} from '@/lib/magnitude'
import { spreadMapCoordinates } from '@/lib/spread-coordinates'
import type { QuakeEvent } from '@/lib/types'

const SOURCE_ID = 'quakes'
const HALO_LAYER_ID = 'quake-halo'
const RING_LAYER_ID = 'quake-ring'
const PULSE_LAYER_ID = 'quake-pulse'
const CORE_LAYER_ID = 'quake-core'
const SPARK_LAYER_ID = 'quake-spark'
const HIT_LAYERS = [CORE_LAYER_ID, RING_LAYER_ID, HALO_LAYER_ID]
const WORKER_URL = '/maplibre/maplibre-gl-worker.mjs'

if (typeof window !== 'undefined') {
	setWorkerUrl(WORKER_URL)
}

const DARK_STYLE: StyleSpecification = {
	version: 8,
	sources: {
		basemap: {
			type: 'raster',
			tiles: [
				'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
				'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
				'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
			],
			tileSize: 256,
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a> · <a href="https://earthquake.usgs.gov/">USGS</a> · <a href="https://www.emsc-csem.org/">EMSC</a> · <a href="https://www.igp.gob.pe/">IGP</a>',
		},
	},
	layers: [
		{
			id: 'basemap',
			type: 'raster',
			source: 'basemap',
		},
	],
}

interface EarthquakeMapProps {
	events: QuakeEvent[]
	selectedId: string | null
	pulsingIds: string[]
	onSelect: (event: QuakeEvent) => void
	focusEvent?: QuakeEvent | null
}

function buildGeoJson(
	events: QuakeEvent[],
	pulsingIds: string[],
): GeoJSON.FeatureCollection {
	const spread = spreadMapCoordinates(events)

	return {
		type: 'FeatureCollection',
		features: [...events]
			.sort((a, b) => a.mag - b.mag)
			.map((event) => {
				const point = spread.get(event.id) ?? event
				return {
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: [point.lon, point.lat],
					},
					properties: {
						id: event.id,
						mag: event.mag,
						place: event.place,
						color: getMagnitudeColor(event.mag),
						coreColor: getMagnitudeCoreColor(event.mag),
						radius: getMagnitudeRadius(event.mag),
						isPulsing: pulsingIds.includes(event.id)
							? 1
							: 0,
						isMajor: event.mag >= 7 ? 1 : 0,
						depthKm: event.depthKm,
						depthOpacity: getDepthRingOpacity(
							event.depthKm,
						),
						recency: getRecencyOpacity(
							getAgeHours(event.time),
						),
					},
				}
			}),
	}
}

function addQuakeLayers(map: MapLibreMap) {
	if (map.getSource(SOURCE_ID)) return

	map.addSource(SOURCE_ID, {
		type: 'geojson',
		promoteId: 'id',
		data: buildGeoJson([], []),
	})

	map.addLayer({
		id: HALO_LAYER_ID,
		type: 'circle',
		source: SOURCE_ID,
		layout: {
			'circle-sort-key': ['to-number', ['get', 'mag']],
		},
		paint: {
			'circle-radius': [
				'interpolate',
				['linear'],
				['to-number', ['get', 'mag']],
				2, 10,
				3, 12,
				4, 14,
				5, 18,
				6, 24,
				7, 32,
				8, 44,
			],
			'circle-color': ['get', 'color'],
			'circle-opacity': [
				'interpolate',
				['linear'],
				['to-number', ['get', 'mag']],
				3, 0.16,
				4, 0.14,
				6, 0.18,
				7, 0.28,
			],
			'circle-blur': 0.85,
			'circle-pitch-alignment': 'map',
			'circle-opacity-transition': { duration: 1200, delay: 0 },
		},
	})

	map.addLayer({
		id: PULSE_LAYER_ID,
		type: 'circle',
		source: SOURCE_ID,
		filter: ['==', ['get', 'isPulsing'], 1],
		paint: {
			'circle-radius': [
				'+',
				['to-number', ['get', 'radius']],
				14,
			],
			'circle-color': ['get', 'color'],
			'circle-opacity': 0.16,
			'circle-stroke-width': 1.5,
			'circle-stroke-color': ['get', 'color'],
			'circle-stroke-opacity': 0.7,
			'circle-blur': 0.15,
			'circle-pitch-alignment': 'map',
		},
	})

	map.addLayer({
		id: RING_LAYER_ID,
		type: 'circle',
		source: SOURCE_ID,
		layout: {
			'circle-sort-key': ['to-number', ['get', 'mag']],
		},
		paint: {
			'circle-radius': zoomScaledRadius(RING_HOVER_FACTOR),
			'circle-color': ['get', 'color'],
			'circle-opacity': 0.08,
			'circle-stroke-width': [
				'interpolate',
				['linear'],
				['to-number', ['get', 'mag']],
				4, 1,
				6, 1.4,
				7, 1.8,
			],
			'circle-stroke-color': ['get', 'color'],
			'circle-stroke-opacity': RING_STROKE_OPACITY,
			'circle-pitch-alignment': 'map',
		},
	})

	map.addLayer({
		id: CORE_LAYER_ID,
		type: 'circle',
		source: SOURCE_ID,
		layout: {
			'circle-sort-key': ['to-number', ['get', 'mag']],
		},
		paint: {
			'circle-radius': zoomScaledRadius(CORE_HOVER_FACTOR),
			'circle-color': ['get', 'color'],
			'circle-opacity': 0.92,
			'circle-stroke-width': [
				'case',
				['boolean', ['feature-state', 'selected'], false],
				2,
				0.75,
			],
			'circle-stroke-color': [
				'case',
				['boolean', ['feature-state', 'selected'], false],
				'#ededed',
				['get', 'coreColor'],
			],
			'circle-stroke-opacity': 0.95,
			'circle-pitch-alignment': 'map',
			'circle-radius-transition': { duration: 180, delay: 0 },
		},
	})

	map.addLayer({
		id: SPARK_LAYER_ID,
		type: 'circle',
		source: SOURCE_ID,
		filter: ['>=', ['to-number', ['get', 'mag']], 6],
		layout: {
			'circle-sort-key': ['+', ['to-number', ['get', 'mag']], 10],
		},
		paint: {
			'circle-radius': [
				'interpolate',
				['linear'],
				['to-number', ['get', 'mag']],
				6, 1.8,
				7, 2.6,
				8, 3.2,
			],
			'circle-color': ['get', 'coreColor'],
			'circle-opacity': 0.95,
			'circle-pitch-alignment': 'map',
		},
	})
}

function syncQuakes(
	map: MapLibreMap,
	events: QuakeEvent[],
	pulsingIds: string[],
) {
	addQuakeLayers(map)
	const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
	source?.setData(buildGeoJson(events, pulsingIds))
}

export function EarthquakeMap({
	events,
	selectedId,
	pulsingIds,
	onSelect,
	focusEvent,
}: EarthquakeMapProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const mapRef = useRef<MapLibreMap | null>(null)
	const onSelectRef = useRef(onSelect)
	const eventsRef = useRef(events)
	const pulsingRef = useRef(pulsingIds)
	const selectedIdRef = useRef(selectedId)
	const hoveredIdRef = useRef<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		onSelectRef.current = onSelect
		eventsRef.current = events
		pulsingRef.current = pulsingIds
	}, [onSelect, events, pulsingIds])

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		let cancelled = false
		const map = new MapLibreMap({
			container,
			style: DARK_STYLE,
			center: [20, 10],
			zoom: 1.3,
			minZoom: 0.8,
			attributionControl: { compact: true },
		})

		map.addControl(new NavigationControl({ showCompass: false }), 'top-left')
		mapRef.current = map

		const handleReady = () => {
			if (cancelled) return
			syncQuakes(map, eventsRef.current, pulsingRef.current)
			map.resize()
		}

		const handleClick = (clickEvent: MapLayerMouseEvent) => {
			const feature = clickEvent.features?.[0]
			if (!feature) return

			const id = feature.properties?.id as string | undefined
			if (!id) return

			const quake = eventsRef.current.find((event) => event.id === id)
			if (quake) onSelectRef.current(quake)
		}

		map.once('styledata', handleReady)
		map.on('load', handleReady)

		for (const layerId of HIT_LAYERS) {
			map.on('click', layerId, handleClick)
			map.on('mouseenter', layerId, (event: MapLayerMouseEvent) => {
				map.getCanvas().style.cursor = 'pointer'
				const id = event.features?.[0]?.properties?.id as string | undefined
				if (!id || hoveredIdRef.current === id) return
				if (hoveredIdRef.current) {
					map.setFeatureState(
						{ source: SOURCE_ID, id: hoveredIdRef.current },
						{ hover: false },
					)
				}
				hoveredIdRef.current = id
				map.setFeatureState({ source: SOURCE_ID, id }, { hover: true })
			})
			map.on('mouseleave', layerId, () => {
				map.getCanvas().style.cursor = ''
				if (!hoveredIdRef.current) return
				map.setFeatureState(
					{ source: SOURCE_ID, id: hoveredIdRef.current },
					{ hover: false },
				)
				hoveredIdRef.current = null
			})
		}

		map.on('error', (event) => {
			if (cancelled) return
			console.error('MapLibre error', event.error)
			if (!map.isStyleLoaded()) {
				const message = event.error?.message
				if (message) setError(message)
			}
		})

		const observer = new ResizeObserver(() => {
			map.resize()
		})
		observer.observe(container)

		const prefersReducedMotion = window.matchMedia(
			'(prefers-reduced-motion: reduce)',
		).matches
		let pulseExpanded = false
		const pulseTimer = prefersReducedMotion
			? null
			: window.setInterval(() => {
					if (!map.getLayer(HALO_LAYER_ID)) return
					pulseExpanded = !pulseExpanded
					map.setPaintProperty(HALO_LAYER_ID, 'circle-opacity', [
						'interpolate',
						['linear'],
						['to-number', ['get', 'mag']],
						3, 0.14,
						4, 0.12,
						6, 0.16,
						7, pulseExpanded ? 0.38 : 0.22,
					])
				}, 1400)

		return () => {
			cancelled = true
			observer.disconnect()
			if (pulseTimer) window.clearInterval(pulseTimer)
			map.remove()
			mapRef.current = null
		}
	}, [])

	useEffect(() => {
		const map = mapRef.current
		if (!map?.isStyleLoaded()) return
		syncQuakes(map, events, pulsingIds)
	}, [events, pulsingIds])

	useEffect(() => {
		const map = mapRef.current
		if (!map?.isStyleLoaded() || !map.getSource(SOURCE_ID)) return

		const previousId = selectedIdRef.current
		if (previousId && previousId !== selectedId) {
			map.setFeatureState(
				{ source: SOURCE_ID, id: previousId },
				{ selected: false },
			)
		}
		if (selectedId) {
			map.setFeatureState(
				{ source: SOURCE_ID, id: selectedId },
				{ selected: true },
			)
		}
		selectedIdRef.current = selectedId
	}, [selectedId])

	useEffect(() => {
		const map = mapRef.current
		if (!map || !focusEvent) return

		map.flyTo({
			center: [focusEvent.lon, focusEvent.lat],
			zoom: Math.max(map.getZoom(), 4),
			duration: 800,
		})
	}, [focusEvent])

	return (
		<div className="absolute inset-0">
			<div
				ref={containerRef}
				className="earthquake-map h-full w-full"
				role="application"
				aria-label="Interactive world earthquake map"
			/>
			{error ? (
				<div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-[#ef4444]">
					Map tiles failed to load. Check your connection and refresh.
				</div>
			) : null}
		</div>
	)
}
