/**
 * Shared constants, pure functions and animation variants used across
 * StudentHome, StudentHomePrimaryModals, StudentAgendaPanel and related files.
 * Keep this file free of JSX / React so it can be a plain .ts module.
 */
import type { CardTier } from "@/context/types";

// ─── Motivational quotes ─────────────────────────────────────────────────────
export const SPORTS_QUOTES = [
  { text: "Eu posso aceitar o fracasso — todos falham em alguma coisa. Mas não consigo aceitar não tentar.", author: "Michael Jordan", role: "Basketball" },
  { text: "O sucesso não é acidental. É trabalho duro, perseverança, aprendizado, sacrifício e, acima de tudo, amor pelo que você faz.", author: "Pelé", role: "Futebol" },
  { text: "Você tem que esperar. A vitória não vem de graça.", author: "Giba", role: "Vôlei" },
  { text: "A diferença entre o impossível e o possível está na determinação.", author: "Tommy Lasorda", role: "Coach Lendário" },
  { text: "Dor é temporária. Desistir dura para sempre.", author: "Lance Armstrong", role: "Ciclismo" },
  { text: "Campeões treinam quando os outros descansam.", author: "Anônimo", role: "Alto Nível" },
  { text: "O corpo conquista o que a mente acredita.", author: "Jim Evans", role: "Coach" },
  { text: "Não existe talento aqui. Isso é trabalho duro. Isso é obsessão.", author: "Conor McGregor", role: "MMA" },
  { text: "O único treino ruim é o que não aconteceu.", author: "Anônimo", role: "Fitness" },
  { text: "Grandes resultados exigem grandes ambições.", author: "Heráclito", role: "Filosofia" },
  { text: "Se você quer algo que nunca teve, precisa fazer algo que nunca fez.", author: "Thomas Jefferson", role: "Liderança" },
  { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier", role: "Filosofia" },
  { text: "A conquista mais difícil é vencer a si mesmo.", author: "Aristóteles", role: "Filosofia" },
  { text: "Atletas de elite não nascem, são construídos treino a treino.", author: "Sheilla Castro", role: "Vôlei" },
  { text: "O maior rival não está do outro lado da rede. Está dentro de você.", author: "Anônimo", role: "Vôlei" },
  { text: "Primeiro você domina a técnica, depois a técnica domina o jogo.", author: "Bernardo Rezende", role: "Seleção Brasileira" },
  { text: "A consistência é o que transforma a média em excelência.", author: "Tony Robbins", role: "Alta Performance" },
  { text: "Não meça seu progresso pelos olhos dos outros. Meça pelo que você era ontem.", author: "Anônimo", role: "Mentalidade" },
  { text: "Quem não tem disciplina para treinar não terá escolha na hora do jogo.", author: "Vince Lombardi", role: "Football Americano" },
  { text: "Um campeão é alguém que se levanta quando não consegue mais.", author: "Jack Dempsey", role: "Boxe" },
  { text: "O que você faz quando ninguém está olhando determina quem você será.", author: "Anônimo", role: "Mentalidade Elite" },
  { text: "A preparação é a arma mais poderosa que um atleta possui.", author: "Murilo Endres", role: "Vôlei" },
  { text: "O treino de hoje é o desempenho de amanhã.", author: "Anônimo", role: "Performance" },
  { text: "A fadiga faz covardes de todos nós. Então fique em forma.", author: "Vince Lombardi", role: "Coach Lendário" },
  { text: "O hábito é o segundo instinto.", author: "Aristóteles", role: "Filosofia" },
  { text: "Treinar é difícil. Ganhar é ainda mais difícil. Desistir é impossível.", author: "Anônimo", role: "Esporte" },
  { text: "Disciplina é a ponte entre metas e conquistas.", author: "Jim Rohn", role: "Alta Performance" },
  { text: "Toda manhã que você treina, você está um passo à frente de quem ainda está dormindo.", author: "Anônimo", role: "Esporte" },
  { text: "Não importa quantas vezes você cai; o que importa é quantas vezes você se levanta.", author: "Vince Lombardi", role: "Football Americano" },
  { text: "Os detalhes fazem a diferença entre campeões.", author: "Giba", role: "Vôlei" },
] as const;

// ─── Achievement tracks ────────────────────────────────────────────────────────
export const ACHIEVEMENT_TRACKS = [
  {
    id: "consistency",
    label: "Trilha Consistência",
    desc: "Ritmo semanal, presença e sequência de treino.",
    accent: "#22C55E",
    goal: 74,
    requirements: ["Frequência >= 75%", "Sequência >= 5", "Consistência semanal >= 70%"],
    action: "Garanta presença nos próximos 2 treinos sem quebrar sequência.",
  },
  {
    id: "technical",
    label: "Trilha Técnica",
    desc: "Qualidade da execução validada em feedback.",
    accent: "#EAB308",
    goal: 76,
    requirements: ["Nota média >= 7.5", "Feedback técnico estável", "Sem regressão nas últimas sessões"],
    action: "Atuar no principal ponto de melhoria da sessão anterior.",
  },
  {
    id: "fundamentals",
    label: "Trilha Fundamentos",
    desc: "Evolução equilibrada em saque, recepção, levantamento, ataque, bloqueio e defesa.",
    accent: "#60A5FA",
    goal: 72,
    requirements: ["Média dos fundamentos >= 72", "Pelo menos 3 fundamentos em alta", "Sem fundamento crítico em queda"],
    action: "Treinar fundamento mais fraco antes da próxima aula.",
  },
  {
    id: "competitive",
    label: "Trilha Competitiva",
    desc: "Disciplina + técnica + execução em contexto real.",
    accent: "#A78BFA",
    goal: 82,
    requirements: ["Merit score >= 82", "Taxa de execução semanal >= 80%", "Check-in e feedback em dia"],
    action: "Executar semana completa com check-in e plano técnico aplicado.",
  },
] as const;

/** The union of all track ids */
export type AchievementTrackId = (typeof ACHIEVEMENT_TRACKS)[number]["id"];

/** Runtime-enriched track (after score calculation) */
export type AchievementTrackWithScore = (typeof ACHIEVEMENT_TRACKS)[number] & {
  score: number;
  unlocked: boolean;
  progress: number;
  missing: number;
};

// ─── Week day labels ───────────────────────────────────────────────────────────
export const DAY = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

// ─── Score colour helper ───────────────────────────────────────────────────────
export const scoreColor = (s: number) =>
  s >= 8 ? "#22C55E" : s >= 6 ? "#EAB308" : "#EF4444";

// ─── Volleyball fundamentals ───────────────────────────────────────────────────
export const FUNDAMENTALS = [
  { id: "serve",   label: "Saque",         keys: ["saque", "servico", "serviço", "serve"] },
  { id: "receive", label: "Recepção",       keys: ["recepcao", "recepção", "passe", "pass"] },
  { id: "set",     label: "Levantamento",   keys: ["levantamento", "set", "distribuicao", "distribuição"] },
  { id: "attack",  label: "Ataque",         keys: ["ataque", "spike", "finalizacao", "finalização"] },
  { id: "block",   label: "Bloqueio",       keys: ["bloqueio", "block"] },
  { id: "defense", label: "Defesa",         keys: ["defesa", "dig", "cobertura"] },
] as const;

// ─── Avatar resolver ───────────────────────────────────────────────────────────
export function resolveAvatarSrc(avatar: string | null | undefined, fallbackSeed: string): string {
  if (!avatar) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${fallbackSeed}`;
  if (
    avatar.startsWith("data:") ||
    avatar.startsWith("http://") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("/")
  )
    return avatar;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar}`;
}

// ─── Lesson type styles ────────────────────────────────────────────────────────
export const WEEK_STYLE: Record<
  string,
  { label: string; cardClass: string; badge: string; timeClass: string; accent: string }
> = {
  individual: {
    label: "Técnica",
    cardClass: "bg-gradient-to-br from-sky-500/25 via-sky-600/10 to-black/50 border-sky-400/35 shadow-[0_12px_40px_rgba(14,165,233,0.12)]",
    badge: "border-sky-400/50 bg-sky-500/15 text-sky-100",
    timeClass: "text-sky-100/95",
    accent: "rgba(56,189,248,0.75)",
  },
  dupla: {
    label: "Técnica",
    cardClass: "bg-gradient-to-br from-cyan-500/20 via-sky-900/20 to-black/50 border-cyan-400/30 shadow-[0_12px_40px_rgba(6,182,212,0.1)]",
    badge: "border-cyan-400/45 bg-cyan-500/10 text-cyan-50",
    timeClass: "text-cyan-100/95",
    accent: "rgba(34,211,238,0.8)",
  },
  grupo: {
    label: "Tático",
    cardClass: "bg-gradient-to-br from-violet-600/35 via-fuchsia-900/20 to-black/55 border-violet-500/35 shadow-[0_12px_44px_rgba(124,58,237,0.16)]",
    badge: "border-violet-400/45 bg-violet-500/15 text-violet-100",
    timeClass: "text-violet-100/95",
    accent: "rgba(167,139,250,0.85)",
  },
  performance: {
    label: "Físico",
    cardClass: "bg-gradient-to-br from-red-500/30 via-rose-900/20 to-black/50 border-red-500/35 shadow-[0_12px_44px_rgba(239,68,68,0.14)]",
    badge: "border-red-400/50 bg-red-500/12 text-red-100",
    timeClass: "text-red-100/95",
    accent: "rgba(248,113,113,0.9)",
  },
  "kids-sub10": {
    label: "Recovery",
    cardClass: "bg-gradient-to-br from-emerald-500/25 via-emerald-900/15 to-black/50 border-emerald-400/35 shadow-[0_12px_40px_rgba(16,185,129,0.12)]",
    badge: "border-emerald-400/45 bg-emerald-500/12 text-emerald-100",
    timeClass: "text-emerald-100/95",
    accent: "rgba(52,211,153,0.85)",
  },
  "kids-sub13": {
    label: "Recovery",
    cardClass: "bg-gradient-to-br from-emerald-500/25 via-teal-900/20 to-black/50 border-emerald-400/32 shadow-[0_12px_40px_rgba(16,185,129,0.1)]",
    badge: "border-emerald-400/45 bg-emerald-500/10 text-emerald-100",
    timeClass: "text-emerald-100/95",
    accent: "rgba(45,212,191,0.8)",
  },
  "kids-sub15": {
    label: "Recovery",
    cardClass: "bg-gradient-to-br from-green-500/22 via-emerald-950/25 to-black/50 border-green-500/30 shadow-[0_12px_40px_rgba(34,197,94,0.1)]",
    badge: "border-green-400/45 bg-green-500/10 text-green-100",
    timeClass: "text-green-100/95",
    accent: "rgba(74,222,128,0.85)",
  },
  vip: {
    label: "VIP",
    cardClass: "bg-gradient-to-br from-amber-500/20 via-violet-700/20 to-black/55 border-amber-400/35 shadow-[0_12px_44px_rgba(234,179,8,0.1)]",
    badge: "border-amber-300/50 bg-amber-500/10 text-amber-100",
    timeClass: "text-amber-100/95",
    accent: "rgba(250,204,21,0.75)",
  },
};

export function getWeekStyle(categoryId: string) {
  return (
    WEEK_STYLE[categoryId] ?? {
      label: "Treino",
      cardClass: "bg-zinc-950/50 border-white/[0.08]",
      badge: "border-zinc-600 bg-zinc-900/60 text-zinc-200",
      timeClass: "text-zinc-200",
      accent: "rgba(161,161,170,0.7)",
    }
  );
}

// ─── Card tier meta ────────────────────────────────────────────────────────────
export const TIER_META: Record<CardTier, { emoji: string; label: string; color: string; gradient: string }> = {
  bronze:   { emoji: "🥉", label: "Bronze",   color: "#CD7F32", gradient: "from-amber-700 to-amber-600" },
  prata:    { emoji: "🥈", label: "Prata",    color: "#C0C0C0", gradient: "from-gray-400 to-gray-300" },
  ouro:     { emoji: "🥇", label: "Ouro",     color: "#FFD700", gradient: "from-yellow-400 to-yellow-300" },
  diamante: { emoji: "💎", label: "Diamante", color: "#00CED1", gradient: "from-cyan-400 to-blue-400" },
  elite:    { emoji: "👑", label: "Elite",    color: "#FF1493", gradient: "from-purple-500 to-pink-500" },
};

// ─── Framer Motion list animation variants ─────────────────────────────────────
export const homeList = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.065, delayChildren: 0.05 },
  },
};

export const homeItem = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 30 },
  },
};
