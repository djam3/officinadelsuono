/**
 * Shared AI service — Groq (Llama 3.3 70B, gratuito) per tutte le funzioni AI.
 * API key letta da localStorage (set by admin) o env variable come fallback.
 */
import Groq from 'groq-sdk';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ─── Key management ───────────────────────────────────────────────────────────

let _cachedKey: string | null = null;

const getEnvKey = () =>
  ((import.meta as unknown) as { env?: Record<string, string> }).env?.VITE_GROQ_API_KEY;

export async function getAIKey(): Promise<string | null> {
  // 1. localStorage
  const local = localStorage.getItem('groq_api_key');
  if (local) return local;

  // 2. In-memory cache
  if (_cachedKey) return _cachedKey;

  // 3. Env variable
  const fromEnv = getEnvKey();
  if (fromEnv) {
    localStorage.setItem('groq_api_key', fromEnv);
    _cachedKey = fromEnv;
    return fromEnv;
  }

  // 4. Firestore (cross-device)
  try {
    const snap = await getDoc(doc(db, 'settings', 'ai_config'));
    if (snap.exists() && snap.data().groqApiKey) {
      _cachedKey = snap.data().groqApiKey as string;
      return _cachedKey;
    }
  } catch { /* ignore */ }

  return null;
}

// Backward compat aliases
export const getGeminiKey = getAIKey;

// ─── Low-level Groq calls ─────────────────────────────────────────────────────

export async function callClaude(
  prompt: string,
  options: { model?: string; systemInstruction?: string; maxTokens?: number } = {}
): Promise<string> {
  const apiKey = await getAIKey();
  if (!apiKey) throw new Error('Groq API key non configurata. Vai nelle impostazioni AI (⚙️) e inserisci la chiave.');

  const client = new Groq({ apiKey, dangerouslyAllowBrowser: true });

  const completion = await client.chat.completions.create({
    model: options.model || GROQ_MODEL,
    max_tokens: options.maxTokens || 1024,
    messages: [
      ...(options.systemInstruction ? [{ role: 'system' as const, content: options.systemInstruction }] : []),
      { role: 'user' as const, content: prompt },
    ],
  });

  return completion.choices[0]?.message?.content || '';
}

export async function callClaudeChat(
  messages: Array<{ role: 'user' | 'model'; text: string }>,
  options: { model?: string; systemInstruction?: string; maxTokens?: number } = {}
): Promise<string> {
  const apiKey = await getAIKey();
  if (!apiKey) throw new Error('Groq API key non configurata.');

  const client = new Groq({ apiKey, dangerouslyAllowBrowser: true });

  const groqMessages = [
    ...(options.systemInstruction ? [{ role: 'system' as const, content: options.systemInstruction }] : []),
    ...messages.map(m => ({
      role: m.role === 'model' ? ('assistant' as const) : ('user' as const),
      content: m.text,
    })),
  ];

  const completion = await client.chat.completions.create({
    model: options.model || GROQ_MODEL,
    max_tokens: options.maxTokens || 1024,
    messages: groqMessages,
  });

  return completion.choices[0]?.message?.content || '';
}

// Keep backward compat aliases
export const callGemini = callClaude;
export const callGeminiChat = callClaudeChat;

// ─── SEO content generation ───────────────────────────────────────────────────

interface SEOResult {
  seoTitle: string;
  metaDescription: string;
  description: string;
  bullets: string[];
  faq?: Array<{ q: string; a: string }>;
}

