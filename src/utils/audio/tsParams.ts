/**
 * Motore di derivazione dei parametri Thiele-Small.
 *
 * Da un sottoinsieme qualsiasi di parametri ricava tutti quelli deducibili,
 * applicando ciclicamente le relazioni fondamentali (Thiele 1961, Small 1972–73)
 * finché non emergono nuovi valori.
 *
 * Unità lato utente: Vas [litri], Cms [mm/N], Mms [g], Sd [cm²], Xmax [mm],
 * Dia [mm], Vd [cm³], Le [mH]. Le formule lavorano in SI e riconvertono.
 */

import { airDensity, speedOfSound, TWO_PI } from './constants';
import type { TSInput, TSParams } from './types';

const has = (v: number | undefined): v is number => typeof v === 'number' && isFinite(v) && v > 0;

// ─── Relazioni singole (esposte anche per i pulsanti "stima" della UI) ────────

/** Qts = Qms·Qes / (Qms + Qes) */
export const qtsFrom = (qms: number, qes: number) => (qms * qes) / (qms + qes);
/** Qes = Qms·Qts / (Qms − Qts) */
export const qesFrom = (qms: number, qts: number) => (qms * qts) / (qms - qts);
/** Qms = Qes·Qts / (Qes − Qts) */
export const qmsFrom = (qes: number, qts: number) => (qes * qts) / (qes - qts);

/** EBP = Fs / Qes — indice di idoneità al bass-reflex */
export const ebpFrom = (fs: number, qes: number) => fs / qes;

/** Sd (cm²) da diametro effettivo del cono (mm) */
export const sdFromDia = (diaMm: number) => Math.PI * Math.pow(diaMm / 20, 2);
/** Diametro effettivo (mm) da Sd (cm²) */
export const diaFromSd = (sdCm2: number) => 20 * Math.sqrt(sdCm2 / Math.PI);

/** Vd (cm³) = Sd (cm²) · Xmax (mm) / 10 */
export const vdFrom = (sdCm2: number, xmaxMm: number) => sdCm2 * (xmaxMm / 10);

/** Vas (litri) = ρ·c²·Sd²·Cms */
export function vasFrom(sdCm2: number, cmsMmPerN: number, tempC = 20): number {
  const rho = airDensity(tempC);
  const c = speedOfSound(tempC);
  const sd = sdCm2 / 1e4;       // m²
  const cms = cmsMmPerN / 1000; // m/N
  return rho * c * c * sd * sd * cms * 1000; // m³ → litri
}

/**
 * Sd (cm²) = √(Vas / (ρ·c²·Cms))
 *
 * Serve con i driver car audio: molti costruttori pubblicano come "Sd" l'area
 * della flangia invece di quella effettiva del cono, mentre il Vas dichiarato
 * è coerente con l'area vera. Ricavare Sd dal Vas dà il valore utilizzabile.
 */
export function sdFromVasCms(vasL: number, cmsMmPerN: number, tempC = 20): number {
  const rho = airDensity(tempC);
  const c = speedOfSound(tempC);
  const cms = cmsMmPerN / 1000;
  return Math.sqrt((vasL / 1000) / (rho * c * c * cms)) * 1e4;
}

/** Cms (mm/N) = Vas / (ρ·c²·Sd²) */
export function cmsFrom(vasL: number, sdCm2: number, tempC = 20): number {
  const rho = airDensity(tempC);
  const c = speedOfSound(tempC);
  const sd = sdCm2 / 1e4;
  const vas = vasL / 1000;
  return (vas / (rho * c * c * sd * sd)) * 1000; // m/N → mm/N
}

/** Mms (g) = 1 / ((2π·Fs)²·Cms) */
export function mmsFrom(fs: number, cmsMmPerN: number): number {
  const cms = cmsMmPerN / 1000;
  return (1 / (Math.pow(TWO_PI * fs, 2) * cms)) * 1000; // kg → g
}

