import React, { useState, useEffect, useCallback } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs, doc, onSnapshot, query, orderBy, setDoc, getDoc, limit } from 'firebase/firestore';
import { LogOut, Settings, User as UserIcon, LayoutDashboard, Package, ScrollText, Megaphone, Bot, Activity, Users as UsersIcon, ChevronRight, ShieldAlert, Loader2, Globe, Share2, BrainCircuit, Pencil, X, Tag, Mail, AlertTriangle, Receipt, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBuilder } from '../contexts/BuilderContext';
import { Logo } from '../components/Logo';
import { AIFeaturesPanel } from '../components/admin/AIFeaturesPanel';
import { AdminNewsletterPanel } from '../components/admin/AdminNewsletterPanel';
import { AdminBlogPanel } from '../components/admin/AdminBlogPanel';
import { AdminDiscountsPanel } from '../components/admin/AdminDiscountsPanel';
import { AdminSiteContentPanel } from '../components/admin/AdminSiteContentPanel';
import { AdminInventoryPanel } from '../components/admin/AdminInventoryPanel';
import { AdminUsersPanel } from '../components/admin/AdminUsersPanel';
import { AdminMonitoringPanel } from '../components/admin/AdminMonitoringPanel';
import { AdminSocialPanel } from '../components/admin/AdminSocialPanel';
import { AdminAIChatbotPanel } from '../components/admin/AdminAIChatbotPanel';
import { AdminInvoicesPanel } from '../components/admin/AdminInvoicesPanel';
import { AdminShippingPanel } from '../components/admin/AdminShippingPanel';
import {
  Product, AdminUser, ErrorLog, BlogPost, DiscountCode,
  AIKnowledge, AILog, SocialPost, SocialSuggestion,
  SocialConnection, SocialStats, Invoice
} from '../types/admin';

const ADMIN_EMAIL = 'officinadelsuono99@gmail.com';

type AdminTab = 'dashboard' | 'products' | 'discounts' | 'content' | 'newsletter' | 'blog' | 'ai' | 'monitoring' | 'users' | 'ai_features' | 'social' | 'fatture' | 'shipping';

interface NavItem {
  id: AdminTab;
  label: string;
  description: string;
  icon: any; // Using any temporarily to avoid lucide-react inference conflicts with AdminTab mapping
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Panoramica generale del sito', icon: LayoutDashboard },
  { id: 'products', label: 'Prodotti', description: 'Gestisci il catalogo', icon: Package },
  { id: 'blog', label: 'Blog', description: 'Articoli e contenuti editoriali', icon: ScrollText },
  { id: 'discounts', label: 'Codici Sconto', description: 'Crea e gestisci coupon', icon: Tag },
  { id: 'newsletter', label: 'Newsletter', description: 'Invia email agli iscritti', icon: Megaphone },
  { id: 'content', label: 'Contenuti Sito', description: 'Modifica testi homepage', icon: Globe },
  { id: 'ai', label: 'AI Chatbot', description: 'Addestra il chatbot', icon: Bot },
  { id: 'ai_features', label: 'Funzionalità AI', description: 'Attiva/disattiva AI features', icon: BrainCircuit },
  { id: 'social', label: 'Social Media', description: 'Pubblica e gestisci i social', icon: Share2 },
  { id: 'shipping', label: 'Spedizioni', description: 'Corrieri, tariffe e preventivi', icon: Truck },
  { id: 'fatture', label: 'Fatture', description: 'Gestione fatture acquisto e vendita', icon: Receipt },
  { id: 'users', label: 'Utenti', description: 'Clienti registrati', icon: UsersIcon },
  { id: 'monitoring', label: 'Monitoring', description: 'Errori e performance', icon: Activity },
];

// Use imported Product interface

interface AdminProps {
  onNavigate?: (page: string) => void;
}

