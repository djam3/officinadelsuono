/**
 * Pannello Ordini — gestione completa ordini ricevuti
 */

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase';
import {
  collection, getDocs, doc, updateDoc,
  query, orderBy, onSnapshot
} from 'firebase/firestore';
import {
  ShoppingBag, Package, Truck, CheckCircle, XCircle,
  Clock, Eye, ChevronDown, ChevronUp, Search,
  RefreshCw, AlertCircle, Copy, ExternalLink
} from 'lucide-react';

// ─── Tipi ────────────────────────────────────────────────────────────────────

type OrderStatus = 'nuovo' | 'in_lavorazione' | 'spedito' | 'consegnato' | 'annullato';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  spedizione?: number;
  paymentMethod: string;
  customerEmail: string;
  customerName?: string;
  phone?: string;
  address?: {
    via?: string;
    cap?: string;
    citta?: string;
    provincia?: string;
  };
  status: OrderStatus;
  trackingNumber?: string;
  corriere?: string;
  note?: string;
  createdAt: any;
  updatedAt?: string;
}

// ─── Configurazione stati ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  nuovo:         { label: 'Nuovo',         color: 'text-blue-400',    bg: 'bg-blue-500/20',    icon: Clock },
  in_lavorazione:{ label: 'In lavorazione',color: 'text-yellow-400',  bg: 'bg-yellow-500/20',  icon: Package },
  spedito:       { label: 'Spedito',       color: 'text-purple-400',  bg: 'bg-purple-500/20',  icon: Truck },
  consegnato:    { label: 'Consegnato',    color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: CheckCircle },
  annullato:     { label: 'Annullato',     color: 'text-red-400',     bg: 'bg-red-500/20',     icon: XCircle },
};

const ALL_STATUSES: OrderStatus[] = ['nuovo', 'in_lavorazione', 'spedito', 'consegnato', 'annullato'];

// ─── Componente principale ────────────────────────────────────────────────────

