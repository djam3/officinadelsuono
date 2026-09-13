/**
 * Curve prestazionali del sistema: SPL massimo, potenza sopportabile,
 * velocità dell'aria in porta e guadagno dell'ambiente (stanza / abitacolo).
 */

import { logFreqGrid } from './constants';
import type { CurvePoint, ResponseCurves, TSParams } from './types';

// ─── Guadagno ambiente / abitacolo ────────────────────────────────────────────

export type RoomPreset = 'none' | 'room-small' | 'room-medium' | 'room-large' | 'car-cabin';

export interface RoomGainSpec {
  label: string;
  onsetHz: number;     // sotto questa frequenza inizia il rinforzo
  maxGainDb: number;   // rinforzo massimo raggiunto alle bassissime
  slopeOrder: number;  // 1 ≈ 6 dB/oct, 2 ≈ 12 dB/oct
}

export const ROOM_PRESETS: Record<RoomPreset, RoomGainSpec> = {
  none:          { label: 'Nessuno (spazio libero)',       onsetHz: 0,   maxGainDb: 0,  slopeOrder: 1 },
  'room-small':  { label: 'Stanza piccola (< 30 m²)',      onsetHz: 60,  maxGainDb: 9,  slopeOrder: 1 },
  'room-medium': { label: 'Stanza media (30–100 m²)',      onsetHz: 40,  maxGainDb: 6,  slopeOrder: 1 },
  'room-large':  { label: 'Sala grande (> 100 m²)',        onsetHz: 25,  maxGainDb: 3,  slopeOrder: 1 },
  'car-cabin':   { label: 'Abitacolo auto (cabin gain)',   onsetHz: 70,  maxGainDb: 14, slopeOrder: 2 },
};

/** Frequenza d'inizio del rinforzo modale: f ≈ 565 / L(piedi) */
export const roomGainOnsetHz = (longestDimMeters: number) => 565 / (longestDimMeters * 3.28084);

/** Curva di guadagno ambiente (dB) sulla stessa griglia della risposta */
export function roomGainCurve(grid: number[], preset: RoomPreset): CurvePoint[] {
  const spec = ROOM_PRESETS[preset] ?? ROOM_PRESETS.none;
  if (spec.maxGainDb === 0 || spec.onsetHz === 0) return grid.map(f => ({ f, v: 0 }));
  return grid.map(f => ({
    f,
    v: spec.maxGainDb / Math.sqrt(1 + Math.pow(f / spec.onsetHz, 2 * spec.slopeOrder)),
  }));
}

/** Somma il guadagno ambiente a una curva SPL */
export function applyRoomGain(spl: CurvePoint[], preset: RoomPreset): CurvePoint[] {
  const gain = roomGainCurve(spl.map(p => p.f), preset);
  return spl.map((p, i) => ({ f: p.f, v: p.v + gain[i].v }));
}

// ─── SPL massimo e potenza sopportabile ───────────────────────────────────────

export interface MaxOutputInput {
  ts: TSParams;
  curves: ResponseCurves;   // calcolate a `refPowerW`
  refPowerW: number;        // potenza usata per calcolare le curve
  sensitivity?: number;     // dB 1W/1m; se assente usa quella del driver
  roomPreset?: RoomPreset;
}

/** Oltre questa frequenza il modello small-signal non descrive più il sistema */
export const PASSBAND_PEAK_MAX_HZ = 200;

export interface MaxOutputResult {
  /** SPL massimo raggiungibile (dB @1m) */
  maxSpl: CurvePoint[];
  /** limite termico soltanto (dB) */
  thermalSpl: CurvePoint[];
  /** limite di escursione soltanto (dB) */
  excursionSpl: CurvePoint[];
  /** potenza applicabile senza superare Xmax né Pe (W) */
  powerHandling: CurvePoint[];
  /** SPL di picco del sistema e frequenza a cui avviene */
  peakSpl: number;
  peakSplHz: number;
}

/**
 * Combina limite termico (Pe) e limite di escursione (Xmax).
 *
 * A ogni frequenza si calcola la potenza che porta il cono esattamente a Xmax:
 * l'escursione cresce con la radice della potenza, quindi
 *   P(Xmax) = P_rif · (Xmax / x_rif(f))².
 * Il limite reale è il minore fra questa e la potenza termica Pe.
 */
export function computeMaxOutput(input: MaxOutputInput): MaxOutputResult {
  const { ts, curves, refPowerW } = input;
  const sens = input.sensitivity ?? ts.sensitivity ?? 90;
  const xmax = ts.xmax ?? 6;
  const pe = ts.pe ?? 100;

  const roomGain = roomGainCurve(curves.spl.map(p => p.f), input.roomPreset ?? 'none');

  const thermalSpl: CurvePoint[] = [];
  const excursionSpl: CurvePoint[] = [];
  const maxSpl: CurvePoint[] = [];
  const powerHandling: CurvePoint[] = [];

  let peakSpl = -Infinity;
  let peakSplHz = 0;

  // `curves.spl` è la risposta RELATIVA del box (0 dB in banda passante)
  curves.spl.forEach((point, i) => {
    const f = point.f;
    const shape = point.v;

    const xRef = Math.max(curves.excursion[i]?.v ?? 0.001, 1e-4); // mm alla potenza di riferimento
    const pAtXmax = refPowerW * Math.pow(xmax / xRef, 2);
    const pLimit = Math.min(pe, pAtXmax);

    const thermal = sens + 10 * Math.log10(pe) + shape + roomGain[i].v;
    const excursion = sens + 10 * Math.log10(Math.max(pAtXmax, 1e-6)) + shape + roomGain[i].v;
    const combined = Math.min(thermal, excursion);

    thermalSpl.push({ f, v: thermal });
    excursionSpl.push({ f, v: excursion });
    maxSpl.push({ f, v: combined });
    powerHandling.push({ f, v: pLimit });

    // il picco si cerca solo nella banda in cui il modello è valido: più in alto
    // la curva è un semplice plateau termico e falserebbe il dato di sintesi
    if (f <= PASSBAND_PEAK_MAX_HZ && combined > peakSpl) { peakSpl = combined; peakSplHz = f; }
  });

  return { maxSpl, thermalSpl, excursionSpl, powerHandling, peakSpl, peakSplHz };
}

// ─── Velocità dell'aria in porta ──────────────────────────────────────────────

/** Soglia oltre la quale il condotto fischia / soffia (turbolenza) */
export const VENT_VELOCITY_LIMIT = 17; // m/s

export interface VentVelocityInput {
  peakVelocityAtXmax: number; // m/s — da portVelocity()
  fb: number;                 // Hz
  ql?: number;                // Q delle perdite (default 7)
  /** rapporto escursione effettiva / Xmax alla potenza scelta (0–1) */
  driveRatio?: number;
  fMin?: number;
  fMax?: number;
}

/**
 * Curva della velocità dell'aria nel condotto: picco all'accordo Fb, decrescita
 * con la risposta del risonatore di Helmholtz. Scala linearmente con
 * l'ampiezza di spostamento, quindi con la radice della potenza applicata.
 */
export function ventVelocityCurve(input: VentVelocityInput): CurvePoint[] {
  const { peakVelocityAtXmax, fb, ql = 7, driveRatio = 1, fMin = 15, fMax = 250 } = input;
  const peak = peakVelocityAtXmax * Math.min(Math.max(driveRatio, 0), 1);
  return logFreqGrid(fMin, fMax, 160).map(f => ({
    f,
    v: peak / Math.sqrt(1 + ql * ql * Math.pow(f / fb - fb / f, 2)),
  }));
}
