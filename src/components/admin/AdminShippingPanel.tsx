import { useState, useEffect } from 'react';
import {
  Truck, Plus, Edit2, Trash2, Save, X, Check, Loader2,
  Settings, Calculator, Package, ExternalLink, AlertTriangle,
  ChevronDown, ChevronUp, ToggleLeft, ToggleRight, RefreshCw
} from 'lucide-react';
import {
  loadCorreriFirestore, saveCorreire, updateCorriere, deleteCorriere,
  inizializzaCorreriDefault, loadShippingSettings, saveShippingSettings,
  calcolaQuoteTuttiCorrieri,
} from '../../services/shippingService';
import type { Corriere, ShippingSettings, FasciaTariffaria } from '../../types/shipping';

type PanelTab = 'corrieri' | 'calcola' | 'impostazioni';

const EMPTY_CORRIERE: Omit<Corriere, 'id' | 'createdAt' | 'updatedAt'> = {
  nome: '',
  codice: '',
  colore: '#F27D26',
  attivo: true,
  tipo: 'manuale',
  stimaConsegna: '24h lavorative',
  sito: '',
  extra: {},
  tariffe: [
    { maxKg: 1,    prezzo: 0 },
    { maxKg: 3,    prezzo: 0 },
    { maxKg: 5,    prezzo: 0 },
    { maxKg: 10,   prezzo: 0 },
    { maxKg: 20,   prezzo: 0 },
    { maxKg: 30,   prezzo: 0 },
    { maxKg: 50,   prezzo: 0 },
    { maxKg: 9999, prezzo: -1 },
  ],
};

