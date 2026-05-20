# Analisi Struttura Sito — Officina del Suono

> Documento generato il 12 aprile 2026 a partire dall'ispezione diretta del codice sorgente del progetto.
> Destinatari: team interno, consulente esterno, stakeholder.

---

## Cosa emerge subito (10 punti rapidi)

1. **SPA React con routing client-side custom.** Non usa React Router ma window.history.pushState. I crawler senza JS non vedranno i contenuti delle pagine secondarie: rischio SEO reale.
2. **Identita del brand fortissima e coerente.** Amerigo De Cristofaro e presente su ogni pagina con foto, citazione diretta e certificazione MAT Academy.
3. **WhatsApp e il canale di conversione primario**, non il carrello. Ogni sezione ha almeno un link a wa.me/393477397016. Pulsante sticky WhatsApp permanente sulla Home.
4. **Pannello Admin molto completo** (15 sezioni: prodotti, ordini, blog, social, fatture, contabilita, spedizioni, chatbot AI, newsletter, utenti, monitoring, codici sconto, contenuti sito).
5. **Catalogo prodotti quasi vuoto.** Un unico prodotto hardcoded di fallback (bundle-start-dj-pro) con immagine Unsplash. Il catalogo Firestore non e popolato in produzione.
6. **Funzionalita AI concrete e ben architettate:** chatbot su catalogo Firestore, quiz AI Setup Architect, confronto prodotti con parere AI, riepilogo recensioni AI.
7. **Infrastruttura legale completa e aggiornata** (Termini, Privacy GDPR, Cookie Policy data 7 aprile 2026). P.IVA e REA presenti nel footer.
8. **Nessun sistema di recensioni verificate.** Le recensioni si possono scrivere liberamente senza acquisto verificato, esponendo a manipolazioni.
9. **La sitemap.xml non include le pagine prodotto** (/prodotto/:id) e i post blog (/blog/:id), penalizzando il SEO long-tail.
10. **Soglia spedizione gratuita incoerente:** footer dice 99 EUR, FAQ Contatti dice 199 EUR. Crea confusione nel cliente.

---

## 1. Panoramica del Progetto

| Campo | Valore |
|---|---|
| **Nome** | Officina del Suono (deploy: officinadelsuono-87986.web.app) |
| **Tipo** | E-commerce B2C con funzionalita di consulenza specializzata |
| **Settore** | Attrezzatura DJ e audio professionale |
| **Target** | DJ principianti, appassionati, professionisti; budget da 200 EUR a 8.000 EUR+ |
| **Fondatore** | Amerigo De Cristofaro, Sound Engineer certificato MAT Academy, Forino (AV) |
| **Forma giuridica** | Ditta individuale — P.IVA 03243690645 — Codice ATECO 47.69.12 |
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS 4, Framer Motion 12, Three.js |
| **Backend** | Express.js + Firebase Cloud Functions |
| **Database** | Firestore (Firebase 12) |
| **Auth** | Firebase Auth (email/password + Google OAuth) |
| **AI** | Google GenAI (Gemini), Groq (Llama 3.3 70B), Anthropic Claude SDK |
| **Email** | Resend |
| **Storage** | Google Cloud Storage |
| **Deploy** | Firebase Hosting |
| **State management** | Zustand 5 (carrello) + React Context (AI features, Builder) |

Il sito non si posiziona come marketplace generico ma come punto di accesso a un esperto certificato che ha testato ogni prodotto sul campo. Il tagline "Non un Altro Negozio Online" sintetizza la proposta di valore. La consulenza gratuita su WhatsApp (15 minuti) e il principale strumento di acquisizione.

---

## 2. Struttura delle Pagine

### Elenco completo delle rotte

| URL | Nome interno | Funzione |
|---|---|---|
| / | Home | Landing page principale, hero, categorie, quiz teaser, CTA WhatsApp |
| /shop | Shop | Catalogo prodotti con filtri, ricerca full-text (Fuse.js), ordinamento |
| /prodotto/:id | Product | Scheda prodotto: galleria, specs, recensioni, consigli AI |
| /blog | Blog | Lista articoli, filtri per categoria, ricerca, articoli SEO |
| /blog/:id | BlogPost | Articolo singolo con contenuto rich-text HTML, prodotti correlati |
| /quiz | Quiz - AI Setup Architect | Wizard 4 step, raccomandazione AI personalizzata |
| /chi-siamo | AboutUs | Storytelling del founder, timeline, certificazioni |
| /contatti | Contact | Contatti, FAQ accordion |
| /confronta | Compare | Confronto side-by-side fino a 3 prodotti, parere AI |
| /profilo | Profile | Gestione account utente: nome, foto, password |
| /admin | Admin | Pannello amministrazione completo (solo email autorizzata) |
| /termini | Terms | Termini e condizioni di vendita |
| /privacy | Privacy | Privacy Policy GDPR |
| /cookie-policy | CookiePolicy | Cookie Policy |

### Gerarchia ad albero



### Navigazione principale (Navbar desktop)

- Logo -> Home
- **Prodotti** (dropdown hover): Setup Curati by Amerigo, Kit Pronti, Controller DJ, Mixer & Effetti, Casse Attive (PA), Cuffie Pro, Vinili, Cavi, Accessori
- Confronta
- Blog
- Chi Siamo
- Accedi / Avatar utente (dropdown: Profilo, Pannello Admin se admin, Esci)
- Carrello (con badge contatore)

**Nota critica:** La voce "Contatti" e assente dalla Navbar desktop ma presente nel menu mobile. Gli utenti desktop devono scorrere fino al footer per trovare i contatti.

### Footer (5 colonne su desktop)

