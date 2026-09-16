/**
 * Quanto è robusto il progetto se il driver non è quello sulla scheda.
 *
 * IL PROBLEMA. Tutto il calcolo parte da tre numeri — Fs, Vas, Qts — presi
 * dalla scheda del costruttore. Ma quei numeri sono la MEDIA di una
 * produzione, non la misura dell'esemplare che hai in mano: due woofer dello
 * stesso lotto possono avere la sospensione più morbida o più rigida l'uno
 * rispetto all'altro, ed è normale, non è un difetto. In più la sospensione si
 * ammorbidisce da sola nelle prime ore di funzionamento: il rodaggio è una
 * variazione di cedevolezza come le altre, solo che capita a tutti e sempre
 * nello stesso verso.
 *
 * La domanda che conta non è «qual è la curva» ma «di quanto cambia se il
 * driver non è nominale». Un allineamento che si sfascia con il 10% di
 * cedevolezza in più è un allineamento sbagliato, anche se sulla carta è
 * perfetto.
 *
 * LA COSA CHE QUASI TUTTI SBAGLIANO. Non si fanno variare Fs, Vas e Qts a
 * caso e indipendentemente: sono legati, e discendono dalle STESSE grandezze
 * fisiche. Se cambia la cedevolezza Cms cambiano tutti e tre insieme, con
 * rapporti fissati:
 *
 *   Vas = rho0*c^2*Sd^2*Cms      ->  Vas proporzionale a Cms
 *   Fs  = 1/(2*pi*sqrt(Mms*Cms)) ->  Fs  proporzionale a 1/sqrt(Cms)
 *   Qms = 2*pi*Fs*Mms/Rms        ->  Qms proporzionale a Fs
 *   Qes = 2*pi*Fs*Mms*Re/Bl^2    ->  Qes proporzionale a Fs
 *
 * quindi una sospensione più morbida del 20% dà Vas +20%, Fs −8,7% e tutti i
 * Q −8,7%. Muovere Fs senza muovere Vas descrive un driver che non esiste, e
 * la banda di tolleranza che ne esce è più larga del vero in un verso e più
 * stretta nell'altro.
 *
 * La seconda sorgente indipendente è il MOTORE: magneti e traferri variano a
 * loro volta, e lì cambia solo Bl. Fs e Vas restano dove sono (non dipendono
 * da Bl), Qms nemmeno (è meccanico), e si muove il solo Qes, con il quadrato:
 * Qes è proporzionale a 1/Bl². Un motore più forte del 5% dà Qes −9,3%. È il
 * motivo per cui il Qts è il parametro che balla di più: raccoglie le due
 * variazioni insieme.
 *
 * LA CASSA RESTA QUELLA. Nella simulazione volume e accordo NON si
 * ricalcolano: la cassa è già stata costruita su misura nominale, e il punto
 * è proprio vedere cosa ci succede dentro quando il driver è diverso. Quindi
 * Vb e Fb restano fissi e cambia solo il driver — che è esattamente quello
 * che capita nella realtà.
 */

import { computeResponse } from './response';
import type { CurvePoint, TSParams } from './types';

/**
 * Fin dove si calcola la curva. Serve solo a fissare il riferimento della
 * banda passante, e va abbastanza in alto da coglierne l'asintoto: fermandosi
 * a 500 Hz, su una cassa poco smorzata il riferimento resta 0,1 dB sotto il
 * vero e l'F3 letto sbaglia fino all'1,8%. A 2 kHz l'errore scende sotto lo
 * 0,15% su tutti i casi provati contro la soluzione in forma chiusa.
 */
const F_ALTA = 2000;

/** i due scostamenti indipendenti, in percentuale sul valore nominale */
export interface Scostamento {
  /** cedevolezza della sospensione: + è più morbida (Vas su, Fs giù) */
  cedevolezzaPct: number;
  /** forza del motore Bl: + è più forte (Qes giù col quadrato) */
  motorePct: number;
}

/** se manca Qes ma ci sono Qts e Qms, l'identità lo restituisce */
function qesDaQts(ts: TSParams): number | undefined {
  const qms = ts.qms ?? 0;
  if (qms <= 0 || qms <= ts.qts) return undefined;
  return (qms * ts.qts) / (qms - ts.qts);
}

/**
 * Applica uno scostamento fisico al driver.
 *
 * Tutto quello che discende da Cms e da Bl si muove insieme; quello che non
 * dipende da loro — Mms, Sd, Re, Le, Xmax — resta identico.
 */
