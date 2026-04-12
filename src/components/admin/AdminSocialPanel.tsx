import { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { callClaude } from '../../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, WifiOff, BarChart3, RefreshCw, Send, Wand2, Sparkles, 
  ImagePlus, Loader2, CalendarDays, Heart, MessageSquare, Eye, 
  ThumbsUp, ThumbsDown, X 
} from 'lucide-react';
import { SocialPost, SocialSuggestion, SocialConnection, SocialStats, Product } from '../../types/admin';

interface AdminSocialPanelProps {
  socialPosts: SocialPost[];
  socialSuggestions: SocialSuggestion[];
  socialConnections: Record<string, SocialConnection>;
  socialStats: SocialStats;
  manualApiKey: string | null;
  products: Product[];
  loadSocialData: () => void;
}

const PLATFORMS = [
  {
    key: 'instagram',
    name: 'Instagram',
    color: 'from-purple-600 via-pink-600 to-orange-500',
    bg: 'bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-orange-500/10',
    border: 'border-pink-500/20',
    badge: 'IG',
    maxChars: 2200,
    note: 'Richiede account Business + Meta App',
  },
  {
    key: 'facebook',
    name: 'Facebook',
    color: 'from-blue-600 to-blue-500',
    bg: 'bg-blue-600/10',
    border: 'border-blue-500/20',
    badge: 'FB',
    maxChars: 63206,
    note: 'Richiede Facebook Page + Access Token',
  },
  {
    key: 'tiktok',
    name: 'TikTok',
    color: 'from-zinc-900 to-zinc-800',
    bg: 'bg-zinc-800/50',
    border: 'border-white/10',
    badge: 'TK',
    maxChars: 150,
    note: 'Richiede TikTok Developer App',
  },
];

