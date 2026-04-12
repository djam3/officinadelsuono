/**
 * Lightweight event tracking utility.
 * Uses Google Analytics 4 (gtag) if available, otherwise logs to console in dev.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  } else if (import.meta.env.DEV) {
    console.debug('[analytics]', eventName, params);
  }
}
