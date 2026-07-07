/**
 * CabinetBlueprint — elaborato tecnico (stile CAD) del progetto reale.
 *
 * Tavola tecnica completa: prospetto frontale, SEZIONE A-A (pareti tratteggiate,
 * condotto reflex, magnete woofer, sede ampli) e pianta, tutte quotate dalle
 * dimensioni vere. Cornice con coordinate, palloncini numerati con legenda e
 * cartiglio. Vettoriale → sempre nitido, sempre premium.
 */
import { motion } from 'framer-motion';
import type { CabinetDesign, SpeakerDriver } from '../../types/speaker';

const ORANGE = '#F27D26';
const STEEL = '#c7d4e6';   // contorni strutturali
const HATCH = '#5b708c';   // tratteggio sezioni legno
const DIMC = '#8aa0b8';    // linee di quota

interface Props {
  cabinet: CabinetDesign;
  baffleDrivers?: SpeakerDriver[];
  projectCode?: string;
  projectName?: string;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

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
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={DIMC} strokeWidth={1} />
      <path d={arrow(x1, y1, 1)} fill={DIMC} />
      <path d={arrow(x2, y2, -1)} fill={DIMC} />
      {horizontal ? (
        <text x={mx} y={my + (side === 'above' ? -7 : 15)} textAnchor="middle"
          fontSize={12.5} fontFamily="ui-monospace, monospace" fill="#cbd5e1" fontWeight={700}>{label}</text>
      ) : (
        <text x={mx + (side === 'right' ? 10 : -10)} y={my} textAnchor="middle" transform={`rotate(-90 ${mx + (side === 'right' ? 10 : -10)} ${my})`}
          fontSize={12.5} fontFamily="ui-monospace, monospace" fill="#cbd5e1" fontWeight={700}>{label}</text>
      )}
    </motion.g>
  );
}

// Cerchio driver con assi (dash-dot da disegno tecnico) e fori di fissaggio
function DriverSymbol({ cx, cy, r, delay, boltCount = 8 }: { cx: number; cy: number; r: number; delay: number; boltCount?: number }) {
  const bolts = Array.from({ length: boltCount }, (_, i) => {
    const a = (i / boltCount) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * r * 1.08, y: cy + Math.sin(a) * r * 1.08 };
  });
  return (
    <g>
      <motion.circle cx={cx} cy={cy} r={r * 1.08} fill="none" stroke={ORANGE} strokeWidth={1.3}
        strokeDasharray="4 3" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.65 }} transition={{ delay, duration: 0.9 }} />
      <motion.circle cx={cx} cy={cy} r={r} fill="rgba(242,125,38,0.06)" stroke={ORANGE} strokeWidth={2}
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay, duration: 1 }} />
      <motion.circle cx={cx} cy={cy} r={r * 0.32} fill="none" stroke={ORANGE} strokeWidth={1.3}
        initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} transition={{ delay: delay + 0.4 }} />
      {/* assi centrali dash-dot */}
      <line x1={cx - r * 1.3} y1={cy} x2={cx + r * 1.3} y2={cy} stroke={ORANGE} strokeWidth={0.7} strokeOpacity={0.55} strokeDasharray="12 3 2.5 3" />
      <line x1={cx} y1={cy - r * 1.3} x2={cx} y2={cy + r * 1.3} stroke={ORANGE} strokeWidth={0.7} strokeOpacity={0.55} strokeDasharray="12 3 2.5 3" />
      {bolts.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r={2} fill="none" stroke={ORANGE} strokeWidth={1.1} opacity={0.7} />)}
    </g>
  );
}

// Palloncino di richiamo numerato con linea di rimando
function Balloon({ n, ax, ay, bx, by, delay }: { n: number; ax: number; ay: number; bx: number; by: number; delay: number }) {
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay, duration: 0.4 }}>
      <line x1={ax} y1={ay} x2={bx} y2={by} stroke={ORANGE} strokeWidth={0.9} strokeOpacity={0.7} />
      <circle cx={bx} cy={by} r={8.5} fill="#0a1122" stroke={ORANGE} strokeWidth={1.4} />
      <text x={bx} y={by + 3.5} textAnchor="middle" fontSize={10} fontFamily="ui-monospace, monospace" fill={ORANGE} fontWeight={800}>{n}</text>
    </motion.g>
  );
}