export function variaDriver(ts: TSParams, s: Scostamento): TSParams {
  const c = 1 + s.cedevolezzaPct / 100;   // Cms'/Cms
  const b = 1 + s.motorePct / 100;        // Bl'/Bl
  if (c <= 0 || b <= 0) return ts;

  const radC = Math.sqrt(c);

  const fs = ts.fs / radC;
  const vas = ts.vas * c;
  // Qms e Qes seguono Fs; Qes prende in più il quadrato del motore
  const qms = (ts.qms ?? 0) > 0 ? (ts.qms as number) / radC : undefined;
  const qesBase = (ts.qes ?? 0) > 0 ? ts.qes : qesDaQts(ts);
  const qes = qesBase !== undefined ? qesBase / (radC * b * b) : undefined;

  // Qts si RICALCOLA dall'identità, non si scala: se solo il motore cambia,
  // Qms resta fermo e il parallelo non è più proporzionale a niente.
  const qts = qms !== undefined && qes !== undefined
    ? (qms * qes) / (qms + qes)
    : ts.qts / radC;

  return {
    ...ts,
    fs, vas, qts,
    qms: qms ?? ts.qms,
    qes: qes ?? ts.qes,
    cms: ts.cms !== undefined ? ts.cms * c : undefined,
    bl: ts.bl !== undefined ? ts.bl * b : undefined,
  };
}

/**
 * Il riferimento della banda passante.
 *
 * Per un passa-alto è l'ASINTOTO: il livello a cui la curva si appiattisce
 * ben sopra la risonanza, cioè l'ultimo punto della griglia. Il primo modo
 * che avevo scritto prendeva invece il massimo sopra gli 80 Hz — e su una
 * cassa con Qtc 1 la gobba cade a 78 Hz, appena dentro quella finestra: il
 * riferimento saliva insieme al picco e l'ondulazione misurata veniva 0,008
 * dB invece di 1,25. Un errore che si nasconde bene, perché il numero che
 * esce è plausibile.
 */
function riferimento(curva: CurvePoint[]): number {
  return curva[curva.length - 1].v;
}

/** il punto a −3 dB sotto la banda passante, interpolato fra due campioni */
export function f3Dalla(curva: CurvePoint[]): number {
  if (curva.length < 2) return 0;
  const soglia = riferimento(curva) - 3;
  for (let i = curva.length - 1; i > 0; i--) {
    const a = curva[i - 1], b = curva[i];
    if (b.v >= soglia && a.v < soglia) {
      const t = (soglia - a.v) / (b.v - a.v);
      // interpolazione in scala logaritmica: la griglia è logaritmica
      return Math.exp(Math.log(a.f) + t * (Math.log(b.f) - Math.log(a.f)));
    }
  }
  return curva[0].f;
}

/** l'ondulazione in banda: quanto la curva sale sopra il proprio riferimento */
export function piccoInBanda(curva: CurvePoint[]): number {
  if (curva.length < 2) return 0;
  const rif = riferimento(curva);
  let max = -Infinity;
  for (const p of curva) if (p.v > max) max = p.v;
  return Math.max(0, max - rif);
}

export interface Variante {
  nome: string;
  /** cosa è cambiato, in parole */
  nota: string;
  ts: TSParams;
  spl: CurvePoint[];
  fsHz: number;
  qts: number;
  f3Hz: number;
  piccoDb: number;
  /** solo cassa chiusa */
  qtcEff?: number;
}

export interface BandaTolleranza {
  varianti: Variante[];
  /** escursione di F3 fra gli estremi, in Hz e in percentuale */
  spanF3Hz: number;
  spanF3Pct: number;
  /** escursione del picco in banda, in dB */
  spanPiccoDb: number;
  giudizio: 'robusto' | 'sensibile' | 'critico';
  commento: string;
}

export interface IngressoTolleranza {
  ts: TSParams;
  tipo: 'sealed' | 'vented';
  /** volume netto della cassa, in litri: FISSO, è già costruita */
  vbL: number;
  /** accordo del condotto, in Hz: fisso anche lui (reflex) */
  fbHz?: number;
  ql?: number;
  /** ampiezza della tolleranza sulla cedevolezza, in % (± su quel valore) */
  cedevolezzaPct: number;
  /** ampiezza della tolleranza sul motore, in % */
  motorePct: number;
}

/**
 * Le tre curve: nominale e i due angoli che contano.
 *
 * Gli angoli NON sono «tutto al massimo» e «tutto al minimo» presi a caso:
 * sono i due che spingono il sistema nello stesso verso. Sospensione più
 * morbida e motore più debole alzano entrambi il Qts e abbassano la risonanza
 * — è l'angolo gonfio; il contrario è quello magro. Gli altri due incroci
 * cadono fra questi.
 */
