/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {},
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'utfs.io',
            },
            {
                protocol: 'https',
                hostname: '*.ufs.sh',
            },
            {
                protocol: 'https',
                hostname: 'uploadthing.com',
            },
        ],
    },
}

module.exports = nextConfig