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
  ql?: number;        // vented (default 7)
  powerW?: number;    // per excursion
  fMin?: number;      // range grafico (default 10 Hz)
  fMax?: number;      // range grafico (default 20 kHz)
  sensitivity?: number; // dB 1W/1m → curva in SPL assoluto (veritiera)
  fHigh?: number;     // limite superiore del driver (roll-off in alto realistico)
  fHighOrder?: number; // ordine del roll-off HF (default 3)
}

export function computeResponse(input: ResponseInput): ResponseCurves {
  const { ts, type } = input;
  const grid = logFreqGrid(input.fMin ?? 10, input.fMax ?? 20000, 280);
  const ql = input.ql ?? 7;

  const Gat = (f: number): Complex => {
    if (type === 'sealed') return sealedG(f, input.fc!, input.qtc!);
    return ventedGImpl(f, ts.fs, input.fb!, input.alpha!, ql, ts.qts, input.fb! / ts.fs);
  };

  // Roll-off naturale del driver in alto (massa mobile / breakup) — rende la
  // curva veritiera oltre la banda utile invece di restare piatta a 20 kHz.
  const fHigh = input.fHigh;
  const hfOrder = input.fHighOrder ?? 3;
  const hfMag = (f: number): number => {
    if (!fHigh) return 1;
    return 1 / Math.sqrt(1 + Math.pow(f / fHigh, 2 * hfOrder));
  };
  const sens = input.sensitivity ?? 0; // 0 → curva relativa (passband = 0 dB)

  const spl: CurvePoint[] = grid.map(f => {
    const boxMag = cabs(Gat(f));
    return { f, v: sens + 20 * Math.log10(Math.max(boxMag * hfMag(f), 1e-6)) };
  });

  // Fase acustica (gradi)
  const phase: CurvePoint[] = grid.map(f => ({ f, v: (cphase(Gat(f)) * 180) / Math.PI }));

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

  // ── Escursione (mm picco) — modello fisico dalle funzioni di spostamento ──
  // Sealed: X(s) è un low-pass 2° ordine (limite di compliance sotto fc).
  // Vented: X(s) ha il notch a Fb (profondità 1/QL) e sotto Fb RISALE al limite
  //         di compliance del solo driver (il reflex non carica più il cono):
  //         è il motivo per cui serve l'HPF sotto l'accordo.
  const power = input.powerW ?? 100;
  const xmax = ts.xmax ?? 6;
  const znom = ts.impedance ?? 8;
  // La tensione si ricava da Re, non dall'impedenza nominale: l'efficienza η0
  // — e quindi la sensibilità da cui nasce la curva SPL — è definita come
  // potenza acustica su potenza ELETTRICA, cioè V²/Re. Usando √(P·Znom) si
  // immettevano in realtà P·Znom/Re watt (il 43% in più su un 8Ω con Re 5.6),
  // e le due curve, calcolate per strade indipendenti, non tornavano.
  const reForDrive = ts.re ?? znom * 0.85;
  const vrms = Math.sqrt(power * reForDrive);
  const bl = ts.bl ?? 0;
  const mmsKg = (ts.mms ?? 0) / 1000;
  const reOhm = ts.re ?? 0;
  const physical = bl > 0 && mmsKg > 0 && reOhm > 0;

  const dispMag = (f: number): number => {
    if (type === 'sealed') {
      // |X/X_dc| con X_dc a compliance totale (driver+box): LP2 su fc
      const O = f / input.fc!;
      return 1 / Math.hypot(1 - O * O, O / input.qtc!);
    }
    // vented (Leach): X ∝ (1 − (Ω²/h) + jΩ/(√h·QL)) / D(Ω), normalizzato a f0=√(fb·fs)
    const fb = input.fb!;
    const f0 = Math.sqrt(fb * ts.fs);
    const h = fb / ts.fs;
    const O = f / f0;
    const a1 = 1 / (ql * Math.sqrt(h)) + Math.sqrt(h) / ts.qts;
    const a2 = (input.alpha! + 1) / h + h + 1 / (ql * ts.qts);
    const a3 = 1 / (ts.qts * Math.sqrt(h)) + Math.sqrt(h) / ql;
    const numMag = Math.hypot(1 - (O * O) / h, O / (Math.sqrt(h) * ql));
    const denMag = Math.hypot(Math.pow(O, 4) - a2 * O * O + 1, -a1 * Math.pow(O, 3) + a3 * O);
    return numMag / denMag;
  };

  let excursion: CurvePoint[];
  if (physical) {
    // X_dc = V·Bl/(Re·k) con k = (2π·f_rif)²·Mms; f_rif = fc (sealed, molla
    // driver+box) o fs (vented: a bassa frequenza resta solo la molla del driver)
    const fRef = type === 'sealed' ? input.fc! : ts.fs;
    const k = Math.pow(TWO_PI * fRef, 2) * mmsKg;
    const xDcMm = (vrms * bl) / (reOhm * k) * 1000;
    excursion = grid.map(f => ({ f, v: xDcMm * dispMag(f) * Math.SQRT2 }));
  } else {
    // fallback relativo (dati TS incompleti): forma corretta, picco ≈ Xmax
    excursion = grid.map(f => ({ f, v: dispMag(f) }));
    const peakX = Math.max(...excursion.map(p => p.v), 1e-9);
    const scale = (xmax * Math.sqrt(power / 100)) / peakX;
    excursion.forEach(p => { p.v = p.v * scale; });
  }

  // Impedenza modellata
  const impedance = computeImpedance(input, grid);

  return { spl, excursion, impedance, groupDelay, phase };
}

