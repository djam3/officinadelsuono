import { Timestamp } from 'firebase/firestore';

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
  specs?: {
    watt?: string;
    frequency?: string;
    inputs?: string;
    outputs?: string;
    dimensions?: string;
    weight?: string;
  };
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
  angle: 'product' | 'educational' | 'engagement' | 'promotional';
  reasoning: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
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
