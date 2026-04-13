import { ShoppingCart, Menu, X, Search, User, ChevronDown, MessageCircle, LogOut, Package, ShieldCheck } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { useCartSync } from '../hooks/useCartSync';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { AuthModal } from './AuthModal';
import { Logo } from './Logo';
import { CATEGORIES_DATA } from '../constants';

interface NavbarProps {
  onNavigate: (page: string) => void;
  onOpenCart: () => void;
}

export function Navbar({ onNavigate, onOpenCart }: NavbarProps) {
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const isAdmin = user?.email?.toLowerCase() === 'officinadelsuono99@gmail.com';

  const shopRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useCartSync();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (shopRef.current && !shopRef.current.contains(e.target as Node)) setIsShopOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error("Errore durante il logout:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-[100] bg-zinc-950/95 backdrop-blur-sm border-b border-white/10" role="navigation" aria-label="Menu principale">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-3 cursor-pointer group min-w-0" onClick={() => onNavigate('home')}>
            <Logo className="w-10 h-10 group-hover:scale-110 transition-transform duration-300 shrink-0" />
            <span className="hidden sm:inline text-2xl font-black tracking-tighter uppercase">
              Officina<span className="text-brand-orange">delsuono</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-1 lg:space-x-3">
            {/* Products dropdown — click-based */}
            <div className="relative" ref={shopRef}>
              <button
                onClick={() => setIsShopOpen(!isShopOpen)}
                aria-expanded={isShopOpen}
                aria-haspopup="true"
                className="flex items-center gap-1.5 px-4 py-3 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-brand-orange hover:bg-brand-orange/10 rounded-full transition-all"
              >
                Prodotti <ChevronDown className={`w-4 h-4 opacity-50 transition-transform duration-300 ${isShopOpen ? 'rotate-180 opacity-100' : ''}`} />
              </button>
              <AnimatePresence>
                {isShopOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.15 }}
                    role="menu"
                    className="absolute top-full left-0 mt-2 w-64 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 flex flex-col gap-1">
                      <button
                        role="menuitem"
                        onClick={() => { onNavigate('shop'); setIsShopOpen(false); }}
                        className="flex items-center gap-3 text-left px-4 py-3 text-sm font-bold text-brand-orange hover:text-white hover:bg-brand-orange/10 rounded-xl transition-all border border-brand-orange/20 bg-brand-orange/5 mb-1"
                      >
                        <div className="p-2 bg-brand-orange/20 rounded-lg">
                          <Package size={20} strokeWidth={1.5} className="text-brand-orange" />
                        </div>
                        Setup Curati by Amerigo
                      </button>
                      {CATEGORIES_DATA.map((cat) => (
                        <button
                          key={cat.slug}
                          role="menuitem"
                          onClick={() => { onNavigate('shop'); setIsShopOpen(false); sessionStorage.setItem('shopCategory', cat.label); }}
                          className="flex items-center gap-3 text-left px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                          <div className="p-2 bg-zinc-800 rounded-lg">
                            <cat.icon size={20} strokeWidth={1.5} />
                          </div>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => onNavigate('compare')} className="px-4 py-3 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-brand-orange hover:bg-brand-orange/10 rounded-full transition-all">Confronta</button>
            <button onClick={() => onNavigate('blog')} className="px-4 py-3 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-brand-orange hover:bg-brand-orange/10 rounded-full transition-all">Blog</button>
            <button onClick={() => onNavigate('about')} className="px-4 py-3 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-brand-orange hover:bg-brand-orange/10 rounded-full transition-all">Chi Siamo</button>
            <button onClick={() => onNavigate('contact')} className="px-4 py-3 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-brand-orange hover:bg-brand-orange/10 rounded-full transition-all">Contatti</button>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-full text-sm font-bold transition-all border border-white/10"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="hidden sm:block">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </button>
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      transition={{ duration: 0.15 }}
                      role="menu"
                      className="absolute right-0 mt-2 w-52 bg-zinc-900 border border-white/10 rounded-xl shadow-xl z-50"
                    >
                      <div className="p-2">
                        <button
                          role="menuitem"
                          onClick={() => { onNavigate('profile'); setIsUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          Il mio profilo
                        </button>
                        {isAdmin && (
                          <button
                            role="menuitem"
                            onClick={() => { onNavigate('admin'); setIsUserMenuOpen(false); }}
                            className="w-full text-left px-4 py-3 text-sm text-brand-orange hover:text-white hover:bg-brand-orange/10 rounded-lg flex items-center gap-2 font-bold border-t border-white/5 mt-1 pt-3"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Pannello Admin
                          </button>
                        )}
                        <button
                          role="menuitem"
                          onClick={() => { handleLogout(); setIsUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 border-t border-white/5 mt-1 pt-3"
                        >
                          <LogOut className="w-4 h-4" />
                          Esci
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 bg-white/5 hover:bg-brand-orange text-white px-4 py-2.5 rounded-full text-sm font-bold transition-all border border-white/10 hover:border-brand-orange shadow-sm"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:block">Accedi</span>
              </button>
            )}

            <button id="cart-button" onClick={onOpenCart} aria-label={`Carrello, ${cartCount} prodotti`} className="p-3 hover:text-brand-orange transition-colors relative">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-brand-orange text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              className="md:hidden p-3 hover:text-brand-orange transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu mobile"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-zinc-950 border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              <button onClick={() => { onNavigate('shop'); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-4 text-lg font-bold text-zinc-300 hover:text-brand-orange hover:bg-white/5 uppercase tracking-wider transition-colors border-b border-white/5">Prodotti</button>
              <button onClick={() => { onNavigate('compare'); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-4 text-lg font-bold text-zinc-300 hover:text-brand-orange hover:bg-white/5 uppercase tracking-wider transition-colors border-b border-white/5">Confronta</button>
              <button onClick={() => { onNavigate('blog'); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-4 text-lg font-bold text-zinc-300 hover:text-brand-orange hover:bg-white/5 uppercase tracking-wider transition-colors border-b border-white/5">Blog</button>
              <button onClick={() => { onNavigate('about'); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-4 text-lg font-bold text-zinc-300 hover:text-brand-orange hover:bg-white/5 uppercase tracking-wider transition-colors border-b border-white/5">Chi Siamo</button>
              <button onClick={() => { onNavigate('contact'); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-4 text-lg font-bold text-zinc-300 hover:text-brand-orange hover:bg-white/5 uppercase tracking-wider transition-colors border-b border-white/5">Contatti</button>

              {!user ? (
                <button
                  onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                  className="block w-full text-left px-4 py-5 text-lg font-black text-brand-orange hover:bg-white/5 uppercase tracking-widest mt-4"
                >
                  Accedi / Registrati
                </button>
              ) : (
                <div className="pt-4">
                  <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-white/5 rounded-2xl">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <span className="font-bold">{user.displayName || user.email?.split('@')[0]}</span>
                  </div>
                  <button
                    onClick={() => { onNavigate('profile'); setIsMenuOpen(false); }}
                    className="block w-full text-left px-4 py-4 text-base font-bold text-zinc-300 hover:text-brand-orange uppercase tracking-wider"
                  >
                    Il mio profilo
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => { onNavigate('admin'); setIsMenuOpen(false); }}
                      className="block w-full text-left px-4 py-4 text-base font-black text-brand-orange hover:text-white uppercase tracking-wider border-t border-white/5"
                    >
                      Pannello Admin
                    </button>
                  )}
                  <button
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="block w-full text-left px-4 py-4 text-base font-bold text-zinc-500 hover:text-white uppercase tracking-wider"
                  >
                    Esci
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
}
