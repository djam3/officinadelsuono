/**
 * Orchestratore di progetto: da parametri T/S + scelte dell'utente a progetto
 * completo (volume, accordo, condotto, dimensioni, lista di taglio, curve).
 */

import {
  sealedFromQtc, sealedFromVb, ventedDesign, alignmentRatios,
  bandpass4thOrder, bandpass6thOrder, passiveRadiatorTuning,
} from './enclosure';
import {
  PORT_TYPES, autoSizePort, describePort, equivalentDiameter, portDisplacement,
  portFit, portLengthFor, totalPortArea, tuningOf, velocityCheck,
  type PortGeometry, type PortPanel, type PortType,
} from './ports';
import { computeResponse } from './response';
import { computePRResponse, prCircuit } from './circuit';
import { computeBandpassResponse } from './bandpassCircuit';
import {
  ABSORBERS, QA_EMPTY, computeAbsorber, ventedBoxLosses,
  type AbsorberId, type AbsorberResult, type Placement,
} from './absorber';
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
  /** escursione lineare del radiatore (mm, una direzione) */
  prXmaxMm?: number;
  /** Q meccanico della sospensione del radiatore: comanda la profondita del notch */
  prQms?: number;

  /** costruzione */
  shape: BoxShape;
  wallThicknessMm: number;
  damping: DampingLevel;
  /** materiale fonoassorbente; se assente lo deduce dal livello `damping` */
  absorber?: AbsorberId;
  placement?: Placement;
  absorberDensityKgM3?: number;
  liningThicknessMm?: number;
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
  chambers?: {
    rearL: number; frontL: number; fLow: number; fHigh: number; fbFront?: number;
    /** aree dei condotti (cm²), per il modello circuitale */
    portFrontCm2?: number; portRearCm2?: number;
  };
  /** bandpass: guadagno in banda rispetto al riferimento del driver (dB) */
  passbandGainDb?: number;
  /** radiatore passivo: massa mobile TOTALE che deve avere (zavorra inclusa) */
  prTotalMassG?: number;
  /** radiatore passivo: risonanza in aria libera della membrana = frequenza del notch */
  prFpHz?: number;
  /** radiatore passivo: dati usati per la simulazione */
  pr?: { vasL: number; sdCm2: number; qms: number; xmaxMm?: number };
  /** radiatore passivo: escursione che la membrana raggiunge quando il driver è a Xmax (mm) */
  prRequiredXmaxMm?: number;
  warnings: string[];
}

export interface DesignResult {
  acoustic: AcousticResult;
  /** materiale fonoassorbente: volume apparente, perdite e modi interni */
  absorber: AbsorberResult;
  /** QB equivalente della cassa reflex (fughe + assorbimento + condotto) */
  boxLossQ: number;
  volumes: VolumeBreakdown;
  dimensions: BoxDimensions;
  panels: CutPanel[];
  panelAreaM2: number;
  weightKg: number;
  curves: ResponseCurves | null;
  splWithRoom: CurvePoint[] | null;
  maxOutput: MaxOutputResult | null;
  ventVelocity: CurvePoint[] | null;
}


// ─── Progetto acustico ────────────────────────────────────────────────────────

function designSealed(input: DesignInput, qa = QA_EMPTY): AcousticResult {
  const { ts } = input;
  const warnings: string[] = [];
  const res = input.customVbL
    ? sealedFromVb(ts, input.customVbL, qa)
    : sealedFromQtc(ts, input.targetQtc ?? 0.707, qa);

  if (res.qtc > 1.1) warnings.push(`Qtc ${res.qtc.toFixed(2)}: cassa molto piccola, risposta gonfia e poco controllata.`);
  if (res.qtc < 0.5) warnings.push(`Qtc ${res.qtc.toFixed(2)}: cassa molto grande, basso smorzato ma poco esteso.`);

  return {
    vbL: res.vb, fcHz: res.fc, qtc: res.qtc, f3Hz: res.f3,
    alpha: res.alpha, peakingDb: res.peakingDb, warnings,
  };
}

