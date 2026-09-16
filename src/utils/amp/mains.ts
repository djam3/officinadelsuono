/**
 * Alimentazione: corrente assorbita, cavo di rete, calore.
 *
 * È la domanda che si fa per prima — «per un amplificatore da 1000 W che cavo
 * ci vuole?» — e la risposta onesta è che dipende da tre cose che nessuno
 * dichiara insieme.
 *
 * 1. I 1000 W sono quelli che ESCONO, non quelli che entrano. Quanto entra
 *    dipende dal rendimento: un classe D ne chiede 1100, un classe AB anche
 *    1800. La differenza va tutta in calore.
 *
 * 2. La musica non è una sinusoide. Un amplificatore da 1000 W che suona
 *    musica ne assorbe in media molto meno, perché il segnale sta al massimo
 *    per una frazione del tempo. La prassi dei costruttori è dichiarare
 *    l'assorbimento a 1/8 della potenza per il programma normale e a 1/3 per
 *    il caso pesante: sono i due numeri che servono, uno per il cavo e uno per
 *    il dimensionamento termico.
 *
 * 3. La corrente non è i watt diviso 230. Un alimentatore a trasformatore e
 *    condensatori assorbe corrente a impulsi stretti attorno al picco della
 *    sinusoide di rete: il fattore di potenza sta attorno a 0,5–0,6, quindi
 *    la corrente vera è quasi il doppio di quella che verrebbe dal conto
 *    ingenuo. È il motivo per cui un finale da 1000 W fa scattare un
 *    magnetotermico che «sulla carta» sarebbe abbondante.
 */

import { RETE_V, CADUTA_MAX_PERCENTO, SEZIONI, resistivity, type Conductor } from './constants';

export type AmpClass = 'ab' | 'h' | 'd';

export const AMP_CLASSES: Record<AmpClass, {
  label: string; efficiency: number; pf: number; note: string;
}> = {
  ab: {
    label: 'Classe AB (trasformatore)',
    efficiency: 0.55,
    pf: 0.55,
    note: 'Il massimo teorico su sinusoide piena è 78,5%, ma ai livelli di ascolto reali il rendimento crolla: quello che non esce dai morsetti esce dal dissipatore.',
  },
  h: {
    label: 'Classe H / G (rail commutate)',
    efficiency: 0.72,
    pf: 0.6,
    note: 'Alimentazione a più tensioni che seguono il segnale: rende meglio della AB senza cambiare il suono dello stadio finale.',
  },
  d: {
    label: 'Classe D (commutazione)',
    efficiency: 0.88,
    pf: 0.95,
    note: 'Rendimento alto e, se l’alimentatore ha il PFC, fattore di potenza quasi unitario: assorbe molta meno corrente a parità di watt.',
  },
};

/** frazione della potenza continua usata davvero, per convenzione */
export type DutyKind = 'ottavo' | 'terzo' | 'piena';

export const DUTY: Record<DutyKind, { fraction: number; label: string; note: string }> = {
  ottavo: { fraction: 1 / 8, label: '1/8 della potenza', note: 'Programma musicale normale, senza clip: è la convenzione con cui i costruttori dichiarano l’assorbimento.' },
  terzo: { fraction: 1 / 3, label: '1/3 della potenza', note: 'Programma pesante e compresso, o rumore rosa: è il caso su cui si dimensionano cavo e protezione.' },
  piena: { fraction: 1, label: 'Potenza piena continua', note: 'Sinusoide al limite: non succede con la musica, ma è il caso peggiore per il calore.' },
};

export interface MainsInput {
  /** potenza continua totale che l'amplificatore eroga su tutti i canali (W) */
  outputPowerW: number;
  ampClass: AmpClass;
  duty: DutyKind;
  /** lunghezza della linea di alimentazione, sola andata (m) */
  cableLengthM: number;
  cableSectionMm2: number;
  material?: Conductor;
  lineV?: number;
  /** rendimento e fattore di potenza dichiarati, se noti: hanno la precedenza */
  efficiency?: number;
  powerFactor?: number;
  /** quanti apparecchi uguali sulla stessa linea */
  units?: number;
}

