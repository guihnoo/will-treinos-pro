import { Venue, WorkHours, LessonCategory, Student, Lesson, Payment, Notification, QuickMessage, Post } from "./types";

const T = "2026-04-22";

export const DEFAULT_VENUES: Venue[] = [
  { id: "v1", name: "Quadra Central Will Treinos", photo: "", address: "Av. das Américas, 3000 - Barra da Tijuca, RJ", lat: -22.9989, lng: -43.3650 },
  { id: "v2", name: "Arena Beach Vôlei", photo: "", address: "Praia da Barra, Posto 5 - Rio de Janeiro, RJ", lat: -23.0110, lng: -43.3620 },
  { id: "v3", name: "Ginásio Municipal", photo: "", address: "R. Sérgio Porto, 100 - Humaitá, RJ", lat: -22.9554, lng: -43.1983 },
];

export const DEFAULT_WORK_HOURS: WorkHours = { start: "06:00", end: "22:00" };

export const DEFAULT_CATEGORIES: LessonCategory[] = [
  { id: "individual", name: "Individual", color: "#EAB308", emoji: "🏐", maxStudents: 1, defaultPrice: 150, isCustom: false },
  { id: "dupla", name: "Dupla", color: "#06B6D4", emoji: "👫", maxStudents: 2, defaultPrice: 120, isCustom: false },
  { id: "grupo", name: "Grupo", color: "#8B5CF6", emoji: "👨‍👩‍👧‍👦", maxStudents: 15, defaultPrice: 80, isCustom: false },
  { id: "kids-sub10", name: "Kids Sub-10", color: "#22C55E", emoji: "👶", maxStudents: 12, defaultPrice: 60, isCustom: false },
  { id: "kids-sub13", name: "Kids Sub-13", color: "#10B981", emoji: "👶", maxStudents: 12, defaultPrice: 65, isCustom: false },
  { id: "kids-sub15", name: "Kids Sub-15", color: "#059669", emoji: "👶", maxStudents: 12, defaultPrice: 70, isCustom: false },
  { id: "performance", name: "Performance", color: "#EF4444", emoji: "⚡", maxStudents: 8, defaultPrice: 200, isCustom: false },
  { id: "vip", name: "vip", color: "#F97316", emoji: "🚀", maxStudents: 6, defaultPrice: 180, isCustom: false },
];

