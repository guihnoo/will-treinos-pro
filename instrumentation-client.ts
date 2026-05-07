/**
 * Sentry Client Instrumentation (Turbopack-compatible)
 * Replaces the deprecated `sentry.client.config.ts`.
 * Next.js 15+ with Turbopack requires this file at the project root.
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Performance Monitoring: trace 10% of requests in production
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Session Replay: capture 10% of sessions (useful for debugging)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0, // Always record when there's an error

    // Ignore common noise errors
    ignoreErrors: [
      "NetworkError",
      "Failed to fetch",
      "Net::ERR",
      "chrome-extension://",
      "moz-extension://",
    ],

    // Strip sensitive data before sending to Sentry
    beforeSend(event) {
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }
      return event;
    },
  });
}

// Required Next.js 15 App Router instrumentation hooks
// These are called automatically by the framework — do NOT rename them.

/** Tracks client-side navigation for performance monitoring */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

/** Captures server-side request errors (API routes, Server Actions) */
export const onRequestError = Sentry.captureRequestError;
