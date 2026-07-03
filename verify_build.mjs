/* Audit costruzione casse: proporzioni, volumi, porta, ampli */
import { calculateBassReflex, calculateSealed, calculateFullCabinet, recommendCabinetType, scoreAmplifierMatch } from './src/utils/cabinetCalculator.ts';
import { DRIVERS, AMPLIFIERS } from './src/data/speakerDatabase.ts';

const lf = DRIVERS.filter(d => ['subwoofer', 'woofer', 'mid-bass', 'coaxial', 'full-range'].includes(d.type));
let problems = 0;
console.log('Driver                         | Fb/Fs | v m/s | LxAxP (mm)      | H>W | Porta entra? | Vol ok? | Best amp ratio');
console.log('-'.repeat(125));
for (const d of lf) {
  const useCase = d.type === 'subwoofer' ? 'subwoofer-dedicato' : 'dj-club';
  const t = recommendCabinetType(d, useCase, 'indoor-large');
  const calc = calculateFullCabinet(d, t, useCase, 'indoor-large', true, { width: 220, height: 220, depth: 90 });
  const c = calc.cabinetDesign;
  const { width: W, height: H, depth: D } = c.externalDimensions;
  const wt = c.woodThickness;
  const intD = D - 2 * wt - 30; // profondità interna (30 = extra ampli)
  const intVol = ((W - 2 * wt) * (H - 2 * wt) * intD) / 1e6;

  const fbFs = c.port ? (c.port.tuningFrequency / d.thielSmall.fs).toFixed(2) : ' -- ';
  const vel = c.port?.airVelocity ?? 0;
  const intH = H - 2 * wt;
  // tubo dritto: deve entrare in profondità; slot: può ripiegarsi a L (fondo+retro)
  const portFits = !c.port ? true
    : c.port.shape === 'slot' ? (c.port.length <= intD + intH * 0.8)
    : (c.port.length + Math.max(80, c.port.diameter || 0) <= intD);
  const portante = c.port?.shape === 'slot' ? 'slot' : 'tubo';
  const portanteOk = H >= W;
  const volOk = intVol >= c.internalVolume * 0.92; // il box deve contenere il volume acustico
  const best = AMPLIFIERS.map(a => ({ a, s: scoreAmplifierMatch(d, a, useCase).score })).sort((x, y) => y.s - x.s)[0];
  const pw = best.a.powerPerChannel[String(d.impedance)] || 0;
  const ratio = (pw / d.powerRMS).toFixed(2);

  const flags = [];
  if (!portanteOk) { flags.push('LARGA!'); problems++; }
  if (!portFits) { flags.push('PORTA NON ENTRA!'); problems++; }
  if (!volOk) { flags.push('VOLUME BOX < ACUSTICO!'); problems++; }
  if (vel > 18) { flags.push('CHUFFING!'); problems++; }

  console.log(
    `${(d.size + '" ' + d.brand + ' ' + d.model).padEnd(30)} | ${String(fbFs).padStart(5)} | ${String(vel).padStart(5)} | ${String(W).padStart(4)}x${String(H).padStart(4)}x${String(D).padStart(4)} | ${portanteOk ? ' ok' : ' NO'} | ${portFits ? `si ${portante} (${c.port ? c.port.length : 0})` : `NO ${portante} (${c.port?.length})`} | ${volOk ? `si (${intVol.toFixed(0)}/${c.internalVolume}L)` : `NO (${intVol.toFixed(0)}/${c.internalVolume}L)`} | ${ratio}x ${flags.join(' ')}`
  );
}
console.log('-'.repeat(125));
console.log(problems === 0 ? 'AUDIT OK — nessun problema' : `PROBLEMI TROVATI: ${problems}`);