export const MOCK_STUDENTS: Student[] = [
  { id: "s1", name: "Ricardo Alves", phone: "(21)99876-5432", email: "ricardo@email.com", avatar: "Ricardo", instagram: "@Ricardo", status: "active", plan: "Performance Mensal", monthlyValue: 200, paymentDay: 10, categories: ["performance","vip"], joinedAt: "2025-08-15", frequency: 92, totalClasses: 48, notes: "Focado em competição estadual", professorNotes: "Joelho direito sensível — evitar sobrecarga em saltos. Priorizar técnica de aterrissagem.", attendanceHistory: [{date: "2026-04-18", status: "present"}, {date: "2026-04-19", status: "present"}, {date: "2026-04-20", status: "absent"}, {date: "2026-04-21", status: "present"}, {date: "2026-04-22", status: "present"}] },
  { id: "s2", name: "Camila Santos", phone: "(21)99765-4321", email: "camila@email.com", avatar: "Camila", instagram: "@Camila", status: "active", plan: "Grupo Mensal", monthlyValue: 80, paymentDay: 5, categories: ["grupo"], joinedAt: "2025-10-01", frequency: 88, totalClasses: 35, notes: "", attendanceHistory: [{date: "2026-04-18", status: "present"}, {date: "2026-04-19", status: "absent"}, {date: "2026-04-20", status: "absent"}, {date: "2026-04-21", status: "present"}, {date: "2026-04-22", status: "present"}] },
  { id: "s3", name: "Bruno Torres", phone: "(21)99654-3210", email: "bruno@email.com", avatar: "Bruno", instagram: "@Bruno", status: "active", plan: "Performance", monthlyValue: 200, paymentDay: 15, categories: ["performance","grupo"], joinedAt: "2025-06-20", frequency: 95, totalClasses: 60, notes: "Capitão do time" },
  { id: "s4", name: "Juliana Mendes", phone: "(21)99543-2109", email: "juliana@email.com", avatar: "Juliana", instagram: "@Juliana", status: "active", plan: "Dupla", monthlyValue: 120, paymentDay: 10, categories: ["dupla"], joinedAt: "2025-11-10", frequency: 78, totalClasses: 22, notes: "Treina com Carla" },
  { id: "s5", name: "Carla Pereira", phone: "(21)99432-1098", email: "carla@email.com", avatar: "Carla", instagram: "@Carla", status: "active", plan: "Dupla", monthlyValue: 120, paymentDay: 10, categories: ["dupla"], joinedAt: "2025-11-10", frequency: 80, totalClasses: 22, notes: "Treina com Juliana" },
  { id: "s6", name: "Lucas Ferreira", phone: "(21)99321-0987", email: "lucas@email.com", avatar: "Lucas", instagram: "@Lucas", status: "active", plan: "Grupo Mensal", monthlyValue: 80, paymentDay: 20, categories: ["grupo"], joinedAt: "2026-01-05", frequency: 70, totalClasses: 18, notes: "" },
  { id: "s7", name: "Ana Oliveira", phone: "(21)99210-9876", email: "ana@email.com", avatar: "Ana", instagram: "@Ana", status: "pending", plan: "Trial", monthlyValue: 0, paymentDay: 1, categories: [], joinedAt: "2026-04-20", frequency: 0, totalClasses: 0, notes: "Aguardando aprovação" },
  { id: "s8", name: "Pedro Souza", phone: "(21)99109-8765", email: "pedro@email.com", avatar: "Pedro", instagram: "@Pedro", status: "pending", plan: "Trial", monthlyValue: 0, paymentDay: 1, categories: [], joinedAt: "2026-04-21", frequency: 0, totalClasses: 0, notes: "Indicação do Ricardo" },
  { id: "s9", name: "Marina Costa", phone: "(21)98998-7654", email: "marina@email.com", avatar: "Marina", instagram: "@Marina", status: "active", plan: "Individual", monthlyValue: 150, paymentDay: 8, categories: ["individual"], joinedAt: "2025-09-01", frequency: 85, totalClasses: 40, notes: "Foco em defesa e recepção" },
  { id: "s10", name: "Thiago Lima", phone: "(21)98887-6543", email: "thiago@email.com", avatar: "Thiago", instagram: "@Thiago", status: "active", plan: "Performance", monthlyValue: 200, paymentDay: 12, categories: ["performance"], joinedAt: "2025-07-15", frequency: 90, totalClasses: 55, notes: "Levantador titular" },
  { id: "s11", name: "Sofia Martins", phone: "(21)98776-5432", email: "sofia@email.com", avatar: "Sofia", instagram: "@Sofia", status: "active", plan: "Kids Sub-10", monthlyValue: 60, paymentDay: 5, categories: ["kids-sub10"], joinedAt: "2026-02-01", frequency: 95, totalClasses: 12, notes: "10 anos, muito talentosa" },
  { id: "s12", name: "Gabriel Rocha", phone: "(21)98665-4321", email: "gabriel@email.com", avatar: "Gabriel", instagram: "@Gabriel", status: "suspended", plan: "Grupo Mensal", monthlyValue: 80, paymentDay: 15, categories: ["grupo"], joinedAt: "2025-05-10", frequency: 40, totalClasses: 30, notes: "Inadimplente há 3 meses" },
  { id: "s13", name: "Isabela Nunes", phone: "(21)98554-3210", email: "isabela@email.com", avatar: "Isabela", instagram: "@Isabela", status: "active", plan: "vip Mensal", monthlyValue: 180, paymentDay: 1, categories: ["vip"], joinedAt: "2025-12-01", frequency: 88, totalClasses: 25, notes: "Atleta federada — ataque" },
  { id: "s14", name: "Rafael Dias", phone: "(21)98443-2109", email: "rafael@email.com", avatar: "Rafael", instagram: "@Rafael", status: "pending", plan: "Trial", monthlyValue: 0, paymentDay: 1, categories: [], joinedAt: "2026-04-22", frequency: 0, totalClasses: 0, notes: "Veio do Instagram" },
  { id: "s15", name: "Beatriz Campos", phone: "(21)98332-1098", email: "beatriz@email.com", avatar: "Beatriz", instagram: "@Beatriz", status: "trial", plan: "Trial", monthlyValue: 0, paymentDay: 1, categories: ["grupo"], joinedAt: "2026-04-18", frequency: 100, totalClasses: 2, notes: "Aula experimental" },
  { id: "s16", name: "Diego Fernandes", phone: "(21)98221-0987", email: "diego@email.com", avatar: "Diego", instagram: "@Diego", status: "active", plan: "Kids Sub-13", monthlyValue: 65, paymentDay: 10, categories: ["kids-sub13"], joinedAt: "2026-01-15", frequency: 82, totalClasses: 15, notes: "12 anos, central promissor" },
  { id: "s17", name: "Larissa Vieira", phone: "(21)98110-9876", email: "larissa@email.com", avatar: "Larissa", instagram: "@Larissa", status: "active", plan: "Individual", monthlyValue: 150, paymentDay: 20, categories: ["individual","grupo"], joinedAt: "2025-11-01", frequency: 75, totalClasses: 28, notes: "Foco em saque e bloqueio" },
  { id: "s18", name: "Matheus Araújo", phone: "(21)97999-8765", email: "matheus@email.com", avatar: "Matheus", instagram: "@Matheus", status: "active", plan: "vip Mensal", monthlyValue: 180, paymentDay: 5, categories: ["vip","performance"], joinedAt: "2025-10-15", frequency: 93, totalClasses: 38, notes: "Líbero — reflexos excepcionais" },
  { id: "s19", name: "Fernanda Gomes", phone: "(21)97888-7654", email: "fernanda@email.com", avatar: "Fernanda", instagram: "@Fernanda", status: "active", plan: "Kids Sub-15", monthlyValue: 70, paymentDay: 8, categories: ["kids-sub15"], joinedAt: "2026-03-01", frequency: 90, totalClasses: 8, notes: "14 anos, ponteira" },
  { id: "s20", name: "Vinícius Barros", phone: "(21)97777-6543", email: "vinicius@email.com", avatar: "Vinicius", instagram: "@Vinicius", status: "active", plan: "Grupo Mensal", monthlyValue: 80, paymentDay: 15, categories: ["grupo"], joinedAt: "2026-02-10", frequency: 68, totalClasses: 10, notes: "Iniciante dedicado" },
];

