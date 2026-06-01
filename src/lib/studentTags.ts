export const STUDENT_TAGS = {
  vip:       { label: "VIP",        color: "#EAB308", bg: "bg-amber-900/30",   border: "border-amber-600/50",   icon: "⭐" },
  destaque:  { label: "Destaque",   color: "#22C55E", bg: "bg-emerald-900/30", border: "border-emerald-600/50", icon: "🏆" },
  em_risco:  { label: "Em risco",   color: "#EF4444", bg: "bg-red-900/30",     border: "border-red-600/50",     icon: "⚠️" },
  iniciante: { label: "Iniciante",  color: "#60A5FA", bg: "bg-blue-900/30",    border: "border-blue-600/50",    icon: "🌱" },
  trial:     { label: "Trial",      color: "#A78BFA", bg: "bg-violet-900/30",  border: "border-violet-600/50",  icon: "🔎" },
} as const;

export type StudentTag = keyof typeof STUDENT_TAGS;
