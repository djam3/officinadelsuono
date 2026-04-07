import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Shield, BarChart3, Target, X, Check } from 'lucide-react';

interface ConsentState {
  necessary: true; // Always true
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

const CONSENT_KEY = 'cookie-consent';
const CONSENT_VERSION = '1.0';

interface CookieBannerProps {
  onNavigate?: (page: string) => void;
}

export function CookieBanner({ onNavigate }: CookieBannerProps) {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const check = () => {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        setVisible(true);
        return;
      }
      try {
        const parsed: ConsentState = JSON.parse(stored);
        if (parsed.version !== CONSENT_VERSION) {
          setVisible(true);
        }
      } catch {
        setVisible(true);
      }
    };
    check();
    const handler = () => {
      setShowDetails(false);
      setAnalytics(false);
      setMarketing(false);
      setVisible(true);
    };
    window.addEventListener('cookie-consent-reset', handler);
    return () => window.removeEventListener('cookie-consent-reset', handler);
  }, []);

  const save = (consent: Omit<ConsentState, 'timestamp' | 'version' | 'necessary'>) => {
    const state: ConsentState = {
      necessary: true,
      ...consent,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
    setVisible(false);
  };

  const acceptAll = () => save({ analytics: true, marketing: true });
  const rejectAll = () => save({ analytics: false, marketing: false });
  const saveCustom = () => save({ analytics, marketing });

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="fixed bottom-0 left-0 right-0 z-[300] p-4 sm:p-6 pointer-events-none"
      >
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            {!showDetails ? (
              // Banner compatto
              <div className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-brand-orange to-orange-600 flex items-center justify-center shadow-lg shadow-brand-orange/30">
                    <Cookie className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-white mb-2">La tua privacy è importante</h3>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      Utilizziamo cookie tecnici necessari al funzionamento del sito e, previo tuo consenso, cookie analitici per migliorare l'esperienza utente. Puoi accettare tutti i cookie, rifiutare quelli non essenziali o personalizzare le tue preferenze.{' '}
                      <button
                        onClick={() => onNavigate?.('cookie-policy')}
                        className="text-brand-orange hover:underline font-semibold"
                      >
                        Leggi la Cookie Policy
                      </button>
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={acceptAll}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-orange to-orange-600 text-white rounded-xl font-bold hover:from-orange-500 hover:to-orange-500 transition-all shadow-lg shadow-brand-orange/20 text-sm uppercase tracking-wider"
                  >
                    Accetta tutti
                  </button>
                  <button
                    onClick={rejectAll}
                    className="flex-1 px-6 py-3 bg-zinc-900 border border-white/10 text-white rounded-xl font-bold hover:bg-zinc-800 hover:border-white/20 transition-all text-sm uppercase tracking-wider"
                  >
                    Solo necessari
                  </button>
                  <button
                    onClick={() => setShowDetails(true)}
                    className="flex-1 px-6 py-3 bg-transparent border border-white/10 text-zinc-300 rounded-xl font-bold hover:bg-white/5 hover:text-white transition-all text-sm uppercase tracking-wider"
                  >
                    Personalizza
                  </button>
                </div>
              </div>
            ) : (
              // Pannello dettagliato
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-black text-white mb-1">Preferenze Cookie</h3>
                    <p className="text-sm text-zinc-400">Scegli quali categorie attivare.</p>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-zinc-500 hover:text-white p-2 -m-2"
                    aria-label="Chiudi"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto">
                  {/* Necessari */}
                  <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-bold text-white text-sm">Cookie necessari</h4>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Sempre attivi</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Indispensabili per il funzionamento del sito (login, carrello, sicurezza). Non richiedono consenso.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Analytics */}
                  <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-bold text-white text-sm">Cookie analitici</h4>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={analytics}
                            onClick={() => setAnalytics(!analytics)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${analytics ? 'bg-brand-orange' : 'bg-zinc-700'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${analytics ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Ci aiutano a capire come utilizzi il sito (Google Analytics, Firebase Analytics) per migliorarlo. Dati anonimizzati.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Marketing */}
                  <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Target className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-bold text-white text-sm">Cookie di marketing</h4>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={marketing}
                            onClick={() => setMarketing(!marketing)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${marketing ? 'bg-brand-orange' : 'bg-zinc-700'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${marketing ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Utilizzati per mostrarti contenuti pubblicitari personalizzati. Attualmente non attivi.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={saveCustom}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-orange to-orange-600 text-white rounded-xl font-bold hover:from-orange-500 hover:to-orange-500 transition-all shadow-lg shadow-brand-orange/20 text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Salva preferenze
                  </button>
                  <button
                    onClick={acceptAll}
                    className="flex-1 px-6 py-3 bg-zinc-900 border border-white/10 text-white rounded-xl font-bold hover:bg-zinc-800 hover:border-white/20 transition-all text-sm uppercase tracking-wider"
                  >
                    Accetta tutti
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
