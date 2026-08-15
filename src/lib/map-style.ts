/**
 * MapLibre paint expressions for the quake layers.
 *
 * Kept out of the map component so they can be validated against the style spec
 * in tests. Expression mistakes otherwise surface only as a runtime console
 * error after the map tries to add the layer.
 */
import type { ExpressionSpecification } from 'maplibre-gl'

/** Radius from magnitude alone, before zoom scaling. */
export const MAG_RADIUS_BASE: ExpressionSpecification = [
	'interpolate',
	['linear'],
	['to-number', ['get', 'mag']],
	2,
	5,
	3,
	5.5,
	4,
	6.5,
	5,
	6.5,
	6,
	9,
	7,
	13,
	8,
	18,
]

/** Scale factor applied to the magnitude radius at each zoom level. */
export const ZOOM_SCALE: readonly (readonly [number, number])[] = [
	[1, 0.55],
	[4, 0.85],
	[7, 1],
	[11, 1.7],
]

/**
 * Radius scaled by zoom, optionally multiplied by a per-feature factor such as a
 * hover or selection bump.
 *
 * Built as a function rather than a constant because MapLibre requires ['zoom']
 * to be the direct input of a top-level step/interpolate. Wrapping a zoom
 * interpolation inside ['*', …] throws "zoom expression may only be used as
 * input to a top-level step or interpolate", so the extra factor is folded into
 * each stop instead of applied to the result.
 *
 * A fixed pixel radius makes the world view a smear of overlapping circles and a
 * city view a scatter of specks. That matters more now that "All magnitudes"
 * over 7 days returns ~2,300 events instead of 124.
 */
export function zoomScaledRadius(
	extra?: ExpressionSpecification,
): ExpressionSpecification {
	const stops = ZOOM_SCALE.flatMap(([zoom, factor]) => [
		zoom,
		extra
			? ['*', MAG_RADIUS_BASE, factor, extra]
			: ['*', MAG_RADIUS_BASE, factor],
	])

	return [
		'interpolate',
		['linear'],
		['zoom'],
		...stops,
	] as unknown as ExpressionSpecification
}

/** Hover/selection bump for the outer ring. */
export const RING_HOVER_FACTOR: ExpressionSpecification = [
	'case',
	['boolean', ['feature-state', 'hover'], false],
	1.18,
	['boolean', ['feature-state', 'selected'], false],
	1.22,
	1,
]

/** Hover bump for the solid core dot. */
export const CORE_HOVER_FACTOR: ExpressionSpecification = [
	'case',
	['boolean', ['feature-state', 'hover'], false],
	1.12,
	1,
]

/**
 * Ring strength: magnitude sets the base, then depth and age modulate it, so a
 * shallow quake from ten minutes ago reads solid and a deep one from last week
 * recedes. Both values were already in the data and previously unused.
 */
export const RING_STROKE_OPACITY: ExpressionSpecification = [
	'*',
	[
		'interpolate',
		['linear'],
		['to-number', ['get', 'mag']],
		4,
		0.45,
		7,
		0.9,
	],
	['to-number', ['get', 'depthOpacity']],
	['to-number', ['get', 'recency']],
]
