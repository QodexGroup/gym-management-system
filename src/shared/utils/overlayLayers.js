/**
 * Attribute marking an element as a keyboard-owning overlay layer.
 * Every full-screen surface that handles Escape or traps focus should carry it.
 */
export const OVERLAY_LAYER_ATTR = 'data-overlay-layer';

/**
 * Whether `element` is the top-most open overlay.
 *
 * Overlays stack in this app — a modal can open the image lightbox, and a view
 * modal can sit over an edit modal. They all render at the same z-index, so the
 * one painted on top is simply the last one in the document. Without this
 * check, every open layer reacts to the same Escape keypress and their focus
 * traps pull focus away from each other.
 *
 * A SweetAlert2 dialog is appended to <body> above everything and runs its own
 * keyboard handling, so while one is up no overlay owns the keyboard.
 *
 * @param {Element|null} element - The layer's root node.
 * @returns {boolean} True when `element` should handle keyboard events.
 */
export const isTopOverlayLayer = (element) => {
  if (!element) return false;
  if (document.querySelector('.swal2-container')) return false;

  const layers = document.querySelectorAll(`[${OVERLAY_LAYER_ATTR}]`);
  if (layers.length === 0) return false;

  return layers[layers.length - 1] === element;
};