/** Cms (mm/N) = 1 / ((2π·Fs)²·Mms) */
export function cmsFromMms(fs: number, mmsG: number): number {
  const mms = mmsG / 1000;
  return (1 / (Math.pow(TWO_PI * fs, 2) * mms)) * 1000;
}

/** Fs (Hz) = 1 / (2π·√(Cms·Mms)) */
export function fsFrom(cmsMmPerN: number, mmsG: number): number {
  const cms = cmsMmPerN / 1000;
  const mms = mmsG / 1000;
  return 1 / (TWO_PI * Math.sqrt(cms * mms));
}

/** Rms (kg/s) = 2π·Fs·Mms / Qms */
export function rmsFrom(fs: number, mmsG: number, qms: number): number {
  return (TWO_PI * fs * (mmsG / 1000)) / qms;
}

/** Qms = 2π·Fs·Mms / Rms */
export function qmsFromRms(fs: number, mmsG: number, rms: number): number {
  return (TWO_PI * fs * (mmsG / 1000)) / rms;
}

/** BL (T·m) = √(2π·Fs·Mms·Re / Qes) */
export function blFrom(fs: number, mmsG: number, re: number, qes: number): number {
  return Math.sqrt((TWO_PI * fs * (mmsG / 1000) * re) / qes);
}

/** Qes = 2π·Fs·Mms·Re / BL² */
export function qesFromBl(fs: number, mmsG: number, re: number, bl: number): number {
  return (TWO_PI * fs * (mmsG / 1000) * re) / (bl * bl);
}

/** Mms (g) = Qes·BL² / (2π·Fs·Re) — la stessa relazione risolta sulla massa */
export function mmsFromBl(fs: number, re: number, qes: number, bl: number): number {
  return ((qes * bl * bl) / (TWO_PI * fs * re)) * 1000;
}

/** η0 (%) = (4π²/c³)·(Fs³·Vas / Qes) */
export function eta0From(fs: number, vasL: number, qes: number, tempC = 20): number {
  const c = speedOfSound(tempC);
  const vas = vasL / 1000; // m³
  return ((4 * Math.PI * Math.PI) / Math.pow(c, 3)) * ((Math.pow(fs, 3) * vas) / qes) * 100;
}

/**
 * Sensibilità 1W/1m in mezzo spazio = K + 10·log10(η0).
 *
 * K non è 112 tondo: viene da 20·log10(√(ρ·c/2π)/20µPa) = 112.16 dB. I 0.16 dB
 * di differenza sembrano nulla, ma rompevano l'accordo fra la curva SPL e
 * quella di escursione, che sono calcolate per strade indipendenti.
 */
export const SPL_HALF_SPACE_K = 112.16;
export const sensitivityFrom = (eta0Percent: number) => SPL_HALF_SPACE_K + 10 * Math.log10(eta0Percent / 100);

/** SPL a 2.83 V = SPL 1W/1m + 10·log10(8/Z) — a 8Ω i due valori coincidono */
export const spl283From = (sens1W: number, zNom: number) => sens1W + 10 * Math.log10(8 / zNom);

// ─── Completamento iterativo ──────────────────────────────────────────────────

/**
 * Riempie tutti i parametri derivabili dall'input. Non sovrascrive mai un
 * valore inserito dall'utente: aggiunge solo ciò che manca.
 */
