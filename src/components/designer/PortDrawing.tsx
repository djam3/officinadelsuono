/**
 * Disegno tecnico del condotto reflex.
 *
 * Due viste affiancate, entrambe in scala sulle misure calcolate:
 *  - la SEZIONE DELLA LUCE, che mostra la forma dell'apertura e quali lati
 *    sono pareti della cassa invece che pannelli da costruire;
 *  - lo SVILUPPO LONGITUDINALE, che mostra come il condotto attraversa il
 *    pannello, come terminano le due bocche e, per i ripiegati, il percorso
 *    tratto per tratto.
 */

import { PORT_TYPES, type PortGeometry } from '../../utils/audio';

const ORANGE = '#FF5F00';
const WALL = '#52525b';    // pareti della cassa
const DIM = '#8aa0b8';     // quote
const LABEL = '#a1a1aa';

interface Props {
  geometry: PortGeometry;
  lengthMm: number;
  segments?: { name: string; lengthMm: number }[];
}

/** quota orizzontale con frecce ed estensioni */
function DimH({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={DIM} strokeWidth={1} />
      <path d={`M${x1},${y} l6,-3 l0,6 z`} fill={DIM} />
      <path d={`M${x2},${y} l-6,-3 l0,6 z`} fill={DIM} />
      <text x={(x1 + x2) / 2} y={y - 5} textAnchor="middle" fontSize="9" fill={DIM}>{label}</text>
    </g>
  );
}

/** quota verticale */
function DimV({ y1, y2, x, label }: { y1: number; y2: number; x: number; label: string }) {
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2} stroke={DIM} strokeWidth={1} />
      <path d={`M${x},${y1} l-3,6 l6,0 z`} fill={DIM} />
      <path d={`M${x},${y2} l-3,-6 l6,0 z`} fill={DIM} />
      <text x={x - 4} y={(y1 + y2) / 2 + 3} textAnchor="end" fontSize="9" fill={DIM}>{label}</text>
    </g>
  );
}

/** tratteggio del legno, per distinguere le pareti della cassa */
function Hatch() {
  return (
    <defs>
      <pattern id="woodHatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" stroke={WALL} strokeWidth="2.5" />
      </pattern>
    </defs>
  );
}

