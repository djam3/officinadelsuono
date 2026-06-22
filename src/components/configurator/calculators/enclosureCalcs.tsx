import React, { useMemo, useState } from 'react';
import { useCalcLang } from '../../../i18n/CalcLang';
import { NumField, SelectField, Stat, CalcShell, Disclaimer, Plot, PLOT_COLORS } from './ui';
import * as A from '../../../utils/audio';
import type { TSParams, AlignmentType } from '../../../utils/audio';

const DEFAULT_TS: TSParams = {
  fs: 30, qts: 0.4, qes: 0.45, qms: 4, vas: 80,
  re: 5.4, le: 1.5, sd: 510, xmax: 8, impedance: 8, pe: 400, sensitivity: 90,
};

// Sotto-form parametri T/S riusabile
function useTS(initial: Partial<TSParams> = {}) {
  const [ts, setTs] = useState<TSParams>({ ...DEFAULT_TS, ...initial });
  const set = (k: keyof TSParams) => (v: number | '') => setTs(t => ({ ...t, [k]: v === '' ? 0 : v }));
  return { ts, set };
}

function TSInputs({ ts, set, full = false }: { ts: TSParams; set: (k: keyof TSParams) => (v: number | '') => void; full?: boolean }) {
  const { tx } = useCalcLang();
  return (
    <div className="grid grid-cols-2 gap-3">
      <NumField label="Fs" unit="Hz" value={ts.fs} onChange={set('fs')} />
      <NumField label="Qts" value={ts.qts} onChange={set('qts')} />
      <NumField label="Qes" value={ts.qes} onChange={set('qes')} />
      <NumField label="Qms" value={ts.qms} onChange={set('qms')} />
      <NumField label="Vas" unit={tx('litri', 'liters')} value={ts.vas} onChange={set('vas')} />
      <NumField label="Sd" unit="cm²" value={ts.sd ?? 0} onChange={set('sd')} />
      <NumField label="Xmax" unit="mm" value={ts.xmax ?? 0} onChange={set('xmax')} />
      <NumField label="Re" unit="Ω" value={ts.re ?? 0} onChange={set('re')} />
      {full && <NumField label="Le" unit="mH" value={ts.le ?? 0} onChange={set('le')} />}
      {full && <NumField label="Pe" unit="W" value={ts.pe ?? 0} onChange={set('pe')} />}
    </div>
  );
}

// ─── #1 Thiele-Small ──────────────────────────────────────────────────────────
export function ThieleSmallCalc() {
  const { tx } = useCalcLang();
  const { ts, set } = useTS();
  const r = useMemo(() => {
    const qts = A.calcQts(ts.qms, ts.qes);
    const ebp = A.calcEBP(ts.fs, ts.qes);
    const rec = A.recommendEnclosure(ebp);
    const vd = A.calcVd(ts.sd ?? 0, ts.xmax ?? 0);
    const sens = A.calcSensitivity(ts.fs, ts.vas, ts.qes);
    const cms = A.calcCmsFromVas(ts.vas, ts.sd ?? 0);
    const mms = A.calcMmsFromFsCms(ts.fs, cms);
    return { qts, ebp, rec, vd, sens, cms, mms };
  }, [ts]);
  const recLabel = { sealed: tx('Cassa chiusa', 'Sealed'), vented: tx('Bass-reflex', 'Vented'), either: tx('Entrambe', 'Either') }[r.rec];
  return (
    <CalcShell
      title={tx('Calcolatore Thiele-Small', 'Thiele-Small Calculator')}
      subtitle={tx('Deriva i parametri e suggerisce il tipo di cassa (EBP).', 'Derive parameters and recommend the enclosure type (EBP).')}
      inputs={<><TSInputs ts={ts} set={set} full /></>}
      results={
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Qts" value={A.round(r.qts, 3)} accent />
            <Stat label="EBP" value={A.round(r.ebp, 0)} />
            <Stat label={tx('Cassa consigliata', 'Recommended')} value={recLabel} accent />
            <Stat label="Vd" value={A.round(r.vd, 0)} unit="cm³" />
            <Stat label={tx('Sensibilità', 'Sensitivity')} value={A.round(r.sens.splHalfSpace, 1)} unit="dB" />
            <Stat label="Mms" value={A.round(r.mms, 1)} unit="g" />
            <Stat label="Cms" value={A.round(r.cms, 3)} unit="mm/N" />
          </div>
          <p className="text-[10px] text-zinc-600">EBP &lt; 50 → {tx('cassa chiusa', 'sealed')}; 50–100 → {tx('entrambe', 'either')}; &gt; 100 → {tx('bass-reflex', 'vented')}.</p>
          <Disclaimer />
        </>
      }
    />
  );
}

