import { useState, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Target, Sparkles, Star, AtSign, Euro, RefreshCw, Loader2,
  Zap, TrendingUp, Settings, X, Save, ChevronDown, ExternalLink,
  CheckCircle2, Info, Key, ShoppingCart, Mail, FileText, BarChart3
} from 'lucide-react';
import { useAIFeatures, AIFeatures, AIFeatureConfig } from '../../contexts/AIFeaturesContext';

const ADMIN_EMAIL = 'officinadelsuono99@gmail.com';

// ─── Provider selector block (reused in every config modal) ──────────────────
const PROVIDER_OPTIONS = [
  { value: 'gemini-free' as const, label: 'Gemini Free (Flash)', sublabel: 'Configurazione GRATUITA — 1.500 richieste/giorno (Consigliato)', color: 'border-green-500/50 bg-green-500/5', badge: '✅ Gratis' },
  { value: 'claude'      as const, label: 'Claude API (Anthropic)', sublabel: 'A PAGAMENTO — Qualità più alta per testi complessi (~€0,02 / chiamata)', color: 'border-brand-orange/50 bg-brand-orange/5', badge: '💰 Premium' },
];

// ─── Feature definitions ──────────────────────────────────────────────────────
export const AI_FEATURE_DEFS = [
  {
    key: 'consulente_am3' as const,
    icon: MessageSquare,
    name: 'Consulente AI "Amerigo"',
    subtitle: 'Chatbot venditore 24/7',
    description: "Un chatbot intelligente formato sulla tua voce e sulla MAT Academy. NON è un bot di assistenza, ma un VENDITORE: capisce il budget dell'utente, risponde a dubbi tecnici e propone il prodotto perfetto portando l'utente direttamente al carrello.",
    benefit: "Aumenta le vendite guidando i clienti indecisi al prodotto giusto.",
    costApi: "Gratis con Gemini",
    impact: "Alta Conversione",
    priority: 5,
    implemented: true,
  },
  {
    key: 'quiz_trova_setup' as const,
    icon: Target,
    name: 'Il Mio Setup Ideale',
    subtitle: 'Lead Generation Intelligente',
    description: "Trasforma la scelta del setup in un'esperienza interattiva. L'utente risponde a poche domande sul suo stile e budget, e l'AI analizza in tempo reale il tuo catalogo prodotti per consigliare il pacchetto perfetto, catturando l'email del potenziale cliente.",
    benefit: "Cattura email di alta qualità consigliando prodotti reali.",
    costApi: "Gratis con Gemini",
    impact: "Lead Generation",
    priority: 5,
    implemented: true,
  },
  {
    key: 'descrizioni_seo_auto' as const,
    icon: Sparkles,
    name: 'SEO Magic Generator',
    subtitle: 'Schede prodotto automatiche',
    description: "L'AI scrive per te schede prodotto professionali, titoli SEO e meta descriptions ottimizzate per Google. Basta inserire il nome del prodotto e la scheda tecnica: l'AI genera testi persuasivi con il tono di voce della tua accademia.",
    benefit: "Risparmia ore di scrittura e migliora il posizionamento su Google.",
    costApi: "Gratis con Gemini",
    impact: "SEO & Produttività",
    priority: 4,
    implemented: true,
  },
  {
    key: 'recensioni_aggregate' as const,
    icon: Star,
    name: 'Insider Trust AI',
    subtitle: 'Recensioni aggregate dal web',
    description: "L'AI scansiona YouTube, Reddit e i forum di settore per creare un riassunto onesto dei 'Pro e Contro' di ogni prodotto. Questo crea fiducia immediata perché l'utente trova un'opinione esperta e imparziale senza dover lasciare il tuo sito.",
    benefit: "Riduce l'abbandono delle pagine prodotto aumentando la fiducia.",
    costApi: "Gratis con Gemini",
    impact: "Trust & Retention",
    priority: 3,
    implemented: true,
  },
  {
    key: 'email_personalizzate' as const,
    icon: AtSign,
    name: 'Smart Newsletter AI',
    subtitle: 'Email Marketing Predittivo',
    description: "Analizza il comportamento dei tuoi clienti per inviare email che la gente vuole davvero aprire. Invece della solita newsletter uguale per tutti, l'AI consiglia accessori compatibili con ciò che hanno già comprato o suggerisce novità basate sui loro gusti.",
    benefit: "Triplica i click nelle email mandando contenuti ultra-rilevanti.",
    costApi: "Gratis con Gemini",
    impact: "Clienti Ricorrenti",
    priority: 3,
    implemented: true,
  },
];

