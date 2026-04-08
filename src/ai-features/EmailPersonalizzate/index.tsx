import { useAIFeatures } from '../../contexts/AIFeaturesContext';

// Background service — non visibile al cliente direttamente
export function EmailPersonalizzate() {
  const { features } = useAIFeatures();
  if (!features.email_personalizzate.enabled) return null;

  // TODO: implementare logica reale email marketing personalizzate via AI
  return null;
}
