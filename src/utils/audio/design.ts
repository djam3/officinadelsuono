/**
 * Orchestratore di progetto: da parametri T/S + scelte dell'utente a progetto
 * completo (volume, accordo, condotto, dimensioni, lista di taglio, curve).
 */

import {
  sealedFromQtc, sealedFromVb, ventedDesign, alignmentRatios,
  bandpass4thOrder, bandpass4Response, bandpass6thOrder,
  bandpass6Response, passiveRadiatorTuning,
} from './enclosure';
import {
  PORT_TYPES, autoSizePort, describePort, equivalentDiameter, portDisplacement,
  portFit, portLengthFor, totalPortArea, tuningOf, velocityCheck,
  type PortGeometry, type PortPanel, type PortType,
} from './ports';
import { computeResponse } from './response';
import { computeMaxOutput, ventVelocityCurve, applyRoomGain, type RoomPreset, type MaxOutputResult } from './performance';
import {
  DAMPING_SPECS, GOLDEN_RATIO, cuttingList, dimensionsFromVolume, driverDisplacement,
  estimatedWeight, grossFromNet, internalVolume, totalPanelArea, volumeBreakdown,
} from './geometry';
import type {
  AlignmentType, BoxDimensions, BoxShape, CurvePoint, CutPanel, DampingLevel,
  EnclosureType, ResponseCurves, TSParams, VolumeBreakdown,
} from './types';

export interface DesignInput {
  ts: TSParams;
  enclosure: EnclosureType;
  alignment: AlignmentType;

  /** override manuali del progetto acustico */
  customVbL?: number;
  customFbHz?: number;
  targetQtc?: number;

  /** condotto: geometria scelta e misure (se assenti vengono dimensionate) */
  portType: PortType;
  portCount: number;
  portDiameterMm?: number;
  slotWidthMm?: number;
  slotHeightMm?: number;
  triLegAMm?: number;
  triLegBMm?: number;

  /** bandpass: rapporto volumi camera anteriore/posteriore */
  bandpassS?: number;

  /** radiatore passivo */
  prVasL?: number;
  prSdCm2?: number;

  /** costruzione */
  shape: BoxShape;
  wallThicknessMm: number;
  damping: DampingLevel;
  useGoldenRatio: boolean;
  fixedWidthMm?: number;
  fixedHeightMm?: number;
  taper?: number;
  bracingPercent?: number;
  mountingDepthMm?: number;
  /** numero di driver FISICI presenti nella cassa (per l'ingombro) */
  driverCount: number;

  /** simulazione */
  powerW: number;
  roomPreset: RoomPreset;
}

export interface PortResult {
  geometry: PortGeometry;
  typeLabel: string;
  /** lunghezza sviluppata sull'asse (mm) */
  lengthMm: number;
  areaCm2: number;
  equivalentDiameterMm: number;
  velocity: number;        // m/s al massimo spostamento
  velocityLimit: number;   // soglia di questa geometria
  velocityOk: boolean;
  minAreaCm2: number;      // criterio di Small
  description: string;
  /** tratti di sviluppo, noti solo dopo aver dimensionato la cassa */
  segments?: { name: string; lengthMm: number }[];
  /** pannelli necessari a costruirlo */
  panels?: PortPanel[];
}

/** Costruisce la geometria dai dati inseriti, o la dimensiona se mancano */
function resolvePortGeometry(input: DesignInput, fbHz: number, sdCm2: number, xmaxMm: number): PortGeometry {
  const spec = PORT_TYPES[input.portType];
  const count = Math.max(1, input.portCount);

  const given: PortGeometry = { type: input.portType, count };
  if (spec.section === 'circular' && input.portDiameterMm) {
    return { ...given, diameterMm: input.portDiameterMm };
  }
  if (spec.section === 'rectangular' && input.slotWidthMm && input.slotHeightMm) {
    return { ...given, widthMm: input.slotWidthMm, heightMm: input.slotHeightMm };
  }
  if (spec.section === 'triangular' && input.triLegAMm && input.triLegBMm) {
    return { ...given, legAMm: input.triLegAMm, legBMm: input.triLegBMm };
  }
  return autoSizePort(input.portType, count, fbHz, sdCm2, xmaxMm);
}

