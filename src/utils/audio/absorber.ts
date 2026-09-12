/**
 * Materiali fonoassorbenti: riempimento e rivestimento interno.
 *
 * Tre effetti, tutti ricavati da modelli pubblicati invece che da tabelle di
 * valori fissi, cosi rispondono davvero a materiale, densita, spessore,
 * posizionamento e dimensioni della cassa.
 *
 * 1. VOLUME APPARENTE. Le fibre scambiano calore con l'aria e la compressione
 *    passa da adiabatica a isotermica: la velocita del suono scende di sqrt(gamma)
 *    e la cedevolezza della cassa cresce di gamma. Il limite superiore e quindi
 *    esatto e vale gamma - 1 = 0.40, non un numero da tabella: nessun materiale
 *    puo far vedere al woofer piu del 40% di volume in piu per via termica.
 *    In pratica si misurano +20-30% nei riempimenti spinti (il limite pratico
 *    citato da Weems e circa +20%), e l'interpolazione qui e calibrata su quei
 *    punti. Vedi anche Bradbury, JAES 24(3) 1976, che descrive il secondo
 *    meccanismo: le fibre trascinate dall'aria aggiungono massa e rallentano la
 *    propagazione fino al 35-50% nelle linee molto smorzate.
 *
 * 2. PERDITE PER ASSORBIMENTO (Qa). I valori di riferimento sono quelli
 *    misurati da Small in "Vented-Box Loudspeaker Systems Part 1" (JAES 1973):
 *    cassa non rivestita Qa >= 100; rivestimento tipico sulle pareti, dove la
 *    velocita particellare e bassa, Qa 30-80; rivestimenti molto spessi o setti
 *    smorzanti scendono oltre; cassa riempita Qa 7-10 e riempimento molto denso
 *    Qa 3-5. Il parametro che comanda e la resistenza al flusso normalizzata.
 *
 * 3. ONDE STAZIONARIE INTERNE. Le prime risonanze di cavita stanno a
 *    f = n*c/(2d) per ogni coppia di pareti parallele. L'attenuazione del picco
 *    si ricava dal coefficiente di assorbimento del materiale a quella
 *    frequenza, calcolato con il modello di Miki (1990) - la revisione di
 *    Delany-Bazley valida su un intervallo piu ampio - per uno strato su parete
 *    rigida.
 *
 * La resistivita al flusso in funzione della densita usa le formule pubblicate
 * per ciascuna famiglia di materiale: Garai-Pompoli (2005) per il poliestere,
 * Bies-Hansen (1980) per le lane minerali.
 */

import { airDensity, speedOfSound } from './constants';

/** rapporto dei calori specifici dell'aria */
export const GAMMA_AIR = 1.402;
/** incremento massimo di volume apparente: e esattamente gamma - 1 */
export const MAX_VOLUME_GAIN = GAMMA_AIR - 1;

// ─── Aritmetica complessa (serve al modello di assorbimento) ──────────────────

