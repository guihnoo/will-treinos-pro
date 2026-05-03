/**
 * Sentry Client Configuration
 * Captura erros no browser
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Performance Monitoring: trace 10% das requisições
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Session Replay: gravar 10% das sessões (útil para debugging)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0, // Sempre gravar quando há erro

    // Ignore certain errors
    ignoreErrors: [
      // Network errors normais
      "NetworkError",
      "Failed to fetch",
      "Net::ERR",
      // Browser extensions
      "chrome-extension://",
      "moz-extension://",
    ],

    // Antes de enviar para Sentry, filtrar dados sensíveis
    beforeSend(event) {
      // Remover cookies, tokens, senhas
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }
      return event;
    },
  });
}
