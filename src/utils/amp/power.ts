/**
 * Potenza, SPL e margine dinamico.
 *
 * Il malinteso da cui nasce metà degli impianti sbagliati è che «watt» sia una
 * grandezza sola. Ce ne sono almeno tre e non si sommano fra loro:
 *
 *  - la potenza CONTINUA che l'amplificatore eroga su un'onda continua;
 *  - la potenza MEDIA che la musica chiede davvero, molto più bassa;
 *  - la potenza di PICCO, che dura millisecondi ed è quella che decide se un
 *    colpo di rullante esce pulito o schiacciato.
 *
 * La distanza fra media e picco è il fattore di cresta, e per la musica vale
 * 10–20 dB: significa che un picco da 1000 W nasce da una media di 10–100 W.
 * Un amplificatore dimensionato sulla media clippa sui picchi; uno dimensionato
 * sui picchi sta quasi sempre al minimo, ed è esattamente quello che deve fare.
 */

export type CrestKind = 'compresso' | 'pop' | 'acustico' | 'sinusoide';

export const CREST: Record<CrestKind, { db: number; label: string; note: string }> = {
  sinusoide: { db: 3.0, label: 'Sinusoide (prova)', note: 'Il caso peggiore in assoluto per il calore: nessun momento di riposo.' },
  compresso: { db: 8, label: 'Musica molto compressa', note: 'Elettronica moderna, master a volume massimo: pochi picchi, media alta.' },
  pop: { db: 12, label: 'Pop / rock', note: 'Il caso normale in amplificazione dal vivo.' },
  acustico: { db: 18, label: 'Acustico / classica', note: 'Picchi molto più alti della media: serve margine, non potenza continua.' },
};

export interface PowerInput {
  /** potenza continua dell'amplificatore sul carico effettivo (W) */
  ampPowerW: number;
  /** potenza continua sopportabile dal diffusore, dato di targa (W) */
  speakerPeW: number;
  /** sensibilità del diffusore (dB @ 1 W / 1 m) */
  sensitivityDb: number;
  /** impedenza vista dall'amplificatore */
  loadOhm: number;
  /** distanza di ascolto (m) */
  distanceM: number;
  /** numero di diffusori accesi */
  count?: number;
  crest?: CrestKind;
  /** perdita del cavo, in dB (negativa) */
  cableLossDb?: number;
  /** ascolto all'aperto o dentro: metà spazio regala 3 dB sotto i 200 Hz circa */
  halfSpace?: boolean;
}

export interface PowerResult {
  /** tensione e corrente di picco all'uscita alla potenza dichiarata */
  peakVoltage: number;
  peakCurrent: number;
  rmsVoltage: number;
  /** SPL sui picchi, a bobina fredda: i primi secondi */
  splPeakCold: number;
  /** SPL sui picchi a regime, quando la bobina si e' scaldata */
  splPeak: number;
  /** livello medio percepito: i picchi meno il fattore di cresta */
  splAverage: number;
  /** potenza media che corrisponde al picco dichiarato, dato il fattore di cresta */
  averageW: number;
  /** margine fra amplificatore e diffusore, in dB */
  headroomDb: number;
  /** guadagno di accoppiamento fra più diffusori (dB) */
  arrayGainDb: number;
  /** perdita per compressione di potenza alla temperatura stimata della bobina */
  compressionDb: number;
  warnings: string[];
}

/**
 * Compressione di potenza.
 *
 * La bobina scalda, il rame aumenta di resistenza (0,393% per grado) e il
 * driver assorbe meno potenza a parità di tensione: il livello cala da solo,
 * senza che niente si sia rotto. È l'effetto che manca in quasi tutti i conti
 * di SPL, e vale più di quanto si creda.
 *
 *   Re(T) = Re20 · (1 + 0,00393·ΔT)     perdita = 20·log10(Re20/Re(T))
 *
 * A 150 K di sovratemperatura — che è ordinaria a piena potenza — la
 * resistenza sale del 59% e si perdono 4 dB.
 */
export function powerCompressionDb(deltaTempK: number): number {
  const ratio = 1 + 0.00393 * Math.max(deltaTempK, 0);
  return 20 * Math.log10(1 / ratio);
}

/** Sovratemperatura stimata della bobina in funzione della frazione di potenza usata. */
export function coilRiseK(fractionOfPe: number, maxRiseK = 200): number {
  return maxRiseK * Math.min(Math.max(fractionOfPe, 0), 1.2);
}

