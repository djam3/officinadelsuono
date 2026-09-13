/**
 * Enclosure & Driver — Thiele/Small, casse sealed/vented/passive-radiator/bandpass
 * Formule da Part 1 del knowledge base (Thiele 1961, Small 1972–73, Keele 1973,
 * Dickason "Loudspeaker Design Cookbook").
 */

import { airDensity, speedOfSound, TWO_PI, logFreqGrid } from './constants';
import type { TSParams, SealedResult, VentedResult, AlignmentType, CurvePoint } from './types';

// ═══════════════════════════════════════════════════════════════════════════
//  THIELE-SMALL
// ═══════════════════════════════════════════════════════════════════════════

export const calcQts = (qms: number, qes: number) => (qms * qes) / (qms + qes);

/** EBP = Fs/Qes → selettore tipo cassa */
export const calcEBP = (fs: number, qes: number) => fs / qes;
export function recommendEnclosure(ebp: number): 'sealed' | 'either' | 'vented' {
  if (ebp <= 50) return 'sealed';
  if (ebp >= 100) return 'vented';
  return 'either';
}

/** Vas (litri) pratico: 0.0014 · Sd_cm²² · Cms_(mm/N) */
export const calcVasFromCms = (sdCm2: number, cmsMmPerN: number) => 0.0014 * sdCm2 * sdCm2 * cmsMmPerN;

/** Mms (g) da Fs e Cms(mm/N): Mms = 1/((2πFs)²·Cms) */
export function calcMmsFromFsCms(fs: number, cmsMmPerN: number): number {
  const cms = cmsMmPerN / 1000; // m/N
  const mms = 1 / (Math.pow(TWO_PI * fs, 2) * cms); // kg
  return mms * 1000; // g
}

/** Cms (mm/N) da Vas(litri) e Sd(cm²): Vas = ρc²·Sd²·Cms */
export function calcCmsFromVas(vasL: number, sdCm2: number, tempC = 20): number {
  const rho = airDensity(tempC);
  const c = speedOfSound(tempC);
  const sd = sdCm2 / 1e4; // m²
  const vas = vasL / 1000; // m³
  const cms = vas / (rho * c * c * sd * sd); // m/N
  return cms * 1000; // mm/N
}

/** Efficienza di riferimento η0 (frazione) e sensibilità SPL 1W/1m (half-space) */
export function calcSensitivity(fs: number, vasL: number, qes: number, tempC = 20): { eta0: number; splHalfSpace: number } {
  const c = speedOfSound(tempC);
  const vas = vasL / 1000; // m³
  const eta0 = ((4 * Math.PI * Math.PI) / Math.pow(c, 3)) * ((Math.pow(fs, 3) * vas) / qes);
  const splHalfSpace = 112.16 + 10 * Math.log10(eta0); // costante esatta, non 112 tondo
  return { eta0, splHalfSpace };
}

/** Vd (cm³) = Sd(cm²) · Xmax(mm)/10 ; predittore output LF */
export const calcVd = (sdCm2: number, xmaxMm: number) => sdCm2 * (xmaxMm / 10);

// ═══════════════════════════════════════════════════════════════════════════
//  CASSA CHIUSA (SEALED)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vb (litri) per un Qtc target.
 *
 * Senza perdite Vb = Vas/((Qtc/Qts)² − 1). Con l'assorbente il Qa smorza in
 * parallelo, quindi per arrivare allo STESSO Qtc serve una cassa piu piccola.
 * La correzione ha forma chiusa: da 1/Qtc = 1/(Qts·k) + 1/Qa, con k il fattore
 * sqrt(alpha + 1), si ricava k = 1/(Qts·(1/Qtc − 1/Qa)) e quindi alpha = k² − 1.
 * Senza questa correzione chiedere Qtc 0.707 con la cassa riempita restituiva
 * un volume che in realta dava un Qtc piu basso del richiesto.
 */
export function sealedFromQtc(ts: TSParams, targetQtc: number, qa?: number): SealedResult {
  let ratio: number;
  if (qa && isFinite(qa) && qa > 0 && 1 / targetQtc > 1 / qa) {
    // lo stesso Q che usa sealedFromVb: il parallelo di Qes e Qms quando ci
    // sono entrambi, altrimenti il Qts dichiarato. Usare due decomposizioni
    // diverse nelle due funzioni lasciava il target mancato dello 0.6%.
    const q = ts.qes && ts.qms ? (ts.qes * ts.qms) / (ts.qes + ts.qms) : ts.qts;
    const k = 1 / (q * (1 / targetQtc - 1 / qa));
    ratio = k * k - 1;
  } else {
    ratio = Math.pow(targetQtc / ts.qts, 2) - 1;
  }
  const vb = ratio > 0 ? ts.vas / ratio : ts.vas * 2;
  return sealedFromVb(ts, vb, qa);
}

