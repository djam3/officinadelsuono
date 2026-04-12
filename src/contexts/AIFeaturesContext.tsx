/**
 * AIFeaturesContext — centralized AI feature flags & configs.
 * Admin sets these in Firestore `settings/ai_features`.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface AICosts {
  total_eur: number;
  month: string;
  by_feature: Record<string, number>;
  calls_total: number;
  last_updated?: any;
}

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
  descrizioni_seo_auto: AIFeatureConfig;
  recensioni_aggregate: AIFeatureConfig;
  email_personalizzate: AIFeatureConfig;
}

const DEFAULT_FEATURES: AIFeatures = {
  consulente_am3: { enabled: true, provider: 'gemini-free', model: 'gemini-2.0-flash-lite' },
  quiz_trova_setup: { enabled: true, provider: 'gemini-free' },
  descrizioni_seo_auto: { enabled: true, provider: 'gemini-free' },
  recensioni_aggregate: { enabled: true, provider: 'gemini-free' },
  email_personalizzate: { enabled: true, provider: 'gemini-free' },
};

interface AIFeaturesContextValue {
  features: AIFeatures;
  loading: boolean;
  saveFeature: (id: keyof AIFeatures, config: Partial<AIFeatureConfig>) => Promise<void>;
  toggleFeature: (key: keyof AIFeatures, adminEmail: string) => Promise<void>;
  updateConfig: (key: keyof AIFeatures, config: Partial<AIFeatureConfig>, adminEmail: string) => Promise<void>;
  togglingKey: string | null;
  costs: AICosts | null;
  costsLoading: boolean;
  refreshCosts: () => Promise<void>;
}

const AIFeaturesContext = createContext<AIFeaturesContextValue>({
  features: DEFAULT_FEATURES,
  loading: true,
  saveFeature: async () => {},
  toggleFeature: async () => {},
  updateConfig: async () => {},
  togglingKey: null,
  costs: null,
  costsLoading: false,
  refreshCosts: async () => {},
});

export function AIFeaturesProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<AIFeatures>(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [costs, setCosts] = useState<AICosts | null>(null);
  const [costsLoading, setCostsLoading] = useState(false);

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
    await setDoc(doc(db, 'settings', 'ai_features'), updated, { merge: true });
  };

  const toggleFeature = async (key: keyof AIFeatures, adminEmail: string) => {
    const prevEnabled = features[key]?.enabled ?? false;
    setTogglingKey(key);
    // Optimistic update
    setFeatures(prev => ({ ...prev, [key]: { ...prev[key], enabled: !prevEnabled } }));
    try {
      await setDoc(
        doc(db, 'settings', 'ai_features'),
        { [key]: { ...features[key], enabled: !prevEnabled }, last_updated: serverTimestamp(), updated_by: adminEmail },
        { merge: true }
      );
    } catch {
      // Rollback on error
      setFeatures(prev => ({ ...prev, [key]: { ...prev[key], enabled: prevEnabled } }));
      throw new Error('Errore salvataggio. Stato ripristinato.');
    } finally {
      setTogglingKey(null);
    }
  };

  const updateConfig = async (key: keyof AIFeatures, config: Partial<AIFeatureConfig>, adminEmail: string) => {
    const updated = { ...features[key], ...config };
    setFeatures(prev => ({ ...prev, [key]: updated }));
    await setDoc(
      doc(db, 'settings', 'ai_features'),
      { [key]: updated, last_updated: serverTimestamp(), updated_by: adminEmail },
      { merge: true }
    );
  };

  const refreshCosts = useCallback(async () => {
    setCostsLoading(true);
    try {
      const snap = await getDoc(doc(db, 'settings', 'ai_costs'));
      if (snap.exists()) {
        setCosts(snap.data() as AICosts);
      } else {
        setCosts({ total_eur: 0, month: new Date().toISOString().slice(0, 7), by_feature: {}, calls_total: 0 });
      }
    } finally {
      setCostsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCosts();
  }, [refreshCosts]);

  return (
    <AIFeaturesContext.Provider value={{ features, loading, saveFeature, toggleFeature, updateConfig, togglingKey, costs, costsLoading, refreshCosts }}>
      {children}
    </AIFeaturesContext.Provider>
  );
}

export function useAIFeatures() {
  return useContext(AIFeaturesContext);
}