// Individual classes show student name in title
const HOJE = new Date().toISOString().split("T")[0];
const d = (offset: number) => { const d = new Date(); d.setDate(d.getDate()+offset); return d.toISOString().split("T")[0]; };

export const MOCK_LESSONS: Lesson[] = [
  // ─ Aulas de HOJE (scheduled) ─
  { id: "l6", categoryId: "performance", title: "⚡ Performance Manhã", date: HOJE, startTime: "07:00", endTime: "08:30", maxStudents: 8, enrolledStudents: ["s1","s3","s10","s18"], presentStudents: [], absentStudents: [], waitlist: [], status: "scheduled", venueId: "v1", notes: "Foco em transição de bloqueio para ataque" },
  { id: "l7", categoryId: "grupo", title: "👨‍👩‍👧‍👦 Turma Elite A", date: HOJE, startTime: "08:30", endTime: "10:00", maxStudents: 15, enrolledStudents: ["s2","s3","s6","s15","s20"], presentStudents: [], absentStudents: [], waitlist: [], status: "scheduled", venueId: "v1", notes: "" },
  { id: "l8", categoryId: "vip", title: "🚀 VIP Avançado", date: HOJE, startTime: "20:00", endTime: "22:00", maxStudents: 6, enrolledStudents: ["s13","s1","s18"], presentStudents: [], absentStudents: [], waitlist: [], status: "scheduled", venueId: "v2", notes: "Ataque rápido e defesa de líbero" },
  { id: "l1", categoryId: "individual", title: "🏐 Individual — Marina Costa", date: HOJE, startTime: "07:00", endTime: "08:00", maxStudents: 1, enrolledStudents: ["s9"], presentStudents: [], absentStudents: [], waitlist: [], status: "scheduled", venueId: "v1", notes: "Foco em recepção" },
  // ─ Próximos dias (futuros para s1 aparecer na semana) ─
  { id: "lf1", categoryId: "performance", title: "⚡ Performance — Terça", date: d(2), startTime: "07:00", endTime: "08:30", maxStudents: 8, enrolledStudents: ["s1","s3","s10"], presentStudents: [], absentStudents: [], waitlist: [], status: "scheduled", venueId: "v1", notes: "" },
  { id: "lf2", categoryId: "vip", title: "🚀 VIP Noturno", date: d(3), startTime: "20:00", endTime: "22:00", maxStudents: 6, enrolledStudents: ["s1","s13","s18"], presentStudents: [], absentStudents: [], waitlist: [], status: "scheduled", venueId: "v2", notes: "" },
  { id: "lf3", categoryId: "performance", title: "⚡ Performance — Quinta", date: d(4), startTime: "07:00", endTime: "08:30", maxStudents: 8, enrolledStudents: ["s1","s3","s10","s18"], presentStudents: [], absentStudents: [], waitlist: [], status: "scheduled", venueId: "v1", notes: "" },
  { id: "lf4", categoryId: "vip", title: "🏆 VIP Sexta", date: d(5), startTime: "19:00", endTime: "21:00", maxStudents: 6, enrolledStudents: ["s1","s13","s18"], presentStudents: [], absentStudents: [], waitlist: [], status: "scheduled", venueId: "v2", notes: "" },
  // ─ Outros alunos (diversos dias) ─
  { id: "l3", categoryId: "dupla", title: "👫 Fundamentos — Juliana & Carla", date: HOJE, startTime: "10:30", endTime: "11:30", maxStudents: 2, enrolledStudents: ["s4","s5"], presentStudents: [], absentStudents: [], waitlist: [], status: "scheduled", venueId: "v2", notes: "" },
  { id: "l4", categoryId: "kids-sub10", title: "👶 Kids Sub-10", date: HOJE, startTime: "14:00", endTime: "15:00", maxStudents: 12, enrolledStudents: ["s11"], presentStudents: [], absentStudents: [], waitlist: [], status: "scheduled", venueId: "v1", notes: "" },
  { id: "l5", categoryId: "kids-sub13", title: "👶 Kids Sub-13", date: d(1), startTime: "15:00", endTime: "16:00", maxStudents: 12, enrolledStudents: ["s16"], presentStudents: [], absentStudents: [], waitlist: [], status: "scheduled", venueId: "v1", notes: "" },
  { id: "l10", categoryId: "kids-sub15", title: "👶 Kids Sub-15", date: d(2), startTime: "14:00", endTime: "15:30", maxStudents: 12, enrolledStudents: ["s19"], presentStudents: [], absentStudents: [], waitlist: [], status: "scheduled", venueId: "v3", notes: "" },
  { id: "l9", categoryId: "grupo", title: "👨‍👩‍👧‍👦 Turma Noturna B", date: d(1), startTime: "20:30", endTime: "22:00", maxStudents: 15, enrolledStudents: ["s2","s6","s13","s17","s20"], presentStudents: [], absentStudents: [], waitlist: [], status: "scheduled", venueId: "v1", notes: "" },
  // ─ Aulas PASSADAS de Ricardo (completed) — destrava badges e streak ─
  { id: "lp1", categoryId: "performance", title: "⚡ Performance — Historial", date: "2026-04-22", startTime: "07:00", endTime: "08:30", maxStudents: 8, enrolledStudents: ["s1","s3","s10"], presentStudents: ["s1","s3","s10"], absentStudents: [], waitlist: [], status: "completed", venueId: "v1", notes: "" },
  { id: "lp2", categoryId: "vip", title: "🚀 VIP — Historial", date: "2026-04-21", startTime: "20:00", endTime: "22:00", maxStudents: 6, enrolledStudents: ["s1","s13","s18"], presentStudents: ["s1","s13","s18"], absentStudents: [], waitlist: [], status: "completed", venueId: "v2", notes: "" },
  { id: "lp3", categoryId: "performance", title: "⚡ Performance — Historial", date: "2026-04-19", startTime: "07:00", endTime: "08:30", maxStudents: 8, enrolledStudents: ["s1","s3","s10"], presentStudents: ["s1","s3","s10"], absentStudents: [], waitlist: [], status: "completed", venueId: "v1", notes: "" },
  { id: "lp4", categoryId: "vip", title: "🚀 VIP — Historial", date: "2026-04-17", startTime: "20:00", endTime: "22:00", maxStudents: 6, enrolledStudents: ["s1","s13","s18"], presentStudents: ["s1","s13","s18"], absentStudents: [], waitlist: [], status: "completed", venueId: "v2", notes: "" },
  { id: "lp5", categoryId: "performance", title: "⚡ Performance — Historial", date: "2026-04-15", startTime: "07:00", endTime: "08:30", maxStudents: 8, enrolledStudents: ["s1","s3","s10"], presentStudents: ["s1","s3","s10"], absentStudents: [], waitlist: [], status: "completed", venueId: "v1", notes: "" },
  { id: "lp6", categoryId: "vip", title: "🚀 VIP — Historial", date: "2026-04-12", startTime: "20:00", endTime: "22:00", maxStudents: 6, enrolledStudents: ["s1","s13","s18"], presentStudents: ["s1","s13","s18"], absentStudents: [], waitlist: [], status: "completed", venueId: "v2", notes: "" },
  { id: "lp7", categoryId: "performance", title: "⚡ Performance — Historial", date: "2026-04-10", startTime: "07:00", endTime: "08:30", maxStudents: 8, enrolledStudents: ["s1","s3","s10"], presentStudents: ["s1","s3","s10"], absentStudents: [], waitlist: [], status: "completed", venueId: "v1", notes: "" },
  { id: "lp8", categoryId: "vip", title: "🚀 VIP — Historial", date: "2026-04-08", startTime: "20:00", endTime: "22:00", maxStudents: 6, enrolledStudents: ["s1","s13","s18"], presentStudents: ["s1","s13","s18"], absentStudents: [], waitlist: [], status: "completed", venueId: "v2", notes: "" },
];


