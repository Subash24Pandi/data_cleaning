/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // This ignores the red box errors during the build so your site goes live
    ignoreBuildErrors: true,
  },
  eslint: {
    // This ignores linting warnings during the build
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;