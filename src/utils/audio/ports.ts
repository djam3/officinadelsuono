/**
 * Condotti reflex — geometrie, accordo e verifiche costruttive.
 *
 * L'accordo di un risonatore di Helmholtz dipende dall'AREA del condotto e
 * dalla sua lunghezza EFFICACE, non dalla forma in sé:
 *
 *   Fb = (c / 2π) · √( Av / (Vb · Leff) )        Leff = Lv + k · Dv
 *
 * dove Dv è il diametro del cerchio di pari area. Quello che cambia da una
 * geometria all'altra è:
 *
 *  - come si calcola l'area (cerchio, rettangolo, triangolo, corona);
 *  - la correzione terminale k, che dipende da come terminano le due bocche
 *    (libere nella cassa, a filo del pannello, svasate, appoggiate a una parete);
 *  - la velocità dell'aria tollerata prima della turbolenza: un condotto a
 *    spigolo vivo soffia molto prima di uno svasato;
 *  - il volume che il condotto ruba alla cassa (e il legno che serve a farlo);
 *  - l'ingombro: un condotto dritto deve starci in profondità, uno ripiegato
 *    si sviluppa lungo le pareti.
 */

import { speedOfSound } from './constants';

export type PortType =
  | 'circular-free'
  | 'circular-flanged'
  | 'circular-double-flanged'
  | 'flared'
  | 'slot'
  | 'shelf'
  | 'corner-slot'
  | 'triangular'
  | 'l-folded'
  | 'u-folded';

export type PortSection = 'circular' | 'rectangular' | 'triangular';

export interface PortTypeSpec {
  label: string;
  description: string;
  section: PortSection;
  /** correzione terminale, in diametri equivalenti */
  endCorrection: number;
  /** velocità dell'aria oltre la quale il condotto inizia a soffiare (m/s) */
  maxVelocity: number;
  /** pieghe a 90° nel percorso */
  bends: number;
  /** pareti della cassa riutilizzate come lato del condotto */
  sharedWalls: number;
  /** true se il condotto si sviluppa lungo le pareti invece che in profondità */
  folded: boolean;
}

export const PORT_TYPES: Record<PortType, PortTypeSpec> = {
  'circular-free': {
    label: 'Tubo circolare — estremità libere',
    description: 'Tubo interamente dentro la cassa, lontano dalle pareti. La correzione terminale è la più bassa, quindi a parità di accordo il condotto è più lungo.',
    section: 'circular', endCorrection: 0.614, maxVelocity: 17, bends: 0, sharedWalls: 0, folded: false,
  },
  'circular-flanged': {
    label: 'Tubo circolare — a filo del pannello',
    description: 'Il caso più comune: una bocca affacciata sul frontale, l\'altra libera dentro la cassa.',
    section: 'circular', endCorrection: 0.732, maxVelocity: 17, bends: 0, sharedWalls: 0, folded: false,
  },
  'circular-double-flanged': {
    label: 'Tubo circolare — doppia flangia',
    description: 'Entrambe le bocche flangiate o raccordate. Correzione terminale massima: il condotto risulta più corto a parità di accordo.',
    section: 'circular', endCorrection: 0.850, maxVelocity: 17, bends: 0, sharedWalls: 0, folded: false,
  },
  flared: {
    label: 'Condotto svasato (aeroport)',
    description: 'Bocche svasate a tromba: l\'aria entra e esce senza distacco di vena, quindi tollera velocità molto più alte prima di fischiare. Il diametro da indicare è quello della gola, la sezione più stretta.',
    section: 'circular', endCorrection: 0.850, maxVelocity: 25, bends: 0, sharedWalls: 0, folded: false,
  },
  slot: {
    label: 'Slot rettangolare',
    description: 'Condotto a fessura costruito con quattro pareti proprie. Si integra bene nel mobile e si può fare molto largo.',
    section: 'rectangular', endCorrection: 0.830, maxVelocity: 20, bends: 0, sharedWalls: 0, folded: false,
  },
  shelf: {
    label: 'Shelf port — una parete condivisa',
    description: 'Slot appoggiato al fondo o a un fianco della cassa, che fa da quarta parete. Meno legno e meno volume sottratto.',
    section: 'rectangular', endCorrection: 0.830, maxVelocity: 20, bends: 0, sharedWalls: 1, folded: false,
  },
  'corner-slot': {
    label: 'Slot d\'angolo — due pareti condivise',
    description: 'Slot ricavato in uno spigolo della cassa: due lati sono già le pareti del mobile, bastano due pannelli.',
    section: 'rectangular', endCorrection: 0.800, maxVelocity: 20, bends: 0, sharedWalls: 2, folded: false,
  },
  triangular: {
    label: 'Condotto triangolare d\'angolo',
    description: 'Un solo pannello diagonale chiude lo spigolo. Semplicissimo da costruire, ma a parità di area gli angoli acuti aumentano le perdite: tienilo più generoso.',
    section: 'triangular', endCorrection: 0.750, maxVelocity: 18, bends: 0, sharedWalls: 2, folded: false,
  },
  'l-folded': {
    label: 'Slot ripiegato a L',
    description: 'Il condotto corre lungo il fondo e poi risale sul retro. Serve quando la lunghezza richiesta non entra nella profondità della cassa.',
    section: 'rectangular', endCorrection: 0.830, maxVelocity: 20, bends: 1, sharedWalls: 1, folded: true,
  },
  'u-folded': {
    label: 'Slot ripiegato a U',
    description: 'Due pieghe: per accordi molto bassi, dove servono condotti lunghissimi. Ogni piega va raccordata, altrimenti genera turbolenza.',
    section: 'rectangular', endCorrection: 0.830, maxVelocity: 20, bends: 2, sharedWalls: 1, folded: true,
  },
};

