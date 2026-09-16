/**
 * Genera l'immagine di anteprima per la condivisione (1200×630).
 *
 * PERCHÉ A MANO E SENZA DIPENDENZE. Un'immagine di anteprima deve essere un
 * raster: PNG o JPEG. Nessuna delle librerie che convertono un disegno in
 * pixel è installata, e aggiungerne una significherebbe portarsi dentro un
 * binario nativo per generare un file che cambia una volta l'anno. Il PNG però
 * è un formato semplice — quattro blocchi e una compressione che Node ha già
 * dentro (`zlib`) — e il disegno qui è fatto di linee. Quindi si scrive.
 *
 * Il vantaggio vero non è risparmiare una dipendenza: è che l'immagine si
 * rigenera da sola quando cambia la palette, perché i colori li legge da qui e
 * non da un file esportato una volta e poi dimenticato.
 *
 * IL CARATTERE. Le scritte sono tracciate con un alfabeto a tratto singolo,
 * quello dei plotter e delle dime da disegno tecnico: ogni lettera è una
 * spezzata su una griglia 4×6. Non è un ripiego per non avere un font vero —
 * è il modo in cui le tavole vengono scritte davvero.
 *
 *   node scripts/og-image.mjs
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ─── palette: gli stessi valori del tema ─────────────────────────────────────
const C = {
  ink: [0x0b, 0x18, 0x26],
  ink2: [0x12, 0x23, 0x35],
  paper: [0xdc, 0xe9, 0xf5],
  graphite: [0x8e, 0xa8, 0xc2],
  blueprint: [0x7f, 0xb2, 0xd9],
  marker: [0x7f, 0xd8, 0xf5],
  segnale: [0xf0, 0xb9, 0x4a],
};

const W = 1200, H = 630, SS = 2;          // SS = sovracampionamento
const w = W * SS, h = H * SS;
const buf = new Uint8Array(w * h * 3);

// ─── primitive di disegno ────────────────────────────────────────────────────

function sfondo(rgb) {
  for (let i = 0; i < w * h; i++) {
    buf[i * 3] = rgb[0]; buf[i * 3 + 1] = rgb[1]; buf[i * 3 + 2] = rgb[2];
  }
}

function punto(x, y, rgb, a = 1) {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const i = (y * w + x) * 3;
  buf[i] = buf[i] * (1 - a) + rgb[0] * a;
  buf[i + 1] = buf[i + 1] * (1 - a) + rgb[1] * a;
  buf[i + 2] = buf[i + 2] * (1 - a) + rgb[2] * a;
}

/** disco pieno: è il pennino che segue la linea */
function disco(cx, cy, r, rgb, a) {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r2) punto(x, y, rgb, a);
    }
  }
}

function linea(x0, y0, x1, y1, rgb, spessore = 2, a = 1) {
  const dx = x1 - x0, dy = y1 - y0;
  const n = Math.max(Math.ceil(Math.hypot(dx, dy)), 1);
  const r = spessore / 2;
  for (let i = 0; i <= n; i++) {
    disco(x0 + (dx * i) / n, y0 + (dy * i) / n, r, rgb, a);
  }
}

function tratteggio(x0, y0, x1, y1, rgb, spessore, tratto, vuoto, a = 1) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
  for (let d = 0; d < len; d += tratto + vuoto) {
    const e = Math.min(d + tratto, len);
    linea(x0 + ux * d, y0 + uy * d, x0 + ux * e, y0 + uy * e, rgb, spessore, a);
  }
}

function rettangolo(x, y, ww, hh, rgb, spessore, a = 1) {
  linea(x, y, x + ww, y, rgb, spessore, a);
  linea(x + ww, y, x + ww, y + hh, rgb, spessore, a);
  linea(x + ww, y + hh, x, y + hh, rgb, spessore, a);
  linea(x, y + hh, x, y, rgb, spessore, a);
}