export const MOCK_PAYMENTS: Payment[] = [
  // ─ s1 = Ricardo Alves — histórico completo para testar financeiro ─
  { id: "p1",  studentId: "s1", amount: 200, dueDate: "2026-04-10", paidDate: "2026-04-09", status: "paid", method: "pix", reference: "ABR/26" },
  { id: "p1b", studentId: "s1", amount: 200, dueDate: "2026-03-10", paidDate: "2026-03-09", status: "paid", method: "pix", reference: "MAR/26" },
  { id: "p1c", studentId: "s1", amount: 200, dueDate: "2026-02-10", paidDate: "2026-02-08", status: "paid", method: "pix", reference: "FEV/26" },
  { id: "p1d", studentId: "s1", amount: 200, dueDate: "2026-05-10", paidDate: null, status: "pending", method: null, reference: "MAI/26" },
  // ─ Demais alunos ─
  { id: "p2", studentId: "s2", amount: 80, dueDate: "2026-04-05", paidDate: "2026-04-05", status: "paid", method: "pix", reference: "ABR/26" },
  { id: "p3", studentId: "s3", amount: 200, dueDate: "2026-04-15", paidDate: null, status: "pending", method: null, reference: "ABR/26" },
  { id: "p4", studentId: "s4", amount: 120, dueDate: "2026-04-10", paidDate: null, status: "late", method: null, reference: "ABR/26" },
  { id: "p5", studentId: "s5", amount: 120, dueDate: "2026-04-10", paidDate: null, status: "late", method: null, reference: "ABR/26" },
  { id: "p6", studentId: "s6", amount: 80, dueDate: "2026-04-20", paidDate: null, status: "pending", method: null, reference: "ABR/26" },
  { id: "p7", studentId: "s9", amount: 150, dueDate: "2026-04-08", paidDate: "2026-04-07", status: "paid", method: "pix", reference: "ABR/26" },
  { id: "p8", studentId: "s10", amount: 200, dueDate: "2026-04-12", paidDate: null, status: "late", method: null, reference: "ABR/26" },
  { id: "p9", studentId: "s11", amount: 60, dueDate: "2026-04-05", paidDate: "2026-04-04", status: "paid", method: "pix", reference: "ABR/26" },
  { id: "p10", studentId: "s12", amount: 80, dueDate: "2026-01-15", paidDate: null, status: "late", method: null, reference: "JAN/26" },
  { id: "p11", studentId: "s13", amount: 180, dueDate: "2026-04-01", paidDate: "2026-04-01", status: "paid", method: "pix", reference: "ABR/26" },
  { id: "p12", studentId: "s16", amount: 65, dueDate: "2026-04-10", paidDate: "2026-04-10", status: "paid", method: "pix", reference: "ABR/26" },
  { id: "p13", studentId: "s17", amount: 150, dueDate: "2026-04-20", paidDate: null, status: "pending", method: null, reference: "ABR/26" },
  { id: "p14", studentId: "s18", amount: 180, dueDate: "2026-04-05", paidDate: "2026-04-04", status: "paid", method: "pix", reference: "ABR/26" },
  { id: "p15", studentId: "s19", amount: 70, dueDate: "2026-04-08", paidDate: "2026-04-08", status: "paid", method: "pix", reference: "ABR/26" },
  { id: "p16", studentId: "s20", amount: 80, dueDate: "2026-04-15", paidDate: null, status: "late", method: null, reference: "ABR/26" },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  // Admin-only (studentId = sobre quem é, sem recipientId)
  { id: "n1", type: "new_student", title: "Nova inscrição", message: "Ana Oliveira se cadastrou e aguarda aprovação.", time: "2h", read: false, studentId: "s7" },
  { id: "n2", type: "new_student", title: "Nova inscrição", message: "Pedro Souza — indicação do Ricardo Alves.", time: "5h", read: false, studentId: "s8" },
  { id: "n3", type: "payment_late", title: "Pagamento atrasado", message: "Juliana Mendes — 12 dias de atraso (R$120).", time: "1d", read: false, studentId: "s4" },
  { id: "n4", type: "payment_late", title: "Pagamento atrasado", message: "Thiago Lima — 10 dias de atraso (R$200).", time: "1d", read: true, studentId: "s10" },
  { id: "n6", type: "new_student", title: "Nova inscrição", message: "Rafael Dias se cadastrou pelo Instagram.", time: "12h", read: false, studentId: "s14" },
  { id: "n7", type: "performance", title: "Destaque de Performance", message: "Bruno Torres — recorde pessoal no salto vertical!", time: "1d", read: true, studentId: "s3" },
  // Broadcast global (isGlobal = true: todos os roles vêem)
  { id: "n_g1", type: "broadcast", title: "🏆 Torneio em Maio!", message: "Will Treinos participará do Torneio Carioca 2026. Confirme presença com o professor!", time: "3h", read: false, isGlobal: true },
  { id: "n_g2", type: "broadcast", title: "Recesso de Feriado", message: "Não haverá aulas nos dias 01 e 02 de maio. Bom feriado a todos! 🏄", time: "1d", read: true, isGlobal: true },
  // Privadas para Ricardo (s1) — recipientId: s1
  { id: "n_s1a", type: "lesson_soon", title: "Aula em 30min 💨", message: "Treino Performance às 07:00 — Quadra Central. Boa ativação!", time: "30min", read: false, recipientId: "s1" },
  { id: "n_s1b", type: "performance", title: "Nova avaliação recebida ⭐", message: "O professor Will avaliou seu desempenho no treino de Quarta. Confira!", time: "2d", read: false, recipientId: "s1" },
  { id: "n_s1c", type: "message", title: "Mensagem do Professor", message: "Ricardo, seu saque viagem melhorou muito! Continue focado no estadual 🏆", time: "3d", read: true, recipientId: "s1" },
  { id: "n_s1d", type: "payment_late", title: "Mensalidade em dia ✅", message: "Pagamento de Abril confirmado via PIX. Obrigado!", time: "5d", read: true, recipientId: "s1" },
];


