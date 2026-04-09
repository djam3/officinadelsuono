import { useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Loader2, Sparkles, Mail } from 'lucide-react';
import { generateEmailContent } from '../../services/aiService';

import { Product } from '../../types/admin';

interface AdminNewsletterPanelProps {
  products: Product[];
}

export function AdminNewsletterPanel({ products }: AdminNewsletterPanelProps) {
  // Email AI state
  const [emailAiSegment, setEmailAiSegment] = useState<'tutti'|'principianti'|'intermedi'|'pro'|'clienti_recenti'>('tutti');
  const [emailAiResult, setEmailAiResult] = useState<null | { subject: string; preheader: string; bodyHtml: string; bodyText: string }>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [emailPreviewMode, setEmailPreviewMode] = useState<'html'|'text'>('html');

  // Newsletter state
  const [newsletterForm, setNewsletterForm] = useState({ title: '', excerpt: '', url: '' });
  const [isSendingNewsletter, setIsSendingNewsletter] = useState(false);
  const [testEmailMessage, setTestEmailMessage] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    try {
      const response = await fetch('/api/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customMessage: testEmailMessage })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Errore durante l'invio del test");
      }

      alert("Email di test inviata con successo!");
      setTestEmailMessage('');
    } catch (error) {
      console.error("Error sending test email:", error);
      alert(`Errore: ${(error as Error).message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendNewsletter = async () => {
    if (!newsletterForm.title || !newsletterForm.excerpt || !newsletterForm.url) {
      alert("Compila tutti i campi della newsletter.");
      return;
    }

    if (!window.confirm("Sei sicuro di voler inviare questa email a TUTTI gli iscritti?")) {
      return;
    }

    setIsSendingNewsletter(true);
    try {
      // 1. Fetch all subscribers
      const snapshot = await getDocs(collection(db, 'newsletter_subscriptions'));
      const emails = snapshot.docs.map(doc => doc.data().email).filter(Boolean);

      if (emails.length === 0) {
        alert("Nessun iscritto trovato.");
        setIsSendingNewsletter(false);
        return;
      }

      // 2. Send broadcast via API
      const response = await fetch('/api/emails/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails,
          postTitle: newsletterForm.title,
          postExcerpt: newsletterForm.excerpt,
          postUrl: newsletterForm.url
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Errore durante l'invio");
      }

      alert(`Newsletter inviata con successo a ${emails.length} iscritti!`);
      setNewsletterForm({ title: '', excerpt: '', url: '' });
    } catch (error) {
      console.error("Error sending newsletter:", error);
      alert(`Errore: ${(error as Error).message}`);
    } finally {
      setIsSendingNewsletter(false);
    }
  };

  const handleGenerateEmailAI = async () => {
    setIsGeneratingEmail(true);
    setEmailAiResult(null);
    try {
      const featured = products.slice(0, 3).map(p => ({
        name: p.name, price: p.price, description: p.description, category: p.category
      }));
      const result = await generateEmailContent(emailAiSegment, featured, {
        signature: 'Amerigo — Officina del Suono'
      });
      setEmailAiResult(result);
    } catch (err) {
      alert('Errore generazione email: ' + ((err as Error).message || 'Verifica la chiave API Gemini.'));
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden p-6">
      <h2 className="text-xl font-bold mb-6">Invia Newsletter</h2>
      <p className="text-zinc-400 mb-8">
        Compila i campi sottostanti per inviare un'email di notifica a tutti gli iscritti alla newsletter.
        Questa funzione è ideale per annunciare la pubblicazione di un nuovo articolo sul blog.
      </p>

      <div className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-bold text-zinc-400 mb-2">Titolo Articolo</label>
          <input
            type="text"
            value={newsletterForm.title}
            onChange={(e) => setNewsletterForm({ ...newsletterForm, title: e.target.value })}
            placeholder="Es: Come scegliere il primo controller DJ"
            className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-zinc-400 mb-2">Breve Riassunto (Excerpt)</label>
          <textarea
            value={newsletterForm.excerpt}
            onChange={(e) => setNewsletterForm({ ...newsletterForm, excerpt: e.target.value })}
            placeholder="Es: Scopri i migliori controller per iniziare la tua carriera da DJ..."
            rows={4}
            className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-zinc-400 mb-2">Link all'Articolo (URL)</label>
          <input
            type="url"
            value={newsletterForm.url}
            onChange={(e) => setNewsletterForm({ ...newsletterForm, url: e.target.value })}
            placeholder="Es: https://officinadelsuono.it/blog/come-scegliere-controller"
            className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange"
          />
        </div>

        <button
          onClick={handleSendNewsletter}
          disabled={isSendingNewsletter}
          className="w-full bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
        >
          {isSendingNewsletter ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Invio in corso...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Invia a tutti gli iscritti
            </>
          )}
        </button>
      </div>

      <div className="mt-12 pt-8 border-t border-white/10 max-w-2xl">
        <h3 className="text-lg font-bold mb-4">Test Invio Email</h3>
        <p className="text-zinc-400 mb-6 text-sm">
          Usa questa sezione per testare l'invio di un'email con un messaggio personalizzato. L'email verrà inviata a amerigodecristofaro8@gmail.com.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2">Messaggio Personalizzato (Opzionale)</label>
            <textarea
              value={testEmailMessage}
              onChange={(e) => setTestEmailMessage(e.target.value)}
              placeholder="Scrivi qui un messaggio personalizzato da includere nell'email di test..."
              rows={3}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange resize-none"
            />
          </div>
          
          <button
            onClick={handleSendTestEmail}
            disabled={isSendingTest}
            className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            {isSendingTest ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Invio test in corso...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Invia Email di Test
              </>
            )}
          </button>
        </div>
      </div>

      {/* Email AI section */}
      <div className="mt-8 pt-8 border-t border-white/10 max-w-2xl">
        <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-orange" />
          Genera Email con AI
        </h3>
        <p className="text-zinc-400 text-sm mb-6">
          Gemini analizza il tuo catalogo e crea un'email di marketing personalizzata per il segmento scelto.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2">Segmento destinatari</label>
            <select
              value={emailAiSegment}
              onChange={e => setEmailAiSegment(e.target.value as 'tutti' | 'principianti' | 'intermedi' | 'pro' | 'clienti_recenti')}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange"
            >
              <option value="tutti">Tutti gli iscritti</option>
              <option value="principianti">DJ Principianti</option>
              <option value="intermedi">DJ Intermedi</option>
              <option value="pro">DJ Professionisti</option>
              <option value="clienti_recenti">Clienti recenti</option>
            </select>
          </div>

          <button
            onClick={handleGenerateEmailAI}
            disabled={isGeneratingEmail}
            className="w-full py-3 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            {isGeneratingEmail ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generazione in corso...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Genera Email AI</>
            )}
          </button>

          {emailAiResult && (
            <div className="mt-4 bg-zinc-950 border border-brand-orange/30 rounded-xl p-5 space-y-4">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setEmailPreviewMode('html')}
                  className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${emailPreviewMode === 'html' ? 'bg-brand-orange text-white' : 'bg-zinc-800 text-zinc-400'}`}
                >HTML</button>
                <button
                  onClick={() => setEmailPreviewMode('text')}
                  className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${emailPreviewMode === 'text' ? 'bg-brand-orange text-white' : 'bg-zinc-800 text-zinc-400'}`}
                >Testo</button>
              </div>

              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Oggetto</p>
                <p className="text-white font-bold">{emailAiResult.subject}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Preheader</p>
                <p className="text-zinc-300 text-sm">{emailAiResult.preheader}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">Corpo email</p>
                {emailPreviewMode === 'html' ? (
                  <div
                    className="prose prose-invert prose-sm max-w-none bg-white/5 rounded-lg p-4 text-sm"
                    dangerouslySetInnerHTML={{ __html: emailAiResult.bodyHtml }}
                  />
                ) : (
                  <pre className="text-sm text-zinc-300 whitespace-pre-wrap bg-white/5 rounded-lg p-4 font-mono">
                    {emailAiResult.bodyText}
                  </pre>
                )}
              </div>
              <button
                onClick={() => {
                  setNewsletterForm({
                    title: emailAiResult.subject,
                    excerpt: emailAiResult.preheader,
                    url: ''
                  });
                  setEmailAiResult(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-sm transition-colors"
              >
                Usa come Newsletter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
