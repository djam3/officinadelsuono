import { Check, MessageCircle, Shield, Truck, Zap, ShoppingCart, Star, UserCircle, Box as BoxIcon, X, PlusCircle, LogOut, Sparkles, Play, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useCartStore } from '../store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { getDirectDriveUrl } from '../utils/drive';
import { DJ_KNOWLEDGE_BASE } from '../data/djKnowledgeBase';
import { useAIFeatures } from '../contexts/AIFeaturesContext';
import { generateReviewSummary } from '../services/aiService';
import { Product as ProductType } from '../types/admin';


interface ProductProps {
  productId?: string | null;
  onNavigate?: (page: string, productId?: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  triggerFlyToCart: (image: string, startX: number, startY: number) => void;
}

interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: string | number;
}

export function Product({ productId, onNavigate, showToast, triggerFlyToCart }: ProductProps) {
  const { features } = useAIFeatures();
  const reviewsFeatureEnabled = features.recensioni_aggregate?.enabled ?? false;

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [product, setProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [user, setUser] = useState<import('firebase/auth').User | null>(null);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<{
    summary: string; pros: string[]; cons: string[]; verdict: string; disclaimer?: string;
  } | null>(null);
  const [isLoadingReviewSummary, setIsLoadingReviewSummary] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const activeProductId = productId || 'bundle-start-dj-pro';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      if (productId) {
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as ProductType);
        } else {
          setProduct(null);
        }
      } else {
        setProduct(null);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', activeProductId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs: Review[] = [];
      snapshot.forEach((doc) => {
        revs.push({ id: doc.id, ...doc.data() } as Review);
      });
      // Sort client-side to avoid needing a composite index immediately
      revs.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
      setReviews(revs);
    });
    return () => unsubscribe();
  }, [activeProductId]);

  const handleAddToCart = (e: React.MouseEvent) => {
    const itemToAdd = product ? {
      id: product.id || activeProductId,
      name: product.name,
      price: product.price || 0,
      image: product.image === 'USE_IMAGES_ARRAY' && product.images && product.images.length > 0
        ? product.images[0] 
        : (product.image || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80')
    } : {
      id: 'bundle-start-dj-pro',
      name: "Bundle Start DJ Pro",
      price: 1749.00,
      image: "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=2071&auto=format&fit=crop"
    };
    
    addItem(itemToAdd);
    triggerFlyToCart(itemToAdd.image, e.clientX, e.clientY);
    if (showToast) {
      showToast(`${itemToAdd.name} aggiunto al carrello!`, 'success');
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Devi effettuare l'accesso per lasciare una recensione.");
      return;
    }
    if (!newReviewText.trim()) return;

    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: activeProductId,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Utente Anonimo',
        rating: newReviewRating,
        text: newReviewText,
        createdAt: new Date().toISOString()
      });
      setNewReviewText('');
      setNewReviewRating(5);
    } catch (error) {
      console.error("Error adding review:", error);
      alert("Errore durante l'invio della recensione.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
    : 0;

  // Load or generate AI review summary when feature enabled + reviews exist
  useEffect(() => {
    if (!reviewsFeatureEnabled || reviews.length < 3) {
      setReviewSummary(null);
      return;
    }
    // Use cached summary from product doc if available
    if (product?.reviewSummary) {
      setReviewSummary(product.reviewSummary);
      return;
    }
    // Generate on the fly
    let cancelled = false;
    setIsLoadingReviewSummary(true);
    generateReviewSummary(
      { name: product?.name || 'Prodotto', category: product?.category },
      reviews.map(r => ({ rating: r.rating, text: r.text, userName: r.userName }))
    ).then(summary => {
      if (!cancelled) setReviewSummary(summary);
    }).catch(() => {
      if (!cancelled) setReviewSummary(null);
    }).finally(() => {
      if (!cancelled) setIsLoadingReviewSummary(false);
    });
    return () => { cancelled = true; };
  }, [reviewsFeatureEnabled, reviews.length, product?.id]);

  const displayProduct: ProductType = product || {
    id: "bundle-start-dj-pro",
    name: "Bundle Start DJ Pro",
    category: "Kit Pronti",
    price: 1749.00,
    image: "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=2071&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=2071&auto=format&fit=crop"],
    badge: "Best Seller",
    description: "Bundle completo per DJ"
  };

  useEffect(() => {
    const fetchAdvice = async () => {
      if (!displayProduct) return;

      setIsAiLoading(true);
      
      // Simulate internal AI processing
      setTimeout(() => {
        const name = displayProduct.name.toLowerCase();
        const category = displayProduct.category.toLowerCase();
        let advice = "";

        // 1. Check Knowledge Base for specific product
        for (const brand of Object.values(DJ_KNOWLEDGE_BASE.brands)) {
          for (const [prodId, prodDesc] of Object.entries(brand.products)) {
            if (name.includes(prodId)) {
              advice = `${prodDesc} Questo prodotto incarna la filosofia di ${brand.name}: ${brand.philosophy}`;
              break;
            }
          }
          if (advice) break;
        }

        // 2. Fallback to Category Advice
        if (!advice) {
          if (category.includes('console') || category.includes('controller')) {
            advice = "Ottima scelta per chi cerca versatilità. Questo controller offre un layout intuitivo ideale sia per chi inizia che per chi vuole un setup affidabile per i propri set.";
          } else if (category.includes('cassa') || category.includes('speaker') || category.includes('pa')) {
            advice = "Un sistema PA robusto e potente. Perfetto per eventi live e DJ set dove la pressione sonora e la chiarezza delle frequenze sono fondamentali.";
          } else if (category.includes('mixer')) {
            advice = "Un mixer di alta qualità che garantisce un controllo preciso sul mix. Ideale per chi cerca calore analogico o precisione digitale nel proprio workflow.";
          } else if (category.includes('cuffie') || category.includes('headphone')) {
            advice = "Cuffie professionali con eccellente isolamento acustico. Indispensabili per il monitoraggio in ambienti rumorosi e per lunghe sessioni di mixaggio.";
          } else {
            advice = "Questo prodotto è stato selezionato dai nostri esperti per l'ottimo rapporto qualità-prezzo. Una scelta solida per potenziare il tuo setup professionale.";
          }
        }

        setAiAdvice(advice);
        setIsAiLoading(false);
      }, 800);
    };

    fetchAdvice();
  }, [displayProduct.name]); // Re-fetch when product changes

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  const productImages = displayProduct.images && displayProduct.images.length > 0 
    ? displayProduct.images 
    : (displayProduct.image && displayProduct.image !== 'USE_IMAGES_ARRAY' ? [displayProduct.image] : []);

  const productDescription = displayProduct.description || (product ? "Prodotto professionale selezionato dai nostri esperti per garantirti le migliori performance audio." : "Dimentica l'ansia della compatibilità e i cavi sbagliati. Il Bundle Start DJ Pro è la soluzione \"Ready-to-Play\" progettata e testata da un professionista certificato MAT Academy. Apri i flight case, collega i cavi Roland Pro inclusi e sei pronto a far tremare la pista. Nessun compromesso, solo pura performance.");
  const isLong = productDescription.length > 250;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <span className="hover:text-white cursor-pointer transition-colors" onClick={() => onNavigate?.('home')}>Home</span>
          <span>/</span>
          <span className="hover:text-white cursor-pointer transition-colors" onClick={() => onNavigate?.('shop')}>{displayProduct.category}</span>
          <span>/</span>
          <span className="text-brand-orange font-medium">{displayProduct.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Product Images */}
          <div className="space-y-6">
            <div 
              className="aspect-square rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden relative group cursor-pointer"
              onClick={() => setIsFullScreenOpen(true)}
            >
              <img 
                src={getDirectDriveUrl(productImages[selectedImageIndex])} 
                alt={displayProduct.name} 
                loading="lazy"
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                <div className="bg-black/60 backdrop-blur-md p-3 rounded-full border border-white/20 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                  <PlusCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              {displayProduct.badge && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-brand-orange text-white text-xs font-bold uppercase tracking-wider rounded-md z-10">
                  {displayProduct.badge}
                </div>
              )}
            </div>
            
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {productImages.map((img: string, index: number) => (
                  <div 
                    key={index} 
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-xl bg-zinc-900 border overflow-hidden cursor-pointer transition-colors ${selectedImageIndex === index ? 'border-brand-orange' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <img 
                      src={getDirectDriveUrl(img)} 
                      alt={`Thumbnail ${index}`} 
                      loading="lazy"
                      className={`w-full h-full object-cover transition-opacity ${selectedImageIndex === index ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 uppercase">
                {displayProduct.name}
              </h1>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'fill-current' : 'text-zinc-600'}`} />
                    ))}
                  </div>
                  <span className="text-zinc-400 font-medium">{averageRating.toFixed(1)} ({reviews.length} recensioni)</span>
                </div>
              )}
              {!product && <p className="text-xl text-zinc-400 font-medium">Il Setup Definitivo Ready-to-Play</p>}
            </div>

            <div className="text-4xl font-black text-white mb-8">
              € {displayProduct.price.toFixed(2)} <span className="text-lg text-zinc-500 font-normal tracking-normal">IVA inclusa</span>
            </div>

            <div className="prose prose-invert prose-zinc max-w-none mb-10">
              <p className="text-lg leading-relaxed text-zinc-300">
                {isExpanded ? productDescription : (isLong ? productDescription.slice(0, 250) + '...' : productDescription)}
                {isLong && (
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-brand-orange font-bold hover:underline ml-2"
                  >
                    {isExpanded ? 'Leggi di meno' : 'Leggi di più'}
                  </button>
                )}
              </p>
            </div>

            {/* Technical Specs */}
            <div className="bg-zinc-900/30 rounded-3xl border border-white/5 p-8 mb-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
              <h3 className="text-xl font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                <div className="p-2 bg-brand-orange/20 rounded-lg">
                  <Zap className="w-5 h-5 text-brand-orange" />
                </div>
                Specifiche Tecniche
              </h3>
              {product?.specs ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Potenza', value: product.specs.watt, icon: <Zap className="w-4 h-4" /> },
                    { label: 'Frequenza', value: product.specs.frequency, icon: <Star className="w-4 h-4" /> },
                    { label: 'Ingressi', value: product.specs.inputs, icon: <BoxIcon className="w-4 h-4" /> },
                    { label: 'Uscite', value: product.specs.outputs, icon: <LogOut className="w-4 h-4" /> },
                    { label: 'Dimensioni', value: product.specs.dimensions, icon: <BoxIcon className="w-4 h-4" /> },
                    { label: 'Peso', value: product.specs.weight, icon: <BoxIcon className="w-4 h-4" /> },
                  ].filter(s => s.value).map((spec, idx) => (
                    <div key={idx} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 hover:border-brand-orange/30 transition-colors group">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="text-zinc-500 group-hover:text-brand-orange transition-colors">
                          {spec.icon}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{spec.label}</span>
                      </div>
                      <div className="text-lg font-black text-white">{spec.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-zinc-400 italic flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-orange" />
                  Specifiche in fase di analisi da parte dei nostri Sound Engineer.
                </div>
              )}
            </div>

            {/* What's Included (only for hardcoded bundle) */}
            {!product && (
              <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-6 mb-10">
                <h3 className="text-lg font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-brand-orange" />
                  Cosa include il kit:
                </h3>
                <ul className="space-y-4">
                  {[
                    "Console Pioneer DDJ-FLX4",
                    "Coppia Casse Alto TX415 (126dB SPL Reali)",
                    "Cuffie Sennheiser HD-25 Light",
                    "Microfono Shure SV100",
                    "Stativi Gravity + Borsa per il trasporto",
                    "Set completo Cavi Roland Pro",
                    "Laptop Stand Gravity",
                    "Case Magma + Cover Proel"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-1 bg-brand-orange/20 p-1 rounded-full">
                        <Check className="w-3 h-3 text-brand-orange" />
                      </div>
                      <span className="text-zinc-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button 
                onClick={(e) => handleAddToCart(e)}
                className="flex-1 py-4 px-6 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-black text-lg uppercase tracking-wide transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,102,0,0.3)] hover:shadow-[0_0_40px_rgba(255,102,0,0.5)] hover:-translate-y-1"
              >
                <ShoppingCart className="w-6 h-6" />
                Aggiungi al Setup
              </button>
              
              <a 
                href={`https://wa.me/393477397016?text=Ciao%20Amerigo!%20%F0%9F%91%8B%20Sto%20valutando%20${displayProduct.name}.%20Vorrei%20il%20parere%20di%20un%20Sound%20Engineer.`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 py-4 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-900/20 hover:-translate-y-1"
              >
                <MessageCircle className="w-6 h-6" />
                Parla con un Ingegnere
              </a>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10">
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Shield className="w-5 h-5 text-zinc-500" />
                <span>Garanzia Italiana 24 Mesi</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Truck className="w-5 h-5 text-zinc-500" />
                <span>Spedizione Assicurata Gratuita</span>
              </div>
            </div>

          </div>
        </div>

        {/* AI Advice Section */}
        <div className="mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-brand-orange/20 to-zinc-900 border border-brand-orange/30 rounded-3xl p-6 md:p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles className="w-32 h-32 text-brand-orange" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-orange/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-brand-orange" />
                </div>
                <h3 className="text-xl font-bold">Il Consiglio dell'Esperto (AI)</h3>
              </div>
              
              {isAiLoading ? (
                <div className="flex items-center gap-3 text-zinc-400">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-brand-orange"></div>
                  <span>Analizzando il prodotto...</span>
                </div>
              ) : (
                <p className="text-zinc-300 leading-relaxed max-w-4xl">
                  {aiAdvice}
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 pt-16 border-t border-white/10" style={{ contentVisibility: 'auto' }}>
          <h2 className="text-3xl font-black uppercase tracking-tight mb-12">Recensioni Clienti</h2>

          {/* AI Review Summary */}
          {reviewsFeatureEnabled && reviews.length >= 3 && (
            <div className="mb-10">
              {isLoadingReviewSummary ? (
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-brand-orange shrink-0"></div>
                  <span className="text-zinc-400 text-sm">Analisi recensioni in corso...</span>
                </div>
              ) : reviewSummary && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-brand-orange/10 to-zinc-900/80 border border-brand-orange/20 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-brand-orange" />
                    <h3 className="font-bold text-brand-orange text-sm uppercase tracking-wider">Sintesi AI delle Recensioni</h3>
                  </div>
                  <p className="text-zinc-300 leading-relaxed mb-4">{reviewSummary.summary}</p>

                  {(reviewSummary.pros.length > 0 || reviewSummary.cons.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {reviewSummary.pros.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <ThumbsUp className="w-4 h-4 text-green-500" />
                            <span className="text-xs font-bold text-green-500 uppercase tracking-wider">Punti di forza</span>
                          </div>
                          <ul className="space-y-1">
                            {reviewSummary.pros.map((p, i) => (
                              <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                                <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /> {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {reviewSummary.cons.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Minus className="w-4 h-4 text-zinc-400" />
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Da considerare</span>
                          </div>
                          <ul className="space-y-1">
                            {reviewSummary.cons.map((c, i) => (
                              <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                                <X className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" /> {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {reviewSummary.verdict && (
                    <p className="text-sm font-bold text-white border-t border-white/10 pt-3 mt-3">
                      Verdetto: {reviewSummary.verdict}
                    </p>
                  )}
                  {reviewSummary.disclaimer && (
                    <p className="text-xs text-zinc-600 mt-2">{reviewSummary.disclaimer}</p>
                  )}
                </motion.div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-8">
              {reviews.length === 0 ? (
                <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Nessuna recensione</h3>
                  <p className="text-zinc-400">Sii il primo a recensire questo prodotto!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="bg-zinc-900/50 rounded-2xl border border-white/5 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-orange to-orange-600 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg">
                          {review.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{review.userName}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex text-yellow-400">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-current' : 'text-zinc-700'}`} />
                              ))}
                            </div>
                            <span className="text-xs text-zinc-500">
                              • {new Date(review.createdAt).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                        <Check className="w-3 h-3" /> Acquisto Verificato
                      </div>
                    </div>
                    <p className="text-zinc-300 leading-relaxed text-lg">{review.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Review Form */}
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 h-fit sticky top-28">
              <h3 className="text-xl font-bold mb-6">Scrivi una recensione</h3>
              
              {user ? (
                <form onSubmit={submitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Valutazione</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReviewRating(star)}
                          className={`p-1 transition-colors ${star <= newReviewRating ? 'text-yellow-400' : 'text-zinc-600 hover:text-yellow-400/50'}`}
                        >
                          <Star className="w-8 h-8 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">La tua recensione</label>
                    <textarea
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      required
                      rows={4}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors"
                      placeholder="Cosa ne pensi di questo prodotto?"
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmittingReview || !newReviewText.trim()}
                    className="w-full py-3 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmittingReview ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                    ) : (
                      'Pubblica Recensione'
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <UserCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400 mb-6">Devi effettuare l'accesso per poter lasciare una recensione.</p>
                  <button 
                    onClick={() => {
                      // Trigger login via Google
                      import('firebase/auth').then(({ signInWithPopup, GoogleAuthProvider }) => {
                        const provider = new GoogleAuthProvider();
                        signInWithPopup(auth, provider).catch(console.error);
                      });
                    }}
                    className="w-full py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold transition-colors"
                  >
                    Accedi con Google
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>


      {/* Full Screen Image Modal */}
      <AnimatePresence>
        {isFullScreenOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12 backdrop-blur-xl"
            onClick={() => setIsFullScreenOpen(false)}
          >
            <button 
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
              onClick={() => setIsFullScreenOpen(false)}
            >
              <X className="w-8 h-8 text-white" />
            </button>

            {productImages.length > 1 && (
              <>
                <button 
                  className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-brand-orange rounded-full transition-all z-50 border border-white/10 hover:border-brand-orange"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1));
                  }}
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>

                <button 
                  className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-brand-orange rounded-full transition-all z-50 border border-white/10 hover:border-brand-orange"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0));
                  }}
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
              </>
            )}
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={getDirectDriveUrl(productImages[selectedImageIndex])} 
                alt={displayProduct.name} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />
              
              {productImages.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 p-6 flex justify-center gap-4">
                  <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 flex gap-4">
                    {productImages.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? 'border-brand-orange scale-110 shadow-[0_0_15px_rgba(255,102,0,0.5)]' : 'border-white/20 opacity-50 hover:opacity-100 hover:scale-105'}`}
                      >
                        <img src={getDirectDriveUrl(img)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
