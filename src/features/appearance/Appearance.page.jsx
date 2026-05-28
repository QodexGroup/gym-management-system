import { useState } from 'react';
import Layout from '../../layout/Layout';
import { useTheme } from '../../shared/context/ThemeContext';
import { Toast } from '../../shared/utils/alert';
import { FONT_OPTIONS, MODE_OPTIONS, THEME_OPTIONS, getFontStack } from '../../shared/constants/appearance';
import {
  Check, Sun, Moon, Monitor, Type, Palette, Paintbrush, Save, RotateCcw,
  LayoutDashboard, Users, CalendarDays, CreditCard, Bell,
} from 'lucide-react';

const MODE_ICONS = { light: Sun, dark: Moon, system: Monitor };

const resolveMode = (mode) =>
  mode === 'system'
    ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;

const SectionCard = ({ icon: Icon, title, subtitle, children }) => (
  <div className="card">
    <div className="flex items-start gap-3 mb-5">
      <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-dark-50">{title}</h2>
        {subtitle && <p className="text-sm text-dark-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

// Self-contained preview. Setting data-mode / data-theme / --font-app on this
// container re-scopes the theme CSS variables for its subtree only, so the
// sample reflects the DRAFT without touching the live app.
const PreviewPane = ({ draft }) => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: Users, label: 'Clients' },
    { icon: CalendarDays, label: 'Calendar' },
    { icon: CreditCard, label: 'Membership Plans' },
  ];
  return (
    <div
      data-mode={resolveMode(draft.mode)}
      data-theme={draft.theme}
      style={{ '--font-app': getFontStack(draft.font), fontFamily: 'var(--font-app)' }}
      className="rounded-2xl border border-dark-700 overflow-hidden shadow-lg select-none"
    >
      <div className="flex bg-dark-900" style={{ minHeight: '420px' }}>
        {/* Sidebar (theme) */}
        <div className="w-44 flex-shrink-0 bg-chrome border-r border-chrome-border flex flex-col py-4 px-3">
          <div className="px-2 mb-5 text-chrome-text font-extrabold tracking-tight">GymHubPH</div>
          <div className="space-y-1">
            {navItems.map((n) => (
              <div
                key={n.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  n.active ? 'bg-chrome-active text-white shadow-md' : 'text-chrome-muted'
                }`}
              >
                <n.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{n.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main (color mode) */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Navbar */}
          <div className="bg-dark-800 border-b border-dark-700 px-5 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-dark-50 font-bold">Dashboard</p>
              <p className="text-dark-400 text-xs">Welcome back</p>
            </div>
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-dark-400" />
              <span className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white text-xs font-bold">AU</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-5 bg-dark-900 overflow-hidden space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4">
                <p className="text-dark-400 text-xs">Active Members</p>
                <p className="text-dark-50 text-2xl font-bold mt-1">248</p>
              </div>
              <div className="card p-4">
                <p className="text-dark-400 text-xs">Monthly Revenue</p>
                <p className="text-dark-50 text-2xl font-bold mt-1">₱128,400</p>
              </div>
            </div>

            <div className="card p-4 space-y-3">
              <p className="text-dark-50 font-semibold">The quick brown fox jumps over the lazy dog</p>
              <p className="text-dark-300 text-sm">
                This is how body text looks with your selected font and color mode.
              </p>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary">Primary</button>
                <button className="btn-accent">Secondary</button>
                <button className="btn-secondary">Neutral</button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">Primary</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700">Secondary</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-700">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Appearance = () => {
  const { mode, theme, font, save } = useTheme();

  // Draft state — selections only update the draft + the preview. Nothing is
  // applied to the live app until Save.
  const [draft, setDraft] = useState({ mode, theme, font });

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const dirty = draft.mode !== mode || draft.theme !== theme || draft.font !== font;

  const handleSave = () => {
    save(draft);
    Toast.success('Appearance saved');
  };

  const handleReset = () => setDraft({ mode, theme, font });

  return (
    <Layout title="Themes & Appearance" subtitle="Personalize how the app looks and feels">
      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <p className="text-sm text-dark-400">
          {dirty ? 'Unsaved changes — preview shown on the right. Save to apply.' : 'All changes saved.'}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={!dirty}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dark-700 text-dark-200 hover:bg-dark-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Save changes
          </button>
        </div>
      </div>

      {/* Left = controls (Font, Color mode, Theme)  |  Right = big live preview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 pb-10 items-start">
        {/* CONTROLS */}
        <div className="lg:col-span-2 space-y-6">
          {/* FONT */}
          <SectionCard icon={Type} title="Font" subtitle="Typeface used across the app">
            <div className="space-y-2.5">
              {FONT_OPTIONS.map((f) => {
                const active = draft.font === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => update({ font: f.value })}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-left transition-all ${
                      active ? 'border-primary-500 bg-primary-500/10' : 'border-dark-700 bg-dark-800 hover:border-dark-600'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-dark-400">{f.label}</p>
                      <p className="text-lg text-dark-50 leading-snug truncate" style={{ fontFamily: getFontStack(f.value) }}>
                        The quick brown fox
                      </p>
                    </div>
                    {active && <Check className="w-5 h-5 text-primary-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* COLOR MODE */}
          <SectionCard icon={Palette} title="Color mode" subtitle="Light, dark, or follow your device">
            <div className="grid grid-cols-3 gap-3">
              {MODE_OPTIONS.map((m) => {
                const Icon = MODE_ICONS[m.value];
                const active = draft.mode === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => update({ mode: m.value })}
                    className={`flex flex-col items-center gap-2 p-5 rounded-xl border transition-all ${
                      active ? 'border-primary-500 bg-primary-500/10' : 'border-dark-700 bg-dark-800 hover:border-dark-600'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${active ? 'text-primary-400' : 'text-dark-400'}`} />
                    <span className="text-sm font-semibold text-dark-50">{m.label}</span>
                    <span className="text-xs text-dark-400 text-center">{m.desc}</span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* THEME */}
          <SectionCard icon={Paintbrush} title="Theme" subtitle="Sidebar color (secondary stays distinct)">
            <div className="grid grid-cols-2 gap-3">
              {THEME_OPTIONS.map((t) => {
                const active = draft.theme === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => update({ theme: t.value })}
                    className={`relative p-4 rounded-xl border text-left transition-all ${
                      active ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-dark-700 hover:border-dark-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-7 h-7 rounded-full border border-white/20" style={{ background: t.primary }} />
                      <span className="w-7 h-7 rounded-full border border-white/20" style={{ background: t.secondary }} />
                    </div>
                    <p className="text-sm font-semibold text-dark-50">{t.label}</p>
                    <p className="text-xs text-dark-400">{t.desc}</p>
                    {active && (
                      <span className="absolute top-2 right-2 text-primary-400">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* PREVIEW
             - sticky top-[90px] clears the app header (~80 px) with a safe gap
             - fixed height (not maxHeight) so flex-1 on the inner pane can fill
               the remaining space without layout ambiguity
        */}
        <div className="lg:col-span-3 lg:sticky lg:top-[90px]">
          <div
            className="card flex flex-col overflow-hidden"
            style={{ height: 'calc(100vh - 110px)' }}
          >
            {/* Title row — pinned, never scrolls */}
            <div className="flex items-center justify-between pb-4 flex-shrink-0 border-b border-dark-700 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-dark-50">Preview</h2>
                  <p className="text-sm text-dark-400 mt-0.5">Live preview of your selection — Save to apply</p>
                </div>
              </div>
            </div>
            {/* Preview pane — takes all remaining height, scrolls internally */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <PreviewPane draft={draft} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Appearance;