export function AdminOrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'tutti'>('tutti');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Caricamento real-time ───────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, snap => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
        setLoading(false);
        setError('');
      }, err => {
        setError(err.message);
        setLoading(false);
      });
      return () => unsub();
    } catch (e: any) {
      setError(e?.message || 'Errore caricamento ordini');
      setLoading(false);
    }
  }, []);

  // ── Aggiorna stato ordine ───────────────────────────────────────────────────

  const updateStatus = async (orderId: string, status: OrderStatus, trackingNumber?: string, corriere?: string) => {
    setUpdatingId(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        ...(trackingNumber !== undefined ? { trackingNumber } : {}),
        ...(corriere !== undefined ? { corriere } : {}),
        updatedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      alert('Errore aggiornamento: ' + e?.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Filtri e ricerca ────────────────────────────────────────────────────────

  const filtered = orders.filter(o => {
    if (filterStatus !== 'tutti' && o.status !== filterStatus) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(s) ||
        o.customerEmail?.toLowerCase().includes(s) ||
        o.customerName?.toLowerCase().includes(s) ||
        o.items?.some(i => i.name.toLowerCase().includes(s))
      );
    }
    return true;
  });

  // ── KPI ─────────────────────────────────────────────────────────────────────

  const kpi = {
    nuovi:     orders.filter(o => o.status === 'nuovo').length,
    spediti:   orders.filter(o => o.status === 'spedito').length,
    totaleOggi: orders
      .filter(o => {
        const d = o.createdAt?.toDate?.() || new Date(o.createdAt);
        return d.toDateString() === new Date().toDateString();
      })
      .reduce((s, o) => s + (o.total || 0), 0),
    totaleAll: orders.reduce((s, o) => s + (o.total || 0), 0),
  };

  const fmt = (n: number) => `€${n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (ts: any) => {
    try {
      const d = ts?.toDate?.() || new Date(ts);
      return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return '—'; }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-zinc-400">
      <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Caricamento ordini...
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Ordini</h2>
          <p className="text-zinc-400 text-sm mt-1">{orders.length} ordini totali · aggiornamento in tempo reale</p>
        </div>
      </div>

      {/* Errore */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="text-sm text-red-300">
            <strong>Errore Firestore:</strong> {error}
            <br />Assicurati che la regola <code>orders</code> sia presente in firestore.rules
          </div>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Nuovi da gestire', value: kpi.nuovi, color: 'text-blue-400', urgent: kpi.nuovi > 0 },
          { label: 'In spedizione', value: kpi.spediti, color: 'text-purple-400', urgent: false },
          { label: 'Incasso oggi', value: fmt(kpi.totaleOggi), color: 'text-emerald-400', urgent: false },
          { label: 'Totale ricavi', value: fmt(kpi.totaleAll), color: 'text-brand-orange', urgent: false },
        ].map(k => (
          <div key={k.label} className={`bg-zinc-900 border rounded-xl p-5 ${k.urgent ? 'border-blue-500/40' : 'border-zinc-800'}`}>
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtri */}
      <div className="flex flex-wrap gap-3">
        {/* Ricerca */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca per ID, email, prodotto..."
            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-brand-orange"
          />
        </div>
        {/* Filtro stato */}
        <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 border border-zinc-800">
          <button
            onClick={() => setFilterStatus('tutti')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === 'tutti' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Tutti ({orders.length})
          </button>
          {ALL_STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s];
            const count = orders.filter(o => o.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === s ? `${cfg.bg} ${cfg.color}` : 'text-zinc-400 hover:text-white'}`}
              >
                {cfg.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista ordini */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nessun ordine trovato</p>
          <p className="text-sm mt-1">Gli ordini appariranno qui non appena i clienti completano il checkout.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <OrderRow
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
              onUpdateStatus={updateStatus}
              updating={updatingId === order.id}
              fmt={fmt}
              fmtDate={fmtDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Riga ordine espandibile ──────────────────────────────────────────────────

interface OrderRowProps {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (id: string, status: OrderStatus, tracking?: string, corriere?: string) => Promise<void>;
  updating: boolean;
  fmt: (n: number) => string;
  fmtDate: (ts: any) => string;
}

function OrderRow({ order, expanded, onToggle, onUpdateStatus, updating, fmt, fmtDate }: OrderRowProps) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['nuovo'];
  const StatusIcon = cfg.icon as React.ComponentType<{ className?: string }>;
  const [localTracking, setLocalTracking] = useState(order.trackingNumber || '');
  const [localCorriere, setLocalCorriere] = useState(order.corriere || '');
  const [localStatus, setLocalStatus] = useState<OrderStatus>(order.status);

  const shortId = order.id.slice(-8).toUpperCase();

  const handleSave = () => onUpdateStatus(order.id, localStatus, localTracking, localCorriere);

  const copyId = () => navigator.clipboard.writeText(order.id).catch(() => {});

  return (
    <div className={`bg-zinc-900 border rounded-xl overflow-hidden transition-all ${
      order.status === 'nuovo' ? 'border-blue-500/40' : 'border-zinc-800'
    }`}>
      {/* Riga principale */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-zinc-800/40 transition-colors"
        onClick={onToggle}
      >
        {/* ID + data */}
        <div className="min-w-0 w-36 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-white text-sm">#{shortId}</span>
            <button
              onClick={e => { e.stopPropagation(); copyId(); }}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <p className="text-zinc-500 text-xs mt-0.5">{fmtDate(order.createdAt)}</p>
        </div>

        {/* Cliente */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{order.customerName || 'Cliente'}</p>
          <p className="text-zinc-500 text-xs truncate">{order.customerEmail}</p>
        </div>

        {/* Prodotti */}
        <div className="hidden md:block flex-1 min-w-0">
          <p className="text-zinc-400 text-xs truncate">
            {order.items?.map(i => `${i.name} ×${i.quantity}`).join(', ') || '—'}
          </p>
        </div>

        {/* Totale */}
        <div className="text-right w-24 flex-shrink-0">
          <p className="text-white font-bold">{fmt(order.total || 0)}</p>
          <p className="text-zinc-500 text-xs">{order.paymentMethod}</p>
        </div>

        {/* Stato */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${cfg.bg} w-36 flex-shrink-0`}>
          <StatusIcon className={`w-3.5 h-3.5 ${cfg.color} flex-shrink-0`} />
          <span className={`text-xs font-medium ${cfg.color} truncate`}>{cfg.label}</span>
        </div>

        {/* Toggle */}
        <div className="text-zinc-500 flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Dettaglio espanso */}
      {expanded && (
        <div className="border-t border-zinc-800 p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prodotti */}
            <div>
              <h4 className="text-zinc-400 text-xs uppercase tracking-wide font-bold mb-3">Prodotti ordinati</h4>
              <div className="space-y-2">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-zinc-800/50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-white text-sm">{item.name}</p>
                      <p className="text-zinc-500 text-xs">Qtà: {item.quantity}</p>
                    </div>
                    <p className="text-white font-medium text-sm">{fmt(item.price * item.quantity)}</p>
                  </div>
                ))}
                <div className="flex justify-between px-3 pt-2 border-t border-zinc-800">
                  <span className="text-zinc-400 text-sm">Spedizione</span>
                  <span className="text-zinc-300 text-sm">{order.spedizione ? fmt(order.spedizione) : 'Gratuita'}</span>
                </div>
                <div className="flex justify-between px-3 font-bold">
                  <span className="text-white">Totale</span>
                  <span className="text-brand-orange">{fmt(order.total || 0)}</span>
                </div>
              </div>
            </div>

            {/* Dati cliente + indirizzo */}
            <div>
              <h4 className="text-zinc-400 text-xs uppercase tracking-wide font-bold mb-3">Cliente e consegna</h4>
              <div className="space-y-2 text-sm">
                {[
                  ['Nome', order.customerName || '—'],
                  ['Email', order.customerEmail || '—'],
                  ['Telefono', order.phone || '—'],
                  ['Via', order.address?.via || '—'],
                  ['CAP / Città', order.address ? `${order.address.cap || ''} ${order.address.citta || ''}`.trim() || '—' : '—'],
                  ['Provincia', order.address?.provincia || '—'],
                  ['Metodo pagamento', order.paymentMethod || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-zinc-500 w-32 flex-shrink-0">{k}</span>
                    <span className="text-zinc-200">{v}</span>
                  </div>
                ))}
                {order.note && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 mt-2">
                    <p className="text-yellow-300 text-xs"><strong>Note:</strong> {order.note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gestione stato + tracking */}
          <div className="bg-zinc-800/50 rounded-xl p-4 space-y-4">
            <h4 className="text-zinc-400 text-xs uppercase tracking-wide font-bold">Aggiorna ordine</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Stato</label>
                <select
                  value={localStatus}
                  onChange={e => setLocalStatus(e.target.value as OrderStatus)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Corriere</label>
                <input
                  type="text"
                  value={localCorriere}
                  onChange={e => setLocalCorriere(e.target.value)}
                  placeholder="BRT, GLS, SDA..."
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm placeholder-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">N° tracking</label>
                <input
                  type="text"
                  value={localTracking}
                  onChange={e => setLocalTracking(e.target.value)}
                  placeholder="Es. BRT123456789IT"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm placeholder-zinc-600"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={updating}
              className="bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              {updating ? 'Salvataggio...' : 'Salva modifiche'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