/**
 * Qtc e risposta da un volume Vb dato.
 *
 * Con `qa` le perdite per assorbimento della cassa entrano in parallelo agli
 * altri due smorzamenti, come nel circuito equivalente di Small:
 *   1/Qtc = 1/Qec + 1/Qmc + 1/Qa
 * Qec e Qmc sono il Qes e il Qms del driver riscalati in cassa dello stesso
 * fattore sqrt(alpha + 1) con cui sale la risonanza. Senza il termine Qa il
 * materiale assorbente cambiava il volume apparente ma non smorzava nulla,
 * mentre nella cassa chiusa e proprio quello il suo effetto piu udibile.
 */
export function sealedFromVb(ts: TSParams, vbL: number, qa?: number): SealedResult {
  const alpha = ts.vas / vbL;
  const scale = Math.sqrt(alpha + 1);
  let qtc = ts.qts * scale;
  if (qa && isFinite(qa) && qa > 0) {
    const qec = (ts.qes ?? ts.qts) * scale;
    const qmc = (ts.qms ?? ts.qts * 10) * scale;
    qtc = 1 / (1 / qec + 1 / qmc + 1 / qa);
  }
  const fc = ts.fs * scale;
  // F3
  const inv = 1 / (qtc * qtc);
  const f3 = fc * Math.sqrt(((inv - 2) + Math.sqrt(Math.pow(inv - 2, 2) + 4)) / 2);
  let peakingDb = 0;
  if (qtc > 0.707) {
    peakingDb = 20 * Math.log10(qtc / Math.sqrt(1 - 1 / (4 * qtc * qtc)));
  }
  return { vb: vbL, qtc, fc, f3, alpha, peakingDb };
}

// ═══════════════════════════════════════════════════════════════════════════
//  CASSA BASS-REFLEX (VENTED)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Rapporti esatti delle famiglie QB3 e C4.
 *
 * Entrambe discendono dalle stesse due condizioni sul denominatore, e
 * differiscono solo per quale coefficiente si lascia libero. Passano tutte e
 * due esattamente per il Butterworth a Qts = cos(3*pi/8) = 0.38268, che e
 * l'unico punto in cui il risultato e noto in forma chiusa e quindi l'unico
 * controllo che non ammette opinioni.
 *
 * Sono gli allineamenti SENZA perdite, come sono pubblicate le tabelle
 * classiche: le perdite reali della cassa entrano dopo, quando il motore
 * calcola la risposta con il QL effettivo.
 */
function qb3c4Ratios(qts: number): { alpha: number; h: number } {
  const q = Math.min(Math.max(qts, 0.05), 0.95);
  const a2 = (Math.SQRT2 * Math.sqrt(1 - q * q)) / q;
  const h = 2 * Math.SQRT2 * q * Math.sqrt(1 - q * q);
  const alpha = h * (a2 - h) - 1;
  // sotto questa soglia la cassa diventa assurdamente grande (alpha piccolo
  // significa Vb = Vas/alpha): meglio fermarsi che restituire un numero che
  // nessuno costruira mai
  return { alpha: Math.max(alpha, 0.05), h };
}

