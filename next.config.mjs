import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co"
      }
    ]
  }
};

initOpenNextCloudflareForDev();

export default nextConfig;
