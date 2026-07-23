/**
 * Enclosure & Driver — Thiele/Small, casse sealed/vented/passive-radiator/bandpass
 * Formule da Part 1 del knowledge base (Thiele 1961, Small 1972–73, Keele 1973,
 * Dickason "Loudspeaker Design Cookbook").
 */

import { airDensity, speedOfSound, TWO_PI, logFreqGrid } from './constants';
import type { TSParams, SealedResult, VentedResult, AlignmentType, CurvePoint } from './types';

// ═══════════════════════════════════════════════════════════════════════════
//  THIELE-SMALL
// ═══════════════════════════════════════════════════════════════════════════

export const calcQts = (qms: number, qes: number) => (qms * qes) / (qms + qes);

/** EBP = Fs/Qes → selettore tipo cassa */
export const calcEBP = (fs: number, qes: number) => fs / qes;
export function recommendEnclosure(ebp: number): 'sealed' | 'either' | 'vented' {
  if (ebp <= 50) return 'sealed';
  if (ebp >= 100) return 'vented';
  return 'either';
}

/** Vas (litri) pratico: 0.0014 · Sd_cm²² · Cms_(mm/N) */
export const calcVasFromCms = (sdCm2: number, cmsMmPerN: number) => 0.0014 * sdCm2 * sdCm2 * cmsMmPerN;

/** Mms (g) da Fs e Cms(mm/N): Mms = 1/((2πFs)²·Cms) */
export function calcMmsFromFsCms(fs: number, cmsMmPerN: number): number {
  const cms = cmsMmPerN / 1000; // m/N
  const mms = 1 / (Math.pow(TWO_PI * fs, 2) * cms); // kg
  return mms * 1000; // g
}

/** Cms (mm/N) da Vas(litri) e Sd(cm²): Vas = ρc²·Sd²·Cms */
export function calcCmsFromVas(vasL: number, sdCm2: number, tempC = 20): number {
  const rho = airDensity(tempC);
  const c = speedOfSound(tempC);
  const sd = sdCm2 / 1e4; // m²
  const vas = vasL / 1000; // m³
  const cms = vas / (rho * c * c * sd * sd); // m/N
  return cms * 1000; // mm/N
}

/** Efficienza di riferimento η0 (frazione) e sensibilità SPL 1W/1m (half-space) */
export function calcSensitivity(fs: number, vasL: number, qes: number, tempC = 20): { eta0: number; splHalfSpace: number } {
  const c = speedOfSound(tempC);
  const vas = vasL / 1000; // m³
  const eta0 = ((4 * Math.PI * Math.PI) / Math.pow(c, 3)) * ((Math.pow(fs, 3) * vas) / qes);
  const splHalfSpace = 112 + 10 * Math.log10(eta0);
  return { eta0, splHalfSpace };
}

/** Vd (cm³) = Sd(cm²) · Xmax(mm)/10 ; predittore output LF */
export const calcVd = (sdCm2: number, xmaxMm: number) => sdCm2 * (xmaxMm / 10);

// ═══════════════════════════════════════════════════════════════════════════
//  CASSA CHIUSA (SEALED)
// ═══════════════════════════════════════════════════════════════════════════

/** Vb (litri) per un Qtc target. Vb = Vas/((Qtc/Qts)²−1) */
export function sealedFromQtc(ts: TSParams, targetQtc: number): SealedResult {
  const ratio = Math.pow(targetQtc / ts.qts, 2) - 1;
  const vb = ratio > 0 ? ts.vas / ratio : ts.vas * 2;
  return sealedFromVb(ts, vb);
}

/** Qtc e risposta da un volume Vb dato */
export function sealedFromVb(ts: TSParams, vbL: number): SealedResult {
  const alpha = ts.vas / vbL;
  const qtc = ts.qts * Math.sqrt(alpha + 1);
  const fc = ts.fs * Math.sqrt(alpha + 1);
  // F3
  const inv = 1 / (qtc * qtc);
  const f3 = fc * Math.sqrt(((inv - 2) + Math.sqrt(Math.pow(inv - 2, 2) + 4)) / 2);
  let peakingDb = 0;
  if (qtc > 0.707) {
    peakingDb = 20 * Math.log10(qtc / Math.sqrt(1 - 1 / (4 * qtc * qtc)));
  }
  return { vb: vbL, qtc, fc, f3, alpha, peakingDb };
}

