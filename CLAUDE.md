# CLAUDE.md — Officina del Suono

Questo file fornisce istruzioni a QUALSIASI AI agent (Claude Code, Gemini, Cursor, Copilot, ecc.)
che lavora su questo repository. Leggilo SEMPRE prima di fare modifiche.

## PROGETTO

**Officina del Suono** — E-commerce di attrezzatura DJ con funzionalità AI integrate.

**Tech stack:** React 19, TypeScript, Vite 6, Firebase 12, Tailwind CSS 4,
Framer Motion 12, Zustand 5, Three.js, Express, Google GenAI, Resend

**Deploy:** Firebase Hosting + Firebase Functions
**Database:** Firestore
**Auth:** Firebase Auth
**Storage:** Google Cloud Storage
**Email:** Resend
**AI:** Google GenAI (Gemini)

## STRUTTURA

```
src/                    # Codice frontend React
  ai-features/          # Moduli AI (consulente, SEO, email, quiz, recensioni)
  components/           # Componenti UI condivisi
  contexts/             # React context providers
  hooks/                # Custom React hooks
  pages/                # Pagine (Home, Shop, Product, Admin, Blog, ecc.)
  services/             # Service layer (AI, chatbot)
  store/                # Zustand stores
  utils/                # Utility functions

functions/              # Firebase Cloud Functions
public/                 # Asset statici
server.ts               # Backend Express

.loki/                  # Loki Mode — stato runtime e memoria agenti
references/             # Documentazione dettagliata (16 file)
autonomy/               # Regole costituzionali
benchmarks/             # Script di benchmark
```

## REGOLE OBBLIGATORIE

### Git — Commit e Push sempre
**DOPO OGNI MODIFICA** al codice, l'agente DEVE:
1. `git add` dei file modificati
2. `git commit -m "type(scope): descrizione"` con messaggio semantico
3. `git push origin main`

Tipi di commit: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

**NON si finisce MAI una sessione di lavoro senza aver pushato su GitHub.**

### Codice
- Tutto il testo visibile all'utente DEVE essere in **italiano**
- Tema scuro obbligatorio: sfondo `zinc-950`
- Colore brand: `#F27D26` (brand-orange)
- TypeScript strict: MAI usare `any` senza giustificazione documentata
- Ogni operazione Firebase deve avere try-catch con gestione errori
- Le immagini vanno compresse prima dell'upload
- Le email funzionano con Resend quando la API key è presente, altrimenti degradano senza errori
- Three.js non deve bloccare il main thread
- Lazy loading obbligatorio per tutte le pagine (`React.lazy`)
- Animazioni Framer Motion: target 60fps

### Sicurezza
- MAI committare `.env`, API key, o credenziali nel codice
- MAI disabilitare le regole di sicurezza Firestore
- MAI bypassare TypeScript strict mode
- MAI eliminare dati in produzione senza backup

### ⚠️ CHECKLIST DI SICUREZZA OBBLIGATORIA — da eseguire PRIMA di ogni deploy

Ogni modifica al codice DEVE superare questi controlli prima del commit:

**1. Firestore Rules**
- Ogni nuova collection usata nel codice DEVE avere una regola esplicita in `firestore.rules`
- Le collection con dati sensibili (chiavi API, ordini, fatture, sconti) devono richiedere `isAdmin()`
- `allow read/write: if true` è VIETATO salvo per dati pubblici (products, reviews, shipping_couriers)
- Dopo ogni modifica a `firestore.rules` eseguire: `npx firebase deploy --only firestore:rules`

**2. Esposizione chiavi API**
- MAI usare variabili `VITE_*` per chiavi API — vengono incluse nel bundle JS pubblico
- Le chiavi AI (Groq, OpenAI, ecc.) vanno salvate solo in localStorage (via admin panel) o Firestore (con regola admin-only)
- Verificare che nessun secret appaia nei network requests tramite DevTools

**3. Validazione input**
- Ogni `allow create: if true` in Firestore DEVE avere una funzione di validazione dei campi
- Non accettare mai campi arbitrari da utenti non autenticati senza validazione di tipo e lunghezza

**4. HTTP Security Headers**
- Il file `firebase.json` deve mantenere gli header: `X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `Referrer-Policy`
- Non rimuovere header di sicurezza esistenti

**5. Sequenza obbligatoria pre-deploy**
```bash
npm run lint          # 1. TypeScript: zero errori
npm run build         # 2. Build: zero errori
# Se modificato firestore.rules:
npx firebase deploy --only firestore:rules   # 3. Deploy rules
npm run deploy        # 4. Deploy hosting
```

## COMANDI

```bash
# Sviluppo
npm run dev          # Avvia server Express + Vite (localhost:3000)

# Build
npm run build        # Build produzione (Vite)

# Type check
npm run lint         # tsc --noEmit

# Deploy
npm run deploy       # Build + Firebase deploy hosting

# Benchmark
./benchmarks/run-benchmarks.sh project --execute
```

## DOCUMENTAZIONE LOKI MODE

Per dettagli approfonditi, consulta:
- `SKILL.md` — Definizione completa del sistema Loki Mode
- `references/architecture.md` — Architettura del progetto
- `references/core-workflow.md` — Ciclo RARV
- `references/agent-types.md` — 37 tipi di agenti
- `references/quality-control.md` — Sistema di qualità
- `references/deployment.md` — Procedure di deploy
- `references/spec-driven-dev.md` — Modelli dati e API
- `autonomy/constitution.md` — Regole costituzionali (priorità massima)

## DON'TS

- Non committare `.env`, `credentials.json`, o segreti
- Non modificare `firestore.rules` senza verificare l'impatto
- Non aggiungere dipendenze al `package.json` senza giustificazione
- Non creare file superiori a 250KB (Admin.tsx è già a 217KB — attenzione!)
- Non saltare il push su GitHub alla fine delle modifiche
- Non procedere se la build TypeScript fallisce