/** Impedenza |Z(f)|: picco(i) di risonanza + salita induttiva Le */
function computeImpedance(input: ResponseInput, grid: number[]): CurvePoint[] {
  const { ts, type } = input;
  const re = ts.re ?? (ts.impedance ? ts.impedance * 0.9 : 6);
  const le = (ts.le ?? 0.5) / 1000; // H
  const qms = ts.qms, qes = ts.qes;

  if (type === 'sealed') {
    // Risonanza singola: Z = Re·(1 + (Qmc/Qec)/(1 + jQmc(Ω − 1/Ω))).
    // Al picco (Ω = 1) vale Re·(1 + Qmc/Qec), che è il valore di manuale.
    const fc = input.fc!;
    const qmc = qms * (fc / ts.fs);
    const qec = qes * (fc / ts.fs);
    return grid.map(f => {
      const O = f / fc;
      const den = Math.hypot(1, qmc * (O - 1 / O));
      return { f, v: re * (1 + (qmc / qec) / den) + TWO_PI * f * le };
    });
  }

  // ── Vented ──────────────────────────────────────────────────────────────
  //
  // L'impedenza motional si ricava dall'impedenza ACUSTICA del sistema vista
  // dal diaframma, e in quella non deve comparire lo smorzamento elettrico:
  // e proprio quello che l'impedenza sta misurando, metterlo anche nel
  // denominatore lo conta due volte. La versione precedente usava il
  // denominatore D(O) della funzione di trasferimento, che porta dentro 1/Qts,
  // e i picchi uscivano sei volte piu bassi del vero — 10 ohm invece di 63 su
  // un 18" da 8 ohm, dove il riferimento di manuale per la cassa chiusa e
  // Re(1 + Qms/Qes) = 98 ohm. Una curva cosi non serve a verificare un
  // montaggio, che e il motivo per cui la si guarda.
  //
  // Forma ricavata dal circuito, normalizzata alla risonanza del driver
  // (sigma = j*f/Fs, beta = Fb/Fs):
  //
  //   Z_A/z_s   = 1/Qms + sigma + 1/sigma + alpha*sigma/(sigma^2 + sigma*beta/QL + beta^2)
  //   Z(s)      = Re * [ 1 + (1/Qes) / (Z_A/z_s) ] + j*w*Le
  //
  // Con il condotto tappato (beta -> 0) si riduce a Re(1 + Qms/Qes) alla
  // risonanza in cassa, cioe esattamente il valore della cassa chiusa.
  const fb = input.fb!;
  const alpha = input.alpha!;
  const ql = input.ql ?? 7;
  const beta = fb / ts.fs;
  const qmsD = ts.qms ?? ts.qts * 10;

  return grid.map(f => {
    // sigma = j·u  ⇒  1/sigma = −j/u ,  sigma² = −u²
    const u = f / ts.fs;

    // carico della cassa: alpha·sigma / (sigma² + sigma·beta/QL + beta²)
    const denRe = beta * beta - u * u;
    const denIm = (u * beta) / ql;
    const den2 = Math.max(denRe * denRe + denIm * denIm, 1e-12);
    const boxRe = (alpha * u * denIm) / den2;
    const boxIm = (alpha * u * denRe) / den2;

    // impedenza acustica normalizzata vista dal diaframma, SENZA la parte
    // elettrica: quella è l'incognita che stiamo misurando
    const zaRe = 1 / qmsD + boxRe;
    const zaIm = u - 1 / u + boxIm;
    const za2 = Math.max(zaRe * zaRe + zaIm * zaIm, 1e-12);

    // parte motional = (1/Qes)/Z_A, complessa
    const motRe = zaRe / (za2 * qes);
    const motIm = -zaIm / (za2 * qes);

    return {
      f,
      v: Math.hypot(re * (1 + motRe), re * motIm + TWO_PI * f * le),
    };
  });
}
