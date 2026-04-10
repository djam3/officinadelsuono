import { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Save, X, Upload, Loader2, Receipt, FileText, Search, ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Invoice } from '../../types/admin';

interface AdminInvoicesPanelProps {
  invoices: Invoice[];
}

const STATUS_META: Record<Invoice['status'], { label: string; color: string; bg: string; border: string }> = {
  pagata:    { label: 'Pagata',    color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20'  },
  in_attesa: { label: 'In attesa', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  scaduta:   { label: 'Scaduta',   color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
  annullata: { label: 'Annullata', color: 'text-zinc-500',   bg: 'bg-zinc-800/50',   border: 'border-white/5'       },
};

const emptyForm = (): Partial<Invoice> => ({
  type: 'acquisto',
  number: '',
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  counterparty: '',
  vatNumber: '',
  description: '',
  amount: 0,
  vatRate: 22,
  vatAmount: 0,
  totalAmount: 0,
  status: 'in_attesa',
  pdfUrl: '',
  notes: '',
});

export function AdminInvoicesPanel({ invoices }: AdminInvoicesPanelProps) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'acquisto' | 'vendita'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Invoice['status']>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Invoice>>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // ── Computed ──────────────────────────────────────────────────────────────
  const filtered = invoices
    .filter(i => typeFilter === 'all' || i.type === typeFilter)
    .filter(i => statusFilter === 'all' || i.status === statusFilter)
    .filter(i => {
      const q = search.toLowerCase();
      return !q || i.number.toLowerCase().includes(q) || i.counterparty.toLowerCase().includes(q) || (i.vatNumber || '').toLowerCase().includes(q);
    });

  const summary = {
    totalAcquisto: invoices.filter(i => i.type === 'acquisto').reduce((s, i) => s + (i.totalAmount || 0), 0),
    totalVendita:  invoices.filter(i => i.type === 'vendita').reduce((s, i) => s + (i.totalAmount || 0), 0),
    daPagare:      invoices.filter(i => i.status === 'in_attesa').reduce((s, i) => s + (i.totalAmount || 0), 0),
    scadute:       invoices.filter(i => i.status === 'scaduta').length,
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const recalcVat = (amount: number, vatRate: number) => {
    const vatAmount   = parseFloat(((amount * vatRate) / 100).toFixed(2));
    const totalAmount = parseFloat((amount + vatAmount).toFixed(2));
    return { vatAmount, totalAmount };
  };

  const onAmountChange = (amount: number) => {
    setForm(p => ({ ...p, amount, ...recalcVat(amount, p.vatRate ?? 22) }));
  };

  const onVatRateChange = (vatRate: number) => {
    setForm(p => ({ ...p, vatRate, ...recalcVat(p.amount ?? 0, vatRate) }));
  };

  const openAdd = () => { setEditingId(null); setForm(emptyForm()); setShowModal(true); };
  const openEdit = (inv: Invoice) => { setEditingId(inv.id); setForm({ ...inv }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingId(null); };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUploadPdf = async (file: File) => {
    setIsUploadingPdf(true);
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch('/api/upload?folder=invoices', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload fallito');
      const { urls } = await res.json();
      setForm(p => ({ ...p, pdfUrl: urls[0] }));
    } catch (e: any) {
      alert(e.message || 'Errore caricamento PDF');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleSave = async () => {
    if (!form.number?.trim())      { alert('Numero fattura obbligatorio'); return; }
    if (!form.counterparty?.trim()) { alert('Fornitore/Cliente obbligatorio'); return; }
    if (!form.date)                { alert('Data obbligatoria'); return; }
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const data = {
        type:         form.type        || 'acquisto',
        number:       form.number!.trim(),
        date:         form.date!,
        dueDate:      form.dueDate     || '',
        counterparty: form.counterparty!.trim(),
        vatNumber:    form.vatNumber?.trim()   || '',
        description:  form.description?.trim() || '',
        amount:       form.amount      || 0,
        vatRate:      form.vatRate     ?? 22,
        vatAmount:    form.vatAmount   || 0,
        totalAmount:  form.totalAmount || 0,
        status:       form.status      || 'in_attesa',
        pdfUrl:       form.pdfUrl      || '',
        notes:        form.notes?.trim() || '',
        updatedAt:    now,
      };
      if (editingId) {
        await updateDoc(doc(db, 'invoices', editingId), data);
      } else {
        await addDoc(collection(db, 'invoices'), { ...data, createdAt: now });
      }
      closeModal();
    } catch (e: any) {
      alert(e.message || 'Errore salvataggio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminare questa fattura?')) return;
    await deleteDoc(doc(db, 'invoices', id));
  };

  const handleMarkPaid = async (id: string) => {
    await updateDoc(doc(db, 'invoices', id), { status: 'pagata', updatedAt: new Date().toISOString() });
  };

  const fmt = (n: number) => `€${n.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tot. acquisti',  value: fmt(summary.totalAcquisto), icon: ArrowDownLeft, color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'  },
          { label: 'Tot. vendite',   value: fmt(summary.totalVendita),  icon: ArrowUpRight,  color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
          { label: 'Da pagare',      value: fmt(summary.daPagare),      icon: Clock,         color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20'},
          {
            label: 'Scadute',
            value: summary.scadute,
            icon: AlertTriangle,
            color: summary.scadute > 0 ? 'text-red-400'   : 'text-zinc-500',
            bg:    summary.scadute > 0 ? 'bg-red-500/10'  : 'bg-zinc-800/50',
            border:summary.scadute > 0 ? 'border-red-500/20' : 'border-white/5',
          },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`p-5 rounded-2xl border ${kpi.border} ${kpi.bg}`}>
              <Icon className={`w-5 h-5 ${kpi.color} mb-3`} />
              <div className={`text-2xl font-black ${kpi.color} truncate`}>{kpi.value}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca numero, fornitore/cliente, P.IVA..."
            className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand-orange"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-orange">
          <option value="all">Tutte</option>
          <option value="acquisto">Acquisto</option>
          <option value="vendita">Vendita</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-orange">
          <option value="all">Tutti gli stati</option>
          <option value="in_attesa">In attesa</option>
          <option value="pagata">Pagate</option>
          <option value="scaduta">Scadute</option>
          <option value="annullata">Annullate</option>
        </select>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Nuova fattura
        </button>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
            <Receipt className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm font-bold uppercase tracking-widest">Nessuna fattura trovata</p>
            <p className="text-xs mt-1">Aggiungi la prima fattura con il pulsante qui sopra</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-zinc-500">
                  <th className="text-left px-5 py-3 font-bold">Tipo</th>
                  <th className="text-left px-5 py-3 font-bold">Numero</th>
                  <th className="text-left px-5 py-3 font-bold">Data</th>
                  <th className="text-left px-5 py-3 font-bold">Scadenza</th>
                  <th className="text-left px-5 py-3 font-bold">Fornitore / Cliente</th>
                  <th className="text-right px-5 py-3 font-bold">Imponibile</th>
                  <th className="text-right px-5 py-3 font-bold">IVA</th>
                  <th className="text-right px-5 py-3 font-bold">Totale</th>
                  <th className="text-left px-5 py-3 font-bold">Stato</th>
                  <th className="text-right px-5 py-3 font-bold">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => {
                  const st = STATUS_META[inv.status];
                  return (
                    <tr key={inv.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}>
                      <td className="px-5 py-3.5">
                        {inv.type === 'acquisto'
                          ? <span className="flex items-center gap-1.5 text-blue-400 font-bold text-xs"><ArrowDownLeft className="w-3.5 h-3.5" />Acquisto</span>
                          : <span className="flex items-center gap-1.5 text-green-400 font-bold text-xs"><ArrowUpRight className="w-3.5 h-3.5" />Vendita</span>
                        }
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-white">{inv.number}</td>
                      <td className="px-5 py-3.5 text-zinc-400">{inv.date}</td>
                      <td className="px-5 py-3.5 text-zinc-400">{inv.dueDate || '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-white truncate max-w-[180px]">{inv.counterparty}</div>
                        {inv.vatNumber && <div className="text-[10px] text-zinc-500 font-mono">{inv.vatNumber}</div>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-zinc-300">{fmt(inv.amount || 0)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-zinc-400 text-xs">{inv.vatRate}% · {fmt(inv.vatAmount || 0)}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-black text-white">{fmt(inv.totalAmount || 0)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${st.color} ${st.bg} ${st.border}`}>{st.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {inv.pdfUrl && (
                            <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" title="Apri PDF" className="p-1.5 text-zinc-500 hover:text-brand-orange rounded-lg hover:bg-brand-orange/10 transition-colors">
                              <FileText className="w-4 h-4" />
                            </a>
                          )}
                          {inv.status === 'in_attesa' && (
                            <button onClick={() => handleMarkPaid(inv.id)} title="Segna come pagata" className="p-1.5 text-zinc-500 hover:text-green-400 rounded-lg hover:bg-green-500/10 transition-colors">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => openEdit(inv)} title="Modifica" className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(inv.id)} title="Elimina" className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 py-3 border-t border-white/5 text-[10px] text-zinc-600 uppercase tracking-widest">
          {filtered.length} fatture mostrate · {invoices.length} totali
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
                <div className="flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-brand-orange" />
                  <h3 className="text-lg font-black">{editingId ? 'Modifica Fattura' : 'Nuova Fattura'}</h3>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Type + Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Tipo fattura</label>
                    <div className="flex gap-2">
                      {(['acquisto', 'vendita'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setForm(p => ({ ...p, type: t }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold border transition-all ${
                            form.type === t
                              ? t === 'acquisto' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-green-500/20 border-green-500/50 text-green-400'
                              : 'bg-zinc-800 border-white/10 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {t === 'acquisto' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Stato</label>
                    <select
                      value={form.status || 'in_attesa'}
                      onChange={e => setForm(p => ({ ...p, status: e.target.value as Invoice['status'] }))}
                      className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange"
                    >
                      <option value="in_attesa">In attesa</option>
                      <option value="pagata">Pagata</option>
                      <option value="scaduta">Scaduta</option>
                      <option value="annullata">Annullata</option>
                    </select>
                  </div>
                </div>

                {/* Number + Date + DueDate */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Numero *</label>
                    <input
                      value={form.number || ''}
                      onChange={e => setForm(p => ({ ...p, number: e.target.value }))}
                      placeholder="es. 2024/001"
                      className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Data emissione *</label>
                    <input
                      type="date"
                      value={form.date || ''}
                      onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                      className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Scadenza</label>
                    <input
                      type="date"
                      value={form.dueDate || ''}
                      onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                      className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                </div>

                {/* Counterparty + VAT */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                      {form.type === 'acquisto' ? 'Fornitore *' : 'Cliente *'}
                    </label>
                    <input
                      value={form.counterparty || ''}
                      onChange={e => setForm(p => ({ ...p, counterparty: e.target.value }))}
                      placeholder={form.type === 'acquisto' ? 'Nome fornitore...' : 'Nome cliente...'}
                      className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">P.IVA / C.F.</label>
                    <input
                      value={form.vatNumber || ''}
                      onChange={e => setForm(p => ({ ...p, vatNumber: e.target.value }))}
                      placeholder="IT12345678901"
                      className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Descrizione</label>
                  <input
                    value={form.description || ''}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Oggetto della fattura..."
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>

                {/* Amount + VAT */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Imponibile (€)</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={form.amount || 0}
                      onChange={e => onAmountChange(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Aliquota IVA</label>
                    <select
                      value={form.vatRate ?? 22}
                      onChange={e => onVatRateChange(parseInt(e.target.value))}
                      className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange"
                    >
                      <option value={22}>22%</option>
                      <option value={10}>10%</option>
                      <option value={5}>5%</option>
                      <option value={4}>4%</option>
                      <option value={0}>0% (esente)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Totale IVA inclusa</label>
                    <div className="w-full bg-zinc-800/50 border border-white/5 rounded-lg px-3 py-2 text-sm font-black text-brand-orange font-mono">
                      {fmt(form.totalAmount || 0)}
                    </div>
                  </div>
                </div>

                {/* PDF Upload */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Allegato PDF</label>
                  {form.pdfUrl ? (
                    <div className="flex items-center gap-3 p-3 bg-zinc-800 border border-white/10 rounded-lg">
                      <FileText className="w-5 h-5 text-brand-orange shrink-0" />
                      <a href={form.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-brand-orange hover:underline truncate">
                        Visualizza PDF
                      </a>
                      <button onClick={() => setForm(p => ({ ...p, pdfUrl: '' }))} className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isUploadingPdf ? 'border-brand-orange/50 bg-brand-orange/5' : 'border-white/10 hover:border-brand-orange/50 hover:bg-brand-orange/5'}`}>
                      <input
                        type="file" accept="application/pdf" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadPdf(f); e.target.value = ''; }}
                        disabled={isUploadingPdf}
                      />
                      {isUploadingPdf ? <Loader2 className="w-6 h-6 text-brand-orange animate-spin" /> : <Upload className="w-6 h-6 text-zinc-500" />}
                      <span className="text-sm text-zinc-500">{isUploadingPdf ? 'Caricamento...' : 'Trascina o clicca per caricare PDF'}</span>
                      <span className="text-xs text-zinc-600">Solo file .pdf</span>
                    </label>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Note interne</label>
                  <textarea
                    value={form.notes || ''}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    placeholder="Annotazioni private..."
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/5 flex justify-end gap-3 sticky bottom-0 bg-zinc-900">
                <button onClick={closeModal} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || isUploadingPdf}
                  className="flex items-center gap-2 px-5 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingId ? 'Salva modifiche' : 'Crea fattura'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
