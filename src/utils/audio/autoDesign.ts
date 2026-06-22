/**
 * Auto-design autonomo (no AI) — dal driver al box all'amplificatore.
 * Catena deterministica: T/S → tipo cassa (EBP) → progetto box → potenza ampli.
 */

import { calcEBP, recommendEnclosure, sealedFromQtc, ventedDesign } from './enclosure';
import type { TSParams, SealedResult, VentedResult, AlignmentType } from './types';

export interface AutoEnclosure {
  type: 'sealed' | 'vented';
  ebp: number;
  recommendation: 'sealed' | 'vented' | 'either';
  alignment?: AlignmentType;
  portDiameterMm?: number;
  sealed?: SealedResult;
  vented?: VentedResult;
}

/**
 * Sceglie e progetta autonomamente la cassa ottimale per il driver.
 * - EBP < 50 → chiusa; > 100 → bass-reflex; in mezzo decide il Qts.
 * - Chiusa: allineamento Butterworth (Qtc 0.707).
 * - Bass-reflex: allineamento da Qts; porta dimensionata per velocità < 17 m/s.
 */
export function autoEnclosure(ts: TSParams): AutoEnclosure {
  const ebp = calcEBP(ts.fs, ts.qes);
  const recommendation = recommendEnclosure(ebp);
  const chosen: 'sealed' | 'vented' =
    recommendation === 'either' ? (ts.qts > 0.5 ? 'sealed' : 'vented')
    : recommendation === 'sealed' ? 'sealed' : 'vented';

  if (chosen === 'sealed') {
    return { type: 'sealed', ebp, recommendation, sealed: sealedFromQtc(ts, 0.707) };
  }

  // allineamento in base al Qts
  const alignment: AlignmentType = ts.qts < 0.3 ? 'QB3' : ts.qts > 0.45 ? 'C4' : 'B4';
  // porta: scegli il diametro più piccolo che tiene la velocità ≤ 17 m/s
  const candidates = [50, 65, 80, 100, 120, 150, 180];
  let dv = candidates[candidates.length - 1];
  for (const c of candidates) {
    const test = ventedDesign(ts, alignment, c);
    if (test.portVelocity <= 17) { dv = c; break; }
    dv = c;
  }
  const vented = ventedDesign(ts, alignment, dv);
  return { type: 'vented', ebp, recommendation, alignment, portDiameterMm: dv, vented };
}

export interface AmpRequirement {
  impedance: number;
  driverRmsW: number;
  ampMinRmsW: number;     // per raggiungere il limite termico
  ampIdealRmsW: number;   // con headroom pulito (~1.8×), da usare con limiter
}

/** Potenza amplificatore consigliata per il driver (con headroom) */
export function recommendAmpPower(ts: TSParams): AmpRequirement {
  const driverRms = ts.pe ?? 200;
  const impedance = ts.impedance ?? 8;
  return {
    impedance,
    driverRmsW: driverRms,
    ampMinRmsW: Math.round(driverRms),
    ampIdealRmsW: Math.round(driverRms * 1.8),
  };
}

/** Converte i parametri di un driver del catalogo in TSParams */
export function tsFromDriver(d: {
  thielSmall: { fs: number; qts: number; qes: number; qms: number; vas: number; re: number; le?: number; sd: number; xmax: number };
  impedance: number; powerRMS: number; sensitivity: number;
}): TSParams {
  return {
    fs: d.thielSmall.fs, qts: d.thielSmall.qts, qes: d.thielSmall.qes, qms: d.thielSmall.qms,
    vas: d.thielSmall.vas, re: d.thielSmall.re, le: d.thielSmall.le, sd: d.thielSmall.sd,
    xmax: d.thielSmall.xmax, impedance: d.impedance, pe: d.powerRMS, sensitivity: d.sensitivity,
  };
}
