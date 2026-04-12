import { useEffect } from 'react';

interface SEOConfig {
  title: string;
  description: string;
  url?: string;
  image?: string;
}

const BASE_URL = 'https://officinadelsuono-87986.web.app';
const DEFAULT_IMAGE = `${BASE_URL}/amerigo_hero.png`;

export function useSEO({ title, description, url, image }: SEOConfig) {
  useEffect(() => {
    const fullTitle = title.includes('Officina del Suono')
      ? title
      : `${title} | Officina del Suono`;
    const canonical = url ? `${BASE_URL}${url}` : BASE_URL;
    const ogImage = image || DEFAULT_IMAGE;

    // Title
    document.title = fullTitle;

    // Helper to set/create a meta tag
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        const [attrName, attrValue] = selector.replace('meta[', '').replace(']', '').split('="');
        el.setAttribute(attrName, attrValue.replace('"', ''));
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    setMeta('meta[name="title"]', 'content', fullTitle);
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', canonical);
    setMeta('meta[property="og:image"]', 'content', ogImage);
    setMeta('meta[name="twitter:title"]', 'content', fullTitle);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:url"]', 'content', canonical);
    setMeta('meta[name="twitter:image"]', 'content', ogImage);
    setLink('canonical', canonical);
  }, [title, description, url, image]);
}