function pieno(x, y, ww, hh, rgb, a = 1) {
  for (let j = Math.round(y); j < Math.round(y + hh); j++) {
    for (let i = Math.round(x); i < Math.round(x + ww); i++) punto(i, j, rgb, a);
  }
}

// ─── alfabeto a tratto singolo, griglia 4×6 ──────────────────────────────────
const G = {
  A: [[[0,6],[0,1],[1,0],[3,0],[4,1],[4,6]], [[0,3],[4,3]]],
  B: [[[0,0],[0,6]], [[0,0],[3,0],[4,1],[4,2],[3,3],[0,3]], [[3,3],[4,4],[4,5],[3,6],[0,6]]],
  C: [[[4,1],[3,0],[1,0],[0,1],[0,5],[1,6],[3,6],[4,5]]],
  D: [[[0,0],[0,6]], [[0,0],[3,0],[4,1],[4,5],[3,6],[0,6]]],
  E: [[[4,0],[0,0],[0,6],[4,6]], [[0,3],[3,3]]],
  F: [[[4,0],[0,0],[0,6]], [[0,3],[3,3]]],
  G: [[[4,1],[3,0],[1,0],[0,1],[0,5],[1,6],[3,6],[4,5],[4,3],[2,3]]],
  H: [[[0,0],[0,6]], [[4,0],[4,6]], [[0,3],[4,3]]],
  I: [[[2,0],[2,6]], [[1,0],[3,0]], [[1,6],[3,6]]],
  J: [[[3,0],[3,5],[2,6],[1,6],[0,5]]],
  K: [[[0,0],[0,6]], [[4,0],[0,3.5]], [[1.5,2.4],[4,6]]],
  L: [[[0,0],[0,6],[4,6]]],
  M: [[[0,6],[0,0],[2,2.6],[4,0],[4,6]]],
  N: [[[0,6],[0,0],[4,6],[4,0]]],
  O: [[[1,0],[3,0],[4,1],[4,5],[3,6],[1,6],[0,5],[0,1],[1,0]]],
  P: [[[0,6],[0,0],[3,0],[4,1],[4,2],[3,3],[0,3]]],
  Q: [[[1,0],[3,0],[4,1],[4,5],[3,6],[1,6],[0,5],[0,1],[1,0]], [[2.4,4.2],[4.2,6.4]]],
  R: [[[0,6],[0,0],[3,0],[4,1],[4,2],[3,3],[0,3]], [[2,3],[4,6]]],
  S: [[[4,1],[3,0],[1,0],[0,1],[0,2],[1,3],[3,3],[4,4],[4,5],[3,6],[1,6],[0,5]]],
  T: [[[0,0],[4,0]], [[2,0],[2,6]]],
  U: [[[0,0],[0,5],[1,6],[3,6],[4,5],[4,0]]],
  V: [[[0,0],[2,6],[4,0]]],
  W: [[[0,0],[1,6],[2,3],[3,6],[4,0]]],
  X: [[[0,0],[4,6]], [[4,0],[0,6]]],
  Y: [[[0,0],[2,3],[4,0]], [[2,3],[2,6]]],
  Z: [[[0,0],[4,0],[0,6],[4,6]]],
  0: [[[1,0],[3,0],[4,1],[4,5],[3,6],[1,6],[0,5],[0,1],[1,0]]],
  1: [[[1,1],[2,0],[2,6]], [[1,6],[3,6]]],
  2: [[[0,1],[1,0],[3,0],[4,1],[4,2],[0,6],[4,6]]],
  3: [[[0,0],[4,0],[2,2.5]], [[2,2.5],[4,3.5],[4,5],[3,6],[1,6],[0,5]]],
  4: [[[3,6],[3,0],[0,4],[4,4]]],
  5: [[[4,0],[0,0],[0,2.5],[3,2.5],[4,3.5],[4,5],[3,6],[1,6],[0,5]]],
  6: [[[4,1],[3,0],[1,0],[0,1],[0,5],[1,6],[3,6],[4,5],[4,4],[3,3],[1,3],[0,4]]],
  7: [[[0,0],[4,0],[1.4,6]]],
  8: [[[1,0],[3,0],[4,1],[3,3],[1,3],[0,1],[1,0]], [[1,3],[3,3],[4,4],[4,5],[3,6],[1,6],[0,5],[0,4],[1,3]]],
  9: [[[0,5],[1,6],[3,6],[4,5],[4,1],[3,0],[1,0],[0,1],[0,2],[1,3],[3,3],[4,2]]],
  '.': [[[2,5.6],[2,6]]],
  ',': [[[2,5.6],[1.6,6.6]]],
  '-': [[[0,3],[4,3]]],
  ':': [[[2,1.6],[2,2]], [[2,4.4],[2,4.8]]],
  '/': [[[4,0],[0,6]]],
  '·': [[[2,3],[2,3.4]]],
  '×': [[[0.7,1.6],[3.3,4.4]], [[3.3,1.6],[0.7,4.4]]],
  ' ': [],
};

