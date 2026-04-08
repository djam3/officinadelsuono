import { useAIFeatures } from '../../contexts/AIFeaturesContext';

export function QuizTrovaSetup() {
  const { features } = useAIFeatures();
  if (!features.quiz_trova_setup.enabled) return null;

  // TODO: implementare logica reale quiz AI conversazionale con lead capture
  return (
    <div className="p-6 bg-zinc-900 border border-brand-orange/20 rounded-2xl text-center">
      <p className="font-bold text-brand-orange mb-1">Quiz Trova il Tuo Setup</p>
      <p className="text-zinc-400 text-sm">Funzionalità in arrivo — Da implementare</p>
    </div>
  );
}