/**
 * Progetto del condotto: misure, accordo e verifica della velocità.
 *
 * Restituisce anche `actualFbHz`, che coincide con quello richiesto tranne
 * quando la sezione scelta è troppo grande per accordare così in alto: in quel
 * caso il condotto dovrebbe essere più corto del minimo costruttivo, e la
 * cassa accorderà davvero più in basso. Meglio dichiararlo che mostrare un
 * numero che il mobile non rispetterà.
 */
function designPort(
  input: DesignInput,
  fbHz: number,
  vbL: number,
): { port: PortResult; warnings: string[]; actualFbHz: number } {
  const warnings: string[] = [];
  const sd = input.ts.sd ?? 500;
  const xmax = input.ts.xmax ?? 6;

  const geometry = resolvePortGeometry(input, fbHz, sd, xmax);
  const len = portLengthFor(geometry, fbHz, vbL);
  const lengthMm = len.lengthMm;

  // con la lunghezza minima l'accordo reale non è più quello chiesto
  const actualFbHz = len.unreachable ? tuningOf(geometry, lengthMm, vbL) : fbHz;
  if (len.unreachable) {
    warnings.push(
      `Con questa sezione l'accordo di ${Math.round(fbHz)} Hz non è raggiungibile: servirebbe un condotto di ${Math.round(len.rawMm)} mm, sotto il minimo costruibile. Al minimo di ${lengthMm} mm la cassa accorda a ${actualFbHz.toFixed(1)} Hz — i calcoli che seguono usano questo valore. Per salire serve una sezione più piccola.`,
    );
  }

  const vc = velocityCheck(geometry, actualFbHz, sd, xmax);
  const areaCm2 = totalPortArea(geometry);
  const spec = PORT_TYPES[geometry.type];

  if (!vc.ok) {
    warnings.push(
      `Velocità in porta ${vc.velocity.toFixed(1)} m/s contro i ${vc.limit} m/s che questa geometria tollera: allarga la sezione, aggiungi un condotto o passa a uno svasato.`,
    );
  }
  // il 2% di margine evita che l'avviso scatti quando l'area coincide col minimo
  if (areaCm2 < vc.minAreaCm2 * 0.98) {
    warnings.push(`Area ${areaCm2.toFixed(0)} cm² sotto il minimo di Small (${vc.minAreaCm2.toFixed(0)} cm²) per questo accordo.`);
  }
  if (spec.sharedWalls > 0) {
    warnings.push(`${spec.label}: ${spec.sharedWalls === 1 ? 'una parete della cassa fa' : 'due pareti della cassa fanno'} da lato del condotto, quindi il volume sottratto è minore di uno slot indipendente.`);
  }

  return {
    port: {
      geometry,
      typeLabel: spec.label,
      lengthMm: Math.round(lengthMm),
      areaCm2,
      equivalentDiameterMm: equivalentDiameter(geometry),
      velocity: vc.velocity,
      velocityLimit: vc.limit,
      velocityOk: vc.ok,
      minAreaCm2: vc.minAreaCm2,
      description: describePort(geometry, lengthMm),
    },
    warnings,
    actualFbHz,
  };
}

export interface AcousticResult {
  vbL: number;           // volume netto richiesto
  fbHz?: number;         // accordo (vented / PR / bandpass)
  fcHz?: number;         // risonanza di sistema (sealed)
  qtc?: number;
  f3Hz: number;
  alpha: number;
  peakingDb?: number;
  port?: PortResult;
  /** bandpass: volumi delle due camere */
  chambers?: { rearL: number; frontL: number; fLow: number; fHigh: number; fbFront?: number };
  /** radiatore passivo: massa mobile TOTALE che deve avere (zavorra inclusa) */
  prTotalMassG?: number;
  warnings: string[];
}

export interface DesignResult {
  acoustic: AcousticResult;
  volumes: VolumeBreakdown;
  dimensions: BoxDimensions;
  panels: CutPanel[];
  panelAreaM2: number;
  weightKg: number;
  curves: ResponseCurves | null;
  splWithRoom: CurvePoint[] | null;
  maxOutput: MaxOutputResult | null;
  ventVelocity: CurvePoint[] | null;
  /** true se il modello completo (escursione/impedenza) non è disponibile */
  simplifiedModel: boolean;
}


