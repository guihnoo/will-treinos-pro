"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import type { Post } from "@/context/types";

export type FeedModerationPatch = {
  pinned?: boolean;
  isOfficial?: boolean;
  targetRole?: "all" | "student" | "coach";
};

type FeedContextValue = {
  posts: Post[];
  addPost: (p: Omit<Post, "id">) => void;
  togglePostLike: (id: string) => void;
  addPostComment: (id: string, text: string, user: string, avatar: string) => void;
  moderatePost: (id: string, patch: FeedModerationPatch) => void;
  softDeletePost: (id: string) => void;
};

const FeedContext = createContext<FeedContextValue | undefined>(undefined);

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const value = useMemo<FeedContextValue>(
    () => ({
      posts: app.posts,
      addPost: app.addPost,
      togglePostLike: app.togglePostLike,
      addPostComment: app.addPostComment,
      moderatePost: app.moderatePost,
      softDeletePost: app.softDeletePost,
    }),
    [
      app.posts,
      app.addPost,
      app.togglePostLike,
      app.addPostComment,
      app.moderatePost,
      app.softDeletePost,
    ],
  );

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error("useFeed deve ser usado dentro de FeedProvider");
  return ctx;
}
