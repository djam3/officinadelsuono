/**
 * Carico: come si combinano più diffusori e cosa vede l'amplificatore.
 *
 * Due avvertenze che valgono per tutto il modulo.
 *
 * L'IMPEDENZA NOMINALE NON ESISTE. Un diffusore da «8 ohm» scende a 6 in
 * qualche punto e sale a 40 sui picchi di risonanza. Il numero che protegge
 * l'amplificatore è il MINIMO della curva, non la targa: per questo il
 * calcolatore lavora su due valori e li tiene distinti.
 *
 * IL PONTE NON REGALA NIENTE. In bridge l'amplificatore vede metà
 * dell'impedenza collegata, perché ciascun canale ne pilota metà con la
 * tensione raddoppiata. Un 4 ohm in bridge è un 2 ohm per canale.
 */

export type Wiring = 'serie' | 'parallelo' | 'serie-parallelo';

export interface LoadInput {
  /** numero di diffusori identici */
  count: number;
  wiring: Wiring;
  /** impedenza nominale del singolo diffusore */
  nominalOhm: number;
  /** minimo della curva del singolo diffusore, se noto */
  minOhm?: number;
  /** serie-parallelo: quanti in serie per ramo */
  perBranch?: number;
  /** l'amplificatore lavora a ponte */
  bridged?: boolean;
}

export interface LoadResult {
  /** impedenza risultante nominale */
  nominalOhm: number;
  /** impedenza risultante al minimo della curva */
  minOhm: number;
  /** quella che l'amplificatore vede davvero (in ponte è la metà) */
  seenOhm: number;
  seenMinOhm: number;
  /** come si dividono i watt fra i diffusori */
  perSpeakerFraction: number;
  /** descrizione del collegamento, per la lista di montaggio */
  description: string;
  warnings: string[];
}

export function computeLoad(input: LoadInput): LoadResult {
  const n = Math.max(1, Math.round(input.count));
  const zn = Math.max(input.nominalOhm, 0.1);
  const zmin = Math.max(input.minOhm ?? zn * 0.75, 0.1);
  const warnings: string[] = [];

  let combN: number;
  let combMin: number;
  let description: string;

  if (n === 1) {
    combN = zn; combMin = zmin;
    description = 'Un solo diffusore.';
  } else if (input.wiring === 'serie') {
    combN = zn * n; combMin = zmin * n;
    description = `${n} diffusori in serie: il + del primo all'amplificatore, il − di ognuno al + del successivo.`;
  } else if (input.wiring === 'parallelo') {
    combN = zn / n; combMin = zmin / n;
    description = `${n} diffusori in parallelo: tutti i + insieme e tutti i − insieme.`;
  } else {
    const perBranch = Math.max(1, Math.round(input.perBranch ?? 2));
    const branches = n / perBranch;
    if (!Number.isInteger(branches)) {
      warnings.push(
        `${n} diffusori non si dividono in rami da ${perBranch}: il serie-parallelo richiede rami uguali, ` +
        'altrimenti quelli spaiati ricevono una potenza diversa dagli altri.',
      );
    }
    const b = Math.max(1, Math.round(branches));
    combN = (zn * perBranch) / b;
    combMin = (zmin * perBranch) / b;
    description = `${b} rami in parallelo, ${perBranch} diffusori in serie per ramo.`;
  }

  // in ponte ciascun canale pilota metà del carico: vede la metà dell'impedenza
  const factor = input.bridged ? 0.5 : 1;
  if (input.bridged) {
    warnings.push(
      `A ponte ciascun canale vede ${(combN * factor).toFixed(1)} Ω invece di ${combN.toFixed(1)}: ` +
      'il limite di impedenza dell’amplificatore va letto su quel numero, non su quello del carico.',
    );
  }

  return {
    nominalOhm: combN,
    minOhm: combMin,
    seenOhm: combN * factor,
    seenMinOhm: combMin * factor,
    perSpeakerFraction: 1 / n,
    description,
    warnings,
  };
}

/**
 * Verifica contro il limite dell'amplificatore.
 *
 * Il confronto va fatto sul MINIMO della curva. Un amplificatore dichiarato
 * «stabile su 4 ohm» collegato a due casse da 8 in parallelo vede 4 ohm
 * nominali, ma se ciascuna scende a 6 il minimo reale è 3: è lì che la
 * protezione interviene, o che l'amplificatore si scalda.
 */
export function checkLoad(
  load: LoadResult, ampMinOhm: number,
): { ok: boolean; marginPercent: number; warnings: string[] } {
  const warnings: string[] = [];
  const ok = load.seenMinOhm >= ampMinOhm - 1e-9;
  if (!ok) {
    warnings.push(
      `Il carico scende a ${load.seenMinOhm.toFixed(1)} Ω contro i ${ampMinOhm} Ω minimi dell'amplificatore: ` +
      'sotto quel valore la corrente richiesta supera quella che l’uscita regge, e interviene la protezione ' +
      '— oppure, su apparecchi senza protezione, si guasta lo stadio finale.',
    );
  } else if (load.nominalOhm >= ampMinOhm && load.minOhm < ampMinOhm) {
    warnings.push(
      `Sulla carta il carico è ${load.nominalOhm.toFixed(1)} Ω, ma il minimo della curva arriva a ` +
      `${load.minOhm.toFixed(1)} Ω: è quello il numero da confrontare col limite dell'amplificatore.`,
    );
  }
  return { ok, marginPercent: (load.seenMinOhm / ampMinOhm - 1) * 100, warnings };
}

/**
 * Linea a tensione costante (100 V / 70 V), per impianti distribuiti.
 *
 * Qui non si ragiona a impedenze ma a potenze: ogni diffusore ha un
 * trasformatore con prese da tot watt, e la somma delle prese non deve
 * superare la potenza dell'amplificatore. L'impedenza equivalente della linea
 * è Z = V²/P, e serve solo per il calcolo del cavo.
 */
export function constantVoltageLine(
  lineV: number, tapsW: number[], ampPowerW: number,
): { totalW: number; equivalentOhm: number; currentA: number; usePercent: number; warnings: string[] } {
  const total = tapsW.reduce((a, b) => a + b, 0);
  const warnings: string[] = [];
  // margine del 20%: è la prassi, perché le prese dei trasformatori hanno
  // tolleranza e perché il trasformatore stesso ha perdite
  if (total > ampPowerW * 0.8) {
    warnings.push(
      `Le prese sommano ${total} W su un amplificatore da ${ampPowerW} W: lascia almeno il 20% di margine ` +
      '(quindi non oltre ' + Math.floor(ampPowerW * 0.8) + ' W), perché i trasformatori di linea hanno ' +
      'perdite proprie e le prese hanno tolleranza.',
    );
  }
  return {
    totalW: total,
    equivalentOhm: total > 0 ? (lineV * lineV) / total : Infinity,
    currentA: total > 0 ? total / lineV : 0,
    usePercent: ampPowerW > 0 ? (total / ampPowerW) * 100 : 0,
    warnings,
  };
}
