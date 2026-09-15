import { NumField, SelectField, Section, Stat, CheckField } from './ui';
import { ABSORBERS, PLACEMENT_LABELS, SHAPE_LABELS } from '../../utils/audio';
import type {
  AbsorberId, AbsorberResult, BoxDimensions, BoxShape, CutPanel, DampingLevel, Placement, VolumeBreakdown,
} from '../../utils/audio';

export interface DimensionSettings {
  shape: BoxShape;
  wallThicknessMm: number | '';
  damping: DampingLevel;
  absorber: AbsorberId;
  placement: Placement;
  absorberDensityKgM3: number | '';
  liningThicknessMm: number | '';
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
  absorber: AbsorberResult | null;
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
  settings, onChange, dimensions, volumes, panels, panelAreaM2, weightKg, absorber,
}: Props) {
  const set = <K extends keyof DimensionSettings>(key: K, value: DimensionSettings[K]) =>
    onChange({ ...settings, [key]: value });

  const spec = ABSORBERS[settings.absorber];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Forma e materiale">
          <div className="space-y-3">
            <SelectField
              label="Forma della cassa" infoId="ratio"
              value={settings.shape}
              onChange={v => set('shape', v as BoxShape)}
              options={Object.entries(SHAPE_LABELS).map(([value, label]) => ({ value, label }))}
            />
            <SelectField
              label="Spessore pannelli" infoId="wallthickness"
              value={String(settings.wallThicknessMm || 18)}
              onChange={v => set('wallThicknessMm', Number(v))}
              options={MATERIAL_THICKNESS}
            />
            {settings.shape === 'trapezoidal' && (
              <NumField
                label="Rastremazione (profondità retro / fronte)" infoId="ratio"
                value={settings.taper}
                onChange={v => set('taper', v)}
                step={0.05}
                hint="0.6 = il retro è il 60% del fronte. Utile per bagagliaio o monitor da palco."
              />
            )}
            <NumField
              label="Profondità di montaggio del driver" infoId="mountingdepth"
              unit="mm"
              value={settings.mountingDepthMm}
              onChange={v => set('mountingDepthMm', v)}
              hint="Serve a stimare il volume occupato da cestello e magnete."
            />
            <NumField
              label="Rinforzi interni (bracing)" infoId="bracing"
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
              label="Usa la proporzione aurea (1 : 1,618 : 0,618)" infoId="ratio"
              checked={settings.useGoldenRatio}
              onChange={v => set('useGoldenRatio', v)}
              hint="Distribuisce le risonanze interne su frequenze diverse invece di sovrapporle."
            />
            <NumField
              label="Larghezza imposta (opzionale)" infoId="ratio"
              unit="mm"
              value={settings.fixedWidthMm}
              onChange={v => set('fixedWidthMm', v)}
              hint="Se la imposti, altezza e profondità si adattano per mantenere il volume."
            />
            <NumField
              label="Altezza imposta (opzionale)" infoId="ratio"
              unit="mm"
              value={settings.fixedHeightMm}
              onChange={v => set('fixedHeightMm', v)}
            />
            <SelectField
              label="Materiale fonoassorbente" infoId="absorber"
              value={settings.absorber}
              onChange={v => set('absorber', v as AbsorberId)}
              options={Object.values(ABSORBERS).map(a => ({ value: a.id, label: a.label }))}
            />
            {spec.id !== 'none' && (
              <>
                <SelectField
                  label="Posizionamento" infoId="placement"
                  value={settings.placement}
                  onChange={v => set('placement', v as Placement)}
                  options={(['lining', 'stuffing'] as Placement[]).map(p => ({
                    value: p,
                    label: PLACEMENT_LABELS[p] + (spec.suitable.includes(p) ? '' : ' — sconsigliato'),
                  }))}
                />
                <NumField
                  label="Densità del materiale" infoId="absorber"
                  unit="kg/m³"
                  value={settings.absorberDensityKgM3}
                  onChange={v => set('absorberDensityKgM3', v)}
                  placeholder={String(spec.defaultDensityKgM3)}
                  hint={`Intervallo utilizzabile ${spec.densityRange[0]}–${spec.densityRange[1]} kg/m³.`}
                />
                {settings.placement === 'lining' && (
                  <NumField
                    label="Spessore del rivestimento" infoId="absorber"
                    unit="mm"
                    value={settings.liningThicknessMm}
                    onChange={v => set('liningThicknessMm', v)}
                    placeholder={String(spec.typicalLiningMm)}
                  />
                )}
                <p className="text-[11px] text-graphite leading-relaxed">
                  <span className="text-graphite">Impiego ideale:</span> {spec.bestUse.toLowerCase()}.
                  {spec.note ? ` ${spec.note}` : ''}
                </p>
              </>
            )}
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

          {/* un pannello aperto non ha volume: mostrare cinque zeri sarebbe
              peggio che non mostrare niente */}
          <Section title="Bilancio dei volumi" subtitle="Dal volume interno lordo al volume acustico effettivo." hidden={volumes.gross <= 0}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Stat label="Lordo interno" value={volumes.gross.toFixed(1)} unit="L" />
              <Stat label="− Driver" value={volumes.driverDisp.toFixed(2)} unit="L" />
              <Stat label="− Condotto" value={volumes.portDisp.toFixed(2)} unit="L" />
              <Stat label="− Rinforzi" value={volumes.bracingDisp.toFixed(2)} unit="L" />
              <Stat label="= Netto" value={volumes.net.toFixed(1)} unit="L" accent />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <Stat label="− Solido assorbente" value={volumes.absorberSolid.toFixed(2)} unit="L" />
              <Stat label="= Volume apparente" value={volumes.effective.toFixed(1)} unit="L" accent />
            </div>
          </Section>

          {absorber && absorber.spec.id !== 'none' && absorber.placement !== 'none' && (
            <Section
              title="Effetto del materiale fonoassorbente"
              subtitle={`${absorber.spec.label} — ${PLACEMENT_LABELS[absorber.placement].toLowerCase()}, ${absorber.densityKgM3} kg/m³.`}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <Stat label="Volume apparente" value={`+${(absorber.volume.delta * 100).toFixed(1)}`} unit="%" accent />
                <Stat label="Qa assorbimento" value={absorber.losses.qa.toFixed(1)} />
                <Stat label="Materiale" value={(absorber.fill.materialMassKg * 1000).toFixed(0)} unit="g" />
                <Stat label="Volume occupato" value={`${(absorber.fill.fillFraction * 100).toFixed(0)}`} unit="%" />
                <Stat label="Resistività" value={absorber.losses.sigma.toFixed(0)} unit="Pa·s/m²" />
              </div>

              <p className="text-[11px] text-graphite mt-4 leading-relaxed">
                L'incremento di volume apparente nasce dal passaggio della compressione da adiabatica a
                isotermica: le fibre scambiano calore con l'aria, la velocità del suono cala e il woofer
                «vede» una cassa più grande. Il limite non è convenzionale ma esatto e vale γ − 1 = 40,2%:
                qui siamo al {(absorber.volume.fractionOfLimit * 100).toFixed(0)}% di quel limite.
              </p>

              <div className="mt-5">
                <h4 className="text-[10px] uppercase tracking-wider text-graphite font-bold mb-2">
                  Onde stazionarie interne — f = n·c / 2d
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-graphite border-b border-paper/10">
                        <th className="text-left py-2 font-bold">Asse</th>
                        <th className="text-right py-2 font-bold">Quota</th>
                        <th className="text-right py-2 font-bold">Ordine</th>
                        <th className="text-right py-2 font-bold">Frequenza</th>
                        <th className="text-right py-2 font-bold">α</th>
                        <th className="text-right py-2 font-bold">Q modo</th>
                        <th className="text-right py-2 font-bold">Abbattimento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absorber.modes.slice(0, 6).map(m => (
                        <tr key={`${m.axis}-${m.order}`} className="border-b border-paper/[0.06] text-paper/90">
                          <td className="py-2 capitalize">{m.axis}</td>
                          <td className="py-2 text-right text-graphite">{m.dimensionMm.toFixed(0)} mm</td>
                          <td className="py-2 text-right text-graphite">{m.order}</td>
                          <td className="py-2 text-right font-mono">{m.freqHz.toFixed(0)} Hz</td>
                          <td className="py-2 text-right font-mono">{m.alpha.toFixed(2)}</td>
                          <td className="py-2 text-right font-mono text-graphite">
                            {m.qEmpty.toFixed(0)} → {m.qDamped.toFixed(1)}
                          </td>
                          <td className="py-2 text-right font-mono text-marker">
                            −{m.attenuationDb.toFixed(1)} dB
                            {!m.stillResonant && <span className="text-graphite text-[10px] ml-1">non risuona</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-graphite-dim mt-2 leading-relaxed">
                  Assorbimento α dal modello di Miki (1990) sulla resistività al flusso; resistività dalla
                  densità con Garai-Pompoli (2005) per il poliestere e Bies-Hansen (1980) per le lane
                  minerali. Gli abbattimenti valgono per un modo monodimensionale fra pareti rigide, quindi
                  sono un limite superiore rispetto a quanto si misura in una cassa vera.
                </p>
              </div>

              {absorber.warnings.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                  {absorber.warnings.map((w, i) => (
                    <li key={i} className="text-[11px] text-amber-500/90 leading-relaxed flex gap-2">
                      <span className="text-amber-500 shrink-0">▲</span>{w}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}

          <Section title="Lista di taglio" subtitle={`${panelAreaM2.toFixed(2)} m² di pannello — circa ${Math.ceil(panelAreaM2 / 2.98)} foglio/i da 244×122 cm.`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-graphite border-b border-paper/10">
                    <th className="text-left py-2 font-bold">Pannello</th>
                    <th className="text-right py-2 font-bold">Misure (mm)</th>
                    <th className="text-right py-2 font-bold">Sp.</th>
                    <th className="text-right py-2 font-bold">Qtà</th>
                  </tr>
                </thead>
                <tbody>
                  {panels.map((p, i) => (
                    <tr key={i} className="border-b border-paper/[0.06] last:border-0">
                      <td className="py-2.5">
                        <span className="text-paper font-medium">{p.name}</span>
                        {p.note && <span className="block text-[10px] text-graphite-dim leading-relaxed">{p.note}</span>}
                      </td>
                      <td className="text-right text-paper/90 tabular-nums">{p.width} × {p.height}</td>
                      <td className="text-right text-graphite tabular-nums">{p.thickness}</td>
                      <td className="text-right text-marker font-bold tabular-nums">{p.quantity}</td>
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
