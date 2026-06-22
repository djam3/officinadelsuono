/**
 * Bilingue IT/EN per la suite di calcolatori.
 * Uso: const { lang, setLang, tx } = useCalcLang();  tx('Frequenza','Frequency')
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

export type CalcLang = 'it' | 'en';

interface CalcLangCtx {
  lang: CalcLang;
  setLang: (l: CalcLang) => void;
  tx: (it: string, en: string) => string;
}

const Ctx = createContext<CalcLangCtx | null>(null);

export function CalcLangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<CalcLang>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('calc_lang') : null;
    return (saved === 'en' || saved === 'it') ? saved : 'it';
  });

  const setLang = useCallback((l: CalcLang) => {
    setLangState(l);
    try { localStorage.setItem('calc_lang', l); } catch { /* ignore */ }
  }, []);

  const tx = useCallback((it: string, en: string) => (lang === 'it' ? it : en), [lang]);

  return <Ctx.Provider value={{ lang, setLang, tx }}>{children}</Ctx.Provider>;
}

export function useCalcLang(): CalcLangCtx {
  const c = useContext(Ctx);
  if (!c) return { lang: 'it', setLang: () => {}, tx: (it) => it };
  return c;
}
