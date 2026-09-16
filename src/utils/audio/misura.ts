/**
 * I parametri del TUO esemplare, dalla misura.
 *
 * Tutto il resto del calcolatore parte dai numeri di scheda, che sono la media
 * di una produzione. La sezione sulla tolleranza dice quando quella media non
 * basta e conviene misurare; qui c'è come si misura, e il conto che trasforma
 * quattro numeri letti su una curva di impedenza nei parametri Thiele-Small.
 *
 * Non serve niente di speciale: una resistenza di valore noto in serie al
 * driver, un generatore di toni e un programma che legga il livello — o una
 * scheda audio e uno dei programmi di misura gratuiti. Il driver va sospeso in
 * aria libera, lontano da superfici, e pilotato piano: il modello vale a
 * piccolo segnale, e a volume alto la sospensione non è più lineare.
 *
 * TRE PROCEDURE, tutte pubblicate e tutte fatte di algebra esatta:
 *
 * 1. Dalla curva di impedenza in aria libera si ricavano i Q. Il picco vale
 *    Re·(1 + Qms/Qes), e la sua larghezza misurata nei punti a √r₀·Re dà il
 *    Qms. Da lì Qes e Qts discendono senza altre misure.
 *
 * 2. Con una massa aggiunta al cono si ricava la massa mobile, e da quella la
 *    cedevolezza e il Vas.
 *
 * 3. In alternativa, montando il driver su una cassa chiusa di volume noto: la
 *    risonanza sale di √(1+α) e da α si ricava il Vas. È la strada più
 *    comoda se una cassa di prova ce l'hai già.
 *
 * OGNI PROCEDURA PORTA CON SÉ IL SUO CONTROLLO, e sono la parte più utile di
 * tutte: una misura sbagliata qui produce un numero plausibile, e senza un
 * controllo indipendente non c'è modo di accorgersene.
 */

import { TWO_PI } from './constants';
import { vasFrom } from './tsParams';

// ─── 1. I Q dalla curva di impedenza ─────────────────────────────────────────

export interface ImpedenzaMisurata {
  /** resistenza in continua della bobina, misurata col tester */
  reOhm: number;
  /** frequenza a cui l'impedenza è massima */
  fsHz: number;
  /** valore dell'impedenza al picco */
  zMaxOhm: number;
  /** frequenza sotto il picco dove |Z| = √r₀·Re */
  f1Hz: number;
  /** frequenza sopra il picco dove |Z| = √r₀·Re */
  f2Hz: number;
}

export interface QDaImpedenza {
  /** rapporto fra il picco e la resistenza in continua */
  r0: number;
  /** il livello a cui vanno letti f1 e f2 */
  livelloOhm: number;
  qms: number;
  qes: number;
  qts: number;
  /** il controllo: nel modello f1·f2 = Fs² esattamente */
  fsDaiPunti: number;
  scartoFsPct: number;
  avvisi: string[];
}

/**
 * Il picco di impedenza è un risonatore, e come ogni risonatore si descrive
 * con altezza e larghezza. L'altezza normalizzata r₀ = Zmax/Re vale Qms/Qts:
 * dice quanto pesa lo smorzamento meccanico rispetto al totale. La larghezza,
 * misurata fra i due punti a √r₀·Re, dà il Q meccanico.
 *
 * I punti a √r₀ non sono una convenzione arbitraria: sono quelli in cui la
 * parte motional scende a 1/√2 del massimo in POTENZA, cioè gli stessi «punti
 * a −3 dB» di qualsiasi altro risonatore, letti su una scala moltiplicativa
 * invece che additiva.
 */
