import { useMemo, useState } from 'react';
import { Box, Wind, Wand2 } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { NumField, SelectField, Stat, CalcShell, Plot, PLOT_COLORS } from '../components/CalcUI';
import {
  sealedFromQtc, ventedDesign, computeResponse,
  type TSParams, type AlignmentType,
} from '../utils/audio';

type EnclosureType = 'sealed' | 'vented';

const ALIGNMENT_OPTIONS: { value: AlignmentType; label: string }[] = [
  { value: 'QB3', label: 'QB3 (box compatta, Qts basso)' },
  { value: 'B4', label: 'B4 — Butterworth (bilanciato)' },
  { value: 'C4', label: 'C4 — Chebyshev (bassi estesi)' },
  { value: 'SBB4', label: 'SBB4 (accordo = Fs)' },
  { value: 'BESSEL', label: 'Bessel (transienti puliti)' },
];

const PORT_DIAMETERS = [50, 65, 80, 100, 120, 150, 180]; // mm
const MAX_PORT_VELOCITY = 17; // m/s — oltre si sente il rumore d'aria ("chuffing")

/** Dimensioni esterne stimate (proporzioni auree) dal volume netto */
function boxDimensionsFromVolume(volumeLiters: number, wallThicknessMm: number) {
  const volumeMm3 = volumeLiters * 1e6;
  const RATIO_H = 1.26;
  const RATIO_D = 1.618;
  const w = Math.cbrt(volumeMm3 / (RATIO_H * RATIO_D));
  const h = w * RATIO_H;
  const d = w * RATIO_D;
  return {
    width: Math.round(w + 2 * wallThicknessMm),
    height: Math.round(h + 2 * wallThicknessMm),
    depth: Math.round(d + 2 * wallThicknessMm),
  };
}

