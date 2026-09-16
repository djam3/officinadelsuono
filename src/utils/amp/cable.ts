/**
 * Cavo di potenza verso i diffusori.
 *
 * Il cavo non è un accessorio: è una resistenza messa in serie fra
 * l'amplificatore e il cono, e fa tre danni diversi che conviene tenere
 * separati perché hanno rimedi diversi.
 *
 * 1. PERDE POTENZA. È un partitore: la frazione che arriva al diffusore vale
 *    Z/(Z + R_cavo). Sono decibel persi, e si recuperano alzando il volume.
 *
 * 2. ROVINA LO SMORZAMENTO. Questo non si recupera alzando niente. La
 *    resistenza in serie si somma a quella della bobina e cambia il Qes del
 *    driver — cioè cambia l'allineamento della cassa, che era stato calcolato
 *    per un altro valore:
 *
 *      Qes' = Qes · (Re + Rs) / Re
 *
 *    Ed è QUESTO il numero che conta, non il «fattore di smorzamento»
 *    dell'amplificatore: un DF di 1000 significa 8 mΩ di impedenza d'uscita,
 *    cioè meno di un metro di cavo da 2,5 mm². Oltre un certo punto il
 *    costruttore sta dichiarando una cifra che il primo metro di cavo
 *    cancella.
 *
 * 3. SI SCALDA. Poco, di solito: ma su tiratine lunghe e impedenze basse la
 *    dissipazione nel cavo diventa un numero reale.
 *
 * Tutto il modulo lavora sulla resistenza di ANDATA E RITORNO: la corrente fa
 * il giro completo, quindi la lunghezza elettrica è il doppio di quella che si
 * misura col metro.
 */

import { CONDUCTORS, SEZIONI, resistivity, type Conductor } from './constants';

export interface CableInput {
  /** lunghezza della tratta in metri (sola andata: il ritorno lo conta il modulo) */
  lengthM: number;
  /** sezione del singolo conduttore, mm² */
  sectionMm2: number;
  material?: Conductor;
  /** impedenza del carico: si usa il MINIMO della curva, non il nominale */
  loadOhm: number;
  /** temperatura del conduttore in esercizio */
  tempC?: number;
  /** potenza applicata, per la dissipazione nel cavo */
  powerW?: number;
  /** impedenza d'uscita dell'amplificatore, se nota (Ω) */
  ampOutputOhm?: number;
}

export interface CableResult {
  /** resistenza di andata e ritorno (Ω) */
  loopOhm: number;
  /** frazione di potenza che arriva al diffusore */
  fraction: number;
  /** perdita in banda (dB) */
  lossDb: number;
  /** percentuale di potenza persa nel cavo */
  lostPercent: number;
  /** watt dissipati nel cavo alla potenza data */
  dissipatedW: number;
  /** fattore di smorzamento visto dal diffusore, cavo incluso */
  dampingFactor: number;
  /** fattore di smorzamento che l'amplificatore dichiarerebbe da solo */
  dampingFactorAmp: number | null;
  /** caduta di tensione sul cavo alla potenza data (%) */
  dropPercent: number;
}

/** Resistenza di andata e ritorno di una tratta. */
export function loopResistance(
  lengthM: number, sectionMm2: number, material: Conductor = 'rame', tempC = 20,
): number {
  if (!(lengthM > 0) || !(sectionMm2 > 0)) return 0;
  return (2 * resistivity(material, tempC) * lengthM) / sectionMm2;
}

export function computeCable(input: CableInput): CableResult {
  const { lengthM, sectionMm2, loadOhm } = input;
  const material = input.material ?? 'rame';
  const tempC = input.tempC ?? 20;
  const powerW = input.powerW ?? 0;

  const loop = loopResistance(lengthM, sectionMm2, material, tempC);
  const z = Math.max(loadOhm, 0.1);
  // partitore resistivo: è una frazione di TENSIONE, e la potenza va col quadrato
  const vFraction = z / (z + loop);
  const fraction = vFraction * vFraction;
  const rOut = input.ampOutputOhm ?? 0;

  return {
    loopOhm: loop,
    fraction,
    lossDb: 20 * Math.log10(vFraction),
    lostPercent: (1 - fraction) * 100,
    // la corrente è comune a cavo e carico: la potenza si divide come le resistenze
    dissipatedW: powerW > 0 ? (powerW * loop) / (loop + z) : 0,
    dampingFactor: z / Math.max(loop + rOut, 1e-9),
    dampingFactorAmp: rOut > 0 ? z / rOut : null,
    dropPercent: (1 - vFraction) * 100,
  };
}

/**
 * Sezione minima per restare entro una perdita data.
 *
 * Il criterio classico è che la resistenza del cavo non superi il 5%
 * dell'impedenza del carico: sono 0,42 dB persi, e soprattutto un Qes che
 * cresce del 5% invece che del 20. Si inverte direttamente:
 *
 *   R_loop ≤ k·Z   →   A ≥ 2·ρ·L / (k·Z)
 */
export function minSection(
  lengthM: number, loadOhm: number, maxRatio = 0.05,
  material: Conductor = 'rame', tempC = 20,
): { exactMm2: number; commercialMm2: number | null } {
  const exact = (2 * resistivity(material, tempC) * lengthM) / (maxRatio * Math.max(loadOhm, 0.1));
  return {
    exactMm2: exact,
    commercialMm2: SEZIONI.find(s => s >= exact - 1e-9) ?? null,
  };
}

/**
 * Come il cavo sposta il Qes — e con lui l'allineamento della cassa.
 *
 * Qualunque resistenza in serie al driver (cavo, induttanza del crossover,
 * impedenza d'uscita dell'amplificatore) riduce lo smorzamento elettrico
 * esattamente in proporzione:
 *
 *   Qes' = Qes · (Re + Rs) / Re        Qts' = Qms·Qes' / (Qms + Qes')
 *
 * Non è un effetto sottile e non è questione di gusti: una cassa calcolata per
 * Qts 0,35 e pilotata attraverso mezzo ohm di cavo si comporta come se il
 * driver ne avesse un altro, e la risposta che esce non è quella disegnata.
 */
export function shiftedQ(
  qes: number, qms: number, reOhm: number, seriesOhm: number,
): { qes: number; qts: number; qtsOriginale: number; deltaPercent: number } {
  const qts0 = (qms * qes) / (qms + qes);
  if (!(reOhm > 0)) return { qes, qts: qts0, qtsOriginale: qts0, deltaPercent: 0 };
  const qesNew = (qes * (reOhm + seriesOhm)) / reOhm;
  const qtsNew = (qms * qesNew) / (qms + qesNew);
  return {
    qes: qesNew,
    qts: qtsNew,
    qtsOriginale: qts0,
    deltaPercent: (qtsNew / qts0 - 1) * 100,
  };
}
