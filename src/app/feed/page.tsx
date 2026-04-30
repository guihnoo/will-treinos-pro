"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Camera, Image as ImageIcon,
  BadgeCheck, Send, X, Bookmark, SmilePlus, Plus, CheckCircle2
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import { MOCK_STORIES } from "@/context/mockData";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import AppEmptyState from "@/components/ui/AppEmptyState";
import AppSectionCard from "@/components/ui/AppSectionCard";
import AppPageHeader from "@/components/ui/AppPageHeader";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { FOCUS_RING_GOLD, TOUCH_TARGET_MIN } from "@/components/ui/interactionTokens";

// ─── New Post Composer ───────────────────────────────────────────────────────
function PostComposer({
  user, onClose, onPublish
}: {
  user: { name: string; avatar: string; role: string } | null;
  onClose: () => void;
  onPublish: (text: string, media: string | null) => void;
}) {
  const [text, setText] = useState("");
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  useBodyScrollLock(true);

  // Auto-focus textarea when modal opens
  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPreviewImg(ev.target?.result as string);
    reader.readAsDataURL(file);
    // reset so same file can be picked again
    e.target.value = "";
  };

  const handlePublish = async () => {
    if (!text.trim() && !previewImg) return;
    setPublishing(true);
    await new Promise(r => setTimeout(r, 600)); // brief animation delay
    onPublish(text, previewImg);
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
                src={user?.avatar?.startsWith("data:") ? user.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.avatar}`}
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
    user,
    students,
    posts,
    addPost,
    togglePostLike,
    addPostComment,
    usingSupabaseSession,
    criticalDataLoading,
    criticalDataError,
    retryCriticalDataSync,
  } = useApp();
  const { toast } = useToast();
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [doubleTapId, setDoubleTapId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const tapRef = useRef<Record<string, number>>({});

  // Get student profile for avatar (may be custom photo)
  const profile = students.find(s => s.id === user?.id);
  const myAvatarSrc = profile?.avatar?.startsWith("data:")
    ? profile.avatar
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.avatar || user?.avatar}`;

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

  const handlePublish = (text: string, media: string | null) => {
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

  if (usingSupabaseSession && criticalDataLoading) {
    return (
      <div className="max-w-2xl mx-auto min-h-screen border-x border-zinc-900 px-4 pb-28 pt-4">
        <AppPageHeader title="Rede Will Treinos" subtitle="Sincronizando comunidade ao vivo..." icon={SmilePlus} />
        <div className="space-y-3">
          <SkeletonLoader className="h-20" lines={2} />
          <SkeletonLoader className="h-28" lines={4} />
          <SkeletonLoader className="h-48" lines={5} />
        </div>
      </div>
    );
  }

  if (usingSupabaseSession && criticalDataError) {
    return (
      <div className="max-w-2xl mx-auto min-h-screen border-x border-zinc-900 px-4 pb-28 pt-4">
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
    <div className="max-w-2xl mx-auto border-x border-zinc-900 min-h-screen relative pb-28">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-900 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.18em]">Will Comunidade</p>
          <h1 className="text-xl font-black text-white">
            <span className="text-[#EAB308]">Rede</span> Will Treinos
          </h1>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Compartilhe treinos, evolução e rotina</p>
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

        {MOCK_STORIES.map(s => (
          <motion.div key={s.id} whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0">
            <div className={`w-16 h-16 rounded-full p-[2px] ${s.hasNew ? "bg-gradient-to-br from-[#EAB308] to-[#F97316]" : "bg-zinc-800"}`}>
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.avatar}`}
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
        {posts.length === 0 && (
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

        {posts.map((post, i) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="border-b border-zinc-900">

            {/* Post Header */}
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-full p-[1.5px] ${post.user.isPro ? "bg-gradient-to-br from-[#EAB308] to-[#F97316]" : "bg-zinc-800"}`}>
                  <img
                    src={post.user.avatar?.startsWith("data:") ? post.user.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.avatar}`}
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
              </div>
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
                {/* Like */}
                <motion.button whileTap={{ scale: 0.75 }}
                  onClick={() => { togglePostLike(post.id); if(navigator.vibrate) navigator.vibrate(post.isLiked?20:40); }}
                  className={`flex items-center gap-1.5 group ${FOCUS_RING_GOLD}`}>
                  <motion.div animate={post.isLiked ? { scale: [1, 1.5, 1] } : {}} transition={{ duration: 0.3 }}>
                    <Heart className={`w-6 h-6 transition-colors ${post.isLiked ? "text-[#EAB308] fill-[#EAB308]" : "text-zinc-400 group-hover:text-zinc-200"}`} />
                  </motion.div>
                  <span className={`text-sm font-medium ${post.isLiked ? "text-[#EAB308]" : "text-zinc-400"}`}>{post.likes}</span>
                </motion.button>

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
                          src={c.avatar?.startsWith("data:") ? c.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.avatar}`}
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
            user={user ? { name: user.name, avatar: profile?.avatar || user.avatar, role: user.role } : null}
            onClose={() => setShowComposer(false)}
            onPublish={handlePublish}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