interface Cx { re: number; im: number; }
const cx = (re: number, im = 0): Cx => ({ re, im });
const cAdd = (a: Cx, b: Cx): Cx => ({ re: a.re + b.re, im: a.im + b.im });
const cSub = (a: Cx, b: Cx): Cx => ({ re: a.re - b.re, im: a.im - b.im });
const cMul = (a: Cx, b: Cx): Cx => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const cDiv = (a: Cx, b: Cx): Cx => {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
const cAbs = (a: Cx) => Math.hypot(a.re, a.im);
const cSin = (z: Cx): Cx => ({ re: Math.sin(z.re) * Math.cosh(z.im), im: Math.cos(z.re) * Math.sinh(z.im) });
const cCos = (z: Cx): Cx => ({ re: Math.cos(z.re) * Math.cosh(z.im), im: -Math.sin(z.re) * Math.sinh(z.im) });
const cCot = (z: Cx): Cx => cDiv(cCos(z), cSin(z));

// ─── Libreria materiali ───────────────────────────────────────────────────────

export type AbsorberId =
  | 'none'
  | 'polyester'
  | 'foam-profiled'
  | 'felt-wool'
  | 'mineral-wool';

/** come si ricava la resistivita al flusso dalla densita */
type ResistivityModel =
  /** Garai-Pompoli 2005: sigma = 25.989e-9 * rho^1.404 / d^2 (poliestere) */
  | { kind: 'garai-pompoli'; fibreDiameterUm: number }
  /** Bies-Hansen 1980: sigma = 3.18e-9 * rho^1.53 / d^2 (lane minerali) */
  | { kind: 'bies-hansen'; fibreDiameterUm: number }
  /** schiume e feltri: valore misurato, la densita non e una variabile utile */
  | { kind: 'fixed'; sigma: number };

export interface AbsorberSpec {
  id: AbsorberId;
  label: string;
  /** impiego per cui il materiale e pensato */
  bestUse: string;
  /** densita utilizzabili in cassa (kg/m3); per i rivestimenti e la densita del pannello */
  densityRange: [number, number];
  defaultDensityKgM3: number;
  /** spessore tipico quando si usa come rivestimento (mm) */
  typicalLiningMm: number;
  resistivity: ResistivityModel;
  /** densita del materiale solido (kg/m3), per il volume che sottrae davvero */
  solidDensityKgM3: number;
  /**
   * Efficacia dello scambio termico rispetto a una fibra fine ideale. Entra
   * solo nell'effetto di volume apparente: a parita di densita una fibra piu
   * fine offre piu superficie e accoppia meglio.
   */
  thermalCoupling: number;
  /** placement per cui e sensato proporlo */
  suitable: Placement[];
  note?: string;
  /** avvertenza pratica da mostrare all'utente */
  caution?: string;
  source: string;
}

export type Placement =
  /** cassa vuota */
  | 'none'
  /** solo rivestimento delle pareti interne */
  | 'lining'
  /** riempimento uniforme di tutto il volume */
  | 'stuffing';

export const PLACEMENT_LABELS: Record<Placement, string> = {
  none: 'Cassa vuota',
  lining: 'Rivestimento delle pareti',
  stuffing: 'Riempimento uniforme del volume',
};

export const ABSORBERS: Record<AbsorberId, AbsorberSpec> = {
  none: {
    id: 'none', label: 'Nessun materiale', bestUse: 'Riferimento a cassa vuota',
    densityRange: [0, 0], defaultDensityKgM3: 0, typicalLiningMm: 0,
    resistivity: { kind: 'fixed', sigma: 0 }, solidDensityKgM3: 1,
    thermalCoupling: 0, suitable: ['none'],
    source: 'Small, JAES 1973: cassa non rivestita Qa ≥ 100',
  },
  polyester: {
    id: 'polyester',
    label: 'Fibra di poliestere / Dacron / ovatta',
    bestUse: 'Riempimento uniforme del volume',
    densityRange: [5, 30], defaultDensityKgM3: 10, typicalLiningMm: 30,
    resistivity: { kind: 'garai-pompoli', fibreDiameterUm: 30 },
    solidDensityKgM3: 1380,
    thermalCoupling: 0.9,
    suitable: ['lining', 'stuffing'],
    note: 'La fibra più usata nei diffusori: non rilascia polveri irritanti e non si compatta con le vibrazioni.',
    source: 'Garai–Pompoli, Applied Acoustics 2005 (A = 25.989, B = 1.404)',
  },
  'foam-profiled': {
    id: 'foam-profiled',
    label: 'Poliuretano espanso bugnato / piramidale',
    bestUse: 'Rivestimento delle pareti interne',
    densityRange: [20, 40], defaultDensityKgM3: 28, typicalLiningMm: 30,
    resistivity: { kind: 'fixed', sigma: 10000 },
    solidDensityKgM3: 1200,
    thermalCoupling: 0.45,
    suitable: ['lining'],
    note: 'Il profilo piramidale serve a media e alta frequenza: sull’effetto di volume apparente incide poco, perché la cella aperta offre meno superficie di scambio termico della fibra.',
    source: 'Resistività tipica delle schiume acustiche a cella aperta, 8000–15000 Pa·s/m²',
  },
  'felt-wool': {
    id: 'felt-wool',
    label: 'Feltro tessile / lana pressata',
    bestUse: 'Smorzamento delle pareti e delle vibrazioni meccaniche',
    densityRange: [80, 250], defaultDensityKgM3: 150, typicalLiningMm: 12,
    resistivity: { kind: 'fixed', sigma: 35000 },
    solidDensityKgM3: 1300,
    thermalCoupling: 0.3,
    suitable: ['lining'],
    note: 'Lavora più come massa smorzante sul pannello che come assorbitore del volume interno: 10–15 mm non bastano ad assorbire alle frequenze di cavità, ma alzano le perdite del pannello.',
    source: 'Feltro acustico denso, resistività 20000–50000 Pa·s/m²',
  },
  'mineral-wool': {
    id: 'mineral-wool',
    label: 'Lana di roccia / lana di vetro',
    bestUse: 'Massimo assorbimento, ma come rivestimento e solo in casse chiuse',
    densityRange: [20, 100], defaultDensityKgM3: 40, typicalLiningMm: 30,
    resistivity: { kind: 'bies-hansen', fibreDiameterUm: 6 },
    solidDensityKgM3: 2700,
    thermalCoupling: 1.0,
    suitable: ['lining', 'stuffing'],
    note: 'A parità di densità ha resistività al flusso molto più alta del poliestere, quindi assorbe di più; per lo stesso motivo, alle densità commerciali (40–100 kg/m³) supera l’optimum e comincia a riflettere invece di assorbire.',
    caution: 'Da non usare nelle casse con condotto: le fibre migrano nel flusso d’aria e vengono espulse dal reflex. Fibre respirabili durante il montaggio: serve protezione.',
    source: 'Bies-Hansen 1980 (σ·d²/ρ^1.53 = 3.18·10⁻⁹)',
  },
};

// ─── Resistivita al flusso ────────────────────────────────────────────────────

/**
 * Resistivita al flusso sigma (Pa*s/m2) alla densita data.
 *
 * Le due leggi di potenza non sono intercambiabili: il poliestere ha fibre da
 * 18-48 um e i modelli tarati sulla lana di vetro ne sottostimano molto la
 * resistivita, motivo per cui Garai e Pompoli hanno rifatto il fit.
 */
export function flowResistivity(spec: AbsorberSpec, densityKgM3: number): number {
  const r = spec.resistivity;
  if (r.kind === 'fixed') return r.sigma;
  const d = r.fibreDiameterUm * 1e-6; // m
  const a = r.kind === 'garai-pompoli' ? 25.989e-9 : 3.18e-9;
  const b = r.kind === 'garai-pompoli' ? 1.404 : 1.53;
  return (a * Math.pow(Math.max(densityKgM3, 0.1), b)) / (d * d);
}

// ─── Coefficiente di assorbimento (Miki 1990 su parete rigida) ────────────────

/**
 * Coefficiente di assorbimento a incidenza normale di uno strato di spessore
 * `thicknessMm` con parete rigida dietro.
 *
 * Impedenza caratteristica e costante di propagazione dal modello di Miki, che
 * corregge Delany-Bazley restando valido anche a f/sigma piccoli:
 *   Zc = rho0*c * [1 + 5.50*X^-0.632 - j*8.43*X^-0.632]
 *   k  = (w/c)  * [1 + 7.81*X^-0.618 - j*11.41*X^-0.618],  X = 1000*f/sigma
 * Poi Zs = -j*Zc*cot(k*t) e alpha = 1 - |(Zs - rho0*c)/(Zs + rho0*c)|^2.
 */
export function absorptionCoefficient(
  sigma: number,
  thicknessMm: number,
  freqHz: number,
  tempC = 20,
): number {
  if (sigma <= 0 || thicknessMm <= 0 || freqHz <= 0) return 0;
  const rho0 = airDensity(tempC);
  const c = speedOfSound(tempC);
  const z0 = rho0 * c;

  const X = (1000 * freqHz) / sigma;
  const pz = Math.pow(X, -0.632);
  const pk = Math.pow(X, -0.618);
  const zc = cMul(cx(z0), cx(1 + 5.50 * pz, -8.43 * pz));
  const w = 2 * Math.PI * freqHz;
  const k = cMul(cx(w / c), cx(1 + 7.81 * pk, -11.41 * pk));

  const t = thicknessMm / 1000;
  const kt = cMul(k, cx(t));
  // Zs = -j * Zc * cot(k t)
  const zs = cMul(cMul(cx(0, -1), zc), cCot(kt));
  const refl = cDiv(cSub(zs, cx(z0)), cAdd(zs, cx(z0)));
  const alpha = 1 - Math.pow(cAbs(refl), 2);
  return Math.min(1, Math.max(0, alpha));
}

/**
 * Q di propagazione di un modo che vive DENTRO il materiale.
 *
 * Nel riempimento uniforme il modo non incontra uno strato su parete rigida: si
 * propaga immerso in un mezzo dissipativo, e il suo fattore di merito e il
 * rapporto fra parte reale e immaginaria della costante di propagazione,
 * Q = Re(k) / (2*|Im(k)|). Usare il modello dello strato darebbe un
 * assorbimento vicino a 1 e nasconderebbe l informazione utile, che e proprio
 * quanto il modo abbia smesso di essere una risonanza.
 */
export function propagationQ(sigma: number, freqHz: number, tempC = 20): number {
  if (sigma <= 0 || freqHz <= 0) return Infinity;
  const X = (1000 * freqHz) / sigma;
  const pk = Math.pow(X, -0.618);
  const re = 1 + 7.81 * pk;
  const im = 11.41 * pk;
  void speedOfSound(tempC);
  return re / (2 * im);
}

// ─── Geometria del riempimento ────────────────────────────────────────────────

export interface AbsorberFill {
  /** frazione del volume interno occupata dal materiale (0-1) */
  fillFraction: number;
  /** massa di materiale necessaria (kg) */
  materialMassKg: number;
  /** volume che la parte solida sottrae davvero (litri) */
  solidDisplacementL: number;
  /** spessore attraversato dall onda (mm): cammino utile per l assorbimento */
  pathMm: number;
}

export interface InternalDims {
  /** dimensioni INTERNE in mm */
  widthMm: number;
  heightMm: number;
  depthMm: number;
}

/**
 * Quanto materiale entra in cassa e quale frazione del volume occupa.
 *
 * Per il rivestimento la frazione la detta la geometria, non una percentuale
 * fissa: 25 mm di feltro in una cassa da 10 litri sono proporzionalmente molto
 * piu materiale che in una da 100, e infatti l effetto e diverso.
 */
export function absorberFill(
  spec: AbsorberSpec,
  placement: Placement,
  densityKgM3: number,
  liningThicknessMm: number,
  dims: InternalDims,
  netVolumeL: number,
): AbsorberFill {
  if (placement === 'none' || spec.id === 'none') {
    return { fillFraction: 0, materialMassKg: 0, solidDisplacementL: 0, pathMm: 0 };
  }

  const { widthMm: w, heightMm: h, depthMm: d } = dims;
  const volM3 = Math.max(netVolumeL, 0.1) / 1000;

  let matVolM3: number;
  let pathMm: number;
  if (placement === 'stuffing') {
    matVolM3 = volM3;
    // l onda attraversa la cassa: il cammino utile e la dimensione media
    pathMm = (w + h + d) / 3;
  } else {
    const areaM2 = 2 * ((w * h) + (w * d) + (h * d)) / 1e6;
    matVolM3 = Math.min(volM3 * 0.9, (areaM2 * liningThicknessMm) / 1000);
    pathMm = liningThicknessMm;
  }

  const massKg = matVolM3 * densityKgM3;
  return {
    fillFraction: Math.min(1, matVolM3 / volM3),
    materialMassKg: massKg,
    solidDisplacementL: (massKg / spec.solidDensityKgM3) * 1000,
    pathMm,
  };
}

// ─── Effetto 1: volume apparente ──────────────────────────────────────────────

/**
 * Densita caratteristica dell interpolazione termica (kg/m3).
 *
 * Il limite gamma - 1 = 0.40 e esatto, ma la salita verso quel limite e
 * empirica: qui e tarata sui valori misurati e pubblicati per il poliestere,
 * cioe +10% a 10 kg/m3 in riempimento uniforme, +16% a 18 kg/m3, +20% a
 * 25 kg/m3 e +27% a 40 kg/m3, coerenti con il limite pratico del 20-30%
 * riportato in letteratura.
 */
const THERMAL_RHO_CHAR = 34.8;

export interface ApparentVolume {
  /** incremento frazionario del volume apparente */
  delta: number;
  /** volume che il woofer "vede" (litri) */
  effectiveL: number;
  /** volume d aria realmente disponibile, al netto del solido (litri) */
  airVolumeL: number;
  /** quota del limite termico assoluto gia sfruttata (0-1) */
  fractionOfLimit: number;
}

export function apparentVolume(
  spec: AbsorberSpec,
  fill: AbsorberFill,
  densityKgM3: number,
  netVolumeL: number,
): ApparentVolume {
  const airL = Math.max(0.1, netVolumeL - fill.solidDisplacementL);
  if (fill.fillFraction <= 0) {
    return { delta: 0, effectiveL: airL, airVolumeL: airL, fractionOfLimit: 0 };
  }
  // quota di aria che riesce a scambiare calore con le fibre
  const coupling = spec.thermalCoupling * (1 - Math.exp(-densityKgM3 / THERMAL_RHO_CHAR));
  const delta = MAX_VOLUME_GAIN * coupling * fill.fillFraction;
  return {
    delta,
    effectiveL: airL * (1 + delta),
    airVolumeL: airL,
    fractionOfLimit: delta / MAX_VOLUME_GAIN,
  };
}

// ─── Effetto 2: perdite per assorbimento Qa ───────────────────────────────────

/** Qa di una cassa non rivestita, da Small (JAES 1973): 100 o piu */
export const QA_EMPTY = 100;
/**
 * Oltre una certa resistenza il materiale smette di assorbire e comincia a
 * comportarsi da parete: l aria non lo attraversa piu. Le misure pubblicate non
 * scendono sotto Qa 3 anche nei riempimenti piu densi, quindi il modello si
 * ferma li invece di proseguire su una legge di potenza che non e piu valida.
 */
export const QA_FLOOR = 3;

// Taratura della legge su due punti misurati da Small: rivestimento tipico
// Qa ~ 50 e cassa riempita Qa ~ 4.
const QA_COEFF = 17.5;
const QA_EXP = 0.861;

export interface AbsorptionLosses {
  qa: number;
  /** resistenza al flusso normalizzata sigma*t/(rho0*c), adimensionale */
  normalizedResistance: number;
  /** vera se il modello ha toccato il fondo scala */
  saturated: boolean;
  sigma: number;
}

export function absorptionLosses(
  spec: AbsorberSpec,
  fill: AbsorberFill,
  densityKgM3: number,
  tempC = 20,
): AbsorptionLosses {
  const sigma = flowResistivity(spec, densityKgM3);
  if (fill.fillFraction <= 0 || sigma <= 0) {
    return { qa: QA_EMPTY, normalizedResistance: 0, saturated: false, sigma: 0 };
  }
  const z0 = airDensity(tempC) * speedOfSound(tempC);
  const xi = ((sigma * (fill.pathMm / 1000)) / z0) * fill.fillFraction;
  const raw = QA_EMPTY / (1 + QA_COEFF * Math.pow(xi, QA_EXP));
  return {
    qa: Math.max(QA_FLOOR, raw),
    normalizedResistance: xi,
    saturated: raw < QA_FLOOR,
    sigma,
  };
}

/**
 * Q totale del sistema con le perdite della cassa in parallelo:
 *   1/Qt = 1/Qec + 1/Qmc + 1/Qa
 * E la forma che vale per la cassa CHIUSA. Nel reflex le perdite non vanno
 * messe nel Qts: la funzione di trasferimento di quarto ordine porta gia QL nei
 * suoi coefficienti, e infilarle anche nel Q del driver le conterebbe due volte.
 */
export const totalQWithLosses = (qec: number, qmc: number, qa: number): number =>
  1 / (1 / qec + 1 / qmc + 1 / qa);

/**
 * Perdite equivalenti della cassa reflex.
 *
 * Small dimostra che fughe, assorbimento e condotto, nei valori che si misurano
 * davvero, hanno sullo stesso sistema un effetto indistinguibile da un unico QL
 * pari alla loro combinazione in parallelo. Il motore usa quindi un solo QB.
 * Perdite di fuga 5-20 secondo Small, con 7 come valore di riferimento delle
 * carte di allineamento; condotto libero 50-100.
 */
export function ventedBoxLosses(qa: number, qLeak = 15, qPort = 70): number {
  return 1 / (1 / qa + 1 / qLeak + 1 / qPort);
}

// ─── Effetto 3: onde stazionarie interne ──────────────────────────────────────

export interface StandingWave {
  axis: 'larghezza' | 'altezza' | 'profondita';
  /** dimensione interna che la genera (mm) */
  dimensionMm: number;
  order: number;
  freqHz: number;
  /** assorbimento equivalente del materiale a quella frequenza */
  alpha: number;
  /** falso quando il Q scende sotto 0.5: a quel punto non e piu una risonanza */
  stillResonant: boolean;
  /** Q del modo a cassa vuota */
  qEmpty: number;
  /** Q del modo con il materiale */
  qDamped: number;
  /** abbattimento del picco (dB) */
  attenuationDb: number;
}

/** assorbimento di un pannello di legno nudo: 2-5% alle medie frequenze */
const ALPHA_BARE_PANEL = 0.03;
/**
 * Il modello e monodimensionale e a pareti rigide, quindi sovrastima quanto si
 * misura in una cassa vera, dove il modo non e puro e il pannello flette. Il
 * risultato viene percio limitato a un valore difendibile.
 */
const MAX_ATTENUATION_DB = 25;

/** Q di un modo di cavita con assorbimento alpha per riflessione */
const modalQ = (alpha: number): number => {
  const a = Math.min(0.999, Math.max(1e-4, alpha));
  return (2 * Math.PI) / -Math.log(1 - a);
};

/**
 * Prime risonanze di cavita fra pareti parallele, f = n*c/(2d), con
 * l abbattimento che il materiale scelto produce su ciascuna.
 *
 * Dentro un riempimento la velocita del suono scende, quindi le frequenze si
 * abbassano: il fattore e sqrt(1 + delta), perche delta nasce proprio dal calo
 * di c.
 */
export function standingWaves(
  dims: InternalDims,
  spec: AbsorberSpec,
  fill: AbsorberFill,
  densityKgM3: number,
  delta: number,
  placement: Placement,
  orders = 3,
  tempC = 20,
): StandingWave[] {
  const c = speedOfSound(tempC) / Math.sqrt(1 + delta * fill.fillFraction);
  const sigma = flowResistivity(spec, densityKgM3);
  const axes: [StandingWave['axis'], number][] = [
    ['larghezza', dims.widthMm],
    ['altezza', dims.heightMm],
    ['profondita', dims.depthMm],
  ];

  const out: StandingWave[] = [];
  for (const [axis, dMm] of axes) {
    for (let n = 1; n <= orders; n++) {
      const freqHz = (n * c) / (2 * (dMm / 1000));
      const qEmpty = modalQ(ALPHA_BARE_PANEL);

      // due situazioni fisiche diverse, due modelli diversi
      let qDamped = qEmpty;
      let alpha = 0;
      if (fill.fillFraction > 0) {
        if (placement === 'stuffing') {
          qDamped = Math.min(qEmpty, propagationQ(sigma, freqHz, tempC));
          alpha = 1 - Math.exp(-(2 * Math.PI) / Math.max(qDamped, 1e-3));
        } else {
          alpha = absorptionCoefficient(sigma, fill.pathMm, freqHz, tempC);
          qDamped = modalQ(Math.max(ALPHA_BARE_PANEL, alpha));
        }
      }
      const attenuationDb = Math.min(
        MAX_ATTENUATION_DB,
        20 * Math.log10(qEmpty / Math.max(qDamped, 1e-3)),
      );
      out.push({
        axis, dimensionMm: dMm, order: n, freqHz,
        alpha: Math.min(1, alpha), stillResonant: qDamped > 0.5,
        qEmpty, qDamped, attenuationDb,
      });
    }
  }
  return out.sort((a, b) => a.freqHz - b.freqHz);
}

// ─── Risultato completo ───────────────────────────────────────────────────────

export interface AbsorberInput {
  material: AbsorberId;
  placement: Placement;
  /** kg/m3; se assente usa il default del materiale */
  densityKgM3?: number;
  /** mm, solo per il rivestimento; se assente usa lo spessore tipico */
  liningThicknessMm?: number;
  dims: InternalDims;
  netVolumeL: number;
  tempC?: number;
}

export interface AbsorberResult {
  spec: AbsorberSpec;
  placement: Placement;
  densityKgM3: number;
  liningThicknessMm: number;
  fill: AbsorberFill;
  volume: ApparentVolume;
  losses: AbsorptionLosses;
  modes: StandingWave[];
  warnings: string[];
}

export function computeAbsorber(input: AbsorberInput): AbsorberResult {
  const spec = ABSORBERS[input.material];
  const placement: Placement = spec.id === 'none' ? 'none' : input.placement;
  const density = input.densityKgM3 ?? spec.defaultDensityKgM3;
  const lining = input.liningThicknessMm ?? spec.typicalLiningMm;
  const tempC = input.tempC ?? 20;

  const fill = absorberFill(spec, placement, density, lining, input.dims, input.netVolumeL);
  const volume = apparentVolume(spec, fill, density, input.netVolumeL);
  const losses = absorptionLosses(spec, fill, density, tempC);
  const modes = standingWaves(input.dims, spec, fill, density, volume.delta, placement, 3, tempC);

  const warnings: string[] = [];
  if (placement !== 'none' && !spec.suitable.includes(placement)) {
    warnings.push(
      `${spec.label}: ${PLACEMENT_LABELS[placement].toLowerCase()} non è l’impiego per cui è fatto — ${spec.bestUse.toLowerCase()}.`,
    );
  }
  if (placement !== 'none' && (density < spec.densityRange[0] || density > spec.densityRange[1])) {
    warnings.push(
      `Densità ${density} kg/m³ fuori dall’intervallo utilizzabile per questo materiale (${spec.densityRange[0]}–${spec.densityRange[1]} kg/m³).`,
    );
  }
  if (losses.saturated) {
    warnings.push(
      `Resistenza al flusso troppo alta (${losses.normalizedResistance.toFixed(1)} volte ρ₀c): a questa densità il materiale riflette invece di assorbire e si comporta da parete. Il Qa è fermo al fondo scala ${QA_FLOOR}.`,
    );
  }
  if (volume.fractionOfLimit > 0.75) {
    warnings.push(
      `Volume apparente al ${(volume.fractionOfLimit * 100).toFixed(0)}% del limite termico assoluto (γ − 1 = ${(MAX_VOLUME_GAIN * 100).toFixed(1)}%): oltre non si può andare per via termica, e i valori misurati in pratica si fermano prima.`,
    );
  }
  if (modes.some(m => !m.stillResonant)) {
    warnings.push(
      'Alcuni modi interni scendono sotto Q 0,5: a quel punto non sono più risonanze ma larghe gobbe. Gli abbattimenti nascono da un modello monodimensionale fra pareti rigide, quindi sono un limite superiore: in una cassa vera il modo non è puro e il pannello flette.',
    );
  }
  if (spec.caution) warnings.push(spec.caution);

  return { spec, placement, densityKgM3: density, liningThicknessMm: lining, fill, volume, losses, modes, warnings };
}
