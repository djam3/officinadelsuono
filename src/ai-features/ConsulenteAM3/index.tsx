import { useAIFeatures } from '../../contexts/AIFeaturesContext';

export function ConsulenteAM3() {
  const { features } = useAIFeatures();
  if (!features.consulente_am3.enabled) return null;

  // TODO: implementare logica reale chatbot pre-vendita esperto DJ
  return (
    <div className="fixed bottom-24 right-6 z-50 bg-zinc-900 border border-brand-orange/30 rounded-2xl p-4 text-white text-sm max-w-xs shadow-xl">
      <p className="font-bold text-brand-orange mb-1">Consulente AI AM3</p>
      <p className="text-zinc-400 text-xs">Funzionalità in arrivo — Da implementare</p>
    </div>
  );
}
