import React, { useMemo, useState } from 'react';
import { ArrowRight, Cpu, Box as BoxIcon, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useCalcLang } from '../../../i18n/CalcLang';
import { Stat, Disclaimer, Plot, PLOT_COLORS } from './ui';
import * as A from '../../../utils/audio';
import { DRIVERS, AMPLIFIERS } from '../../../data/speakerDatabase';
import { scoreAmplifierMatch, calculateExternalDimensions } from '../../../utils/cabinetCalculator';
import type { UseCase } from '../../../types/speaker';

function woodThicknessFor(powerRMS: number): number {
  if (powerRMS > 1500) return 25;
  if (powerRMS > 800) return 21;
  return 18;
}

export function AutoDesignCalc() {
  const { tx } = useCalcLang();
  const [driverId, setDriverId] = useState(DRIVERS.find(d => d.size >= 15)?.id || DRIVERS[0].id);
  const driver = useMemo(() => DRIVERS.find(d => d.id === driverId) || DRIVERS[0], [driverId]);

  const ts = useMemo(() => A.tsFromDriver(driver), [driver]);
  const box = useMemo(() => A.autoEnclosure(ts), [ts]);
  const ampReq = useMemo(() => A.recommendAmpPower(ts), [ts]);

  const vb = box.type === 'sealed' ? box.sealed!.vb : box.vented!.vb;
  const dims = useMemo(() => calculateExternalDimensions(vb, woodThicknessFor(driver.powerRMS), driver, true), [vb, driver]);

  const curve = useMemo(() => box.type === 'sealed'
    ? A.computeResponse({ ts, type: 'sealed', fc: box.sealed!.fc, qtc: box.sealed!.qtc })
    : A.computeResponse({ ts, type: 'vented', fb: box.vented!.fb, alpha: box.vented!.alpha, ql: 7 }),
  [ts, box]);

  // Amplificatori consigliati (deterministico)
  const useCase: UseCase = (driver.recommendedFor && driver.recommendedFor[0]) || 'pa-events';
  const amps = useMemo(() => AMPLIFIERS.map(a => {
    const m = scoreAmplifierMatch(driver, a, useCase);
    const pw = a.powerPerChannel[String(driver.impedance)] || a.powerPerChannel['4'] || 0;
    return { amp: a, score: m.score, reasons: m.reasons, warnings: m.warnings, pw };
  }).sort((x, y) => y.score - x.score).slice(0, 3), [driver, useCase]);

  const boxTypeLabel = box.type === 'sealed' ? tx('Cassa chiusa (Sealed)', 'Sealed box') : tx('Bass-reflex (Vented)', 'Bass-reflex (Vented)');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-black flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#F27D26]" /> {tx('Auto-progetto', 'Auto-design')}
        </h3>
        <p className="text-sm text-zinc-500 mt-1">
          {tx('Scegli il woofer/subwoofer: il sistema progetta da solo il box ottimale e trova l\'amplificatore giusto. Nessuna AI, solo formule.',
              'Pick the woofer/subwoofer: the system autonomously designs the optimal box and finds the right amplifier. No AI, just formulas.')}
        </p>
      </div>

      {/* Catena: Driver → Box → Ampli */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
        <span className="text-[#F27D26]">1. {tx('Driver', 'Driver')}</span>
        <ArrowRight className="w-3 h-3" />
        <span>2. {tx('Box', 'Box')}</span>
        <ArrowRight className="w-3 h-3" />
        <span>3. {tx('Ampli', 'Amp')}</span>
      </div>

      {/* 1. Selezione driver */}
      <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-4">
        <label className="block">
          <span className="text-xs text-zinc-400 font-medium">{tx('Woofer / Subwoofer', 'Woofer / Subwoofer')}</span>
          <select value={driverId} onChange={e => setDriverId(e.target.value)}
            className="mt-1 w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27D26]">
            {[...DRIVERS].sort((a, b) => b.size - a.size).map(d => (
              <option key={d.id} value={d.id}>{d.size}" {d.brand} {d.model} — {d.type}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3 text-xs">
          <Mini label="Fs" v={`${driver.thielSmall.fs} Hz`} />
          <Mini label="Qts" v={driver.thielSmall.qts} />
          <Mini label="Vas" v={`${driver.thielSmall.vas} L`} />
          <Mini label="Pe" v={`${driver.powerRMS} W`} />
          <Mini label="Z" v={`${driver.impedance} Ω`} />
          <Mini label="Xmax" v={`${driver.thielSmall.xmax} mm`} />
        </div>
      </div>

      {/* 2. Box autonomo */}
      <div className="bg-zinc-950/60 border border-[#F27D26]/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <BoxIcon className="w-4 h-4 text-[#F27D26]" />
          <span className="text-sm font-bold">{tx('Box progettato automaticamente', 'Auto-designed box')}</span>
          <span className="ml-auto text-[10px] bg-[#F27D26]/15 text-[#F27D26] px-2 py-0.5 rounded-full font-bold uppercase">{boxTypeLabel}</span>
        </div>
        <p className="text-[11px] text-zinc-500 mb-3">
          EBP {A.round(box.ebp, 0)} → {box.recommendation === 'sealed' ? tx('consigliata chiusa', 'sealed recommended') : box.recommendation === 'vented' ? tx('consigliata bass-reflex', 'vented recommended') : tx('entrambe possibili, scelta da Qts', 'either possible, chosen by Qts')}
          {box.alignment ? ` · ${tx('allineamento', 'alignment')} ${box.alignment}` : ''}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label={tx('Volume', 'Volume')} value={A.round(vb, 1)} unit={tx('litri', 'L')} accent />
          {box.type === 'sealed'
            ? <><Stat label="Fc" value={A.round(box.sealed!.fc, 1)} unit="Hz" /><Stat label="Qtc" value={A.round(box.sealed!.qtc, 2)} /></>
            : <><Stat label="Fb" value={A.round(box.vented!.fb, 1)} unit="Hz" accent /><Stat label={tx('Porta', 'Port')} value={`Ø${box.vented!.portDiameter} × ${A.round(box.vented!.portLength, 0)}`} unit="mm" /></>}
          <Stat label="F3" value={A.round(box.type === 'sealed' ? box.sealed!.f3 : box.vented!.f3, 1)} unit="Hz" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <Stat label={tx('Dimensioni esterne (L×A×P)', 'External dims (W×H×D)')} value={`${dims.width} × ${dims.height} × ${dims.depth}`} unit="mm" />
          {box.type === 'vented' && <Stat label={tx('Velocità aria porta', 'Port air velocity')} value={A.round(box.vented!.portVelocity, 1)} unit="m/s" />}
        </div>
        <div className="mt-3 bg-zinc-950 border border-white/5 rounded-lg p-3">
          <Plot series={[{ name: 'SPL', color: PLOT_COLORS[0], points: curve.spl }]} yLabel="SPL" yUnit="dB" height={180} />
        </div>
      </div>

      {/* 3. Amplificatore autonomo */}
      <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-[#F27D26]" />
          <span className="text-sm font-bold">{tx('Amplificazione necessaria', 'Required amplification')}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Stat label={tx('Impedenza', 'Impedance')} value={ampReq.impedance} unit="Ω" />
          <Stat label={tx('Min (limite termico)', 'Min (thermal limit)')} value={ampReq.ampMinRmsW} unit="W RMS" />
          <Stat label={tx('Consigliata (headroom)', 'Recommended (headroom)')} value={ampReq.ampIdealRmsW} unit="W RMS" accent />
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{tx('Moduli consigliati dal catalogo', 'Recommended modules from catalog')}</div>
        <div className="space-y-2">
          {amps.map(({ amp, score, warnings, pw }) => (
            <div key={amp.id} className="flex items-center gap-3 bg-zinc-900 border border-white/5 rounded-lg p-3">
              <div className={`text-xs font-black px-2 py-1 rounded-full shrink-0 ${score >= 80 ? 'bg-emerald-500/15 text-emerald-400' : score >= 50 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>{score}%</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{amp.brand} {amp.model}</div>
                <div className="text-[11px] text-zinc-500">{pw}W @ {driver.impedance}Ω · {tx('Classe', 'Class')} {amp.classType}{amp.hasDSP ? ' · DSP' : ''}</div>
                {warnings.length > 0 && <div className="text-[10px] text-amber-400/80 flex items-center gap-1 mt-0.5"><AlertTriangle className="w-3 h-3 shrink-0" />{warnings[0]}</div>}
              </div>
              {score >= 80 && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}

function Mini({ label, v }: { label: string; v: string | number }) {
  return (
    <div className="bg-zinc-900 rounded-lg px-2 py-1.5 text-center">
      <div className="text-[9px] text-zinc-500 uppercase">{label}</div>
      <div className="text-xs font-bold text-zinc-200">{v}</div>
    </div>
  );
}
