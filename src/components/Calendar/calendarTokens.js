/**
 * Calendar palette tokens.
 *
 * This is the ONLY colour knowledge the Calendar components carry. It maps the
 * presentational `kind` / `tone` values that arrive on a calendar view model to Tailwind
 * classes. It deliberately knows nothing about SESSION_TYPES, bookings or gyms — the
 * feature layer decides what kind a row is, this file decides what that looks like.
 */

/** Chip / rail / badge classes per calendar kind. */
export const KIND_TOKENS = {
  class: {
    chip: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    rail: 'bg-blue-500',
    text: 'text-blue-500',
    soft: 'bg-blue-500/10',
    badge: 'bg-blue-100 text-blue-700',
    filterOn: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    filterOff: 'bg-blue-500/5 text-blue-400/60 border-blue-500/20 hover:bg-blue-500/15',
  },
  pt: {
    chip: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    rail: 'bg-orange-500',
    text: 'text-orange-500',
    soft: 'bg-orange-500/10',
    badge: 'bg-orange-100 text-orange-700',
    filterOn: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    filterOff: 'bg-orange-500/5 text-orange-400/60 border-orange-500/20 hover:bg-orange-500/15',
  },
};

/**
 * Fullness / status dot colours used in month cells, where there is only room for a
 * 6px dot rather than a "14/20" label.
 */
export const TONE_DOT = {
  ok: 'bg-success-500',
  warn: 'bg-warning-500',
  full: 'bg-danger-500',
  solo: 'bg-dark-400',
  booked: 'bg-dark-400',
  attended: 'bg-success-500',
  noshow: 'bg-danger-500',
  cancelled: 'bg-danger-500',
};

/** Pill classes for the same tones, where a label fits. */
export const TONE_PILL = {
  ok: 'bg-success-500/10 text-success-600',
  warn: 'bg-warning-500/10 text-warning-700',
  full: 'bg-danger-500/10 text-danger-600',
  solo: 'bg-dark-700 text-dark-300',
};

/**
 * Resolve the token bundle for a kind, falling back to the class palette.
 * @param {string} kind - A CALENDAR_KIND value ('class' | 'pt')
 * @returns {Object} token bundle
 */
export const kindTokens = (kind) => KIND_TOKENS[kind] || KIND_TOKENS.class;

/**
 * Resolve a dot colour class for a tone.
 * @param {string} tone
 * @returns {string} Tailwind class
 */
export const toneDot = (tone) => TONE_DOT[tone] || 'bg-dark-400';

/**
 * Resolve a pill colour class for a tone.
 * @param {string} tone
 * @returns {string} Tailwind classes
 */
export const tonePill = (tone) => TONE_PILL[tone] || 'bg-dark-700 text-dark-200';