// ─── #2 Sealed ────────────────────────────────────────────────────────────────
export function SealedCalc() {
  const { tx } = useCalcLang();
  const { ts, set } = useTS();
  const [mode, setMode] = useState<'qtc' | 'vb'>('qtc');
  const [targetQtc, setQtc] = useState<number | ''>(0.707);
  const [vb, setVb] = useState<number | ''>(40);
  const res = useMemo(() => {
    return mode === 'qtc'
      ? A.sealedFromQtc(ts, targetQtc === '' ? 0.707 : targetQtc)
      : A.sealedFromVb(ts, vb === '' ? 40 : vb);
  }, [ts, mode, targetQtc, vb]);
  const curve = useMemo(() => A.computeResponse({ ts, type: 'sealed', fc: res.fc, qtc: res.qtc }), [ts, res]);
  return (
    <CalcShell
      title={tx('Cassa Chiusa (Sealed)', 'Sealed Box')}
      subtitle={tx('Vb dal Qtc target (o Qtc dal Vb).', 'Vb from target Qtc (or Qtc from Vb).')}
      inputs={
        <>
          <TSInputs ts={ts} set={set} />
          <SelectField label={tx('Modalità', 'Mode')} value={mode} onChange={v => setMode(v as 'qtc' | 'vb')}
            options={[{ value: 'qtc', label: tx('Qtc target → Vb', 'Target Qtc → Vb') }, { value: 'vb', label: tx('Vb → Qtc', 'Vb → Qtc') }]} />
          {mode === 'qtc'
            ? <NumField label={tx('Qtc target', 'Target Qtc')} value={targetQtc} onChange={setQtc} hint={tx('0.707 = Butterworth (max piatto)', '0.707 = Butterworth (max flat)')} />
            : <NumField label="Vb" unit={tx('litri', 'liters')} value={vb} onChange={setVb} />}
        </>
      }
      results={
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Vb" value={A.round(res.vb, 1)} unit={tx('litri', 'L')} accent />
            <Stat label="Qtc" value={A.round(res.qtc, 3)} />
            <Stat label="Fc" value={A.round(res.fc, 1)} unit="Hz" />
            <Stat label="F3" value={A.round(res.f3, 1)} unit="Hz" accent />
            <Stat label="α (Vas/Vb)" value={A.round(res.alpha, 2)} />
            <Stat label={tx('Picco', 'Peak')} value={A.round(res.peakingDb, 1)} unit="dB" />
          </div>
          <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-3">
            <Plot series={[{ name: 'SPL', color: PLOT_COLORS[0], points: curve.spl }]} yLabel="SPL" yUnit="dB" />
          </div>
          <Disclaimer />
        </>
      }
    />
  );
}

