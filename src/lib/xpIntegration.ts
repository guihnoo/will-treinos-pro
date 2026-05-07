/**
 * Phase 10B: XP Event Logging Integration
 * Centralized point for logging XP across all events
 *
 * Exported functions called from various components/hooks
 */

import { logXPEvent, batchLogXPEvents, getXPForEventType } from "./xpEventLogger";
import type { XPLog } from "@/context/types";

/**
 * Log XP when student check-in is approved
 * Called from: CheckInContext.approveCheckIn()
 */
export async function logCheckInXP(
  studentId: string,
  lessonId: string,
  createdBy?: string
): Promise<string | null> {
  return logXPEvent({
    studentId,
    type: "checkin",
    sourceEntity: "lesson",
    relatedId: lessonId,
    description: "Check-in aprovado na aula",
    createdBy,
  });
}

/**
 * Batch log XP for multiple students checking in same lesson
 * Called from: LiveLessonCoachPanel when coach approves all check-ins
 */
export async function batchLogCheckInsXP(
  studentIds: string[],
  lessonId: string,
  createdBy?: string
): Promise<string[]> {
  return batchLogXPEvents(
    studentIds.map((studentId) => ({
      studentId,
      type: "checkin" as XPLog["type"],
      sourceEntity: "lesson" as const,
      relatedId: lessonId,
      description: "Check-in aprovado na aula",
      createdBy,
    }))
  );
}

/**
 * Log XP when post is liked
 * Called from: FeedContext.togglePostLike()
 */
export async function logPostLikeXP(
  studentId: string,
  postId: string
): Promise<string | null> {
  return logXPEvent({
    studentId,
    type: "social_like",
    sourceEntity: "post",
    relatedId: postId,
    description: "Curtiu post na rede",
  });
}

/**
 * Log XP when comment is added to post
 * Called from: FeedContext.addPostComment()
 */
export async function logPostCommentXP(
  studentId: string,
  postId: string,
  commentPreview?: string
): Promise<string | null> {
  return logXPEvent({
    studentId,
    type: "social_comment",
    sourceEntity: "post",
    relatedId: postId,
    description: `Comentou: "${commentPreview?.substring(0, 50) ?? "..."}"`,
  });
}

/**
 * Log XP when training plan is completed
 * Called from: TrainingPlanEditor or training completion flow
 */
export async function logTrainingCompletionXP(
  studentId: string,
  trainingPlanId: string,
  planTitle?: string,
  createdBy?: string
): Promise<string | null> {
  return logXPEvent({
    studentId,
    type: "training_completed",
    sourceEntity: "training_plan",
    relatedId: trainingPlanId,
    description: `Completou treino: ${planTitle || "Sem título"}`,
    createdBy,
  });
}

/**
 * Get XP amounts for UI display/tooltips
 */
export const XP_VALUES = {
  checkin: getXPForEventType("checkin"),
  socialLike: getXPForEventType("social_like"),
  socialComment: getXPForEventType("social_comment"),
  trainingCompleted: getXPForEventType("training_completed"),
};

/**
 * XP toasts/feedback messages
 */
export const XP_MESSAGES = {
  checkin: (amount: number = XP_VALUES.checkin) =>
    `✅ Check-in aprovado! +${amount} XP`,
  socialLike: (amount: number = XP_VALUES.socialLike) =>
    `❤️ Curtida! +${amount} XP`,
  socialComment: (amount: number = XP_VALUES.socialComment) =>
    `💬 Comentário! +${amount} XP`,
  trainingCompleted: (planTitle: string, amount: number = XP_VALUES.trainingCompleted) =>
    `🏆 Treino "${planTitle}" completo! +${amount} XP`,
};
