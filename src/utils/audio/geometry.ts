/**
 * Geometria della cassa: dimensionamento fisico, volume netto/lordo,
 * effetto dell'assorbente interno e lista di taglio dei pannelli.
 */

import type {
  BoxDimensions, BoxShape, CutPanel, DampingLevel, DampingSpec, VolumeBreakdown,
} from './types';

// ─── Assorbente interno ───────────────────────────────────────────────────────

/**
 * L'assorbente rallenta le onde interne: la cassa "sembra" più grande e le
 * perdite per assorbimento (Qa) aumentano, smorzando la risonanza.
 */
export const DAMPING_SPECS: Record<DampingLevel, DampingSpec> = {
  none:    { qa: 100, volumeGain: 0.00, label: 'Nessuno — cassa vuota' },
  minimal: { qa: 30,  volumeGain: 0.05, label: 'Minimo — solo parete posteriore' },
  normal:  { qa: 10,  volumeGain: 0.12, label: 'Normale — pareti rivestite' },
  heavy:   { qa: 5,   volumeGain: 0.20, label: 'Pesante — cassa riempita' },
};

// ─── Proporzioni ──────────────────────────────────────────────────────────────

/** Proporzione aurea classica larghezza : altezza : profondità */
export const GOLDEN_RATIO: [number, number, number] = [1, 1.618, 0.618];

export interface DimensionOptions {
  shape: BoxShape;
  wallThickness: number;        // mm
  /** proporzioni interne desiderate (default: aurea) */
  ratio?: [number, number, number];
  /** vincola la larghezza esterna (mm): altezza e profondità si adattano */
  fixedWidth?: number;
  /** vincola l'altezza esterna (mm) */
  fixedHeight?: number;
  /** solo trapezoidale: rapporto profondità posteriore/anteriore (0.3–1) */
  taper?: number;
  /** solo cilindrico: diametro esterno (mm); se assente lo deriva dal volume */
  diameter?: number;
}

/**
 * Dimensioni esterne per ottenere il volume interno richiesto.
 * Il volume passato è quello LORDO interno (netto + ingombri già sommati).
 */
export function dimensionsFromVolume(internalVolumeL: number, opts: DimensionOptions): BoxDimensions {
  const t = opts.wallThickness;
  const vMm3 = Math.max(internalVolumeL, 0.1) * 1e6;

  if (opts.shape === 'cylindrical') {
    // V = π·r²·h ; se manca il diametro usa h = 3·d (proporzione slanciata)
    let dInt: number;
    let hInt: number;
    if (opts.diameter) {
      dInt = Math.max(opts.diameter - 2 * t, 50);
      hInt = vMm3 / (Math.PI * Math.pow(dInt / 2, 2));
    } else {
      dInt = Math.cbrt((4 * vMm3) / (3 * Math.PI));
      hInt = 3 * dInt;
    }
    return {
      shape: 'cylindrical',
      diameter: Math.round(dInt + 2 * t),
      width: Math.round(dInt + 2 * t),
      depth: Math.round(dInt + 2 * t),
      height: Math.round(hInt + 2 * t),
      wallThickness: t,
    };
  }

  const [rw, rh, rd] = opts.ratio ?? GOLDEN_RATIO;

  let wInt: number;
  let hInt: number;
  let dInt: number;

  if (opts.fixedWidth && opts.fixedHeight) {
    wInt = Math.max(opts.fixedWidth - 2 * t, 50);
    hInt = Math.max(opts.fixedHeight - 2 * t, 50);
    dInt = vMm3 / (wInt * hInt);
  } else if (opts.fixedWidth) {
    wInt = Math.max(opts.fixedWidth - 2 * t, 50);
    // mantiene il rapporto altezza/profondità
    const k = Math.sqrt(vMm3 / (wInt * rh * rd));
    hInt = k * rh;
    dInt = k * rd;
  } else if (opts.fixedHeight) {
    hInt = Math.max(opts.fixedHeight - 2 * t, 50);
    const k = Math.sqrt(vMm3 / (hInt * rw * rd));
    wInt = k * rw;
    dInt = k * rd;
  } else {
    const k = Math.cbrt(vMm3 / (rw * rh * rd));
    wInt = k * rw;
    hInt = k * rh;
    dInt = k * rd;
  }

  if (opts.shape === 'trapezoidal') {
    // profondità media = dInt ; le due facce differiscono per il taper
    const taper = Math.min(Math.max(opts.taper ?? 0.6, 0.3), 1);
    const dFront = (2 * dInt) / (1 + taper);
    const dRear = dFront * taper;
    return {
      shape: 'trapezoidal',
      width: Math.round(wInt + 2 * t),
      height: Math.round(hInt + 2 * t),
      depth: Math.round(dFront + 2 * t),
      depthRear: Math.round(dRear + 2 * t),
      wallThickness: t,
    };
  }

  return {
    shape: 'rectangular',
    width: Math.round(wInt + 2 * t),
    height: Math.round(hInt + 2 * t),
    depth: Math.round(dInt + 2 * t),
    wallThickness: t,
  };
}

