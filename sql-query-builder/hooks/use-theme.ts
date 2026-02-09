"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "midnight" | "highcontrast";

export const THEMES: { id: Theme; label: string; description: string }[] = [
  { id: "light", label: "Light", description: "macOS light theme" },
  { id: "dark", label: "Dark", description: "Soft dark mode" },
  { id: "midnight", label: "Midnight", description: "Deep blue for long sessions" },
  { id: "highcontrast", label: "High Contrast", description: "Accessibility-friendly" },
];

const STORAGE_KEY = "querycraft-theme";
const DEFAULT_THEME: Theme = "light";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && THEMES.some((t) => t.id === stored)) return stored as Theme;
  return DEFAULT_THEME;
}

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  // Enable smooth transition
  html.setAttribute("data-transitioning", "");
  html.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
  // Remove transitioning flag after animation completes
  setTimeout(() => html.removeAttribute("data-transitioning"), 300);
}

// Tiny external store so multiple components stay in sync without context
let currentTheme: Theme = DEFAULT_THEME;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
  return currentTheme;
}

function getServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

function setThemeValue(theme: Theme) {
  currentTheme = theme;
  applyTheme(theme);
  for (const l of listeners) l();
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = getStoredTheme();
    if (stored !== currentTheme) {
      currentTheme = stored;
      document.documentElement.setAttribute("data-theme", stored);
      for (const l of listeners) l();
    }
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeValue(t);
  }, []);

  return { theme, setTheme, themes: THEMES };
}