export interface MainsResult {
  /** watt che entrano davvero, alla frazione di potenza scelta */
  inputW: number;
  /** volt-ampere: è questo che vede la presa, non i watt */
  apparentVA: number;
  /** corrente efficace assorbita (A) */
  currentA: number;
  /** corrente al caso peggiore, potenza piena continua (A) */
  currentFullA: number;
  /** calore dissipato dall'apparecchio (W) */
  heatW: number;
  /** caduta di tensione sulla linea */
  dropV: number;
  dropPercent: number;
  /** potenza persa nel cavo di rete (W) */
  cableLossW: number;
  /** sezione minima per restare entro il limite di caduta */
  minSectionMm2: number;
  minSectionCommercial: number | null;
  /** corrente di progetto su cui si dimensionano cavo e protezione (A) */
  designCurrentA: number;
  /** taglia di magnetotermico coerente con l'assorbimento */
  breakerA: number;
  /** portata che il cavo deve avere per stare dietro alla protezione (A) */
  requiredAmpacityA: number;
  /** spunto all'accensione: quante volte la corrente nominale */
  inrushA: [number, number];
  warnings: string[];
}

/** taglie commerciali dei magnetotermici */
const TAGLIE_MT = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63];

export function computeMains(input: MainsInput): MainsResult {
  const spec = AMP_CLASSES[input.ampClass] ?? AMP_CLASSES.d;
  const eff = input.efficiency ?? spec.efficiency;
  const pf = input.powerFactor ?? spec.pf;
  const v = input.lineV ?? RETE_V;
  const units = Math.max(1, Math.round(input.units ?? 1));
  const duty = DUTY[input.duty] ?? DUTY.ottavo;
  const material = input.material ?? 'rame';
  const warnings: string[] = [];

  const outTotal = input.outputPowerW * units;
  const outUsed = outTotal * duty.fraction;

  // quello che entra è quello che esce diviso il rendimento
  const inputW = outUsed / Math.max(eff, 0.05);
  const inputFullW = outTotal / Math.max(eff, 0.05);
  // ...ma la presa vede i VOLT-AMPERE, e con un fattore di potenza basso sono
  // molti di più dei watt
  const apparentVA = inputW / Math.max(pf, 0.05);
  const currentA = apparentVA / v;
  const currentFullA = inputFullW / Math.max(pf, 0.05) / v;

  const heatW = inputW - outUsed;

  // caduta sulla linea: andata e ritorno, come per il cavo di potenza
  const rLoop = input.cableSectionMm2 > 0
    ? (2 * resistivity(material, 30) * input.cableLengthM) / input.cableSectionMm2
    : 0;
  // La caduta si guarda alla corrente di PROGETTO: il momento in cui la
  // tensione serve è proprio quello in cui l'amplificatore sta tirando.
  const dropV = rLoop * currentFullA;
  const dropPercent = (dropV / v) * 100;
  const cableLossW = rLoop * currentFullA * currentFullA;

  // sezione minima invertendo il limite di caduta
  const minSection = (2 * resistivity(material, 30) * input.cableLengthM * currentFullA)
    / ((CADUTA_MAX_PERCENTO / 100) * v);

  // Coordinazione fra carico, protezione e cavo: Ib ≤ In ≤ Iz.
  //
  // La corrente di progetto NON è quella che l'apparecchio assorbe con la
  // musica, ma quella che può assorbire al massimo in continuo: il cavo deve
  // reggere il caso peggiore, non la media. E la portata del cavo deve stare
  // dietro alla protezione, non al carico — altrimenti esiste una corrente
  // che scalda il cavo senza far scattare niente.
  const designCurrentA = currentFullA;
  const breakerA = TAGLIE_MT.find(t => t >= designCurrentA) ?? 63;

  // ── avvisi ──
  if (dropPercent > CADUTA_MAX_PERCENTO) {
    warnings.push(
      `La caduta sulla linea è ${dropPercent.toFixed(1)}%, oltre il ${CADUTA_MAX_PERCENTO}% ammesso: ` +
      `servono almeno ${minSection.toFixed(2)} mm². Su un amplificatore la caduta non è solo uno spreco — ` +
      'la tensione di alimentazione scende proprio sui picchi, cioè quando serve, e la potenza disponibile ' +
      'cala con il quadrato.',
    );
  }
  if (pf < 0.7) {
    warnings.push(
      `Con fattore di potenza ${pf.toFixed(2)} l'apparecchio assorbe ${apparentVA.toFixed(0)} VA per ` +
      `${inputW.toFixed(0)} W: la corrente è ${(1 / pf).toFixed(2)} volte quella del conto ingenuo watt/volt. ` +
      'È il motivo per cui un finale fa scattare una protezione che sulla carta era abbondante.',
    );
  }
  const inrushLow = input.ampClass === 'd' ? currentFullA * 5 : currentFullA * 10;
  if (inrushLow > breakerA * 3) {
    warnings.push(
      `All'accensione lo spunto parte da ${inrushLow.toFixed(0)} A, contro i ${breakerA} A della protezione: ` +
      'un magnetotermico curva B scatta, perché interviene già a 3–5 volte la nominale. Serve una curva C ' +
      'o D, oppure un avviamento dolce nell’apparecchio — che è la soluzione giusta, perché non chiede di ' +
      'alzare la protezione.',
    );
  }
  if (units > 1) {
    warnings.push(
      `${units} apparecchi sulla stessa linea: le correnti si sommano, ma non gli spunti — accendili ` +
      'uno alla volta, o con un sequenziatore.',
    );
  }

  return {
    inputW,
    apparentVA,
    currentA,
    currentFullA,
    heatW,
    dropV,
    dropPercent,
    cableLossW,
    minSectionMm2: minSection,
    minSectionCommercial: SEZIONI.find(s => s >= minSection - 1e-9) ?? null,
    designCurrentA,
    breakerA,
    requiredAmpacityA: breakerA,
    // trasformatore toroidale: lo spunto arriva a decine di volte la nominale
    // per pochi cicli di rete, ed è quello che fa scattare i magnetotermici
    // curva B. Su classe D con alimentatore a commutazione è più contenuto.
    inrushA: input.ampClass === 'd'
      ? [inrushLow, currentFullA * 20]
      : [inrushLow, currentFullA * 60],
    warnings,
  };
}

