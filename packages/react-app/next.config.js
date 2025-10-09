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
}

module.exports = nextConfig