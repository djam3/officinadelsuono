import { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';
import { ShoppingCart, Plus, X, Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDirectDriveUrl } from '../utils/drive';
import { Product as ProductType } from '../types/admin';



interface CompareProps {
  onNavigate: (page: string, productId?: string) => void;
  initialProducts?: ProductType[];
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  triggerFlyToCart: (image: string, startX: number, startY: number) => void;
}

export function Compare({ onNavigate, initialProducts = [], showToast, triggerFlyToCart }: CompareProps) {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductType[]>(initialProducts);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchProducts = async () => {
      const q = query(collection(db, 'products'));
      const snapshot = await getDocs(q);
      const prods: ProductType[] = [];
      snapshot.forEach((doc) => {
        prods.push({ id: doc.id, ...doc.data() } as ProductType);
      });
      setProducts(prods);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchAdvice = async () => {
      if (selectedProducts.length < 2) {
        setAiAdvice(null);
        return;
      }

      setIsAiLoading(true);
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          setAiAdvice("Configura la chiave API di Gemini per ricevere consigli personalizzati.");
          setIsAiLoading(false);
          return;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        
        const prompt = `Sei un esperto di attrezzature audio (DJ, PA, studio).
Sto confrontando questi prodotti:
${selectedProducts.map(p => `- ${p.name} (${p.category}): €${p.price}`).join('\n')}

Dammi un breve consiglio (massimo 3-4 frasi) su quale scegliere in base alle esigenze comuni (es. budget, professionalità, portabilità). Sii diretto e utile, senza formattazioni complesse.`;

        const result = await model.generateContent(prompt);
        setAiAdvice(result.response.text());
      } catch (error) {
        console.error("Errore Gemini:", error);
        setAiAdvice("Non è stato possibile generare un consiglio al momento.");
      } finally {
        setIsAiLoading(false);
      }
    };

    fetchAdvice();
  }, [selectedProducts]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedProducts.find(sp => sp.id === p.id)
  );

  const handleAddProduct = (product: ProductType) => {
    if (selectedProducts.length < 3) {
      setSelectedProducts([...selectedProducts, product]);
    }
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const handleAddToCart = (e: React.MouseEvent, product: ProductType) => {
    const image = product.image === 'USE_IMAGES_ARRAY' && (product as any).images?.length > 0 
      ? (product as any).images[0] 
      : (product.image || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80');

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: image
    });
    
    triggerFlyToCart(image, e.clientX, e.clientY);
    if (showToast) {
      showToast(`${product.name} aggiunto al carrello!`, 'success');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest mb-4">Comparatore Tecnico</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">Confronta fino a 3 prodotti fianco a fianco per trovare il setup perfetto per le tue esigenze.</p>
        </div>

        {/* Product Selection Area */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {selectedProducts.map((product) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={product.id} 
              className="w-full md:w-64 bg-zinc-900 border border-white/10 rounded-2xl p-4 relative"
            >
              <button 
                onClick={() => handleRemoveProduct(product.id)}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center hover:bg-brand-orange transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="aspect-square bg-zinc-800 rounded-xl mb-4 overflow-hidden">
                <img src={getDirectDriveUrl(product.image)} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-lg mb-1 truncate">{product.name}</h3>
              <p className="text-brand-orange font-bold">€{product.price.toFixed(2)}</p>
            </motion.div>
          ))}

          {selectedProducts.length < 3 && (
            <div className="w-full md:w-64">
              {isSearchOpen ? (
                <div className="bg-zinc-900 border border-brand-orange rounded-2xl p-4 h-full flex flex-col">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="text" 
                      placeholder="Cerca prodotto..." 
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-orange"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[200px] space-y-2 pr-2 custom-scrollbar">
                    {filteredProducts.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => handleAddProduct(p)}
                        className="w-full text-left p-2 hover:bg-zinc-800 rounded-lg flex items-center gap-3 transition-colors"
                      >
                        <img src={getDirectDriveUrl(p.image)} alt={p.name} className="w-10 h-10 object-cover rounded bg-zinc-800" />
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold truncate">{p.name}</p>
                          <p className="text-xs text-brand-orange">€{p.price.toFixed(2)}</p>
                        </div>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && (
                      <p className="text-xs text-zinc-500 text-center py-4">Nessun prodotto trovato</p>
                    )}
                  </div>
                  <button 
                    onClick={() => setIsSearchOpen(false)}
                    className="mt-4 text-xs text-zinc-400 hover:text-white text-center w-full"
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="w-full h-full min-h-[250px] border-2 border-dashed border-white/20 hover:border-brand-orange rounded-2xl flex flex-col items-center justify-center gap-4 text-zinc-400 hover:text-brand-orange transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="font-bold">Aggiungi Prodotto</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Comparison Table */}
        {selectedProducts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden mb-12"
          >
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-6 w-1/4 bg-zinc-950/50">Specifiche</th>
                    {selectedProducts.map(p => (
                      <th key={p.id} className="p-6 font-bold text-lg text-center border-l border-white/5">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="p-6 font-bold text-zinc-400 bg-zinc-950/50">Watt / Potenza</td>
                    {selectedProducts.map(p => (
                      <td key={p.id} className="p-6 text-center border-l border-white/5">{p.specs?.watt || '-'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-6 font-bold text-zinc-400 bg-zinc-950/50">Risposta in Frequenza</td>
                    {selectedProducts.map(p => (
                      <td key={p.id} className="p-6 text-center border-l border-white/5">{p.specs?.frequency || '-'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-6 font-bold text-zinc-400 bg-zinc-950/50">Ingressi</td>
                    {selectedProducts.map(p => (
                      <td key={p.id} className="p-6 text-center border-l border-white/5">{p.specs?.inputs || '-'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-6 font-bold text-zinc-400 bg-zinc-950/50">Uscite</td>
                    {selectedProducts.map(p => (
                      <td key={p.id} className="p-6 text-center border-l border-white/5">{p.specs?.outputs || '-'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-6 font-bold text-zinc-400 bg-zinc-950/50">Dimensioni</td>
                    {selectedProducts.map(p => (
                      <td key={p.id} className="p-6 text-center border-l border-white/5">{p.specs?.dimensions || '-'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-6 font-bold text-zinc-400 bg-zinc-950/50">Peso</td>
                    {selectedProducts.map(p => (
                      <td key={p.id} className="p-6 text-center border-l border-white/5">{p.specs?.weight || '-'}</td>
                    ))}
                  </tr>
                  <tr className="bg-zinc-950/30">
                    <td className="p-6 bg-zinc-950/50"></td>
                    {selectedProducts.map(p => (
                      <td key={p.id} className="p-6 text-center border-l border-white/5">
                        <button 
                          onClick={(e) => handleAddToCart(e, p)}
                          className="w-full bg-brand-orange hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          Aggiungi al Carrello
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* AI Advice Section */}
        {selectedProducts.length >= 2 && (
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
                  <span>Analizzando i prodotti...</span>
                </div>
              ) : (
                <p className="text-zinc-300 leading-relaxed max-w-4xl">
                  {aiAdvice}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
