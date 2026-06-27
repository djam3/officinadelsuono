/**
 * Cabinet Calculator — Motore di Calcolo Acustico Thiele-Small
 * 
 * Calcola il volume ottimale della cassa, la porta bass-reflex,
 * le dimensioni dei pannelli e il progetto completo per il falegname.
 * 
 * Basato sulle formule di Thiele-Small e le best practices
 * dell'ingegneria acustica professionale.
 */

import type {
  SpeakerDriver, CabinetDesign, CabinetType, CabinetPanel,
  PortDesign, BracingDesign, WoodType, PanelHole,
  UseCase, Environment,
} from '../types/speaker';
// Motore di calcolo acustico CONDIVISO con l'Admin (Strumenti Tecnici).
// Il configuratore DEVE usare queste funzioni per non divergere dai calcoli admin.
import {
  tsFromDriver, sealedFromQtc, ventedDesign, type AlignmentType,
} from './audio';

// ═══════════════════════════════════════════════════════════════════════════════
//  COSTANTI
// ═══════════════════════════════════════════════════════════════════════════════

const GOLDEN_RATIO = 1.618;

// Spessori legno standard (mm)
const WOOD_THICKNESS: Record<string, number> = {
  'standard': 18,
  'heavy': 21,
  'ultra': 25,
};

// ═══════════════════════════════════════════════════════════════════════════════
//  CALCOLO TIPO DI CASSA OTTIMALE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Determina il tipo di cassa più adatto in base al driver e all'uso
 */
