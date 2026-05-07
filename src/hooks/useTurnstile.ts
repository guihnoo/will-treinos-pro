import { useCallback, useState } from "react";

/**
 * Hook para gerenciar Turnstile CAPTCHA
 * Valida token com o servidor
 */
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async (turnstileToken: string): Promise<boolean> => {
    if (!turnstileToken) {
      setError("CAPTCHA não preenchido. Por favor, complete o desafio.");
      return false;
    }

    setVerifying(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/verify-turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: turnstileToken }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao verificar CAPTCHA (${response.status})`);
      }

      const data = (await response.json()) as {
        success: boolean;
        errorCodes?: string[];
      };

      if (!data.success) {
        const errorMsg = data.errorCodes?.includes("timeout-or-duplicate")
          ? "CAPTCHA expirou. Por favor, tente novamente."
          : data.errorCodes?.includes("bad-request")
            ? "Erro no CAPTCHA. Por favor, recarregue e tente novamente."
            : "Falha ao verificar CAPTCHA. Por favor, tente novamente.";

        setError(errorMsg);
        setVerifying(false);
        return false;
      }

      setToken(turnstileToken);
      setVerifying(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido ao verificar CAPTCHA";
      setError(message);
      setVerifying(false);
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    setError(null);
  }, []);

  return {
    token,
    verifying,
    error,
    verify,
    reset,
  };
}
