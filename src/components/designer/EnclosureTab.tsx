import { Lightbulb } from 'lucide-react';
import { NumField, SelectField, Section, ActionButton, Stat, Warnings } from './ui';
import { ALIGNMENTS, ENCLOSURE_LABELS } from '../../utils/audio';
import type {
  AlignmentType, AcousticResult, EnclosureSuggestion, EnclosureType, PortShape,
} from '../../utils/audio';

export interface EnclosureSettings {
  enclosure: EnclosureType;
  alignment: AlignmentType;
  targetQtc: number | '';
  customVbL: number | '';
  customFbHz: number | '';
  portShape: PortShape;
  portCount: number | '';
  portDiameterMm: number | '';
  slotWidthMm: number | '';
  slotHeightMm: number | '';
  bandpassS: number | '';
}

interface Props {
  settings: EnclosureSettings;
  onChange: (next: EnclosureSettings) => void;
  suggestion: EnclosureSuggestion | null;
  acoustic: AcousticResult | null;
}

export function EnclosureTab({ settings, onChange, suggestion, acoustic }: Props) {
  const set = <K extends keyof EnclosureSettings>(key: K, value: EnclosureSettings[K]) =>
    onChange({ ...settings, [key]: value });

  const isVentedFamily = settings.enclosure === 'vented' || settings.enclosure === 'passive-radiator';
  const isBandpass = settings.enclosure === 'bandpass4' || settings.enclosure === 'bandpass6';
  const hasPort = settings.enclosure === 'vented' || isBandpass;

  return (
    <div className="space-y-5">
      {suggestion && (
        <Section
          title="Suggerimento automatico"
          subtitle={`EBP ${suggestion.ebp.toFixed(0)} — indice di idoneità al bass-reflex (Fs/Qes)`}
          right={
            <ActionButton
              variant="primary"
              onClick={() => onChange({ ...settings, enclosure: suggestion.type, alignment: suggestion.alignment })}
            >
              Applica
            </ActionButton>
          }
        >
          <div className="flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-300 leading-relaxed">{suggestion.reason}</p>
              <p className="text-xs text-zinc-500 mt-2">
                Consigliato: <span className="text-brand-orange font-bold">{ENCLOSURE_LABELS[suggestion.type]}</span>
                {suggestion.type === 'vented' && <> con allineamento <span className="text-brand-orange font-bold">{suggestion.alignment}</span></>}
                {suggestion.alternatives.length > 0 && (
                  <> · alternative: {suggestion.alternatives.map(a => ENCLOSURE_LABELS[a]).join(', ')}</>
                )}
              </p>
            </div>
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Tipo di cassa">
          <div className="space-y-3">
            <SelectField
              label="Tipologia"
              value={settings.enclosure}
              onChange={v => set('enclosure', v as EnclosureType)}
              options={Object.entries(ENCLOSURE_LABELS).map(([value, label]) => ({ value, label }))}
            />

            {settings.enclosure === 'sealed' && (
              <NumField
                label="Qtc obiettivo"
                value={settings.targetQtc}
                onChange={v => set('targetQtc', v)}
                step={0.01}
                hint="0.707 Butterworth (piatto) · 0.5 Bessel (transienti) · >0.8 basso enfatizzato"
              />
            )}

            {isVentedFamily && (
              <>
                <SelectField
                  label="Allineamento"
                  value={settings.alignment}
                  onChange={v => set('alignment', v as AlignmentType)}
                  options={ALIGNMENTS.map(a => ({ value: a.value, label: a.label }))}
                />
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  {ALIGNMENTS.find(a => a.value === settings.alignment)?.description}
                </p>
              </>
            )}

            {isBandpass && (
              <NumField
                label="Rapporto camere (anteriore / posteriore)"
                value={settings.bandpassS}
                onChange={v => set('bandpassS', v)}
                step={0.05}
                hint="0.7 risposta centrata · valori bassi = banda stretta e più efficiente"
              />
            )}
          </div>
        </Section>

        <Section title="Progetto acustico" subtitle="Lascia vuoto per il calcolo automatico, oppure imponi i tuoi valori.">
          <div className="space-y-3">
            <NumField label="Volume netto imposto" unit="litri" value={settings.customVbL} onChange={v => set('customVbL', v)} />
            {isVentedFamily && (
              <NumField label="Accordo imposto (Fb)" unit="Hz" value={settings.customFbHz} onChange={v => set('customFbHz', v)} />
            )}

            {acoustic && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Stat label="Volume netto" value={acoustic.vbL.toFixed(1)} unit="L" accent />
                {acoustic.fcHz !== undefined && <Stat label="Fc — risonanza sistema" value={Math.round(acoustic.fcHz)} unit="Hz" />}
                {acoustic.qtc !== undefined && <Stat label="Qtc risultante" value={acoustic.qtc.toFixed(2)} />}
                {acoustic.fbHz !== undefined && <Stat label="Fb — accordo" value={Math.round(acoustic.fbHz)} unit="Hz" />}
                <Stat label="F3 (-3 dB)" value={Math.round(acoustic.f3Hz)} unit="Hz" />
                {acoustic.peakingDb !== undefined && acoustic.peakingDb > 0 && (
                  <Stat label="Picco in banda" value={acoustic.peakingDb.toFixed(1)} unit="dB" />
                )}
                {acoustic.prAddedMassG !== undefined && (
                  <Stat label="Massa sul radiatore" value={Math.round(acoustic.prAddedMassG)} unit="g" accent />
                )}
              </div>
            )}

            {acoustic?.chambers && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <Stat label="Camera posteriore" value={acoustic.chambers.rearL.toFixed(1)} unit="L" />
                <Stat label="Camera anteriore" value={acoustic.chambers.frontL.toFixed(1)} unit="L" />
                <Stat label="Banda utile" value={`${Math.round(acoustic.chambers.fLow)}–${Math.round(acoustic.chambers.fHigh)}`} unit="Hz" accent />
                {acoustic.chambers.fbFront && <Stat label="Accordo anteriore" value={Math.round(acoustic.chambers.fbFront)} unit="Hz" />}
              </div>
            )}
          </div>
        </Section>
      </div>

      {hasPort && (
        <Section title="Condotto reflex" subtitle="La sezione va scelta per tenere la velocità dell'aria sotto i 17 m/s.">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <SelectField
              label="Forma"
              value={settings.portShape}
              onChange={v => set('portShape', v as PortShape)}
              options={[
                { value: 'circular', label: 'Circolare (tubo)' },
                { value: 'slot', label: 'Rettangolare (slot)' },
              ]}
            />
            <NumField label="Numero condotti" value={settings.portCount} onChange={v => set('portCount', v)} min={1} />
            {settings.portShape === 'circular' ? (
              <NumField label="Diametro (vuoto = automatico)" unit="mm" value={settings.portDiameterMm} onChange={v => set('portDiameterMm', v)} />
            ) : (
              <>
                <NumField label="Larghezza slot" unit="mm" value={settings.slotWidthMm} onChange={v => set('slotWidthMm', v)} />
                <NumField label="Altezza slot" unit="mm" value={settings.slotHeightMm} onChange={v => set('slotHeightMm', v)} />
              </>
            )}
          </div>

          {acoustic?.port && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {acoustic.port.diameterMm && <Stat label="Diametro" value={acoustic.port.diameterMm} unit="mm" />}
              {acoustic.port.slotWidthMm && <Stat label="Slot" value={`${acoustic.port.slotWidthMm}×${acoustic.port.slotHeightMm}`} unit="mm" />}
              <Stat label="Lunghezza condotto" value={acoustic.port.lengthMm} unit="mm" accent />
              <Stat label="Area totale" value={acoustic.port.areaCm2.toFixed(0)} unit="cm²" />
              <Stat
                label="Velocità aria"
                value={acoustic.port.velocity.toFixed(1)}
                unit="m/s"
                accent={acoustic.port.velocity > 17}
              />
            </div>
          )}
        </Section>
      )}

      {acoustic && <Warnings items={acoustic.warnings} />}
    </div>
  );
}
