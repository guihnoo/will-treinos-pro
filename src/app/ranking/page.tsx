"use client";

import { LeaderboardRankingPanel } from "@/components/leaderboard/LeaderboardRankingPanel";

export default function RankingPage() {
  return (
    <div className="min-h-screen bg-black px-4 py-6 pb-24">
      <div className="mx-auto max-w-xl">
        <LeaderboardRankingPanel />
      </div>
    </div>
  );
}
