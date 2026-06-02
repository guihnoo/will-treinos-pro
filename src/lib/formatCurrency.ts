export function formatBRL(value: number | string | undefined | null): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatBRLCompact(value: number | string | undefined | null): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return "R$0";
  if (num >= 1000) return `R$${(num / 1000).toFixed(1).replace(".", ",")}k`;
  return `R$${num.toFixed(0)}`;
}