/** Allineamenti classici → (alpha = Vas/Vb, h = Fb/Fs) per QL dato (≈7) */
export function alignmentRatios(ts: TSParams, alignment: AlignmentType, ql = 7): { alpha: number; h: number } {
  const q = ts.qts;
  switch (alignment) {
    case 'B4': {
      // Definizione esatta del Butterworth 4° ordine: α = √2, h = 1, che si
      // realizza a Qts = cos(3π/8) ≈ 0.3827. NON è una famiglia: con un Qts
      // diverso il risultato non è più massimamente piatto, e infatti il
      // progetto avvisa. La curva mostrata resta quella vera.
      return { alpha: Math.SQRT2, h: 1 };
    }
    case 'QB3': {
      // Forma ESATTA, non un curve-fit. Le famiglie di allineamento nascono
      // dalle condizioni di massima piattezza sul denominatore normalizzato
      // D(s) = s^4 + a1*s^3 + a2*s^2 + a3*s + 1:
      //
      //   |D(jO)|^2 = O^8 + (a1^2 - 2a2)O^6 + (a2^2 + 2 - 2a1a3)O^4
      //                   + (a3^2 - 2a2)O^2 + 1
      //
      // Il QB3 annulla i termini in O^4 e O^2 e lascia positivo quello in O^6:
      // niente ondulazione, discesa di tipo terzo ordine. Da a2^2 + 2 = 2/Qts^2
      // e a3^2 = 2a2 discendono in chiuso
      //
      //   a2 = sqrt(2)*sqrt(1 - Qts^2)/Qts       h = 2*sqrt(2)*Qts*sqrt(1 - Qts^2)
      //   alpha = h*(a2 - h) - 1
      //
      // Le condizioni ammettono due rami, h e 1/h, ma uno solo e utilizzabile:
      // a Qts 0.25 il ramo scartato darebbe F3 = 164 Hz su un driver con Fs 38,
      // cioe un allineamento che nessuno userebbe mai. Quello tenuto da 48 Hz.
      //
      // Il fit precedente sbagliava del 15.8% su alpha proprio a Qts 0.3827,
      // dove QB3 e B4 devono coincidere: dava alpha 1.19 invece di 1.414, e la
      // risposta che ne usciva aveva la F3 quasi doppia del dovuto.
      return qb3c4Ratios(q);
    }
    case 'C4': {
      // Stessa costruzione del QB3 ma si annullano i termini in O^6 e O^4,
      // lasciando negativo quello in O^2: nasce l'ondulazione in banda che
      // caratterizza il Chebyshev, in cambio di piu estensione. Il risultato
      // La forma e la stessa del QB3: QB3, B4 e C4 non sono tre famiglie
      // separate ma un unico continuo, ed e il Qts a decidere il carattere
      // della risposta. Sotto 0.3827 il termine in O^2 resta positivo e non
      // c'e ondulazione (quasi-Butterworth); sopra diventa negativo e nasce
      // l'ondulazione in banda del Chebyshev, in cambio di piu estensione.
      // Il fit precedente dava alpha 0.675 invece di 1.414 all'ancora,
      // sbagliando del 52%.
      return qb3c4Ratios(q);
    }
    case 'SBB4': {
      // Forma ESATTA della famiglia SBB4: nasce da due sezioni del 2° ordine
      // identiche in cascata, G(s) = s⁴/(s²+2ζs+1)², da cui
      //   ζ = ¼(1/Qts + 1/QL)   e   α = ¼(1/Qts − 1/QL)² ,  h = 1.
      // Sostituisce il curve-fit di Bullock, che sbagliava fino al 5% ai bordi.
      return { alpha: 0.25 * Math.pow(1 / q - 1 / ql, 2), h: 1 };
    }
    case 'SC4': {
      // Bullock SC4 (sub-Chebyshev): per Qts alti, box ampia e Fb sotto Fs.
      // Estensione in basso maggiore del C4 al prezzo di un lieve ripple.
      const vb = 22 * ts.vas * Math.pow(q, 2.5);
      const fb = 0.36 * ts.fs * Math.pow(q, -0.85);
      return { alpha: ts.vas / vb, h: fb / ts.fs };
    }
    case 'BESSEL': {
      const vb = 16 * ts.vas * Math.pow(q, 2.9);
      const fb = 0.40 * ts.fs * Math.pow(q, -0.9);
      return { alpha: ts.vas / vb, h: fb / ts.fs };
    }
    default: { // CUSTOM fallback ~ Keele
      const vb = 15 * ts.vas * Math.pow(q, 2.87);
      const fb = 0.42 * ts.fs * Math.pow(q, -0.9);
      return { alpha: ts.vas / vb, h: fb / ts.fs };
    }
  }
}

/**
 * Lunghezza porta (mm) — Lv = (23562.5·Dv²·Np)/(Fb²·Vb_L) − k·Dv (Dv in cm).
 * k: 0.614 (2 estremi liberi), 0.732 (1 flangiato), 0.850 (2 flangiati).
 */
export function portLength(dvMm: number, fb: number, vbL: number, np = 1, k = 0.732): number {
  const dv = dvMm / 10; // cm
  const lvCm = (23562.5 * dv * dv * np) / (fb * fb * vbL) - k * dv;
  return Math.max(2.5, lvCm) * 10; // mm, minimo ~25mm
}

