/**
 * Passive Crossover — reti 1°–4° ordine (Butterworth / Linkwitz-Riley / Bessel),
 * Zobel, L-pad, baffle-step. Da Part 1 §4 del knowledge base.
 * Le formule assumono impedenza resistiva a fc (usare Zobel per linearizzare).
 */

export interface XoverComponent { kind: 'L' | 'C'; role: 'series' | 'shunt'; label: string; value: number; unit: 'mH' | 'µF'; }
export interface XoverDesign { lowpass: XoverComponent[]; highpass: XoverComponent[]; }

export type XoverFamily = 'butterworth' | 'linkwitz-riley' | 'bessel';

const L = (henry: number): XoverComponent => ({ kind: 'L', role: 'series', label: '', value: henry * 1000, unit: 'mH' });
const C = (farad: number): XoverComponent => ({ kind: 'C', role: 'shunt', label: '', value: farad * 1e6, unit: 'µF' });

/** Progetta il crossover. Z = impedenza driver (Ω), fc = freq di taglio (Hz). */
export function designCrossover(order: 1 | 2 | 3 | 4, family: XoverFamily, fc: number, z: number): XoverDesign {
  const w = 2 * Math.PI * fc;

  if (order === 1) {
    return {
      lowpass: [{ ...L(z / w), role: 'series', label: 'L1 (serie)' }],
      highpass: [{ ...C(1 / (w * z)), role: 'series', label: 'C1 (serie)' }],
    };
  }

  if (order === 2) {
    // kL, kC per famiglia
    const k = family === 'linkwitz-riley' ? { kL: 2.0, kC: 0.5 }
      : family === 'bessel' ? { kL: 1.36, kC: 0.62 }
      : { kL: 1.414, kC: 0.707 }; // butterworth
    const Lval = (k.kL * z) / w;
    const Cval = k.kC / (w * z);
    return {
      lowpass: [
        { ...L(Lval), role: 'series', label: 'L1 (serie)' },
        { ...C(Cval), role: 'shunt', label: 'C1 (parallelo)' },
      ],
      highpass: [
        { ...C(Cval), role: 'series', label: 'C1 (serie)' },
        { ...L(Lval), role: 'shunt', label: 'L1 (parallelo)' },
      ],
    };
  }

  if (order === 3) {
    // Butterworth 3° ordine (valori standard)
    const C1 = 0.0796 / (fc * z);
    const C2 = 0.3183 / (fc * z);
    const L1 = (0.1194 * z) / fc;
    const L2 = (0.0398 * z) / fc;
    return {
      lowpass: [
        { ...L(L1 * 1.5), role: 'series', label: 'L1 (serie)' },
        { ...C(C1), role: 'shunt', label: 'C1 (parallelo)' },
        { ...L(L2 * 1.5), role: 'series', label: 'L2 (serie)' },
      ],
      highpass: [
        { ...C(C2), role: 'series', label: 'C1 (serie)' },
        { ...L(L1), role: 'shunt', label: 'L1 (parallelo)' },
        { ...C(C1), role: 'series', label: 'C2 (serie)' },
      ],
    };
  }

  // order === 4: Linkwitz-Riley LR4 (standard) — anche per butterworth/bessel usiamo LR4 tipico
  const C1 = 0.0844 / (fc * z);
  const C2 = 0.1688 / (fc * z);
  const L1 = (0.1000 * z) / fc;
  const L2 = (0.2533 * z) / fc;
  return {
    lowpass: [
      { ...L(L2), role: 'series', label: 'L1 (serie)' },
      { ...C(C2), role: 'shunt', label: 'C1 (parallelo)' },
      { ...L(L1), role: 'series', label: 'L2 (serie)' },
      { ...C(C1), role: 'shunt', label: 'C2 (parallelo)' },
    ],
    highpass: [
      { ...C(C2), role: 'series', label: 'C1 (serie)' },
      { ...L(L1), role: 'shunt', label: 'L1 (parallelo)' },
      { ...C(C1), role: 'series', label: 'C2 (serie)' },
      { ...L(L2), role: 'shunt', label: 'L2 (parallelo)' },
    ],
  };
}

/** Zobel (compensazione Le): R≈Re, C=Le/Re² → C(µF)=1000·Le(mH)/Re² */
export function zobel(reOhm: number, leMh: number): { r: number; c: number } {
  return { r: reOhm, c: (1000 * leMh) / (reOhm * reOhm) };
}

/** L-pad per attenuazione A(dB) a impedenza Z: Rs=Z(1−1/k), Rp=Z/(k−1) */
export function lPad(attenDb: number, z: number): { rSeries: number; rParallel: number } {
  const k = Math.pow(10, attenDb / 20);
  return { rSeries: z * (1 - 1 / k), rParallel: z / (k - 1) };
}

/** Baffle-step: f_step = 115/Wb(m); L≈R/(2π·f); Rpar≈R (compensazione ~6dB) */
export function baffleStep(baffleWidthMm: number, z: number): { fStep: number; inductanceMh: number; rParallel: number } {
  const wb = baffleWidthMm / 1000; // m
  const fStep = 115 / wb;
  const Lh = z / (2 * Math.PI * fStep);
  return { fStep, inductanceMh: Lh * 1000, rParallel: z };
}

/** Notch parallelo RLC: f0=1/(2π√(LC)); dato f0 e L scelto → C, e R per profondità */
export function notchFilter(f0: number, inductanceMh: number, depthDb: number, z: number): { c: number; r: number } {
  const Lh = inductanceMh / 1000;
  const c = 1 / (Math.pow(2 * Math.PI * f0, 2) * Lh); // F
  // R imposta la profondità: maggiore R = notch meno profondo
  const r = z * Math.pow(10, -Math.abs(depthDb) / 20) + 0.1;
  return { c: c * 1e6, r };
}

/** Frequenza di beaming: f ≈ c/(π·D) */
export function beamingFreq(diaMm: number, tempC = 20): number {
  const c = 331.3 * Math.sqrt(1 + tempC / 273.15);
  return c / (Math.PI * (diaMm / 1000));
}