export interface PortGeometry {
  type: PortType;
  count: number;
  /** circolare / svasato: diametro interno (gola per lo svasato), mm */
  diameterMm?: number;
  /** rettangolare: luce del condotto, mm */
  widthMm?: number;
  heightMm?: number;
  /** triangolare: i due cateti, mm */
  legAMm?: number;
  legBMm?: number;
}

// ─── Geometria ────────────────────────────────────────────────────────────────

/** Area della luce di UN condotto (cm²) */
export function portArea(g: PortGeometry): number {
  const spec = PORT_TYPES[g.type];
  if (spec.section === 'circular') {
    const d = (g.diameterMm ?? 0) / 10;
    return Math.PI * Math.pow(d / 2, 2);
  }
  if (spec.section === 'rectangular') {
    return ((g.widthMm ?? 0) / 10) * ((g.heightMm ?? 0) / 10);
  }
  // triangolo rettangolo: metà del prodotto dei cateti
  return 0.5 * ((g.legAMm ?? 0) / 10) * ((g.legBMm ?? 0) / 10);
}

/** Area totale di tutti i condotti (cm²) */
export const totalPortArea = (g: PortGeometry) => portArea(g) * Math.max(1, g.count);

/** Diametro del cerchio di pari area (mm) — è il Dv che entra nelle formule */
export function equivalentDiameter(g: PortGeometry): number {
  const areaCm2 = portArea(g);
  return 2 * Math.sqrt(areaCm2 / Math.PI) * 10;
}

/** Rapporto d'aspetto di uno slot (larghezza / altezza) */
export function aspectRatio(g: PortGeometry): number | null {
  if (PORT_TYPES[g.type].section !== 'rectangular') return null;
  const w = g.widthMm ?? 0, h = g.heightMm ?? 0;
  return h > 0 ? w / h : null;
}

// ─── Accordo ──────────────────────────────────────────────────────────────────

/**
 * Lunghezza del condotto (mm) per ottenere l'accordo Fb.
 *
 * Lv = c²·Av / ((2π·Fb)²·Vb) − k·Dv, con la costante ricavata dalla velocità
 * del suono alla temperatura indicata invece che da un valore tabellato.
 *
 * Per i condotti ripiegati la lunghezza è quella SVILUPPATA sull'asse: è la
 * misura che conta per l'accordo e quella che serve per tagliare i pezzi.
 */
/** lunghezza minima sotto la quale un condotto non è più costruibile */
export const MIN_PORT_LENGTH_MM = 20;