// ─── "Come funziona" guide data ───────────────────────────────────────────────
const FEATURE_GUIDES: Record<string, {
  steps: { icon: React.FC<{ className?: string }>; title: string; body: string }[];
  appearsIn: string;
  requires: string[];
  freeModel: string;
}> = {
  consulente_am3: {
    steps: [
      { icon: MessageSquare, title: 'Il visitatore scrive', body: 'Il widget chat si apre in basso a destra. Il cliente descrive cosa cerca: "vorrei iniziare a fare DJ, budget €500".' },
      { icon: Sparkles,     title: 'Gemini risponde come Amerigo', body: 'Gemini Flash riceve il messaggio + il tuo system prompt (personalizzabile). Risponde da esperto AM3 MAT Academy, chiede chiarimenti, capisce il profilo.' },
      { icon: ShoppingCart, title: 'Proposta prodotto + checkout', body: 'Dopo 2-3 scambi l\'AI consiglia il kit specifico con link diretto al prodotto. Il cliente aggiunge al carrello senza uscire dalla chat.' },
    ],
    appearsIn: 'Widget chat fisso in basso a destra su tutte le pagine del sito (solo se feature attiva)',
    requires: ['API Key Gemini (gratuita su aistudio.google.com)', 'Feature abilitata da questo pannello'],
    freeModel: 'gemini-2.0-flash-lite-exp — 1.500 richieste/giorno gratis',
  },
  quiz_trova_setup: {
    steps: [
      { icon: Target,       title: 'Quiz interattivo 3-4 domande', body: 'Il cliente risponde a domande adattive: livello (principiante/intermedio), genere musicale, budget, uso (casa/club/mobile).' },
      { icon: Sparkles,     title: 'AI analizza il profilo', body: 'Gemini Flash elabora le risposte e seleziona il kit AM3 più adatto tra i tuoi prodotti reali in catalogo.' },
      { icon: Mail,         title: 'Consiglio via email + lead', body: 'L\'AI mostra l\'anteprima del consiglio. Per riceverlo completo, il cliente lascia la sua email → entra nella tua mailing list.' },
    ],
    appearsIn: 'Sezione dedicata nella homepage + pagina /quiz (quando implementata)',
    requires: ['API Key Gemini (gratuita)', 'Lista prodotti nel catalogo Firestore', 'Feature abilitata'],
    freeModel: 'gemini-2.0-flash-lite-exp — 1.500 richieste/giorno gratis',
  },
  descrizioni_seo_auto: {
    steps: [
      { icon: FileText,     title: 'Inserisci nome + scheda tecnica', body: 'Nella sezione Prodotti, crei/modifichi un prodotto. Clicchi "Genera con AI": inserisci solo nome, categoria e specifiche.' },
      { icon: Sparkles,     title: 'Gemini genera tutto il contenuto SEO', body: 'In ~3 secondi ottieni: titolo SEO (60 car.), meta description (155 car.), descrizione lunga 400-600 char., 5 bullet point vantaggi, fino a 3 FAQ.' },
      { icon: CheckCircle2, title: 'Revisione e salvataggio in un click', body: 'Rivedi il testo generato, modifica se necessario, salva. Il prodotto è subito ottimizzato per Google.' },
    ],
    appearsIn: 'Pannello Admin → Prodotti → Modifica prodotto → pulsante "Genera SEO con AI"',
    requires: ['API Key Gemini (gratuita)', 'Feature abilitata', 'Prodotto con nome e categoria'],
    freeModel: 'gemini-2.0-flash-lite — 1.500 richieste/giorno gratis',
  },
  recensioni_aggregate: {
    steps: [
      { icon: BarChart3,    title: 'Analisi nome prodotto', body: 'L\'AI conosce il prodotto dal nome. Genera una sintesi realistica di "cosa dicono i DJ" basandosi sulla conoscenza del modello su forum, YouTube e Reddit.' },
      { icon: Star,         title: 'Sintesi pro e contro strutturata', body: 'Output: paragrafo riassuntivo + lista pro + lista contro + verdetto finale. Tutto in italiano, tono onesto.' },
      { icon: CheckCircle2, title: 'Mostra sulla scheda prodotto', body: 'La sezione "Cosa dicono i DJ" appare automaticamente nella pagina prodotto se la feature è attiva, con disclaimer AI visibile.' },
    ],
    appearsIn: 'Scheda prodotto nel negozio → sezione "Cosa dicono i DJ" (sotto la descrizione)',
    requires: ['API Key Gemini (gratuita)', 'Feature abilitata', 'Prodotti nel catalogo'],
    freeModel: 'gemini-2.0-flash-lite — aggiornamento trimestrale, pochi token per prodotto',
  },
  email_personalizzate: {
    steps: [
      { icon: BarChart3,    title: 'AI analizza il cliente', body: 'In base agli acquisti passati e ai prodotti nel catalogo, l\'AI costruisce un profilo gusti per ogni iscritto alla newsletter.' },
      { icon: Sparkles,     title: 'Genera email su misura', body: 'Per ogni cliente: oggetto personalizzato, corpo email con consigli coerenti con i suoi acquisti, prodotti correlati, offerte mirate.' },
      { icon: Mail,         title: 'Invio tramite Resend', body: 'Le email vengono inviate automaticamente tramite Resend alla frequenza che configuri (settimanale/bisettimanale/mensile).' },
    ],
    appearsIn: 'Background service — nessuna UI visibile al cliente. Gestione nel pannello Newsletter.',
    requires: ['API Key Gemini (gratuita)', 'API Key Resend configurata', 'Almeno 10 iscritti newsletter', 'Feature abilitata'],
    freeModel: 'gemini-2.0-flash-lite — ~1 token/email, molto economico',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export function AIFeaturesPanel({ currentUser }: { currentUser: import('firebase/auth').User | null }) {
  const { features, toggleFeature, togglingKey, updateConfig, costs, costsLoading, refreshCosts } = useAIFeatures();
  const [configModalFeature, setConfigModalFeature] = useState<keyof Omit<AIFeatures, 'last_updated' | 'updated_by'> | null>(null);
  const [configDraft, setConfigDraft] = useState<Partial<AIFeatureConfig>>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSwitchingAll, setIsSwitchingAll] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [expandedGuides, setExpandedGuides] = useState<Set<string>>(new Set());

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const handleToggle = async (key: typeof AI_FEATURE_DEFS[number]['key']) => {
    const wasEnabled = features[key]?.enabled ?? false;
    try {
      await toggleFeature(key, currentUser?.email || ADMIN_EMAIL);
      showToast(`${AI_FEATURE_DEFS.find(f => f.key === key)?.name} ${!wasEnabled ? 'attivata ✓' : 'disattivata'}`);
    } catch {
      showToast('Errore salvataggio. Riprova.');
    }
  };

  const openConfig = (key: typeof AI_FEATURE_DEFS[number]['key']) => {
    setConfigModalFeature(key);
    setConfigDraft({ ...features[key] });
  };

  const handleSwitchAllToGemini = async () => {
    if (!window.confirm('Vuoi impostare Gemini Free come provider predefinito per TUTTE le funzionalità AI? Questa operazione è gratuita e immediata.')) return;
    setIsSwitchingAll(true);
    try {
      for (const f of AI_FEATURE_DEFS) {
        await updateConfig(f.key, { provider: 'gemini-free', model: 'gemini-2.0-flash-lite-exp' }, currentUser?.email || ADMIN_EMAIL);
      }
      showToast('Tutte le funzionalità ora usano Gemini Free! ✨');
    } catch {
      showToast('Errore durante il cambio globale.');
    } finally {
      setIsSwitchingAll(false);
    }
  };

  const toggleGuide = (key: string) => {
    setExpandedGuides(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const activeCount = AI_FEATURE_DEFS.filter(f => features[f.key]?.enabled).length;
  const hasApiKey = !!localStorage.getItem('anthropic_api_key');

  return (
    <div className="space-y-6">

      {/* API Key banner */}
      {!hasApiKey && (
        <div className="flex items-start gap-4 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
          <Key className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-black text-amber-300 text-sm mb-1">API Key Gemini non configurata</p>
            <p className="text-xs text-amber-400/80 leading-relaxed mb-3">
              Tutte le funzionalità AI usano <strong>Gemini Flash gratuito</strong>. Per attivarle, ottieni una API Key gratuita da Google AI Studio e inseriscila nelle impostazioni (icona ⚙️ in alto a destra).
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Ottieni API Key gratuita su aistudio.google.com
            </a>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { label: 'Feature attive', value: activeCount, color: 'text-green-400' },
          { label: 'Feature totali', value: AI_FEATURE_DEFS.length, color: 'text-brand-orange' },
          { label: 'Spesa API (Mese)', value: costs ? `€${costs.total_eur.toFixed(4)}` : '€0.00', color: 'text-zinc-300' },
          { label: 'Chiamate AI', value: costs ? costs.calls_total : '0', color: 'text-zinc-300' },
        ].map(k => (
          <div key={k.label} className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
            <p className={`text-3xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{k.label}</p>
          </div>
        ))}
        {/* Switch All Button */}
        <button
          onClick={handleSwitchAllToGemini}
          disabled={isSwitchingAll}
          className="bg-brand-orange/10 border border-brand-orange/30 rounded-2xl p-5 text-left hover:bg-brand-orange/20 transition-all group"
        >
          {isSwitchingAll ? (
            <Loader2 className="w-6 h-6 animate-spin text-brand-orange mb-2" />
          ) : (
            <Zap className="w-6 h-6 text-brand-orange mb-2 group-hover:scale-110 transition-transform" />
          )}
          <p className="text-sm font-black text-brand-orange leading-tight">Vai su Gemini Gratis</p>
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider mt-1">Imposta tutto su Free</p>
        </button>
      </div>

      {/* Cost card */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-orange/10 rounded-xl"><Euro className="w-5 h-5 text-brand-orange" /></div>
            <div>
              <h3 className="font-black text-base">Costi AI — {costs?.month ?? new Date().toISOString().slice(0, 7)}</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Spesa API effettiva questo mese</p>
            </div>
          </div>
          <button onClick={refreshCosts} disabled={costsLoading} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${costsLoading ? 'animate-spin' : ''}`} /> Aggiorna
          </button>
        </div>
        {costsLoading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="w-4 h-4 animate-spin" /> Caricamento...</div>
        ) : costs ? (
          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black text-white">€{costs.total_eur.toFixed(4)}</span>
              <span className="text-sm text-zinc-500 mb-1">/ {costs.calls_total} chiamate</span>
            </div>
            {Object.keys(costs.by_feature).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                {AI_FEATURE_DEFS.map(f => {
                  const fc = costs.by_feature[f.key] ?? 0;
                  const prov = features[f.key]?.provider ?? 'gemini-free';
                  return (
                    <div key={f.key} className="bg-zinc-800/50 rounded-xl p-3">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest truncate">{f.name}</p>
                      <p className={`text-lg font-black mt-1 ${prov === 'gemini-free' ? 'text-green-400' : 'text-zinc-200'}`}>{prov === 'gemini-free' ? 'Gratuito' : `€${fc.toFixed(4)}`}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{prov === 'gemini-free' ? 'Gemini Flash' : 'Claude API'}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-600 mt-2">Nessuna chiamata AI registrata questo mese.</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-600">Dati non disponibili.</p>
        )}
      </div>

      {/* Feature cards */}
      <div className="space-y-4">
        {AI_FEATURE_DEFS.map(f => {
          const Icon = f.icon;
          const isEnabled = features[f.key]?.enabled ?? false;
          const isToggling = togglingKey === f.key;
          const prov = features[f.key]?.provider ?? 'gemini-free';
          const displayCost = prov === 'gemini-free' ? 'Gratuito (Gemini Flash)' : f.costApi;
          const guide = FEATURE_GUIDES[f.key];
          const isGuideOpen = expandedGuides.has(f.key);

          return (
            <div
              key={f.key}
              className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-all duration-300 ${isEnabled ? 'border-brand-orange/40 shadow-[0_0_30px_rgba(242,125,38,0.07)]' : 'border-white/5'}`}
            >
              {/* Main card */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shrink-0 transition-colors duration-200 ${isEnabled ? 'bg-brand-orange/15 text-brand-orange' : 'bg-zinc-800 text-zinc-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <h3 className="text-lg font-black">{f.name}</h3>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border transition-all duration-200 ${isEnabled ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'}`}>
                            {isEnabled ? 'ATTIVA' : 'DISATTIVATA'}
                          </span>
                          {/* Provider badge */}
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${prov === 'gemini-free' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-brand-orange/10 text-brand-orange border-brand-orange/20'}`}>
                            {prov === 'gemini-free' ? '🆓 Gemini Free' : '💰 Claude'}
                          </span>
                          {!f.implemented && (
                            <span title="Infrastruttura pronta, logica AI da implementare" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-help">
                              In sviluppo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mb-3">{f.subtitle}</p>
                        <p className="text-sm text-zinc-400 leading-relaxed mb-4 max-w-2xl">{f.description}</p>
                        {/* Meta row */}
                        <div className="flex flex-wrap gap-4 text-xs">
                          <span className="flex items-center gap-1.5 text-zinc-500">
                            <Zap className={`w-3 h-3 ${prov === 'gemini-free' ? 'text-green-400' : 'text-brand-orange'}`} />
                            Costo: <span className={`font-bold ml-0.5 ${prov === 'gemini-free' ? 'text-green-400' : 'text-zinc-300'}`}>{displayCost}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-zinc-500">
                            <Target className="w-3 h-3 text-blue-400" />
                            Scopo: <span className="text-zinc-300 font-bold ml-0.5">{f.benefit}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-zinc-500">
                            <TrendingUp className="w-3 h-3 text-green-400" />
                            Effetto: <span className="text-zinc-300 font-bold ml-0.5">{f.impact}</span>
                          </span>
                        </div>
                      </div>

                      {/* Toggle + Config */}
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => !isToggling && handleToggle(f.key)}
                          aria-label={`${isEnabled ? 'Disattiva' : 'Attiva'} ${f.name}`}
                          aria-checked={isEnabled}
                          role="switch"
                          className={`relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-zinc-900 ${isEnabled ? 'bg-brand-orange' : 'bg-zinc-700'} ${isToggling ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:opacity-90'}`}
                        >
                          {isToggling ? (
                            <Loader2 className="absolute inset-0 m-auto w-4 h-4 animate-spin text-white" />
                          ) : (
                            <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isEnabled ? 'translate-x-8' : 'translate-x-0'}`} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openConfig(f.key)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                        >
                          <Settings className="w-3 h-3" /> Configura
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* "Come funziona" toggle bar */}
              <button
                type="button"
                onClick={() => toggleGuide(f.key)}
                className="w-full flex items-center justify-between px-6 py-3 bg-zinc-800/50 border-t border-white/5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" />
                  Come funziona — requisiti e guida passo-passo
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isGuideOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* "Come funziona" content */}
              <AnimatePresence>
                {isGuideOpen && guide && (
                  <motion.div
                    key={`guide-${f.key}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-white/5"
                  >
                    <div className="p-6 bg-zinc-950/60 space-y-6">
                      {/* Steps */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Flusso di funzionamento</p>
                        <div className="space-y-3">
                          {guide.steps.map((step, i) => {
                            const StepIcon = step.icon;
                            return (
                              <div key={i} className="flex items-start gap-4">
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="w-6 h-6 rounded-full bg-brand-orange/20 text-brand-orange text-[11px] font-black flex items-center justify-center">{i + 1}</span>
                                  <StepIcon className="w-4 h-4 text-zinc-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white">{step.title}</p>
                                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{step.body}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Where it appears + requirements */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-zinc-900 rounded-xl p-4 border border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Dove appare</p>
                          <p className="text-xs text-zinc-300 leading-relaxed">{guide.appearsIn}</p>
                        </div>
                        <div className="bg-zinc-900 rounded-xl p-4 border border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Requisiti</p>
                          <ul className="space-y-1">
                            {guide.requires.map((req, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Model info */}
                      <div className="flex items-center gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                        <Zap className="w-4 h-4 text-green-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-green-400">Modello gratuito consigliato</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{guide.freeModel}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="ai-toast"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 bg-zinc-800 border border-white/10 rounded-xl text-sm font-bold text-white shadow-2xl pointer-events-none"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Config Modal */}
      <AnimatePresence>
        {configModalFeature && (
          <motion.div
            key="ai-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
            onClick={() => setConfigModalFeature(null)}
          >
            <motion.div
              key="ai-modal-content"
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black">Configura — {AI_FEATURE_DEFS.find(f => f.key === configModalFeature)?.name}</h3>
                <button type="button" onClick={() => setConfigModalFeature(null)} className="text-zinc-500 hover:text-white transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">

                {/* ── Provider selector — shown on ALL features ── */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Provider AI</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROVIDER_OPTIONS.map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => setConfigDraft(p => ({
                          ...p,
                          provider: opt.value,
                          model: opt.value === 'gemini-free' ? 'gemini-2.0-flash-lite-exp' : 'claude-haiku-4-5-20251001',
                        }))}
                        className={`p-3 rounded-xl border text-left transition-all ${(configDraft.provider ?? 'gemini-free') === opt.value ? opt.color : 'border-white/5 bg-zinc-800 hover:bg-zinc-700'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-white">{opt.label}</p>
                          <span className="text-[10px] text-zinc-400">{opt.badge}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400">{opt.sublabel}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Model selector ── */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Modello AI</label>
                  {(configDraft.provider ?? 'gemini-free') === 'gemini-free' ? (
                    <select value={(configDraft.model as string) || 'gemini-2.0-flash-lite-exp'} onChange={e => setConfigDraft(p => ({ ...p, model: e.target.value }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500">
                      <option value="gemini-2.0-flash-lite-exp">gemini-2.0-flash-lite-exp (gratuito, più recente)</option>
                      <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (gratuito, stabile)</option>
                    </select>
                  ) : (
                    <select value={(configDraft.model as string) || 'claude-haiku-4-5-20251001'} onChange={e => setConfigDraft(p => ({ ...p, model: e.target.value }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange">
                      <option value="claude-sonnet-4-6">claude-sonnet-4-6 (migliore qualità)</option>
                      <option value="claude-haiku-4-5-20251001">claude-haiku-4-5 (economico, veloce)</option>
                    </select>
                  )}
                </div>

                {/* ── Feature-specific settings ── */}
                {configModalFeature === 'consulente_am3' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">System Prompt (voce del chatbot)</label>
                      <textarea rows={4} value={(configDraft.systemPrompt as string) || ''} onChange={e => setConfigDraft(p => ({ ...p, systemPrompt: e.target.value }))} placeholder="Sei un esperto DJ certificato MAT Academy. Il tuo nome è Amerigo..." className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Temperatura (creatività): {configDraft.temperature ?? 0.7}</label>
                      <input type="range" min={0} max={1} step={0.1} value={(configDraft.temperature as number) ?? 0.7} onChange={e => setConfigDraft(p => ({ ...p, temperature: parseFloat(e.target.value) }))} className="w-full accent-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Massimo messaggi per conversazione</label>
                      <input type="number" value={(configDraft.maxMessages as number) || 15} onChange={e => setConfigDraft(p => ({ ...p, maxMessages: parseInt(e.target.value) }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Budget mensile API (€) — per provider a pagamento</label>
                      <input type="number" value={(configDraft.monthlyBudget as number) || 50} onChange={e => setConfigDraft(p => ({ ...p, monthlyBudget: parseInt(e.target.value) }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                  </>
                )}

                {configModalFeature === 'quiz_trova_setup' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Numero domande (2-6)</label>
                      <input type="number" min={2} max={6} value={(configDraft.numQuestions as number) || 4} onChange={e => setConfigDraft(p => ({ ...p, numQuestions: parseInt(e.target.value) }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Testo introduttivo</label>
                      <textarea rows={3} value={(configDraft.introText as string) || ''} onChange={e => setConfigDraft(p => ({ ...p, introText: e.target.value }))} placeholder="Ciao! Rispondi a 4 domande e ti consiglio il setup perfetto..." className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Sconto nel consiglio finale</label>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setConfigDraft(p => ({ ...p, discountEnabled: !p.discountEnabled }))} className={`relative w-10 h-5 rounded-full transition-colors ${configDraft.discountEnabled ? 'bg-brand-orange' : 'bg-zinc-700'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${configDraft.discountEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        {configDraft.discountEnabled && (
                          <input type="number" value={(configDraft.discountPercent as number) || 10} onChange={e => setConfigDraft(p => ({ ...p, discountPercent: parseInt(e.target.value) }))} className="w-24 bg-zinc-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-orange" placeholder="%" />
                        )}
                      </div>
                    </div>
                  </>
                )}

                {configModalFeature === 'descrizioni_seo_auto' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Tone of Voice</label>
                      <textarea rows={3} value={(configDraft.toneOfVoice as string) || ''} onChange={e => setConfigDraft(p => ({ ...p, toneOfVoice: e.target.value }))} placeholder="Esperto, diretto, tecnico ma accessibile. Firma le descrizioni come Amerigo MAT Academy..." className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Lunghezza descrizione</label>
                      <select value={(configDraft.descLength as string) || 'media'} onChange={e => setConfigDraft(p => ({ ...p, descLength: e.target.value as 'breve' | 'media' | 'lunga' }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange">
                        <option value="breve">Breve (200-300 caratteri)</option>
                        <option value="media">Media (400-600 caratteri)</option>
                        <option value="lunga">Lunga (800-1200 caratteri)</option>
                      </select>
                    </div>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                        <input type="checkbox" checked={!!configDraft.includeFaq} onChange={e => setConfigDraft(p => ({ ...p, includeFaq: e.target.checked }))} className="accent-brand-orange" /> FAQ automatiche (3 domande)
                      </label>
                      <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                        <input type="checkbox" checked={!!configDraft.includeSchema} onChange={e => setConfigDraft(p => ({ ...p, includeSchema: e.target.checked }))} className="accent-brand-orange" /> Schema markup JSON-LD
                      </label>
                    </div>
                  </>
                )}

                {configModalFeature === 'recensioni_aggregate' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Frequenza aggiornamento</label>
                      <select value={(configDraft.updateFrequency as string) || 'trimestrale'} onChange={e => setConfigDraft(p => ({ ...p, updateFrequency: e.target.value as 'mensile' | 'trimestrale' | 'semestrale' }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange">
                        <option value="mensile">Mensile</option>
                        <option value="trimestrale">Trimestrale</option>
                        <option value="semestrale">Semestrale</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Rating minimo da mostrare: {configDraft.minRating || 0} stelle</label>
                      <input type="range" min={0} max={5} step={0.5} value={(configDraft.minRating as number) || 0} onChange={e => setConfigDraft(p => ({ ...p, minRating: parseFloat(e.target.value) }))} className="w-full accent-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Mostra disclaimer AI</label>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setConfigDraft(p => ({ ...p, showDisclaimer: !p.showDisclaimer }))} className={`relative w-10 h-5 rounded-full transition-colors ${configDraft.showDisclaimer ? 'bg-brand-orange' : 'bg-zinc-700'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${configDraft.showDisclaimer ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        {configDraft.showDisclaimer && (
                          <input value={(configDraft.disclaimerText as string) || ''} onChange={e => setConfigDraft(p => ({ ...p, disclaimerText: e.target.value }))} className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-orange" placeholder="Sintesi generata da AI basata su dati pubblici" />
                        )}
                      </div>
                    </div>
                  </>
                )}

                {configModalFeature === 'email_personalizzate' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Frequenza invio automatico</label>
                      <select value={(configDraft.sendFrequency as string) || 'settimanale'} onChange={e => setConfigDraft(p => ({ ...p, sendFrequency: e.target.value as 'settimanale' | 'bisettimanale' | 'mensile' }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange">
                        <option value="settimanale">Settimanale</option>
                        <option value="bisettimanale">Bisettimanale</option>
                        <option value="mensile">Mensile</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Firma email</label>
                      <input value={(configDraft.emailSignature as string) || 'Amerigo | Officina del Suono'} onChange={e => setConfigDraft(p => ({ ...p, emailSignature: e.target.value }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Limite email al giorno</label>
                      <input type="number" value={(configDraft.dailyLimit as number) || 100} onChange={e => setConfigDraft(p => ({ ...p, dailyLimit: parseInt(e.target.value) }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Provider mailing</label>
                      <select value={(configDraft.emailProvider as string) || 'resend'} onChange={e => setConfigDraft(p => ({ ...p, emailProvider: e.target.value }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange">
                        <option value="resend">Resend (configurato)</option>
                        <option value="mailchimp">Mailchimp</option>
                        <option value="brevo">Brevo</option>
                        <option value="custom">Custom SMTP</option>
                      </select>
                    </div>
                  </>
                )}

              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setConfigModalFeature(null)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Annulla</button>
                <button
                  type="button"
                  disabled={isSavingConfig}
                  onClick={async () => {
                    if (!configModalFeature) return;
                    setIsSavingConfig(true);
                    try {
                      await updateConfig(configModalFeature, configDraft, currentUser?.email || ADMIN_EMAIL);
                      setConfigModalFeature(null);
                      showToast('Configurazione salvata ✓');
                    } catch {
                      showToast('Errore salvataggio configurazione');
                    } finally {
                      setIsSavingConfig(false);
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {isSavingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salva configurazione
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
