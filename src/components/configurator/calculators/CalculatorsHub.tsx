import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, SlidersHorizontal, Zap, Languages, ArrowLeft } from 'lucide-react';
import { CalcLangProvider, useCalcLang } from '../../../i18n/CalcLang';
import {
  ThieleSmallCalc, SealedCalc, VentedCalc, ResponseEngineCalc,
  PassiveRadiatorCalc, BandpassCalc, TlHornCalc, EnvironmentCalc,
} from './enclosureCalcs';
import {
  PassiveCrossoverCalc, BiquadCalc, DspCrossoverCalc, LinkwitzTransformCalc, DelayCalc,
} from './crossoverCalcs';
import {
  AmpPowerCalc, SplHeadroomCalc, WiringCalc, WireGaugeCalc, LimiterCalc,
} from './electricalCalcs';

interface CalcItem { key: string; it: string; en: string; Comp: React.FC; }
interface CalcGroup { it: string; en: string; icon: React.FC<{ className?: string }>; items: CalcItem[]; }

const GROUPS: CalcGroup[] = [
  {
    it: 'Cassa & Driver', en: 'Enclosure & Driver', icon: Box, items: [
      { key: 'ts', it: 'Thiele-Small', en: 'Thiele-Small', Comp: ThieleSmallCalc },
      { key: 'sealed', it: 'Cassa chiusa', en: 'Sealed box', Comp: SealedCalc },
      { key: 'vented', it: 'Bass-reflex', en: 'Bass-reflex', Comp: VentedCalc },
      { key: 'response', it: 'Motore risposta', en: 'Response engine', Comp: ResponseEngineCalc },
      { key: 'pr', it: 'Radiatore passivo', en: 'Passive radiator', Comp: PassiveRadiatorCalc },
      { key: 'bandpass', it: 'Bandpass', en: 'Bandpass', Comp: BandpassCalc },
      { key: 'tlhorn', it: 'Linea / Horn', en: 'TL / Horn', Comp: TlHornCalc },
      { key: 'env', it: 'Ambiente', en: 'Environment', Comp: EnvironmentCalc },
    ],
  },
  {
    it: 'Crossover & DSP', en: 'Crossover & DSP', icon: SlidersHorizontal, items: [
      { key: 'xover', it: 'Crossover passivo', en: 'Passive crossover', Comp: PassiveCrossoverCalc },
      { key: 'biquad', it: 'Biquad', en: 'Biquad', Comp: BiquadCalc },
      { key: 'dspx', it: 'Crossover DSP', en: 'DSP crossover', Comp: DspCrossoverCalc },
      { key: 'lt', it: 'Linkwitz Transform', en: 'Linkwitz Transform', Comp: LinkwitzTransformCalc },
      { key: 'delay', it: 'Delay', en: 'Delay', Comp: DelayCalc },
    ],
  },
  {
    it: 'Ampli & Elettrico', en: 'Amp & Electrical', icon: Zap, items: [
      { key: 'amp', it: 'Potenza ampli', en: 'Amp power', Comp: AmpPowerCalc },
      { key: 'spl', it: 'SPL / Headroom', en: 'SPL / Headroom', Comp: SplHeadroomCalc },
      { key: 'wiring', it: 'Impedenza / Cablaggio', en: 'Impedance / Wiring', Comp: WiringCalc },
      { key: 'gauge', it: 'Cavo / Fusibile', en: 'Wire / Fuse', Comp: WireGaugeCalc },
      { key: 'limiter', it: 'Limiter', en: 'Limiter', Comp: LimiterCalc },
    ],
  },
];

const ALL: CalcItem[] = GROUPS.flatMap(g => g.items);

function HubInner({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { lang, setLang, tx } = useCalcLang();
  const [active, setActive] = useState('ts');
  const ActiveComp = (ALL.find(i => i.key === active) || ALL[0]).Comp;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pt-8 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            {onNavigate && (
              <button onClick={() => onNavigate('configuratore')} className="text-xs text-zinc-500 hover:text-[#F27D26] flex items-center gap-1 mb-2 transition-colors">
                <ArrowLeft className="w-3 h-3" /> {tx('Configuratore guidato', 'Guided configurator')}
              </button>
            )}
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              {tx('Calcolatori', 'Calculators')} <span className="text-[#F27D26]">Audio</span>
            </h1>
            <p className="text-sm text-zinc-500 mt-1 max-w-xl">
              {tx('Strumenti di ingegneria per progettare casse, crossover e amplificazione (stile WinISD / BassBox / VituixCAD).',
                  'Engineering tools to design enclosures, crossovers and amplification (WinISD / BassBox / VituixCAD style).')}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 rounded-full p-1">
            <Languages className="w-4 h-4 text-zinc-500 ml-2 mr-1" />
            {(['it', 'en'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors ${lang === l ? 'bg-[#F27D26] text-white' : 'text-zinc-400 hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Navigazione raggruppata */}
        <div className="space-y-3 mb-8">
          {GROUPS.map(g => {
            const Icon = g.icon;
            return (
              <div key={g.it} className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-600 w-full sm:w-40 shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[#F27D26]" /> {tx(g.it, g.en)}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {g.items.map(it => (
                    <button key={it.key} onClick={() => setActive(it.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${active === it.key
                        ? 'bg-[#F27D26]/15 text-[#F27D26] border-[#F27D26]/40'
                        : 'bg-zinc-900 text-zinc-400 border-white/5 hover:text-white hover:border-white/20'}`}>
                      {tx(it.it, it.en)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Calcolatore attivo */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <ActiveComp />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function CalculatorsHub({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <CalcLangProvider>
      <HubInner onNavigate={onNavigate} />
    </CalcLangProvider>
  );
}
