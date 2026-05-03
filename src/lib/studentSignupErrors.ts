/**
 * Mensagens em PT-BR para falhas ao criar aluno via cliente (OAuth + signup público).
 * Mantém detalhes úteis em logs quando já existe texto técnico.
 */
export function describeStudentInsertFailure(rawMessage: string): string {
  const msg = String(rawMessage || "").trim();
  const lower = msg.toLowerCase();

  if (
    lower.includes("row-level security") ||
    lower.includes("violates row-level security") ||
    lower.includes("new row violates row-level security policy") ||
    lower.includes("42501") ||
    lower.includes("permission denied")
  ) {
    return "Cadastro bloqueado pelas regras do banco (permissão). Peça ao administrador para aplicar no Supabase a migração com a política students_insert_pending_self (OAuth + pending + auth_user_id = usuário logado).";
  }

  if (
    lower.includes("duplicate key") ||
    lower.includes("unique constraint") ||
    lower.includes("students_auth_user_id")
  ) {
    return "Esta conta Google já está vinculada a um cadastro. Faça login ou peça ao admin para revisar duplicidade.";
  }

  const stripped = msg.replace(/^Falha ao criar aluno:\s*/i, "").trim();
  return stripped || "Não foi possível completar o cadastro.";
}
