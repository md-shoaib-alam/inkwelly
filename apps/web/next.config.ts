import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : 'standalone',
  allowedDevOrigins: ['192.168.0.101', '192.168.0.101:3000', '192.168.29.227', 'localhost:3000', 'localhost'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-0c4be3a2bb63412c804a5baf73659e3d.r2.dev',
      },
    ],
  },
  async rewrites() {
    return [
      {
        // Proxy API requests to avoid CORS preflights on 3G
        source: '/api/proxy/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
      {
        // Proxy GraphQL requests
        source: '/graphql-proxy',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/graphql`,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "school-management-pk",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (can increase build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  webpack: {
    reactComponentAnnotation: {
      enabled: true,
    },
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your Sentry bill.
  tunnelRoute: "/monitoring",

  // Hides source maps from visitors
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
