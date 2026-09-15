/**
 * Pannello aperto (dipolo): flat, U-frame, H-frame.
 *
 * È l'unica carica in cui NON c'è un volume da calcolare, e quindi l'unica in
 * cui tutto il progetto sta in due numeri: il percorso che il suono deve fare
 * per girare dal retro al fronte, e la profondità della cavità che quel
 * percorso si porta dietro.
 *
 * ── PERCORSO EFFICACE ────────────────────────────────────────────────────────
 *
 * Fronte e retro del cono sono due sorgenti in opposizione di fase. Sull'asse,
 * in campo lontano, il rapporto fra un dipolo e lo STESSO driver su pannello
 * infinito vale esattamente
 *
 *   |p_dipolo / p_infinito| = |sin(k·D/2)|
 *
 * che si ricava sommando due monopoli opposti a ±D/2: il termine di mezzo
 * spazio 1/(2πr) e quello di spazio intero 1/(4πr) si semplificano e resta il
 * seno. Il primo massimo è a k·D = π, cioè **D = λ/2**, e lì il dipolo vale
 * quanto il pannello infinito — non meno. Sotto, sin ≈ kD/2 e si perdono
 * **6 dB/ottava**.
 *
 * Il percorso D dipende da come si piega il pannello:
 *
 *   flat     D = W              il retro esce dai bordi
 *   U-frame  D = W + Dp         la bocca posteriore arretra di tutta la profondità
 *   H-frame  D = W + Dp         le due bocche stanno a ±Dp/2: la distanza è ancora Dp
 *
 * U e H con la STESSA profondità danno lo stesso percorso. Non è una svista: la
 * differenza fra i due non è nel dipolo, è nella cavità.
 *
 * ── RISONANZA DI CAVITÀ ──────────────────────────────────────────────────────
 *
 * Le alette formano un condotto chiuso dal cono e aperto alla bocca: un
 * risonatore a quarto d'onda. Lì il pannello aperto smette di essere un dipolo
 * e diventa una canna d'organo, con una gobba stretta e un buco subito sopra.
 *
 *   U-frame  una sola cavità, lunga Dp         f = c/(4·Dp)
 *   H-frame  DUE cavità, lunghe Dp/2 ciascuna  f = c/(2·Dp)
 *
 * **Esattamente un'ottava di differenza**, a parità di ingombro e di percorso.
 * È tutto il vantaggio dell'H-frame, ed è il motivo per cui i woofer dipolari
 * si fanno così.
 *
 * ── ESCURSIONE ───────────────────────────────────────────────────────────────
 *
 * Per tenere il livello mentre il dipolo perde 6 dB/ottava bisogna compensare,
 * e la compensazione la paga il cono. A livello costante l'escursione va già
 * come 1/f² (12 dB/ott); diviso il fattore del dipolo diventa **1/f³, cioè
 * 18 dB/ottava**. Un pannello aperto non si progetta sul volume: si progetta
 * sul volume d'aria spostabile.
 */

import { speedOfSound } from './constants';
import { computeResponse } from './response';
import { estimatedWeight, totalPanelArea } from './geometry';
import { subsonicFilter, type SubsonicResult } from './performance';
import type { BoxDimensions, CurvePoint, CutPanel, ResponseCurves, TSParams } from './types';

export type DipoleFrame = 'flat' | 'u-frame' | 'h-frame';

export const DIPOLE_FRAMES: Record<DipoleFrame, { label: string; description: string }> = {
  flat: {
    label: 'Pannello piatto',
    description: 'Una tavola e basta. Nessuna cavità e nessuna risonanza, ma per scendere serve larghezza vera.',
  },
  'u-frame': {
    label: 'U-frame (alette all’indietro)',
    description: 'Il percorso si allunga ripiegandolo all’indietro. La cavità risuona a quarto d’onda sulla profondità intera.',
  },
  'h-frame': {
    label: 'H-frame (alette avanti e dietro)',
    description: 'Stesso percorso dell’U a parità di profondità, ma le cavità sono due e lunghe la metà: la risonanza sale di un’ottava.',
  },
};

export interface OpenBaffleInput {
  ts: TSParams;
  frame: DipoleFrame;
  /** larghezza del pannello (mm) */
  widthMm: number;
  /** altezza del pannello (mm) */
  heightMm: number;
  /** profondità delle alette (mm) — ignorata dal pannello piatto */
  wingDepthMm?: number;
  wallThicknessMm: number;
  powerW: number;
  tempC?: number;
  fMin?: number;
  fMax?: number;
}

