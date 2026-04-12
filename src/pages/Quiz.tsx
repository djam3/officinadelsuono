import React, { useState, useEffect } from 'react';
import { useSEO } from '../hooks/useSEO';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Headphones, Speaker, Mic, Music, Settings, ArrowRight, ShoppingCart, Check, MessageCircle } from 'lucide-react';
import { getDirectDriveUrl } from '../utils/drive';
import { useAIFeatures } from '../contexts/AIFeaturesContext';
import { generateQuizRecommendation } from '../services/aiService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface QuizProps {
  onNavigate: (page: string, productId?: string) => void;
  triggerFlyToCart?: (image: string, startX: number, startY: number) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type Level = 'Principiante' | 'Intermedio' | 'Pro' | '';
type Genre = 'House' | 'Techno' | 'Hip Hop' | 'Open Format' | '';
type Environment = 'Home Studio' | 'Club' | 'Live/Eventi' | '';
type Budget = 'Entry' | 'Mid' | 'High' | '';

export function Quiz({ onNavigate, triggerFlyToCart, showToast }: QuizProps) {
  useSEO({
    title: 'AI Setup Architect — Trova il Setup DJ Perfetto per Te',
    description: 'Rispondi a 4 domande sul tuo stile, genere musicale e budget. La nostra AI ingegnerizzerà il setup DJ perfetto per te in pochi secondi.',
    url: '/quiz',
  });

  const { features, loading: featuresLoading } = useAIFeatures();
  const quizEnabled = features.quiz_trova_setup?.enabled ?? true;

  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<Level>('');
  const [genre, setGenre] = useState<Genre>('');
  const [environment, setEnvironment] = useState<Environment>('');
  const [budget, setBudget] = useState<Budget>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<{
    name: string; description: string; tags: string[];
    rationale: string; budgetRange: string; productId?: string | null;
    image?: string; price?: number;
  } | null>(null);

  const handleNext = () => {
    if (step === 3) {
      setIsAnalyzing(true);
      setAiRecommendation(null);
      (async () => {
        try {
          // Load products for AI context
          const snap = await getDocs(collection(db, 'products'));
          const products = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
          const rec = await generateQuizRecommendation(
            { level, genre, environment, budget },
            products
          );
          // Try to find matching product image/price
          const matched = products.find((p: any) => p.id === rec.productId);
          setAiRecommendation({
            ...rec,
            image: matched?.image && matched.image !== 'USE_IMAGES_ARRAY'
              ? matched.image
              : matched?.images?.[0] || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80',
            price: matched?.price,
          });
        } catch {
          // Fallback to static recommendation
          setAiRecommendation(null);
        }
        setIsAnalyzing(false);
        setStep(4);
      })();
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const getRecommendation = () => {
    // Basic logic for recommendation based on answers
    if (level === 'Principiante' || budget === 'Entry') {
      return {
        name: 'Bundle Start DJ Pro',
        description: 'Il setup perfetto per iniziare col piede giusto. Include console Pioneer DDJ-FLX4, casse Alto TX415 e cuffie Sennheiser HD-25 Light.',
        price: 1749.00,
        image: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=2071&auto=format&fit=crop',
        id: 'bundle-start-dj-pro',
        tags: ['Plug & Play', 'Ideale per Iniziare', 'Rapporto Qualità/Prezzo']
      };
    } else if (environment === 'Club' || level === 'Pro' || budget === 'High') {
      return {
        name: 'Club Standard Ecosystem',
        description: 'La configurazione definitiva per i professionisti. CDJ-3000, mixer DJM-A9 e monitoraggio ad altissima fedeltà per performance senza compromessi.',
        price: 8999.00,
        image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80',
        id: 'club-standard-ecosystem',
        tags: ['Standard Industriale', 'Massima Affidabilità', 'Zero Latenza']
      };
    } else {
      return {
        name: 'Advanced Hybrid Setup',
        description: 'Versatilità pura per producer e DJ intermedi. Controller a 4 canali, monitor da studio flat e scheda audio dedicata.',
        price: 3499.00,
        image: 'https://images.unsplash.com/photo-1621976498725-780c103236e4?auto=format&fit=crop&q=80',
        id: 'advanced-hybrid-setup',
        tags: ['Versatile', 'Alta Qualità Audio', 'Espandibile']
      };
    }
  };

  const staticRec = getRecommendation();
  // Use AI recommendation if available, otherwise fall back to static
  const recommendation = aiRecommendation
    ? {
        name: aiRecommendation.name,
        description: aiRecommendation.description,
        price: aiRecommendation.price ?? staticRec.price,
        image: aiRecommendation.image ?? staticRec.image,
        id: aiRecommendation.productId ?? staticRec.id,
        tags: aiRecommendation.tags,
      }
    : staticRec;

  // Show unavailable screen if feature is disabled
  if (!featuresLoading && !quizEnabled) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-24 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-zinc-600" />
          </div>
          <h2 className="text-2xl font-black mb-3">Quiz temporaneamente non disponibile</h2>
          <p className="text-zinc-400 mb-8">Il quiz AI è attualmente disabilitato. Contatta il nostro team per una consulenza personalizzata.</p>
          <a
            href="https://wa.me/393477397016"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-xl font-bold"
          >
            <MessageCircle className="w-5 h-5" />
            Parla con Amerigo
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-bold tracking-wide uppercase">AI Setup Architect</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Progetta il tuo <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-400">Suono</span>.
          </h1>
          <p className="text-zinc-400 text-lg">
            Rispondi a 4 brevi domande. La nostra AI analizzerà le tue esigenze e ti proporrà il setup ingegnerizzato perfetto per te.
          </p>
        </div>

        {/* Progress Bar */}
        {step < 4 && !isAnalyzing && (
          <div className="mb-12">
            <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
              <span>Step {step + 1} di 4</span>
              <span>{Math.round(((step) / 4) * 100)}% Completato</span>
            </div>
            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-brand-orange"
                initial={{ width: `${(step / 4) * 100}%` }}
                animate={{ width: `${((step + 1) / 4) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>
        )}

        {/* Quiz Container */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-xl shadow-2xl relative min-h-[400px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {/* Step 0: Level */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Qual è il tuo livello di esperienza?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'Principiante', icon: <Headphones className="w-8 h-8" />, desc: 'Sto iniziando ora' },
                    { id: 'Intermedio', icon: <Settings className="w-8 h-8" />, desc: 'Suono già da un po\'' },
                    { id: 'Pro', icon: <Sparkles className="w-8 h-8" />, desc: 'È la mia professione' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setLevel(item.id as Level); setTimeout(handleNext, 300); }}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-4 ${level === item.id ? 'border-brand-orange bg-brand-orange/10' : 'border-white/5 bg-zinc-900 hover:border-white/20 hover:bg-zinc-800'}`}
                    >
                      <div className={level === item.id ? 'text-brand-orange' : 'text-zinc-400'}>
                        {item.icon}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{item.id}</div>
                        <div className="text-sm text-zinc-500 mt-1">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1: Genre */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Che genere suoni principalmente?</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'House', icon: <Music className="w-6 h-6" /> },
                    { id: 'Techno', icon: <Settings className="w-6 h-6" /> },
                    { id: 'Hip Hop', icon: <Mic className="w-6 h-6" /> },
                    { id: 'Open Format', icon: <Sparkles className="w-6 h-6" /> }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setGenre(item.id as Genre); setTimeout(handleNext, 300); }}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-3 ${genre === item.id ? 'border-brand-orange bg-brand-orange/10' : 'border-white/5 bg-zinc-900 hover:border-white/20 hover:bg-zinc-800'}`}
                    >
                      <div className={genre === item.id ? 'text-brand-orange' : 'text-zinc-400'}>
                        {item.icon}
                      </div>
                      <div className="font-bold">{item.id}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Environment */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Dove utilizzerai il setup?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'Home Studio', icon: <Headphones className="w-8 h-8" />, desc: 'In casa o in studio' },
                    { id: 'Club', icon: <Speaker className="w-8 h-8" />, desc: 'Locali e discoteche' },
                    { id: 'Live/Eventi', icon: <Mic className="w-8 h-8" />, desc: 'Feste private e piazze' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setEnvironment(item.id as Environment); setTimeout(handleNext, 300); }}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-4 ${environment === item.id ? 'border-brand-orange bg-brand-orange/10' : 'border-white/5 bg-zinc-900 hover:border-white/20 hover:bg-zinc-800'}`}
                    >
                      <div className={environment === item.id ? 'text-brand-orange' : 'text-zinc-400'}>
                        {item.icon}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{item.id}</div>
                        <div className="text-sm text-zinc-500 mt-1">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Budget */}
            {step === 3 && !isAnalyzing && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Qual è il tuo budget indicativo?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'Entry', label: '< 1.500€', desc: 'Essenziale ma pro' },
                    { id: 'Mid', label: '1.500€ - 4.000€', desc: 'Setup avanzato' },
                    { id: 'High', label: '> 4.000€', desc: 'Senza compromessi' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setBudget(item.id as Budget); setTimeout(handleNext, 300); }}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-2 ${budget === item.id ? 'border-brand-orange bg-brand-orange/10' : 'border-white/5 bg-zinc-900 hover:border-white/20 hover:bg-zinc-800'}`}
                    >
                      <div className="font-black text-2xl text-white">{item.label}</div>
                      <div className="text-sm text-zinc-400">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Analyzing State */}
            {isAnalyzing && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex flex-col items-center justify-center text-center py-12"
              >
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-brand-orange rounded-full border-t-transparent animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-brand-orange animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold mb-3">Ingegnerizzazione in corso...</h2>
                <p className="text-zinc-400">L'AI sta calcolando il setup perfetto in base alle tue risposte.</p>
              </motion.div>
            )}

            {/* Step 4: Results */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-500 mb-4">
                    <Check className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-black mb-2">Setup Trovato!</h2>
                  <p className="text-zinc-400">Basato sul tuo profilo ({level}, {genre}, {environment}), ecco la nostra raccomandazione ingegnerizzata.</p>
                </div>

                <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden flex flex-col md:flex-row mb-8">
                  <div className="w-full md:w-2/5 h-64 md:h-auto relative">
                    <img src={recommendation.image} alt={recommendation.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent md:hidden"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-950 hidden md:block"></div>
                  </div>
                  <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col justify-center">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {recommendation.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-brand-orange/10 text-brand-orange text-xs font-bold uppercase tracking-wider rounded-full border border-brand-orange/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-2xl font-black mb-3">{recommendation.name}</h3>
                    <p className="text-zinc-400 mb-6 leading-relaxed">{recommendation.description}</p>
                    <div className="text-3xl font-black text-white mb-8">
                      € {recommendation.price.toFixed(2)}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => onNavigate('product', recommendation.id)}
                        className="flex-1 py-3 px-4 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                      >
                        Vedi Dettagli
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <a 
                        href={`https://wa.me/393477397016?text=Ciao%20Amerigo!%20%F0%9F%91%8B%20Ho%20fatto%20il%20quiz%20sull'AI%20Setup%20Architect.%20Mi%20ha%20consigliato%20il%20${recommendation.name}.%20Vorrei%20parlarne%20con%20te.`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-white/10"
                      >
                        <MessageCircle className="w-4 h-4 text-green-500" />
                        Parla con l'Ingegnere
                      </a>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <button onClick={() => { setStep(0); setLevel(''); setGenre(''); setEnvironment(''); setBudget(''); }} className="text-zinc-500 hover:text-white transition-colors text-sm font-medium underline underline-offset-4">
                    Rifai il Quiz
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Navigation Buttons (Back) */}
        {step > 0 && step < 4 && !isAnalyzing && (
          <div className="mt-6 flex justify-start">
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Indietro
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
