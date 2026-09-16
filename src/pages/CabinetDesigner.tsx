import { useEffect, useMemo, useState } from 'react';
import { Speaker, Box, Ruler, LineChart } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { useProgettoSalvato } from '../hooks/useProgettoSalvato';
import { indirizzoProgetto, leggiProgetto, scriviProgetto } from '../utils/condivisione';
import { Annot, Griglia } from '../components/blueprint';
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
  bandpassGainDb: 0,
  dipoleFrame: 'h-frame',
  wingDepthMm: 300,
  dipoleTargetHz: '',
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
  // La scheda aperta non si ricorda: e' dove si sta guardando adesso, non una
  // scelta di progetto. Tutto il resto si', perche' compilarlo e' meta' del
  // lavoro e perderlo per un aggiornamento della pagina e' inaccettabile.
  const [tsInput, setTsInput, scordaDriver] = useProgettoSalvato<TSInput>('driver', DEFAULT_DRIVER);
  const [driverConfig, setDriverConfig, scordaConfig] = useProgettoSalvato<DriverConfig>('config', { count: 1, wiring: 'single' });
  const [enclosure, setEnclosure, scordaCassa] = useProgettoSalvato<EnclosureSettings>('cassa', DEFAULT_ENCLOSURE);
  const [dimensions, setDimensions, scordaMisure] = useProgettoSalvato<DimensionSettings>('misure', DEFAULT_DIMENSIONS);
  const [response, setResponse, scordaGrafici] = useProgettoSalvato<ResponseSettings>('grafici', DEFAULT_RESPONSE);

  const [avvisoLink, setAvvisoLink] = useState<string | null>(null);
  const [copiato, setCopiato] = useState(false);

  /**
   * Un progetto arrivato da un collegamento vince su quello salvato.
   *
   * Si legge una volta sola, al montaggio, e subito dopo il parametro viene
   * tolto dall'indirizzo: cosi' un aggiornamento della pagina non riapplica
   * il collegamento sopra le modifiche fatte nel frattempo, che sarebbe il
   * modo piu' sicuro di far perdere il lavoro a qualcuno.
   */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('p');
    if (!p) return;
    const letto = leggiProgetto(
      p,
      DEFAULT_DRIVER as unknown as Record<string, unknown>,
      DEFAULT_ENCLOSURE as unknown as Record<string, unknown>,
      DEFAULT_DIMENSIONS as unknown as Record<string, unknown>,
    );
    window.history.replaceState(null, '', window.location.pathname);
    if (!letto) {
      setAvvisoLink('Questo collegamento è di una versione diversa del calcolatore e non si può aprire.');
      return;
    }
    setTsInput(letto.driver as unknown as TSInput);
    setEnclosure(letto.cassa as unknown as EnclosureSettings);
    setDimensions(letto.misure as unknown as DimensionSettings);
    setAvvisoLink('Progetto aperto da un collegamento.');
  }, []);

  const condividi = async () => {
    const url = indirizzoProgetto(scriviProgetto(
      tsInput as unknown as Record<string, unknown>,
      enclosure as unknown as Record<string, unknown>,
      dimensions as unknown as Record<string, unknown>,
    ));
    try {
      await navigator.clipboard.writeText(url);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2500);
    } catch {
      // niente appunti (permesso negato, o pagina non sicura): l'indirizzo si
      // mette comunque nella barra, da dove si copia a mano
      window.history.replaceState(null, '', url.replace(window.location.origin, ''));
      setAvvisoLink('Non sono riuscito a copiare: il collegamento è nella barra degli indirizzi.');
    }
  };

  const ricomincia = () => {
    scordaDriver(); scordaConfig(); scordaCassa(); scordaMisure(); scordaGrafici();
    setTab('driver');
  };

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
      bandpassGainDb: num(enclosure.bandpassGainDb),
      dipoleFrame: enclosure.dipoleFrame,
      wingDepthMm: num(enclosure.wingDepthMm),
      dipoleTargetHz: num(enclosure.dipoleTargetHz),
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
    <div className="relative min-h-screen bg-ink text-paper pt-20 pb-24">
      <Griglia />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-baseline gap-3 mb-6">
            <Annot tone="blueprint">Tav. 10</Annot>
            <div className="quota flex-1 max-w-[200px]" aria-hidden />
            <Annot>Banco di progettazione</Annot>
          </div>
          <h1 className="titolo text-4xl md:text-6xl mb-4">
            Progettazione <span className="text-marker">casse acustiche</span>
          </h1>
          <p className="text-graphite max-w-3xl">
            Inserisci i parametri Thiele-Small del driver e ottieni il progetto completo: volume, accordo,
            condotto, dimensioni, lista di taglio e curve di risposta.
          </p>
          <p className="text-sm text-graphite mt-3">
            Non sai cosa scrivere in un campo? Accanto a ogni etichetta c’è una{' '}
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-paper/20 text-[9px] font-black align-middle">i</span>
            {' '}che apre la scheda di quel parametro, oppure vai al{' '}
            <a href="/glossario" className="text-marker hover:underline">glossario completo</a>.
          </p>
        </div>

        {/* Riepilogo sempre visibile */}
        {design && (
          <div className="riempi grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {/* su un pannello aperto non c'è volume: al suo posto va il numero
                che quel progetto ha davvero, cioè il percorso fronte-retro */}
            {design.openBaffle ? (
              <>
                <Stat label="Percorso" value={(design.openBaffle.dEffMm / 10).toFixed(0)} unit="cm" accent />
                <Stat label="Massimo dipolo" value={Math.round(design.openBaffle.fPeakHz)} unit="Hz" />
              </>
            ) : (
              <>
                <Stat label="Volume netto" value={design.acoustic.vbL.toFixed(1)} unit="L" accent />
                {design.acoustic.fbHz !== undefined ? (
                  <Stat label="Accordo Fb" value={Math.round(design.acoustic.fbHz)} unit="Hz" />
                ) : (
                  <Stat label="Qtc" value={design.acoustic.qtc?.toFixed(2) ?? '—'} />
                )}
              </>
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

        <div className="bg-ink-2/70 border border-paper/10 rounded-none overflow-hidden">
          <div className="px-5 pt-2 flex items-end justify-between gap-4">
            <TabBar<TabId> tabs={tabs} active={tab} onChange={id => setTab(id)} />
            {/* Il progetto resta in questo browser: va detto, o non si sa se
                si può chiudere la pagina. E se resta, ci vuole il modo di
                buttarlo via. */}
            <div className="hidden sm:flex items-center gap-3 pb-3 shrink-0">
              <span className="annot text-[9px]">Salvato in questo browser</span>
              <button
                type="button"
                onClick={condividi}
                className="annot text-[9px] hover:text-marker transition-colors underline underline-offset-4 decoration-paper/20"
              >
                {copiato ? 'Collegamento copiato' : 'Copia il collegamento'}
              </button>
              <button
                type="button"
                onClick={ricomincia}
                className="annot text-[9px] hover:text-marker transition-colors underline underline-offset-4 decoration-paper/20"
              >
                Ricomincia
              </button>
            </div>
          </div>

          {avvisoLink && (
            <p
              className="mx-5 mt-4 px-4 py-2.5 border border-marker/30 bg-marker/5 text-[12px] text-paper/90 flex items-center justify-between gap-4"
              role="status"
            >
              <span>{avvisoLink}</span>
              <button
                type="button"
                onClick={() => setAvvisoLink(null)}
                className="annot text-[9px] hover:text-marker transition-colors shrink-0"
                aria-label="Chiudi l&rsquo;avviso"
              >
                Chiudi
              </button>
            </p>
          )}

          <div className="p-5 md:p-6" role="tabpanel" id={`pannello-${tab}`} aria-labelledby={`scheda-${tab}`}>
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
                driverDiaMm={effective?.ts.sd ? 2 * Math.sqrt((effective.ts.sd / 1e4) / Math.PI) * 1000 : undefined}
                portGeometry={design?.acoustic.port?.geometry ?? null}
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

        <p className="text-xs text-graphite-dim mt-6 leading-relaxed">
          Motore di calcolo basato sulle formule Thiele/Small pubblicate (Thiele 1961, Small 1972–73, Keele 1973,
          Bullock 1981, Dickason «Loudspeaker Design Cookbook»). Modello lineare small-signal, valido sotto i
          ~300 Hz: non simula distorsione, compressione di potenza, breakup del cono né l'acustica reale della
          stanza. Verifica sempre le misure prima del taglio.
        </p>
      </div>
    </div>
  );
}