export async function generateSEOContent(
  product: { name: string; category?: string; price?: number; brand?: string; specs?: Record<string, string> },
  options: { toneOfVoice?: string; includeFaq?: boolean } = {}
): Promise<SEOResult> {
  const { toneOfVoice = 'professionale', includeFaq = false } = options;

  const specsText = product.specs
    ? Object.entries(product.specs)
        .filter(([, v]) => v && v !== 'N/A')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
    : '';

  const prompt = `Sei un esperto SEO e copywriter specializzato in attrezzatura DJ e audio professionale.

PRODOTTO: ${product.name}
CATEGORIA: ${product.category || 'N/A'}
BRAND: ${product.brand || 'N/A'}
PREZZO: ${product.price ? '€' + product.price.toFixed(2) : 'N/A'}
SPECIFICHE TECNICHE: ${specsText || 'N/A'}
TONO: ${toneOfVoice}

Genera il seguente contenuto SEO ottimizzato per Officina del Suono, negozio specializzato in DJ ed audio pro.

Rispondi ESCLUSIVAMENTE in JSON con questa struttura:
{
  "seoTitle": "titolo SEO max 60 caratteri con keyword principale",
  "metaDescription": "meta description max 155 caratteri persuasiva con CTA",
  "description": "descrizione prodotto 2-3 paragrafi (400-600 caratteri totali), tono ${toneOfVoice}, in italiano",
  "bullets": ["punto 1 vantaggi/caratteristiche", "punto 2", "punto 3", "punto 4", "punto 5"],
  ${includeFaq ? '"faq": [{"q": "domanda 1", "a": "risposta 1"}, {"q": "domanda 2", "a": "risposta 2"}, {"q": "domanda 3", "a": "risposta 3"}]' : '"faq": []'}
}`;

  const raw = await callClaude(prompt, { maxTokens: 2048 });
  const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleaned) as SEOResult;
  } catch {
    return {
      seoTitle: product.name.slice(0, 60),
      metaDescription: `Acquista ${product.name} da Officina del Suono. Spedizione gratuita e garanzia 24 mesi.`,
      description: raw.slice(0, 600),
      bullets: [],
    };
  }
}

// ─── Review summary generation ────────────────────────────────────────────────

interface ReviewSummaryResult {
  summary: string;
  pros: string[];
  cons: string[];
  verdict: string;
  disclaimer?: string;
}

export async function generateReviewSummary(
  product: { name: string; category?: string },
  reviews: Array<{ rating: number; text: string; userName?: string }>,
  options: { includeDisclaimer?: boolean } = {}
): Promise<ReviewSummaryResult> {
  if (reviews.length === 0) {
    return {
      summary: 'Nessuna recensione disponibile per questo prodotto.',
      pros: [],
      cons: [],
      verdict: '',
    };
  }

  const reviewsText = reviews
    .slice(0, 30)
    .map((r, i) => `[${i + 1}] ${r.rating}/5 stelle: "${r.text}"`)
    .join('\n');

  const avgRating = (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1);

  const prompt = `Sei un esperto di audio professionale e DJ equipment. Analizza le seguenti recensioni di clienti reali.

PRODOTTO: ${product.name}
MEDIA VOTI: ${avgRating}/5 stelle (${reviews.length} recensioni)
RECENSIONI:
${reviewsText}

Genera una sintesi delle recensioni in italiano. Rispondi ESCLUSIVAMENTE in JSON:
{
  "summary": "sintesi generale 2-3 frasi che cattura l'opinione media dei clienti",
  "pros": ["pro 1", "pro 2", "pro 3"],
  "cons": ["contro 1", "contro 2"],
  "verdict": "verdetto finale 1 frase",
  "disclaimer": "Sintesi generata da AI basata su ${reviews.length} recensioni verificate"
}`;

  const raw = await callClaude(prompt, { maxTokens: 1024 });
  const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleaned) as ReviewSummaryResult;
  } catch {
    return {
      summary: raw.slice(0, 300),
      pros: [],
      cons: [],
      verdict: '',
      disclaimer: `Sintesi generata da AI`,
    };
  }
}

// ─── Email marketing content generation ───────────────────────────────────────

interface EmailContentResult {
  subject: string;
  preheader: string;
  bodyHtml: string;
  bodyText: string;
}

type EmailSegment = 'tutti' | 'principianti' | 'intermedi' | 'pro' | 'clienti_recenti';

