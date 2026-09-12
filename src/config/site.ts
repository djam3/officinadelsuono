/**
 * Configurazione del sito — informazioni di contatto e branding.
 */

/** Contatti attività */
export const BUSINESS = {
  name: 'Officina del Suono',
  tagline: 'Il suono giusto per ogni progetto.',
  description: 'Consulenza tecnica specializzata e attrezzatura audio professionale ad Avellino e provincia, curata da un Sound Engineer certificato MAT Academy.',
  area: 'Avellino e provincia',
  whatsapp: '393477397016',
  whatsappDisplay: '+39 347 739 7016',
  email: 'info@officina-del-suono.it',
} as const;

/** Link WhatsApp precompilato */
export function waLink(message: string): string {
  return `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(message)}`;
}
