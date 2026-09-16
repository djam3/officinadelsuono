/**
 * Configuratore di impianto: amplificatore, carico, cavi, alimentazione.
 *
 * Risponde alla domanda che si fa per prima — «per questo amplificatore che
 * cavo ci vuole?» — ma la scompone nelle quattro che contano davvero, perché
 * la risposta cambia completamente a seconda di quale si sta facendo: il cavo
 * verso i diffusori, quello di rete, la protezione e il calore sono quattro
 * problemi diversi con quattro criteri diversi.
 */

import { useMemo, useState } from 'react';
import { Zap, Speaker, Cable, Gauge } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { useProgettoSalvato } from '../hooks/useProgettoSalvato';
import { Annot, Griglia } from '../components/blueprint';
import {
  TabBar, Stat, Section, NumField, SelectField, CheckField, Warnings, InfoLink,
} from '../components/designer/ui';
import {
  AMP_CLASSES, CREST, DUTY, PORTATA_FLESSIBILI, SEZIONI,
  checkLoad, computeCable, computeLoad, computeMains, computePower,
  constantVoltageLine, gainStructure, minSection, sezioneRete, shiftedQ,
  type AmpClass, type Conductor, type CrestKind, type DutyKind, type Wiring,
} from '../utils/amp';

type TabId = 'ampli' | 'diffusori' | 'cavi' | 'risultati';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'ampli', label: 'Amplificatore', icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'diffusori', label: 'Diffusori', icon: <Speaker className="w-3.5 h-3.5" /> },
  { id: 'cavi', label: 'Cavi', icon: <Cable className="w-3.5 h-3.5" /> },
  { id: 'risultati', label: 'Risultati', icon: <Gauge className="w-3.5 h-3.5" /> },
];

interface Settings {
  // amplificatore
  powerW: number | '';
  ampClass: AmpClass;
  ampMinOhm: number | '';
  bridged: boolean;
  inputSensV: number | '';
  duty: DutyKind;
  units: number | '';
  // diffusori
  count: number | '';
  wiring: Wiring;
  perBranch: number | '';
  nominalOhm: number | '';
  minOhm: number | '';
  speakerPeW: number | '';
  sensitivityDb: number | '';
  distanceM: number | '';
  crest: CrestKind;
  halfSpace: boolean;
  // driver, per lo spostamento del Q
  driverRe: number | '';
  driverQes: number | '';
  driverQms: number | '';
  // cavi
  spkLengthM: number | '';
  spkSectionMm2: number;
  spkMaterial: Conductor;
  mainsLengthM: number | '';
  mainsSectionMm2: number;
  // linea 100 V
  useLine: boolean;
  lineV: number;
  lineTapsW: number | '';
}

const DEFAULTS: Settings = {
  powerW: 1000, ampClass: 'd', ampMinOhm: 4, bridged: false, inputSensV: 1.4,
  duty: 'ottavo', units: 1,
  count: 2, wiring: 'parallelo', perBranch: 2, nominalOhm: 8, minOhm: 6.4,
  speakerPeW: 400, sensitivityDb: 97, distanceM: 10, crest: 'pop', halfSpace: false,
  driverRe: 5.6, driverQes: 0.38, driverQms: 4.5,
  spkLengthM: 15, spkSectionMm2: 2.5, spkMaterial: 'rame',
  mainsLengthM: 10, mainsSectionMm2: 1.5,
  useLine: false, lineV: 100, lineTapsW: 400,
};

const num = (v: number | '') => (v === '' ? undefined : v);
const val = (v: number | '', fallback: number) => (v === '' ? fallback : v);

