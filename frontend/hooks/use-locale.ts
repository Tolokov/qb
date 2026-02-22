"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { Locale } from "@/lib/translations";
export type { Locale } from "@/lib/translations";

const STORAGE_KEY = "querycraft-locale";
const DEFAULT_LOCALE: Locale = "en";

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "ru") return stored;
  return DEFAULT_LOCALE;
}

let currentLocale: Locale = DEFAULT_LOCALE;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Locale {
  return currentLocale;
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

function setLocaleValue(locale: Locale) {
  currentLocale = locale;
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, locale);
  for (const l of listeners) l();
}

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const stored = getStoredLocale();
    if (stored !== currentLocale) {
      currentLocale = stored;
      for (const l of listeners) l();
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleValue(l);
  }, []);

  return { locale, setLocale };
}