/** Volume interno lordo (litri) dalle dimensioni esterne */
export function internalVolume(dims: BoxDimensions): number {
  const t = dims.wallThickness;
  if (dims.shape === 'cylindrical') {
    const dInt = (dims.diameter ?? dims.width) - 2 * t;
    const hInt = dims.height - 2 * t;
    return (Math.PI * Math.pow(dInt / 2, 2) * hInt) / 1e6;
  }
  const wInt = dims.width - 2 * t;
  const hInt = dims.height - 2 * t;
  if (dims.shape === 'trapezoidal' && dims.depthRear) {
    const dAvg = ((dims.depth - 2 * t) + (dims.depthRear - 2 * t)) / 2;
    return (wInt * hInt * dAvg) / 1e6;
  }
  const dInt = dims.depth - 2 * t;
  return (wInt * hInt * dInt) / 1e6;
}

// ─── Ingombri interni ─────────────────────────────────────────────────────────

/** Ingombro stimato del driver (litri): cestello + magnete dentro la cassa */
export function driverDisplacement(sdCm2: number, mountingDepthMm: number, count = 1): number {
  // il cestello non è un cilindro pieno: ~35% del volume del cono di ingombro
  return (sdCm2 * (mountingDepthMm / 10) * 0.35 * count) / 1000;
}

/**
 * Bilancio dei volumi: dal lordo interno al netto acustico, più il volume
 * "apparente" aggiunto dall'assorbente.
 */
export function volumeBreakdown(params: {
  grossL: number;
  driverDispL?: number;
  portDispL?: number;
  bracingPercent?: number;  // % del lordo occupata dai rinforzi (default 3%)
  damping?: DampingLevel;
}): VolumeBreakdown {
  const { grossL, driverDispL = 0, portDispL = 0, bracingPercent = 3, damping = 'normal' } = params;
  const bracingDisp = (grossL * bracingPercent) / 100;
  const net = Math.max(0.1, grossL - driverDispL - portDispL - bracingDisp);
  const effective = net * (1 + DAMPING_SPECS[damping].volumeGain);
  return {
    gross: grossL,
    driverDisp: driverDispL,
    portDisp: portDispL,
    bracingDisp,
    net,
    effective,
  };
}

/**
 * Volume lordo necessario perché il NETTO sia quello richiesto dal progetto
 * acustico (operazione inversa di volumeBreakdown).
 */
export function grossFromNet(netTargetL: number, params: {
  driverDispL?: number;
  portDispL?: number;
  bracingPercent?: number;
}): number {
  const { driverDispL = 0, portDispL = 0, bracingPercent = 3 } = params;
  return (netTargetL + driverDispL + portDispL) / (1 - bracingPercent / 100);
}

// ─── Lista di taglio ──────────────────────────────────────────────────────────