// ─── Progetto acustico ────────────────────────────────────────────────────────

function designSealed(input: DesignInput): AcousticResult {
  const { ts } = input;
  const warnings: string[] = [];
  const res = input.customVbL
    ? sealedFromVb(ts, input.customVbL)
    : sealedFromQtc(ts, input.targetQtc ?? 0.707);

  if (res.qtc > 1.1) warnings.push(`Qtc ${res.qtc.toFixed(2)}: cassa molto piccola, risposta gonfia e poco controllata.`);
  if (res.qtc < 0.5) warnings.push(`Qtc ${res.qtc.toFixed(2)}: cassa molto grande, basso smorzato ma poco esteso.`);

  return {
    vbL: res.vb, fcHz: res.fc, qtc: res.qtc, f3Hz: res.f3,
    alpha: res.alpha, peakingDb: res.peakingDb, warnings,
  };
}

function designVented(input: DesignInput): AcousticResult {
  const { ts } = input;

  // volume e accordo dall'allineamento scelto, o imposti dall'utente
  let vb: number, fb: number, alpha: number;
  if (input.customVbL && input.customFbHz) {
    vb = input.customVbL;
    fb = input.customFbHz;
    alpha = ts.vas / vb;
  } else {
    const ql = DAMPING_SPECS[input.damping].qa > 20 ? 10 : 7;
    const r = alignmentRatios(ts, input.alignment, ql);
    alpha = r.alpha;
    vb = ts.vas / alpha;
    fb = r.h * ts.fs;
  }

  // F3 provvisorio: viene sostituito da quello misurato sulla curva reale
  const f3 = 0.26 * ts.fs * Math.pow(ts.qts, -1.4);
  const { port, warnings, actualFbHz } = designPort(input, fb, vb);

  // Il B4 esiste a un solo Qts: con un driver diverso non è realizzabile
  if (input.alignment === 'B4' && !(input.customVbL && input.customFbHz)) {
    const dev = Math.abs(ts.qts - 0.3827) / 0.3827;
    if (dev > 0.12) {
      warnings.push(
        `Il Butterworth 4° ordine si realizza solo con Qts ≈ 0.38, mentre questo driver ha Qts ${ts.qts.toFixed(2)}: il risultato non sarà massimamente piatto. Con Qts più basso conviene il QB3, con Qts più alto il C4. La curva mostrata è comunque quella reale.`,
      );
    }
  }

  // se la sezione non consente l'accordo chiesto, vale quello reale
  return { vbL: vb, fbHz: actualFbHz, f3Hz: f3, alpha, port, warnings };
}

function designPassiveRadiator(input: DesignInput): AcousticResult {
  const { ts } = input;
  const warnings: string[] = [];
  // il volume si dimensiona come un reflex, l'accordo lo fa la massa del PR
  const base = ventedDesign(ts, input.alignment, 100, 1, 0.732,
    input.customVbL && input.customFbHz ? { vbL: input.customVbL, fb: input.customFbHz } : undefined);

  const prVas = input.prVasL ?? ts.vas * 1.5;
  const prSd = input.prSdCm2 ?? (ts.sd ?? 500) * 1.5;
  const tuning = passiveRadiatorTuning({ vbL: base.vb, fbTarget: base.fb, prVasL: prVas, prSdCm2: prSd });

  warnings.push('Il radiatore passivo deve avere Sd e volume spostabile almeno pari al doppio del driver, altrimenti va in fondo corsa prima del previsto.');
  warnings.push(`La massa indicata è quella mobile TOTALE del radiatore: la zavorra da aggiungere è la differenza rispetto a quanto pesa già il PR che scegli (dato di targa del costruttore).`);

  return {
    vbL: base.vb, fbHz: base.fb, f3Hz: base.f3, alpha: base.alpha,
    prTotalMassG: tuning.totalMassG, warnings,
  };
}

