import type { Dispatch, SetStateAction } from "react";
import type { AppConfig } from "@/context/types";
import { reduceAppConfigAfterInviteRemote } from "@/lib/enrollmentInviteCode";
import { fetchEnrollmentInviteRemote, upsertEnrollmentInviteRemote } from "@/lib/supabasePersistence";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Busca convite em `app_settings`, faz merge com estado atual e upsert best-effort quando necessário.
 */
export async function runEnrollmentInviteSync(
  supabase: SupabaseClient,
  setAppConfig: Dispatch<SetStateAction<AppConfig>>,
): Promise<void> {
  try {
    const inviteRemote = await fetchEnrollmentInviteRemote(supabase);
    setAppConfig((prev) => {
      const { next, upsertCode } = reduceAppConfigAfterInviteRemote(inviteRemote, prev);
      if (upsertCode !== null) {
        void upsertEnrollmentInviteRemote(supabase, upsertCode).catch(() => {
          /* migração app_settings pode não estar aplicada ainda */
        });
      }
      return next;
    });
  } catch {
    /* não bloqueia bootstrap */
  }
}
