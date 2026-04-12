import { ShoppingCart, Menu, X, Search, User, ChevronDown, MessageCircle, LogOut, Package, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
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
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const isAdmin = user?.email?.toLowerCase() === 'officinadelsuono99@gmail.com';

  // Sincronizza carrello con Firestore quando l'utente è loggato
  useCartSync();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Errore durante il logout:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-[100] bg-zinc-950/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-3 cursor-pointer group min-w-0" onClick={() => onNavigate('home')}>
            <Logo className="w-10 h-10 group-hover:scale-110 transition-transform duration-300 shrink-0" />
            <span className="hidden sm:inline text-2xl font-black tracking-tighter uppercase">
              Officina<span className="text-brand-orange">delsuono</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <div className="relative group">
              <button 
                onClick={() => onNavigate('shop')} 
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-brand-orange hover:bg-brand-orange/10 rounded-full transition-all"
              >
                Prodotti <ChevronDown className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-300" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden transform origin-top-left scale-95 group-hover:scale-100">
                <div className="p-3 flex flex-col gap-1">
                  <button
                    onClick={() => onNavigate('shop')}
                    className="flex items-center gap-3 text-left px-4 py-3 text-sm font-bold text-brand-orange hover:text-white hover:bg-brand-orange/10 rounded-xl transition-all group/item border border-brand-orange/20 bg-brand-orange/5 mb-1"
                  >
                    <div className="p-2 bg-brand-orange/20 rounded-lg">
                      <Package size={20} strokeWidth={1.5} className="text-brand-orange" />
                    </div>
                    Setup Curati by Amerigo
                  </button>
                  {CATEGORIES_DATA.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => onNavigate('shop')}
                      className="flex items-center gap-3 text-left px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-all group/item"
                    >
                      <div className="p-2 bg-zinc-800 rounded-lg group-hover/item:bg-brand-orange/20 group-hover/item:text-brand-orange transition-colors">
                        <cat.icon size={20} strokeWidth={1.5} />
                      </div>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <button onClick={() => onNavigate('compare')} className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-brand-orange hover:bg-brand-orange/10 rounded-full transition-all">Confronta</button>
            <button onClick={() => onNavigate('blog')} className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-brand-orange hover:bg-brand-orange/10 rounded-full transition-all">Blog</button>
            <button onClick={() => onNavigate('about')} className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-brand-orange hover:bg-brand-orange/10 rounded-full transition-all">Chi Siamo</button>
            <button onClick={() => onNavigate('contact')} className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-brand-orange hover:bg-brand-orange/10 rounded-full transition-all">Contatti</button>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full text-sm font-bold transition-all border border-white/10">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="hidden sm:block">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </button>
                <div className="absolute right-0 mt-2 w-52 bg-zinc-900 border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    <button
                      onClick={() => onNavigate('profile')}
                      className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Il mio profilo
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => onNavigate('admin')}
                        className="w-full text-left px-4 py-2 text-sm text-brand-orange hover:text-white hover:bg-brand-orange/10 rounded-lg flex items-center gap-2 font-bold border-t border-white/5 mt-1 pt-3"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Pannello Admin
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 border-t border-white/5 mt-1 pt-3"
                    >
                      <LogOut className="w-4 h-4" />
                      Esci
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 bg-white/5 hover:bg-brand-orange text-white px-4 py-2 rounded-full text-sm font-bold transition-all border border-white/10 hover:border-brand-orange shadow-sm"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:block">Accedi</span>
              </button>
            )}

            <button id="cart-button" onClick={onOpenCart} className="p-2 hover:text-brand-orange transition-colors relative">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-brand-orange text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button className="md:hidden p-2 hover:text-brand-orange transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="w-6 h-6" />
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
                      <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
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