export function Admin({ onNavigate }: AdminProps) {
  const { isBuilderMode, activateBuilderMode, deactivateBuilderMode } = useBuilder();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Dashboard stats
  const [newsletterCount, setNewsletterCount] = useState(0);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<AdminUser[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Blog state
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

  // Discount codes state
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);

  // AI Chatbot state
  const [aiKnowledge, setAiKnowledge] = useState<AIKnowledge[]>([]);
  const [aiLogs, setAiLogs] = useState<AILog[]>([]);

  // Invoice state
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Social state
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [socialSuggestions, setSocialSuggestions] = useState<SocialSuggestion[]>([]);
  const [socialConnections, setSocialConnections] = useState<Record<string, SocialConnection>>({});
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [manualApiKey, setManualApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Effects
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email?.toLowerCase() === ADMIN_EMAIL) {
        setIsAdmin(true);
        loadStats();
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadStats = useCallback(async () => {
    // Load counts and logs for dashboard
    const newsSnap = await getDocs(collection(db, 'newsletter'));
    setNewsletterCount(newsSnap.size);

    const errorQ = query(collection(db, 'error_logs'), orderBy('timestamp', 'desc'), limit(50));
    const errorSnap = await getDocs(errorQ);
    setErrorLogs(errorSnap.docs.map(d => ({ id: d.id, ...d.data() } as ErrorLog)));

    const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100)));
    setRegisteredUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as AdminUser)));
    
    loadProducts();
    loadBlogPosts();
    loadDiscounts();
    loadAiData();
    loadSocialData();
    loadInvoices();
  }, []);

  const loadProducts = () => {
    return onSnapshot(collection(db, 'products'), (snapshot) => {
      const prods: Product[] = [];
      const cats = new Set<string>(['Kit Pronti', 'Console', 'Mixer', 'Cuffie', 'Monitor', 'Cavi', 'Accessori', 'Flight Case', 'Supporti']);
      snapshot.forEach(doc => {
        const data = doc.data() as Omit<Product, 'id'>;
        prods.push({ ...data, id: doc.id } as Product);
        if (data.category) cats.add(data.category);
      });
      setProducts(prods);
      setCategories(Array.from(cats).sort());
    });
  };

  const loadBlogPosts = () => {
    return onSnapshot(query(collection(db, 'blog_posts'), orderBy('date', 'desc')), (snapshot) => {
      setBlogPosts(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as BlogPost)));
    });
  };

  const loadDiscounts = () => {
    return onSnapshot(collection(db, 'discount_codes'), (snapshot) => {
      setDiscounts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DiscountCode)));
    });
  };

  const loadAiData = () => {
    onSnapshot(collection(db, 'chatbot_knowledge'), s => setAiKnowledge(s.docs.map(d => ({ id: d.id, ...d.data() } as AIKnowledge))));
    onSnapshot(query(collection(db, 'chatbot_logs'), orderBy('timestamp', 'desc'), limit(50)), s => setAiLogs(s.docs.map(d => ({ id: d.id, ...d.data() } as AILog))));
  };

  const loadInvoices = () => {
    return onSnapshot(query(collection(db, 'invoices'), orderBy('date', 'desc')), s => {
      setInvoices(s.docs.map(d => ({ id: d.id, ...d.data() } as Invoice)));
    });
  };

  const loadSocialData = () => {
    onSnapshot(query(collection(db, 'social_posts'), orderBy('createdAt', 'desc'), limit(20)), s => setSocialPosts(s.docs.map(d => ({ id: d.id, ...d.data() } as SocialPost))));
    onSnapshot(query(collection(db, 'social_suggestions'), orderBy('createdAt', 'desc'), limit(10)), s => setSocialSuggestions(s.docs.map(d => ({ id: d.id, ...d.data() } as SocialSuggestion))));
    getDoc(doc(db, 'settings', 'social_connections')).then(s => s.exists() && setSocialConnections(s.data() as Record<string, SocialConnection>));
    getDoc(doc(db, 'settings', 'social_stats')).then(s => s.exists() && setSocialStats(s.data() as SocialStats));
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    setLoginLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email?.toLowerCase() !== ADMIN_EMAIL) {
        await signOut(auth);
        setLoginError('Accesso negato. Solo il proprietario può accedere al pannello.');
      }
    } catch (e: any) {
      if (e.code !== 'auth/popup-closed-by-user') setLoginError('Errore durante l\'accesso con Google.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdmin(false);
    onNavigate?.('home');
  };

  const handleSaveProfile = async () => {
    if (!profileImageUrl) return;
    setIsSavingProfile(true);
    try {
      await setDoc(doc(db, 'settings', 'profile'), { profileImage: profileImageUrl, updatedAt: new Date().toISOString() });
      setShowProfileSettings(false);
    } catch {
      alert("Errore salvataggio profilo.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
    </div>
  );

  if (!isAdmin) {
    const wrongUser = currentUser && currentUser.email?.toLowerCase() !== ADMIN_EMAIL;
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-orange/5 rounded-full blur-[120px]" />
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-orange to-orange-700 flex items-center justify-center shadow-2xl shadow-brand-orange/30">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black uppercase tracking-widest mb-2">Area Riservata</h1>
            <p className="text-zinc-500 text-sm">Accesso esclusivo al proprietario dell'officina</p>
          </div>
          {loginError && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm italic text-center">{loginError}</div>}
          {wrongUser ? (
             <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-sm">
               <p className="font-bold mb-1">Account non autorizzato</p>
               <p className="text-xs mb-3">Sei loggato come {currentUser?.email}.</p>
               <button onClick={handleLogout} className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-xs font-bold transition-colors">Disconnetti</button>
             </div>
          ) : (
            <button onClick={handleGoogleLogin} disabled={loginLoading} className="w-full py-4 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl font-bold transition-all flex items-center justify-center gap-3">
              {loginLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Accedi con Google</>}
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  const activeNav = NAV_ITEMS.find(i => i.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} shrink-0 border-r border-white/5 bg-black sticky top-0 h-screen flex flex-col transition-all duration-200`}>
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <Logo className="w-8 h-8 shrink-0" />
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-tighter leading-none truncate">Officina<span className="text-brand-orange">delsuono</span></p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Admin Panel</p>
            </div>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${isActive ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                {!sidebarCollapsed && isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" />}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={() => setSidebarCollapsed(v => !v)} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-2">
            {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : 'Comprimi'}
          </button>
          <div className={`flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" /> : <UserIcon className="w-4 h-4 text-brand-orange" />}
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{currentUser?.displayName || 'Admin'}</p>
                <p className="text-[10px] text-zinc-500 truncate">{currentUser?.email}</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
             <button onClick={handleLogout} className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition-colors border border-white/5">
               <LogOut className="w-3.5 h-3.5" /> Esci
             </button>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
          <div className="px-6 md:px-10 py-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                <span>Admin</span> <ChevronRight className="w-3 h-3" /> <span className="text-brand-orange">{activeNav.label}</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight">{activeNav.label}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowProfileSettings(!showProfileSettings)} className={`p-2.5 rounded-xl border ${showProfileSettings ? 'bg-brand-orange text-white border-brand-orange' : 'bg-zinc-900 text-zinc-400 border-white/5'}`}><UserIcon className="w-4 h-4" /></button>
              <button onClick={() => setShowAiSettings(!showAiSettings)} className={`p-2.5 rounded-xl border ${showAiSettings ? 'bg-brand-orange text-white border-brand-orange' : 'bg-zinc-900 text-zinc-400 border-white/5'}`}><Settings className="w-4 h-4" /></button>
              <button onClick={() => { activateBuilderMode(); onNavigate?.('home'); }} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-zinc-300 rounded-xl font-bold border border-brand-orange/40 text-xs uppercase hover:bg-brand-orange/10 transition-all"><Pencil className="w-3.5 h-3.5" /> Modifica Sito</button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-10 max-w-[1600px] w-full">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Prodotti', value: products.length, icon: Package, color: 'text-brand-orange', bg: 'bg-brand-orange/10' },
                  { label: 'Blog', value: blogPosts.length, icon: ScrollText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { label: 'Newsletter', value: newsletterCount, icon: Mail, color: 'text-green-400', bg: 'bg-green-500/10' },
                  { label: 'Coupon', value: discounts.length, icon: Tag, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                  { label: 'Chat AI', value: aiLogs.length, icon: Bot, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                  { label: 'Errori', value: errorLogs.length, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
                ].map(kpi => (
                  <div key={kpi.label} className={`p-5 rounded-2xl border border-white/5 ${kpi.bg} backdrop-blur-xl`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color} mb-3`} />
                    <div className={`text-3xl font-black ${kpi.color}`}>{kpi.value}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{kpi.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-4">Chat AI Recenti</h3>
                    <div className="space-y-2">
                       {aiLogs.slice(0, 5).map(log => (
                         <div key={log.id} className="p-3 bg-zinc-950 rounded-lg border border-white/5 text-xs truncate">
                           <span className="text-brand-orange font-bold">👤 {log.userMessage}</span>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-4">Stato Servizi</h3>
                    <div className="space-y-3">
                       {['Firestore', 'Auth', 'Functions', 'Storage'].map(s => (
                         <div key={s} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-white/5 text-xs">
                           <span>{s}</span>
                           <span className="text-green-400 font-bold uppercase tracking-widest">Online</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && <AdminInventoryPanel products={products} categories={categories} manualApiKey={manualApiKey} />}
          {activeTab === 'content' && <AdminSiteContentPanel />}
          {activeTab === 'newsletter' && <AdminNewsletterPanel newsletterCount={newsletterCount} products={products} manualApiKey={manualApiKey} />}
          {activeTab === 'blog' && <AdminBlogPanel blogPosts={blogPosts} manualApiKey={manualApiKey} />}
          {activeTab === 'ai' && <AdminAIChatbotPanel aiKnowledge={aiKnowledge} aiLogs={aiLogs} products={products} />}
          {activeTab === 'social' && <AdminSocialPanel socialPosts={socialPosts} socialSuggestions={socialSuggestions} socialConnections={socialConnections} socialStats={socialStats || { updatedAt: new Date().toISOString() }} manualApiKey={manualApiKey} products={products} loadSocialData={loadSocialData} />}
          {activeTab === 'users' && <AdminUsersPanel registeredUsers={registeredUsers} newsletterCount={newsletterCount} loadStats={loadStats} />}
          {activeTab === 'monitoring' && <AdminMonitoringPanel errorLogs={errorLogs} setErrorLogs={setErrorLogs} loadStats={loadStats} products={products} blogPosts={blogPosts} discounts={discounts} aiKnowledge={aiKnowledge} manualApiKey={manualApiKey} />}
          {activeTab === 'ai_features' && <AIFeaturesPanel currentUser={currentUser} />}
          {activeTab === 'shipping' && <AdminShippingPanel />}
          {activeTab === 'fatture' && <AdminInvoicesPanel invoices={invoices} />}
        </div>
      </main>

      <AnimatePresence>
        {showProfileSettings && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-lg w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Foto Profilo</h3>
                <button onClick={() => setShowProfileSettings(false)}><X className="w-5 h-5 text-zinc-500" /></button>
              </div>
              <input type="text" value={profileImageUrl} onChange={e => setProfileImageUrl(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm mb-4" placeholder="URL Immagine..." />
              <button onClick={handleSaveProfile} className="w-full py-3 bg-brand-orange text-white font-bold rounded-xl">Salva</button>
            </motion.div>
          </div>
        )}
        {showAiSettings && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-lg w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Configurazione AI</h3>
                <button onClick={() => setShowAiSettings(false)}><X className="w-5 h-5 text-zinc-500" /></button>
              </div>
              <input type="password" value={manualApiKey} onChange={e => setManualApiKey(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm mb-4" placeholder="Gemini API Key..." />
              <button onClick={() => setShowAiSettings(false)} className="w-full py-3 bg-brand-orange text-white font-bold rounded-xl">Chiudi</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
