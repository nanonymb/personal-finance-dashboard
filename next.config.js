/** @type {import('next').NextConfig} */
const internalHost = process.env.TAURI_DEV_HOST || 'localhost';
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  assetPrefix: process.env.NODE_ENV === 'development' ? `http://${internalHost}:3000` : undefined,
};
export default nextConfig;