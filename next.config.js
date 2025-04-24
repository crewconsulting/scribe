/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    // Remove the cache: false setting as it can cause chunk loading issues
    return config;
  },
};

module.exports = nextConfig;