export const MOCK_QUICK_MESSAGES: QuickMessage[] = [
  { id: "qm1", label: "Lembrete de Aula", template: "Olá {nome}! 🏐 Lembrando que sua aula de {categoria} é amanhã às {horario}. Te espero na quadra!", category: "reminder" },
  { id: "qm2", label: "Pagamento Pendente", template: "Oi {nome}, tudo bem? Seu pagamento de R$ {valor} referente a {referencia} está pendente. Pode regularizar via PIX? 🙏", category: "payment" },
  { id: "qm3", label: "Feedback Positivo", template: "Parabéns {nome}! Seu desempenho na aula de hoje foi excelente. Continue assim!", category: "feedback" },
  { id: "qm4", label: "Falta na Aula", template: "Oi {nome}, sentimos sua falta hoje! Tudo bem? Vamos agendar reposição? 💪", category: "reminder" },
  { id: "qm5", label: "Boas-vindas", template: "Bem-vindo(a) ao Will Treinos, {nome}! 🏐 Sua inscrição foi aprovada. Bora marcar a primeira aula?", category: "general" },
  { id: "qm6", label: "Pagamento Atrasado", template: "Olá {nome}. O pagamento de {referencia} (R$ {valor}) está em atraso. Precisa de ajuda? 😊", category: "payment" },
];

