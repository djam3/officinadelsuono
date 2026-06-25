import React, { useMemo, useState } from 'react';
import { useCalcLang } from '../../../i18n/CalcLang';
import { NumField, SelectField, Stat, CalcShell, Disclaimer, Plot, PLOT_COLORS } from './ui';
import * as A from '../../../utils/audio';
import type { BiquadType, FilterFamily, XoverFamily } from '../../../utils/audio';

// ─── #8 Crossover passivo ─────────────────────────────────────────────────────
export function PassiveCrossoverCalc() {
  const { tx } = useCalcLang();
  const [order, setOrder] = useState<1 | 2 | 3 | 4>(2);
  const [family, setFamily] = useState<XoverFamily>('butterworth');
  const [fc, setFc] = useState<number | ''>(2500);
  const [z, setZ] = useState<number | ''>(8);
  const [re, setRe] = useState<number | ''>(6);
  const [le, setLe] = useState<number | ''>(0.5);
  const [atten, setAtten] = useState<number | ''>(3);
  const [baffle, setBaffle] = useState<number | ''>(220);
  const d = useMemo(() => A.designCrossover(order, family, fc === '' ? 2500 : fc, z === '' ? 8 : z), [order, family, fc, z]);
  const zob = useMemo(() => A.zobel(re === '' ? 6 : re, le === '' ? 0.5 : le), [re, le]);
  const lp = useMemo(() => A.lPad(atten === '' ? 3 : atten, z === '' ? 8 : z), [atten, z]);
  const bs = useMemo(() => A.baffleStep(baffle === '' ? 220 : baffle, z === '' ? 8 : z), [baffle, z]);
  const Comp = ({ list, title }: { list: typeof d.lowpass; title: string }) => (
    <div className="bg-zinc-950/60 border border-white/5 rounded-lg p-3">
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">{title}</div>
      <div className="space-y-1">
        {list.map((c, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-zinc-400">{c.label}</span>
            <span className="font-mono text-white">{A.round(c.value, c.unit === 'µF' ? 1 : 2)} {c.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <CalcShell
      title={tx('Crossover Passivo', 'Passive Crossover')}
      subtitle={tx('Reti 1–4° ordine + Zobel, L-pad, baffle-step.', '1st–4th order networks + Zobel, L-pad, baffle-step.')}
      inputs={
        <>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label={tx('Ordine', 'Order')} value={String(order)} onChange={v => setOrder(Number(v) as 1 | 2 | 3 | 4)}
              options={[1, 2, 3, 4].map(o => ({ value: String(o), label: `${o}° (${o * 6} dB/oct)` }))} />
            <SelectField label={tx('Famiglia', 'Family')} value={family} onChange={v => setFamily(v as XoverFamily)}
              options={[{ value: 'butterworth', label: 'Butterworth' }, { value: 'linkwitz-riley', label: 'Linkwitz-Riley' }, { value: 'bessel', label: 'Bessel' }]} />
            <NumField label="Fc" unit="Hz" value={fc} onChange={setFc} />
            <NumField label={tx('Impedenza', 'Impedance')} unit="Ω" value={z} onChange={setZ} />
          </div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest pt-2">Zobel · L-pad · Baffle-step</div>
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Re" unit="Ω" value={re} onChange={setRe} />
            <NumField label="Le" unit="mH" value={le} onChange={setLe} />
            <NumField label={tx('Attenuazione', 'Attenuation')} unit="dB" value={atten} onChange={setAtten} />
            <NumField label={tx('Larghezza baffle', 'Baffle width')} unit="mm" value={baffle} onChange={setBaffle} />
          </div>
        </>
      }
      results={
        <>
          <div className="grid grid-cols-2 gap-3">
            <Comp list={d.lowpass} title={tx('Passa-basso (woofer)', 'Low-pass (woofer)')} />
            <Comp list={d.highpass} title={tx('Passa-alto (tweeter)', 'High-pass (tweeter)')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Zobel R / C" value={`${A.round(zob.r, 1)}Ω · ${A.round(zob.c, 1)}µF`} />
            <Stat label="L-pad Rs / Rp" value={`${A.round(lp.rSeries, 1)} / ${A.round(lp.rParallel, 1)}Ω`} />
            <Stat label={tx('Baffle-step f', 'Baffle-step f')} value={A.round(bs.fStep, 0)} unit="Hz" />
            <Stat label="Baffle L / Rp" value={`${A.round(bs.inductanceMh, 2)}mH · ${A.round(bs.rParallel, 0)}Ω`} />
          </div>
          <Disclaimer />
        </>
      }
    />
  );
}

// ─── #12 Biquad ───────────────────────────────────────────────────────────────
export function BiquadCalc() {
  const { tx } = useCalcLang();
  const [type, setType] = useState<BiquadType>('lowpass');
  const [fs, setFs] = useState<number | ''>(48000);
  const [f0, setF0] = useState<number | ''>(1000);
  const [q, setQ] = useState<number | ''>(0.707);
  const [gain, setGain] = useState<number | ''>(0);
  const coeffs = useMemo(() => A.biquad(type, fs === '' ? 48000 : fs, f0 === '' ? 1000 : f0, q === '' ? 0.707 : q, gain === '' ? 0 : gain), [type, fs, f0, q, gain]);
  const grid = useMemo(() => A.logFreqGrid(20, (fs === '' ? 48000 : fs) / 2, 200), [fs]);
  const curve = useMemo(() => A.biquadResponse([coeffs], fs === '' ? 48000 : fs, grid), [coeffs, fs, grid]);
  const exportTxt = `b0=${coeffs.b0.toFixed(8)}\nb1=${coeffs.b1.toFixed(8)}\nb2=${coeffs.b2.toFixed(8)}\na1=${coeffs.a1.toFixed(8)}\na2=${coeffs.a2.toFixed(8)}`;
  const hasGain = type === 'peaking' || type === 'lowshelf' || type === 'highshelf';
  return (
    <CalcShell
      title={tx('Calcolatore Biquad', 'Biquad Calculator')}
      subtitle={tx('Coefficienti (cookbook RBJ) pronti per miniDSP + curva.', 'Coefficients (RBJ cookbook) miniDSP-ready + curve.')}
      inputs={
        <>
          <SelectField label={tx('Tipo filtro', 'Filter type')} value={type} onChange={v => setType(v as BiquadType)}
            options={[
              { value: 'lowpass', label: tx('Passa-basso', 'Low-pass') }, { value: 'highpass', label: tx('Passa-alto', 'High-pass') },
              { value: 'bandpass', label: 'Band-pass' }, { value: 'notch', label: 'Notch' }, { value: 'allpass', label: 'All-pass' },
              { value: 'peaking', label: 'Peaking EQ' }, { value: 'lowshelf', label: 'Low shelf' }, { value: 'highshelf', label: 'High shelf' },
            ]} />
          <div className="grid grid-cols-2 gap-3">
            <NumField label={tx('Sample rate', 'Sample rate')} unit="Hz" value={fs} onChange={setFs} />
            <NumField label="f0" unit="Hz" value={f0} onChange={setF0} />
            <NumField label="Q" value={q} onChange={setQ} />
            {hasGain && <NumField label="Gain" unit="dB" value={gain} onChange={setGain} />}
          </div>
        </>
      }
      results={
        <>
          <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-3">
            <Plot series={[{ name: '|H|', color: PLOT_COLORS[0], points: curve }]} yLabel={tx('Ampiezza', 'Magnitude')} yUnit="dB" />
          </div>
          <div className="bg-zinc-950 border border-white/10 rounded-lg p-3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{tx('Coefficienti (a0=1)', 'Coefficients (a0=1)')}</div>
            <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre-wrap">{exportTxt}</pre>
          </div>
          <Disclaimer />
        </>
      }
    />
  );
}

// ─── #13 DSP crossover builder ────────────────────────────────────────────────
export function DspCrossoverCalc() {
  const { tx } = useCalcLang();
  const [family, setFamily] = useState<FilterFamily>('linkwitz-riley');
  const [order, setOrder] = useState(4);
  const [fc, setFc] = useState<number | ''>(2000);
  const [fs, setFs] = useState<number | ''>(48000);
  const sr = fs === '' ? 48000 : fs;
  const f = fc === '' ? 2000 : fc;
  const lpSec = useMemo(() => A.crossoverSections('lowpass', family, order, sr, f), [family, order, sr, f]);
  const hpSec = useMemo(() => A.crossoverSections('highpass', family, order, sr, f), [family, order, sr, f]);
  const grid = useMemo(() => A.logFreqGrid(20, sr / 2, 220), [sr]);
  const lpC = useMemo(() => A.biquadResponse(lpSec, sr, grid), [lpSec, sr, grid]);
  const hpC = useMemo(() => A.biquadResponse(hpSec, sr, grid), [hpSec, sr, grid]);
  const stages = A.cascadeStages(family, order);
  return (
    <CalcShell
      title={tx('Crossover DSP', 'DSP Crossover')}
      subtitle={tx('Biquad in cascata (Q per stadio) per qualsiasi ordine.', 'Cascaded biquads (per-stage Q) for any order.')}
      inputs={
        <>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label={tx('Famiglia', 'Family')} value={family} onChange={v => setFamily(v as FilterFamily)}
              options={[{ value: 'linkwitz-riley', label: 'Linkwitz-Riley' }, { value: 'butterworth', label: 'Butterworth' }, { value: 'bessel', label: 'Bessel' }]} />
            <SelectField label={tx('Ordine', 'Order')} value={String(order)} onChange={v => setOrder(Number(v))}
              options={[2, 4, 8].map(o => ({ value: String(o), label: `${o}° (${o * 6} dB/oct)` }))} />
            <NumField label="Fc" unit="Hz" value={fc} onChange={setFc} />
            <NumField label="Sample rate" unit="Hz" value={fs} onChange={setFs} />
          </div>
          <div className="bg-zinc-950/60 border border-white/5 rounded-lg p-3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{tx('Q per stadio', 'Per-stage Q')}</div>
            <div className="text-sm font-mono text-zinc-300">{stages.map(s => `Q=${A.round(s.q, 4)}${s.fsf !== 1 ? ` ×${A.round(s.fsf, 3)}` : ''}`).join('  ·  ')}</div>
          </div>
        </>
      }
      results={
        <>
          <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-3">
            <Plot series={[
              { name: tx('Passa-basso', 'Low-pass'), color: PLOT_COLORS[1], points: lpC },
              { name: tx('Passa-alto', 'High-pass'), color: PLOT_COLORS[0], points: hpC },
            ]} yLabel={tx('Ampiezza', 'Magnitude')} yUnit="dB" yMin={-30} yMax={3} />
          </div>
          <p className="text-[10px] text-zinc-600">{tx('LR (ordini pari) somma piatto e in fase. Mettere lo stadio a Q più alto dopo quello a Q più basso.', 'LR (even orders) sums flat & in-phase. Place higher-Q stage after lower-Q one.')}</p>
          <Disclaimer />
        </>
      }
    />
  );
}

// ─── #14 Linkwitz Transform ───────────────────────────────────────────────────
export function LinkwitzTransformCalc() {
  const { tx } = useCalcLang();
  const [f0, setF0] = useState<number | ''>(80);
  const [q0, setQ0] = useState<number | ''>(1.2);
  const [fp, setFp] = useState<number | ''>(30);
  const [qp, setQp] = useState<number | ''>(0.707);
  const grid = useMemo(() => A.logFreqGrid(10, 2000, 220), []);
  const curve = useMemo(() => A.linkwitzTransformCurve(f0 === '' ? 80 : f0, q0 === '' ? 1.2 : q0, fp === '' ? 30 : fp, qp === '' ? 0.707 : qp, grid), [f0, q0, fp, qp, grid]);
  const maxBoost = useMemo(() => A.linkwitzMaxBoost(f0 === '' ? 80 : f0, q0 === '' ? 1.2 : q0, fp === '' ? 30 : fp, qp === '' ? 0.707 : qp), [f0, q0, fp, qp]);
  return (
    <CalcShell
      title={tx('Linkwitz Transform', 'Linkwitz Transform')}
      subtitle={tx('Riallinea elettronicamente una cassa chiusa (f0,Q0 → fp,Qp).', 'Electronically reshape a sealed box (f0,Q0 → fp,Qp).')}
      inputs={
        <div className="grid grid-cols-2 gap-3">
          <NumField label={tx('f0 misurata', 'f0 measured')} unit="Hz" value={f0} onChange={setF0} />
          <NumField label={tx('Q0 misurata', 'Q0 measured')} value={q0} onChange={setQ0} />
          <NumField label={tx('fp target', 'fp target')} unit="Hz" value={fp} onChange={setFp} />
          <NumField label={tx('Qp target', 'Qp target')} value={qp} onChange={setQp} />
        </div>
      }
      results={
        <>
          <Stat label={tx('Boost massimo', 'Max boost')} value={A.round(maxBoost, 1)} unit="dB" accent />
          {maxBoost > 6 && (
            <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
              {tx('Boost elevato: serve molta potenza/escursione. Per limitare a ~6 dB usa fp = Fc/√2.', 'High boost: needs lots of power/excursion. To cap at ~6 dB use fp = Fc/√2.')}
            </div>
          )}
          <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-3">
            <Plot series={[{ name: tx('Boost', 'Boost'), color: PLOT_COLORS[0], points: curve }]} yLabel="Boost" yUnit="dB" />
          </div>
          <Disclaimer />
        </>
      }
    />
  );
}

// ─── #15 Time alignment / delay ───────────────────────────────────────────────
export function DelayCalc() {
  const { tx } = useCalcLang();
  const [path, setPath] = useState<number | ''>(60);
  const [fs, setFs] = useState<number | ''>(48000);
  const [temp, setTemp] = useState<number | ''>(20);
  const r = useMemo(() => A.delayFromPath(path === '' ? 60 : path, fs === '' ? 48000 : fs, temp === '' ? 20 : temp), [path, fs, temp]);
  return (
    <CalcShell
      title={tx('Time Alignment / Delay', 'Time Alignment / Delay')}
      subtitle={tx('Ritardo da differenza di percorso tra driver.', 'Delay from path difference between drivers.')}
      inputs={
        <div className="grid grid-cols-2 gap-3">
          <NumField label={tx('Differenza percorso', 'Path difference')} unit="mm" value={path} onChange={setPath} />
          <NumField label="Sample rate" unit="Hz" value={fs} onChange={setFs} />
          <NumField label={tx('Temperatura', 'Temperature')} unit="°C" value={temp} onChange={setTemp} />
        </div>
      }
      results={
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label={tx('Ritardo', 'Delay')} value={A.round(r.ms, 3)} unit="ms" accent />
            <Stat label={tx('Campioni', 'Samples')} value={r.samples} accent />
          </div>
          <p className="text-[10px] text-zinc-600">{tx('A 48 kHz: 1 ms ≈ 48 campioni ≈ 34,3 cm. Ritarda il driver più vicino.', 'At 48 kHz: 1 ms ≈ 48 samples ≈ 34.3 cm. Delay the closer driver.')}</p>
          <Disclaimer />
        </>
      }
    />
  );
}
