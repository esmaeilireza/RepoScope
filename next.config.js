// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' https://static.cloudflareinsights.com", // Only if needed, otherwise remove
              "style-src 'self' 'unsafe-inline'", // Temporarily allow inline styles for Tailwind dev, move to nonce/hash for prod
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.github.com",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join("; "),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;