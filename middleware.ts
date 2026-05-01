import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canAccessPrefix, normalizeRole, type AppPrefix } from "@/domain/v1/rbac";

const GUARDED_PREFIXES: AppPrefix[] = ["/will", "/prof", "/aluno", "/lead"];
const PRIVATE_PATHS = [
  "/dashboard",
  "/agenda",
  "/alunos",
  "/financeiro",
  "/feed",
  "/configuracoes",
  "/perfil",
  "/treinos",
] as const;

function getGuardPrefix(pathname: string): AppPrefix | null {
  const hit = GUARDED_PREFIXES.find((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return hit ?? null;
}

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const guardPrefix = getGuardPrefix(pathname);
  const roleCookie = request.cookies.get("wt_role")?.value ?? null;
  const role = normalizeRole(roleCookie);

  const shouldRequireSession = Boolean(guardPrefix) || isPrivatePath(pathname);
  if (shouldRequireSession && !role) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (guardPrefix && !canAccessPrefix(role, guardPrefix)) {
    const deniedUrl = request.nextUrl.clone();
    deniedUrl.pathname = "/dashboard";
    deniedUrl.searchParams.set("denied", guardPrefix);
    return NextResponse.redirect(deniedUrl);
  }

  if (role && isPrivatePath(pathname)) {
    const isStudent = role === "student";
    const isProfessor = role === "professor";

    // /configuracoes: dono, professor e aluno acessam a UI (abas sensíveis ficam só no cliente para não-owner).
    // Apenas "lead" sem conta completa fica fora.
    if (pathname.startsWith("/configuracoes") && role === "lead") {
      const deniedUrl = request.nextUrl.clone();
      deniedUrl.pathname = "/dashboard";
      deniedUrl.searchParams.set("denied", "/configuracoes");
      return NextResponse.redirect(deniedUrl);
    }

    if (pathname.startsWith("/alunos") && isStudent) {
      const deniedUrl = request.nextUrl.clone();
      deniedUrl.pathname = "/dashboard";
      deniedUrl.searchParams.set("denied", "/alunos");
      return NextResponse.redirect(deniedUrl);
    }

    if (pathname.startsWith("/financeiro") && isProfessor) {
      const deniedUrl = request.nextUrl.clone();
      deniedUrl.pathname = "/dashboard";
      deniedUrl.searchParams.set("denied", "/financeiro");
      return NextResponse.redirect(deniedUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/will/:path*",
    "/prof/:path*",
    "/aluno/:path*",
    "/lead/:path*",
    "/dashboard/:path*",
    "/agenda/:path*",
    "/alunos/:path*",
    "/financeiro/:path*",
    "/feed/:path*",
    "/configuracoes/:path*",
    "/perfil/:path*",
    "/treinos/:path*",
  ],
};
