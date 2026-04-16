import { Timestamp } from 'firebase/firestore';

export interface ProductVariant {
  id: string;          // es. "color-nero", "bundle-pro"
  label: string;       // es. "Nero", "Bundle Pro"
  priceModifier: number; // differenza rispetto al prezzo base (0, +50, -20, ecc.)
  stock: number;
  sku?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  image: string;
  images?: string[];
  badge?: string;
  draft?: boolean;
  createdAt?: string | Timestamp;
  brand?: string;
  // Spedizione
  weightKg?: number;
  dimensionsMm?: {
    lunghezza: number;
    larghezza: number;
    altezza: number;
  };
  specs?: {
    watt?: string;
    frequency?: string;
    inputs?: string;
    outputs?: string;
    dimensions?: string;
    weight?: string;
  };
  stock?: number;
  seoTitle?: string;
  metaDescription?: string;
  bullets?: string[];
  summary?: string;
  pros?: string[];
  cons?: string[];
  verdict?: string;
  disclaimer?: string;
  reviewSummary?: {
    summary: string;
    pros: string[];
    cons: string[];
    verdict: string;
    disclaimer?: string;
  };
  variants?: ProductVariant[];
  hasVariants?: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName?: string;
  name?: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt?: any; // Firestore Timestamp typically
  lastLogin?: any;
}

export interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  timestamp: any; // Firestore Timestamp
}

export interface SocialPost {
  id: string;
  text: string;
  imageUrl?: string;
  platforms: string[];
  status: 'publishing' | 'published' | 'failed' | 'scheduled';
  createdAt: any;
  publishedAt?: any;
}

export interface SocialSuggestion {
  id: string;
  caption: string;
  hashtags: string[];
  platforms: string[];
  angle: 'product' | 'educational' | 'engagement' | 'promotional' | 'tiktok_video';
  reasoning: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  // TikTok video fields
  hook?: string;
  script?: string;
  videoPrompt?: string;
}

export interface SocialConnection {
  connected: boolean;
  accountName?: string;
  followers?: number;
  lastSync?: any;
}

export interface SocialStats {
  updatedAt: any;
  instagram?: { followers: number };
  facebook?: { followers: number };
  tiktok?: { followers: number };
}

export interface AIKnowledge {
  id: string;
  question: string;
  answer: string;
  keywords: string;
  hits: number;
  createdAt: string;
}

export interface AILog {
  id: string;
  userMessage: string;
  botResponse: string;
  timestamp: any;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  content: string;
  featured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  active: boolean;
  createdAt: string;
}

export interface Invoice {
  id: string;
  type: 'acquisto' | 'vendita';
  number: string;
  date: string;
  dueDate: string;
  counterparty: string;
  vatNumber?: string;
  description?: string;
  amount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  status: 'pagata' | 'in_attesa' | 'scaduta' | 'annullata';
  pdfUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteContent {
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  hero_body: string;
  hero_cta1: string;
  hero_cta2: string;
  features_title: string;
  features_subtitle: string;
  feat1_title: string;
  feat1_body: string;
  feat2_title: string;
  feat2_body: string;
  feat3_title: string;
  feat3_body: string;
  updatedAt?: string;
}
