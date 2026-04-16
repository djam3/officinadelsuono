/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Chatbot } from './components/Chatbot';
import { Cart } from './components/Cart';
import { getDirectDriveUrl } from './utils/drive';
import { CustomCursor } from './components/CustomCursor';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { BuilderProvider, useBuilder } from './contexts/BuilderContext';
import { AIFeaturesProvider } from './contexts/AIFeaturesContext';
import { BuilderToolbar } from './components/builder/BuilderToolbar';
import { CookieBanner } from './components/CookieBanner';
import { installErrorLogger } from './utils/errorLogger';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Product as ProductType } from './types/admin';

// ─── URL ↔ page mapping ───────────────────────────────────────────────────────
const PAGE_TO_PATH: Record<string, string> = {
  home: '/',
  shop: '/shop',
  blog: '/blog',
  quiz: '/quiz',
  about: '/chi-siamo',
  contact: '/contatti',
  compare: '/confronta',
  terms: '/termini',
  privacy: '/privacy',
  'cookie-policy': '/cookie-policy',
  profile: '/profilo',
  admin: '/admin',
};

function pathToPage(pathname: string): { page: string; id?: string } {
  if (pathname === '/' || pathname === '') return { page: 'home' };
  if (pathname.startsWith('/prodotto/')) return { page: 'product', id: pathname.replace('/prodotto/', '') };
  if (pathname.startsWith('/blog/')) return { page: 'blog-post', id: pathname.replace('/blog/', '') };
  const found = Object.entries(PAGE_TO_PATH).find(([, p]) => p === pathname);
  return found ? { page: found[0] } : { page: '404' };
}

// Install global error logger once at module load
installErrorLogger();

