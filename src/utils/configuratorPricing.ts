/**
 * Pricing Calculator — Preventivi automatici configuratore
 *
 * Calcola il prezzo di una configurazione personalizzata basato su:
 * - Driver
 * - Amplificatore
 * - Materiali della cassa
 * - Dimensioni
 * - Lavorazione
 */

import type { SpeakerDriver, Amplifier, CabinetDesign } from '../types/speaker';

interface PricingConfig {
  basePriceDriver: number;
  basePriceAmp: number;
  baseCabinetPrice: number;
  materialsMultiplier: Record<string, number>;
  finishMultiplier: Record<string, number>;
  laborPerLiter: number;
  vat: number;
}

const DEFAULT_PRICING: PricingConfig = {
  basePriceDriver: 0, // Usato il prezzo del driver dal database
  basePriceAmp: 0,    // Usato il prezzo dell'amp dal database
  baseCabinetPrice: 150, // Base per la cassa (legno, pannelli, porta)
  materialsMultiplier: {
    'mdf-18': 1.0,
    'mdf-21': 1.1,
    'mdf-25': 1.25,
    'plywood-18': 1.3,
    'plywood-21': 1.45,
    'plywood-25': 1.65,
  },
  finishMultiplier: {
    'natural': 1.0,
    'black': 1.2,
    'white': 1.2,
  },
  laborPerLiter: 8, // €/litro di volume interno
  vat: 0.22,
};

export interface ConfiguratorPrice {
  driverPrice: number;       // woofer (LF)
  hfMidPrice: number;        // medio + tweeter/driver (vie alte)
  crossoverPrice: number;    // rete crossover passiva
  ampPrice: number;
  cabinetPrice: number;
  accessoriesPrice: number;  // griglia, ruote, maniglie, pole mount, RAL
  cabinetSubtotal: number;
  subtotal: number;
  vat: number;
  total: number;
  breakdown: {
    materials: number;
    labor: number;
    base: number;
  };
}

// Prezzi accessori (€)
const ACCESSORY_PRICES = { grille: 40, handles: 15, wheels: 35, poleMount: 20, ral: 30 };

/**
 * Calcola il prezzo di una configurazione completa.
 * @param extraDrivers altoparlanti aggiuntivi (medio, tweeter/driver) oltre al woofer
 * @param crossoverPoints numero di punti di incrocio (0 sub, 1 due vie, 2 tre vie)
 */
export function calculateConfiguratorPrice(
  driver: SpeakerDriver,
  amplifier: Amplifier,
  cabinet: CabinetDesign,
  customFinish?: string,
  config: PricingConfig = DEFAULT_PRICING,
  extraDrivers: SpeakerDriver[] = [],
  crossoverPoints: number = 0,
): ConfiguratorPrice {
  // Prezzo driver (usa campo price se disponibile)
  const driverPrice = (driver as any).price || 200;

  // Prezzo medio + tweeter/driver a compressione
  const hfMidPrice = extraDrivers.reduce((s, d) => s + ((d as any).price || 0), 0);

  // Rete crossover passiva: ~45€ a punto di incrocio (componenti + circuito)
  const crossoverPrice = crossoverPoints * 45;

  // Prezzo amplificatore
  const ampPrice = (amplifier as any).price || 300;

  // Calcolo prezzo cassa
  const materialKey = `${cabinet.woodType}-${cabinet.woodThickness}`;
  const materialMult = config.materialsMultiplier[materialKey] || 1.0;
  const finishMult = config.finishMultiplier[customFinish || cabinet.name] || 1.0;

  // Costo materiali e base
  const materialsCost = config.baseCabinetPrice * materialMult * finishMult;

  // Costo lavorazione basato su volume
  const laborCost = cabinet.internalVolume * config.laborPerLiter;

  // Accessori scelti dal cliente
  const acc = cabinet.accessories || {};
  let accessoriesPrice = 0;
  if (acc.grille) accessoriesPrice += ACCESSORY_PRICES.grille;
  if (acc.handles) accessoriesPrice += ACCESSORY_PRICES.handles;
  if (acc.wheels) accessoriesPrice += ACCESSORY_PRICES.wheels;
  if (acc.poleMount) accessoriesPrice += ACCESSORY_PRICES.poleMount;
  if (acc.ralColor && acc.ralColor.trim()) accessoriesPrice += ACCESSORY_PRICES.ral;

  const cabinetSubtotal = materialsCost + laborCost;
  const subtotal = driverPrice + hfMidPrice + crossoverPrice + ampPrice + cabinetSubtotal + accessoriesPrice;
  const vatAmount = subtotal * config.vat;
  const total = subtotal + vatAmount;

  return {
    driverPrice,
    hfMidPrice,
    crossoverPrice,
    ampPrice,
    cabinetPrice: cabinetSubtotal,
    accessoriesPrice,
    cabinetSubtotal,
    subtotal,
    vat: vatAmount,
    total,
    breakdown: {
      materials: materialsCost,
      labor: laborCost,
      base: config.baseCabinetPrice,
    },
  };
}

/**
 * Arrotonda un prezzo a 99 cents (es: 499.99)
 */
export function roundPrice(price: number): number {
  const base = Math.floor(price);
  return base + 0.99;
}

/**
 * Formatta un prezzo come stringa con simbolo €
 */
export function formatPrice(price: number, decimals: number = 2): string {
  return `€${price.toFixed(decimals).replace('.', ',')}`;
}
