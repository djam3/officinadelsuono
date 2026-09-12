import { useMemo, useState } from 'react';
import { Speaker, Box, Ruler, LineChart } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { TabBar, Stat } from '../components/designer/ui';
import { DriverTab } from '../components/designer/DriverTab';
import { EnclosureTab, type EnclosureSettings } from '../components/designer/EnclosureTab';
import { DimensionsTab, type DimensionSettings } from '../components/designer/DimensionsTab';
import { ResponseTab, type ResponseSettings, type GraphKey } from '../components/designer/ResponseTab';
import {
  combineDrivers, completeTSParams, computeDesign, suggestEnclosure, toTSParams, validateTSParams,
  type DesignInput, type DriverConfig, type TSInput,
} from '../utils/audio';

type TabId = 'driver' | 'enclosure' | 'dimensions' | 'response';

/**
 * Woofer 12" di esempio, con parametri COERENTI FRA LORO: Vas discende da Fs,
 * Mms e Sd, e BL da Qes. I valori precedenti erano inventati e si
 * contraddicevano (Vas 60 L contro gli 86 implicati da Fs e Mms), quindi la
 * pagina partiva da un driver fisicamente impossibile.
 */
const DEFAULT_DRIVER: TSInput = {
  fs: 35, qts: 0.367, qes: 0.40, qms: 4.5, vas: 86,
  re: 5.6, le: 1.2, sd: 530, xmax: 6, mms: 95, bl: 17,
  pe: 400, impedance: 8,
};

const DEFAULT_ENCLOSURE: EnclosureSettings = {
  enclosure: 'vented',
  alignment: 'B4',
  targetQtc: 0.707,
  customVbL: '',
  customFbHz: '',
  portType: 'circular-flanged',
  portCount: 1,
  portDiameterMm: '',
  slotWidthMm: '',
  slotHeightMm: '',
  triLegAMm: '',
  triLegBMm: '',
  bandpassS: 0.7,
  prVasL: '',
  prSdCm2: '',
  prQms: '',
  prXmaxMm: '',
};

const DEFAULT_DIMENSIONS: DimensionSettings = {
  shape: 'rectangular',
  wallThicknessMm: 18,
  damping: 'normal',
  absorber: 'polyester',
  placement: 'lining',
  absorberDensityKgM3: '',
  liningThicknessMm: '',
  useGoldenRatio: true,
  fixedWidthMm: '',
  fixedHeightMm: '',
  taper: 0.6,
  bracingPercent: 3,
  mountingDepthMm: 120,
};

const ALL_GRAPHS: Record<GraphKey, boolean> = {
  spl: true, maxspl: true, power: false, excursion: true,
  vent: true, impedance: false, phase: false, delay: false,
};

const DEFAULT_RESPONSE: ResponseSettings = {
  powerW: 200,
  roomPreset: 'none',
  visible: ALL_GRAPHS,
};

const num = (v: number | '' | undefined): number | undefined =>
  typeof v === 'number' && isFinite(v) ? v : undefined;

