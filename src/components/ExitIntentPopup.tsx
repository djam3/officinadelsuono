import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, AlertCircle, Gift } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Show when mouse leaves viewport top edge
      if (e.clientY <= 0 && !sessionStorage.getItem('exitIntentShown')) {
        setIsVisible(true);
        sessionStorage.setItem('exitIntentShown', 'true');
      }
    };
    
    // Desktop only
    if (window.innerWidth > 768) {
      document.addEventListener('mouseleave', handleMouseLeave);
    }
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email: email.trim(),
        subscribedAt: new Date().toISOString(),
        source: 'exit_intent'
      });
      setStatus('success');
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsVisible(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-zinc-950 border border-brand-orange/30 p-8 rounded-3xl shadow-2xl max-w-lg w-full text-center overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 blur-3xl rounded-full -mr-16 -mt-16" />
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-16 h-16 mx-auto bg-brand-orange/20 rounded-full flex items-center justify-center mb-6">
              <Gift className="w-8 h-8 text-brand-orange" />
            </div>
            
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
              Stai per fare un errore. <span className="text-brand-orange">🛑</span>
            </h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Stai per andartene e comprare altrove a scatola chiusa. Non farlo. Lasciaci la tua email: ti mandiamo subito un <strong className="text-white">codice sconto del 10% reale</strong> (nessun trucchetto) sul tuo primo ordine e i nostri contatti diretti per qualsiasi dubbio tecnico.
            </p>
            
            {status === 'success' ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-bold text-white mb-1">Codice Inviato!</h3>
                <p className="text-sm text-green-400">Controlla la tua casella email (anche nello spam).</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Il tuo indirizzo email"
                  required
                  disabled={status === 'loading'}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl py-4 px-5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange disabled:opacity-50 transition-all text-center"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-4 bg-brand-orange hover:bg-orange-600 text-white font-black rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                >
                  {status === 'loading' ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Sblocca lo Sconto <Send className="w-5 h-5" /></>
                  )}
                </button>
                {status === 'error' && (
                  <div className="text-red-500 text-sm flex items-center justify-center gap-1 mt-2">
                    <AlertCircle className="w-4 h-4" /> Errore, riprova più tardi.
                  </div>
                )}
              </form>
            )}
            
            <button 
              onClick={() => setIsVisible(false)}
              className="mt-6 text-xs text-zinc-600 hover:text-zinc-400 underline"
            >
              No grazie, preferisco rischiare di comprare l'attrezzatura sbagliata.
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
