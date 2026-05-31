"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

/** Returns unread coach_messages count for a student CRM id.
 *  Extracted so StudentMessagesPanel can be lazy-loaded without breaking the badge. */
export function useCoachMessagesUnread(studentCrmId: string | null) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!studentCrmId) return;
    const sb = getSupabaseClient();
    sb.from("coach_messages")
      .select("id", { count: "exact", head: true })
      .eq("to_student_id", studentCrmId)
      .is("read_at", null)
      .then(({ count: c }) => setCount(c ?? 0));
  }, [studentCrmId]);

  return { count, setCount };
}
