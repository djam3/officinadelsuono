import { db } from '../firebase';
import { collection, addDoc, onSnapshot, doc, setDoc, serverTimestamp, query, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface AICostEntry {
  id?: string;
  provider: 'gemini' | 'claude' | 'ollama' | 'huggingface';
  model: string;
  tokensIn?: number;
  tokensOut?: number;
  cost: number;
  endpoint: string;
  timestamp: any;
  metadata?: Record<string, any>;
}

// Prezzi approssimativi per 1M tokens (in USD)
const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  // Gemini
  'gemini-2.0-flash-lite': { input: 0.10, output: 0.40 },
  'gemini-2.0-flash-lite-lite': { input: 0.075, output: 0.30 },
  'gemini-2.0-flash-lite': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'gemini-3-flash-preview': { input: 0.075, output: 0.30 },
  'gemini-3.1-flash-image-preview': { input: 0.075, output: 0.30 },
  // Claude
  'claude-sonnet-4-6': { input: 3.00, output: 15.00 },
  'claude-haiku-4-5-20251001': { input: 0.80, output: 4.00 },
  'claude-opus-4-6': { input: 15.00, output: 75.00 },
  // Free
  'ollama/llama3': { input: 0, output: 0 },
  'huggingface/free': { input: 0, output: 0 },
};

function calculateCost(model: string, tokensIn: number, tokensOut: number): number {
  const price = MODEL_PRICES[model.toLowerCase()] || { input: 0, output: 0 };
  return ((tokensIn * price.input) + (tokensOut * price.output)) / 1000000;
}

class AICostTracker {
  private monthlyBudget: number = 100;
  private currentMonthCost: number = 0;
  private listeners: Set<(cost: number, entries: AICostEntry[]) => void> = new Set();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;

    // Listener per i costi in tempo reale
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const q = query(
      collection(db, 'ai_costs'),
      orderBy('timestamp', 'desc'),
      limit(1000)
    );

    onSnapshot(q, (snap) => {
      let cost = 0;
      const entries: AICostEntry[] = [];

      snap.docs.forEach(d => {
        const data = d.data();
        const entryDate = data.timestamp?.toDate?.();
        if (entryDate && entryDate >= startOfMonth) {
          cost += data.cost || 0;
        }
        entries.push({ id: d.id, ...data });
      });

      this.currentMonthCost = cost;
      this.notifyListeners(cost, entries);
    });

    // Listener per il budget
    onSnapshot(doc(db, 'settings', 'ai_budget'), (snap) => {
      if (snap.exists()) {
        this.monthlyBudget = snap.data().monthlyBudget || 100;
      }
    });
  }

  async logUsage(entry: Omit<AICostEntry, 'id' | 'timestamp'>): Promise<void> {
    await this.initialize();

    const cost = entry.cost || calculateCost(entry.model, entry.tokensIn || 0, entry.tokensOut || 0);

    await addDoc(collection(db, 'ai_costs'), {
      ...entry,
      cost,
      timestamp: serverTimestamp(),
    });
  }

  async logFreeUsage(provider: 'ollama' | 'huggingface', model: string, endpoint: string): Promise<void> {
    await this.logUsage({
      provider,
      model,
      tokensIn: 0,
      tokensOut: 0,
      cost: 0,
      endpoint,
    });
  }

  getCurrentMonthCost(): number {
    return this.currentMonthCost;
  }

  getMonthlyBudget(): number {
    return this.monthlyBudget;
  }

  getPercentageUsed(): number {
    return Math.min(100, (this.currentMonthCost / this.monthlyBudget) * 100);
  }

  subscribe(callback: (cost: number, entries: AICostEntry[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentMonthCost, []);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(cost: number, entries: AICostEntry[]) {
    this.listeners.forEach(cb => cb(cost, entries));
  }

  async resetBudget(newBudget: number): Promise<void> {
    await setDoc(doc(db, 'settings', 'ai_budget'), {
      monthlyBudget: newBudget,
      updatedAt: serverTimestamp(),
    });
  }
}

export const aiCostTracker = new AICostTracker();