export const MOCK_POSTS: Post[] = [
  {
    id: "p1",
    user: { name: "Will Monteiro", avatar: "Will", isPro: true },
    time: "2h",
    content: "Análise biomecânica do salto para ataque melhorou muito na Elite hoje. Foco no penúltimo passo explosivo fez toda a diferença na impulsão vertical. 🏐\n\nParabéns Bruno e Ricardo pelo esforço!",
    media: "https://images.unsplash.com/photo-1592656094267-764a45160876?q=80&w=1000&auto=format&fit=crop",
    likes: 124,
    comments: [
      { user: "Bruno Torres", avatar: "Bruno", text: "Valeu, Will! Sensação de vip no ataque hoje 🚀", time: "1h" },
      { user: "Ricardo Alves", avatar: "Ricardo", text: "Melhor treino do mês! 💪", time: "45min" },
      { user: "Isabela Nunes", avatar: "Isabela", text: "Quero esse treino na próxima VIP!", time: "30min" },
    ],
    isLiked: true, isSaved: false,
  },
  {
    id: "p2",
    user: { name: "Bruno Torres", avatar: "Bruno", isPro: false },
    time: "4h",
    content: "PR novo no salto vertical! 85cm — nível absurdo. A periodização de potência do Will entregou exatamente o que prometeu. Foco no estadual agora! 💪🏐",
    media: null,
    likes: 85,
    comments: [
      { user: "Will Monteiro", avatar: "Will", text: "Orgulho do capitão! Vamos buscar esse título 🏆", time: "3h" },
    ],
    isLiked: false, isSaved: false,
  },
  {
    id: "p_ricardo",
    user: { name: "Ricardo Alves", avatar: "Ricardo", isPro: false },
    time: "1h",
    content: "Mais uma sessão de Performance concluída! Saque viagem caindo dentro toda vez. O estadual tá chegando e a preparação tá no nível certo. Obrigado @WillMonteiro pela metodologia de elite! 🏆🏐\n\n#WillTreinos #Estadual2026 #Volei",
    media: null,
    likes: 42,
    comments: [
      { user: "Will Monteiro", avatar: "Will", text: "Tá na hora do título, capitao! Bora com tudo.", time: "45min" },
      { user: "Bruno Torres", avatar: "Bruno", text: "Vai é nós! Juntos no estadual 🏆", time: "30min" },
    ],
    isLiked: false, isSaved: false,
  },
  {
    id: "p3",
    user: { name: "Camila Santos", avatar: "Camila", isPro: false },
    time: "6h",
    content: "Primeiro bloqueio duplo certeiro na vida! 🙌 Obrigada Will pela paciência nos fundamentos. A turma Elite é incrível!",
    media: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=1000&auto=format&fit=crop",
    likes: 67,
    comments: [
      { user: "Juliana Mendes", avatar: "Juliana", text: "Boa Cami!! Aula nível elite.", time: "5h" },
    ],
    isLiked: false, isSaved: true,
  },
  {
    id: "p4",
    user: { name: "Will Monteiro", avatar: "Will", isPro: true },
    time: "1d",
    content: "Kids Sub-10 mostrando que o futuro do vôlei brasileiro está garantido! Sofia com um manchete perfeito no treino de hoje. 👶🏐\n\n#WillTreinos #FuturoDoVolei",
    media: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop",
    likes: 203,
    comments: [
      { user: "Marina Costa", avatar: "Marina", text: "Que linda! O futuro é delas! ❤️", time: "23h" },
      { user: "Thiago Lima", avatar: "Thiago", text: "Inspiração pra gente também 💪", time: "20h" },
    ],
    isLiked: true, isSaved: false,
  },
];

