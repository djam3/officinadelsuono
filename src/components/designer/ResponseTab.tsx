import { AlertTriangle } from 'lucide-react';
import { NumField, SelectField, Section, Plot, PLOT_COLORS, CheckField, type Series } from './ui';
import { ROOM_PRESETS, VENT_VELOCITY_LIMIT } from '../../utils/audio';
import type { CurvePoint, DesignResult, RoomPreset, TSParams } from '../../utils/audio';

export type GraphKey = 'spl' | 'maxspl' | 'power' | 'excursion' | 'vent' | 'impedance' | 'phase' | 'delay';

export interface ResponseSettings {
  powerW: number | '';
  roomPreset: RoomPreset;
  visible: Record<GraphKey, boolean>;
}

interface Props {
  settings: ResponseSettings;
  onChange: (next: ResponseSettings) => void;
  design: DesignResult | null;
  ts: TSParams | null;
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

export function ResponseTab({ settings, onChange, design, ts }: Props) {
  const set = <K extends keyof ResponseSettings>(key: K, value: ResponseSettings[K]) =>
    onChange({ ...settings, [key]: value });

  const toggle = (key: GraphKey) =>
    onChange({ ...settings, visible: { ...settings.visible, [key]: !settings.visible[key] } });

  const curves = design?.curves;
  const hasFullModel = !!curves && !design?.simplifiedModel;

  const ventPeak = design?.ventVelocity?.reduce((max, p) => Math.max(max, p.v), 0) ?? 0;

  return (
    <div className="space-y-5">
      <Section title="Condizioni di simulazione">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NumField
            label="Potenza applicata"
            unit="W"
            value={settings.powerW}
            onChange={v => set('powerW', v)}
            hint="Determina escursione, velocità in porta e SPL raggiunto."
          />
          <SelectField
            label="Ambiente di ascolto"
            value={settings.roomPreset}
            onChange={v => set('roomPreset', v as RoomPreset)}
            options={Object.entries(ROOM_PRESETS).map(([value, spec]) => ({ value, label: spec.label }))}
          />
        </div>
        <p className="text-[11px] text-zinc-500 mt-3 leading-relaxed">
          Il guadagno dell'ambiente somma alla risposta il rinforzo che stanza o abitacolo producono alle basse
          frequenze: in auto può valere più di 10 dB sotto i 50 Hz.
        </p>
      </Section>

      <Section title="Grafici da mostrare">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

      {design?.simplifiedModel && (
        <p className="text-[11px] text-amber-500/90 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Per le casse bandpass viene mostrata la sola risposta stimata: escursione, impedenza e velocità in
          porta richiedono la misura sul prototipo.
        </p>
      )}

      {!curves && (
        <p className="text-sm text-zinc-500 italic">Inserisci i parametri del driver per vedere le curve.</p>
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
        <Section title="Escursione del cono" subtitle={`Alla potenza di ${settings.powerW || 0} W, confrontata con Xmax.`}>
          <Plot
            height={220}
            yLabel="Escursione"
            yUnit="mm"
            decimals={2}
            yMin={0}
            yMax={ts?.xmax ? ts.xmax * 2.5 : undefined}
            series={[
              { name: 'Escursione', color: PLOT_COLORS[0], points: curves!.excursion },
              ...(ts?.xmax ? [{ name: 'Xmax', color: '#ef4444', points: limitLine(curves!.excursion, ts.xmax) } as Series] : []),
              ...(ts?.xmech ? [{ name: 'Xmech', color: '#7f1d1d', points: limitLine(curves!.excursion, ts.xmech) } as Series] : []),
            ]}
          />
        </Section>
      )}

      {/* Velocità in porta */}
      {design?.ventVelocity && settings.visible.vent && (
        <Section
          title="Velocità dell'aria nel condotto"
          subtitle={
            ventPeak > VENT_VELOCITY_LIMIT
              ? `Picco ${ventPeak.toFixed(1)} m/s: oltre la soglia di turbolenza, il condotto soffia.`
              : `Picco ${ventPeak.toFixed(1)} m/s: sotto la soglia di turbolenza.`
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
    </div>
  );
}
