/**
 * Servizio spedizioni multi-corriere
 * Gestisce tariffe, peso volumetrico, quote comparative e impostazioni globali
 * I corrieri sono configurati in Firestore (shipping_couriers) dall'Admin
 */

import { db } from '../firebase';
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  setDoc, serverTimestamp, query, where
} from 'firebase/firestore';
import type { Corriere, QuotaCorriere, ShippingSettings, FasciaTariffaria } from '../types/shipping';
import { CORRIERI_DEFAULT } from '../types/shipping';

export type { Corriere, QuotaCorriere, ShippingSettings, FasciaTariffaria };
export { CORRIERI_DEFAULT };

export interface ProductDimensions {
  lunghezza: number; // mm
  larghezza: number; // mm
  altezza: number;   // mm
}

// ─── Peso volumetrico ──────────────────────────────────────────────────────────

export function calcolaPesoVolumetrico(
  dims: ProductDimensions,
  divisore = 5_000_000
): number {
  return (dims.lunghezza * dims.larghezza * dims.altezza) / divisore;
}

export function calcolaPesoFatturato(
  pesoRealeKg: number,
  dims?: ProductDimensions,
  divisore = 5_000_000
): number {
  if (!dims) return pesoRealeKg;
  return Math.max(pesoRealeKg, calcolaPesoVolumetrico(dims, divisore));
}

// ─── Calcolo quota singolo corriere ───────────────────────────────────────────

function tariffaCorriere(tariffe: FasciaTariffaria[], pesoKg: number): number {
  const fascia = tariffe.find(t => pesoKg <= t.maxKg);
  return fascia?.prezzo ?? -1;
}

export function calcolaQuotaCorriere(
  corriere: Corriere,
  pesoRealeKg: number,
  dims: ProductDimensions | undefined,
  totaleOrdine: number,
  sogliaGratuita: number,
  divisore = 5_000_000
): QuotaCorriere {
  const pesoVolumetrico = dims ? calcolaPesoVolumetrico(dims, divisore) : 0;
  const pesoFatturato = Math.max(pesoRealeKg, pesoVolumetrico);
  const gratuita = totaleOrdine >= sogliaGratuita;
  const costoBase = tariffaCorriere(corriere.tariffe, pesoFatturato);
  const preventivo = costoBase === -1;

  return {
    corriere,
    pesoFatturato:    Math.round(pesoFatturato * 100) / 100,
    pesoVolumetrico:  Math.round(pesoVolumetrico * 100) / 100,
    pesoReale:        pesoRealeKg,
    costoBase:        gratuita ? 0 : (preventivo ? -1 : costoBase),
    costoTotale:      gratuita ? 0 : (preventivo ? -1 : costoBase),
    gratuita,
    preventivo,
    stimaConsegna:    corriere.stimaConsegna,
  };
}

export function calcolaQuoteTuttiCorrieri(
  corrieri: Corriere[],
  pesoRealeKg: number,
  dims: ProductDimensions | undefined,
  totaleOrdine: number,
  sogliaGratuita: number,
  divisore = 5_000_000
): QuotaCorriere[] {
  return corrieri
    .filter(c => c.attivo)
    .map(c => calcolaQuotaCorriere(c, pesoRealeKg, dims, totaleOrdine, sogliaGratuita, divisore))
    .sort((a, b) => {
      if (a.preventivo && !b.preventivo) return 1;
      if (!a.preventivo && b.preventivo) return -1;
      return a.costoTotale - b.costoTotale;
    });
}

// ─── Firestore: Corrieri ───────────────────────────────────────────────────────

const CORRIERI_COLLECTION = 'shipping_couriers';
const SETTINGS_DOC = 'shipping_settings';

export async function loadCorreriFirestore(): Promise<Corriere[]> {
  try {
    const snap = await getDocs(collection(db, CORRIERI_COLLECTION));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Corriere));
  } catch {
    return [];
  }
}

export async function loadCorreriAttivi(): Promise<Corriere[]> {
  try {
    const q = query(collection(db, CORRIERI_COLLECTION), where('attivo', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Corriere));
  } catch {
    return [];
  }
}

