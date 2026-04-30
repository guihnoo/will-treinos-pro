import type { AppConfig, StudentProfileEditPolicy } from "@/context/types";

const DEFAULT_POLICY: StudentProfileEditPolicy = {
  phone: true,
  email: true,
  instagram: true,
  notes: true,
  avatar: true,
};

/** Política efetiva: admin pode desligar campos; omitido = liberado. */
export function resolveStudentProfilePolicy(config: AppConfig): StudentProfileEditPolicy {
  return { ...DEFAULT_POLICY, ...(config.studentProfilePolicy ?? {}) };
}
