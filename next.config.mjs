/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the build writes plain HTML/CSS/JS to the `out/` folder.
  // This runs on Cloudflare Pages, Vercel, and Netlify without extra adapters.
  output: "export",
  eslint: {
    // Don't fail production build on ESLint warnings/errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
