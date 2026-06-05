import { NextResponse } from "next/server";

/** Endpoint de health check — usado por smoke tests e monitoramento externo. */
export async function GET() {
  return NextResponse.json(
    { ok: true, ts: new Date().toISOString(), version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local" },
    { status: 200 },
  );
}
