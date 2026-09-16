/** Primitivi UI condivisi per i calcolatori (input, risultati, grafico SVG) */
import React from 'react';
import { GLOSSARY_BY_ID, glossaryUrl } from '../../data/glossary';

const ACCENT = '#35CFC0';
/** inchiostri della tavola, gli stessi definiti in index.css */
const BLUEPRINT = '#6E90B4';
const GRAPHITE = '#8895A5';
const PAPER = '#E4EAF0';
/** il caldo e' riservato agli avvisi e ai limiti: non e' un colore di serie */
const SEGNALE = '#E8A83C';

export type FieldStatus = 'ok' | 'error' | 'unknown';

const STATUS_STYLE: Record<FieldStatus, { dot: string; border: string }> = {
  ok:      { dot: 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]', border: 'border-paper/10' },
  error:   { dot: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]',   border: 'border-red-500/50' },
  unknown: { dot: 'bg-ink-4', border: 'border-paper/10' },
};

/**
 * La ⓘ accanto all'etichetta di un campo porta alla scheda del parametro.
 *
 * Si apre in una scheda nuova di proposito: chi sta compilando il calcolatore
 * non deve perdere il progetto in corso per andare a leggere cos'è il Qts.
 */
export function InfoLink({ id }: { id?: string }) {
  if (!id) return null;
  const entry = GLOSSARY_BY_ID[id];
  if (!entry) return null;
  return (
    <a
      href={glossaryUrl(id)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      title={`${entry.symbol} — ${entry.summary}`}
      aria-label={`Che cos'è ${entry.symbol}: apre la scheda in una nuova pagina`}
      className="shrink-0 w-4 h-4 rounded-full border border-paper/15 text-graphite hover:text-[#35CFC0] hover:border-[#35CFC0]/60 transition-colors flex items-center justify-center text-[9px] font-black leading-none"
    >
      i
    </a>
  );
}

export function NumField({
  label, value, onChange, unit, step = 'any', min, placeholder, hint, status, statusMessage, infoId,
}: {
  label: string; value: number | ''; onChange: (v: number | '') => void;
  unit?: string; step?: number | 'any'; min?: number; placeholder?: string; hint?: string;
  status?: FieldStatus; statusMessage?: string;
  /** id della scheda di glossario da aprire con la ⓘ */
  infoId?: string;
}) {
  const style = STATUS_STYLE[status ?? 'unknown'];
  return (
    <label className="block">
      <span className="text-xs text-graphite font-medium flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 min-w-0">
          {status && (
            <span
              title={statusMessage}
              className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`}
              aria-label={status === 'ok' ? 'parametro coerente' : status === 'error' ? 'parametro incongruente' : 'non verificabile'}
            />
          )}
          <span className="truncate">{label}</span>
          <InfoLink id={infoId} />
        </span>
        {unit && <span className="text-graphite-dim shrink-0">{unit}</span>}
      </span>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        placeholder={placeholder}
        title={statusMessage}
        onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className={`mt-1 w-full bg-ink border rounded-none px-3 py-2 text-sm focus:outline-none focus:border-[#35CFC0] transition-colors ${status ? style.border : 'border-paper/10'}`}
      />
      {status === 'error' && statusMessage && (
        <span className="text-[10px] text-red-400/90 mt-1 block leading-relaxed">{statusMessage}</span>
      )}
      {hint && <span className="text-[10px] text-graphite-dim mt-0.5 block">{hint}</span>}
    </label>
  );
}

export function SelectField({
  label, value, onChange, options, infoId,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  infoId?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-graphite font-medium flex items-center gap-1.5">
        {label}
        <InfoLink id={infoId} />
      </span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 w-full bg-ink border border-paper/10 rounded-none px-3 py-2 text-sm focus:outline-none focus:border-[#35CFC0] transition-colors"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Stat({ label, value, unit, accent }: { label: string; value: string | number; unit?: string; accent?: boolean }) {
  return (
    <div className="bg-ink/60 border border-paper/[0.06] rounded-none p-3">
      <div className="text-[10px] text-graphite uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-black ${accent ? 'text-[#35CFC0]' : 'text-white'}`}>
        {value}{unit && <span className="text-xs font-normal text-graphite ml-1">{unit}</span>}
      </div>
    </div>
  );
}

export function CalcShell({ title, subtitle, inputs, results }: {
  title: string; subtitle?: string; inputs: React.ReactNode; results: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-black">{title}</h3>
        {subtitle && <p className="text-sm text-graphite mt-1">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">{inputs}</div>
        <div className="space-y-4">{results}</div>
      </div>
    </div>
  );
}

// ─── Primitivi aggiuntivi del progettista ────────────────────────────────────

export function Section({ title, subtitle, children, right, hidden }: {
  title: string; subtitle?: string; children: React.ReactNode; right?: React.ReactNode;
  /** per le sezioni che non hanno senso su certe cariche (il volume su un dipolo) */
  hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <div className="bg-ink-2/40 border border-paper/[0.06] rounded-none p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.15em] text-marker">{title}</h3>
          {subtitle && <p className="text-[11px] text-graphite mt-1">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function ActionButton({ children, onClick, variant = 'ghost', disabled, title }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: 'primary' | 'ghost'; disabled?: boolean; title?: string;
}) {
  const base = 'px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed';
  const styles = variant === 'primary'
    ? 'bg-marker text-ink hover:bg-marker/85'
    : 'bg-paper/5 text-paper/90 hover:bg-paper/10 hover:text-white border border-paper/10';
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export function TabBar<T extends string>({ tabs, active, onChange }: {
  tabs: { id: T; label: string; icon?: React.ReactNode }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-paper/10 -mx-1 px-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`shrink-0 px-4 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            active === tab.id
              ? 'text-marker border-marker'
              : 'text-graphite border-transparent hover:text-paper/90'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Warnings({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      {items.map((w, i) => (
        <p key={i} className="text-[11px] text-amber-500/90 bg-amber-500/5 border border-amber-500/20 rounded-none px-3 py-2 leading-relaxed">
          {w}
        </p>
      ))}
    </div>
  );
}

export function CheckField({ label, checked, onChange, hint, infoId }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string; infoId?: string;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-[#35CFC0] cursor-pointer"
      />
      <span>
        <span className="text-xs text-paper/90 group-hover:text-white transition-colors inline-flex items-center gap-1.5">
          {label}
          <InfoLink id={infoId} />
        </span>
        {hint && <span className="block text-[10px] text-graphite-dim">{hint}</span>}
      </span>
    </label>
  );
}

// ─── Grafico SVG (asse X logaritmico) ─────────────────────────────────────────

export interface Series { name: string; color: string; points: { f: number; v: number }[]; }

/** punto della serie più vicino alla frequenza indicata (distanza logaritmica) */
function nearestPoint(points: { f: number; v: number }[], f: number) {
  let best = points[0];
  let bestDist = Infinity;
  for (const p of points) {
    const d = Math.abs(Math.log10(p.f) - Math.log10(f));
    if (d < bestDist) { bestDist = d; best = p; }
  }
  return best;
}

export function Plot({ series, yLabel, yUnit, height = 240, yMin, yMax, decimals = 1 }: {
  series: Series[]; yLabel?: string; yUnit?: string; height?: number;
  yMin?: number; yMax?: number; decimals?: number;
}) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [cursorF, setCursorF] = React.useState<number | null>(null);
  const [pinned, setPinned] = React.useState(false);

  const W = 560, H = height, padL = 44, padR = 12, padT = 12, padB = 28;
  const allPts = series.flatMap(s => s.points).filter(p => isFinite(p.v));
  if (allPts.length === 0) return <div className="text-xs text-graphite-dim italic">—</div>;

  const fs = allPts.map(p => p.f);
  const fMin = Math.min(...fs), fMax = Math.max(...fs);
  const lxMin = Math.log10(fMin), lxMax = Math.log10(fMax);
  let vMin = yMin ?? Math.min(...allPts.map(p => p.v));
  let vMax = yMax ?? Math.max(...allPts.map(p => p.v));
  if (vMin === vMax) { vMin -= 1; vMax += 1; }
  const pad = (vMax - vMin) * 0.08;
  vMin -= pad; vMax += pad;

  const xOf = (f: number) => padL + ((Math.log10(f) - lxMin) / (lxMax - lxMin)) * (W - padL - padR);
  const yOf = (v: number) => padT + (1 - (v - vMin) / (vMax - vMin)) * (H - padT - padB);

  // decadi su X
  const decades: number[] = [];
  for (let d = Math.ceil(lxMin); d <= Math.floor(lxMax); d++) decades.push(Math.pow(10, d));
  // tick Y
  const yticks = 4;
  const yTickVals = Array.from({ length: yticks + 1 }, (_, i) => vMin + ((vMax - vMin) * i) / yticks);

  // ── lettura interattiva ───────────────────────────────────────────────────
  const freqAtClientX = (clientX: number): number | null => {
    const el = svgRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (!rect.width) return null;
    // il viewBox è scalato uniformemente: basta il rapporto di larghezza
    const vbX = (clientX - rect.left) * (W / rect.width);
    const clamped = Math.min(Math.max(vbX, padL), W - padR);
    const ratio = (clamped - padL) / (W - padL - padR);
    return Math.pow(10, lxMin + ratio * (lxMax - lxMin));
  };

  const handleMove = (e: React.PointerEvent) => {
    if (pinned) return;
    setCursorF(freqAtClientX(e.clientX));
  };

  const handleDown = (e: React.PointerEvent) => {
    const f = freqAtClientX(e.clientX);
    if (f === null) return;
    if (pinned && cursorF !== null) {
      // secondo clic: sblocca e segue di nuovo il puntatore
      setPinned(false);
      setCursorF(f);
    } else {
      setCursorF(f);
      setPinned(true);
    }
  };

  // le linee di riferimento (2 soli punti) non entrano nella lettura
  const readable = series.filter(s => s.points.length > 2);
  const readout = cursorF !== null
    ? readable.map(s => ({ name: s.name, color: s.color, point: nearestPoint(s.points, cursorF) }))
    : [];
  const cursorHz = readout.length ? readout[0].point.f : cursorF;

  return (
    <div>
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full touch-none cursor-crosshair"
      role="img"
      onPointerMove={handleMove}
      onPointerDown={handleDown}
      onPointerLeave={() => { if (!pinned) setCursorF(null); }}
    >
      {/* griglia Y */}
      {yTickVals.map((v, i) => (
        <g key={i}>
          <line x1={padL} y1={yOf(v)} x2={W - padR} y2={yOf(v)} stroke="rgba(237,231,218,0.10)" strokeWidth="1" />
          <text x={padL - 6} y={yOf(v) + 3} textAnchor="end" fontSize="9" fontFamily="IBM Plex Mono, monospace" fill={GRAPHITE}>{v.toFixed(v > 100 ? 0 : 1)}</text>
        </g>
      ))}
      {/* griglia X (decadi) */}
      {decades.map(d => (
        <g key={d}>
          <line x1={xOf(d)} y1={padT} x2={xOf(d)} y2={H - padB} stroke="rgba(237,231,218,0.10)" strokeWidth="1" />
          <text x={xOf(d)} y={H - padB + 14} textAnchor="middle" fontSize="9" fontFamily="IBM Plex Mono, monospace" fill={GRAPHITE}>{d >= 1000 ? `${d / 1000}k` : d}</text>
        </g>
      ))}
      {/* serie */}
      {series.map((s, si) => {
        const d = s.points.filter(p => isFinite(p.v)).map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(p.f).toFixed(1)},${yOf(p.v).toFixed(1)}`).join(' ');
        return <path key={si} d={d} fill="none" stroke={s.color} strokeWidth="1.6" />;
      })}
      {/* etichetta Y */}
      {yLabel && <text x={padL - 30} y={padT + 6} fontSize="9" fontFamily="IBM Plex Mono, monospace" fill={GRAPHITE} transform={`rotate(-90 ${padL - 30} ${H / 2})`} textAnchor="middle">{yLabel}{yUnit ? ` (${yUnit})` : ''}</text>}
      {/* legenda */}
      {series.length > 1 && (
        <g>
          {series.map((s, i) => (
            <g key={i} transform={`translate(${W - padR - 110}, ${padT + 4 + i * 13})`}>
              <rect width="10" height="3" y="3" fill={s.color} />
              <text x="14" y="7" fontSize="9" fontFamily="IBM Plex Mono, monospace" fill={GRAPHITE}>{s.name}</text>
            </g>
          ))}
        </g>
      )}

      {/* cursore di lettura */}
      {cursorF !== null && readout.length > 0 && (
        <g pointerEvents="none">
          <line
            x1={xOf(cursorHz!)} y1={padT} x2={xOf(cursorHz!)} y2={H - padB}
            stroke={pinned ? ACCENT : BLUEPRINT}
            strokeWidth="1"
            strokeDasharray={pinned ? undefined : '3 3'}
          />
          {readout.map((r, i) => (
            isFinite(r.point.v) && (
              <circle
                key={i}
                cx={xOf(r.point.f)}
                cy={yOf(r.point.v)}
                r="3.5"
                fill={r.color}
                stroke="#0A0D11"
                strokeWidth="1.5"
              />
            )
          ))}
        </g>
      )}
    </svg>

    {/* valori sotto il grafico */}
    <div className="mt-2 min-h-[26px] flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
      {cursorF !== null && readout.length > 0 ? (
        <>
          <span className={`font-black tabular-nums ${pinned ? 'text-marker' : 'text-paper/90'}`}>
            {cursorHz! >= 1000 ? `${(cursorHz! / 1000).toFixed(2)} kHz` : `${cursorHz!.toFixed(1)} Hz`}
          </span>
          {readout.map((r, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-graphite">
              <span className="w-2 h-0.5 rounded-full" style={{ backgroundColor: r.color }} />
              {r.name}:
              <span className="text-paper font-bold tabular-nums">
                {r.point.v.toFixed(decimals)}{yUnit ? ` ${yUnit}` : ''}
              </span>
            </span>
          ))}
          <span className="text-graphite-dim">{pinned ? '· clicca per sbloccare' : '· clicca per bloccare'}</span>
        </>
      ) : (
        <span className="text-graphite-dim">Passa o clicca sul grafico per leggere i valori punto per punto.</span>
      )}
    </div>
    </div>
  );
}

/**
 * Colori delle curve, in ordine di importanza. Il primo e' l'accento, poi le
 * linee tecniche; il caldo sta in fondo perche' nei grafici marca i limiti
 * (Xmax, soglie) e deve restare distinguibile da tutto il resto.
 */
export const PLOT_COLORS = [ACCENT, BLUEPRINT, '#9B8FD6', '#6FBF8F', PAPER, SEGNALE];
