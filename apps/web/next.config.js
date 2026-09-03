const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vargani/types', '@vargani/ui'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.dirname(require.resolve('react/package.json', { paths: [__dirname] })),
      'react-dom': path.dirname(require.resolve('react-dom/package.json', { paths: [__dirname] })),
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/:path*`
          : 'http://localhost:4000/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