/** Fb (Hz) da lunghezza porta nota */
export function tuningFromPort(dvMm: number, lvMm: number, vbL: number, np = 1, k = 0.732): number {
  const dv = dvMm / 10;
  const lv = lvMm / 10;
  return Math.sqrt((23562.5 * dv * dv * np) / (vbL * (lv + k * dv)));
}

/** Velocità aria in porta (m/s) al picco (≈ a Fb) e area minima di Small */
export function portVelocity(ts: TSParams, fb: number, dvMm: number, np = 1): { velocity: number; minVentAreaCm2: number; portAreaCm2: number } {
  const sd = (ts.sd ?? 0) / 1e4; // m²
  const xmax = (ts.xmax ?? 0) / 1000; // m
  const r = (dvMm / 2) / 1000; // m
  const portArea = Math.PI * r * r * np; // m²
  // velocità: v = Xmax·Sd·2π·fb / Sp
  const velocity = portArea > 0 ? (xmax * sd * TWO_PI * fb) / portArea : 0;
  // Small: Sv > 0.8·Fb·Vd  (Vd in m³ → Sv in m²)
  const vd = sd * xmax; // m³
  const minVentArea = 0.8 * fb * vd; // m²
  return { velocity, minVentAreaCm2: minVentArea * 1e4, portAreaCm2: portArea * 1e4 };
}

/**
 * Curva velocità aria in porta (m/s) vs frequenza.
 * Il condotto è la massa di un risonatore di Helmholtz: la velocità dell'aria
 * ha un picco a Fb (valore dalla formula di Small, caso peggiore a Xmax) e
 * scende con la risposta del risonatore (Q ≈ QL della cassa).
 */
export function portVelocityCurve(
  ts: TSParams, fb: number, dvMm: number, np = 1, ql = 7,
  fMin = 15, fMax = 250, points = 140,
): CurvePoint[] {
  const peak = portVelocity(ts, fb, dvMm, np).velocity;
  return logFreqGrid(fMin, fMax, points).map(f => ({
    f,
    v: peak / Math.sqrt(1 + ql * ql * Math.pow(f / fb - fb / f, 2)),
  }));
}