/** Pannelli da tagliare, schema a giunti testa-testa con frontale/posteriore a filo */
export function cuttingList(dims: BoxDimensions): CutPanel[] {
  const t = dims.wallThickness;

  if (dims.shape === 'cylindrical') {
    const d = dims.diameter ?? dims.width;
    return [
      { name: 'Tubo cilindrico', width: Math.round(Math.PI * d), height: dims.height, thickness: t, quantity: 1, note: `Tubo Ø${d}mm esterno, altezza ${dims.height}mm (es. tubo in cartone pressato o PVC)` },
      { name: 'Tappo superiore', width: d, height: d, thickness: t, quantity: 1, note: `Disco Ø${d - 2 * t}mm da incastrare` },
      { name: 'Tappo inferiore', width: d, height: d, thickness: t, quantity: 1, note: `Disco Ø${d - 2 * t}mm da incastrare` },
    ];
  }

  const panels: CutPanel[] = [
    { name: 'Frontale (baffle)', width: dims.width, height: dims.height, thickness: t, quantity: 1, note: 'Consigliato doppio spessore per ridurre le risonanze' },
  ];

  if (dims.shape === 'trapezoidal' && dims.depthRear) {
    // Cuneo: la profondità varia lungo l'altezza, quindi il fondo è più
    // profondo del cielo e il pannello posteriore è INCLINATO — la sua
    // lunghezza vera è l'ipotenusa, non l'altezza della cassa.
    const deep = dims.depth - 2 * t;      // profondità sul fondo
    const shallow = dims.depthRear - 2 * t; // profondità sul cielo
    const slant = Math.round(Math.hypot(dims.height, deep - shallow));
    panels.push(
      { name: 'Posteriore (inclinato)', width: dims.width, height: slant, thickness: t, quantity: 1, note: `Pannello in pendenza: ${slant}mm di sviluppo contro i ${dims.height}mm di altezza della cassa. Bordi da smussare per appoggiare sui laterali.` },
      { name: 'Laterale (trapezoidale)', width: deep, height: dims.height, thickness: t, quantity: 2, note: `Trapezio rettangolo: ${deep}mm di profondità sul fondo, ${shallow}mm sul cielo, ${dims.height}mm di altezza.` },
      { name: 'Cielo', width: dims.width - 2 * t, height: shallow, thickness: t, quantity: 1, note: 'Il lato corto del cuneo.' },
      { name: 'Fondo', width: dims.width - 2 * t, height: deep, thickness: t, quantity: 1, note: 'Il lato lungo del cuneo.' },
    );
  } else {
    panels.push({ name: 'Posteriore', width: dims.width, height: dims.height, thickness: t, quantity: 1 });
    panels.push(
      { name: 'Laterale', width: dims.depth - 2 * t, height: dims.height, thickness: t, quantity: 2 },
      { name: 'Superiore', width: dims.width - 2 * t, height: dims.depth - 2 * t, thickness: t, quantity: 1 },
      { name: 'Inferiore', width: dims.width - 2 * t, height: dims.depth - 2 * t, thickness: t, quantity: 1 },
    );
  }

  return panels;
}

/** Superficie totale di pannello necessaria (m²), utile per stimare i fogli */
export function totalPanelArea(panels: CutPanel[]): number {
  return panels.reduce((acc, p) => acc + (p.width * p.height * p.quantity) / 1e6, 0);
}

/** Peso stimato della cassa vuota (kg). MDF ≈ 750 kg/m³, betulla ≈ 680 */
export function estimatedWeight(panels: CutPanel[], densityKgM3 = 750): number {
  const volumeM3 = panels.reduce((acc, p) => acc + (p.width * p.height * p.thickness * p.quantity) / 1e9, 0);
  return volumeM3 * densityKgM3;
}

export const SHAPE_LABELS: Record<BoxShape, string> = {
  rectangular: 'Parallelepipedo rettangolare',
  trapezoidal: 'Trapezoidale (a cuneo)',
  cylindrical: 'Cilindrico',
};