export function CabinetBlueprint({ cabinet, baffleDrivers, projectCode, projectName }: Props) {
  const W = cabinet.externalDimensions.width;
  const H = cabinet.externalDimensions.height;
  const D = cabinet.externalDimensions.depth;
  const D2 = (d: number) => Math.round(d);

  // ── Layout tavola: FRONTE | SEZIONE A-A | PIANTA su una riga ──────────────
  const VBW = 920, VBH = 560;
  const M1 = 8, M2 = 24;            // doppia cornice con banda coordinate
  const FX = 120, FY = 96;
  const g1 = 70, g2 = 58;           // interspazi (nel primo passa la quota asse woofer)
  const availH = 330;
  const availW = (VBW - M2 - 40) - FX - g1 - g2;  // -40: spazio per la quota profondità della pianta
  const scale = Math.min(availH / H, availW / (2 * W + D));
  const fw = W * scale, fh = H * scale;   // frontale
  const sw = D * scale;                    // sezione (profondità)
  const SX = FX + fw + g1;                 // origine sezione
  const TX = SX + sw + g2, TY = FY;        // origine pianta
  const tw = fw, th = sw;                  // pianta: L×P

  const t = Math.max(3, cabinet.woodThickness * scale);  // spessore pannelli in px
  const innerW = sw - 2 * t;

  // ── Componenti sul baffle ──────────────────────────────────────────────────
  const drv = baffleDrivers && baffleDrivers.length ? baffleDrivers : [];
  const woofer = drv[0];
  const hf = drv.length > 1 ? drv[drv.length - 1] : null;
  const cxF = FX + fw / 2;
  const mdia = (d?: SpeakerDriver) => d ? (d.mountingDiameter || d.overallDiameter || d.size * 25.4) : 0;

  const wR = (mdia(woofer) * scale) / 2;
  const wooferCy = hf ? FY + fh * 0.64 : FY + fh * 0.52;
  const isTweeter = hf?.type === 'tweeter';
  const hfR = hf ? (mdia(hf) * scale) / 2 * 0.8 : 0;   // raggio tweeter a cupola
  const hornW = hf ? Math.min(fw * 0.5, (mdia(hf) * scale) * 2.2) : 0;
  const hornH = hf ? hornW * 0.62 : 0;
  const hornCy = FY + fh * 0.24;
  const hfHalfW = isTweeter ? hfR : hornW / 2;          // semilarghezza in prospetto

  // ── Porta ──────────────────────────────────────────────────────────────────
  const port = cabinet.port;
  const isSlot = port?.shape === 'slot' && port.slotWidth;
  const slotW = isSlot ? (port!.slotWidth! * scale) : 0;
  const slotH = isSlot ? Math.max(6, (port!.slotHeight! * scale)) : 0;
  const portCircR = port && !isSlot && port.diameter ? (port.diameter * scale) / 2 : 0;
  const ductLen = port ? Math.min(port.length * scale, innerW - 10) : 0;
  const ductFolded = port ? port.length * scale > innerW - 10 : false;

  // ── Richiami numerati (palloncini + legenda) ───────────────────────────────
  const hfLabel = hf
    ? (hf.type === 'compression-driver'
      ? (/tromba/i.test(hf.model) ? `${hf.brand} ${hf.model}` : `Tromba + ${hf.brand} ${hf.model}`)
      : `Tweeter ${hf.brand} ${hf.model}`)
    : '';
  type Callout = { n: number; label: string; ax: number; ay: number; bx: number; by: number };
  const callouts: Callout[] = [];
  let nn = 1;
  if (woofer) {
    callouts.push({
      n: nn++, label: `Woofer ${woofer.size}" ${woofer.brand} ${woofer.model} — foro Ø${D2(mdia(woofer))} mm`,
      ax: cxF - wR * 0.72, ay: wooferCy - wR * 0.72,
      bx: clamp(cxF - wR - 24, FX + 16, FX + fw - 16), by: clamp(wooferCy - wR - 18, FY + 16, FY + fh - 16),
    });
  }
  if (hf) {
    callouts.push({
      n: nn++, label: hfLabel,
      ax: cxF - hfHalfW, ay: hornCy,
      bx: clamp(cxF - hfHalfW - 26, FX + 16, FX + fw - 16), by: hornCy - 12,
    });
  }
  if (port) {
    const pAy = isSlot ? FY + fh - slotH / 2 - 12 : FY + fh - portCircR - 16;
    const pAx = isSlot ? cxF - slotW / 2 + 8 : FX + fw - portCircR - 16;
    callouts.push({
      n: nn++,
      label: isSlot
        ? `Porta slot ${D2(port.slotWidth!)}×${D2(port.slotHeight!)} mm — condotto ${D2(port.length)} mm${ductFolded ? ' (a L)' : ''} · ${port.tuningFrequency} Hz`
        : `${port.count ?? 1}× porta Ø${D2(port.diameter!)} mm, L ${D2(port.length)} mm · ${port.tuningFrequency} Hz`,
      ax: pAx, ay: pAy,
      bx: FX + 22, by: clamp(pAy - 22, FY + 16, FY + fh - 16),
    });
  }
  const ampY1 = FY + fh * 0.32;
  const ampH = cabinet.ampCutout ? Math.min(cabinet.ampCutout.height * scale, fh * 0.30) : 0;
  if (cabinet.ampCutout) {
    callouts.push({
      n: nn++, label: `Sede modulo amplificatore ${cabinet.ampCutout.width}×${cabinet.ampCutout.height} mm (retro)`,
      ax: SX + sw - t, ay: ampY1 + ampH / 2,
      bx: SX + sw + 20, by: ampY1 + ampH / 2,
    });
  }

  // codice progetto: se non fornito, generato dai dati reali
  const code = projectCode || `ODS-${cabinet.type === 'sealed' ? 'CB' : 'BR'}${woofer ? woofer.size : ''}-${Math.round(cabinet.internalVolume)}L`;
  const today = new Date().toLocaleDateString('it-IT');

  // banda coordinate: 6 colonne / 3 righe
  const cols = 6, rows = 3;
  const colW = (VBW - 2 * M2) / cols, rowH = (VBH - 2 * M2) / rows;

  const wooferAxisMm = D2((FY + fh - wooferCy) / scale);
  const braceY = FY + fh * 0.46;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden relative" style={{ background: 'radial-gradient(120% 100% at 30% 0%, #0f1830 0%, #0a0f1c 55%, #070912 100%)' }}>
      <svg viewBox={`0 0 ${VBW} ${VBH}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet" role="img"
        aria-label={`Disegno tecnico quotato: cassa ${W} per ${H} per ${D} mm`}>
        <defs>
          <pattern id="bpgrid" width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M26 0 L0 0 0 26" fill="none" stroke="#2b3a55" strokeOpacity="0.3" strokeWidth="0.6" />
          </pattern>
          <pattern id="bphatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke={HATCH} strokeWidth="1.1" strokeOpacity="0.8" />
          </pattern>
        </defs>

        <rect x="0" y="0" width={VBW} height={VBH} fill="url(#bpgrid)" />

        {/* watermark ODS */}
        <text x={VBW / 2} y={VBH / 2 + 60} textAnchor="middle" fontSize={190} fontFamily="ui-monospace, monospace"
          fontWeight={900} fill={ORANGE} opacity={0.03} transform={`rotate(-10 ${VBW / 2} ${VBH / 2})`}>ODS</text>

        {/* ── Cornice tavola con banda coordinate ── */}
        <rect x={M1} y={M1} width={VBW - 2 * M1} height={VBH - 2 * M1} fill="none" stroke="#3a4d70" strokeWidth={1.6} />
        <rect x={M2} y={M2} width={VBW - 2 * M2} height={VBH - 2 * M2} fill="none" stroke="#3a4d70" strokeWidth={0.9} />
        {Array.from({ length: cols - 1 }, (_, i) => (
          <g key={`c${i}`}>
            <line x1={M2 + colW * (i + 1)} y1={M1} x2={M2 + colW * (i + 1)} y2={M2} stroke="#3a4d70" strokeWidth={0.8} />
            <line x1={M2 + colW * (i + 1)} y1={VBH - M2} x2={M2 + colW * (i + 1)} y2={VBH - M1} stroke="#3a4d70" strokeWidth={0.8} />
          </g>
        ))}
        {Array.from({ length: cols }, (_, i) => (
          <g key={`cl${i}`}>
            <text x={M2 + colW * (i + 0.5)} y={M1 + 12} textAnchor="middle" fontSize={8.5} fontFamily="ui-monospace, monospace" fill="#55688a">{i + 1}</text>
            <text x={M2 + colW * (i + 0.5)} y={VBH - M1 - 4} textAnchor="middle" fontSize={8.5} fontFamily="ui-monospace, monospace" fill="#55688a">{i + 1}</text>
          </g>
        ))}
        {Array.from({ length: rows - 1 }, (_, i) => (
          <g key={`r${i}`}>
            <line x1={M1} y1={M2 + rowH * (i + 1)} x2={M2} y2={M2 + rowH * (i + 1)} stroke="#3a4d70" strokeWidth={0.8} />
            <line x1={VBW - M2} y1={M2 + rowH * (i + 1)} x2={VBW - M1} y2={M2 + rowH * (i + 1)} stroke="#3a4d70" strokeWidth={0.8} />
          </g>
        ))}
        {Array.from({ length: rows }, (_, i) => (
          <g key={`rl${i}`}>
            <text x={M1 + 8} y={M2 + rowH * (i + 0.5) + 3} textAnchor="middle" fontSize={8.5} fontFamily="ui-monospace, monospace" fill="#55688a">{String.fromCharCode(65 + i)}</text>
            <text x={VBW - M1 - 8} y={M2 + rowH * (i + 0.5) + 3} textAnchor="middle" fontSize={8.5} fontFamily="ui-monospace, monospace" fill="#55688a">{String.fromCharCode(65 + i)}</text>
          </g>
        ))}

        {/* ── Intestazione ── */}
        <text x={40} y={52} fontSize={13} fontFamily="ui-monospace, monospace" fill={ORANGE} fontWeight={800} letterSpacing={3}>OFFICINA DEL SUONO — ELABORATO TECNICO</text>
        <text x={40} y={68} fontSize={10.5} fontFamily="ui-monospace, monospace" fill={DIMC}>PROSPETTO / SEZIONE / PIANTA — QUOTE IN mm</text>
        <text x={VBW - 36} y={52} textAnchor="end" fontSize={11} fontFamily="ui-monospace, monospace" fill="#cbd5e1" fontWeight={700}>{code}</text>

        {/* titoli viste */}
        <text x={FX + fw / 2} y={FY - 16} textAnchor="middle" fontSize={10} fontFamily="ui-monospace, monospace" fill={DIMC} fontWeight={700}>FRONTE</text>
        <text x={SX + sw / 2} y={FY - 16} textAnchor="middle" fontSize={10} fontFamily="ui-monospace, monospace" fill={DIMC} fontWeight={700}>SEZIONE A-A</text>
        <text x={TX + tw / 2} y={FY - 16} textAnchor="middle" fontSize={10} fontFamily="ui-monospace, monospace" fill={DIMC} fontWeight={700}>PIANTA</text>

        {/* ── PROSPETTO FRONTALE ── */}
        <motion.rect x={FX} y={FY} width={fw} height={fh} rx={Math.min(8, fw * 0.03)} fill="rgba(138,160,184,0.03)"
          stroke={STEEL} strokeWidth={2}
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.1 }} />
        <rect x={FX + 6} y={FY + 6} width={fw - 12} height={fh - 12} rx={5} fill="none" stroke="#4a5a76" strokeWidth={0.8} strokeDasharray="2 3" />

        {/* traccia del piano di sezione A-A */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.5 }}>
          <line x1={cxF} y1={FY - 8} x2={cxF} y2={FY + fh + 8} stroke={STEEL} strokeWidth={0.9} strokeDasharray="14 4 3 4" opacity={0.65} />
          <path d={`M${cxF},${FY - 8} l8,4 l-8,4 z`} fill={STEEL} opacity={0.8} />
          <path d={`M${cxF},${FY + fh + 8} l8,-4 l-8,-4 z`} fill={STEEL} opacity={0.8} />
          <text x={cxF + 13} y={FY - 4} fontSize={9.5} fontFamily="ui-monospace, monospace" fill={STEEL} fontWeight={700}>A</text>
          <text x={cxF + 13} y={FY + fh + 12} fontSize={9.5} fontFamily="ui-monospace, monospace" fill={STEEL} fontWeight={700}>A</text>
        </motion.g>

        {woofer && <DriverSymbol cx={cxF} cy={wooferCy} r={wR} delay={0.55} boltCount={woofer.size >= 15 ? 8 : 6} />}
        {hf && (isTweeter ? (
          <DriverSymbol cx={cxF} cy={hornCy} r={hfR} delay={0.85} boltCount={4} />
        ) : (
          <g>
            <motion.rect x={cxF - hornW / 2} y={hornCy - hornH / 2} width={hornW} height={hornH} rx={5}
              fill="rgba(242,125,38,0.06)" stroke={ORANGE} strokeWidth={2}
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 0.85, duration: 0.9 }} />
            <rect x={cxF - hornW * 0.22} y={hornCy - hornH * 0.28} width={hornW * 0.44} height={hornH * 0.56} rx={3} fill="none" stroke={ORANGE} strokeWidth={1.1} opacity={0.7} />
            <line x1={cxF - hornW * 0.58} y1={hornCy} x2={cxF + hornW * 0.58} y2={hornCy} stroke={ORANGE} strokeWidth={0.7} strokeOpacity={0.5} strokeDasharray="12 3 2.5 3" />
          </g>
        ))}

        {/* porta in prospetto */}
        {isSlot && (
          <motion.rect x={cxF - slotW / 2} y={FY + fh - slotH - 12} width={slotW} height={slotH} rx={3}
            fill="rgba(138,160,184,0.05)" stroke={STEEL} strokeWidth={1.6}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0, duration: 0.6 }} />
        )}
        {portCircR > 0 && (
          <motion.circle cx={FX + fw - portCircR - 16} cy={FY + fh - portCircR - 16} r={portCircR}
            fill="rgba(0,0,0,0.4)" stroke={STEEL} strokeWidth={1.6}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} />
        )}

        {/* quote frontale */}
        <Dim x1={FX} y1={FY + fh + 28} x2={FX + fw} y2={FY + fh + 28} label={`${D2(W)}`} delay={1.3} />
        <Dim x1={FX - 28} y1={FY} x2={FX - 28} y2={FY + fh} label={`${D2(H)}`} delay={1.4} side="left" />
        {woofer && (
          <Dim x1={FX + fw + 30} y1={wooferCy} x2={FX + fw + 30} y2={FY + fh} label={`${wooferAxisMm}`} delay={1.55} side="right" />
        )}

        {/* ── SEZIONE A-A: pareti tratteggiate + interni ── */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.9 }}>
          {/* pareti (legno in sezione) */}
          <rect x={SX} y={FY} width={sw} height={t} fill="url(#bphatch)" stroke={STEEL} strokeWidth={1} />
          <rect x={SX} y={FY + fh - t} width={sw} height={t} fill="url(#bphatch)" stroke={STEEL} strokeWidth={1} />
          <rect x={SX} y={FY} width={t} height={fh} fill="url(#bphatch)" stroke={STEEL} strokeWidth={1} />
          <rect x={SX + sw - t} y={FY} width={t} height={fh} fill="url(#bphatch)" stroke={STEEL} strokeWidth={1} />
          <rect x={SX} y={FY} width={sw} height={fh} fill="none" stroke={STEEL} strokeWidth={2} />
        </motion.g>

        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }}>
          {/* woofer in sezione: cono + magnete (fronte a sinistra) */}
          {woofer && (() => {
            const cd = Math.min(wR * 0.9, innerW * 0.42);
            return (
              <g>
                <path d={`M${SX + t},${wooferCy - wR} L${SX + t + cd},${wooferCy - wR * 0.3} L${SX + t + cd},${wooferCy + wR * 0.3} L${SX + t},${wooferCy + wR}`}
                  fill="none" stroke={ORANGE} strokeWidth={1.6} />
                <rect x={SX + t + cd} y={wooferCy - wR * 0.35} width={cd * 0.5} height={wR * 0.7}
                  fill="rgba(242,125,38,0.08)" stroke={ORANGE} strokeWidth={1.4} />
                <line x1={SX + 2} y1={wooferCy} x2={SX + t + cd * 1.7} y2={wooferCy} stroke={ORANGE} strokeWidth={0.7} strokeOpacity={0.55} strokeDasharray="12 3 2.5 3" />
              </g>
            );
          })()}
          {/* tromba/tweeter in sezione */}
          {hf && (() => {
            const hd = innerW * (isTweeter ? 0.12 : 0.3);
            const h2 = isTweeter ? hfR : hornH / 2;
            return (
              <g>
                <path d={`M${SX + t},${hornCy - h2} L${SX + t + hd},${hornCy - h2 * 0.35} L${SX + t + hd},${hornCy + h2 * 0.35} L${SX + t},${hornCy + h2}`}
                  fill="none" stroke={ORANGE} strokeWidth={1.5} />
                <rect x={SX + t + hd} y={hornCy - 8} width={isTweeter ? 8 : 12} height={16} fill="rgba(242,125,38,0.08)" stroke={ORANGE} strokeWidth={1.2} />
              </g>
            );
          })()}
          {/* rinforzo interno (solo 2 vie: nel sub lo spazio è del condotto) */}
          {hf && (
            <rect x={SX + t + innerW * 0.32} y={braceY} width={innerW * 0.36} height={Math.max(3, t * 0.8)}
              fill="none" stroke={HATCH} strokeWidth={1} strokeDasharray="4 3" />
          )}
          {/* condotto reflex a slot: setto + freccia flusso */}
          {isSlot && (() => {
            const tb = Math.max(3, t * 0.75);
            const shelfY = FY + fh - t - slotH - tb;
            const chY = FY + fh - t - slotH / 2;
            return (
              <g>
                <rect x={SX + t} y={shelfY} width={ductLen} height={tb} fill="url(#bphatch)" stroke={STEEL} strokeWidth={1} />
                <line x1={SX + t + ductLen * 0.75} y1={chY} x2={SX - 12} y2={chY} stroke={ORANGE} strokeWidth={1.1} strokeOpacity={0.8} />
                <path d={`M${SX - 14},${chY} l8,-3.5 l0,7 z`} fill={ORANGE} opacity={0.8} />
              </g>
            );
          })()}
          {/* condotto reflex circolare: tubo tratteggiato */}
          {portCircR > 0 && (
            <rect x={SX + t} y={FY + fh - t - portCircR * 2 - 10} width={ductLen} height={portCircR * 2}
              fill="none" stroke={STEEL} strokeWidth={1.2} strokeDasharray="5 3" />
          )}
          {/* sede modulo ampli sul retro */}
          {cabinet.ampCutout && (
            <rect x={SX + sw - t - 2} y={ampY1} width={t + 4} height={ampH}
              fill="rgba(242,125,38,0.07)" stroke={ORANGE} strokeWidth={1.3} strokeDasharray="4 2.5" />
          )}
        </motion.g>

        <Dim x1={SX} y1={FY + fh + 28} x2={SX + sw} y2={FY + fh + 28} label={`${D2(D)}`} delay={1.45} />

        {/* ── PIANTA ── */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.9 }}>
          <rect x={TX} y={TY} width={tw} height={t} fill="url(#bphatch)" stroke={STEEL} strokeWidth={1} />
          <rect x={TX} y={TY + th - t} width={tw} height={t} fill="url(#bphatch)" stroke={STEEL} strokeWidth={1} />
          <rect x={TX} y={TY} width={t} height={th} fill="url(#bphatch)" stroke={STEEL} strokeWidth={1} />
          <rect x={TX + tw - t} y={TY} width={t} height={th} fill="url(#bphatch)" stroke={STEEL} strokeWidth={1} />
          <rect x={TX} y={TY} width={tw} height={th} fill="none" stroke={STEEL} strokeWidth={2} />
          {/* asse */}
          <line x1={TX + tw / 2} y1={TY - 6} x2={TX + tw / 2} y2={TY + th + 6} stroke={DIMC} strokeWidth={0.7} strokeOpacity={0.6} strokeDasharray="12 3 2.5 3" />
          {/* woofer visto dall'alto (nascosto → tratteggiato), fronte in basso */}
          {woofer && (() => {
            const rt = Math.min(wR, th - 2 * t - 4);
            const by = TY + th - t;
            return <path d={`M${TX + tw / 2 - rt},${by} A${rt},${rt} 0 0 1 ${TX + tw / 2 + rt},${by}`}
              fill="none" stroke={ORANGE} strokeWidth={1.2} strokeDasharray="4 3" opacity={0.75} />;
          })()}
          {/* bocca porta slot sul baffle */}
          {isSlot && (
            <rect x={TX + tw / 2 - slotW / 2} y={TY + th - t} width={slotW} height={t} fill="#0a0f1c" stroke={STEEL} strokeWidth={1} />
          )}
          <text x={TX + tw / 2} y={TY + th + 14} textAnchor="middle" fontSize={8.5} fontFamily="ui-monospace, monospace" fill="#55688a">FRONTE ↓</text>
        </motion.g>
        <Dim x1={TX + tw + 26} y1={TY} x2={TX + tw + 26} y2={TY + th} label={`${D2(D)}`} delay={1.5} side="right" />

        {/* ── Palloncini di richiamo ── */}
        {callouts.map((c, i) => <Balloon key={c.n} n={c.n} ax={c.ax} ay={c.ay} bx={c.bx} by={c.by} delay={1.6 + i * 0.12} />)}

        {/* ── Legenda ── */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9, duration: 0.5 }}>
          <text x={40} y={VBH - 82} fontSize={9} fontFamily="ui-monospace, monospace" fill={DIMC} fontWeight={800} letterSpacing={2}>LEGENDA</text>
          {callouts.map((c, i) => (
            <g key={c.n}>
              <circle cx={46} cy={VBH - 71 + i * 12.5} r={6} fill="#0a1122" stroke={ORANGE} strokeWidth={1.1} />
              <text x={46} y={VBH - 68 + i * 12.5} textAnchor="middle" fontSize={8} fontFamily="ui-monospace, monospace" fill={ORANGE} fontWeight={800}>{c.n}</text>
              <text x={58} y={VBH - 68 + i * 12.5} fontSize={9.5} fontFamily="ui-monospace, monospace" fill="#aab8cc">{c.label}</text>
            </g>
          ))}
        </motion.g>

        {/* ── CARTIGLIO ── */}
        <g transform={`translate(${VBW - M2 - 280}, ${VBH - 142})`}>
          <rect x={0} y={0} width={280} height={116} rx={5} fill="rgba(7,12,26,0.88)" stroke="#3a4d70" strokeWidth={1} />
          <rect x={0} y={0} width={280} height={25} rx={5} fill="rgba(242,125,38,0.12)" />
          <text x={12} y={17} fontSize={12} fontFamily="ui-monospace, monospace" fill={ORANGE} fontWeight={800} letterSpacing={2}>OFFICINA DEL SUONO</text>
          <text x={12} y={43} fontSize={10.5} fontFamily="ui-monospace, monospace" fill="#cbd5e1" fontWeight={700}>{(projectName || cabinet.name).slice(0, 34)}</text>
          <line x1={10} y1={51} x2={270} y2={51} stroke="#3a4d70" strokeWidth={0.7} />
          <text x={12} y={65} fontSize={9.5} fontFamily="ui-monospace, monospace" fill={DIMC}>Tipo: {cabinet.type === 'sealed' ? 'cassa chiusa' : 'bass-reflex'} · {cabinet.woodType} {cabinet.woodThickness}mm</text>
          <text x={12} y={79} fontSize={9.5} fontFamily="ui-monospace, monospace" fill={DIMC}>Volume netto: {cabinet.internalVolume} L · Peso ~{Math.round(cabinet.estimatedWeight)} kg</text>
          <line x1={10} y1={87} x2={270} y2={87} stroke="#3a4d70" strokeWidth={0.7} />
          <text x={12} y={100} fontSize={9.5} fontFamily="ui-monospace, monospace" fill={DIMC}>Cod. {code} · REV A · FOGLIO 1/1</text>
          <text x={12} y={111} fontSize={9} fontFamily="ui-monospace, monospace" fill="#55688a">{today} · quote in mm · scala adattiva</text>
        </g>
      </svg>

      <div className="pointer-events-none absolute bottom-3 left-4 text-[10px] font-mono text-white/35">quote reali del tuo progetto</div>
    </div>
  );
}

export default CabinetBlueprint;