/** Progetto vented completo da allineamento + diametro porta scelto */
export function ventedDesign(
  ts: TSParams,
  alignment: AlignmentType,
  dvMm: number,
  np = 1,
  k = 0.732,
  custom?: { vbL: number; fb: number }
): VentedResult {
  let vb: number, fb: number, alpha: number, h: number;
  if (alignment === 'CUSTOM' && custom) {
    vb = custom.vbL; fb = custom.fb; alpha = ts.vas / vb; h = fb / ts.fs;
  } else {
    const r = alignmentRatios(ts, alignment);
    alpha = r.alpha; h = r.h;
    vb = ts.vas / alpha;
    fb = h * ts.fs;
  }
  const lv = portLength(dvMm, fb, vb, np, k);
  const pv = portVelocity(ts, fb, dvMm, np);
  const f3 = 0.26 * ts.fs * Math.pow(ts.qts, -1.4); // stima
  return {
    vb, fb, f3, alpha, h, alignment,
    portDiameter: dvMm, portLength: lv, portCount: np,
    portVelocity: pv.velocity, minVentArea: pv.minVentAreaCm2,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  PASSIVE RADIATOR (accordo per massa aggiunta)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Accordo PR: Fb = 1/(2π·√(Cmsr·Mres)). Dato un Fb target e la compliance del
 * PR (da Vas_pr & Vb), ricava la massa totale necessaria del PR.
 */
export function passiveRadiatorTuning(params: {
  vbL: number;
  fbTarget: number;
  prVasL: number;   // Vas del radiatore passivo
  prSdCm2: number;  // area PR
  tempC?: number;
}): { totalMassG: number; cmsr: number } {
  const { vbL, fbTarget, prVasL, prSdCm2, tempC = 20 } = params;
  const rho = airDensity(tempC);
  const c = speedOfSound(tempC);
  const sd = prSdCm2 / 1e4; // m²
  // Compliance meccanica del PR, dal suo Vas: Cmp = Vas/(ρc²·Sd²)
  const cmp = (prVasL / 1000) / (rho * c * c * sd * sd); // m/N
  // Compliance ACUSTICA dell'aria in cassa: Cab = Vb/(ρc²)
  const cab = (vbL / 1000) / (rho * c * c); // m⁵/N
  // Riferita al lato meccanico del PR si DIVIDE per Sd², non si moltiplica:
  // Cm = x/F, con x = V/Sd e F = p·Sd, quindi Cm = (V/p)/Sd² = Cab/Sd².
  const cabMech = cab / (sd * sd); // m/N
  // Sospensione del PR e molla d'aria agiscono in parallelo sullo stesso cono:
  // le rigidezze si sommano, quindi le compliance si combinano così.
  const cmsr = (cmp * cabMech) / (cmp + cabMech);
  // Mres dalla frequenza: Mres = 1/((2πFb)²·Cmsr)
  const mres = 1 / (Math.pow(TWO_PI * fbTarget, 2) * cmsr); // kg
  // è la massa mobile TOTALE che il radiatore deve avere: quanto zavorrare
  // dipende da quanto pesa già il PR scelto, dato che il costruttore dichiara
  const totalMassG = mres * 1000;
  return { totalMassG, cmsr };
}

// ═══════════════════════════════════════════════════════════════════════════
//  BANDPASS (4°/6° ordine)
// ═══════════════════════════════════════════════════════════════════════════

export interface Bandpass4Result {
  vrL: number;          // camera posteriore sigillata (litri)
  vfL: number;          // camera anteriore accordata (litri)
  fb: number;           // accordo della camera anteriore (Hz)
  fcRear: number;       // risonanza del driver nella sola camera posteriore (Hz)
  qtc: number;          // Q del driver nella camera posteriore
  qProto: number;       // Q del passa-basso prototipo: >0.707 = gobba in banda
  gamma: number;        // C_at/C_af: comanda guadagno e larghezza di banda
  portLengthMm: number;
  fL: number;           // −3 dB inferiore (senza perdite)
  fH: number;           // −3 dB superiore (senza perdite)
  gainDb: number;       // guadagno in banda sul riferimento del driver
  rippleDb: number;     // gobba residua in banda
  warnings: string[];
}

/**
 * Bandpass 4° ordine (single-reflex): camera posteriore SIGILLATA Vr, camera
 * anteriore ACCORDATA Vf, e il driver in mezzo che non irradia mai diretto.
 *
 * Prima qui i volumi non venivano da nessun allineamento: la camera posteriore
 * era quella di una cassa chiusa a Qtc 0.707 e l'anteriore ne era una frazione,
 * quindi il guadagno in banda — che è il motivo per cui un bandpass si
 * costruisce — usciva dove capitava, e non c'era modo di chiederne uno.
 * Anche gli estremi di banda erano una stima inventata (fb·√(1+1/S)).
 *
 * Ricavato invece dal circuito (le stesse maglie di bandpassCircuit.ts), con
 * x = s/ωc, h = Fb/Fc, γ = C_at/C_af = α_f/(1+α_r):
 *
 *   G(x) = h²x² / [ x⁴ + (1/Qtc)x³ + (1+h²+γ)x² + (h²/Qtc)x + h² ]
 *
 * Perché questa sia la trasformata passa-banda di un passa-basso del 2° ordine
 * — cioè perché la risposta sia geometricamente simmetrica attorno al centro —
 * il denominatore deve essere reciproco, e lo è solo se a1/a3 = √a0, cioè
 * **h = 1: Fb = Fc**. Con h = 1 il confronto con la trasformata dà
 *
 *   banda frazionaria B = √γ      Q del prototipo Q = Qtc·√γ
 *   guadagno al centro = 1/γ      (rispetto al riferimento del driver)
 *
 * Da qui il progetto si inverte: il guadagno chiesto fissa γ, e S = Vf/Vr
 * fissa come dividere la compliance fra le due camere:
 *
 *   γ = 10^(−dB/20)     α_r = γS/(1 − γS)     α_f = α_r/S
 *
 * Con γ = 1 (0 dB) viene α_r = S/(1−S): S piccolo = cassa grande e banda
 * stretta, S grande = cassa piccola e banda larga. Il massimo piatto
 * (Butterworth, Q = 0.707) capita a Qtc·√γ = 1/√2.
 *
 * Verifica: alimentando il circuito equivalente con i volumi che escono di qui
 * e QL→∞, il guadagno in banda torna 0.000 dB contro gli 0 chiesti e i due
 * estremi a −3 dB entro lo 0.07%.
 */
export function bandpass4thOrder(ts: TSParams, params: {
  /** Vf/Vr: come si divide la compliance fra le due camere */
  S: number;
  /** guadagno in banda voluto, dB sul riferimento del driver */
  gainDb?: number;
  /** se la camera posteriore è imposta, comanda lei e il guadagno viene di conseguenza */
  vrFixedL?: number;
  dvMm: number;
  np?: number;
}): Bandpass4Result {
  const { S, gainDb = 0, vrFixedL, dvMm, np = 1 } = params;
  const warnings: string[] = [];
  const s = Math.min(Math.max(S, 0.05), 4);

  let gamma: number;
  let alphaR: number;
  if (vrFixedL && vrFixedL > 0) {
    alphaR = ts.vas / vrFixedL;
    gamma = (alphaR / s) / (1 + alphaR);
  } else {
    gamma = Math.pow(10, -gainDb / 20);
    // α_r = γS/(1−γS): oltre γS = 1 la camera posteriore dovrebbe essere
    // negativa, cioè quel guadagno con quel rapporto di volumi non esiste
    if (gamma * s >= 0.95) {
      const gMin = 20 * Math.log10(s / 0.95);
      warnings.push(
        `Con S = ${s.toFixed(2)} un guadagno di ${gainDb.toFixed(1)} dB non è ottenibile: ` +
        `servirebbe una camera posteriore infinita. Il minimo con questo S è ${gMin.toFixed(1)} dB.`,
      );
      gamma = 0.95 / s;
    }
    alphaR = (gamma * s) / (1 - gamma * s);
  }

  const vr = ts.vas / alphaR;
  const vf = s * vr;
  const fc = ts.fs * Math.sqrt(1 + alphaR);
  const qtc = ts.qts * Math.sqrt(1 + alphaR);
  const fb = fc; // condizione di simmetria h = 1

  // prototipo passa-basso equivalente
  const B = Math.sqrt(gamma);
  const qProto = qtc * B;

  // −3 dB del prototipo: (1−Λ²)² + Λ²/Q² = 2, poi antitrasformato
  const k = 1 / (qProto * qProto) - 2;
  const lambda = Math.sqrt((-k + Math.sqrt(k * k + 4)) / 2);
  const hi = (B * lambda + Math.sqrt(B * B * lambda * lambda + 4)) / 2;

  // sopra Q = 1/√2 il prototipo ha una gobba, e il bandpass la eredita
  const ripple = qProto > Math.SQRT1_2
    ? 20 * Math.log10(qProto / Math.sqrt(1 - 1 / (4 * qProto * qProto)))
    : 0;

  return {
    vrL: vr,
    vfL: vf,
    fb,
    fcRear: fc,
    qtc,
    qProto,
    gamma,
    portLengthMm: portLength(dvMm, fb, vf, np),
    fL: fc / hi,
    fH: fc * hi,
    gainDb: -20 * Math.log10(gamma),
    rippleDb: ripple,
    warnings,
  };
}


export interface Bandpass6Result {
  vrL: number;          // camera posteriore (litri)
  fbRear: number;       // accordo camera posteriore (Hz)
  portRearLenMm: number;
  vfL: number;          // camera anteriore (litri)
  fbFront: number;      // accordo camera anteriore (Hz)
  portFrontLenMm: number;
  fL: number;           // stima -3 dB
  fH: number;
}

/**
 * Bandpass 6° ordine serie (entrambe le camere accordate): camera posteriore
 * da allineamento QB3, camera anteriore Vf = S·Vr accordata più in alto
 * (ratio·FbRear). Qui si ricavano solo i volumi e gli accordi di partenza; la
 * risposta la calcola il circuito equivalente in bandpassCircuit.ts.
 */
export function bandpass6thOrder(ts: TSParams, params: {
  S?: number;        // Vf/Vr (default 0.6)
  ratio?: number;    // FbFront/FbRear (default 1.6)
  dvMm: number;
  np?: number;
}): Bandpass6Result {
  const { S = 0.6, ratio = 1.6, dvMm, np = 1 } = params;
  const r = alignmentRatios(ts, 'QB3');
  const vr = ts.vas / r.alpha;
  const fbRear = r.h * ts.fs;
  const vf = S * vr;
  const fbFront = fbRear * ratio;
  const portRearLenMm = portLength(dvMm, fbRear, vr, np);
  const portFrontLenMm = portLength(dvMm, fbFront, vf, np);
  // bordi banda solo indicativi: quelli veri li misura il circuito sulla curva
  const fL = fbRear * 0.9;
  const fH = fbFront * 1.15;
  return { vrL: vr, fbRear, portRearLenMm, vfL: vf, fbFront, portFrontLenMm, fL, fH };
}

