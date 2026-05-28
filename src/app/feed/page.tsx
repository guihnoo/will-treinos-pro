"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Camera, Image as ImageIcon,
  BadgeCheck, Send, X, Bookmark, SmilePlus, Plus, CheckCircle2, MoreVertical, Pin, Trash2, Trophy, AlertTriangle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStudents } from "@/context/StudentsContext";
import { useCriticalData } from "@/context/CriticalDataContext";
import { useFeed } from "@/context/FeedContext";
import { useToast } from "@/components/Toast";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import AppEmptyState from "@/components/ui/AppEmptyState";
import AppSectionCard from "@/components/ui/AppSectionCard";
import AppPageHeader from "@/components/ui/AppPageHeader";
import { FOCUS_RING_GOLD, TOUCH_TARGET_MIN } from "@/components/ui/interactionTokens";
import { compressImageFileToDataUrl } from "@/lib/imageCompress";

function resolveStoryAvatarSrc(avatar: string): string {
  if (!avatar) return "https://api.dicebear.com/7.x/avataaars/svg?seed=user";
  if (
    avatar.startsWith("data:") ||
    avatar.startsWith("http://") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("/")
  ) {
    return avatar;
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatar)}`;
}

// ─── New Post Composer ───────────────────────────────────────────────────────
function PostComposer({
  user, onClose, onPublish, isAdminOfficialMode
}: {
  user: { name: string; avatar: string; role: string } | null;
  onClose: () => void;
  onPublish: (
    text: string,
    media: string | null,
    options?: { pinned?: boolean; isOfficial?: boolean; targetRole?: "all" | "student" | "coach" },
  ) => void;
  isAdminOfficialMode?: boolean;
}) {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [pinAsAnnouncement, setPinAsAnnouncement] = useState(false);
  const [targetRole, setTargetRole] = useState<"all" | "student" | "coach">("all");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  useBodyScrollLock(true);

  // Auto-focus textarea when modal opens
  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await compressImageFileToDataUrl(file);
      setPreviewImg(dataUrl);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível usar esta imagem.", "error");
    }
  };

  const handlePublish = async () => {
    if (!text.trim() && !previewImg) return;
    setPublishing(true);
    await new Promise(r => setTimeout(r, 600)); // brief animation delay
    onPublish(text, previewImg, {
      pinned: isAdminOfficialMode ? pinAsAnnouncement : false,
      isOfficial: Boolean(isAdminOfficialMode),
      targetRole: isAdminOfficialMode ? targetRole : "all",
    });
    setPublishing(false);
  };

  const canPost = !!(text.trim() || previewImg);
  const ctaClass = `${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD}`;
  const roleBadge = user?.role === "admin" ? "👑 Admin" : user?.role === "coach" ? "🏐 Coach" : null;

  return (
    <>
      {/* Hidden inputs OUTSIDE the modal backdrop */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        data-modal-overlay
        aria-label="Novo post na Rede"
        className="fixed inset-0 z-[200] overflow-y-auto overscroll-y-contain bg-black/90 backdrop-blur-md flex flex-col justify-end"
        onClick={onClose}>

        <motion.div
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="mt-auto min-h-0 w-full bg-[#0A0A0A] border-t border-zinc-800 rounded-t-3xl flex flex-col max-h-[92dvh] shadow-[0_-24px_80px_rgba(0,0,0,0.55)]">

          {/* Handle */}
          <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3 border-b border-zinc-900 bg-[#0A0A0A]/95 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <img
                src={resolveStoryAvatarSrc(user?.avatar || "")}
                alt=""
                className="w-9 h-9 rounded-full border border-zinc-700 object-cover"
              />
              <div>
                <p className="text-sm font-bold text-white">{user?.name}</p>
                {roleBadge && <p className="text-[10px] text-[#EAB308] font-bold">{roleBadge}</p>}
              </div>
            </div>
            <button onClick={onClose} className={`h-10 w-10 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-900 ${ctaClass}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Text area */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="O que está rolando na quadra? 🏐"
              rows={4}
              className="w-full bg-transparent text-white placeholder-zinc-600 border-none outline-none resize-none text-[16px] leading-relaxed"
            />
            {isAdminOfficialMode && (
              <div className="mt-3 rounded-2xl border border-yellow-500/35 bg-yellow-500/5 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-yellow-300">Comunicado Oficial 📢</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPinAsAnnouncement((v) => !v)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${pinAsAnnouncement ? "border-yellow-400/60 bg-yellow-500/20 text-yellow-200" : "border-zinc-700 bg-zinc-900 text-zinc-300"} ${ctaClass}`}>
                    📌 Fixar como anúncio
                  </button>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as "all" | "student" | "coach")}
                    className={`rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-zinc-200 ${ctaClass}`}>
                    <option value="all">Todos</option>
                    <option value="student">Apenas Alunos</option>
                    <option value="coach">Apenas Professores</option>
                  </select>
                </div>
              </div>
            )}

            {/* Image preview */}
            <AnimatePresence>
              {previewImg && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative mt-3 rounded-2xl overflow-hidden border border-zinc-800">
                  <img src={previewImg} className="w-full max-h-56 object-cover" />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setPreviewImg(null)}
                    className={`absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white border border-zinc-700 ${ctaClass}`}>
                    <X className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom bar */}
          <div className="sticky bottom-0 z-20 flex items-center justify-between px-5 py-4 border-t border-zinc-900 bg-[#0A0A0A]/95 backdrop-blur-sm flex-shrink-0 gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.85 }}
                onClick={() => fileRef.current?.click()}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-bold hover:border-[#EAB308]/50 transition-colors ${ctaClass}`}>
                <ImageIcon className="w-4 h-4 text-[#EAB308]" /> Galeria
              </motion.button>
              <motion.button whileTap={{ scale: 0.85 }}
                onClick={() => cameraRef.current?.click()}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-bold hover:border-[#EAB308]/50 transition-colors ${ctaClass}`}>
                <Camera className="w-4 h-4 text-[#EAB308]" /> Câmera
              </motion.button>
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handlePublish}
              disabled={!canPost || publishing}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex-shrink-0 ${
                canPost && !publishing
                  ? "bg-[#EAB308] text-black shadow-[0_0_20px_rgba(234,179,8,0.25)]"
                  : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
              } ${ctaClass}`}>
              {publishing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}>
                  <CheckCircle2 className="w-4 h-4" />
                </motion.div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              {publishing ? "Publicando..." : "Publicar"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

// ─── Main Feed Page ──────────────────────────────────────────────────────────
export default function FeedPage() {
  const {
    posts,
    addPost,
    togglePostLike,
    addPostComment,
    moderatePost,
    softDeletePost,
  } = useFeed();
  const { user, usingSupabaseSession } = useAuth();
  const { students } = useStudents();
  const { criticalDataError, retryCriticalDataSync } = useCriticalData();
  const { toast } = useToast();
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [doubleTapId, setDoubleTapId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<string | null>(null);
  const [alertPostId, setAlertPostId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState("");
  const tapRef = useRef<Record<string, number>>({});
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reactionPicker, setReactionPicker] = useState<string | null>(null);
  const [postReactions, setPostReactions] = useState<Record<string, string>>({});
  const isAdmin = user?.role === "admin";

  const REACTIONS = ["❤️", "🔥", "💪", "🏐", "👏"] as const;

  const startLongPress = (postId: string) => {
    longPressRef.current = setTimeout(() => {
      setReactionPicker(postId);
      if (navigator.vibrate) navigator.vibrate(25);
    }, 420);
  };
  const cancelLongPress = () => {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
  };
  const handleReactionSelect = (postId: string, emoji: string) => {
    setPostReactions(p => ({ ...p, [postId]: emoji }));
    setReactionPicker(null);
    togglePostLike(postId);
    if (navigator.vibrate) navigator.vibrate([12, 8, 18]);
  };
  const visiblePosts = useMemo(() => {
    if (!user) return posts;
    return posts.filter((post) => {
      if (!post.targetRole || post.targetRole === "all") return true;
      if (post.targetRole === "student") return user.role === "aluno" || user.role === "admin";
      if (post.targetRole === "coach") return user.role === "coach" || user.role === "admin";
      return true;
    });
  }, [posts, user]);
  const liveStories = useMemo(() => {
    const seen = new Set<string>();
    return posts
      .filter((post) => post.user?.name && post.user?.avatar)
      .slice(0, 30)
      .filter((post) => {
        const key = `${post.user.name}::${post.user.avatar}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8)
      .map((post, idx) => ({
        id: `live-${idx}-${post.id}`,
        name: post.user.name,
        avatar: post.user.avatar,
        hasNew: idx < 3,
      }));
  }, [posts]);

  // Get student profile for avatar (may be custom photo)
  const profile = students.find(s => s.id === user?.id);
  const myAvatarSrc = resolveStoryAvatarSrc(profile?.avatar || user?.avatar || "");

  // Double-tap to like
  const handleTap = (postId: string) => {
    const now = Date.now();
    if (now - (tapRef.current[postId] || 0) < 350) {
      togglePostLike(postId);
      setDoubleTapId(postId);
      setTimeout(() => setDoubleTapId(null), 900);
    }
    tapRef.current[postId] = now;
  };

  const handlePublish = (
    text: string,
    media: string | null,
    options?: { pinned?: boolean; isOfficial?: boolean; targetRole?: "all" | "student" | "coach" },
  ) => {
    if (!text.trim() && !media) return;
    addPost({
      user: {
        name: user?.name || "Usuário",
        avatar: profile?.avatar || user?.avatar || "user",
        isPro: user?.role === "admin" || user?.role === "coach",
      },
      time: "agora",
      content: text,
      media,
      likes: 0,
      comments: [],
      isLiked: false,
      isSaved: false,
      pinned: options?.pinned ?? false,
      isOfficial: options?.isOfficial ?? false,
      targetRole: options?.targetRole ?? "all",
    });
    setShowComposer(false);
    toast("🏐 Post publicado na Rede!");
  };

  const addComment = (postId: string) => {
    const text = commentInputs[postId];
    if (!text?.trim()) return;
    addPostComment(postId, text, user?.name || "Você", profile?.avatar || user?.avatar || "user");
    setCommentInputs(p => ({ ...p, [postId]: "" }));
  };

  const ctaClass = `${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD}`;

  if (usingSupabaseSession && criticalDataError) {
    return (
      <div className="max-w-2xl mx-auto min-h-screen border-x border-zinc-900 px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
        <AppPageHeader
          title="Rede Will Treinos"
          subtitle="Falha de sincronização. Tente novamente sem recarregar."
          icon={SmilePlus}
        />
        <AppSectionCard title="Erro de sincronização" subtitle="Não foi possível carregar o feed ao vivo.">
          <p className="text-sm text-zinc-300">{criticalDataError}</p>
          <button
            type="button"
            onClick={() => void retryCriticalDataSync()}
            className={`mt-4 rounded-xl border border-red-300/35 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-200 hover:bg-red-500/15 ${ctaClass}`}
          >
            Tentar sincronizar novamente
          </button>
        </AppSectionCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto border-x border-zinc-900 min-h-screen relative pb-28" onClick={() => reactionPicker && setReactionPicker(null)}>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-900 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center justify-between">
        <div>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.18em]">Will Comunidade</p>
          <h1 className="text-xl font-black text-white">
            <span className="text-[#EAB308]">Rede</span> Will Treinos
          </h1>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Compartilhe treinos, evolução e rotina</p>
          {isAdmin ? (
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-yellow-200">
              <BadgeCheck className="h-3.5 w-3.5 text-[#EAB308]" />
              Moderação ativa (dono)
            </p>
          ) : null}
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowComposer(true)}
          className={`flex items-center gap-2 px-4 py-2 bg-[#EAB308] text-black rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(234,179,8,0.2)] ${ctaClass}`}>
          <Camera className="w-4 h-4" /> Postar
        </motion.button>
      </header>

      {/* Stories */}
      <div className="px-4 py-3 border-b border-zinc-900">
        <AppSectionCard
          title="Stories da Quadra"
          subtitle="Atalhos rápidos do que a turma está vivendo hoje."
          contentClassName="pt-3 px-0 pb-0"
          className="border-zinc-900/70 bg-transparent"
        >
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {/* My story */}
        <motion.div whileTap={{ scale: 0.95 }} onClick={() => setShowComposer(true)}
          className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 flex items-center justify-center relative">
            <img src={myAvatarSrc} className="w-full h-full rounded-full object-cover" />
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#EAB308] rounded-full flex items-center justify-center text-black text-xs font-bold shadow-lg">
              <Plus className="w-3 h-3" />
            </div>
          </div>
          <span className="text-[10px] text-zinc-500 font-medium">Você</span>
        </motion.div>

        {liveStories.map(s => (
          <motion.div key={s.id} whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0">
            <div className={`w-16 h-16 rounded-full p-[2px] ${s.hasNew ? "bg-gradient-to-br from-[#EAB308] to-[#F97316]" : "bg-zinc-800"}`}>
              <img src={resolveStoryAvatarSrc(s.avatar)}
                alt=""
                className="w-full h-full rounded-full border-2 border-black object-cover" />
            </div>
            <span className={`text-[10px] font-medium ${s.hasNew ? "text-white" : "text-zinc-500"}`}>{s.name}</span>
          </motion.div>
        ))}
          </div>
        </AppSectionCard>
      </div>

      {/* Feed Posts */}
      <div className="px-4 pt-3">
        <AppSectionCard
          title="Feed da Turma"
          subtitle="Atualizações da comunidade em tempo real."
          contentClassName="p-0 pt-3"
          className="border-zinc-900/70 bg-transparent"
        >
      <div className="flex flex-col">
        {visiblePosts.length === 0 && (
          <div className="px-4 py-12">
            <AppEmptyState
              icon={ImageIcon}
              title="Seja o primeiro a postar"
              description="Compartilhe seus treinos com a turma e movimente a comunidade."
              actionLabel="Criar primeiro post"
              onAction={() => setShowComposer(true)}
            />
          </div>
        )}

        {visiblePosts.map((post, i) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`border-b border-zinc-900 ${post.pinned ? "border border-yellow-500/40 bg-yellow-500/5 shadow-[0_0_18px_rgba(234,179,8,0.08)]" : ""}`}>

            {/* Post Header */}
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-full p-[1.5px] ${post.user.isPro ? "bg-gradient-to-br from-[#EAB308] to-[#F97316]" : "bg-zinc-800"}`}>
                  <img
                    src={resolveStoryAvatarSrc(post.user.avatar || "")}
                    alt=""
                    className="w-full h-full rounded-full border border-black object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-white text-sm">{post.user.name}</span>
                    {post.user.isPro && <BadgeCheck className="w-4 h-4 text-[#EAB308]" />}
                  </div>
                  <span className="text-xs text-zinc-500">{post.time}</span>
                </div>
                <div className="flex flex-col gap-1">
                  {post.pinned ? <span className="text-[10px] font-bold text-yellow-300">📌 Fixado</span> : null}
                  {post.isOfficial ? <span className="text-[10px] font-bold text-yellow-200">✅ Comunicado Oficial</span> : null}
                </div>
              </div>
              {isAdmin ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenMenuPostId((prev) => (prev === post.id ? null : post.id))}
                    className={`rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:text-white ${FOCUS_RING_GOLD}`}>
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  <AnimatePresence>
                    {openMenuPostId === post.id ? (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute right-0 top-11 z-20 w-52 rounded-xl border border-zinc-800 bg-black/95 p-1.5 shadow-2xl backdrop-blur-xl">
                        <button
                          type="button"
                          onClick={() => { moderatePost(post.id, { pinned: !post.pinned }); setOpenMenuPostId(null); toast(post.pinned ? "Post desafixado." : "Post fixado no topo."); }}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-zinc-200 hover:bg-zinc-900 ${FOCUS_RING_GOLD}`}>
                          <Pin className="h-4 w-4 text-yellow-300" /> {post.pinned ? "Desfixar post" : "Fixar post"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { moderatePost(post.id, { isOfficial: !post.isOfficial }); setOpenMenuPostId(null); toast(post.isOfficial ? "Removido selo oficial." : "Marcado como comunicado oficial."); }}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-zinc-200 hover:bg-zinc-900 ${FOCUS_RING_GOLD}`}>
                          <Trophy className="h-4 w-4 text-yellow-300" /> {post.isOfficial ? "Remover oficial" : "Marcar como oficial"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAlertPostId(post.id); setOpenMenuPostId(null); }}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-zinc-200 hover:bg-zinc-900 ${FOCUS_RING_GOLD}`}>
                          <AlertTriangle className="h-4 w-4 text-amber-300" /> Alertar usuário
                        </button>
                        <button
                          type="button"
                          onClick={() => { setConfirmDeletePostId(post.id); setOpenMenuPostId(null); }}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-red-300 hover:bg-red-500/10 ${FOCUS_RING_GOLD}`}>
                          <Trash2 className="h-4 w-4" /> Remover post
                        </button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              ) : null}
            </div>

            {/* Content */}
            {post.content && (
              <p className="text-[15px] text-white px-4 pb-3 whitespace-pre-wrap leading-relaxed">{post.content}</p>
            )}

            {/* Media */}
            {post.media && (
              <div className="relative cursor-pointer" onClick={() => handleTap(post.id)}>
                <img src={post.media} alt="" className="w-full max-h-[450px] object-cover" />
                <AnimatePresence>
                  {doubleTapId === post.id && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 12 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Heart className="w-24 h-24 text-[#EAB308] drop-shadow-2xl" fill="#EAB308" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-5">
                {/* Like + Reaction picker */}
                <div className="relative">
                  <AnimatePresence>
                    {reactionPicker === post.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.7, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.7, y: 8 }}
                        transition={{ type: "spring", stiffness: 380, damping: 22 }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-full border border-zinc-700/80 bg-zinc-900/95 px-2 py-1.5 shadow-2xl backdrop-blur-sm"
                        onClick={e => e.stopPropagation()}
                      >
                        {REACTIONS.map(emoji => (
                          <motion.button
                            key={emoji}
                            whileHover={{ scale: 1.35 }}
                            whileTap={{ scale: 0.85 }}
                            onClick={() => handleReactionSelect(post.id, emoji)}
                            className="text-xl leading-none focus:outline-none"
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.button
                    whileTap={{ scale: 0.75 }}
                    onPointerDown={() => startLongPress(post.id)}
                    onPointerUp={() => {
                      if (longPressRef.current) {
                        cancelLongPress();
                        togglePostLike(post.id);
                        if (navigator.vibrate) navigator.vibrate(post.isLiked ? 20 : 40);
                      }
                    }}
                    onPointerLeave={cancelLongPress}
                    className={`flex items-center gap-1.5 group select-none ${FOCUS_RING_GOLD}`}>
                    <motion.div animate={post.isLiked ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
                      {postReactions[post.id] && post.isLiked ? (
                        <span className="text-xl leading-none">{postReactions[post.id]}</span>
                      ) : (
                        <Heart className={`w-6 h-6 transition-colors ${post.isLiked ? "text-[#EAB308] fill-[#EAB308]" : "text-zinc-400 group-hover:text-zinc-200"}`} />
                      )}
                    </motion.div>
                    <span className={`text-sm font-medium ${post.isLiked ? "text-[#EAB308]" : "text-zinc-400"}`}>{post.likes}</span>
                  </motion.button>
                </div>

                {/* Comment toggle */}
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
                  className={`flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors ${FOCUS_RING_GOLD}`}>
                  <MessageCircle className="w-6 h-6" />
                  <span className="text-sm font-medium">{post.comments.length}</span>
                </motion.button>

                {/* Share */}
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => { navigator.share?.({ text: post.content || "" }); }}
                  className={`text-zinc-400 hover:text-zinc-200 transition-colors ${FOCUS_RING_GOLD}`}>
                  <Share2 className="w-6 h-6" />
                </motion.button>
              </div>

              <motion.button whileTap={{ scale: 0.9 }} className={FOCUS_RING_GOLD}>
                <Bookmark className={`w-6 h-6 transition-colors ${post.isSaved ? "text-[#EAB308] fill-[#EAB308]" : "text-zinc-400 hover:text-zinc-200"}`} />
              </motion.button>
            </div>

            {/* Comments section */}
            <AnimatePresence>
              {expandedComments === post.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-zinc-900/50">
                  <div className="px-4 py-3 space-y-3">
                    {post.comments.length === 0 && (
                      <p className="text-xs text-zinc-600 text-center py-2">Seja o primeiro a comentar 💬</p>
                    )}
                    {post.comments.map((c, ci) => (
                      <div key={ci} className="flex gap-2.5">
                        <img
                          src={resolveStoryAvatarSrc(c.avatar || "")}
                          alt=""
                          className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5 object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{c.user}</span>
                            <span className="text-[11px] text-zinc-600">{c.time}</span>
                          </div>
                          <p className="text-sm text-zinc-300 mt-0.5">{c.text}</p>
                        </div>
                      </div>
                    ))}

                    {/* Comment input */}
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-900/50">
                      <img src={myAvatarSrc} className="w-7 h-7 rounded-full flex-shrink-0 object-cover" />
                      <input
                        value={commentInputs[post.id] || ""}
                        onChange={e => setCommentInputs(p => ({ ...p, [post.id]: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && addComment(post.id)}
                        placeholder="Comentar..."
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-sm text-white outline-none placeholder-zinc-600 focus:border-zinc-700 transition-colors"
                      />
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => addComment(post.id)}
                        className={`p-1.5 rounded-lg transition-colors ${commentInputs[post.id] ? "text-[#EAB308]" : "text-zinc-700"} ${FOCUS_RING_GOLD}`}>
                        <Send className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Comment preview (collapsed) */}
            {expandedComments !== post.id && post.comments.length > 0 && (
              <div className="px-4 pb-3">
                <button
                  onClick={() => setExpandedComments(post.id)}
                  className={`text-sm text-zinc-500 hover:text-zinc-400 transition-colors ${FOCUS_RING_GOLD}`}>
                  Ver {post.comments.length} comentário{post.comments.length > 1 ? "s" : ""}
                </button>
              </div>
            )}
          </motion.article>
        ))}
      </div>
        </AppSectionCard>
      </div>

      {/* FAB — floating post button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setShowComposer(true)}
        className={`fixed bottom-24 right-5 w-14 h-14 bg-[#EAB308] rounded-full shadow-[0_0_25px_rgba(234,179,8,0.4)] flex items-center justify-center z-30 ${FOCUS_RING_GOLD}`}>
        <Plus className="w-7 h-7 text-black" />
      </motion.button>

      {/* Post Composer Modal */}
      <AnimatePresence>
        {showComposer && (
          <PostComposer
            user={user ? { name: user.name, avatar: profile?.avatar || user.avatar, role: user.role ?? "visitor" } : null}
            onClose={() => setShowComposer(false)}
            onPublish={handlePublish}
            isAdminOfficialMode={isAdmin}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {confirmDeletePostId ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[240] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setConfirmDeletePostId(null)}>
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/70 p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <p className="text-sm font-bold text-white">Remover este post?</p>
              <p className="mt-1 text-xs text-zinc-400">A remoção é feita com soft-delete e some do feed público.</p>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => setConfirmDeletePostId(null)} className={`flex-1 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-300 ${FOCUS_RING_GOLD}`}>Cancelar</button>
                <button type="button" onClick={() => { softDeletePost(confirmDeletePostId); setConfirmDeletePostId(null); toast("Post removido da Rede."); }} className={`flex-1 rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2 text-xs font-bold text-red-200 ${FOCUS_RING_GOLD}`}>Remover</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {alertPostId ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[240] flex flex-col justify-end bg-black/80 backdrop-blur-md"
            onClick={() => setAlertPostId(null)}>
            <motion.div
              initial={{ y: 120 }}
              animate={{ y: 0 }}
              exit={{ y: 120 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="w-full rounded-t-3xl border-t border-zinc-700 bg-[#0A0A0A] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
              onClick={(e) => e.stopPropagation()}>
              <p className="text-sm font-bold text-white">Alertar usuário do post</p>
              <textarea
                rows={3}
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Escreva um aviso privado para este usuário..."
                className="mt-3 w-full rounded-xl border border-zinc-700 bg-black/70 px-3 py-2 text-sm text-white outline-none"
              />
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setAlertPostId(null)} className={`flex-1 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-300 ${FOCUS_RING_GOLD}`}>Cancelar</button>
                <button type="button" onClick={() => { if (!alertMessage.trim()) { toast("Escreva a mensagem de alerta.", "error"); return; } toast("Alerta registrado (camada privada pronta para integrar notifications)."); setAlertMessage(""); setAlertPostId(null); }} className={`flex-1 rounded-xl bg-[#EAB308] px-3 py-2 text-xs font-bold text-black ${FOCUS_RING_GOLD}`}>Enviar alerta</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