export function PortDrawing({ geometry, lengthMm, segments }: Props) {
  const spec = PORT_TYPES[geometry.type];
  const W = 560, H = 224;

  // ── vista 1: sezione della luce ─────────────────────────────────────────────
  const boxX = 46, boxY = 42, boxMax = 110;

  const crossSection = () => {
    if (spec.section === 'circular') {
      const d = geometry.diameterMm ?? 100;
      const r = boxMax / 2;
      const cx = boxX + r, cy = boxY + r;
      const isFlared = geometry.type === 'flared';
      return (
        <g>
          {isFlared && <circle cx={cx} cy={cy} r={r} fill="none" stroke={WALL} strokeWidth={1} strokeDasharray="3 3" />}
          <circle cx={cx} cy={cy} r={isFlared ? r * 0.72 : r} fill={`${ORANGE}12`} stroke={ORANGE} strokeWidth={2} />
          <DimH x1={cx - (isFlared ? r * 0.72 : r)} x2={cx + (isFlared ? r * 0.72 : r)} y={boxY + boxMax + 22} label={`Ø${d} mm`} />
          {isFlared && <text x={cx} y={boxY - 8} textAnchor="middle" fontSize="8" fill={LABEL}>bocca svasata</text>}
        </g>
      );
    }

    if (spec.section === 'triangular') {
      const a = geometry.legAMm ?? 100, b = geometry.legBMm ?? 100;
      const scale = boxMax / Math.max(a, b);
      const la = a * scale, lb = b * scale;
      const ox = boxX, oy = boxY + boxMax;
      return (
        <g>
          {/* le due pareti della cassa che formano lo spigolo */}
          <rect x={ox - 9} y={oy - lb} width={9} height={lb + 9} fill="url(#woodHatch)" />
          <rect x={ox} y={oy} width={la} height={9} fill="url(#woodHatch)" />
          {/* luce del condotto */}
          <path d={`M${ox},${oy} L${ox + la},${oy} L${ox},${oy - lb} Z`} fill={`${ORANGE}12`} stroke={ORANGE} strokeWidth={1} />
          {/* il pannello diagonale: l'unico pezzo da costruire */}
          <line x1={ox + la} y1={oy} x2={ox} y2={oy - lb} stroke={ORANGE} strokeWidth={3} />
          <DimH x1={ox} x2={ox + la} y={oy + 28} label={`${Math.round(a)} mm`} />
          <DimV y1={oy - lb} y2={oy} x={ox - 16} label={`${Math.round(b)}`} />
        </g>
      );
    }

    // rettangolare: slot, shelf, angolo, ripiegati
    const w = geometry.widthMm ?? 200, h = geometry.heightMm ?? 40;
    const scale = Math.min(boxMax / w, (boxMax * 0.7) / Math.max(h, 1));
    const lw = w * scale, lh = Math.max(10, h * scale);
    const ox = boxX, oy = boxY + boxMax / 2 - lh / 2;
    const shared = spec.sharedWalls;
    return (
      <g>
        {/* pareti della cassa riusate come lati del condotto */}
        {shared >= 1 && <rect x={ox} y={oy + lh} width={lw} height={9} fill="url(#woodHatch)" />}
        {shared >= 2 && <rect x={ox - 9} y={oy} width={9} height={lh + 9} fill="url(#woodHatch)" />}
        {/* luce */}
        <rect x={ox} y={oy} width={lw} height={lh} fill={`${ORANGE}12`} stroke={ORANGE} strokeWidth={1} />
        {/* pannelli da costruire, in tratto spesso */}
        <line x1={ox} y1={oy} x2={ox + lw} y2={oy} stroke={ORANGE} strokeWidth={3} />
        {shared < 1 && <line x1={ox} y1={oy + lh} x2={ox + lw} y2={oy + lh} stroke={ORANGE} strokeWidth={3} />}
        {shared < 2 && <line x1={ox} y1={oy} x2={ox} y2={oy + lh} stroke={ORANGE} strokeWidth={3} />}
        <line x1={ox + lw} y1={oy} x2={ox + lw} y2={oy + lh} stroke={ORANGE} strokeWidth={3} />
        <DimH x1={ox} x2={ox + lw} y={oy + lh + 30} label={`${Math.round(w)} mm`} />
        <DimV y1={oy} y2={oy + lh} x={ox - 14} label={`${Math.round(h)}`} />
      </g>
    );
  };

  // ── vista 2: sviluppo longitudinale ────────────────────────────────────────
  const lx = 210, rx = W - 24;          // area utile
  const baffleX = lx + 14;
  const availW = rx - baffleX - 30;

  const longitudinal = () => {
    const dEq = geometry.diameterMm ?? geometry.heightMm ?? 60;
    const ductH = Math.max(12, Math.min(34, dEq * 0.35));
    const midY = 96;

    // pannello frontale attraversato dal condotto
    const baffle = (
      <g>
        <rect x={baffleX - 12} y={40} width={12} height={110} fill="url(#woodHatch)" />
        <text x={baffleX - 6} y={34} textAnchor="middle" fontSize="8" fill={LABEL}>pannello</text>
      </g>
    );

    if (!spec.folded) {
      const scale = availW / Math.max(lengthMm, 1);
      const len = Math.min(availW, lengthMm * scale);
      const x0 = baffleX;
      const y0 = midY - ductH / 2, y1 = midY + ductH / 2;
      const flared = geometry.type === 'flared';
      const freeEnds = geometry.type === 'circular-free';
      const doubleFlange = geometry.type === 'circular-double-flanged';

      return (
        <g>
          {baffle}
          {/* il condotto sporge all'esterno quando le bocche sono libere */}
          {freeEnds && (
            <>
              <line x1={baffleX - 24} y1={y0} x2={x0} y2={y0} stroke={ORANGE} strokeWidth={2} />
              <line x1={baffleX - 24} y1={y1} x2={x0} y2={y1} stroke={ORANGE} strokeWidth={2} />
            </>
          )}
          {/* pareti del condotto */}
          <line x1={x0} y1={y0} x2={x0 + len} y2={y0} stroke={ORANGE} strokeWidth={2} />
          <line x1={x0} y1={y1} x2={x0 + len} y2={y1} stroke={ORANGE} strokeWidth={2} />
          <rect x={x0} y={y0} width={len} height={ductH} fill={`${ORANGE}0e`} />

          {/* trattamento delle bocche */}
          {flared && (
            <>
              <path d={`M${x0},${y0} q-16,0 -22,-11`} fill="none" stroke={ORANGE} strokeWidth={2} />
              <path d={`M${x0},${y1} q-16,0 -22,11`} fill="none" stroke={ORANGE} strokeWidth={2} />
              <path d={`M${x0 + len},${y0} q16,0 22,-11`} fill="none" stroke={ORANGE} strokeWidth={2} />
              <path d={`M${x0 + len},${y1} q16,0 22,11`} fill="none" stroke={ORANGE} strokeWidth={2} />
            </>
          )}
          {(geometry.type === 'circular-flanged' || doubleFlange) && (
            <line x1={x0} y1={y0 - 7} x2={x0} y2={y1 + 7} stroke={ORANGE} strokeWidth={3} />
          )}
          {doubleFlange && (
            <line x1={x0 + len} y1={y0 - 7} x2={x0 + len} y2={y1 + 7} stroke={ORANGE} strokeWidth={3} />
          )}

          <DimH x1={x0} x2={x0 + len} y={y1 + 34} label={`${Math.round(lengthMm)} mm`} />
          <text x={x0 + len / 2} y={y0 - 16} textAnchor="middle" fontSize="8" fill={LABEL}>
            {freeEnds ? 'entrambe le bocche libere' : doubleFlange ? 'flangiato ai due estremi' : flared ? 'svasato ai due estremi' : 'a filo del pannello'}
          </text>
        </g>
      );
    }

    // ── ripiegati: percorso lungo fondo e parete ─────────────────────────────
    const segs = segments?.length ? segments : [{ name: 'Tratto unico', lengthMm }];
    const total = segs.reduce((a, s) => a + s.lengthMm, 0) || 1;
    const boxW = availW, boxH = 96;
    const bx = baffleX, by = 44;

    // percorso: orizzontale lungo il fondo, poi verticale, poi orizzontale
    const horizLen = (segs[0]?.lengthMm ?? 0) / total;
    const vertLen = (segs[1]?.lengthMm ?? 0) / total;
    const x0 = bx, yBottom = by + boxH - 14;
    const xTurn = bx + Math.max(24, boxW * horizLen);
    const yTop = Math.max(by + 12, yBottom - boxH * vertLen * 1.4);

    return (
      <g>
        {/* profilo interno della cassa */}
        <rect x={bx - 12} y={by} width={12} height={boxH} fill="url(#woodHatch)" />
        <rect x={bx} y={by + boxH} width={boxW} height={10} fill="url(#woodHatch)" />
        <rect x={bx + boxW} y={by} width={10} height={boxH + 10} fill="url(#woodHatch)" />

        {/* asse del condotto */}
        <path
          d={`M${x0},${yBottom} L${xTurn},${yBottom} L${xTurn},${yTop}${segs.length > 2 ? ` L${bx + boxW - 24},${yTop}` : ''}`}
          fill="none" stroke={ORANGE} strokeWidth={ductH * 0.6} strokeLinejoin="round" strokeLinecap="butt" opacity={0.28}
        />
        <path
          d={`M${x0},${yBottom} L${xTurn},${yBottom} L${xTurn},${yTop}${segs.length > 2 ? ` L${bx + boxW - 24},${yTop}` : ''}`}
          fill="none" stroke={ORANGE} strokeWidth={2} strokeLinejoin="round"
        />

        {/* quote dei tratti */}
        <DimH x1={x0} x2={xTurn} y={by + boxH + 26} label={`${segs[0]?.lengthMm ?? 0} mm`} />
        {segs[1] && <DimV y1={yTop} y2={yBottom} x={xTurn - 10} label={`${segs[1].lengthMm}`} />}
        {segs[2] && <DimH x1={xTurn} x2={bx + boxW - 24} y={yTop - 12} label={`${segs[2].lengthMm} mm`} />}

        <text x={bx + boxW / 2} y={by - 6} textAnchor="middle" fontSize="8" fill={LABEL}>
          sviluppo totale {Math.round(lengthMm)} mm · {spec.bends} {spec.bends === 1 ? 'piega' : 'pieghe'} da raccordare
        </text>
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Disegno del condotto: ${spec.label}`}>
      <Hatch />

      {/* intestazioni delle due viste */}
      <text x={boxX} y={22} fontSize="9" fill={LABEL} fontWeight="bold">SEZIONE DELLA LUCE</text>
      <text x={lx} y={22} fontSize="9" fill={LABEL} fontWeight="bold">SVILUPPO</text>
      <line x1={lx - 14} y1={30} x2={lx - 14} y2={H - 16} stroke="#27272a" strokeWidth={1} />

      {crossSection()}
      {longitudinal()}

      {/* legenda */}
      <g transform={`translate(${24}, ${H - 8})`}>
        <rect width="14" height="4" y="-4" fill="url(#woodHatch)" />
        <text x="19" y="0" fontSize="8" fill={LABEL}>parete della cassa</text>
        <line x1="118" y1="-2" x2="132" y2="-2" stroke={ORANGE} strokeWidth={3} />
        <text x="137" y="0" fontSize="8" fill={LABEL}>pannello da costruire</text>
      </g>
    </svg>
  );
}