// ═══════════════════════════════════════════════════════════════════════════
//  CASSA BASS-REFLEX (VENTED)
// ═══════════════════════════════════════════════════════════════════════════

/** Allineamenti classici → (alpha = Vas/Vb, h = Fb/Fs) per QL dato (≈7) */
export function alignmentRatios(ts: TSParams, alignment: AlignmentType): { alpha: number; h: number } {
  const q = ts.qts;
  switch (alignment) {
    case 'B4': {
      // lossless B4: Qts=0.3827, h=1, α=√2. Per Qts diversi usiamo curve-fit Keele.
      const vb = 15 * ts.vas * Math.pow(q, 2.87);
      const fb = 0.42 * ts.fs * Math.pow(q, -0.9);
      return { alpha: ts.vas / vb, h: fb / ts.fs };
    }
    case 'QB3': {
      // box più piccola, F3 più basso (Qts < 0.4 tipico)
      const vb = 20 * ts.vas * Math.pow(q, 3.3);
      const fb = 0.42 * ts.fs * Math.pow(q, -0.96);
      return { alpha: ts.vas / vb, h: fb / ts.fs };
    }
    case 'C4': {
      // Chebyshev: box più grande, bassi estesi (Qts > 0.4)
      const vb = 18 * ts.vas * Math.pow(q, 2.6);
      const fb = 0.40 * ts.fs * Math.pow(q, -0.9);
      return { alpha: ts.vas / vb, h: fb / ts.fs };
    }
    case 'SBB4': {
      // Bullock SBB4: Fb=Fs, Vb = Vas·Qts·(4.96·Qts − 0.136)
      const vb = ts.vas * q * (4.96 * q - 0.136);
      return { alpha: ts.vas / Math.max(vb, ts.vas * 0.2), h: 1 };
    }
    case 'BESSEL': {
      const vb = 16 * ts.vas * Math.pow(q, 2.9);
      const fb = 0.40 * ts.fs * Math.pow(q, -0.9);
      return { alpha: ts.vas / vb, h: fb / ts.fs };
    }
    default: { // CUSTOM fallback ~ Keele
      const vb = 15 * ts.vas * Math.pow(q, 2.87);
      const fb = 0.42 * ts.fs * Math.pow(q, -0.9);
      return { alpha: ts.vas / vb, h: fb / ts.fs };
    }
  }
}

/**
 * Lunghezza porta (mm) — Lv = (23562.5·Dv²·Np)/(Fb²·Vb_L) − k·Dv (Dv in cm).
 * k: 0.614 (2 estremi liberi), 0.732 (1 flangiato), 0.850 (2 flangiati).
 */
export function portLength(dvMm: number, fb: number, vbL: number, np = 1, k = 0.732): number {
  const dv = dvMm / 10; // cm
  const lvCm = (23562.5 * dv * dv * np) / (fb * fb * vbL) - k * dv;
  return Math.max(2.5, lvCm) * 10; // mm, minimo ~25mm
}

/** Fb (Hz) da lunghezza porta nota */
export function tuningFromPort(dvMm: number, lvMm: number, vbL: number, np = 1, k = 0.732): number {
  const dv = dvMm / 10;
  const lv = lvMm / 10;
  return Math.sqrt((23562.5 * dv * dv * np) / (vbL * (lv + k * dv)));
}

/** Velocità aria in porta (m/s) al picco (≈ a Fb) e area minima di Small */
export function portVelocity(ts: TSParams, fb: number, dvMm: number, np = 1): { velocity: number; minVentAreaCm2: number; portAreaCm2: number } {
  const sd = (ts.sd ?? 0) / 1e4; // m²
  const xmax = (ts.xmax ?? 0) / 1000; // m
  const r = (dvMm / 2) / 1000; // m
  const portArea = Math.PI * r * r * np; // m²
  // velocità: v = Xmax·Sd·2π·fb / Sp
  const velocity = portArea > 0 ? (xmax * sd * TWO_PI * fb) / portArea : 0;
  // Small: Sv > 0.8·Fb·Vd  (Vd in m³ → Sv in m²)
  const vd = sd * xmax; // m³
  const minVentArea = 0.8 * fb * vd; // m²
  return { velocity, minVentAreaCm2: minVentArea * 1e4, portAreaCm2: portArea * 1e4 };
}

