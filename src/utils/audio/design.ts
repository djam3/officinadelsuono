/**
 * Orchestratore di progetto: da parametri T/S + scelte dell'utente a progetto
 * completo (volume, accordo, condotto, dimensioni, lista di taglio, curve).
 */

import {
  sealedFromQtc, sealedFromVb, ventedDesign, portLength, portVelocity,
  tuningFromPort, bandpass4thOrder, bandpass4Response, bandpass6thOrder,
  bandpass6Response, passiveRadiatorTuning,
} from './enclosure';
import { computeResponse } from './response';
import { computeMaxOutput, ventVelocityCurve, applyRoomGain, type RoomPreset, type MaxOutputResult } from './performance';
import {
  DAMPING_SPECS, GOLDEN_RATIO, cuttingList, dimensionsFromVolume, driverDisplacement,
  estimatedWeight, grossFromNet, internalVolume, portDisplacement, totalPanelArea, volumeBreakdown,
} from './geometry';
import type {
  AlignmentType, BoxDimensions, BoxShape, CurvePoint, CutPanel, DampingLevel,
  EnclosureType, PortShape, ResponseCurves, TSParams, VolumeBreakdown,
} from './types';

export interface DesignInput {
  ts: TSParams;
  enclosure: EnclosureType;
  alignment: AlignmentType;

  /** override manuali del progetto acustico */
  customVbL?: number;
  customFbHz?: number;
  targetQtc?: number;

  /** condotto */
  portShape: PortShape;
  portCount: number;
  /** mm — se assente sceglie il minimo che tiene la velocità sotto soglia */
  portDiameterMm?: number;
  slotWidthMm?: number;
  slotHeightMm?: number;

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
  driverCount: number;

  /** simulazione */
  powerW: number;
  roomPreset: RoomPreset;
}

export interface PortResult {
  shape: PortShape;
  diameterMm?: number;
  slotWidthMm?: number;
  slotHeightMm?: number;
  lengthMm: number;
  count: number;
  velocity: number;      // m/s al massimo spostamento
  minAreaCm2: number;    // area minima consigliata (criterio di Small)
  areaCm2: number;
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
  /** radiatore passivo: massa da aggiungere */
  prAddedMassG?: number;
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

const PORT_DIAMETERS = [50, 65, 80, 100, 120, 150, 180, 200];
const VELOCITY_TARGET = 17; // m/s

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
  const warnings: string[] = [];
  const np = Math.max(1, input.portCount);

  const custom = input.customVbL && input.customFbHz
    ? { vbL: input.customVbL, fb: input.customFbHz }
    : undefined;

  // diametro: scelto dall'utente o il minimo che tiene la velocità sotto soglia
  let chosen = ventedDesign(ts, custom ? 'CUSTOM' : input.alignment, input.portDiameterMm ?? PORT_DIAMETERS[0], np, 0.732, custom);
  if (!input.portDiameterMm && input.portShape === 'circular') {
    chosen = ventedDesign(ts, custom ? 'CUSTOM' : input.alignment, PORT_DIAMETERS[PORT_DIAMETERS.length - 1], np, 0.732, custom);
    for (const dv of PORT_DIAMETERS) {
      const test = ventedDesign(ts, custom ? 'CUSTOM' : input.alignment, dv, np, 0.732, custom);
      if (test.portVelocity <= VELOCITY_TARGET) { chosen = test; break; }
    }
  }

  let port: PortResult;

  if (input.portShape === 'slot') {
    // area equivalente → condotto rettangolare di pari sezione
    const areaCm2 = Math.PI * Math.pow(chosen.portDiameter / 2, 2) * np / 100;
    const slotWidth = input.slotWidthMm ?? Math.round(Math.sqrt(areaCm2 * 100 * 4));
    const slotHeight = input.slotHeightMm ?? Math.max(20, Math.round((areaCm2 * 100) / slotWidth));
    // diametro idraulico equivalente per la lunghezza di accordo
    const dEq = 2 * Math.sqrt((slotWidth * slotHeight) / Math.PI);
    const len = portLength(dEq, chosen.fb, chosen.vb, 1, 0.85);
    const pv = portVelocity(ts, chosen.fb, dEq, 1);
    port = {
      shape: 'slot', slotWidthMm: slotWidth, slotHeightMm: slotHeight,
      lengthMm: Math.max(25, Math.round(len)), count: 1,
      velocity: pv.velocity, minAreaCm2: pv.minVentAreaCm2, areaCm2: (slotWidth * slotHeight) / 100,
    };
  } else {
    const pv = portVelocity(ts, chosen.fb, chosen.portDiameter, np);
    port = {
      shape: 'circular', diameterMm: chosen.portDiameter,
      lengthMm: Math.max(25, Math.round(chosen.portLength)), count: np,
      velocity: chosen.portVelocity, minAreaCm2: chosen.minVentArea, areaCm2: pv.portAreaCm2,
    };
  }

