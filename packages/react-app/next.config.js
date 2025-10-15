/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/0199ca30-deab-dae2-7673-ed30c8862bb8',
        permanent: false, // 307 temporary redirect
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