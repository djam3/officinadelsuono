import { NumField, SelectField, Section, Plot, PLOT_COLORS, CheckField, InfoLink, type Series } from './ui';
import { TolleranzaSection } from './TolleranzaSection';
import { ROOM_PRESETS, VENT_VELOCITY_LIMIT } from '../../utils/audio';
import type { CurvePoint, DesignResult, RoomPreset, TSParams } from '../../utils/audio';

export type GraphKey = 'spl' | 'maxspl' | 'power' | 'excursion' | 'vent' | 'impedance' | 'phase' | 'delay';

export interface ResponseSettings {
  powerW: number | '';
  roomPreset: RoomPreset;
  visible: Record<GraphKey, boolean>;
  /** dispersione di produzione da simulare: sospensione e motore, in ±% */
  tolCedevolezzaPct: number | '';
  tolMotorePct: number | '';
}

interface Props {
  settings: ResponseSettings;
  onChange: (next: ResponseSettings) => void;
  design: DesignResult | null;
  ts: TSParams | null;
  /** quale carica: la tolleranza si simula solo su chiusa e reflex */
  tipoTolleranza: 'sealed' | 'vented' | 'altro';
}

const GRAPH_LABELS: Record<GraphKey, string> = {
  spl: 'Risposta in frequenza',
  maxspl: 'SPL massimo',
  power: 'Potenza sopportabile',
  excursion: 'Escursione del cono',
  vent: 'Velocità aria in porta',
  impedance: 'Impedenza',
  phase: 'Fase',
  delay: 'Ritardo di gruppo',
};

/** linea orizzontale di riferimento sulla stessa estensione in frequenza */
function limitLine(points: CurvePoint[], value: number): CurvePoint[] {
  if (!points.length) return [];
  return [{ f: points[0].f, v: value }, { f: points[points.length - 1].f, v: value }];
}