export function CabinetDesigner() {
  useSEO({
    title: 'Calcolatore Casse Acustiche — Chiusa e Bass-Reflex',
    description: 'Calcola il volume, la porta bass-reflex e le dimensioni della cassa acustica a partire dai parametri Thiele-Small del driver.',
    url: '/progetta-cassa',
  });

  // ── Parametri Thiele-Small del driver ────────────────────────────────────
  const [fs, setFs] = useState<number | ''>(35);
  const [qts, setQts] = useState<number | ''>(0.35);
  const [vas, setVas] = useState<number | ''>(60);
  const [xmax, setXmax] = useState<number | ''>(6);
  const [sd, setSd] = useState<number | ''>(530);

  // ── Impostazioni cassa ────────────────────────────────────────────────────
  const [enclosureType, setEnclosureType] = useState<EnclosureType>('vented');
  const [targetQtc, setTargetQtc] = useState<number | ''>(0.707);
  const [alignment, setAlignment] = useState<AlignmentType>('QB3');
  const [portCount, setPortCount] = useState<number | ''>(1);
  const [wallThickness, setWallThickness] = useState<number | ''>(18);

  const ts: TSParams | null = useMemo(() => {
    if (fs === '' || qts === '' || vas === '') return null;
    return {
      fs: Number(fs), qts: Number(qts), qes: Number(qts), qms: Number(qts) * 10,
      vas: Number(vas),
      sd: sd === '' ? undefined : Number(sd),
      xmax: xmax === '' ? undefined : Number(xmax),
    };
  }, [fs, qts, vas, sd, xmax]);

  const sealedResult = useMemo(() => {
    if (!ts || enclosureType !== 'sealed' || targetQtc === '') return null;
    return sealedFromQtc(ts, Number(targetQtc));
  }, [ts, enclosureType, targetQtc]);

  const ventedResult = useMemo(() => {
    if (!ts || enclosureType !== 'vented') return null;
    const np = portCount === '' ? 1 : Number(portCount);
    // sceglie il diametro più piccolo che tiene la velocità ≤ 17 m/s
    let chosen = ventedDesign(ts, alignment, PORT_DIAMETERS[PORT_DIAMETERS.length - 1], np);
    for (const dv of PORT_DIAMETERS) {
      const test = ventedDesign(ts, alignment, dv, np);
      if (test.portVelocity <= MAX_PORT_VELOCITY) { chosen = test; break; }
    }
    return chosen;
  }, [ts, enclosureType, alignment, portCount]);

  const netVolume = sealedResult?.vb ?? ventedResult?.vb ?? null;

  const dimensions = useMemo(() => {
    if (netVolume == null || wallThickness === '') return null;
    return boxDimensionsFromVolume(netVolume, Number(wallThickness));
  }, [netVolume, wallThickness]);

  const responseCurve = useMemo(() => {
    if (!ts) return null;
    if (enclosureType === 'sealed' && sealedResult) {
      return computeResponse({ ts, type: 'sealed', fc: sealedResult.fc, qtc: sealedResult.qtc, fMin: 15, fMax: 500 });
    }
    if (enclosureType === 'vented' && ventedResult) {
      return computeResponse({ ts, type: 'vented', fb: ventedResult.fb, alpha: ventedResult.alpha, fMin: 15, fMax: 500 });
    }
    return null;
  }, [ts, enclosureType, sealedResult, ventedResult]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 mb-6">
            <Box className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Strumento Tecnico</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 uppercase">
            Calcolatore <span className="text-brand-orange">Casse Acustiche</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Inserisci i parametri Thiele-Small del driver e ottieni il progetto della cassa: volume, porta bass-reflex e dimensioni finali.
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 md:p-10">
          <CalcShell
            title="Parametri Driver & Cassa"
            inputs={
              <>
                <NumField label="Fs — Frequenza di risonanza" unit="Hz" value={fs} onChange={setFs} />
                <NumField label="Qts — Q totale" value={qts} onChange={setQts} step={0.01} />
                <NumField label="Vas — Volume equivalente" unit="litri" value={vas} onChange={setVas} />
                <NumField label="Sd — Area radiante (opzionale, per velocità porta)" unit="cm²" value={sd} onChange={setSd} />
                <NumField label="Xmax — Escursione lineare (opzionale)" unit="mm" value={xmax} onChange={setXmax} />

                <div className="pt-2">
                  <SelectField
                    label="Tipo di cassa"
                    value={enclosureType}
                    onChange={v => setEnclosureType(v as EnclosureType)}
                    options={[
                      { value: 'vented', label: 'Bass-Reflex' },
                      { value: 'sealed', label: 'Chiusa (sealed)' },
                    ]}
                  />
                </div>

                {enclosureType === 'sealed' && (
                  <NumField label="Qtc obiettivo" value={targetQtc} onChange={setTargetQtc} step={0.01} hint="0.707 = Butterworth, massimamente piatto" />
                )}

                {enclosureType === 'vented' && (
                  <>
                    <SelectField label="Allineamento" value={alignment} onChange={v => setAlignment(v as AlignmentType)} options={ALIGNMENT_OPTIONS} />
                    <NumField label="Numero di porte" value={portCount} onChange={setPortCount} min={1} />
                  </>
                )}

                <NumField label="Spessore pannelli" unit="mm" value={wallThickness} onChange={setWallThickness} />
              </>
            }
            results={
              <>
                {!ts && (
                  <p className="text-sm text-zinc-500 italic">Inserisci Fs, Qts e Vas per calcolare il progetto.</p>
                )}

                {ts && enclosureType === 'sealed' && sealedResult && (
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="Volume netto" value={sealedResult.vb.toFixed(1)} unit="L" accent />
                    <Stat label="Qtc risultante" value={sealedResult.qtc.toFixed(2)} />
                    <Stat label="F3 (-3dB)" value={Math.round(sealedResult.f3)} unit="Hz" />
                    <Stat label="Picco risonanza" value={sealedResult.peakingDb.toFixed(1)} unit="dB" />
                  </div>
                )}

                {ts && enclosureType === 'vented' && ventedResult && (
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="Volume netto" value={ventedResult.vb.toFixed(1)} unit="L" accent />
                    <Stat label="Fb — Accordo porta" value={Math.round(ventedResult.fb)} unit="Hz" />
                    <Stat label="F3 (-3dB)" value={Math.round(ventedResult.f3)} unit="Hz" />
                    <Stat label="Diametro porta" value={ventedResult.portDiameter} unit="mm" />
                    <Stat label="Lunghezza porta" value={Math.round(ventedResult.portLength)} unit="mm" />
                    <Stat
                      label="Velocità aria in porta"
                      value={ventedResult.portVelocity.toFixed(1)}
                      unit="m/s"
                      accent={ventedResult.portVelocity > MAX_PORT_VELOCITY}
                    />
                    {ventedResult.portVelocity > MAX_PORT_VELOCITY && (
                      <p className="col-span-2 text-xs text-amber-500 flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 shrink-0" /> Velocità alta: rischio di rumore d'aria ("chuffing"). Aumenta numero o diametro porte.
                      </p>
                    )}
                  </div>
                )}

                {dimensions && (
                  <div className="pt-2 border-t border-white/5">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" /> Box finale suggerito (proporzioni auree)
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Stat label="Larghezza" value={dimensions.width} unit="mm" />
                      <Stat label="Altezza" value={dimensions.height} unit="mm" />
                      <Stat label="Profondità" value={dimensions.depth} unit="mm" />
                    </div>
                  </div>
                )}
              </>
            }
          />

          {responseCurve && (
            <div className="mt-8 pt-8 border-t border-white/5">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 mb-4">Risposta in Frequenza Stimata</h3>
              <Plot series={[{ name: 'SPL', color: PLOT_COLORS[0], points: responseCurve.spl }]} yLabel="SPL relativo" yUnit="dB" />
            </div>
          )}
        </div>

        <p className="text-xs text-zinc-600 mt-6 text-center max-w-2xl mx-auto">
          Calcoli basati sulle formule Thiele/Small standard del settore. Modello lineare "small-signal", valido sotto ~300 Hz: non considera distorsione, compressione di potenza o acustica dell'ambiente reale.
        </p>
      </div>
    </div>
  );
}
