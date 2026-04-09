import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Target, Sparkles, Star, AtSign, Euro, RefreshCw, Loader2, Zap, TrendingUp, Settings, X, Save } from 'lucide-react';
import { useAIFeatures, AIFeatures, AIFeatureConfig } from '../../contexts/AIFeaturesContext';

const ADMIN_EMAIL = 'officinadelsuono99@gmail.com';

export const AI_FEATURE_DEFS = [
  { key: 'consulente_am3' as const, icon: MessageSquare, name: 'Consulente AI AM3', subtitle: 'Chatbot di pre-vendita esperto DJ', description: 'Chatbot intelligente che guida i visitatori indecisi verso il kit o prodotto giusto, usando la voce di Amerigo certificato MAT Academy. Non fa assistenza generica: il suo unico scopo è capire cosa cerca il cliente e portarlo al checkout del prodotto più adatto.', costApi: '~€0,01-0,02 a conversazione', impact: 'Conversione +150-250% sul traffico che interagisce', priority: 5, implemented: false },
  { key: 'quiz_trova_setup' as const, icon: Target, name: 'Quiz Trova il Tuo Setup', subtitle: 'Consulenza guidata AI con lead capture', description: 'Quiz conversazionale AI di 3-4 domande adattive che capisce il livello, il budget e gli obiettivi del visitatore e consiglia il kit AM3 perfetto. Richiede email per inviare il consiglio personalizzato: ottimo lead magnet per costruire la mailing list.', costApi: '~€0,005-0,01 a quiz completato', impact: 'Conversione 8-15% sui 30 giorni successivi', priority: 5, implemented: false },
  { key: 'descrizioni_seo_auto' as const, icon: Sparkles, name: 'Descrizioni Prodotto Auto-SEO', subtitle: 'Generazione automatica schede prodotto ottimizzate', description: "Quando carichi un nuovo prodotto inserisci solo nome e scheda tecnica: l'AI genera titolo SEO, meta description, descrizione lunga firmata Amerigo MAT Academy, bullet point, FAQ e schema markup per Google. Lavora in background, non visibile al cliente.", costApi: '~€0,02 a prodotto (una tantum)', impact: '+traffico organico Google sul lungo periodo', priority: 4, implemented: false },
  { key: 'recensioni_aggregate' as const, icon: Star, name: 'Recensioni Aggregate AI', subtitle: 'Sintesi onesta delle opinioni dal web', description: "L'AI legge recensioni da YouTube, Reddit e forum DJ per ogni prodotto e genera una sintesi \"cosa dicono i DJ di questo prodotto\" con pro e contro. Aumenta il trust: il cliente trova tutto da te e non va a cercare su YouTube.", costApi: '~€0,05 a prodotto (aggiornamento trimestrale)', impact: 'Riduzione abbandono scheda prodotto, +trust', priority: 3, implemented: false },
  { key: 'email_personalizzate' as const, icon: AtSign, name: 'Email Marketing AI', subtitle: 'Campagne personalizzate per cliente', description: "L'AI analizza lo storico acquisti e il comportamento di ogni cliente e genera email personalizzate automatiche: consigli accessori compatibili, novità coerenti con i gusti, offerte mirate. Tassi di apertura 40-50% vs 15-20% delle mass mail.", costApi: '~€0,01 a email generata', impact: 'Conversion rate email 3-5x vs mass mail', priority: 3, implemented: false },
];