/**
 * Scrive una riga. `alt` è l'altezza della lettera in pixel; la larghezza della
 * cella e la spaziatura ne discendono, così il testo resta proporzionato a
 * qualunque misura.
 */
function testo(str, x, y, alt, rgb, { spessore = 2, spazio = 0.45, a = 1 } = {}) {
  const u = alt / 6;                     // lato di una unità di griglia
  const passo = 4 * u + spazio * alt;
  let cx = x;
  for (const ch of str.toUpperCase()) {
    const g = G[ch];
    if (g === undefined) { cx += passo; continue; }
    for (const poly of g) {
      for (let i = 1; i < poly.length; i++) {
        linea(cx + poly[i - 1][0] * u, y + poly[i - 1][1] * u,
              cx + poly[i][0] * u, y + poly[i][1] * u, rgb, spessore, a);
      }
      if (poly.length === 1) disco(cx + poly[0][0] * u, y + poly[0][1] * u, spessore / 2, rgb, a);
    }
    cx += passo;
  }
  return cx - x - spazio * alt;
}

function larghezzaTesto(str, alt, spazio = 0.45) {
  return str.length * (4 * (alt / 6) + spazio * alt) - spazio * alt;
}

// ═══ COMPOSIZIONE ════════════════════════════════════════════════════════════
const S = SS;                            // scorciatoia: tutto è in coordinate 1200×630

sfondo(C.ink);

// griglia millimetrata, due scale come sulla carta
for (let x = 0; x <= W; x += 20) linea(x * S, 0, x * S, h, C.paper, 1, 0.03);
for (let y = 0; y <= H; y += 20) linea(0, y * S, w, y * S, C.paper, 1, 0.03);
for (let x = 0; x <= W; x += 100) linea(x * S, 0, x * S, h, C.paper, 1.4, 0.06);
for (let y = 0; y <= H; y += 100) linea(0, y * S, w, y * S, C.paper, 1.4, 0.06);

// ── il disegno: sezione della cassa ──
const bx = 92, by = 132, bw = 250, bh = 366;   // guscio, coordinate 1200×630
rettangolo(bx * S, by * S, bw * S, bh * S, C.paper, 3.4);
rettangolo((bx + 11) * S, (by + 11) * S, (bw - 22) * S, (bh - 22) * S, C.paper, 1.4, 0.4);

/**
 * Tratteggio a 45° RITAGLIATO dentro un rettangolo.
 *
 * Senza il ritaglio le diagonali partono dentro la fascia e finiscono
 * dall'altra parte del disegno: il fonoassorbente sembrava attraversare tutta
 * la cassa. Ogni linea va quindi limitata ai due estremi in cui è davvero
 * dentro al rettangolo — su una retta a 45° basta tagliare la x, perché la y
 * la segue.
 */
