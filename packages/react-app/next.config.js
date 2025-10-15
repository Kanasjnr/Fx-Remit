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
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination: '/.well-known/farcaster-manifest.json',
        permanent: false,
      },
    ]
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      stream: false,
    };
    
    // Fix for indexedDB SSR issues
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        indexedDB: false,
        localStorage: false,
        sessionStorage: false,
      };
    }
    
    // Add externals for server-side rendering
    if (isServer) {
      config.externals = [...(config.externals || []), 'indexedDB'];
    }
    
    return config;
  },
  serverExternalPackages: ['@divvi/referral-sdk'],
}

module.exports = nextConfig