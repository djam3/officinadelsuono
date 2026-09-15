/**
 * Effetto pannello (baffle step) e rete Zobel.
 *
 * Due cose che il calcolatore non sapeva fare e che decidono il suono tanto
 * quanto il volume della cassa.
 *
 * BAFFLE STEP. Alle frequenze alte, quando la lunghezza d'onda è piccola
 * rispetto al pannello frontale, l'altoparlante irradia in mezzo spazio (2π):
 * il pannello gli fa da schermo e tutta l'energia va avanti. Alle frequenze
 * basse, quando la lunghezza d'onda è molto più grande del pannello, il suono
 * gli gira attorno e si irradia in tutto lo spazio (4π). La stessa potenza
 * distribuita sul doppio dell'angolo solido fa **6 dB** in meno.
 *
 * Non è un difetto della cassa: è geometria. E non si sente in anecoica soltanto
 * — è il motivo per cui un diffusore misurato piatto sull'asse suona magro se lo
 * si stacca dalle pareti.
 *
 * ZOBEL. La bobina non è una resistenza pura: è Re in serie a Le, quindi
 * l'impedenza sale con la frequenza. Un filtro passivo progettato su un carico
 * costante si trova davanti un carico che non lo è, e la frequenza di incrocio
 * si sposta. La rete Zobel è una R-C in parallelo al driver che riporta il
 * modulo a Re.
 *
 * La condizione è esatta e si ricava imponendo Im(Y_driver + Y_zobel) = 0:
 *
 *   Y_d = 1/(Re + jωLe)          Im = −ωLe/(Re² + ω²Le²)
 *   Y_z = 1/(Rz − j/(ωCz))       Im = +ωCz/(1 + ω²Cz²Rz²)
 *
 * Uguagliando e separando i termini costanti da quelli in ω²:
 *
 *   Le = Cz·Re²   →   Cz = Le/Re²
 *   Cz·Rz² = Le   →   Rz = Re
 *
 * e con quei due valori l'impedenza risultante vale Re a OGNI frequenza, non
 * solo attorno a un punto: sostituendo, Re(Y_d) + Re(Y_z) = 1/Re esatto.
 */

import { speedOfSound } from './constants';

export interface BaffleStepResult {
  /** centro del gradino: −3 dB rispetto al livello di mezzo spazio (Hz) */
  f3Hz: number;
  /** perdita in gamma bassa rispetto al livello sopra il gradino (dB) */
  lossDb: number;
  /** estremi pratici della transizione: sotto è tutta persa, sopra è tutta recuperata */
  fStartHz: number;
  fEndHz: number;
  /** larghezza d'onda al centro, in larghezze di pannello */
  lambdaOverWidth: number;
}

/**
 * Centro del gradino da larghezza del pannello.
 *
 * La relazione empirica classica è f = 115/W con W in metri (equivalente ai
 * 4560/W in pollici della letteratura anglosassone). Letta in lunghezze d'onda
 * dice una cosa sola: il passaggio avviene dove λ vale circa TRE volte la
 * larghezza del pannello, non una — il suono comincia a girare attorno al
 * pannello molto prima che la lunghezza d'onda lo eguagli.
 *
 * La forma esatta della curva dipende dalla sagoma del pannello e da dove ci
 * sta sopra il driver (Olson, 1951): un driver centrato concentra la
 * diffrazione dei bordi in un'unica ondulazione di circa 1 dB sopra il
 * gradino, uno spostato la spalma su più frequenze e la attenua.
 */
export function baffleStep(widthMm: number, tempC = 20): BaffleStepResult {
  const w = Math.max(widthMm, 1) / 1000; // m
  const f3 = 115 / w;
  const c = speedOfSound(tempC);
  return {
    f3Hz: f3,
    lossDb: 6.02,
    // la transizione si consuma su circa tre ottave attorno al centro
    fStartHz: f3 / 3,
    fEndHz: f3 * 3,
    lambdaOverWidth: c / f3 / w,
  };
}

export interface ZobelResult {
  /** resistenza della rete (Ω) — vale Re */
  rOhm: number;
  /** capacità della rete (µF) */
  cUf: number;
  /** frequenza a cui la reattanza della bobina eguaglia Re: lì |Z| = Re·√2 */
  fRiseHz: number;
  /** |Z| del driver nudo a 10 kHz, per far vedere cosa si sta correggendo */
  zAt10kOhm: number;
}

/** Rete Zobel: R = Re, C = Le/Re². Vedi la derivazione in testa al file. */
export function zobelNetwork(reOhm: number, leMh: number): ZobelResult | null {
  if (!(reOhm > 0) || !(leMh > 0)) return null;
  const le = leMh / 1000; // H
  const cF = le / (reOhm * reOhm);
  return {
    rOhm: reOhm,
    cUf: cF * 1e6,
    fRiseHz: reOhm / (2 * Math.PI * le),
    zAt10kOhm: Math.hypot(reOhm, 2 * Math.PI * 10000 * le),
  };
}
