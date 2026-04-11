/**
 * Pannello Contabilità — Regime Forfettario
 * Calibrato su: ATECO 47.69.12, coefficiente 40%, aliquota 5% (primo quinquennio)
 * INPS: esonerato (dipendente)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase';
import {
  collection, doc, getDocs, addDoc, deleteDoc,
  setDoc, getDoc, query, orderBy
} from 'firebase/firestore';
import {
  Calculator, TrendingUp, TrendingDown, Euro, Calendar,
  Plus, Trash2, Download, RefreshCw, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle, Clock, Info, FileText, ShoppingBag
} from 'lucide-react';

// ─── Tipi ────────────────────────────────────────────────────────────────────

type TipoVoce = 'entrata' | 'uscita';
type FonteEntrata = 'ordine' | 'manuale';

interface VoceContabile {
  id: string;
  tipo: TipoVoce;
  data: string;
  descrizione: string;
  importo: number;
  categoria: string;
  fonte?: FonteEntrata;
  ordineId?: string;
  createdAt: string;
}

interface AccountingSettings {
  coefficiente: number;    // 0.40
  aliquota: number;        // 0.05
  annoApertura: number;    // 2026
  updatedAt: string;
}

interface ScadenzaItem {
  data: string;
  titolo: string;
  descrizione: string;
  tipo: 'pagamento' | 'dichiarazione' | 'avviso';
  stato: 'completato' | 'prossimo' | 'futuro';
}

// ─── Costanti ────────────────────────────────────────────────────────────────

const SETTINGS_DEFAULT: AccountingSettings = {
  coefficiente: 0.40,
  aliquota: 0.05,
  annoApertura: 2026,
  updatedAt: new Date().toISOString(),
};

const CATEGORIE_ENTRATA = ['Vendita prodotti', 'Consulenza', 'Altro'];
const CATEGORIE_USCITA = [
  'Acquisto merce', 'Hosting / Software', 'Spedizioni',
  'Marketing / Pubblicità', 'Attrezzatura', 'Formazione', 'Altro'
];

const ANNO_CORRENTE = new Date().getFullYear();

// ─── Scadenzario forfettario ─────────────────────────────────────────────────

function buildScadenzario(annoApertura: number): ScadenzaItem[] {
  const today = new Date();
  const items: ScadenzaItem[] = [];

  const addItem = (data: string, titolo: string, descrizione: string, tipo: ScadenzaItem['tipo']) => {
    const d = new Date(data);
    const stato: ScadenzaItem['stato'] =
      d < today ? 'completato' :
      (d.getTime() - today.getTime()) < 90 * 24 * 60 * 60 * 1000 ? 'prossimo' : 'futuro';
    items.push({ data, titolo, descrizione, tipo, stato });
  };

  // Primo anno: nessun acconto
  if (annoApertura === ANNO_CORRENTE) {
    addItem(
      `${ANNO_CORRENTE}-03-16`,
      'Apertura P.IVA',
      'Iscrizione al Registro Imprese completata (16/03/2026)',
      'avviso'
    );
    addItem(
      `${ANNO_CORRENTE + 1}-06-30`,
      `Saldo imposta sostitutiva ${ANNO_CORRENTE}`,
      `Pagare il saldo dell'imposta sostitutiva ${ANNO_CORRENTE} tramite F24`,
      'pagamento'
    );
    addItem(
      `${ANNO_CORRENTE + 1}-06-30`,
      `Primo acconto ${ANNO_CORRENTE + 1} (40%)`,
      `Acconto imposta sostitutiva ${ANNO_CORRENTE + 1} — primo anno con acconto`,
      'pagamento'
    );
    addItem(
      `${ANNO_CORRENTE + 1}-11-30`,
      `Secondo acconto ${ANNO_CORRENTE + 1} (60%)`,
      `Secondo acconto imposta sostitutiva ${ANNO_CORRENTE + 1}`,
      'pagamento'
    );
    addItem(
      `${ANNO_CORRENTE + 1}-10-15`,
      `Modello Redditi PF ${ANNO_CORRENTE}`,
      `Dichiarazione dei redditi ${ANNO_CORRENTE} tramite CAF o commercialista`,
      'dichiarazione'
    );
  }

  return items.sort((a, b) => a.data.localeCompare(b.data));
}

// ─── Componente principale ───────────────────────────────────────────────────

export function AdminAccountingPanel() {
  const [voci, setVoci] = useState<VoceContabile[]>([]);
  const [settings, setSettings] = useState<AccountingSettings>(SETTINGS_DEFAULT);
  const [activeTab, setActiveTab] = useState<'cruscotto' | 'entrate' | 'uscite' | 'scadenzario' | 'impostazioni'>('cruscotto');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [annoFiltro, setAnnoFiltro] = useState(ANNO_CORRENTE);

  // Form nuova voce
  const [showForm, setShowForm] = useState(false);
  const [formTipo, setFormTipo] = useState<TipoVoce>('entrata');
  const [formData, setFormData] = useState<Omit<VoceContabile, 'id' | 'createdAt'>>({
    tipo: 'entrata',
    data: new Date().toISOString().split('T')[0],
    descrizione: '',
    importo: 0,
    categoria: CATEGORIE_ENTRATA[0],
    fonte: 'manuale',
  });
  const [saving, setSaving] = useState(false);

  // Impostazioni
  const [editSettings, setEditSettings] = useState<AccountingSettings>(SETTINGS_DEFAULT);
  const [savingSettings, setSavingSettings] = useState(false);

  // ── Caricamento dati ────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Impostazioni
      const settingsSnap = await getDoc(doc(db, 'settings', 'accounting_settings'));
      const s = settingsSnap.exists() ? (settingsSnap.data() as AccountingSettings) : SETTINGS_DEFAULT;
      setSettings(s);
      setEditSettings(s);

      // Voci contabili
      const q = query(collection(db, 'accounting_entries'), orderBy('data', 'desc'));
      const snap = await getDocs(q);
      setVoci(snap.docs.map(d => ({ id: d.id, ...d.data() } as VoceContabile)));
    } catch (e: any) {
      setError(e?.message || 'Errore nel caricamento dei dati contabili');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Import ordini ───────────────────────────────────────────────────────────

  const importOrdini = async () => {
    try {
      const ordiniSnap = await getDocs(collection(db, 'orders'));
      const esistenti = new Set(voci.filter(v => v.fonte === 'ordine').map(v => v.ordineId));
      let importati = 0;
      const now = new Date().toISOString();

      for (const d of ordiniSnap.docs) {
        if (esistenti.has(d.id)) continue;
        const o = d.data();
        const totale = typeof o.total === 'number' ? o.total :
                       typeof o.totale === 'number' ? o.totale : 0;
        if (totale <= 0) continue;
        const data = o.createdAt?.toDate?.()?.toISOString?.()?.split('T')?.[0]
                  || o.data?.split('T')?.[0]
                  || now.split('T')[0];
        await addDoc(collection(db, 'accounting_entries'), {
          tipo: 'entrata',
          data,
          descrizione: `Ordine #${d.id.slice(-6).toUpperCase()}`,
          importo: totale,
          categoria: 'Vendita prodotti',
          fonte: 'ordine',
          ordineId: d.id,
          createdAt: now,
        });
        importati++;
      }
      await loadData();
      if (importati === 0) alert('Nessun nuovo ordine da importare.');
      else alert(`Importati ${importati} ordini.`);
    } catch (e: any) {
      alert('Errore import: ' + e?.message);
    }
  };

  // ── Salva voce ──────────────────────────────────────────────────────────────

  const handleSaveVoce = async () => {
    if (!formData.descrizione.trim() || formData.importo <= 0) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'accounting_entries'), {
        ...formData,
        tipo: formTipo,
        importo: Number(formData.importo),
        createdAt: new Date().toISOString(),
      });
      setShowForm(false);
      setFormData({ tipo: 'entrata', data: new Date().toISOString().split('T')[0], descrizione: '', importo: 0, categoria: CATEGORIE_ENTRATA[0], fonte: 'manuale' });
      await loadData();
    } catch (e: any) {
      alert('Errore nel salvataggio: ' + e?.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Elimina voce ────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa voce?')) return;
    await deleteDoc(doc(db, 'accounting_entries', id));
    await loadData();
  };

  // ── Salva impostazioni ──────────────────────────────────────────────────────

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'accounting_settings'), {
        ...editSettings,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSettings(editSettings);
      alert('Impostazioni salvate.');
    } catch (e: any) {
      alert('Errore: ' + e?.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // ── Calcoli ─────────────────────────────────────────────────────────────────

  const vociAnno = voci.filter(v => v.data.startsWith(String(annoFiltro)));
  const entrate = vociAnno.filter(v => v.tipo === 'entrata').reduce((s, v) => s + v.importo, 0);
  const uscite  = vociAnno.filter(v => v.tipo === 'uscita').reduce((s, v) => s + v.importo, 0);
  const baseImponibile = entrate * settings.coefficiente;
  const impostaSostitutiva = baseImponibile * settings.aliquota;
  const impostaSe15 = baseImponibile * 0.15;
  const risparmio = impostaSe15 - impostaSostitutiva;
  const utileNetto = entrate - uscite - impostaSostitutiva;

  const scadenzario = buildScadenzario(settings.annoApertura);

  // ── Export CSV ──────────────────────────────────────────────────────────────

  const exportCSV = () => {
    const rows = [
      ['Data', 'Tipo', 'Categoria', 'Descrizione', 'Importo (€)'],
      ...vociAnno.map(v => [v.data, v.tipo, v.categoria, v.descrizione, v.importo.toFixed(2)]),
      [],
      ['', '', '', 'Totale entrate', entrate.toFixed(2)],
      ['', '', '', 'Totale uscite', uscite.toFixed(2)],
      ['', '', '', `Base imponibile (×${settings.coefficiente * 100}%)`, baseImponibile.toFixed(2)],
      ['', '', '', `Imposta sostitutiva (${settings.aliquota * 100}%)`, impostaSostitutiva.toFixed(2)],
    ];
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contabilita_${annoFiltro}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const fmt = (n: number) => `€${n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const TABS = [
    { id: 'cruscotto', label: 'Cruscotto' },
    { id: 'entrate', label: 'Entrate' },
    { id: 'uscite', label: 'Uscite' },
    { id: 'scadenzario', label: 'Scadenzario' },
    { id: 'impostazioni', label: 'Impostazioni' },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Caricamento contabilità...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Contabilità</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Regime forfettario · ATECO 47.69.12 · Coeff. {settings.coefficiente * 100}% · Aliquota {settings.aliquota * 100}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={annoFiltro}
            onChange={e => setAnnoFiltro(Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            {[ANNO_CORRENTE, ANNO_CORRENTE - 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={exportCSV} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button onClick={loadData} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm transition-colors">
            <RefreshCw className="w-4 h-4" />
            Aggiorna
          </button>
        </div>
      </div>

      {/* Info forfettario */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300">
          <strong>Primo quinquennio (2026–2030):</strong> aliquota agevolata al 5% invece del 15%.
          Risparmio stimato {fmt(risparmio)} rispetto al regime ordinario.
          INPS esonerato (dipendente). Nessun acconto dovuto per il 2026 (primo anno di attività).
        </div>
      </div>

      {/* Errore Firestore */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="text-sm text-red-300">
            <strong>Errore Firestore:</strong> {error}
            <br />Aggiungi la regola per <code>accounting_entries</code> in firestore.rules
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 border border-zinc-800">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id
                ? 'bg-brand-orange text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CRUSCOTTO ─────────────────────────────────────────────────────────── */}
      {activeTab === 'cruscotto' && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Entrate {annoFiltro}</span>
              </div>
              <div className="text-2xl font-bold text-white">{fmt(entrate)}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Uscite {annoFiltro}</span>
              </div>
              <div className="text-2xl font-bold text-white">{fmt(uscite)}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <Calculator className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Imposta stimata</span>
              </div>
              <div className="text-2xl font-bold text-white">{fmt(impostaSostitutiva)}</div>
              <div className="text-xs text-zinc-500 mt-1">Base: {fmt(baseImponibile)}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Euro className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Utile netto stimato</span>
              </div>
              <div className={`text-2xl font-bold ${utileNetto >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmt(utileNetto)}
              </div>
            </div>
          </div>

          {/* Formula dettaglio */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-brand-orange" />
              Calcolo imposta sostitutiva {annoFiltro}
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Totale ricavi/entrate', value: fmt(entrate), note: '' },
                { label: `× Coefficiente di redditività (${settings.coefficiente * 100}%)`, value: fmt(baseImponibile), note: 'ATECO 47.69.12 — Commercio al dettaglio' },
                { label: `× Aliquota imposta sostitutiva (${settings.aliquota * 100}%)`, value: fmt(impostaSostitutiva), note: settings.aliquota === 0.05 ? 'Agevolata primo quinquennio' : 'Aliquota standard' },
              ].map((row, i) => (
                <div key={i} className={`flex items-center justify-between py-3 ${i < 2 ? 'border-b border-zinc-800' : ''}`}>
                  <div>
                    <div className="text-zinc-300 text-sm">{row.label}</div>
                    {row.note && <div className="text-zinc-500 text-xs mt-0.5">{row.note}</div>}
                  </div>
                  <div className={`font-bold text-lg ${i === 2 ? 'text-brand-orange' : 'text-white'}`}>{row.value}</div>
                </div>
              ))}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex justify-between items-center">
                <span className="text-emerald-300 text-sm">Risparmio vs aliquota 15%</span>
                <span className="text-emerald-400 font-bold">{fmt(risparmio)}</span>
              </div>
            </div>
          </div>

          {/* Avviso attività inattiva */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-300">
              <strong>Stato impresa: INATTIVA</strong> — L'impresa risulta registrata ma non ancora avviata.
              Per iniziare l'attività occorre comunicarlo alla CCIAA (pratica di inizio attività).
              Rivolgiti a un CAF o usa il portale <strong>Telemaco / impresa.italia.it</strong>.
            </div>
          </div>
        </div>
      )}

      {/* ── ENTRATE ─────────────────────────────────────────────────────────────── */}
      {activeTab === 'entrate' && (
        <VociTab
          voci={vociAnno.filter(v => v.tipo === 'entrata')}
          tipo="entrata"
          categorie={CATEGORIE_ENTRATA}
          onDelete={handleDelete}
          onAdd={() => { setFormTipo('entrata'); setFormData(p => ({ ...p, tipo: 'entrata', categoria: CATEGORIE_ENTRATA[0] })); setShowForm(true); }}
          onImportOrdini={importOrdini}
          showForm={showForm && formTipo === 'entrata'}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSaveVoce}
          onCancelForm={() => setShowForm(false)}
          saving={saving}
          fmt={fmt}
          total={vociAnno.filter(v => v.tipo === 'entrata').reduce((s, v) => s + v.importo, 0)}
        />
      )}

      {/* ── USCITE ─────────────────────────────────────────────────────────────── */}
      {activeTab === 'uscite' && (
        <VociTab
          voci={vociAnno.filter(v => v.tipo === 'uscita')}
          tipo="uscita"
          categorie={CATEGORIE_USCITA}
          onDelete={handleDelete}
          onAdd={() => { setFormTipo('uscita'); setFormData(p => ({ ...p, tipo: 'uscita', categoria: CATEGORIE_USCITA[0] })); setShowForm(true); }}
          showForm={showForm && formTipo === 'uscita'}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSaveVoce}
          onCancelForm={() => setShowForm(false)}
          saving={saving}
          fmt={fmt}
          total={vociAnno.filter(v => v.tipo === 'uscita').reduce((s, v) => s + v.importo, 0)}
        />
      )}

      {/* ── SCADENZARIO ─────────────────────────────────────────────────────────── */}
      {activeTab === 'scadenzario' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-400">
            Scadenze calibrate su: regime forfettario, ATECO 47.69.12, apertura {settings.annoApertura}, INPS esonerato.
            Le date sono indicative — verifica sempre sul sito dell'Agenzia delle Entrate o con il tuo CAF.
          </div>
          {scadenzario.map((s, i) => (
            <div key={i} className={`bg-zinc-900 border rounded-xl p-5 flex items-start gap-4 ${
              s.stato === 'prossimo' ? 'border-orange-500/50' :
              s.stato === 'completato' ? 'border-emerald-500/30' :
              'border-zinc-800'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                s.stato === 'prossimo' ? 'bg-orange-500/20 text-orange-400' :
                s.stato === 'completato' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-zinc-800 text-zinc-500'
              }`}>
                {s.stato === 'completato' ? <CheckCircle className="w-5 h-5" /> :
                 s.stato === 'prossimo' ? <Clock className="w-5 h-5" /> :
                 <Calendar className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold">{s.titolo}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.tipo === 'pagamento' ? 'bg-orange-500/20 text-orange-400' :
                    s.tipo === 'dichiarazione' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-zinc-700 text-zinc-400'
                  }`}>
                    {s.tipo === 'pagamento' ? 'Pagamento' :
                     s.tipo === 'dichiarazione' ? 'Dichiarazione' : 'Avviso'}
                  </span>
                  {s.stato === 'prossimo' && (
                    <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">Prossimo</span>
                  )}
                </div>
                <p className="text-zinc-400 text-sm mt-1">{s.descrizione}</p>
              </div>
              <div className="text-zinc-500 text-sm font-mono flex-shrink-0">
                {new Date(s.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-500 flex gap-2">
            <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Per la dichiarazione annuale (Modello Redditi PF) puoi usare un CAF (~€100) oppure
              il servizio precompilato dell'Agenzia delle Entrate. Con i dati esportati da qui il lavoro è minimo.
            </span>
          </div>
        </div>
      )}

      {/* ── IMPOSTAZIONI ─────────────────────────────────────────────────────────── */}
      {activeTab === 'impostazioni' && (
        <div className="space-y-6 max-w-lg">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
            <h3 className="text-white font-semibold">Parametri fiscali</h3>

            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Coefficiente di redditività</label>
              <div className="flex items-center gap-3">
                <input
                  type="number" min="0.01" max="1" step="0.01"
                  value={editSettings.coefficiente}
                  onChange={e => setEditSettings(p => ({ ...p, coefficiente: Number(e.target.value) }))}
                  className="w-32 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
                />
                <span className="text-zinc-400 text-sm">= {(editSettings.coefficiente * 100).toFixed(0)}% (ATECO 47.69.12: 40%)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Aliquota imposta sostitutiva</label>
              <div className="flex items-center gap-3">
                <select
                  value={editSettings.aliquota}
                  onChange={e => setEditSettings(p => ({ ...p, aliquota: Number(e.target.value) }))}
                  className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
                >
                  <option value={0.05}>5% — Primo quinquennio (agevolata)</option>
                  <option value={0.15}>15% — Aliquota ordinaria</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Anno di apertura attività</label>
              <input
                type="number" min="2020" max="2030"
                value={editSettings.annoApertura}
                onChange={e => setEditSettings(p => ({ ...p, annoApertura: Number(e.target.value) }))}
                className="w-32 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-zinc-500 text-xs mt-1">
                Determina la durata del periodo agevolato al 5% (5 anni dall'apertura)
              </p>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="w-full bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {savingSettings ? 'Salvataggio...' : 'Salva impostazioni'}
            </button>
          </div>

          {/* Dati impresa */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
            <h3 className="text-white font-semibold">Dati impresa (dalla visura)</h3>
            {[
              ['Titolare', 'Amerigo De Cristofaro'],
              ['Insegna', 'OFFICINADELSUONO'],
              ['P.IVA', '03243690645'],
              ['C.F.', 'DCRMRG99B06I805Y'],
              ['ATECO', '47.69.12 — Commercio al dettaglio strumenti musicali'],
              ['REA', 'AV-314125'],
              ['Regime', 'Forfettario'],
              ['INPS', 'Esonerato (dipendente)'],
              ['IVA', 'Non applicabile (forfettario)'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 text-sm">
                <span className="text-zinc-500 w-24 flex-shrink-0">{k}</span>
                <span className="text-zinc-200">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-componente tabella voci ──────────────────────────────────────────────

interface VociTabProps {
  voci: VoceContabile[];
  tipo: TipoVoce;
  categorie: string[];
  onDelete: (id: string) => void;
  onAdd: () => void;
  onImportOrdini?: () => void;
  showForm: boolean;
  formData: Omit<VoceContabile, 'id' | 'createdAt'>;
  setFormData: React.Dispatch<React.SetStateAction<Omit<VoceContabile, 'id' | 'createdAt'>>>;
  onSave: () => void;
  onCancelForm: () => void;
  saving: boolean;
  fmt: (n: number) => string;
  total: number;
}

function VociTab({ voci, tipo, categorie, onDelete, onAdd, onImportOrdini, showForm, formData, setFormData, onSave, onCancelForm, saving, fmt, total }: VociTabProps) {
  const isEntrata = tipo === 'entrata';
  const color = isEntrata ? 'emerald' : 'red';

  return (
    <div className="space-y-4">
      {/* Header azioni */}
      <div className="flex items-center justify-between">
        <div className={`text-lg font-bold ${isEntrata ? 'text-emerald-400' : 'text-red-400'}`}>
          Totale: {fmt(total)}
        </div>
        <div className="flex gap-2">
          {isEntrata && onImportOrdini && (
            <button
              onClick={onImportOrdini}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Importa ordini
            </button>
          )}
          <button
            onClick={onAdd}
            className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Aggiungi {isEntrata ? 'entrata' : 'uscita'}
          </button>
        </div>
      </div>

      {/* Form aggiunta */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 space-y-4">
          <h4 className="text-white font-semibold">Nuova {isEntrata ? 'entrata' : 'uscita'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Data</label>
              <input
                type="date"
                value={formData.data}
                onChange={e => setFormData(p => ({ ...p, data: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Importo (€)</label>
              <input
                type="number" min="0.01" step="0.01"
                value={formData.importo || ''}
                onChange={e => setFormData(p => ({ ...p, importo: Number(e.target.value) }))}
                placeholder="0.00"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Categoria</label>
              <select
                value={formData.categoria}
                onChange={e => setFormData(p => ({ ...p, categoria: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
              >
                {categorie.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Descrizione</label>
              <input
                type="text"
                value={formData.descrizione}
                onChange={e => setFormData(p => ({ ...p, descrizione: e.target.value }))}
                placeholder={isEntrata ? 'Es. Vendita mixer DJ' : 'Es. Acquisto stock Pioneer'}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onSave}
              disabled={saving || !formData.descrizione.trim() || formData.importo <= 0}
              className="bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>
            <button onClick={onCancelForm} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm transition-colors">
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Tabella */}
      {voci.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p>Nessuna {isEntrata ? 'entrata' : 'uscita'} registrata per questo anno.</p>
          {isEntrata && <p className="text-sm mt-1">Usa "Importa ordini" per sincronizzare le vendite.</p>}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Categoria</th>
                <th className="text-left px-4 py-3">Descrizione</th>
                <th className="text-right px-4 py-3">Importo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {voci.map(v => (
                <tr key={v.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{v.data}</td>
                  <td className="px-4 py-3">
                    <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs">{v.categoria}</span>
                    {v.fonte === 'ordine' && (
                      <span className="ml-1 bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">auto</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-200">{v.descrizione}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${isEntrata ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmt(v.importo)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {v.fonte !== 'ordine' && (
                      <button
                        onClick={() => onDelete(v.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
