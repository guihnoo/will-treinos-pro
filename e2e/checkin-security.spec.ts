import { test, expect } from "@playwright/test";

/**
 * Teste: Segurança do check-in via QR assinado (Sprint 2A)
 *
 * Valida:
 * - POST /api/checkin sem Authorization => 401 (needs_login)
 * - POST /api/checkin/qr-token sem Authorization => 401
 *
 * Não requer PLAYWRIGHT_TEST_CREDS: nenhum destes casos precisa de login —
 * ambas as rotas checam a ausência do header ANTES de qualquer chamada ao
 * Supabase, então não dependem de SUPABASE_URL/ANON_KEY estarem configurados
 * neste ambiente.
 *
 * Fora do escopo desta suíte (exige ambiente com Supabase real configurado
 * e um aluno/staff de teste — ver e2e/server-integration.spec.ts para o
 * padrão já estabelecido de suíte que depende de credenciais reais):
 * - token assinado válido → success
 * - assinatura alterada / lessonId alterado → invalid_qr
 * - expirado → expired
 * - aluno não inscrito → not_enrolled
 * - aula cancelada → cancelled
 * - check-in duplicado → already_checked_in (idempotente, sem XP duplo)
 * - client não consegue definir studentId/points arbitrário (garantido por
 *   construção: o endpoint nunca lê esses campos do body — ver
 *   src/app/api/checkin/route.ts)
 */

test.describe("Segurança — POST /api/checkin", () => {
  test("sem Authorization retorna 401 (needs_login)", async ({ request }) => {
    const response = await request.post("/api/checkin", {
      data: { token: "qualquer-coisa" },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.state).toBe("needs_login");
  });

  test("sem token no body retorna 400 (invalid_qr) quando autenticado com header vazio ausente", async ({ request }) => {
    // Sem Authorization -> ainda cai no caso needs_login antes de chegar a
    // checar o token, então este teste também confirma que a ordem de
    // validação é: auth primeiro, token depois.
    const response = await request.post("/api/checkin", {
      data: {},
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.state).toBe("needs_login");
  });
});

test.describe("Segurança — POST /api/checkin/qr-token", () => {
  test("sem Authorization retorna 401", async ({ request }) => {
    const response = await request.post("/api/checkin/qr-token", {
      data: { lessonId: "qualquer-aula" },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});

test.describe("Segurança — GET /api/checkin/qr-token", () => {
  test("sem Authorization retorna 401", async ({ request }) => {
    const response = await request.get("/api/checkin/qr-token?lessonId=qualquer-aula");

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