export function computePower(input: PowerInput): PowerResult {
  const {
    ampPowerW, speakerPeW, sensitivityDb, loadOhm, distanceM,
  } = input;
  const n = Math.max(1, Math.round(input.count ?? 1));
  const crestDb = CREST[input.crest ?? 'pop'].db;
  const cableLoss = input.cableLossDb ?? 0;
  const warnings: string[] = [];

  const z = Math.max(loadOhm, 0.1);
  const rmsV = Math.sqrt(ampPowerW * z);
  const peakV = rmsV * Math.SQRT2;
  const peakI = peakV / z;

  // Accoppiamento fra diffusori: due sorgenti vicine e in fase sommano in
  // pressione (+6 dB) finché la distanza fra loro è piccola rispetto alla
  // lunghezza d'onda; lontane o scorrelate sommano in potenza (+3 dB). Alle
  // basse frequenze vale il primo caso, in gamma media il secondo: qui si usa
  // il +3 dB, che è il limite prudente.
  const arrayGain = 10 * Math.log10(n);

  // SPL: sensibilità + 10log(P) − 20log(d), con la potenza PER diffusore
  const perSpeakerW = ampPowerW / n;
  const distLoss = 20 * Math.log10(Math.max(distanceM, 0.1));
  const halfSpaceGain = input.halfSpace ? 3 : 0;

  // Il fattore di cresta separa due cose che vanno tenute distinte: la potenza
  // di PICCO, che e' quella dichiarata dall'amplificatore e dura millisecondi,
  // e la potenza MEDIA, che e' quella che scalda la bobina. Un picco da 500 W
  // su programma pop nasce da una media di 32 W: e' la media a decidere quanto
  // il driver si comprime, non il picco.
  const averageW = ampPowerW / Math.pow(10, crestDb / 10);
  const avgPerSpeaker = averageW / n;
  const fraction = speakerPeW > 0 ? avgPerSpeaker / speakerPeW : 0;
  const compression = powerCompressionDb(coilRiseK(fraction));

  const base = sensitivityDb - distLoss + arrayGain + halfSpaceGain + cableLoss;
  const splPeakCold = base + 10 * Math.log10(Math.max(perSpeakerW, 1e-6));
  const splPeak = splPeakCold + compression;
  const splAverage = splPeak - crestDb;

  // ── avvisi ──
  const ratio = ampPowerW / Math.max(speakerPeW, 1e-9);
  if (ratio > 2.5) {
    warnings.push(
      `L'amplificatore dà ${ampPowerW.toFixed(0)} W su un diffusore da ${speakerPeW} W, cioè ` +
      `${ratio.toFixed(1)} volte: il margine è utile, ma solo se il limitatore è impostato. Senza, basta una ` +
      'manopola girata per passare dal margine al danno.',
    );
  } else if (ratio < 0.7) {
    warnings.push(
      `L'amplificatore dà ${ampPowerW.toFixed(0)} W su un diffusore da ${speakerPeW} W. Un amplificatore ` +
      'troppo piccolo è più pericoloso di uno grande: arrivato al limite tosa la forma d’onda, e un segnale ' +
      'tosato porta fino a 3 dB di potenza in più con l’energia spostata in alto, proprio dove sta il tweeter.',
    );
  }
  if (compression < -1.5) {
    warnings.push(
      `Con questo programma la potenza MEDIA è ${avgPerSpeaker.toFixed(0)} W per diffusore, cioè il ` +
      `${(fraction * 100).toFixed(0)}% della tenuta: la bobina si scalda al punto da far perdere ` +
      `${Math.abs(compression).toFixed(1)} dB per sola compressione. Il livello cala da solo dopo qualche ` +
      'minuto, e alzare il volume non lo recupera perché scalda ancora di più.',
    );
  }
  if (peakI > 20) {
    warnings.push(
      `La corrente di picco richiesta è ${peakI.toFixed(0)} A: controlla che l'amplificatore la dichiari, ` +
      'e che i connettori e il cavo la reggano. È qui che i morsetti a molla si sciolgono.',
    );
  }

  return {
    peakVoltage: peakV,
    peakCurrent: peakI,
    rmsVoltage: rmsV,
    splPeakCold,
    splPeak,
    splAverage,
    averageW,
    headroomDb: 10 * Math.log10(ratio),
    arrayGainDb: arrayGain,
    compressionDb: compression,
    warnings,
  };
}

/**
 * Struttura di guadagno.
 *
 * Il guadagno di un amplificatore è il rapporto fra la tensione che serve
 * all'ingresso per portarlo al massimo e la tensione che esce. Non è una
 * grandezza estetica: se il guadagno è troppo alto, il rumore della sorgente
 * viene amplificato e la manopola lavora tutta nel primo quarto; se è troppo
 * basso, il mixer va in clip prima dell'amplificatore.
 *
 *   V_out,max = √(P · Z)        G(dB) = 20·log10(V_out,max / V_in,sens)
 *
 * Lo 0 dBu vale 0,775 V, il dBV 1 V: le due scale differiscono di 2,2 dB, ed è
 * l'errore più comune nel leggere le schede.
 */
export function gainStructure(
  ampPowerW: number, loadOhm: number, inputSensitivityV: number,
): { outMaxV: number; gainDb: number; inputDbu: number; inputDbV: number } {
  const outMax = Math.sqrt(Math.max(ampPowerW, 0) * Math.max(loadOhm, 0.1));
  const vin = Math.max(inputSensitivityV, 1e-6);
  return {
    outMaxV: outMax,
    gainDb: 20 * Math.log10(outMax / vin),
    inputDbu: 20 * Math.log10(vin / 0.775),
    inputDbV: 20 * Math.log10(vin),
  };
}
