import { NumField, SelectField, Section, Stat, CheckField } from './ui';
import { DAMPING_SPECS, SHAPE_LABELS } from '../../utils/audio';
import type { BoxDimensions, BoxShape, CutPanel, DampingLevel, VolumeBreakdown } from '../../utils/audio';

export interface DimensionSettings {
  shape: BoxShape;
  wallThicknessMm: number | '';
  damping: DampingLevel;
  useGoldenRatio: boolean;
  fixedWidthMm: number | '';
  fixedHeightMm: number | '';
  taper: number | '';
  bracingPercent: number | '';
  mountingDepthMm: number | '';
}

interface Props {
  settings: DimensionSettings;
  onChange: (next: DimensionSettings) => void;
  dimensions: BoxDimensions | null;
  volumes: VolumeBreakdown | null;
  panels: CutPanel[];
  panelAreaM2: number;
  weightKg: number;
}

const MATERIAL_THICKNESS = [
  { value: '15', label: 'MDF 15 mm' },
  { value: '18', label: 'MDF 18 mm (standard)' },
  { value: '22', label: 'MDF 22 mm (rinforzato)' },
  { value: '25', label: 'MDF 25 mm (alta potenza)' },
  { value: '12', label: 'Betulla baltica 12 mm' },
  { value: '21', label: 'Betulla baltica 21 mm' },
];

export function DimensionsTab({
  settings, onChange, dimensions, volumes, panels, panelAreaM2, weightKg,
}: Props) {
  const set = <K extends keyof DimensionSettings>(key: K, value: DimensionSettings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Forma e materiale">
          <div className="space-y-3">
            <SelectField
              label="Forma della cassa"
              value={settings.shape}
              onChange={v => set('shape', v as BoxShape)}
              options={Object.entries(SHAPE_LABELS).map(([value, label]) => ({ value, label }))}
            />
            <SelectField
              label="Spessore pannelli"
              value={String(settings.wallThicknessMm || 18)}
              onChange={v => set('wallThicknessMm', Number(v))}
              options={MATERIAL_THICKNESS}
            />
            {settings.shape === 'trapezoidal' && (
              <NumField
                label="Rastremazione (profondità retro / fronte)"
                value={settings.taper}
                onChange={v => set('taper', v)}
                step={0.05}
                hint="0.6 = il retro è il 60% del fronte. Utile per bagagliaio o monitor da palco."
              />
            )}
            <NumField
              label="Profondità di montaggio del driver"
              unit="mm"
              value={settings.mountingDepthMm}
              onChange={v => set('mountingDepthMm', v)}
              hint="Serve a stimare il volume occupato da cestello e magnete."
            />
            <NumField
              label="Rinforzi interni (bracing)"
              unit="% del volume"
              value={settings.bracingPercent}
              onChange={v => set('bracingPercent', v)}
              hint="Tipico 2–5%. Più la cassa è grande, più rinforzi servono."
            />
          </div>
        </Section>

        <Section title="Proporzioni e assorbente">
          <div className="space-y-3">
            <CheckField
              label="Usa la proporzione aurea (1 : 1,618 : 0,618)"
              checked={settings.useGoldenRatio}
              onChange={v => set('useGoldenRatio', v)}
              hint="Distribuisce le risonanze interne su frequenze diverse invece di sovrapporle."
            />
            <NumField
              label="Larghezza imposta (opzionale)"
              unit="mm"
              value={settings.fixedWidthMm}
              onChange={v => set('fixedWidthMm', v)}
              hint="Se la imposti, altezza e profondità si adattano per mantenere il volume."
            />
            <NumField
              label="Altezza imposta (opzionale)"
              unit="mm"
              value={settings.fixedHeightMm}
              onChange={v => set('fixedHeightMm', v)}
            />
            <SelectField
              label="Assorbente interno"
              value={settings.damping}
              onChange={v => set('damping', v as DampingLevel)}
              options={Object.entries(DAMPING_SPECS).map(([value, spec]) => ({ value, label: spec.label }))}
            />
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              L'assorbente rallenta le onde interne: la cassa si comporta come se fosse più grande
              (+{Math.round(DAMPING_SPECS[settings.damping].volumeGain * 100)}%) e smorza le risonanze (Qa {DAMPING_SPECS[settings.damping].qa}).
            </p>
          </div>
        </Section>
      </div>

      {dimensions && volumes && (
        <>
          <Section title="Dimensioni esterne" subtitle="Misure finali della cassa, spessore dei pannelli incluso.">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {dimensions.shape === 'cylindrical' ? (
                <>
                  <Stat label="Diametro" value={dimensions.diameter ?? dimensions.width} unit="mm" accent />
                  <Stat label="Altezza" value={dimensions.height} unit="mm" accent />
                </>
              ) : (
                <>
                  <Stat label="Larghezza" value={dimensions.width} unit="mm" accent />
                  <Stat label="Altezza" value={dimensions.height} unit="mm" accent />
                  <Stat label="Profondità" value={dimensions.depth} unit="mm" accent />
                  {dimensions.depthRear && <Stat label="Profondità retro" value={dimensions.depthRear} unit="mm" />}
                </>
              )}
              <Stat label="Peso stimato a vuoto" value={weightKg.toFixed(1)} unit="kg" />
            </div>
          </Section>

          <Section title="Bilancio dei volumi" subtitle="Dal volume interno lordo al volume acustico effettivo.">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Stat label="Lordo interno" value={volumes.gross.toFixed(1)} unit="L" />
              <Stat label="− Driver" value={volumes.driverDisp.toFixed(2)} unit="L" />
              <Stat label="− Condotto" value={volumes.portDisp.toFixed(2)} unit="L" />
              <Stat label="− Rinforzi" value={volumes.bracingDisp.toFixed(2)} unit="L" />
              <Stat label="= Netto" value={volumes.net.toFixed(1)} unit="L" accent />
            </div>
            <p className="text-[11px] text-zinc-500 mt-3">
              Con l'assorbente scelto la cassa si comporta acusticamente come {volumes.effective.toFixed(1)} litri.
            </p>
          </Section>

          <Section title="Lista di taglio" subtitle={`${panelAreaM2.toFixed(2)} m² di pannello — circa ${Math.ceil(panelAreaM2 / 2.98)} foglio/i da 244×122 cm.`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-zinc-500 border-b border-white/10">
                    <th className="text-left py-2 font-bold">Pannello</th>
                    <th className="text-right py-2 font-bold">Misure (mm)</th>
                    <th className="text-right py-2 font-bold">Sp.</th>
                    <th className="text-right py-2 font-bold">Qtà</th>
                  </tr>
                </thead>
                <tbody>
                  {panels.map((p, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="py-2.5">
                        <span className="text-zinc-200 font-medium">{p.name}</span>
                        {p.note && <span className="block text-[10px] text-zinc-600 leading-relaxed">{p.note}</span>}
                      </td>
                      <td className="text-right text-zinc-300 tabular-nums">{p.width} × {p.height}</td>
                      <td className="text-right text-zinc-400 tabular-nums">{p.thickness}</td>
                      <td className="text-right text-brand-orange font-bold tabular-nums">{p.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
