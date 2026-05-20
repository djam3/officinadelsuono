/// <reference types="vite/client" />

export {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GtagArgs = [string, ...any[]];

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
    /** Google Analytics 4 measurement ID injected by index.html */
    __GA_ID: string;
    /** GA4 gtag function — undefined when GA_ID is not configured */
    gtag: (...args: GtagArgs) => void;
    /** GA4 data layer array */
    dataLayer: GtagArgs[];
  }
}

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_GA4_MEASUREMENT_ID: string;
  readonly VITE_GOOGLE_SITE_VERIFICATION: string;
}
