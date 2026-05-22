import { useCallback } from 'react';
import { Alert } from '../utils/alert';

/**
 * Wraps a mutation/handler with a confirmation dialog.
 * Eliminates the repetitive Alert.confirm() + if (!result.isConfirmed) return pattern.
 *
 * @param {Function} action       — async function to run after confirmation
 * @param {Object}   options
 * @param {string}   options.title       — Dialog title  (default: 'Are you sure?')
 * @param {string}   options.text        — Dialog body text
 * @param {string}   options.icon        — SweetAlert2 icon (default: 'warning')
 * @param {string}   options.confirmText — Confirm button label (default: 'Yes')
 *
 * @returns {Function} confirmed action handler — call it with the same args as action()
 *
 * @example
 * const handleDelete = useConfirmAction(
 *   (id) => deleteMutation.mutateAsync(id),
 *   { title: 'Delete Member?', text: 'This cannot be undone.', icon: 'warning' }
 * );
 * <button onClick={() => handleDelete(member.id)}>Delete</button>
 */
export const useConfirmAction = (action, options = {}) => {
  const {
    title = 'Are you sure?',
    text,
    icon = 'warning',
    confirmText = 'Yes',
  } = options;

  return useCallback(
    async (...args) => {
      const result = await Alert.confirm({ title, text, icon, confirmButtonText: confirmText });
      if (!result.isConfirmed) return;
      try {
        await action(...args);
      } catch {
        // Error handling is delegated to the action/mutation itself
      }
    },
    [action, title, text, icon, confirmText]
  );
};
