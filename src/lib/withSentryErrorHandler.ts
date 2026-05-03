/**
 * Wrapper para API routes
 * Captura erros não tratados em API routes
 */

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export function withSentryErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      // Capturar erro em Sentry
      Sentry.captureException(error, {
        tags: {
          method: req.method,
          url: req.url,
          route: req.nextUrl.pathname,
        },
        contexts: {
          request: {
            method: req.method,
            url: req.url,
            headers: {
              "user-agent": req.headers.get("user-agent"),
            },
          },
        },
      });

      // Retornar erro para o cliente
      const message = error instanceof Error ? error.message : "Erro desconhecido no servidor";
      return NextResponse.json(
        { error: message, reportedToSentry: true },
        { status: 500 },
      );
    }
  };
}