export function CabinetDesigner() {
  useSEO({
    title: 'Progettazione Casse Acustiche — Calcolatore Thiele-Small',
    description: 'Calcolatore professionale per casse acustiche: parametri Thiele-Small, casse chiuse, bass-reflex, radiatore passivo e bandpass, con curve di risposta, SPL massimo e lista di taglio.',
    url: '/progetta-cassa',
  });

  const [tab, setTab] = useState<TabId>('driver');
  const [tsInput, setTsInput] = useState<TSInput>(DEFAULT_DRIVER);
  const [driverConfig, setDriverConfig] = useState<DriverConfig>({ count: 1, wiring: 'single' });
  const [enclosure, setEnclosure] = useState<EnclosureSettings>(DEFAULT_ENCLOSURE);
  const [dimensions, setDimensions] = useState<DimensionSettings>(DEFAULT_DIMENSIONS);
  const [response, setResponse] = useState<ResponseSettings>(DEFAULT_RESPONSE);

  // ── Catena di calcolo ────────────────────────────────────────────────────
  // la verifica lavora sui valori INSERITI: i derivati sono coerenti per costruzione
  const validation = useMemo(() => validateTSParams(tsInput), [tsInput]);
  const derivedParams = useMemo(() => completeTSParams(tsInput), [tsInput]);
  const baseTs = useMemo(() => toTSParams(derivedParams), [derivedParams]);
  const effective = useMemo(
    () => (baseTs ? combineDrivers(baseTs, driverConfig) : null),
    [baseTs, driverConfig],
  );
  const suggestion = useMemo(
    () => (effective ? suggestEnclosure(effective.ts) : null),
    [effective],
  );

  const design = useMemo(() => {
    if (!effective) return null;
    const input: DesignInput = {
      ts: effective.ts,
      enclosure: enclosure.enclosure,
      alignment: enclosure.alignment,
      targetQtc: num(enclosure.targetQtc),
      customVbL: num(enclosure.customVbL),
      customFbHz: num(enclosure.customFbHz),
      portType: enclosure.portType,
      portCount: num(enclosure.portCount) ?? 1,
      portDiameterMm: num(enclosure.portDiameterMm),
      slotWidthMm: num(enclosure.slotWidthMm),
      slotHeightMm: num(enclosure.slotHeightMm),
      triLegAMm: num(enclosure.triLegAMm),
      triLegBMm: num(enclosure.triLegBMm),
      bandpassS: num(enclosure.bandpassS),
      prVasL: num(enclosure.prVasL),
      prSdCm2: num(enclosure.prSdCm2),
      prQms: num(enclosure.prQms),
      prXmaxMm: num(enclosure.prXmaxMm),
      shape: dimensions.shape,
      wallThicknessMm: num(dimensions.wallThicknessMm) ?? 18,
      damping: dimensions.damping,
      absorber: dimensions.absorber,
      placement: dimensions.placement,
      absorberDensityKgM3: num(dimensions.absorberDensityKgM3),
      liningThicknessMm: num(dimensions.liningThicknessMm),
      useGoldenRatio: dimensions.useGoldenRatio,
      fixedWidthMm: num(dimensions.fixedWidthMm),
      fixedHeightMm: num(dimensions.fixedHeightMm),
      taper: num(dimensions.taper),
      bracingPercent: num(dimensions.bracingPercent),
      mountingDepthMm: num(dimensions.mountingDepthMm),
      // conta i driver FISICI, non i coni radianti: in un isobarico i cestelli
      // dentro la cassa sono due per ogni cono che irradia, e occupano volume
      driverCount: driverConfig.count,
      powerW: num(response.powerW) ?? 100,
      roomPreset: response.roomPreset,
    };
    return computeDesign(input);
  }, [effective, enclosure, dimensions, response.powerW, response.roomPreset]);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'driver', label: 'Driver', icon: <Speaker className="w-3.5 h-3.5" /> },
    { id: 'enclosure', label: 'Cassa', icon: <Box className="w-3.5 h-3.5" /> },
    { id: 'dimensions', label: 'Dimensioni', icon: <Ruler className="w-3.5 h-3.5" /> },
    { id: 'response', label: 'Grafici', icon: <LineChart className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 mb-5">
            <Box className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Strumento Tecnico</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3 uppercase">
            Progettazione <span className="text-brand-orange">Casse Acustiche</span>
          </h1>
          <p className="text-zinc-400 max-w-3xl">
            Inserisci i parametri Thiele-Small del driver e ottieni il progetto completo: volume, accordo,
            condotto, dimensioni, lista di taglio e curve di risposta.
          </p>
        </div>

        {/* Riepilogo sempre visibile */}
        {design && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            <Stat label="Volume netto" value={design.acoustic.vbL.toFixed(1)} unit="L" accent />
            {design.acoustic.fbHz !== undefined ? (
              <Stat label="Accordo Fb" value={Math.round(design.acoustic.fbHz)} unit="Hz" />
            ) : (
              <Stat label="Qtc" value={design.acoustic.qtc?.toFixed(2) ?? '—'} />
            )}
            <Stat label="F3" value={Math.round(design.acoustic.f3Hz)} unit="Hz" />
            <Stat
              label="Ingombro"
              value={
                design.dimensions.shape === 'cylindrical'
                  ? `Ø${design.dimensions.diameter}×${design.dimensions.height}`
                  : `${design.dimensions.width}×${design.dimensions.height}×${design.dimensions.depth}`
              }
              unit="mm"
            />
            <Stat
              label="SPL max"
              value={design.maxOutput ? design.maxOutput.peakSpl.toFixed(0) : '—'}
              unit={design.maxOutput ? 'dB' : undefined}
            />
          </div>
        )}

        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl overflow-hidden">
          <div className="px-5 pt-2">
            <TabBar<TabId> tabs={tabs} active={tab} onChange={id => setTab(id)} />
          </div>

          <div className="p-5 md:p-6">
            {tab === 'driver' && (
              <DriverTab
                input={tsInput}
                onChange={setTsInput}
                derived={derivedParams}
                validation={validation}
                config={driverConfig}
                onConfigChange={setDriverConfig}
                onAutoDerive={() => setTsInput(completeTSParams(tsInput))}
                configWarnings={effective?.warnings ?? []}
                effectiveSummary={{
                  impedance: effective?.totalImpedance ?? 0,
                  power: effective?.totalPower ?? 0,
                  sensitivityDelta: effective?.sensitivityDelta ?? 0,
                  cones: effective?.radiatingCones ?? 1,
                }}
              />
            )}

            {tab === 'enclosure' && (
              <EnclosureTab
                settings={enclosure}
                onChange={setEnclosure}
                suggestion={suggestion}
                acoustic={design?.acoustic ?? null}
              />
            )}

            {tab === 'dimensions' && (
              <DimensionsTab
                settings={dimensions}
                onChange={setDimensions}
                dimensions={design?.dimensions ?? null}
                volumes={design?.volumes ?? null}
                panels={design?.panels ?? []}
                panelAreaM2={design?.panelAreaM2 ?? 0}
                weightKg={design?.weightKg ?? 0}
                absorber={design?.absorber ?? null}
              />
            )}

            {tab === 'response' && (
              <ResponseTab
                settings={response}
                onChange={setResponse}
                design={design}
                ts={effective?.ts ?? null}
              />
            )}
          </div>
        </div>

        {!baseTs && (
          <p className="text-sm text-amber-500/90 mt-5">
            Servono almeno Fs, Qts (oppure Qes e Qms) e Vas per calcolare il progetto.
          </p>
        )}

        <p className="text-xs text-zinc-600 mt-6 leading-relaxed">
          Motore di calcolo basato sulle formule Thiele/Small pubblicate (Thiele 1961, Small 1972–73, Keele 1973,
          Bullock 1981, Dickason «Loudspeaker Design Cookbook»). Modello lineare small-signal, valido sotto i
          ~300 Hz: non simula distorsione, compressione di potenza, breakup del cono né l'acustica reale della
          stanza. Verifica sempre le misure prima del taglio.
        </p>
      </div>
    </div>
  );
}