function designVented(input: DesignInput, qb = 7): AcousticResult {
  const { ts } = input;

  // volume e accordo dall'allineamento scelto, o imposti dall'utente
  let vb: number, fb: number, alpha: number;
  if (input.customVbL && input.customFbHz) {
    vb = input.customVbL;
    fb = input.customFbHz;
    alpha = ts.vas / vb;
  } else {
    const ql = qb;
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

function designPassiveRadiator(input: DesignInput, qb = 7): AcousticResult {
  const { ts } = input;
  const warnings: string[] = [];
  // il volume si dimensiona come un reflex, l'accordo lo fa la massa del PR
  const base = ventedDesign(ts, input.alignment, 100, 1, 0.732,
    input.customVbL && input.customFbHz ? { vbL: input.customVbL, fb: input.customFbHz } : undefined);
  void qb;

  const prVas = input.prVasL ?? ts.vas * 1.5;
  const prSd = input.prSdCm2 ?? (ts.sd ?? 500) * 1.5;
  const prQms = input.prQms ?? 10;
  const circuit = prCircuit({ ts, vbL: base.vb, fbHz: base.fb, prVasL: prVas, prSdCm2: prSd });

  warnings.push(
    `La membrana passiva ha una sua risonanza in aria libera a ${circuit.fpHz.toFixed(1)} Hz, sotto l'accordo: è lì che la sua uscita si annulla e la risposta ha un notch. È la differenza vera rispetto a un reflex, dove il condotto è una massa d'aria senza molla.`,
  );
  warnings.push('La massa indicata è quella mobile TOTALE del radiatore: la zavorra da aggiungere è la differenza rispetto a quanto pesa già il PR che scegli (dato di targa del costruttore).');

  return {
    vbL: base.vb, fbHz: base.fb, f3Hz: base.f3, alpha: base.alpha,
    prTotalMassG: circuit.prTotalMassG,
    prFpHz: circuit.fpHz,
    pr: { vasL: prVas, sdCm2: prSd, qms: prQms, xmaxMm: input.prXmaxMm },
    warnings,
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
      chambers: {
        rearL: bp.vrL, frontL: bp.vfL, fLow: bp.fL, fHigh: bp.fH,
        portFrontCm2: port.areaCm2,
      },
      port, warnings,
    };
  }

  const bp = bandpass6thOrder(ts, { S: input.bandpassS ?? 0.6, dvMm: dv, np });
  const { port, warnings: portWarnings, actualFbHz } = designPort(input, bp.fbFront, bp.vfL);
  warnings.push('Bandpass 6° ordine: due camere accordate. Rispetto al 4° la banda è più STRETTA e il livello in banda più alto — è il baratto che si fa costruendolo — e la taratura è molto più critica.');
  warnings.push(...portWarnings);
  return {
    vbL: bp.vrL + bp.vfL, fbHz: bp.fbRear, f3Hz: bp.fL, alpha: ts.vas / bp.vrL,
    chambers: {
      rearL: bp.vrL, frontL: bp.vfL, fLow: bp.fL, fHigh: bp.fH, fbFront: bp.fbFront,
      portFrontCm2: port.areaCm2, portRearCm2: port.areaCm2,
    },
    port, warnings,
  };
}


// ─── Progetto completo ────────────────────────────────────────────────────────

/**
 * F3 letta sulla curva calcolata invece che da un curve-fit, cosi il numero
 * dichiarato coincide sempre col grafico qualunque sia il tipo di cassa. Il fit
 * di Keele vale solo per il QB3 e sbagliava fino al 27% sugli altri.
 *
 * La soglia cade quasi sempre FRA due campioni: agganciarsi al primo punto gia
 * sopra i -3 dB arrotondava sempre per eccesso, di un passo di griglia (1.27%
 * fra 15 e 500 Hz su 280 punti). Interpolando fra i due campioni che
 * attraversano la soglia il numero torna a coincidere con la teoria.
 */
function measuredF3(spl: CurvePoint[], fallback: number): number {
  const i = spl.findIndex(p => p.v >= -3);
  if (i === 0) return spl[0].f;
  if (i < 0) return fallback;
  const a = spl[i - 1];
  const b = spl[i];
  return a.f + ((-3 - a.v) / (b.v - a.v)) * (b.f - a.f);
}

/**
 * Un allineamento spinto fuori dal suo campo produce una gobba in banda, e
 * conviene dirlo. La famiglia QB3/B4/C4 e un continuo, e sopra Qts 0.383
 * l'ondulazione del Chebyshev cresce in fretta: a Qts 0.5 vale gia 6 dB e
 * serve una cassa di due volte il Vas, a 0.6 supera i 20 dB. Sono numeri che
 * la formula restituisce senza protestare, ma casse che nessuno costruisce.
 */
function avvisaSeOndula(acoustic: AcousticResult, spl: CurvePoint[]): void {
  const picco = Math.max(...spl.map(p => p.v));
  if (picco > 1.5) {
    acoustic.warnings.push(
      `La risposta ha una gobba di ${picco.toFixed(1)} dB in banda: l'allineamento scelto sta fuori dal campo di Qts per cui è pensato. Con un Qts alto conviene la cassa chiusa, oppure un accordo più basso accettando meno estensione.`,
    );
  }
  if (acoustic.alpha !== undefined && acoustic.alpha > 0 && acoustic.alpha < 0.35) {
    acoustic.warnings.push(
      `Il volume richiesto è ${(1 / acoustic.alpha).toFixed(1)} volte il Vas del driver: l'allineamento è al limite della praticabilità.`,
    );
  }
}

/**
 * Livelli storici di smorzamento tradotti nel materiale corrispondente, cosi i
 * progetti salvati prima del modulo fonoassorbente continuano a funzionare.
 */
const DAMPING_AS_ABSORBER: Record<DampingLevel, { material: AbsorberId; placement: Placement; density: number }> = {
  none:    { material: 'none', placement: 'none', density: 0 },
  minimal: { material: 'felt-wool', placement: 'lining', density: 150 },
  normal:  { material: 'polyester', placement: 'lining', density: 20 },
  heavy:   { material: 'polyester', placement: 'stuffing', density: 15 },
};

export function computeDesign(input: DesignInput): DesignResult {
  const preset = DAMPING_AS_ABSORBER[input.damping];
  const material = input.absorber ?? preset.material;
  const placement = input.placement ?? preset.placement;
  const density = input.absorberDensityKgM3
    ?? (input.absorber ? ABSORBERS[material].defaultDensityKgM3 : preset.density);

  const bracingPercent = input.bracingPercent ?? 3;
  const driverDispL = driverDisplacement(
    input.ts.sd ?? 500,
    input.mountingDepthMm ?? 100,
    input.driverCount,
  );

  // ── Progetto acustico, geometria e assorbente si determinano a vicenda ────
  // Il materiale fa vedere al woofer un volume maggiore, quindi la cassa fisica
  // puo essere piu piccola; ma quanto materiale ci entra dipende proprio dalle
  // dimensioni di quella cassa. Il giro si chiude iterando: la seconda passata
  // sposta il risultato di pochi decimi di litro, la terza di nulla.
  let acoustic!: AcousticResult;
  let dimensions!: BoxDimensions;
  let absorber!: AbsorberResult;
  let portBuild: ReturnType<typeof portDisplacement> | null = null;
  let physicalNetL = 0;
  let grossNeeded = 0;
  let delta = 0;
  let qa = QA_EMPTY;

  for (let pass = 0; pass < 4; pass++) {
    const qb = ventedBoxLosses(qa);
    switch (input.enclosure) {
      case 'sealed': acoustic = designSealed(input, qa); break;
      case 'vented': acoustic = designVented(input, qb); break;
      case 'passive-radiator': acoustic = designPassiveRadiator(input, qb); break;
      case 'bandpass4': acoustic = designBandpass(input, 4); break;
      case 'bandpass6': acoustic = designBandpass(input, 6); break;
    }

    portBuild = acoustic.port
      ? portDisplacement(acoustic.port.geometry, acoustic.port.lengthMm, input.wallThicknessMm)
      : null;
    const portDispL = portBuild?.displacementL ?? 0;

    physicalNetL = acoustic.vbL / (1 + delta);
    grossNeeded = grossFromNet(physicalNetL, { driverDispL, portDispL, bracingPercent });
    dimensions = dimensionsFromVolume(grossNeeded, {
      shape: input.shape,
      wallThickness: input.wallThicknessMm,
      ratio: input.useGoldenRatio ? GOLDEN_RATIO : undefined,
      fixedWidth: input.fixedWidthMm,
      fixedHeight: input.fixedHeightMm,
      taper: input.taper,
    });

    const t = input.wallThicknessMm;
    absorber = computeAbsorber({
      material, placement, densityKgM3: density,
      liningThicknessMm: input.liningThicknessMm,
      dims: {
        widthMm: Math.max(20, dimensions.width - 2 * t),
        heightMm: Math.max(20, dimensions.height - 2 * t),
        depthMm: Math.max(20, dimensions.depth - 2 * t),
      },
      netVolumeL: physicalNetL,
    });

    const nextDelta = absorber.volume.delta;
    const nextQa = absorber.losses.qa;
    const settled = Math.abs(nextDelta - delta) < 1e-4 && Math.abs(nextQa - qa) < 1e-3;
    delta = nextDelta;
    qa = nextQa;
    if (settled) break;
  }

  const qbFinal = ventedBoxLosses(qa);
  acoustic.warnings = [...acoustic.warnings, ...absorber.warnings];

  const volumes = volumeBreakdown({
    grossL: internalVolume(dimensions),
    driverDispL,
    portDispL: portBuild?.displacementL ?? 0,
    bracingPercent,
    volumeGain: delta,
    absorberSolidL: absorber.fill.solidDisplacementL,
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

  if (input.enclosure === 'passive-radiator' && acoustic.pr) {
    // Il radiatore passivo NON e' un reflex: la sospensione della membrana
    // aggiunge una coppia di zeri, cioe' il notch alla sua risonanza in aria
    // libera, e sotto quel punto la membrana si irrigidisce e la cassa torna a
    // comportarsi da chiusa. Simularlo col modello del reflex cancellava
    // entrambe le cose. Qui si valuta il circuito equivalente completo.
    const pr = computePRResponse({
      ts: input.ts,
      vbL: acoustic.vbL,
      fbHz: acoustic.fbHz!,
      prVasL: acoustic.pr.vasL,
      prSdCm2: acoustic.pr.sdCm2,
      prQms: acoustic.pr.qms,
      ql: qbFinal,
      powerW: input.powerW,
      fMin: 15,
      fMax: 500,
    });
    curves = {
      spl: pr.spl, excursion: pr.excursion, impedance: pr.impedance,
      groupDelay: pr.groupDelay, phase: pr.phase, prExcursion: pr.prExcursion,
    };
    maxOutput = computeMaxOutput({
      ts: input.ts, curves, refPowerW: input.powerW,
      sensitivity: input.ts.sensitivity, roomPreset: input.roomPreset,
    });
    splWithRoom = applyRoomGain(curves.spl, input.roomPreset);
    acoustic.f3Hz = measuredF3(curves.spl, acoustic.f3Hz);
    avvisaSeOndula(acoustic, curves.spl);

    // Quanto deve muoversi la membrana quando il driver e' al suo limite. La
    // regola del pollice dice "volume spostabile almeno doppio"; qui il numero
    // si calcola invece di ripeterlo, perche' dipende dall'accordo e dal
    // rapporto fra le aree.
    // I picchi si cercano sopra l'accordo: sotto, l'escursione di entrambi
    // scappa e serve comunque un filtro subsonico, quindi prendere li il
    // massimo del driver falserebbe il confronto verso il basso.
    const xmax = input.ts.xmax;
    const band = (c: CurvePoint[]) => c.filter(p => p.f >= acoustic.fbHz!);
    const peakD = Math.max(...band(curves.excursion).map(p => p.v), 1e-9);
    const peakP = Math.max(...band(pr.prExcursion).map(p => p.v), 0);
    if (xmax && peakD > 0) {
      const needed = peakP * (xmax / peakD);
      acoustic.prRequiredXmaxMm = needed;
      const vdRatio = (needed * acoustic.pr.sdCm2) / (xmax * (input.ts.sd ?? 500));
      acoustic.warnings.push(
        `Portando il driver a Xmax (${xmax} mm) in banda utile, la membrana passiva ne percorre ${needed.toFixed(1)}: serve un radiatore con almeno quell'escursione lineare, cioè ${vdRatio.toFixed(1)} volte il volume spostabile del driver.`,
      );
      if (acoustic.pr.xmaxMm && needed > acoustic.pr.xmaxMm) {
        acoustic.warnings.push(
          `Il radiatore scelto ha Xmax ${acoustic.pr.xmaxMm} mm, meno dei ${needed.toFixed(1)} mm richiesti: va in fondo corsa prima del driver e diventa lui il limite del sistema. Serve un radiatore con più escursione, oppure due.`,
        );
      }
    }
  } else if (modelled) {
    curves = computeResponse({
      ts: input.ts,
      type: input.enclosure === 'sealed' ? 'sealed' : 'vented',
      fc: acoustic.fcHz,
      qtc: acoustic.qtc,
      fb: acoustic.fbHz,
      alpha: acoustic.alpha,
      ql: qbFinal,
      powerW: input.powerW,
      fMin: 15,
      fMax: 500,
    });
    maxOutput = computeMaxOutput({
      ts: input.ts, curves, refPowerW: input.powerW,
      sensitivity: input.ts.sensitivity, roomPreset: input.roomPreset,
    });
    splWithRoom = applyRoomGain(curves.spl, input.roomPreset);

    acoustic.f3Hz = measuredF3(curves.spl, acoustic.f3Hz);
    avvisaSeOndula(acoustic, curves.spl);

    if (acoustic.port && acoustic.fbHz) {
      const peakExcursion = Math.max(...curves.excursion.map(p => p.v));
      const driveRatio = Math.min(1, peakExcursion / (input.ts.xmax ?? 6));
      ventVelocity = ventVelocityCurve({
        peakVelocityAtXmax: acoustic.port.velocity,
        fb: acoustic.fbHz,
        ql: qbFinal,
        driveRatio,
      });
    }
  } else if (acoustic.chambers) {
    // Bandpass dal circuito equivalente. Prima qui c'era una campana disegnata
    // a mano — una forma a Q costante col Q scelto a occhio — che non poteva
    // dire niente su escursione e impedenza, perche' quelle non si ricavano
    // dalla curva di pressione ma dal circuito.
    const ch = acoustic.chambers;
    const sixth = input.enclosure === 'bandpass6';
    const bp = computeBandpassResponse({
      ts: input.ts,
      vrL: ch.rearL,
      vfL: ch.frontL,
      fbFrontHz: sixth ? (ch.fbFront ?? acoustic.fbHz! * 1.6) : acoustic.fbHz!,
      fbRearHz: sixth ? acoustic.fbHz! : undefined,
      portFrontCm2: ch.portFrontCm2 ?? 80,
      portRearCm2: ch.portRearCm2,
      ql: qbFinal,
      powerW: input.powerW,
      fMin: 15,
      fMax: 500,
    }, sixth ? 6 : 4);

    curves = {
      spl: bp.spl, excursion: bp.excursion, impedance: bp.impedance,
      groupDelay: bp.groupDelay, phase: bp.phase,
    };
    splWithRoom = applyRoomGain(bp.spl, input.roomPreset);
    maxOutput = computeMaxOutput({
      ts: input.ts, curves, refPowerW: input.powerW,
      sensitivity: input.ts.sensitivity, roomPreset: input.roomPreset,
    });

    // gli estremi di banda ora sono misurati sulla curva, non stimati
    ch.fLow = bp.fLowHz;
    ch.fHigh = bp.fHighHz;
    acoustic.f3Hz = bp.fLowHz;
    acoustic.passbandGainDb = bp.passbandGainDb;

    ventVelocity = bp.portFrontVelocity;
    const vMax = Math.max(...bp.portFrontVelocity.map(p => p.v));
    const limit = acoustic.port?.velocityLimit ?? 17;
    if (vMax > limit) {
      acoustic.warnings.push(
        `Nel condotto anteriore l'aria arriva a ${vMax.toFixed(0)} m/s a ${input.powerW} W, oltre il limite di ${limit} m/s della geometria scelta: serve più sezione, altrimenti soffia.`,
      );
    }
    if (bp.portRearVelocity) {
      const vR = Math.max(...bp.portRearVelocity.map(p => p.v));
      if (vR > limit) {
        acoustic.warnings.push(
          `Anche nel condotto posteriore si arriva a ${vR.toFixed(0)} m/s, oltre i ${limit} m/s ammessi.`,
        );
      }
    }
  }

  return {
    acoustic,
    absorber,
    boxLossQ: qbFinal,
    volumes,
    dimensions,
    panels,
    panelAreaM2: totalPanelArea(panels),
    weightKg: estimatedWeight(panels),
    curves,
    splWithRoom,
    maxOutput,
    ventVelocity,
  };
}

/** Accordo reale di un condotto già costruito — verifica a posteriori */
export function verifyTuning(geometry: PortGeometry, lengthMm: number, vbL: number): number {
  return tuningOf(geometry, lengthMm, vbL);
}
