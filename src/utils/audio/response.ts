/**
 * Response Engine — curve SPL / impedenza / escursione / group-delay
 * Valuta le funzioni di trasferimento (2° ordine sealed, 4° ordine vented).
 * Modelli lineari small-signal validi sotto ~200–300 Hz.
 */

import { logFreqGrid, TWO_PI } from './constants';
import type { TSParams, ResponseCurves, CurvePoint } from './types';

interface Complex { re: number; im: number; }
const cdiv = (a: Complex, b: Complex): Complex => {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
const cabs = (c: Complex) => Math.hypot(c.re, c.im);
const cphase = (c: Complex) => Math.atan2(c.im, c.re);

// ─── Funzioni di trasferimento complesse ──────────────────────────────────────

/** Sealed 2° ordine high-pass, Ω = f/fc */
function sealedG(f: number, fc: number, qtc: number): Complex {
  const O = f / fc;
  const num: Complex = { re: -O * O, im: 0 };
  const den: Complex = { re: 1 - O * O, im: O / qtc };
  return cdiv(num, den);
}

/** Vented 4° ordine high-pass, normalizzato a f0=√(fb·fs) (coeff. Leach) */
function ventedGImpl(f: number, fs: number, fb: number, alpha: number, ql: number, qts: number, h: number): Complex {
  const f0 = Math.sqrt(fb * fs);
  const O = f / f0;
  const a1 = 1 / (ql * Math.sqrt(h)) + Math.sqrt(h) / qts;
  const a2 = (alpha + 1) / h + h + 1 / (ql * qts);
  const a3 = 1 / (qts * Math.sqrt(h)) + Math.sqrt(h) / ql;
  const num: Complex = { re: Math.pow(O, 4), im: 0 };
  const den: Complex = {
    re: Math.pow(O, 4) - a2 * O * O + 1,
    im: -a1 * Math.pow(O, 3) + a3 * O,
  };
  return cdiv(num, den);
}

// ─── Curve ────────────────────────────────────────────────────────────────────

export interface ResponseInput {
  ts: TSParams;
  type: 'sealed' | 'vented';
  fc?: number;       // sealed
  qtc?: number;      // sealed
  fb?: number;       // vented
  alpha?: number;    // vented
  ql?: number;       // vented (default 7)
  powerW?: number;   // per excursion
}

export function computeResponse(input: ResponseInput): ResponseCurves {
  const { ts, type } = input;
  const grid = logFreqGrid(10, 1000, 200);
  const ql = input.ql ?? 7;

  const Gat = (f: number): Complex => {
    if (type === 'sealed') return sealedG(f, input.fc!, input.qtc!);
    return ventedGImpl(f, ts.fs, input.fb!, input.alpha!, ql, ts.qts, input.fb! / ts.fs);
  };

  const spl: CurvePoint[] = grid.map(f => ({ f, v: 20 * Math.log10(Math.max(cabs(Gat(f)), 1e-6)) }));

  // Group delay = -dφ/dω (ms)
  const groupDelay: CurvePoint[] = grid.map(f => {
    const df = f * 0.01;
    const p1 = cphase(Gat(f - df));
    const p2 = cphase(Gat(f + df));
    let dphi = p2 - p1;
    while (dphi > Math.PI) dphi -= TWO_PI;
    while (dphi < -Math.PI) dphi += TWO_PI;
    const tau = -dphi / (TWO_PI * (2 * df)); // s
    return { f, v: Math.max(0, tau * 1000) };
  });

  // Escursione relativa (mm one-way) — modello: displacement ∝ pressione/ω²
  const power = input.powerW ?? 100;
  const xmax = ts.xmax ?? 6;
  const excursion: CurvePoint[] = grid.map(f => {
    const mag = cabs(Gat(f));
    // displacement low-pass: pressione ∝ ω²·X → X ∝ mag/(f/ref)²
    let x = mag / Math.pow(f / 100, 2);
    if (type === 'vented') {
      // notch a Fb: il cono scarica
      const fb = input.fb!;
      const notch = Math.abs(f * f - fb * fb) / (f * f + fb * fb);
      x *= 0.35 + 0.65 * notch;
    }
    return { f, v: x };
  });
  // normalizza l'escursione così che il picco corrisponda a Xmax a potenza nominale
  const peakX = Math.max(...excursion.map(p => p.v), 1e-9);
  const scale = (xmax * Math.sqrt(power / 100)) / peakX;
  excursion.forEach(p => { p.v = p.v * scale; });

  // Impedenza modellata
  const impedance = computeImpedance(input, grid);

  return { spl, excursion, impedance, groupDelay };
}

/** Impedenza |Z(f)|: picco(i) di risonanza + salita induttiva Le */
function computeImpedance(input: ResponseInput, grid: number[]): CurvePoint[] {
  const { ts, type } = input;
  const re = ts.re ?? (ts.impedance ? ts.impedance * 0.9 : 6);
  const le = (ts.le ?? 0.5) / 1000; // H
  const qms = ts.qms, qes = ts.qes;

  const lorentz = (f: number, f0: number, q: number) => 1 / Math.sqrt(1 + q * q * Math.pow(f / f0 - f0 / f, 2));

  if (type === 'sealed') {
    const fc = input.fc!;
    const qtc = input.qtc!;
    // Qmc/Qec scalano con fc/fs
    const qmc = qms * (fc / ts.fs);
    const qec = qes * (fc / ts.fs);
    const zpeak = re * (1 + qmc / qec);
    return grid.map(f => ({ f, v: re + (zpeak - re) * lorentz(f, fc, qtc * 1.6) + TWO_PI * f * le }));
  } else {
    // vented: due picchi attorno a Fb
    const fb = input.fb!;
    const fL = fb * 0.72;
    const fH = fb * 1.4;
    const zpeak = re * (1 + (qms / qes) * 0.6);
    return grid.map(f => {
      const peak = Math.max(lorentz(f, fL, 14), lorentz(f, fH, 14));
      return { f, v: re + (zpeak - re) * peak + TWO_PI * f * le };
    });
  }
}
