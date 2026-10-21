"use client";

import { useEffect, useState } from "react";

export type Prefs = { autoFinish: boolean; hardMode: boolean };
const defaults: Prefs = { autoFinish: false, hardMode: false };
const KEY = "sudoku-prefs-v1";

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return { autoFinish: !!parsed.autoFinish, hardMode: !!parsed.hardMode };
    }
  } catch { /* storage unavailable or corrupt */ }
  return defaults;
}

export function savePrefs(prefs: Prefs) {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* storage unavailable */ }
}

export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(defaults);
  useEffect(() => { queueMicrotask(() => setPrefs(loadPrefs())); }, []);
  const update = (patch: Partial<Prefs>) => setPrefs(current => {
    const next = { ...current, ...patch };
    savePrefs(next);
    return next;
  });
  return { prefs, update };
}
