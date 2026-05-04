"use client";

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { Post, Role, WithoutId } from "@/context/types";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  addFeedCommentRemote,
  createFeedPostRemote,
  fetchFeedPostsRemote,
  softDeleteFeedPostRemote,
  toggleFeedPostLikeRemote,
  updateFeedPostModerationRemote,
} from "@/lib/supabasePersistence";
import { willUid } from "@/lib/willUid";
import { logXpEvent } from "@/lib/xpLogger";

export function useFeedMutations(options: {
  usingSupabaseSession: boolean;
  /** `user?.role` do app — usado em `authorRole` quando o post é “pro”. */
  sessionRole: Role | undefined;
  supabaseAuthUserRef: MutableRefObject<SupabaseAuthUser | null>;
  setPosts: Dispatch<SetStateAction<Post[]>>;
  setCriticalDataError: Dispatch<SetStateAction<string | null>>;
}) {
  const { usingSupabaseSession, sessionRole, supabaseAuthUserRef, setPosts, setCriticalDataError } = options;

  const addPost = useCallback(
    (p: WithoutId<Post>) => {
      if (!usingSupabaseSession) {
        setPosts((prev) => [{ ...p, id: `p_${willUid()}` }, ...prev]);
        return;
      }
      const supabase = getSupabaseClient();
      const currentUserId = supabaseAuthUserRef.current?.id;
      if (!supabase || !currentUserId) {
        setCriticalDataError("Sessão Supabase indisponível para publicar no feed.");
        return;
      }
      void createFeedPostRemote(supabase, {
        authorName: p.user.name,
        authorAvatar: p.user.avatar,
        authorRole: p.user.isPro ? sessionRole || "coach" : "aluno",
        content: p.content,
        mediaUrl: p.media,
        pinned: p.pinned ?? false,
        isOfficial: p.isOfficial ?? false,
        targetRole: p.targetRole ?? "all",
      })
        .then(() => fetchFeedPostsRemote(supabase, currentUserId))
        .then((livePosts) => setPosts(livePosts))
        .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao publicar no feed."));
    },
    [usingSupabaseSession, sessionRole, supabaseAuthUserRef, setPosts, setCriticalDataError],
  );

  const togglePostLike = useCallback(
    (id: string) => {
      let wasLiked = false;
      if (!usingSupabaseSession) {
        setPosts((p) =>
          p.map((post) => {
            if (post.id === id) {
              wasLiked = post.isLiked;
              return { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 };
            }
            return post;
          }),
        );
        return;
      }
      const supabase = getSupabaseClient();
      const currentUserId = supabaseAuthUserRef.current?.id;
      if (!supabase || !currentUserId) {
        setCriticalDataError("Sessão Supabase indisponível para curtir.");
        return;
      }

      // Get current like state before toggling
      setPosts((p) => {
        const post = p.find((post) => post.id === id);
        if (post) wasLiked = post.isLiked;
        return p;
      });

      void toggleFeedPostLikeRemote(supabase, id, currentUserId)
        .then(() => {
          // Log XP only if we're adding a new like (not removing)
          if (!wasLiked) {
            void logXpEvent(supabase, {
              studentId: currentUserId,
              points: 5,
              type: "feed_like",
              description: "Curtiu um post no feed",
              relatedId: id,
            });
          }
          return fetchFeedPostsRemote(supabase, currentUserId);
        })
        .then((livePosts) => setPosts(livePosts))
        .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao curtir post."));
    },
    [usingSupabaseSession, supabaseAuthUserRef, setPosts, setCriticalDataError],
  );

  const addPostComment = useCallback(
    (id: string, text: string, userName: string, avatar: string) => {
      if (!usingSupabaseSession) {
        setPosts((p) =>
          p.map((post) =>
            post.id === id
              ? { ...post, comments: [...post.comments, { user: userName, avatar, text, time: "agora" }] }
              : post,
          ),
        );
        return;
      }
      const supabase = getSupabaseClient();
      const currentUserId = supabaseAuthUserRef.current?.id;
      if (!supabase || !currentUserId) {
        setCriticalDataError("Sessão Supabase indisponível para comentar.");
        return;
      }
      void addFeedCommentRemote(supabase, { postId: id, userId: currentUserId, userName, userAvatar: avatar, text })
        .then(() => {
          // Log XP for commenting
          void logXpEvent(supabase, {
            studentId: currentUserId,
            points: 10,
            type: "feed_comment",
            description: "Comentou em um post no feed",
            relatedId: id,
          });
          return fetchFeedPostsRemote(supabase, currentUserId);
        })
        .then((livePosts) => setPosts(livePosts))
        .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao comentar no post."));
    },
    [usingSupabaseSession, supabaseAuthUserRef, setPosts, setCriticalDataError],
  );

  const moderatePost = useCallback(
    (
      id: string,
      patch: { pinned?: boolean; isOfficial?: boolean; targetRole?: "all" | "student" | "coach" },
    ) => {
      if (!usingSupabaseSession) {
        setPosts((prev) =>
          prev
            .map((post) => (post.id === id ? { ...post, ...patch } : post))
            .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))),
        );
        return;
      }
      const supabase = getSupabaseClient();
      const currentUserId = supabaseAuthUserRef.current?.id;
      if (!supabase || !currentUserId) {
        setCriticalDataError("Sessão Supabase indisponível para moderação.");
        return;
      }
      void updateFeedPostModerationRemote(supabase, id, patch)
        .then(() => fetchFeedPostsRemote(supabase, currentUserId))
        .then((livePosts) => setPosts(livePosts))
        .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao moderar post."));
    },
    [usingSupabaseSession, supabaseAuthUserRef, setPosts, setCriticalDataError],
  );

  const softDeletePost = useCallback(
    (id: string) => {
      if (!usingSupabaseSession) {
        setPosts((prev) => prev.filter((post) => post.id !== id));
        return;
      }
      const supabase = getSupabaseClient();
      const currentUserId = supabaseAuthUserRef.current?.id;
      if (!supabase || !currentUserId) {
        setCriticalDataError("Sessão Supabase indisponível para remover post.");
        return;
      }
      void softDeleteFeedPostRemote(supabase, id)
        .then(() => fetchFeedPostsRemote(supabase, currentUserId))
        .then((livePosts) => setPosts(livePosts))
        .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao remover post."));
    },
    [usingSupabaseSession, supabaseAuthUserRef, setPosts, setCriticalDataError],
  );

  return { addPost, togglePostLike, addPostComment, moderatePost, softDeletePost };
}
