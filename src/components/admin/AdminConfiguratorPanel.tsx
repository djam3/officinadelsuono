import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
  Loader2, FileText, Box as BoxIcon, Trash2, Mail, Phone, MessageSquare,
  ChevronDown, ChevronUp, Download, Settings, Speaker
} from 'lucide-react';
import { DRIVERS, AMPLIFIERS, DEFAULT_PRICING_CONFIG } from '../../data/speakerDatabase';
import { calculateFullCabinet, recommendCabinetType } from '../../utils/cabinetCalculator';
import { calculatePricing, formatPrice } from '../../utils/pricingEngine';
import { generateProjectPDF } from '../../utils/generatePDF';
import { generateCabinetDXF } from '../../utils/generateDXF';
import type {
  ConfiguratorRequest, ConfiguratorRequestStatus, UserConfiguration,
  SpeakerProject, CabinetDesign, PricingBreakdown, SpeakerDriver, Amplifier,
} from '../../types/speaker';

const STATUS_LABELS: Record<ConfiguratorRequestStatus, { label: string; color: string }> = {
  nuovo:        { label: 'Nuovo',        color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  preventivato: { label: 'Preventivato', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  inviato:      { label: 'Inviato',      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  chiuso:       { label: 'Chiuso',       color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30' },
};

// Ricostruisce progetto + preventivo dai dati salvati (il prezzo vive solo qui in admin)
function rebuildProject(req: ConfiguratorRequest): {
  driver: SpeakerDriver;
  amplifier: Amplifier;
  cabinet: CabinetDesign;
  pricing: PricingBreakdown;
} | null {
  const driver = DRIVERS.find(d => d.id === req.driverId);
  const amplifier = AMPLIFIERS.find(a => a.id === req.ampId);
  if (!driver || !amplifier) return null;

  const useCase = (req.useCase || 'dj-club') as UserConfiguration['useCase'];
  const recType = recommendCabinetType(driver, useCase, 'indoor-medium');
  const calc = calculateFullCabinet(driver, recType, useCase, 'indoor-medium', true, amplifier.dimensions);
  const cabinet = calc.cabinetDesign;
  const pricing = calculatePricing(driver, amplifier, cabinet, req.quantity || 1);
  return { driver, amplifier, cabinet, pricing };
}

export function AdminConfiguratorPanel() {
  const [requests, setRequests] = useState<ConfiguratorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'configurator_requests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as ConfiguratorRequest)));
      setLoading(false);
    }, (err) => {
      console.error('Errore caricamento richieste configuratore', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const setStatus = async (id: string, status: ConfiguratorRequestStatus) => {
    try {
      await updateDoc(doc(db, 'configurator_requests', id), { status });
    } catch (e) {
      console.error(e);
      alert('Errore aggiornamento stato.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa richiesta?')) return;
    try {
      await deleteDoc(doc(db, 'configurator_requests', id));
    } catch (e) {
      console.error(e);
      alert('Errore eliminazione.');
    }
  };

  const downloadPDF = async (req: ConfiguratorRequest) => {
    const rebuilt = rebuildProject(req);
    if (!rebuilt) { alert('Driver o amplificatore non più disponibili: impossibile generare il progetto.'); return; }
    setBusyId(req.id);
    try {
      const project: SpeakerProject = {
        id: req.code,
        userId: 'admin',
        userEmail: req.contact.email,
        userName: req.contact.name,
        createdAt: req.createdAt,
        updatedAt: new Date().toISOString(),
        status: 'preventivo',
        userConfig: {
          useCase: (req.useCase || 'dj-club') as UserConfiguration['useCase'],
          musicGenres: [],
          environment: 'indoor-medium',
          budget: 'mid',
          quantity: req.quantity || 1,
        },
        driver: rebuilt.driver,
        amplifier: rebuilt.amplifier,
        cabinet: rebuilt.cabinet,
        pricing: rebuilt.pricing,
        pricingConfig: DEFAULT_PRICING_CONFIG,
        aiExplanation: `Richiesta cliente ${req.contact.name} (${req.code})`,
        aiConfidence: 100,
      };
      const blob = await generateProjectPDF(project);
      triggerDownload(blob, `Progetto_${req.code}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Errore generazione PDF.');
    } finally {
      setBusyId(null);
    }
  };

  const downloadDXF = (req: ConfiguratorRequest) => {
    const rebuilt = rebuildProject(req);
    if (!rebuilt) { alert('Driver o amplificatore non più disponibili.'); return; }
    try {
      const dxf = generateCabinetDXF(rebuilt.cabinet);
      triggerDownload(new Blob([dxf], { type: 'application/dxf' }), `TaglioCNC_${req.code}.dxf`);
    } catch (e) {
      console.error(e);
      alert('Errore generazione DXF.');
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fmtDate = (iso: string) => {
    try { return new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  const newCount = requests.filter(r => r.status === 'nuovo').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            <Speaker className="w-5 h-5 text-brand-orange" /> Richieste Configuratore Casse
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Progetti inviati dai clienti. Il preventivo è visibile solo qui — il prezzo lo invii tu al cliente.</p>
        </div>
        {newCount > 0 && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
            {newCount} nuov{newCount === 1 ? 'a' : 'e'}
          </span>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <BoxIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nessuna richiesta dal configuratore al momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const rebuilt = rebuildProject(req);
            const isOpen = expanded === req.id;
            const st = STATUS_LABELS[req.status] || STATUS_LABELS.nuovo;
            return (
              <div key={req.id} className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
                {/* Header riga */}
                <div className="p-4 md:p-5 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm truncate">{req.contact.name}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                      <span className="text-[10px] text-zinc-600 font-mono">{req.code}</span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 truncate">
                      {req.driverLabel} + {req.ampLabel} • {req.quantity}× • {fmtDate(req.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={req.status}
                      onChange={e => setStatus(req.id, e.target.value as ConfiguratorRequestStatus)}
                      className="bg-zinc-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-orange"
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setExpanded(isOpen ? null : req.id)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      title="Dettagli"
                    >
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(req.id)}
                      className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dettaglio espanso */}
                {isOpen && (
                  <div className="border-t border-white/5 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-zinc-950/40">
                    {/* Contatti + config */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Contatti cliente</h4>
                        <div className="space-y-2 text-sm">
                          <a href={`mailto:${req.contact.email}`} className="flex items-center gap-2 text-zinc-300 hover:text-brand-orange transition-colors">
                            <Mail className="w-4 h-4 text-zinc-500" /> {req.contact.email}
                          </a>
                          {req.contact.phone && (
                            <a href={`https://wa.me/${req.contact.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-zinc-300 hover:text-brand-orange transition-colors">
                              <Phone className="w-4 h-4 text-zinc-500" /> {req.contact.phone}
                            </a>
                          )}
                          {req.contact.message && (
                            <div className="flex items-start gap-2 text-zinc-400">
                              <MessageSquare className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                              <span className="italic">{req.contact.message}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Configurazione</h4>
                        <div className="text-sm text-zinc-300 space-y-1">
                          <div className="flex items-center gap-2"><Settings className="w-3.5 h-3.5 text-brand-orange" /> Driver: <strong>{req.driverLabel}</strong></div>
                          <div className="flex items-center gap-2"><Settings className="w-3.5 h-3.5 text-brand-orange" /> Ampli: <strong>{req.ampLabel}</strong></div>
                          <div className="flex items-center gap-2"><BoxIcon className="w-3.5 h-3.5 text-brand-orange" /> Cassa: <strong>{req.cabinetName}</strong></div>
                          <div className="text-zinc-500">Uso: {req.useCase || '—'} • Quantità: {req.quantity}</div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => downloadPDF(req)}
                          disabled={busyId === req.id || !rebuilt}
                          className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-colors border border-white/10 disabled:opacity-50"
                        >
                          {busyId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                          PDF Progetto
                        </button>
                        <button
                          onClick={() => downloadDXF(req)}
                          disabled={!rebuilt}
                          className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-colors border border-white/10 disabled:opacity-50"
                        >
                          <Download className="w-4 h-4" /> DXF CNC
                        </button>
                      </div>
                    </div>

                    {/* Preventivo (solo admin) */}
                    <div className="bg-zinc-900 border border-brand-orange/20 rounded-xl p-5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-orange mb-3">Preventivo (interno)</h4>
                      {rebuilt ? (
                        <div className="space-y-2 text-sm">
                          <Row label="Componenti elettronici" value={formatPrice(rebuilt.pricing.driverCost + rebuilt.pricing.amplifierCost)} />
                          <Row label="Legname e materiali" value={formatPrice(rebuilt.pricing.woodCost + rebuilt.pricing.hardwareCost + rebuilt.pricing.dampingCost + rebuilt.pricing.finishCost)} />
                          <Row label="Lavorazione e assemblaggio" value={formatPrice(rebuilt.pricing.carpenterLabor + rebuilt.pricing.assemblyLabor)} />
                          <div className="h-px bg-white/10 my-2" />
                          <Row label="Totale per unità" value={formatPrice(rebuilt.pricing.totalPerUnit)} strong />
                          {rebuilt.pricing.quantity > 1 && <Row label="Quantità" value={`× ${rebuilt.pricing.quantity}`} />}
                          <div className="mt-3 bg-zinc-950 rounded-lg p-4 border border-brand-orange/40">
                            <div className="text-[10px] text-brand-orange font-bold uppercase tracking-wider mb-1">Totale complessivo</div>
                            <div className="text-3xl font-black">{formatPrice(rebuilt.pricing.grandTotal)}</div>
                            <div className="text-[10px] text-zinc-600 mt-1">Stima interna — definisci e invia tu il prezzo finale al cliente.</div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500">Driver o amplificatore non più nel catalogo: preventivo non ricalcolabile.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-zinc-400">{label}</span>
      <span className={`font-mono ${strong ? 'font-bold text-base text-white' : 'text-zinc-200'}`}>{value}</span>
    </div>
  );
}
