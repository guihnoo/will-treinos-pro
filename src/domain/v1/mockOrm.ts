import type {
  LeadV1,
  ProfileV1,
  TenantV1,
  UserV1,
  SessionEvaluationV1,
  SessionEvaluationItemV1,
  EvaluationTemplateV1,
  EvaluationCriterionV1,
} from "./contracts";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_VENUES,
  DEFAULT_WORK_HOURS,
  MOCK_FEEDBACKS,
  MOCK_LESSONS,
  MOCK_NOTIFICATIONS,
  MOCK_PAYMENTS,
  MOCK_POSTS,
  MOCK_QUICK_MESSAGES,
  MOCK_STUDENTS,
  MOCK_TRAINING_PLANS,
} from "@/context/mockData";

const nowIso = new Date().toISOString();

export const OFFICIAL_TENANT_V1: TenantV1 = {
  id: "tenant_will_1",
  name: "Will Treinos",
  slug: "will-treinos",
  ownerUserId: "admin1",
  status: "active",
  createdAt: nowIso,
  updatedAt: nowIso,
};

export const USERS_V1: UserV1[] = [
  {
    id: "admin1",
    tenantId: OFFICIAL_TENANT_V1.id,
    email: "owner@willpro.app",
    authProvider: "email",
    role: "will_owner",
    status: "active",
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: "coach1",
    tenantId: OFFICIAL_TENANT_V1.id,
    email: "coach@willpro.app",
    authProvider: "email",
    role: "professor",
    status: "active",
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  ...MOCK_STUDENTS.map<UserV1>((student) => ({
    id: student.id,
    tenantId: OFFICIAL_TENANT_V1.id,
    email: student.email,
    phone: student.phone,
    authProvider: "email",
    role: "student",
    status: student.status === "active" ? "active" : "pending_approval",
    createdAt: student.joinedAt,
    updatedAt: nowIso,
  })),
];

export const PROFILES_V1: ProfileV1[] = USERS_V1.map((user) => {
  const student = MOCK_STUDENTS.find((s) => s.id === user.id);
  return {
    id: `profile_${user.id}`,
    userId: user.id,
    fullName: student?.name ?? (user.role === "will_owner" ? "Will Monteiro" : user.role === "professor" ? "Rafael Coach" : "Usuário"),
    avatarUrl: student?.avatar ?? (user.role === "will_owner" ? "Will" : user.role === "professor" ? "Coach" : undefined),
    instagram: student?.instagram,
    notesPrivate: student?.professorNotes,
  };
});

/** Hyper-realistic indoor volleyball + high-performance training templates (WILL Engine Room). */
export const EVALUATION_TEMPLATES_V1: EvaluationTemplateV1[] = [
  {
    id: "tpl_official_volley_v1",
    tenantId: OFFICIAL_TENANT_V1.id,
    name: "Protocolo Elite — Individual (Indoor)",
    scope: "individual",
    isDefault: true,
    createdByUserId: "admin1",
  },
  {
    id: "tpl_collective_6v6_v1",
    tenantId: OFFICIAL_TENANT_V1.id,
    name: "Protocolo Coletivo — 6x6 Alta Intensidade",
    scope: "collective",
    isDefault: false,
    createdByUserId: "admin1",
  },
];

export const EVALUATION_CRITERIA_V1: EvaluationCriterionV1[] = [
  {
    id: "crit_rec_press_flut",
    templateId: "tpl_official_volley_v1",
    name: "Recepção sob pressão com flutuação",
    dimension: "tecnica",
    weight: 0.18,
    scaleMin: 1,
    scaleMax: 10,
    orderIndex: 1,
    isRequired: true,
  },
  {
    id: "crit_plio_triple",
    templateId: "tpl_official_volley_v1",
    name: "Pliometria — triple extension e amortecimento",
    dimension: "fisico",
    weight: 0.12,
    scaleMin: 1,
    scaleMax: 10,
    orderIndex: 2,
    isRequired: true,
  },
  {
    id: "crit_block_read_51",
    templateId: "tpl_official_volley_v1",
    name: "Leitura de bloqueio em sistema 5-1",
    dimension: "tatica",
    weight: 0.16,
    scaleMin: 1,
    scaleMax: 10,
    orderIndex: 3,
    isRequired: true,
  },
  {
    id: "crit_float_serve",
    templateId: "tpl_official_volley_v1",
    name: "Saque flutuante — zona de contato e trajetória",
    dimension: "tecnica",
    weight: 0.14,
    scaleMin: 1,
    scaleMax: 10,
    orderIndex: 4,
    isRequired: true,
  },
  {
    id: "crit_comm_court",
    templateId: "tpl_official_volley_v1",
    name: "Comunicação e chamada de bolas em transição",
    dimension: "mental",
    weight: 0.12,
    scaleMin: 1,
    scaleMax: 10,
    orderIndex: 5,
    isRequired: true,
  },
  {
    id: "crit_d_to_a",
    templateId: "tpl_official_volley_v1",
    name: "Transição defesa → ataque (primeiro passo e pipe)",
    dimension: "tatica",
    weight: 0.14,
    scaleMin: 1,
    scaleMax: 10,
    orderIndex: 6,
    isRequired: true,
  },
  {
    id: "crit_plan_exec",
    templateId: "tpl_official_volley_v1",
    name: "Disciplina de execução do plano de sessão",
    dimension: "disciplina",
    weight: 0.14,
    scaleMin: 1,
    scaleMax: 10,
    orderIndex: 7,
    isRequired: true,
  },
  {
    id: "crit_colet_ritmo",
    templateId: "tpl_collective_6v6_v1",
    name: "Ritmo de jogo e continuidade do rally",
    dimension: "tatica",
    weight: 0.4,
    scaleMin: 1,
    scaleMax: 10,
    orderIndex: 1,
    isRequired: true,
  },
  {
    id: "crit_colet_def_com",
    templateId: "tpl_collective_6v6_v1",
    name: "Comunicação defensiva (M3 / cobertura)",
    dimension: "mental",
    weight: 0.3,
    scaleMin: 1,
    scaleMax: 10,
    orderIndex: 2,
    isRequired: true,
  },
  {
    id: "crit_colet_trans_off",
    templateId: "tpl_collective_6v6_v1",
    name: "Transições ofensivas (K2 / ataque rápido)",
    dimension: "tatica",
    weight: 0.3,
    scaleMin: 1,
    scaleMax: 10,
    orderIndex: 3,
    isRequired: true,
  },
];

export const SESSION_EVALUATIONS_V1: SessionEvaluationV1[] = MOCK_FEEDBACKS.map((feedback) => ({
  id: `eval_${feedback.id}`,
  tenantId: OFFICIAL_TENANT_V1.id,
  sessionId: feedback.lessonId,
  evaluatorUserId: "coach1",
  targetType: "individual_student",
  targetStudentUserId: feedback.studentId,
  templateId: "tpl_official_volley_v1",
  officialScore: feedback.rating * 10,
  visibilityScope: "private_individual",
  summaryFeedback: feedback.professorNote,
  coachNote: feedback.professorNote,
  createdAt: `${feedback.date}T12:00:00.000Z`,
}));

export const SESSION_EVALUATION_ITEMS_V1: SessionEvaluationItemV1[] = SESSION_EVALUATIONS_V1.flatMap((evaluation) =>
  EVALUATION_CRITERIA_V1.map((criterion) => ({
    id: `item_${evaluation.id}_${criterion.id}`,
    evaluationId: evaluation.id,
    criterionId: criterion.id,
    scoreRaw: Number((evaluation.officialScore / 10).toFixed(2)),
    weightApplied: criterion.weight,
    scoreWeighted: Number(((evaluation.officialScore / 10) * criterion.weight).toFixed(2)),
  })),
);

export const LEADS_V1: LeadV1[] = MOCK_STUDENTS.filter((s) => s.status === "pending" || s.status === "trial").map((s) => ({
  id: `lead_${s.id}`,
  tenantId: OFFICIAL_TENANT_V1.id,
  fullName: s.name,
  phone: s.phone,
  email: s.email,
  source: "instagram_bio",
  status: s.status === "trial" ? "trial_scheduled" : "new",
  assignedToUserId: "admin1",
  createdAt: `${s.joinedAt}T12:00:00.000Z`,
}));

// Legacy bridge: AppContext still expects these names while backend contracts are migrated.
export const LEGACY_BRIDGE = {
  DEFAULT_VENUES,
  DEFAULT_WORK_HOURS,
  DEFAULT_CATEGORIES,
  MOCK_STUDENTS,
  MOCK_LESSONS,
  MOCK_PAYMENTS,
  MOCK_NOTIFICATIONS,
  MOCK_QUICK_MESSAGES,
  MOCK_POSTS,
  MOCK_FEEDBACKS,
  MOCK_TRAINING_PLANS,
};