export function ResponseTab({ settings, onChange, design, ts, tipoTolleranza }: Props) {
  const set = <K extends keyof ResponseSettings>(key: K, value: ResponseSettings[K]) =>
    onChange({ ...settings, [key]: value });

  const toggle = (key: GraphKey) =>
    onChange({ ...settings, visible: { ...settings.visible, [key]: !settings.visible[key] } });

  const curves = design?.curves;
  const hasFullModel = !!curves;

  const ventPeak = design?.ventVelocity?.reduce((max, p) => Math.max(max, p.v), 0) ?? 0;
  const dipolo = design?.openBaffle;

  return (
    <div className="space-y-5">
      <Section title="Condizioni di simulazione">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NumField
            label="Potenza applicata" infoId="pe"
            unit="W"
            value={settings.powerW}
            onChange={v => set('powerW', v)}
            hint="Determina escursione, velocità in porta e SPL raggiunto."
          />
          <SelectField
            label="Ambiente di ascolto" infoId="roomgain"
            value={settings.roomPreset}
            onChange={v => set('roomPreset', v as RoomPreset)}
            options={Object.entries(ROOM_PRESETS).map(([value, spec]) => ({ value, label: spec.label }))}
          />
        </div>
        <p className="text-[11px] text-graphite mt-3 leading-relaxed">
          Il guadagno dell'ambiente somma alla risposta il rinforzo che stanza o abitacolo producono alle basse
          frequenze: in auto può valere più di 10 dB sotto i 50 Hz.
        </p>
      </Section>

      <Section title="Grafici da mostrare">
        <div className="riempi grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(GRAPH_LABELS) as GraphKey[]).map(key => (
            <CheckField
              key={key}
              label={GRAPH_LABELS[key]}
              checked={settings.visible[key]}
              onChange={() => toggle(key)}
            />
          ))}
        </div>
      </Section>

      {!curves && (
        <p className="text-sm text-graphite italic">Inserisci i parametri del driver per vedere le curve.</p>
      )}

      {/* Risposta in frequenza */}
      {curves && settings.visible.spl && (
        <Section title="Risposta in frequenza" subtitle="Normalizzata a 0 dB in banda passante, con e senza guadagno ambiente.">
          <Plot
            height={260}
            yLabel="Livello"
            yUnit="dB"
            series={[
              { name: 'Cassa', color: PLOT_COLORS[0], points: curves.spl },
              ...(settings.roomPreset !== 'none' && design?.splWithRoom
                ? [{ name: 'Con ambiente', color: PLOT_COLORS[1], points: design.splWithRoom } as Series]
                : []),
              { name: '-3 dB', color: '#3f3f46', points: limitLine(curves.spl, -3) },
            ]}
          />
        </Section>
      )}

      <TolleranzaSection
        ts={ts}
        design={design}
        tipo={tipoTolleranza}
        cedevolezzaPct={settings.tolCedevolezzaPct}
        motorePct={settings.tolMotorePct}
        onChange={(campo, v) => onChange({ ...settings, [campo]: v })}
      />

      {/* SPL massimo */}
      {hasFullModel && design?.maxOutput && settings.visible.maxspl && (
        <Section
          title="SPL massimo a 1 metro"
          subtitle={`Picco in banda ${design.maxOutput.peakSpl.toFixed(1)} dB a ${Math.round(design.maxOutput.peakSplHz)} Hz — vale il limite più basso fra escursione e potenza termica.`}
        >
          <Plot
            height={260}
            yLabel="SPL"
            yUnit="dB"
            series={[
              { name: 'Limite termico', color: PLOT_COLORS[2], points: design.maxOutput.thermalSpl },
              { name: 'Limite escursione', color: PLOT_COLORS[1], points: design.maxOutput.excursionSpl },
              { name: 'Massimo utile', color: PLOT_COLORS[0], points: design.maxOutput.maxSpl },
            ]}
          />
        </Section>
      )}

      {/* Potenza sopportabile */}
      {hasFullModel && design?.maxOutput && settings.visible.power && (
        <Section title="Potenza elettrica sopportabile" subtitle="Oltre questa curva il cono supera Xmax o la bobina va in crisi termica.">
          <Plot
            height={220}
            yLabel="Potenza"
            yUnit="W"
            decimals={0}
            series={[
              { name: 'Limite', color: PLOT_COLORS[3], points: design.maxOutput.powerHandling },
              ...(ts?.pe ? [{ name: 'Pe nominale', color: '#3f3f46', points: limitLine(design.maxOutput.powerHandling, ts.pe) } as Series] : []),
            ]}
          />
        </Section>
      )}

      {/* Escursione */}
      {hasFullModel && settings.visible.excursion && (
        <Section
          title={curves!.prExcursion ? 'Escursione di cono e membrana passiva' : 'Escursione del cono'}
          subtitle={`Alla potenza di ${settings.powerW || 0} W, confrontata con Xmax.`}
        >
          <Plot
            height={220}
            yLabel="Escursione"
            yUnit="mm"
            decimals={2}
            yMin={0}
            yMax={ts?.xmax ? ts.xmax * 2.5 : undefined}
            series={[
              { name: 'Driver', color: PLOT_COLORS[0], points: curves!.excursion },
              ...(curves!.prExcursion
                ? [{ name: 'Membrana passiva', color: PLOT_COLORS[2], points: curves!.prExcursion } as Series]
                : []),
              ...(ts?.xmax ? [{ name: 'Xmax', color: '#ef4444', points: limitLine(curves!.excursion, ts.xmax) } as Series] : []),
              ...(ts?.xmech ? [{ name: 'Xmech', color: '#7f1d1d', points: limitLine(curves!.excursion, ts.xmech) } as Series] : []),
            ]}
          />
          {curves!.prExcursion && (
            <p className="text-[11px] text-graphite mt-3 leading-relaxed">
              La membrana passiva si muove molto più del cono all'accordo, dove il driver è quasi fermo:
              è lei a irradiare. Per questo deve avere un volume spostabile ben maggiore di quello del
              driver, altrimenti va in fondo corsa per prima e limita tutto il sistema.
            </p>
          )}
        </Section>
      )}

      {/* Velocità in porta */}
      {design?.ventVelocity && settings.visible.vent && (
        <Section
          title="Velocità dell'aria nel condotto"
          subtitle={
            ventPeak > VENT_VELOCITY_LIMIT
              ? `Picco ${ventPeak.toFixed(1)} m/s ai ${settings.powerW || 0} W simulati: oltre la soglia di turbolenza, il condotto soffia.`
              : `Picco ${ventPeak.toFixed(1)} m/s ai ${settings.powerW || 0} W simulati, sotto la soglia di turbolenza. Nella scheda Cassa trovi il valore nel caso peggiore, a Xmax.`
          }
        >
          <Plot
            height={220}
            yLabel="Velocità"
            yUnit="m/s"
            series={[
              { name: 'Velocità', color: ventPeak > VENT_VELOCITY_LIMIT ? '#ef4444' : PLOT_COLORS[0], points: design.ventVelocity },
              { name: 'Soglia 17 m/s', color: '#3f3f46', points: limitLine(design.ventVelocity, VENT_VELOCITY_LIMIT) },
            ]}
          />
        </Section>
      )}

      {/* Impedenza */}
      {hasFullModel && settings.visible.impedance && (
        <Section title="Impedenza elettrica" subtitle="I picchi indicano le risonanze del sistema; il minimo è il carico reale per l'amplificatore.">
          <Plot height={220} yLabel="Impedenza" yUnit="Ω" series={[{ name: '|Z|', color: PLOT_COLORS[2], points: curves!.impedance }]} />
        </Section>
      )}

      {/* Fase */}
      {hasFullModel && settings.visible.phase && (
        <Section title="Fase acustica">
          <Plot height={200} yLabel="Fase" yUnit="°" decimals={0} series={[{ name: 'Fase', color: PLOT_COLORS[4], points: curves!.phase }]} />
        </Section>
      )}

      {/* Group delay */}
      {hasFullModel && settings.visible.delay && (
        <Section title="Ritardo di gruppo" subtitle="Sopra ~20 ms alle basse frequenze il basso inizia a suonare in ritardo.">
          <Plot
            height={200}
            yLabel="Ritardo"
            yUnit="ms"
            series={[
              { name: 'Group delay', color: PLOT_COLORS[1], points: curves!.groupDelay },
              { name: '20 ms', color: '#3f3f46', points: limitLine(curves!.groupDelay, 20) },
            ]}
          />
        </Section>
      )}
      {/* Dipolo: percorso, cavita' e il prezzo in escursione della correzione.
          `dipolo` invece di `design.openBaffle` non e' pignoleria: con i campi
          del driver vuoti `design` e' null, e questa riga - l'unica di tutta
          la scheda che non lo controllava - faceva cadere l'intero
          calcolatore. Il paracadute lo ha contenuto, ma la scheda spariva. */}
      {dipolo && (
        <Section
          title="Pannello aperto: percorso, cavità ed escursione"
          subtitle="Senza volume da calcolare, il progetto sta tutto nel percorso fronte-retro e nella profondità delle alette."
          right={<InfoLink id="dipole" />}
        >
          <div className="riempi grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <Riga k="Percorso efficace" v={`${(dipolo.dEffMm / 10).toFixed(1)} cm`} />
            <Riga k="Primo massimo" v={`${dipolo.fPeakHz.toFixed(0)} Hz`} />
            <Riga
              k="Risonanza di cavità"
              v={dipolo.fPipeHz ? `${dipolo.fPipeHz.toFixed(0)} Hz` : 'nessuna'}
            />
            <Riga k="F3 risultante" v={`${dipolo.f3Hz.toFixed(0)} Hz`} />
          </div>
          {dipolo.notch && (
            <div className="mb-5 bg-ink-2/80 border border-amber-500/25 rounded-none p-4">
              <p className="annot annot-marker block mb-3">
                Notch per la risonanza di cavità — {dipolo.notch.fHz.toFixed(0)} Hz{' '}
                <InfoLink id="notch" />
              </p>
              <div className="riempi grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Riga k="Induttanza L" v={`${dipolo.notch.lMh.toFixed(2)} mH`} />
                <Riga k="Capacità C" v={`${dipolo.notch.cUf.toFixed(0)} µF`} />
                <Riga k="Resistenza R" v={`${dipolo.notch.rOhm.toFixed(1)} Ω`} />
                <Riga k="Profondità · Q" v={`${dipolo.notch.depthDb.toFixed(0)} dB · Q ${dipolo.notch.q}`} />
              </div>
              <p className="text-[11px] text-graphite mt-3 leading-relaxed">
                Circuito risonante parallelo L‖C‖R da mettere <strong>in serie</strong> al driver, non in
                parallelo: il notch classico dei crossover è una L-C in parallelo ai morsetti, e davanti a un
                amplificatore a bassa impedenza d&rsquo;uscita quella rete non fa niente. Prima del filtro vengono
                però due rimedi migliori: incrociare sotto la risonanza, e mettere un velo di assorbente dentro
                le alette — che la smorza dove nasce.
              </p>
            </div>
          )}
          <Plot
            height={200}
            yLabel="Correzione"
            yUnit="dB"
            series={[{ name: 'Da applicare', color: PLOT_COLORS[3], points: dipolo.eqBoostDb }]}
          />
          <p className="text-[11px] text-graphite mt-2 mb-5 leading-relaxed">
            La discesa del dipolo è di 6 dB/ottava e va compensata: questa è la curva che il filtro deve avere.
            {dipolo.eqHighPassHz > 0 && (
              <>
                {' '}Sotto i <strong>{dipolo.eqHighPassHz.toFixed(0)} Hz</strong> torna a scendere, e
                non per prudenza: sotto quel punto il cono è già a Xmax e alzare il livello non produce più
                suono, produce solo corsa.
              </>
            )}
          </p>
          <Plot
            height={210}
            yLabel="Escursione"
            yUnit="mm"
            series={[
              { name: 'Con correzione', color: PLOT_COLORS[0], points: dipolo.excursionEq },
              { name: 'Senza', color: PLOT_COLORS[2], points: dipolo.curves.excursion },
              ...(ts.xmax ? [{ name: `Xmax ${ts.xmax} mm`, color: '#3f3f46', points: limitLine(dipolo.excursionEq, ts.xmax) }] : []),
            ]}
          />
          <p className="text-[11px] text-graphite mt-2 leading-relaxed">
            Con la correzione inserita l&rsquo;escursione cresce di <strong>18 dB/ottava</strong> sotto il primo
            massimo, non 12: i 6 dB del dipolo si sommano ai 12 che servono già per tenere il livello. È questa
            curva, non il volume, a decidere fin dove arriva un pannello aperto.
          </p>
        </Section>
      )}

      {/* Effetto pannello e Zobel: due conti che non dipendono dalla curva ma
          decidono quanto la cassa suonerà magra e che carico vedrà il filtro */}
      {design && (
      <Section
        title="Effetto pannello e carico elettrico"
        subtitle="Due cose che si risolvono nel filtro, non nella cassa — ma si progettano qui."
        right={<InfoLink id="baffle" />}
      >
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="tavola p-4">
            <p className="annot annot-blue block mb-3">Baffle step</p>
            <dl className="space-y-2">
              <Riga k="Centro del gradino" v={`${design.baffle.f3Hz.toFixed(0)} Hz`} />
              <Riga k="Perdita sotto il gradino" v={`−${design.baffle.lossDb.toFixed(0)} dB`} />
              <Riga k="Transizione" v={`${design.baffle.fStartHz.toFixed(0)} – ${design.baffle.fEndHz.toFixed(0)} Hz`} />
            </dl>
            <p className="text-[11px] text-graphite mt-3 leading-relaxed">
              Sotto il gradino il suono gira attorno alla cassa e si irradia in tutto lo spazio invece che
              in mezzo: la stessa potenza su un angolo doppio fa 6 dB in meno. Si compensa nel filtro con
              una induttanza in serie affiancata da una resistenza.
            </p>
          </div>
          <div className="tavola p-4">
            <p className="annot annot-blue block mb-3">
              Rete Zobel <InfoLink id="zobel" />
            </p>
            {design.zobel ? (
              <>
                <dl className="space-y-2">
                  <Riga k="Resistenza Rz" v={`${design.zobel.rOhm.toFixed(1)} Ω`} />
                  <Riga k="Capacità Cz" v={`${design.zobel.cUf.toFixed(1)} µF`} />
                  <Riga k="La bobina pesa da" v={`${design.zobel.fRiseHz.toFixed(0)} Hz`} />
                  <Riga k="|Z| nudo a 10 kHz" v={`${design.zobel.zAt10kOhm.toFixed(1)} Ω`} />
                </dl>
                <p className="text-[11px] text-graphite mt-3 leading-relaxed">
                  R-C in parallelo ai morsetti: Rz = Re e Cz = Le/Re² riportano il modulo a Re esatto a
                  ogni frequenza. Serve al filtro passivo, che altrimenti incrocia su un carico che sale.
                </p>
              </>
            ) : (
              <p className="text-[11px] text-graphite leading-relaxed">
                Servono Re e Le del driver: inseriscili nella scheda Driver.
              </p>
            )}
          </div>
        </div>
      </Section>
      )}
    </div>
  );
}

function Riga({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-paper/[0.06] pb-1.5">
      <dt className="text-[12px] text-graphite">{k}</dt>
      <dd className="font-mono text-white shrink-0">{v}</dd>
    </div>
  );
}
