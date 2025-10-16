/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.farcaster.xyz https://*.warpcast.com",
          },
        ],
      },
      {
        source: '/fx-remit.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      stream: false,
      crypto: false,
      buffer: false,
      util: false,
    };
    
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        indexedDB: false,
        localStorage: false,
        sessionStorage: false,
        window: false,
        document: false,
      };
    }
    
    if (isServer) {
      config.externals = [...(config.externals || []), 'indexedDB', 'localStorage', 'sessionStorage'];
    }
    
    return config;
  },
  serverExternalPackages: ['@divvi/referral-sdk'],
}

module.exports = nextConfig