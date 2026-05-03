import withPWAInit from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  customWorkerSrc: "worker",
  fallbacks: {
    document: "/offline.html",
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Dicebear serves SVG avatars; Next requires explicit opt-in for remote SVG.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

// Wrap com Sentry (apenas em produção — evita InvariantError clientReferenceManifest em dev Next.js 15)
const configWithSentry = process.env.NODE_ENV === "production"
  ? withSentryConfig(
      withPWA(nextConfig),
      {
        org: "will-treinos",
        project: "will-treinos-pro",
        release: process.env.VERCEL_GIT_COMMIT_SHA,
        silent: true,
        hideSourceMaps: true,
      },
      {
        widenClientFileUpload: true,
        transpileClientSDK: true,
        autoInstrumentServerFunctions: true,
        autoInstrumentMiddleware: true,
      },
    )
  : withPWA(nextConfig);

export default configWithSentry;
