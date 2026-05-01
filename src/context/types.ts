export type Role = "admin" | "coach" | "aluno" | null;
export type StudentStatus = "active" | "pending" | "suspended" | "trial";
export type PaymentStatus = "paid" | "pending" | "late";
export type LessonStatus = "scheduled" | "in-progress" | "completed" | "cancelled";
export type LessonType = "Individual" | "Dupla" | "Trio" | "Grupo";

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  /** Present when session comes from Supabase (admin tooling / impersonation). */
  email?: string;
  /** Supabase auth.users.id — stable across impersonation; use for storage keys when id is CRM student id. */
  authSubjectId?: string;
}

export interface Venue {
  id: string; name: string; photo: string; address: string;
  lat: number; lng: number;
}

export interface WorkHours { start: string; end: string; }

export interface LessonCategory {
  id: string; name: string; color: string; emoji: string;
  maxStudents: number; defaultPrice: number; isCustom: boolean;
}

export interface Student {
  id: string;
  /** When set, ties this row to Supabase Auth (auth.users.id). */
  authUserId?: string | null;
  name: string; phone: string; email: string; avatar: string; instagram: string;
  status: StudentStatus; plan: string; monthlyValue: number; paymentDay: number;
  categories: string[]; joinedAt: string; frequency: number; totalClasses: number; notes: string;
  professorNotes?: string;   // renamed from medicalNotes — set by admin/professor only, student reads only
  attendanceHistory?: { date: string; status: 'present' | 'absent' }[];
}

// ─── Check-in System ────────────────────────────────────────────────────────
// Flow: student arrives → requestCheckIn → professor approves → class ends
export type CheckInStatus = "pending" | "approved" | "rejected";

export interface CheckInRequest {
  studentId: string;
  arrivedAt: string;      // ISO timestamp — set when student taps "Chegou"
  approvedAt?: string;    // ISO timestamp — set when professor approves
  approvedBy?: string;    // Professor's user ID
  finishedAt?: string;    // ISO timestamp — set when professor ends class
  duration?: number;      // Minutes of effective class time
  status: CheckInStatus;
}

export interface Lesson {
  id: string; categoryId: string; title: string; date: string;
  startTime: string; endTime: string; maxStudents: number;
  lessonType?: LessonType;
  locationUrl?: string;
  enrolledStudents: string[]; presentStudents: string[]; absentStudents: string[];
  waitlist?: string[];
  status: LessonStatus; venueId: string; notes: string;
  isTrial?: boolean;
  // Professional check-in system
  checkInRequests?: CheckInRequest[];
}

export interface Payment {
  id: string; studentId: string; amount: number; dueDate: string;
  paidDate: string | null; status: PaymentStatus; method: string | null; reference: string;
  /** Aluno registra texto / referência do comprovante PIX (Will confirma "Pago" no painel admin). */
  studentProofNote?: string;
  studentProofSubmittedAt?: string | null;
  /** URL assinada/pública do comprovante armazenado no Supabase Storage. */
  studentProofDataUrl?: string;
  studentProofFileName?: string;
  studentProofMime?: string;
}

export interface Notification {
  id: string; type: "new_student" | "payment_late" | "lesson_soon" | "performance" | "message" | "broadcast";
  title: string; message: string; time: string; read: boolean;
  studentId?: string;    // sobre quem é (admin)
  recipientId?: string;  // quem deve ver (aluno específico)
  isGlobal?: boolean;    // broadcast para todos
}

export interface PillarScores {
  fisico: number; tecnico: number; tatico: number; atitude: number; evolucao: number;
}

export interface PerformanceFeedback {
  id: string; lessonId: string; studentId: string; rating: number;
  trainingTime: number; trainingType: string;
  strengths: string[]; improvements: string[]; professorNote: string; date: string;
  pillarScores?: PillarScores;
}

export interface TrainingPlan {
  id: string; studentId: string; title: string;
  exercises: { name: string; sets: string; reps: string; rest?: string; notes: string }[];
  createdAt: string;
}

export interface QuickMessage {
  id: string; label: string; template: string;
  category: "reminder" | "payment" | "feedback" | "general";
}

export interface Post {
  id: string;
  user: { name: string; avatar: string; isPro: boolean };
  time: string;
  content: string;
  media: string | null;
  likes: number;
  comments: { user: string; avatar: string; text: string; time: string }[];
  isLiked: boolean;
  isSaved: boolean;
  pinned?: boolean;
  isOfficial?: boolean;
  targetRole?: "all" | "student" | "coach";
  deletedAt?: string | null;
}

// ─── Student Lesson Feedback ────────────────────────────────────────────────
// Students rate their own training session — feeds into professor performance analytics
export type TrainingMood = "excelente" | "bom" | "cansativo" | "dificil";

export interface LessonRating {
  id: string;
  lessonId: string;
  studentId: string;
  date: string;            // ISO date
  // Aspect ratings 1-5
  intensidade: number;
  tecnica: number;
  didatica: number;        // professor explanation quality
  evolucao: number;        // perceived personal improvement
  mood: TrainingMood;
  comment?: string;
  createdAt: string;       // ISO timestamp
}

// ─── App-wide Config (admin editable) ───────────────────────────────────────
export interface StudentProfileEditPolicy {
  phone: boolean;
  email: boolean;
  instagram: boolean;
  notes: boolean;
  avatar: boolean;
}

export interface AppConfig {
  pixKey: string;           // admin PIX key (email, CPF, phone, random)
  pixKeyType: "email" | "cpf" | "telefone" | "aleatoria";
  pixOwnerName: string;     // recipient name shown in PIX
  whatsappNumber: string;   // contact WhatsApp
  /** Slug em `/cadastro?invite=` — gerado automaticamente no cliente se vazio. */
  enrollmentInviteCode?: string;
  studentProfilePolicy?: Partial<StudentProfileEditPolicy>;
}
