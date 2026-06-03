import { NextRequest, NextResponse } from "next/server";

// Rotas que requerem autenticação (protegidas no servidor)
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/treinos",
  "/perfil",
  "/configuracoes",
  "/agenda",
  "/feed",
  "/financeiro",
  "/alunos",
  "/ranking",
  "/checkin",
  "/will",
];

// Rotas sempre públicas (não redirecionar para login)
const PUBLIC_PREFIXES = [
  "/api/",
  "/_next/",
  "/icons/",
  "/screenshots/",
  "/_vercel/",
  "/sw.js",
  "/worker-",
  "/manifest.json",
  "/robots.txt",
  "/sitemap.xml",
  "/offline.html",
  "/og-image",
  "/opengraph-image",
  "/favicon",
  "/login",
  "/signup",
  "/cadastro",
  "/esqueci-senha",
  "/nova-senha",
  "/auth/",
  "/aguardando",
  "/termos",
  "/privacidade",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Sempre permitir rotas públicas
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Verificar se é uma rota protegida
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Sessão no browser fica em localStorage (`wt-auth-session`); edge lê `wt_role` (underscore).
  const wtRole = req.cookies.get("wt_role")?.value?.trim();
  const hasSession =
    Boolean(wtRole) ||
    req.cookies.has("sb-access-token") ||
    req.cookies.has("sb-refresh-token") ||
    [...req.cookies.getAll()].some(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"),
    );

  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|screenshots/|sw.js|offline.html).*)",
  ],
};
