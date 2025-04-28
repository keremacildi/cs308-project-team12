/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['0.0.0.0', 'localhost', '127.0.0.1', 'your-production-domain.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
        port: '8000',
        pathname: '/media/products/**',
      },
    ],
  },
};

export default nextConfig;