  if (port.velocity > VELOCITY_TARGET) {
    warnings.push(`Velocità in porta ${port.velocity.toFixed(1)} m/s: sopra i ${VELOCITY_TARGET} m/s si sente il soffio. Aumenta diametro o numero di condotti.`);
  }
  if (port.areaCm2 < port.minAreaCm2) {
    warnings.push(`Area del condotto ${port.areaCm2.toFixed(0)} cm² sotto il minimo consigliato da Small (${port.minAreaCm2.toFixed(0)} cm²).`);
  }
  if (port.lengthMm > 600) {
    warnings.push(`Condotto lungo ${Math.round(port.lengthMm)} mm: valuta una porta a slot ripiegata per farlo stare nella cassa.`);
  }

  return {
    vbL: chosen.vb, fbHz: chosen.fb, f3Hz: chosen.f3, alpha: chosen.alpha,
    port, warnings,
  };
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

  return {
    vbL: base.vb, fbHz: base.fb, f3Hz: base.f3, alpha: base.alpha,
    prAddedMassG: tuning.totalMassG, warnings,
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
    const pv = portVelocity(ts, bp.fb, dv, np);
    warnings.push('Bandpass 4° ordine: il driver è nascosto, tutta l\'emissione passa dal condotto. Controlla la velocità dell\'aria con attenzione.');
    if (pv.velocity > VELOCITY_TARGET) warnings.push(`Velocità in porta ${pv.velocity.toFixed(1)} m/s: troppo alta, aumenta la sezione.`);
    return {
      vbL: bp.vrL + bp.vfL, fbHz: bp.fb, f3Hz: bp.fL, alpha,
      chambers: { rearL: bp.vrL, frontL: bp.vfL, fLow: bp.fL, fHigh: bp.fH },
      port: {
        shape: 'circular', diameterMm: dv, lengthMm: Math.round(bp.portLengthMm), count: np,
        velocity: pv.velocity, minAreaCm2: pv.minVentAreaCm2, areaCm2: pv.portAreaCm2,
      },
      warnings,
    };
  }

  const bp = bandpass6thOrder(ts, { S: input.bandpassS ?? 0.6, dvMm: dv, np });
  const pv = portVelocity(ts, bp.fbFront, dv, np);
  warnings.push('Bandpass 6° ordine: due camere accordate, banda più larga ma taratura critica. Progetto di partenza da rifinire con misura.');
  return {
    vbL: bp.vrL + bp.vfL, fbHz: bp.fbRear, f3Hz: bp.fL, alpha: ts.vas / bp.vrL,
    chambers: { rearL: bp.vrL, frontL: bp.vfL, fLow: bp.fL, fHigh: bp.fH, fbFront: bp.fbFront },
    port: {
      shape: 'circular', diameterMm: dv, lengthMm: Math.round(bp.portFrontLenMm), count: np,
      velocity: pv.velocity, minAreaCm2: pv.minVentAreaCm2, areaCm2: pv.portAreaCm2,
    },
    warnings,
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
  const portDispL = acoustic.port
    ? portDisplacement({
        shape: acoustic.port.shape,
        diameterMm: acoustic.port.diameterMm,
        slotWidthMm: acoustic.port.slotWidthMm,
        slotHeightMm: acoustic.port.slotHeightMm,
        lengthMm: acoustic.port.lengthMm,
        count: acoustic.port.count,
      })
    : 0;

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

  const panels = cuttingList(dimensions);

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

/** Ricava l'accordo reale da un condotto già costruito (verifica a posteriori) */
export function verifyTuning(diameterMm: number, lengthMm: number, vbL: number, count = 1): number {
  return tuningFromPort(diameterMm, lengthMm, vbL, count, 0.732);
}
