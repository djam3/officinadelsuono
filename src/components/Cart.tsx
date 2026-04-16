import { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, Loader2, Sparkles, ShoppingCart, Truck, ArrowLeft, Check, Tag, ChevronRight } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { calcolaSpedizioneCarrello, formatCostoSpedizione, mancaAllaGratuita } from '../services/shippingService';
import { motion, AnimatePresence } from 'framer-motion';
import { getDirectDriveUrl } from '../utils/drive';
import { PaymentLogos } from './PaymentLogos';
import { trackEvent } from '../utils/analytics';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  cap: string;
  province: string;
}

const EMPTY_CUSTOMER: CustomerInfo = {
  name: '', email: '', phone: '', address: '', city: '', cap: '', province: ''
};

export function Cart({ isOpen, onClose, onNavigate, showToast }: CartProps) {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [step, setStep] = useState<'cart' | 'info' | 'payment' | 'success'>('cart');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerInfo>(EMPTY_CUSTOMER);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CustomerInfo, string>>>({});

  // Discount code
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState<{ code: string; type: string; value: number } | null>(null);
  const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState('');

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Calculate discount
  const discountAmount = discountApplied
    ? discountApplied.type === 'percent'
      ? subtotal * (discountApplied.value / 100)
      : discountApplied.value
    : 0;
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);

  const spedizione = calcolaSpedizioneCarrello(
    totalAfterDiscount,
    items.map(i => ({ pesoKg: i.weightKg ?? 0, dims: i.dimensionsMm, quantita: i.quantity }))
  );
  const totaleFinale = totalAfterDiscount + (spedizione.costo > 0 ? spedizione.costo : 0);
  const manca = mancaAllaGratuita(totalAfterDiscount);

  useEffect(() => {
    if (items.length === 0) { setSuggestion(null); return; }
    setIsLoadingSuggestion(true);
    const timer = setTimeout(() => {
      const itemNames = items.map(i => i.name.toLowerCase());
      const hasController = itemNames.some(n => n.includes('controller') || n.includes('ddj') || n.includes('flx'));
      const hasSpeakers = itemNames.some(n => n.includes('cassa') || n.includes('speaker') || n.includes('alto'));
      const hasHeadphones = itemNames.some(n => n.includes('cuffie') || n.includes('sennheiser'));

      if (hasController && !hasHeadphones) setSuggestion("Per il tuo nuovo controller, ti consiglio le Sennheiser HD-25: lo standard per il monitoraggio professionale.");
      else if (hasController && !hasSpeakers) setSuggestion("Ottima console! Hai già pensato a delle casse per sprigionare tutta la potenza del tuo mix?");
      else if (hasSpeakers && !hasController) setSuggestion("Queste casse suonano divinamente. Hai bisogno di un controller per controllarle al meglio?");
      else if (hasController && hasSpeakers && hasHeadphones) setSuggestion("Setup completo! Non dimenticare i cavi XLR professionali per una purezza del segnale senza compromessi.");
      else setSuggestion("Stai assemblando un setup incredibile. Hai bisogno di cavi XLR professionali o di una borsa per il trasporto?");
      setIsLoadingSuggestion(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [items.length]);

  const validateCustomer = (): boolean => {
    const errors: Partial<Record<keyof CustomerInfo, string>> = {};
    if (!customer.name.trim()) errors.name = 'Inserisci il tuo nome';
    if (!customer.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email))
      errors.email = 'Inserisci un\'email valida';
    if (!customer.phone.trim() || customer.phone.replace(/\D/g, '').length < 8)
      errors.phone = 'Inserisci un numero di telefono valido';
    if (!customer.address.trim()) errors.address = 'Inserisci l\'indirizzo';
    if (!customer.city.trim()) errors.city = 'Inserisci la città';
    if (!customer.cap.trim() || !/^\d{5}$/.test(customer.cap)) errors.cap = 'CAP non valido (5 cifre)';
    if (!customer.province.trim() || customer.province.trim().length < 2) errors.province = 'Inserisci la provincia';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setIsCheckingDiscount(true);
    setDiscountError('');
    try {
      const q2 = query(
        collection(db, 'discount_codes'),
        where('code', '==', discountCode.toUpperCase().trim()),
        where('active', '==', true)
      );
      const snap = await getDocs(q2);
      if (snap.empty) {
        setDiscountError('Codice sconto non valido o scaduto.');
        setDiscountApplied(null);
      } else {
        const d = snap.docs[0].data();
        if (d.minOrder && subtotal < d.minOrder) {
          setDiscountError(`Ordine minimo €${d.minOrder} per questo codice.`);
          setDiscountApplied(null);
        } else if (d.maxUses && d.usedCount >= d.maxUses) {
          setDiscountError('Codice sconto esaurito.');
          setDiscountApplied(null);
        } else if (d.expiresAt && new Date(d.expiresAt) < new Date()) {
          setDiscountError('Codice sconto scaduto.');
          setDiscountApplied(null);
        } else {
          setDiscountApplied({ code: d.code, type: d.type, value: d.value });
          setDiscountError('');
          showToast?.(`Sconto "${d.code}" applicato!`, 'success');
        }
      }
    } catch {
      setDiscountError('Errore nella verifica del codice.');
    } finally {
      setIsCheckingDiscount(false);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;

    if (step === 'cart') {
      setStep('info');
      return;
    }

    if (step === 'info') {
      if (!validateCustomer()) return;
      setStep('payment');
      return;
    }

    if (!paymentMethod) {
      showToast?.('Seleziona un metodo di pagamento', 'error');
      return;
    }

    if (!acceptedTerms) {
      showToast?.('Accetta i Termini e Condizioni per continuare', 'error');
      return;
    }

    // Ordine via WhatsApp: non chiamare l'API, aprire WhatsApp direttamente
    if (paymentMethod === 'whatsapp') {
      const righe = items.map(i => `• ${i.name} x${i.quantity} — €${(i.price * i.quantity).toFixed(2)}`).join('\n');
      const scontoRiga = discountApplied
        ? `\nSconto (${discountApplied.code}): -€${discountAmount.toFixed(2)}`
        : '';
      const spedizioneRiga = spedizione.costo > 0 ? `\nSpedizione: €${spedizione.costo.toFixed(2)}` : '\nSpedizione: GRATUITA';
      const testo = `Ciao Amerigo! Vorrei ordinare:\n\n${righe}${scontoRiga}${spedizioneRiga}\n\nTOTALE: €${totaleFinale.toFixed(2)}\n\nNome: ${customer.name.trim()}\nEmail: ${customer.email.trim()}\nTelefono: ${customer.phone.trim()}\nIndirizzo: ${customer.address.trim()}, ${customer.cap.trim()} ${customer.city.trim()} (${customer.province.trim().toUpperCase()})`;
      window.open(`https://wa.me/393477397016?text=${encodeURIComponent(testo)}`, '_blank', 'noopener,noreferrer');
      setStep('success');
      clearCart();
      trackEvent('purchase', { value: totaleFinale, method: 'whatsapp' });
      return;
    }

    setIsCheckingOut(true);
    try {
      const response = await fetch('/api/create-manual-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          total: totaleFinale,
          spedizione: spedizione.costo > 0 ? spedizione.costo : 0,
          paymentMethod: methodNames[paymentMethod as keyof typeof methodNames] || paymentMethod,
          customerEmail: customer.email.trim(),
          customerName: customer.name.trim(),
          phone: customer.phone.trim(),
          address: {
            street: customer.address.trim(),
            city: customer.city.trim(),
            cap: customer.cap.trim(),
            province: customer.province.trim().toUpperCase(),
            country: 'IT'
          },
          discountCode: discountApplied?.code || null,
          discountAmount: discountAmount,
        }),
      });

      if (!response.ok) throw new Error('Errore nella creazione dell\'ordine');

      const data = await response.json();
      setOrderId(data.orderId);
      setStep('success');
      clearCart();
      trackEvent('purchase', { value: totaleFinale, method: paymentMethod });
    } catch (error: unknown) {
      const e = error as Error;
      console.error('Checkout error:', e);
      showToast?.(`Errore durante il checkout: ${e.message}`, 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const methodNames = {
    bank_transfer: 'Bonifico Bancario',
    whatsapp: 'Ordine via WhatsApp'
  };

  const stepLabel = {
    cart: { title: 'Il Tuo', highlight: 'Carrello' },
    info: { title: 'I Tuoi', highlight: 'Dati' },
    payment: { title: 'Scegli', highlight: 'Pagamento' },
    success: { title: 'Ordine', highlight: 'Confermato' },
  };

  const InputField = ({ label, field, type = 'text', placeholder, small = false }: {
    label: string; field: keyof CustomerInfo; type?: string; placeholder: string; small?: boolean;
  }) => (
    <div className={small ? '' : 'col-span-full'}>
      <label htmlFor={`checkout-${field}`} className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">{label}</label>
      <input
        id={`checkout-${field}`}
        type={type}
        value={customer[field]}
        onChange={(e) => { setCustomer(prev => ({ ...prev, [field]: e.target.value })); setFormErrors(prev => ({ ...prev, [field]: undefined })); }}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-zinc-900 border rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors text-sm ${formErrors[field] ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50' : 'border-white/10 focus:border-brand-orange/50 focus:ring-brand-orange/50'}`}
        aria-describedby={formErrors[field] ? `${field}-error` : undefined}
        aria-invalid={!!formErrors[field]}
      />
      {formErrors[field] && <p id={`${field}-error`} className="text-red-400 text-xs mt-1">{formErrors[field]}</p>}
    </div>
  );

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
            aria-hidden="true"
          />

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-label="Carrello"
            className="fixed top-0 right-0 h-full w-full md:w-[520px] bg-[#050505] border-l border-white/5 shadow-2xl z-[450] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 md:p-10 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white leading-none">
                  {stepLabel[step].title}{' '}
                  <span className="text-brand-orange">{stepLabel[step].highlight}</span>
                </h2>
                <div className="flex items-center gap-4 mt-2">
                  {step === 'cart' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-pulse" />
                        <span className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold">
                          {items.length} Prodotti
                        </span>
                      </div>
                      {items.length > 0 && (
                        <button onClick={clearCart} className="text-[10px] text-zinc-500 hover:text-red-500 uppercase tracking-widest font-bold transition-colors">
                          Svuota
                        </button>
                      )}
                    </>
                  ) : step !== 'success' ? (
                    <button
                      onClick={() => setStep(step === 'payment' ? 'info' : 'cart')}
                      className="flex items-center gap-1 text-[10px] text-brand-orange hover:text-white uppercase tracking-widest font-bold transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" /> Indietro
                    </button>
                  ) : null}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Chiudi carrello"
                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-500 group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>

            {/* Step indicator */}
            {step !== 'success' && items.length > 0 && (
              <div className="px-8 md:px-10 pb-4 flex gap-2">
                {(['cart', 'info', 'payment'] as const).map((s, i) => (
                  <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${
                    (['cart', 'info', 'payment'].indexOf(step) >= i) ? 'bg-brand-orange' : 'bg-zinc-800'
                  }`} />
                ))}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 md:px-10 space-y-6 custom-scrollbar">

              {/* ── STEP: CART ── */}
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
                      onClick={() => { onNavigate('shop'); onClose(); }}
                      className="mt-10 px-10 py-4 bg-white text-black rounded-full text-xs font-black uppercase tracking-widest hover:bg-brand-orange hover:text-white transition-all duration-500"
                    >
                      Inizia lo Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 pb-6">
                    {items.map((item) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        key={item.id}
                        className="group relative flex gap-5 items-center"
                      >
                        <div className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-zinc-900 border border-white/5">
                          <img src={getDirectDriveUrl(item.image)} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-brand-orange transition-colors">{item.name}</h3>
                          <p className="text-zinc-500 text-xs mb-3 uppercase tracking-wider font-medium">DJ Equipment</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 glass-subtle rounded-full px-3 py-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                aria-label="Diminuisci quantità"
                                className="text-zinc-500 hover:text-white transition-colors p-1"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, Math.min(item.quantity + 1, 10))}
                                aria-label="Aumenta quantità"
                                className="text-zinc-500 hover:text-white transition-colors p-1"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-base font-black text-white">€{(item.price * item.quantity).toFixed(2)}</span>
                              <button onClick={() => removeItem(item.id)} aria-label={`Rimuovi ${item.name}`} className="text-zinc-700 hover:text-red-500 transition-colors p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Discount code */}
                    <div className="pt-4 border-t border-white/5">
                      {discountApplied ? (
                        <div className="flex items-center justify-between px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <div>
                              <span className="text-green-400 text-xs font-black uppercase tracking-wider">Codice applicato</span>
                              <p className="text-green-300 text-[10px] mt-0.5">
                                {discountApplied.code} — {discountApplied.type === 'percent' ? `${discountApplied.value}% di sconto` : `€${discountApplied.value} di sconto`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => { setDiscountApplied(null); setDiscountCode(''); setDiscountError(''); }}
                            aria-label="Rimuovi codice sconto"
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                              <input
                                type="text"
                                value={discountCode}
                                onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(''); }}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyDiscount(); }}
                                placeholder="Codice sconto"
                                className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-brand-orange/50"
                              />
                            </div>
                            <button
                              onClick={handleApplyDiscount}
                              disabled={isCheckingDiscount || !discountCode.trim()}
                              className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              {isCheckingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Applica'}
                            </button>
                          </div>
                          {discountError && <p className="text-red-400 text-xs mt-2">{discountError}</p>}
                        </>
                      )}
                    </div>

                    {/* AI Suggestion */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-2xl glass-subtle relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-3">
                        <Sparkles className="w-4 h-4 text-brand-orange animate-pulse" />
                      </div>
                      <h4 className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em] mb-3">AI Setup Concierge</h4>
                      {isLoadingSuggestion ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-4 h-4 animate-spin text-brand-orange" />
                          <span className="text-xs text-zinc-500">Analisi configurazione...</span>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-400 leading-relaxed italic">"{suggestion}"</p>
                      )}
                    </motion.div>
                  </div>
                )
              )}

              {/* ── STEP: CUSTOMER INFO ── */}
              {step === 'info' && (
                <div className="space-y-5 pb-6">
                  <p className="text-zinc-400 text-sm">Inserisci i tuoi dati per la spedizione e la fatturazione.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Nome e Cognome *" field="name" placeholder="Mario Rossi" />
                    <InputField label="Email *" field="email" type="email" placeholder="mario@email.it" />
                    <InputField label="Telefono *" field="phone" type="tel" placeholder="+39 333 1234567" />
                    <InputField label="Indirizzo *" field="address" placeholder="Via Roma 1" />
                    <InputField label="Città *" field="city" placeholder="Milano" small />
                    <div className="grid grid-cols-2 gap-3">
                      <InputField label="CAP *" field="cap" placeholder="20100" small />
                      <InputField label="Prov. *" field="province" placeholder="MI" small />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP: PAYMENT ── */}
              {step === 'payment' && (
                <div className="space-y-5 pb-6">
                  <p className="text-zinc-400 text-sm">Seleziona il metodo di pagamento preferito. Pagamento sicuro — riceverai le istruzioni complete via email.</p>

                  <div className="grid gap-3">
                    {[
                      { id: 'bank_transfer', name: 'Bonifico Bancario', icon: '🏦', desc: 'Ricevi i dati bancari completi via email' },
                      { id: 'whatsapp', name: 'Ordine via WhatsApp', icon: '💬', desc: 'Invia il tuo ordine su WhatsApp e finalizza con noi' },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex items-center justify-between p-5 rounded-2xl transition-all duration-300 text-left ${
                          paymentMethod === method.id
                            ? 'border border-brand-orange bg-brand-orange/10'
                            : 'glass hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{method.icon}</span>
                          <div>
                            <span className={`font-bold text-sm block ${paymentMethod === method.id ? 'text-white' : 'text-zinc-400'}`}>
                              {method.name}
                            </span>
                            <span className="text-[10px] text-zinc-600">{method.desc}</span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
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
                      className="p-5 rounded-2xl glass space-y-3"
                    >
                      <h5 className="text-xs font-black text-white uppercase tracking-widest">Dati per il Bonifico</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Beneficiario:</span>
                          <span className="text-white font-medium">Officinadelsuono di Amerigo De Cristofaro</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">IBAN:</span>
                          <span className="text-white font-mono font-medium text-xs">Riceverai i dati via email</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-500 italic">
                        Dopo la conferma dell'ordine riceverai un'email con i dati bancari completi e la causale. L'ordine verrà elaborato al ricevimento del pagamento (1-2 giorni lavorativi).
                      </p>
                    </motion.div>
                  )}

                  {/* T&C Acceptance */}
                  <label className="flex items-start gap-3 p-4 rounded-xl glass cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-brand-orange focus:ring-brand-orange/50 accent-[#F27D26]"
                    />
                    <span className="text-xs text-zinc-400 leading-relaxed">
                      Ho letto e accetto i{' '}
                      <button onClick={() => { onNavigate('terms'); onClose(); }} className="text-brand-orange hover:text-white underline transition-colors">
                        Termini e Condizioni
                      </button>{' '}
                      e la{' '}
                      <button onClick={() => { onNavigate('privacy'); onClose(); }} className="text-brand-orange hover:text-white underline transition-colors">
                        Privacy Policy
                      </button>
                      . *
                    </span>
                  </label>

                  {/* Order summary */}
                  <div className="p-5 rounded-2xl glass space-y-2">
                    <h5 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Riepilogo spedizione</h5>
                    <p className="text-sm text-zinc-300">{customer.name}</p>
                    <p className="text-xs text-zinc-500">{customer.address}, {customer.cap} {customer.city} ({customer.province})</p>
                    <p className="text-xs text-zinc-500">{customer.email} · {customer.phone}</p>
                  </div>
                </div>
              )}

              {/* ── STEP: SUCCESS ── */}
              {step === 'success' && (
                <div className="h-full flex flex-col items-center justify-center text-center py-16">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Grazie per l'ordine!</h3>
                  {orderId && (
                    <p className="text-brand-orange font-mono font-bold text-lg mb-4">#{orderId}</p>
                  )}
                  <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed mb-3">
                    Il tuo ordine è stato ricevuto. Riceverai un'email di conferma a <strong className="text-white">{customer.email}</strong> con tutti i dettagli.
                  </p>
                  <p className="text-zinc-500 text-xs mb-8">
                    Metodo di pagamento: <strong className="text-zinc-300">{methodNames[paymentMethod as keyof typeof methodNames]}</strong>
                  </p>

                  {paymentMethod === 'bank_transfer' && (
                    <div className="p-5 glass rounded-2xl mb-8 w-full text-left">
                      <p className="text-xs text-zinc-400 mb-2">Riceverai i dati per il bonifico via email. L'ordine verrà elaborato dopo l'accredito.</p>
                    </div>
                  )}

                  {paymentMethod === 'whatsapp' && (
                    <div className="p-5 bg-green-900/20 rounded-2xl border border-green-500/20 mb-8 w-full text-left">
                      <p className="text-xs text-green-400 mb-1 font-bold">Ordine inviato su WhatsApp!</p>
                      <p className="text-xs text-zinc-400">Amerigo risponderà al tuo messaggio per confermare l'ordine e comunicarti le modalità di pagamento.</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 w-full">
                    <button
                      onClick={() => { setStep('cart'); setCustomer(EMPTY_CUSTOMER); setAcceptedTerms(false); setPaymentMethod(null); setDiscountApplied(null); onClose(); }}
                      className="w-full px-8 py-4 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-[0.3em] hover:bg-brand-orange hover:text-white transition-all duration-500"
                    >
                      Torna al Sito
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && step !== 'success' && (
              <div className="p-8 md:p-10 bg-black border-t border-white/5 shrink-0">
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em]">Subtotale</span>
                    <span className="text-lg font-black text-white tracking-tighter">
                      €{subtotal.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {discountApplied && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Sconto ({discountApplied.code})</span>
                      <span className="text-sm font-bold text-green-400">-€{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-brand-orange" />
                      <span className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em]">Spedizione</span>
                    </div>
                    <span className={`text-sm font-bold ${spedizione.gratuita ? 'text-green-400' : 'text-brand-orange'}`}>
                      {formatCostoSpedizione(spedizione)}
                    </span>
                  </div>
                  {!spedizione.gratuita && manca > 0 && (
                    <div className="text-[10px] text-yellow-500 text-right">
                      Aggiungi €{manca.toFixed(2)} per la spedizione gratuita
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <span className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Totale</span>
                    <div className="text-right">
                      <span className="text-3xl font-black text-white tracking-tighter">
                        €{totaleFinale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </span>
                      <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1 font-bold">IVA inclusa</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || (step === 'payment' && (!paymentMethod || !acceptedTerms))}
                  className="relative w-full h-16 bg-brand-orange text-white rounded-2xl overflow-hidden group transition-all duration-500 hover:shadow-[0_20px_40px_rgba(242,125,38,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <div className="relative flex items-center justify-center gap-3">
                    {isCheckingOut ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span className="text-sm font-black uppercase tracking-[0.2em]">
                          {step === 'cart' ? 'Procedi' : step === 'info' ? 'Continua' : 'Conferma Ordine'}
                        </span>
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </div>
                </button>

                {step === 'cart' && (
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 text-center">
                      Pagamenti Sicuri
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
