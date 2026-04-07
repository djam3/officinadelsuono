import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

let installed = false;
const recentErrors = new Set<string>();

function truncate(s: string, max: number): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max) : s;
}

async function logError(message: string, stack?: string, url?: string) {
  try {
    const key = `${message}|${stack?.slice(0, 200) || ''}`;
    if (recentErrors.has(key)) return;
    recentErrors.add(key);
    // Clear dedup cache after 1 minute
    setTimeout(() => recentErrors.delete(key), 60_000);

    await addDoc(collection(db, 'error_logs'), {
      message: truncate(message || 'Unknown error', 1900),
      stack: truncate(stack || '', 4900),
      url: truncate(url || window.location.href, 490),
      userAgent: truncate(navigator.userAgent || '', 490),
      timestamp: serverTimestamp(),
    });
  } catch {
    // Swallow: error logging must never break the app
  }
}

export function installErrorLogger() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (event) => {
    const msg = event.message || (event.error?.message) || 'Uncaught error';
    const stack = event.error?.stack;
    const url = event.filename;
    void logError(msg, stack, url);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason: any = event.reason;
    const msg = typeof reason === 'string' ? reason : (reason?.message || 'Unhandled promise rejection');
    const stack = reason?.stack;
    void logError(msg, stack);
  });
}
