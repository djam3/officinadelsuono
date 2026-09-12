import { useMemo, useState } from 'react';
import { Search, Save, Trash2, Wand2, Users } from 'lucide-react';
import { NumField, SelectField, Section, ActionButton, Stat, Warnings, CheckField } from './ui';
import { DRIVER_LIBRARY, type LibraryDriver } from '../../data/driverLibrary';
import { WIRING_LABELS } from '../../utils/audio';
import type { DriverConfig, DriverWiring, TSInput } from '../../utils/audio';

const CUSTOM_KEY = 'ods-custom-drivers';

interface CustomDriver { name: string; params: TSInput; }

function loadCustom(): CustomDriver[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? (JSON.parse(raw) as CustomDriver[]) : [];
  } catch {
    return [];
  }
}

function saveCustom(list: CustomDriver[]) {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
  } catch {
    /* spazio esaurito o storage non disponibile: si continua senza salvare */
  }
}

function libraryToInput(d: LibraryDriver): TSInput {
  const t = d.thielSmall;
  return {
    fs: t.fs, qts: t.qts, qes: t.qes, qms: t.qms, vas: t.vas,
    xmax: t.xmax, sd: t.sd, re: t.re, mms: t.mms, bl: t.bl, le: t.le,
    pe: d.powerRMS, impedance: d.impedance, sensitivity: d.sensitivity,
    dia: d.mountingDiameter,
  };
}

interface Props {
  input: TSInput;
  onChange: (next: TSInput) => void;
  derived: TSInput;
  config: DriverConfig;
  onConfigChange: (next: DriverConfig) => void;
  onAutoDerive: () => void;
  configWarnings: string[];
  effectiveSummary: { impedance: number; power: number; sensitivityDelta: number; cones: number };
}

