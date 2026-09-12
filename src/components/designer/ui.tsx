/** Primitivi UI condivisi per i calcolatori (input, risultati, grafico SVG) */
import React from 'react';

const ACCENT = '#F27D26';

export function NumField({
  label, value, onChange, unit, step = 'any', min, placeholder, hint,
}: {
  label: string; value: number | ''; onChange: (v: number | '') => void;
  unit?: string; step?: number | 'any'; min?: number; placeholder?: string; hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-zinc-400 font-medium flex items-center justify-between">
        {label} {unit && <span className="text-zinc-600">{unit}</span>}
      </span>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="mt-1 w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27D26] transition-colors"
      />
      {hint && <span className="text-[10px] text-zinc-600 mt-0.5 block">{hint}</span>}
    </label>
  );
}

export function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs text-zinc-400 font-medium">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27D26] transition-colors"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Stat({ label, value, unit, accent }: { label: string; value: string | number; unit?: string; accent?: boolean }) {
  return (
    <div className="bg-zinc-950/60 border border-white/5 rounded-lg p-3">
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-black ${accent ? 'text-[#F27D26]' : 'text-white'}`}>
        {value}{unit && <span className="text-xs font-normal text-zinc-400 ml-1">{unit}</span>}
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
        {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">{inputs}</div>
        <div className="space-y-4">{results}</div>
      </div>
    </div>
  );
}

// ─── Primitivi aggiuntivi del progettista ────────────────────────────────────

export function Section({ title, subtitle, children, right }: {
  title: string; subtitle?: string; children: React.ReactNode; right?: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.15em] text-brand-orange">{title}</h3>
          {subtitle && <p className="text-[11px] text-zinc-500 mt-1">{subtitle}</p>}
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
  const base = 'px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed';
  const styles = variant === 'primary'
    ? 'bg-brand-orange text-white hover:bg-orange-600'
    : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border border-white/10';
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
    <div className="flex gap-1 overflow-x-auto border-b border-white/10 -mx-1 px-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`shrink-0 px-4 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            active === tab.id
              ? 'text-brand-orange border-brand-orange'
              : 'text-zinc-500 border-transparent hover:text-zinc-300'
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
        <p key={i} className="text-[11px] text-amber-500/90 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 leading-relaxed">
          {w}
        </p>
      ))}
    </div>
  );
}

export function CheckField({ label, checked, onChange, hint }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-[#F27D26] cursor-pointer"
      />
      <span>
        <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">{label}</span>
        {hint && <span className="block text-[10px] text-zinc-600">{hint}</span>}
      </span>
    </label>
  );
}

// ─── Grafico SVG (asse X logaritmico) ─────────────────────────────────────────

export interface Series { name: string; color: string; points: { f: number; v: number }[]; }

export function Plot({ series, yLabel, yUnit, height = 240, yMin, yMax }: {
  series: Series[]; yLabel?: string; yUnit?: string; height?: number; yMin?: number; yMax?: number;
}) {
  const W = 560, H = height, padL = 44, padR = 12, padT = 12, padB = 28;
  const allPts = series.flatMap(s => s.points).filter(p => isFinite(p.v));
  if (allPts.length === 0) return <div className="text-xs text-zinc-600 italic">—</div>;

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

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      {/* griglia Y */}
      {yTickVals.map((v, i) => (
        <g key={i}>
          <line x1={padL} y1={yOf(v)} x2={W - padR} y2={yOf(v)} stroke="#27272a" strokeWidth="1" />
          <text x={padL - 6} y={yOf(v) + 3} textAnchor="end" fontSize="9" fill="#71717a">{v.toFixed(v > 100 ? 0 : 1)}</text>
        </g>
      ))}
      {/* griglia X (decadi) */}
      {decades.map(d => (
        <g key={d}>
          <line x1={xOf(d)} y1={padT} x2={xOf(d)} y2={H - padB} stroke="#27272a" strokeWidth="1" />
          <text x={xOf(d)} y={H - padB + 14} textAnchor="middle" fontSize="9" fill="#71717a">{d >= 1000 ? `${d / 1000}k` : d}</text>
        </g>
      ))}
      {/* serie */}
      {series.map((s, si) => {
        const d = s.points.filter(p => isFinite(p.v)).map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(p.f).toFixed(1)},${yOf(p.v).toFixed(1)}`).join(' ');
        return <path key={si} d={d} fill="none" stroke={s.color} strokeWidth="2" />;
      })}
      {/* etichetta Y */}
      {yLabel && <text x={padL - 30} y={padT + 6} fontSize="9" fill="#a1a1aa" transform={`rotate(-90 ${padL - 30} ${H / 2})`} textAnchor="middle">{yLabel}{yUnit ? ` (${yUnit})` : ''}</text>}
      {/* legenda */}
      {series.length > 1 && (
        <g>
          {series.map((s, i) => (
            <g key={i} transform={`translate(${W - padR - 110}, ${padT + 4 + i * 13})`}>
              <rect width="10" height="3" y="3" fill={s.color} />
              <text x="14" y="7" fontSize="9" fill="#a1a1aa">{s.name}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

export const PLOT_COLORS = [ACCENT, '#38bdf8', '#a78bfa', '#34d399', '#f472b6'];
