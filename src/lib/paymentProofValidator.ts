/**
 * Payment Proof File Validation & Security Scanning
 * Valida tipo, tamanho e opcionalmente faz scan de vírus
 */

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ValidationResult {
  valid: boolean;
  reason?: string;
  mimeType?: string;
  size?: number;
}

interface ScanResult {
  clean: boolean;
  reason?: string;
  scanProvider?: string;
}

/**
 * Valida MIME type e tamanho do arquivo de comprovante
 * @param file - Arquivo para validar
 * @returns Resultado da validação
 */
export function validatePaymentProof(file: File): ValidationResult {
  // Validar MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      reason: `Tipo de arquivo não permitido. Aceitos: JPG, PNG, PDF. Recebido: ${file.type || "desconhecido"}`,
    };
  }

  // Validar extensão (double-check contra MIME spoofing)
  const extension = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      reason: `Extensão de arquivo não permitida (.${extension}). Aceitos: .jpg, .jpeg, .png, .pdf`,
    };
  }

  // Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      reason: `Arquivo muito grande (${sizeMB}MB). Máximo permitido: 5MB`,
    };
  }

  // Validar tamanho mínimo (arquivo vazio)
  if (file.size === 0) {
    return {
      valid: false,
      reason: "Arquivo está vazio",
    };
  }

  return {
    valid: true,
    mimeType: file.type,
    size: file.size,
  };
}

/**
 * Faz scan de vírus usando VirusTotal API
 * Graceful fallback se API não estiver configurada
 *
 * @param file - Arquivo para fazer scan
 * @returns Resultado do scan (true = limpo ou não configurado, false = infectado)
 */
export async function scanPaymentProofVirus(file: File): Promise<ScanResult> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  // Se API key não configurada, permitir upload (fallback gracioso)
  if (!apiKey) {
    console.warn(
      "[Payment Proof] VirusTotal API key não configurada. Upload permitido sem scan.",
    );
    return {
      clean: true,
      reason: "Scan desabilitado (configuração ausente)",
      scanProvider: "none",
    };
  }

  try {
    // Preparar FormData para VirusTotal
    const formData = new FormData();
    formData.append("file", file);

    // Fazer upload para VirusTotal
    const uploadResponse = await fetch("https://www.virustotal.com/api/v3/files", {
      method: "POST",
      headers: {
        "x-apikey": apiKey,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      // Rate limit ou erro -> permitir (fallback)
      console.warn(`[Payment Proof] VirusTotal upload falhou: ${uploadResponse.status}`);
      return {
        clean: true,
        reason: `Scan indisponível (status ${uploadResponse.status})`,
        scanProvider: "virustotal-unavailable",
      };
    }

    const { data } = (await uploadResponse.json()) as { data: { id: string } };
    const fileId = data.id;

    // Aguardar resultado do scan (máx 30s, polling)
    let attempts = 0;
    const maxAttempts = 6; // 6 * 5s = 30s
    const pollInterval = 5000; // 5 segundos

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      attempts++;

      const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${fileId}`, {
        headers: { "x-apikey": apiKey },
      });

      if (!analysisResponse.ok) continue;

      const analysisData = (await analysisResponse.json()) as {
        data: { attributes: { status: string; stats: { malicious: number; suspicious: number } } };
      };

      const { status, stats } = analysisData.data.attributes;

      if (status === "completed") {
        // Verificar resultado
        if (stats.malicious > 0) {
          return {
            clean: false,
            reason: `Arquivo detectado como malicioso (${stats.malicious} detecções)`,
            scanProvider: "virustotal",
          };
        }

        if (stats.suspicious > 0) {
          console.warn(`[Payment Proof] Arquivo marcado como suspeito (${stats.suspicious} detecções)`);
          // Permitir mas logar aviso
        }

        return {
          clean: true,
          reason: `Scan completo: 0 malicioso, ${stats.suspicious} suspeito(s)`,
          scanProvider: "virustotal",
        };
      }

      // Se ainda não completado, continuar polling
    }

    // Timeout: permitir upload (fallback)
    console.warn("[Payment Proof] VirusTotal scan timeout após 30s");
    return {
      clean: true,
      reason: "Scan timeout (permitido por segurança)",
      scanProvider: "virustotal-timeout",
    };
  } catch (error) {
    console.error("[Payment Proof] Erro ao fazer scan:", error);
    // Erro na API: permitir upload (fallback)
    return {
      clean: true,
      reason: "Scan erro (permitido por segurança)",
      scanProvider: "virustotal-error",
    };
  }
}

/**
 * Valida proof e faz scan (se configurado)
 * Uso: await validateAndScanPaymentProof(file) antes de upload
 */
export async function validateAndScanPaymentProof(file: File): Promise<{
  valid: boolean;
  message: string;
}> {
  // Passo 1: Validação básica
  const validation = validatePaymentProof(file);
  if (!validation.valid) {
    return {
      valid: false,
      message: validation.reason || "Arquivo inválido",
    };
  }

  // Passo 2: Scan de vírus (se configurado)
  const scan = await scanPaymentProofVirus(file);
  if (!scan.clean) {
    return {
      valid: false,
      message: scan.reason || "Arquivo bloqueado por scan de segurança",
    };
  }

  return {
    valid: true,
    message: `Arquivo validado (${(file.size / 1024).toFixed(2)}KB, ${scan.scanProvider || "scan"})`,
  };
}
