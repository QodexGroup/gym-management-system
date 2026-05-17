import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

// Track which dialogs we've already fixed to avoid re-fixing
const fixedDialogs = new WeakSet();

/**
 * Fix SweetAlert buttons - removes deny button and ensures proper styling
 */
const fixSwalButtons = () => {
  const actionsContainer = document.querySelector('.swal2-actions');
  if (!actionsContainer) return;

  // Check if we've already fixed this dialog
  if (fixedDialogs.has(actionsContainer)) {
    return; // Already fixed, don't interfere
  }

  // Hide and remove deny button if it exists
  const denyBtn = actionsContainer.querySelector('.swal2-deny');
  if (denyBtn) {
    denyBtn.remove();
  }

  const buttons = actionsContainer.querySelectorAll('.swal2-confirm, .swal2-cancel');
  buttons.forEach(btn => {
    // Force white text color
    btn.style.setProperty('color', '#ffffff', 'important');
    btn.style.setProperty('opacity', '1', 'important');
    btn.style.setProperty('visibility', 'visible', 'important');
    
    // Also fix any child elements
    const spans = btn.querySelectorAll('span, div, *');
    spans.forEach(el => {
      el.style.setProperty('color', '#ffffff', 'important');
    });
  });

  // Fix button order: Cancel should come first, then Confirm
  // Only do this once per dialog to avoid breaking event handlers
  const cancelBtn = actionsContainer.querySelector('.swal2-cancel');
  const confirmBtn = actionsContainer.querySelector('.swal2-confirm');
  
  if (cancelBtn && confirmBtn) {
    // Check if they're in wrong order
    const cancelIndex = Array.from(actionsContainer.children).indexOf(cancelBtn);
    const confirmIndex = Array.from(actionsContainer.children).indexOf(confirmBtn);
    
    if (confirmIndex < cancelIndex) {
      // Only reorder once
      actionsContainer.insertBefore(cancelBtn, confirmBtn);
    }
  }

  // Mark this dialog as fixed
  fixedDialogs.add(actionsContainer);
};

/**
 * Initialize SweetAlert button fixes globally
 * This ensures buttons are fixed even if Swal is used directly
 * Much lighter weight - only fixes when dialogs appear
 */
export const initAlertButtonFix = () => {
  let observer = null;
  
  // Lightweight observer that only watches for new SweetAlert containers
  observer = new MutationObserver((mutations) => {
    // Only process if a new SweetAlert container was added
    const hasNewSwal = mutations.some(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        return Array.from(mutation.addedNodes).some(node => {
          if (node.nodeType === 1) { // Element node
            return node.classList?.contains('swal2-container') || 
                   node.querySelector?.('.swal2-container');
          }
          return false;
        });
      }
      return false;
    });
    
    if (hasNewSwal) {
      // New dialog appeared, fix buttons once
      setTimeout(() => {
        fixSwalButtons();
      }, 100);
    }
  });
  
  // Only observe body for new children (when dialogs are added)
  observer.observe(document.body, {
    childList: true,
    subtree: false // Only direct children of body
  });
  
  // Return cleanup function
  return () => {
    if (observer) {
      observer.disconnect();
    }
  };
};

/**
 * SweetAlert Utility Functions
 */
export const Alert = {
  /**
   * Show confirmation dialog
   * @param {Object} options - SweetAlert options
   * @returns {Promise} - Result of user action
   */
  confirm(options = {}) {
    const defaultOptions = {
      showCancelButton: true,
      showDenyButton: false,
      showConfirmButton: true,
      denyButtonText: false,
      buttonsStyling: true,
      reverseButtons: true,
      customClass: {
        confirmButton: 'swal2-confirm',
        cancelButton: 'swal2-cancel',
        popup: 'swal2-popup-fix',
        actions: 'swal2-actions-fix'
      },
      didOpen: () => {
        // Fix buttons immediately when dialog opens
        setTimeout(() => {
          fixSwalButtons();
        }, 50);
      },
      willClose: () => {
        // Clean up when dialog closes
        const actionsContainer = document.querySelector('.swal2-actions');
        if (actionsContainer && fixedDialogs.has(actionsContainer)) {
          // Remove from fixed set so it can be fixed again if reopened
          // Note: WeakSet doesn't have delete, but that's okay - it will be garbage collected
        }
      }
    };

    return Swal.fire({
      ...defaultOptions,
      ...options
    });
  },

  /**
   * Show delete confirmation dialog
   * @param {Object} options - Additional SweetAlert options
   * @returns {Promise} - Result of user action
   */
  confirmDelete(options = {}) {
    return this.confirm({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      ...options
    });
  },

  /**
   * Show success alert
   * @param {string} title - Alert title
   * @param {string} text - Alert text
   * @param {Object} options - Additional SweetAlert options
   */
  success(title = 'Success!', text = '', options = {}) {
    return Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'OK',
      buttonsStyling: true,
      customClass: {
        confirmButton: 'swal2-confirm',
        popup: 'swal2-popup-fix'
      },
      ...options
    });
  },

  /**
   * Show error alert
   * @param {string} title - Alert title
   * @param {string} text - Alert text
   * @param {Object} options - Additional SweetAlert options
   */
  error(title = 'Error!', text = '', options = {}) {
    return Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'OK',
      buttonsStyling: true,
      customClass: {
        confirmButton: 'swal2-confirm',
        popup: 'swal2-popup-fix'
      },
      ...options
    });
  },

  /**
   * Show warning alert
   * @param {string} title - Alert title
   * @param {string} text - Alert text
   * @param {Object} options - Additional SweetAlert options
   */
  warning(title = 'Warning!', text = '', options = {}) {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'OK',
      buttonsStyling: true,
      customClass: {
        confirmButton: 'swal2-confirm',
        popup: 'swal2-popup-fix'
      },
      ...options
    });
  },

  /**
   * Show info alert
   * @param {string} title - Alert title
   * @param {string} text - Alert text
   * @param {Object} options - Additional SweetAlert options
   */
  info(title = 'Info', text = '', options = {}) {
    return Swal.fire({
      title,
      text,
      icon: 'info',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'OK',
      buttonsStyling: true,
      customClass: {
        confirmButton: 'swal2-confirm',
        popup: 'swal2-popup-fix'
      },
      ...options
    });
  }
};

/**
 * Toast Utility Functions
 */
export const Toast = {
  /**
   * Show success toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options
   */
  success(message, options = {}) {
    return toast.success(message, options);
  },

  /**
   * Show error toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options
   */
  error(message, options = {}) {
    return toast.error(message, options);
  },

  /**
   * Show info toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options
   */
  info(message, options = {}) {
    return toast.info(message, options);
  },

  /**
   * Show warning toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options
   */
  warning(message, options = {}) {
    return toast.warning(message, options);
  }
};

