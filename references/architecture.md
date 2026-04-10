# Architecture — officinadelsuono

## System Overview

Officina del Suono is a DJ equipment e-commerce platform with AI-powered features,
built as a single-page application with a Node.js backend.

```
Client (React SPA)
    |
    v
Express Server (server.ts)
    |
    +---> Firebase Auth (authentication)
    +---> Firestore (database)
    +---> Cloud Storage (file uploads)
    +---> Resend (email)
    +---> Google GenAI (AI features)
    |
    v
Firebase Hosting (production)
Firebase Functions (serverless)
```

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | React | 19 |
| Build Tool | Vite | 6 |
| CSS | Tailwind CSS | 4 |
| Animation | Framer Motion | 12 |
| 3D | Three.js + React Three Fiber | 0.183+ |
| State Management | Zustand | 5 |
| Icons | Lucide React | 0.546+ |
| Backend | Express | 4 |
| Runtime | tsx (TypeScript execution) | 4 |
| Database | Firestore | - |
| Authentication | Firebase Auth | - |
| File Storage | Google Cloud Storage | 7 |
| Email | Resend | 6 |
| AI | Google GenAI (Gemini) | 1.46+ |
| Language | TypeScript | 5.8 |
| Deploy | Firebase Hosting + Functions | 12 |

## Directory Structure

```
officinadelsuono/
  .loki/                        # Loki Mode runtime state
    state.json                  # Orchestrator state
    constitution.md             # Behavioral constraints
    memory/                     # Agent memory system
      episodic/                 # Interaction traces
      semantic/                 # Generalized patterns
      skills/                   # Reusable procedures
    metrics/                    # Performance tracking
      efficiency/               # Token cost per task
      rewards/                  # Outcome signals

  src/                          # Frontend source code
    App.tsx                     # Root component with routing
    main.tsx                    # Entry point, React root
    index.css                   # Global styles
    constants.tsx               # App-wide constants
    firebase.ts                 # Firebase client initialization
    global.d.ts                 # Global TypeScript declarations

    ai-features/                # AI-powered feature modules
      ConsulenteAM3/            # AI consultant feature
      DescrizioniSEO/           # AI SEO descriptions
      EmailPersonalizzate/      # AI personalized emails
      QuizTrovaSetup/           # AI setup quiz
      RecensioniAggregate/      # AI review aggregation

    components/                 # Shared UI components
      AuthModal.tsx             # Authentication modal
      Cart.tsx                  # Shopping cart
      Chatbot.tsx               # AI chatbot
      CookieBanner.tsx          # Cookie consent
      CustomCursor.tsx          # Custom cursor effect
      Footer.tsx                # Site footer
      HeroBackground.tsx        # Hero section background
      HeroCanvas.tsx            # Three.js hero canvas
      Logo.tsx                  # Brand logo
      MouseGlow.tsx             # Mouse glow effect
      Navbar.tsx                # Navigation bar
      PaymentLogos.tsx          # Payment method logos
      ScrollytellingHardware.tsx # Scroll-driven animations
      TiltCard.tsx              # 3D tilt card effect
      builder/                  # Visual builder components
        BuilderToolbar.tsx      # Builder mode toolbar
        EditableMedia.tsx       # Inline media editing
        EditableText.tsx        # Inline text editing

    contexts/                   # React context providers
      AIFeaturesContext.tsx     # AI feature flags context
      BuilderContext.tsx        # Visual builder context

    data/                       # Static data
      djKnowledgeBase.ts        # DJ domain knowledge

    hooks/                      # Custom React hooks
      useCartSync.ts            # Cart synchronization hook

    pages/                      # Route-level page components
      AboutUs.tsx               # About us page
      Admin.tsx                 # Admin dashboard (217KB)
      Blog.tsx                  # Blog listing page
      BlogPost.tsx              # Individual blog post
      Compare.tsx               # Product comparison
      Contact.tsx               # Contact page
      CookiePolicy.tsx          # Cookie policy page
      Home.tsx                  # Homepage
      Privacy.tsx               # Privacy policy
      Product.tsx               # Product detail page
      Profile.tsx               # User profile page
      Quiz.tsx                  # Setup finder quiz
      Shop.tsx                  # Shop/catalog page
      Terms.tsx                 # Terms of service

    services/                   # API service layer
      aiService.ts              # AI API client
      chatbotService.ts         # Chatbot API client

    store/                      # Zustand state stores
      cartStore.ts              # Shopping cart store

    utils/                      # Pure utility functions
      drive.ts                  # Google Drive URL utilities
      errorLogger.ts            # Client-side error logging

  functions/                    # Firebase Cloud Functions
    index.js                    # Cloud function definitions
    package.json                # Functions dependencies

  public/                       # Static assets
    amerigo_hero.png            # Hero section image
    logo.svg                    # Brand logo SVG
    mixer.png                   # Mixer product image
    profile.jpg                 # Profile image
    upload_*.jpg                # Uploaded images

  references/                   # Loki Mode documentation
  autonomy/                     # Constitutional constraints
  benchmarks/                   # Performance benchmarks

  server.ts                     # Express backend server
  firebase.json                 # Firebase configuration
  firestore.rules               # Firestore security rules
  firestore.indexes.json        # Firestore indexes
  vite.config.ts                # Vite build configuration
  tsconfig.json                 # TypeScript configuration
  package.json                  # Project dependencies
```

## Data Flow

### Product Browsing
```
User -> Home/Shop Page -> Firestore (products collection) -> Product Cards
                                                          -> Product Detail
```

### Cart & Checkout
```
User -> Add to Cart -> Zustand cartStore -> Cart Component -> Manual Order API
                                                           -> Email Confirmation (Resend)
```

### Authentication
```
User -> AuthModal -> Firebase Auth -> Firestore (users collection)
                                   -> Welcome Email (Resend)
```

### Admin Operations
```
Admin -> Admin Page -> Firestore CRUD (products, settings, posts)
                    -> Cloud Storage (image upload via /api/upload)
                    -> Newsletter broadcast (Resend)
```

### AI Features
```
User -> AI Feature Component -> Google GenAI API -> Response
                              -> Chatbot Service -> AI Consultant
```

## State Schema

### Global Application State (React)
```typescript
// App.tsx manages:
currentPage: string            // Current route
selectedProductId: string      // Selected product for detail view
paymentStatus: 'success' | 'canceled' | null
isCartOpen: boolean
compareList: Product[]         // Products being compared
toasts: Toast[]                // Notification queue
flyingItems: FlyingItem[]      // Cart animation items
```

### Cart Store (Zustand)
```typescript
// cartStore.ts manages:
items: CartItem[]              // Cart items with quantities
addItem(item)                  // Add product to cart
removeItem(id)                 // Remove product from cart
updateQuantity(id, qty)        // Update item quantity
clearCart()                    // Empty the cart
total: number                  // Computed total price
```

## Key Architectural Decisions

1. **SPA with hash-based routing** — No React Router; navigation is state-based
   via `currentPage` and `handleNavigate` in App.tsx
2. **Lazy loading for all pages** — Using React.lazy + Suspense for code splitting
3. **Server-side rendering not used** — Pure client-side rendering with Vite
4. **Firebase Auth for admin** — Admin identified by email or Firestore role
5. **Express backend proxied via Vite** — Development uses Vite middleware mode
6. **Base64 images in Firestore** — Product images stored as base64 strings
   (up to 800KB per image field in firestore.rules)
7. **Visual builder system** — BuilderContext + EditableText/EditableMedia
   for WordPress-like inline editing
