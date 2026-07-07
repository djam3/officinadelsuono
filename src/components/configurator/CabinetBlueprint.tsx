/**
 * CabinetBlueprint — elaborato tecnico (stile CAD) del progetto reale.
 *
 * Disegna prospetto frontale + laterale QUOTATI dalle dimensioni vere della
 * cassa, con driver/tromba/porta in posizione, cartiglio e linee che si
 * "disegnano" all'ingresso. Vettoriale → sempre nitido, sempre premium,
 * e comunica "progetto ingegneristico vero" meglio di qualsiasi 3D.
 */
import { motion } from 'framer-motion';
import type { CabinetDesign, SpeakerDriver } from '../../types/speaker';

const ORANGE = '#F27D26';

interface Props {
  cabinet: CabinetDesign;
  baffleDrivers?: SpeakerDriver[];
  projectCode?: string;
  projectName?: string;
}

// Linea di quota con estensioni e frecce, orizzontale o verticale
function Dim({ x1, y1, x2, y2, label, delay = 0, side = 'below' }: {
  x1: number; y1: number; x2: number; y2: number; label: string; delay?: number;
  side?: 'below' | 'above' | 'left' | 'right';
}) {
  const horizontal = y1 === y2;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const arrow = (px: number, py: number, dir: number) => horizontal
    ? `M${px},${py} l${6 * dir},-3 l0,6 z`
    : `M${px},${py} l-3,${6 * dir} l6,0 z`;
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay, duration: 0.5 }}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8aa0b8" strokeWidth={1} />
      <path d={arrow(x1, y1, 1)} fill="#8aa0b8" />
      <path d={arrow(x2, y2, -1)} fill="#8aa0b8" />
      {horizontal ? (
        <text x={mx} y={my + (side === 'above' ? -7 : 15)} textAnchor="middle"
          fontSize={13} fontFamily="ui-monospace, monospace" fill="#cbd5e1" fontWeight={700}>{label}</text>
      ) : (
        <text x={mx + (side === 'right' ? 9 : -9)} y={my} textAnchor="middle" transform={`rotate(-90 ${mx + (side === 'right' ? 9 : -9)} ${my})`}
          fontSize={13} fontFamily="ui-monospace, monospace" fill="#cbd5e1" fontWeight={700}>{label}</text>
      )}
    </motion.g>
  );
}

// Cerchio driver con crocino e fori di fissaggio
function DriverSymbol({ cx, cy, r, delay, label, boltCount = 8 }: { cx: number; cy: number; r: number; delay: number; label: string; boltCount?: number }) {
  const bolts = Array.from({ length: boltCount }, (_, i) => {
    const a = (i / boltCount) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * r * 1.08, y: cy + Math.sin(a) * r * 1.08 };
  });
  return (
    <g>
      <motion.circle cx={cx} cy={cy} r={r * 1.08} fill="none" stroke={ORANGE} strokeWidth={1.4}
        strokeDasharray="4 3" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.7 }} transition={{ delay, duration: 0.9 }} />
      <motion.circle cx={cx} cy={cy} r={r} fill="rgba(242,125,38,0.06)" stroke={ORANGE} strokeWidth={2}
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay, duration: 1 }} />
      <motion.circle cx={cx} cy={cy} r={r * 0.32} fill="none" stroke={ORANGE} strokeWidth={1.4}
        initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} transition={{ delay: delay + 0.4 }} />
      {/* crocino */}
      <line x1={cx - r * 1.25} y1={cy} x2={cx + r * 1.25} y2={cy} stroke={ORANGE} strokeWidth={0.7} strokeOpacity={0.5} />
      <line x1={cx} y1={cy - r * 1.25} x2={cx} y2={cy + r * 1.25} stroke={ORANGE} strokeWidth={0.7} strokeOpacity={0.5} />
      {bolts.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r={2.1} fill="none" stroke={ORANGE} strokeWidth={1.2} opacity={0.7} />)}
      <text x={cx} y={cy + r + 15} textAnchor="middle" fontSize={10.5} fontFamily="ui-monospace, monospace" fill="#94a3b8">{label}</text>
    </g>
  );
}