export async function generateEmailContent(
  segment: EmailSegment,
  featuredProducts: Array<{ name: string; price?: number; description?: string; category?: string }>,
  options: { signature?: string; promoCode?: string; promoDiscount?: string } = {}
): Promise<EmailContentResult> {
  const segmentDesc: Record<EmailSegment, string> = {
    tutti: 'tutti gli iscritti alla newsletter',
    principianti: 'DJ principianti e appassionati che stanno iniziando',
    intermedi: 'DJ intermedi con esperienza media',
    pro: 'DJ professionisti e sound engineer',
    clienti_recenti: 'clienti che hanno acquistato recentemente',
  };

  const productsText = featuredProducts
    .slice(0, 3)
    .map(p => `- ${p.name}${p.price ? ' (€' + p.price.toFixed(2) + ')' : ''}: ${p.description?.slice(0, 100) || p.category || ''}`)
    .join('\n');

  const signature = options.signature || 'Amerigo — Officina del Suono';
  const promoSection = options.promoCode
    ? `Includi un coupon: CODICE "${options.promoCode}" per ${options.promoDiscount || 'sconto esclusivo'}`
    : '';

  const prompt = `Sei un copywriter esperto in email marketing per negozi di musica e attrezzatura DJ.

SEGMENTO: ${segmentDesc[segment]}
PRODOTTI IN EVIDENZA:
${productsText}
${promoSection}
FIRMA: ${signature}

Genera un'email di marketing coinvolgente e professionale in italiano per Officina del Suono.
Il tono deve essere appassionato, esperto e amichevole — come se un vero DJ esperto parlasse ad altri DJ.

Rispondi ESCLUSIVAMENTE in JSON:
{
  "subject": "oggetto email accattivante max 50 caratteri",
  "preheader": "testo preheader max 90 caratteri (anteprima in inbox)",
  "bodyHtml": "corpo email in HTML semplice con tag <h2>, <p>, <ul>, <li>, <strong>, <a> — max 600 parole",
  "bodyText": "versione testo puro senza HTML — max 500 parole"
}`;

  const raw = await callClaude(prompt, { maxTokens: 2048 });
  const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleaned) as EmailContentResult;
  } catch {
    return {
      subject: `Novità da Officina del Suono`,
      preheader: 'Scopri le ultime novità per il tuo setup DJ',
      bodyHtml: raw.slice(0, 2000),
      bodyText: raw.replace(/<[^>]+>/g, '').slice(0, 1500),
    };
  }
}

// ─── Quiz AI recommendation ───────────────────────────────────────────────────

interface QuizRecommendationResult {
  name: string;
  description: string;
  tags: string[];
  rationale: string;
  budgetRange: string;
  productId?: string;
}

export async function generateQuizRecommendation(
  answers: { level: string; genre: string; environment: string; budget: string },
  products: Array<{ id: string; name: string; price?: number; category?: string; description?: string; badge?: string }>
): Promise<QuizRecommendationResult> {
  const productsText = products
    .slice(0, 20)
    .map(p => `ID:${p.id} | ${p.name} | ${p.category || ''} | ${p.price ? '€' + p.price.toFixed(2) : ''} | ${p.badge || ''}`)
    .join('\n');

  const budgetRanges: Record<string, string> = {
    Entry: 'meno di €1.500',
    Mid: '€1.500 - €4.000',
    High: 'oltre €4.000',
  };

  const prompt = `Sei un ingegnere del suono e DJ professionista con 15 anni di esperienza. Devi consigliare il setup DJ perfetto.

PROFILO UTENTE:
- Livello: ${answers.level}
- Genere musicale: ${answers.genre}
- Ambiente di utilizzo: ${answers.environment}
- Budget: ${budgetRanges[answers.budget] || answers.budget}

PRODOTTI DISPONIBILI NEL CATALOGO:
${productsText || 'Catalogo non disponibile'}

Analizza il profilo e consiglia il setup ottimale. Se esiste un prodotto nel catalogo adatto, usalo (riporta il suo ID).
Altrimenti descrivi il setup ideale in termini generali.

Rispondi ESCLUSIVAMENTE in JSON:
{
  "name": "nome del setup/prodotto consigliato",
  "description": "spiegazione dettagliata 3-4 frasi del perché questo è il setup perfetto per il profilo",
  "tags": ["tag1", "tag2", "tag3"],
  "rationale": "motivazione tecnica 1 frase",
  "budgetRange": "fascia di prezzo indicativa",
  "productId": "ID del prodotto dal catalogo se disponibile, altrimenti null"
}`;

  const raw = await callClaude(prompt, { maxTokens: 1024 });
  const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleaned) as QuizRecommendationResult;
  } catch {
    return {
      name: 'Setup Personalizzato',
      description: raw.slice(0, 400),
      tags: [answers.level, answers.genre, answers.environment],
      rationale: 'Basato sul tuo profilo di utilizzo',
      budgetRange: budgetRanges[answers.budget] || answers.budget,
    };
  }
}
