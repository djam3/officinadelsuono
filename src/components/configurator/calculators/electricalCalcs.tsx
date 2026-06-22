import React, { useMemo, useState } from 'react';
import { useCalcLang } from '../../../i18n/CalcLang';
import { NumField, SelectField, Stat, CalcShell, Disclaimer } from './ui';
import * as A from '../../../utils/audio';

// ─── #9 Amplifier power ───────────────────────────────────────────────────────
export function AmpPowerCalc() {
  const { tx } = useCalcLang();
  const [rated, setRated] = useState<number | ''>(200);
  const [ratedOhm, setRatedOhm] = useState<number | ''>(8);
  const [zout, setZout] = useState<number | ''>(0.02);
  const loads = [8, 4, 2];
  const table = useMemo(() => A.powerVsLoad(rated === '' ? 200 : rated, ratedOhm === '' ? 8 : ratedOhm, loads), [rated, ratedOhm]);
  const v = Math.sqrt((rated === '' ? 200 : rated) * (ratedOhm === '' ? 8 : ratedOhm));
  return (
    <CalcShell
      title={tx('Potenza Amplificatore', 'Amplifier Power')}
      subtitle={tx('P = V²/R, raddoppio impedenza, bridging, damping factor.', 'P = V²/R, impedance doubling, bridging, damping factor.')}
      inputs={
        <div className="grid grid-cols-2 gap-3">
          <NumField label={tx('Potenza nominale', 'Rated power')} unit="W" value={rated} onChange={setRated} />
          <NumField label={tx('a impedenza', 'at impedance')} unit="Ω" value={ratedOhm} onChange={setRatedOhm} />
          <NumField label={tx('Z uscita ampli', 'Amp output Z')} unit="Ω" value={zout} onChange={setZout} hint="0.01–0.1" />
        </div>
      }
      results={
        <>
          <div className="bg-zinc-950/60 border border-white/5 rounded-lg p-3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">{tx('Potenza ideale per carico', 'Ideal power per load')} (V = {A.round(v, 1)} V)</div>
            <div className="space-y-1">
              {table.map(r => (
                <div key={r.ohm} className="flex justify-between text-sm">
                  <span className="text-zinc-400">{r.ohm} Ω</span>
                  <span className="font-mono text-white">{A.round(r.watts, 0)} W</span>
                </div>
              ))}
              <div className="flex justify-between text-sm border-t border-white/5 pt-1 mt-1">
                <span className="text-zinc-400">{tx('Bridged @', 'Bridged @')} {ratedOhm} Ω</span>
                <span className="font-mono text-[#F27D26]">~{A.round(A.bridgedPower(rated === '' ? 200 : rated, ratedOhm === '' ? 8 : ratedOhm), 0)} W</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Damping factor" value={A.round(A.dampingFactor(ratedOhm === '' ? 8 : ratedOhm, zout === '' ? 0.02 : zout), 0)} accent />
            <Stat label={tx('Bridged "vede"', 'Bridged "sees"')} value={A.round(A.bridgedSeenImpedance(ratedOhm === '' ? 8 : ratedOhm), 1)} unit="Ω" />
          </div>
          <p className="text-[10px] text-zinc-600">{tx('Il raddoppio è teorico: l\'alimentazione cala sotto carico. Damping factor > 50–100 è di fatto inudibile (domina il cavo).', 'Doubling is theoretical: supply sags under load. Damping factor > 50–100 is effectively inaudible (cable dominates).')}</p>
          <Disclaimer />
        </>
      }
    />
  );
}