export function AmpDesigner() {
  useSEO({
    title: 'Configuratore impianto: amplificatore, carico, cavi',
    description:
      'Calcola sezione dei cavi, impedenza di carico, SPL, assorbimento di rete e protezione per un impianto audio. Fisica derivata e verificata, non tabelle copiate.',
    url: '/configura-impianto',
  });

  const [tab, setTab] = useState<TabId>('ampli');
  const [s, setS, ricomincia] = useProgettoSalvato<Settings>('impianto', DEFAULTS);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS(p => ({ ...p, [k]: v }));

  const calc = useMemo(() => {
    const load = computeLoad({
      count: val(s.count, 1),
      wiring: s.wiring,
      nominalOhm: val(s.nominalOhm, 8),
      minOhm: num(s.minOhm),
      perBranch: num(s.perBranch),
      bridged: s.bridged,
    });
    const loadCheck = checkLoad(load, val(s.ampMinOhm, 4));

    const cable = computeCable({
      lengthM: val(s.spkLengthM, 0),
      sectionMm2: s.spkSectionMm2,
      material: s.spkMaterial,
      loadOhm: load.seenMinOhm,
      powerW: val(s.powerW, 0),
    });
    const cableMin = minSection(val(s.spkLengthM, 0), load.seenMinOhm, 0.05, s.spkMaterial);
    const qShift = shiftedQ(
      val(s.driverQes, 0.38), val(s.driverQms, 4.5), val(s.driverRe, 5.6), cable.loopOhm,
    );

    const power = computePower({
      ampPowerW: val(s.powerW, 0),
      speakerPeW: val(s.speakerPeW, 1),
      sensitivityDb: val(s.sensitivityDb, 90),
      loadOhm: load.seenOhm,
      distanceM: val(s.distanceM, 1),
      count: val(s.count, 1),
      crest: s.crest,
      cableLossDb: cable.lossDb,
      halfSpace: s.halfSpace,
    });
    const gain = gainStructure(val(s.powerW, 0), load.seenOhm, val(s.inputSensV, 1.4));

    const mains = computeMains({
      outputPowerW: val(s.powerW, 0),
      ampClass: s.ampClass,
      duty: s.duty,
      cableLengthM: val(s.mainsLengthM, 0),
      cableSectionMm2: s.mainsSectionMm2,
      units: val(s.units, 1),
    });
    const mainsSection = sezioneRete(mains.requiredAmpacityA, mains.minSectionMm2);

    const line = s.useLine
      ? constantVoltageLine(s.lineV, [val(s.lineTapsW, 0)], val(s.powerW, 0))
      : null;

    return { load, loadCheck, cable, cableMin, qShift, power, gain, mains, mainsSection, line };
  }, [s]);

  const avvisi = [
    ...calc.load.warnings, ...calc.loadCheck.warnings,
    ...calc.power.warnings, ...calc.mains.warnings,
    ...(calc.line?.warnings ?? []),
  ];

  return (
    <div className="relative min-h-screen bg-ink text-paper pt-20 pb-24">
      <Griglia />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-baseline gap-3 mb-6">
            <Annot tone="blueprint">Tav. 30</Annot>
            <div className="quota flex-1 max-w-[200px]" aria-hidden />
            <Annot>Banco elettrico</Annot>
          </div>
          <h1 className="titolo text-4xl md:text-6xl mb-4">
            Configura <span className="text-marker">l’impianto</span>
          </h1>
          <p className="text-graphite max-w-3xl leading-relaxed">
            Che cavo serve, quanto scende l’impedenza, quanti decibel escono davvero e quanta corrente
            chiede la presa. Sono quattro domande diverse con quattro criteri diversi, e questo foglio le
            tiene separate.
          </p>
        </div>

        {/* riepilogo sempre visibile */}
        <div className="riempi grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          <Stat label="Carico visto" value={calc.load.seenOhm.toFixed(1)} unit="Ω" accent />
          <Stat label="Cavo diffusori" value={calc.cableMin.commercialMm2 ?? '—'} unit="mm²" />
          <Stat label="Cavo rete" value={calc.mainsSection.scelta ?? '—'} unit="mm²" />
          <Stat label="SPL picco" value={calc.power.splPeak.toFixed(0)} unit="dB" />
          <Stat label="Assorbimento" value={calc.mains.currentA.toFixed(1)} unit="A" />
        </div>

        <div className="flex items-end justify-between gap-4">
          <TabBar<TabId> tabs={TABS} active={tab} onChange={id => setTab(id)} />
          <div className="hidden sm:flex items-center gap-3 pb-3 shrink-0">
            <span className="annot text-[9px]">Salvato in questo browser</span>
            <button
              type="button"
              onClick={() => { ricomincia(); setTab('ampli'); }}
              className="annot text-[9px] hover:text-marker transition-colors underline underline-offset-4 decoration-paper/20"
            >
              Ricomincia
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-5" role="tabpanel" id={`pannello-${tab}`} aria-labelledby={`scheda-${tab}`}>
          {tab === 'ampli' && (
            <div className="grid lg:grid-cols-2 gap-5">
              <Section title="Amplificatore">
                <div className="space-y-3">
                  <NumField label="Potenza continua per canale" unit="W" infoId="amppower"
                    value={s.powerW} onChange={v => set('powerW', v)}
                    hint="Sul carico effettivo. Se la scheda dichiara potenze diverse su 8, 4 e 2 Ω, usa quella dell’impedenza che collegherai." />
                  <SelectField label="Classe" infoId="ampclass"
                    value={s.ampClass} onChange={v => set('ampClass', v as AmpClass)}
                    options={Object.entries(AMP_CLASSES).map(([value, c]) => ({ value, label: c.label }))} />
                  <p className="text-[11px] text-graphite leading-relaxed">{AMP_CLASSES[s.ampClass].note}</p>
                  <NumField label="Impedenza minima ammessa" unit="Ω" infoId="loadimpedance"
                    value={s.ampMinOhm} onChange={v => set('ampMinOhm', v)} step={0.5} />
                  <CheckField label="Funzionamento a ponte (bridge)"
                    checked={s.bridged} onChange={v => set('bridged', v)}
                    hint="A ponte ciascun canale vede metà dell’impedenza collegata." infoId="loadimpedance" />
                  <NumField label="Sensibilità d’ingresso" unit="V" infoId="gainstructure"
                    value={s.inputSensV} onChange={v => set('inputSensV', v)} step={0.1}
                    hint="La tensione che porta l’amplificatore al massimo. 0,775 V = 0 dBu, 1 V = 0 dBV, 1,4 V = +5 dBu." />
                </div>
              </Section>
              <Section title="Condizioni d’uso">
                <div className="space-y-3">
                  <SelectField label="Regime di lavoro" infoId="duty"
                    value={s.duty} onChange={v => set('duty', v as DutyKind)}
                    options={Object.entries(DUTY).map(([value, d]) => ({ value, label: d.label }))} />
                  <p className="text-[11px] text-graphite leading-relaxed">{DUTY[s.duty].note}</p>
                  <NumField label="Apparecchi sulla stessa linea" value={s.units}
                    onChange={v => set('units', v)} step={1} />
                  <CheckField label="Linea a tensione costante (100 V / 70 V)"
                    checked={s.useLine} onChange={v => set('useLine', v)}
                    hint="Impianti distribuiti: si ragiona a watt di presa, non a impedenze." />
                  {s.useLine && (
                    <>
                      <SelectField label="Tensione di linea" value={String(s.lineV)}
                        onChange={v => set('lineV', Number(v))}
                        options={[{ value: '100', label: '100 V' }, { value: '70', label: '70 V' }]} />
                      <NumField label="Somma delle prese" unit="W" value={s.lineTapsW}
                        onChange={v => set('lineTapsW', v)} />
                    </>
                  )}
                </div>
              </Section>
            </div>
          )}

          {tab === 'diffusori' && (
            <div className="grid lg:grid-cols-2 gap-5">
              <Section title="Collegamento">
                <div className="space-y-3">
                  <NumField label="Numero di diffusori" value={s.count} onChange={v => set('count', v)} step={1} />
                  <SelectField label="Come sono collegati" infoId="loadimpedance"
                    value={s.wiring} onChange={v => set('wiring', v as Wiring)}
                    options={[
                      { value: 'parallelo', label: 'Parallelo' },
                      { value: 'serie', label: 'Serie' },
                      { value: 'serie-parallelo', label: 'Serie-parallelo' },
                    ]} />
                  {s.wiring === 'serie-parallelo' && (
                    <NumField label="Diffusori in serie per ramo" value={s.perBranch}
                      onChange={v => set('perBranch', v)} step={1} />
                  )}
                  <NumField label="Impedenza nominale del singolo" unit="Ω" infoId="impedance"
                    value={s.nominalOhm} onChange={v => set('nominalOhm', v)} step={0.5} />
                  <NumField label="Minimo della curva" unit="Ω" infoId="loadimpedance"
                    value={s.minOhm} onChange={v => set('minOhm', v)} step={0.1}
                    hint="È questo il numero che protegge l’amplificatore, non il nominale. Se non lo sai, conta circa l’80% del nominale." />
                </div>
              </Section>
              <Section title="Prestazioni attese">
                <div className="space-y-3">
                  <NumField label="Tenuta in potenza (Pe)" unit="W" infoId="pe"
                    value={s.speakerPeW} onChange={v => set('speakerPeW', v)} />
                  <NumField label="Sensibilità" unit="dB @1W/1m" infoId="sensitivity"
                    value={s.sensitivityDb} onChange={v => set('sensitivityDb', v)} step={0.5} />
                  <NumField label="Distanza di ascolto" unit="m" value={s.distanceM}
                    onChange={v => set('distanceM', v)} step={0.5} />
                  <SelectField label="Tipo di programma" infoId="crest"
                    value={s.crest} onChange={v => set('crest', v as CrestKind)}
                    options={Object.entries(CREST).map(([value, c]) => ({ value, label: `${c.label} — ${c.db} dB` }))} />
                  <p className="text-[11px] text-graphite leading-relaxed">{CREST[s.crest].note}</p>
                  <CheckField label="Diffusore appoggiato a una superficie (mezzo spazio)"
                    checked={s.halfSpace} onChange={v => set('halfSpace', v)}
                    hint="A terra o a muro si guadagnano circa 3 dB alle basse frequenze." />
                </div>
              </Section>
              <Section title="Driver, per l’effetto del cavo" subtitle="Serve a calcolare di quanto il cavo sposta il Qts.">
                <div className="grid sm:grid-cols-3 gap-3">
                  <NumField label="Re" unit="Ω" infoId="re" value={s.driverRe} onChange={v => set('driverRe', v)} step={0.1} />
                  <NumField label="Qes" infoId="qes" value={s.driverQes} onChange={v => set('driverQes', v)} step={0.01} />
                  <NumField label="Qms" infoId="qms" value={s.driverQms} onChange={v => set('driverQms', v)} step={0.1} />
                </div>
              </Section>
            </div>
          )}

          {tab === 'cavi' && (
            <div className="grid lg:grid-cols-2 gap-5">
              <Section title="Cavo verso i diffusori" subtitle="Lunghezza di una tratta: il ritorno lo conta il calcolo.">
                <div className="space-y-3">
                  <NumField label="Lunghezza" unit="m" infoId="speakercable"
                    value={s.spkLengthM} onChange={v => set('spkLengthM', v)} step={0.5} />
                  <SelectField label="Sezione" infoId="speakercable"
                    value={String(s.spkSectionMm2)} onChange={v => set('spkSectionMm2', Number(v))}
                    options={SEZIONI.map(x => ({ value: String(x), label: `${x} mm²` }))} />
                  <SelectField label="Conduttore" value={s.spkMaterial}
                    onChange={v => set('spkMaterial', v as Conductor)}
                    options={[{ value: 'rame', label: 'Rame' }, { value: 'alluminio', label: 'Alluminio' }]} />
                </div>
              </Section>
              <Section title="Cavo di rete" subtitle="Dalla presa all’apparecchio.">
                <div className="space-y-3">
                  <NumField label="Lunghezza" unit="m" infoId="mainscable"
                    value={s.mainsLengthM} onChange={v => set('mainsLengthM', v)} step={0.5} />
                  <SelectField label="Sezione" infoId="mainscable"
                    value={String(s.mainsSectionMm2)} onChange={v => set('mainsSectionMm2', Number(v))}
                    options={SEZIONI.map(x => ({ value: String(x), label: `${x} mm²` }))} />
                </div>
                <div className="mt-4 bg-ink-2/70 border border-paper/10 p-4">
                  <p className="annot annot-blue block mb-2">Portata indicativa dei cavi flessibili</p>
                  <div className="grid grid-cols-4 gap-2 text-[11px] font-mono text-paper/80">
                    {PORTATA_FLESSIBILI.map(p => (
                      <div key={p.mm2}>{p.mm2} mm² · {p.a} A</div>
                    ))}
                  </div>
                  <p className="text-[11px] text-graphite mt-3 leading-relaxed">
                    Valori d’uso per cavo in aria libera a 30 °C, non raggruppato. I numeri vincolanti stanno
                    nella norma di installazione e cambiano con la posa, la temperatura e quanti cavi stanno
                    insieme: questa tabella serve all’ordine di grandezza, non a firmare un impianto.
                  </p>
                </div>
              </Section>
            </div>
          )}

          {tab === 'risultati' && <Risultati calc={calc} s={s} />}
        </div>

        {avvisi.length > 0 && (
          <div className="mt-6">
            <Warnings items={avvisi} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Risultati ────────────────────────────────────────────────────────────────

type Calc = ReturnType<typeof useCalc>;
// tipo di comodo: la funzione non esiste, serve solo a dare un nome al risultato
declare function useCalc(): {
  load: ReturnType<typeof computeLoad>;
  loadCheck: ReturnType<typeof checkLoad>;
  cable: ReturnType<typeof computeCable>;
  cableMin: ReturnType<typeof minSection>;
  qShift: ReturnType<typeof shiftedQ>;
  power: ReturnType<typeof computePower>;
  gain: ReturnType<typeof gainStructure>;
  mains: ReturnType<typeof computeMains>;
  mainsSection: ReturnType<typeof sezioneRete>;
  line: ReturnType<typeof constantVoltageLine> | null;
};

function Riga({ k, v, nota }: { k: string; v: string; nota?: string }) {
  return (
    <div className="border-b border-paper/[0.06] pb-2">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-[12px] text-graphite">{k}</dt>
        <dd className="font-mono text-white shrink-0 text-sm">{v}</dd>
      </div>
      {nota && <p className="text-[10px] text-graphite-dim mt-1 leading-relaxed">{nota}</p>}
    </div>
  );
}

function Risultati({ calc, s }: { calc: Calc; s: Settings }) {
  const { load, cable, cableMin, qShift, power, gain, mains, mainsSection, line } = calc;
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Section title="Carico" right={<InfoLink id="loadimpedance" />}>
        <dl className="space-y-2">
          <Riga k="Impedenza nominale risultante" v={`${load.nominalOhm.toFixed(1)} Ω`} />
          <Riga k="Minimo della curva" v={`${load.minOhm.toFixed(1)} Ω`}
            nota="È questo che va confrontato col limite dell’amplificatore." />
          <Riga k="Vista dall’amplificatore" v={`${load.seenOhm.toFixed(1)} Ω`}
            nota={s.bridged ? 'A ponte è la metà del carico collegato.' : undefined} />
          <Riga k="Potenza per diffusore" v={`${(load.perSpeakerFraction * 100).toFixed(0)}%`} />
        </dl>
        <p className="text-[11px] text-graphite mt-3 leading-relaxed">{load.description}</p>
      </Section>

      <Section title="Cavo verso i diffusori" right={<InfoLink id="speakercable" />}>
        <dl className="space-y-2">
          <Riga k="Resistenza andata + ritorno" v={`${cable.loopOhm.toFixed(3)} Ω`} />
          <Riga k="Perdita in banda" v={`${cable.lossDb.toFixed(2)} dB`}
            nota={`${cable.lostPercent.toFixed(1)}% della potenza resta nel cavo — ${cable.dissipatedW.toFixed(1)} W.`} />
          <Riga k="Fattore di smorzamento reale" v={cable.dampingFactor.toFixed(0)}
            nota="Col cavo incluso. È questo che arriva al cono, non quello di targa." />
          <Riga k="Sezione minima al 5%" v={`${cableMin.exactMm2.toFixed(2)} → ${cableMin.commercialMm2 ?? '—'} mm²`} />
        </dl>
        <div className="mt-4 bg-marker/5 border border-marker/25 p-4">
          <p className="annot annot-marker block mb-2">Quanto il cavo cambia la cassa</p>
          <dl className="space-y-2">
            <Riga k="Qts di progetto" v={qShift.qtsOriginale.toFixed(4)} />
            <Riga k="Qts con questo cavo" v={`${qShift.qts.toFixed(4)} (+${qShift.deltaPercent.toFixed(1)}%)`} />
          </dl>
          <p className="text-[11px] text-graphite mt-3 leading-relaxed">
            Qualunque resistenza in serie riduce lo smorzamento elettrico: Qes&prime; = Qes·(Re+Rs)/Re. Una
            cassa calcolata per un Qts e pilotata attraverso mezzo ohm di cavo si comporta come se il driver
            ne avesse un altro — e questo non si recupera alzando il volume.
          </p>
        </div>
      </Section>

      <Section title="Livello" right={<InfoLink id="crest" />}>
        <dl className="space-y-2">
          <Riga k="Tensione d’uscita" v={`${power.rmsVoltage.toFixed(1)} V eff · ${power.peakVoltage.toFixed(1)} V picco`} />
          <Riga k="Corrente di picco" v={`${power.peakCurrent.toFixed(1)} A`} />
          <Riga k={`SPL di picco a ${s.distanceM} m`} v={`${power.splPeak.toFixed(1)} dB`}
            nota={`A bobina fredda ${power.splPeakCold.toFixed(1)} dB: la differenza è compressione di potenza.`} />
          <Riga k="Livello medio" v={`${power.splAverage.toFixed(1)} dB`}
            nota={`I picchi meno il fattore di cresta (${CREST[s.crest].db} dB).`} />
          <Riga k="Potenza media assorbita" v={`${power.averageW.toFixed(0)} W`}
            nota="È questa che scalda la bobina, non quella di picco." />
          <Riga k="Compressione di potenza" v={`${power.compressionDb.toFixed(2)} dB`} />
          <Riga k="Guadagno d’ingresso" v={`${gain.gainDb.toFixed(1)} dB`}
            nota={`${gain.outMaxV.toFixed(1)} V massimi per ${s.inputSensV} V d’ingresso (${gain.inputDbu.toFixed(1)} dBu).`} />
        </dl>
      </Section>

      <Section title="Alimentazione" right={<InfoLink id="mainscable" />}>
        <dl className="space-y-2">
          <Riga k="Potenza assorbita" v={`${mains.inputW.toFixed(0)} W · ${mains.apparentVA.toFixed(0)} VA`}
            nota="I volt-ampere sono quello che vede la presa: con un fattore di potenza basso sono molti più dei watt." />
          <Riga k="Corrente con la musica" v={`${mains.currentA.toFixed(2)} A`} />
          <Riga k="Corrente di progetto" v={`${mains.designCurrentA.toFixed(2)} A`}
            nota="Il massimo continuo: è su questa che si dimensionano cavo e protezione." />
          <Riga k="Calore dissipato" v={`${mains.heatW.toFixed(0)} W`} />
          <Riga k="Caduta sulla linea" v={`${mains.dropV.toFixed(1)} V (${mains.dropPercent.toFixed(2)}%)`} />
          <Riga k="Magnetotermico" v={`${mains.breakerA} A`} />
          <Riga k="Sezione del cavo di rete"
            v={`${mainsSection.scelta ?? '—'} mm²`}
            nota={mainsSection.comanda === 'caduta'
              ? `Comanda la caduta di tensione: per portata basterebbero ${mainsSection.perPortata} mm².`
              : `Comanda la portata, coordinata col magnetotermico da ${mains.breakerA} A.`} />
          <Riga k="Spunto all’accensione" v={`${mains.inrushA[0].toFixed(0)} – ${mains.inrushA[1].toFixed(0)} A`}
            nota="Per pochi cicli di rete. È quello che fa scattare i magnetotermici curva B." />
        </dl>
      </Section>

      {line && (
        <Section title="Linea a tensione costante">
          <dl className="space-y-2">
            <Riga k="Somma delle prese" v={`${line.totalW} W`} />
            <Riga k="Percentuale usata" v={`${line.usePercent.toFixed(0)}%`}
              nota="Lascia almeno il 20% di margine: i trasformatori di linea hanno perdite proprie." />
            <Riga k="Impedenza equivalente" v={`${line.equivalentOhm.toFixed(1)} Ω`}
              nota="Serve solo per calcolare il cavo: su una linea a tensione costante non si ragiona a impedenze." />
            <Riga k="Corrente di linea" v={`${line.currentA.toFixed(2)} A`} />
          </dl>
        </Section>
      )}
    </div>
  );
}
