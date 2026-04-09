/**
 * AIFeaturesContext — centralized AI feature flags & configs.
 * Admin sets these in Firestore `settings/ai_features`.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface AIFeatureConfig {
  enabled: boolean;
  provider?: 'claude' | 'gemini-free';
  model?: string;
  systemPrompt?: string;
  [key: string]: any;
}

export interface AIFeatures {
  consulente_am3: AIFeatureConfig;
  quiz_trova_setup: AIFeatureConfig;
  seo_auto: AIFeatureConfig;
  recensioni_aggregate: AIFeatureConfig;
  email_marketing: AIFeatureConfig;
}

const DEFAULT_FEATURES: AIFeatures = {
  consulente_am3: { enabled: true, provider: 'gemini-free', model: 'gemini-2.0-flash' },
  quiz_trova_setup: { enabled: true, provider: 'gemini-free' },
  seo_auto: { enabled: true, provider: 'gemini-free' },
  recensioni_aggregate: { enabled: true, provider: 'gemini-free' },
  email_marketing: { enabled: true, provider: 'gemini-free' },
};

interface AIFeaturesContextValue {
  features: AIFeatures;
  loading: boolean;
  saveFeature: (id: keyof AIFeatures, config: Partial<AIFeatureConfig>) => Promise<void>;
}

const AIFeaturesContext = createContext<AIFeaturesContextValue>({
  features: DEFAULT_FEATURES,
  loading: true,
  saveFeature: async () => {},
});

export function AIFeaturesProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<AIFeatures>(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'ai_features'),
      (snap) => {
        if (snap.exists()) {
          setFeatures({ ...DEFAULT_FEATURES, ...snap.data() } as AIFeatures);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const saveFeature = async (id: keyof AIFeatures, config: Partial<AIFeatureConfig>) => {
    const updated = { ...features, [id]: { ...features[id], ...config } };
    setFeatures(updated);
    await setDoc(doc(db, 'settings', 'ai_features'), updated);
  };

  return (
    <AIFeaturesContext.Provider value={{ features, loading, saveFeature }}>
      {children}
    </AIFeaturesContext.Provider>
  );
}

export function useAIFeatures() {
  return useContext(AIFeaturesContext);
}