// ─── #3 Vented ────────────────────────────────────────────────────────────────
export function VentedCalc() {
  const { tx } = useCalcLang();
  const { ts, set } = useTS();
  const [alignment, setAlignment] = useState<AlignmentType>('QB3');
  const [dv, setDv] = useState<number | ''>(80);
  const [np, setNp] = useState<number | ''>(1);
  const [k, setK] = useState<number | ''>(0.732);
  const res = useMemo(() => A.ventedDesign(ts, alignment, dv === '' ? 80 : dv, np === '' ? 1 : np, k === '' ? 0.732 : k), [ts, alignment, dv, np, k]);
  const curve = useMemo(() => A.computeResponse({ ts, type: 'vented', fb: res.fb, alpha: res.alpha, ql: 7 }), [ts, res]);
  const velHigh = res.portVelocity > 17;
  return (
    <CalcShell
      title={tx('Bass-Reflex (Vented)', 'Bass-Reflex (Vented)')}
      subtitle={tx('Allineamento, lunghezza porta e velocità aria.', 'Alignment, port length and air velocity.')}
      inputs={
        <>
          <TSInputs ts={ts} set={set} />
          <SelectField label={tx('Allineamento', 'Alignment')} value={alignment} onChange={v => setAlignment(v as AlignmentType)}
            options={['B4', 'QB3', 'C4', 'SBB4', 'BESSEL'].map(v => ({ value: v, label: v }))} />
          <div className="grid grid-cols-3 gap-3">
            <NumField label={tx('Ø porta', 'Port Ø')} unit="mm" value={dv} onChange={setDv} />
            <NumField label={tx('N° porte', 'Ports')} value={np} onChange={setNp} />
            <NumField label={tx('End-corr. k', 'End-corr. k')} value={k} onChange={setK} hint="0.614 / 0.732 / 0.850" />
          </div>
        </>
      }
      results={
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Vb" value={A.round(res.vb, 1)} unit={tx('litri', 'L')} accent />
            <Stat label="Fb" value={A.round(res.fb, 1)} unit="Hz" accent />
            <Stat label="F3" value={A.round(res.f3, 1)} unit="Hz" />
            <Stat label={tx('Lunghezza porta', 'Port length')} value={A.round(res.portLength, 0)} unit="mm" accent />
            <Stat label={tx('Velocità aria', 'Air velocity')} value={A.round(res.portVelocity, 1)} unit="m/s" />
            <Stat label={tx('Area min. (Small)', 'Min area (Small)')} value={A.round(res.minVentArea, 1)} unit="cm²" />
          </div>
          {velHigh && (
            <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
              {tx('Velocità > 17 m/s: rischio rumore di soffio. Aumenta Ø o numero porte.', 'Velocity > 17 m/s: chuffing risk. Increase port Ø or count.')}
            </div>
          )}
          <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-3">
            <Plot series={[{ name: 'SPL', color: PLOT_COLORS[0], points: curve.spl }]} yLabel="SPL" yUnit="dB" />
          </div>
          <Disclaimer />
        </>
      }
    />
  );
}

// ─── #7 Response engine (curve complete + max SPL) ────────────────────────────
export function ResponseEngineCalc() {
  const { tx } = useCalcLang();
  const { ts, set } = useTS();
  const [type, setType] = useState<'sealed' | 'vented'>('vented');
  const [power, setPower] = useState<number | ''>(200);
  const design = useMemo(() => {
    if (type === 'sealed') { const s = A.sealedFromQtc(ts, 0.707); return { fc: s.fc, qtc: s.qtc, fb: 0, alpha: s.alpha }; }
    const v = A.ventedDesign(ts, 'QB3', 80); return { fc: 0, qtc: 0, fb: v.fb, alpha: v.alpha };
  }, [ts, type]);
  const curves = useMemo(() => A.computeResponse({ ts, type, fc: design.fc, qtc: design.qtc, fb: design.fb, alpha: design.alpha, powerW: power === '' ? 200 : power }), [ts, type, design, power]);
  // Max SPL = min(thermale, limite escursione)
  const maxSpl = useMemo(() => {
    const thermal = (ts.sensitivity ?? 88) + 10 * Math.log10(ts.pe ?? 200);
    const rho = 1.2, sd = (ts.sd ?? 500) / 1e4, xmax = (ts.xmax ?? 6) / 1000;
    return curves.spl.map(p => {
      const pPeak = (rho * sd * xmax * Math.pow(2 * Math.PI * p.f, 2)) / (Math.SQRT2 * 2 * Math.PI * 1);
      const exSpl = 20 * Math.log10(pPeak / 20e-6);
      return { f: p.f, v: Math.min(thermal, exSpl) };
    });
  }, [ts, curves]);
  return (
    <CalcShell
      title={tx('Motore Risposta & Limiti', 'Response Engine & Limits')}
      subtitle={tx('SPL, impedenza, escursione, group delay e max SPL.', 'SPL, impedance, excursion, group delay and max SPL.')}
      inputs={
        <>
          <TSInputs ts={ts} set={set} full />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label={tx('Tipo cassa', 'Box type')} value={type} onChange={v => setType(v as 'sealed' | 'vented')}
              options={[{ value: 'vented', label: tx('Bass-reflex', 'Vented') }, { value: 'sealed', label: tx('Chiusa', 'Sealed') }]} />
            <NumField label={tx('Potenza', 'Power')} unit="W" value={power} onChange={setPower} />
          </div>
        </>
      }
      results={
        <>
          <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-3">
            <div className="text-[10px] text-zinc-500 mb-1">SPL (dB)</div>
            <Plot series={[{ name: 'SPL', color: PLOT_COLORS[0], points: curves.spl }]} />
          </div>
          <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-3">
            <div className="text-[10px] text-zinc-500 mb-1">{tx('Escursione', 'Excursion')} (mm) · {tx('Impedenza', 'Impedance')} (Ω)</div>
            <Plot series={[
              { name: tx('Escursione', 'Excursion'), color: PLOT_COLORS[2], points: curves.excursion },
              { name: tx('Impedenza', 'Impedance'), color: PLOT_COLORS[1], points: curves.impedance },
            ]} />
          </div>
          <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-3">
            <div className="text-[10px] text-zinc-500 mb-1">{tx('Max SPL & Group delay', 'Max SPL & Group delay')}</div>
            <Plot series={[
              { name: 'Max SPL (dB)', color: PLOT_COLORS[0], points: maxSpl },
              { name: 'Group delay (ms)', color: PLOT_COLORS[3], points: curves.groupDelay },
            ]} />
          </div>
          <Disclaimer />
        </>
      }
    />
  );
}

