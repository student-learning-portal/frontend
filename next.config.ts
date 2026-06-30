import type { NextConfig } from 'next';

const backend = process.env.BACKEND_URL ?? 'http://backend:8080';

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            // Avatars are up to 5 MB; default server action body limit is 1 MB.
            bodySizeLimit: '6mb',
        },
    },
    async rewrites() {
        return [
            {
                source: '/uploads/:path*',
                destination: `${backend}/uploads/:path*`,
            },
        ];
    },
};

export default nextConfig;
