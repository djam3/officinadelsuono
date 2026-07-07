/**
 * Preset DSP per casse attive — tagli, protezioni, gain, delay e limiter
 * per banda, pronti da caricare nel processore del modulo amplificatore.
 *
 * Regole (pratica PA con crossover attivo):
 *  - Pendenza d'incrocio: Linkwitz-Riley 24 dB/oct (somma piatta, vie in fase)
 *  - HPF di protezione sul woofer: sotto l'accordo del reflex il cono "sbatte"
 *    senza carico → HPF a ~0.8×Fb (BW24); cassa chiusa → anti-subsonico 20 Hz
 *  - Incrocio 2 vie vincolato tra 2×Fs del driver a compressione (protezione
 *    membrana) e la frequenza di beaming del woofer (direttività)
 *  - Gain: pad sulla via più sensibile per allineare le sensibilità
 *  - Delay: stima dall'offset dei centri acustici (bobina woofer vs gola tromba)
 *  - Limiter RMS per banda: Vrms = √(P·Z) del driver della banda
 */
import { limiterThreshold, beamingFreq, delayFromPath, clamp } from './audio';
import type { SpeakerDriver, CabinetDesign } from '../types/speaker';

export interface DSPBand {
  name: string;                 // 'SUB' | 'LOW' | 'HIGH'
  driverLabel: string;
  hpf: { f: number; slope: string } | null;
  lpf: { f: number; slope: string } | null;
  gainDb: number;               // 0 = riferimento; negativo = pad
  delayMs: number;
  limiterVrms: number;
  limiterDbu: number;
}

export interface DSPPreset {
  system: 'sub' | '2way';
  bands: DSPBand[];
  xoverFc: number | null;       // incrocio interno 2 vie (Hz)
  subPairFc: number;            // taglio consigliato per abbinare sub ↔ top (Hz)
  subPairSlope: string;
  notes: string[];
}

const LR24 = 'LR 24 dB/oct';
const BW24 = 'BW 24 dB/oct';
const BW12 = 'BW 12 dB/oct';

const dbu = (vrms: number) => 20 * Math.log10(vrms / 0.775);
const geoMean = (a: number, b: number) => Math.sqrt(a * b);

/** Diametro pistone effettivo (mm) dalla Sd, con fallback sul foro di montaggio */
function pistonDiaMm(d: SpeakerDriver): number {
  const sd = d.thielSmall?.sd;
  if (sd && sd > 0) return 2 * Math.sqrt((sd * 100) / Math.PI); // cm² → mm²
  return (d.mountingDiameter || d.size * 25.4) * 0.8;
}

/** Profondità stimata del centro acustico dietro il baffle (mm) */
function acousticDepthMm(d: SpeakerDriver, isHF: boolean): number {
  if (isHF) {
    // gola del driver a compressione dietro la tromba (~130mm tipico per 1"),
    // tweeter a cupola quasi sul piano del baffle
    return d.type === 'compression-driver' ? Math.max(d.depth ?? 0, 110) + 30 : (d.depth ?? 20);
  }
  // bobina del woofer ≈ 70% della profondità totale del cestello
  return (d.depth ?? d.size * 25.4 * 0.4) * 0.7;
}

/**
 * Calcola il preset DSP completo per la cassa progettata.
 * `woofer` è sempre presente; `hf` è null per il subwoofer dedicato.
 */