export function CabinetBlueprint({ cabinet, baffleDrivers, projectCode, projectName }: Props) {
  const W = cabinet.externalDimensions.width;
  const H = cabinet.externalDimensions.height;
  const D = cabinet.externalDimensions.depth;

  // Layout SVG
  const VBW = 920, VBH = 560;
  const FX = 130, FY = 78;          // origine prospetto frontale
  const availH = 372, availW = 560, gap = 74;
  const scale = Math.min(availH / H, (availW - gap) / (W + D));
  const fw = W * scale, fh = H * scale;   // frontale
  const sw = D * scale;                    // laterale (profondità)
  const SX = FX + fw + gap;                // origine laterale

  // Driver in ordine grave→acuto
  const drv = baffleDrivers && baffleDrivers.length ? baffleDrivers : [];
  const woofer = drv[0];
  const hf = drv.length > 1 ? drv[drv.length - 1] : null;
  const cxF = FX + fw / 2;
  const mdia = (d?: SpeakerDriver) => d ? (d.mountingDiameter || d.overallDiameter || d.size * 25.4) : 0;

  // Posizioni verticali (dal fondo): woofer basso, tromba/tweeter in alto
  const wR = (mdia(woofer) * scale) / 2;
  const wooferCy = hf ? FY + fh * 0.64 : FY + fh * 0.52;
  const hornW = hf ? Math.min(fw * 0.5, (mdia(hf) * scale) * 2.2) : 0;
  const hornH = hf ? hornW * 0.62 : 0;
  const hornCy = FY + fh * 0.24;

  // Porta
  const port = cabinet.port;
  const isSlot = port?.shape === 'slot' && port.slotWidth;
  const slotW = isSlot ? (port!.slotWidth! * scale) : 0;
  const slotH = isSlot ? Math.max(6, (port!.slotHeight! * scale)) : 0;
  const portCircR = port && !isSlot && port.diameter ? (port.diameter * scale) / 2 : 0;

  const D2 = (d: number) => Math.round(d);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden relative" style={{ background: 'radial-gradient(120% 100% at 30% 0%, #0f1830 0%, #0a0f1c 55%, #070912 100%)' }}>
      <svg viewBox={`0 0 ${VBW} ${VBH}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet" role="img"
        aria-label={`Disegno tecnico quotato: cassa ${W} per ${H} per ${D} mm`}>
        <defs>
          <pattern id="bpgrid" width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M26 0 L0 0 0 26" fill="none" stroke="#2b3a55" strokeOpacity="0.35" strokeWidth="0.6" />
          </pattern>
          <pattern id="bpgridBig" width="130" height="130" patternUnits="userSpaceOnUse">
            <path d="M130 0 L0 0 0 130" fill="none" stroke="#3a4d70" strokeOpacity="0.35" strokeWidth="1" />
          </pattern>
        </defs>

        <rect x="0" y="0" width={VBW} height={VBH} fill="url(#bpgrid)" />
        <rect x="0" y="0" width={VBW} height={VBH} fill="url(#bpgridBig)" />

        {/* Intestazione */}
        <text x={FX} y={40} fontSize={13} fontFamily="ui-monospace, monospace" fill={ORANGE} fontWeight={800} letterSpacing={3}>OFFICINA DEL SUONO — ELABORATO TECNICO</text>
        <text x={FX} y={58} fontSize={11} fontFamily="ui-monospace, monospace" fill="#8aa0b8">PROSPETTO FRONTALE / LATERALE — QUOTE IN mm</text>

        {/* ── PROSPETTO FRONTALE ── */}
        <motion.rect x={FX} y={FY} width={fw} height={fh} rx={Math.min(10, fw * 0.03)} fill="rgba(138,160,184,0.03)"
          stroke="#c7d4e6" strokeWidth={2}
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.1 }} />
        {/* smusso interno (baffle) */}
        <rect x={FX + 7} y={FY + 7} width={fw - 14} height={fh - 14} rx={6} fill="none" stroke="#4a5a76" strokeWidth={0.8} strokeDasharray="2 3" />

        {woofer && <DriverSymbol cx={cxF} cy={wooferCy} r={wR} delay={0.6} label={`${woofer.size}" ${woofer.brand} — Ø${D2(mdia(woofer))}`} boltCount={woofer.size >= 15 ? 8 : 6} />}
        {hf && (
          <g>
            <motion.rect x={cxF - hornW / 2} y={hornCy - hornH / 2} width={hornW} height={hornH} rx={6}
              fill="rgba(242,125,38,0.06)" stroke={ORANGE} strokeWidth={2}
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 0.9, duration: 0.9 }} />
            <rect x={cxF - hornW * 0.22} y={hornCy - hornH * 0.28} width={hornW * 0.44} height={hornH * 0.56} rx={3} fill="none" stroke={ORANGE} strokeWidth={1.2} opacity={0.7} />
            <text x={cxF} y={hornCy + hornH / 2 + 15} textAnchor="middle" fontSize={10.5} fontFamily="ui-monospace, monospace" fill="#94a3b8">
              {hf.type === 'compression-driver'
                ? (/tromba/i.test(hf.model) ? `${hf.brand} ${hf.model}` : `tromba + ${hf.brand} ${hf.model}`)
                : `tweeter ${hf.brand} ${hf.model}`}
            </text>
          </g>
        )}

        {/* Porta */}
        {isSlot && (
          <g>
            <motion.rect x={cxF - slotW / 2} y={FY + fh - slotH - 12} width={slotW} height={slotH} rx={3}
              fill="rgba(138,160,184,0.05)" stroke="#c7d4e6" strokeWidth={1.6}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.6 }} />
            <text x={cxF} y={FY + fh - slotH - 18} textAnchor="middle" fontSize={10} fontFamily="ui-monospace, monospace" fill="#94a3b8">
              porta slot {D2(port!.slotWidth!)}×{D2(port!.slotHeight!)} · {port!.tuningFrequency}Hz
            </text>
          </g>
        )}
        {portCircR > 0 && (
          <g>
            <motion.circle cx={FX + fw - portCircR - 16} cy={FY + fh - portCircR - 16} r={portCircR}
              fill="rgba(0,0,0,0.4)" stroke="#c7d4e6" strokeWidth={1.6}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} />
            <text x={FX + fw - portCircR - 16} y={FY + fh - 6} textAnchor="middle" fontSize={9.5} fontFamily="ui-monospace, monospace" fill="#94a3b8">porta Ø{D2(port!.diameter!)} · {port!.tuningFrequency}Hz</text>
          </g>
        )}

        {/* Quote frontale */}
        <Dim x1={FX} y1={FY + fh + 30} x2={FX + fw} y2={FY + fh + 30} label={`${D2(W)}`} delay={1.3} />
        <Dim x1={FX - 30} y1={FY} x2={FX - 30} y2={FY + fh} label={`${D2(H)}`} delay={1.4} side="left" />

        {/* ── PROSPETTO LATERALE ── */}
        <motion.rect x={SX} y={FY} width={sw} height={fh} rx={Math.min(8, sw * 0.04)} fill="rgba(138,160,184,0.03)"
          stroke="#c7d4e6" strokeWidth={2}
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 1 }} />
        {/* piastra ampli sul retro (accennata) */}
        {cabinet.ampCutout && (
          <rect x={SX + sw - 12} y={FY + fh * 0.55} width={7} height={fh * 0.3} fill="none" stroke={ORANGE} strokeWidth={1.4} strokeDasharray="3 2" opacity={0.7} />
        )}
        <Dim x1={SX} y1={FY + fh + 30} x2={SX + sw} y2={FY + fh + 30} label={`${D2(D)}`} delay={1.5} />
        <text x={SX + sw / 2} y={FY - 10} textAnchor="middle" fontSize={10} fontFamily="ui-monospace, monospace" fill="#8aa0b8">LATO</text>
        <text x={FX + fw / 2} y={FY - 10} textAnchor="middle" fontSize={10} fontFamily="ui-monospace, monospace" fill="#8aa0b8">FRONTE</text>

        {/* ── CARTIGLIO (title block) ── */}
        <g transform={`translate(${VBW - 292}, ${VBH - 118})`}>
          <rect x={0} y={0} width={280} height={104} rx={6} fill="rgba(7,12,26,0.85)" stroke="#3a4d70" strokeWidth={1} />
          <rect x={0} y={0} width={280} height={26} rx={6} fill="rgba(242,125,38,0.12)" />
          <text x={12} y={17} fontSize={12} fontFamily="ui-monospace, monospace" fill={ORANGE} fontWeight={800} letterSpacing={2}>OFFICINA DEL SUONO</text>
          <text x={12} y={44} fontSize={10.5} fontFamily="ui-monospace, monospace" fill="#cbd5e1">{(projectName || cabinet.name).slice(0, 34)}</text>
          <text x={12} y={62} fontSize={9.5} fontFamily="ui-monospace, monospace" fill="#8aa0b8">Tipo: {cabinet.type === 'sealed' ? 'cassa chiusa' : 'bass-reflex'} · {cabinet.woodType} {cabinet.woodThickness}mm</text>
          <text x={12} y={78} fontSize={9.5} fontFamily="ui-monospace, monospace" fill="#8aa0b8">Volume netto: {cabinet.internalVolume} L · Peso ~{Math.round(cabinet.estimatedWeight)} kg</text>
          <text x={12} y={95} fontSize={9.5} fontFamily="ui-monospace, monospace" fill="#8aa0b8">Cod. {projectCode || '—'} · Scala automatica · mm</text>
        </g>
      </svg>

      <div className="pointer-events-none absolute bottom-3 left-4 text-[10px] font-mono text-white/35">quote reali del tuo progetto</div>
    </div>
  );
}

export default CabinetBlueprint;