export function AdminShippingPanel() {
  const [tab, setTab] = useState<PanelTab>('corrieri');
  const [corrieri, setCorrieri] = useState<Corriere[]>([]);
  const [settings, setSettings] = useState<ShippingSettings>({
    sogliaGratuita: 199,
    volumetricoDivisore: 5000,
    updatedAt: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState<Omit<Corriere, 'id' | 'createdAt' | 'updatedAt'>>(EMPTY_CORRIERE);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Calculator state
  const [calcPeso, setCalcPeso] = useState<number | ''>('');
  const [calcL, setCalcL] = useState<number | ''>('');
  const [calcW, setCalcW] = useState<number | ''>('');
  const [calcH, setCalcH] = useState<number | ''>('');
  const [calcTotale, setCalcTotale] = useState<number | ''>('');
  const [quotes, setQuotes] = useState<ReturnType<typeof calcolaQuoteTuttiCorrieri>>([]);

  useEffect(() => {
    loadAll();
  }, []);

  const [initError, setInitError] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setInitError(null);
    try {
      const [cors, sett] = await Promise.all([
        loadCorreriFirestore(),
        loadShippingSettings(),
      ]);
      setCorrieri(cors.sort((a, b) => a.nome.localeCompare(b.nome)));
      setSettings(sett);
    } catch (err) {
      setInitError(`Errore caricamento: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleInit() {
    setSaving(true);
    setInitError(null);
    try {
      await inizializzaCorreriDefault();
      await loadAll();
    } catch (err) {
      setInitError(`Errore inizializzazione: ${(err as Error).message}. Verifica di essere loggato come admin.`);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAttivo(c: Corriere) {
    try {
      await updateCorriere(c.id, { attivo: !c.attivo });
      setCorrieri(prev => prev.map(x => x.id === c.id ? { ...x, attivo: !x.attivo } : x));
    } catch {
      alert('Errore aggiornamento stato corriere.');
    }
  }

  function startEdit(c: Corriere) {
    setEditingId(c.id);
    setIsAdding(false);
    setEditForm({
      nome: c.nome,
      codice: c.codice,
      colore: c.colore,
      attivo: c.attivo,
      tipo: c.tipo,
      stimaConsegna: c.stimaConsegna,
      sito: c.sito ?? '',
      extra: { ...c.extra },
      tariffe: c.tariffe.map(t => ({ ...t })),
      note: c.note,
      apiCredentials: c.apiCredentials ? { ...c.apiCredentials } : undefined,
    });
  }

  function startAdd() {
    setIsAdding(true);
    setEditingId(null);
    setEditForm({ ...EMPTY_CORRIERE, tariffe: EMPTY_CORRIERE.tariffe.map(t => ({ ...t })), extra: {} });
  }

  function cancelEdit() {
    setEditingId(null);
    setIsAdding(false);
  }

  async function handleSave() {
    if (!editForm.nome || !editForm.codice) {
      alert('Compila Nome e Codice corriere.');
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...editForm,
        tariffe: editForm.tariffe.filter(t => t.prezzo >= 0 || t.maxKg === 9999),
      };
      if (isAdding) {
        const id = await saveCorreire(data as Omit<Corriere, 'id'>);
        setCorrieri(prev => [...prev, { ...data, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Corriere].sort((a, b) => a.nome.localeCompare(b.nome)));
      } else if (editingId) {
        await updateCorriere(editingId, data);
        setCorrieri(prev => prev.map(x => x.id === editingId ? { ...x, ...data, updatedAt: new Date().toISOString() } : x));
      }
      cancelEdit();
    } catch {
      alert('Errore salvataggio corriere.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, nome: string) {
    if (!window.confirm(`Eliminare il corriere "${nome}"?`)) return;
    try {
      await deleteCorriere(id);
      setCorrieri(prev => prev.filter(c => c.id !== id));
    } catch {
      alert('Errore eliminazione.');
    }
  }

  async function handleSaveSettings() {
    setSaving(true);
    try {
      await saveShippingSettings(settings);
      alert('Impostazioni salvate.');
    } finally {
      setSaving(false);
    }
  }

  function calcolaPreventivi() {
    if (!calcPeso) return;
    const dims = (calcL && calcW && calcH)
      ? { lunghezza: Number(calcL), larghezza: Number(calcW), altezza: Number(calcH) }
      : undefined;
    const result = calcolaQuoteTuttiCorrieri(
      corrieri,
      Number(calcPeso),
      dims,
      Number(calcTotale) || 0,
      settings.sogliaGratuita,
      settings.volumetricoDivisore
    );
    setQuotes(result);
  }

  function updateTariffa(index: number, field: keyof FasciaTariffaria, value: number) {
    setEditForm(f => ({
      ...f,
      tariffe: f.tariffe.map((t, i) => i === index ? { ...t, [field]: value } : t),
    }));
  }

  function addFascia() {
    setEditForm(f => ({
      ...f,
      tariffe: [
        ...f.tariffe.slice(0, -1),
        { maxKg: 0, prezzo: 0 },
        f.tariffe[f.tariffe.length - 1],
      ],
    }));
  }

  function removeFascia(index: number) {
    setEditForm(f => ({ ...f, tariffe: f.tariffe.filter((_, i) => i !== index) }));
  }

  const inputCls = 'w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange text-white';
  const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="w-6 h-6 text-brand-orange" />
          <div>
            <h2 className="text-xl font-bold">Gestione Spedizioni</h2>
            <p className="text-xs text-zinc-500">{corrieri.filter(c => c.attivo).length} corrieri attivi · Soglia gratuita: €{settings.sogliaGratuita}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {corrieri.length === 0 && (
            <button
              onClick={handleInit}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Carica Corrieri Predefiniti
            </button>
          )}
          <button
            onClick={() => { startAdd(); setTab('corrieri'); }}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold border border-white/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nuovo Corriere
          </button>
        </div>
      </div>

      {/* Errore */}
      {initError && (
        <div className="mx-6 mt-4 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Accesso negato da Firestore</p>
            <p className="text-xs mt-1 text-red-500/80">{initError}</p>
            <p className="text-xs mt-1 text-red-500/60">Soluzione: esegui <code className="bg-red-900/30 px-1 rounded">firebase deploy --only firestore:rules</code> dalla cartella del progetto.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {([
          { id: 'corrieri', label: 'Corrieri', icon: Truck },
          { id: 'calcola',  label: 'Calcola Preventivo', icon: Calculator },
          { id: 'impostazioni', label: 'Impostazioni', icon: Settings },
        ] as { id: PanelTab; label: string; icon: any }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${
              tab === t.id
                ? 'border-brand-orange text-brand-orange'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">

        {/* ── TAB: CORRIERI ── */}
        {tab === 'corrieri' && (
          <div className="space-y-4">

            {/* Form aggiunta/modifica */}
            {(isAdding || editingId) && (
              <div className="bg-zinc-950 border border-brand-orange/30 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-brand-orange text-sm uppercase tracking-widest">
                    {isAdding ? 'Nuovo Corriere' : 'Modifica Corriere'}
                  </h3>
                  <button onClick={cancelEdit}><X className="w-4 h-4 text-zinc-500 hover:text-white" /></button>
                </div>

                {/* Dati base */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelCls}>Nome Corriere</label>
                    <input className={inputCls} placeholder="es. BRT Bartolini" value={editForm.nome} onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Codice (univoco)</label>
                    <input className={inputCls} placeholder="es. brt" value={editForm.codice} onChange={e => setEditForm(f => ({ ...f, codice: e.target.value.toLowerCase().replace(/\s/g, '') }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Colore brand</label>
                    <div className="flex gap-2">
                      <input type="color" value={editForm.colore} onChange={e => setEditForm(f => ({ ...f, colore: e.target.value }))} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                      <input className={inputCls} value={editForm.colore} onChange={e => setEditForm(f => ({ ...f, colore: e.target.value }))} />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Stima Consegna</label>
                    <input className={inputCls} placeholder="es. 24h lavorative" value={editForm.stimaConsegna} onChange={e => setEditForm(f => ({ ...f, stimaConsegna: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Sito web</label>
                    <input className={inputCls} placeholder="https://..." value={editForm.sito ?? ''} onChange={e => setEditForm(f => ({ ...f, sito: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Note</label>
                    <input className={inputCls} placeholder="Note opzionali" value={editForm.note ?? ''} onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Attivo</label>
                    <button onClick={() => setEditForm(f => ({ ...f, attivo: !f.attivo }))} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${editForm.attivo ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-zinc-800 border-white/10 text-zinc-400'}`}>
                      {editForm.attivo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {editForm.attivo ? 'Attivo' : 'Disattivo'}
                    </button>
                  </div>
                </div>

                {/* Tariffe */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className={labelCls}>Tabella Tariffe (per peso crescente)</p>
                    <button onClick={addFascia} className="flex items-center gap-1 text-xs text-brand-orange hover:text-orange-400 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Aggiungi fascia
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editForm.tariffe.map((t, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-zinc-600 uppercase">
                              {t.maxKg === 9999 ? 'Oltre soglia (kg)' : `Max peso (kg)`}
                            </label>
                            <input
                              type="number" step="0.5" min="0"
                              value={t.maxKg === 9999 ? '' : t.maxKg}
                              disabled={t.maxKg === 9999}
                              onChange={e => updateTariffa(i, 'maxKg', Number(e.target.value))}
                              className={`${inputCls} ${t.maxKg === 9999 ? 'opacity-40' : ''}`}
                              placeholder={t.maxKg === 9999 ? '∞' : ''}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-zinc-600 uppercase">
                              Prezzo (€) · -1 = preventivo
                            </label>
                            <input
                              type="number" step="0.10" min="-1"
                              value={t.prezzo}
                              onChange={e => updateTariffa(i, 'prezzo', Number(e.target.value))}
                              className={inputCls}
                            />
                          </div>
                        </div>
                        {t.maxKg !== 9999 && (
                          <button onClick={() => removeFascia(i)} className="text-red-500 hover:text-red-400 mt-4">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Extra charges */}
                <div>
                  <p className={labelCls}>Supplementi e Extra (€)</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {([
                      { key: 'isole',          label: 'Isole'        },
                      { key: 'zonaRemota',     label: 'Zona Remota'  },
                      { key: 'contrassegno',   label: 'Contrassegno' },
                      { key: 'consegnaSabato', label: 'Sabato'       },
                      { key: 'primaOra',       label: 'Prima ora'    },
                    ] as { key: keyof typeof editForm.extra; label: string }[]).map(({ key, label }) => (
                      <div key={key}>
                        <label className={labelCls}>{label}</label>
                        <input
                          type="number" step="0.5" min="0" placeholder="0"
                          value={editForm.extra?.[key] ?? ''}
                          onChange={e => setEditForm(f => ({ ...f, extra: { ...f.extra, [key]: e.target.value ? Number(e.target.value) : undefined } }))}
                          className={inputCls}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* API Credentials (optional) */}
                <div>
                  <p className={labelCls}>Credenziali API (opzionale — per integrazioni future)</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {([
                      { key: 'endpoint',      label: 'Endpoint URL'    },
                      { key: 'clientId',      label: 'Client ID'       },
                      { key: 'clientSecret',  label: 'Client Secret'   },
                      { key: 'accountNumber', label: 'N° Account'      },
                      { key: 'username',      label: 'Username'        },
                      { key: 'password',      label: 'Password'        },
                    ] as { key: keyof NonNullable<Corriere['apiCredentials']>; label: string }[]).map(({ key, label }) => (
                      <div key={key}>
                        <label className={labelCls}>{label}</label>
                        <input
                          type={key === 'password' || key === 'clientSecret' ? 'password' : 'text'}
                          className={inputCls}
                          placeholder="—"
                          value={editForm.apiCredentials?.[key] ?? ''}
                          onChange={e => setEditForm(f => ({
                            ...f,
                            apiCredentials: { ...(f.apiCredentials ?? {}), [key]: e.target.value },
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salva Corriere
                  </button>
                  <button onClick={cancelEdit} className="px-6 py-2.5 bg-zinc-800 text-zinc-400 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-colors">Annulla</button>
                </div>
              </div>
            )}

            {/* Lista corrieri */}
            {corrieri.length === 0 && !isAdding ? (
              <div className="text-center py-16 text-zinc-500">
                <Truck className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-bold mb-2">Nessun corriere configurato</p>
                <p className="text-xs mb-6">Carica i corrieri predefiniti o aggiungine uno manualmente</p>
                <button onClick={handleInit} disabled={saving} className="px-6 py-3 bg-brand-orange text-white rounded-xl font-bold text-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Carica Corrieri Predefiniti (7 corrieri)'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {corrieri.map(c => (
                  <div key={c.id} className={`rounded-xl border transition-colors ${c.attivo ? 'border-white/10 bg-zinc-950/60' : 'border-white/5 bg-zinc-950/30 opacity-60'}`}>
                    <div className="flex items-center gap-4 p-4">
                      {/* Color dot */}
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.colore }} />
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">{c.nome}</span>
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono uppercase">{c.codice}</span>
                          <span className="text-[10px] text-zinc-500">{c.stimaConsegna}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500 flex-wrap">
                          <span>{c.tariffe.filter(t => t.prezzo > 0).length} fasce tariffarie</span>
                          {c.extra.isole && <span>Isole +€{c.extra.isole}</span>}
                          {c.extra.zonaRemota && <span>Remota +€{c.extra.zonaRemota}</span>}
                          {c.sito && (
                            <a href={c.sito} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-orange hover:text-orange-400">
                              <ExternalLink className="w-3 h-3" /> Sito
                            </a>
                          )}
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleAttivo(c)}
                          title={c.attivo ? 'Disattiva' : 'Attiva'}
                          className={`p-1.5 rounded-lg transition-colors ${c.attivo ? 'text-green-400 hover:bg-green-500/10' : 'text-zinc-600 hover:bg-white/5'}`}
                        >
                          {c.attivo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          {expandedId === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c.id, c.nome)} className="p-1.5 rounded-lg text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Tariffe espanse */}
                    {expandedId === c.id && (
                      <div className="px-4 pb-4 border-t border-white/5 mt-0 pt-3">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Tabella tariffe</p>
                        <div className="flex flex-wrap gap-2">
                          {c.tariffe.map((t, i) => (
                            <div key={i} className="px-3 py-1.5 bg-zinc-900 rounded-lg text-xs text-center min-w-[80px]">
                              <div className="text-zinc-500 text-[9px]">
                                {t.maxKg === 9999 ? '> soglia' : `≤ ${t.maxKg} kg`}
                              </div>
                              <div className={`font-bold ${t.prezzo === -1 ? 'text-yellow-500' : 'text-white'}`}>
                                {t.prezzo === -1 ? 'Preventivo' : `€${t.prezzo.toFixed(2)}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: CALCOLA PREVENTIVO ── */}
        {tab === 'calcola' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className={labelCls}>Peso reale (kg) *</label>
                <input type="number" step="0.1" min="0" placeholder="es. 3.5" value={calcPeso} onChange={e => setCalcPeso(e.target.value ? Number(e.target.value) : '')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Lunghezza (cm)</label>
                <input type="number" step="1" min="0" placeholder="es. 50" value={calcL} onChange={e => setCalcL(e.target.value ? Number(e.target.value) : '')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Larghezza (cm)</label>
                <input type="number" step="1" min="0" placeholder="es. 30" value={calcW} onChange={e => setCalcW(e.target.value ? Number(e.target.value) : '')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Altezza (cm)</label>
                <input type="number" step="1" min="0" placeholder="es. 20" value={calcH} onChange={e => setCalcH(e.target.value ? Number(e.target.value) : '')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Valore ordine (€)</label>
                <input type="number" step="1" min="0" placeholder={`es. ${settings.sogliaGratuita}`} value={calcTotale} onChange={e => setCalcTotale(e.target.value ? Number(e.target.value) : '')} className={inputCls} />
              </div>
            </div>
            <button
              onClick={calcolaPreventivi}
              disabled={!calcPeso}
              className="flex items-center gap-2 px-8 py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-40"
            >
              <Calculator className="w-4 h-4" /> Calcola Preventivi
            </button>

            {quotes.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Confronto corrieri attivi</p>
                {quotes.map((q, i) => (
                  <div
                    key={q.corriere.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                      i === 0 && !q.preventivo ? 'border-brand-orange/40 bg-brand-orange/5' : 'border-white/5 bg-zinc-950/50'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: q.corriere.colore }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{q.corriere.nome}</span>
                        {i === 0 && !q.preventivo && <span className="text-[9px] bg-brand-orange text-white px-1.5 py-0.5 rounded font-bold uppercase">Più economico</span>}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {q.corriere.stimaConsegna} · Peso fatturato: {q.pesoFatturato} kg
                        {q.pesoVolumetrico > q.pesoReale && ` (volumetrico: ${q.pesoVolumetrico} kg)`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-black ${q.gratuita ? 'text-green-400' : q.preventivo ? 'text-yellow-500' : 'text-white'}`}>
                        {q.gratuita ? 'Gratuita' : q.preventivo ? 'Preventivo' : `€${q.costoTotale.toFixed(2)}`}
                      </div>
                      {q.gratuita && <div className="text-[10px] text-green-600">sopra €{settings.sogliaGratuita}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {corrieri.filter(c => c.attivo).length === 0 && (
              <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Nessun corriere attivo. Attiva almeno un corriere dalla tab Corrieri.
              </div>
            )}
          </div>
        )}

        {/* ── TAB: IMPOSTAZIONI ── */}
        {tab === 'impostazioni' && (
          <div className="max-w-lg space-y-6">
            <div>
              <label className={labelCls}>Soglia spedizione gratuita (€)</label>
              <input
                type="number" step="1" min="0"
                value={settings.sogliaGratuita}
                onChange={e => setSettings(s => ({ ...s, sogliaGratuita: Number(e.target.value) }))}
                className={inputCls}
              />
              <p className="text-[11px] text-zinc-600 mt-1">Ordini sopra questa cifra ricevono la spedizione gratuita automaticamente.</p>
            </div>
            <div>
              <label className={labelCls}>Divisore peso volumetrico</label>
              <select
                value={settings.volumetricoDivisore}
                onChange={e => setSettings(s => ({ ...s, volumetricoDivisore: Number(e.target.value) }))}
                className={inputCls}
              >
                <option value={5000}>5000 (standard corrieri italiani)</option>
                <option value={4000}>4000 (DHL, FedEx internazionale)</option>
                <option value={6000}>6000 (pallet / merci su misura)</option>
              </select>
              <p className="text-[11px] text-zinc-600 mt-1">Formula: (L × W × H cm) / divisore = kg volumetrici. Viene fatturato il maggiore tra reale e volumetrico.</p>
            </div>
            <div>
              <label className={labelCls}>Corriere predefinito (per display prodotti)</label>
              <select
                value={settings.corriereDefault ?? ''}
                onChange={e => setSettings(s => ({ ...s, corriereDefault: e.target.value || undefined }))}
                className={inputCls}
              >
                <option value="">— Mostra il più economico —</option>
                {corrieri.filter(c => c.attivo).map(c => (
                  <option key={c.id} value={c.codice}>{c.nome}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salva Impostazioni
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