export function recommendCabinetType(
  driver: SpeakerDriver,
  useCase: UseCase,
  environment: Environment
): CabinetType {
  const { qts, fs } = driver.thielSmall;

  // Regole basate su Qts (parametro chiave per la scelta del tipo di cassa)
  // Qts < 0.4 → bass-reflex ottimale
  // Qts 0.4-0.7 → sealed o bass-reflex
  // Qts > 0.7 → sealed preferibile

  // Subwoofer dedicato → sempre bass-reflex per max output
  if (useCase === 'subwoofer-dedicato') return 'bass-reflex';

  // Festival/outdoor → bass-reflex per max SPL
  if (useCase === 'dj-festival' || environment === 'outdoor') return 'bass-reflex';

  // Studio monitor → sealed per risposta più accurata
  if (useCase === 'studio-monitor') {
    return qts > 0.5 ? 'sealed' : 'bass-reflex';
  }

  // Home hi-fi → sealed per transienti migliori
  if (useCase === 'home-hifi' || useCase === 'cinema-home') {
    return qts > 0.45 ? 'sealed' : 'bass-reflex';
  }

  // DJ Club, Band, PA → bass-reflex per efficienza
  if (qts < 0.45) return 'bass-reflex';
  if (qts > 0.6) return 'sealed';

  return 'bass-reflex'; // default
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CALCOLO VOLUME CASSA CHIUSA (SEALED)
// ═══════════════════════════════════════════════════════════════════════════════

interface SealedResult {
  volume: number;           // litri volume interno
  qtc: number;             // Q totale del sistema
  f3: number;              // frequenza -3dB (Hz)
  peakingDb: number;       // eventuale picco di risonanza
}

/**
 * Calcola il volume ottimale per cassa chiusa
 * Target Qtc = 0.707 (Butterworth, massimamente piatto)
 *
 * Delega al motore acustico condiviso (audio/enclosure.ts) per garantire
 * risultati IDENTICI agli Strumenti Tecnici dell'Admin.
 */
export function calculateSealed(driver: SpeakerDriver, targetQtc: number = 0.707): SealedResult {
  const ts = tsFromDriver(driver);
  const s = sealedFromQtc(ts, targetQtc);
  return {
    volume: Math.max(s.vb, 3), // minimo 3 litri
    qtc: s.qtc,
    f3: Math.round(s.f3),
    peakingDb: Math.round(s.peakingDb * 10) / 10,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CALCOLO VOLUME BASS-REFLEX
// ═══════════════════════════════════════════════════════════════════════════════

interface BassReflexResult {
  volume: number;           // litri volume interno
  port: PortDesign;
  f3: number;              // frequenza -3dB (Hz)
  fb: number;              // frequenza di accordo porta (Hz)
}

/**
 * Calcola il volume ottimale per bass-reflex.
 *
 * Delega al motore acustico condiviso (audio/enclosure.ts), con la STESSA
 * logica dell'auto-design Admin:
 *  - allineamento scelto dal Qts (QB3 / B4 / C4)
 *  - Fb = 0.42·Fs·Qts^(-0.9) (accordo corretto, NON il vecchio 0.42·Fs fisso)
 *  - diametro porta scelto per tenere la velocità aria ≤ 17 m/s (no chuffing)
 */
export function calculateBassReflex(driver: SpeakerDriver): BassReflexResult {
  const ts = tsFromDriver(driver);

  // Allineamento in base al Qts (identico ad autoEnclosure)
  const alignment: AlignmentType = ts.qts < 0.3 ? 'QB3' : ts.qts > 0.45 ? 'C4' : 'B4';

  const MAX_VELOCITY = 17; // m/s — oltre si ha "chuffing" (rumore d'aria)
  const diameters = [50, 65, 80, 100, 120, 150, 180];
  const maxPorts = 4; // fino a 4 porte identiche per driver ad alta escursione

  // Cerca la combinazione (n. porte, diametro) col MINOR numero di porte e poi
  // minor diametro che mantiene la velocità ≤ 17 m/s. Più porte = più area
  // totale = velocità più bassa (la lunghezza di ciascuna porta cresce per
  // mantenere lo stesso accordo Fb).
  let chosen = ventedDesign(ts, alignment, diameters[diameters.length - 1], maxPorts);
  let found = false;
  for (let np = 1; np <= maxPorts && !found; np++) {
    for (const dv of diameters) {
      const test = ventedDesign(ts, alignment, dv, np);
      if (test.portVelocity <= MAX_VELOCITY) {
        chosen = test;
        found = true;
        break;
      }
    }
  }

  const v = chosen;
  const port: PortDesign = {
    shape: 'circular',
    diameter: v.portDiameter,
    length: Math.max(50, Math.round(v.portLength)),
    count: v.portCount,
    tuningFrequency: Math.round(v.fb),
    airVelocity: Math.round(v.portVelocity * 10) / 10,
  };

  return {
    volume: Math.max(v.vb, 3),
    port,
    f3: Math.round(v.f3),
    fb: Math.round(v.fb),
  };
}

// La porta bass-reflex è ora dimensionata dal motore acustico condiviso
// (audio/enclosure.ts → ventedDesign), che usa la formula di Helmholtz con
// correzione terminale e il controllo di velocità aria. Vedi calculateBassReflex.

// ═══════════════════════════════════════════════════════════════════════════════
//  CALCOLO DIMENSIONI PANNELLI
// ═══════════════════════════════════════════════════════════════════════════════

interface DimensionsResult {
  width: number;   // mm
  height: number;  // mm
  depth: number;   // mm
}

/**
 * Calcola le dimensioni esterne della cassa dal volume interno
 * Usa proporzioni auree per ottimizzare le risonanze interne
 */
export function calculateExternalDimensions(
  internalVolumeLiters: number,
  woodThickness: number,
  driver: SpeakerDriver,
  hasAmplifier: boolean
): DimensionsResult {
  // Volume interno in mm³
  const volumeMm3 = internalVolumeLiters * 1e6;

  // Dimensione minima frontale per ospitare il driver
  const minFrontWidth = (driver.overallDiameter || driver.size * 25.4 + 40) + 40; // +40mm margine
  const minFrontHeight = minFrontWidth + 60; // spazio extra sopra/sotto driver

  // Calcola le dimensioni interne basate su proporzioni auree
  // Rapporto ideale: 1 : 1.26 : 1.618 (per minimizzare risonanze stazionarie)
  const ratio1 = 1;
  const ratio2 = 1.26;
  const ratio3 = GOLDEN_RATIO;

  // V = W × H × D = x × (x × 1.26) × (x × 1.618)
  // V = x³ × 1.26 × 1.618
  // x = ³√(V / (1.26 × 1.618))
  const x = Math.cbrt(volumeMm3 / (ratio1 * ratio2 * ratio3));

  let internalWidth = Math.round(x * ratio1);
  let internalHeight = Math.round(x * ratio2);
  let internalDepth = Math.round(x * ratio3);

  // Assicura che il frontale sia abbastanza grande per il driver
  if (internalWidth < minFrontWidth) {
    const scale = minFrontWidth / internalWidth;
    internalWidth = minFrontWidth;
    // Ricalcola profondità per mantenere il volume
    internalDepth = Math.round(volumeMm3 / (internalWidth * internalHeight));
    if (internalDepth < 150) {
      internalDepth = 150;
      internalHeight = Math.round(volumeMm3 / (internalWidth * internalDepth));
    }
  }

  // Spazio extra per l'amplificatore (tipicamente dietro in basso)
  let extraDepth = 0;
  if (hasAmplifier) {
    extraDepth = 30; // 30mm extra per i connettori dell'amplificatore
  }

  return {
    width: internalWidth + 2 * woodThickness,
    height: internalHeight + 2 * woodThickness,
    depth: internalDepth + 2 * woodThickness + extraDepth,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GENERAZIONE PANNELLI PER IL FALEGNAME
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Genera la lista completa dei pannelli con fori e misure
 */
export function generatePanels(
  dimensions: DimensionsResult,
  woodThickness: number,
  woodType: WoodType,
  driver: SpeakerDriver,
  port: PortDesign | undefined,
  hasAmplifier: boolean,
  ampDimensions?: { width: number; height: number; depth: number }
): CabinetPanel[] {
  const { width, height, depth } = dimensions;
  const wt = woodThickness;

  // Dimensioni interne
  const internalW = width - 2 * wt;
  const internalH = height - 2 * wt;

  // ─── Pannello Frontale (Baffle) ─────────────────────────────────────────────
  const frontHoles: PanelHole[] = [];

  // Foro driver (centrato orizzontalmente, spostato leggermente verso l'alto)
  const driverMountDiameter = driver.mountingDiameter || (driver.size * 25.4 - 10);
  frontHoles.push({
    type: 'driver',
    shape: 'circle',
    diameter: driverMountDiameter,
    x: Math.round(internalW / 2),
    y: Math.round(internalH * 0.55), // leggermente sopra il centro
    label: `Foro driver ${driver.brand} ${driver.model} — Ø${driverMountDiameter}mm — 8 fori M6 su cerchio Ø${driverMountDiameter + 20}mm`,
  });

  // Fori porta bass-reflex (se presenti) — uno per ciascuna porta
  if (port && port.shape === 'circular' && port.diameter) {
    const portCount = Math.max(1, port.count ?? 1);
    const yPort = Math.round(internalH * 0.2); // basso sul frontale
    for (let i = 0; i < portCount; i++) {
      // Distribuisce le porte uniformemente sulla larghezza interna
      const x = Math.round((internalW * (i + 1)) / (portCount + 1));
      frontHoles.push({
        type: 'port',
        shape: 'circle',
        diameter: port.diameter,
        x,
        y: yPort,
        label: portCount > 1
          ? `Porta bass-reflex ${i + 1}/${portCount} Ø${port.diameter}mm — tubo lungo ${port.length}mm`
          : `Porta bass-reflex Ø${port.diameter}mm — tubo lungo ${port.length}mm`,
      });
    }
  } else if (port && port.shape === 'slot' && port.slotWidth && port.slotHeight) {
    // Porta a SLOT (rettangolare) — fessura larga in basso sul frontale
    frontHoles.push({
      type: 'port',
      shape: 'rounded-rect',
      width: port.slotWidth,
      height: port.slotHeight,
      cornerRadius: Math.min(10, Math.round(port.slotHeight / 2)),
      x: Math.round(internalW / 2),
      y: Math.round(port.slotHeight / 2) + 12, // appoggiata sopra il bordo inferiore
      label: `Porta bass-reflex a SLOT ${port.slotWidth}×${port.slotHeight}mm — condotto profondo ${port.length}mm`,
    });
  }

  const panels: CabinetPanel[] = [
    {
      id: 'front',
      name: 'Pannello Frontale (Baffle)',
      width: width,
      height: height,
      thickness: wt,
      quantity: 1,
      material: woodType,
      holes: frontHoles,
      notes: `Doppio spessore consigliato (${wt * 2}mm) per ridurre risonanze. Fori per T-nut M6 sul retro.`,
    },
    {
      id: 'rear',
      name: 'Pannello Posteriore',
      width: width,
      height: height,
      thickness: wt,
      quantity: 1,
      material: woodType,
      holes: hasAmplifier && ampDimensions ? [
        {
          type: 'amplifier',
          shape: 'rectangle',
          width: ampDimensions.width + 10,
          height: ampDimensions.height + 10,
          x: Math.round(internalW / 2),
          y: Math.round(internalH * 0.3),
          label: `Sede amplificatore ${ampDimensions.width}×${ampDimensions.height}mm — con fori fissaggio M4`,
        },
        {
          type: 'connector',
          shape: 'rectangle',
          width: 85,
          height: 45,
          x: Math.round(internalW / 2),
          y: Math.round(internalH * 0.1),
          label: 'Presa IEC / interruttore / fusibile — 85×45mm',
        }
      ] : [
        {
          type: 'connector',
          shape: 'rectangle',
          width: 85,
          height: 85,
          x: Math.round(internalW / 2),
          y: Math.round(internalH * 0.25),
          label: 'Terminale Speakon — piastra 85×85mm',
        }
      ],
      notes: hasAmplifier
        ? 'Fresatura per sede amplificatore. Prevedere apertura ventilazione 60×30mm sopra la sede amplificatore.'
        : 'Foro terminale Speakon con fori M4 per fissaggio piastra.',
    },
    {
      id: 'side-left',
      name: 'Pannello Laterale Sinistro',
      width: depth - 2 * wt,
      height: height,
      thickness: wt,
      quantity: 1,
      material: woodType,
      holes: [
        {
          type: 'handle',
          shape: 'rounded-rect',
          width: 160,
          height: 60,
          cornerRadius: 15,
          x: Math.round((depth - 2 * wt) / 2),
          y: Math.round(height * 0.7),
          label: 'Maniglia incassata 160×60mm — profondità 30mm',
        }
      ],
      notes: 'Fresatura maniglia profondità 30mm.',
    },
    {
      id: 'side-right',
      name: 'Pannello Laterale Destro',
      width: depth - 2 * wt,
      height: height,
      thickness: wt,
      quantity: 1,
      material: woodType,
      holes: [
        {
          type: 'handle',
          shape: 'rounded-rect',
          width: 160,
          height: 60,
          cornerRadius: 15,
          x: Math.round((depth - 2 * wt) / 2),
          y: Math.round(height * 0.7),
          label: 'Maniglia incassata 160×60mm — profondità 30mm',
        }
      ],
      notes: 'Speculare al pannello sinistro.',
    },
    {
      id: 'top',
      name: 'Pannello Superiore',
      width: width - 2 * wt,
      height: depth - 2 * wt,
      thickness: wt,
      quantity: 1,
      material: woodType,
      notes: 'Incastro tra i laterali.',
    },
    {
      id: 'bottom',
      name: 'Pannello Inferiore',
      width: width - 2 * wt,
      height: depth - 2 * wt,
      thickness: wt,
      quantity: 1,
      material: woodType,
      holes: [
        {
          type: 'vent',
          shape: 'circle',
          diameter: 8,
          x: 30,
          y: 30,
          label: '4 piedini in gomma M8 — posizioni angolari a 30mm dai bordi',
        }
      ],
      notes: '4 fori M8 per piedini in gomma anti-risonanza a 30mm dagli angoli.',
    },
  ];

  return panels;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GENERAZIONE RINFORZI INTERNI
// ═══════════════════════════════════════════════════════════════════════════════

export function generateBracing(
  dimensions: DimensionsResult,
  woodThickness: number,
  woodType: WoodType,
  driver: SpeakerDriver
): BracingDesign[] {
  const braces: BracingDesign[] = [];
  const { height } = dimensions;

  // Rinforzo window a metà altezza (se cassa > 400mm)
  if (height > 400) {
    braces.push({
      type: 'window',
      position: Math.round(height * 0.5),
      material: woodType,
      thickness: woodThickness,
      description: `Rinforzo "window" a ${Math.round(height * 0.5)}mm dal fondo — foro centrale 60% della superficie per passaggio aria`,
    });
  }

  // Rinforzo shelf dietro il driver (per casse > 500mm)
  if (height > 500) {
    braces.push({
      type: 'shelf',
      position: Math.round(height * 0.7),
      material: woodType,
      thickness: woodThickness,
      description: `Shelf brace a ${Math.round(height * 0.7)}mm — larghezza 80mm, incollato ai laterali`,
    });
  }

  return braces;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CALCOLO COMPLETO DELLA CASSA
// ═══════════════════════════════════════════════════════════════════════════════

export interface FullCalculationResult {
  cabinetDesign: CabinetDesign;
  acousticData: {
    f3: number;
    fb?: number;
    qtc?: number;
    peakingDb?: number;
  };
}

/**
 * Calcola il progetto completo della cassa per un driver dato
 */
export function calculateFullCabinet(
  driver: SpeakerDriver,
  cabinetType: CabinetType,
  useCase: UseCase,
  _environment: Environment,
  hasAmplifier: boolean = true,
  ampDimensions?: { width: number; height: number; depth: number }
): FullCalculationResult {

  // Determina spessore legno in base alla potenza
  let woodThickness = WOOD_THICKNESS['standard']; // 18mm
  if (driver.powerRMS > 800) woodThickness = WOOD_THICKNESS['heavy']; // 21mm
  if (driver.powerRMS > 1500) woodThickness = WOOD_THICKNESS['ultra']; // 25mm

  const woodType: WoodType = driver.powerRMS > 500 ? 'MDF-HDF' : 'MDF';

  let internalVolume: number;
  let port: PortDesign | undefined;
  let f3: number;
  let fb: number | undefined;
  let qtc: number | undefined;
  let peakingDb: number | undefined;

  // Calcola volume e parametri acustici
  if (cabinetType === 'sealed') {
    const result = calculateSealed(driver);
    internalVolume = result.volume;
    f3 = result.f3;
    qtc = result.qtc;
    peakingDb = result.peakingDb;
  } else {
    // bass-reflex (default)
    const result = calculateBassReflex(driver);
    internalVolume = result.volume;
    port = result.port;
    f3 = result.f3;
    fb = result.fb;
  }

  // Calcola dimensioni esterne
  const dimensions = calculateExternalDimensions(
    internalVolume, woodThickness, driver, hasAmplifier
  );

  // Per i subwoofer grandi (≥15"), converti la porta tonda in porta a SLOT
  // (rettangolare), come fanno i costruttori pro: stessa area/accordo, ma una
  // fessura larga e bassa sul frontale. Più elegante e meno profonda di un tubo.
  if (port && port.shape === 'circular' && port.diameter && driver.size >= 15) {
    const internalW = dimensions.width - 2 * woodThickness;
    const areaTot = Math.PI * Math.pow(port.diameter / 2, 2) * (port.count || 1); // mm²
    const slotWidth = Math.round(internalW * 0.75);
    const slotHeight = Math.max(20, Math.round(areaTot / slotWidth));
    port = {
      shape: 'slot',
      slotWidth,
      slotHeight,
      length: port.length,
      count: 1,
      tuningFrequency: port.tuningFrequency,
      airVelocity: port.airVelocity,
    };
  }

  // Genera pannelli
  const panels = generatePanels(
    dimensions, woodThickness, woodType, driver, port, hasAmplifier, ampDimensions
  );

  // Genera rinforzi
  const bracing = generateBracing(dimensions, woodThickness, woodType, driver);

  // Volume lordo (volume interno + pannelli)
  const grossVolume = (dimensions.width * dimensions.height * dimensions.depth) / 1e6; // litri

  // Peso stimato
  // Densità MDF ≈ 730 kg/m³
  const totalPanelVolume = panels.reduce((acc, p) =>
    acc + (p.width * p.height * p.thickness * p.quantity) / 1e9, 0);
  const estimatedWeight = Math.round(totalPanelVolume * 730 * 10) / 10;

  // Diametro taglio driver
  const driverCutout = {
    diameter: driver.mountingDiameter || Math.round(driver.size * 25.4 - 10),
    boltCircle: (driver.mountingDiameter || Math.round(driver.size * 25.4 - 10)) + 20,
    boltCount: driver.size >= 15 ? 8 : 6,
    boltSize: driver.size >= 15 ? 'M8' : 'M6',
  };

  // Sede amplificatore
  const ampCutout = hasAmplifier && ampDimensions ? {
    width: ampDimensions.width + 10,
    height: ampDimensions.height + 10,
    position: 'rear' as const,
  } : undefined;

  // Maniglie
  const handleCutouts = driver.size >= 12 ? {
    width: 160,
    height: 60,
    position: 'sides' as const,
  } : undefined;

  // Griglia frontale di protezione — copre il baffle con 8mm di margine per lato
  const isPro = ['dj-club', 'dj-festival', 'pa-events', 'band-live'].includes(useCase);
  const grilleSpec = {
    width: Math.round(dimensions.width - 16),
    height: Math.round(dimensions.height - 16),
    frameDepthMm: 14,
    mount: isPro ? 'Telaio metallico forato + viti M5 con gommini anti-vibrazione' : 'Telaio in tessuto acustico su magneti al neodimio',
    fixingPoints: dimensions.height > 600 ? 8 : 6,
  };

  // Angolari di protezione — necessari per uso pro/touring o casse grandi
  const cornersNeeded = isPro || driver.size >= 15;
  const cornerProtectors = {
    needed: cornersNeeded,
    count: cornersNeeded ? 8 : 0,
    type: 'ABS rinforzato a sfera (con foro maniglia se richiesto)',
  };

  // Nome progetto
  const cabinetName = `${driver.brand} ${driver.model} — ${cabinetType === 'sealed' ? 'Cassa Chiusa' : 'Bass Reflex'} ${Math.round(internalVolume)}L`;

  // Note assemblaggio per il falegname
  const assemblyNotes = generateAssemblyNotes(cabinetType, driver, woodType, woodThickness, port);
  // Griglia frontale
  assemblyNotes.push(`Griglia frontale ${grilleSpec.width}×${grilleSpec.height}mm — ${grilleSpec.mount} (${grilleSpec.fixingPoints} punti di fissaggio)`);
  // Angolari di protezione
  if (cornerProtectors.needed) {
    assemblyNotes.push(`${cornerProtectors.count} angolari di protezione ${cornerProtectors.type} — uno per ogni spigolo`);
  }
  // Porta a slot
  if (port && port.shape === 'slot' && port.slotWidth) {
    assemblyNotes.push(`Porta bass-reflex a slot ${port.slotWidth}×${port.slotHeight}mm: condotto interno a "L" lungo ${port.length}mm con bordi smussati (raggio 8mm)`);
  }
  // Predisposizione amplificatore / connettore
  if (hasAmplifier && ampDimensions) {
    assemblyNotes.push(`Sede modulo amplificatore ${ampDimensions.width}×${ampDimensions.height}mm sul retro (misure da scheda tecnica) + apertura ventilazione e presa IEC`);
  } else {
    assemblyNotes.push('Cassa PASSIVA: predisporre slot per piastra connettore Speakon NL4 (85×85mm) sul retro');
  }

  const cabinetDesign: CabinetDesign = {
    type: cabinetType,
    name: cabinetName,
    internalVolume: Math.round(internalVolume * 10) / 10,
    grossVolume: Math.round(grossVolume * 10) / 10,
    externalDimensions: {
      width: Math.round(dimensions.width),
      height: Math.round(dimensions.height),
      depth: Math.round(dimensions.depth),
    },
    woodType,
    woodThickness,
    port,
    panels,
    bracing,
    dampingMaterial: driver.type === 'subwoofer'
      ? 'Lana di roccia 50mm densità 40kg/m³'
      : 'Lana di roccia 40mm densità 30kg/m³',
    dampingCoverage: cabinetType === 'sealed'
      ? 'Tutte le pareti interne (100%)'
      : 'Pareti laterali, superiore e inferiore (no frontale, no posteriore)',
    driverCutout,
    ampCutout,
    handleCutouts,
    grilleSpec,
    cornerProtectors,
    // Di default la cassa è mostrata in LEGNO GREZZO alle misure reali.
    // Le finiture (nero/bianco) si applicano solo se scelte dal cliente (step 4).
    finish: 'natural',
    estimatedWeight,
    assemblyNotes,
  };

  return {
    cabinetDesign,
    acousticData: { f3, fb, qtc, peakingDb },
  };
}

/**
 * Genera le istruzioni di assemblaggio per il falegname
 */
function generateAssemblyNotes(
  type: CabinetType,
  driver: SpeakerDriver,
  woodType: WoodType,
  thickness: number,
  port?: PortDesign,
): string[] {
  const notes: string[] = [
    `Materiale: ${woodType} spessore ${thickness}mm`,
    `Tutti i giunti incollati con colla vinilica D3 + viti autoforanti 4×40mm ogni 100mm`,
    `Sigillare tutti i giunti interni con silicone acustico trasparente`,
    `Frontale a doppio spessore: incollare due pannelli da ${thickness}mm`,
    `Predisporre fori per T-nut ${driver.size >= 15 ? 'M8' : 'M6'} sul retro del baffle`,
  ];

  if (type === 'bass-reflex' && port) {
    notes.push(
      `Porta bass-reflex: tubo PVC Ø${port.diameter}mm × ${port.length}mm — smussare i bordi con raggio 5mm`,
      `Posizionare la porta lontano dal driver per evitare turbolenze`
    );
  }

  if (driver.size >= 15) {
    notes.push(
      'Rinforzi interni obbligatori — vedi schema rinforzi nel progetto',
      'Prevedere maniglie incassate laterali (fresatura 30mm profondità)'
    );
  }

  notes.push(
    'Carteggiare tutte le superfici esterne prima della finitura (grana 120 → 240)',
    'Applicare 2 mani di fondo + 2 mani di vernice testurizzata',
    'NON applicare finitura/vernice sulle superfici di incollaggio'
  );

  return notes;
}


// ═══════════════════════════════════════════════════════════════════════════════
//  ABBINAMENTO AMPLIFICATORE
// ═══════════════════════════════════════════════════════════════════════════════

export interface AmpMatchResult {
  amplifierId: string;
  score: number;          // 0-100
  reasons: string[];
  warnings: string[];
}

/**
 * Valuta la compatibilità di un amplificatore con un driver
 */
export function scoreAmplifierMatch(
  driver: SpeakerDriver,
  amp: import('../types/speaker').Amplifier,
  useCase: UseCase
): AmpMatchResult {
  let score = 50; // base
  const reasons: string[] = [];
  const warnings: string[] = [];

  // ─── Compatibilità impedenza ─────────────────────────────────────────────
  if (!amp.impedanceRange.includes(driver.impedance)) {
    score -= 50;
    warnings.push(`Impedenza driver ${driver.impedance}Ω non supportata dall'amplificatore`);
  } else {
    score += 10;
    reasons.push(`Impedenza ${driver.impedance}Ω compatibile`);
  }

  // ─── Potenza adeguata ────────────────────────────────────────────────────
  // Best practice pro-audio: ampli RMS = 1.5–2× la potenza continua (AES/RMS)
  // del driver, CON limiter tarato a proteggere il driver.
  // Un ampli 1:1 va in clipping ai picchi e il clipping distrugge i driver.
  // Sottodimensionato è il caso più pericoloso (clipping costante).
  const ampPower = amp.powerPerChannel[String(driver.impedance)] || 0;
  const powerRatio = ampPower / driver.powerRMS;

  if (powerRatio >= 1.5 && powerRatio <= 2.2) {
    // zona ideale: massimo headroom pulito, limiter protegge il driver
    score += 25;
    reasons.push(`Potenza ${ampPower}W ideale per driver ${driver.powerRMS}W RMS (1.5–2× con limiter)`);
  } else if (powerRatio > 2.2 && powerRatio <= 3) {
    // accettabile ma richiede limiter tarato con cura
    score += 12;
    warnings.push(`Ampli molto potente (${ampPower}W vs ${driver.powerRMS}W) — limiter OBBLIGATORIO e ben tarato`);
  } else if (powerRatio > 3) {
    // rischioso: facile mandare il driver oltre Xmax/termico per errore
    score -= 10;
    warnings.push(`Ampli sovradimensionato oltre 3× (${ampPower}W vs ${driver.powerRMS}W) — rischio danno se il limiter è errato`);
  } else if (powerRatio >= 1.0) {
    // sufficiente ma poco headroom: rischio clipping ai picchi
    score += 10;
    warnings.push(`Headroom limitato (${ampPower}W vs ${driver.powerRMS}W) — consigliato ≥1.5× per evitare clipping`);
  } else if (powerRatio >= 0.5) {
    score -= 5;
    warnings.push(`Ampli sottodimensionato (${ampPower}W per driver da ${driver.powerRMS}W) — rischio clipping che danneggia il driver`);
  } else {
    score -= 25;
    warnings.push(`Ampli gravemente sottodimensionato (${ampPower}W per driver da ${driver.powerRMS}W)`);
  }

  // ─── DSP per uso professionale ───────────────────────────────────────────
  if (['dj-club', 'dj-festival', 'pa-events', 'band-live'].includes(useCase)) {
    if (amp.hasDSP) {
      score += 15;
      reasons.push('DSP integrato essenziale per uso professionale');
    } else {
      score -= 10;
      warnings.push('Nessun DSP — consigliato processore esterno per uso pro');
    }
  }

  // ─── Bluetooth per uso casalingo ─────────────────────────────────────────
  if (['home-hifi', 'cinema-home'].includes(useCase)) {
    if (amp.inputs.includes('Bluetooth 5.0') || amp.inputs.includes('Bluetooth 5.0 aptX')) {
      score += 10;
      reasons.push('Bluetooth integrato per comodità domestica');
    }
  }

  // ─── Qualità audio (THD e SNR) ───────────────────────────────────────────
  if (amp.thd < 0.01) {
    score += 10;
    reasons.push(`Distorsione bassissima (${amp.thd}%)`);
  }
  if (amp.snr > 110) {
    score += 5;
    reasons.push(`SNR eccellente (${amp.snr}dB)`);
  }

  return {
    amplifierId: amp.id,
    score: Math.max(0, Math.min(100, score)),
    reasons,
    warnings,
  };
}