export function AIFeaturesPanel({ currentUser }: { currentUser: import('firebase/auth').User | null }) {
  const { features, toggleFeature, togglingKey, updateConfig, costs, costsLoading, refreshCosts } = useAIFeatures();
  const [configModalFeature, setConfigModalFeature] = useState<keyof Omit<AIFeatures, 'last_updated' | 'updated_by'> | null>(null);
  const [configDraft, setConfigDraft] = useState<Partial<AIFeatureConfig>>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  const activeCount = AI_FEATURE_DEFS.filter(f => features[f.key]?.enabled).length;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Feature attive', value: activeCount, color: 'text-green-400' },
          { label: 'Feature disponibili', value: AI_FEATURE_DEFS.length, color: 'text-brand-orange' },
          { label: 'Costo mese corrente', value: costs ? `€${costs.total_eur.toFixed(4)}` : '—', color: 'text-zinc-300' },
          { label: 'Chiamate AI totali', value: costs ? costs.calls_total : '—', color: 'text-zinc-300' },
        ].map(k => (
          <div key={k.label} className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
            <p className={`text-3xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{k.label}</p>
          </div>
        ))}
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
                  const prov = features[f.key]?.provider ?? 'claude';
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
          const prov = features[f.key]?.provider ?? 'claude';
          const displayCost = prov === 'gemini-free' ? 'Gratuito (Gemini Flash)' : f.costApi;

          return (
            <div
              key={f.key}
              className={`bg-zinc-900 border rounded-2xl p-6 transition-all duration-300 ${isEnabled ? 'border-brand-orange/40 shadow-[0_0_30px_rgba(242,125,38,0.07)]' : 'border-white/5'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 transition-colors duration-200 ${isEnabled ? 'bg-brand-orange/15 text-brand-orange' : 'bg-zinc-800 text-zinc-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h3 className="text-lg font-black">{f.name}</h3>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border transition-all duration-200 ${isEnabled ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'}`}>
                          {isEnabled ? 'ATTIVA' : 'DISATTIVATA'}
                        </span>
                        {!f.implemented && (
                          <span title="Infrastruttura pronta, logica AI da implementare" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-help">
                            In sviluppo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mb-3">{f.subtitle}</p>
                      <p className="text-sm text-zinc-400 leading-relaxed mb-4 max-w-2xl">{f.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-zinc-500">
                          <Zap className={`w-3 h-3 ${prov === 'gemini-free' ? 'text-green-400' : 'text-brand-orange'}`} />
                          Costo API: <span className={`font-bold ml-0.5 ${prov === 'gemini-free' ? 'text-green-400' : 'text-zinc-300'}`}>{displayCost}</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-zinc-500">
                          <TrendingUp className="w-3 h-3 text-green-400" />
                          Impatto: <span className="text-zinc-300 font-bold ml-0.5">{f.impact}</span>
                        </span>
                        <span>{'⭐'.repeat(f.priority)}</span>
                      </div>
                    </div>

                    {/* Toggle + Config */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      {/* Toggle */}
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
                          <span
                            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isEnabled ? 'translate-x-8' : 'translate-x-0'}`}
                          />
                        )}
                      </button>

                      {/* Config */}
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
                {configModalFeature === 'consulente_am3' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Provider AI</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'claude', label: 'Claude (Anthropic)', sublabel: '~€0,01-0,02 / conv.', color: 'border-brand-orange/50 bg-brand-orange/5' },
                          { value: 'gemini-free', label: 'Gemini Flash', sublabel: 'Gratuito (quota Google)', color: 'border-green-500/50 bg-green-500/5' },
                        ].map(opt => (
                          <button key={opt.value} type="button"
                            onClick={() => setConfigDraft(p => ({ ...p, provider: opt.value as any, model: opt.value === 'gemini-free' ? 'gemini-2.0-flash-exp' : 'claude-haiku-4-5-20251001' }))}
                            className={`p-3 rounded-xl border text-left transition-all ${(configDraft.provider ?? 'claude') === opt.value ? `${opt.color}` : 'border-white/5 bg-zinc-800 hover:bg-zinc-700'}`}
                          >
                            <p className="text-sm font-bold text-white">{opt.label}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">{opt.sublabel}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">System Prompt</label>
                      <textarea rows={4} value={(configDraft.systemPrompt as string) || ''} onChange={e => setConfigDraft(p => ({ ...p, systemPrompt: e.target.value }))} placeholder="Sei un esperto DJ certificato MAT Academy..." className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Modello AI</label>
                      {(configDraft.provider ?? 'claude') === 'gemini-free' ? (
                        <select value={(configDraft.model as string) || 'gemini-2.0-flash-exp'} onChange={e => setConfigDraft(p => ({ ...p, model: e.target.value }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500">
                          <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp (gratuito)</option>
                          <option value="gemini-1.5-flash">gemini-1.5-flash (gratuito)</option>
                        </select>
                      ) : (
                        <select value={(configDraft.model as string) || 'claude-haiku-4-5-20251001'} onChange={e => setConfigDraft(p => ({ ...p, model: e.target.value }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange">
                          <option value="claude-sonnet-4-6">claude-sonnet-4-6 (migliore)</option>
                          <option value="claude-haiku-4-5-20251001">claude-haiku-4-5 (economico)</option>
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Temperatura: {configDraft.temperature ?? 0.7}</label>
                      <input type="range" min={0} max={1} step={0.1} value={(configDraft.temperature as number) ?? 0.7} onChange={e => setConfigDraft(p => ({ ...p, temperature: parseFloat(e.target.value) }))} className="w-full accent-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Massimo messaggi per conversazione</label>
                      <input type="number" value={(configDraft.maxMessages as number) || 15} onChange={e => setConfigDraft(p => ({ ...p, maxMessages: parseInt(e.target.value) }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Budget mensile API (€)</label>
                      <input type="number" value={(configDraft.monthlyBudget as number) || 50} onChange={e => setConfigDraft(p => ({ ...p, monthlyBudget: parseInt(e.target.value) }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                  </>
                )}
                {configModalFeature === 'quiz_trova_setup' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Provider AI</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'claude', label: 'Claude (Anthropic)', sublabel: '~€0,005-0,01 / quiz', color: 'border-brand-orange/50 bg-brand-orange/5' },
                          { value: 'gemini-free', label: 'Gemini Flash', sublabel: 'Gratuito (quota Google)', color: 'border-green-500/50 bg-green-500/5' },
                        ].map(opt => (
                          <button key={opt.value} type="button"
                            onClick={() => setConfigDraft(p => ({ ...p, provider: opt.value as any }))}
                            className={`p-3 rounded-xl border text-left transition-all ${(configDraft.provider ?? 'claude') === opt.value ? `${opt.color}` : 'border-white/5 bg-zinc-800 hover:bg-zinc-700'}`}
                          >
                            <p className="text-sm font-bold text-white">{opt.label}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">{opt.sublabel}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Numero domande (max 6)</label>
                      <input type="number" min={2} max={6} value={(configDraft.numQuestions as number) || 4} onChange={e => setConfigDraft(p => ({ ...p, numQuestions: parseInt(e.target.value) }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Testo introduttivo</label>
                      <textarea rows={3} value={(configDraft.introText as string) || ''} onChange={e => setConfigDraft(p => ({ ...p, introText: e.target.value }))} placeholder="Ciao! Rispondi a 4 domande e ti consiglio il setup perfetto..." className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Sconto nel consiglio</label>
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
                      <textarea rows={3} value={(configDraft.toneOfVoice as string) || ''} onChange={e => setConfigDraft(p => ({ ...p, toneOfVoice: e.target.value }))} placeholder="Esperto, diretto, tecnico ma accessibile..." className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Lunghezza descrizione</label>
                      <select value={(configDraft.descLength as string) || 'media'} onChange={e => setConfigDraft(p => ({ ...p, descLength: e.target.value as any }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange">
                        <option value="breve">Breve</option><option value="media">Media</option><option value="lunga">Lunga</option>
                      </select>
                    </div>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer"><input type="checkbox" checked={!!configDraft.includeFaq} onChange={e => setConfigDraft(p => ({ ...p, includeFaq: e.target.checked }))} className="accent-brand-orange" /> FAQ automatiche</label>
                      <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer"><input type="checkbox" checked={!!configDraft.includeSchema} onChange={e => setConfigDraft(p => ({ ...p, includeSchema: e.target.checked }))} className="accent-brand-orange" /> Schema markup</label>
                    </div>
                  </>
                )}
                {configModalFeature === 'recensioni_aggregate' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Frequenza aggiornamento</label>
                      <select value={(configDraft.updateFrequency as string) || 'trimestrale'} onChange={e => setConfigDraft(p => ({ ...p, updateFrequency: e.target.value as any }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange">
                        <option value="mensile">Mensile</option><option value="trimestrale">Trimestrale</option><option value="semestrale">Semestrale</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Rating minimo (0 = tutti)</label>
                      <input type="range" min={0} max={5} step={0.5} value={(configDraft.minRating as number) || 0} onChange={e => setConfigDraft(p => ({ ...p, minRating: parseFloat(e.target.value) }))} className="w-full accent-brand-orange" />
                      <span className="text-xs text-zinc-500">{configDraft.minRating || 0} stelle</span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Disclaimer visibile</label>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setConfigDraft(p => ({ ...p, showDisclaimer: !p.showDisclaimer }))} className={`relative w-10 h-5 rounded-full transition-colors ${configDraft.showDisclaimer ? 'bg-brand-orange' : 'bg-zinc-700'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${configDraft.showDisclaimer ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        {configDraft.showDisclaimer && <input value={(configDraft.disclaimerText as string) || ''} onChange={e => setConfigDraft(p => ({ ...p, disclaimerText: e.target.value }))} className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-orange" placeholder="Testo disclaimer..." />}
                      </div>
                    </div>
                  </>
                )}
                {configModalFeature === 'email_personalizzate' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Frequenza invio</label>
                      <select value={(configDraft.sendFrequency as string) || 'settimanale'} onChange={e => setConfigDraft(p => ({ ...p, sendFrequency: e.target.value as any }))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange">
                        <option value="settimanale">Settimanale</option><option value="bisettimanale">Bisettimanale</option><option value="mensile">Mensile</option>
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
                        <option value="resend">Resend</option><option value="mailchimp">Mailchimp</option><option value="brevo">Brevo</option><option value="custom">Custom</option>
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