// ─── #4 Passive radiator ──────────────────────────────────────────────────────
export function PassiveRadiatorCalc() {
  const { tx } = useCalcLang();
  const [vb, setVb] = useState<number | ''>(40);
  const [fb, setFb] = useState<number | ''>(28);
  const [prVas, setPrVas] = useState<number | ''>(60);
  const [prSd, setPrSd] = useState<number | ''>(520);
  const r = useMemo(() => A.passiveRadiatorTuning({ vbL: vb === '' ? 40 : vb, fbTarget: fb === '' ? 28 : fb, prVasL: prVas === '' ? 60 : prVas, prSdCm2: prSd === '' ? 520 : prSd }), [vb, fb, prVas, prSd]);
  return (
    <CalcShell
      title={tx('Radiatore Passivo (PR)', 'Passive Radiator (PR)')}
      subtitle={tx('Accordo per massa aggiunta (Fb = 1/2π√(Cmsr·Mres)).', 'Added-mass tuning (Fb = 1/2π√(Cmsr·Mres)).')}
      inputs={
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Vb" unit={tx('litri', 'L')} value={vb} onChange={setVb} />
          <NumField label={tx('Fb target', 'Target Fb')} unit="Hz" value={fb} onChange={setFb} />
          <NumField label="Vas PR" unit={tx('litri', 'L')} value={prVas} onChange={setPrVas} />
          <NumField label="Sd PR" unit="cm²" value={prSd} onChange={setPrSd} />
        </div>
      }
      results={
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label={tx('Massa totale PR', 'Total PR mass')} value={A.round(r.totalMassG, 0)} unit="g" accent />
            <Stat label="Cmsr" value={r.cmsr.toExponential(2)} unit="m/N" />
          </div>
          <p className="text-[10px] text-zinc-600">{tx('Il PR deve avere Sd ≥ del driver attivo e Xmax maggiore (il PR si muove di più). Più massa → Fb più basso.', 'PR should have Sd ≥ active driver and greater Xmax (PR moves more). More mass → lower Fb.')}</p>
          <Disclaimer />
        </>
      }
    />
  );
}

