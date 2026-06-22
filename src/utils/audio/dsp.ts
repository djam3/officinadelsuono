/**
 * DSP — Biquad cookbook (Robert Bristow-Johnson), cascate crossover, Linkwitz
 * Transform, time-alignment. Da Part 2 §6 del knowledge base.
 */

import { TWO_PI } from './constants';
import type { CurvePoint } from './types';

export type BiquadType =
  | 'lowpass' | 'highpass' | 'bandpass' | 'notch'
  | 'allpass' | 'peaking' | 'lowshelf' | 'highshelf';

export interface BiquadCoeffs { b0: number; b1: number; b2: number; a0: number; a1: number; a2: number; }
export interface BiquadNorm { b0: number; b1: number; b2: number; a1: number; a2: number; } // a0=1

/** Coefficienti biquad (cookbook RBJ). f0 e fs in Hz, dBgain solo peaking/shelf */
export function biquad(type: BiquadType, fs: number, f0: number, Q: number, dBgain = 0): BiquadNorm {
  const A = Math.pow(10, dBgain / 40);
  const w0 = TWO_PI * f0 / fs;
  const cs = Math.cos(w0);
  const sn = Math.sin(w0);
  const alpha = sn / (2 * Q);
  const beta = Math.sqrt(A) / Q;

  let c: BiquadCoeffs;
  switch (type) {
    case 'lowpass':
      c = { b0: (1 - cs) / 2, b1: 1 - cs, b2: (1 - cs) / 2, a0: 1 + alpha, a1: -2 * cs, a2: 1 - alpha }; break;
    case 'highpass':
      c = { b0: (1 + cs) / 2, b1: -(1 + cs), b2: (1 + cs) / 2, a0: 1 + alpha, a1: -2 * cs, a2: 1 - alpha }; break;
    case 'bandpass': // 0 dB peak
      c = { b0: alpha, b1: 0, b2: -alpha, a0: 1 + alpha, a1: -2 * cs, a2: 1 - alpha }; break;
    case 'notch':
      c = { b0: 1, b1: -2 * cs, b2: 1, a0: 1 + alpha, a1: -2 * cs, a2: 1 - alpha }; break;
    case 'allpass':
      c = { b0: 1 - alpha, b1: -2 * cs, b2: 1 + alpha, a0: 1 + alpha, a1: -2 * cs, a2: 1 - alpha }; break;
    case 'peaking':
      c = { b0: 1 + alpha * A, b1: -2 * cs, b2: 1 - alpha * A, a0: 1 + alpha / A, a1: -2 * cs, a2: 1 - alpha / A }; break;
    case 'lowshelf':
      c = {
        b0: A * ((A + 1) - (A - 1) * cs + beta * sn),
        b1: 2 * A * ((A - 1) - (A + 1) * cs),
        b2: A * ((A + 1) - (A - 1) * cs - beta * sn),
        a0: (A + 1) + (A - 1) * cs + beta * sn,
        a1: -2 * ((A - 1) + (A + 1) * cs),
        a2: (A + 1) + (A - 1) * cs - beta * sn,
      }; break;
    case 'highshelf':
      c = {
        b0: A * ((A + 1) + (A - 1) * cs + beta * sn),
        b1: -2 * A * ((A - 1) + (A + 1) * cs),
        b2: A * ((A + 1) + (A - 1) * cs - beta * sn),
        a0: (A + 1) - (A - 1) * cs + beta * sn,
        a1: 2 * ((A - 1) - (A + 1) * cs),
        a2: (A + 1) - (A - 1) * cs - beta * sn,
      }; break;
  }
  return { b0: c.b0 / c.a0, b1: c.b1 / c.a0, b2: c.b2 / c.a0, a1: c.a1 / c.a0, a2: c.a2 / c.a0 };
}

