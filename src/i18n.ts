import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import itTranslations from './locales/it.json';
import enTranslations from './locales/en.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';
import esTranslations from './locales/es.json';
import ptTranslations from './locales/pt.json';
import jaTranslations from './locales/ja.json';
import zhTranslations from './locales/zh.json';
import ruTranslations from './locales/ru.json';

const resources = {
  it: { translation: itTranslations },
  en: { translation: enTranslations },
  fr: { translation: frTranslations },
  de: { translation: deTranslations },
  es: { translation: esTranslations },
  pt: { translation: ptTranslations },
  ja: { translation: jaTranslations },
  zh: { translation: zhTranslations },
  ru: { translation: ruTranslations },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'it',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
