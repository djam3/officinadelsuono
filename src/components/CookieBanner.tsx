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
    // il caricatore in index.html sta aspettando questo: senza, la scelta
    // avrebbe effetto solo al ricaricamento successivo
    window.dispatchEvent(new Event('consenso-aggiornato'));
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
          <div className="bg-ink/95 backdrop-blur-xl border border-paper/10 rounded-none shadow-2xl overflow-hidden">
            {!showDetails ? (
              // Banner compatto
              <div className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-none bg-marker flex items-center justify-center ">
                    <Cookie className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-white mb-2">Questo sito non traccia nessuno</h3>
                    <p className="text-sm text-paper/90 leading-relaxed">
                      Oggi non scrive cookie e non carica niente da altri siti. È predisposto per le statistiche
                      di visita, che partirebbero solo con il tuo consenso: se dici di no, non viene caricato
                      nulla. Quello che scrivi nel calcolatore resta comunque nel tuo browser.{' '}
                      <button
                        onClick={() => onNavigate?.('cookie-policy')}
                        className="text-marker hover:underline font-semibold"
                      >
                        Leggi la Cookie Policy
                      </button>
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={acceptAll}
                    className="flex-1 px-6 py-3 bg-marker text-ink rounded-none font-bold hover:bg-[#A5E6FA] transition-all  text-sm uppercase tracking-wider"
                  >
                    Accetta tutti
                  </button>
                  <button
                    onClick={rejectAll}
                    className="flex-1 px-6 py-3 bg-paper/10 border border-paper/25 text-paper rounded-none font-bold hover:bg-paper/15 hover:border-paper/40 hover:text-white transition-all text-sm uppercase tracking-wider"
                  >
                    Solo necessari
                  </button>
                  <button
                    onClick={() => setShowDetails(true)}
                    className="flex-1 px-6 py-3 bg-transparent border border-paper/10 text-paper/90 rounded-none font-bold hover:bg-paper/5 hover:text-white transition-all text-sm uppercase tracking-wider"
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
                    <p className="text-sm text-graphite">Scegli quali categorie attivare.</p>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-graphite hover:text-white p-2 -m-2"
                    aria-label="Chiudi"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto">
                  {/* Necessari */}
                  <div className="bg-ink-2/70 border border-paper/10 rounded-none p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 shrink-0 rounded-none bg-emerald-500/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-bold text-white text-sm">Cookie necessari</h4>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Sempre attivi</span>
                        </div>
                        <p className="text-xs text-graphite leading-relaxed">
                          L’unica cosa che il sito salva da sé è la risposta che dai qui, per non richiedertela a ogni visita. Non richiede consenso.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Analytics */}
                  <div className="bg-ink-2/70 border border-paper/10 rounded-none p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 shrink-0 rounded-none bg-blue-500/10 flex items-center justify-center">
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
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${analytics ? 'bg-marker' : 'bg-ink-4'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${analytics ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                        <p className="text-xs text-graphite leading-relaxed">
                          Google Analytics, con l’indirizzo IP anonimizzato, per sapere quante persone usano il calcolatore. Oggi non è configurato: acconsentendo non si attiva niente finché non lo sarà.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Marketing */}
                  <div className="bg-ink-2/70 border border-paper/10 rounded-none p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 shrink-0 rounded-none bg-purple-500/10 flex items-center justify-center">
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
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${marketing ? 'bg-marker' : 'bg-ink-4'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${marketing ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                        <p className="text-xs text-graphite leading-relaxed">
                          Utilizzati per mostrarti contenuti pubblicitari personalizzati. Attualmente non attivi.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={saveCustom}
                    className="flex-1 px-6 py-3 bg-marker text-ink rounded-none font-bold hover:bg-[#A5E6FA] transition-all  text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Salva preferenze
                  </button>
                  <button
                    onClick={acceptAll}
                    className="flex-1 px-6 py-3 bg-paper/10 border border-paper/25 text-paper rounded-none font-bold hover:bg-paper/15 hover:border-paper/40 hover:text-white transition-all text-sm uppercase tracking-wider"
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
