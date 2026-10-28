"use client";

// 1 a 28: mesmo limite usado por dueDateForBillingMonth, pra o vencimento existir em todo mês (inclusive fevereiro).
const DIAS = Array.from({ length: 28 }, (_, i) => i + 1);

export function isValidPaymentDay(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 28;
}

type Props = {
  value: number | null | undefined;
  onChange: (dia: number) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
};

export default function PaymentDaySelect({ value, onChange, id, className, disabled }: Props) {
  const valido = isValidPaymentDay(value);
  return (
    <select
      id={id}
      value={valido ? String(value) : ""}
      disabled={disabled}
      onChange={(e) => {
        const dia = Number(e.target.value);
        if (isValidPaymentDay(dia)) onChange(dia);
      }}
      className={className}
    >
      {!valido && (
        <option value="" disabled>
          Escolha o dia
        </option>
      )}
      {DIAS.map((d) => (
        <option key={d} value={d}>
          Dia {d}
        </option>
      ))}
    </select>
  );
}