/**
 * Curva velocità aria in porta (m/s) vs frequenza.
 * Il condotto è la massa di un risonatore di Helmholtz: la velocità dell'aria
 * ha un picco a Fb (valore dalla formula di Small, caso peggiore a Xmax) e
 * scende con la risposta del risonatore (Q ≈ QL della cassa).
 */
export function portVelocityCurve(
  ts: TSParams, fb: number, dvMm: number, np = 1, ql = 7,
  fMin = 15, fMax = 250, points = 140,
): CurvePoint[] {
  const peak = portVelocity(ts, fb, dvMm, np).velocity;
  return logFreqGrid(fMin, fMax, points).map(f => ({
    f,
    v: peak / Math.sqrt(1 + ql * ql * Math.pow(f / fb - fb / f, 2)),
  }));
}

/** Progetto vented completo da allineamento + diametro porta scelto */
export function ventedDesign(
  ts: TSParams,
  alignment: AlignmentType,
  dvMm: number,
  np = 1,
  k = 0.732,
  custom?: { vbL: number; fb: number }
): VentedResult {
  let vb: number, fb: number, alpha: number, h: number;
  if (alignment === 'CUSTOM' && custom) {
    vb = custom.vbL; fb = custom.fb; alpha = ts.vas / vb; h = fb / ts.fs;
  } else {
    const r = alignmentRatios(ts, alignment);
    alpha = r.alpha; h = r.h;
    vb = ts.vas / alpha;
    fb = h * ts.fs;
  }
  const lv = portLength(dvMm, fb, vb, np, k);
  const pv = portVelocity(ts, fb, dvMm, np);
  const f3 = 0.26 * ts.fs * Math.pow(ts.qts, -1.4); // stima
  return {
    vb, fb, f3, alpha, h, alignment,
    portDiameter: dvMm, portLength: lv, portCount: np,
    portVelocity: pv.velocity, minVentArea: pv.minVentAreaCm2,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  PASSIVE RADIATOR (accordo per massa aggiunta)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Accordo PR: Fb = 1/(2π·√(Cmsr·Mres)). Dato un Fb target e la compliance del
 * PR (da Vas_pr & Vb), ricava la massa totale necessaria del PR.
 */
export function passiveRadiatorTuning(params: {
  vbL: number;
  fbTarget: number;
  prVasL: number;   // Vas del radiatore passivo
  prSdCm2: number;  // area PR
  tempC?: number;
}): { addedMassG: number; totalMassG: number; cmsr: number } {
  const { vbL, fbTarget, prVasL, prSdCm2, tempC = 20 } = params;
  const rho = airDensity(tempC);
  const c = speedOfSound(tempC);
  const sd = prSdCm2 / 1e4; // m²
  // Compliance acustica del box: Cab = Vb/(ρc²); compliance PR Cmp da Vas_pr
  const cmp = (prVasL / 1000) / (rho * c * c * sd * sd); // m/N
  const cab = (vbL / 1000) / (rho * c * c); // m⁵/N (acustica)
  // Compliance meccanica risultante del PR caricato dal box (serie con air spring)
  const cabMech = cab * sd * sd; // m/N
  const cmsr = (cmp * cabMech) / (cmp + cabMech);
  // Mres dalla frequenza: Mres = 1/((2πFb)²·Cmsr)
  const mres = 1 / (Math.pow(TWO_PI * fbTarget, 2) * cmsr); // kg
  // massa "nativa" del PR ~ stimata da Vas_pr e Sd se nota Fs_pr; qui restituiamo totale
  const totalMassG = mres * 1000;
  return { addedMassG: totalMassG, totalMassG, cmsr };
}

// ═══════════════════════════════════════════════════════════════════════════
//  BANDPASS (4°/6° ordine)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Bandpass 4° ordine (single-reflex): camera posteriore sigillata Vr + camera
 * anteriore ported Vf. S = Vf/Vr (≈0.7 piatto), α = Vas/Vr.
 */
export function bandpass4thOrder(ts: TSParams, params: {
  S: number;       // Vf/Vr
  alpha: number;   // Vas/Vr
  dvMm: number;
  np?: number;
}): { vrL: number; vfL: number; fb: number; portLengthMm: number; fL: number; fH: number } {
  const { S, alpha, dvMm, np = 1 } = params;
  const vr = ts.vas / alpha;
  const vf = S * vr;
  // Fc camera posteriore (sealed): Fc = Fs·√(1+α)
  const fcRear = ts.fs * Math.sqrt(1 + alpha);
  // Tuning camera anteriore ~ Fc per risposta centrata
  const fb = fcRear;
  const lv = portLength(dvMm, fb, vf, np);
  // Larghezza banda approssimata
  const bw = 1 + 1 / S;
  const fL = fb / Math.sqrt(bw);
  const fH = fb * Math.sqrt(bw);
  return { vrL: vr, vfL: vf, fb, portLengthMm: lv, fL, fH };
}

/**
 * Risposta bandpass 4° ordine (dB, picco 0): fianchi 12 dB/oct simmetrici,
 * Q di banda = Fb/(fH−fL).
 */
export function bandpass4Response(fb: number, fL: number, fH: number, fMin = 10, fMax = 1000, points = 200): CurvePoint[] {
  const qbp = fb / Math.max(1, fH - fL);
  return logFreqGrid(fMin, fMax, points).map(f => {
    const x = qbp * (f / fb - fb / f);
    return { f, v: 20 * Math.log10(1 / (1 + x * x)) };
  });
}

export interface Bandpass6Result {
  vrL: number;          // camera posteriore (litri)
  fbRear: number;       // accordo camera posteriore (Hz)
  portRearLenMm: number;
  vfL: number;          // camera anteriore (litri)
  fbFront: number;      // accordo camera anteriore (Hz)
  portFrontLenMm: number;
  fL: number;           // stima -3 dB
  fH: number;
}

/**
 * Bandpass 6° ordine serie (entrambe le camere accordate) — PROGETTO DI
 * PARTENZA: camera posteriore da allineamento QB3, camera anteriore Vf = S·Vr
 * accordata più in alto (ratio·FbRear). Il modello è una cascata di due
 * risonatori: buono per dimensionare, da rifinire con misura (o BassBox).
 */
export function bandpass6thOrder(ts: TSParams, params: {
  S?: number;        // Vf/Vr (default 0.6)
  ratio?: number;    // FbFront/FbRear (default 1.6)
  dvMm: number;
  np?: number;
}): Bandpass6Result {
  const { S = 0.6, ratio = 1.6, dvMm, np = 1 } = params;
  const r = alignmentRatios(ts, 'QB3');
  const vr = ts.vas / r.alpha;
  const fbRear = r.h * ts.fs;
  const vf = S * vr;
  const fbFront = fbRear * ratio;
  const portRearLenMm = portLength(dvMm, fbRear, vr, np);
  const portFrontLenMm = portLength(dvMm, fbFront, vf, np);
  // bordi banda dalla curva stimata (-3 dB dal picco)
  const curve = bandpass6Response(fbRear, fbFront);
  const peak = Math.max(...curve.map(p => p.v));
  const above = curve.filter(p => p.v >= peak - 3);
  const fL = above.length ? above[0].f : fbRear * 0.8;
  const fH = above.length ? above[above.length - 1].f : fbFront * 1.2;
  return { vrL: vr, fbRear, portRearLenMm, vfL: vf, fbFront, portFrontLenMm, fL, fH };
}

/**
 * Risposta bandpass 6° ordine stimata (dB, picco 0): prodotto di due
 * risonatori del 2° ordine centrati sui due accordi (fianchi ±12 dB/oct,
 * banda più larga del 4°). Stima di progetto, non simulazione completa.
 */
export function bandpass6Response(fbRear: number, fbFront: number, fMin = 10, fMax = 1000, points = 200): CurvePoint[] {
  const q = 1.2;
  const bp2 = (f: number, f0: number) => {
    const x = q * (f / f0 - f0 / f);
    return 1 / Math.sqrt(1 + x * x);
  };
  const raw = logFreqGrid(fMin, fMax, points).map(f => ({ f, v: bp2(f, fbRear) * bp2(f, fbFront) }));
  const peak = Math.max(...raw.map(p => p.v), 1e-9);
  return raw.map(p => ({ f: p.f, v: 20 * Math.log10(Math.max(p.v / peak, 1e-6)) }));
}
