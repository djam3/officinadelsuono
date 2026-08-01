/**
 * Configurazione del sito — interruttori di sezione.
 *
 * L'attività è NOLEGGIO di attrezzatura audio/video/DJ ad Avellino e provincia.
 * Le sezioni e-commerce restano nel codice ma nascoste: per riattivarle basta
 * rimettere il flag a `true` (nessun file da recuperare).
 */

/** Vendita prodotti: shop, categorie, carrello, confronto, mercatino usato */
export const SHOP_ENABLED = false;

/** Noleggio attrezzatura (attività principale) */
export const RENTAL_ENABLED = true;

/** Contatti attività */
export const BUSINESS = {
  name: 'Officina del Suono',
  tagline: 'Il suono giusto per ogni evento.',
  description: 'Noleggio di attrezzature audio, video, karaoke e console DJ per feste ed eventi ad Avellino e provincia.',
  area: 'Avellino e provincia',
  whatsapp: '393477397016',
  whatsappDisplay: '+39 347 739 7016',
  email: 'info@officina-del-suono.it',
} as const;

/** Link WhatsApp precompilato */
export function waLink(message: string): string {
  return `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(message)}`;
}
