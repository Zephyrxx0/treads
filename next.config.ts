import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    '10.203.40.74',
    '10.203.40.74:3000',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
};

export default nextConfig;