export function AdminSocialPanel({
  socialPosts,
  socialSuggestions,
  socialConnections,
  socialStats,
  manualApiKey,
  products,
  loadSocialData
}: AdminSocialPanelProps) {
  const [socialToast, setSocialToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [connectGuide, setConnectGuide] = useState<string | null>(null);
  const [postDraft, setPostDraft] = useState({ text: '', imageUrl: '' });
  const [postPlatforms, setPostPlatforms] = useState<string[]>(['instagram', 'facebook', 'tiktok']);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isLoadingSocialStats, setIsLoadingSocialStats] = useState(false);

  const showSocialToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setSocialToast({ msg, type });
    setTimeout(() => setSocialToast(null), 4000);
  };

  const publishPost = async () => {
    if (!postDraft.text.trim() || postPlatforms.length === 0) return;
    setIsPublishing(true);
    try {
      const postRef = await addDoc(collection(db, 'social_posts'), {
        text: postDraft.text,
        imageUrl: postDraft.imageUrl || null,
        platforms: postPlatforms,
        status: 'publishing',
        createdAt: serverTimestamp(),
      });

      const fnUrl = 'https://us-central1-officinadelsuono-87986.cloudfunctions.net/publishToSocial';
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: postDraft.text, imageUrl: postDraft.imageUrl, platforms: postPlatforms, postId: postRef.id }),
      });
      const data = await res.json();

      if (data.success || Object.keys(data.results || {}).length > 0) {
        showSocialToast(`Post pubblicato su: ${Object.keys(data.results).join(', ')} ✓`);
        setPostDraft({ text: '', imageUrl: '' });
        loadSocialData();
      } else {
        const errMsg = Object.values(data.errors || {}).join(' | ');
        showSocialToast(`Errore pubblicazione: ${errMsg || 'Account non configurati'}`, 'error');
      }
    } catch (e) {
      showSocialToast('Errore: ' + (e as Error).message, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const publishSuggestion = async (sug: SocialSuggestion) => {
    setPostDraft({ text: `${sug.caption}\n\n${(sug.hashtags || []).map((h: string) => `#${h}`).join(' ')}`, imageUrl: '' });
    setPostPlatforms(sug.platforms || ['instagram', 'facebook']);
    await updateDoc(doc(db, 'social_suggestions', sug.id), { status: 'approved' });
    showSocialToast('Suggerimento caricato nel composer. Modifica e pubblica!');
  };

  const rejectSuggestion = async (id: string) => {
    await updateDoc(doc(db, 'social_suggestions', id), { status: 'rejected' }).catch(() => { });
  };

  const generateAISuggestions = async () => {
    setIsGeneratingSuggestions(true);
    try {
      const productList = products.slice(0, 15).map(p => `${p.name} — €${p.price} (${p.category})`).join('\n');

      const prompt = `Sei un esperto di social media marketing per "Officina del Suono", negozio DJ professionale italiano certificato MAT Academy.

Prodotti in catalogo:
${productList || 'Controller DJ, Mixer, Cuffie Pioneer, Monitor da Studio'}

Genera 3 post social media in italiano con angoli diversi:
1. PRODOTTO: highlight di un prodotto specifico con call-to-action
2. EDUCATIONAL: consiglio tecnico o tip per DJ professionisti
3. ENGAGEMENT: domanda o contenuto che stimola commenti dalla community DJ

Per ogni post fornisci SOLO questo JSON (nessun testo extra):
[
  {
    "caption": "testo del post max 300 caratteri, emoji incluse, coinvolgente",
    "hashtags": ["hashtag1","hashtag2","hashtag3","hashtag4","hashtag5"],
    "platforms": ["instagram","facebook"],
    "angle": "product",
    "reasoning": "perché questo post funziona in max 1 frase"
  }
]`;

      const rawText = await callClaude(prompt, { maxTokens: 1024 });
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('JSON non valido nella risposta AI');
      const suggestions = JSON.parse(jsonMatch[0]);

      for (const s of suggestions) {
        await addDoc(collection(db, 'social_suggestions'), {
          ...s,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
      }
      loadSocialData();
      showSocialToast(`${suggestions.length} suggerimenti AI generati ✓`);
    } catch (e) {
      showSocialToast('Errore generazione AI: ' + (e as Error).message, 'error');
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const refreshSocialStats = async () => {
    setIsLoadingSocialStats(true);
    try {
      const fnUrl = 'https://us-central1-officinadelsuono-87986.cloudfunctions.net/fetchSocialStats';
      const res = await fetch(fnUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (res.ok) {
        showSocialToast('Statistiche aggiornate ✓');
      }
    } catch {
      showSocialToast('Errore durante l\'aggiornamento statistiche', 'error');
    } finally {
      setIsLoadingSocialStats(false);
    }
  };

  const PlatformBadge = ({ k, size = 'sm' }: { k: string; size?: 'sm' | 'md' | 'lg' }) => {
    const p = PLATFORMS.find(p => p.key === k);
    if (!p) return null;
    const sizes = { sm: 'w-6 h-6 text-[10px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' };
    return (
      <div className={`${sizes[size]} rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center text-white font-black shrink-0`}>
        {p.badge}
      </div>
    );
  };

  const pendingSuggestions = socialSuggestions.filter(s => s.status === 'pending');
  const minCharLimit = Math.min(...postPlatforms.map(pk => PLATFORMS.find(p => p.key === pk)?.maxChars || 2200));
  const charCount = postDraft.text.length;
  const charColor = charCount > minCharLimit ? 'text-red-400' : charCount > minCharLimit * 0.85 ? 'text-amber-400' : 'text-zinc-500';

  return (
    <div className="space-y-6">
      {/* Platform connections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLATFORMS.map(p => {
          const conn = (socialConnections[p.key] || { connected: false }) as SocialConnection;
          const isConnected = conn.connected === true;
          return (
            <div key={p.key} className={`bg-zinc-900 border ${p.border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <PlatformBadge k={p.key} size="md" />
                  <div>
                    <p className="font-black text-sm">{p.name}</p>
                    <p className="text-[10px] text-zinc-500">{conn.accountName || 'Non configurato'}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${isConnected ? 'text-green-400' : 'text-zinc-600'}`}>
                  {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isConnected ? 'Collegato' : 'Offline'}
                </div>
              </div>
              {isConnected && conn.followers != null && (
                <p className="text-2xl font-black text-white mb-1">{conn.followers.toLocaleString('it-IT')}<span className="text-xs text-zinc-500 font-normal ml-1">follower</span></p>
              )}
              <button
                onClick={() => setConnectGuide(p.key)}
                className="w-full mt-3 py-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-white/5"
              >
                {isConnected ? 'Aggiorna Token' : 'Come Collegare'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-orange" />
            <h3 className="font-black text-sm">Statistiche Social</h3>
            {socialStats?.updatedAt && <span className="text-[10px] text-zinc-600">aggiornate {new Date(socialStats.updatedAt?.seconds ? socialStats.updatedAt.seconds * 1000 : socialStats.updatedAt).toLocaleDateString('it-IT')}</span>}
          </div>
          <button onClick={refreshSocialStats} disabled={isLoadingSocialStats} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3 h-3 ${isLoadingSocialStats ? 'animate-spin' : ''}`} /> Aggiorna
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Follower IG', value: socialStats?.instagram?.followers ?? '—', icon: <PlatformBadge k="instagram" size="sm" /> },
            { label: 'Follower FB', value: socialStats?.facebook?.followers ?? '—', icon: <PlatformBadge k="facebook" size="sm" /> },
            { label: 'Post pubblicati', value: socialPosts.filter(p => p.status === 'published').length, icon: <Send className="w-4 h-4 text-brand-orange" /> },
            { label: 'Suggerimenti AI', value: pendingSuggestions.length, icon: <Wand2 className="w-4 h-4 text-purple-400" /> },
          ].map(s => (
            <div key={s.label} className="bg-zinc-800/50 rounded-xl p-3 flex items-center gap-3">
              {s.icon}
              <div>
                <p className="text-xl font-black text-white">{typeof s.value === 'number' ? s.value.toLocaleString('it-IT') : s.value}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Composer + AI Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Post Composer */}
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Send className="w-4 h-4 text-brand-orange" />
            <h3 className="font-black text-base">Composer</h3>
          </div>

          <div className="flex gap-2 mb-4">
            {PLATFORMS.map(p => (
              <button
                key={p.key}
                onClick={() => setPostPlatforms(prev => prev.includes(p.key) ? prev.filter(x => x !== p.key) : [...prev, p.key])}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${postPlatforms.includes(p.key) ? `bg-gradient-to-br ${p.color} border-transparent text-white` : 'bg-zinc-800 border-white/5 text-zinc-500 hover:text-white'}`}
              >
                {p.badge} {p.name}
              </button>
            ))}
          </div>

          <div className="relative mb-3">
            <textarea
              rows={6}
              value={postDraft.text}
              onChange={e => setPostDraft(p => ({ ...p, text: e.target.value }))}
              placeholder="Scrivi il tuo post... puoi incollare un suggerimento AI oppure scrivere da zero."
              className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white resize-none focus:outline-none focus:border-brand-orange leading-relaxed"
            />
            <span className={`absolute bottom-3 right-3 text-[10px] font-bold ${charColor}`}>{charCount}/{minCharLimit}</span>
          </div>

          <div className="flex gap-2 mb-4">
            <div className="flex-1 flex items-center gap-2 bg-zinc-800 border border-white/10 rounded-xl px-3 py-2">
              <ImagePlus className="w-4 h-4 text-zinc-500 shrink-0" />
              <input
                value={postDraft.imageUrl}
                onChange={e => setPostDraft(p => ({ ...p, imageUrl: e.target.value }))}
                placeholder="URL immagine (opzionale)"
                className="flex-1 bg-transparent text-sm text-white focus:outline-none"
              />
            </div>
            {postDraft.imageUrl && (
              <img src={postDraft.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
          </div>

          <button
            onClick={publishPost}
            disabled={isPublishing || !postDraft.text.trim() || postPlatforms.length === 0 || charCount > minCharLimit}
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-black text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isPublishing ? 'Pubblicazione in corso...' : `Pubblica su ${postPlatforms.length} piattaform${postPlatforms.length === 1 ? 'a' : 'e'}`}
          </button>
        </div>

        {/* AI Suggestions */}
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-400" />
              <h3 className="font-black text-base">Suggerimenti AI</h3>
            </div>
            <button
              onClick={generateAISuggestions}
              disabled={isGeneratingSuggestions}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/20 rounded-xl text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
            >
              {isGeneratingSuggestions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isGeneratingSuggestions ? 'Generazione...' : 'Genera con AI'}
            </button>
          </div>

          {pendingSuggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Sparkles className="w-8 h-8 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">Nessun suggerimento in attesa.</p>
              <p className="text-xs text-zinc-600 mt-1">Clicca "Genera con AI" per creare post ottimizzati per i tuoi prodotti.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {pendingSuggestions.map(sug => {
                const angleColors: Record<string, string> = { product: 'text-brand-orange bg-brand-orange/10 border-brand-orange/20', educational: 'text-blue-400 bg-blue-500/10 border-blue-500/20', engagement: 'text-green-400 bg-green-500/10 border-green-500/20', promotional: 'text-pink-400 bg-pink-500/10 border-pink-500/20' };
                const angleLabels: Record<string, string> = { product: 'Prodotto', educational: 'Educational', engagement: 'Engagement', promotional: 'Promo' };
                const ac = angleColors[sug.angle] || 'text-zinc-400 bg-zinc-800 border-white/5';
                const al = angleLabels[sug.angle] || sug.angle;
                return (
                  <div key={sug.id} className="bg-zinc-800/50 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${ac}`}>{al}</span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed mb-2 line-clamp-3">{sug.caption}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => publishSuggestion(sug)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-brand-orange/90 hover:bg-brand-orange text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        <ThumbsUp className="w-3 h-3" /> Usa nel Composer
                      </button>
                      <button
                        onClick={() => rejectSuggestion(sug.id)}
                        className="px-3 py-2 bg-zinc-700 hover:bg-red-500/20 border border-white/5 hover:border-red-500/20 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent posts */}
      {socialPosts.length > 0 && (
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays className="w-4 h-4 text-brand-orange" />
            <h3 className="font-black text-base">Post Recenti</h3>
          </div>
          <div className="space-y-3">
            {socialPosts.slice(0, 8).map(post => (
              <div key={post.id} className="flex items-start gap-4 bg-zinc-800/50 rounded-xl p-4">
                {post.imageUrl && (
                  <img src={post.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/10" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 line-clamp-2 mb-2">{post.text}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex gap-1">
                      {(post.platforms || []).map((pk: string) => <PlatformBadge key={pk} k={pk} size="sm" />)}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                      post.status === 'published' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                      post.status === 'failed' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                      'text-zinc-500 bg-zinc-800 border-white/5'
                    }`}>
                      {post.status === 'published' ? 'Pubblicato' : post.status === 'failed' ? 'Fallito' : post.status}
                    </span>
                    {post.publishedAt && (
                      <span className="text-[10px] text-zinc-600">
                        {new Date(post.publishedAt?.seconds ? post.publishedAt.seconds * 1000 : post.publishedAt).toLocaleDateString('it-IT')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {socialToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 border rounded-xl text-sm font-bold text-white shadow-2xl ${socialToast.type === 'error' ? 'bg-red-950 border-red-500/30' : 'bg-zinc-800 border-white/10'}`}
          >
            {socialToast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Guide Modal */}
      <AnimatePresence>
        {connectGuide && (() => {
          const p = PLATFORMS.find(p => p.key === connectGuide)!;
          const guides: Record<string, { steps: string[]; secrets: string[] }> = {
            facebook: {
              steps: [
                '1. Vai su developers.facebook.com e crea una App (tipo "Business")',
                '2. Aggiungi il prodotto "Facebook Login for Business"',
                '3. Nel Graph API Explorer genera un Page Access Token per la tua Pagina',
                '4. Converti in long-lived token (60 giorni) tramite GET /oauth/access_token',
                '5. Copia il Page ID dalla URL della tua Pagina Facebook',
                '6. Imposta i secrets nel Cloud Functions (vedi comandi sotto)',
              ],
              secrets: [
                'echo "TUO_ACCESS_TOKEN" | firebase functions:secrets:set META_ACCESS_TOKEN',
                'echo "TUO_PAGE_ID" | firebase functions:secrets:set META_PAGE_ID',
              ],
            },
            instagram: {
              steps: [
                '1. Il tuo account Instagram DEVE essere Professional (Business o Creator)',
                '2. Collegalo alla tua Pagina Facebook',
                '3. Con la stessa Meta App e lo stesso Access Token di Facebook',
                '4. Trova il tuo IG User ID: GET /me/accounts e cerca instagram_business_account',
                '5. Copia l\'ID e impostalo come secret',
              ],
              secrets: [
                'echo "TUO_IG_USER_ID" | firebase functions:secrets:set META_IG_USER_ID',
                '(META_ACCESS_TOKEN è lo stesso usato per Facebook)',
              ],
            },
            tiktok: {
              steps: [
                '1. Vai su developers.tiktok.com e crea un\'app Developer',
                '2. Richiedi le scope: video.publish, video.upload, user.info.basic',
                '3. Completa il flusso OAuth e ottieni l\'access token',
                '4. TikTok richiede video o slideshow — post solo testo sono limitati agli account selezionati',
                '5. Imposta il secret con il comando sotto',
              ],
              secrets: [
                'echo "TUO_TIKTOK_TOKEN" | firebase functions:secrets:set TIKTOK_ACCESS_TOKEN',
              ],
            },
          };
          const g = guides[connectGuide];
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setConnectGuide(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <PlatformBadge k={connectGuide} size="md" />
                    <h3 className="font-black text-lg">Come collegare {p.name}</h3>
                  </div>
                  <button onClick={() => setConnectGuide(null)} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-2 mb-5">
                  {g.steps.map((step, i) => (
                    <p key={i} className="text-sm text-zinc-400 leading-relaxed">{step}</p>
                  ))}
                </div>
                <div className="bg-zinc-950 rounded-xl p-4 border border-white/5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">Comandi da terminale (nella cartella progetto)</p>
                  {g.secrets.map((cmd, i) => (
                    <p key={i} className="text-xs text-green-400 font-mono mb-1">{cmd}</p>
                  ))}
                </div>
                <p className="text-xs text-zinc-600 mt-4">{p.note}</p>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
