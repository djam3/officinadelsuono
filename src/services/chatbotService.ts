import { db } from '../firebase';
import {
  collection, getDocs, addDoc, onSnapshot,
  serverTimestamp, query, orderBy, limit
} from 'firebase/firestore';
import Fuse from 'fuse.js';
import { DJ_KNOWLEDGE_BASE } from '../data/djKnowledgeBase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  price?: number;
  badge?: string;
  tags?: string[];
  specs?: Record<string, string>;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[];
  readTime?: number;
}

export interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  keywords: string;
  hits?: number;
}

export interface ChatLog {
  id?: string;
  userMessage: string;
  botResponse: string;
  timestamp: any;
  helpful?: boolean;
}

// ─── Chatbot Service ──────────────────────────────────────────────────────────

class ChatbotService {
  private products: Product[] = [];
  private knowledge: KnowledgeEntry[] = [];
  private blogPosts: BlogPost[] = [];
  private productFuse: Fuse<Product> | null = null;
  private knowledgeFuse: Fuse<KnowledgeEntry> | null = null;
  private blogFuse: Fuse<BlogPost> | null = null;
  private initialized = false;
  private unsubscribeProducts: (() => void) | null = null;
  private unsubscribeKnowledge: (() => void) | null = null;
  private unsubscribeBlog: (() => void) | null = null;

  // ── Init ──────────────────────────────────────────────────────────────────

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;

