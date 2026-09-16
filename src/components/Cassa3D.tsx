/**
 * La cassa in assonometria, disegnata dal vero.
 *
 * Non è una figura decorativa: le proporzioni sono quelle calcolate, il driver
 * ha il diametro del driver scelto, il condotto sta dove sta e ha la sua
 * sezione. Ruotandola si vede la cassa che si sta per costruire.
 *
 * PERCHÉ SCRITTO A MANO E NON CON UNA LIBRERIA 3D. In `node_modules` ci sono
 * three, fiber e drei, ma nessuno dei tre è dichiarato nel package.json: sono
 * avanzi del progetto precedente, e una installazione pulita non li
 * porterebbe. Dichiararli significherebbe aggiungere al pacchetto centinaia di
 * kilobyte per disegnare una scatola con due fori — mentre qui la geometria è
 * una manciata di facce piane e il disegno si fa con l'algoritmo del pittore:
 * si ordinano le facce dalla più lontana alla più vicina e si dipinge in
 * quell'ordine. Sono duecento righe, non hanno dipendenze e il risultato ha
 * l'aria di una vista renderizzata di un programma di disegno, che è
 * esattamente quello che serve.
 *
 * Il tratto sugli spigoli non è un effetto: in un disegno tecnico gli spigoli
 * si vedono sempre, anche sulle superfici in ombra.
 */

import { useEffect, useRef, useState } from 'react';

export interface Cassa3DProps {
  widthMm: number;
  heightMm: number;
  depthMm: number;
  wallMm: number;
  /** diametro del foro del driver (mm) */
  driverDiaMm: number;
  /** condotto circolare: diametro; a fessura: larghezza e altezza */
  port?: { kind: 'circolare'; diaMm: number; count: number }
       | { kind: 'fessura'; widthMm: number; heightMm: number }
       | null;
  /** quote da mostrare accanto agli spigoli */
  quote?: boolean;
  className?: string;
  altezzaPx?: number;
}

type V3 = [number, number, number];

interface Faccia {
  p: V3[];
  colore: [number, number, number];
  /** quanto la faccia è "dentro": le superfici incassate non prendono luce */
  incasso?: number;
  bordo?: boolean;
}

/**
 * Tinte del pannello.
 *
 * Non sono i valori del tema tali e quali: su un fondo blu scuro un solido
 * dipinto col blu scuro del tema non si stacca, e infatti la prima versione
 * aveva l'84% dei pixel dentro un'unica tonalita' — un oggetto piatto, non una
 * scatola. Qui il legno e' schiarito verso il grigio-azzurro e ogni faccia
 * parte da una tinta sua, come in una vista renderizzata: il cielo e' la piu'
 * chiara perche' guarda la luce, i fianchi la piu' scura.
 */
const PANNELLO: [number, number, number] = [0x2c, 0x4a, 0x66];
const PANNELLO_FIANCO: [number, number, number] = [0x24, 0x3e, 0x57];
const PANNELLO_CHIARO: [number, number, number] = [0x3b, 0x60, 0x82];
const CONO: [number, number, number] = [0x12, 0x23, 0x35];
const ACCENTO: [number, number, number] = [0x7f, 0xd8, 0xf5];
const TRATTO = 'rgba(220,233,245,0.55)';
const QUOTA = '#7FB2D9';

