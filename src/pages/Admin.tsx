import { useState, useEffect, useCallback } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, setDoc, getDoc, limit, where, Timestamp } from 'firebase/firestore';
import { LogOut, Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Upload, Sparkles, Loader2, Settings, User as UserIcon, Mail, Tag, Globe, ShieldAlert, LayoutDashboard, Package, ScrollText, Megaphone, Bot, Activity, Users as UsersIcon, ChevronRight, TrendingUp, AlertTriangle, MessageSquare, Zap, Clock, Database, CheckCircle2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from 'framer-motion';
import { getDirectDriveUrl } from '../utils/drive';
import { useBuilder } from '../contexts/BuilderContext';
import { Pencil } from 'lucide-react';
import { Logo } from '../components/Logo';

const ADMIN_EMAIL = 'officinadelsuono99@gmail.com';

type AdminTab = 'dashboard' | 'products' | 'discounts' | 'content' | 'newsletter' | 'blog' | 'ai' | 'monitoring' | 'users';

interface NavItem {
  id: AdminTab;
  label: string;
  description: string;
  icon: any;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Panoramica generale del sito', icon: LayoutDashboard },
  { id: 'products', label: 'Prodotti', description: 'Gestisci il catalogo', icon: Package },
  { id: 'blog', label: 'Blog', description: 'Articoli e contenuti editoriali', icon: ScrollText },
  { id: 'discounts', label: 'Codici Sconto', description: 'Crea e gestisci coupon', icon: Tag },
  { id: 'newsletter', label: 'Newsletter', description: 'Invia email agli iscritti', icon: Megaphone },
  { id: 'content', label: 'Contenuti Sito', description: 'Modifica testi homepage', icon: Globe },
  { id: 'ai', label: 'AI Chatbot', description: 'Addestra il chatbot', icon: Bot },
  { id: 'users', label: 'Utenti', description: 'Clienti registrati', icon: UsersIcon },
  { id: 'monitoring', label: 'Monitoring', description: 'Errori e performance', icon: Activity },
];

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  image?: string; // Legacy single image
  images?: string[]; // New multiple images
  badge?: string;
  draft?: boolean;
  createdAt?: string;
  specs?: {
    watt?: string;
    frequency?: string;
    inputs?: string;
    outputs?: string;
    dimensions?: string;
    weight?: string;
  };
}

interface AdminProps {
  onNavigate?: (page: string) => void;
}