/** Risposta in ampiezza (dB) di una cascata di biquad su griglia di frequenze */
export function biquadResponse(sections: BiquadNorm[], fs: number, grid: number[]): CurvePoint[] {
  return grid.map(f => {
    const w = TWO_PI * f / fs;
    let mag = 1;
    for (const s of sections) {
      const cw = Math.cos(w), sw = Math.sin(w);
      const c2w = Math.cos(2 * w), s2w = Math.sin(2 * w);
      const numRe = s.b0 + s.b1 * cw + s.b2 * c2w;
      const numIm = -(s.b1 * sw + s.b2 * s2w);
      const denRe = 1 + s.a1 * cw + s.a2 * c2w;
      const denIm = -(s.a1 * sw + s.a2 * s2w);
      mag *= Math.hypot(numRe, numIm) / Math.hypot(denRe, denIm);
    }
    return { f, v: 20 * Math.log10(Math.max(mag, 1e-9)) };
  });
}

// ─── Q per stadio (cascate) ───────────────────────────────────────────────────

/** Q di Butterworth per ordine pari n: Q_k = 1/(2cos((2k−1)π/2n)) */
export function butterworthQ(n: number): number[] {
  const out: number[] = [];
  for (let k = 1; k <= n / 2; k++) out.push(1 / (2 * Math.cos(((2 * k - 1) * Math.PI) / (2 * n))));
  return out;
}

export type FilterFamily = 'butterworth' | 'linkwitz-riley' | 'bessel';

/** Q (e fattore di scala FSF) per stadio in base a famiglia/ordine */
export function cascadeStages(family: FilterFamily, order: number): { q: number; fsf: number }[] {
  if (family === 'linkwitz-riley') {
    // LR = due Butterworth di metà ordine
    const half = order / 2;
    const qs = butterworthQ(half);
    return [...qs, ...qs].map(q => ({ q, fsf: 1 }));
  }
  if (family === 'bessel') {
    // tabelle FSF/Q (low-pass) per 2° e 4° ordine
    if (order <= 2) return [{ q: 0.5773, fsf: 1.2736 }];
    return [{ q: 0.5219, fsf: 1.4192 }, { q: 0.8055, fsf: 1.5912 }];
  }
  return butterworthQ(order).map(q => ({ q, fsf: 1 }));
}

/** Costruisce le sezioni biquad di un crossover (low o high pass) */
export function crossoverSections(
  kind: 'lowpass' | 'highpass',
  family: FilterFamily,
  order: number,
  fs: number,
  fc: number
): BiquadNorm[] {
  const stages = cascadeStages(family, order);
  return stages.map(st => {
    const f = kind === 'lowpass' ? fc * st.fsf : fc / st.fsf;
    return biquad(kind, fs, f, st.q);
  });
}

// ─── Linkwitz Transform ───────────────────────────────────────────────────────

/** Curva di boost (dB) della LT da (f0,Q0) misurati a (fp,Qp) target */
export function linkwitzTransformCurve(f0: number, q0: number, fp: number, qp: number, grid: number[]): CurvePoint[] {
  return grid.map(f => {
    const evalSec = (fn: number, q: number) => {
      const O = f / fn;
      const re = 1 - O * O;
      const im = O / q;
      return { re, im };
    };
    const z = evalSec(f0, q0); // zeri (cancella la cassa)
    const p = evalSec(fp, qp); // poli (impone target)
    // |G| = |z| / |p|
    const mag = Math.hypot(z.re, z.im) / Math.hypot(p.re, p.im);
    return { f, v: 20 * Math.log10(Math.max(mag, 1e-9)) };
  });
}

/** Boost massimo (dB) della LT al punto più basso della griglia */
export function linkwitzMaxBoost(f0: number, q0: number, fp: number, qp: number): number {
  const grid: number[] = [];
  for (let f = 10; f <= 200; f += 2) grid.push(f);
  const c = linkwitzTransformCurve(f0, q0, fp, qp, grid);
  return Math.max(...c.map(p => p.v));
}

// ─── Time alignment / delay ───────────────────────────────────────────────────

export function delayFromPath(pathMm: number, fs: number, tempC = 20): { ms: number; samples: number } {
  const c = 331.3 * Math.sqrt(1 + tempC / 273.15) * 1000; // mm/s
  const seconds = pathMm / c;
  return { ms: seconds * 1000, samples: Math.round(seconds * fs) };
}

/** Dynamic range da bit depth: DR ≈ 6.02·N + 1.76 */
export const dynamicRange = (bits: number) => 6.02 * bits + 1.76;
