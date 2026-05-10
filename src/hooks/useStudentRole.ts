import { useStudents } from "@/context/StudentsContext";
import { useAuth } from "@/context/AuthContext";
import type { StudentRole } from "@/context/types";

/**
 * Retorna o papel (role) do estudante atual baseado em seu registro na tabela students.
 * Valores possíveis: "aluno" | "observador" | "professor"
 *
 * Uso:
 * ```tsx
 * const role = useStudentRole();
 * if (role === "observador") {
 *   // apenas feed + perfil
 * }
 * ```
 */
export function useStudentRole(): StudentRole | null {
  const { user } = useAuth();
  const { students } = useStudents();

  if (!user?.id) return null;

  // Encontra o estudante pelo authUserId
  const student = students.find((s) => s.authUserId === user.id);

  // Retorna o studentRole ou default "aluno"
  return student?.studentRole || "aluno";
}

/**
 * Verifica se o usuário tem acesso a uma área específica.
 * Uso:
 * ```tsx
 * const canAccessDashboard = useCanAccess("dashboard");
 * if (!canAccessDashboard) return <Blocked />;
 * ```
 */
export function useCanAccess(area: "dashboard" | "gamification" | "admin" | "feed"): boolean {
  const role = useStudentRole();

  const accessMatrix: Record<string, StudentRole[]> = {
    dashboard: ["aluno", "professor"],
    gamification: ["aluno"],
    admin: ["professor"],
    feed: ["aluno", "observador", "professor"],
  };

  if (!role) return false;
  return accessMatrix[area]?.includes(role) ?? false;
}

/**
 * Retorna a página de destino após login baseado no papel do usuário.
 */
export function usePostLoginRoute(): string {
  const role = useStudentRole();

  switch (role) {
    case "aluno":
      return "/dashboard";
    case "observador":
      return "/feed";
    case "professor":
      return "/will";
    default:
      return "/dashboard";
  }
}
