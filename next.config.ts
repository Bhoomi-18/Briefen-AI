import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Next.js Image component to serve images from Cloudinary
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        // Google user profile avatars (OAuth)
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },

  // Expose server-side environment variables to the client-side bundle
  // (NEXT_PUBLIC_* are already auto-exposed; this section is for any future
  // server-only vars that need to be available at build time)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws",
  },
};

export default nextConfig;
