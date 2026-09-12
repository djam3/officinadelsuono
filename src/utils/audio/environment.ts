/**
 * Environment & construction helpers + linea di trasmissione / horn.
 * Da Part 1 §6–7, §2e–2f.
 */

import { speedOfSound } from './constants';

/** Volume netto = lordo − ingombri (driver/porta/rinforzi/PR), tutti in litri */
export function netVolume(grossL: number, displacements: { driver?: number; port?: number; bracing?: number; pr?: number }): number {
  const { driver = 0, port = 0, bracing = 0, pr = 0 } = displacements;
  return Math.max(0, grossL - driver - port - bracing - pr);
}

/** Stuffing in cassa chiusa: +~15–20% di Vb efficace (default 17%) */
export const effectiveSealedVolume = (vbL: number, fillFactor = 0.17) => vbL * (1 + fillFactor);

/** Guadagno di carico al confine: half-space (+6 dB LF), corner ⅛-space (+12) */
export function boundaryGain(space: 'full' | 'half' | 'quarter' | 'eighth'): number {
  return { full: 0, half: 6, quarter: 9, eighth: 12 }[space];
}

/** Onset room/cabin gain: f = 565/L(ft); sotto sale ~12 dB/oct (auto) */
export function roomGainOnset(longestDimM: number): number {
  const ft = longestDimM * 3.28084;
  return 565 / ft;
}

// ─── Linea di trasmissione ────────────────────────────────────────────────────

/** Lunghezza linea ¼ d'onda (m) per frequenza target */
export function tlLength(targetHz: number, tempC = 20): number {
  return speedOfSound(tempC) / (4 * targetHz);
}

// ─── Horn (esponenziale) ──────────────────────────────────────────────────────

/** Flare constant m = 4π·Fc/c ; cutoff Fc = m·c/4π */
export function hornFlare(fcHz: number, tempC = 20): number {
  return (4 * Math.PI * fcHz) / speedOfSound(tempC);
}

/** Area bocca (m²): A = (c/(2π·Fc))²·π, divisa per il fattore di spazio */
export function hornMouthArea(fcHz: number, space: 'full' | 'half' | 'quarter' = 'full', tempC = 20): number {
  const c = speedOfSound(tempC);
  const full = Math.pow(c / (2 * Math.PI * fcHz), 2) * Math.PI;
  return full / ({ full: 1, half: 2, quarter: 4 }[space]);
}

/** Rapporto di compressione = Sd/St */
export const hornCompressionRatio = (sdCm2: number, throatCm2: number) => sdCm2 / throatCm2;

/** Lunghezza horn esponenziale (m) per andare da gola St ad area A: x = ln(A/St)/m */
export function hornLength(throatCm2: number, mouthCm2: number, flareM: number): number {
  if (throatCm2 <= 0 || mouthCm2 <= throatCm2) return 0;
  return Math.log(mouthCm2 / throatCm2) / flareM;
}
