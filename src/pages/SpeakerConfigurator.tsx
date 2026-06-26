import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, ChevronRight, ChevronLeft,
  CheckCircle, Music, Zap, Layers, Cpu, Box, Palette,
  Check, AlertTriangle, Send, Loader2, Mail, User, Phone, MessageSquare,
  Wand2, Wrench, ArrowRight, RotateCcw
} from 'lucide-react';

import { DRIVERS, AMPLIFIERS, USE_CASE_LABELS } from '../data/speakerDatabase';
import { calculateFullCabinet, recommendCabinetType, scoreAmplifierMatch } from '../utils/cabinetCalculator';
import type {
  UserConfiguration, SpeakerDriver, Amplifier,
  CabinetDesign, UseCase
} from '../types/speaker';
import { CabinetViewer3D } from '../components/configurator/CabinetViewer3D';
import { DriverVisual, AmpVisual } from '../components/configurator/ComponentVisuals';
import { Plot, PLOT_COLORS } from '../components/configurator/calculators/ui';
import * as Audio from '../utils/audio';
import { subscribeDrivers } from '../services/driverLibrary';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { StepCustomizeCabinet } from './ConfiguratorSteps/StepCustomizeCabinet';
import { StepSummaryNew } from './ConfiguratorSteps/StepSummaryNew';
import {
  computeCrossover, isWooferRole, isMidRole, isTweeterRole, type SystemType,
} from '../utils/crossoverDesign';

const STEPS = [
  { id: 1, title: 'Il Tuo Sound', icon: Music },
  { id: 2, title: 'Scegli il Driver', icon: Settings },
  { id: 3, title: 'La Tua Cassa', icon: Box },
  { id: 4, title: 'Personalizza', icon: Palette },
  { id: 5, title: 'Amplificazione', icon: Zap },
  { id: 6, title: 'Il Tuo Progetto', icon: CheckCircle }
];

