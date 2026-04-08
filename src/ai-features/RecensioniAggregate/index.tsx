import { useAIFeatures } from '../../contexts/AIFeaturesContext';

export function RecensioniAggregate({ productId }: { productId?: string }) {
  const { features } = useAIFeatures();
  if (!features.recensioni_aggregate.enabled) return null;

  // TODO: implementare logica reale aggregazione recensioni YouTube/Reddit/forum DJ
  return (
    <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-xl">
      <p className="text-xs font-bold text-brand-orange uppercase tracking-widest mb-1">Cosa dicono i DJ</p>
      <p className="text-zinc-500 text-xs">Funzionalità in arrivo — Da implementare</p>
    </div>
  );
}