function obliquo(x, y, ww, hh, passo, rgb, spessore, a) {
  for (let k = -hh; k < ww; k += passo) {
    const da = Math.max(x, x + k);
    const fino = Math.min(x + ww, x + k + hh);
    if (fino <= da) continue;
    linea(da * S, (y + (da - (x + k))) * S, fino * S, (y + (fino - (x + k))) * S, rgb, spessore, a);
  }
}

// fonoassorbente: solo sulle pareti, non in mezzo alla cassa
obliquo(bx + 11, by + 11, 26, bh - 22, 9, C.marker, 1.2, 0.34);
obliquo(bx + bw - 37, by + 11, 26, bh - 22, 9, C.marker, 1.2, 0.34);
obliquo(bx + 37, by + 11, bw - 74, 22, 9, C.marker, 1.2, 0.34);

// driver, di lato
linea(bx * S, (by + 78) * S, (bx + 54) * S, (by + 62) * S, C.marker, 3);
linea((bx + 54) * S, (by + 62) * S, (bx + 54) * S, (by + 134) * S, C.marker, 3);
linea((bx + 54) * S, (by + 134) * S, bx * S, (by + 118) * S, C.marker, 3);
pieno((bx + 54) * S, (by + 82) * S, 32 * S, 32 * S, C.marker, 0.16);
rettangolo((bx + 54) * S, (by + 82) * S, 32 * S, 32 * S, C.marker, 2);
linea(bx * S, (by + 76) * S, bx * S, (by + 120) * S, C.marker, 4.5);

// condotto ripiegato a L
linea(bx * S, (by + 250) * S, (bx + 148) * S, (by + 250) * S, C.marker, 2.6);
linea((bx + 148) * S, (by + 250) * S, (bx + 148) * S, (by + 292) * S, C.marker, 2.6);
linea((bx + 148) * S, (by + 292) * S, bx * S, (by + 292) * S, C.marker, 2.6);
// frecce dell'aria
linea((bx + 108) * S, (by + 271) * S, (bx + 76) * S, (by + 271) * S, C.blueprint, 1.8);
linea((bx + 82) * S, (by + 266) * S, (bx + 76) * S, (by + 271) * S, C.blueprint, 1.8);
linea((bx + 82) * S, (by + 276) * S, (bx + 76) * S, (by + 271) * S, C.blueprint, 1.8);

// quote
const q = C.blueprint;
linea((bx - 30) * S, by * S, (bx - 30) * S, (by + bh) * S, q, 1.6, 0.85);
linea((bx - 35) * S, by * S, (bx - 25) * S, by * S, q, 1.6, 0.85);
linea((bx - 35) * S, (by + bh) * S, (bx - 25) * S, (by + bh) * S, q, 1.6, 0.85);
linea(bx * S, (by + bh + 28) * S, (bx + bw) * S, (by + bh + 28) * S, q, 1.6, 0.85);
linea(bx * S, (by + bh + 23) * S, bx * S, (by + bh + 33) * S, q, 1.6, 0.85);
linea((bx + bw) * S, (by + bh + 23) * S, (bx + bw) * S, (by + bh + 33) * S, q, 1.6, 0.85);
testo('641', (bx - 62) * S, (by + bh / 2 - 8) * S, 15 * S, q, { spessore: 1.8, a: 0.9 });
testo('260 MM', (bx + bw / 2 - 30) * S, (by + bh + 40) * S, 15 * S, q, { spessore: 1.8, a: 0.9 });

// ── il testo ──
const tx = 470;
testo('TAV. 00', tx * S, 128 * S, 15 * S, C.graphite, { spessore: 2, spazio: 0.9 });
tratteggio((tx + 128) * S, 135 * S, (W - 92) * S, 135 * S, C.graphite, 1.4, 6 * S, 5 * S, 0.5);

