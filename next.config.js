/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.dropboxusercontent.com' },
    ],
  },
};

module.exports = nextConfig;
