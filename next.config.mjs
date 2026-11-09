/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't fail production build on ESLint warnings/errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