function designBandpass(input: DesignInput, order: 4 | 6): AcousticResult {
  const { ts } = input;
  const warnings: string[] = [];
  const np = Math.max(1, input.portCount);
  const dv = input.portDiameterMm ?? 100;

  if (order === 4) {
    const S = input.bandpassS ?? 0.7;
    const alpha = ts.vas / (input.customVbL ?? sealedFromQtc(ts, 0.707).vb);
    const bp = bandpass4thOrder(ts, { S, alpha, dvMm: dv, np });
    // il condotto appartiene alla camera anteriore: si dimensiona sul suo volume
    const { port, warnings: portWarnings, actualFbHz } = designPort(input, bp.fb, bp.vfL);
    warnings.push('Bandpass 4° ordine: il driver è nascosto e tutta l’emissione passa dal condotto, quindi la velocità dell’aria va controllata con particolare attenzione.');
    warnings.push(...portWarnings);
    return {
      vbL: bp.vrL + bp.vfL, fbHz: actualFbHz, f3Hz: bp.fL, alpha,
      chambers: { rearL: bp.vrL, frontL: bp.vfL, fLow: bp.fL, fHigh: bp.fH },
      port, warnings,
    };
  }

  const bp = bandpass6thOrder(ts, { S: input.bandpassS ?? 0.6, dvMm: dv, np });
  const { port, warnings: portWarnings, actualFbHz } = designPort(input, bp.fbFront, bp.vfL);
  warnings.push('Bandpass 6° ordine: due camere accordate, banda più larga ma taratura critica. Progetto di partenza da rifinire con misura.');
  warnings.push(...portWarnings);
  return {
    vbL: bp.vrL + bp.vfL, fbHz: bp.fbRear, f3Hz: bp.fL, alpha: ts.vas / bp.vrL,
    chambers: { rearL: bp.vrL, frontL: bp.vfL, fLow: bp.fL, fHigh: bp.fH, fbFront: bp.fbFront },
    port, warnings,
  };
}


// ─── Progetto completo ────────────────────────────────────────────────────────

