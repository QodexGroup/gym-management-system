import React, { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { initAlertButtonFix } from '../utils/alert';

/**
 * Alert Provider Component
 * Handles ToastContainer and SweetAlert button fixes globally
 */
const AlertProvider = ({ children }) => {
  // Initialize SweetAlert button fixes globally
  useEffect(() => {
    const cleanup = initAlertButtonFix();
    return cleanup;
  }, []);

  return (
    <>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
};

export default AlertProvider;

