import { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Save, X, Trash2, Tag, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { DiscountCode } from '../../types/admin';

interface AdminDiscountsPanelProps {
  discounts: DiscountCode[];
}

export function AdminDiscountsPanel({ discounts }: AdminDiscountsPanelProps) {
  const [discountForm, setDiscountForm] = useState({ code: '', type: 'percent', value: 0, minOrder: 0, maxUses: 0, expiresAt: '', active: true });
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);

  const handleSaveDiscount = async () => {
    if (!discountForm.code.trim()) { alert('Inserisci un codice.'); return; }
    if (!discountForm.value) { alert('Inserisci il valore dello sconto.'); return; }
    setIsSavingDiscount(true);
    try {
      const data = {
        ...discountForm,
        code: discountForm.code.toUpperCase().trim(),
        usedCount: 0,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'discount_codes'), data);
      setDiscountForm({ code: '', type: 'percent', value: 0, minOrder: 0, maxUses: 0, expiresAt: '', active: true });
      setIsAddingDiscount(false);
    } catch (e) {
      alert('Errore salvataggio codice sconto.');
    } finally {
      setIsSavingDiscount(false);
    }
  };

  const handleToggleDiscount = async (id: string, active: boolean) => {
    await updateDoc(doc(db, 'discount_codes', id), { active: !active });
  };

  const handleDeleteDiscount = async (id: string) => {
    if (window.confirm('Eliminare questo codice sconto?')) {
      await deleteDoc(doc(db, 'discount_codes', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2"><Tag className="w-5 h-5 text-brand-orange" /> Codici Sconto ({discounts.length})</h2>
            <p className="text-zinc-500 text-sm mt-1">Crea coupon con percentuale o valore fisso. Verranno applicati automaticamente nel carrello.</p>
          </div>
          <button
            onClick={() => setIsAddingDiscount(v => !v)}
            className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuovo Codice
          </button>
        </div>

        {isAddingDiscount && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-6 bg-zinc-950 border border-brand-orange/30 rounded-2xl"
          >
            <h3 className="font-bold mb-4">Nuovo Codice Sconto</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Codice</label>
                <input
                  type="text"
                  placeholder="ES. ESTATE25"
                  value={discountForm.code}
                  onChange={e => setDiscountForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Tipo</label>
                <select
                  value={discountForm.type}
                  onChange={e => setDiscountForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-orange"
                >
                  <option value="percent">Percentuale (%)</option>
                  <option value="fixed">Valore Fisso (€)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                  {discountForm.type === 'percent' ? 'Sconto (%)' : 'Sconto (€)'}
                </label>
                <input
                  type="number"
                  placeholder={discountForm.type === 'percent' ? '25' : '20'}
                  value={discountForm.value || ''}
                  onChange={e => setDiscountForm(f => ({ ...f, value: Number(e.target.value) }))}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Ordine Minimo (€)</label>
                <input
                  type="number"
                  placeholder="0 = nessun minimo"
                  value={discountForm.minOrder || ''}
                  onChange={e => setDiscountForm(f => ({ ...f, minOrder: Number(e.target.value) }))}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Max Utilizzi</label>
                <input
                  type="number"
                  placeholder="0 = illimitato"
                  value={discountForm.maxUses || ''}
                  onChange={e => setDiscountForm(f => ({ ...f, maxUses: Number(e.target.value) }))}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Scadenza</label>
                <input
                  type="date"
                  value={discountForm.expiresAt}
                  onChange={e => setDiscountForm(f => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange text-white"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={handleSaveDiscount}
                disabled={isSavingDiscount}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-colors"
              >
                {isSavingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salva Codice
              </button>
              <button onClick={() => setIsAddingDiscount(false)} className="flex items-center gap-2 px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-bold transition-colors">
                <X className="w-4 h-4" /> Annulla
              </button>
            </div>
          </motion.div>
        )}

        {discounts.length === 0 ? (
          <p className="text-zinc-500 text-sm py-8 text-center">Nessun codice sconto attivo. Creane uno!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-zinc-500 uppercase text-xs border-b border-white/10">
                <tr>
                  <th className="pb-3 pr-4">Codice</th>
                  <th className="pb-3 pr-4">Sconto</th>
                  <th className="pb-3 pr-4">Min. Ordine</th>
                  <th className="pb-3 pr-4">Utilizzi</th>
                  <th className="pb-3 pr-4">Scadenza</th>
                  <th className="pb-3 pr-4">Stato</th>
                  <th className="pb-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4 font-mono font-bold text-brand-orange">{d.code}</td>
                    <td className="py-3 pr-4">{d.type === 'percent' ? `${d.value}%` : `€${d.value}`}</td>
                    <td className="py-3 pr-4">{d.minOrder ? `€${d.minOrder}` : '—'}</td>
                    <td className="py-3 pr-4">{d.usedCount || 0}{d.maxUses ? ` / ${d.maxUses}` : ''}</td>
                    <td className="py-3 pr-4">{d.expiresAt || '—'}</td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => handleToggleDiscount(d.id, d.active)}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${d.active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-500'}`}
                      >
                        {d.active ? 'Attivo' : 'Disattivo'}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => handleDeleteDiscount(d.id)} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
