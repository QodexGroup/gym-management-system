/**
 * Application configuration constants
 * In development, uses VITE env vars. In production, uses injected config from Firebase Remote Config.
 */

// Import the generated config (will be undefined if appConfig doesn't exist yet)
let appConfigModule;
try {
    appConfigModule = await import('../firebaseConfig.js');
} catch {
    // firebaseConfig.js might not exist in some cases
    appConfigModule = null;
}

// Determine APP_NAME based on environment
const APP_NAME = import.meta.env.DEV
    ? (import.meta.env.VITE_APP_NAME || 'GymHubPH') // Development: Use VITE env var
    : (appConfigModule?.appConfig?.appName || 'GymHubPH'); // Production: Use injected config or default

export { APP_NAME };
