import { useMemo, useState } from 'react';
import { Search, Save, Trash2, Wand2, Users, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { NumField, SelectField, Section, ActionButton, Stat, Warnings, CheckField, type FieldStatus } from './ui';
import { CATEGORY_LABELS, DRIVER_LIBRARY, type DriverCategory, type LibraryDriver } from '../../data/driverLibrary';
import { WIRING_LABELS } from '../../utils/audio';
import type { DriverConfig, DriverWiring, TSInput, TSParams, ValidationResult } from '../../utils/audio';

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
  // `dia` non viene mai preso dal diametro di foratura: quello è la flangia,
  // non il cono. Il diametro effettivo lo ricava il motore da Sd.
  return {
    fs: t.fs, qts: t.qts, qes: t.qes, qms: t.qms, vas: t.vas,
    xmax: t.xmax, xmech: t.xmech, sd: t.sd, re: t.re, mms: t.mms, bl: t.bl, le: t.le,
    pe: d.powerRMS, impedance: d.impedance, sensitivity: d.sensitivity,
  };
}

interface Props {
  input: TSInput;
  onChange: (next: TSInput) => void;
  derived: TSInput;
  validation: ValidationResult;
  config: DriverConfig;
  onConfigChange: (next: DriverConfig) => void;
  onAutoDerive: () => void;
  configWarnings: string[];
  effectiveSummary: { impedance: number; power: number; sensitivityDelta: number; cones: number };
}

