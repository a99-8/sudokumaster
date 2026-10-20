"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { accents, basePalettes, themes, themeVariables, type Accent, type Theme } from "./palette";

const ThemeContext = createContext<{ theme: Theme; accent: Accent; setTheme: (theme: Theme) => void; setAccent: (accent: Accent) => void; storageAvailable: boolean }>({ theme: "white", accent: "green", setTheme: () => {}, setAccent: () => {}, storageAvailable: true });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("white");
  const [accent, setAccent] = useState<Accent>("green");
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem("sudoku-theme-v1");
        const secondary = localStorage.getItem("sudoku-accent-v1");
        if (themes.includes(stored as Theme)) setTheme(stored as Theme);
        if (accents.includes(secondary as Accent)) setAccent(secondary as Accent);
      } catch { setStorageAvailable(false); }
      setReady(true);
    });
  }, []);
  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.accent = accent;
    root.dataset.tone = basePalettes[theme].dark ? "dark" : "light";
    root.style.colorScheme = basePalettes[theme].dark ? "dark" : "light";
    for (const [key, value] of Object.entries(themeVariables(theme, accent))) root.style.setProperty(key, value);
    try { localStorage.setItem("sudoku-theme-v1", theme); localStorage.setItem("sudoku-accent-v1", accent); }
    catch { queueMicrotask(() => setStorageAvailable(false)); }
  }, [theme, accent, ready]);
  return <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent, storageAvailable }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
