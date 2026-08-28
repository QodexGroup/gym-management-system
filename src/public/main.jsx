import React from 'react';
import ReactDOM from 'react-dom/client';
import PublicRegistrationPage from './PublicRegistration.page';
import '../shared/styles/index.scss';

/**
 * Entry point for the public member registration page (/join/:publicCode).
 *
 * Deliberately separate from src/main.jsx. This bundle must not contain the
 * Firebase SDK, AuthContext, react-query, or any of the app's route guards —
 * a member registering from a phone should download a form, not an admin
 * console. Nothing here may import from src/shared/services/authService.js or
 * src/firebaseConfig.js, directly or through a barrel.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PublicRegistrationPage />
  </React.StrictMode>
);