    // Real-time listener per prodotti
    this.unsubscribeProducts = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        this.products = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        this.buildProductFuse();
      },
      () => { /* silently fail */ }
    );

    // Real-time listener per knowledge base admin
    this.unsubscribeKnowledge = onSnapshot(
      collection(db, 'chatbot_knowledge'),
      (snap) => {
        this.knowledge = snap.docs.map(d => ({ id: d.id, ...d.data() } as KnowledgeEntry));
        this.buildKnowledgeFuse();
      },
      () => { /* silently fail */ }
    );

    // Real-time listener per blog posts
    this.unsubscribeBlog = onSnapshot(
      collection(db, 'posts'),
      (snap) => {
        this.blogPosts = snap.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost));
        this.buildBlogFuse();
      },
      () => { /* silently fail */ }
    );

    // Carica anche subito senza aspettare snapshot
    try {
      const [prodSnap, knowSnap, blogSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'chatbot_knowledge')),
        getDocs(collection(db, 'posts')),
      ]);
      this.products = prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      this.knowledge = knowSnap.docs.map(d => ({ id: d.id, ...d.data() } as KnowledgeEntry));
      this.blogPosts = blogSnap.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost));
      this.buildProductFuse();
      this.buildKnowledgeFuse();
      this.buildBlogFuse();
    } catch { /* silently fail */ }
  }

  private buildProductFuse() {
    this.productFuse = new Fuse(this.products, {
      keys: [
        { name: 'name', weight: 3 },
        { name: 'brand', weight: 2 },
        { name: 'description', weight: 1.5 },
        { name: 'category', weight: 1 },
        { name: 'tags', weight: 1 },
      ],
      threshold: 0.45,
      includeScore: true,
      minMatchCharLength: 2,
    });
  }

  private buildKnowledgeFuse() {
    this.knowledgeFuse = new Fuse(this.knowledge, {
      keys: [
        { name: 'question', weight: 3 },
        { name: 'keywords', weight: 2 },
      ],
      threshold: 0.35,
      includeScore: true,
    });
  }

  private buildBlogFuse() {
    this.blogFuse = new Fuse(this.blogPosts, {
      keys: [
        { name: 'title', weight: 3 },
        { name: 'tags', weight: 2 },
        { name: 'category', weight: 2 },
        { name: 'excerpt', weight: 1.5 },
        { name: 'content', weight: 1 },
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 3,
    });
  }

  // ── Risposta principale ───────────────────────────────────────────────────

  async getResponse(userMessage: string): Promise<string> {
    await this.initialize();
    const q = userMessage.toLowerCase().trim();

    // 1. Knowledge base admin (massima priorità)
    const knowledgeResponse = this.searchKnowledge(q);
    if (knowledgeResponse) return knowledgeResponse;

    // 2. Intent detection + risposta contestuale
    const intentResponse = this.detectIntent(q);
    if (intentResponse) return intentResponse;

    // 3. Ricerca prodotti nel catalogo Firebase
    const productResponse = this.searchProducts(q);
    if (productResponse) return productResponse;

    // 4. Ricerca nel blog
    const blogResponse = this.searchBlog(q);
    if (blogResponse) return blogResponse;

    // 5. Knowledge base DJ built-in (brand, categorie, troubleshooting)
    const builtinResponse = this.searchBuiltin(q);
    if (builtinResponse) return builtinResponse;

    // 6. Fallback WhatsApp
    return `Non ho trovato una risposta precisa per questa domanda. 🤔\n\nContatta **Amerigo** direttamente per una consulenza personalizzata:\n📱 WhatsApp: **+39 347 739 7016**\n📧 Email: **info@officina-del-suono.it**`;
  }

  // ── Ricerca knowledge base admin ─────────────────────────────────────────

  private searchKnowledge(q: string): string | null {
    if (!this.knowledgeFuse || this.knowledge.length === 0) return null;
    const results = this.knowledgeFuse.search(q);
    if (results.length > 0 && (results[0].score ?? 1) < 0.35) {
      return results[0].item.answer;
    }
    return null;
  }

  // ── Ricerca prodotti Firebase ─────────────────────────────────────────────

  private searchProducts(q: string): string | null {
    if (!this.productFuse || this.products.length === 0) return null;

    const results = this.productFuse.search(q);
    if (results.length === 0) return null;

    const best = results[0];
    if ((best.score ?? 1) > 0.4) return null;

    if ((best.score ?? 1) < 0.25 || results.length === 1) {
      return this.formatProduct(best.item);
    }

    const top = results.slice(0, 3).map(r => r.item);
    return this.formatMultipleProducts(top);
  }

  private formatProduct(p: Product): string {
    let r = `🎛️ **${p.name}**`;
    if (p.brand) r += ` — *${p.brand}*`;
    r += '\n\n';
    if (p.description) r += `${p.description}\n\n`;
    if (p.price) r += `💰 Prezzo: **€${p.price.toFixed(2)}**\n`;
    if (p.category) r += `📦 Categoria: ${p.category}\n`;
    if (p.badge) r += `🏷️ ${p.badge}\n`;
    if (p.specs && Object.keys(p.specs).length > 0) {
      r += '\n**Specifiche tecniche:**\n';
      for (const [k, v] of Object.entries(p.specs)) {
        if (v) r += `- ${k}: ${v}\n`;
      }
    }
    r += `\nVuoi aggiungerlo al carrello o hai altre domande? 😊`;
    return r;
  }

  private formatMultipleProducts(products: Product[]): string {
    let r = `Ho trovato **${products.length} prodotti** che potrebbero interessarti:\n\n`;
    products.forEach((p, i) => {
      r += `**${i + 1}. ${p.name}**`;
      if (p.brand) r += ` *(${p.brand})*`;
      if (p.price) r += ` — €${p.price.toFixed(2)}`;
      r += '\n';
      if (p.description) r += `${p.description.substring(0, 120)}...\n`;
      r += '\n';
    });
    r += `Vuoi saperne di più su uno di questi? Dimmi il nome e ti do tutti i dettagli! 🎧`;
    return r;
  }

  // ── Ricerca blog ──────────────────────────────────────────────────────────

  private searchBlog(q: string): string | null {
    if (!this.blogFuse || this.blogPosts.length === 0) return null;

    // Parole chiave che suggeriscono interesse per guide/tutorial
    const blogKeywords = /come|guida|tutorial|impara|capire|differenza|scegliere|consigli|miglio|spieg|cos.è|cos'è|cosa sono|recensione/i;
    if (!blogKeywords.test(q) && q.length < 6) return null;

    const results = this.blogFuse.search(q);
    if (results.length === 0) return null;

    const best = results[0];
    if ((best.score ?? 1) > 0.4) return null;

    const post = best.item;
    let r = `📖 Ho trovato un articolo del nostro blog che potrebbe rispondere alla tua domanda:\n\n`;
    r += `**${post.title}**\n`;
    if (post.category) r += `*Categoria: ${post.category}*\n`;
    if (post.readTime) r += `⏱️ ${post.readTime} min di lettura\n`;
    r += '\n';
    if (post.excerpt) r += `${post.excerpt}\n\n`;

    if (results.length > 1 && (results[1].score ?? 1) < 0.4) {
      r += `Trovi anche: **${results[1].item.title}**\n\n`;
    }

    r += `Vai nella sezione **Blog** per leggerlo! 📚\n\nHai altre domande su questo argomento?`;
    return r;
  }

  // ── Intent detection ──────────────────────────────────────────────────────

  private detectIntent(q: string): string | null {
    // Saluto
    if (/^(ciao|salve|buongiorno|buonasera|hey|hi|hello)\b/.test(q)) {
      const count = this.products.length;
      const blogCount = this.blogPosts.length;
      return `Ciao! 👋 Sono l'assistente AI di **Officinadelsuono**.\n\nSono qui per aiutarti a trovare l'attrezzatura DJ perfetta. Ho accesso a:\n🎛️ **${count > 0 ? count + ' prodotti' : 'tutto il catalogo'}** del negozio\n📖 **${blogCount > 0 ? blogCount + ' articoli'  : 'tutti gli articoli'}** del blog\n\nPosso aiutarti con prodotti, prezzi, guide tecniche e consigli. Cosa cerchi?`;
    }

    // Blog
    if (/blog|articol|guida|tutorial|legger|post/.test(q)) {
      if (this.blogPosts.length === 0) {
        return `📖 Il nostro blog è ricco di guide, recensioni e tutorial DJ!\n\nVai nella sezione **Blog** dal menu per sfogliare tutti gli articoli. Posso anche cercare un argomento specifico — dimmi cosa ti interessa!`;
      }
      const recent = this.blogPosts.slice(0, 3);
      let r = `📖 **Blog Officinadelsuono** — ${this.blogPosts.length} articoli disponibili:\n\n`;
      recent.forEach(p => {
        r += `- **${p.title}**`;
        if (p.category) r += ` *(${p.category})*`;
        r += '\n';
      });
      r += `\nC'è un argomento specifico che vuoi approfondire?`;
      return r;
    }

    // Grazie
    if (/grazie|perfetto|ok grazie|capito/.test(q)) {
      return `Prego! 😊 Sono sempre qui se hai altre domande. Buon djing! 🎧`;
    }

    // Catalogo / cosa vendete
    if (/cosa vend|catalogo|prodott|assortiment|tipi di/.test(q)) {
      const cats = [...new Set(this.products.map(p => p.category).filter(Boolean))];
      let r = `Ecco cosa trovi da **Officinadelsuono** 🎶\n\n`;
      if (cats.length > 0) {
        r += cats.map(c => `- 📦 ${c}`).join('\n');
      } else {
        r += `- Controller DJ\n- Mixer & Effetti\n- Casse Attive (PA)\n- Cuffie Pro\n- Vinili\n- Cavi e Accessori\n- Kit Pronti`;
      }
      r += `\n\nCerchi qualcosa in particolare?`;
      return r;
    }

    // Prezzo generico
    if (/prezzo|costo|quanto cost|quanto viene|prezzi/.test(q) && !this.searchProducts(q)) {
      const priced = this.products.filter(p => p.price && p.price > 0).slice(0, 4);
      if (priced.length > 0) {
        let r = `Ecco alcuni prodotti con i relativi prezzi:\n\n`;
        priced.forEach(p => {
          r += `- **${p.name}**: €${p.price!.toFixed(2)}\n`;
        });
        r += `\nCerchi il prezzo di un prodotto specifico? Dimmi il nome! 💰`;
        return r;
      }
    }

    // Spedizione
    if (/spediz|consegna|spedire|giorni|arriva/.test(q)) {
      return `🚚 **Spedizioni Officinadelsuono:**\n\n- Corriere espresso in **24/48 ore** lavorative\n- Spedizione in tutta **Italia**\n- Monitoraggio tracking incluso\n- Imballaggio professionale per attrezzatura delicata\n\nPer ordini urgenti contatta Amerigo su WhatsApp: **+39 347 739 7016** 📱`;
    }

    // Garanzia
    if (/garanzia|rotto|assistenza|riparaz/.test(q)) {
      return `🛡️ **Garanzia Officinadelsuono:**\n\n- **2 anni** di garanzia ufficiale italiana su tutti i prodotti\n- Assistenza tecnica specializzata\n- Certificazione **MAT Academy** del titolare\n\nPer problemi tecnici urgenti: WhatsApp **+39 347 739 7016** 🔧`;
    }

    // Pagamento
    if (/pag|carta|bonifico|paypal|rate|klarna|scalapay/.test(q)) {
      return `💳 **Metodi di pagamento accettati:**\n\n- 💳 Carta di credito/debito (Visa, Mastercard)\n- 🏦 PayPal\n- 📱 Apple Pay / Google Pay\n- 🏧 Bonifico bancario\n- 🚚 Contrassegno (pagamento alla consegna)\n- 📅 Rate senza interessi con **Klarna** e **Scalapay**\n- 📋 Finanziamento fino a 60 rate con **Cofidis**`;
    }

    // Contatti / WhatsApp
    if (/contatt|whatsapp|telefon|email|dove siete|orari/.test(q)) {
      return `📞 **Contatti Officinadelsuono:**\n\n📱 WhatsApp: **+39 347 739 7016**\n📧 Email: **info@officina-del-suono.it**\n📍 Sede: Forino (AV), Campania\n\nAmerigo risponde personalmente — solitamente entro poche ore! 🎛️`;
    }

    // Consiglio / aiuto scelta
    if (/consig|aiut|scegl|qual è il miglior|qual comprare|per iniziare|principiante|beginner/.test(q)) {
      return `🎧 **Aiuto nella scelta:**\n\nPer consigliarti al meglio ho bisogno di qualche info:\n\n1. **Che livello hai?** (principiante / intermedio / pro)\n2. **Che genere suoni?** (techno, house, hip-hop...)\n3. **Hai un budget?** (indicativo)\n4. **Usi un software?** (Rekordbox, Serato, Traktor...)\n\nIn alternativa fai il nostro **Quiz DJ** dal menu per ricevere una raccomandazione personalizzata! 🎯`;
    }

    return null;
  }

  // ── Knowledge base built-in ───────────────────────────────────────────────

  private searchBuiltin(q: string): string | null {
    for (const [brandId, brand] of Object.entries(DJ_KNOWLEDGE_BASE.brands)) {
      const brandName = brand.name.toLowerCase();
      if (q.includes(brandId) || q.includes(brandName.split(' ')[0].toLowerCase())) {
        let r = `🎛️ **${brand.name}**\n\n${brand.philosophy}\n\n`;
        r += `⚙️ Tecnologia: ${brand.tech}\n\n`;
        r += `**Prodotti disponibili:**\n`;
        r += Object.keys(brand.products).map(p => `- ${p.toUpperCase()}`).join('\n');
        return r;
      }
      for (const [prodId, prodDesc] of Object.entries(brand.products)) {
        if (q.includes(prodId.toLowerCase())) {
          return `🎛️ **${prodId.toUpperCase()}** *(${brand.name})*\n\n${prodDesc}\n\n⚙️ Tecnologia: ${brand.tech}`;
        }
      }
    }

    for (const [catId, catDesc] of Object.entries(DJ_KNOWLEDGE_BASE.categories)) {
      if (q.includes(catId)) {
        return `📦 **${catId.charAt(0).toUpperCase() + catId.slice(1)}**: ${catDesc}`;
      }
    }

    for (const [issue, solution] of Object.entries(DJ_KNOWLEDGE_BASE.troubleshooting)) {
      if (q.includes(issue) || q.includes(issue.replace('-', ' '))) {
        return `🔧 **Soluzione (${issue}):**\n\n${solution}`;
      }
    }

    for (const [faqId, faqAns] of Object.entries(DJ_KNOWLEDGE_BASE.faq)) {
      if (q.includes(faqId)) return faqAns;
    }

    return null;
  }

  // ── Logging ───────────────────────────────────────────────────────────────

  async logConversation(userMessage: string, botResponse: string): Promise<string | null> {
    try {
      const ref = await addDoc(collection(db, 'chatbot_logs'), {
        userMessage,
        botResponse,
        timestamp: serverTimestamp(),
        helpful: null,
      });
      return ref.id;
    } catch { return null; }
  }

  async getRecentLogs(n = 50): Promise<ChatLog[]> {
    try {
      const q = query(
        collection(db, 'chatbot_logs'),
        orderBy('timestamp', 'desc'),
        limit(n)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatLog));
    } catch { return []; }
  }

  async addKnowledge(entry: Omit<KnowledgeEntry, 'id'>): Promise<void> {
    await addDoc(collection(db, 'chatbot_knowledge'), {
      ...entry,
      hits: 0,
      createdAt: serverTimestamp(),
    });
  }

  getKnowledge(): KnowledgeEntry[] { return this.knowledge; }
  getProducts(): Product[] { return this.products; }
  getProductCount(): number { return this.products.length; }
  getKnowledgeCount(): number { return this.knowledge.length; }
  getBlogCount(): number { return this.blogPosts.length; }
}

export const chatbotService = new ChatbotService();
