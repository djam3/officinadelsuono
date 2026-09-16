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
  /** contorni dei buchi nella faccia: si riempiono con la regola pari-dispari */
  fori?: V3[][];
  /** faccia del guscio: si può scartare quando volta le spalle */
  guscio?: boolean;
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
const CONO: [number, number, number] = [0x2a, 0x3c, 0x50];
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
    facce.push({ p: [[-hw, -hh, -hd], [hw, -hh, -hd], [hw, hh, -hd], [-hw, hh, -hd]], colore: PANNELLO, bordo: true, guscio: true });   // retro
    facce.push({ p: [[-hw, -hh, hd], [-hw, -hh, -hd], [-hw, hh, -hd], [-hw, hh, hd]], colore: PANNELLO_FIANCO, bordo: true, guscio: true });   // sinistra
    facce.push({ p: [[hw, -hh, -hd], [hw, -hh, hd], [hw, hh, hd], [hw, hh, -hd]], colore: PANNELLO_FIANCO, bordo: true, guscio: true });       // destra
    facce.push({ p: [[-hw, hh, hd], [hw, hh, hd], [hw, hh, -hd], [-hw, hh, -hd]], colore: PANNELLO_CHIARO, bordo: true, guscio: true });// cielo
    facce.push({ p: [[-hw, -hh, -hd], [hw, -hh, -hd], [hw, -hh, hd], [-hw, -hh, hd]], colore: PANNELLO_FIANCO, bordo: true, guscio: true });   // fondo

    // il foro del driver: serve sia al pannello sia al cono
    const rD = Math.min((driverDiaMm * scala) / 2, Math.min(W, H) * 0.40);
    const cyD = hh * 0.30;                        // il driver sta in alto
    const N = 40;
    const cerchioDriver: V3[] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * 2 * Math.PI;
      cerchioDriver.push([Math.cos(a) * rD, cyD + Math.sin(a) * rD, hd]);
    }

    // Il cono NON si costruisce a spicchi.
    //
    // Un cono di rivoluzione visto attraverso il suo foro ha per sagoma
    // l'ellisse del foro e basta: tagliarlo in quaranta facce serve solo a
    // farne vedere le giunzioni. Si disegna a parte, dopo il guscio, come una
    // sfumatura dentro quella sagoma — che è poi quello che un programma di
    // rendering produce quando la superficie è liscia.
    //
    // I contorni servono al disegno: il bordo del foro e il cerchio di gola.
    const golaR = rD * 0.26;
    const cerchioGola: V3[] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * 2 * Math.PI;
      cerchioGola.push([Math.cos(a) * golaR, cyD + Math.sin(a) * golaR, hd - rD * 0.40]);
    }

    // spessore del pannello sul bordo del foro: è il dettaglio che dice
    // quanto è grosso il legno, e si vede solo quando la cassa è di tre quarti
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * 2 * Math.PI, a1 = ((i + 1) / N) * 2 * Math.PI;
      facce.push({
        p: [
          [Math.cos(a0) * rD, cyD + Math.sin(a0) * rD, hd],
          [Math.cos(a1) * rD, cyD + Math.sin(a1) * rD, hd],
          [Math.cos(a1) * rD, cyD + Math.sin(a1) * rD, hd - t],
          [Math.cos(a0) * rD, cyD + Math.sin(a0) * rD, hd - t],
        ],
        colore: PANNELLO_FIANCO,
        incasso: 0.45,
      });
    }

    // ── il condotto ──
    const cyP = -hh * 0.62;
    const foriCondotto: V3[][] = [];
    if (port?.kind === 'circolare') {
      const rP = (port.diaMm * scala) / 2;
      const n = Math.max(1, Math.min(port.count, 3));
      const passo = n > 1 ? W * 0.30 : 0;
      for (let k = 0; k < n; k++) {
        const cx = (k - (n - 1) / 2) * passo;
        const bocca: V3[] = [];
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * 2 * Math.PI;
          bocca.push([cx + Math.cos(a) * rP, cyP + Math.sin(a) * rP, hd]);
        }
        foriCondotto.push(bocca);
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
      foriCondotto.push(ang.map(([x, y]) => [x, cyP + y, hd] as V3));
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

    // ── frontale: UNA faccia sola, coi buchi dentro ──
    //
    // Prima erano quaranta spicchi che andavano dal cerchio al perimetro, e sul
    // pannello si vedevano i raggi: due poligoni adiacenti non combaciano mai
    // perfettamente, perché il disegno sfuma i bordi di ciascuno per conto suo e
    // fra l'uno e l'altro resta un capello di sfondo. Una faccia sola, riempita
    // con la regola pari-dispari, non ha giunzioni da far vedere.
    //
    // I buchi devono esserci TUTTI: col solo foro del driver il pannello
    // ricopriva il condotto, che spariva.
    facce.push({
      p: [[-hw, -hh, hd], [hw, -hh, hd], [hw, hh, hd], [-hw, hh, hd]],
      colore: PANNELLO_CHIARO,
      fori: [cerchioDriver, ...foriCondotto],
      bordo: true,
      guscio: true,
    });

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
      // con le quote attorno serve il margine per scriverle: l'oggetto si
      // rimpicciolisce invece di lasciare che i numeri finiscano tagliati
      const zoom = Math.min(larg, alt) * (quote ? 0.70 : 0.86);
      const dist = 7.0;
      /**
       * La camera guarda il modello da +z, quindi la profondità cresce
       * ALLONTANANDOSI: `dist - r[2]`, non `r[2] + dist`.
       *
       * Con il segno sbagliato il lato +z del modello — quello su cui stanno
       * il foro del driver e il condotto — risultava il più lontano, e la
       * scatola si vedeva sempre di spalle: due pannelli lisci e nient'altro.
       * Non era il ritaglio delle facce nascoste a sbagliare, era da che parte
       * si guardava.
       */
      const proietta = (p: V3): [number, number, number] => {
        const r = ruotaX(ruotaY(p, yaw), pitch);
        const z = dist - r[2];
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
        // Niente scarto delle facce voltate.
        //
        // Prima c'era, e guardava il verso del contorno proiettato: ma quel
        // criterio pretende che TUTTE le facce siano avvolte nello stesso
        // senso, e la corona attorno al foro del driver — costruita girando
        // sul cerchio e tornando sul perimetro — risulta avvolta al contrario
        // del guscio. Il risultato era che il frontale spariva: si vedeva il
        // retro della cassa, senza driver e senza condotto.
        //
        // Per un solido convesso disegnato dal fondo verso chi guarda lo
        // scarto non serve: le facce dietro vengono coperte da quelle davanti
        // perché arrivano prima. Costa qualche riempimento in più e toglie
        // una classe intera di errori.
        const ruotati = f.p.map(p => ruotaX(ruotaY(p, yaw), pitch)) as V3[];
        let n = normale(ruotati);

        // La scatola sta attorno all'origine ed è convessa: la normale che
        // punta FUORI è quella che si allontana dal centro della faccia. Con
        // questo criterio l'orientamento non dipende da come è avvolto il
        // poligono — che sul frontale col foro sarebbe al contrario — e il
        // ritaglio si può fare sul serio invece che affidare tutto all'ordine
        // di disegno. Le superfici incassate non si scartano mai: stanno
        // dentro, e l'ordine di disegno basta.
        if (f.guscio) {
          const c = ruotati.reduce<V3>((a, q) => [a[0] + q[0] / ruotati.length, a[1] + q[1] / ruotati.length, a[2] + q[2] / ruotati.length], [0, 0, 0]);
          if (n[0] * c[0] + n[1] * c[1] + n[2] * c[2] < 0) n = [-n[0], -n[1], -n[2]];
          // la camera guarda da +z: una faccia che punta verso -z dà le spalle
          if (n[2] <= 0.001) continue;
        }
        // il verso della normale ora non è garantito: conta quanto la faccia
        // è inclinata rispetto alla luce, non da che parte guarda
        const diff = Math.abs(n[0] * luce[0] + n[1] * luce[1] + n[2] * luce[2]);
        const k = (0.46 + 0.62 * diff) * (1 - (f.incasso ?? 0));
        const [cr, cg, cb] = f.colore;

        ctx.beginPath();
        ctx.moveTo(pr[0][0], pr[0][1]);
        for (let i = 1; i < pr.length; i++) ctx.lineTo(pr[i][0], pr[i][1]);
        ctx.closePath();
        for (const foro of f.fori ?? []) {
          const fr = foro.map(proietta);
          ctx.moveTo(fr[0][0], fr[0][1]);
          for (let i = 1; i < fr.length; i++) ctx.lineTo(fr[i][0], fr[i][1]);
          ctx.closePath();
        }
        ctx.fillStyle = `rgb(${Math.round(cr * k)},${Math.round(cg * k)},${Math.round(cb * k)})`;
        ctx.fill('evenodd');

        if (f.bordo) {
          ctx.strokeStyle = TRATTO;
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
      }

      // ── il driver: sfumatura dentro la sagoma del foro ──
      //
      // Si disegna dopo il guscio perché deve stare sopra il pannello, e solo
      // se il frontale è rivolto verso di noi: altrimenti comparirebbe sul
      // retro come una macchia.
      {
        const nF = ruotaX(ruotaY([0, 0, 1], yaw), pitch);
        if (nF[2] > 0.02) {
          const foro = cerchioDriver.map(proietta);
          const gola = cerchioGola.map(proietta);
          const cen = gola.reduce((s2, q) => [s2[0] + q[0] / gola.length, s2[1] + q[1] / gola.length], [0, 0]);
          const raggio = Math.max(...foro.map(q => Math.hypot(q[0] - cen[0], q[1] - cen[1])));

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(foro[0][0], foro[0][1]);
          for (let i = 1; i < foro.length; i++) ctx.lineTo(foro[i][0], foro[i][1]);
          ctx.closePath();
          ctx.clip();

          // la luce entra da sinistra-alto: il centro della sfumatura le va incontro
          const gx = cen[0] - raggio * 0.22, gy = cen[1] - raggio * 0.22;
          const g = ctx.createRadialGradient(gx, gy, raggio * 0.04, gx, gy, raggio * 1.15);
          g.addColorStop(0, 'rgb(74,100,126)');
          g.addColorStop(0.55, 'rgb(38,54,72)');
          g.addColorStop(1, 'rgb(16,26,38)');
          ctx.fillStyle = g;
          ctx.fillRect(cen[0] - raggio * 1.4, cen[1] - raggio * 1.4, raggio * 2.8, raggio * 2.8);

          // Vignettatura sul bordo, tutt'intorno.
          //
          // Con la sola sfumatura direzionale il cono leggeva convesso, come
          // una bolla: e' l'ombra che si scurisce verso il perimetro a dire
          // che la superficie e' INCASSATA e non gonfiata.
          const v = ctx.createRadialGradient(cen[0], cen[1], raggio * 0.35, cen[0], cen[1], raggio);
          v.addColorStop(0, 'rgba(0,0,0,0)');
          v.addColorStop(1, 'rgba(0,0,0,0.55)');
          ctx.fillStyle = v;
          ctx.fillRect(cen[0] - raggio * 1.4, cen[1] - raggio * 1.4, raggio * 2.8, raggio * 2.8);
          ctx.restore();

          // la cupola, con il suo riflesso
          ctx.beginPath();
          ctx.moveTo(gola[0][0], gola[0][1]);
          for (let i = 1; i < gola.length; i++) ctx.lineTo(gola[i][0], gola[i][1]);
          ctx.closePath();
          const rg = Math.max(...gola.map(q => Math.hypot(q[0] - cen[0], q[1] - cen[1])));
          const gc = ctx.createRadialGradient(cen[0] - rg * 0.35, cen[1] - rg * 0.4, rg * 0.05, cen[0], cen[1], rg * 1.1);
          gc.addColorStop(0, '#A8E4F7');
          gc.addColorStop(0.5, '#6BBFDD');
          gc.addColorStop(1, '#245C74');
          ctx.fillStyle = gc;
          ctx.fill();

          // il cerchio del bordo, che sul pannello non c'era
          ctx.beginPath();
          ctx.moveTo(foro[0][0], foro[0][1]);
          for (let i = 1; i < foro.length; i++) ctx.lineTo(foro[i][0], foro[i][1]);
          ctx.closePath();
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
        q([-hw, -hh, hd], [hw, -hh, hd], `${Math.round(widthMm)}`, [0, -0.08, 0.02]);
        q([hw, -hh, hd], [hw, hh, hd], `${Math.round(heightMm)}`, [0.08, 0, 0.02]);
        q([hw, -hh, hd], [hw, -hh, -hd], `${Math.round(depthMm)}`, [0.05, -0.07, 0]);
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

    // Con le frecce, e senza mouse.
    //
    // Un oggetto che si gira solo trascinando e' inutilizzabile per chi naviga
    // da tastiera, e finora l'unico modo di vedere il retro della cassa era
    // avere un puntatore. Il canvas prende il fuoco e risponde alle frecce.
    const tasti = (e: KeyboardEvent) => {
      const passo = e.shiftKey ? 0.35 : 0.12;
      switch (e.key) {
        case 'ArrowLeft': vista.current.yaw += passo; break;
        case 'ArrowRight': vista.current.yaw -= passo; break;
        case 'ArrowUp': vista.current.pitch = Math.min(0.9, vista.current.pitch + passo * 0.7); break;
        case 'ArrowDown': vista.current.pitch = Math.max(-0.9, vista.current.pitch - passo * 0.7); break;
        case 'Home': vista.current.yaw = -0.62; vista.current.pitch = 0.30; break;
        default: return;
      }
      e.preventDefault();
      // fermare l'oscillazione: chi sta guardando da una certa parte non vuole
      // che l'oggetto gli scappi
      vista.current.vel = 0;
    };
    cv.addEventListener('keydown', tasti);

    cv.addEventListener('pointerdown', giu);
    cv.addEventListener('pointermove', muovi);
    cv.addEventListener('pointerup', su);
    cv.addEventListener('pointercancel', su);
    return () => {
      cv.removeEventListener('keydown', tasti);
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
      tabIndex={0}
      aria-label={
        `Vista tridimensionale della cassa: ${Math.round(widthMm)} per ${Math.round(heightMm)} per `
        + `${Math.round(depthMm)} millimetri, spessore ${wallMm} millimetri. `
        + 'Trascina o usa le frecce per ruotarla; Home rimette la vista di tre quarti.'
      }
      role="img"
    />
  );
}