/**
 * Portata dei cavi flessibili — valori INDICATIVI.
 *
 * Questa tabella serve a capire l'ordine di grandezza, non a firmare un
 * impianto. La portata vera dipende dal tipo di posa, dalla temperatura
 * ambiente, da quanti cavi stanno nello stesso condotto e dal tipo di isolante,
 * e i valori vincolanti stanno nella norma di installazione (CEI 64-8, che
 * recepisce la IEC 60364-5-52). Qui sono riportati i valori d'uso per cavo
 * flessibile in aria libera a 30 °C, due conduttori in carico — quelli a cui
 * corrispondono le spine da 10 e 16 A.
 */
export const PORTATA_FLESSIBILI: { mm2: number; a: number }[] = [
  { mm2: 0.5, a: 3 },
  { mm2: 0.75, a: 6 },
  { mm2: 1.0, a: 10 },
  { mm2: 1.5, a: 16 },
  { mm2: 2.5, a: 25 },
  { mm2: 4, a: 32 },
  { mm2: 6, a: 40 },
  { mm2: 10, a: 63 },
];

/**
 * La sezione che soddisfa insieme portata e caduta di tensione.
 *
 * La portata va confrontata con la corrente della PROTEZIONE, non con quella
 * del carico: la regola di coordinamento è Ib ≤ In ≤ Iz. Un cavo che regge il
 * carico ma non la taglia del magnetotermico lascia scoperta tutta la fascia
 * di corrente fra i due — corrente che scalda il cavo senza far scattare
 * niente, ed è esattamente il modo in cui prendono fuoco le prolunghe.
 */
export function sezioneRete(
  currentA: number, minSectionForDropMm2: number,
): { perPortata: number | null; perCaduta: number | null; scelta: number | null; comanda: 'portata' | 'caduta' | null } {
  const perPortata = PORTATA_FLESSIBILI.find(p => p.a >= currentA)?.mm2 ?? null;
  const perCaduta = SEZIONI.find(s => s >= minSectionForDropMm2 - 1e-9) ?? null;
  if (perPortata === null || perCaduta === null) {
    return { perPortata, perCaduta, scelta: null, comanda: null };
  }
  const scelta = Math.max(perPortata, perCaduta);
  return {
    perPortata, perCaduta, scelta,
    comanda: perCaduta > perPortata ? 'caduta' : 'portata',
  };
}