export function bandaTolleranza(i: IngressoTolleranza): BandaTolleranza {
  const angoli: Array<{ nome: string; nota: string; s: Scostamento }> = [
    {
      nome: 'Nominale',
      nota: 'i valori della scheda',
      s: { cedevolezzaPct: 0, motorePct: 0 },
    },
    {
      nome: 'Morbido',
      nota: `sospensione +${i.cedevolezzaPct}% · motore −${i.motorePct}%`,
      s: { cedevolezzaPct: i.cedevolezzaPct, motorePct: -i.motorePct },
    },
    {
      nome: 'Rigido',
      nota: `sospensione −${i.cedevolezzaPct}% · motore +${i.motorePct}%`,
      s: { cedevolezzaPct: -i.cedevolezzaPct, motorePct: i.motorePct },
    },
  ];

  const varianti: Variante[] = angoli.map(a => {
    const ts = a.s.cedevolezzaPct === 0 && a.s.motorePct === 0 ? i.ts : variaDriver(i.ts, a.s);
    const alpha = ts.vas / i.vbL;

    let spl: CurvePoint[];
    let qtcEff: number | undefined;
    if (i.tipo === 'sealed') {
      // la cassa è quella: alpha cambia perché è cambiato Vas, non il volume
      const fc = ts.fs * Math.sqrt(1 + alpha);
      const qtc = ts.qts * Math.sqrt(1 + alpha);
      qtcEff = qtc;
      spl = computeResponse({ ts, type: 'sealed', fc, qtc, fMin: 10, fMax: F_ALTA }).spl;
    } else {
      spl = computeResponse({
        ts, type: 'vented', fb: i.fbHz ?? ts.fs, alpha, ql: i.ql ?? 7,
        fMin: 10, fMax: F_ALTA,
      }).spl;
    }

    return {
      nome: a.nome, nota: a.nota, ts, spl,
      fsHz: ts.fs, qts: ts.qts,
      f3Hz: f3Dalla(spl), piccoDb: piccoInBanda(spl), qtcEff,
    };
  });

  const f3 = varianti.map(v => v.f3Hz);
  const spanF3Hz = Math.max(...f3) - Math.min(...f3);
  const spanF3Pct = varianti[0].f3Hz > 0 ? (spanF3Hz / varianti[0].f3Hz) * 100 : 0;
  const picchi = varianti.map(v => v.piccoDb);
  const spanPiccoDb = Math.max(...picchi) - Math.min(...picchi);

  // La soglia sul picco è quella che conta davvero: mezzo dB di gonfiore in
  // più o in meno non si sente, 1,5 dB su una gobba stretta sì. Un F3 che si
  // sposta del 10% è meno di un sesto d'ottava e non cambia il progetto.
  let giudizio: BandaTolleranza['giudizio'];
  let commento: string;
  if (spanPiccoDb < 0.8 && spanF3Pct < 12) {
    giudizio = 'robusto';
    commento = 'L’allineamento regge la dispersione di produzione: dentro la tolleranza che hai impostato, un esemplare vale l’altro e la curva è praticamente la stessa. Puoi costruire sui valori di scheda.';
  } else if (spanPiccoDb < 1.8 && spanF3Pct < 22) {
    giudizio = 'sensibile';
    commento = 'Lo scarto si vede, ma non stravolge il progetto. Se hai modo di misurare il driver che userai davvero, misuralo e ricalcola sui suoi numeri: il progetto si sposterà di poco.';
  } else {
    giudizio = 'critico';
    commento = 'L’allineamento è troppo stretto per essere costruito sui soli dati di scheda: fra un esemplare e l’altro cambia il carattere della cassa. Misura il driver che userai davvero, oppure cerca una combinazione di volume e accordo più stabile — cambiandoli qui accanto, questi numeri si aggiornano subito e si vede quale regge meglio.';
  }

  // Per la cassa chiusa c'è qualcosa di più preciso da dire, e vale sempre.
  //
  // Fc² = Fs²(1 + Vas/Vb) e Qtc² = Qts²(1 + Vas/Vb). Sotto una variazione di
  // sola cedevolezza Fs² ∝ 1/Cms e Vas ∝ Cms, quindi i prodotti Fs²·Vas e
  // Qts²·Vas sono INVARIANTI: il secondo addendo di ciascuna formula non si
  // muove affatto. Più la cassa è piccola più quel secondo addendo domina, e
  // più la tolleranza della sospensione si annulla da sola. Verificato: con
  // ±15% di cedevolezza lo scarto su Fc passa dal 12,5% in una cassa da 200
  // litri all'1,0% in una da 3 litri, con lo stesso driver.
  //
  // La tolleranza del MOTORE non si annulla mai, perché non tocca Vas: lo
  // scarto su Qtc resta identico a qualunque volume (18,7% nella stessa
  // prova, tanto a 3 litri quanto a 200).
  if (i.tipo === 'sealed' && i.cedevolezzaPct > 0) {
    const alphaNom = i.ts.vas / i.vbL;
    if (alphaNom >= 2) {
      commento += ' In cassa chiusa la cassa piccola aiuta da sola: Fs²·Vas e Qts²·Vas non cambiano al variare della sospensione, e più la cassa comprime il cono più il risultato dipende da quei due prodotti invece che dai parametri presi uno per uno. Quello che resta è la tolleranza del motore, che non si annulla a nessun volume.';
    } else if (alphaNom < 1) {
      commento += ' Qui la cassa è grande rispetto al driver e non fa da riferimento: Fc e Qtc seguono quasi per intero la sospensione. Rimpicciolire il volume, oltre ad alzare il Qtc, rende il progetto meno sensibile alla tolleranza — è l’unico verso in cui le due cose vanno d’accordo.';
    }
  }

  return { varianti, spanF3Hz, spanF3Pct, spanPiccoDb, giudizio, commento };
}
