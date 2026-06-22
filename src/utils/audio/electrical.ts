/**
 * Amplificatori & elettrico — potenza, bridging, SPL/headroom, cablaggio,
 * sezione cavo/fusibile, soglia limiter. Da Part 2 §2–4, §8–9.
 */

// ─── Potenza amplificatore ────────────────────────────────────────────────────

/** P = V²/R (V = tensione RMS d'uscita) */
export const power = (vrms: number, rOhm: number) => (vrms * vrms) / rOhm;

/** Da potenza nominale a una data R, ricava V e potenza ideale ad altre R (raddoppio) */
export function powerVsLoad(ratedW: number, ratedOhm: number, loads: number[]): { ohm: number; watts: number }[] {
  const vrms = Math.sqrt(ratedW * ratedOhm); // tensione costante (sorgente di tensione ideale)
  return loads.map(ohm => ({ ohm, watts: power(vrms, ohm) }));
}

/** Bridging (BTL): ~4× su stessa R, ma ogni canale "vede" R/2 */
export const bridgedPower = (ratedW: number, ratedOhm: number) => 4 * ratedW * 1; // 4× teorico
export const bridgedSeenImpedance = (loadOhm: number) => loadOhm / 2;

/** Damping factor = Zload / Zout */
export const dampingFactor = (loadOhm: number, zoutOhm: number) => loadOhm / zoutOhm;

// ─── SPL / Headroom ───────────────────────────────────────────────────────────

/** SPL = Sens + 10log10(P) − 20log10(d) + boundary */
export function splAt(sensDb: number, watts: number, distanceM: number, boundaryDb = 0): number {
  return sensDb + 10 * Math.log10(watts) - 20 * Math.log10(distanceM) + boundaryDb;
}

/** Watt necessari per un SPL target (con headroom e boundary gain) */
export function wattsForSpl(sensDb: number, targetSpl: number, distanceM: number, headroomDb = 0, boundaryDb = 0): number {
  const exp = (targetSpl - sensDb + 20 * Math.log10(distanceM) + headroomDb - boundaryDb) / 10;
  return Math.pow(10, exp);
}

// ─── Cablaggio / impedenza ────────────────────────────────────────────────────

export const seriesImpedance = (rs: number[]) => rs.reduce((a, b) => a + b, 0);
export const parallelImpedance = (rs: number[]) => 1 / rs.reduce((a, b) => a + 1 / b, 0);

export type CoilWiring = 'series' | 'parallel';
/** Sub a doppia bobina (DVC): carico risultante */
export function dvcLoad(coilOhm: number, wiring: CoilWiring): number {
  return wiring === 'series' ? coilOhm * 2 : coilOhm / 2;
}

/** N driver identici (R ciascuno) in serie o parallelo */
export function multiDriverLoad(rOhm: number, n: number, wiring: CoilWiring): number {
  return wiring === 'series' ? rOhm * n : rOhm / n;
}

// ─── Sezione cavo & fusibile (car audio) ──────────────────────────────────────

/** Corrente assorbita: I = P_rms / (eff · Vsupply) */
export function currentDraw(rmsW: number, efficiency = 0.75, vSupply = 13.8): number {
  return rmsW / (efficiency * vSupply);
}

/** Circular mils di un AWG: d_mil = 5·92^((36−n)/39); cmil = d_mil² */
export function awgToCircularMils(awg: number): number {
  const dMil = 5 * Math.pow(92, (36 - awg) / 39);
  return dMil * dMil;
}
const CMIL_TO_M2 = 5.067e-10;

/** Raccomanda AWG da corrente e lunghezza (criterio caduta di tensione + cmil) */
export function recommendWireGauge(currentA: number, oneWayLengthM: number, maxDropPct = 3, vSupply = 13.8): { awg: number; dropV: number; dropPct: number } {
  const rhoCu = 1.68e-8; // Ω·m
  for (let awg = 0; awg <= 20; awg++) {
    const cmil = awgToCircularMils(awg);
    const area = cmil * CMIL_TO_M2;
    const rWire = (rhoCu * (2 * oneWayLengthM)) / area; // andata+ritorno
    const dropV = currentA * rWire;
    const dropPct = (dropV / vSupply) * 100;
    const ampacityOk = cmil >= 300 * currentA;
    if (dropPct <= maxDropPct && ampacityOk) {
      return { awg, dropV, dropPct };
    }
  }
  // fallback: 0 AWG
  const cmil = awgToCircularMils(0);
  const rWire = (rhoCu * (2 * oneWayLengthM)) / (cmil * CMIL_TO_M2);
  const dropV = currentA * rWire;
  return { awg: 0, dropV, dropPct: (dropV / vSupply) * 100 };
}

/** Fusibile consigliato (A): ~ corrente · 1.25, arrotondato a taglie comuni */
export function recommendFuse(currentA: number): number {
  const target = currentA * 1.25;
  const sizes = [10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 125, 150, 200, 250, 300];
  return sizes.find(s => s >= target) ?? Math.ceil(target / 50) * 50;
}

// ─── Limiter ──────────────────────────────────────────────────────────────────

/** Soglia limiter RMS (tensione) dalla potenza nominale: V = √(P·R) */
export const limiterThreshold = (ratedW: number, rOhm: number) => Math.sqrt(ratedW * rOhm);
