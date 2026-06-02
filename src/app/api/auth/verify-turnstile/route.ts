import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/verify-turnstile
 * Verifica token Turnstile (CAPTCHA) com Cloudflare
 *
 * Body: { token: string }
 * Response: { success: boolean, errorCodes?: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = (await request.json()) as { token?: string };

    if (!token) {
      return NextResponse.json(
        { success: false, errorCodes: ["missing_token"] },
        { status: 400 },
      );
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      // Security M3: fail-closed em produção — sem chave, sem acesso
      if (process.env.NODE_ENV === "production") {
        console.error("[Turnstile] Secret key não configurada em produção. Bloqueando requisição.");
        return NextResponse.json({ success: false, errorCodes: ["misconfigured"] }, { status: 500 });
      }
      // Em dev/preview: permitir sem CAPTCHA para facilitar testes locais
      console.warn("[Turnstile] Secret key não configurada. CAPTCHA ignorado (apenas em dev).");
      return NextResponse.json({ success: true });
    }

    // Fazer request para Cloudflare Turnstile API
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    if (!response.ok) {
      console.error(`[Turnstile] API error: ${response.status}`);
      return NextResponse.json(
        { success: false, errorCodes: ["api_error"] },
        { status: 500 },
      );
    }

    const data = (await response.json()) as {
      success: boolean;
      error_codes?: string[];
      challenge_ts?: string;
      hostname?: string;
    };

    // Retornar resposta do Cloudflare
    return NextResponse.json({
      success: data.success,
      errorCodes: data.error_codes || [],
      challengeTs: data.challenge_ts,
      hostname: data.hostname,
    });
  } catch (error) {
    console.error("[Turnstile] Verification error:", error);
    return NextResponse.json(
      { success: false, errorCodes: ["verification_error"] },
      { status: 500 },
    );
  }
}
