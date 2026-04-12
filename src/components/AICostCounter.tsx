import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, RefreshCw, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { aiCostTracker, AICostEntry } from '../services/aiCostTracker';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AICostCounterProps {
  onRefresh?: () => void;
}

export function AICostCounter({ onRefresh }: AICostCounterProps) {
  const [currentCost, setCurrentCost] = useState(0);
  const [budget, setBudget] = useState(100);
  const [recentEntries, setRecentEntries] = useState<AICostEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState('');

  useEffect(() => {
    const unsubscribe = aiCostTracker.subscribe((cost, entries) => {
      setCurrentCost(cost);
      setRecentEntries(entries.slice(0, 10));
    });

    // Carica budget
    const loadBudget = async () => {
      const snap = await getDoc(doc(db, 'settings', 'ai_budget'));
      if (snap.exists()) {
        setBudget(snap.data().monthlyBudget || 100);
      }
    };
    loadBudget();

    return unsubscribe;
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await aiCostTracker.initialize();
    setTimeout(() => setIsRefreshing(false), 500);
    onRefresh?.();
  };

  const handleSaveBudget = async () => {
    const value = parseFloat(newBudget);
    if (isNaN(value) || value <= 0) return;

    setIsSavingBudget(true);
    await aiCostTracker.resetBudget(value);
    setBudget(value);
    setNewBudget('');
    setIsSavingBudget(false);
  };

  const percentage = Math.min(100, (currentCost / budget) * 100);
  const isWarning = percentage > 70;
  const isDanger = percentage > 90;

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'gemini': return 'text-blue-400 bg-blue-500/10';
      case 'claude': return 'text-amber-400 bg-amber-500/10';
      case 'ollama': return 'text-green-400 bg-green-500/10';
      case 'huggingface': return 'text-purple-400 bg-purple-500/10';
      default: return 'text-zinc-400 bg-zinc-500/10';
    }
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isDanger ? 'bg-red-500/20' : isWarning ? 'bg-amber-500/20' : 'bg-green-500/20'}`}>
              {isDanger || isWarning ? (
                <AlertTriangle className={`w-6 h-6 ${isDanger ? 'text-red-400' : 'text-amber-400'}`} />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-black">Contatore Costi AI</h3>
              <p className="text-xs text-zinc-500">Tracking in tempo reale delle spese API</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-xl transition-colors"
            title="Aggiorna"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Budget Editor */}
        <div className="flex items-center gap-3 mt-4 p-3 bg-zinc-950 rounded-xl border border-white/5">
          <DollarSign className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Budget Mensile:</span>
          <span className="text-sm font-black text-brand-orange">€{budget.toFixed(2)}</span>
          <input
            type="number"
            value={newBudget}
            onChange={(e) => setNewBudget(e.target.value)}
            placeholder="Nuovo budget..."
            className="flex-1 max-w-24 bg-zinc-900 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-orange"
          />
          <button
            onClick={handleSaveBudget}
            disabled={isSavingBudget || !newBudget}
            className="px-3 py-1 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors"
          >
            Salva
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 p-6 bg-zinc-950/50">
        <div className="text-center">
          <div className="text-2xl font-black text-white">€{currentCost.toFixed(2)}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Speso questo mese</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-black ${isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-green-400'}`}>
            {percentage.toFixed(1)}%
          </div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Budget utilizzato</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-zinc-400">€{(budget - currentCost).toFixed(2)}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Rimanente</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 pb-6">
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        {isWarning && (
          <p className="text-xs text-amber-400 mt-2 font-bold">
            ⚠️ Hai utilizzato oltre il {percentage.toFixed(0)}% del budget mensile
          </p>
        )}
      </div>

      {/* Recent Entries */}
      <div className="p-6 border-t border-white/5">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-left mb-3"
        >
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ultime chiamate AI</span>
          <TrendingUp className={`w-4 h-4 text-zinc-500 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 overflow-hidden"
            >
              {recentEntries.length === 0 ? (
                <p className="text-sm text-zinc-600 text-center py-4">Nessuna chiamata AI registrata</p>
              ) : (
                recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getProviderColor(entry.provider)}`}>
                        {entry.provider}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">{entry.model}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-white">€{entry.cost.toFixed(4)}</div>
                      <div className="text-[10px] text-zinc-600">
                        {entry.timestamp?.toDate?.()?.toLocaleTimeString('it-IT')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
