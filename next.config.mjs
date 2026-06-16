/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Enable standalone build so Docker images stay small (no node_modules copy needed).
  output: "standalone",
};

export default nextConfig;
