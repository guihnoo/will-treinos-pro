/**
 * Sentry Client-Side Instrumentation
 * Hooks into Next.js router and request events for enhanced error tracking
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export function register() {
  if (!SENTRY_DSN) return;

  // Initialize Sentry for client-side
  if (typeof window !== "undefined") {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    });
  }
}

// Hook for capturing router transitions (for App Router instrumentation)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Hook for capturing request errors (for App Router instrumentation)
export const onRequestError = Sentry.captureRequestError;

// Hook for capturing router transition (manual control)
export function captureRouterTransition(
  nextRoute: string,
  nextPathname: string
) {
  // Modern approach: use Sentry's automatic instrumentation
  // Manual transaction creation is deprecated in Sentry 10.x
  Sentry.captureMessage(`Navigation to ${nextPathname}`);

  return () => {
    // No-op for backward compatibility
  };
}

// Hook for capturing request errors
export function captureRequestError(
  error: Error,
  context?: { path?: string; method?: string; statusCode?: number }
) {
  Sentry.captureException(error, {
    tags: {
      request_path: context?.path || "unknown",
      http_method: context?.method || "unknown",
      http_status: context?.statusCode?.toString() || "unknown",
    },
  });
}
