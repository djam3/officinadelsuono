import { Filter, ChevronDown, MessageCircle, ShoppingCart, Search, PlusCircle, Star, X, ArrowUpDown, Play, Mic2, LayoutGrid, Package, Headphones, Monitor, Radio, Speaker, Award, ArrowRight, CheckCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Fuse from 'fuse.js';
import { useCartStore } from '../store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { getDirectDriveUrl } from '../utils/drive';
import { CATEGORIES_DATA } from '../constants';
import { Product } from '../types/admin';

interface Review {
  id: string;
  productId: string;
  rating: number;
}

interface ShopProps {
  onNavigate: (page: string, productId?: string) => void;
  compareList: Product[];
  toggleCompare: (product: Product) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  triggerFlyToCart: (image: string, startX: number, startY: number) => void;
}

export function Shop({ onNavigate, compareList, toggleCompare, showToast, triggerFlyToCart }: ShopProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tutti i Prodotti");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Popolarità");
  const addItem = useCartStore((state) => state.addItem);

  const dynamicCategories = useMemo(() => {
    const cats = new Set<string>(["Tutti i Prodotti", ...CATEGORIES_DATA.map(c => c.label)]);
    products.forEach(p => {
      if (p.category && p.category.toLowerCase() !== 'console') cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((doc) => {
        prods.push({ id: doc.id, ...doc.data() } as Product);
      });

      // Add hardcoded product if not already present
      if (!prods.find(p => p.id === 'bundle-start-dj-pro')) {
        prods.push({
          id: 'bundle-start-dj-pro',
          name: "Bundle Start DJ Pro",
          category: "Kit Pronti",
          price: 1749.00,
          image: "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=2071&auto=format&fit=crop",
          badge: "Best Seller"
        });
      }
      setProducts(prods);
      setLoading(false);
    }, (error) => {
      console.error("Error loading products:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'reviews'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs: Review[] = [];
      snapshot.forEach((doc) => {
        revs.push({ id: doc.id, ...doc.data() } as Review);
      });
      setReviews(revs);
    }, (error) => {
      console.error("Error loading reviews:", error);
    });

    return () => unsubscribe();
  }, []);

  const getProductRating = (productId: string) => {
    const productReviews = reviews.filter(r => r.productId === productId);
    if (productReviews.length === 0) return { average: 0, count: 0 };
    const sum = productReviews.reduce((acc, curr) => acc + curr.rating, 0);
    return { average: sum / productReviews.length, count: productReviews.length };
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => !p.draft);
    
    if (activeCategory !== "Tutti i Prodotti") {
      result = result.filter(p => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const fuse = new Fuse(result, {
        keys: ['name', 'category'],
        threshold: 0.4, // Allows for typos and partial matches
        ignoreLocation: true,
        includeScore: true,
      });
      result = fuse.search(searchQuery).map(res => res.item);
    }

    switch (sortBy) {
      case "Prezzo Crescente":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "Prezzo decrescente":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "Nome crescente (A-Z)":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "Nome decrescente (Z-A)":
        result = [...result].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "Ultimi arrivi":
        result = [...result].sort((a, b) => b.id.localeCompare(a.id));
        break;
      case "Popolarità":
      default:
        result = [...result].sort((a, b) => {
          const ratingA = getProductRating(a.id);
          const ratingB = getProductRating(b.id);
          const scoreA = ratingA.count * ratingA.average;
          const scoreB = ratingB.count * ratingB.average;
          return scoreB - scoreA;
        });
        break;
    }

    return result;
  }, [products, activeCategory, searchQuery, sortBy, reviews]);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    const image = product.image === 'USE_IMAGES_ARRAY' && product.images && product.images.length > 0 
      ? product.images[0] 
      : (product.image || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80');

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: image
    });
    
    triggerFlyToCart(image, e.clientX, e.clientY);
    showToast(`${product.name} aggiunto al carrello!`, 'success');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 uppercase leading-tight">
              Attrezzatura DJ e <span className="text-brand-orange">Audio Professionale</span>
            </h1>
            <p className="text-sm md:text-base text-zinc-400 max-w-2xl">
              Più di un semplice Audio Pro Store: Officinadelsuono è il tuo laboratorio tecnico d'élite. Scegli le migliori configurazioni per il tuo sound.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <a 
              href="https://wa.me/393477397016?text=Ciao%20Amerigo!%20%F0%9F%91%8B%20Ti%20scrivo%20dal%20sito%20Officinadelsuono.%20Vorrei%20un%20consiglio%20su%20quale%20attrezzatura%20acquistare." 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white px-6 py-4 md:py-3 rounded-xl text-sm font-bold transition-all w-full md:w-auto"
            >
              <MessageCircle className="w-5 h-5 text-green-500" />
              Serve aiuto per scegliere?
            </a>
          </div>
        </div>

        {/* Setup Curati by Amerigo */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-brand-orange" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Setup Curati <span className="text-brand-orange">by Amerigo</span></h2>
                <p className="text-xs text-zinc-500">Pacchetti pre-configurati con compatibilita garantita</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20">
              <Award className="w-4 h-4 text-brand-orange" />
              <span className="text-xs font-bold text-brand-orange">Testati sul campo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: Headphones, name: "Starter Kit DJ", target: "Principiante assoluto", desc: "Controller entry + cuffie + cavo + software", price: "200 - 400", color: "from-green-500/10 to-green-900/5", borderHover: "hover:border-green-500/30" },
              { icon: Monitor, name: "Home DJ Setup", target: "Appassionato / Hobby", desc: "Controller mid-range + monitor studio + cuffie pro", price: "500 - 1.000", color: "from-blue-500/10 to-blue-900/5", borderHover: "hover:border-blue-500/30" },
              { icon: Speaker, name: "Mobile DJ Pro", target: "DJ Mobile / Matrimoni", desc: "Controller + casse attive + sub + aste + cavi", price: "1.500 - 3.000", color: "from-purple-500/10 to-purple-900/5", borderHover: "hover:border-purple-500/30" },
              { icon: Radio, name: "Club Ready", target: "DJ Professionista", desc: "CDJ/media player + mixer pro + cuffie top", price: "3.000 - 8.000+", color: "from-brand-orange/10 to-orange-900/5", borderHover: "hover:border-brand-orange/30" },
              { icon: Play, name: "Streamer Kit", target: "DJ Content Creator", desc: "Controller + interfaccia audio + mic + webcam", price: "400 - 1.200", color: "from-pink-500/10 to-pink-900/5", borderHover: "hover:border-pink-500/30" },
            ].map((setup, i) => (
              <a
                key={i}
                href="https://wa.me/393477397016?text=Ciao%20Amerigo!%20Mi%20interessa%20il%20setup%20curato%20%22${encodeURIComponent(setup.name)}%22.%20Puoi%20darmi%20piu%20info?"
                target="_blank"
                rel="noopener noreferrer"
                className={`group p-5 rounded-2xl bg-gradient-to-br ${setup.color} border border-white/5 ${setup.borderHover} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
              >
                <setup.icon className="w-7 h-7 text-brand-orange mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-sm font-black text-white mb-0.5 leading-tight">{setup.name}</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">{setup.target}</p>
                <p className="text-xs text-zinc-400 mb-3 leading-relaxed line-clamp-2">{setup.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-brand-orange font-black text-sm">{setup.price}<span className="text-[10px] text-zinc-500 ml-0.5">EUR</span></span>
                  <MessageCircle className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
          <div className="w-full lg:w-64 shrink-0 overflow-x-auto lg:overflow-visible no-scrollbar">
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 md:p-6 sticky top-28 flex lg:flex-col gap-4 lg:gap-0 min-w-max lg:min-w-0">
              
              {/* Search Bar - Hidden on mobile scrollable list, shown elsewhere or kept simple */}
              <div className="lg:mb-8 min-w-[200px] lg:min-w-0">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cerca..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 border border-white/10 rounded-xl leading-5 bg-black/50 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:bg-black focus:ring-1 focus:ring-brand-orange focus:border-brand-orange text-xs md:text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="flex lg:flex-col gap-2">
                {dynamicCategories.map((cat, idx) => {
                  const categoryData = CATEGORIES_DATA.find(c => c.label === cat);
                  const Icon = categoryData ? categoryData.icon : LayoutGrid;
                  return (
                    <button 
                      key={idx}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex items-center justify-between px-4 py-2.5 lg:py-3 rounded-xl text-xs md:text-sm font-medium transition-all group whitespace-nowrap lg:whitespace-normal ${
                        activeCategory === cat 
                          ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' 
                          : 'bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <Icon size={18} strokeWidth={1.5} className={`${activeCategory === cat ? 'text-white' : 'text-brand-orange'}`} />
                        <span>{cat}</span>
                      </div>
                      <ChevronDown className={`hidden lg:block w-4 h-4 -rotate-90 transition-transform ${activeCategory === cat ? 'text-white' : 'text-zinc-600 group-hover:text-brand-orange'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex justify-end items-center mb-6">
              <div className="relative z-40">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-zinc-900 border border-white/10 text-zinc-300 text-sm font-medium rounded-lg px-4 py-2 pr-10 hover:border-brand-orange focus:outline-none focus:border-brand-orange transition-colors cursor-pointer"
                >
                  <option value="Popolarità">Ordina per: Popolarità</option>
                  <option value="Ultimi arrivi">Ordina per: Ultimi arrivi</option>
                  <option value="Prezzo Crescente">Ordina per: Prezzo Crescente</option>
                  <option value="Prezzo decrescente">Ordina per: Prezzo decrescente</option>
                  <option value="Nome crescente (A-Z)">Ordina per: Nome crescente (A-Z)</option>
                  <option value="Nome decrescente (Z-A)">Ordina per: Nome decrescente (Z-A)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-orange"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-24 bg-zinc-900/50 rounded-2xl border border-white/5">
                <h3 className="text-xl font-bold mb-2">Nessun prodotto trovato</h3>
                <p className="text-zinc-400">Non ci sono ancora prodotti in questa categoria.</p>
              </div>
            ) : (
              <>
                {/* Comparison Bar */}
                {compareList.length > 0 && (
                  <div className="fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-white/10 p-4 flex justify-center gap-4 z-50">
                    {compareList.map(p => (
                      <div key={p.id} className="flex items-center gap-2 bg-zinc-800 p-2 rounded-lg">
                        <img src={getDirectDriveUrl(p.image)} alt={p.name} className="w-10 h-10 object-cover rounded" />
                        <span className="text-sm font-bold truncate">{p.name}</span>
                        <button onClick={() => toggleCompare(p)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button 
                      onClick={() => onNavigate('compare')}
                      className="bg-brand-orange text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors"
                    >
                      Confronta ({compareList.length})
                    </button>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="group bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden hover:border-brand-orange/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-orange/10 transition-all duration-300 flex flex-col">
                      <div 
                        className="aspect-square relative overflow-hidden cursor-pointer bg-zinc-950"
                        onClick={() => onNavigate('product', product.id)}
                      >
                        <img 
                          src={getDirectDriveUrl(product.image === 'USE_IMAGES_ARRAY' && (product as any).images?.length > 0 
                            ? (product as any).images[0] 
                            : product.image)} 
                          alt={product.name} 
                          loading="lazy"
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        {product.stock === 0 ? (
                          <div className="absolute top-4 left-4 px-3 py-1 bg-zinc-700 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg z-10">
                            Esaurito
                          </div>
                        ) : product.badge && (
                          <div className="absolute top-4 left-4 px-3 py-1 bg-brand-orange text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg z-10">
                            {product.badge}
                          </div>
                        )}
                        {/* Badge Consigliato da Amerigo */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/80 backdrop-blur-sm border border-brand-orange/30 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Award className="w-3 h-3 text-brand-orange" />
                          <span className="text-[9px] font-bold text-brand-orange uppercase tracking-wider">Selezionato da Amerigo</span>
                        </div>
                      </div>
                      
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const categoryData = CATEGORIES_DATA.find(c => c.label === product.category);
                              const Icon = categoryData?.icon;
                              return Icon ? (
                                <div className="p-1.5 bg-brand-orange/10 rounded-lg">
                                  <Icon className="w-3 h-3 text-brand-orange" />
                                </div>
                              ) : null;
                            })()}
                            <span className="text-xs text-brand-orange font-bold uppercase tracking-wider">
                              {product.category}
                            </span>
                          </div>
                          {getProductRating(product.id).count > 0 && (
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Star className="w-3 h-3 fill-current" />
                              <span className="text-xs font-bold">{getProductRating(product.id).average.toFixed(1)}</span>
                              <span className="text-xs text-zinc-500">({getProductRating(product.id).count})</span>
                            </div>
                          )}
                        </div>
                        <h3 
                          className="text-lg font-bold mb-4 cursor-pointer hover:text-brand-orange transition-colors"
                          onClick={() => onNavigate('product', product.id)}
                        >
                          {product.name}
                        </h3>
                        
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/10">
                          <span className="text-xl font-black">€ {product.price.toFixed(2)}</span>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => toggleCompare(product)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${compareList.find(p => p.id === product.id) ? 'bg-brand-orange text-white' : 'bg-white/5 hover:bg-brand-orange hover:text-white'}`}
                              title="Confronta"
                            >
                              <Search className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => handleAddToCart(e, product)}
                              disabled={product.stock === 0}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${product.stock === 0 ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-white/5 hover:bg-brand-orange hover:text-white'}`}
                              title={product.stock === 0 ? 'Prodotto esaurito' : 'Acquista Ora'}
                            >
                              <ShoppingCart className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>

        {/* Usato Certificato CTA */}
        <div className="mt-16 p-8 md:p-12 rounded-3xl bg-gradient-to-r from-zinc-900/80 to-zinc-900/40 border border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(255,95,0,0.05),transparent_50%)]" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2">
                  Usato <span className="text-green-500">Certificato</span>
                </h3>
                <p className="text-zinc-400 text-sm md:text-base max-w-xl">
                  Hai attrezzatura DJ da vendere o vuoi risparmiare con gear ricondizionato e testato da un esperto? Ogni pezzo viene verificato personalmente prima della vendita.
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/393477397016?text=Ciao%20Amerigo!%20Sono%20interessato%20alla%20sezione%20Usato%20Certificato.%20Puoi%20darmi%20info?"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-sm transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              Contattami per l'Usato
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

