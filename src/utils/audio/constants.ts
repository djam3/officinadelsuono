/**
 * Audio Engineering — Costanti fisiche e conversioni di unità
 *
 * Riferimento: Parts 1–2 del knowledge base (Thiele/Small, Dickason, Leach,
 * Bristow-Johnson). Tutti i modelli sono lineari "small-signal", validi sotto
 * ~200–300 Hz (come WinISD/BassBox). Non modellano distorsione, breakup,
 * compressione di potenza né l'acustica reale della stanza.
 */

// ─── Costanti fisiche ─────────────────────────────────────────────────────────
export const P_REF = 20e-6;            // Pa, riferimento SPL (soglia udito)

/** Velocità del suono in aria (m/s) alla temperatura T (°C). c = 331.3·√(1+T/273.15) */
export function speedOfSound(tempC = 20): number {
  return 331.3 * Math.sqrt(1 + tempC / 273.15);
}

/** Densità dell'aria (kg/m³) — approssimazione utile attorno a 15–25 °C */
export function airDensity(tempC = 20): number {
  // ρ ≈ 1.225·(288.15/(T+273.15)) a pressione standard
  return 1.225 * (288.15 / (tempC + 273.15));
}

export const C_AIR_20 = speedOfSound(20);   // ~343 m/s
export const RHO_AIR_20 = 1.2041;           // kg/m³ a 20 °C

// ─── Conversioni di unità (SI ↔ imperiale) ────────────────────────────────────
export const litersToM3 = (L: number) => L / 1000;
export const m3ToLiters = (m3: number) => m3 * 1000;
export const litersToFt3 = (L: number) => L * 0.0353147;
export const ft3ToLiters = (ft3: number) => ft3 / 0.0353147;

export const mmToIn = (mm: number) => mm / 25.4;
export const inToMm = (inch: number) => inch * 25.4;
export const cmToIn = (cm: number) => cm / 2.54;
export const inToCm = (inch: number) => inch * 2.54;

export const cm2ToIn2 = (cm2: number) => cm2 / 6.4516;
export const in2ToCm2 = (in2: number) => in2 * 6.4516;
export const cm2ToM2 = (cm2: number) => cm2 / 1e4;

export const celsiusToF = (c: number) => (c * 9) / 5 + 32;
export const fToCelsius = (f: number) => ((f - 32) * 5) / 9;

// ─── Helper numerici ──────────────────────────────────────────────────────────
export const TWO_PI = Math.PI * 2;
export const dB = (ratio: number) => 20 * Math.log10(Math.max(ratio, 1e-12));
export const fromDB = (db: number) => Math.pow(10, db / 20);
export const round = (n: number, d = 2) => {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
};
export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Genera una griglia di frequenze logaritmica (per i grafici) */
export function logFreqGrid(fMin = 10, fMax = 20000, points = 240): number[] {
  const out: number[] = [];
  const a = Math.log10(fMin);
  const b = Math.log10(fMax);
  for (let i = 0; i < points; i++) {
    out.push(Math.pow(10, a + ((b - a) * i) / (points - 1)));
  }
  return out;
}