export function DriverTab({
  input, onChange, derived, config, onConfigChange, onAutoDerive, configWarnings, effectiveSummary,
}: Props) {
  const [query, setQuery] = useState('');
  const [custom, setCustom] = useState<CustomDriver[]>(loadCustom);
  const [saveName, setSaveName] = useState('');

  const set = (key: keyof TSInput) => (v: number | '') =>
    onChange({ ...input, [key]: v === '' ? undefined : v });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DRIVER_LIBRARY.slice(0, 6);
    return DRIVER_LIBRARY.filter(d =>
      `${d.brand} ${d.model} ${d.size}" ${d.type}`.toLowerCase().includes(q),
    ).slice(0, 12);
  }, [query]);

  /** valore da mostrare: quello inserito, altrimenti quello derivato (in grigio) */
  const shown = (key: keyof TSInput): number | '' => {
    const v = input[key];
    if (typeof v === 'number') return v;
    const d = derived[key];
    return typeof d === 'number' ? Number(d.toFixed(d < 1 ? 4 : 2)) : '';
  };

  const isDerived = (key: keyof TSInput) =>
    typeof input[key] !== 'number' && typeof derived[key] === 'number';

  const field = (key: keyof TSInput, label: string, unit?: string, step?: number) => (
    <NumField
      label={label + (isDerived(key) ? ' ·calcolato' : '')}
      unit={unit}
      value={shown(key)}
      onChange={set(key)}
      step={step ?? 'any'}
    />
  );

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;
    const next = [...custom.filter(c => c.name !== name), { name, params: input }];
    setCustom(next);
    saveCustom(next);
    setSaveName('');
  };

  const handleDelete = (name: string) => {
    const next = custom.filter(c => c.name !== name);
    setCustom(next);
    saveCustom(next);
  };

  return (
    <div className="space-y-5">
      {/* Libreria */}
      <Section
        title="Libreria altoparlanti"
        subtitle="Carica un driver come punto di partenza, poi modifica liberamente i valori."
      >
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cerca marca, modello o misura (es. 18, B&C, subwoofer)"
            className="w-full bg-zinc-950 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-brand-orange transition-colors"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
          {results.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => onChange(libraryToInput(d))}
              className="text-left px-3 py-2 rounded-lg bg-zinc-950/60 border border-white/5 hover:border-brand-orange/40 transition-colors"
            >
              <div className="text-xs font-bold text-white">{d.brand} {d.model}</div>
              <div className="text-[10px] text-zinc-500">
                {d.size}" · {d.type} · Fs {d.thielSmall.fs}Hz · Qts {d.thielSmall.qts} · Vas {d.thielSmall.vas}L
              </div>
            </button>
          ))}
          {!results.length && <p className="text-xs text-zinc-600 italic">Nessun driver trovato.</p>}
        </div>

        {custom.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">I tuoi driver salvati</p>
            <div className="flex flex-wrap gap-2">
              {custom.map(c => (
                <span key={c.name} className="inline-flex items-center gap-1.5 bg-zinc-950/60 border border-white/10 rounded-lg pl-3 pr-1.5 py-1">
                  <button type="button" onClick={() => onChange(c.params)} className="text-xs font-bold text-zinc-200 hover:text-brand-orange transition-colors">
                    {c.name}
                  </button>
                  <button type="button" onClick={() => handleDelete(c.name)} className="text-zinc-600 hover:text-red-400 transition-colors" title="Elimina">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
          <input
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            placeholder="Nome per salvare questo driver"
            className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange transition-colors"
          />
          <ActionButton onClick={handleSave} disabled={!saveName.trim()}>
            <span className="flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Salva</span>
          </ActionButton>
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section
          title="Parametri meccanici"
          right={
            <ActionButton onClick={onAutoDerive} variant="primary" title="Calcola i parametri mancanti da quelli inseriti">
              <span className="flex items-center gap-1.5"><Wand2 className="w-3.5 h-3.5" /> Completa</span>
            </ActionButton>
          }
        >
          <div className="space-y-3">
            {field('fs', 'Fs — Risonanza libera', 'Hz')}
            {field('qms', 'Qms — Q meccanico')}
            {field('vas', 'Vas — Volume equivalente', 'litri')}
            {field('cms', 'Cms — Compliance', 'mm/N')}
            {field('mms', 'Mms — Massa mobile', 'g')}
            {field('rms', 'Rms — Resistenza meccanica', 'kg/s')}
            {field('xmax', 'Xmax — Escursione lineare', 'mm')}
            {field('xmech', 'Xmech — Escursione meccanica', 'mm')}
            {field('dia', 'Dia — Diametro cono', 'mm')}
            {field('sd', 'Sd — Area radiante', 'cm²')}
            {field('vd', 'Vd — Volume spostato', 'cm³')}
          </div>
        </Section>

        <div className="space-y-5">
          <Section title="Parametri elettrici">
            <div className="space-y-3">
              {field('qes', 'Qes — Q elettrico')}
              {field('re', 'Re — Resistenza DC', 'Ω')}
              {field('le', 'Le — Induttanza bobina', 'mH')}
              {field('impedance', 'Z — Impedenza nominale', 'Ω')}
              {field('bl', 'BL — Fattore di forza', 'T·m')}
              {field('pe', 'Pe — Potenza continua', 'W')}
            </div>
          </Section>

          <Section title="Parametri elettromeccanici" subtitle="Calcolati automaticamente dai precedenti.">
            <div className="space-y-3">
              {field('qts', 'Qts — Q totale')}
              {field('eta0', 'η0 — Efficienza', '%')}
              {field('sensitivity', 'Sensibilità 1W/1m', 'dB')}
            </div>
          </Section>
        </div>
      </div>

      <Section
        title="Configurazione altoparlanti"
        subtitle="Più driver nella stessa cassa: cambia volume richiesto, impedenza e resa."
        right={<Users className="w-4 h-4 text-zinc-600" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <NumField
            label="Numero di altoparlanti"
            value={config.count}
            onChange={v => onConfigChange({ ...config, count: v === '' ? 1 : Math.max(1, Math.round(v)) })}
            min={1}
          />
          <SelectField
            label="Collegamento"
            value={config.wiring}
            onChange={v => onConfigChange({ ...config, wiring: v as DriverWiring })}
            options={Object.entries(WIRING_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <Stat label="Coni radianti" value={effectiveSummary.cones} />
          <Stat label="Carico ampli" value={effectiveSummary.impedance.toFixed(1)} unit="Ω" accent />
          <Stat label="Potenza totale" value={Math.round(effectiveSummary.power)} unit="W" />
          <Stat label="Resa" value={`${effectiveSummary.sensitivityDelta >= 0 ? '+' : ''}${effectiveSummary.sensitivityDelta.toFixed(1)}`} unit="dB" />
        </div>

        <CheckField
          label="Isobarico: stessa risposta in metà volume"
          checked={config.wiring === 'isobaric'}
          onChange={v => onConfigChange({ ...config, wiring: v ? 'isobaric' : 'parallel', count: v ? Math.max(2, config.count) : config.count })}
          hint="Due driver accoppiati per ogni cono radiante, uno dietro l'altro."
        />

        <div className="mt-3">
          <Warnings items={configWarnings} />
        </div>
      </Section>
    </div>
  );
}