testo('OFFICINA', tx * S, 176 * S, 62 * S, C.paper, { spessore: 7, spazio: 0.3 });
testo('DEL SUONO', tx * S, 262 * S, 62 * S, C.marker, { spessore: 7, spazio: 0.3 });

linea(tx * S, 356 * S, (tx + 120) * S, 356 * S, C.marker, 3);

testo('PROGETTAZIONE DI', tx * S, 384 * S, 21 * S, C.paper, { spessore: 2.6, spazio: 0.42 });
testo('CASSE ACUSTICHE', tx * S, 420 * S, 21 * S, C.paper, { spessore: 2.6, spazio: 0.42 });
testo('OGNI NUMERO RICONDUCIBILE', tx * S, 462 * S, 13 * S, C.graphite, { spessore: 1.8, spazio: 0.5 });
testo('ALLA FORMULA DA CUI ESCE', tx * S, 486 * S, 13 * S, C.graphite, { spessore: 1.8, spazio: 0.5 });

// ── cartiglio in basso a destra ──
const cx0 = 470, cy0 = 528, cw = W - 92 - cx0, chh = 56;
rettangolo(cx0 * S, cy0 * S, cw * S, chh * S, C.paper, 1.6, 0.30);
const celle = [['SCALA', '1:1'], ['TAVOLA', '00'], ['REVISIONE', 'C']];
for (let i = 0; i < 3; i++) {
  const x = cx0 + (cw / 3) * i;
  if (i > 0) linea(x * S, cy0 * S, x * S, (cy0 + chh) * S, C.paper, 1.4, 0.30);
  testo(celle[i][0], (x + 14) * S, (cy0 + 13) * S, 10 * S, C.graphite, { spessore: 1.5, spazio: 0.55, a: 0.85 });
  testo(celle[i][1], (x + 14) * S, (cy0 + 31) * S, 15 * S, C.paper, { spessore: 2, spazio: 0.45, a: 0.9 });
}

// filo dell'accento in basso: chiude la composizione e dà un bordo all'immagine
// anche quando il servizio che la mostra la ritaglia
pieno(0, (H - 7) * S, w, 7 * S, C.marker, 1);

// ═══ RIDUZIONE E SCRITTURA ═══════════════════════════════════════════════════

/** media a blocchi: è qui che nasce l'antialiasing */
function riduci() {
  const out = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    const riga = y * (1 + W * 3);
    out[riga] = 0;                                   // filtro PNG: nessuno
    for (let x = 0; x < W; x++) {
      let r = 0, g = 0, b = 0;
      for (let dy = 0; dy < SS; dy++) {
        for (let dx = 0; dx < SS; dx++) {
          const i = ((y * SS + dy) * w + (x * SS + dx)) * 3;
          r += buf[i]; g += buf[i + 1]; b += buf[i + 2];
        }
      }
      const n = SS * SS, o = riga + 1 + x * 3;
      out[o] = Math.round(r / n);
      out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n);
    }
  }
  return out;
}

