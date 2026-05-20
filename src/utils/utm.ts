/**
 * UTM Parameter Capture
 * ─────────────────────
 * • Reads utm_* params from the current URL on every page load.
 * • If UTM params are present they are saved to localStorage
 *   (overwriting the previous ones — the latest campaign wins).
 * • If the URL has no UTMs the previously stored ones are kept,
 *   so they survive multi-page navigation inside the SPA.
 * • getStoredUTMs() can be called anywhere to attach UTM context
 *   to orders, leads, or GA4 events.
 */

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  /** ISO timestamp of when the UTM was first captured */
  captured_at?: string;
  /** The landing path the user arrived on */
  landing_path?: string;
}

const STORAGE_KEY = 'ods_utm';

/**
 * Call this once when the app boots (e.g. in main.tsx or App.tsx useEffect).
 * Reads the current URL search params and, if UTM keys are present, stores them.
 */
export function captureUTMs(): UTMParams {
  const q = new URLSearchParams(window.location.search);
  const fresh: UTMParams = {};

  const source = q.get('utm_source');
  const medium = q.get('utm_medium');
  const campaign = q.get('utm_campaign');
  const term = q.get('utm_term');
  const content = q.get('utm_content');

  if (source) fresh.utm_source = source;
  if (medium) fresh.utm_medium = medium;
  if (campaign) fresh.utm_campaign = campaign;
  if (term) fresh.utm_term = term;
  if (content) fresh.utm_content = content;

  // Only persist if there is at least a utm_source
  if (fresh.utm_source) {
    fresh.captured_at = new Date().toISOString();
    fresh.landing_path = window.location.pathname;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // localStorage unavailable (private mode, storage full, …) — silent
    }
    return fresh;
  }

  // Return whatever was stored before (previous session, direct visit, …)
  return getStoredUTMs();
}

/**
 * Returns the UTM params captured in the current or a previous session.
 * An empty object is returned when no UTMs have ever been recorded.
 */
export function getStoredUTMs(): UTMParams {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UTMParams;
  } catch {
    return {};
  }
}

/**
 * Clear stored UTMs (e.g. after a completed purchase to avoid polluting the next session).
 */
export function clearUTMs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}

/**
 * Returns a flat object ready to spread into a GA4 event or a Firestore document.
 * Keys follow the GA4 naming convention for custom dimensions.
 */
export function utmAsEventParams(): Record<string, string> {
  const utms = getStoredUTMs();
  const params: Record<string, string> = {};
  if (utms.utm_source) params['campaign_source'] = utms.utm_source;
  if (utms.utm_medium) params['campaign_medium'] = utms.utm_medium;
  if (utms.utm_campaign) params['campaign_name'] = utms.utm_campaign;
  if (utms.utm_term) params['campaign_term'] = utms.utm_term;
  if (utms.utm_content) params['campaign_content'] = utms.utm_content;
  return params;
}