export interface OpenBaffleResult {
  /** percorso acustico efficace fronte-retro (mm) */
  dEffMm: number;
  /** primo massimo del dipolo (Hz) */
  fPeakHz: number;
  /** risonanza di cavità a quarto d'onda (Hz) — null sul pannello piatto */
  fPipeHz: number | null;
  /** −3 dB del sistema, misurata sulla curva risultante */
  f3Hz: number;
  /** perdita del dipolo rispetto a mezzo spazio, alla F3 */
  dipoleLossAtF3Db: number;
  /** passa-alto che la correzione impone (Hz; 0 = non serve) */
  eqHighPassHz: number;
  /** limite di escursione e taglio, con lo stesso conto usato per le reflex */
  subsonic: SubsonicResult | null;
  curves: ResponseCurves;
  /** correzione da applicare per raddrizzare la risposta (dB) */
  eqBoostDb: CurvePoint[];
  /** escursione DOPO la correzione: è questa che vincola il progetto */
  excursionEq: CurvePoint[];
  dimensions: BoxDimensions;
  panels: CutPanel[];
  panelAreaM2: number;
  weightKg: number;
  warnings: string[];
}

/**
 * Percorso efficace fronte-retro secondo la piega scelta.
 *
 * Conta la dimensione PIU' PICCOLA del pannello, non la larghezza: il suono
 * prende la via piu' corta per girare dall'altra parte, e se il pannello e' piu'
 * largo che alto scavalca dal sopra e dal sotto. Fare il pannello piu' alto che
 * largo non serve a scendere: serve solo a spalmare le ondulazioni di
 * diffrazione su piu' frequenze invece di concentrarle in una.
 */
export function effectivePath(
  frame: DipoleFrame, widthMm: number, heightMm: number, wingDepthMm: number,
): number {
  const corto = Math.max(Math.min(widthMm, heightMm), 1);
  const d = Math.max(wingDepthMm, 0);
  return frame === 'flat' ? corto : corto + d;
}

/** Risonanza a quarto d'onda della cavità (Hz); null se la cavità non c'è. */
export function cavityResonance(frame: DipoleFrame, wingDepthMm: number, tempC = 20): number | null {
  if (frame === 'flat' || !(wingDepthMm > 0)) return null;
  const c = speedOfSound(tempC);
  const dp = wingDepthMm / 1000;
  // U: una cavità lunga Dp. H: due cavità lunghe Dp/2, quindi un'ottava sopra.
  return frame === 'u-frame' ? c / (4 * dp) : c / (2 * dp);
}

/** Percorso che porta il primo massimo del dipolo a una frequenza data (mm). */
export function pathForPeakHz(fHz: number, tempC = 20): number {
  return (speedOfSound(tempC) / (2 * Math.max(fHz, 1))) * 1000;
}

/** Lista di taglio: niente coperchi sul lato che deve restare aperto. */
function dipolePanels(frame: DipoleFrame, dims: BoxDimensions): CutPanel[] {
  const { width: w, height: h, wallThickness: t } = dims;
  const dp = dims.depth;

  if (frame === 'flat') {
    return [
      {
        name: 'Pannello (baffle)', width: w, height: h, thickness: t, quantity: 1,
        note: 'Doppio spessore o telaio di rinforzo sul perimetro: un pannello nudo di questa misura vibra come una piastra, e non ha una cassa che lo irrigidisca.',
      },
      {
        name: 'Base / supporto', width: Math.min(w, 400), height: 300, thickness: t, quantity: 1,
        note: 'Il pannello deve stare in piedi da solo e lontano dalla parete di fondo.',
      },
    ];
  }

  const inner = w - 2 * t;
  const alette = frame === 'u-frame'
    ? `Profondità ${dp} mm, tutta all'indietro rispetto al piano del driver.`
    : `Profondità ${dp} mm, metà in avanti e metà all'indietro rispetto al piano del driver: è questo che dimezza la cavità.`;

  return [
    {
      name: frame === 'h-frame' ? 'Pannello driver (centrale)' : 'Frontale (baffle)',
      width: w, height: h, thickness: t, quantity: 1,
      note: frame === 'h-frame'
        ? 'Va montato a metà profondità, non a filo: le due cavità devono risultare uguali, altrimenti risuonano a due frequenze diverse.'
        : 'A filo del bordo anteriore delle alette.',
    },
    { name: 'Aletta laterale', width: dp, height: h, thickness: t, quantity: 2, note: alette },
    { name: 'Aletta superiore', width: inner, height: dp, thickness: t, quantity: 1 },
    { name: 'Aletta inferiore', width: inner, height: dp, thickness: t, quantity: 1 },
  ];
}

