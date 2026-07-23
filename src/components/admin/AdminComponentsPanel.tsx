import { useState, useEffect } from 'react';
import {
  Plus, Save, X, Trash2, Loader2, Speaker, FileText, Upload, Download, Pencil, ClipboardPaste,
} from 'lucide-react';
import { subscribeDrivers, saveDriver, deleteDriver, emptyDriver } from '../../services/driverLibrary';
import { DRIVERS } from '../../data/speakerDatabase';
import type { SpeakerDriver, DriverType } from '../../types/speaker';

const TYPES: DriverType[] = ['subwoofer', 'woofer', 'mid-bass', 'midrange', 'full-range', 'coaxial', 'tweeter'];

// ─── Riconoscimento parametri da testo libero (BassBox / datasheet) ──────────
const TS_PATTERNS: { key: string; path: string; aliases: string[] }[] = [
  { key: 'Fs', path: 'ts.fs', aliases: ['fs'] },
  { key: 'Qts', path: 'ts.qts', aliases: ['qts'] },
  { key: 'Qes', path: 'ts.qes', aliases: ['qes'] },
  { key: 'Qms', path: 'ts.qms', aliases: ['qms'] },
  { key: 'Vas', path: 'ts.vas', aliases: ['vas'] },
  { key: 'Xmax', path: 'ts.xmax', aliases: ['xmax', 'x-max', 'x max'] },
  { key: 'Sd', path: 'ts.sd', aliases: ['sd'] },
  { key: 'Re', path: 'ts.re', aliases: ['revc', 'dcr', 're'] },
  { key: 'Le', path: 'ts.le', aliases: ['le'] },
  { key: 'Bl', path: 'ts.bl', aliases: ['bl'] },
  { key: 'Mms', path: 'ts.mms', aliases: ['mms'] },
  { key: 'Sensibilità', path: 'sensitivity', aliases: ['sensitivity', 'sensibilita', 'sensibilità', 'spl'] },
  { key: 'Impedenza', path: 'impedance', aliases: ['impedenza nominale', 'nominal impedance', 'impedenza', 'impedance', 'znom'] },
  { key: 'Potenza', path: 'powerRMS', aliases: ['power handling', 'potenza rms', 'rms power', 'nominal power', 'aes'] },
];

function parseTSText(text: string): { path: string; key: string; value: number }[] {
  const out: { path: string; key: string; value: number }[] = [];
  for (const p of TS_PATTERNS) {
    for (const alias of p.aliases) {
      const esc = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      const re = new RegExp(`(?:^|[^a-z])${esc}\\b[^0-9\\-]{0,14}(-?\\d+(?:[.,]\\d+)?)\\s*(m²|m2|cm²|cm2)?`, 'i');
      const m = text.match(re);
      if (m) {
        let v = parseFloat(m[1].replace(',', '.'));
        if (p.path === 'ts.sd' && (m[2] === 'm²' || m[2] === 'm2')) v *= 1e4; // m² → cm²
        if (Number.isFinite(v)) { out.push({ path: p.path, key: p.key, value: v }); break; }
      }
    }
  }
  return out;
}

