/**
 * Sentry Server Configuration
 * Captura erros no Next.js server (API routes, server components)
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Performance: trace 10% das requisições
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Ignore certain errors
    ignoreErrors: [
      "NetworkError",
      "Failed to fetch",
    ],

    // Server-side: não precisamos de Session Replay
    // Mas rastreamos performance
  });
}
