/**
 * Gerador de payload PIX EMV/BR Code — especificação do Banco Central do Brasil
 * https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II-ManualdePadroesparaIniciacaodoPix-versao3.pdf
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Monta um campo EMV: ID (2 dígitos) + comprimento (2 dígitos) + valor */
function emvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

/** CRC16-CCITT (polinômio 0x1021) — checksum obrigatório do BR Code */
function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Sanitiza string para ASCII máximo 25 chars (nome do beneficiário) */
function sanitizeName(name: string, maxLen = 25): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove diacríticos
    .replace(/[^A-Za-z0-9 ]/g, "")   // só alfanumérico e espaço
    .trim()
    .slice(0, maxLen)
    .toUpperCase();
}

/** Sanitiza cidade (máximo 15 chars) */
function sanitizeCity(city: string, maxLen = 15): string {
  return city
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .slice(0, maxLen)
    .toUpperCase();
}

// ─── Principal ────────────────────────────────────────────────────────────────

export interface PixPayloadParams {
  /** Chave PIX (cpf, cnpj, email, telefone ou aleatória) */
  pixKey: string;
  /** Nome do beneficiário (max 25 chars após sanitização) */
  merchantName: string;
  /** Cidade do beneficiário (max 15 chars) — padrão "SAO PAULO" */
  merchantCity?: string;
  /** Valor da transação em R$ — omitir para deixar em aberto */
  amount?: number;
  /** Identificador da transação (txId) — max 25 chars, padrão "***" */
  txId?: string;
}

/**
 * Gera o payload EMV/QR Code PIX estático conforme especificação do Banco Central.
 * O resultado deve ser exibido como QR Code ou como código "copia e cola".
 */
export function generatePixPayload(params: PixPayloadParams): string {
  const {
    pixKey,
    merchantName,
    merchantCity = "SAO PAULO",
    amount,
    txId = "***",
  } = params;

  const name = sanitizeName(merchantName);
  const city = sanitizeCity(merchantCity);
  const safeTxId = txId.replace(/[^A-Za-z0-9*]/g, "").slice(0, 25) || "***";

  // Campo 26 — Merchant Account Information (PIX)
  const gui = emvField("00", "BR.GOV.BCB.PIX");
  const key = emvField("01", pixKey);
  const merchantInfo = emvField("26", gui + key);

  // Campo 62 — Additional Data Field (txId)
  const txRef = emvField("05", safeTxId);
  const additionalData = emvField("62", txRef);

  // Montagem do payload sem CRC
  let payload =
    emvField("00", "01") +         // Payload Format Indicator
    merchantInfo +                  // Merchant Account Information
    emvField("52", "0000") +        // Merchant Category Code
    emvField("53", "986") +         // Transaction Currency (BRL)
    (amount !== undefined
      ? emvField("54", amount.toFixed(2))
      : "") +                       // Transaction Amount (opcional)
    emvField("58", "BR") +          // Country Code
    emvField("59", name) +          // Merchant Name
    emvField("60", city) +          // Merchant City
    additionalData +                // Additional Data Field
    "6304";                         // CRC placeholder (4 zeros virão via crc16)

  // Calcula e anexa o CRC16
  payload = payload.slice(0, -4) + "6304" + crc16(payload);

  return payload;
}