export interface PortLengthResult {
  /** lunghezza utilizzabile (mm), mai sotto il minimo costruttivo */
  lengthMm: number;
  /** lunghezza teorica richiesta: può essere negativa se la sezione è troppo grande */
  rawMm: number;
  /**
   * true quando l'accordo richiesto NON è ottenibile con questa sezione: il
   * condotto dovrebbe essere più corto del minimo costruttivo, quindi quello
   * reale accorderà più in basso di quanto chiesto.
   */
  unreachable: boolean;
}

export function portLengthFor(g: PortGeometry, fbHz: number, vbLiters: number, tempC = 20): PortLengthResult {
  const spec = PORT_TYPES[g.type];
  const cCm = speedOfSound(tempC) * 100;           // cm/s
  const k = (cCm * cCm) / (4 * Math.PI * Math.PI); // costante di accordo
  const avCm2 = totalPortArea(g);
  const dvCm = equivalentDiameter(g) / 10;

  // il termine di volume vuole cm³
  const lengthCm = (k * avCm2) / (fbHz * fbHz * vbLiters * 1000) - spec.endCorrection * dvCm;

  // le pieghe accorciano leggermente il percorso utile: il flusso taglia
  // l'angolo interno invece di seguirlo
  const bendGain = spec.bends * 0.3 * dvCm;
  const rawMm = (lengthCm + bendGain) * 10;

  return {
    lengthMm: Math.max(MIN_PORT_LENGTH_MM, rawMm),
    rawMm,
    unreachable: rawMm < MIN_PORT_LENGTH_MM,
  };
}

/** Accordo (Hz) di un condotto già costruito — verifica a posteriori */
export function tuningOf(g: PortGeometry, lengthMm: number, vbLiters: number, tempC = 20): number {
  const spec = PORT_TYPES[g.type];
  const cCm = speedOfSound(tempC) * 100;
  const k = (cCm * cCm) / (4 * Math.PI * Math.PI);
  const avCm2 = totalPortArea(g);
  const dvCm = equivalentDiameter(g) / 10;
  const effectiveCm = lengthMm / 10 + spec.endCorrection * dvCm - spec.bends * 0.3 * dvCm;
  return Math.sqrt((k * avCm2) / (effectiveCm * vbLiters * 1000));
}

// ─── Velocità dell'aria ───────────────────────────────────────────────────────

export interface VelocityCheck {
  velocity: number;      // m/s al massimo spostamento
  limit: number;         // soglia per questa geometria
  ratio: number;         // 1.0 = esattamente al limite
  ok: boolean;
  /** area minima secondo il criterio di Small (cm²) */
  minAreaCm2: number;
}

/**
 * Velocità di picco nel condotto all'escursione massima e confronto con la
 * soglia della geometria scelta. Un condotto svasato tollera ~25 m/s, uno a
 * spigolo vivo già a 17 m/s comincia a farsi sentire.
 */
export function velocityCheck(
  g: PortGeometry,
  fbHz: number,
  sdCm2: number,
  xmaxMm: number,
): VelocityCheck {
  const spec = PORT_TYPES[g.type];
  const sd = sdCm2 / 1e4;      // m²
  const xmax = xmaxMm / 1000;  // m
  const areaM2 = totalPortArea(g) / 1e4;

  const velocity = areaM2 > 0 ? (xmax * sd * 2 * Math.PI * fbHz) / areaM2 : 0;
  // criterio di Small: Sv ≥ 0.8 · Fb · Vd
  const minAreaCm2 = 0.8 * fbHz * (sd * xmax) * 1e4;

  return {
    velocity,
    limit: spec.maxVelocity,
    ratio: velocity / spec.maxVelocity,
    ok: velocity <= spec.maxVelocity,
    minAreaCm2,
  };
}

// ─── Ingombro e costruzione ───────────────────────────────────────────────────

export interface PortPanel { name: string; widthMm: number; heightMm: number; quantity: number }

/**
 * Volume sottratto alla cassa e pannelli per costruire il condotto.
 *
 * Non conta solo il vuoto interno: contano anche le pareti di legno che lo
 * formano. Le pareti condivise con la cassa non si costruiscono e non rubano
 * volume, ed è il motivo per cui shelf e slot d'angolo sono così diffusi.
 *
 * Non serve conoscere le dimensioni della cassa: si calcola PRIMA, perché è
 * proprio questo volume a determinarle.
 */
