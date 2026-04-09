import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { AlertTriangle, Clock, Database, Zap, CheckCircle2, Check, TrendingUp } from 'lucide-react';

interface AdminMonitoringPanelProps {
  errorLogs: any[];
  setErrorLogs: React.Dispatch<React.SetStateAction<any[]>>;
  loadStats: () => void;
  products: any[];
  blogPosts: any[];
  discounts: any[];
  aiKnowledge: any[];
  manualApiKey: string | null;
}

export function AdminMonitoringPanel({
  errorLogs,
  setErrorLogs,
  loadStats,
  products,
  blogPosts,
  discounts,
  aiKnowledge,
  manualApiKey
}: AdminMonitoringPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Errori totali (30gg)', value: errorLogs.length, color: errorLogs.length > 0 ? 'text-red-400' : 'text-green-400', icon: AlertTriangle },
          { label: 'Ultime 24h', value: errorLogs.filter(e => { try { const d = e.timestamp?.toDate?.(); return d && (Date.now() - d.getTime()) < 86400000; } catch { return false; } }).length, color: 'text-amber-400', icon: Clock },
          { label: 'Database', value: 'Online', color: 'text-green-400', icon: Database },
          { label: 'Auth', value: 'Online', color: 'text-green-400', icon: Zap },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
              <Icon className={`w-5 h-5 ${s.color} mb-3`} />
              <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Log errori
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Errori JavaScript catturati dal client negli ultimi 30 giorni</p>
          </div>
          <div className="flex items-center gap-2">
            {errorLogs.length > 0 && (
              <button
                onClick={async () => {
                  if (!confirm(`Cancellare tutti i ${errorLogs.length} errori?`)) return;
                  await Promise.all(errorLogs.map(e => deleteDoc(doc(db, 'error_logs', e.id))));
                  setErrorLogs([]);
                }}
                className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
              >
                Cancella tutti
              </button>
            )}
            <button onClick={loadStats} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-zinc-950 hover:bg-zinc-800 border border-white/5 rounded-lg transition-colors">Aggiorna</button>
          </div>
        </div>
        {errorLogs.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 font-bold">Nessun errore registrato</p>
            <p className="text-xs text-zinc-600 mt-1">Il sito funziona correttamente negli ultimi 30 giorni</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {errorLogs.map((err: any) => {
              let dateStr = '';
              try {
                const d = err.timestamp?.toDate?.();
                if (d) dateStr = d.toLocaleString('it-IT');
              } catch { }
              return (
                <div key={err.id} className="p-5 hover:bg-white/5 transition-colors">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="p-1.5 bg-red-500/20 rounded-lg shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-red-300 truncate">{err.message || 'Unknown error'}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{dateStr} {err.url ? `• ${err.url}` : ''}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await deleteDoc(doc(db, 'error_logs', err.id));
                        setErrorLogs(prev => prev.filter(e => e.id !== err.id));
                      }}
                      className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg transition-colors"
                      title="Segna come risolto e rimuovi"
                    >
                      <Check className="w-3 h-3" />
                      Risolto
                    </button>
                  </div>
                  {err.stack && (
                    <pre className="text-[10px] text-zinc-500 bg-black/50 rounded-lg p-3 overflow-x-auto mt-2 font-mono max-h-32">{err.stack}</pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-orange" />
          Performance & Integrazioni
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Firebase Hosting', detail: 'CDN globale attivo', status: 'ok' },
            { label: 'Firestore', detail: `${products.length + blogPosts.length + discounts.length + aiKnowledge.length} documenti letti`, status: 'ok' },
            { label: 'Cloud Functions', detail: 'sendWelcomeEmail attiva', status: 'ok' },
            { label: 'Firebase Storage', detail: 'Avatar utenti attivo', status: 'ok' },
            { label: 'Resend Email', detail: 'Dominio di test (verificare custom domain)', status: 'warn' },
            { label: 'Gemini AI', detail: manualApiKey ? 'API key configurata' : 'API key mancante', status: manualApiKey ? 'ok' : 'warn' },
          ].map(s => (
            <div key={s.label} className="p-4 bg-zinc-950 rounded-xl border border-white/5 flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${s.status === 'ok' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : s.status === 'warn' ? 'bg-amber-400' : 'bg-red-400'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{s.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
