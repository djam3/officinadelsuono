import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Globe, Save, Loader2 } from 'lucide-react';

export function AdminSiteContentPanel() {
  const [siteContent, setSiteContent] = useState<any>({
    hero_badge: 'Sound Engineer Certificato MAT Academy',
    hero_title: 'Massimo SPL. Zero Distorsione.',
    hero_subtitle: 'Setup Ingegnerizzati.',
    hero_body: 'Smetti di sprecare budget in attrezzatura sbilanciata. Progettiamo catene audio su misura per DJ, club ed eventi che esigono qualità acustica assoluta e performance reale.',
    hero_cta1: "Accedi all'Arsenale Pro-Audio",
    hero_cta2: 'Parla con un Sound Engineer',
    features_title: "Oltre il manuale d'istruzioni.",
    features_subtitle: 'I grandi store ti spediscono scatole. Noi ti garantiamo una performance acustica impeccabile.',
    feat1_title: 'Ingegneria, non logistica.',
    feat1_body: 'Calcoliamo impedenze, latenze e acustica prima di farti spendere un solo euro. Progettiamo il tuo suono, non riempiamo il tuo carrello.',
    feat2_title: 'Zero colli di bottiglia.',
    feat2_body: 'Il tuo talento merita un segnale puro. Eliminiamo ogni anello debole della tua catena audio, dai cavi ai convertitori D/A, per un suono cristallino.',
    feat3_title: 'Standard MAT Academy.',
    feat3_body: 'Ogni configurazione rispetta i rigidi protocolli industriali del Pro-Audio. Nessuna improvvisazione, solo certezze matematiche e acustiche.',
  });
  const [isSavingContent, setIsSavingContent] = useState(false);

  useEffect(() => {
    const loadSiteContent = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'site_content'));
        if (snap.exists()) {
          setSiteContent((prev: any) => ({ ...prev, ...snap.data() }));
        }
      } catch (e) {
        console.error('Error loading site content:', e);
      }
    };
    loadSiteContent();
  }, []);

  const handleSaveSiteContent = async () => {
    setIsSavingContent(true);
    try {
      await setDoc(doc(db, 'settings', 'site_content'), { ...siteContent, updatedAt: new Date().toISOString() });
      alert('Contenuti salvati! La home si aggiornerà automaticamente.');
    } catch (e) {
      alert('Errore durante il salvataggio.');
    } finally {
      setIsSavingContent(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2"><Globe className="w-5 h-5 text-brand-orange" /> Contenuti Sito — Home</h2>
            <p className="text-zinc-500 text-sm mt-1">Modifica i testi della homepage. Le modifiche sono visibili in tempo reale dopo il salvataggio.</p>
          </div>
          <button
            onClick={handleSaveSiteContent}
            disabled={isSavingContent}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold transition-colors"
          >
            {isSavingContent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salva Tutto
          </button>
        </div>

        <div className="space-y-8">
          {/* Hero Section */}
          <div className="p-5 bg-zinc-950 rounded-xl border border-white/5">
            <h3 className="font-bold text-brand-orange uppercase tracking-wider text-xs mb-4">🎯 Hero Section</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Badge (testo piccolo sopra il titolo)</label>
                <input type="text" value={siteContent.hero_badge} onChange={e => setSiteContent((p: any) => ({ ...p, hero_badge: e.target.value }))} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Titolo principale</label>
                <input type="text" value={siteContent.hero_title} onChange={e => setSiteContent((p: any) => ({ ...p, hero_title: e.target.value }))} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Sottotitolo (arancione)</label>
                <input type="text" value={siteContent.hero_subtitle} onChange={e => setSiteContent((p: any) => ({ ...p, hero_subtitle: e.target.value }))} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Testo descrittivo</label>
                <textarea value={siteContent.hero_body} onChange={e => setSiteContent((p: any) => ({ ...p, hero_body: e.target.value }))} rows={3} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange resize-none" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Pulsante 1 (arancione)</label>
                <input type="text" value={siteContent.hero_cta1} onChange={e => setSiteContent((p: any) => ({ ...p, hero_cta1: e.target.value }))} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Pulsante 2 (WhatsApp)</label>
                <input type="text" value={siteContent.hero_cta2} onChange={e => setSiteContent((p: any) => ({ ...p, hero_cta2: e.target.value }))} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange" />
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="p-5 bg-zinc-950 rounded-xl border border-white/5">
            <h3 className="font-bold text-brand-orange uppercase tracking-wider text-xs mb-4">⭐ Sezione "Perché sceglierci"</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Titolo sezione</label>
                <input type="text" value={siteContent.features_title} onChange={e => setSiteContent((p: any) => ({ ...p, features_title: e.target.value }))} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Sottotitolo sezione</label>
                <input type="text" value={siteContent.features_subtitle} onChange={e => setSiteContent((p: any) => ({ ...p, features_subtitle: e.target.value }))} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange" />
              </div>
              {[['feat1', 'Card 1'], ['feat2', 'Card 2'], ['feat3', 'Card 3']].map(([key, label]) => (
                <div key={key} className="bg-zinc-900 rounded-xl p-4 border border-white/5">
                  <p className="text-xs font-bold text-zinc-400 mb-3">{label}</p>
                  <input
                    type="text"
                    placeholder="Titolo"
                    value={(siteContent as any)[`${key}_title`]}
                    onChange={e => setSiteContent((p: any) => ({ ...p, [`${key}_title`]: e.target.value }))}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-orange mb-2"
                  />
                  <textarea
                    placeholder="Descrizione"
                    value={(siteContent as any)[`${key}_body`]}
                    onChange={e => setSiteContent((p: any) => ({ ...p, [`${key}_body`]: e.target.value }))}
                    rows={3}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-orange resize-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
