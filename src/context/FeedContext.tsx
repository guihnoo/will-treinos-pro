"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useApp, type AppContextType } from "@/context/AppContext";
import type { Post } from "@/context/types";

/** Alinhado ao 2º argumento de `moderatePost` no `AppContext`. */
export type FeedModerationPatch = Parameters<AppContextType["moderatePost"]>[1];

type FeedContextValue = {
  posts: Post[];
  addPost: AppContextType["addPost"];
  togglePostLike: AppContextType["togglePostLike"];
  addPostComment: AppContextType["addPostComment"];
  moderatePost: AppContextType["moderatePost"];
  softDeletePost: AppContextType["softDeletePost"];
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
