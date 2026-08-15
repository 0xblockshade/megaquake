import { expression, v8 } from '@maplibre/maplibre-gl-style-spec'
import { describe, expect, it } from 'vitest'
import {
	CORE_HOVER_FACTOR,
	MAG_RADIUS_BASE,
	RING_HOVER_FACTOR,
	RING_STROKE_OPACITY,
	ZOOM_SCALE,
	zoomScaledRadius,
} from '@/lib/map-style'

type PaintCircle = Record<string, unknown>
const circleSpec = v8.paint_circle as unknown as PaintCircle

/**
 * Compile an expression exactly the way MapLibre does when adding a layer.
 * Without this, an invalid expression is only discovered as a runtime console
 * error in the browser — which is how the zoom-nesting bug was found.
 */
function compile(expr: unknown, property: string) {
	const propertySpec = circleSpec[property]
	if (!propertySpec) {
		throw new Error(
			`No style spec for paint_circle.${property}. ` +
				`Available: ${Object.keys(circleSpec).slice(0, 8).join(', ')}`,
		)
	}

	// Signature is (expressionInput, rootKey, propertySpec) — the property name
	// goes second, the spec third.
	return expression.createPropertyExpression(
		expr,
		property,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- style-spec ships its own types
		propertySpec as any,
	)
}

function expectValid(expr: unknown, property: string) {
	const result = compile(expr, property)
	if (result.result === 'error') {
		throw new Error(
			`${property} failed to compile: ${result.value
				.map((error) => error.message)
				.join('; ')}`,
		)
	}
	expect(result.result).toBe('success')
	return result
}

describe('circle-radius expressions', () => {
	it('compiles the bare magnitude radius', () => {
		expectValid(MAG_RADIUS_BASE, 'circle-radius')
	})

	it('compiles the zoom-scaled radius with no extra factor', () => {
		expectValid(zoomScaledRadius(), 'circle-radius')
	})

	it('compiles the ring radius with its hover factor', () => {
		expectValid(zoomScaledRadius(RING_HOVER_FACTOR), 'circle-radius')
	})

	it('compiles the core radius with its hover factor', () => {
		expectValid(zoomScaledRadius(CORE_HOVER_FACTOR), 'circle-radius')
	})

	/**
	 * The exact bug this module exists to prevent: MapLibre rejects a zoom
	 * interpolation nested inside another expression, so the hover factor must be
	 * folded into each stop rather than multiplied over the result.
	 */
	it('rejects a zoom interpolation nested inside a multiply', () => {
		const nested = ['*', zoomScaledRadius(), RING_HOVER_FACTOR]
		const result = compile(nested, 'circle-radius')

		expect(result.result).toBe('error')
		if (result.result === 'error') {
			expect(
				result.value.some((error) => /zoom/i.test(error.message)),
			).toBe(true)
		}
	})

	it('keeps zoom as the top-level interpolate input', () => {
		const expr = zoomScaledRadius(RING_HOVER_FACTOR) as unknown[]
		expect(expr[0]).toBe('interpolate')
		expect(expr[2]).toEqual(['zoom'])
	})

	it('emits one stop per configured zoom level, in ascending order', () => {
		const expr = zoomScaledRadius() as unknown[]
		const zooms = expr.slice(3).filter((_, index) => index % 2 === 0)

		expect(zooms).toEqual(ZOOM_SCALE.map(([zoom]) => zoom))
		expect([...(zooms as number[])].sort((a, b) => a - b)).toEqual(zooms)
	})

	it('grows the radius as zoom increases', () => {
		const factors = ZOOM_SCALE.map(([, factor]) => factor)
		expect([...factors].sort((a, b) => a - b)).toEqual(factors)
	})
})

describe('circle-stroke-opacity expression', () => {
	it('compiles the depth and recency modulated ring opacity', () => {
		expectValid(RING_STROKE_OPACITY, 'circle-stroke-opacity')
	})
})