export function portDisplacement(
  g: PortGeometry,
  lengthMm: number,
  wallThicknessMm: number,
): { displacementL: number; panels: PortPanel[] } {
  const spec = PORT_TYPES[g.type];
  const n = Math.max(1, g.count);
  const panels: PortPanel[] = [];

  const ductL = (totalPortArea(g) * (lengthMm / 10)) / 1000;
  let woodL = 0;

  if (spec.section === 'triangular') {
    const hyp = Math.hypot(g.legAMm ?? 0, g.legBMm ?? 0);
    woodL = (hyp * lengthMm * wallThicknessMm * n) / 1e6;
    panels.push({ name: 'Pannello diagonale del condotto', widthMm: Math.round(hyp), heightMm: Math.round(lengthMm), quantity: n });
  } else if (spec.section === 'rectangular') {
    const w = g.widthMm ?? 0, h = g.heightMm ?? 0;
    const longWalls = Math.max(0, 2 - Math.min(spec.sharedWalls, 2));
    const shortWalls = Math.max(0, 4 - spec.sharedWalls - longWalls);
    woodL = ((longWalls * w + shortWalls * h) * lengthMm * wallThicknessMm * n) / 1e6;
    if (longWalls > 0) panels.push({ name: 'Parete lunga del condotto', widthMm: Math.round(w), heightMm: Math.round(lengthMm), quantity: longWalls * n });
    if (shortWalls > 0) panels.push({ name: 'Parete corta del condotto', widthMm: Math.round(h), heightMm: Math.round(lengthMm), quantity: shortWalls * n });
  }
  // i tubi commerciali hanno pareti sottili: trascurabili sul volume

  return { displacementL: ductL + woodL, panels };
}

export interface PortFit {
  /** tratti in cui si sviluppa il condotto */
  segments: { name: string; lengthMm: number }[];
  fits: boolean;
  warnings: string[];
}

/**
 * Verifica che il condotto ci stia davvero dentro la cassa e in quali tratti
 * si sviluppa. Si calcola DOPO aver dimensionato il mobile.
 */
export function portFit(
  g: PortGeometry,
  lengthMm: number,
  box: { internalWidthMm: number; internalHeightMm: number; internalDepthMm: number },
): PortFit {
  const spec = PORT_TYPES[g.type];
  const warnings: string[] = [];
  const segments: PortFit['segments'] = [];
  let fits = true;

  // ── la sezione deve stare nel frontale ─────────────────────────────────────
  // (controllo trascurato finora: un auto-dimensionamento può proporre uno slot
  //  più largo della cassa stessa)
  const sectionWidth = spec.section === 'rectangular'
    ? (g.widthMm ?? 0)
    : spec.section === 'triangular'
      ? (g.legAMm ?? 0)
      : (g.diameterMm ?? 0) * Math.max(1, g.count); // più tubi affiancati
  if (sectionWidth > box.internalWidthMm) {
    fits = false;
    warnings.push(
      `La sezione è larga ${Math.round(sectionWidth)} mm ma nella cassa ce ne stanno ${Math.round(box.internalWidthMm)}: riduci la larghezza e aumenta l'altezza della luce, oppure distribuisci l'area su più condotti.`,
    );
  }

  const clearance = Math.max(60, equivalentDiameter(g)); // aria dietro la bocca interna

  if (!spec.folded) {
    const available = box.internalDepthMm - clearance;
    segments.push({ name: 'Tratto unico, in profondità', lengthMm: Math.round(lengthMm) });
    if (lengthMm > available) {
      fits = false;
      warnings.push(
        `Il condotto misura ${Math.round(lengthMm)} mm ma in profondità ne restano ${Math.round(available)} mm: passa a un condotto ripiegato a L, oppure allarga la sezione per accorciarlo.`,
      );
    }
  } else {
    const legs = spec.bends + 1;
    const alongDepth = Math.max(80, box.internalDepthMm - clearance);
    const alongHeight = Math.max(80, box.internalHeightMm - clearance);
    let residual = lengthMm;
    for (let i = 0; i < legs && residual > 0; i++) {
      const limit = i % 2 === 0 ? alongDepth : alongHeight;
      const leg = Math.min(residual, limit);
      segments.push({
        name: i % 2 === 0 ? `Tratto ${i + 1}, lungo il fondo` : `Tratto ${i + 1}, risalita sulla parete`,
        lengthMm: Math.round(leg),
      });
      residual -= leg;
    }
    if (residual > 1) {
      fits = false;
      warnings.push(
        `Anche ripiegato restano ${Math.round(residual)} mm che non trovano posto: serve una cassa più profonda, una sezione maggiore o una piega in più.`,
      );
    }
    warnings.push('Raccorda le pieghe con un profilo arrotondato: uno spigolo vivo dentro il condotto genera turbolenza anche a velocità basse.');
  }

  const ar = aspectRatio(g);
  if (ar !== null && ar > 12) {
    warnings.push(`Slot molto schiacciato (${ar.toFixed(0)}:1): crescono le perdite per attrito sulle pareti e l'accordo reale scende sotto il calcolato. Sotto i 12:1 si sta più tranquilli.`);
  }
  if (spec.section === 'circular' && (g.diameterMm ?? 0) > 0 && lengthMm / (g.diameterMm ?? 1) > 12) {
    warnings.push('Condotto molto lungo rispetto al diametro: valuta uno svasato, più tubi in parallelo o un ripiegato.');
  }

  return { segments, fits, warnings };
}

