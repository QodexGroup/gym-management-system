import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  STORAGE_KEY,
  DEFAULT_FONT,
  DEFAULT_MODE,
  DEFAULT_THEME,
  getFontStack,
} from '../constants/appearance';

const ThemeContext = createContext(null);

const readStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt/unavailable storage
  }
  return {};
};

const prefersDark = () =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

// Resolve the user's mode preference to an actual 'light' | 'dark' value.
const resolveMode = (mode) => (mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode);

// Apply all three appearance dimensions to <html>. Kept standalone so the
// no-flash inline script in index.html can mirror this logic, and exported so
// the Appearance page can live-preview a draft without persisting it.
export const applyAppearance = ({ mode, theme, font }) => {
  const root = document.documentElement;
  root.setAttribute('data-mode', resolveMode(mode));
  root.setAttribute('data-theme', theme);
  root.style.setProperty('--font-app', getFontStack(font));
};

export const ThemeProvider = ({ children }) => {
  const stored = readStored();
  const [mode, setModeState] = useState(stored.mode || DEFAULT_MODE);
  const [theme, setThemeState] = useState(stored.theme || DEFAULT_THEME);
  const [font, setFontState] = useState(stored.font || DEFAULT_FONT);

  // Apply + persist whenever any dimension changes.
  useEffect(() => {
    applyAppearance({ mode, theme, font });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, theme, font }));
    } catch {
      // ignore unavailable storage
    }
  }, [mode, theme, font]);

  // Live-update when the OS theme changes and the user is on 'system'.
  useEffect(() => {
    if (mode !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyAppearance({ mode, theme, font });
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode, theme, font]);

  const setMode = useCallback((m) => setModeState(m), []);
  const setTheme = useCallback((t) => setThemeState(t), []);
  const setFont = useCallback((f) => setFontState(f), []);

  // Commit a full draft at once (used by the Save button on the Appearance page).
  // The persist + apply effect runs from the resulting state change.
  const save = useCallback((draft) => {
    setModeState(draft.mode);
    setThemeState(draft.theme);
    setFontState(draft.font);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ mode, theme, font, resolvedMode: resolveMode(mode), setMode, setTheme, setFont, save, applyAppearance }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
