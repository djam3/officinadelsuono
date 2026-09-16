/**
 * Costanti elettriche e sezioni normalizzate.
 *
 * La resistività del rame è quella dello standard IACS: 1/58 Ω·mm²/m a 20 °C.
 * Non è un dato di catalogo ma la definizione stessa del 100% IACS, e da lì
 * discende tutto il resto — un cavo reale, cordato e stagnato, sta qualche
 * punto percentuale sopra.
 */

/** resistività a 20 °C, Ω·mm²/m */
export const RHO_CU = 1 / 58;        // 0.0172414
export const RHO_AL = 0.0282;

/** coefficiente di temperatura, 1/K */
export const ALPHA_CU = 0.00393;
export const ALPHA_AL = 0.00403;

export type Conductor = 'rame' | 'alluminio';

export const CONDUCTORS: Record<Conductor, { rho: number; alpha: number; label: string }> = {
  rame: { rho: RHO_CU, alpha: ALPHA_CU, label: 'Rame' },
  alluminio: { rho: RHO_AL, alpha: ALPHA_AL, label: 'Alluminio' },
};

/** resistività alla temperatura di esercizio */
export function resistivity(material: Conductor, tempC: number): number {
  const c = CONDUCTORS[material];
  return c.rho * (1 + c.alpha * (tempC - 20));
}

/** sezioni commerciali (mm²), serie metrica */
export const SEZIONI = [0.5, 0.75, 1.0, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50] as const;

/**
 * Corrispondenza AWG → mm², per chi legge schede americane.
 * Il passo AWG è geometrico: ogni 3 numeri in meno la sezione raddoppia.
 */
export const AWG_MM2: Record<number, number> = {
  20: 0.518, 18: 0.823, 16: 1.31, 14: 2.08, 12: 3.31,
  10: 5.26, 8: 8.37, 6: 13.3, 4: 21.2, 2: 33.6, 0: 53.5,
};

/** la sezione commerciale più piccola che copre un valore richiesto */
export function sezioneCommerciale(minMm2: number): number | null {
  return SEZIONI.find(s => s >= minMm2 - 1e-9) ?? null;
}

/** Tensione di rete e limiti di caduta */
export const RETE_V = 230;
export const CADUTA_MAX_PERCENTO = 4;
