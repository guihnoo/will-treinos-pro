"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Loader2, Sparkles, Users, Star, Zap,
  Send, CheckCircle2, RefreshCw, Newspaper,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { LessonRecapResult } from "@/app/api/ai/lesson-recap/route";
import type { Lesson, Student } from "@/context/types";
import { useToast } from "@/components/Toast";
import { useFeed } from "@/context/FeedContext";

interface Props {
  lesson: Lesson;
  students: Student[];
  onClose: () => void;
}

export default function LessonRecapPanel({ lesson, students, onClose }: Props) {
  const { toast } = useToast();
  const { addPost } = useFeed();
  const [recap, setRecap]       = useState<LessonRecapResult | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [postText, setPostText] = useState("");
  const [posting, setPosting]   = useState(false);
  const [posted, setPosted]     = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabaseClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) throw new Error("Sem sessão");

      const presentNames = lesson.presentStudents
        .map(id => students.find(s => s.id === id)?.name?.split(" ")[0] ?? "")
        .filter(Boolean)
        .slice(0, 6);

      const res = await fetch("/api/ai/lesson-recap", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          lessonId:           lesson.id,
          lessonTitle:        lesson.title || "Aula",
          date:               lesson.date,
          presentCount:       lesson.presentStudents.length,
          enrolledCount:      lesson.enrolledStudents.length,
          presentStudentNames: presentNames,
        }),
      });

      if (!res.ok) throw new Error("Erro ao gerar recap");
      const data = await res.json() as LessonRecapResult;
      setRecap(data);
      setPostText(data.suggestedPost ?? "");
    } catch (e) {
      setError(String(e).replace("Error: ", ""));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [lesson.id]);

  async function handlePost() {
    if (!postText.trim() || posting || posted) return;
    setPosting(true);
    try {
      await addPost({
        user: { name: "Will Treinos PRO", avatar: "coach", isPro: true },
        time: "agora",
        content: postText.trim(),
        media: null,
        likes: 0,
        comments: [],
        isLiked: false,
        isSaved: false,
        pinned: false,
        isOfficial: true,
      });
      setPosted(true);
      toast("📣 Post publicado na Rede!");
    } catch {
      toast("Erro ao publicar. Tente novamente.", "error");
    } finally {
      setPosting(false);
    }
  }

  const attendancePct  = recap?.attendanceRate ?? 0;
  const attendColor    = attendancePct >= 80 ? "text-emerald-400" : attendancePct >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[230] bg-black/80 backdrop-blur-sm flex items-end justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl border-t border-x border-zinc-800 bg-[#0a0a0a] pb-safe"
        style={{ maxHeight: "90dvh", display: "flex", flexDirection: "column" }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-zinc-700" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/35 bg-violet-500/10">
              <Sparkles size={17} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Recap da Aula</h2>
              <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{lesson.title || "Aula"} · {lesson.date.split("-").reverse().join("/")}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={onClose} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-14">
              <Sparkles size={28} className="text-violet-400 animate-pulse" />
              <p className="text-xs text-zinc-500">Gerando recap com IA…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm font-bold text-zinc-400">{error}</p>
              <button onClick={load} className="text-xs text-violet-400 font-bold underline">Tentar novamente</button>
            </div>
          )}

          {!loading && recap && (
            <>
              {/* KPI strip */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Users,  label: "Presença",   value: `${recap.presentCount}/${recap.enrolledCount}`, sub: `${attendancePct}%`, color: attendColor },
                  { icon: Star,   label: "Nota média",  value: recap.avgScore !== null ? `${recap.avgScore}/10` : "—", sub: `${recap.evalCount} aval.`, color: "text-amber-400" },
                  { icon: Zap,    label: "XP distr.",   value: recap.xpDistributed >= 1000 ? `${(recap.xpDistributed/1000).toFixed(1)}k` : String(recap.xpDistributed), sub: "total", color: "text-[#EAB308]" },
                ].map(({ icon: Icon, label, value, sub, color }) => (
                  <div key={label} className="flex flex-col items-center gap-0.5 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 py-3 px-2">
                    <Icon size={14} className={color} />
                    <p className={`text-base font-black ${color}`}>{value}</p>
                    <p className="text-[9px] text-zinc-600 uppercase tracking-wide">{sub}</p>
                    <p className="text-[9px] text-zinc-600">{label}</p>
                  </div>
                ))}
              </div>

              {/* Highlights */}
              {recap.highlights.length > 0 && (
                <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Destaques da Aula</p>
                  {recap.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-zinc-300">{h}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Summary */}
              {recap.aiSummary && (
                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={12} className="text-violet-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">Análise IA</p>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{recap.aiSummary}</p>
                  {recap.topStudentName && (
                    <p className="text-[11px] text-amber-400 font-bold mt-2">
                      ⭐ Destaque do dia: {recap.topStudentName}
                    </p>
                  )}
                </div>
              )}

              {/* Post to feed */}
              <div className="rounded-2xl border border-[#EAB308]/20 bg-[#EAB308]/5 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Newspaper size={12} className="text-[#EAB308]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#EAB308]">Publicar na Rede</p>
                </div>
                <textarea
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                  rows={3}
                  maxLength={300}
                  disabled={posted}
                  className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-xs text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-amber-500/40 disabled:opacity-50 transition-colors"
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePost}
                  disabled={!postText.trim() || posting || posted}
                  className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl border border-[#EAB308]/40 bg-[#EAB308]/15 py-2.5 text-xs font-black text-amber-200 hover:bg-[#EAB308]/25 disabled:opacity-40 transition-colors"
                >
                  {posted ? <><CheckCircle2 size={13} /> Publicado!</> :
                   posting ? <><Loader2 size={13} className="animate-spin" /> Publicando…</> :
                   <><Send size={13} /> Publicar na Rede</>}
                </motion.button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
