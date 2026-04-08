import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

export interface AICosts {
  total_eur: number;
  month: string;
  by_feature: Record<string, number>;
  calls_total: number;
  last_updated?: any;
}

export interface AIFeatureConfig {
  // Provider
  provider?: 'claude' | 'gemini-free';
  // Consulente AM3
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxMessages?: number;
  monthlyBudget?: number;
  languages?: string[];
  categories?: string[];
  // Quiz
  numQuestions?: number;
  introText?: string;
  followUpTemplate?: string;
  mailingProvider?: string;
  discountEnabled?: boolean;
  discountPercent?: number;
  // SEO
  toneOfVoice?: string;
  descLength?: 'breve' | 'media' | 'lunga';
  includeFaq?: boolean;
  includeSchema?: boolean;
  // Recensioni
  updateFrequency?: 'mensile' | 'trimestrale' | 'semestrale';
  sources?: string[];
  minRating?: number;
  showDisclaimer?: boolean;
  disclaimerText?: string;
  // Email
  sendFrequency?: 'settimanale' | 'bisettimanale' | 'mensile';
  segments?: string[];
  emailSignature?: string;
  dailyLimit?: number;
  emailProvider?: string;
}

export interface AIFeature {
  enabled: boolean;
  config: AIFeatureConfig;
}

export interface AIFeatures {
  consulente_am3: AIFeature;
  quiz_trova_setup: AIFeature;
  descrizioni_seo_auto: AIFeature;
  recensioni_aggregate: AIFeature;
  email_personalizzate: AIFeature;
  last_updated?: any;
  updated_by?: string;
}

const DEFAULT_FEATURES: AIFeatures = {
  consulente_am3: { enabled: false, config: { model: 'claude-haiku-4-5-20251001', temperature: 0.7, maxMessages: 15, monthlyBudget: 50, languages: ['IT'], categories: [] } },
  quiz_trova_setup: { enabled: false, config: { numQuestions: 4, introText: '', followUpTemplate: '', mailingProvider: 'custom', discountEnabled: false, discountPercent: 10 } },
  descrizioni_seo_auto: { enabled: false, config: { toneOfVoice: '', descLength: 'media', includeFaq: true, includeSchema: true } },
  recensioni_aggregate: { enabled: false, config: { updateFrequency: 'trimestrale', sources: ['YouTube', 'Reddit', 'forum DJ', 'blog'], minRating: 0, showDisclaimer: true, disclaimerText: 'Sintesi AI di opinioni pubbliche dal web.' } },
  email_personalizzate: { enabled: false, config: { sendFrequency: 'settimanale', segments: ['nuovi', 'attivi', 'dormienti', 'VIP'], emailSignature: 'Amerigo | Officina del Suono', dailyLimit: 100, emailProvider: 'resend' } },
};

interface AIFeaturesContextType {
  features: AIFeatures;
  loading: boolean;
  toggleFeature: (featureKey: keyof Omit<AIFeatures, 'last_updated' | 'updated_by'>, adminEmail: string) => Promise<void>;
  updateConfig: (featureKey: keyof Omit<AIFeatures, 'last_updated' | 'updated_by'>, config: Partial<AIFeatureConfig>, adminEmail: string) => Promise<void>;
  togglingKey: string | null;
  costs: AICosts | null;
  costsLoading: boolean;
  refreshCosts: () => Promise<void>;
}

const AIFeaturesContext = createContext<AIFeaturesContextType>({
  features: DEFAULT_FEATURES,
  loading: true,
  toggleFeature: async () => {},
  updateConfig: async () => {},
  togglingKey: null,
  costs: null,
  costsLoading: false,
  refreshCosts: async () => {},
});

export function AIFeaturesProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState<AIFeatures>(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [costs, setCosts] = useState<AICosts | null>(null);
  const [costsLoading, setCostsLoading] = useState(false);

  useEffect(() => {
    const ref = doc(db, 'settings', 'ai_features');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setFeatures({ ...DEFAULT_FEATURES, ...snap.data() } as AIFeatures);
      } else {
        // Crea documento con defaults se non esiste
        setDoc(ref, DEFAULT_FEATURES).catch(() => {});
        setFeatures(DEFAULT_FEATURES);
      }
      setLoading(false);
    }, () => {
      setLoading(false);
    });
    return unsub;
  }, []);

  const toggleFeature = async (
    featureKey: keyof Omit<AIFeatures, 'last_updated' | 'updated_by'>,
    adminEmail: string
  ) => {
    const prevEnabled = features[featureKey]?.enabled ?? false;
    const newEnabled = !prevEnabled;

    // Optimistic update
    setFeatures(prev => ({
      ...prev,
      [featureKey]: { ...prev[featureKey], enabled: newEnabled },
    }));
    setTogglingKey(featureKey);

    const ref = doc(db, 'settings', 'ai_features');
    try {
      await setDoc(ref, {
        [featureKey]: { ...features[featureKey], enabled: newEnabled },
        last_updated: serverTimestamp(),
        updated_by: adminEmail,
      }, { merge: true });

      // Log evento
      await addDoc(collection(db, 'logs/ai_features_changes/entries'), {
        feature: featureKey,
        newState: newEnabled,
        adminEmail,
        timestamp: serverTimestamp(),
      });
    } catch {
      // Rollback
      setFeatures(prev => ({
        ...prev,
        [featureKey]: { ...prev[featureKey], enabled: prevEnabled },
      }));
      throw new Error('Errore salvataggio. Stato ripristinato.');
    } finally {
      setTogglingKey(null);
    }
  };

  const refreshCosts = useCallback(async () => {
    setCostsLoading(true);
    try {
      const snap = await getDoc(doc(db, 'settings', 'ai_costs'));
      if (snap.exists()) {
        setCosts(snap.data() as AICosts);
      } else {
        const empty: AICosts = {
          total_eur: 0,
          month: new Date().toISOString().slice(0, 7),
          by_feature: {},
          calls_total: 0,
        };
        setCosts(empty);
      }
    } finally {
      setCostsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCosts();
  }, [refreshCosts]);

  const updateConfig = async (
    featureKey: keyof Omit<AIFeatures, 'last_updated' | 'updated_by'>,
    config: Partial<AIFeatureConfig>,
    adminEmail: string
  ) => {
    const ref = doc(db, 'settings', 'ai_features');
    const newConfig = { ...features[featureKey].config, ...config };
    await setDoc(ref, {
      [featureKey]: { ...features[featureKey], config: newConfig },
      last_updated: serverTimestamp(),
      updated_by: adminEmail,
    }, { merge: true });
    setFeatures(prev => ({
      ...prev,
      [featureKey]: { ...prev[featureKey], config: newConfig },
    }));
  };

  return (
    <AIFeaturesContext.Provider value={{ features, loading, toggleFeature, updateConfig, togglingKey, costs, costsLoading, refreshCosts }}>
      {children}
    </AIFeaturesContext.Provider>
  );
}

export function useAIFeatures() {
  return useContext(AIFeaturesContext);
}