// ─── #5 Bandpass ──────────────────────────────────────────────────────────────
export function BandpassCalc() {
  const { tx } = useCalcLang();
  const { ts, set } = useTS();
  const [S, setS] = useState<number | ''>(0.7);
  const [alpha, setAlpha] = useState<number | ''>(0.7);
  const [dv, setDv] = useState<number | ''>(80);
  const r = useMemo(() => A.bandpass4thOrder(ts, { S: S === '' ? 0.7 : S, alpha: alpha === '' ? 0.7 : alpha, dvMm: dv === '' ? 80 : dv }), [ts, S, alpha, dv]);
  return (
    <CalcShell
      title={tx('Bandpass 4° ordine', '4th-order Bandpass')}
      subtitle={tx('Camera sigillata + camera ported. S=Vf/Vr (~0.7 piatto).', 'Sealed + ported chamber. S=Vf/Vr (~0.7 flat).')}
      inputs={
        <>
          <TSInputs ts={ts} set={set} />
          <div className="grid grid-cols-3 gap-3">
            <NumField label="S = Vf/Vr" value={S} onChange={setS} />
            <NumField label="α = Vas/Vr" value={alpha} onChange={setAlpha} />
            <NumField label={tx('Ø porta', 'Port Ø')} unit="mm" value={dv} onChange={setDv} />
          </div>
        </>
      }
      results={
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Vr (sigillata)" value={A.round(r.vrL, 1)} unit={tx('litri', 'L')} />
            <Stat label="Vf (ported)" value={A.round(r.vfL, 1)} unit={tx('litri', 'L')} />
            <Stat label="Fb" value={A.round(r.fb, 1)} unit="Hz" accent />
            <Stat label={tx('Lunghezza porta', 'Port length')} value={A.round(r.portLengthMm, 0)} unit="mm" />
            <Stat label="fL" value={A.round(r.fL, 1)} unit="Hz" />
            <Stat label="fH" value={A.round(r.fH, 1)} unit="Hz" />
          </div>
          <Disclaimer />
        </>
      }
    />
  );
}

// ─── #6 TL / Horn ─────────────────────────────────────────────────────────────
export function TlHornCalc() {
  const { tx } = useCalcLang();
  const [mode, setMode] = useState<'tl' | 'horn'>('tl');
  const [tlFreq, setTlFreq] = useState<number | ''>(35);
  const [fc, setFc] = useState<number | ''>(60);
  const [throat, setThroat] = useState<number | ''>(500);
  const [sd, setSd] = useState<number | ''>(500);
  const tl = useMemo(() => A.tlLength(tlFreq === '' ? 35 : tlFreq), [tlFreq]);
  const horn = useMemo(() => {
    const f = fc === '' ? 60 : fc;
    const flare = A.hornFlare(f);
    const mouthM2 = A.hornMouthArea(f, 'half');
    return { flare, mouthCm2: mouthM2 * 1e4, cr: A.hornCompressionRatio(sd === '' ? 500 : sd, throat === '' ? 500 : throat), length: A.hornLength(throat === '' ? 500 : throat, mouthM2 * 1e4, flare) };
  }, [fc, throat, sd]);
  return (
    <CalcShell
      title={tx('Linea di Trasmissione / Horn', 'Transmission Line / Horn')}
      subtitle={tx('Avanzato: lunghezza linea, flare e bocca horn.', 'Advanced: line length, flare and horn mouth.')}
      inputs={
        <>
          <SelectField label={tx('Tipo', 'Type')} value={mode} onChange={v => setMode(v as 'tl' | 'horn')}
            options={[{ value: 'tl', label: tx('Linea di trasmissione', 'Transmission line') }, { value: 'horn', label: 'Horn' }]} />
          {mode === 'tl'
            ? <NumField label={tx('Frequenza target', 'Target frequency')} unit="Hz" value={tlFreq} onChange={setTlFreq} />
            : <div className="grid grid-cols-3 gap-3">
                <NumField label="Fc" unit="Hz" value={fc} onChange={setFc} />
                <NumField label={tx('Gola St', 'Throat St')} unit="cm²" value={throat} onChange={setThroat} />
                <NumField label="Sd" unit="cm²" value={sd} onChange={setSd} />
              </div>}
        </>
      }
      results={
        mode === 'tl'
          ? <><div className="grid grid-cols-1 gap-3"><Stat label={tx('Lunghezza linea (¼ λ)', 'Line length (¼ λ)')} value={A.round(tl, 2)} unit="m" accent /></div>
              <p className="text-[10px] text-zinc-600">{tx('Driver a ⅓–¼ della linea; taper 1:3–1:4; stuffing nei primi ½–⅔.', 'Driver at ⅓–¼ of line; taper 1:3–1:4; stuffing in first ½–⅔.')}</p><Disclaimer /></>
          : <><div className="grid grid-cols-2 gap-3">
              <Stat label={tx('Flare m', 'Flare m')} value={A.round(horn.flare, 2)} unit="1/m" />
              <Stat label={tx('Area bocca', 'Mouth area')} value={A.round(horn.mouthCm2, 0)} unit="cm²" accent />
              <Stat label={tx('Compressione', 'Compression')} value={`${A.round(horn.cr, 1)}:1`} />
              <Stat label={tx('Lunghezza horn', 'Horn length')} value={A.round(horn.length, 2)} unit="m" />
            </div><Disclaimer /></>
      }
    />
  );
}