1. Brand + descrizione
2. Shop (link a categorie)
3. Risorse (Blog, Chi Siamo)
4. Supporto (Contatti, Termini, WhatsApp +39 347 739 7016, info@officina-del-suono.it)
5. Trust bar: Spedizione Gratuita, Garanzia 2 Anni, Esperto Certificato, Supporto WhatsApp

Footer bottom: PaymentLogos, dati legali completi (P.IVA, REA, PEC), link Privacy/Termini/Cookie/ODR.

---

## 3. Mappa dei Contenuti

### Home

| Elemento | Contenuto |
|---|---|
| H1 | Massimo SPL. / Zero Distorsione. (modificabile via Builder) |
| Badge hero | Sound Engineer Certificato MAT Academy |
| Sottotitolo | Setup Ingegnerizzati. Progettiamo catene audio su misura per chi esige performance reali. |
| CTA primaria | Pulsante arancione Trova il tuo Setup -> /shop |
| CTA secondaria | Link WhatsApp Consulenza Gratuita |
| Social proof bar | 50+ Setup consegnati, 100% Clienti soddisfatti, 15 min Consulenza, MAT Certificazione (valori hardcoded) |
| Sezione differenziatori | Foto Amerigo + 3 punti: Esperto Certificato, Catalogo Curato, Consulenza Gratuita |
| AI Quiz banner | TiltCard con CTA Inizia il Test -> /quiz |
| Categorie | 4 card: Controller DJ, Casse Attive PA, Cuffie Pro, Mixer & Effetti |
| Setup Curati | 4 bundle teaser: Starter Kit 200-400 EUR, Home DJ 500-1.000 EUR, Mobile DJ Pro 1.500-3.000 EUR, Club Ready 3.000-8.000+ EUR |
| CTA WhatsApp | Sezione dedicata con pulsante verde + pulsante sticky fisso in basso a destra |
| Contenuti mancanti | Nessuna testimonianza reale di clienti, nessun video dimostrativo, statistiche hardcoded |

### Shop

| Elemento | Contenuto |
|---|---|
| Meta title | Shop - Attrezzatura DJ & Audio Professionale |
| Filtri | Categorie badge, Ordinamento (Popolarita/Prezzo/Novita), Ricerca fuzzy Fuse.js |
| Ricerca | Fuse.js threshold 0.4 su name e category |
| Schede prodotto | Immagine, nome, prezzo, badge, stelle medie, Aggiungi al Carrello, toggle confronto |
| PROBLEMA CRITICO | Un solo prodotto hardcoded (bundle-start-dj-pro) con immagine Unsplash. Catalogo Firestore non popolato. |
| Contenuti mancanti | Prezzi scontati, filtro per fascia di prezzo, breadcrumb, paginazione esplicita |

### Prodotto singolo

| Elemento | Contenuto |
|---|---|
| H1 | Nome prodotto dinamico da Firestore |
| Galleria | Multi-immagine con fullscreen, navigazione con frecce |
| Info | Prezzo, badge, categoria, descrizione, spec tecniche (watt, frequenza, ingressi, uscite, dimensioni) |
| CTA | Aggiungi al Carrello + checkout diretto + consulenza WhatsApp |
| Shipping | Quote corrieri in tempo reale su peso/dimensioni prodotto |
| AI Advice | Consiglio dell'esperto AI generata da Gemini/Groq |
| Recensioni | Stelle, testo, like/dislike, riepilogo AI con disclaimer |
| Problema SEO | Nessun Product schema.org per rich snippet Google |

### Blog

| Elemento | Contenuto |
|---|---|
| Meta title | Blog - Officina del Suono: Guide e Tutorial DJ |
| Articoli | Mix di articoli hardcoded (MOCK_POSTS nel codice) + articoli da Firestore |
| Categorie | Guide Acquisto, Tutorial, News, Setup Tips |
| Problema | Articoli mock hardcoded nel sorgente: misti agli articoli Firestore, potenziale duplicazione |

### Chi Siamo

| Elemento | Contenuto |
|---|---|
| H1 | Oltre il Negozio: Un Laboratorio di Passione. |
| Sezioni | Storytelling fondazione, foto Amerigo, citazione diretta, badge MAT Academy |
| Contenuti mancanti | Nessun video di presentazione, nessun link ai social, nessun Person schema.org |

### Contatti

| Elemento | Contenuto |
|---|---|
| H1 | Contatti |
| Canali | WhatsApp +39 347 739 7016, Email info@officina-del-suono.it |
| FAQ | 5 domande in accordion: consegne, spedizione gratuita 199 EUR, garanzia, consulenza, pagamenti |
| PROBLEMA | Form di contatto assente. L'utente deve usare WhatsApp o email manualmente. |

### Quiz / AI Setup Architect

| Elemento | Contenuto |
|---|---|
| Meta title | AI Setup Architect - Trova il Setup DJ Perfetto per Te |
| Step 1 | Livello: Principiante / Intermedio / Pro |
| Step 2 | Genere: House / Techno / Hip Hop / Open Format |
| Step 3 | Ambiente: Home Studio / Club / Live/Eventi |
| Step 4 | Budget: Entry / Mid / High |
| Output AI | Setup consigliato con descrizione, razionale, range prezzo, prodotto dal catalogo Firestore |
| Fallback | Raccomandazione statica predefinita se AI non disponibile |

### Admin

15 sezioni accessibili solo per officinadelsuono99@gmail.com:

- **Negozio:** Dashboard, Ordini, Prodotti (con gestione stock), Spedizioni
- **Clienti:** Utenti, Newsletter
- **Marketing:** Blog, Social Media, Codici Sconto
- **Contenuti & AI:** Contenuti Sito, AI Chatbot, Funzionalita AI
- **Amministrazione:** Fatture, Contabilita, Monitoring

---

