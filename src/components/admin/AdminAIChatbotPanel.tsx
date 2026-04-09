import { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { Save, Trash2, Loader2 } from 'lucide-react';

interface AdminAIChatbotPanelProps {
  aiKnowledge: any[];
  aiLogs: any[];
  products: any[];
}

export function AdminAIChatbotPanel({ aiKnowledge, aiLogs, products }: AdminAIChatbotPanelProps) {
  const [aiForm, setAiForm] = useState({ question: '', answer: '', keywords: '' });
  const [isSavingAi, setIsSavingAi] = useState(false);

  const handleSaveAiKnowledge = async () => {
    if (!aiForm.question.trim() || !aiForm.answer.trim()) {
      alert('Inserisci almeno domanda e risposta.');
      return;
    }
    setIsSavingAi(true);
    try {
      await addDoc(collection(db, 'chatbot_knowledge'), {
        question: aiForm.question.trim(),
        answer: aiForm.answer.trim(),
        keywords: aiForm.keywords.trim(),
        hits: 0,
        createdAt: new Date().toISOString(),
      });
      setAiForm({ question: '', answer: '', keywords: '' });
    } catch (e) {
      alert('Errore salvataggio.');
    } finally {
      setIsSavingAi(false);
    }
  };

  const handleDeleteAiKnowledge = async (id: string) => {
    if (window.confirm('Eliminare questa risposta appresa?')) {
      await deleteDoc(doc(db, 'chatbot_knowledge', id));
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Prodotti indicizzati', value: products.length, color: 'text-brand-orange' },
          { label: 'Risposte apprese', value: aiKnowledge.length, color: 'text-green-400' },
          { label: 'Conversazioni log', value: aiLogs.length, color: 'text-blue-400' },
          { label: 'Stato AI', value: 'Attiva', color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-white/10 rounded-xl p-4">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Insegna nuova risposta */}
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-1">🧠 Insegna una nuova risposta</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Aggiungi domande e risposte personalizzate. L'AI le usa con priorità massima.
        </p>
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-1">Domanda / Trigger</label>
            <input
              type="text"
              value={aiForm.question}
              onChange={e => setAiForm(f => ({ ...f, question: e.target.value }))}
              placeholder="Es: quanto costa la spedizione express?"
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-1">Parole chiave (separate da virgola)</label>
            <input
              type="text"
              value={aiForm.keywords}
              onChange={e => setAiForm(f => ({ ...f, keywords: e.target.value }))}
              placeholder="Es: spedizione, express, veloce, consegna rapida"
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-1">Risposta dell'AI</label>
            <textarea
              value={aiForm.answer}
              onChange={e => setAiForm(f => ({ ...f, answer: e.target.value }))}
              placeholder="Es: La spedizione express 24h costa €9,90. Disponibile per ordini entro le 14:00."
              rows={4}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange text-sm resize-none"
            />
          </div>
          <button
            onClick={handleSaveAiKnowledge}
            disabled={isSavingAi}
            className="flex items-center gap-2 px-6 py-3 bg-brand-orange hover:bg-orange-600 disabled:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
          >
            {isSavingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salva & Addestra AI
          </button>
        </div>
      </div>

      {/* Knowledge base */}
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">📚 Risposte apprese ({aiKnowledge.length})</h2>
        {aiKnowledge.length === 0 ? (
          <p className="text-zinc-500 text-sm">Nessuna risposta personalizzata. Aggiungine una sopra!</p>
        ) : (
          <div className="space-y-3">
            {aiKnowledge.map(k => (
              <div key={k.id} className="bg-zinc-950 border border-white/5 rounded-xl p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white truncate">❓ {k.question}</div>
                  {k.keywords && <div className="text-xs text-zinc-500 mt-0.5">🔑 {k.keywords}</div>}
                  <div className="text-sm text-zinc-400 mt-1 line-clamp-2">💬 {k.answer}</div>
                </div>
                <button
                  onClick={() => handleDeleteAiKnowledge(k.id)}
                  className="shrink-0 p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log conversazioni */}
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-2">💬 Ultime conversazioni</h2>
        <p className="text-zinc-500 text-sm mb-4">Vedi cosa chiedono i clienti per migliorare le risposte.</p>
        {aiLogs.length === 0 ? (
          <p className="text-zinc-600 text-sm">Nessuna conversazione registrata ancora.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {aiLogs.map(log => (
              <div key={log.id} className="bg-zinc-950 border border-white/5 rounded-xl p-4">
                <div className="text-xs text-zinc-500 mb-2">
                  {log.timestamp?.toDate?.()?.toLocaleString('it-IT') ?? 'Data non disponibile'}
                </div>
                <div className="text-sm font-bold text-brand-orange mb-1">👤 {log.userMessage}</div>
                <div className="text-sm text-zinc-400 line-clamp-2">🤖 {log.botResponse}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
