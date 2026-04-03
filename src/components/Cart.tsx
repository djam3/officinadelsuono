import { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, Loader2, Sparkles, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { getDirectDriveUrl } from '../utils/drive';
import { PaymentLogos } from './PaymentLogos';
import { DJ_KNOWLEDGE_BASE } from '../data/djKnowledgeBase';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export function Cart({ isOpen, onClose, onNavigate }: CartProps) {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [step, setStep] = useState<'cart' | 'payment' | 'success'>('cart');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  useEffect(() => {
    const fetchSuggestion = async () => {
      if (items.length === 0) {
        setSuggestion(null);
        return;
      }

      setIsLoadingSuggestion(true);
      
      // Simulate internal AI processing
      setTimeout(() => {
        const itemNames = items.map(i => i.name.toLowerCase());
        let advice = "";

        // Logic to suggest based on what's in the cart
        const hasController = itemNames.some(n => n.includes('controller') || n.includes('ddj') || n.includes('flx'));
        const hasSpeakers = itemNames.some(n => n.includes('cassa') || n.includes('speaker') || n.includes('alto'));
        const hasHeadphones = itemNames.some(n => n.includes('cuffie') || n.includes('sennheiser'));

        if (hasController && !hasHeadphones) {
          advice = "Per il tuo nuovo controller, ti consiglio le Sennheiser HD-25: lo standard per il monitoraggio professionale.";
        } else if (hasController && !hasSpeakers) {
          advice = "Ottima console! Hai già pensato a delle casse Alto Professional per sprigionare tutta la potenza del tuo mix?";
        } else if (hasSpeakers && !hasController) {
          advice = "Queste casse suonano divinamente. Hai bisogno di un controller Pioneer DJ per controllarle al meglio?";
        } else if (hasController && hasSpeakers && hasHeadphones) {
          advice = "Setup completo! Non dimenticare i cavi Roland Gold Series per una purezza del segnale senza compromessi.";
        } else {
          advice = "Stai assemblando un setup incredibile. Hai bisogno di cavi XLR professionali o di una borsa per il trasporto?";
        }

        setSuggestion(advice);
        setIsLoadingSuggestion(false);
      }, 1000);
    };

    fetchSuggestion();
  }, [items.length]);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    if (step === 'cart') {
      setStep('payment');
      return;
    }

    if (!paymentMethod) {
      alert('Seleziona un metodo di pagamento');
      return;
    }

    setIsCheckingOut(true);
    try {
      // Handle all payments as Manual Orders
      const response = await fetch('/api/create-manual-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          total,
          paymentMethod: methodNames[paymentMethod as keyof typeof methodNames] || paymentMethod,
          customerEmail: 'cliente@esempio.it', // In a real app, we'd collect this
        }),
      });

      if (!response.ok) throw new Error('Errore nella creazione dell\'ordine');
      
      const data = await response.json();
      setOrderId(data.orderId);
      setStep('success');
      clearCart();
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(`Errore durante il checkout: ${error.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const methodNames = {
    card: 'Carta di Debito / Credito',
    google_pay: 'Google Pay',
    apple_pay: 'Apple Pay',
    klarna: 'Klarna',
    bank_transfer: 'Bonifico Bancario'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[400]"
          />

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-[#050505] border-l border-white/5 shadow-2xl z-[450] flex flex-col"
          >
            {/* Header */}
            <div className="p-10 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
                  {step === 'cart' ? 'Il Tuo ' : step === 'payment' ? 'Scegli ' : 'Ordine '}
                  <span className="text-brand-orange">
                    {step === 'cart' ? 'Carrello' : step === 'payment' ? 'Pagamento' : 'Confermato'}
                  </span>
                </h2>
                <div className="flex items-center gap-4 mt-2">
                  {step === 'cart' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-pulse" />
                        <span className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold">
                          {items.length} Prodotti Selezionati
                        </span>
                      </div>
                      {items.length > 0 && (
                        <button 
                          onClick={clearCart}
                          className="text-[10px] text-zinc-500 hover:text-red-500 uppercase tracking-widest font-bold transition-colors"
                        >
                          Svuota
                        </button>
                      )}
                    </>
                  ) : step === 'payment' ? (
                    <button 
                      onClick={() => setStep('cart')}
                      className="text-[10px] text-brand-orange hover:text-white uppercase tracking-widest font-bold transition-colors"
                    >
                      ← Torna al Carrello
                    </button>
                  ) : null}
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-500 group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-10 space-y-8 custom-scrollbar">
              {step === 'cart' && (
                items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-brand-orange/20 blur-3xl rounded-full" />
                      <ShoppingCart className="w-20 h-20 text-zinc-800 relative z-10" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Carrello Vuoto</h3>
                    <p className="text-sm text-zinc-500 max-w-[250px] leading-relaxed">
                      Il tuo setup ideale ti aspetta. Inizia ad aggiungere prodotti dal nostro catalogo.
                    </p>
                    <button 
                      onClick={() => {
                        onNavigate('shop');
                        onClose();
                      }}
                      className="mt-10 px-10 py-4 bg-white text-black rounded-full text-xs font-black uppercase tracking-widest hover:bg-brand-orange hover:text-white transition-all duration-500"
                    >
                      Inizia lo Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 pb-10">
                    {items.map((item) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        key={item.id} 
                        className="group relative flex gap-6 items-center"
                      >
                        <div className="relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-zinc-900 border border-white/5">
                          <img 
                            src={getDirectDriveUrl(item.image)} 
                            alt={item.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-white text-base line-clamp-1 group-hover:text-brand-orange transition-colors">
                              {item.name}
                            </h3>
                          </div>
                          <p className="text-zinc-500 text-xs mb-4 uppercase tracking-wider font-medium">
                            DJ Equipment
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 bg-zinc-900/50 border border-white/5 rounded-full px-3 py-1.5">
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="text-zinc-500 hover:text-white transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="text-zinc-500 hover:text-white transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-lg font-black text-white">
                                €{(item.price * item.quantity).toFixed(2)}
                              </span>
                              <button 
                                onClick={() => removeItem(item.id)}
                                className="text-zinc-700 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* AI Section Refined */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-12 p-8 rounded-3xl bg-zinc-900/30 border border-white/5 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 p-4">
                        <Sparkles className="w-5 h-5 text-brand-orange animate-pulse" />
                      </div>
                      <h4 className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em] mb-4">
                        AI Setup Concierge
                      </h4>
                      {isLoadingSuggestion ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-4 h-4 animate-spin text-brand-orange" />
                          <span className="text-xs text-zinc-500 font-medium">Analisi configurazione...</span>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-400 leading-relaxed font-medium italic">
                          "{suggestion || "Stai assemblando un setup incredibile. Hai bisogno di cavi XLR professionali o di una borsa per il trasporto?"}"
                        </p>
                      )}
                    </motion.div>
                  </div>
                )
              )}

              {step === 'payment' && (
                <div className="space-y-6 pb-10">
                  <p className="text-zinc-400 text-sm mb-8">
                    Seleziona il metodo di pagamento preferito per completare l'acquisto.
                  </p>

                  <div className="grid gap-4">
                    {[
                      { id: 'card', name: 'Carta di Debito / Credito', icon: '💳' },
                      { id: 'google_pay', name: 'Google Pay', icon: '📱' },
                      { id: 'apple_pay', name: 'Apple Pay', icon: '🍎' },
                      { id: 'klarna', name: 'Klarna (Paga in 3 rate)', icon: '💖' },
                      { id: 'bank_transfer', name: 'Bonifico Bancario', icon: '🏦' },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 ${
                          paymentMethod === method.id
                            ? 'bg-brand-orange/10 border-brand-orange'
                            : 'bg-zinc-900/50 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{method.icon}</span>
                          <span className={`font-bold ${paymentMethod === method.id ? 'text-white' : 'text-zinc-400'}`}>
                            {method.name}
                          </span>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === method.id ? 'border-brand-orange bg-brand-orange' : 'border-zinc-700'
                        }`}>
                          {paymentMethod === method.id && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'bank_transfer' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-6 rounded-2xl bg-zinc-900 border border-white/10 space-y-4"
                    >
                      <h5 className="text-xs font-black text-white uppercase tracking-widest">Dati per il Bonifico</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Beneficiario:</span>
                          <span className="text-white font-medium">Officina del Suono S.r.l.</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">IBAN:</span>
                          <span className="text-white font-mono font-medium">IT 00 X 00000 00000 000000000000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Causale:</span>
                          <span className="text-white font-medium">Ordine #{Math.floor(Math.random() * 10000)}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-500 italic">
                        L'ordine verrà elaborato non appena riceveremo la conferma dell'accredito (solitamente 1-2 giorni lavorativi).
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              {step === 'success' && (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-8">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <Plus className="w-8 h-8 text-white rotate-45" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Grazie per l'ordine!</h3>
                  <p className="text-zinc-400 max-w-sm mx-auto leading-relaxed mb-10">
                    Il tuo ordine è stato ricevuto con successo. Ti contatteremo a breve per finalizzare il pagamento tramite <strong>{methodNames[paymentMethod as keyof typeof methodNames]}</strong>.
                  </p>
                  {paymentMethod === 'bank_transfer' && (
                    <div className="p-6 bg-zinc-900 rounded-2xl border border-white/5 mb-10 w-full">
                      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Ricorda di effettuare il bonifico a:</p>
                      <p className="text-white font-mono text-sm break-all">IT 00 X 00000 00000 000000000000</p>
                    </div>
                  )}
                  <button 
                    onClick={onClose}
                    className="px-12 py-5 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-[0.3em] hover:bg-brand-orange hover:text-white transition-all duration-500"
                  >
                    Torna al Sito
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && step !== 'success' && (
              <div className="p-10 bg-black border-t border-white/5">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-xs font-black text-zinc-500 uppercase tracking-[0.4em]">Subtotale</span>
                  <div className="text-right">
                    <span className="text-4xl font-black text-white tracking-tighter">
                      €{total.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </span>
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1 font-bold">Spedizione Gratuita Inclusa</p>
                  </div>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="relative w-full h-20 bg-brand-orange text-white rounded-2xl overflow-hidden group transition-all duration-500 hover:shadow-[0_20px_40px_rgba(242,125,38,0.3)] disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <div className="relative flex items-center justify-center gap-4">
                    {isCheckingOut ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <span className="text-sm font-black uppercase tracking-[0.3em]">
                          {step === 'cart' ? 'Procedi al Pagamento' : 'Conferma Ordine'}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-brand-orange transition-colors">
                          <Plus className="w-4 h-4 rotate-45" />
                        </div>
                      </>
                    )}
                  </div>
                </button>
                
                {step === 'cart' && (
                  <div className="mt-10 pt-8 border-t border-white/10">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6 text-center">
                      Metodi di Pagamento Sicuri & Rateali
                    </p>
                    <div className="flex justify-center">
                      <PaymentLogos />
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
