import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
