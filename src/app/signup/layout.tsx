import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar Conta",
  description: "Crie sua conta no Will Treinos PRO e comece a evoluir no vôlei de alta performance.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
