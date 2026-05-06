import type { XPLog } from "@/context/types";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface AntiCheatValidation {
  isValid: boolean;
  reason?: string;
}

/**
 * Rate limiter: max 1 XP transaction per student per 5 minutes
 */
export async function checkRateLimit(
  studentId: string,
  type: XPLog["type"]
): Promise<AntiCheatValidation> {
  const supabase = getSupabaseClient();
  if (!supabase) return { isValid: true }; // Offline mode allows

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("xp_log")
    .select("id")
    .eq("student_id", studentId)
    .eq("type", type)
    .gt("created_at", fiveMinutesAgo)
    .limit(1);

  if (error) {
    console.error("[checkRateLimit] Supabase error:", error);
    return { isValid: true }; // Fail open (allow on error)
  }

  if (data && data.length > 0) {
    return {
      isValid: false,
      reason: `Rate limit: max 1 ${type} per 5 minutes`,
    };
  }

  return { isValid: true };
}

/**
 * Duplicate detector: same lesson + student + same day = skip
 */
export async function checkDuplicate(
  studentId: string,
  relatedId: string | undefined,
  type: XPLog["type"]
): Promise<AntiCheatValidation> {
  if (!relatedId) return { isValid: true }; // No related entity, can't be duplicate

  const supabase = getSupabaseClient();
  if (!supabase) return { isValid: true };

  const today = new Date().toISOString().split("T")[0];
  const startOfDay = `${today}T00:00:00Z`;
  const endOfDay = `${today}T23:59:59Z`;

  const { data, error } = await supabase
    .from("xp_log")
    .select("id, created_at")
    .eq("student_id", studentId)
    .eq("related_id", relatedId)
    .eq("type", type)
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay)
    .limit(1);

  if (error) {
    console.error("[checkDuplicate] Supabase error:", error);
    return { isValid: true }; // Fail open
  }

  if (data && data.length > 0) {
    return {
      isValid: false,
      reason: `Duplicate: ${type} for this lesson already recorded today`,
    };
  }

  return { isValid: true };
}

/**
 * Outlier detector: XP > 3 std deviations from student average
 * Flags suspicious transactions for coach review
 */
export async function checkOutlier(
  studentId: string,
  xpPoints: number
): Promise<AntiCheatValidation> {
  const supabase = getSupabaseClient();
  if (!supabase) return { isValid: true };

  // Get last 30 days of valid XP transactions
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("xp_log")
    .select("points")
    .eq("student_id", studentId)
    .eq("validation_passed", true)
    .gte("created_at", thirtyDaysAgo);

  if (error || !data || data.length === 0) {
    return { isValid: true }; // No history, can't be outlier
  }

  // Calculate mean and std dev
  const points = data.map((row) => row.points);
  const mean = points.reduce((a, b) => a + b, 0) / points.length;
  const variance =
    points.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / points.length;
  const stdDev = Math.sqrt(variance);

  // Check if new XP is > 3 sigma from mean
  const zScore = Math.abs((xpPoints - mean) / stdDev);

  if (zScore > 3) {
    return {
      isValid: true, // Still valid, but flagged for review
      reason: `Outlier: ${xpPoints} XP is ${zScore.toFixed(1)}σ above average (mean: ${mean.toFixed(0)})`,
    };
  }

  return { isValid: true };
}

/**
 * Validate XP transaction before logging
 * Returns validation result + reason if invalid
 */
export async function validateXPTransaction(
  studentId: string,
  xpPoints: number,
  type: XPLog["type"],
  relatedId?: string
): Promise<{ isValid: boolean; validationNotes?: string }> {
  // Check rate limit
  const rateLimitResult = await checkRateLimit(studentId, type);
  if (!rateLimitResult.isValid) {
    return {
      isValid: false,
      validationNotes: rateLimitResult.reason,
    };
  }

  // Check duplicate
  const duplicateResult = await checkDuplicate(studentId, relatedId, type);
  if (!duplicateResult.isValid) {
    return {
      isValid: false,
      validationNotes: duplicateResult.reason,
    };
  }

  // Check outlier (still valid but flagged)
  const outlierResult = await checkOutlier(studentId, xpPoints);
  if (outlierResult.reason) {
    console.warn(
      `[validateXPTransaction] Outlier flagged for ${studentId}: ${outlierResult.reason}`
    );
  }

  return { isValid: true };
}

/**
 * Helper: Get validation notes for flagged transaction
 * Used to populate validation_notes field in xp_log
 */
export async function getValidationNotes(
  studentId: string,
  xpPoints: number,
  type: XPLog["type"],
  relatedId?: string
): Promise<string> {
  const notes: string[] = [];

  // Check outlier and add note
  const outlierResult = await checkOutlier(studentId, xpPoints);
  if (outlierResult.reason) {
    notes.push(outlierResult.reason);
  }

  return notes.length > 0 ? notes.join(" | ") : "";
}
