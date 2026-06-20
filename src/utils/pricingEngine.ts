/**
 * Pricing Engine — Sistema Prezzi con Margini Configurabili
 * 
 * Calcola il preventivo completo per una cassa personalizzata,
 * inclusi tutti i costi di materiali, manodopera e margine OdS.
 */

import type {
  SpeakerDriver, Amplifier, CabinetDesign,
  PricingBreakdown, PricingConfig,
} from '../types/speaker';
import { DEFAULT_PRICING_CONFIG } from '../data/speakerDatabase';

// ═══════════════════════════════════════════════════════════════════════════════
//  CALCOLO COSTO LEGNO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calcola il costo del legno basato sulla superficie totale dei pannelli
 * Un foglio MDF standard è 2440 × 1220mm = 2.977 m²
 */
function calculateWoodCost(cabinet: CabinetDesign, config: PricingConfig): number {
  const SHEET_AREA = 2440 * 1220; // mm² = ~2.977 m²

  // Somma la superficie totale di tutti i pannelli (in mm²)
  const totalArea = cabinet.panels.reduce((acc, panel) => {
    return acc + (panel.width * panel.height * panel.quantity);
  }, 0);

  // Aggiungi ~20% per sfridi e rinforzi
  const totalWithWaste = totalArea * 1.2;

  // Numero di fogli necessari (arrotonda per eccesso)
  const sheetsNeeded = Math.ceil(totalWithWaste / SHEET_AREA);

  // Moltiplicatore per legno premium
  let woodMultiplier = 1;
  if (cabinet.woodType === 'MDF-HDF') woodMultiplier = 1.3;
  if (cabinet.woodType === 'Betulla Baltica') woodMultiplier = 2.5;
  if (cabinet.woodType === 'Multistrato Pioppo') woodMultiplier = 1.8;

  return Math.round(sheetsNeeded * config.woodPricePerSheet * woodMultiplier);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CALCOLO MANODOPERA FALEGNAME
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Stima le ore di lavoro del falegname basandosi sulla complessità
 */
function estimateCarpenterHours(cabinet: CabinetDesign): number {
  let hours = 4; // base: taglio + assemblaggio semplice

  // Aggiungi tempo per porta bass-reflex
  if (cabinet.port) hours += 0.5;

  // Aggiungi tempo per doppio baffle
  hours += 1;

  // Aggiungi tempo per rinforzi interni
  hours += cabinet.bracing.length * 0.5;

  // Aggiungi tempo per maniglie incassate
  if (cabinet.handleCutouts) hours += 0.5;

  // Aggiungi tempo per sede amplificatore
  if (cabinet.ampCutout) hours += 1;

  // Aggiungi tempo per finitura
  hours += 1.5; // carteggio + verniciatura

  // Casse più grandi richiedono più tempo
  if (cabinet.externalDimensions.height > 600) hours += 1;
  if (cabinet.externalDimensions.height > 800) hours += 1;

  return hours;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CALCOLO PREVENTIVO COMPLETO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calcola il preventivo completo con breakdown dettagliato
 */
export function calculatePricing(
  driver: SpeakerDriver,
  amplifier: Amplifier,
  cabinet: CabinetDesign,
  quantity: number = 1,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): PricingBreakdown {

  // Costi componenti
  const driverCost = driver.price;
  const amplifierCost = amplifier.price;

  // Costo legno
  const woodCost = calculateWoodCost(cabinet, config);

  // Manodopera falegname
  const carpenterHours = estimateCarpenterHours(cabinet);
  const carpenterLabor = Math.round(carpenterHours * config.carpenterRatePerHour);

  // Hardware (viti, t-nut, maniglie, piedini, terminali, griglia protettiva)
  let hardwareCost = config.hardwareKitPrice;
  if (cabinet.handleCutouts) hardwareCost += 15; // maniglie metalliche
  if (cabinet.externalDimensions.height > 500) hardwareCost += 20; // griglia protettiva

  // Materiale fonoassorbente
  // Stima superficie interna da coprire
  const { width, height, depth } = cabinet.externalDimensions;
  const wt = cabinet.woodThickness;
  const internalSurfaceM2 = 2 * (
    (width - 2 * wt) * (height - 2 * wt) +
    (width - 2 * wt) * (depth - 2 * wt) +
    (height - 2 * wt) * (depth - 2 * wt)
  ) / 1e6;
  const dampingCoverage = cabinet.type === 'sealed' ? 1.0 : 0.6;
  const dampingCost = Math.round(internalSurfaceM2 * dampingCoverage * config.dampingPricePerMeter);

  // Finitura
  const finishCost = config.finishPricePerCabinet;

  // Assemblaggio OdS (montaggio driver + ampli + cablaggio + test)
  const assemblyLabor = Math.round(config.assemblyHours * config.assemblyRatePerHour);

  // Subtotale per unità
  const subtotal = driverCost + amplifierCost + woodCost + carpenterLabor +
    hardwareCost + dampingCost + finishCost + assemblyLabor;

  // Margine OdS
  const marginAmount = Math.round(subtotal * (config.marginPercent / 100));

  // Totale per unità
  const totalPerUnit = subtotal + marginAmount;

  // Totale complessivo
  const grandTotal = totalPerUnit * quantity;

  return {
    driverCost,
    amplifierCost,
    woodCost,
    carpenterLabor,
    hardwareCost,
    dampingCost,
    finishCost,
    assemblyLabor,
    subtotal,
    margin: config.marginPercent,
    marginAmount,
    totalPerUnit,
    quantity,
    grandTotal,
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
//  FORMATTAZIONE PREZZI
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Formatta un prezzo in euro
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Genera un riepilogo testo del preventivo
 */
export function generatePricingSummary(pricing: PricingBreakdown): string[] {
  return [
    `Driver speaker: ${formatPrice(pricing.driverCost)}`,
    `Amplificatore: ${formatPrice(pricing.amplifierCost)}`,
    `Legno e materiali: ${formatPrice(pricing.woodCost)}`,
    `Falegnameria: ${formatPrice(pricing.carpenterLabor)}`,
    `Ferramenta: ${formatPrice(pricing.hardwareCost)}`,
    `Fonoassorbente: ${formatPrice(pricing.dampingCost)}`,
    `Finitura: ${formatPrice(pricing.finishCost)}`,
    `Assemblaggio e test: ${formatPrice(pricing.assemblyLabor)}`,
    `───────────────────`,
    `Subtotale: ${formatPrice(pricing.subtotal)}`,
    `Margine (${pricing.margin}%): ${formatPrice(pricing.marginAmount)}`,
    `───────────────────`,
    `TOTALE per unità: ${formatPrice(pricing.totalPerUnit)}`,
    ...(pricing.quantity > 1 ? [
      `Quantità: ×${pricing.quantity}`,
      `TOTALE COMPLESSIVO: ${formatPrice(pricing.grandTotal)}`,
    ] : []),
  ];
}
