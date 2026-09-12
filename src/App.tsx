/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CustomCursor } from './components/CustomCursor';
import { CookieBanner } from './components/CookieBanner';
import { trackPageView } from './utils/analytics';
import { captureUTMs } from './utils/utm';

// ─── URL ↔ page mapping ───────────────────────────────────────────────────────
const PAGE_TO_PATH: Record<string, string> = {
  home: '/',
  about: '/chi-siamo',
  contact: '/contatti',
  terms: '/termini',
  privacy: '/privacy',
  'cookie-policy': '/cookie-policy',
};

function pathToPage(pathname: string): { page: string } {
  if (pathname === '/' || pathname === '') return { page: 'home' };
  const found = Object.entries(PAGE_TO_PATH).find(([, p]) => p === pathname);
  return found ? { page: found[0] } : { page: 'home' };
}

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const AboutUs = lazy(() => import('./pages/AboutUs').then(m => ({ default: m.AboutUs })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy').then(m => ({ default: m.CookiePolicy })));

const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 border-4 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
    <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">Caricamento…</p>
  </div>
);

export default function App() {
  const initialRoute = pathToPage(window.location.pathname);
  const [currentPage, setCurrentPage] = useState(initialRoute.page);
  const isPopState = useRef(false);

  useEffect(() => {
    // Capture UTM parameters from the landing URL (persists to localStorage)
    captureUTMs();

    const query = new URLSearchParams(window.location.search);
    const pageParam = query.get('page');
    if (pageParam) {
      setCurrentPage(pageParam);
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Handle browser back/forward
    const onPopState = () => {
      isPopState.current = true;
      const route = pathToPage(window.location.pathname);
      setCurrentPage(route.page);
      trackPageView(window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleNavigate = (requestedPage: string) => {
    setCurrentPage(requestedPage);
    const path = PAGE_TO_PATH[requestedPage] || '/';
    window.history.pushState({ page: requestedPage }, '', path);
    trackPageView(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative bg-zinc-950">
      <CustomCursor />

      <Navbar onNavigate={handleNavigate} />

      <main className="flex-grow relative">
        <Suspense fallback={<PageLoader />}>
          {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
          {currentPage === 'about' && <AboutUs />}
          {currentPage === 'contact' && <Contact />}
          {currentPage === 'terms' && <Terms />}
          {currentPage === 'privacy' && <Privacy />}
          {currentPage === 'cookie-policy' && <CookiePolicy />}
        </Suspense>
      </main>

      <Footer onNavigate={handleNavigate} />
      <CookieBanner onNavigate={handleNavigate} />
    </div>
  );
}
