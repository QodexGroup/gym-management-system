// Appearance options — single source of truth for the Themes & Appearance page
// and the ThemeContext. Keep `value`s in sync with src/shared/styles/_theme.scss.

export const STORAGE_KEY = 'gym-appearance';

// --- Fonts -------------------------------------------------------------------
// `stack` is applied to the --font-app CSS variable. Comic Sans uses the system
// font with Comic Neue (Google Fonts) as a cross-platform fallback.
export const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter', desc: 'Clean & neutral (default)', stack: "'Inter', system-ui, sans-serif" },
  { value: 'roboto', label: 'Roboto', desc: 'Crisp & technical', stack: "'Roboto', system-ui, sans-serif" },
  { value: 'nunito', label: 'Nunito Sans', desc: 'Soft & approachable', stack: "'Nunito Sans', system-ui, sans-serif" },
  { value: 'atkinson', label: 'Atkinson Hyperlegible', desc: 'Maximum readability', stack: "'Atkinson Hyperlegible', system-ui, sans-serif" },
  { value: 'comic', label: 'Comic Sans', desc: 'Playful & casual', stack: "'Comic Sans MS', 'Comic Neue', cursive" },
];

export const DEFAULT_FONT = 'inter';

// --- Color modes -------------------------------------------------------------
export const MODE_OPTIONS = [
  { value: 'light', label: 'Light', desc: 'Bright surfaces' },
  { value: 'dark', label: 'Dark', desc: 'Dim surfaces (default)' },
  { value: 'system', label: 'System', desc: 'Match your device' },
];

export const DEFAULT_MODE = 'dark';

// --- Themes ------------------------------------------------------------------
// `primary`/`secondary` are hex previews (the 500 shade) for the swatch UI only;
// the real palettes live in _theme.scss keyed by `value`.
export const THEME_OPTIONS = [
  { value: 'ocean', label: 'Ocean', desc: 'Blue + amber', primary: '#0ea5e9', secondary: '#f59e0b' },
  { value: 'environment', label: 'Environment', desc: 'Green + orange', primary: '#22c55e', secondary: '#f97316' },
  { value: 'sunset', label: 'Sunset', desc: 'Orange + indigo', primary: '#f97316', secondary: '#6366f1' },
  { value: 'royal', label: 'Royal', desc: 'Purple + teal', primary: '#8b5cf6', secondary: '#14b8a6' },
  { value: 'rose', label: 'Rose', desc: 'Pink + emerald', primary: '#f43f5e', secondary: '#10b981' },
  { value: 'slate', label: 'Slate', desc: 'Gray + sky', primary: '#64748b', secondary: '#0ea5e9' },
];

export const DEFAULT_THEME = 'ocean';

export const getFontStack = (value) =>
  (FONT_OPTIONS.find((f) => f.value === value) || FONT_OPTIONS[0]).stack;
