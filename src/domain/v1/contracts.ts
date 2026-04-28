export type TenantStatus = "active" | "suspended";
export type AppRole = "will_owner" | "professor" | "student" | "lead";
export type UserStatus = "invited" | "pending_approval" | "active" | "blocked";
export type AuthProvider = "email" | "google" | "apple" | "facebook";

export type InviteType = "student_invite" | "professor_invite" | "lead_experimental";
export type InviteStatus = "active" | "expired" | "revoked";

export type SessionType = "group" | "vip" | "experimental";
export type SessionStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type EnrollmentStatus = "enrolled" | "waitlist" | "removed";
export type CheckInStatusV1 = "pending" | "approved" | "rejected";
export type PresenceStatus = "present" | "absent" | "late" | "excused";

export type EvaluationScope = "individual" | "collective" | "both";
export type EvaluationTargetType = "individual_student" | "collective_group";
export type EvaluationVisibility = "private_individual" | "group_collective";
export type CriterionDimension = "tecnica" | "tatica" | "fisico" | "mental" | "disciplina" | "custom";
export type TrendDirection = "up" | "stable" | "down";

export type BillingMode = "monthly" | "weekly" | "per_class";
export type PaymentMethod = "pix" | "card" | "cash" | "transfer" | "custom";
export type InvoiceStatus = "pending" | "paid" | "late" | "cancelled";

export type LeadStatus = "new" | "contacted" | "trial_scheduled" | "trial_done" | "converted" | "lost";
export type LeadChannel = "whatsapp" | "call" | "email" | "in_app";

export interface TenantV1 {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserV1 {
  id: string;
  tenantId: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  authProvider: AuthProvider;
  providerUid?: string;
  role: AppRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileV1 {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  birthDate?: string;
  instagram?: string;
  notesPrivate?: string;
}

export interface ClassSessionV1 {
  id: string;
  tenantId: string;
  title: string;
  professorUserId: string;
  groupId?: string;
  startsAt: string;
  endsAt: string;
  sessionType: SessionType;
  status: SessionStatus;
  createdByUserId: string;
}

export interface EvaluationTemplateV1 {
  id: string;
  tenantId: string;
  name: string;
  scope: EvaluationScope;
  isDefault: boolean;
  createdByUserId: string;
}

export interface EvaluationCriterionV1 {
  id: string;
  templateId: string;
  name: string;
  dimension: CriterionDimension;
  weight: number;
  scaleMin: number;
  scaleMax: number;
  orderIndex: number;
  isRequired: boolean;
}

export interface SessionEvaluationV1 {
  id: string;
  tenantId: string;
  sessionId: string;
  evaluatorUserId: string;
  targetType: EvaluationTargetType;
  targetStudentUserId?: string;
  targetGroupId?: string;
  templateId: string;
  officialScore: number;
  visibilityScope: EvaluationVisibility;
  summaryFeedback: string;
  coachNote?: string;
  createdAt: string;
}

export interface SessionEvaluationItemV1 {
  id: string;
  evaluationId: string;
  criterionId: string;
  scoreRaw: number;
  weightApplied: number;
  scoreWeighted: number;
  comment?: string;
}

export interface StudentSelfReviewV1 {
  id: string;
  tenantId: string;
  sessionId: string;
  studentUserId: string;
  intensity: number;
  technique: number;
  didactics: number;
  selfProgress: number;
  mood: "excelente" | "bom" | "cansativo" | "dificil";
  comment?: string;
  createdAt: string;
}

export interface LeadV1 {
  id: string;
  tenantId: string;
  fullName: string;
  phone?: string;
  email?: string;
  source: string;
  status: LeadStatus;
  assignedToUserId?: string;
  createdAt: string;
}
