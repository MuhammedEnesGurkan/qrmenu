import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Content-Security-Policy",
    value:
      `default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}; connect-src 'self'${isDevelopment ? " http://localhost:8080" : ""}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'${isDevelopment ? "" : "; upgrade-insecure-requests"}`,
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: ["localhost", "127.0.0.1", "10.2.0.2"],
  async rewrites() {
    const apiUrl = process.env.API_URL ?? "http://localhost:8080";
    return [
      { source: "/backend/:path*", destination: `${apiUrl}/:path*` },
      {
        source: "/api/public/assets/:path*",
        destination: `${apiUrl}/api/public/assets/:path*`,
      },
    ];
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/q/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