export async function saveCorreire(corriere: Omit<Corriere, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, CORRIERI_COLLECTION), {
    ...corriere,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateCorriere(id: string, data: Partial<Corriere>): Promise<void> {
  await updateDoc(doc(db, CORRIERI_COLLECTION, id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCorriere(id: string): Promise<void> {
  await deleteDoc(doc(db, CORRIERI_COLLECTION, id));
}

export async function inizializzaCorreriDefault(): Promise<void> {
  const existing = await loadCorreriFirestore();
  if (existing.length > 0) return;
  const now = new Date().toISOString();
  for (const c of CORRIERI_DEFAULT) {
    await addDoc(collection(db, CORRIERI_COLLECTION), {
      ...c,
      tariffe: c.tariffe.map(t => ({ ...t, maxKg: t.maxKg === Infinity ? 9999 : t.maxKg })),
      createdAt: now,
      updatedAt: now,
    });
  }
}

// ─── Firestore: Impostazioni globali ─────────────────────────────────────────

export async function loadShippingSettings(): Promise<ShippingSettings> {
  try {
    const snap = await getDoc(doc(db, 'settings', SETTINGS_DOC));
    if (snap.exists()) return snap.data() as ShippingSettings;
  } catch { /* ignored */ }
  return {
    sogliaGratuita: 199,
    volumetricoDivisore: 5_000_000,
    updatedAt: new Date().toISOString(),
  };
}

export async function saveShippingSettings(s: Partial<ShippingSettings>): Promise<void> {
  await setDoc(doc(db, 'settings', SETTINGS_DOC), {
    ...s,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

// ─── Backward-compat: funzioni precedenti ────────────────────────────────────

export interface ShippingResult {
  costo: number;
  gratuita: boolean;
  pesoFatturato: number;
  pesoVolumetrico: number;
  pesoReale: number;
  corriere: string;
  stimaConsegna: string;
}

export const SOGLIA_SPEDIZIONE_GRATUITA = 199;

export function calcolaSpedizioneProdotto(
  prezzoOrdine: number,
  pesoKg: number,
  dims?: ProductDimensions
): ShippingResult {
  const pesoVolumetrico = dims ? calcolaPesoVolumetrico(dims) : 0;
  const pesoFatturato = Math.max(pesoKg, pesoVolumetrico);
  const gratuita = prezzoOrdine >= SOGLIA_SPEDIZIONE_GRATUITA;
  const costo = gratuita ? 0 : tariffeDefault(pesoFatturato);
  return {
    costo, gratuita,
    pesoFatturato: Math.round(pesoFatturato * 100) / 100,
    pesoVolumetrico: Math.round(pesoVolumetrico * 100) / 100,
    pesoReale: pesoKg,
    corriere: 'BRT / GLS',
    stimaConsegna: '24h lavorative',
  };
}

export interface CartItemShipping {
  pesoKg: number;
  dims?: ProductDimensions;
  quantita: number;
}

export function calcolaSpedizioneCarrello(
  totaleOrdine: number,
  articoli: CartItemShipping[]
): ShippingResult {
  if (!articoli.length) return { costo: 0, gratuita: false, pesoFatturato: 0, pesoVolumetrico: 0, pesoReale: 0, corriere: 'BRT / GLS', stimaConsegna: '24h lavorative' };
  let totReale = 0, totVol = 0;
  for (const a of articoli) {
    totReale += a.pesoKg * a.quantita;
    if (a.dims) totVol += calcolaPesoVolumetrico(a.dims) * a.quantita;
  }
  const pesoFatturato = Math.max(totReale, totVol);
  const gratuita = totaleOrdine >= SOGLIA_SPEDIZIONE_GRATUITA;
  return {
    costo: gratuita ? 0 : tariffeDefault(pesoFatturato),
    gratuita,
    pesoFatturato: Math.round(pesoFatturato * 100) / 100,
    pesoVolumetrico: Math.round(totVol * 100) / 100,
    pesoReale: Math.round(totReale * 100) / 100,
    corriere: 'BRT / GLS',
    stimaConsegna: '24h lavorative',
  };
}

function tariffeDefault(kg: number): number {
  if (kg <= 1)  return 5.90;
  if (kg <= 3)  return 7.90;
  if (kg <= 5)  return 9.90;
  if (kg <= 10) return 12.90;
  if (kg <= 20) return 17.90;
  if (kg <= 30) return 24.90;
  if (kg <= 50) return 34.90;
  return -1;
}

export function formatCostoSpedizione(result: ShippingResult | QuotaCorriere): string {
  const costo = 'costo' in result ? result.costo : result.costoTotale;
  if (result.gratuita) return 'Gratuita';
  if (costo === -1) return 'Preventivo';
  return `€${costo.toFixed(2)}`;
}

export function mancaAllaGratuita(totaleOrdine: number, soglia = SOGLIA_SPEDIZIONE_GRATUITA): number {
  const diff = soglia - totaleOrdine;
  return diff > 0 ? Math.round(diff * 100) / 100 : 0;
}
