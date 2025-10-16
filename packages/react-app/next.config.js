/** @type {import('next').NextConfig} */
const nextConfig = {
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
    
    // Fix for indexedDB SSR issues
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
    
    // Add externals for server-side rendering
    if (isServer) {
      config.externals = [...(config.externals || []), 'indexedDB', 'localStorage', 'sessionStorage'];
    }
    
    return config;
  },
  serverExternalPackages: ['@divvi/referral-sdk'],
}

module.exports = nextConfig