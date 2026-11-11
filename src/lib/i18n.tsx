import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, si, ta, type MsgKey } from "./i18n-messages";

export type Lang = "en" | "si" | "ta";
export const LANGS: { code: Lang; label: string; short: string; profile: string }[] = [
  { code: "en", label: "English", short: "EN", profile: "English" },
  { code: "si", label: "සිංහල", short: "සිං", profile: "Sinhala" },
  { code: "ta", label: "தமிழ்", short: "த", profile: "Tamil" },
];
export const MESSAGES = { en, si, ta } as const;
const STORAGE_KEY = "buildora-lang";

export function translate(lang: Lang, key: MsgKey): string {
  return MESSAGES[lang][key] ?? en[key];
}
export function langFromProfile(value: string | null | undefined): Lang | null {
  return LANGS.find((l) => l.profile === value || l.code === value)?.code ?? null;
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void };
const I18nContext = createContext<Ctx>({ lang: "en", setLang: () => {} });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = langFromProfile(window.localStorage.getItem(STORAGE_KEY));
    if (saved) setLangState(saved);
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);
  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const { lang, setLang } = useContext(I18nContext);
  const t = useCallback((key: MsgKey) => translate(lang, key), [lang]);
  return { t, lang, setLang };
}

export type { MsgKey };
