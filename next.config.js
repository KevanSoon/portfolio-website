/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kevansoon.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