export function AdminComponentsPanel() {
  const [drivers, setDrivers] = useState<SpeakerDriver[]>([]);
  const [fromDb, setFromDb] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SpeakerDriver | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paste, setPaste] = useState('');
  const [showPaste, setShowPaste] = useState(false);

  useEffect(() => subscribeDrivers((list, db) => { setDrivers(list); setFromDb(db); setLoading(false); }), []);

  const startNew = () => setEditing(emptyDriver());
  const startEdit = (d: SpeakerDriver) => setEditing(JSON.parse(JSON.stringify(d)));

  const setField = (path: string, value: any) => {
    setEditing(prev => {
      if (!prev) return prev;
      const next = { ...prev } as any;
      if (path.startsWith('ts.')) next.thielSmall = { ...next.thielSmall, [path.slice(3)]: value };
      else if (path.startsWith('fr.')) next.frequencyRange = { ...next.frequencyRange, [path.slice(3)]: value };
      else next[path] = value;
      return next;
    });
  };

  const applyPaste = () => {
    const found = parseTSText(paste);
    if (!found.length) { alert('Nessun parametro riconosciuto nel testo incollato.'); return; }
    setEditing(prev => {
      if (!prev) return prev;
      const next = { ...prev, thielSmall: { ...prev.thielSmall } } as any;
      for (const f of found) {
        if (f.path.startsWith('ts.')) next.thielSmall[f.path.slice(3)] = f.value;
        else next[f.path] = f.value;
      }
      // Qts derivato se mancante ma Qes+Qms presenti
      const t = next.thielSmall;
      if ((!t.qts || t.qts === 0) && t.qes > 0 && t.qms > 0) {
        t.qts = Math.round(((t.qms * t.qes) / (t.qms + t.qes)) * 1000) / 1000;
      }
      return next;
    });
    alert('Parametri riconosciuti: ' + found.map(f => f.key).join(', ') + '. Controlla i campi prima di salvare.');
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.brand.trim() || !editing.model.trim()) { alert('Inserisci marca e modello.'); return; }
    setSaving(true);
    try { await saveDriver(editing); setEditing(null); }
    catch (e) { console.error(e); alert('Errore salvataggio.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo componente?')) return;
    try { await deleteDriver(id); } catch (e) { console.error(e); alert('Errore eliminazione.'); }
  };

  const importBuiltins = async () => {
    if (!confirm('Importare il catalogo integrato (' + DRIVERS.length + ' driver) in modo da poterli gestire?')) return;
    setSaving(true);
    try { for (const d of DRIVERS) await saveDriver(d); }
    catch (e) { console.error(e); alert('Errore importazione.'); }
    finally { setSaving(false); }
  };

  const uploadDatasheet = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('upload failed');
      const { urls } = await res.json();
      if (urls?.[0]) setField('datasheet', urls[0]);
    } catch (e) { console.error(e); alert('Errore caricamento scheda.'); }
    finally { setUploading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-orange" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><Speaker className="w-5 h-5 text-brand-orange" /> Componenti & Schede Tecniche</h2>
          <p className="text-xs text-zinc-500 mt-1">Carica woofer, driver, tweeter ecc. con i parametri Thiele-Small. Il sito li usa per i calcoli del box e dell'amplificatore.</p>
        </div>
        <div className="flex gap-2">
          {!fromDb && <button onClick={importBuiltins} disabled={saving} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm font-bold border border-white/10"><Download className="w-4 h-4" /> Importa catalogo</button>}
          <button onClick={startNew} className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold"><Plus className="w-4 h-4" /> Nuovo componente</button>
        </div>
      </div>

      {!fromDb && (
        <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          Stai vedendo il <strong>catalogo integrato</strong> ({DRIVERS.length} driver). Importalo o aggiungi i tuoi componenti per gestirli e usarli nei calcoli.
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {drivers.map(d => (
          <div key={d.id} className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{d.size}" {d.brand} {d.model}</span>
                <span className="text-[10px] uppercase tracking-wider bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded-full">{d.type}</span>
                {d.datasheet && <a href={d.datasheet} target="_blank" rel="noreferrer" className="text-[10px] text-zinc-400 hover:text-brand-orange flex items-center gap-1"><FileText className="w-3 h-3" /> scheda</a>}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Fs {d.thielSmall.fs}Hz · Qts {d.thielSmall.qts} · Vas {d.thielSmall.vas}L · {d.powerRMS}W · {d.impedance}Ω</div>
            </div>
            {fromDb && (
              <div className="flex gap-2">
                <button onClick={() => startEdit(d)} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(d.id)} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Editor */}
      {editing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editing.brand ? `${editing.brand} ${editing.model}` : 'Nuovo componente'}</h3>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-zinc-500" /></button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="Marca" value={editing.brand} onChange={v => setField('brand', v)} text />
              <Field label="Modello" value={editing.model} onChange={v => setField('model', v)} text />
              <Sel label="Tipo" value={editing.type} onChange={v => setField('type', v)} options={TYPES} />
              <Field label="Dimensione (pollici)" value={editing.size} onChange={v => setField('size', v)} />
              <Field label="Impedenza (Ω)" value={editing.impedance} onChange={v => setField('impedance', v)} />
              <Field label="Sensibilità (dB)" value={editing.sensitivity} onChange={v => setField('sensitivity', v)} />
              <Field label="Potenza RMS (W)" value={editing.powerRMS} onChange={v => setField('powerRMS', v)} />
              <Field label="Potenza picco (W)" value={editing.powerPeak} onChange={v => setField('powerPeak', v)} />
              <Field label="Prezzo acquisto (€)" value={editing.price} onChange={v => setField('price', v)} />
            </div>

            <div className="mt-5">
              <button onClick={() => setShowPaste(s => !s)}
                className="flex items-center gap-2 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg px-3 py-2">
                <ClipboardPaste className="w-4 h-4 text-brand-orange" /> Incolla parametri da BassBox / datasheet
              </button>
              {showPaste && (
                <div className="mt-2 space-y-2">
                  <textarea rows={4} value={paste} onChange={e => setPaste(e.target.value)}
                    placeholder={'Incolla qui il testo con i parametri, es.:\nFs 35 Hz · Qts 0.24 · Qes 0.26 · Qms 5 · Vas 112 l · Xmax 12 mm · Sd 855 cm² · Re 5.1 Ω · Le 1.5 mH · Bl 33 · Mms 254 g · SPL 97 dB'}
                    className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand-orange resize-y" />
                  <button onClick={applyPaste}
                    className="text-xs font-bold bg-brand-orange hover:bg-orange-600 text-white rounded-lg px-3 py-2">
                    Riconosci e compila i campi
                  </button>
                </div>
              )}
            </div>

            <div className="text-[10px] font-black uppercase tracking-widest text-brand-orange mt-5 mb-2">Parametri Thiele-Small (dalla scheda)</div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              <Field label="Fs (Hz)" value={editing.thielSmall.fs} onChange={v => setField('ts.fs', v)} />
              <Field label="Qts" value={editing.thielSmall.qts} onChange={v => setField('ts.qts', v)} />
              <Field label="Qes" value={editing.thielSmall.qes} onChange={v => setField('ts.qes', v)} />
              <Field label="Qms" value={editing.thielSmall.qms} onChange={v => setField('ts.qms', v)} />
              <Field label="Vas (L)" value={editing.thielSmall.vas} onChange={v => setField('ts.vas', v)} />
              <Field label="Sd (cm²)" value={editing.thielSmall.sd} onChange={v => setField('ts.sd', v)} />
              <Field label="Xmax (mm)" value={editing.thielSmall.xmax} onChange={v => setField('ts.xmax', v)} />
              <Field label="Re (Ω)" value={editing.thielSmall.re} onChange={v => setField('ts.re', v)} />
              <Field label="Le (mH)" value={editing.thielSmall.le ?? 0} onChange={v => setField('ts.le', v)} />
              <Field label="BL (T·m)" value={editing.thielSmall.bl} onChange={v => setField('ts.bl', v)} />
              <Field label="Mms (g)" value={editing.thielSmall.mms} onChange={v => setField('ts.mms', v)} />
            </div>

            <div className="text-[10px] font-black uppercase tracking-widest text-brand-orange mt-5 mb-2">Scheda tecnica & immagine</div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex gap-2 items-end">
                <Field label="URL scheda tecnica (PDF)" value={editing.datasheet ?? ''} onChange={v => setField('datasheet', v)} text full />
                <label className="shrink-0 cursor-pointer flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-xs font-bold border border-white/10">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Carica PDF
                  <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadDatasheet(e.target.files[0])} />
                </label>
              </div>
              <Field label="URL immagine prodotto (opzionale)" value={editing.image ?? ''} onChange={v => setField('image', v)} text full />
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-white/5 pt-4">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Annulla</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, text, full }: { label: string; value: string | number; onChange: (v: any) => void; text?: boolean; full?: boolean }) {
  return (
    <label className={`block ${full ? 'flex-1' : ''}`}>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
      <input
        type={text ? 'text' : 'number'}
        step="any"
        value={value}
        onChange={e => onChange(text ? e.target.value : (e.target.value === '' ? 0 : Number(e.target.value)))}
        className="mt-1 w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
      />
    </label>
  );
}

function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: any) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="mt-1 w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
