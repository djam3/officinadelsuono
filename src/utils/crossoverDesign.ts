/**
 * Scelta delle frequenze di incrocio e progetto rete crossover passiva per
 * sistemi multi-via, basata sui range dei driver scelti. Usa il motore
 * condiviso audio/crossover.ts (stesso dell'Admin).
 */
import { designCrossover, type XoverDesign, type XoverFamily } from './audio';
import type { SpeakerDriver } from '../types/speaker';

export type SystemType = 'sub' | '2way' | '3way';

export interface XoverPoint {
  from: string;          // driver inferiore
  to: string;            // driver superiore
  fc: number;            // Hz frequenza di incrocio
  order: 1 | 2 | 3 | 4;
  family: XoverFamily;
  z: number;             // impedenza usata (Ω)
  design: XoverDesign;   // componenti L/C
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const geoMean = (a: number, b: number) => Math.sqrt(a * b);

/**
 * Calcola le frequenze di incrocio (1 per 2 vie, 2 per 3 vie) e la rete passiva.
 * Ordine di default: 2° Butterworth (buon compromesso fase/componenti).
 */
export function computeCrossover(
  systemType: SystemType,
  woofer: SpeakerDriver | null,
  mid: SpeakerDriver | null,
  tweeter: SpeakerDriver | null,
): XoverPoint[] {
  if (!woofer || systemType === 'sub') return [];
  const order = 2 as const;
  const family: XoverFamily = 'butterworth';

  if (systemType === '2way' && tweeter) {
    const z = tweeter.impedance || woofer.impedance || 8;
    const fc = Math.round(clamp(geoMean(woofer.frequencyRange.max, tweeter.frequencyRange.min), 1200, 3000));
    return [{
      from: woofer.model, to: tweeter.model, fc, order, family, z,
      design: designCrossover(order, family, fc, z),
    }];
  }

  if (systemType === '3way' && mid && tweeter) {
    const zMid = mid.impedance || 8;
    const zTw = tweeter.impedance || 8;
    const fcLow = Math.round(clamp(geoMean(woofer.frequencyRange.max, mid.frequencyRange.min), 250, 700));
    const fcHigh = Math.round(clamp(geoMean(mid.frequencyRange.max, tweeter.frequencyRange.min), 1800, 3500));
    return [
      { from: woofer.model, to: mid.model, fc: fcLow, order, family, z: zMid, design: designCrossover(order, family, fcLow, zMid) },
      { from: mid.model, to: tweeter.model, fc: fcHigh, order, family, z: zTw, design: designCrossover(order, family, fcHigh, zTw) },
    ];
  }

  return [];
}

/** Ruoli ammessi per ciascuna posizione nel sistema */
export const isWooferRole = (d: SpeakerDriver) =>
  ['subwoofer', 'woofer', 'mid-bass', 'full-range', 'coaxial'].includes(d.type);
export const isMidRole = (d: SpeakerDriver) =>
  ['midrange', 'mid-bass'].includes(d.type);
export const isTweeterRole = (d: SpeakerDriver) =>
  ['tweeter', 'compression-driver'].includes(d.type);
