import { useAIFeatures } from '../../contexts/AIFeaturesContext';

// Questo componente è usato internamente dall'admin per generare descrizioni
// Non è visibile al cliente direttamente
export function DescrizioniSEO({ productName, specs }: { productName?: string; specs?: Record<string, string> }) {
  const { features } = useAIFeatures();
  if (!features.descrizioni_seo_auto.enabled) return null;

  // TODO: implementare logica reale generazione SEO via Anthropic Claude
  return null; // Background service, non visibile al cliente
}