export function DriverTab({
  input, onChange, derived, validation, config, onConfigChange, onAutoDerive, configWarnings, effectiveSummary,
}: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<DriverCategory | 'all'>('all');
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [custom, setCustom] = useState<CustomDriver[]>(loadCustom);
  const [saveName, setSaveName] = useState('');

  const set = (key: keyof TSInput) => (v: number | '') =>
    onChange({ ...input, [key]: v === '' ? undefined : v });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = category === 'all' ? DRIVER_LIBRARY : DRIVER_LIBRARY.filter(d => d.category === category);
    if (!q) return pool;
    return pool.filter(d =>
      `${d.brand} ${d.model} ${d.size}" ${d.type}`.toLowerCase().includes(q),
    );
  }, [query, category]);

  const loadDriver = (d: LibraryDriver) => {
    onChange(libraryToInput(d));
    setLoadedId(d.id);
  };

  /** valore da mostrare: quello inserito, altrimenti quello derivato (in grigio) */
  const shown = (key: keyof TSInput): number | '' => {
    const v = input[key];
    if (typeof v === 'number') return v;
    const d = derived[key];
    return typeof d === 'number' ? Number(d.toFixed(d < 1 ? 4 : 2)) : '';
  };

  const isDerived = (key: keyof TSInput) =>
    typeof input[key] !== 'number' && typeof derived[key] === 'number';

  /** verde = confermato dalle altre grandezze, rosso = incongruente, grigio = non verificabile */
  const statusOf = (key: keyof TSParams): { status: FieldStatus; message: string } => {
    const check = validation.checks[key];
    if (check) return { status: check.status, message: check.message };
    if (isDerived(key)) {
      // «coerente per costruzione» vale solo se i parametri di partenza non si
      // contraddicono: la derivazione applica la prima relazione disponibile e
      // si ferma, quindi dentro un insieme incongruente restituisce una delle
      // risposte possibili — non un valore verificato.
      return validation.errorCount === 0
        ? { status: 'ok', message: 'Calcolato dagli altri parametri: coerente per costruzione.' }
        : { status: 'unknown', message: 'Calcolato da parametri che non tornano fra loro: correggi prima le incongruenze in rosso.' };
    }
    if (typeof input[key] === 'number') {
      return { status: 'unknown', message: 'Non verificabile: servono gli altri parametri della stessa relazione.' };
    }
    return { status: 'unknown', message: 'Non inserito.' };
  };

  const field = (key: keyof TSParams, label: string, unit?: string, step?: number) => {
    const { status, message } = statusOf(key);
    return (
      <NumField
        label={label + (isDerived(key) ? ' ·calcolato' : '')}
        unit={unit}
        value={shown(key)}
        onChange={set(key)}
        step={step ?? 'any'}
        status={status}
        statusMessage={message}
        infoId={key}
      />
    );
  };

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
        title={`Libreria altoparlanti · ${DRIVER_LIBRARY.length} driver`}
        subtitle="Parametri presi dalle schede tecniche ufficiali. Caricali come punto di partenza, poi modificali liberamente."
      >
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-graphite-dim absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cerca marca, modello o misura (es. 18, B&C, subwoofer)"
              className="w-full bg-ink border border-paper/10 rounded-none pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-marker transition-colors"
            />
          </div>
          <div className="flex gap-1 shrink-0">
            {([['all', 'Tutti'], ['pro', CATEGORY_LABELS.pro], ['car', CATEGORY_LABELS.car]] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={`px-3 py-2 rounded-none text-xs font-bold uppercase tracking-wider transition-all border ${
                  category === value
                    ? 'bg-marker text-white border-marker'
                    : 'bg-paper/5 text-graphite border-paper/10 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {results.map(d => (
            <div
              key={d.id}
              className={`rounded-none border transition-colors ${
                loadedId === d.id ? 'bg-marker/10 border-marker/50' : 'bg-ink/60 border-paper/[0.06] hover:border-marker/40'
              }`}
            >
              <button type="button" onClick={() => loadDriver(d)} className="text-left w-full px-3 pt-2">
                <div className="text-xs font-bold text-white">{d.brand} {d.model}</div>
                <div className="text-[10px] text-graphite">
                  {d.size}" · {d.type} · {d.impedance}Ω · Fs {d.thielSmall.fs}Hz · Qts {d.thielSmall.qts}
                  {d.thielSmall.vas !== undefined && ` · Vas ${d.thielSmall.vas}L`}
                </div>
              </button>
              <div className="px-3 pb-2 pt-1">
                <a
                  href={d.datasheet}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[10px] text-graphite-dim hover:text-marker transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> scheda ufficiale
                </a>
                {d.note && <p className="text-[10px] text-amber-500/70 mt-1 leading-relaxed">{d.note}</p>}
              </div>
            </div>
          ))}
          {!results.length && <p className="text-xs text-graphite-dim italic">Nessun driver trovato.</p>}
        </div>

        {custom.length > 0 && (
          <div className="mt-4 pt-4 border-t border-paper/[0.06]">
            <p className="text-[10px] uppercase tracking-wider text-graphite mb-2">I tuoi driver salvati</p>
            <div className="flex flex-wrap gap-2">
              {custom.map(c => (
                <span key={c.name} className="inline-flex items-center gap-1.5 bg-ink/60 border border-paper/10 rounded-none pl-3 pr-1.5 py-1">
                  <button type="button" onClick={() => onChange(c.params)} className="text-xs font-bold text-paper hover:text-marker transition-colors">
                    {c.name}
                  </button>
                  <button type="button" onClick={() => handleDelete(c.name)} className="text-graphite-dim hover:text-red-400 transition-colors" title="Elimina">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-paper/[0.06] flex gap-2">
          <input
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            placeholder="Nome per salvare questo driver"
            className="flex-1 bg-ink border border-paper/10 rounded-none px-3 py-2 text-sm focus:outline-none focus:border-marker transition-colors"
          />
          <ActionButton onClick={handleSave} disabled={!saveName.trim()}>
            <span className="flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Salva</span>
          </ActionButton>
        </div>
      </Section>

      {/* Stato di congruenza del set */}
      <div className={`flex items-start gap-2.5 rounded-none px-4 py-3 border ${
        validation.errorCount > 0
          ? 'bg-red-500/5 border-red-500/30'
          : 'bg-green-500/5 border-green-500/20'
      }`}>
        {validation.errorCount > 0
          ? <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          : <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />}
        <p className="text-xs text-paper/90 leading-relaxed">
          {validation.errorCount > 0 ? (
            <>
              <span className="font-bold text-red-400">
                {validation.errorCount === 1 ? '1 parametro non torna' : `${validation.errorCount} parametri non tornano`}
              </span>{' '}
              con gli altri: i campi col pallino rosso contraddicono le relazioni Thiele-Small. Correggi il valore
              oppure cancellalo e premi «Completa» per ricalcolarlo.
            </>
          ) : (
            <>
              <span className="font-bold text-green-500">Parametri coerenti</span>
              {validation.verifiedCount > 0
                ? ` — ${validation.verifiedCount} valori verificati per incrocio con le relazioni Thiele-Small.`
                : ' — inserisci più valori per poterli verificare fra loro.'}
            </>
          )}
        </p>
      </div>

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
        right={<Users className="w-4 h-4 text-graphite-dim" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <NumField
            label="Numero di altoparlanti" infoId="wiring"
            value={config.count}
            onChange={v => {
              const count = v === '' ? 1 : Math.max(1, Math.round(v));
              // "singolo" con più driver è una contraddizione: passa al parallelo
              const wiring = count > 1 && config.wiring === 'single' ? 'parallel' : config.wiring;
              onConfigChange({ ...config, count, wiring });
            }}
            min={1}
          />
          <SelectField
            label="Collegamento" infoId="wiring"
            value={config.wiring}
            onChange={v => {
              const wiring = v as DriverWiring;
              // il singolo vuole un driver solo; l'isobarico ne vuole almeno due
              const count = wiring === 'single' ? 1
                : wiring === 'isobaric' ? Math.max(2, config.count)
                : config.count;
              onConfigChange({ ...config, wiring, count });
            }}
            options={Object.entries(WIRING_LABELS).map(([value, label]) => ({ value, label }))}
          />

          {(config.wiring === 'isobaric' || config.wiring === 'push-pull') && (
            <SelectField
              label="Connessione elettrica"
              infoId="wiring"
              value={config.electrical ?? 'parallel'}
              onChange={v => onConfigChange({ ...config, electrical: v as 'series' | 'parallel' })}
              options={[
                { value: 'parallel', label: 'Parallelo' },
                { value: 'series', label: 'Serie' },
              ]}
            />
          )}
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