const ruotaY = ([x, y, z]: V3, a: number): V3 =>
  [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
const ruotaX = ([x, y, z]: V3, a: number): V3 =>
  [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];

function normale(p: V3[]): V3 {
  const [a, b, c] = p;
  const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const l = Math.hypot(...n) || 1;
  return [n[0] / l, n[1] / l, n[2] / l];
}

export function Cassa3D({
  widthMm, heightMm, depthMm, wallMm, driverDiaMm, port = null,
  quote = true, className = '', altezzaPx = 380,
}: Cassa3DProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [trascina, setTrascina] = useState(false);
  // l'angolo vive in un ref: cambiarlo non deve far ridisegnare React
  const vista = useRef({ yaw: -0.62, pitch: 0.30, vel: 0.0016 });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const menoMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (menoMovimento) vista.current.vel = 0;

    // ── geometria, normalizzata sul lato più lungo ──
    const scala = 1 / Math.max(widthMm, heightMm, depthMm);
    const W = widthMm * scala, H = heightMm * scala, D = depthMm * scala;
    const hw = W / 2, hh = H / 2, hd = D / 2;
    const t = Math.max(wallMm * scala, 0.004);

    const facce: Faccia[] = [];

    // il guscio: cinque facce piene più il frontale, che è forato
    facce.push({ p: [[-hw, -hh, -hd], [hw, -hh, -hd], [hw, hh, -hd], [-hw, hh, -hd]], colore: PANNELLO, bordo: true });   // retro
    facce.push({ p: [[-hw, -hh, hd], [-hw, -hh, -hd], [-hw, hh, -hd], [-hw, hh, hd]], colore: PANNELLO_FIANCO, bordo: true });   // sinistra
    facce.push({ p: [[hw, -hh, -hd], [hw, -hh, hd], [hw, hh, hd], [hw, hh, -hd]], colore: PANNELLO_FIANCO, bordo: true });       // destra
    facce.push({ p: [[-hw, hh, hd], [hw, hh, hd], [hw, hh, -hd], [-hw, hh, -hd]], colore: PANNELLO_CHIARO, bordo: true });// cielo
    facce.push({ p: [[-hw, -hh, -hd], [hw, -hh, -hd], [hw, -hh, hd], [-hw, -hh, hd]], colore: PANNELLO_FIANCO, bordo: true });   // fondo

    // ── frontale: una corona attorno al foro del driver ──
    // Un poligono con un buco non si disegna in un colpo solo: si taglia in
    // spicchi che vanno dal cerchio al perimetro. È lo stesso modo in cui un
    // programma di disegno triangola una faccia forata.
    const rD = Math.min((driverDiaMm * scala) / 2, Math.min(W, H) * 0.40);
    const cyD = hh * 0.30;                        // il driver sta in alto
    const N = 40;
    const bordoRett = (a: number): V3 => {
      // punto sul perimetro del frontale nella direzione dell'angolo a
      const c = Math.cos(a), s = Math.sin(a);
      const k = Math.min(hw / Math.max(Math.abs(c), 1e-6), (hh - cyD) / Math.max(Math.abs(s), 1e-6));
      return [c * k, cyD + s * k, hd];
    };
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * 2 * Math.PI, a1 = ((i + 1) / N) * 2 * Math.PI;
      facce.push({
        p: [
          [Math.cos(a0) * rD, cyD + Math.sin(a0) * rD, hd],
          [Math.cos(a1) * rD, cyD + Math.sin(a1) * rD, hd],
          bordoRett(a1),
          bordoRett(a0),
        ],
        colore: PANNELLO_CHIARO,
      });
    }

    // ── il cono, incassato ──
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * 2 * Math.PI, a1 = ((i + 1) / N) * 2 * Math.PI;
      facce.push({
        p: [
          [Math.cos(a0) * rD, cyD + Math.sin(a0) * rD, hd - t * 0.4],
          [Math.cos(a1) * rD, cyD + Math.sin(a1) * rD, hd - t * 0.4],
          [Math.cos(a1) * rD * 0.18, cyD + Math.sin(a1) * rD * 0.18, hd - rD * 0.42],
          [Math.cos(a0) * rD * 0.18, cyD + Math.sin(a0) * rD * 0.18, hd - rD * 0.42],
        ],
        colore: CONO,
        incasso: 0.55,
      });
    }
    // cupola centrale
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * 2 * Math.PI, a1 = ((i + 1) / N) * 2 * Math.PI;
      facce.push({
        p: [
          [Math.cos(a0) * rD * 0.18, cyD + Math.sin(a0) * rD * 0.18, hd - rD * 0.42],
          [Math.cos(a1) * rD * 0.18, cyD + Math.sin(a1) * rD * 0.18, hd - rD * 0.42],
          [0, cyD, hd - rD * 0.28],
        ],
        colore: ACCENTO,
        incasso: 0.25,
      });
    }

    // ── il condotto ──
    const cyP = -hh * 0.62;
    if (port?.kind === 'circolare') {
      const rP = (port.diaMm * scala) / 2;
      const n = Math.max(1, Math.min(port.count, 3));
      const passo = n > 1 ? W * 0.30 : 0;
      for (let k = 0; k < n; k++) {
        const cx = (k - (n - 1) / 2) * passo;
        for (let i = 0; i < 24; i++) {
          const a0 = (i / 24) * 2 * Math.PI, a1 = ((i + 1) / 24) * 2 * Math.PI;
          facce.push({
            p: [
              [cx + Math.cos(a0) * rP, cyP + Math.sin(a0) * rP, hd],
              [cx + Math.cos(a1) * rP, cyP + Math.sin(a1) * rP, hd],
              [cx + Math.cos(a1) * rP, cyP + Math.sin(a1) * rP, hd - rP * 1.6],
              [cx + Math.cos(a0) * rP, cyP + Math.sin(a0) * rP, hd - rP * 1.6],
            ],
            colore: CONO,
            incasso: 0.75,
          });
        }
      }
    } else if (port?.kind === 'fessura') {
      const pw = Math.min((port.widthMm * scala) / 2, hw * 0.88);
      const ph = (port.heightMm * scala) / 2;
      const prof = Math.max(ph * 2.2, 0.03);
      const ang: [number, number][] = [[-pw, -ph], [pw, -ph], [pw, ph], [-pw, ph]];
      for (let i = 0; i < 4; i++) {
        const [x0, y0] = ang[i], [x1, y1] = ang[(i + 1) % 4];
        facce.push({
          p: [
            [x0, cyP + y0, hd], [x1, cyP + y1, hd],
            [x1, cyP + y1, hd - prof], [x0, cyP + y0, hd - prof],
          ],
          colore: CONO,
          incasso: 0.75,
        });
      }
      facce.push({
        p: [[-pw, cyP - ph, hd - prof], [pw, cyP - ph, hd - prof], [pw, cyP + ph, hd - prof], [-pw, cyP + ph, hd - prof]],
        colore: [0x0b, 0x18, 0x26], incasso: 0.9,
      });
    }

    // ── disegno ──
    const luce: V3 = (() => { const l: V3 = [-0.45, 0.7, 0.9]; const m = Math.hypot(...l); return [l[0] / m, l[1] / m, l[2] / m]; })();
    let anim = 0;

    const disegna = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const larg = cv.clientWidth, alt = cv.clientHeight;
      if (cv.width !== larg * dpr || cv.height !== alt * dpr) {
        cv.width = larg * dpr; cv.height = alt * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, larg, alt);

      const { yaw, pitch } = vista.current;
      const zoom = Math.min(larg, alt) * 0.86;
      const dist = 3.1;
      const proietta = (p: V3): [number, number, number] => {
        const r = ruotaX(ruotaY(p, yaw), pitch);
        const z = r[2] + dist;
        const f = (dist * 0.92) / z;
        return [larg / 2 + r[0] * zoom * f, alt / 2 - r[1] * zoom * f, z];
      };

      // Ombra di contatto. Un oggetto senza ombra galleggia, e nessuna
      // quantita' di sfumature sulle facce lo rimedia: e' il contatto col
      // piano che dice al lettore dov'e' il pavimento.
      {
        const base = proietta([0, -hh, 0]);
        const rx = zoom * Math.max(W, D) * 0.62;
        const ry = rx * 0.22;
        const gr = ctx.createRadialGradient(base[0], base[1], 0, base[0], base[1], rx);
        gr.addColorStop(0, 'rgba(0,0,0,0.55)');
        gr.addColorStop(0.55, 'rgba(0,0,0,0.22)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.save();
        ctx.translate(base[0], base[1]);
        ctx.scale(1, ry / rx);
        ctx.translate(-base[0], -base[1]);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(base[0], base[1], rx, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }

      // algoritmo del pittore: dal fondo verso chi guarda
      const pronte = facce.map(f => {
        const pr = f.p.map(proietta);
        const zMed = pr.reduce((s, q) => s + q[2], 0) / pr.length;
        return { f, pr, zMed };
      }).sort((a, b) => b.zMed - a.zMed);

      for (const { f, pr } of pronte) {
        // faccia voltata: si scarta guardando il verso del contorno proiettato
        const area = pr.reduce((s, q, i) => {
          const r = pr[(i + 1) % pr.length];
          return s + (q[0] * r[1] - r[0] * q[1]);
        }, 0);
        if (area > 0) continue;

        const n = normale(f.p.map(p => ruotaX(ruotaY(p, yaw), pitch)) as V3[]);
        const diff = Math.max(0, n[0] * luce[0] + n[1] * luce[1] + n[2] * luce[2]);
        const k = (0.46 + 0.62 * diff) * (1 - (f.incasso ?? 0));
        const [cr, cg, cb] = f.colore;

        ctx.beginPath();
        ctx.moveTo(pr[0][0], pr[0][1]);
        for (let i = 1; i < pr.length; i++) ctx.lineTo(pr[i][0], pr[i][1]);
        ctx.closePath();
        ctx.fillStyle = `rgb(${Math.round(cr * k)},${Math.round(cg * k)},${Math.round(cb * k)})`;
        ctx.fill();

        if (f.bordo) {
          ctx.strokeStyle = TRATTO;
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
      }

      // ── quote, come su una tavola ──
      if (quote) {
        ctx.font = '500 11px "IBM Plex Mono", monospace';
        ctx.fillStyle = QUOTA;
        ctx.strokeStyle = QUOTA;
        ctx.lineWidth = 1;
        const q = (a: V3, b: V3, testo: string, off: V3) => {
          const pa = proietta([a[0] + off[0], a[1] + off[1], a[2] + off[2]]);
          const pb = proietta([b[0] + off[0], b[1] + off[1], b[2] + off[2]]);
          ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
          const m = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2];
          const wTxt = ctx.measureText(testo).width;
          ctx.clearRect(m[0] - wTxt / 2 - 3, m[1] - 7, wTxt + 6, 14);
          ctx.fillText(testo, m[0] - wTxt / 2, m[1] + 4);
        };
        q([-hw, -hh, hd], [hw, -hh, hd], `${Math.round(widthMm)}`, [0, -0.10, 0]);
        q([hw, -hh, hd], [hw, hh, hd], `${Math.round(heightMm)}`, [0.10, 0, 0]);
        q([hw, -hh, hd], [hw, -hh, -hd], `${Math.round(depthMm)}`, [0.06, -0.09, 0]);
      }
    };

    // Il primo disegno si fa SUBITO, non al primo fotogramma utile: il ciclo
    // di animazione non parte finche' la pagina non e' visibile, e una scheda
    // aperta in secondo piano mostrerebbe un riquadro vuoto fino a quando non
    // ci si passa sopra. Disegnare una volta costa niente e toglie il caso.
    disegna();

    const ciclo = () => {
      if (!trascina && vista.current.vel) {
        vista.current.yaw += vista.current.vel;
        // oscillazione lenta, non un giro completo: è una presentazione,
        // non una giostra
        if (vista.current.yaw > -0.20 || vista.current.yaw < -1.05) vista.current.vel *= -1;
      }
      disegna();
      anim = requestAnimationFrame(ciclo);
    };
    anim = requestAnimationFrame(ciclo);

    const ridimensiona = () => disegna();
    window.addEventListener('resize', ridimensiona);
    // tornando sulla scheda il ciclo riparte, ma intanto ridisegna
    document.addEventListener('visibilitychange', ridimensiona);
    return () => {
      cancelAnimationFrame(anim);
      window.removeEventListener('resize', ridimensiona);
      document.removeEventListener('visibilitychange', ridimensiona);
    };
    // `port` e' un oggetto costruito nel JSX del chiamante: usato cosi' com'e'
    // sarebbe un riferimento nuovo a ogni render e l'effetto si smonterebbe in
    // continuazione. Conta il contenuto, non l'identita'.
  }, [widthMm, heightMm, depthMm, wallMm, driverDiaMm, JSON.stringify(port), quote, trascina]);

  // ── trascinamento ──
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    let ultimo: { x: number; y: number } | null = null;

    const giu = (e: PointerEvent) => {
      ultimo = { x: e.clientX, y: e.clientY };
      setTrascina(true);
      cv.setPointerCapture(e.pointerId);
    };
    const muovi = (e: PointerEvent) => {
      if (!ultimo) return;
      vista.current.yaw -= (e.clientX - ultimo.x) * 0.008;
      vista.current.pitch = Math.max(-0.9, Math.min(0.9, vista.current.pitch + (e.clientY - ultimo.y) * 0.006));
      ultimo = { x: e.clientX, y: e.clientY };
    };
    const su = (e: PointerEvent) => {
      ultimo = null;
      setTrascina(false);
      if (cv.hasPointerCapture(e.pointerId)) cv.releasePointerCapture(e.pointerId);
    };

    cv.addEventListener('pointerdown', giu);
    cv.addEventListener('pointermove', muovi);
    cv.addEventListener('pointerup', su);
    cv.addEventListener('pointercancel', su);
    return () => {
      cv.removeEventListener('pointerdown', giu);
      cv.removeEventListener('pointermove', muovi);
      cv.removeEventListener('pointerup', su);
      cv.removeEventListener('pointercancel', su);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={`w-full block touch-none ${trascina ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
      style={{ height: altezzaPx }}
      aria-label={`Vista tridimensionale della cassa: ${Math.round(widthMm)} per ${Math.round(heightMm)} per ${Math.round(depthMm)} millimetri. Trascina per ruotarla.`}
      role="img"
    />
  );
}
