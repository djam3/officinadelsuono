/**
 * CustomerConfigurator — flusso cliente "outcome-first" (no AI, no numeri tecnici).
 * Obiettivo → momento "magia" (auto-progetto dietro le quinte) → "ecco la tua cassa"
 * in linguaggio umano + grafico → personalizza → richiedi preventivo.
 * I componenti li sceglie il motore; chi vuole può passare alla modalità esperto.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music, Box as BoxIcon, ArrowRight, ArrowLeft, Check, Loader2, Send,
  Sparkles, Volume2, Waves, Settings2, Mail, User, Phone, MessageSquare,
  CheckCircle, Palette, Ruler, Zap, Weight, Wand2, ShieldCheck, Hammer,
  Headphones, Tent, Guitar, Megaphone, SlidersHorizontal, Sofa, Mic, Clapperboard, Speaker,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { USE_CASE_LABELS, ENVIRONMENT_LABELS, AMPLIFIERS, DRIVERS } from '../data/speakerDatabase';
import { subscribeDrivers } from '../services/driverLibrary';
import { calculateFullCabinet, recommendCabinetType, scoreAmplifierMatch } from '../utils/cabinetCalculator';
import { CabinetViewer3D } from '../components/configurator/CabinetViewer3D';
import { Plot, PLOT_COLORS } from '../components/configurator/calculators/ui';
import * as Audio from '../utils/audio';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { SpeakerDriver, UseCase, Environment, CabinetDesign } from '../types/speaker';

interface Profile {
  useCase: UseCase | '';
  environment: Environment | '';
  power: number;     // 0-100
  bassDepth: number; // 0-100
}

const FINISHES = [
  { id: 'wood', label: 'Legno naturale', swatch: 'linear-gradient(135deg,#caa06f,#8a5a2b)', key: 'Legno naturale' },
  { id: 'black', label: 'Nero opaco', swatch: 'linear-gradient(135deg,#2a2b2f,#0c0c0e)', key: 'Vernice nera testurizzata' },
  { id: 'white', label: 'Bianco', swatch: 'linear-gradient(135deg,#f4f4f6,#cfd0d4)', key: 'Vernice bianca' },
];

const STEPS = ['Obiettivo', 'Progetto', 'La tua cassa', 'Personalizza', 'Preventivo'];

// Icone lineari coerenti per ogni uso (sostituiscono le emoji → look premium)
const USE_CASE_ICONS: Record<string, LucideIcon> = {
  'dj-club': Headphones,
  'dj-festival': Tent,
  'band-live': Guitar,
  'pa-events': Megaphone,
  'studio-monitor': SlidersHorizontal,
  'home-hifi': Sofa,
  'karaoke': Mic,
  'cinema-home': Clapperboard,
  'subwoofer-dedicato': Speaker,
};

// ─── Selezione automatica del driver dal profilo (deterministica) ─────────────
function pickDriver(drivers: SpeakerDriver[], p: Profile): SpeakerDriver {
  const envSize: Record<string, number> = { 'indoor-small': 8, 'indoor-medium': 12, 'indoor-large': 15, 'outdoor': 18 };
  const targetSize = envSize[p.environment] ?? 12;
  const pool = drivers.filter(d => ['subwoofer', 'woofer', 'mid-bass', 'coaxial', 'full-range'].includes(d.type));
  const list = pool.length ? pool : drivers;
  let best = list[0]; let bestScore = -Infinity;
  for (const d of list) {
    let s = 0;
    const powN = p.power / 100, bassN = p.bassDepth / 100;
    s += powN * Math.min(d.powerRMS / 2000, 1) * 45;
    s += (1 - powN) * (1 - Math.min(d.powerRMS / 2000, 1)) * 12;
    const fsScore = Math.max(0, 1 - (d.thielSmall.fs - 25) / 60); // fs 25→1, 85→0
    s += bassN * fsScore * 45;
    s -= Math.abs(d.size - targetSize) * 1.6;
    if (p.useCase && d.recommendedFor?.includes(p.useCase as UseCase)) s += 28;
    if (s > bestScore) { bestScore = s; best = d; }
  }
  return best;
}

interface DesignResult {
  driver: SpeakerDriver;
  amp: typeof AMPLIFIERS[number];
  cabinet: CabinetDesign;
  f3: number;
  splCurve: { f: number; v: number }[];
}

function buildDesign(drivers: SpeakerDriver[], p: Profile): DesignResult | null {
  if (!p.useCase || !p.environment) return null;
  const driver = pickDriver(drivers, p);
  const useCase = p.useCase as UseCase;
  const env = p.environment as Environment;
  // amplificatore migliore dal catalogo
  const amp = [...AMPLIFIERS]
    .map(a => ({ a, score: scoreAmplifierMatch(driver, a, useCase).score }))
    .sort((x, y) => y.score - x.score)[0].a;
  const recType = recommendCabinetType(driver, useCase, env);
  const calc = calculateFullCabinet(driver, recType, useCase, env, true, amp.dimensions);
  const cabinet = calc.cabinetDesign;
  const f3 = calc.acousticData.f3 ?? Math.round(driver.thielSmall.fs * 0.9);

  // curva risposta
  const ts = Audio.tsFromDriver(driver);
  // Curva veritiera: SPL assoluto dalla sensibilità + roll-off reale del driver in alto
  const sensitivity = driver.sensitivity;
  const fHigh = driver.frequencyRange?.max || (driver.type === 'subwoofer' ? 900 : 3500);
  let splCurve: { f: number; v: number }[] = [];
  try {
    if (cabinet.type === 'sealed') {
      const sb = Audio.sealedFromVb(ts, cabinet.internalVolume);
      splCurve = Audio.computeResponse({ ts, type: 'sealed', fc: sb.fc, qtc: sb.qtc, sensitivity, fHigh, fMax: Math.min(fHigh * 3, 20000) }).spl;
    } else {
      const fb = cabinet.port?.tuningFrequency || ts.fs * 0.5;
      const alpha = ts.vas / cabinet.internalVolume;
      splCurve = Audio.computeResponse({ ts, type: 'vented', fb, alpha, ql: 7, sensitivity, fHigh, fMax: Math.min(fHigh * 3, 20000) }).spl;
    }
  } catch { splCurve = []; }

  return { driver, amp, cabinet, f3, splCurve };
}

const heightObject = (mm: number): string => {
  if (mm < 280) return 'un forno a microonde';
  if (mm < 450) return 'uno zaino';
  if (mm < 650) return 'un comodino';
  if (mm < 850) return 'una lavatrice';
  return 'un mobile alto';
};

export default function CustomerConfigurator({ onNavigate }: { onNavigate?: (page: string) => void }) {
  useSEO({
    title: 'Configura la tua cassa su misura — Officina del Suono',
    description: 'Dicci come la userai: progettiamo per te la cassa perfetta, su misura e fatta a mano. Ricevi un preventivo personalizzato.',
    url: '/configuratore',
  });

  const [step, setStep] = useState(0);
  const [drivers, setDrivers] = useState<SpeakerDriver[]>(DRIVERS);
  useEffect(() => subscribeDrivers(list => setDrivers(list.length ? list : DRIVERS)), []);

  const [profile, setProfile] = useState<Profile>({ useCase: '', environment: '', power: 55, bassDepth: 60 });
  const [finishId, setFinishId] = useState('wood');
  const [projectName, setProjectName] = useState('');
  const [grille, setGrille] = useState(true);

  const design = useMemo(() => buildDesign(drivers, profile), [drivers, profile]);
  const finish = FINISHES.find(f => f.id === finishId)!;

  const cabinetForView = useMemo(() => design ? { ...design.cabinet, finish: finish.key } as CabinetDesign : null, [design, finish]);

  const next = () => setStep(s => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep(s => Math.max(0, s - 1));

  // momento "magia": entrando nello step 1, attende e avanza
  useEffect(() => {
    if (step === 1) {
      const t = setTimeout(() => setStep(2), 2600);
      return () => clearTimeout(t);
    }
  }, [step]);

  const canStartDesign = !!profile.useCase && !!profile.environment;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col">
      {/* Header progress */}
      <div className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-black tracking-tight">Crea la <span className="text-[#F27D26]">tua cassa</span></h1>
            {onNavigate && (
              <button onClick={() => onNavigate('configuratore-esperto')} className="text-[11px] text-zinc-400 hover:text-[#F27D26] flex items-center gap-1 transition-colors">
                <Settings2 className="w-3.5 h-3.5" /> Modalità esperto
              </button>
            )}
          </div>
          <div className="flex items-center gap-2" role="list" aria-label={`Passo ${step + 1} di ${STEPS.length}: ${STEPS[step]}`}>
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1 flex items-center gap-2" role="listitem" aria-current={i === step ? 'step' : undefined}>
                <div className={`flex items-center gap-1.5 ${i <= step ? 'text-[#F27D26]' : 'text-zinc-600'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border ${i < step ? 'bg-[#F27D26] border-[#F27D26] text-[#3a1606]' : i === step ? 'border-[#F27D26]' : 'border-zinc-700'}`}>
                    {i < step ? <Check className="w-3 h-3" strokeWidth={3} /> : i + 1}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-[#F27D26]/50' : 'bg-zinc-800'}`} />}
              </div>
            ))}
          </div>
          {/* Nome step corrente — visibile su mobile (dove le label sono nascoste) */}
          <p className="sm:hidden text-[11px] font-bold text-[#F27D26] mt-2">
            Passo {step + 1} di {STEPS.length} · {STEPS[step]}
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 pt-8 pb-28">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.3 }}>
            {step === 0 && <StepGoal profile={profile} setProfile={setProfile} />}
            {step === 1 && <StepMagic profile={profile} drivers={drivers} />}
            {step === 2 && design && cabinetForView && <StepReveal design={design} cabinet={cabinetForView} />}
            {step === 3 && design && cabinetForView && (
              <StepCustomize cabinet={cabinetForView} finishId={finishId} setFinishId={setFinishId}
                grille={grille} setGrille={setGrille} projectName={projectName} setProjectName={setProjectName} />
            )}
            {step === 4 && design && (
              <StepQuote design={design} profile={profile} finish={finish.label} grille={grille} projectName={projectName} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom bar */}
      {step !== 1 && (
        <div className="sticky bottom-0 z-40 bg-zinc-950/85 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-5xl mx-auto px-5 py-4 flex justify-between items-center">
            <button onClick={prev} disabled={step === 0}
              className="flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-zinc-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
              <ArrowLeft className="w-5 h-5" /> Indietro
            </button>
            {step === 0 && (
              <button onClick={next} disabled={!canStartDesign}
                className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold bg-[#F27D26] hover:bg-[#E06C1C] text-[#3a1606] shadow-lg shadow-[#F27D26]/20 disabled:opacity-40 disabled:cursor-not-allowed">
                Progetta la mia cassa <Wand2 className="w-5 h-5" />
              </button>
            )}
            {(step === 2 || step === 3) && (
              <button onClick={next} className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold bg-[#F27D26] hover:bg-[#E06C1C] text-[#3a1606] shadow-lg shadow-[#F27D26]/20">
                {step === 2 ? 'Personalizza' : 'Richiedi preventivo'} <ArrowRight className="w-5 h-5" />
              </button>
            )}
            {step === 4 && <span className="text-xs text-zinc-400 max-w-[15rem] text-right">Compila il modulo per ricevere il preventivo.</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STEP 0: Obiettivo ────────────────────────────────────────────────────────
function StepGoal({ profile, setProfile }: { profile: Profile; setProfile: React.Dispatch<React.SetStateAction<Profile>> }) {
  return (
    <div className="space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black mb-3">A cosa ti serve?</h2>
        <p className="text-zinc-400">Raccontaci come la userai. Al resto pensiamo noi: progettiamo la cassa perfetta per te.</p>
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2"><Music className="w-4 h-4 text-[#F27D26]" /> Utilizzo principale</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(USE_CASE_LABELS).map(([key, d]) => {
            const sel = profile.useCase === key;
            const Icon = USE_CASE_ICONS[key] || Music;
            return (
              <button key={key} onClick={() => setProfile(p => ({ ...p, useCase: key as UseCase }))}
                aria-pressed={sel}
                className={`p-4 rounded-2xl border text-left transition-all ${sel ? 'bg-[#F27D26]/10 border-[#F27D26]' : 'bg-zinc-900/50 border-white/5 hover:border-white/20'}`}>
                <Icon className={`w-7 h-7 mb-2 ${sel ? 'text-[#F27D26]' : 'text-zinc-300'}`} strokeWidth={1.5} />
                <div className="font-bold text-sm">{d.label}</div>
                <div className="text-[11px] text-zinc-400 leading-snug mt-0.5">{d.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2"><BoxIcon className="w-4 h-4 text-[#F27D26]" /> Dove la userai</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(ENVIRONMENT_LABELS).map(([key, d]) => {
            const sel = profile.environment === key;
            return (
              <button key={key} onClick={() => setProfile(p => ({ ...p, environment: key as Environment }))}
                className={`p-4 rounded-2xl border text-left transition-all ${sel ? 'bg-[#F27D26]/10 border-[#F27D26]' : 'bg-zinc-900/50 border-white/5 hover:border-white/20'}`}>
                <div className="font-bold text-sm">{d.label}</div>
                <div className="text-[11px] text-zinc-400 leading-snug mt-0.5">{d.description}</div>
                <div className="text-[10px] text-[#F27D26] mt-1 font-bold">{d.sqm}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Slider label="Quanta potenza" icon={<Volume2 className="w-4 h-4 text-[#F27D26]" />}
          value={profile.power} onChange={v => setProfile(p => ({ ...p, power: v }))}
          left="Tranquilla" right="Da concerto" />
        <Slider label="Quanto bassi profondi" icon={<Waves className="w-4 h-4 text-[#F27D26]" />}
          value={profile.bassDepth} onChange={v => setProfile(p => ({ ...p, bassDepth: v }))}
          left="Equilibrati" right="Sotto-stomaco" />
      </div>
    </div>
  );
}

function Slider({ label, icon, value, onChange, left, right }: { label: string; icon: React.ReactNode; value: number; onChange: (v: number) => void; left: string; right: string }) {
  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
      <p className="text-sm font-bold flex items-center gap-2 mb-4">{icon} {label}</p>
      <input type="range" min={0} max={100} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[#F27D26]" />
      <div className="flex justify-between text-[11px] text-zinc-400 mt-1"><span>{left}</span><span>{right}</span></div>
    </div>
  );
}

// ─── STEP 1: Magia ────────────────────────────────────────────────────────────
function StepMagic({ profile, drivers }: { profile: Profile; drivers: SpeakerDriver[] }) {
  const phases = [
    'Analizzo come la userai…',
    'Scelgo l\'altoparlante giusto…',
    'Calcolo il volume e l\'accordo della cassa…',
    'Abbino l\'amplificazione perfetta…',
  ];
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPhase(p => Math.min(phases.length - 1, p + 1)), 620);
    return () => clearInterval(id);
  }, []);
  void drivers; void profile;
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 min-h-[50vh]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
        className="w-20 h-20 rounded-full border-2 border-[#F27D26]/30 border-t-[#F27D26] flex items-center justify-center mb-8">
        <Wand2 className="w-8 h-8 text-[#F27D26]" />
      </motion.div>
      <h2 className="text-2xl md:text-3xl font-black mb-3">Sto progettando la tua cassa</h2>
      <AnimatePresence mode="wait">
        <motion.p key={phase} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          className="text-zinc-400">{phases[phase]}</motion.p>
      </AnimatePresence>
      <div className="flex gap-1.5 mt-6">
        {phases.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i <= phase ? 'bg-[#F27D26]' : 'bg-zinc-700'}`} />)}
      </div>
    </div>
  );
}

// ─── STEP 2: La tua cassa ─────────────────────────────────────────────────────
function StepReveal({ design, cabinet }: { design: DesignResult; cabinet: CabinetDesign }) {
  const { driver, amp, f3, splCurve } = design;
  const dims = cabinet.externalDimensions;
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-[#F27D26] font-bold text-sm uppercase tracking-widest mb-2 flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" /> Ecco la tua cassa</p>
        <h2 className="text-3xl md:text-4xl font-black mb-2">Progettata su misura per te</h2>
        <p className="text-zinc-400">Un {driver.size}" {driver.brand} in una cassa {cabinet.type === 'sealed' ? 'chiusa' : 'bass-reflex'} ottimizzata, già abbinata all'amplificazione.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="rounded-2xl overflow-hidden min-h-[420px] relative shadow-2xl">
          <CabinetViewer3D cabinet={cabinet} showDimensions={false} exploded={false} baffleDrivers={[driver]} />
        </div>

        <div className="space-y-3">
          <HumanStat icon={<Waves className="w-5 h-5" />} title="Bassi profondi" value={`fino a ~${Math.round(f3)} Hz`}
            note={f3 < 35 ? 'sub-bassi che senti nello stomaco' : f3 < 55 ? 'bassi pieni e profondi' : 'bassi puliti e veloci'} />
          <HumanStat icon={<Volume2 className="w-5 h-5" />} title="Potenza" value={`fino a ${driver.powerRMS} W`} note="abbondante per il tuo utilizzo" />
          <HumanStat icon={<Ruler className="w-5 h-5" />} title="Dimensioni" value={`${(dims.width / 10).toFixed(0)} × ${(dims.height / 10).toFixed(0)} × ${(dims.depth / 10).toFixed(0)} cm`}
            note={`alta circa come ${heightObject(dims.height)}`} />
          <HumanStat icon={<Weight className="w-5 h-5" />} title="Peso" value={`~${Math.round(cabinet.estimatedWeight)} kg`} note="cassa vuota, legno robusto" />
          <HumanStat icon={<Zap className="w-5 h-5" />} title="Amplificazione" value={`${amp.brand} ${amp.model}`}
            note={`Classe ${amp.classType}${amp.hasDSP ? ' con DSP' : ''} — inclusa e abbinata`} accent />
        </div>
      </div>

      {/* grafico raccontato */}
      {splCurve.length > 0 && (
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-1">La tua curva di risposta</h3>
          <p className="text-xs text-zinc-400 mb-4">Più la linea scende e resta distesa a sinistra, più la cassa va in profondità sui bassi.</p>
          <Plot series={[{ name: 'SPL', color: PLOT_COLORS[0], points: splCurve }]} yLabel="Risposta" yUnit="dB" height={200} />
        </div>
      )}
    </div>
  );
}

function HumanStat({ icon, title, value, note, accent }: { icon: React.ReactNode; title: string; value: string; note: string; accent?: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${accent ? 'bg-[#F27D26]/5 border-[#F27D26]/30' : 'bg-zinc-900/50 border-white/5'}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent ? 'bg-[#F27D26]/15 text-[#F27D26]' : 'bg-zinc-800 text-zinc-300'}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] text-zinc-400 uppercase tracking-wider">{title}</div>
        <div className="font-black text-lg leading-tight truncate">{value}</div>
        <div className="text-xs text-zinc-400">{note}</div>
      </div>
    </div>
  );
}

// ─── STEP 3: Personalizza ─────────────────────────────────────────────────────
function StepCustomize({ cabinet, finishId, setFinishId, grille, setGrille, projectName, setProjectName }: {
  cabinet: CabinetDesign; finishId: string; setFinishId: (v: string) => void;
  grille: boolean; setGrille: (v: boolean) => void; projectName: string; setProjectName: (v: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-[#F27D26] font-bold text-sm uppercase tracking-widest mb-2 flex items-center justify-center gap-2"><Palette className="w-4 h-4" /> Rendila tua</p>
        <h2 className="text-3xl md:text-4xl font-black mb-2">Personalizza la tua cassa</h2>
        <p className="text-zinc-400">Scegli finitura e dettagli. La vedi cambiare in tempo reale.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="rounded-2xl overflow-hidden min-h-[420px] relative shadow-2xl">
          <CabinetViewer3D cabinet={cabinet} showDimensions={false} exploded={false} />
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Finitura</p>
            <div className="grid grid-cols-3 gap-3">
              {FINISHES.map(f => (
                <button key={f.id} onClick={() => setFinishId(f.id)}
                  className={`p-3 rounded-2xl border text-center transition-all ${finishId === f.id ? 'border-[#F27D26]' : 'border-white/10 hover:border-white/25'}`}>
                  <div className="w-full h-12 rounded-lg mb-2 border border-white/10" style={{ background: f.swatch }} />
                  <div className="text-xs font-bold">{f.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Dettagli</p>
            <button onClick={() => setGrille(!grille)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${grille ? 'bg-[#F27D26]/5 border-[#F27D26]/30' : 'bg-zinc-900/50 border-white/10'}`}>
              <span className="text-sm font-bold">Griglia di protezione</span>
              <span className={`w-10 h-6 rounded-full relative transition-colors ${grille ? 'bg-[#F27D26]' : 'bg-zinc-700'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${grille ? 'left-[1.1rem]' : 'left-0.5'}`} />
              </span>
            </button>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Dai un nome al progetto</p>
            <input value={projectName} onChange={e => setProjectName(e.target.value)} maxLength={40}
              placeholder="es. La mia cassa per il club"
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F27D26]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STEP 4: Preventivo ───────────────────────────────────────────────────────
function StepQuote({ design, profile, finish, grille, projectName }: {
  design: DesignResult; profile: Profile; finish: string; grille: boolean; projectName: string;
}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canSubmit = form.name.trim().length > 1 && emailValid && !submitting;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) { setError('Inserisci nome ed email validi.'); return; }
    setError(null); setSubmitting(true);
    try {
      const code = `CFG-${Date.now().toString(36).toUpperCase()}`;
      await addDoc(collection(db, 'configurator_requests'), {
        code, status: 'nuovo',
        contact: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), message: form.message.trim() },
        driverId: design.driver.id, driverLabel: `${design.driver.brand} ${design.driver.model}`,
        ampId: design.amp.id, ampLabel: `${design.amp.brand} ${design.amp.model}`,
        useCase: profile.useCase || '', quantity: 1, cabinetName: projectName.trim() || design.cabinet.name,
        environment: profile.environment || '', powerLevel: profile.power, bassLevel: profile.bassDepth,
        finish, grille, createdAt: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err) { console.error(err); setError('Errore durante l\'invio. Riprova tra poco.'); }
    finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-5"><CheckCircle className="w-8 h-8 text-emerald-400" /></div>
        <h2 className="text-2xl font-black mb-2">Richiesta inviata!</h2>
        <p className="text-zinc-400">Abbiamo ricevuto il tuo progetto{projectName ? ` "${projectName}"` : ''}. Un nostro esperto prepara il preventivo su misura e ti contatta a breve.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black mb-2">Richiedi il tuo preventivo</h2>
        <p className="text-zinc-400">Ogni cassa è artigianale: prepariamo il preventivo a mano e te lo inviamo noi.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* riepilogo */}
        <div className="space-y-4">
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2"><BoxIcon className="w-5 h-5 text-[#F27D26]" /> {projectName.trim() || 'Il tuo progetto'}</h3>
            <Line label="Altoparlante" value={`${design.driver.size}" ${design.driver.brand} ${design.driver.model}`} />
            <Line label="Tipo cassa" value={design.cabinet.type === 'sealed' ? 'Chiusa' : 'Bass-reflex'} />
            <Line label="Amplificazione" value={`${design.amp.brand} ${design.amp.model}`} />
            <Line label="Finitura" value={finish} />
            <Line label="Griglia" value={grille ? 'Sì' : 'No'} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Trust icon={<Hammer className="w-4 h-4" />} text="Fatta a mano" />
            <Trust icon={<ShieldCheck className="w-4 h-4" />} text="Esperto MAT" />
            <Trust icon={<Sparkles className="w-4 h-4" />} text="Su misura" />
          </div>
        </div>

        {/* form */}
        <form onSubmit={submit} className="bg-zinc-900 border border-[#F27D26]/30 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><Send className="w-5 h-5 text-[#F27D26]" /> I tuoi contatti</h3>
          <p className="text-zinc-400 text-sm mb-5">Ti inviamo il preventivo personalizzato.</p>
          <div className="space-y-3">
            <IconInput icon={<User className="w-4 h-4" />} type="text" placeholder="Nome e cognome *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <IconInput icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email *" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
            <IconInput icon={<Phone className="w-4 h-4" />} type="tel" placeholder="Telefono / WhatsApp (opzionale)" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
            <div className="relative">
              <MessageSquare className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <textarea rows={3} placeholder="Note (opzionale)" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm resize-none focus:outline-none focus:border-[#F27D26]" />
            </div>
          </div>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
          <button type="submit" disabled={!canSubmit}
            className="w-full mt-5 py-4 bg-[#F27D26] hover:bg-[#E06C1C] text-[#3a1606] rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {submitting ? 'Invio…' : 'Invia richiesta'}
          </button>
          <p className="text-[11px] text-zinc-600 mt-3 text-center">Useremo i tuoi dati solo per inviarti il preventivo.</p>
        </form>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 text-sm py-1.5 border-b border-white/5 last:border-0"><span className="text-zinc-400">{label}</span><span className="font-bold text-right">{value}</span></div>;
}
function Trust({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3 text-center"><div className="text-[#F27D26] flex justify-center mb-1">{icon}</div><div className="text-[10px] font-bold text-zinc-300">{text}</div></div>;
}
function IconInput({ icon, type, placeholder, value, onChange }: { icon: React.ReactNode; type: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <span className="text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#F27D26]" />
    </div>
  );
}
