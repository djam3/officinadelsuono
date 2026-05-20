/**
 * Meta Pixel — utility layer
 * Reads VITE_META_PIXEL_ID from env.
 * Falls back gracefully if Meta Pixel is not configured (no errors thrown).
 */

const META_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

/** True only when the Meta Pixel snippet has been injected and META_ID is set. */
function isReady(): boolean {
  return !!META_ID && typeof window !== 'undefined' && typeof (window as any).fbq === 'function';
}

/**
 * Track a page-view.
 */
export function trackMetaPageView(): void {
  if (!isReady()) return;
  (window as any).fbq('track', 'PageView');
}

/**
 * Track a custom Meta event.
 */
export function trackMetaEvent(
  action: string,
  params?: Record<string, any>,
): void {
  if (!isReady()) return;
  (window as any).fbq('track', action, params ?? {});
}

export function trackMetaAddToCart(product: {
  id: string;
  name: string;
  price: number;
}): void {
  trackMetaEvent('AddToCart', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: product.price,
    currency: 'EUR',
  });
}

export function trackMetaBeginCheckout(total: number): void {
  trackMetaEvent('InitiateCheckout', {
    value: total,
    currency: 'EUR',
  });
}

export function trackMetaPurchase(orderId: string, total: number): void {
  trackMetaEvent('Purchase', {
    value: total,
    currency: 'EUR',
    order_id: orderId,
  });
}
