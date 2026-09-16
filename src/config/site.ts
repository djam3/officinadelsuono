/**
 * Configurazione del sito — informazioni di contatto e branding.
 */

/** Contatti attività */
export const BUSINESS = {
  name: 'Officina del Suono',
  tagline: 'Si progetta prima di tagliare.',
  description: 'Calcolatore per casse acustiche: parametri Thiele-Small verificati, sei cariche acustiche, curve di risposta, dimensioni e lista di taglio. Gratuito, senza registrazione.',
  // cosa fa lo strumento, non dove si trova chi l'ha scritto: un calcolatore
  // non ha una zona servita
  area: 'progettazione di diffusori acustici',
  whatsapp: '393477397016',
  whatsappDisplay: '+39 347 739 7016',
  email: 'info@officina-del-suono.it',
} as const;

/** Link WhatsApp precompilato */
export function waLink(message: string): string {
  return `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(message)}`;
}