export function qDaImpedenza(m: ImpedenzaMisurata): QDaImpedenza {
  const avvisi: string[] = [];
  const r0 = m.zMaxOhm / m.reOhm;
  const livelloOhm = Math.sqrt(r0) * m.reOhm;

  if (r0 <= 1.05) {
    avvisi.push('Il picco è troppo basso rispetto alla resistenza in continua: o la Re inserita è sbagliata, o il driver era caricato da una superficie vicina.');
  }

  const larghezza = m.f2Hz - m.f1Hz;
  const qms = larghezza > 0 ? (m.fsHz * Math.sqrt(r0)) / larghezza : 0;
  const qes = r0 > 1 ? qms / (r0 - 1) : 0;
  const qts = r0 > 0 ? qms / r0 : 0;

  // IL CONTROLLO. I due punti stanno alla stessa distanza dalla risonanza su
  // scala logaritmica, quindi la loro media geometrica è la risonanza. Se non
  // torna, uno dei tre numeri è stato letto male — quasi sempre perché la
  // curva è stata campionata troppo rada dove sale.
  const fsDaiPunti = Math.sqrt(m.f1Hz * m.f2Hz);
  const scartoFsPct = m.fsHz > 0 ? (Math.abs(fsDaiPunti - m.fsHz) / m.fsHz) * 100 : 0;
  if (scartoFsPct > 3) {
    avvisi.push(`√(f1·f2) fa ${fsDaiPunti.toFixed(1)} Hz ma la risonanza dichiarata è ${m.fsHz.toFixed(1)} Hz: nel modello devono coincidere. Rileggi i tre valori sulla curva, infittendo i punti attorno al picco.`);
  }
  if (m.f1Hz >= m.fsHz || m.f2Hz <= m.fsHz) {
    avvisi.push('f1 deve stare sotto la risonanza e f2 sopra: sembrano invertiti.');
  }

  return { r0, livelloOhm, qms, qes, qts, fsDaiPunti, scartoFsPct, avvisi };
}

// ─── 2. Vas dalla massa aggiunta ─────────────────────────────────────────────

export interface MassaAggiunta {
  fsHz: number;
  /** risonanza con la massa attaccata al cono */
  fsConMassaHz: number;
  /** massa attaccata, in grammi */
  massaG: number;
  /** area del cono, in cm² */
  sdCm2: number;
  tempC?: number;
}

export interface RisultatoMassa {
  mmsG: number;
  cmsMmN: number;
  vasL: number;
  /** di quanto è scesa la risonanza: sotto il 15% la misura è imprecisa */
  calaPct: number;
  avvisi: string[];
}

/**
 * Attaccando una massa nota al cono la risonanza scende, e di quanto scende
 * dipende solo dal rapporto fra la massa aggiunta e quella che c'era già. La
 * cedevolezza non entra: è la stessa molla prima e dopo.
 *
 *   (Fs/Fs')² = (Mms + Δm)/Mms   ⇒   Mms = Δm / ((Fs/Fs')² − 1)
 *
 * La massa va distribuita attorno al cono in modo simmetrico e attaccata in
 * modo da non irrigidire niente: strisce di nastro adesivo o pasta adesiva
 * vicino al centro, mai sulla sospensione.
 */
export function vasDaMassaAggiunta(m: MassaAggiunta): RisultatoMassa {
  const avvisi: string[] = [];
  const rapporto = m.fsConMassaHz > 0 ? Math.pow(m.fsHz / m.fsConMassaHz, 2) : 0;
  const calaPct = m.fsHz > 0 ? ((m.fsHz - m.fsConMassaHz) / m.fsHz) * 100 : 0;

  if (rapporto <= 1.0001) {
    return { mmsG: 0, cmsMmN: 0, vasL: 0, calaPct, avvisi: ['Con la massa attaccata la risonanza deve SCENDERE: i due valori sembrano invertiti o uguali.'] };
  }

  const mmsG = m.massaG / (rapporto - 1);
  const mmsKg = mmsG / 1000;
  // Cms = 1/((2π·Fs)²·Mms), in m/N; il calcolatore la usa in mm/N
  const cmsMN = 1 / (Math.pow(TWO_PI * m.fsHz, 2) * mmsKg);
  const cmsMmN = cmsMN * 1000;

  // il Vas si ricava con la stessa funzione che usa tutto il resto del
  // calcolatore: se un giorno cambia la densità dell'aria usata, cambia qui
  // dentro e non in due posti che divergono in silenzio
  const vasL = vasFrom(m.sdCm2, cmsMmN, m.tempC ?? 20);

  // Sotto il 15% di calo l'errore relativo sul rapporto si amplifica: con una
  // risoluzione di misura di 0,5 Hz su 40, un calo di 2 Hz porta il 25% di
  // incertezza sulla Mms, un calo di 8 Hz meno del 6%.
  if (calaPct < 15) {
    avvisi.push(`La risonanza è scesa solo del ${calaPct.toFixed(0)}%: aggiungi più massa. Il conto è tanto più preciso quanto più il calo è grande, e il 20–30% è la zona giusta.`);
  }
  if (calaPct > 50) {
    avvisi.push('La risonanza è più che dimezzata: con tutta quella massa il cono può flettere e non muoversi più come un corpo rigido, che è l’ipotesi su cui si regge il conto.');
  }

  return { mmsG, cmsMmN, vasL, calaPct, avvisi };
}

