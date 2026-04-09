import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Share2, ChevronRight, ShoppingCart, Loader2, MessageCircle, Award, Bookmark, ArrowUp } from 'lucide-react';
import { MOCK_POSTS } from './Blog';
import { collection, getDocs, query, limit, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface BlogPostProps {
  postId: string | null;
  onNavigate: (page: string, id?: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  triggerFlyToCart?: (image: string, startX: number, startY: number) => void;
}

const BLOG_STYLES = `
  /* ── Reset base ── */
  .article-body * { box-sizing: border-box; }

  /* ── Headings ── */
  .article-body h2 {
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 900;
    color: #ffffff;
    letter-spacing: -0.03em;
    line-height: 1.2;
    margin: 3.5rem 0 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid rgba(255,95,0,0.2);
    position: relative;
  }
  .article-body h2::before {
    content: '';
    position: absolute;
    bottom: -2px; left: 0;
    width: 3rem; height: 2px;
    background: #ff5f00;
  }
  .article-body h3 {
    font-size: clamp(1.125rem, 2.5vw, 1.35rem);
    font-weight: 800;
    color: #ff5f00;
    letter-spacing: -0.01em;
    line-height: 1.35;
    margin: 2.5rem 0 0.875rem;
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  /* ── Body text ── */
  .article-body p {
    font-size: clamp(1rem, 1.5vw, 1.1rem);
    color: #d4d4d8;
    line-height: 1.9;
    margin-bottom: 1.5rem;
  }
  .article-body strong { color: #ffffff; font-weight: 700; }
  .article-body em { color: #a1a1aa; font-style: italic; }
  .article-body a { color: #ff5f00; text-decoration: underline; text-underline-offset: 3px; }
  .article-body a:hover { color: #fb923c; }

  /* ── Lists ── */
  .article-body ul, .article-body ol {
    margin: 1.75rem 0;
    padding-left: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }
  .article-body li {
    position: relative;
    padding-left: 1.75rem;
    color: #d4d4d8;
    font-size: clamp(0.95rem, 1.4vw, 1.05rem);
    line-height: 1.75;
  }
  .article-body ul li::before {
    content: '';
    position: absolute;
    left: 0; top: 0.65em;
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #ff5f00;
  }
  .article-body ol { counter-reset: list-counter; }
  .article-body ol li { counter-increment: list-counter; }
  .article-body ol li::before {
    content: counter(list-counter);
    position: absolute;
    left: 0; top: 0;
    font-size: 0.75rem;
    font-weight: 900;
    color: #ff5f00;
    background: rgba(255,95,0,0.1);
    border-radius: 50%;
    width: 1.25rem; height: 1.25rem;
    display: flex; align-items: center; justify-content: center;
    line-height: 1.25rem;
    text-align: center;
  }

  /* ── Blockquote ── */
  .article-body blockquote {
    position: relative;
    margin: 2.5rem 0;
    padding: 1.5rem 1.75rem 1.5rem 2.5rem;
    border-left: 4px solid #ff5f00;
    background: linear-gradient(135deg, rgba(255,95,0,0.07) 0%, rgba(255,95,0,0.02) 100%);
    border-radius: 0 1rem 1rem 0;
  }
  .article-body blockquote::before {
    content: '"';
    position: absolute;
    top: -0.5rem; left: 1rem;
    font-size: 5rem;
    font-family: Georgia, serif;
    color: rgba(255,95,0,0.2);
    line-height: 1;
  }
  .article-body blockquote p {
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 500;
    font-style: italic;
    margin-bottom: 0;
    line-height: 1.7;
  }

  /* ── Images ── */
  .article-body img {
    width: 100%;
    border-radius: 1rem;
    margin: 2rem 0;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  }

  /* ── Drop cap first paragraph ── */
  .article-body > p:first-of-type::first-letter {
    float: left;
    font-size: 4.5rem;
    font-weight: 900;
    line-height: 0.75;
    margin: 0.1em 0.12em 0 0;
    color: #ff5f00;
    font-family: Georgia, serif;
  }
`;

export function BlogPost({ postId, onNavigate, showToast, triggerFlyToCart }: BlogPostProps) {
  const [post, setPost] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Array<Record<string, unknown>>>([]);
  const [email, setEmail] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    const update = () => {
      const bar = document.getElementById('rp-bar');
      const scrollTop = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = `scaleX(${docH > 0 ? scrollTop / docH : 0})`;
      setShowBackTop(scrollTop > 600);
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, 'blog_posts', postId));
        setPost(postDoc.exists() ? { id: postDoc.id, ...postDoc.data() } : MOCK_POSTS.find(p => p.id === postId) || null);
      } catch {
        setPost(MOCK_POSTS.find(p => p.id === postId) || null);
      } finally {
        setLoading(false);
      }
    };
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'products'), limit(2)));
        setRelatedProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch {}
    };
    fetchPost();
    fetchProducts();
  }, [postId]);

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
        <p className="text-zinc-500 text-sm">Caricamento articolo…</p>
      </div>
    </div>
  );

  if (!post) return (
    <div className="min-h-screen bg-zinc-950 pt-32 flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-6">📭</p>
        <h2 className="text-2xl font-black text-white mb-4">Articolo non trovato</h2>
        <button onClick={() => onNavigate('blog')} className="text-brand-orange hover:underline flex items-center gap-2 mx-auto">
          <ArrowLeft className="w-4 h-4" /> Torna al Blog
        </button>
      </div>
    </div>
  );

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post.title, text: post.excerpt, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast?.('Link copiato!', 'success');
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: Record<string, unknown>) => {
    e.stopPropagation();
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const item = cart.find((i: Record<string, unknown>) => i.id === product.id);
    if (item) item.quantity += 1; else cart.push({ ...product, quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    if (triggerFlyToCart) {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      triggerFlyToCart(product.image, r.left, r.top);
    }
    showToast?.(`${product.name} aggiunto al carrello`);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !privacyConsent) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'newsletter_subscriptions'), {
        email, privacyConsent, marketingConsent,
        source: 'blog_post', postId,
        timestamp: new Date().toISOString()
      });
      showToast?.('Iscrizione completata!', 'success');
      setEmail(''); setPrivacyConsent(false); setMarketingConsent(false);
    } catch {
      showToast?.('Errore. Riprova.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="min-h-screen bg-zinc-950 text-white">
      <style dangerouslySetInnerHTML={{ __html: BLOG_STYLES }} />

      {/* ── Reading Progress ── */}
      <div className="fixed top-0 left-0 right-0 z-[200] h-[3px] bg-zinc-800/40">
        <div id="rp-bar" className="h-full bg-brand-orange origin-left" style={{ transform: 'scaleX(0)', transition: 'transform 0.1s linear' }} />
      </div>

      {/* ── Back to Top ── */}
      {showBackTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-6 z-50 w-10 h-10 rounded-full bg-brand-orange shadow-lg shadow-brand-orange/30 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <ArrowUp className="w-5 h-5 text-white" />
        </motion.button>
      )}

      {/* ── HERO ── */}
      <div className="relative w-full" style={{ height: 'clamp(420px, 65vh, 750px)' }}>
        <img
          src={post.image}
          alt={post.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Layered gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/40 via-transparent to-transparent" />

        {/* Hero content */}
        <div className="absolute inset-0 flex flex-col justify-end pb-12 px-4 sm:px-8 lg:px-16">
          <div className="max-w-4xl">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => onNavigate('blog')}
              className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors mb-6 text-xs font-bold uppercase tracking-[0.2em]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Blog
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-wrap items-center gap-3 mb-5"
            >
              <span className="px-3 py-1 bg-brand-orange text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-full">
                {post.category}
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400 text-sm">
                <Clock className="w-3.5 h-3.5" /> {post.readTime} di lettura
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight mb-6 max-w-3xl"
            >
              {post.title}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center gap-5"
            >
              <div className="flex items-center gap-3">
                <img
                  src="/amerigo_hero.png"
                  alt={post.author}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-brand-orange/60"
                />
                <div>
                  <p className="text-white text-sm font-bold leading-none">{post.author}</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5">Esperto MAT Academy</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-zinc-400 text-sm">
                <Calendar className="w-3.5 h-3.5" /> {post.date}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  <Share2 className="w-4 h-4" /> Condividi
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── CONTENT LAYOUT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 py-12 lg:py-16">

          {/* ── MAIN COLUMN ── */}
          <main className="min-w-0 flex-1 max-w-[720px]">

            {/* Excerpt / Lead */}
            <p className="text-lg sm:text-xl text-zinc-200 leading-relaxed font-medium mb-10 pl-5 border-l-[3px] border-brand-orange">
              {post.excerpt}
            </p>

            {/* Article body */}
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: post.content || '<p>Contenuto in arrivo…</p>' }}
            />

            {/* ── Mid-content CTA WhatsApp ── */}
            <div className="my-14 overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-r from-green-950/40 via-zinc-900/60 to-zinc-900/40 relative">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-green-500/60 via-green-400/40 to-transparent" />
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-white font-black text-base mb-1">Hai dubbi su quale prodotto scegliere?</p>
                  <p className="text-zinc-400 text-sm">Scrivimi su WhatsApp — consulenza gratuita, rispondo in 15 minuti.</p>
                </div>
                <a
                  href="https://wa.me/393477397016?text=Ciao%20Amerigo!%20Ho%20letto%20l'articolo%20e%20vorrei%20un%20consiglio."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  Consulenza gratuita
                </a>
              </div>
            </div>

            {/* ── Prodotti consigliati ── */}
            {relatedProducts.length > 0 && (
              <div className="my-14">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-[2px] w-8 bg-brand-orange" />
                  <h4 className="text-sm font-black text-brand-orange uppercase tracking-[0.2em]">Prodotti Consigliati</h4>
                  <div className="h-[2px] flex-1 bg-white/5" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {relatedProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => onNavigate('product', product.id)}
                      className="group flex gap-4 p-4 rounded-2xl bg-zinc-900 border border-white/5 hover:border-brand-orange/40 hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0">
                        <img src={product.image as string} alt={product.name as string} loading="lazy" className="w-full h-full object-contain p-2" />
                      </div>
                      <div className="flex flex-col justify-between flex-1 min-w-0">
                        <p className="font-bold text-white text-sm line-clamp-2 group-hover:text-brand-orange transition-colors">{product.name as string}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-brand-orange font-black">€{typeof product.price === 'number' ? product.price.toFixed(2) : product.price as string}</span>
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                          >
                            <ShoppingCart className="w-3 h-3" /> Carrello
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Separatore ── */}
            <div className="flex items-center gap-4 my-12">
              <div className="h-px flex-1 bg-white/5" />
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                <div className="w-1.5 h-1.5 rounded-full bg-brand-orange/50" />
                <div className="w-1.5 h-1.5 rounded-full bg-brand-orange/20" />
              </div>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            {/* ── Author card ── */}
            <div className="rounded-2xl overflow-hidden border border-white/5 bg-zinc-900">
              <div className="h-1.5 bg-gradient-to-r from-brand-orange via-orange-400 to-transparent" />
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-start">
                <img
                  src="/amerigo_hero.png"
                  alt={post.author}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-brand-orange/30 shrink-0"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="text-lg font-black text-white">{post.author}</h4>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-orange/10 border border-brand-orange/20">
                      <Award className="w-3 h-3 text-brand-orange" />
                      <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider">MAT Certified</span>
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                    DJ certificato MAT Academy e fondatore di Officinadelsuono. Testo ogni prodotto sul campo prima di consigliarlo — nessun algoritmo, solo esperienza reale.
                  </p>
                  <a
                    href="https://wa.me/393477397016"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-green-400 hover:text-green-300 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Scrivimi su WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </main>

          {/* ── SIDEBAR ── */}
          <aside className="hidden lg:block w-72 xl:w-80 shrink-0">
            <div className="sticky top-24 flex flex-col gap-6">

              {/* Author mini */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <img src="/amerigo_hero.png" alt={post.author} className="w-11 h-11 rounded-xl object-cover ring-2 ring-brand-orange/30" />
                  <div>
                    <p className="font-black text-white text-sm leading-tight">{post.author}</p>
                    <p className="text-zinc-500 text-xs">Esperto Certificato MAT Academy</p>
                  </div>
                </div>
                <a
                  href="https://wa.me/393477397016?text=Ciao%20Amerigo!%20Ho%20letto%20il%20blog%20e%20vorrei%20un%20consiglio."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600/10 border border-green-500/20 text-green-400 font-bold text-sm hover:bg-green-600/20 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> Chiedimi un consiglio
                </a>
              </div>

              {/* TOC */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-white/5">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">In questo articolo</p>
                <ul className="space-y-2">
                  {[
                    'Introduzione', 'Cosa cercare', 'I migliori modelli',
                    'Per chi inizia', 'Prodotti consigliati', 'Conclusioni'
                  ].map((item, i) => (
                    <li key={i}>
                      <a href="#" className={`flex items-center gap-2 text-sm transition-colors py-0.5 ${i === 0 ? 'text-brand-orange font-bold' : 'text-zinc-400 hover:text-white'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${i === 0 ? 'bg-brand-orange' : 'bg-zinc-700'}`} />
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Newsletter */}
              <div className="rounded-2xl overflow-hidden border border-brand-orange/20">
                <div className="h-1 bg-gradient-to-r from-brand-orange to-orange-400" />
                <div className="p-5 bg-gradient-to-b from-brand-orange/5 to-zinc-900">
                  <div className="flex items-center gap-2 mb-3">
                    <Bookmark className="w-4 h-4 text-brand-orange" />
                    <p className="font-black text-white text-sm">Newsletter DJ</p>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed mb-4">
                    Guide, recensioni e offerte esclusive. Niente spam.
                  </p>
                  <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="La tua email"
                      required
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-brand-orange transition-colors disabled:opacity-50"
                    />
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox" id="prv-sb" checked={privacyConsent}
                        onChange={e => setPrivacyConsent(e.target.checked)}
                        required disabled={isSubmitting}
                        className="mt-0.5 accent-brand-orange shrink-0"
                      />
                      <label htmlFor="prv-sb" className="text-[10px] text-zinc-500 leading-snug cursor-pointer">
                        Accetto la <button type="button" onClick={() => onNavigate('privacy')} className="text-brand-orange underline">Privacy Policy</button>.*
                      </label>
                    </div>
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox" id="mkt-sb" checked={marketingConsent}
                        onChange={e => setMarketingConsent(e.target.checked)}
                        disabled={isSubmitting}
                        className="mt-0.5 accent-brand-orange shrink-0"
                      />
                      <label htmlFor="mkt-sb" className="text-[10px] text-zinc-500 leading-snug cursor-pointer">
                        Accetto comunicazioni promozionali.
                      </label>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting || !privacyConsent || !email}
                      className="w-full py-2.5 bg-brand-orange hover:bg-orange-500 text-white font-black text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Invio…</> : 'Iscriviti gratis'}
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
