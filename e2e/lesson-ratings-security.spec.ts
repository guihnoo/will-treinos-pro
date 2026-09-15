import { test, expect } from "@playwright/test";

/**
 * Teste: Segurança do endpoint GET /api/student/submit-rating
 *
 * Valida (Sprint 0A — hotfix de segurança):
 * - Requisição sem header Authorization => 401
 * - Token JWT inválido/forjado => 401
 *
 * Não requer PLAYWRIGHT_TEST_CREDS: nenhum destes casos precisa de login.
 * O caso "staff válido acessa avaliações" fica documentado como limitação —
 * exigiria uma conta de staff de teste provisionada (fora do escopo aqui).
 */

test.describe("Segurança — GET /api/student/submit-rating", () => {
  test("sem Authorization retorna 401", async ({ request }) => {
    const response = await request.get("/api/student/submit-rating");

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test("token inválido/forjado retorna 401", async ({ request }) => {
    const response = await request.get("/api/student/submit-rating", {
      headers: {
        authorization: "Bearer token-forjado-nao-existe-no-supabase",
      },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