export const MOCK_STORIES = [
  { id: "st1", name: "Will", avatar: "Will", hasNew: true, isPro: true },
  { id: "st2", name: "Bruno", avatar: "Bruno", hasNew: true, isPro: false },
  { id: "st3", name: "Camila", avatar: "Camila", hasNew: true, isPro: false },
  { id: "st4", name: "Ricardo", avatar: "Ricardo", hasNew: true, isPro: false },
  { id: "st5", name: "Isabela", avatar: "Isabela", hasNew: true, isPro: false },
  { id: "st6", name: "Marina", avatar: "Marina", hasNew: false, isPro: false },
  { id: "st7", name: "Thiago", avatar: "Thiago", hasNew: true, isPro: false },
];

// ─── Rich feedbacks for s1 (Ricardo Alves) — for student dashboard testing ───
import type { PerformanceFeedback, TrainingPlan } from "./types";

export const MOCK_FEEDBACKS: PerformanceFeedback[] = [
  {
    id: "fb1", lessonId: "l6", studentId: "s1", rating: 7, trainingTime: 90,
    trainingType: "Treino Performance",
    strengths: ["Saque Viagem", "Bloqueio"], improvements: ["Recepção"],
    professorNote: "Bom treino Ricardo. Saque viagem evoluindo muito, foco na recepção para completar o jogo.",
    date: "2026-04-08",
    pillarScores: { fisico: 8, tecnico: 7, tatico: 6, atitude: 9, evolucao: 7 }
  },
  {
    id: "fb2", lessonId: "l6", studentId: "s1", rating: 8, trainingTime: 90,
    trainingType: "Treino Performance",
    strengths: ["Saque Viagem", "Atitude", "Bloqueio"], improvements: ["Posicionamento Tático"],
    professorNote: "Excelente evolução! O salto aumentou 3cm desde o mês passado. Continua focado.",
    date: "2026-04-15",
    pillarScores: { fisico: 8, tecnico: 8, tatico: 7, atitude: 9, evolucao: 8 }
  },
  {
    id: "fb3", lessonId: "l8", studentId: "s1", rating: 9, trainingTime: 120,
    trainingType: "VIP Avançado",
    strengths: ["Saque Viagem", "Ataque Cruzado", "Liderança", "Físico"], improvements: [],
    professorNote: "Ricardo no seu melhor nível! Pronto para o estadual. Orgulho do capitão.",
    date: "2026-04-20",
    pillarScores: { fisico: 9, tecnico: 9, tatico: 8, atitude: 10, evolucao: 9 }
  },
];

