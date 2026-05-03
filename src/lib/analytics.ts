/**
 * Analytics Helper — PostHog Integration
 * Rastreia eventos do usuário e comportamento
 *
 * Eventos rastreados:
 * - Page views (automático)
 * - Check-in request/approve
 * - New student signup
 * - Payment made
 * - Post created/liked
 * - XP gained
 */

import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com";

/**
 * Inicializar PostHog (call em layout.tsx)
 */
export function initPostHog() {
  if (typeof window === "undefined" || !POSTHOG_KEY) return;

  // @ts-ignore — PostHog types
  if (!posthog._loaded) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      loaded: () => console.log("[PostHog] Initialized"),
      autocapture: false, // disable autocapture, só rastreamos eventos explícitos
      capture_pageview: true, // rastrear page views
      capture_pageleave: true, // rastrear quando sai da página
      session_recording: {
        maskAllInputs: true, // não gravar senhas
      },
    });
  }
}

/**
 * Identificar usuário
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;
  posthog.identify(userId, properties);
}

/**
 * Capture evento
 */
export function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;
  posthog.capture(event, properties);
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;
  posthog.people.set(properties);
}

// ============================================================================
// EVENTOS ESPECÍFICOS DO APP
// ============================================================================

export const analytics = {
  // Auth
  signup: (role: "aluno" | "professor" | "admin") =>
    captureEvent("user_signup", { role }),

  login: (role: string) => captureEvent("user_login", { role }),

  logout: () => captureEvent("user_logout"),

  // Check-in Flow
  checkInRequested: (lessonId: string, studentName: string) =>
    captureEvent("check_in_requested", { lessonId, studentName }),

  checkInApproved: (studentId: string) =>
    captureEvent("check_in_approved", { studentId }),

  checkInRejected: (studentId: string) =>
    captureEvent("check_in_rejected", { studentId }),

  // Student Management
  newStudentSignup: (name: string, plan: string) =>
    captureEvent("new_student_signup", { name, plan }),

  studentApproved: (studentId: string, name: string) =>
    captureEvent("student_approved", { studentId, name }),

  studentSuspended: (studentId: string) =>
    captureEvent("student_suspended", { studentId }),

  // Payments
  paymentMade: (amount: number, method: string, studentId: string) =>
    captureEvent("payment_made", { amount, method, studentId }),

  paymentProofSubmitted: (studentId: string) =>
    captureEvent("payment_proof_submitted", { studentId }),

  // Feed
  postCreated: (postId: string, authorRole: string) =>
    captureEvent("post_created", { postId, authorRole }),

  postLiked: (postId: string) =>
    captureEvent("post_liked", { postId }),

  postCommented: (postId: string) =>
    captureEvent("post_commented", { postId }),

  postModerated: (postId: string, action: "deleted" | "flagged") =>
    captureEvent("post_moderated", { postId, action }),

  // XP & Gamification
  xpGained: (amount: number, source: string, studentId: string) =>
    captureEvent("xp_gained", { amount, source, studentId }),

  cardUnlocked: (cardName: string, studentId: string) =>
    captureEvent("card_unlocked", { cardName, studentId }),

  // Performance Feedback
  lessonRatingSubmitted: (lessonId: string, rating: number) =>
    captureEvent("lesson_rating_submitted", { lessonId, rating }),

  feedbackGiven: (studentId: string, category: string) =>
    captureEvent("feedback_given", { studentId, category }),

  // Offline
  offlineSyncStarted: (actionCount: number) =>
    captureEvent("offline_sync_started", { actionCount }),

  offlineSyncCompleted: (successCount: number, failureCount: number) =>
    captureEvent("offline_sync_completed", { successCount, failureCount }),

  // Errors (captured separately by Sentry, mas também rastreamos em analytics)
  errorOccurred: (errorType: string, page: string) =>
    captureEvent("error_occurred", { errorType, page }),
};

/**
 * Funnels (rastreamento de conversão)
 * Ex: signup → approve → check-in
 */
export const funnel = {
  signupStep: () => captureEvent("funnel_signup"),
  approvalStep: (studentId: string) =>
    captureEvent("funnel_approval", { studentId }),
  firstCheckInStep: (studentId: string) =>
    captureEvent("funnel_first_checkin", { studentId }),
};