export function completeTSParams(input: TSInput, tempC = 20): TSInput {
  const p: TSInput = { ...input };

  // Fino a 6 passate: ogni nuovo valore può sbloccarne altri
  for (let pass = 0; pass < 6; pass++) {
    const before = JSON.stringify(p);

    // Geometria del cono
    if (!has(p.sd) && has(p.dia)) p.sd = sdFromDia(p.dia);
    if (!has(p.dia) && has(p.sd)) p.dia = diaFromSd(p.sd);
    if (!has(p.vd) && has(p.sd) && has(p.xmax)) p.vd = vdFrom(p.sd, p.xmax);

    // Fattori di merito
    if (!has(p.qts) && has(p.qms) && has(p.qes)) p.qts = qtsFrom(p.qms, p.qes);
    if (!has(p.qes) && has(p.qms) && has(p.qts) && p.qms > p.qts) p.qes = qesFrom(p.qms, p.qts);
    if (!has(p.qms) && has(p.qes) && has(p.qts) && p.qes > p.qts) p.qms = qmsFrom(p.qes, p.qts);

    // Compliance ↔ Vas ↔ massa mobile
    if (!has(p.vas) && has(p.sd) && has(p.cms)) p.vas = vasFrom(p.sd, p.cms, tempC);
    if (!has(p.cms) && has(p.vas) && has(p.sd)) p.cms = cmsFrom(p.vas, p.sd, tempC);
    if (!has(p.sd) && has(p.vas) && has(p.cms)) p.sd = sdFromVasCms(p.vas, p.cms, tempC);
    if (!has(p.mms) && has(p.fs) && has(p.cms)) p.mms = mmsFrom(p.fs, p.cms);
    if (!has(p.cms) && has(p.fs) && has(p.mms)) p.cms = cmsFromMms(p.fs, p.mms);
    if (!has(p.fs) && has(p.cms) && has(p.mms)) p.fs = fsFrom(p.cms, p.mms);

    // Smorzamento meccanico
    if (!has(p.rms) && has(p.fs) && has(p.mms) && has(p.qms)) p.rms = rmsFrom(p.fs, p.mms, p.qms);
    if (!has(p.qms) && has(p.fs) && has(p.mms) && has(p.rms)) p.qms = qmsFromRms(p.fs, p.mms, p.rms);

    // Motore
    if (!has(p.bl) && has(p.fs) && has(p.mms) && has(p.re) && has(p.qes)) p.bl = blFrom(p.fs, p.mms, p.re, p.qes);
    if (!has(p.qes) && has(p.fs) && has(p.mms) && has(p.re) && has(p.bl)) p.qes = qesFromBl(p.fs, p.mms, p.re, p.bl);

    // Efficienza e sensibilità
    if (!has(p.eta0) && has(p.fs) && has(p.vas) && has(p.qes)) p.eta0 = eta0From(p.fs, p.vas, p.qes, tempC);
    if (!has(p.sensitivity) && has(p.eta0)) p.sensitivity = sensitivityFrom(p.eta0);

    // Impedenza nominale stimata da Re (Re ≈ 0.8–0.9 · Z)
    if (!has(p.impedance) && has(p.re)) {
      const candidates = [2, 4, 6, 8, 16];
      p.impedance = candidates.reduce((best, z) =>
        Math.abs(p.re! / z - 0.85) < Math.abs(p.re! / best - 0.85) ? z : best, 8);
    }
    if (!has(p.re) && has(p.impedance)) p.re = p.impedance * 0.85;

    if (JSON.stringify(p) === before) break;
  }

  return p;
}

/** Verifica che ci sia il minimo indispensabile per progettare una cassa */
export function isDesignable(p: TSInput): p is TSInput & Pick<TSParams, 'fs' | 'qts' | 'vas'> {
  return has(p.fs) && has(p.qts) && has(p.vas);
}

/** Converte l'input completato in TSParams utilizzabili dal motore acustico */
export function toTSParams(p: TSInput): TSParams | null {
  if (!isDesignable(p)) return null;
  return {
    fs: p.fs!, qts: p.qts!, vas: p.vas!,
    qes: has(p.qes) ? p.qes : p.qts!,
    qms: has(p.qms) ? p.qms : p.qts! * 10,
    re: p.re, le: p.le, sd: p.sd, xmax: p.xmax, xmech: p.xmech,
    bl: p.bl, mms: p.mms, cms: p.cms, rms: p.rms, pe: p.pe,
    vd: p.vd, eta0: p.eta0, sensitivity: p.sensitivity,
    impedance: p.impedance, dia: p.dia,
  };
}