export const MOCK_TRAINING_PLANS: TrainingPlan[] = [
  {
    id: "tp1",
    studentId: "s1",
    title: "Condicionamento Para Estadual 🏆",
    createdAt: "2026-04-01",
    exercises: [
      { name: "Agachamento Explosivo", sets: "4", reps: "12", rest: "60s", notes: "Foco na explosão na subida — simular impulso de ataque" },
      { name: "Salto com Corda", sets: "3", reps: "2min", rest: "45s", notes: "Manter ritmo constante, sem pausas" },
      { name: "Pré-Saque: Rotação de Ombro", sets: "3", reps: "15", rest: "30s", notes: "Aquecimento do manõ de ataque" },
      { name: "Abdominal Prancha", sets: "3", reps: "45s", rest: "30s", notes: "Core ativo para estabilidade no salto" },
      { name: "Fundamento: Saque Viagem", sets: "5", reps: "10", rest: "90s", notes: "10 saques perfeitos por série — foco na trajetória" },
    ]
  },
  {
    id: "tp2",
    studentId: "s1",
    title: "Fundamentos Técnicos ⚡",
    createdAt: "2026-04-15",
    exercises: [
      { name: "Manchete Frontal", sets: "4", reps: "20", rest: "30s", notes: "Antebraços paralelos ao solo, contato no centro da bola" },
      { name: "Levantamento de Dedos", sets: "3", reps: "20", rest: "30s", notes: "Dedos firmes, bola no alto — foco em precisão" },
      { name: "Bloqueio com Passada", sets: "4", reps: "8", rest: "45s", notes: "Penúltimo passo explosivo, salto com braços estendidos" },
      { name: "Posicionamento Tático", sets: "3", reps: "15min", rest: "60s", notes: "Rotação de posições 1 a 6 com visualização da linha" },
    ]
  }
];
