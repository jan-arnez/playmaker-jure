import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Allow access from network IP addresses in development
  allowedDevOrigins: [
    "http://192.168.56.1:3000",
    "http://192.168.1.*:3000",
    "http://192.168.0.*:3000",
    "http://10.0.0.*:3000",
    'local-origin.dev', 
    '*.local-origin.dev',
  ],
  devIndicators: {
    position: "bottom-right",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
    qualities: [75, 80, 90],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
