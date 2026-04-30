/**
 * Reduces payload size for data URLs stored in Postgres (feed/media_url, avatar fields).
 */

export type CompressImageOptions = {
  maxSide?: number;
  quality?: number;
  /** Reject if JPEG data URL length exceeds this (UTF-16-ish safety for text columns). */
  maxPayloadChars?: number;
};

export async function compressImageFileToDataUrl(file: File, options?: CompressImageOptions): Promise<string> {
  const maxSide = options?.maxSide ?? 1280;
  const quality = options?.quality ?? 0.82;
  const maxPayloadChars = options?.maxPayloadChars ?? 900_000;

  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem.");
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (!w || !h) {
          reject(new Error("Dimensões da imagem inválidas."));
          return;
        }
        const scale = Math.min(1, maxSide / Math.max(w, h));
        w = Math.round(w * scale);
        h = Math.round(h * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível processar a imagem neste dispositivo."));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (dataUrl.length > maxPayloadChars) {
          dataUrl = canvas.toDataURL("image/jpeg", 0.65);
        }
        if (dataUrl.length > maxPayloadChars) {
          dataUrl = canvas.toDataURL("image/jpeg", 0.5);
        }
        if (dataUrl.length > maxPayloadChars) {
          reject(new Error("Imagem grande demais mesmo após compressão. Tente outra foto ou uma com menos detalhes."));
          return;
        }
        resolve(dataUrl);
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler esta imagem."));
    };
    img.src = url;
  });
}
