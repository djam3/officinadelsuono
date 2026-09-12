/**
 * Genera dist/sitemap.xml dalle rotte reali del sito.
 *
 * robots.txt dichiarava una sitemap che non esisteva: con il rewrite "**" di
 * Firebase quella richiesta non restituiva un 404 ma l'index.html servito con
 * Content-Type application/xml, cioè un documento rotto. Adesso il file c'è, e
 * si aggiorna da solo perché le voci del glossario vengono lette dal sorgente
 * invece che riscritte a mano.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://officinadelsuono-87986.web.app';

/** pagine fisse, con la priorità che riflette quanto contano davvero */
const PAGINE = [
  { path: '/', priority: '1.0', changefreq: 'monthly' },
  { path: '/progetta-cassa', priority: '0.9', changefreq: 'monthly' },
  { path: '/glossario', priority: '0.8', changefreq: 'monthly' },
  { path: '/chi-siamo', priority: '0.5', changefreq: 'yearly' },
  { path: '/contatti', priority: '0.5', changefreq: 'yearly' },
  { path: '/termini', priority: '0.2', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.2', changefreq: 'yearly' },
  { path: '/cookie-policy', priority: '0.2', changefreq: 'yearly' },
];

// le voci del glossario si leggono dal sorgente: aggiungerne una non richiede
// di ricordarsi di aggiornare anche questo file
const sorgente = readFileSync(resolve(root, 'src/data/glossary.ts'), 'utf8');
const voci = [...sorgente.matchAll(/^\s{4}id: '([a-z0-9-]+)',/gm)].map(m => m[1]);

if (!voci.length) {
  console.error('sitemap: nessuna voce di glossario trovata, controlla il formato di glossary.ts');
  process.exit(1);
}

const oggi = new Date().toISOString().slice(0, 10);
const url = (loc, priority, changefreq) =>
  `  <url>\n    <loc>${BASE}${loc}</loc>\n    <lastmod>${oggi}</lastmod>\n` +
  `    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...PAGINE.map(p => url(p.path, p.priority, p.changefreq)),
  ...voci.map(id => url(`/glossario/${id}`, '0.6', 'yearly')),
  '</urlset>',
  '',
].join('\n');

const dist = resolve(root, 'dist');
if (!existsSync(dist)) {
  console.error('sitemap: manca la cartella dist, esegui prima la build');
  process.exit(1);
}

writeFileSync(resolve(dist, 'sitemap.xml'), xml, 'utf8');
console.log(`sitemap: ${PAGINE.length + voci.length} url (${voci.length} voci di glossario)`);
