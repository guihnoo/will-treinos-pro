import type { Post } from "@/context/types";
import {
  CRITICAL_DATA_FETCH_TIMEOUT_MS,
  withNetworkTimeout,
} from "@/lib/appSessionHelpers";
import {
  type LiveAppData,
  fetchFeedPostsRemote,
  fetchLiveAppData,
} from "@/lib/supabasePersistence";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CriticalLiveBundle = {
  data: LiveAppData;
  livePosts: Post[];
};

/** Fetch paralelo: dados críticos + feed (feed falha em silêncio → array vazio). */
export async function loadCriticalLiveBundle(
  supabase: SupabaseClient,
  currentUserId: string,
): Promise<CriticalLiveBundle> {
  const data = await withNetworkTimeout(
    fetchLiveAppData(supabase),
    CRITICAL_DATA_FETCH_TIMEOUT_MS,
    "A sincronização demorou demais. Verifique sua conexão e use Tentar novamente.",
  );
  let livePosts: Post[] = [];
  try {
    livePosts = await withNetworkTimeout(
      fetchFeedPostsRemote(supabase, currentUserId),
      CRITICAL_DATA_FETCH_TIMEOUT_MS,
      "Feed indisponível no momento.",
    );
  } catch {
    livePosts = [];
  }
  return { data, livePosts };
}