// ─── 3. Vas dal volume noto ──────────────────────────────────────────────────

export interface VolumeNoto {
  fsHz: number;
  /** Qts in aria libera, se lo hai: serve al controllo incrociato */
  qtsLibero?: number;
  /** volume NETTO della cassa di prova, in litri (tolto l'ingombro del driver) */
  vbL: number;
  /** risonanza misurata col driver montato sulla cassa chiusa */
  fcHz: number;
  /** Qtc misurato sulla stessa curva, se lo hai */
  qtcMisurato?: number;
}

export interface RisultatoVolume {
  /** Vas/Vb ricavato dalla risonanza */
  alphaDaF: number;
  /** Vas/Vb ricavato dal Q: due strade indipendenti per lo stesso numero */
  alphaDaQ?: number;
  vasL: number;
  scartoPct?: number;
  avvisi: string[];
}

/**
 * Montando il driver su una cassa chiusa di volume noto, l'aria dentro
 * aggiunge una molla in parallelo a quella della sospensione. Risonanza e Q
 * salgono entrambi dello stesso fattore:
 *
 *   Fc/Fs = Qtc/Qts = √(1 + Vas/Vb)
 *
 * Il fatto che il fattore sia LO STESSO per le due grandezze è il controllo
 * che rende questa procedura migliore delle altre: si ricava α due volte, per
 * due strade che non si parlano, e i due risultati devono coincidere. Se non
 * coincidono, quasi sempre la cassa perde aria.
 */
export function vasDaVolumeNoto(m: VolumeNoto): RisultatoVolume {
  const avvisi: string[] = [];
  const rapportoF = m.fsHz > 0 ? m.fcHz / m.fsHz : 0;
  const alphaDaF = rapportoF * rapportoF - 1;

  if (alphaDaF <= 0) {
    return { alphaDaF: 0, vasL: 0, avvisi: ['In cassa chiusa la risonanza deve SALIRE rispetto all’aria libera: i due valori sembrano invertiti.'] };
  }

  let alphaDaQ: number | undefined;
  let scartoPct: number | undefined;
  if (m.qtsLibero && m.qtcMisurato && m.qtsLibero > 0) {
    const rapportoQ = m.qtcMisurato / m.qtsLibero;
    alphaDaQ = rapportoQ * rapportoQ - 1;
    scartoPct = (Math.abs(alphaDaQ - alphaDaF) / alphaDaF) * 100;
    if (scartoPct > 10) {
      avvisi.push(`Le due strade danno α = ${alphaDaF.toFixed(2)} e α = ${alphaDaQ.toFixed(2)}: dovrebbero coincidere. Con il Q più alto del previsto la cassa di prova perde aria dalle giunzioni o attorno al cestello; con il Q più basso, dentro c’è del materiale assorbente che qui non ci va.`);
    }
  }

  const vasL = alphaDaF * m.vbL;

  if (alphaDaF < 0.3) {
    avvisi.push('La cassa di prova è molto più grande del Vas del driver e la risonanza si sposta poco: l’errore di lettura pesa tanto quanto lo spostamento. Usa una cassa più piccola.');
  }
  if (alphaDaF > 8) {
    avvisi.push('La cassa di prova è piccolissima rispetto al driver: a questi rapporti anche l’aria compressa si scalda e la misura perde di senso. Usa una cassa più grande.');
  }

  return { alphaDaF, alphaDaQ, vasL, scartoPct, avvisi };
}

// ─── Quello che le misure determinano senza essere misurato ──────────────────

/**
 * Il fattore di forza non si misura mai direttamente, ma quando ci sono Fs,
 * Mms, Re e Qes è già deciso: il Qes è definito proprio come
 * 2π·Fs·Mms·Re/Bl², e basta risolverlo per Bl.
 *
 * Serve perché il calcolatore controlla la congruenza del set: se dopo una
 * misura restasse il Bl dell'altoparlante di prima, comparirebbe una
 * contraddizione che non c'entra niente con la misura appena fatta.
 */
export function blDaMisure(fsHz: number, mmsG: number, reOhm: number, qes: number): number | undefined {
  if (!(fsHz > 0 && mmsG > 0 && reOhm > 0 && qes > 0)) return undefined;
  return Math.sqrt((TWO_PI * fsHz * (mmsG / 1000) * reOhm) / qes);
}
