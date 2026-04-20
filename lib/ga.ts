// Google Analytics 4 event tracking utility
// All events are no-ops if GA_MEASUREMENT_ID is not configured

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-SJDNM06GV6";

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined" || !window.gtag || !GA_MEASUREMENT_ID) return;
  window.gtag("event", eventName, params);
}

// ── Named events ──────────────────────────────────────────────

/** Fired when user clicks "Sign in with Google" */
export function trackSignIn() {
  trackEvent("sign_in_attempt", { method: "google" });
}

/** Fired when student views their dashboard (mission control) */
export function trackViewDashboard(className: string) {
  trackEvent("view_dashboard", { class_name: className });
}

/** Fired when student clicks a subject card */
export function trackSubjectClick(subjectName: string, className: string) {
  trackEvent("subject_click", { subject_name: subjectName, class_name: className });
}

/** Fired when student opens/expands a chapter */
export function trackChapterOpen(chapterName: string, subjectName: string, className: string) {
  trackEvent("chapter_open", {
    chapter_name: chapterName,
    subject_name: subjectName,
    class_name: className,
  });
}

/** Fired when student clicks a resource link to open a PDF */
export function trackResourceOpen(
  resourceTitle: string,
  resourceType: string,
  chapterName: string,
  subjectName: string
) {
  trackEvent("resource_open", {
    resource_title: resourceTitle,
    resource_type: resourceType,
    chapter_name: chapterName,
    subject_name: subjectName,
  });
}

/** Fired when student submits a fee payment request */
export function trackFeeRequest(installment: "INSTALLMENT1" | "INSTALLMENT2") {
  trackEvent("fee_request_submit", {
    installment: installment === "INSTALLMENT1" ? "Installment 1" : "Installment 2",
  });
}