export function Admin({ onNavigate }: AdminProps) {
  const { isBuilderMode, activateBuilderMode, deactivateBuilderMode } = useBuilder();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Dashboard stats
  const [newsletterCount, setNewsletterCount] = useState(0);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({ images: [] });
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPrice, setIsGeneratingPrice] = useState(false);
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [desiredProfit, setDesiredProfit] = useState<number | ''>('');
  const [manualApiKey, setManualApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [aiKnowledge, setAiKnowledge] = useState<{id:string;question:string;answer:string;keywords:string}[]>([]);
  const [aiLogs, setAiLogs] = useState<{id:string;userMessage:string;botResponse:string;timestamp:any}[]>([]);
  const [aiForm, setAiForm] = useState({ question: '', answer: '', keywords: '' });
  const [isSavingAi, setIsSavingAi] = useState(false);
  
  // Newsletter state
  const [newsletterForm, setNewsletterForm] = useState({ title: '', excerpt: '', url: '' });
  const [isSendingNewsletter, setIsSendingNewsletter] = useState(false);
  const [testEmailMessage, setTestEmailMessage] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Blog state
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [isEditingBlog, setIsEditingBlog] = useState<string | null>(null);
  const [isAddingBlog, setIsAddingBlog] = useState(false);
  const [blogForm, setBlogForm] = useState<any>({
    title: '',
    excerpt: '',
    category: '',
    author: 'Amerigo',
    date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
    readTime: '5 min',
    image: '',
    content: '',
    featured: false
  });

  // Discount codes state
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [discountForm, setDiscountForm] = useState({ code: '', type: 'percent', value: 0, minOrder: 0, maxUses: 0, expiresAt: '', active: true });
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);

  // Site content state
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
    } catch (error: any) {
      console.error("Error sending test email:", error);
      alert(`Errore: ${error.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  useEffect(() => {
    if (manualApiKey) {
      localStorage.setItem('gemini_api_key', manualApiKey);
    }
  }, [manualApiKey]);

  useEffect(() => {
    if (isAdmin) {
      const fetchProfile = async () => {
        try {
          const profileDoc = await getDoc(doc(db, 'settings', 'profile'));
          if (profileDoc.exists()) {
            setProfileImageUrl(profileDoc.data().profileImage || '');
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      };
      fetchProfile();
    }
  }, [isAdmin]);

  // Check admin via Firebase Auth (only the owner Google account)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email?.toLowerCase() === ADMIN_EMAIL) {
        setIsAdmin(true);
        loadProducts();
        loadBlogPosts();
        loadAiData();
        loadDiscounts();
        loadSiteContent();
        loadStats();
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loadStats = () => {
    // Newsletter subscribers count
    getDocs(collection(db, 'newsletter_subscriptions'))
      .then(snap => setNewsletterCount(snap.size))
      .catch(() => setNewsletterCount(0));

    // Registered users (from 'users' collection)
    getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50)))
      .then(snap => setRegisteredUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => setRegisteredUsers([]));

    // Error logs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    getDocs(query(
      collection(db, 'error_logs'),
      where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('timestamp', 'desc'),
      limit(100)
    ))
      .then(snap => setErrorLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => setErrorLogs([]));
  };

  // Carica knowledge base AI e log conversazioni
  const loadAiData = () => {
    const unsubK = onSnapshot(collection(db, 'chatbot_knowledge'), (snap) => {
      setAiKnowledge(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });
    const unsubL = onSnapshot(
      query(collection(db, 'chatbot_logs'), orderBy('timestamp', 'desc'), limit(30)),
      (snap) => { setAiLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); }
    );
    return () => { unsubK(); unsubL(); };
  };

  const loadProducts = () => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods: Product[] = [];
      const cats = new Set<string>(['Kit Pronti', 'Console', 'Mixer', 'Cuffie', 'Monitor', 'Cavi', 'Accessori', 'Flight Case', 'Supporti']);
      
      snapshot.forEach((doc) => {
        const data = doc.data() as Product;
        // Normalize legacy data
        if (data.image && (!data.images || data.images.length === 0)) {
          data.images = [data.image];
        } else if (!data.images) {
          data.images = [];
        }
        prods.push({ id: doc.id, ...data });
        if (data.category) {
          cats.add(data.category);
        }
      });
      setProducts(prods);
      const sortedCats = Array.from(cats).sort((a, b) => {
        if (a === 'Kit Pronti') return -1;
        if (b === 'Kit Pronti') return 1;
        return a.localeCompare(b);
      });
      setCategories(sortedCats);
    }, (error) => {
      console.error("Error loading products:", error);
    });
    return unsubscribe;
  };

  const loadBlogPosts = () => {
    const q = query(collection(db, 'blog_posts'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts: any[] = [];
      snapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      setBlogPosts(posts);
    }, (error) => {
      console.error("Error loading blog posts:", error);
    });
    return unsubscribe;
  };

  const handleSaveBlog = async () => {
    if (!blogForm.title || !blogForm.content || !blogForm.image) {
      alert("Compila i campi obbligatori (Titolo, Contenuto, Immagine)");
      return;
    }

    try {
      const postData = {
        ...blogForm,
        updatedAt: new Date().toISOString()
      };

      if (isEditingBlog) {
        await updateDoc(doc(db, 'blog_posts', isEditingBlog), postData);
      } else {
        await addDoc(collection(db, 'blog_posts'), {
          ...postData,
          createdAt: new Date().toISOString()
        });
      }
      
      setIsEditingBlog(null);
      setIsAddingBlog(false);
      setBlogForm({
        title: '',
        excerpt: '',
        category: '',
        author: 'Amerigo',
        date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
        readTime: '5 min',
        image: '',
        content: '',
        featured: false
      });
    } catch (error) {
      console.error("Error saving blog post:", error);
      alert("Errore durante il salvataggio dell'articolo.");
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questo articolo?")) {
      try {
        await deleteDoc(doc(db, 'blog_posts', id));
      } catch (error) {
        console.error("Error deleting blog post:", error);
      }
    }
  };

  const handleSaveAiKnowledge = async () => {
    if (!aiForm.question.trim() || !aiForm.answer.trim()) {
      alert('Inserisci domanda e risposta.');
      return;
    }
    setIsSavingAi(true);
    try {
      await addDoc(collection(db, 'chatbot_knowledge'), {
        question: aiForm.question.trim(),
        answer: aiForm.answer.trim(),
        keywords: aiForm.keywords.trim(),
        hits: 0,
        createdAt: new Date().toISOString(),
      });
      setAiForm({ question: '', answer: '', keywords: '' });
    } catch (e) {
      alert('Errore salvataggio.');
    } finally {
      setIsSavingAi(false);
    }
  };

  const handleDeleteAiKnowledge = async (id: string) => {
    if (window.confirm('Eliminare questa risposta appresa?')) {
      await deleteDoc(doc(db, 'chatbot_knowledge', id));
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    setLoginLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email?.toLowerCase() !== ADMIN_EMAIL) {
        await signOut(auth);
        setLoginError('Accesso negato. Solo il proprietario può accedere al pannello.');
      }
    } catch (e: any) {
      if (e.code === 'auth/popup-closed-by-user') {
        // silent
      } else {
        setLoginError('Errore durante l\'accesso con Google. Riprova.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch {}
    setIsAdmin(false);
    onNavigate?.('home');
  };

  const loadDiscounts = () => {
    const unsubscribe = onSnapshot(collection(db, 'discount_codes'), (snap) => {
      setDiscounts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  };

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

  const handleSaveDiscount = async () => {
    if (!discountForm.code.trim()) { alert('Inserisci un codice.'); return; }
    if (!discountForm.value) { alert('Inserisci il valore dello sconto.'); return; }
    setIsSavingDiscount(true);
    try {
      const data = {
        ...discountForm,
        code: discountForm.code.toUpperCase().trim(),
        usedCount: 0,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'discount_codes'), data);
      setDiscountForm({ code: '', type: 'percent', value: 0, minOrder: 0, maxUses: 0, expiresAt: '', active: true });
      setIsAddingDiscount(false);
    } catch (e) {
      alert('Errore salvataggio codice sconto.');
    } finally {
      setIsSavingDiscount(false);
    }
  };

  const handleToggleDiscount = async (id: string, active: boolean) => {
    await updateDoc(doc(db, 'discount_codes', id), { active: !active });
  };

  const handleDeleteDiscount = async (id: string) => {
    if (window.confirm('Eliminare questo codice sconto?')) {
      await deleteDoc(doc(db, 'discount_codes', id));
    }
  };

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

  const generateWithAI = async () => {
    if (!editForm.name) {
      alert("Inserisci il nome del prodotto prima di generare con l'AI");
      return;
    }

    let apiKey = manualApiKey || (process.env as any).API_KEY || process.env.GEMINI_API_KEY;

    // If no key is available and we are in AI Studio, prompt for it
    if (!apiKey && window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        const confirmKey = window.confirm(
          "Per utilizzare le funzioni AI avanzate è necessario collegare una chiave API. Vuoi farlo ora tramite AI Studio?"
        );
        if (confirmKey) {
          await window.aistudio.openSelectKey();
          // We'll try to get the key from process.env after selection
          apiKey = (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
        }
      }
    }

    if (!apiKey) {
      setShowAiSettings(true);
      alert("Configura una chiave API Gemini nelle impostazioni AI per continuare.");
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      console.log("Starting AI generation for:", editForm.name);

      // Parallelize all tasks for maximum speed
      const [textResponse, imageResponse] = await Promise.all([
        // Task 1: Data extraction (using Flash for speed)
        ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Sei un esperto di attrezzatura DJ e audio professionale. 
          PRODOTTO: ${editForm.name}
          
          AZIONI:
          1. Cerca i dati tecnici ufficiali del produttore.
          2. Estrai le specifiche tecniche REALI (Watt, Risposta in frequenza, Ingressi, Uscite, Dimensioni, Peso).
          3. Genera una descrizione professionale in italiano (max 800 caratteri).
          
          REQUISITI RISPOSTA:
          Rispondi ESCLUSIVAMENTE in formato JSON.
          Sii estremamente preciso. Se un dato non è disponibile, scrivi "N/A".`,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                specs: {
                  type: Type.OBJECT,
                  properties: {
                    watt: { type: Type.STRING },
                    frequency: { type: Type.STRING },
                    inputs: { type: Type.STRING },
                    outputs: { type: Type.STRING },
                    dimensions: { type: Type.STRING },
                    weight: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }),
        // Task 2: Image search (using Flash Image for specialized search)
        ai.models.generateContent({
          model: "gemini-3.1-flash-image-preview",
          contents: `Trova immagini ufficiali ad alta risoluzione su sfondo bianco per: ${editForm.name}. 
          Cerca file diretti (jpg, png, webp) o link a gallerie ufficiali del produttore.`,
          config: {
            tools: [{ googleSearch: { searchTypes: { imageSearch: {} } } }]
          }
        })
      ]);

      // Parse details
      let details = { description: '', specs: {} };
      try {
        const jsonStr = textResponse.text?.replace(/```json/g, "").replace(/```/g, "").trim() || "{}";
        details = JSON.parse(jsonStr);
      } catch (e) {
        console.error("JSON Parse error:", e);
      }

      // Extract images
      const newImages: string[] = [];
      const groundingMetadata = imageResponse.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        for (const chunk of groundingMetadata.groundingChunks) {
          if (chunk.web?.uri) {
            const uri = chunk.web.uri;
            // More inclusive image detection
            if (uri.match(/\.(jpg|jpeg|png|webp|gif|svg|avif)$/i) || 
                uri.includes('image') || 
                uri.includes('img') || 
                uri.includes('product') || 
                uri.includes('assets')) {
              newImages.push(uri);
            }
          }
        }
      }

      // Fallback for images if none found
      if (newImages.length === 0) {
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-3.1-flash-image-preview",
          contents: `Immagine prodotto professionale sfondo bianco: ${editForm.name}`,
          config: { tools: [{ googleSearch: { searchTypes: { imageSearch: {} } } }] }
        });
        const fallbackChunks = fallbackResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (fallbackChunks) {
          for (const chunk of fallbackChunks) {
            if (chunk.web?.uri) newImages.push(chunk.web.uri);
          }
        }
      }

      // Deduplicate and limit to 5
      const finalImages = [...new Set([...(editForm.images || []), ...newImages])].slice(0, 5);

      setEditForm(prev => ({
        ...prev,
        description: details.description || prev.description,
        specs: {
          ...(prev.specs || {}),
          ...(details.specs || {})
        },
        images: finalImages
      }));

      console.log("AI Generation complete", { details, imagesCount: finalImages.length });

    } catch (error: any) {
      const errorMessage = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
      const isQuotaError = errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED");
      
      if (isQuotaError) {
        alert("Limite di quota raggiunto per l'AI. Attendi qualche minuto o utilizza una chiave API differente nelle impostazioni AI.");
      } else {
        console.error("AI Generation error:", error);
        if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("PERMISSION_DENIED")) {
          const reselect = window.confirm(
            "Errore di autorizzazione AI. Potrebbe essere necessario selezionare nuovamente una chiave API valida (progetto Google Cloud con fatturazione attiva). Vuoi farlo ora?\n\nNota: Consulta ai.google.dev/gemini-api/docs/billing per maggiori info."
          );
          if (reselect && window.aistudio) {
            await window.aistudio.openSelectKey();
          }
        } else {
          alert("Errore durante la generazione con l'AI. Riprova o inserisci i dati manualmente.");
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAIImage = async () => {
    if (!editForm.name) {
      alert("Inserisci il nome del prodotto prima di generare l'immagine");
      return;
    }

    let apiKey = manualApiKey || (process.env as any).API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey && window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        const confirmKey = window.confirm(
          "Per utilizzare le funzioni AI avanzate è necessario collegare una chiave API. Vuoi farlo ora tramite AI Studio?"
        );
        if (confirmKey) {
          await window.aistudio.openSelectKey();
          apiKey = (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
        }
      }
    }

    if (!apiKey) {
      setShowAiSettings(true);
      alert("Configura una chiave API Gemini nelle impostazioni AI per continuare.");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      console.log("Starting AI image generation for:", editForm.name);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `Realistic professional product photo of ${editForm.name} on a clean white background. High resolution, professional studio lighting, 4k, sharp focus.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      let base64Image = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }

      if (base64Image) {
        // Convert base64 to File and upload
        const byteCharacters = atob(base64Image);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        const file = new File([blob], `${editForm.name?.replace(/\s+/g, '_')}_ai.png`, { type: 'image/png' });

        const formData = new FormData();
        formData.append('files', file);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error('Upload failed');

        const { urls } = await uploadResponse.json();
        
        setEditForm(prev => ({
          ...prev,
          images: [...(prev.images || []), ...urls],
          image: prev.image || (urls.length > 0 ? urls[0] : '')
        }));
        
        alert("Immagine generata e caricata con successo!");
      } else {
        throw new Error("Nessuna immagine generata dal modello.");
      }

    } catch (error: any) {
      console.error("AI Image Generation error:", error);
      alert("Errore durante la generazione dell'immagine con l'AI. Riprova o cerca un'immagine online.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (!editForm.images) return;
    const newImages = [...editForm.images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    
    setEditForm(prev => ({
      ...prev,
      images: newImages,
      image: newImages[0] // Update legacy image to be the first one
    }));
  };

  const generatePrice = () => {
    if (costPrice === '' || desiredProfit === '') {
      alert("Inserisci il costo d'acquisto e il guadagno desiderato.");
      return;
    }

    const cost = parseFloat(costPrice.toString());
    const profit = parseFloat(desiredProfit.toString());

    if (isNaN(cost) || isNaN(profit)) {
      alert("Inserisci valori numerici validi.");
      return;
    }

    setIsGeneratingPrice(true);
    try {
      // Formula: prezzo_pubblico = (costo_fornitore + utile_desiderato) / 0.98
      const finalPrice = (cost + profit) / 0.98;
      const taxes = finalPrice - (cost + profit);

      setEditForm(prev => ({ ...prev, price: parseFloat(finalPrice.toFixed(2)) }));
      alert(`Prezzo calcolato con successo!\nTasse accantonate: €${taxes.toFixed(2)}`);
    } catch (error) {
      console.error("Errore nel calcolo del prezzo:", error);
      alert("Errore durante il calcolo del prezzo.");
    } finally {
      setIsGeneratingPrice(false);
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    
    setEditForm(prev => ({
      ...prev,
      images: [...(prev.images || []), imageUrlInput.trim()],
      image: prev.image || imageUrlInput.trim()
    }));
    setImageUrlInput('');
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const { urls } = await response.json();

      setEditForm(prev => ({ 
        ...prev, 
        images: [...(prev.images || []), ...urls],
        image: prev.image || (urls.length > 0 ? urls[0] : '')
      }));
      setIsUploading(false);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert(error.message || "Errore durante il caricamento delle immagini.");
      setIsUploading(false);
    }
  }, [editForm.images, editForm.image]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': [] },
    multiple: true
  });

  const removeImage = (indexToRemove: number) => {
    setEditForm(prev => ({
      ...prev,
      images: prev.images?.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSaveProfile = async () => {
    if (!profileImageUrl) {
      alert("Inserisci un URL per la foto profilo");
      return;
    }

    setIsSavingProfile(true);
    try {
      await setDoc(doc(db, 'settings', 'profile'), {
        profileImage: profileImageUrl,
        updatedAt: new Date().toISOString()
      });
      alert("Foto profilo aggiornata con successo!");
      setShowProfileSettings(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Errore durante il salvataggio della foto profilo.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onProfileDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploadingProfile(true);
    try {
      const formData = new FormData();
      formData.append('files', acceptedFiles[0]);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const { urls } = await response.json();
      if (urls && urls.length > 0) {
        setProfileImageUrl(urls[0]);
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);
      alert("Errore durante il caricamento della foto profilo.");
    } finally {
      setIsUploadingProfile(false);
    }
  }, []);

  const { getRootProps: getProfileRootProps, getInputProps: getProfileInputProps, isDragActive: isProfileDragActive } = useDropzone({ 
    onDrop: onProfileDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  const handleSave = async () => {
    if (!editForm.name) {
      alert("Nome obbligatorio");
      return;
    }
    if (editForm.price === undefined || isNaN(Number(editForm.price))) {
      alert("Prezzo deve essere un numero");
      return;
    }
    if (!editForm.category) {
      alert("Categoria obbligatoria");
      return;
    }
    if (!editForm.images?.length && !editForm.image) {
      alert("Almeno un'immagine obbligatoria");
      return;
    }

    try {
      const productData = {
        name: editForm.name,
        category: editForm.category,
        price: Number(editForm.price),
        description: editForm.description || '',
        images: editForm.images || [],
        image: editForm.image || (editForm.images && editForm.images.length > 0 ? editForm.images[0] : ''),
        draft: !!editForm.draft,
        ...(editForm.badge ? { badge: editForm.badge } : {}),
        ...(editForm.specs ? { specs: editForm.specs } : {}),
      };

      if (isEditing) {
        await updateDoc(doc(db, 'products', isEditing), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date().toISOString()
        });
      }
      
      setIsEditing(null);
      setIsAdding(false);
      setEditForm({ images: [] });
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Errore durante il salvataggio. Verifica di avere i permessi.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questo prodotto?")) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
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
    } catch (error: any) {
      console.error("Error sending newsletter:", error);
      alert(`Errore: ${error.message}`);
    } finally {
      setIsSendingNewsletter(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (!isAdmin) {
    const wrongUser = currentUser && currentUser.email?.toLowerCase() !== ADMIN_EMAIL;
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-orange/5 rounded-full blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-md"
        >
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-orange to-orange-700 flex items-center justify-center shadow-2xl shadow-brand-orange/30">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-black uppercase tracking-widest mb-2">Area Riservata</h1>
            <p className="text-zinc-500 text-sm">
              Accesso esclusivo al proprietario dell'officina
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {wrongUser && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-sm">
              <p className="font-bold mb-1">Account non autorizzato</p>
              <p className="text-xs text-amber-300/80 mb-3">Sei loggato come <span className="font-mono">{currentUser?.email}</span>. Per accedere al pannello devi usare l'account proprietario.</p>
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Disconnetti
              </button>
            </div>
          )}

          {!wrongUser && (
            <button
              onClick={handleGoogleLogin}
              disabled={loginLoading}
              className="w-full py-4 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-3"
            >
              {loginLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Accedi con Google
                </>
              )}
            </button>
          )}

          <p className="text-center text-[10px] text-zinc-700 mt-8 uppercase tracking-widest">
            Solo l'account proprietario può accedere
          </p>
        </motion.div>
      </div>
    );
  }

  const activeNav = NAV_ITEMS.find(i => i.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} shrink-0 border-r border-white/5 bg-black sticky top-0 h-screen flex flex-col transition-all duration-200`}>
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <Logo className="w-8 h-8 shrink-0" />
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-tighter leading-none truncate">Officina<span className="text-brand-orange">delsuono</span></p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Admin Panel</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                {!sidebarCollapsed && isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" />}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => setSidebarCollapsed(v => !v)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-2"
          >
            {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <><ChevronRight className="w-3 h-3 rotate-180" /> Comprimi</>}
          </button>
          <div className={`flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4 text-brand-orange" />
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{currentUser?.displayName || 'Admin'}</p>
                <p className="text-[10px] text-zinc-500 truncate">{currentUser?.email}</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition-colors border border-white/5"
            >
              <LogOut className="w-3.5 h-3.5" /> Esci
            </button>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
          <div className="px-6 md:px-10 py-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                <span>Admin</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-brand-orange">{activeNav.label}</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight truncate">{activeNav.label}</h1>
              <p className="text-sm text-zinc-500 mt-0.5 truncate">{activeNav.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowProfileSettings(v => !v)}
                title="Profilo Sito"
                className={`p-2.5 rounded-xl transition-all border ${showProfileSettings ? 'bg-brand-orange text-white border-brand-orange' : 'bg-zinc-900 text-zinc-400 hover:text-white border-white/5'}`}
              >
                <UserIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowAiSettings(v => !v)}
                title="AI Config"
                className={`p-2.5 rounded-xl transition-all border ${showAiSettings ? 'bg-brand-orange text-white border-brand-orange' : 'bg-zinc-900 text-zinc-400 hover:text-white border-white/5'}`}
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (isBuilderMode) {
                    deactivateBuilderMode();
                  } else {
                    activateBuilderMode();
                    onNavigate?.('home');
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all border text-xs uppercase tracking-wider ${isBuilderMode ? 'bg-brand-orange text-white border-brand-orange shadow-lg shadow-brand-orange/30' : 'bg-zinc-900 text-zinc-300 hover:text-white border-brand-orange/40 hover:border-brand-orange hover:bg-brand-orange/10'}`}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{isBuilderMode ? 'Modifica Attiva' : 'Modifica Sito'}</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-10 max-w-[1600px] w-full">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Prodotti', value: products.length, icon: Package, color: 'text-brand-orange', bg: 'bg-brand-orange/10', border: 'border-brand-orange/20' },
                  { label: 'Articoli blog', value: blogPosts.length, icon: ScrollText, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                  { label: 'Iscritti newsletter', value: newsletterCount, icon: Mail, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
                  { label: 'Codici sconto', value: discounts.filter((d:any)=>d.active).length, icon: Tag, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                  { label: 'Chat AI', value: aiLogs.length, icon: MessageSquare, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
                  { label: 'Errori 30gg', value: errorLogs.length, icon: AlertTriangle, color: errorLogs.length > 0 ? 'text-red-400' : 'text-zinc-500', bg: errorLogs.length > 0 ? 'bg-red-500/10' : 'bg-zinc-800/50', border: errorLogs.length > 0 ? 'border-red-500/20' : 'border-white/5' },
                ].map((kpi, i) => {
                  const Icon = kpi.icon;
                  return (
                    <motion.div
                      key={kpi.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-5 rounded-2xl border ${kpi.border} ${kpi.bg} backdrop-blur-xl`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Icon className={`w-5 h-5 ${kpi.color}`} />
                      </div>
                      <div className={`text-3xl font-black ${kpi.color}`}>{kpi.value}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{kpi.label}</div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Azioni Rapide</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button onClick={() => { setActiveTab('products'); setIsAdding(true); setEditForm({ price: 0, draft: false }); }} className="p-4 bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-brand-orange/30 rounded-xl text-left transition-all group">
                    <Plus className="w-5 h-5 text-brand-orange mb-2" />
                    <p className="text-sm font-bold">Nuovo prodotto</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Aggiungi al catalogo</p>
                  </button>
                  <button onClick={() => { setActiveTab('blog'); setIsAddingBlog(true); }} className="p-4 bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-brand-orange/30 rounded-xl text-left transition-all group">
                    <ScrollText className="w-5 h-5 text-brand-orange mb-2" />
                    <p className="text-sm font-bold">Scrivi articolo</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Nuovo post sul blog</p>
                  </button>
                  <button onClick={() => setActiveTab('newsletter')} className="p-4 bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-brand-orange/30 rounded-xl text-left transition-all group">
                    <Megaphone className="w-5 h-5 text-brand-orange mb-2" />
                    <p className="text-sm font-bold">Invia newsletter</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Email a {newsletterCount} iscritti</p>
                  </button>
                  <button onClick={() => setActiveTab('discounts')} className="p-4 bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-brand-orange/30 rounded-xl text-left transition-all group">
                    <Tag className="w-5 h-5 text-brand-orange mb-2" />
                    <p className="text-sm font-bold">Crea coupon</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Nuovo codice sconto</p>
                  </button>
                </div>
              </div>

              {/* Activity & Health */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent chatbot activity */}
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest">Ultime conversazioni AI</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Cosa stanno chiedendo i clienti</p>
                    </div>
                    <button onClick={() => setActiveTab('ai')} className="text-[10px] text-brand-orange font-bold uppercase tracking-widest hover:underline">Vedi tutto</button>
                  </div>
                  {aiLogs.length === 0 ? (
                    <p className="text-zinc-600 text-sm text-center py-8">Nessuna conversazione recente</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {aiLogs.slice(0, 6).map(log => (
                        <div key={log.id} className="p-3 bg-zinc-950 rounded-lg border border-white/5">
                          <p className="text-xs text-brand-orange font-bold truncate">👤 {log.userMessage}</p>
                          <p className="text-[10px] text-zinc-500 truncate mt-1">🤖 {log.botResponse}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* System health */}
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest">Stato del Sistema</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Servizi e integrazioni</p>
                    </div>
                    <button onClick={() => setActiveTab('monitoring')} className="text-[10px] text-brand-orange font-bold uppercase tracking-widest hover:underline">Dettagli</button>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Firebase Auth', status: 'ok', detail: 'Operativo' },
                      { label: 'Firestore Database', status: 'ok', detail: 'Operativo' },
                      { label: 'Cloud Functions', status: 'ok', detail: 'Welcome email attivo' },
                      { label: 'Gemini AI', status: manualApiKey ? 'ok' : 'warn', detail: manualApiKey ? 'API key configurata' : 'API key mancante' },
                      { label: 'Errori ultime 24h', status: errorLogs.filter(e => { try { const d = e.timestamp?.toDate?.(); return d && (Date.now() - d.getTime()) < 86400000; } catch { return false; } }).length > 0 ? 'warn' : 'ok', detail: `${errorLogs.filter(e => { try { const d = e.timestamp?.toDate?.(); return d && (Date.now() - d.getTime()) < 86400000; } catch { return false; } }).length} errori registrati` },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${s.status === 'ok' ? 'bg-green-400' : s.status === 'warn' ? 'bg-amber-400' : 'bg-red-400'} ${s.status === 'ok' ? 'shadow-[0_0_8px_rgba(74,222,128,0.5)]' : ''}`} />
                          <span className="text-xs font-bold">{s.label}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500">{s.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* AI Configuration Panel */}
        <AnimatePresence>
          {showProfileSettings && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-zinc-900/50 border border-brand-orange/30 rounded-2xl backdrop-blur-xl">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-brand-orange" />
                      Gestione Profilo Amerigo
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">Aggiorna la foto profilo visualizzata nella home page.</p>
                  </div>
                  <button onClick={() => setShowProfileSettings(false)} className="text-zinc-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <div 
                      {...getProfileRootProps()} 
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isProfileDragActive ? 'border-brand-orange bg-brand-orange/10' : 'border-white/10 hover:border-white/20 bg-zinc-950/50'}`}
                    >
                      <input {...getProfileInputProps()} />
                      <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-4" />
                      <p className="text-sm text-zinc-400">Trascina la nuova foto qui, o clicca per selezionarla</p>
                      {isUploadingProfile && <div className="text-xs text-brand-orange animate-pulse mt-2">Caricamento...</div>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Oppure inserisci URL</label>
                      <input 
                        type="text" 
                        placeholder="https://..."
                        value={profileImageUrl}
                        onChange={(e) => setProfileImageUrl(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all"
                      />
                    </div>

                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile || !profileImageUrl}
                      className="w-full py-3 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-orange/20"
                    >
                      {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Salva Foto Profilo
                    </button>
                  </div>

                  <div className="flex flex-col items-center justify-center p-6 bg-zinc-950/50 rounded-2xl border border-white/5">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Anteprima Home Page</p>
                    <div className="w-48 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-brand-orange shadow-[0_0_20px_rgba(242,125,38,0.3)] bg-black">
                      {profileImageUrl ? (
                        <img src={getDirectDriveUrl(profileImageUrl)} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                          <UserIcon className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Configuration Panel */}
        <AnimatePresence>
          {showAiSettings && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-zinc-900/50 border border-brand-orange/30 rounded-2xl backdrop-blur-xl">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-brand-orange" />
                      Configurazione AI Gemini
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">Configura l'accesso ai modelli Gemini per la generazione automatica di contenuti e immagini.</p>
                  </div>
                  <button onClick={() => setShowAiSettings(false)} className="text-zinc-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Chiave API Manuale</span>
                      <div className="relative">
                        <input 
                          type="password" 
                          placeholder="Inserisci la tua chiave API Gemini..."
                          value={manualApiKey}
                          onChange={(e) => setManualApiKey(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all"
                        />
                        {manualApiKey && (
                          <button 
                            onClick={() => {
                              setManualApiKey('');
                              localStorage.removeItem('gemini_api_key');
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2">
                        La chiave viene salvata solo nel tuo browser. Puoi ottenerne una su <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">Google AI Studio</a>.
                      </p>
                    </label>
                  </div>

                  <div className="bg-zinc-950/50 rounded-xl p-4 border border-white/5">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Stato Connessione</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Piattaforma AI Studio:</span>
                        <span className={window.aistudio ? "text-green-500 font-bold" : "text-zinc-600"}>
                          {window.aistudio ? "Disponibile" : "Non rilevata"}
                        </span>
                      </div>
                      {window.aistudio && (
                        <button 
                          onClick={async () => {
                            if (window.aistudio) await window.aistudio.openSelectKey();
                          }}
                          className="w-full py-2 bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-brand-orange/20"
                        >
                          Collega tramite AI Studio
                        </button>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Chiave Manuale:</span>
                        <span className={manualApiKey ? "text-green-500 font-bold" : "text-zinc-600"}>
                          {manualApiKey ? "Configurata" : "Mancante"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'products' && (
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold">Prodotti ({products.length})</h2>
            <button 
              onClick={() => {
                setIsAdding(true);
                setIsEditing(null);
                setEditForm({ price: 0, draft: false });
              }}
              className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              <Plus className="w-4 h-4" /> Nuovo Prodotto
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Immagine</th>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Prezzo</th>
                  <th className="px-6 py-4">Badge</th>
                  <th className="px-6 py-4 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(isAdding || isEditing) && (
                  <>
                    <tr className="bg-zinc-800/50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="flex flex-col gap-4">
                          <div className="flex gap-4 items-start">
                            <div className="w-1/3">
                              <div 
                                {...getRootProps()} 
                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors h-full flex flex-col items-center justify-center ${isDragActive ? 'border-brand-orange bg-brand-orange/10' : 'border-white/20 hover:border-white/40'}`}
                              >
                                <input {...getInputProps()} />
                                <Upload className="w-8 h-8 text-zinc-400 mb-2" />
                                <p className="text-sm text-zinc-400">Trascina le immagini qui, o clicca per selezionarle</p>
                                {isUploading && <div className="text-xs text-brand-orange animate-pulse mt-2">Caricamento...</div>}
                              </div>
                              <div className="mt-4 flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Incolla link immagine (es. https://...)"
                                  value={imageUrlInput}
                                  onChange={(e) => setImageUrlInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddImageUrl();
                                    }
                                  }}
                                  className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
                                />
                                <button
                                  onClick={handleAddImageUrl}
                                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-white/10 flex items-center gap-2"
                                >
                                  <Plus className="w-4 h-4" />
                                  Link
                                </button>
                              </div>
                            </div>
                            <div className="w-2/3 flex flex-wrap gap-2">
                              {editForm.images?.map((img, index) => (
                                <div key={index} className="relative w-24 h-24 group">
                                  <img src={getDirectDriveUrl(img)} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-lg border border-white/10" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => moveImage(index, 'up')}
                                      disabled={index === 0}
                                      className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-white disabled:opacity-30"
                                      title="Sposta su"
                                    >
                                      <Plus className="w-3 h-3 rotate-45" />
                                    </button>
                                    <button
                                      onClick={() => moveImage(index, 'down')}
                                      disabled={index === (editForm.images?.length || 0) - 1}
                                      className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-white disabled:opacity-30"
                                      title="Sposta giù"
                                    >
                                      <Plus className="w-3 h-3 -rotate-45" />
                                    </button>
                                    <button
                                      onClick={() => removeImage(index)}
                                      className="p-1 bg-red-500 hover:bg-red-400 rounded text-white"
                                      title="Rimuovi"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                  {index === 0 && (
                                    <div className="absolute top-1 left-1 bg-brand-orange text-white text-[8px] font-bold px-1 rounded uppercase">
                                      Principale
                                    </div>
                                  )}
                                </div>
                              ))}
                              {(!editForm.images || editForm.images.length === 0) && editForm.image && (
                                <div className="relative w-24 h-24 group">
                                  <img src={getDirectDriveUrl(editForm.image)} alt="Preview" className="w-full h-full object-cover rounded-lg border border-white/10" />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-4">
                            <textarea
                              placeholder="Descrizione del prodotto (AI o manuale)"
                              value={editForm.description || ''}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange h-20 resize-none"
                            />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Nome Prodotto"
                                value={editForm.name || ''}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={generateWithAI}
                                  disabled={isGenerating || !editForm.name}
                                  className="bg-brand-orange hover:bg-brand-orange/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap text-xs font-bold"
                                  title="Genera Dati con Gemini AI"
                                >
                                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                  AI Dati
                                </button>
                                <button
                                  onClick={generateAIImage}
                                  disabled={isGeneratingImage || !editForm.name}
                                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap text-xs font-bold"
                                  title="Genera Foto con Gemini AI"
                                >
                                  {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                  AI Foto
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <select
                                className="w-full bg-zinc-950 border border-white/10 rounded px-3 py-2 text-sm text-white"
                                value={categories.includes(editForm.category || '') ? editForm.category : ''}
                                onChange={e => setEditForm({...editForm, category: e.target.value})}
                              >
                                <option value="" disabled>Seleziona categoria</option>
                                {categories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                              <input 
                                type="text" 
                                placeholder="O nuova categoria..." 
                                className="w-full bg-zinc-950 border border-white/10 rounded px-3 py-2 text-sm"
                                value={!categories.includes(editForm.category || '') ? editForm.category || '' : ''}
                                onChange={e => setEditForm({...editForm, category: e.target.value})}
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <input
                                type="number"
                                placeholder="Prezzo di Vendita (€)"
                                value={editForm.price || ''}
                                onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                                className="bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
                              />
                              <div className="p-3 bg-zinc-950/50 border border-brand-orange/20 rounded-lg space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">Calcolo Prezzo (Forfettario)</span>
                                </div>
                                <input
                                  type="number"
                                  placeholder="Costo d'acquisto (€)"
                                  value={costPrice}
                                  onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : '')}
                                  className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                                />
                                <input
                                  type="number"
                                  placeholder="Guadagno desiderato (€)"
                                  value={desiredProfit}
                                  onChange={(e) => setDesiredProfit(e.target.value ? Number(e.target.value) : '')}
                                  className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                                />
                                <button
                                  onClick={generatePrice}
                                  disabled={isGeneratingPrice || costPrice === '' || desiredProfit === ''}
                                  className="w-full bg-brand-orange/20 hover:bg-brand-orange/30 text-brand-orange disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2"
                                >
                                  {isGeneratingPrice ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                  Calcola Prezzo
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                placeholder="Badge (es. Novità)"
                                value={editForm.badge || ''}
                                onChange={(e) => setEditForm({ ...editForm, badge: e.target.value })}
                                className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
                              />
                              <label className="flex items-center gap-2 cursor-pointer mt-2">
                                <input
                                  type="checkbox"
                                  checked={!!editForm.draft}
                                  onChange={(e) => setEditForm({ ...editForm, draft: e.target.checked })}
                                  className="w-4 h-4 accent-brand-orange"
                                />
                                <span className="text-sm">Salva come bozza</span>
                              </label>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                            <input 
                              type="text" 
                              placeholder="Watt / Potenza" 
                              className="w-full bg-zinc-950 border border-white/10 rounded px-3 py-2 text-xs"
                              value={editForm.specs?.watt || ''}
                              onChange={e => setEditForm({...editForm, specs: {...editForm.specs, watt: e.target.value}})}
                            />
                            <input 
                              type="text" 
                              placeholder="Risposta in Frequenza" 
                              className="w-full bg-zinc-950 border border-white/10 rounded px-3 py-2 text-xs"
                              value={editForm.specs?.frequency || ''}
                              onChange={e => setEditForm({...editForm, specs: {...editForm.specs, frequency: e.target.value}})}
                            />
                            <input 
                              type="text" 
                              placeholder="Ingressi" 
                              className="w-full bg-zinc-950 border border-white/10 rounded px-3 py-2 text-xs"
                              value={editForm.specs?.inputs || ''}
                              onChange={e => setEditForm({...editForm, specs: {...editForm.specs, inputs: e.target.value}})}
                            />
                            <input 
                              type="text" 
                              placeholder="Uscite" 
                              className="w-full bg-zinc-950 border border-white/10 rounded px-3 py-2 text-xs"
                              value={editForm.specs?.outputs || ''}
                              onChange={e => setEditForm({...editForm, specs: {...editForm.specs, outputs: e.target.value}})}
                            />
                            <input 
                              type="text" 
                              placeholder="Dimensioni" 
                              className="w-full bg-zinc-950 border border-white/10 rounded px-3 py-2 text-xs"
                              value={editForm.specs?.dimensions || ''}
                              onChange={e => setEditForm({...editForm, specs: {...editForm.specs, dimensions: e.target.value}})}
                            />
                            <input 
                              type="text" 
                              placeholder="Peso" 
                              className="w-full bg-zinc-950 border border-white/10 rounded px-3 py-2 text-xs"
                              value={editForm.specs?.weight || ''}
                              onChange={e => setEditForm({...editForm, specs: {...editForm.specs, weight: e.target.value}})}
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold transition-colors">
                              <Save className="w-4 h-4" /> Salva Prodotto
                            </button>
                            <button 
                              onClick={() => {
                                setIsAdding(false);
                                setIsEditing(null);
                              }} 
                              className="flex items-center gap-2 px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white font-bold transition-colors"
                            >
                              <X className="w-4 h-4" /> Annulla
                            </button>
                          </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </>
                )}

                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 rounded bg-zinc-950 border border-white/10 overflow-hidden flex items-center justify-center">
                        {product.image && product.image !== 'USE_IMAGES_ARRAY' ? (
                          <img src={getDirectDriveUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
                        ) : product.images && product.images.length > 0 ? (
                          <img src={getDirectDriveUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-zinc-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{product.name}</td>
                    <td className="px-6 py-4 text-zinc-400">{product.category}</td>
                    <td className="px-6 py-4 font-mono">€ {product.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {product.badge && (
                        <span className="px-2 py-1 bg-brand-orange/20 text-brand-orange text-xs font-bold rounded">
                          {product.badge}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setIsEditing(product.id);
                            setIsAdding(false);
                            setEditForm(product);
                          }}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {products.length === 0 && !isAdding && !isEditing && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      Nessun prodotto nel catalogo. Clicca su "Nuovo Prodotto" per iniziare.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
        {activeTab === 'newsletter' && (
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
          </div>
        )}
        {activeTab === 'blog' && (
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold">Articoli Blog ({blogPosts.length})</h2>
              <button 
                onClick={() => {
                  setIsAddingBlog(true);
                  setIsEditingBlog(null);
                  setBlogForm({
                    title: '',
                    excerpt: '',
                    category: 'Guide Tecniche',
                    author: 'Amerigo',
                    date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
                    readTime: '5 min',
                    image: '',
                    content: '',
                    featured: false
                  });
                }}
                className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                <Plus className="w-4 h-4" /> Nuovo Articolo
              </button>
            </div>

            <div className="p-6">
              {(isAddingBlog || isEditingBlog) && (
                <div className="mb-8 p-6 bg-zinc-950 rounded-2xl border border-brand-orange/30 space-y-4">
                  <h3 className="text-lg font-bold">{isEditingBlog ? 'Modifica Articolo' : 'Nuovo Articolo'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Titolo Articolo"
                      value={blogForm.title}
                      onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-orange"
                    />
                    <input
                      type="text"
                      placeholder="Categoria"
                      value={blogForm.category}
                      onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-orange"
                    />
                    <input
                      type="text"
                      placeholder="URL Immagine"
                      value={blogForm.image}
                      onChange={(e) => setBlogForm({ ...blogForm, image: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-orange"
                    />
                    <div className="flex gap-4">
                      <input
                        type="text"
                        placeholder="Tempo di lettura"
                        value={blogForm.readTime}
                        onChange={(e) => setBlogForm({ ...blogForm, readTime: e.target.value })}
                        className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-orange"
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={blogForm.featured}
                          onChange={(e) => setBlogForm({ ...blogForm, featured: e.target.checked })}
                          className="w-4 h-4 accent-brand-orange"
                        />
                        <span className="text-sm">In Evidenza</span>
                      </label>
                    </div>
                  </div>
                  <textarea
                    placeholder="Riassunto (Excerpt)"
                    value={blogForm.excerpt}
                    onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-orange h-20 resize-none"
                  />
                  <textarea
                    placeholder="Contenuto HTML"
                    value={blogForm.content}
                    onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:outline-none focus:border-brand-orange h-64"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={handleSaveBlog} className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold transition-colors">
                      <Save className="w-4 h-4" /> Salva Articolo
                    </button>
                    <button 
                      onClick={() => {
                        setIsAddingBlog(false);
                        setIsEditingBlog(null);
                      }} 
                      className="flex items-center gap-2 px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white font-bold transition-colors"
                    >
                      <X className="w-4 h-4" /> Annulla
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogPosts.map((post) => (
                  <div key={post.id} className="bg-zinc-950 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                    <div className="h-32 overflow-hidden relative">
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                      {post.featured && (
                        <span className="absolute top-2 right-2 px-2 py-1 bg-brand-orange text-white text-[10px] font-bold rounded uppercase">Featured</span>
                      )}
                    </div>
                    <div className="p-4 flex-grow flex flex-col">
                      <h3 className="font-bold text-sm mb-2 line-clamp-2">{post.title}</h3>
                      <p className="text-zinc-500 text-xs line-clamp-2 mb-4">{post.excerpt}</p>
                      <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/5">
                        <span className="text-[10px] text-zinc-600">{post.date}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setIsEditingBlog(post.id);
                              setIsAddingBlog(false);
                              setBlogForm(post);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleDeleteBlog(post.id)}
                            className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Codici Sconto ──────────────────────────────────────── */}
        {activeTab === 'discounts' && (
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2"><Tag className="w-5 h-5 text-brand-orange" /> Codici Sconto ({discounts.length})</h2>
                  <p className="text-zinc-500 text-sm mt-1">Crea coupon con percentuale o valore fisso. Verranno applicati automaticamente nel carrello.</p>
                </div>
                <button
                  onClick={() => setIsAddingDiscount(v => !v)}
                  className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                >
                  <Plus className="w-4 h-4" /> Nuovo Codice
                </button>
              </div>

              {isAddingDiscount && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-6 bg-zinc-950 border border-brand-orange/30 rounded-2xl"
                >
                  <h3 className="font-bold mb-4">Nuovo Codice Sconto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Codice</label>
                      <input
                        type="text"
                        placeholder="ES. ESTATE25"
                        value={discountForm.code}
                        onChange={e => setDiscountForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Tipo</label>
                      <select
                        value={discountForm.type}
                        onChange={e => setDiscountForm(f => ({ ...f, type: e.target.value }))}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-orange"
                      >
                        <option value="percent">Percentuale (%)</option>
                        <option value="fixed">Valore Fisso (€)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                        {discountForm.type === 'percent' ? 'Sconto (%)' : 'Sconto (€)'}
                      </label>
                      <input
                        type="number"
                        placeholder={discountForm.type === 'percent' ? '25' : '20'}
                        value={discountForm.value || ''}
                        onChange={e => setDiscountForm(f => ({ ...f, value: Number(e.target.value) }))}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Ordine Minimo (€)</label>
                      <input
                        type="number"
                        placeholder="0 = nessun minimo"
                        value={discountForm.minOrder || ''}
                        onChange={e => setDiscountForm(f => ({ ...f, minOrder: Number(e.target.value) }))}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Max Utilizzi</label>
                      <input
                        type="number"
                        placeholder="0 = illimitato"
                        value={discountForm.maxUses || ''}
                        onChange={e => setDiscountForm(f => ({ ...f, maxUses: Number(e.target.value) }))}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Scadenza</label>
                      <input
                        type="date"
                        value={discountForm.expiresAt}
                        onChange={e => setDiscountForm(f => ({ ...f, expiresAt: e.target.value }))}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4 justify-end">
                    <button
                      onClick={handleSaveDiscount}
                      disabled={isSavingDiscount}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-colors"
                    >
                      {isSavingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salva Codice
                    </button>
                    <button onClick={() => setIsAddingDiscount(false)} className="flex items-center gap-2 px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-bold transition-colors">
                      <X className="w-4 h-4" /> Annulla
                    </button>
                  </div>
                </motion.div>
              )}

              {discounts.length === 0 ? (
                <p className="text-zinc-500 text-sm py-8 text-center">Nessun codice sconto attivo. Creane uno!</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-zinc-500 uppercase text-xs border-b border-white/10">
                      <tr>
                        <th className="pb-3 pr-4">Codice</th>
                        <th className="pb-3 pr-4">Sconto</th>
                        <th className="pb-3 pr-4">Min. Ordine</th>
                        <th className="pb-3 pr-4">Utilizzi</th>
                        <th className="pb-3 pr-4">Scadenza</th>
                        <th className="pb-3 pr-4">Stato</th>
                        <th className="pb-3 text-right">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {discounts.map(d => (
                        <tr key={d.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 pr-4 font-mono font-bold text-brand-orange">{d.code}</td>
                          <td className="py-3 pr-4">{d.type === 'percent' ? `${d.value}%` : `€${d.value}`}</td>
                          <td className="py-3 pr-4">{d.minOrder ? `€${d.minOrder}` : '—'}</td>
                          <td className="py-3 pr-4">{d.usedCount || 0}{d.maxUses ? ` / ${d.maxUses}` : ''}</td>
                          <td className="py-3 pr-4">{d.expiresAt || '—'}</td>
                          <td className="py-3 pr-4">
                            <button
                              onClick={() => handleToggleDiscount(d.id, d.active)}
                              className={`px-3 py-1 rounded-full text-xs font-bold ${d.active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-500'}`}
                            >
                              {d.active ? 'Attivo' : 'Disattivo'}
                            </button>
                          </td>
                          <td className="py-3 text-right">
                            <button onClick={() => handleDeleteDiscount(d.id)} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab Contenuti Sito ─────────────────────────────────────── */}
        {activeTab === 'content' && (
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
        )}

        {/* ── Tab AI Chatbot ─────────────────────────────────────────── */}
        {activeTab === 'ai' && (
          <div className="space-y-8">

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Prodotti indicizzati', value: products.length, color: 'text-brand-orange' },
                { label: 'Risposte apprese', value: aiKnowledge.length, color: 'text-green-400' },
                { label: 'Conversazioni log', value: aiLogs.length, color: 'text-blue-400' },
                { label: 'Stato AI', value: 'Attiva', color: 'text-green-400' },
              ].map(s => (
                <div key={s.label} className="bg-zinc-900 border border-white/10 rounded-xl p-4">
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Insegna nuova risposta */}
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-1">🧠 Insegna una nuova risposta</h2>
              <p className="text-zinc-400 text-sm mb-6">
                Aggiungi domande e risposte personalizzate. L'AI le usa con priorità massima.
              </p>
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-1">Domanda / Trigger</label>
                  <input
                    type="text"
                    value={aiForm.question}
                    onChange={e => setAiForm(f => ({ ...f, question: e.target.value }))}
                    placeholder="Es: quanto costa la spedizione express?"
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-1">Parole chiave (separate da virgola)</label>
                  <input
                    type="text"
                    value={aiForm.keywords}
                    onChange={e => setAiForm(f => ({ ...f, keywords: e.target.value }))}
                    placeholder="Es: spedizione, express, veloce, consegna rapida"
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-1">Risposta dell'AI</label>
                  <textarea
                    value={aiForm.answer}
                    onChange={e => setAiForm(f => ({ ...f, answer: e.target.value }))}
                    placeholder="Es: La spedizione express 24h costa €9,90. Disponibile per ordini entro le 14:00."
                    rows={4}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange text-sm resize-none"
                  />
                </div>
                <button
                  onClick={handleSaveAiKnowledge}
                  disabled={isSavingAi}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-orange hover:bg-orange-600 disabled:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
                >
                  {isSavingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salva & Addestra AI
                </button>
              </div>
            </div>

            {/* Knowledge base */}
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">📚 Risposte apprese ({aiKnowledge.length})</h2>
              {aiKnowledge.length === 0 ? (
                <p className="text-zinc-500 text-sm">Nessuna risposta personalizzata. Aggiungine una sopra!</p>
              ) : (
                <div className="space-y-3">
                  {aiKnowledge.map(k => (
                    <div key={k.id} className="bg-zinc-950 border border-white/5 rounded-xl p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-white truncate">❓ {k.question}</div>
                        {k.keywords && <div className="text-xs text-zinc-500 mt-0.5">🔑 {k.keywords}</div>}
                        <div className="text-sm text-zinc-400 mt-1 line-clamp-2">💬 {k.answer}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteAiKnowledge(k.id)}
                        className="shrink-0 p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Log conversazioni */}
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-2">💬 Ultime conversazioni</h2>
              <p className="text-zinc-500 text-sm mb-4">Vedi cosa chiedono i clienti per migliorare le risposte.</p>
              {aiLogs.length === 0 ? (
                <p className="text-zinc-600 text-sm">Nessuna conversazione registrata ancora.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {aiLogs.map(log => (
                    <div key={log.id} className="bg-zinc-950 border border-white/5 rounded-xl p-4">
                      <div className="text-xs text-zinc-500 mb-2">
                        {log.timestamp?.toDate?.()?.toLocaleString('it-IT') ?? 'Data non disponibile'}
                      </div>
                      <div className="text-sm font-bold text-brand-orange mb-1">👤 {log.userMessage}</div>
                      <div className="text-sm text-zinc-400 line-clamp-2">🤖 {log.botResponse}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab Utenti ─────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Totale registrati', value: registeredUsers.length, color: 'text-brand-orange', icon: UsersIcon },
                { label: 'Email verificate', value: registeredUsers.filter((u:any)=>u.emailVerified).length, color: 'text-green-400', icon: CheckCircle2 },
                { label: 'Ultimi 7 giorni', value: registeredUsers.filter((u:any)=>{try{const d=u.createdAt?.toDate?.()||new Date(u.createdAt);return d&&(Date.now()-d.getTime())<7*86400000;}catch{return false;}}).length, color: 'text-blue-400', icon: TrendingUp },
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
                        } catch {}
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
        )}

        {/* ── Tab Monitoring ─────────────────────────────────────────── */}
        {activeTab === 'monitoring' && (
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
                <button onClick={loadStats} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-zinc-950 hover:bg-zinc-800 border border-white/5 rounded-lg transition-colors">Aggiorna</button>
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
                    } catch {}
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
        )}
        </div>
      </main>
    </div>
  );
}
