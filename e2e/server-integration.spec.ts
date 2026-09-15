import { test, expect } from "@playwright/test";

// ─── Integração server-side — rotas que dependem de SUPABASE_SERVICE_ROLE_KEY ──
//
// Estes testes chamam rotas de API que instanciam o client do Supabase com a
// service role key no servidor (ex.: src/app/api/leaderboard/route.ts). O job
// de smoke público do PR (E2E Smoke, .github/workflows/ci.yml) roda contra um
// `next start` local SEM secrets server-side — de propósito, para não expor
// SUPABASE_SERVICE_ROLE_KEY em um workflow público de Pull Request.
//
// Por isso esta suíte fica FORA do smoke público e não é referenciada em
// nenhum workflow de CI hoje. Ela é candidata a rodar na Fase 1B / staging,
// com um ambiente controlado que forneça as credenciais server-side
// necessárias (ver e2e/README.md).
//
// NÃO adicionar SUPABASE_SERVICE_ROLE_KEY ao workflow de PR público para
// fazer esta suíte "passar" ali — isso expõe a service role a um contexto
// que roda em qualquer PR/fork.

test("leaderboard API responds", async ({ request }) => {
  const res = await request.get("/api/leaderboard?period=week");
  expect(res.status()).toBeLessThan(500);
});
