import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	// Dev only. Next blocks cross-origin requests to dev assets by default, which
	// silently breaks hydration (the HTML renders, the JS chunks 403, the map never
	// mounts) when the dev server is opened from another machine — LAN or Tailscale.
	// Has no effect on `next build` / `next start`.
	allowedDevOrigins: ['192.168.0.25', '100.86.39.78'],

	async headers() {
		return [
			{
				source: '/maplibre/:path*.mjs',
				headers: [
					{
						key: 'Content-Type',
						value: 'text/javascript; charset=utf-8',
					},
				],
			},
		]
	},
}

export default nextConfig