export function computeDesign(input: DesignInput): DesignResult {
  // 1. progetto acustico
  let acoustic: AcousticResult;
  switch (input.enclosure) {
    case 'sealed': acoustic = designSealed(input); break;
    case 'vented': acoustic = designVented(input); break;
    case 'passive-radiator': acoustic = designPassiveRadiator(input); break;
    case 'bandpass4': acoustic = designBandpass(input, 4); break;
    case 'bandpass6': acoustic = designBandpass(input, 6); break;
  }

  // 2. l'assorbente fa "sembrare" la cassa più grande: il volume fisico
  //    necessario è minore di quello acustico richiesto
  const damping = DAMPING_SPECS[input.damping];
  const physicalNetL = acoustic.vbL / (1 + damping.volumeGain);

  // 3. ingombri interni
  const driverDispL = driverDisplacement(
    input.ts.sd ?? 500,
    input.mountingDepthMm ?? 100,
    input.driverCount,
  );
  const portBuild = acoustic.port
    ? portDisplacement(acoustic.port.geometry, acoustic.port.lengthMm, input.wallThicknessMm)
    : null;
  const portDispL = portBuild?.displacementL ?? 0;

  const bracingPercent = input.bracingPercent ?? 3;
  const grossNeeded = grossFromNet(physicalNetL, { driverDispL, portDispL, bracingPercent });

  // 4. geometria
  const dimensions = dimensionsFromVolume(grossNeeded, {
    shape: input.shape,
    wallThickness: input.wallThicknessMm,
    ratio: input.useGoldenRatio ? GOLDEN_RATIO : undefined,
    fixedWidth: input.fixedWidthMm,
    fixedHeight: input.fixedHeightMm,
    taper: input.taper,
  });

  const volumes = volumeBreakdown({
    grossL: internalVolume(dimensions),
    driverDispL,
    portDispL,
    bracingPercent,
    damping: input.damping,
  });

  // 4b. verifica che il condotto entri davvero nella cassa appena dimensionata
  if (acoustic.port && portBuild) {
    const t = input.wallThicknessMm;
    const fit = portFit(acoustic.port.geometry, acoustic.port.lengthMm, {
      internalWidthMm: dimensions.width - 2 * t,
      internalHeightMm: dimensions.height - 2 * t,
      internalDepthMm: dimensions.depth - 2 * t,
    });
    acoustic.port.segments = fit.segments;
    acoustic.port.panels = portBuild.panels;
    acoustic.warnings = [...acoustic.warnings, ...fit.warnings];
  }

  const panels = cuttingList(dimensions);
  if (portBuild) {
    panels.push(...portBuild.panels.map(p => ({
      name: p.name,
      width: p.widthMm,
      height: p.heightMm,
      thickness: input.wallThicknessMm,
      quantity: p.quantity,
      note: 'Pezzo del condotto reflex',
    })));
  }

  // 5. curve
  const modelled = input.enclosure === 'sealed' || input.enclosure === 'vented' || input.enclosure === 'passive-radiator';
  let curves: ResponseCurves | null = null;
  let maxOutput: MaxOutputResult | null = null;
  let ventVelocity: CurvePoint[] | null = null;
  let splWithRoom: CurvePoint[] | null = null;

  if (modelled) {
    curves = computeResponse({
      ts: input.ts,
      type: input.enclosure === 'sealed' ? 'sealed' : 'vented',
      fc: acoustic.fcHz,
      qtc: acoustic.qtc,
      fb: acoustic.fbHz,
      alpha: acoustic.alpha,
      ql: damping.qa > 20 ? 10 : 7,
      powerW: input.powerW,
      fMin: 15,
      fMax: 500,
    });
    maxOutput = computeMaxOutput({
      ts: input.ts, curves, refPowerW: input.powerW,
      sensitivity: input.ts.sensitivity, roomPreset: input.roomPreset,
    });
    splWithRoom = applyRoomGain(curves.spl, input.roomPreset);

    // F3 MISURATA sulla curva appena calcolata invece che da un curve-fit:
    // così il numero dichiarato coincide sempre col grafico, qualunque sia
    // l'allineamento scelto. Il fit di Keele vale solo per il QB3 e sbagliava
    // fino al 27% sugli altri.
    // La soglia cade quasi sempre FRA due campioni: agganciarsi al primo punto
    // gia' sopra i -3 dB arrotondava sempre per eccesso, di un passo di griglia
    // (1.27% fra 15 e 500 Hz su 280 punti). Su una chiusa con Qtc 0.84 la F3
    // dichiarata risultava 35.70 Hz contro i 35.52 Hz della formula chiusa.
    // Interpolando fra i due campioni che attraversano la soglia il numero
    // torna a coincidere con la teoria entro il centesimo di hertz.
    const iCross = curves.spl.findIndex(p => p.v >= -3);
    if (iCross === 0) {
      acoustic.f3Hz = curves.spl[0].f;
    } else if (iCross > 0) {
      const a = curves.spl[iCross - 1];
      const b = curves.spl[iCross];
      const t = (-3 - a.v) / (b.v - a.v);
      acoustic.f3Hz = a.f + t * (b.f - a.f);
    }

    if (acoustic.port && acoustic.fbHz) {
      const peakExcursion = Math.max(...curves.excursion.map(p => p.v));
      const driveRatio = Math.min(1, peakExcursion / (input.ts.xmax ?? 6));
      ventVelocity = ventVelocityCurve({
        peakVelocityAtXmax: acoustic.port.velocity,
        fb: acoustic.fbHz,
        ql: damping.qa > 20 ? 10 : 7,
        driveRatio,
      });
    }
  } else if (acoustic.chambers) {
    // bandpass: solo curva SPL stimata
    const spl = input.enclosure === 'bandpass4'
      ? bandpass4Response(acoustic.fbHz!, acoustic.chambers.fLow, acoustic.chambers.fHigh, 15, 500)
      : bandpass6Response(acoustic.fbHz!, acoustic.chambers.fbFront ?? acoustic.fbHz! * 1.6, 15, 500);
    curves = { spl, excursion: [], impedance: [], groupDelay: [], phase: [] };
    splWithRoom = applyRoomGain(spl, input.roomPreset);
  }

  return {
    acoustic,
    volumes,
    dimensions,
    panels,
    panelAreaM2: totalPanelArea(panels),
    weightKg: estimatedWeight(panels),
    curves,
    splWithRoom,
    maxOutput,
    ventVelocity,
    simplifiedModel: !modelled,
  };
}

/** Accordo reale di un condotto già costruito — verifica a posteriori */
export function verifyTuning(geometry: PortGeometry, lengthMm: number, vbL: number): number {
  return tuningOf(geometry, lengthMm, vbL);
}