export function computeOpenBaffle(input: OpenBaffleInput): OpenBaffleResult {
  const { ts, frame, widthMm, heightMm, wallThicknessMm: t, powerW, tempC = 20 } = input;
  const wing = frame === 'flat' ? 0 : Math.max(input.wingDepthMm ?? 0, 0);
  const warnings: string[] = [];

  const dEff = effectivePath(frame, widthMm, heightMm, wing);
  const c = speedOfSound(tempC);
  const fPeak = c / (2 * (dEff / 1000));
  const fPipe = cavityResonance(frame, wing, tempC);

  // Il driver senza cassa: nessuna molla d'aria, quindi la risonanza di sistema
  // resta Fs e il Q resta Qts. È esattamente il caso "chiuso" con alpha = 0, e
  // conviene riusarlo invece di riscrivere un secondo motore di risposta.
  const base = computeResponse({
    ts, type: 'sealed', fc: ts.fs, qtc: ts.qts,
    powerW, fMin: input.fMin ?? 10, fMax: input.fMax ?? 20000,
    sensitivity: ts.sensitivity,
  });

  // Fattore del dipolo, rapporto esatto verso lo stesso driver su pannello
  // infinito. Sopra il primo massimo la formula continuerebbe a oscillare, ma
  // lì comandano diffrazione e cavità: si tiene 1 e lo si dice.
  const rel = (f: number) => Math.abs(Math.sin((Math.PI / 2) * Math.min(f / fPeak, 1)));
  const lossDb = (f: number) => 20 * Math.log10(Math.max(rel(f), 1e-6));

  const spl = base.spl.map(p => ({ f: p.f, v: p.v + lossDb(p.f) }));
  // livello di riferimento: la zona piatta attorno al primo massimo
  const flat = spl.filter(p => p.f >= fPeak * 0.9 && p.f <= fPeak * 2.5);
  const ref = flat.length
    ? flat.reduce((a, p) => a + p.v, 0) / flat.length
    : Math.max(...spl.map(p => p.v));
  const norm = spl.map(p => ({ f: p.f, v: p.v - ref }));

  // F3 misurata sulla curva vera, come per tutte le altre casse: si sale dal
  // basso e si prende il primo attraversamento dei −3 dB
  let f3 = norm[0].f;
  for (let i = 1; i < norm.length; i++) {
    const a = norm[i - 1], b = norm[i];
    if (a.v <= -3 && b.v > -3) {
      f3 = a.f + ((-3 - a.v) / (b.v - a.v)) * (b.f - a.f);
      break;
    }
  }

  // Correzione per raddrizzare la risposta.
  //
  // Nessuno la applica fino a zero hertz, e non per prudenza: sotto il punto in
  // cui il cono è già al suo massimo, alzare il livello non produce più suono,
  // produce solo corsa. La correzione va quindi SEMPRE accompagnata da un
  // passa-alto.
  //
  // Il taglio si sceglie con lo STESSO criterio usato per il subsonico di una
  // reflex: riportare la salita sotto banda al livello del picco che il cono fa
  // già dentro la banda. Legarlo invece a Xmax e alla potenza sarebbe un
  // errore — a potenza troppo alta il taglio finirebbe sopra la F3, cioè il
  // programma proporrebbe di buttare via la banda invece di abbassare il volume.
  // Filtro e potenza sono due limiti diversi e vanno detti separatamente.
  const EQ_MAX_DB = 30;
  const boostRaw = norm.map(p => Math.min(Math.max(-p.v, 0), EQ_MAX_DB));
  const excursionRaw = base.excursion.map((p, i) => ({
    f: p.f, v: p.v * Math.pow(10, boostRaw[i] / 20),
  }));

  const sub = subsonicFilter(excursionRaw, f3, ts.xmax ?? 0, powerW);
  const fHp = sub?.hpfHz ?? 0;
  const hp4 = (fc: number, f: number) => 1 / Math.sqrt(1 + Math.pow(fc / f, 8));

  const eqBoostDb = norm.map((p, i) => ({
    f: p.f,
    v: boostRaw[i] + (fHp ? 20 * Math.log10(hp4(fHp, p.f)) : 0),
  }));
  const excursionEq = excursionRaw.map(p => ({
    f: p.f, v: fHp ? p.v * hp4(fHp, p.f) : p.v,
  }));

  // Il dipolo aggiunge 90° costanti — il fattore è j·2sin(kD/2) — e nessun
  // ritardo di gruppo: sotto il primo massimo sin() è reale e positivo.
  const curves: ResponseCurves = {
    spl: norm,
    excursion: base.excursion,
    impedance: base.impedance,
    phase: base.phase.map(p => ({ f: p.f, v: p.v + 90 })),
    groupDelay: base.groupDelay,
  };

  // ── geometria ──
  const dims: BoxDimensions = {
    shape: 'rectangular',
    width: Math.round(widthMm),
    height: Math.round(heightMm),
    depth: Math.round(frame === 'flat' ? t : wing),
    wallThickness: t,
  };
  const panels = dipolePanels(frame, dims);

  // ── avvisi ──
  warnings.push(
    `Percorso efficace ${(dEff / 10).toFixed(1)} cm: primo massimo del dipolo a ${fPeak.toFixed(0)} Hz. ` +
    'Sotto si perdono 6 dB per ottava — è cortocircuito acustico, non un difetto del driver.',
  );
  if (heightMm < widthMm) {
    warnings.push(
      `Il pannello è più largo (${(widthMm / 10).toFixed(0)} cm) che alto (${(heightMm / 10).toFixed(0)} cm): ` +
      'il suono gira dal sopra e dal sotto, che è la via più corta: a comandare il percorso è ' +
      'l’altezza, e allargare ancora non serve a niente finché l’altezza non cresce.',
    );
  }
  if (fPipe) {
    warnings.push(
      `Le alette profonde ${(wing / 10).toFixed(1)} cm formano una cavità che risuona a ${fPipe.toFixed(0)} Hz ` +
      `(quarto d'onda${frame === 'h-frame' ? ' su metà profondità: le cavità sono due' : ''}). ` +
      `Lì il pannello smette di comportarsi da dipolo: incrocia almeno un'ottava sotto, cioè entro ` +
      `${(fPipe / 2).toFixed(0)} Hz.`,
    );
    if (frame === 'u-frame') {
      warnings.push(
        `A parità di profondità un H-frame darebbe lo STESSO percorso (${(dEff / 10).toFixed(1)} cm) ma con la ` +
        `risonanza a ${(fPipe * 2).toFixed(0)} Hz invece di ${fPipe.toFixed(0)}: un'ottava di banda utile in più, ` +
        'allo stesso ingombro.',
      );
    }
  }
  if (sub && ts.xmax) {
    warnings.push(
      `Con la correzione inserita il cono arriva a ${sub.peakInBandMm.toFixed(1)} mm a ${sub.peakInBandHz.toFixed(0)} Hz `
      + `a ${powerW} W: a Xmax (${ts.xmax} mm) ci si arriva con ${sub.powerAtXmaxW.toFixed(0)} W. Sotto il massimo `
      + 'del dipolo l’escursione cresce di 18 dB/ottava, non 12 — il limite di un pannello aperto è sempre '
      + 'il volume d’aria spostabile, mai il volume della cassa.',
    );
    if (fHp) {
      warnings.push(
        `La correzione va accompagnata da un passa-alto a ${fHp.toFixed(0)} Hz (24 dB/ott): più in basso `
        + 'chiederebbe al cono una corsa che non produce suono, perché sotto quel punto il dipolo la annulla.',
      );
    }
  }


  warnings.push(
    'Il lobo posteriore è forte quanto quello anteriore: il pannello va tenuto lontano dalla parete di fondo, ' +
    'altrimenti la riflessione torna in controfase e scava un buco dove capita.',
  );

  return {
    dEffMm: dEff,
    fPeakHz: fPeak,
    fPipeHz: fPipe,
    f3Hz: f3,
    dipoleLossAtF3Db: lossDb(f3),
    eqHighPassHz: fHp,
    subsonic: sub,
    curves,
    eqBoostDb,
    excursionEq,
    dimensions: dims,
    panels,
    panelAreaM2: totalPanelArea(panels),
    weightKg: estimatedWeight(panels),
    warnings,
  };
}
