import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useDropzone } from 'react-dropzone';
import { UsedListing } from '../types/admin';
import { Loader2, PlusCircle, Search, Upload, X, Tag, Mail, MessageCircle, MapPin, CheckCircle, Store, Filter, AlertCircle } from 'lucide-react';
import { getDirectDriveUrl } from '../utils/drive';
import { motion, AnimatePresence } from 'framer-motion';
import { useSEO } from '../hooks/useSEO';

interface UsedMarketProps {
  onNavigate: (page: string, id?: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function UsedMarket({ onNavigate, showToast }: UsedMarketProps) {
  useSEO({
    title: 'Mercatino Usato DJ & Audio — Officina del Suono',
    description: 'Compra e vendi attrezzatura DJ, audio e studio usata. Solo annunci verificati e moderati. Trova l\'affare o vendi il tuo usato.',
    url: '/usato',
  });

  const [listings, setListings] = useState<UsedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'browse' | 'sell'>('browse');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Tutte');
  
  // Form State
  const [form, setForm] = useState<Partial<UsedListing>>({
    condition: 'Buono',
    contactMethod: 'email',
    images: []
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['Tutte', 'Console', 'Mixer', 'Cuffie', 'Monitor', 'Sintetizzatori', 'Microfoni', 'Accessori'];

  useEffect(() => {
    const q = query(
      collection(db, 'used_listings'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UsedListing)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      acceptedFiles.forEach(file => formData.append('files', file));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload fallito');

      const { urls } = await response.json();
      setForm(prev => ({ ...prev, images: [...(prev.images || []), ...urls] }));
    } catch (error) {
      showToast?.('Errore durante il caricamento delle immagini', 'error');
    } finally {
      setIsUploading(false);
    }
  }, [showToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 5
  });

  const removeImage = (indexToRemove: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images?.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      showToast?.('Devi effettuare il login per pubblicare un annuncio', 'error');
      // Potremmo mostrare un modale di login o navigare alla pagina profilo
      onNavigate('profile');
      return;
    }

    if (!form.title || !form.price || !form.category || !form.description) {
      showToast?.('Compila tutti i campi obbligatori', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const listingData: Omit<UsedListing, 'id'> = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email || '',
        title: form.title!,
        description: form.description!,
        category: form.category!,
        brand: form.brand || 'Sconosciuto',
        condition: form.condition as UsedListing['condition'] || 'Buono',
        price: Number(form.price),
        images: form.images || [],
        status: 'pending',
        contactMethod: form.contactMethod as UsedListing['contactMethod'] || 'email',
        whatsappNumber: form.whatsappNumber || '',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'used_listings'), listingData);
      
      showToast?.('Annuncio inviato! Sarà visibile dopo approvazione.', 'success');
      setForm({ condition: 'Buono', contactMethod: 'email', images: [] });
      setView('browse');
    } catch (error) {
      showToast?.('Errore durante l\'invio dell\'annuncio', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredListings = listings.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === 'Tutte' || l.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-brand-orange" />
              </div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Mercatino <span className="text-brand-orange">Usato</span></h1>
            </div>
            <p className="text-zinc-400 max-w-2xl text-sm md:text-base">
              Vendi l'attrezzatura che non usi più o trova l'affare perfetto. Ogni annuncio è moderato per garantirti la massima sicurezza.
            </p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => setView('browse')}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${view === 'browse' ? 'bg-zinc-800 text-white' : 'bg-transparent text-zinc-400 hover:text-white border border-white/10'}`}
            >
              <Search className="w-4 h-4" /> Cerca
            </button>
            <button
              onClick={() => setView('sell')}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${view === 'sell' ? 'bg-brand-orange text-white' : 'bg-brand-orange/10 text-brand-orange hover:bg-brand-orange hover:text-white'}`}
            >
              <PlusCircle className="w-4 h-4" /> Vendi
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'browse' ? (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Filters */}
              <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 md:p-6 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 shrink-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Cerca tra gli annunci..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-brand-orange transition-colors"
                  />
                </div>
                
                <div className="w-full overflow-x-auto no-scrollbar flex gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`whitespace-nowrap px-4 py-2.5 rounded-lg text-sm font-bold transition-colors border ${activeCategory === cat ? 'bg-zinc-100 text-black border-white' : 'bg-zinc-950 text-zinc-400 border-white/5 hover:border-white/20'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              {loading ? (
                <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 text-brand-orange animate-spin" /></div>
              ) : filteredListings.length === 0 ? (
                <div className="py-24 text-center bg-zinc-900/50 border border-white/5 rounded-3xl">
                  <Store className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Nessun annuncio trovato</h3>
                  <p className="text-zinc-500 max-w-sm mx-auto mb-6">Non ci sono ancora annunci per questa categoria o ricerca.</p>
                  <button onClick={() => setView('sell')} className="text-brand-orange font-bold hover:underline">Inserisci il primo annuncio!</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredListings.map(listing => (
                    <div key={listing.id} className="group bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden hover:border-brand-orange/30 transition-all flex flex-col hover:-translate-y-1">
                      <div className="aspect-[4/3] bg-zinc-950 relative overflow-hidden">
                        {listing.images && listing.images.length > 0 ? (
                          <img src={getDirectDriveUrl(listing.images[0])} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900"><Store className="w-10 h-10 text-zinc-700" /></div>
                        )}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="px-2 py-1 bg-black/80 backdrop-blur border border-white/10 rounded-md text-[10px] font-black uppercase tracking-widest text-white">
                            {listing.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <h3 className="font-bold text-lg leading-tight line-clamp-2">{listing.title}</h3>
                          <span className="text-xl font-black text-brand-orange shrink-0">€{listing.price.toFixed(0)}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400">{listing.condition}</span>
                          <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400">{listing.brand}</span>
                        </div>
                        
                        <p className="text-sm text-zinc-500 line-clamp-3 mb-6 mt-auto">
                          {listing.description}
                        </p>
                        
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          {listing.contactMethod === 'whatsapp' && listing.whatsappNumber ? (
                            <a
                              href={`https://wa.me/${listing.whatsappNumber.replace(/[^0-9]/g, '')}?text=Ciao!%20Ti%20scrivo%20per%20il%20tuo%20annuncio%20su%20Officinadelsuono:%20${listing.title}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 border border-[#25D366]/20"
                            >
                              <MessageCircle className="w-4 h-4" /> Contatta su WA
                            </a>
                          ) : (
                            <a
                              href={`mailto:${listing.userEmail}?subject=Annuncio Officinadelsuono: ${listing.title}`}
                              className="w-full py-2.5 bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 border border-brand-orange/20"
                            >
                              <Mail className="w-4 h-4" /> Invia Email
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="sell"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 md:p-10">
                <h2 className="text-2xl font-black mb-2">Inserisci un Annuncio</h2>
                <p className="text-zinc-400 text-sm mb-8">Il tuo annuncio sarà revisionato dal nostro team prima di essere pubblicato. Assicurati di inserire foto reali del prodotto.</p>

                {!auth.currentUser ? (
                  <div className="p-6 bg-zinc-800/50 rounded-2xl border border-white/10 text-center">
                    <AlertCircle className="w-8 h-8 text-brand-orange mx-auto mb-3" />
                    <h3 className="font-bold mb-2">Login Richiesto</h3>
                    <p className="text-sm text-zinc-400 mb-6">Devi essere registrato per poter pubblicare un annuncio nel mercatino.</p>
                    <button onClick={() => onNavigate('profile')} className="px-6 py-3 bg-brand-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-colors">Vai al Login</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Immagini */}
                    <div>
                      <label className="block text-sm font-bold mb-2">Immagini (max 5)</label>
                      <div 
                        {...getRootProps()} 
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-brand-orange bg-brand-orange/5' : 'border-white/10 hover:border-white/20 bg-zinc-950/50'}`}
                      >
                        <input {...getInputProps()} />
                        <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                        <p className="text-sm text-zinc-400">Trascina qui le foto o clicca per selezionarle</p>
                        <p className="text-xs text-zinc-500 mt-1">Scegli immagini chiare e ben illuminate.</p>
                        {isUploading && <div className="mt-4 flex items-center justify-center gap-2 text-brand-orange text-sm font-bold"><Loader2 className="w-4 h-4 animate-spin" /> Caricamento in corso...</div>}
                      </div>
                      {form.images && form.images.length > 0 && (
                        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                          {form.images.map((img, idx) => (
                            <div key={idx} className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-white/10 group">
                              <img src={getDirectDriveUrl(img)} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-bold">Titolo Annuncio *</label>
                        <input
                          type="text"
                          required
                          maxLength={60}
                          placeholder="es. Pioneer DDJ-FLX4 Come Nuova"
                          value={form.title || ''}
                          onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-4 py-3 bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-brand-orange"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold">Prezzo (€) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="0.00"
                          value={form.price || ''}
                          onChange={e => setForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                          className="w-full px-4 py-3 bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-brand-orange"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold">Categoria *</label>
                        <select
                          required
                          value={form.category || ''}
                          onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-4 py-3 bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-brand-orange appearance-none text-white"
                        >
                          <option value="" disabled>Seleziona...</option>
                          {categories.filter(c => c !== 'Tutte').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold">Brand / Marca</label>
                        <input
                          type="text"
                          placeholder="es. Pioneer DJ"
                          value={form.brand || ''}
                          onChange={e => setForm(prev => ({ ...prev, brand: e.target.value }))}
                          className="w-full px-4 py-3 bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-brand-orange"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold">Condizioni</label>
                        <select
                          value={form.condition || 'Buono'}
                          onChange={e => setForm(prev => ({ ...prev, condition: e.target.value as any }))}
                          className="w-full px-4 py-3 bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-brand-orange appearance-none text-white"
                        >
                          <option value="Nuovo">Nuovo (mai usato)</option>
                          <option value="Come Nuovo">Come Nuovo (usato pochissimo)</option>
                          <option value="Buono">Buono (segni di usura ma funzionante)</option>
                          <option value="Accettabile">Accettabile (molto usurato)</option>
                          <option value="Da Riparare">Da Riparare (non funzionante o parti rotte)</option>
                        </select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-bold">Descrizione *</label>
                        <textarea
                          required
                          rows={5}
                          placeholder="Descrivi dettagliatamente il prodotto, i difetti eventuali e cosa è incluso (cavi, scatola originale, etc.)"
                          value={form.description || ''}
                          onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-4 py-3 bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-brand-orange resize-none"
                        />
                      </div>

                      <div className="md:col-span-2 p-5 bg-zinc-950 border border-white/5 rounded-xl space-y-4">
                        <h4 className="font-bold">Come vuoi essere contattato?</h4>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                              type="radio" 
                              name="contactMethod" 
                              value="email" 
                              checked={form.contactMethod === 'email'} 
                              onChange={() => setForm(prev => ({ ...prev, contactMethod: 'email' }))}
                              className="w-4 h-4 accent-brand-orange"
                            />
                            <span className="text-sm">Email (utilizzeremo {auth.currentUser.email})</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                              type="radio" 
                              name="contactMethod" 
                              value="whatsapp" 
                              checked={form.contactMethod === 'whatsapp'} 
                              onChange={() => setForm(prev => ({ ...prev, contactMethod: 'whatsapp' }))}
                              className="w-4 h-4 accent-brand-orange"
                            />
                            <span className="text-sm">WhatsApp</span>
                          </label>
                        </div>
                        {form.contactMethod === 'whatsapp' && (
                          <input
                            type="tel"
                            required
                            placeholder="Il tuo numero (es. +39 333...)"
                            value={form.whatsappNumber || ''}
                            onChange={e => setForm(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                            className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:border-[#25D366]"
                          />
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || isUploading}
                      className="w-full py-4 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-black text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-8"
                    >
                      {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Invio in corso...</> : 'Invia Annuncio per Revisione'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
