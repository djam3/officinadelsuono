import { useState, useCallback } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import {
  Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Upload,
  Sparkles, Loader2, Check, Package, Truck
} from 'lucide-react';
import { calcolaSpedizioneProdotto, formatCostoSpedizione, SOGLIA_SPEDIZIONE_GRATUITA } from '../../services/shippingService';
import { useDropzone } from 'react-dropzone';
import { callClaude } from '../../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import { getDirectDriveUrl } from '../../utils/drive';
import { generateSEOContent } from '../../services/aiService';

import { Product } from '../../types/admin';

interface AdminInventoryPanelProps {
  products: Product[];
  categories: string[];
  manualApiKey: string | null;
}

export function AdminInventoryPanel({ products, categories, manualApiKey }: AdminInventoryPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({ images: [] });
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingPrice, setIsGeneratingPrice] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  
  // Price calculator states
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [desiredProfit, setDesiredProfit] = useState<number | ''>('');

  // SEO modal states
  const [seoModal, setSeoModal] = useState<{ product: Product; result: { seoTitle: string; metaDescription: string; description: string; bullets: string[] } } | null>(null);
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);
  const [isSavingSEO, setIsSavingSEO] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const { urls } = await response.json();

      setEditForm(prev => ({ 
        ...prev, 
        images: [...(prev.images || []), ...urls],
        image: prev.image || (urls.length > 0 ? urls[0] : '')
      }));
    } catch (error) {
      alert((error as Error).message || "Errore durante il caricamento delle immagini.");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': [] },
    multiple: true
  });

  const removeImage = (indexToRemove: number) => {
    setEditForm(prev => ({
      ...prev,
      images: prev.images?.filter((_, index) => index !== indexToRemove)
    }));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (!editForm.images) return;
    const newImages = [...editForm.images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setEditForm(prev => ({ 
      ...prev, 
      images: newImages,
      image: newImages[0]
    }));
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setEditForm(prev => ({
      ...prev,
      images: [...(prev.images || []), imageUrlInput.trim()],
      image: prev.image || imageUrlInput.trim()
    }));
    setImageUrlInput('');
  };

  const generateWithAI = async () => {
    if (!editForm.name) {
      alert("Inserisci il nome del prodotto");
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Sei un esperto di attrezzatura DJ e audio professionale.
PRODOTTO: ${editForm.name}
ESTRAI: Specifiche tecniche (Watt, Frequenza, Ingressi, Uscite, Dimensioni, Peso) e genera una descrizione professionale in italiano (max 800 caratteri).

Rispondi ESCLUSIVAMENTE in JSON:
{
  "description": "descrizione professionale del prodotto",
  "specs": {
    "watt": "potenza in watt o stringa vuota",
    "frequency": "risposta in frequenza o stringa vuota",
    "inputs": "ingressi disponibili o stringa vuota",
    "outputs": "uscite disponibili o stringa vuota",
    "dimensions": "dimensioni o stringa vuota",
    "weight": "peso o stringa vuota"
  }
}`;

      const raw = await callClaude(prompt, { maxTokens: 1024 });
      const details = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());

      setEditForm(prev => ({
        ...prev,
        description: details.description || prev.description,
        specs: { ...(prev.specs || {}), ...(details.specs || {}) }
      }));
    } catch (error) {
      alert("Errore generazione AI: " + ((error as Error).message || "Riprova."));
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAIImage = async () => {
    if (!editForm.name) return;
    alert("Generazione immagine AI non disponibile. Usa un URL immagine manuale.");
  };

  const generatePrice = () => {
    if (costPrice === '' || desiredProfit === '') return;
    setIsGeneratingPrice(true);
    try {
      const cost = parseFloat(costPrice.toString());
      const profit = parseFloat(desiredProfit.toString());
      const finalPrice = (cost + profit) / 0.98;
      const taxes = finalPrice - (cost + profit);
      setEditForm(prev => ({ ...prev, price: parseFloat(finalPrice.toFixed(2)) }));
      alert(`Prezzo calcolato!\nTasse: €${taxes.toFixed(2)}`);
    } finally {
      setIsGeneratingPrice(false);
    }
  };

  const handleSave = async () => {
    if (!editForm.name || !editForm.price || !editForm.category) {
      alert("Compila i campi obbligatori (Nome, Prezzo, Categoria)");
      return;
    }

    try {
      const productData: Record<string, unknown> = {
        name: editForm.name,
        category: editForm.category,
        price: Number(editForm.price),
        description: editForm.description || '',
        images: editForm.images || [],
        image: editForm.image || (editForm.images && editForm.images.length > 0 ? editForm.images[0] : ''),
        draft: !!editForm.draft,
        specs: editForm.specs || {},
        badge: editForm.badge || '',
        stock: editForm.stock !== undefined ? editForm.stock : null,
      };
      if (editForm.weightKg !== undefined && editForm.weightKg > 0) {
        productData.weightKg = editForm.weightKg;
      }
      if (editForm.dimensionsMm) {
        productData.dimensionsMm = editForm.dimensionsMm;
      }

      if (isEditing) {
        await updateDoc(doc(db, 'products', isEditing), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date().toISOString()
        });
      }
      
      setIsEditing(null);
      setIsAdding(false);
      setEditForm({ images: [] });
    } catch (error) {
      alert("Errore durante il salvataggio.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questo prodotto?")) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const handleGenerateSEO = async (product: Product) => {
    setIsGeneratingSEO(true);
    setSeoModal(null);
    try {
      const result = await generateSEOContent(
        { name: product.name, category: product.category, price: product.price, specs: product.specs },
        { includeFaq: false }
      );
      setSeoModal({ product, result });
    } catch (err) {
      alert('Errore generazione SEO: ' + (err as Error).message);
    } finally {
      setIsGeneratingSEO(false);
    }
  };

  const handleSaveSEO = async () => {
    if (!seoModal || !seoModal.product.id) return;
    setIsSavingSEO(true);
    try {
      await updateDoc(doc(db, 'products', seoModal.product.id), {
        seoTitle: seoModal.result.seoTitle,
        metaDescription: seoModal.result.metaDescription,
        description: seoModal.result.description,
        bullets: seoModal.result.bullets,
      });
      setSeoModal(null);
      alert('SEO salvato!');
    } finally {
      setIsSavingSEO(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-xl font-bold">Prodotti ({products.length})</h2>
        <button 
          onClick={() => {
            setIsAdding(true);
            setIsEditing(null);
            setEditForm({ price: 0, draft: false, images: [] });
          }}
          className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuovo Prodotto
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Immagine</th>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Prezzo</th>
              <th className="px-6 py-4">Badge</th>
              <th className="px-6 py-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {(isAdding || isEditing) && (
              <tr className="bg-zinc-800/50">
                <td colSpan={6} className="px-6 py-8">
                  <div className="space-y-8">
                    {/* Media Upload */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1">
                        <div 
                          {...getRootProps()} 
                          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors h-48 flex flex-col items-center justify-center ${isDragActive ? 'border-brand-orange bg-brand-orange/10' : 'border-white/10 hover:border-white/20 bg-zinc-950/50'}`}
                        >
                          <input {...getInputProps()} />
                          <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                          <p className="text-xs text-zinc-500">Trascina foto qui</p>
                          {isUploading && <Loader2 className="w-4 h-4 text-brand-orange animate-spin mt-2" />}
                        </div>
                        <div className="mt-4 flex gap-2">
                          <input
                            type="text"
                            placeholder="URL immagine"
                            value={imageUrlInput}
                            onChange={(e) => setImageUrlInput(e.target.value)}
                            className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                          />
                          <button onClick={handleAddImageUrl} className="bg-zinc-800 p-2 rounded-lg border border-white/10 text-white"><Plus className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="md:col-span-2 flex flex-wrap gap-2">
                        {editForm.images?.map((img, idx) => (
                          <div key={idx} className="relative w-24 h-24 group">
                            <img src={getDirectDriveUrl(img)} alt="" className="w-full h-full object-cover rounded-xl border border-white/10" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded-xl">
                              <button onClick={() => moveImage(idx, 'up')} className="p-1 bg-zinc-800 rounded"><X className="w-3 h-3 rotate-45" /></button>
                              <button onClick={() => removeImage(idx)} className="p-1 bg-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
                            </div>
                            {idx === 0 && <span className="absolute top-1 left-1 bg-brand-orange text-[8px] font-bold px-1 rounded uppercase">Cover</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Main Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nome Prodotto"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                            className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange"
                          />
                          <button onClick={generateWithAI} disabled={isGenerating || !editForm.name} className="bg-brand-orange px-3 py-2 rounded-xl text-white font-bold flex items-center gap-2 text-xs">
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                            value={categories.includes(editForm.category || '') ? editForm.category : ''}
                            onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                          >
                            <option value="">Categoria...</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <input
                            type="text"
                            placeholder="Nuova cat..."
                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm"
                            value={!categories.includes(editForm.category || '') ? editForm.category || '' : ''}
                            onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                          />
                        </div>
                        <textarea
                          placeholder="Descrizione..."
                          rows={4}
                          value={editForm.description || ''}
                          onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm resize-none"
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            placeholder="Prezzo (€)"
                            value={editForm.price || ''}
                            onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))}
                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Badge (es. Novità)"
                            value={editForm.badge || ''}
                            onChange={e => setEditForm(f => ({ ...f, badge: e.target.value }))}
                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Stock (quantità disponibile)"
                            min="0"
                            value={editForm.stock ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, stock: e.target.value !== '' ? Number(e.target.value) : undefined }))}
                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm"
                          />
                        </div>
                        <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Calcolatore Prezzo</p>
                          <div className="grid grid-cols-2 gap-2">
                            <input type="number" placeholder="Acquisto (€)" value={costPrice} onChange={e => setCostPrice(e.target.value ? Number(e.target.value) : '')} className="bg-zinc-900 px-3 py-2 rounded text-xs" />
                            <input type="number" placeholder="Utile (€)" value={desiredProfit} onChange={e => setDesiredProfit(e.target.value ? Number(e.target.value) : '')} className="bg-zinc-900 px-3 py-2 rounded text-xs" />
                          </div>
                          <button onClick={generatePrice} className="w-full py-2 bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange rounded text-[10px] font-bold uppercase transition-colors">Calcola Prezzo Finanziario</button>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer pt-2">
                          <input type="checkbox" checked={!!editForm.draft} onChange={e => setEditForm(f => ({ ...f, draft: e.target.checked }))} className="w-4 h-4 accent-brand-orange" />
                          <span className="text-sm font-bold text-zinc-400">Salva come bozza (nascondi nel negozio)</span>
                        </label>
                      </div>
                    </div>

                    {/* Spedizione */}
                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-brand-orange" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Spedizione 24h — Peso (kg) &amp; Dimensioni (mm)</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Peso reale (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="es. 2.5"
                            value={editForm.weightKg ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, weightKg: e.target.value ? Number(e.target.value) : undefined }))}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Lunghezza (mm)</label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="es. 400"
                            value={editForm.dimensionsMm?.lunghezza ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, dimensionsMm: { lunghezza: Number(e.target.value), larghezza: f.dimensionsMm?.larghezza ?? 0, altezza: f.dimensionsMm?.altezza ?? 0 } }))}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Larghezza (mm)</label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="es. 300"
                            value={editForm.dimensionsMm?.larghezza ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, dimensionsMm: { lunghezza: f.dimensionsMm?.lunghezza ?? 0, larghezza: Number(e.target.value), altezza: f.dimensionsMm?.altezza ?? 0 } }))}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Altezza (mm)</label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="es. 150"
                            value={editForm.dimensionsMm?.altezza ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, dimensionsMm: { lunghezza: f.dimensionsMm?.lunghezza ?? 0, larghezza: f.dimensionsMm?.larghezza ?? 0, altezza: Number(e.target.value) } }))}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                          />
                        </div>
                      </div>
                      {/* Preview costo spedizione */}
                      {(editForm.weightKg ?? 0) > 0 && (
                        <div className="mt-2 p-3 bg-zinc-950 rounded-lg flex flex-wrap gap-4 text-xs">
                          {(() => {
                            const result = calcolaSpedizioneProdotto(
                              editForm.price ?? 0,
                              editForm.weightKg ?? 0,
                              editForm.dimensionsMm
                            );
                            const volKg = editForm.dimensionsMm
                              ? ((editForm.dimensionsMm.lunghezza * editForm.dimensionsMm.larghezza * editForm.dimensionsMm.altezza) / 5_000_000).toFixed(2)
                              : null;
                            return (
                              <>
                                <span className="text-zinc-400">Peso fatturato: <strong className="text-white">{result.pesoFatturato} kg</strong></span>
                                {volKg && <span className="text-zinc-400">Volumetrico: <strong className="text-white">{volKg} kg</strong></span>}
                                <span className="text-zinc-400">Costo 24h: <strong className={result.gratuita ? 'text-green-400' : 'text-brand-orange'}>{formatCostoSpedizione(result)}</strong></span>
                                {!result.gratuita && <span className="text-zinc-500">Gratuita sopra €{SOGLIA_SPEDIZIONE_GRATUITA}</span>}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-white/5 pt-6">
                      <button onClick={handleSave} className="flex items-center gap-2 px-8 py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-all"><Save className="w-4 h-4" /> Salva Prodotto</button>
                      <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl font-bold text-sm transition-all">Annulla</button>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {products.map((p) => (
              <tr key={p.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="w-12 h-12 rounded-lg bg-black border border-white/5 overflow-hidden">
                    <img src={getDirectDriveUrl(p.images?.[0] || p.image || '')} className="w-full h-full object-cover" alt="" />
                  </div>
                </td>
                <td className="px-6 py-4 font-bold">{p.name} {p.draft && <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded ml-2">BOZZA</span>}</td>
                <td className="px-6 py-4 text-zinc-500">{p.category}</td>
                <td className="px-6 py-4 font-mono">€{p.price.toFixed(2)}</td>
                <td className="px-6 py-4">
                  {p.badge && <span className="px-2 py-0.5 bg-brand-orange/10 text-brand-orange text-[10px] font-bold rounded-full border border-brand-orange/20">{p.badge}</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleGenerateSEO(p)} title="SEO AI" className="p-2 text-brand-orange hover:bg-brand-orange/10 rounded-lg transition-colors"><Sparkles className="w-4 h-4" /></button>
                    <button onClick={() => { setIsEditing(p.id!); setEditForm(p); setIsAdding(false); }} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id!)} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SEO Modal */}
      <AnimatePresence>
        {(seoModal || isGeneratingSEO) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl p-6">
              {isGeneratingSEO ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Ottimizzazione SEO in corso...</p>
                </div>
              ) : seoModal && (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">SEO per {seoModal.product.name}</h3>
                    <button onClick={() => setSeoModal(null)}><X className="w-5 h-5 text-zinc-500" /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">SEO Title</label>
                      <input value={seoModal.result.seoTitle} onChange={e => setSeoModal(m => ({ ...m!, result: { ...m!.result, seoTitle: e.target.value } }))} className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Meta Description</label>
                      <textarea value={seoModal.result.metaDescription} onChange={e => setSeoModal(m => ({ ...m!, result: { ...m!.result, metaDescription: e.target.value } }))} rows={2} className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm resize-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Descrizione Ottimizzata</label>
                      <textarea value={seoModal.result.description} onChange={e => setSeoModal(m => ({ ...m!, result: { ...m!.result, description: e.target.value } }))} rows={6} className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm resize-none" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-8">
                    <button onClick={handleSaveSEO} disabled={isSavingSEO} className="flex-1 py-3 bg-brand-orange text-white font-bold rounded-xl flex items-center justify-center gap-2">
                      {isSavingSEO ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Applica SEO
                    </button>
                    <button onClick={() => handleGenerateSEO(seoModal.product)} className="px-6 py-3 bg-zinc-800 text-white rounded-xl font-bold border border-white/10 hover:bg-zinc-700 transition-colors">Rigenera</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
