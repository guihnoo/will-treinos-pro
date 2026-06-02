"use client";

import { useState, useCallback } from "react";
import { Tv } from "lucide-react";
import { LeaderboardRankingPanel } from "@/components/leaderboard/LeaderboardRankingPanel";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";

const TVLeaderboard = dynamic(() => import("@/components/TVLeaderboard"), {
  ssr: false,
  loading: () => null,
});

export default function RankingPage() {
  const { user } = useAuth();
  const [tvMode, setTvMode] = useState(false);

  const canAccessTVMode =
    user?.role === "admin" || user?.role === "coach";

  const enterTVMode = useCallback(() => {
    setTvMode(true);
    if (typeof document !== "undefined" && document.documentElement.requestFullscreen) {
      void document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen may be blocked — TV mode still works without it
      });
    }
  }, []);

  const exitTVMode = useCallback(() => {
    setTvMode(false);
    if (typeof document !== "undefined" && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
  }, []);

  return (
    <>
      {tvMode && <TVLeaderboard onExit={exitTVMode} />}

      <div className="min-h-screen bg-black px-4 py-6 pb-24">
        <div className="mx-auto max-w-xl">
          {/* Header com botão Modo TV */}
          {canAccessTVMode && (
            <div className="flex items-center justify-between mb-4">
              <div /> {/* spacer */}
              <button
                onClick={enterTVMode}
                data-testid="tv-mode-btn"
                className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
              >
                <Tv className="h-4 w-4 text-[#EAB308]" />
                Modo TV
              </button>
            </div>
          )}

          <LeaderboardRankingPanel />
        </div>
      </div>
    </>
  );
}
