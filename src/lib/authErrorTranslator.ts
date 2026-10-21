/**
 * Mapeamento e tradução de mensagens de erro do Supabase Auth para pt-BR.
 * Converte erros técnicos ou em inglês em mensagens claras e amigáveis para o usuário.
 */

export function translateAuthError(rawError: string | null | undefined): string {
  if (!rawError) return "Não foi possível concluir a autenticação. Tente novamente.";

  const msg = rawError.toLowerCase().trim();

  // Credenciais inválidas
  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid_grant") ||
    msg.includes("invalid email or password")
  ) {
    return "E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.";
  }

  // Usuário não encontrado
  if (msg.includes("user not found") || msg.includes("no user found")) {
    return "Nenhuma conta encontrada com este e-mail.";
  }

  // E-mail não confirmado
  if (msg.includes("email not confirmed") || msg.includes("unconfirmed email")) {
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou spam.";
  }

  // Rate limit / Muitas requisições
  if (
    msg.includes("too many requests") ||
    msg.includes("rate limit") ||
    msg.includes("over_email_send_rate_limit") ||
    msg.includes("over_request_rate_limit")
  ) {
    return "Muitas tentativas consecutivas. Aguarde alguns instantes antes de tentar novamente.";
  }

  // Senha fraca / curta
  if (msg.includes("password should be at least") || msg.includes("password is too short")) {
    return "A senha deve conter no mínimo 6 caracteres.";
  }

  // Usuário já cadastrado
  if (
    msg.includes("user already registered") ||
    msg.includes("user already exists") ||
    msg.includes("email address already in use")
  ) {
    return "Este e-mail já está cadastrado. Tente fazer login ou recupere sua senha.";
  }

  // Token expirado ou link inválido (recuperação de senha / magic link)
  if (
    msg.includes("token has expired") ||
    msg.includes("token is expired") ||
    msg.includes("token is invalid") ||
    msg.includes("otp expired") ||
    msg.includes("access_denied")
  ) {
    return "O link de verificação expirou ou é inválido. Solicite um novo link.";
  }

  // Erros de rede / conexão
  if (msg.includes("failed to fetch") || msg.includes("network request failed") || msg.includes("networkerror")) {
    return "Erro de conexão com a rede. Verifique sua internet e tente novamente.";
  }

  // Sessão expirada
  if (msg.includes("auth session missing") || msg.includes("session expired")) {
    return "Sua sessão expirou. Faça login novamente para continuar.";
  }

  return rawError;
}
