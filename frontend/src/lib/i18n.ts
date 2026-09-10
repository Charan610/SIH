import { LanguageCode } from "@/types/api";
import enTranslations from "@/locales/en/common.json";
import teTranslations from "@/locales/te/common.json";
import hiTranslations from "@/locales/hi/common.json";

export const translations = {
  en: enTranslations,
  te: teTranslations,
  hi: hiTranslations,
};

export type TranslationDictionary = typeof enTranslations;

/**
 * Robust nested key lookup with automatic English fallback and developer missing-key warnings.
 */
export function translate(
  lang: LanguageCode = "en",
  key: string,
  fallback?: string
): string {
  const selectedDict = translations[lang] || translations.en;
  const englishDict = translations.en;

  const getNestedValue = (obj: any, path: string): string | undefined => {
    if (!obj || typeof obj !== "object") return undefined;
    const parts = path.split(".");
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return typeof current === "string" ? current : undefined;
  };

  // 1. Try selected language
  const value = getNestedValue(selectedDict, key);
  if (value !== undefined) return value;

  // 2. Fall back to English
  const englishValue = getNestedValue(englishDict, key);
  if (englishValue !== undefined) {
    if (process.env.NODE_ENV === "development" && lang !== "en") {
      console.warn(`[i18n] Missing translation for key "${key}" in language "${lang}". Falling back to English.`);
    }
    return englishValue;
  }

  // 3. Fallback provided or safe readable label
  if (process.env.NODE_ENV === "development") {
    console.warn(`[i18n] Missing translation for key "${key}" in all languages.`);
  }

  if (fallback !== undefined) return fallback;
  const lastPart = key.split(".").pop();
  return lastPart || key;
}

/**
 * Returns a hybrid translation function/object:
 * Callable as `t("nav.home")` AND readable as `t.nav.home`
 */
export function getTranslation(lang: LanguageCode = "en"): TranslationDictionary & ((key: string, fallback?: string) => string) {
  const dict = translations[lang] || translations.en;

  const fn = function (key: string, fallback?: string): string {
    return translate(lang, key, fallback);
  };

  // Attach dictionary properties for direct object access: t.nav.home, t.gov_subtitle, etc.
  return Object.assign(fn, dict);
}