// Sync current page with Builder Context
function BuilderPageSync({ currentPage }: { currentPage: string }) {
  const { setPageId } = useBuilder();
  useEffect(() => {
    setPageId(currentPage);
  }, [currentPage, setPageId]);
  return null;
}

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Product = lazy(() => import('./pages/Product').then(m => ({ default: m.Product })));
const Shop = lazy(() => import('./pages/Shop').then(m => ({ default: m.Shop })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const Compare = lazy(() => import('./pages/Compare').then(m => ({ default: m.Compare })));
const AboutUs = lazy(() => import('./pages/AboutUs').then(m => ({ default: m.AboutUs })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy').then(m => ({ default: m.CookiePolicy })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Blog = lazy(() => import('./pages/Blog').then(m => ({ default: m.Blog })));
const BlogPost = lazy(() => import('./pages/BlogPost').then(m => ({ default: m.BlogPost })));
const Quiz = lazy(() => import('./pages/Quiz').then(m => ({ default: m.Quiz })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
    <Loader2 className="w-12 h-12 text-brand-orange animate-spin" />
    <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">Caricamento Esperienza...</p>
  </div>
);

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface FlyingItem {
  id: string;
  image: string;
  startX: number;
  startY: number;
}

export default function App() {
  const initialRoute = pathToPage(window.location.pathname);
  const [currentPage, setCurrentPage] = useState(initialRoute.page);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(initialRoute.id || null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'canceled' | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [compareList, setCompareList] = useState<ProductType[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const isPopState = useRef(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, []);

  const triggerFlyToCart = useCallback((image: string, startX: number, startY: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    setFlyingItems(prev => [...prev, { id, image, startX, startY }]);
    setTimeout(() => {
      setFlyingItems(prev => prev.filter(item => item.id !== id));
    }, 1000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleCompare = (product: ProductType) => {
    setCompareList(prev => {
      if (prev.find(p => p.id === product.id)) {
        return prev.filter(p => p.id !== product.id);
      }
      if (prev.length < 3) {
        return [...prev, product];
      }
      showToast("Hai raggiunto il limite massimo di 3 prodotti per il confronto.", "info");
      return prev;
    });
  };

  useEffect(() => {
    // Check URL parameters for payment redirect status
    const query = new URLSearchParams(window.location.search);
    if (query.get('success')) {
      setPaymentStatus('success');
      window.history.replaceState(null, '', window.location.pathname);
    }
    if (query.get('canceled')) {
      setPaymentStatus('canceled');
      window.history.replaceState(null, '', window.location.pathname);
    }
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
      setSelectedProductId(route.id || null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleNavigate = (page: string, productId?: string) => {
    setCurrentPage(page);
    setSelectedProductId(productId || null);
    // Update browser URL
    let path = PAGE_TO_PATH[page] || '/';
    if (page === 'product' && productId) path = `/prodotto/${productId}`;
    if (page === 'blog-post' && productId) path = `/blog/${productId}`;
    window.history.pushState({ page, productId }, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdminPage = currentPage === 'admin';

  return (
    <AIFeaturesProvider>
    <BuilderProvider>
      <div className="min-h-screen flex flex-col font-sans relative bg-zinc-950">
        <BuilderPageSync currentPage={currentPage} />
        <BuilderToolbar />
        <CustomCursor />
      
      {/* Toast Notifications */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-3 pointer-events-none w-full max-w-md px-4">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] border backdrop-blur-xl ${
                toast.type === 'success' ? 'bg-zinc-900/90 border-green-500/50 text-white' :
                toast.type === 'error' ? 'bg-zinc-900/90 border-red-500/50 text-white' :
                'bg-zinc-900/90 border-brand-orange/50 text-white'
              }`}
            >
              <div className={`p-2 rounded-full ${
                toast.type === 'success' ? 'bg-green-500/20 text-green-500' :
                toast.type === 'error' ? 'bg-red-500/20 text-red-500' :
                'bg-brand-orange/20 text-brand-orange'
              }`}>
                {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
                {toast.type === 'info' && <MessageCircle className="w-4 h-4" />}
              </div>
              <span className="font-bold text-sm flex-1">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="text-white/30 hover:text-white transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Fly to Cart Animation */}
      <AnimatePresence>
        {flyingItems.map(item => (
          <motion.div
            key={item.id}
            initial={{ left: item.startX, top: item.startY, scale: 1, opacity: 1 }}
            animate={{ 
              left: document.getElementById('cart-button')?.getBoundingClientRect().left || 0, 
              top: document.getElementById('cart-button')?.getBoundingClientRect().top || 0,
              scale: 0.2,
              opacity: 0.5
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed z-[2000] pointer-events-none w-16 h-16 rounded-full overflow-hidden border-2 border-brand-orange shadow-lg"
          >
            <img src={getDirectDriveUrl(item.image)} alt="" className="w-full h-full object-cover" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Payment Status Toasts */}
      <AnimatePresence>
        {paymentStatus === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[1100] bg-zinc-900 border border-green-500/50 text-white px-8 py-6 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex items-center gap-6 backdrop-blur-xl max-w-lg w-full mx-4"
          >
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-lg tracking-tight">Pagamento Completato!</h4>
              <p className="text-sm text-zinc-400">Riceverai a breve un'email di conferma con i dettagli dell'ordine.</p>
            </div>
            <button onClick={() => setPaymentStatus(null)} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
        
        {paymentStatus === 'canceled' && (
          <motion.div 
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[1100] bg-zinc-900 border border-white/10 text-white px-8 py-6 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex items-center gap-6 backdrop-blur-xl max-w-lg w-full mx-4"
          >
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-zinc-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-lg tracking-tight">Pagamento Annullato</h4>
              <p className="text-sm text-zinc-400">Il tuo ordine non è stato processato. Puoi riprovare quando vuoi.</p>
            </div>
            <button onClick={() => setPaymentStatus(null)} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!isAdminPage && <Navbar onNavigate={handleNavigate} onOpenCart={() => setIsCartOpen(true)} />}
      
      <main className="flex-grow relative">
        <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
              {currentPage === 'shop' && <Shop onNavigate={handleNavigate} compareList={compareList} toggleCompare={toggleCompare} showToast={showToast} triggerFlyToCart={triggerFlyToCart} />}
              {currentPage === 'product' && <Product productId={selectedProductId} onNavigate={handleNavigate} showToast={showToast} triggerFlyToCart={triggerFlyToCart} />}
              {currentPage === 'admin' && <Admin onNavigate={handleNavigate} />}
              {currentPage === 'compare' && <Compare onNavigate={handleNavigate} initialProducts={compareList} showToast={showToast} triggerFlyToCart={triggerFlyToCart} />}
              {currentPage === 'blog' && <Blog onNavigate={handleNavigate} showToast={showToast} />}
              {currentPage === 'blog-post' && <BlogPost postId={selectedProductId} onNavigate={handleNavigate} showToast={showToast} triggerFlyToCart={triggerFlyToCart} />}
              {currentPage === 'quiz' && <Quiz onNavigate={handleNavigate} showToast={showToast} triggerFlyToCart={triggerFlyToCart} />}
              {currentPage === 'profile' && <Profile onNavigate={handleNavigate} />}
              {currentPage === 'about' && <AboutUs onNavigate={handleNavigate} />}
              {currentPage === 'contact' && <Contact />}
              {currentPage === 'terms' && <Terms />}
              {currentPage === 'privacy' && <Privacy />}
              {currentPage === 'cookie-policy' && <CookiePolicy />}
              {currentPage === '404' && <NotFound onNavigate={handleNavigate} />}
            </motion.div>
          </AnimatePresence>
        </Suspense>
        </ErrorBoundary>
      </main>

      {!isAdminPage && <Footer onNavigate={handleNavigate} />}
      {!isAdminPage && <Chatbot />}
      {!isAdminPage && <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onNavigate={handleNavigate} showToast={showToast} />}
      {!isAdminPage && <CookieBanner onNavigate={handleNavigate} />}
      </div>
    </BuilderProvider>
    </AIFeaturesProvider>
  );
}



