import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { UsedListing } from '../../types/admin';
import { CheckCircle, XCircle, Trash2, ExternalLink, Loader2, Image as ImageIcon } from 'lucide-react';
import { getDirectDriveUrl } from '../../utils/drive';

export function AdminUsedMarketPanel() {
  const [listings, setListings] = useState<UsedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    const q = query(collection(db, 'used_listings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setListings(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UsedListing)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id: string, status: UsedListing['status']) => {
    try {
      await updateDoc(doc(db, 'used_listings', id), {
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      alert('Errore aggiornamento stato');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Eliminare definitivamente questo annuncio?')) {
      await deleteDoc(doc(db, 'used_listings', id));
    }
  };

  const filteredListings = listings.filter(l => filter === 'all' || l.status === filter);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-brand-orange animate-spin" /></div>;
  }

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold">Mercatino Usato ({filteredListings.length})</h2>
        <div className="flex gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === f ? 'bg-brand-orange text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">Annuncio</th>
              <th className="px-6 py-4">Dettagli</th>
              <th className="px-6 py-4">Contatto</th>
              <th className="px-6 py-4">Stato</th>
              <th className="px-6 py-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredListings.map(listing => (
              <tr key={listing.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-black border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
                      {listing.images?.[0] ? (
                        <img src={getDirectDriveUrl(listing.images[0])} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-zinc-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white leading-tight">{listing.title}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">{new Date(listing.createdAt as string).toLocaleDateString()}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-mono text-brand-orange font-bold">€{listing.price.toFixed(2)}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{listing.category} • {listing.brand}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Condizione: {listing.condition}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs text-white">{listing.userEmail}</p>
                  {listing.contactMethod === 'whatsapp' && listing.whatsappNumber && (
                    <p className="text-[10px] text-green-400 mt-0.5">WA: {listing.whatsappNumber}</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    listing.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    listing.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    listing.status === 'sold' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {listing.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {listing.status !== 'approved' && (
                      <button onClick={() => handleUpdateStatus(listing.id, 'approved')} title="Approva" className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"><CheckCircle className="w-4 h-4" /></button>
                    )}
                    {listing.status !== 'rejected' && (
                      <button onClick={() => handleUpdateStatus(listing.id, 'rejected')} title="Rifiuta" className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"><XCircle className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => handleDelete(listing.id)} title="Elimina" className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredListings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                  Nessun annuncio trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
