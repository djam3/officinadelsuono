import { Users as UsersIcon, CheckCircle2, TrendingUp, Mail, Loader2, User as UserIcon } from 'lucide-react';

interface AdminUsersPanelProps {
  registeredUsers: any[];
  newsletterCount: number;
  loadStats: () => void;
}

export function AdminUsersPanel({ registeredUsers, newsletterCount, loadStats }: AdminUsersPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Totale registrati', value: registeredUsers.length, color: 'text-brand-orange', icon: UsersIcon },
          { label: 'Email verificate', value: registeredUsers.filter((u: any) => u.emailVerified).length, color: 'text-green-400', icon: CheckCircle2 },
          { label: 'Ultimi 7 giorni', value: registeredUsers.filter((u: any) => { try { const d = u.createdAt?.toDate?.() || new Date(u.createdAt); return d && (Date.now() - d.getTime()) < 7 * 86400000; } catch { return false; } }).length, color: 'text-blue-400', icon: TrendingUp },
          { label: 'Iscritti newsletter', value: newsletterCount, color: 'text-purple-400', icon: Mail },
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
            <h3 className="text-lg font-bold">Clienti registrati</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Ultimi {registeredUsers.length} utenti dalla collezione <code className="text-brand-orange">users</code></p>
          </div>
          <button onClick={loadStats} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Ricarica">
            <Loader2 className="w-4 h-4" />
          </button>
        </div>
        {registeredUsers.length === 0 ? (
          <div className="p-12 text-center text-zinc-600 text-sm">
            Nessun utente registrato o la collezione <code className="text-brand-orange">users</code> non è popolata.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-6 py-3 text-left">Utente</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Stato</th>
                  <th className="px-6 py-3 text-left">Registrato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {registeredUsers.map((u: any) => {
                  let dateStr = '—';
                  try {
                    const d = u.createdAt?.toDate?.() || (u.createdAt ? new Date(u.createdAt) : null);
                    if (d) dateStr = d.toLocaleDateString('it-IT');
                  } catch { }
                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-brand-orange" />
                            </div>
                          )}
                          <span className="font-bold">{u.displayName || u.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{u.email || '—'}</td>
                      <td className="px-6 py-4">
                        {u.emailVerified ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full uppercase">Verificato</span>
                        ) : (
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full uppercase">In attesa</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-xs">{dateStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