// ─── #10 SPL / headroom ───────────────────────────────────────────────────────
export function SplHeadroomCalc() {
  const { tx } = useCalcLang();
  const [sens, setSens] = useState<number | ''>(88);
  const [target, setTarget] = useState<number | ''>(105);
  const [dist, setDist] = useState<number | ''>(3);
  const [headroom, setHeadroom] = useState<number | ''>(15);
  const [boundary, setBoundary] = useState<number | ''>(0);
  const [power, setPower] = useState<number | ''>(100);
  const watts = useMemo(() => A.wattsForSpl(sens === '' ? 88 : sens, target === '' ? 105 : target, dist === '' ? 3 : dist, headroom === '' ? 0 : headroom, boundary === '' ? 0 : boundary), [sens, target, dist, headroom, boundary]);
  const spl = useMemo(() => A.splAt(sens === '' ? 88 : sens, power === '' ? 100 : power, dist === '' ? 3 : dist, boundary === '' ? 0 : boundary), [sens, power, dist, boundary]);
  return (
    <CalcShell
      title={tx('SPL / Headroom', 'SPL / Headroom')}
      subtitle={tx('Watt per un SPL target, con crest-factor/headroom.', 'Watts for a target SPL, with crest-factor/headroom.')}
      inputs={
        <div className="grid grid-cols-2 gap-3">
          <NumField label={tx('Sensibilità', 'Sensitivity')} unit="dB" value={sens} onChange={setSens} />
          <NumField label={tx('SPL target', 'Target SPL')} unit="dB" value={target} onChange={setTarget} />
          <NumField label={tx('Distanza', 'Distance')} unit="m" value={dist} onChange={setDist} />
          <NumField label="Headroom" unit="dB" value={headroom} onChange={setHeadroom} hint="12–20" />
          <NumField label={tx('Guadagno confine', 'Boundary gain')} unit="dB" value={boundary} onChange={setBoundary} />
          <NumField label={tx('Potenza (per SPL)', 'Power (for SPL)')} unit="W" value={power} onChange={setPower} />
        </div>
      }
      results={
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label={tx('Watt necessari', 'Watts needed')} value={A.round(watts, 0)} unit="W" accent />
            <Stat label={tx('SPL alla potenza data', 'SPL at given power')} value={A.round(spl, 1)} unit="dB" />
          </div>
          <p className="text-[10px] text-zinc-600">{tx('+3 dB = ×2 potenza; +10 dB = ×10 (raddoppio percepito). Picchi musicali 12–20 dB sopra la media.', '+3 dB = ×2 power; +10 dB = ×10 (perceived doubling). Music peaks 12–20 dB above average.')}</p>
          <Disclaimer />
        </>
      }
    />
  );
}

