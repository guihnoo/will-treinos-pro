export type ColumnSpec = {
  type: string;
  required: boolean;
  unique?: boolean;
  default?: string;
  references?: string;
  notes?: string;
};

export type TableSpec = {
  table: string;
  columns: Record<string, ColumnSpec>;
  compositeUniques?: string[][];
  recommendedIndexes?: string[][];
};

export const SCHEMA_READY_V1: TableSpec[] = [
  {
    table: "tenants",
    columns: {
      id: { type: "uuid", required: true, unique: true },
      slug: { type: "varchar(120)", required: true, unique: true },
      name: { type: "varchar(180)", required: true },
      owner_user_id: { type: "uuid", required: true, references: "users.id" },
      status: { type: "enum(active,suspended)", required: true, default: "active" },
      created_at: { type: "timestamp", required: true, default: "now()" },
      updated_at: { type: "timestamp", required: true, default: "now()" },
    },
    recommendedIndexes: [["status"]],
  },
  {
    table: "users",
    columns: {
      id: { type: "uuid", required: true, unique: true },
      tenant_id: { type: "uuid", required: true, references: "tenants.id" },
      email: { type: "varchar(190)", required: true },
      phone: { type: "varchar(30)", required: false },
      password_hash: { type: "varchar(255)", required: false },
      auth_provider: { type: "enum(email,google,apple,facebook)", required: true },
      provider_uid: { type: "varchar(190)", required: false },
      role: { type: "enum(will_owner,professor,student,lead)", required: true },
      status: { type: "enum(invited,pending_approval,active,blocked)", required: true, default: "pending_approval" },
      created_at: { type: "timestamp", required: true, default: "now()" },
      updated_at: { type: "timestamp", required: true, default: "now()" },
    },
    compositeUniques: [["tenant_id", "email"]],
    recommendedIndexes: [["tenant_id", "role"], ["tenant_id", "status"]],
  },
  {
    table: "class_sessions",
    columns: {
      id: { type: "uuid", required: true, unique: true },
      tenant_id: { type: "uuid", required: true, references: "tenants.id" },
      title: { type: "varchar(180)", required: true },
      professor_user_id: { type: "uuid", required: true, references: "users.id" },
      group_id: { type: "uuid", required: false, references: "groups.id" },
      starts_at: { type: "timestamp", required: true },
      ends_at: { type: "timestamp", required: true },
      session_type: { type: "enum(group,vip,experimental)", required: true },
      status: { type: "enum(scheduled,in_progress,completed,cancelled)", required: true, default: "scheduled" },
      created_by_user_id: { type: "uuid", required: true, references: "users.id" },
    },
    recommendedIndexes: [["tenant_id", "starts_at"], ["tenant_id", "professor_user_id", "starts_at"]],
  },
  {
    table: "session_evaluations",
    columns: {
      id: { type: "uuid", required: true, unique: true },
      tenant_id: { type: "uuid", required: true, references: "tenants.id" },
      session_id: { type: "uuid", required: true, references: "class_sessions.id" },
      evaluator_user_id: { type: "uuid", required: true, references: "users.id" },
      target_type: { type: "enum(individual_student,collective_group)", required: true },
      target_student_user_id: { type: "uuid", required: false, references: "users.id" },
      target_group_id: { type: "uuid", required: false, references: "groups.id" },
      template_id: { type: "uuid", required: true, references: "evaluation_templates.id" },
      official_score: { type: "numeric(5,2)", required: true },
      visibility_scope: { type: "enum(private_individual,group_collective)", required: true },
      summary_feedback: { type: "text", required: true },
      coach_note: { type: "text", required: false },
      created_at: { type: "timestamp", required: true, default: "now()" },
    },
    recommendedIndexes: [["tenant_id", "target_student_user_id", "created_at"], ["tenant_id", "session_id"]],
  },
  {
    table: "billing_profiles",
    columns: {
      id: { type: "uuid", required: true, unique: true },
      tenant_id: { type: "uuid", required: true, references: "tenants.id" },
      student_user_id: { type: "uuid", required: true, references: "users.id" },
      billing_mode: { type: "enum(monthly,weekly,per_class)", required: true },
      base_amount: { type: "numeric(10,2)", required: true },
      currency: { type: "varchar(8)", required: true, default: "BRL" },
      due_day: { type: "smallint", required: false },
      preferred_method: { type: "enum(pix,card,cash,transfer,custom)", required: true, default: "pix" },
      status: { type: "enum(active,paused,cancelled)", required: true, default: "active" },
    },
    compositeUniques: [["tenant_id", "student_user_id"]],
    recommendedIndexes: [["tenant_id", "status"]],
  },
  {
    table: "leads",
    columns: {
      id: { type: "uuid", required: true, unique: true },
      tenant_id: { type: "uuid", required: true, references: "tenants.id" },
      full_name: { type: "varchar(180)", required: true },
      phone: { type: "varchar(30)", required: false },
      email: { type: "varchar(190)", required: false },
      source: { type: "varchar(100)", required: true },
      status: { type: "enum(new,contacted,trial_scheduled,trial_done,converted,lost)", required: true, default: "new" },
      assigned_to_user_id: { type: "uuid", required: false, references: "users.id" },
      created_at: { type: "timestamp", required: true, default: "now()" },
    },
    recommendedIndexes: [["tenant_id", "status"], ["tenant_id", "created_at"]],
  },
];
