import type { NextConfig } from "next";

// Imagens (logo da escola, fotos) vêm do Storage do Supabase.
const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: supabase.protocol.replace(":", "") as "http" | "https",
        hostname: supabase.hostname,
        port: supabase.port,
        pathname: "/storage/v1/**",
      },
    ],
  },
};

export default nextConfig;