// ─── #11 Impedance / wiring ───────────────────────────────────────────────────
export function WiringCalc() {
  const { tx } = useCalcLang();
  const [scenario, setScenario] = useState<'multi' | 'dvc'>('multi');
  const [coil, setCoil] = useState<number | ''>(4);
  const [n, setN] = useState<number | ''>(2);
  const [wiring, setWiring] = useState<'series' | 'parallel'>('parallel');
  const [ampW, setAmpW] = useState<number | ''>(500);
  const [ampOhm, setAmpOhm] = useState<number | ''>(2);
  const load = useMemo(() => {
    if (scenario === 'dvc') return A.dvcLoad(coil === '' ? 4 : coil, wiring);
    return A.multiDriverLoad(coil === '' ? 4 : coil, n === '' ? 2 : n, wiring);
  }, [scenario, coil, n, wiring]);
  const powerAtLoad = useMemo(() => {
    const v = Math.sqrt((ampW === '' ? 500 : ampW) * (ampOhm === '' ? 2 : ampOhm));
    return A.power(v, load);
  }, [ampW, ampOhm, load]);
  return (
    <CalcShell
      title={tx('Impedenza / Cablaggio', 'Impedance / Wiring')}
      subtitle={tx('Serie/parallelo e subwoofer a doppia bobina (DVC).', 'Series/parallel and dual-voice-coil (DVC) subs.')}
      inputs={
        <>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label={tx('Scenario', 'Scenario')} value={scenario} onChange={v => setScenario(v as 'multi' | 'dvc')}
              options={[{ value: 'multi', label: tx('N driver uguali', 'N equal drivers') }, { value: 'dvc', label: tx('Sub doppia bobina', 'Dual-voice-coil sub') }]} />
            <SelectField label={tx('Cablaggio', 'Wiring')} value={wiring} onChange={v => setWiring(v as 'series' | 'parallel')}
              options={[{ value: 'parallel', label: tx('Parallelo', 'Parallel') }, { value: 'series', label: tx('Serie', 'Series') }]} />
            <NumField label={scenario === 'dvc' ? tx('Ω per bobina', 'Ω per coil') : tx('Ω per driver', 'Ω per driver')} unit="Ω" value={coil} onChange={setCoil} />
            {scenario === 'multi' && <NumField label={tx('N° driver', 'Drivers')} value={n} onChange={setN} />}
          </div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest pt-2">{tx('Ampli (per la potenza al carico)', 'Amp (for power at load)')}</div>
          <div className="grid grid-cols-2 gap-3">
            <NumField label={tx('Potenza nominale', 'Rated power')} unit="W" value={ampW} onChange={setAmpW} />
            <NumField label={tx('a impedenza', 'at impedance')} unit="Ω" value={ampOhm} onChange={setAmpOhm} />
          </div>
        </>
      }
      results={
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label={tx('Carico risultante', 'Resulting load')} value={A.round(load, 2)} unit="Ω" accent />
            <Stat label={tx('Potenza al carico', 'Power at load')} value={A.round(powerAtLoad, 0)} unit="W" accent />
          </div>
          {load < 1 && <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">{tx('Carico < 1 Ω: verifica la stabilità dell\'amplificatore!', 'Load < 1 Ω: check amplifier stability!')}</div>}
          <Disclaimer />
        </>
      }
    />
  );
}

// ─── #17 Wire gauge / fuse ────────────────────────────────────────────────────
export function WireGaugeCalc() {
  const { tx } = useCalcLang();
  const [rms, setRms] = useState<number | ''>(1000);
  const [eff, setEff] = useState<number | ''>(0.75);
  const [vsup, setVsup] = useState<number | ''>(13.8);
  const [len, setLen] = useState<number | ''>(5);
  const [drop, setDrop] = useState<number | ''>(3);
  const I = useMemo(() => A.currentDraw(rms === '' ? 1000 : rms, eff === '' ? 0.75 : eff, vsup === '' ? 13.8 : vsup), [rms, eff, vsup]);
  const wire = useMemo(() => A.recommendWireGauge(I, len === '' ? 5 : len, drop === '' ? 3 : drop, vsup === '' ? 13.8 : vsup), [I, len, drop, vsup]);
  const fuse = useMemo(() => A.recommendFuse(I), [I]);
  return (
    <CalcShell
      title={tx('Sezione Cavo / Fusibile (auto)', 'Wire Gauge / Fuse (car)')}
      subtitle={tx('Corrente assorbita → AWG (caduta tensione + cmil) e fusibile.', 'Current draw → AWG (voltage drop + cmil) and fuse.')}
      inputs={
        <div className="grid grid-cols-2 gap-3">
          <NumField label={tx('Potenza RMS totale', 'Total RMS power')} unit="W" value={rms} onChange={setRms} />
          <NumField label={tx('Efficienza', 'Efficiency')} value={eff} onChange={setEff} hint="0.75 D · 0.50 AB" />
          <NumField label={tx('Tensione', 'Supply voltage')} unit="V" value={vsup} onChange={setVsup} />
          <NumField label={tx('Lunghezza cavo', 'Cable length')} unit="m" value={len} onChange={setLen} />
          <NumField label={tx('Caduta max', 'Max drop')} unit="%" value={drop} onChange={setDrop} />
        </div>
      }
      results={
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label={tx('Corrente', 'Current')} value={A.round(I, 0)} unit="A" />
            <Stat label={tx('Sezione consigliata', 'Recommended gauge')} value={`${wire.awg} AWG`} accent />
            <Stat label={tx('Caduta tensione', 'Voltage drop')} value={A.round(wire.dropPct, 1)} unit="%" />
            <Stat label={tx('Fusibile', 'Fuse')} value={fuse} unit="A" accent />
          </div>
          <p className="text-[10px] text-zinc-600">{tx('Il fusibile protegge il cavo: mettilo vicino alla batteria. CCA ha ~50–60% più resistenza dell\'OFC.', 'The fuse protects the wire: place it near the battery. CCA has ~50–60% more resistance than OFC.')}</p>
          <Disclaimer />
        </>
      }
    />
  );
}

// ─── #16 Limiter threshold ────────────────────────────────────────────────────
export function LimiterCalc() {
  const { tx } = useCalcLang();
  const [rated, setRated] = useState<number | ''>(300);
  const [ohm, setOhm] = useState<number | ''>(8);
  const v = useMemo(() => A.limiterThreshold(rated === '' ? 300 : rated, ohm === '' ? 8 : ohm), [rated, ohm]);
  return (
    <CalcShell
      title={tx('Soglia Limiter', 'Limiter Threshold')}
      subtitle={tx('Limiter RMS dalla potenza nominale del driver: V = √(P·R).', 'RMS limiter from driver rated power: V = √(P·R).')}
      inputs={
        <div className="grid grid-cols-2 gap-3">
          <NumField label={tx('Potenza nominale driver', 'Driver rated power')} unit="W" value={rated} onChange={setRated} />
          <NumField label={tx('Impedenza', 'Impedance')} unit="Ω" value={ohm} onChange={setOhm} />
        </div>
      }
      results={
        <>
          <Stat label={tx('Soglia (tensione RMS)', 'Threshold (RMS voltage)')} value={A.round(v, 1)} unit="V" accent />
          <p className="text-[10px] text-zinc-600">{tx('Attacco/rilascio lenti per il limiter termico. Per casse vented aggiungi un subsonico ripido a/sotto Fb. Il clipping è ciò che brucia i tweeter.', 'Slow attack/release for the thermal limiter. For vented boxes add a steep subsonic at/below Fb. Clipping is what kills tweeters.')}</p>
          <Disclaimer />
        </>
      }
    />
  );
}