// Encode/decode della configurazione per il link condivisibile (base64 UTF-8 safe)
function encodeCfg(o: unknown): string {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))); } catch { return ''; }
}
function decodeCfg(s: string): any {
  try { return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch { return null; }
}

export default function SpeakerConfigurator() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'intro' | 'config'>('intro');
  const [step, setStep] = useState(1);
  const [userConfig, setUserConfig] = useState<Partial<UserConfiguration>>({ quantity: 1 });
  const [systemType, setSystemType] = useState<SystemType>('2way');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null); // woofer / LF
  const [selectedMidId, setSelectedMidId] = useState<string | null>(null);       // medio (3 vie)
  const [selectedTweeterId, setSelectedTweeterId] = useState<string | null>(null); // alti
  const [selectedAmpId, setSelectedAmpId] = useState<string | null>(null);
  const [customCabinet, setCustomCabinet] = useState<Partial<CabinetDesign> | null>(null);
  const [drivers, setDrivers] = useState<SpeakerDriver[]>(DRIVERS);
  useEffect(() => subscribeDrivers(list => setDrivers(list.length ? list : DRIVERS)), []);

  const selectedDriver = useMemo(() => drivers.find(d => d.id === selectedDriverId) || null, [drivers, selectedDriverId]);
  const selectedMid = useMemo(() => drivers.find(d => d.id === selectedMidId) || null, [drivers, selectedMidId]);
  const selectedTweeter = useMemo(() => drivers.find(d => d.id === selectedTweeterId) || null, [drivers, selectedTweeterId]);
  const selectedAmplifier = useMemo(() => AMPLIFIERS.find(a => a.id === selectedAmpId) || null, [selectedAmpId]);

  // Crossover (1 punto per 2 vie, 2 per 3 vie)
  const crossover = useMemo(
    () => computeCrossover(systemType, selectedDriver, selectedMid, selectedTweeter),
    [systemType, selectedDriver, selectedMid, selectedTweeter],
  );

  // Altoparlanti montati sul baffle (dal grave all'acuto) per il 3D e il riepilogo
  const baffleDrivers = useMemo(() => {
    const list: SpeakerDriver[] = [];
    if (selectedDriver) list.push(selectedDriver);
    if (systemType === '3way' && selectedMid) list.push(selectedMid);
    if (systemType !== 'sub' && selectedTweeter) list.push(selectedTweeter);
    return list;
  }, [systemType, selectedDriver, selectedMid, selectedTweeter]);

  // Progetto acustico BASE — calcolato dal motore condiviso con l'Admin.
  // Non dipende dalle personalizzazioni: è la sorgente di verità degli acustici.
  const baseCabinet = useMemo(() => {
    if (!selectedDriver || !userConfig.useCase) return null;

    const recommendedType = recommendCabinetType(selectedDriver, userConfig.useCase as UseCase, 'indoor-medium');
    // Build ATTIVO: la cassa riserva SEMPRE la predisposizione del modulo
    // amplificatore + DSP (sede sul retro, ventilazione, presa IEC). Finché
    // l'ampli non è scelto si usa una piastra standard, poi si affina.
    const hasAmp = true;
    const ampDimensions = selectedAmplifier ? selectedAmplifier.dimensions : { width: 220, height: 220, depth: 90 };

    try {
      const calc = calculateFullCabinet(
        selectedDriver,
        recommendedType,
        userConfig.useCase as UseCase,
        'indoor-medium',
        hasAmp,
        ampDimensions
      );
      return calc.cabinetDesign;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [selectedDriver, userConfig.useCase, selectedAmpId, selectedAmplifier]);

  // Progetto mostrato = base + personalizzazioni cliente (dimensioni/legno/finitura)
  const cabinetDesign = useMemo<CabinetDesign | null>(() => {
    if (!baseCabinet) return null;
    return customCabinet ? { ...baseCabinet, ...customCabinet } : baseCabinet;
  }, [baseCabinet, customCabinet]);

  // ── Caricamento: link condivisibile (URL ?c=) > localStorage ────────────────
  const applySaved = (s: any) => {
    if (!s) return false;
    if (s.useCase) setUserConfig(c => ({ ...c, useCase: s.useCase }));
    if (s.systemType) setSystemType(s.systemType);
    if (s.wooferId) setSelectedDriverId(s.wooferId);
    if (s.midId) setSelectedMidId(s.midId);
    if (s.tweeterId) setSelectedTweeterId(s.tweeterId);
    if (s.ampId) setSelectedAmpId(s.ampId);
    if (s.customCabinet) setCustomCabinet(s.customCabinet);
    if (s.step) setStep(s.step);
    return true;
  };

  useEffect(() => {
    try {
      // 1) link condivisibile nell'URL
      const param = new URLSearchParams(window.location.search).get('c');
      if (param) {
        const s = decodeCfg(param);
        if (s && applySaved(s)) { setStep(s.step || 6); setMode('config'); return; }
      }
      // 2) ultima sessione salvata in locale
      const raw = localStorage.getItem('ods-configurator');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (applySaved(s) && s.step) setMode('config');
    } catch { /* ignora dati non validi */ }
  }, []);

  // Stato serializzabile della configurazione (per salvataggio e link)
  const configState = useMemo(() => ({
    useCase: userConfig.useCase, systemType,
    wooferId: selectedDriverId, midId: selectedMidId,
    tweeterId: selectedTweeterId, ampId: selectedAmpId,
    customCabinet, step,
  }), [userConfig.useCase, systemType, selectedDriverId, selectedMidId, selectedTweeterId, selectedAmpId, customCabinet, step]);

  useEffect(() => {
    if (mode !== 'config') return;
    try { localStorage.setItem('ods-configurator', JSON.stringify(configState)); }
    catch { /* storage pieno/non disponibile */ }
  }, [mode, configState]);

  // Link condivisibile (include topologia, componenti, personalizzazioni)
  const shareUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/configuratore?c=${encodeURIComponent(encodeCfg(configState))}`;
  }, [configState]);

  // ── Modalità Guidami: applica un preset dalle risposte e va alla cassa ──────
  const applyGuided = (g: { useCase: UseCase; system: SystemType; size: 'small' | 'medium' | 'large' }) => {
    setUserConfig(c => ({ ...c, useCase: g.useCase }));
    setSystemType(g.system);

    const woofers = drivers.filter(isWooferRole);
    const sizePref = g.size === 'large' ? 18 : g.size === 'medium' ? 15 : 12;
    const woofer = [...woofers].sort((a, b) => Math.abs(a.size - sizePref) - Math.abs(b.size - sizePref))[0] || woofers[0];
    if (woofer) setSelectedDriverId(woofer.id);

    if (g.system !== 'sub') {
      const tw = drivers.filter(isTweeterRole)[0];
      if (tw) setSelectedTweeterId(tw.id);
    }
    if (g.system === '3way') {
      const mid = drivers.filter(isMidRole)[0];
      if (mid) setSelectedMidId(mid.id);
    }
    if (woofer) {
      const best = [...AMPLIFIERS]
        .map(a => ({ a, s: scoreAmplifierMatch(woofer, a, g.useCase).score }))
        .sort((x, y) => y.s - x.s)[0];
      if (best) setSelectedAmpId(best.a.id);
    }

    setMode('config');
    setStep(3); // diretto a "La Tua Cassa" — già tutto pre-compilato
  };

  const restart = () => {
    try { localStorage.removeItem('ods-configurator'); } catch { /* noop */ }
    setUserConfig({ quantity: 1 });
    setSystemType('2way');
    setSelectedDriverId(null); setSelectedMidId(null); setSelectedTweeterId(null); setSelectedAmpId(null);
    setCustomCabinet(null); setStep(1); setMode('intro');
  };

  const handleNext = () => setStep(s => Math.min(STEPS.length, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const isNextDisabled = () => {
    if (step === 1 && !userConfig.useCase) return true;
    if (step === 2) {
      if (!selectedDriverId) return true;
      if (systemType !== 'sub' && !selectedTweeterId) return true;
      if (systemType === '3way' && !selectedMidId) return true;
      return false;
    }
    if (step === 3 && !cabinetDesign) return true;
    if (step === 4) return false; // Personalizzazione sempre abilitata
    if (step === 5 && !selectedAmpId) return true;
    return false;
  };

  if (mode === 'intro') {
    return <GuidedIntro onExpert={() => { setMode('config'); setStep(1); }} onGuided={applyGuided} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col font-sans relative overflow-hidden">
      {/* Glow ambientale animato (premium feel) */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full bg-[#F27D26]/10 blur-[120px]"
          animate={{ x: [0, 80, 0], y: [0, 40, 0], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 -right-40 w-[36rem] h-[36rem] rounded-full bg-blue-500/10 blur-[120px]"
          animate={{ x: [0, -60, 0], y: [0, -50, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Top Navigation / Progress */}
      <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold tracking-tight">
              {(() => {
                const title = t('configurator.title');
                const [first, ...rest] = title.split(' ');
                return (
                  <>
                    <span className="text-[#F27D26]">{first}</span>
                    {rest.length > 0 ? ` ${rest.join(' ')}` : ''}
                  </>
                );
              })()}
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={restart}
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-brand-orange transition-colors"
                title="Ricomincia da capo"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Ricomincia
              </button>
              <div className="text-sm font-medium text-zinc-400 tabular-nums">
                Step <span className="text-white font-bold">{step}</span> / {STEPS.length}
              </div>
            </div>
          </div>
          
          <div className="relative flex justify-between">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-zinc-800 -z-10" />
            <motion.div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#F27D26] -z-10"
              initial={{ width: '0%' }}
              animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isCompleted = s.id < step;
              return (
                <div key={s.id} className="flex flex-col items-center gap-2">
                  <motion.div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                      ${isActive ? 'border-[#F27D26] bg-[#F27D26]/20 text-[#F27D26]' : 
                        isCompleted ? 'border-[#F27D26] bg-[#F27D26] text-white' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </motion.div>
                  <span className={`text-xs font-medium hidden md:block ${isActive ? 'text-zinc-100' : 'text-zinc-500'}`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {step === 1 && (
              <StepUseCase 
                userConfig={userConfig} 
                setUserConfig={setUserConfig} 
              />
            )}
            {step === 2 && (
              <StepSystemSelect
                drivers={drivers}
                systemType={systemType}
                onSystemType={setSystemType}
                wooferId={selectedDriverId}
                midId={selectedMidId}
                tweeterId={selectedTweeterId}
                onWoofer={setSelectedDriverId}
                onMid={setSelectedMidId}
                onTweeter={setSelectedTweeterId}
              />
            )}
            {step === 3 && selectedDriver && cabinetDesign && (
              <StepCabinetPreview
                driver={selectedDriver}
                cabinetDesign={cabinetDesign}
                baffleDrivers={baffleDrivers}
              />
            )}
            {step === 4 && selectedDriver && cabinetDesign && (
              <StepCustomizeCabinet
                cabinet={cabinetDesign}
                baffleDrivers={baffleDrivers}
                onUpdate={(updates) => setCustomCabinet(prev => ({ ...prev, ...updates }))}
              />
            )}
            {step === 5 && selectedDriver && (
              <StepAmpSelect
                driver={selectedDriver}
                useCase={userConfig.useCase as UseCase}
                amplifiers={AMPLIFIERS}
                selectedId={selectedAmpId}
                onSelect={setSelectedAmpId}
              />
            )}
            {step === 6 && selectedDriver && selectedAmplifier && cabinetDesign && (
              <StepSummaryNew
                driver={selectedDriver}
                amplifier={selectedAmplifier}
                cabinet={cabinetDesign}
                userConfig={userConfig}
                baffleDrivers={baffleDrivers}
                crossover={crossover}
                shareUrl={shareUrl}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Bar */}
      <div className="bg-zinc-950/80 backdrop-blur-xl border-t border-white/10 sticky bottom-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all text-zinc-300 hover:text-white disabled:opacity-50 disabled:hover:text-zinc-300 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            {t('configurator.back')}
          </button>

          {step < STEPS.length ? (
            <button
              onClick={handleNext}
              disabled={isNextDisabled()}
              className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold transition-all bg-[#F27D26] hover:bg-[#E06C1C] text-white shadow-lg shadow-[#F27D26]/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed disabled:hover:bg-[#F27D26]"
            >
              {t('configurator.next')}
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <span className="text-xs text-zinc-500 max-w-[16rem] text-right">
              {t('configurator.checkAndOrder')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTI DEGLI STEP
// ─────────────────────────────────────────────────────────────────────────────

function StepUseCase({ 
  userConfig, 
  setUserConfig 
}: { 
  userConfig: Partial<UserConfiguration>, 
  setUserConfig: (c: Partial<UserConfiguration>) => void 
}) {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4">Qual è il tuo sound?</h2>
        <p className="text-zinc-400 text-lg">Seleziona l'utilizzo principale per la tua cassa. L'AI ottimizzerà il progetto in base a questa scelta.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(USE_CASE_LABELS).map(([key, data]) => {
          const isSelected = userConfig.useCase === key;
          return (
            <motion.div
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setUserConfig({ ...userConfig, useCase: key as UseCase })}
              className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'bg-[#F27D26]/10 border-[#F27D26] shadow-lg shadow-[#F27D26]/10' 
                  : 'bg-zinc-900/50 border-white/5 hover:border-white/20'}`}
            >
              <div className="text-4xl mb-4">{data.icon}</div>
              <h3 className="text-xl font-bold mb-2">{data.label}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{data.description}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Card compatta per la selezione di un driver in un ruolo
function DriverCard({ driver, selected, onSelect }: { driver: SpeakerDriver; selected: boolean; onSelect: () => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`relative overflow-hidden rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col shrink-0 w-64
        ${selected
          ? 'bg-[#F27D26]/10 border-[#F27D26] shadow-lg shadow-[#F27D26]/10'
          : 'bg-zinc-900/50 border-white/10 hover:bg-zinc-900 hover:border-white/20'}`}
    >
      {selected && (
        <div className="absolute top-3 right-3 bg-[#F27D26] text-white p-1 rounded-full z-10">
          <Check className="w-4 h-4" />
        </div>
      )}
      <div className="aspect-[4/3] bg-gradient-to-br from-zinc-800/40 to-zinc-950 p-5 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent z-0" />
        <DriverVisual driver={driver} className="w-full h-full relative z-10 drop-shadow-2xl" />
        <span className="absolute bottom-2 left-2 z-10 text-[9px] font-bold uppercase tracking-wider text-zinc-300 bg-zinc-950/70 px-2 py-0.5 rounded-md backdrop-blur-sm">
          {driver.type.replace('-', ' ')}
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-xs font-bold text-[#F27D26] uppercase tracking-wider">{driver.brand}</div>
        <h3 className="text-lg font-bold mb-2 leading-tight">{driver.model}</h3>
        <div className="grid grid-cols-2 gap-2 text-xs mt-auto pt-3 border-t border-white/5">
          <div><span className="block text-zinc-500">Misura</span><span className="font-semibold">{driver.size}"</span></div>
          <div><span className="block text-zinc-500">Potenza</span><span className="font-semibold">{driver.powerRMS}W</span></div>
          <div><span className="block text-zinc-500">Imp.</span><span className="font-semibold">{driver.impedance}Ω</span></div>
          <div><span className="block text-zinc-500">Sens.</span><span className="font-semibold">{driver.sensitivity}dB</span></div>
        </div>
      </div>
    </motion.div>
  );
}

// Fila orizzontale di driver per un ruolo
function DriverRow({ title, hint, list, selectedId, onSelect }: {
  title: string; hint: string; list: SpeakerDriver[]; selectedId: string | null; onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3">
        <h3 className="text-lg font-black uppercase tracking-wide text-white">{title}</h3>
        <span className="text-xs text-zinc-500">{hint}</span>
      </div>
      {list.length === 0 ? (
        <div className="text-sm text-zinc-600 italic py-6">Nessun componente disponibile per questo ruolo.</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1">
          {list.map(d => (
            <DriverCard key={d.id} driver={d} selected={selectedId === d.id} onSelect={() => onSelect(d.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function StepSystemSelect({
  drivers, systemType, onSystemType, wooferId, midId, tweeterId, onWoofer, onMid, onTweeter,
}: {
  drivers: SpeakerDriver[];
  systemType: SystemType;
  onSystemType: (t: SystemType) => void;
  wooferId: string | null; midId: string | null; tweeterId: string | null;
  onWoofer: (id: string) => void; onMid: (id: string) => void; onTweeter: (id: string) => void;
}) {
  const woofers = useMemo(() => drivers.filter(isWooferRole), [drivers]);
  const mids = useMemo(() => drivers.filter(isMidRole), [drivers]);
  const tweeters = useMemo(() => drivers.filter(isTweeterRole), [drivers]);

  const TYPES: { key: SystemType; label: string; desc: string }[] = [
    { key: 'sub', label: 'Subwoofer', desc: 'Solo grave' },
    { key: '2way', label: '2 Vie', desc: 'Woofer + Alti' },
    { key: '3way', label: '3 Vie', desc: 'Woofer + Medio + Alti' },
  ];

  return (
    <div className="space-y-10">
      <div className="text-center max-w-2xl mx-auto mb-2">
        <h2 className="text-4xl font-bold mb-4">Costruisci il Tuo Sistema</h2>
        <p className="text-zinc-400 text-lg">Scegli la configurazione e seleziona gli altoparlanti. Calcoliamo noi i crossover.</p>
      </div>

      {/* Toggle topologia */}
      <div className="flex justify-center">
        <div className="inline-flex gap-2 bg-zinc-900 border border-white/10 rounded-2xl p-2">
          {TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => onSystemType(t.key)}
              className={`px-5 py-3 rounded-xl text-left transition-all ${
                systemType === t.key ? 'bg-[#F27D26] text-white shadow-lg shadow-[#F27D26]/30' : 'text-zinc-300 hover:bg-white/5'
              }`}
            >
              <div className="font-black text-sm uppercase tracking-wide">{t.label}</div>
              <div className={`text-[11px] ${systemType === t.key ? 'text-white/80' : 'text-zinc-500'}`}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        <DriverRow
          title={systemType === 'sub' ? 'Subwoofer / Woofer' : 'Woofer (grave)'}
          hint="determina la cassa e il volume"
          list={woofers} selectedId={wooferId} onSelect={onWoofer}
        />
        {systemType === '3way' && (
          <DriverRow title="Medio" hint="sezione voci/strumenti" list={mids} selectedId={midId} onSelect={onMid} />
        )}
        {systemType !== 'sub' && (
          <DriverRow
            title="Alti (tweeter / driver a compressione)"
            hint="dettaglio e brillantezza"
            list={tweeters} selectedId={tweeterId} onSelect={onTweeter}
          />
        )}
      </div>
    </div>
  );
}

function StepCabinetPreview({
  driver,
  cabinetDesign,
  baffleDrivers,
}: {
  driver: SpeakerDriver,
  cabinetDesign: CabinetDesign,
  baffleDrivers: SpeakerDriver[],
}) {
  const splCurve = useMemo(() => {
    try {
      const ts = Audio.tsFromDriver(driver);
      if (cabinetDesign.type === 'sealed') {
        const s = Audio.sealedFromVb(ts, cabinetDesign.internalVolume);
        return Audio.computeResponse({ ts, type: 'sealed', fc: s.fc, qtc: s.qtc });
      }
      const fb = cabinetDesign.port?.tuningFrequency || ts.fs * 0.5;
      const alpha = ts.vas / cabinetDesign.internalVolume;
      return Audio.computeResponse({ ts, type: 'vented', fb, alpha, ql: 7 });
    } catch { return null; }
  }, [driver, cabinetDesign]);

  // Traduzione in "linguaggio cliente": estensione bassi, quanto spinge, carattere
  const friendly = useMemo(() => {
    // Estensione bassi = accordo bass-reflex (vented) o F3 calcolato (sealed).
    let f3: number;
    if (cabinetDesign.type === 'sealed') {
      try {
        const ts = Audio.tsFromDriver(driver);
        f3 = Math.round(Audio.sealedFromVb(ts, cabinetDesign.internalVolume).f3);
      } catch { f3 = Math.round(driver.thielSmall.fs); }
    } else {
      f3 = cabinetDesign.port?.tuningFrequency || Math.round(driver.thielSmall.fs * 0.9);
    }
    const bassLabel = f3 <= 40 ? 'Bassi profondissimi' : f3 <= 55 ? 'Bassi profondi' : f3 <= 75 ? 'Bassi pieni' : 'Bassi controllati';
    const splMax = Math.round(driver.sensitivity + 10 * Math.log10(Math.max(driver.powerRMS, 1)));
    const loud = splMax >= 128 ? 'Fortissimo' : splMax >= 122 ? 'Molto forte' : splMax >= 116 ? 'Forte' : 'Equilibrato';
    const carattere = cabinetDesign.type === 'sealed'
      ? 'Bassi asciutti e precisi (cassa chiusa)'
      : 'Massima resa e bassi profondi (bass-reflex)';
    return { f3, bassLabel, splMax, loud, carattere };
  }, [splCurve, cabinetDesign, driver]);

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-4xl font-bold mb-4">La Tua Cassa</h2>
        <p className="text-zinc-400 text-lg">Ecco com'è e cosa aspettarti. I dettagli tecnici sono più sotto.</p>
      </div>

      {/* Cosa aspettarti — linguaggio cliente */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 text-center">
          <div className="text-3xl mb-1">🔊</div>
          <div className="text-2xl font-black text-brand-orange">{friendly.bassLabel}</div>
          <div className="text-xs text-zinc-500 mt-1">scendono fino a ~{friendly.f3} Hz</div>
        </div>
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 text-center">
          <div className="text-3xl mb-1">📢</div>
          <div className="text-2xl font-black text-brand-orange">{friendly.loud}</div>
          <div className="text-xs text-zinc-500 mt-1">fino a ~{friendly.splMax} dB di picco</div>
        </div>
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 text-center flex flex-col justify-center">
          <div className="text-3xl mb-1">🎚️</div>
          <div className="text-sm font-bold leading-tight">{friendly.carattere}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Viewer 3D Reale */}
        <div className="rounded-2xl overflow-hidden min-h-[500px] relative shadow-2xl">
          <CabinetViewer3D cabinet={cabinetDesign} baffleDrivers={baffleDrivers} showDimensions={true} exploded={false} />
          
          <div className="absolute bottom-6 left-6 right-6 p-4 bg-zinc-950/60 backdrop-blur-md rounded-xl border border-white/10 z-10 flex justify-between items-center pointer-events-none">
            <div>
              <div className="text-xs text-zinc-400 mb-1">Dimensioni Esterne (mm)</div>
              <div className="font-mono font-bold text-lg text-white">
                {cabinetDesign.externalDimensions.width} L × {cabinetDesign.externalDimensions.height} A × {cabinetDesign.externalDimensions.depth} P
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-400 mb-1">Volume Lordo</div>
              <div className="font-mono font-bold text-lg text-[#F27D26]">
                {cabinetDesign.grossVolume} L
              </div>
            </div>
          </div>
        </div>

        {/* Specifiche Tecniche */}
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Layers className="w-6 h-6 text-[#F27D26]" />
              Progetto Acustico
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-zinc-400">Tipo Cassa</span>
                  <span className="font-bold uppercase tracking-wider">{cabinetDesign.type.replace('-', ' ')}</span>
                </div>
                <div className="h-[1px] w-full bg-white/5" />
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-zinc-400">Volume Netto Interno</span>
                  <span className="font-bold">{cabinetDesign.internalVolume} Litri</span>
                </div>
                <div className="h-[1px] w-full bg-white/5" />
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-zinc-400">Materiale</span>
                  <span className="font-bold">{cabinetDesign.woodType} {cabinetDesign.woodThickness}mm</span>
                </div>
                <div className="h-[1px] w-full bg-white/5" />
              </div>

              {cabinetDesign.port && (
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-zinc-400">Accordo Bass-Reflex</span>
                    <span className="font-bold">{cabinetDesign.port.tuningFrequency} Hz</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {(cabinetDesign.port.count ?? 1) > 1
                      ? `${cabinetDesign.port.count}× porte Ø ${cabinetDesign.port.diameter}mm, lunghe ${cabinetDesign.port.length}mm`
                      : `Porta Ø ${cabinetDesign.port.diameter}mm, lunga ${cabinetDesign.port.length}mm`}
                    {cabinetDesign.port.airVelocity != null && ` · aria ${cabinetDesign.port.airVelocity} m/s`}
                  </div>
                  <div className="h-[1px] w-full bg-white/5 mt-2" />
                </div>
              )}
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-zinc-400">Peso Stimato (Vuota)</span>
                  <span className="font-bold">{cabinetDesign.estimatedWeight} kg</span>
                </div>
                <div className="h-[1px] w-full bg-white/5" />
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-[#F27D26]/10 rounded-xl border border-[#F27D26]/20">
              <h4 className="font-bold text-[#F27D26] mb-2 text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Dettagli Costruttivi
              </h4>
              <ul className="text-sm text-zinc-300 space-y-2">
                <li className="flex gap-2"><span className="text-[#F27D26]">•</span> {cabinetDesign.dampingMaterial}</li>
                <li className="flex gap-2"><span className="text-[#F27D26]">•</span> {cabinetDesign.panels.length} pannelli fresati a CNC</li>
                <li className="flex gap-2"><span className="text-[#F27D26]">•</span> {cabinetDesign.bracing.length} rinforzi interni strutturali</li>
                {cabinetDesign.ampCutout && (
                  <li className="flex gap-2"><span className="text-[#F27D26]">•</span> Sede modulo ampli+DSP sul retro ({cabinetDesign.ampCutout.width}×{cabinetDesign.ampCutout.height}mm) + ventilazione e presa IEC</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Grafico risposta in frequenza (il cliente vede i grafici, non i numeri) */}
      {splCurve && (
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#F27D26]" /> Risposta in Frequenza Stimata
          </h3>
          <Plot series={[{ name: 'SPL', color: PLOT_COLORS[0], points: splCurve.spl }]} yLabel="SPL" yUnit="dB" height={220} />
          <p className="text-[10px] text-zinc-600 mt-2">Curva indicativa generata dai parametri del driver.</p>
        </div>
      )}
    </div>
  );
}

function StepAmpSelect({
  driver, 
  useCase, 
  amplifiers, 
  selectedId, 
  onSelect 
}: { 
  driver: SpeakerDriver, 
  useCase: UseCase, 
  amplifiers: Amplifier[], 
  selectedId: string | null, 
  onSelect: (id: string) => void 
}) {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4">Scegli l'Amplificazione</h2>
        <p className="text-zinc-400 text-lg">Moduli attivi in Classe D da integrare nella cassa. L'AI ha calcolato il punteggio di compatibilità con il {driver.model}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {amplifiers.map(amp => {
          const isSelected = selectedId === amp.id;
          const match = scoreAmplifierMatch(driver, amp, useCase);
          
          return (
            <motion.div
              key={amp.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(amp.id)}
              className={`relative overflow-hidden rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col h-full
                ${isSelected 
                  ? 'bg-[#F27D26]/10 border-[#F27D26] shadow-lg shadow-[#F27D26]/10' 
                  : 'bg-zinc-900/50 border-white/10 hover:bg-zinc-900 hover:border-white/20'}`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 bg-[#F27D26] text-white p-1 rounded-full z-10 shadow-lg">
                  <Check className="w-4 h-4" />
                </div>
              )}
              
              {/* Score Badge */}
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1 shadow-lg backdrop-blur-md
                ${match.score >= 80 ? 'bg-emerald-500/90 text-white' : 
                  match.score >= 50 ? 'bg-amber-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                <Cpu className="w-3 h-3" />
                {match.score}% Compatibile
              </div>

              <div className="aspect-video bg-gradient-to-br from-zinc-800/60 to-zinc-950 p-6 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent z-0" />
                <AmpVisual amp={amp} className="w-full h-full relative z-10 drop-shadow-2xl" />
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-sm font-bold text-[#F27D26] uppercase tracking-wider mb-1">
                  {amp.brand}
                </div>
                <h3 className="text-2xl font-bold mb-2">{amp.model}</h3>
                
                <div className="text-xl font-mono text-zinc-300 mb-4 bg-zinc-950/50 p-3 rounded-lg border border-white/5 inline-block w-max">
                  {amp.powerPerChannel[String(driver.impedance)] || 0}W @ {driver.impedance}Ω
                </div>
                
                {match.warnings.length > 0 && !isSelected && (
                  <div className="mb-4 text-xs text-amber-400/80 flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{match.warnings[0]}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm mt-auto pt-4 border-t border-white/5">
                  <div>
                    <span className="block text-zinc-500 mb-1">Classe</span>
                    <span className="font-semibold text-zinc-200">{amp.classType}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 mb-1">DSP</span>
                    <span className="font-semibold text-zinc-200">{amp.hasDSP ? 'Integrato' : 'No'}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/5 flex justify-end items-center">
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                    {amp.madeIn}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function StepSummary({
  driver,
  amplifier,
  cabinet,
  userConfig
}: {
  driver: SpeakerDriver,
  amplifier: Amplifier,
  cabinet: CabinetDesign,
  userConfig: Partial<UserConfiguration>
}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canSubmit = form.name.trim().length > 1 && emailValid && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setError('Inserisci nome ed email validi.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const code = `CFG-${Date.now().toString(36).toUpperCase()}`;
      await addDoc(collection(db, 'configurator_requests'), {
        code,
        status: 'nuovo',
        contact: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
        },
        driverId: driver.id,
        driverLabel: `${driver.brand} ${driver.model}`,
        ampId: amplifier.id,
        ampLabel: `${amplifier.brand} ${amplifier.model}`,
        useCase: userConfig.useCase || '',
        quantity: userConfig.quantity || 1,
        cabinetName: cabinet.name,
        createdAt: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Errore invio richiesta configuratore', err);
      setError('Si è verificato un errore durante l\'invio. Riprova tra poco.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4">La Tua Configurazione</h2>
        <p className="text-zinc-400 text-lg">Controlla i componenti scelti e richiedi il tuo preventivo personalizzato: lo prepariamo a mano e te lo inviamo noi.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Sinistra: Componenti */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F27D26]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Settings className="w-5 h-5 text-[#F27D26]" />
              Configurazione Sistema
            </h3>

            <div className="flex gap-6 items-center bg-zinc-950/50 p-4 rounded-xl border border-white/5 mb-4">
              <div className="w-20 h-20 bg-zinc-900 rounded-lg flex items-center justify-center p-1.5 shrink-0">
                <DriverVisual driver={driver} showLabel={false} className="w-full h-full" />
              </div>
              <div>
                <div className="text-xs text-[#F27D26] font-bold uppercase">{driver.brand}</div>
                <div className="text-lg font-bold">{driver.model}</div>
                <div className="text-sm text-zinc-400">{driver.size}" {driver.type} • {driver.powerRMS}W RMS</div>
              </div>
            </div>

            <div className="flex gap-6 items-center bg-zinc-950/50 p-4 rounded-xl border border-white/5 mb-4">
              <div className="w-20 h-20 bg-zinc-900 rounded-lg flex items-center justify-center p-1.5 shrink-0">
                <AmpVisual amp={amplifier} className="w-full h-full" />
              </div>
              <div>
                <div className="text-xs text-[#F27D26] font-bold uppercase">{amplifier.brand}</div>
                <div className="text-lg font-bold">{amplifier.model}</div>
                <div className="text-sm text-zinc-400">Classe {amplifier.classType} • {amplifier.hasDSP && 'DSP Integrato'}</div>
              </div>
            </div>

            <div className="flex gap-6 items-center bg-zinc-950/50 p-4 rounded-xl border border-white/5">
              <div className="w-20 h-20 bg-zinc-900 rounded-lg flex items-center justify-center">
                <Box className="w-10 h-10 text-zinc-600" />
              </div>
              <div>
                <div className="text-xs text-[#F27D26] font-bold uppercase">Design Cassa</div>
                <div className="text-lg font-bold">{cabinet.name}</div>
                <div className="text-sm text-zinc-400">{cabinet.woodType} {cabinet.woodThickness}mm • {cabinet.internalVolume} Litri</div>
              </div>
            </div>
          </div>
        </div>

        {/* Destra: Richiesta preventivo */}
        <div className="space-y-6">
          {submitted ? (
            <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-8 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Richiesta inviata!</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Abbiamo ricevuto la tua configurazione. Prepariamo il preventivo su misura e ti contattiamo a breve all'indirizzo che hai indicato.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-zinc-900 border border-[#F27D26]/30 rounded-2xl p-8 relative shadow-2xl shadow-[#F27D26]/5">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-3">
                <Send className="w-5 h-5 text-[#F27D26]" />
                Richiedi il Preventivo
              </h3>
              <p className="text-zinc-500 text-sm mb-6">Niente prezzi automatici: ogni cassa è artigianale. Lasciaci i tuoi dati e ti inviamo il preventivo personalizzato.</p>

              <div className="space-y-3">
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Nome e cognome *"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#F27D26] transition-colors"
                  />
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="Email *"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#F27D26] transition-colors"
                  />
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="Telefono / WhatsApp (opzionale)"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#F27D26] transition-colors"
                  />
                </div>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <textarea
                    rows={3}
                    placeholder="Messaggio o note (opzionale)"
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm resize-none focus:outline-none focus:border-[#F27D26] transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-2 text-sm text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full mt-6 btn-premium py-4 bg-[#F27D26] hover:bg-[#E06C1C] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F27D26]"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {submitting ? 'Invio in corso...' : 'Invia richiesta'}
              </button>

              <p className="text-[11px] text-zinc-600 mt-3 text-center">
                Useremo i tuoi dati solo per inviarti il preventivo.
              </p>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODALITÀ GUIDAMI — schermata d'ingresso: 3 domande → setup pronto
// ─────────────────────────────────────────────────────────────────────────────

const USO_OPTS: { label: string; sub: string; icon: string; useCase: UseCase }[] = [
  { label: 'DJ / Discoteca', sub: 'Bassi potenti per far ballare', icon: '🎧', useCase: 'dj-club' as UseCase },
  { label: 'Band / Live', sub: 'Voce e strumenti dal vivo', icon: '🎸', useCase: 'band-live' as UseCase },
  { label: 'PA / Eventi', sub: 'Parlato e musica, eventi', icon: '📢', useCase: 'pa-events' as UseCase },
  { label: 'Studio / Casa', sub: 'Ascolto preciso e hi-fi', icon: '🏠', useCase: 'home-hifi' as UseCase },
];
const SIZE_OPTS: { label: string; sub: string; icon: string; size: 'small' | 'medium' | 'large' }[] = [
  { label: 'Piccolo', sub: 'Casa, bar, sale fino a ~50 persone', icon: '🔈', size: 'small' },
  { label: 'Medio', sub: 'Sale e locali fino a ~200 persone', icon: '🔉', size: 'medium' },
  { label: 'Grande / Outdoor', sub: 'Piazze, capannoni, grandi eventi', icon: '🔊', size: 'large' },
];
const TIPO_OPTS: { label: string; sub: string; icon: string; system: SystemType }[] = [
  { label: 'Cassa completa', sub: 'Woofer + alti — tuttofare (2 vie)', icon: '🔊', system: '2way' as SystemType },
  { label: 'Solo bassi (sub)', sub: 'Subwoofer per rinforzare i bassi', icon: '💥', system: 'sub' as SystemType },
  { label: 'Top di gamma', sub: 'Woofer + medio + alti (3 vie)', icon: '⭐', system: '3way' as SystemType },
];

function GuidedIntro({
  onExpert,
  onGuided,
}: {
  onExpert: () => void;
  onGuided: (g: { useCase: UseCase; system: SystemType; size: 'small' | 'medium' | 'large' }) => void;
}) {
  const [started, setStarted] = useState(false);
  const [uso, setUso] = useState<number | null>(null);
  const [size, setSize] = useState<number | null>(null);
  const [tipo, setTipo] = useState<number | null>(null);
  const ready = uso !== null && size !== null && tipo !== null;

  const Card = ({ icon, label, sub, active, onClick }: { icon: string; label: string; sub: string; active: boolean; onClick: () => void }) => (
    <motion.button
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`text-left p-4 rounded-2xl border transition-all ${active
        ? 'bg-brand-orange/10 border-brand-orange shadow-lg shadow-brand-orange/10'
        : 'bg-zinc-900/60 border-white/10 hover:border-white/25'}`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-bold leading-tight">{label}</div>
      <div className="text-xs text-zinc-400 mt-1">{sub}</div>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden font-sans">
      {/* glow */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <motion.div className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full bg-brand-orange/10 blur-[120px]"
          animate={{ x: [0, 80, 0], y: [0, 40, 0], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 14, repeat: Infinity }} />
        <motion.div className="absolute bottom-0 -right-40 w-[34rem] h-[34rem] rounded-full bg-blue-500/10 blur-[120px]"
          animate={{ x: [0, -60, 0], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 18, repeat: Infinity }} />
      </div>

      <div className="relative z-10 w-full max-w-3xl">
        {!started ? (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-brand-orange mb-4">
              <Wand2 className="w-4 h-4" /> Configuratore casse su misura
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Costruiamo la cassa <span className="text-brand-orange">giusta per te</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10">
              Rispondi a 3 domande veloci: pensiamo noi al progetto, ai componenti e alla protezione.
              Oppure vai in modalità esperto e scegli tutto tu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setStarted(true)}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold bg-brand-orange hover:bg-brand-orange/90 text-white shadow-lg shadow-brand-orange/30">
                <Wand2 className="w-5 h-5" /> Guidami passo-passo
              </motion.button>
              <button onClick={onExpert}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold bg-zinc-900 border border-white/10 text-zinc-200 hover:border-white/30 transition-colors">
                <Wrench className="w-5 h-5" /> Modalità esperto
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <button onClick={() => setStarted(false)} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1">
              <ChevronLeft className="w-3 h-3" /> indietro
            </button>

            <div>
              <h2 className="text-lg font-black uppercase tracking-wide mb-3">1 · A cosa ti serve?</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {USO_OPTS.map((o, i) => <Card key={i} {...o} active={uso === i} onClick={() => setUso(i)} />)}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-black uppercase tracking-wide mb-3">2 · Quanto in grande?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {SIZE_OPTS.map((o, i) => <Card key={i} {...o} active={size === i} onClick={() => setSize(i)} />)}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-black uppercase tracking-wide mb-3">3 · Che tipo di cassa?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {TIPO_OPTS.map((o, i) => <Card key={i} {...o} active={tipo === i} onClick={() => setTipo(i)} />)}
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <motion.button
                whileHover={ready ? { scale: 1.03 } : {}} whileTap={ready ? { scale: 0.97 } : {}}
                disabled={!ready}
                onClick={() => ready && onGuided({ useCase: USO_OPTS[uso!].useCase, system: TIPO_OPTS[tipo!].system, size: SIZE_OPTS[size!].size })}
                className="flex items-center gap-2 px-10 py-4 rounded-xl font-bold bg-brand-orange hover:bg-brand-orange/90 text-white shadow-lg shadow-brand-orange/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
                Crea la mia cassa <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