function crc32(b) {
  let c = ~0;
  for (let i = 0; i < b.length; i++) {
    c ^= b[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function blocco(tipo, dati) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(dati.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'latin1'), dati]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([len, corpo, crc]);
}

function scrivi(larg, alt, righe, nome) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(larg, 0);
  ihdr.writeUInt32BE(alt, 4);
  ihdr[8] = 8;    // 8 bit per canale
  ihdr[9] = 2;    // colore vero, senza alfa
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    blocco('IHDR', ihdr),
    blocco('IDAT', deflateSync(righe, { level: 9 })),
    blocco('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(resolve(root, 'public/' + nome), png);
  console.log(`${nome}: ${larg}×${alt}, ${(png.length / 1024).toFixed(1)} kB`);
}

scrivi(W, H, riduci(), 'anteprima.png');

// ═══ ICONA PER IOS ═══════════════════════════════════════════════════════════
//
// Il segnaposto della scheda e' un SVG e va bene per i browser, ma iOS quando
// si aggiunge il sito alla schermata principale vuole un PNG quadrato: senza,
// si inventa una miniatura della pagina. Stesso marchio del logo, ridisegnato
// con le primitive di qui.

const L = 180, LS = 4, lw = L * LS;
const ico = new Uint8Array(lw * lw * 3);

function icoPunto(x, y, rgb, a) {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= lw || y >= lw) return;
  const i = (y * lw + x) * 3;
  ico[i] = ico[i] * (1 - a) + rgb[0] * a;
  ico[i + 1] = ico[i + 1] * (1 - a) + rgb[1] * a;
  ico[i + 2] = ico[i + 2] * (1 - a) + rgb[2] * a;
}
function icoDisco(cx, cy, r, rgb, a) {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r2) icoPunto(x, y, rgb, a);
    }
}
function icoArco(cx, cy, r, da, fino, rgb, spess, a = 1) {
  const passi = Math.ceil((fino - da) * r);
  for (let i = 0; i <= passi; i++) {
    const t = da + ((fino - da) * i) / passi;
    icoDisco(cx + Math.cos(t) * r, cy + Math.sin(t) * r, spess / 2, rgb, a);
  }
}

for (let i = 0; i < lw * lw; i++) {
  ico[i * 3] = C.ink[0]; ico[i * 3 + 1] = C.ink[1]; ico[i * 3 + 2] = C.ink[2];
}
const c0 = lw / 2;
// anello interrotto, come una circonferenza di riferimento
icoArco(c0, c0, 0.40 * lw, -Math.PI / 2, -Math.PI / 2 + 1.90 * Math.PI, C.paper, 0.030 * lw, 0.92);
// circonferenza di costruzione
for (let k = 0; k < 64; k++) {
  const t = (k / 64) * 2 * Math.PI;
  if (k % 2) continue;
  icoArco(c0, c0, 0.32 * lw, t, t + 0.05, C.paper, 0.006 * lw, 0.22);
}
// assi
for (const [ax, ay, bx2, by2] of [[0, -0.46, 0, -0.42], [0, 0.42, 0, 0.46], [-0.46, 0, -0.42, 0], [0.42, 0, 0.46, 0]]) {
  const n = 40;
  for (let i = 0; i <= n; i++) {
    icoDisco(c0 + (ax + (bx2 - ax) * i / n) * lw, c0 + (ay + (by2 - ay) * i / n) * lw, 0.006 * lw, C.blueprint, 0.45);
  }
}
// barre del livello
const barre = [[-0.18, 0.28], [-0.09, 0.18], [0.0, 0.36], [0.09, 0.14]];
for (const [dx, ah] of barre) {
  const x = c0 + dx * lw, y0 = c0 - (ah / 2) * lw, y1 = c0 + (ah / 2) * lw;
  const sp = 0.05 * lw;
  for (let y = y0; y <= y1; y += 0.5) icoDisco(x, y, sp / 2, C.marker, 1);
}

const righe = Buffer.alloc(L * (1 + L * 3));
for (let y = 0; y < L; y++) {
  const riga = y * (1 + L * 3);
  righe[riga] = 0;
  for (let x = 0; x < L; x++) {
    let r = 0, g = 0, b = 0;
    for (let dy = 0; dy < LS; dy++)
      for (let dx = 0; dx < LS; dx++) {
        const i = ((y * LS + dy) * lw + (x * LS + dx)) * 3;
        r += ico[i]; g += ico[i + 1]; b += ico[i + 2];
      }
    const n = LS * LS, o = riga + 1 + x * 3;
    righe[o] = Math.round(r / n); righe[o + 1] = Math.round(g / n); righe[o + 2] = Math.round(b / n);
  }
}
scrivi(L, L, righe, 'icona-180.png');
