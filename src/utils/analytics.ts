/**
 * Google Analytics 4 & Meta Pixel — utility layer
 * Reads VITE_GA4_MEASUREMENT_ID and VITE_META_PIXEL_ID from env.
 * Falls back gracefully if GA4 is not configured (no errors thrown).
 */

import { trackMetaPageView, trackMetaAddToCart, trackMetaBeginCheckout, trackMetaPurchase } from './metaPixel';

const GA_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;

/** True only when the gtag snippet has been injected and GA_ID is set. */
function isReady(): boolean {
  return !!GA_ID && typeof window !== 'undefined' && typeof (window as any).gtag === 'function';
}

/**
 * Track a page-view. Call this every time the user navigates to a new route.
 * @param path  e.g. '/prodotto/abc123'
 * @param title Human-readable page title
 */
export function trackPageView(path: string, title?: string): void {
  if (isReady()) {
    (window as any).gtag('config', GA_ID, {
      page_path: path,
      page_title: title,
    });
  }
  trackMetaPageView();
}

/**
 * Track a custom GA4 event.
 * @param action  e.g. 'add_to_cart', 'begin_checkout', 'coupon_applied'
 * @param params  Any extra parameters (category, label, value, …)
 */
export function trackEvent(
  action: string,
  params?: Record<string, string | number | boolean | undefined>,
): void {
  if (!isReady()) return;
  (window as any).gtag('event', action, params ?? {});
}

/**
 * Track e-commerce: add_to_cart
 */
export function trackAddToCart(product: {
  id: string;
  name: string;
  price: number;
  category?: string;
  brand?: string;
}): void {
  trackEvent('add_to_cart', {
    currency: 'EUR',
    value: product.price,
    items: JSON.stringify([
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        item_brand: product.brand,
        price: product.price,
        quantity: 1,
      },
    ]),
  });
  trackMetaAddToCart(product);
}

/**
 * Track e-commerce: begin_checkout
 */
export function trackBeginCheckout(total: number): void {
  trackEvent('begin_checkout', { currency: 'EUR', value: total });
  trackMetaBeginCheckout(total);
}

/**
 * Track e-commerce: purchase (after successful payment)
 */
export function trackPurchase(orderId: string, total: number): void {
  trackEvent('purchase', {
    transaction_id: orderId,
    value: total,
    currency: 'EUR',
  });
  trackMetaPurchase(orderId, total);
}

/**
 * Track WhatsApp click (custom event)
 */
export function trackWhatsAppClick(context?: string): void {
  trackEvent('whatsapp_click', { event_category: 'engagement', event_label: context });
}

/**
 * Track search query in shop
 */
export function trackSearch(query: string): void {
  trackEvent('search', { search_term: query });
}