// ─── #18 Environment & construction ───────────────────────────────────────────
export function EnvironmentCalc() {
  const { tx } = useCalcLang();
  const [temp, setTemp] = useState<number | ''>(20);
  const [space, setSpace] = useState<'full' | 'half' | 'quarter' | 'eighth'>('half');
  const [gross, setGross] = useState<number | ''>(50);
  const [driverDisp, setDriverDisp] = useState<number | ''>(2);
  const [portDisp, setPortDisp] = useState<number | ''>(1);
  const [braceDisp, setBraceDisp] = useState<number | ''>(0.5);
  const [roomDim, setRoomDim] = useState<number | ''>(5);
  const [fill, setFill] = useState(false);
  const net = useMemo(() => A.netVolume(gross === '' ? 50 : gross, { driver: driverDisp === '' ? 0 : driverDisp, port: portDisp === '' ? 0 : portDisp, bracing: braceDisp === '' ? 0 : braceDisp }), [gross, driverDisp, portDisp, braceDisp]);
  const eff = fill ? A.effectiveSealedVolume(net) : net;
  return (
    <CalcShell
      title={tx('Ambiente & Costruzione', 'Environment & Construction')}
      subtitle={tx('Velocità suono, spazio di carico, volume netto, stuffing.', 'Speed of sound, loading space, net volume, stuffing.')}
      inputs={
        <>
          <div className="grid grid-cols-2 gap-3">
            <NumField label={tx('Temperatura', 'Temperature')} unit="°C" value={temp} onChange={setTemp} />
            <SelectField label={tx('Spazio di carico', 'Loading space')} value={space} onChange={v => setSpace(v as 'full' | 'half' | 'quarter' | 'eighth')}
              options={[{ value: 'full', label: tx('Pieno (4π)', 'Full (4π)') }, { value: 'half', label: tx('Metà (2π)', 'Half (2π)') }, { value: 'quarter', label: tx('Quarto', 'Quarter') }, { value: 'eighth', label: tx('Angolo (⅛)', 'Corner (⅛)') }]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumField label={tx('Volume lordo', 'Gross volume')} unit={tx('litri', 'L')} value={gross} onChange={setGross} />
            <NumField label={tx('Ingombro driver', 'Driver disp.')} unit={tx('litri', 'L')} value={driverDisp} onChange={setDriverDisp} />
            <NumField label={tx('Ingombro porta', 'Port disp.')} unit={tx('litri', 'L')} value={portDisp} onChange={setPortDisp} />
            <NumField label={tx('Ingombro rinforzi', 'Bracing disp.')} unit={tx('litri', 'L')} value={braceDisp} onChange={setBraceDisp} />
            <NumField label={tx('Dimensione stanza', 'Room dimension')} unit="m" value={roomDim} onChange={setRoomDim} />
          </div>
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input type="checkbox" checked={fill} onChange={e => setFill(e.target.checked)} className="accent-[#F27D26]" />
            {tx('Cassa chiusa con stuffing (+17% Vb efficace)', 'Sealed with stuffing (+17% effective Vb)')}
          </label>
        </>
      }
      results={
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label={tx('Velocità suono', 'Speed of sound')} value={A.round(A.speedOfSound(temp === '' ? 20 : temp), 1)} unit="m/s" />
            <Stat label={tx('Guadagno confine', 'Boundary gain')} value={`+${A.boundaryGain(space)}`} unit="dB" accent />
            <Stat label={tx('Volume netto', 'Net volume')} value={A.round(net, 1)} unit={tx('litri', 'L')} accent />
            <Stat label={tx('Volume efficace', 'Effective volume')} value={A.round(eff, 1)} unit={tx('litri', 'L')} />
            <Stat label={tx('Onset room gain', 'Room gain onset')} value={A.round(A.roomGainOnset(roomDim === '' ? 5 : roomDim), 0)} unit="Hz" />
          </div>
          <Disclaimer />
        </>
      }
    />
  );
}