export function computeDSPPreset(
  woofer: SpeakerDriver,
  hf: SpeakerDriver | null,
  cabinet: CabinetDesign,
): DSPPreset {
  const notes: string[] = [];
  const bands: DSPBand[] = [];

  // ── HPF di protezione della via bassa ──────────────────────────────────────
  const fb = cabinet.port?.tuningFrequency ?? null;
  const lowHpf = fb
    ? { f: Math.round(fb * 0.8), slope: BW24 }
    : { f: 20, slope: BW12 };
  if (fb) notes.push(`HPF ${lowHpf.f} Hz: protegge il woofer sotto l'accordo (${fb} Hz) dove il reflex non fa più carico.`);
  else notes.push('HPF 20 Hz anti-subsonico: la cassa chiusa controlla il cono, basta togliere l\'infrasuono.');

  // limiter via bassa
  const lowVrms = limiterThreshold(woofer.powerRMS, woofer.impedance || 8);

  if (!hf) {
    // ── Subwoofer dedicato: banda unica + taglio verso i satelliti ───────────
    const subLpf = 100;
    bands.push({
      name: 'SUB', driverLabel: `${woofer.brand} ${woofer.model}`,
      hpf: lowHpf, lpf: { f: subLpf, slope: LR24 },
      gainDb: 0, delayMs: 0,
      limiterVrms: Math.round(lowVrms * 10) / 10, limiterDbu: Math.round(dbu(lowVrms) * 10) / 10,
    });
    notes.push(`Abbina i satelliti con HPF a ${subLpf} Hz ${LR24} e verifica la polarità all'incrocio (inverti se il basso "sparisce").`);
    return { system: 'sub', bands, xoverFc: null, subPairFc: subLpf, subPairSlope: LR24, notes };
  }

  // ── 2 vie: incrocio woofer ↔ tromba/tweeter ───────────────────────────────
  const fsHf = hf.thielSmall?.fs || 0;
  const fcFloor = Math.max(1000, fsHf > 0 ? fsHf * 2 : 1200);          // protezione membrana (≥2×Fs)
  const fcBeamPrac = beamingFreq(pistonDiaMm(woofer)) * 4.5;            // limite pratico direttività (ka≈4.5)
  const fcCeil = Math.max(fcFloor + 100, Math.min(3200, fcBeamPrac));
  const fcBase = geoMean(woofer.frequencyRange.max, hf.frequencyRange.min);
  const fc = Math.round(clamp(fcBase, fcFloor, fcCeil) / 50) * 50;      // arrotonda a 50 Hz
  if (fcFloor >= fcBeamPrac) {
    notes.push(`Incrocio a ${fc} Hz, dettato dalla protezione della via alta (≥2×Fs = ${Math.round(fcFloor)} Hz): più in basso la membrana rischia. Il woofer direziona già da ~${Math.round(fcBeamPrac)} Hz — compromesso normale nei 2 vie PA.`);
  } else {
    notes.push(`Incrocio a ${fc} Hz: sopra 2×Fs della via alta (${fsHf > 0 ? Math.round(fsHf) + ' Hz' : 'stima'}) e sotto il limite di direttività del woofer (~${Math.round(fcBeamPrac)} Hz).`);
  }

  // gain: pad sulla via più sensibile
  const diff = (hf.sensitivity || 0) - (woofer.sensitivity || 0);
  const hfGain = diff > 0 ? -Math.round(clamp(diff, 0, 18) * 2) / 2 : 0;
  const lowGain = diff < 0 ? -Math.round(clamp(-diff, 0, 18) * 2) / 2 : 0;
  if (hfGain < 0) notes.push(`Pad ${hfGain} dB sulla via alta: la tromba (${hf.sensitivity} dB) suona più forte del woofer (${woofer.sensitivity} dB).`);

  // delay: allinea i centri acustici (si ritarda la via più avanzata)
  const dLow = acousticDepthMm(woofer, false);
  const dHf = acousticDepthMm(hf, true);
  const path = Math.abs(dHf - dLow);
  const delay = delayFromPath(path, 48000);
  const delayMs = Math.round(delay.ms * 100) / 100;
  const delayOnHF = dHf < dLow; // la via col centro acustico più avanti va ritardata
  notes.push(`Delay ${delayMs} ms sulla via ${delayOnHF ? 'alta' : 'bassa'} (offset stimato ${Math.round(path)} mm) — punto di partenza, rifinire con misura.`);

  const hfVrms = limiterThreshold(hf.powerRMS, hf.impedance || 8);

  bands.push({
    name: 'LOW', driverLabel: `${woofer.brand} ${woofer.model}`,
    hpf: lowHpf, lpf: { f: fc, slope: LR24 },
    gainDb: lowGain, delayMs: delayOnHF ? 0 : delayMs,
    limiterVrms: Math.round(lowVrms * 10) / 10, limiterDbu: Math.round(dbu(lowVrms) * 10) / 10,
  });
  bands.push({
    name: 'HIGH', driverLabel: `${hf.brand} ${hf.model}`,
    hpf: { f: fc, slope: LR24 }, lpf: null,
    gainDb: hfGain, delayMs: delayOnHF ? delayMs : 0,
    limiterVrms: Math.round(hfVrms * 10) / 10, limiterDbu: Math.round(dbu(hfVrms) * 10) / 10,
  });

  const subPairFc = 100;
  notes.push(`Con un subwoofer: HPF della cassa a ${subPairFc} Hz ${LR24}, LPF del sub uguale — e controlla la polarità all'incrocio.`);

  return { system: '2way', bands, xoverFc: fc, subPairFc, subPairSlope: LR24, notes };
}