// ─── Dimensionamento automatico ───────────────────────────────────────────────

/** Diametri commerciali dei tubi (mm) */
const STOCK_DIAMETERS = [50, 63, 75, 80, 90, 100, 110, 125, 140, 160, 180, 200, 250];

/**
 * Sezione minima necessaria perché la velocità resti sotto la soglia della
 * geometria scelta, considerando anche il criterio di Small.
 */
export function requiredPortArea(type: PortType, fbHz: number, sdCm2: number, xmaxMm: number): number {
  const spec = PORT_TYPES[type];
  const sd = sdCm2 / 1e4, xmax = xmaxMm / 1000;
  const byVelocity = ((xmax * sd * 2 * Math.PI * fbHz) / spec.maxVelocity) * 1e4; // cm²
  const bySmall = 0.8 * fbHz * (sd * xmax) * 1e4;
  return Math.max(byVelocity, bySmall);
}

/**
 * Propone una geometria adeguata: sezione sufficiente a non soffiare, con
 * proporzioni costruibili (tubi in misure commerciali, slot con rapporto
 * d'aspetto ragionevole, triangoli a cateti uguali).
 */
export function autoSizePort(
  type: PortType,
  count: number,
  fbHz: number,
  sdCm2: number,
  xmaxMm: number,
): PortGeometry {
  const spec = PORT_TYPES[type];
  const n = Math.max(1, count);
  const areaPerPort = requiredPortArea(type, fbHz, sdCm2, xmaxMm) / n;

  if (spec.section === 'circular') {
    const needed = 2 * Math.sqrt(areaPerPort / Math.PI) * 10; // mm
    const d = STOCK_DIAMETERS.find(x => x >= needed) ?? STOCK_DIAMETERS[STOCK_DIAMETERS.length - 1];
    return { type, count: n, diameterMm: d };
  }

  if (spec.section === 'triangular') {
    // triangolo rettangolo isoscele: ½·a² = area
    const a = Math.round(Math.sqrt(2 * areaPerPort) * 10);
    return { type, count: n, legAMm: a, legBMm: a };
  }

  // slot: rapporto d'aspetto 6:1, buon compromesso fra larghezza e attrito
  const areaMm2 = areaPerPort * 100;
  const width = Math.round(Math.sqrt(areaMm2 * 6) / 5) * 5;
  const height = Math.max(15, Math.round(areaMm2 / width));
  return { type, count: n, widthMm: width, heightMm: height };
}

/** Descrizione compatta della geometria, per riepiloghi e stampe */
export function describePort(g: PortGeometry, lengthMm: number): string {
  const spec = PORT_TYPES[g.type];
  const n = Math.max(1, g.count);
  const prefix = n > 1 ? `${n}× ` : '';
  if (spec.section === 'circular') return `${prefix}Ø${g.diameterMm} × ${Math.round(lengthMm)} mm`;
  if (spec.section === 'triangular') return `${prefix}${g.legAMm}×${g.legBMm} mm (triangolare) × ${Math.round(lengthMm)} mm`;
  return `${prefix}${g.widthMm}×${g.heightMm} mm × ${Math.round(lengthMm)} mm`;
}
