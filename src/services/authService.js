import { Alert } from '../utils/alert';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Store logout function reference
let logoutFunction = null;
// Flag to prevent invalid token handling during login
let isLoggingIn = false;
// Flag to prevent multiple simultaneous invalid token handlers
let isHandlingInvalidToken = false;

/**
 * Set the logout function to be called on invalid token
 * @param {Function} logoutFn - Logout function from AuthContext
 */
export const setLogoutFunction = (logoutFn) => {
  logoutFunction = logoutFn;
};

/**
 * Set the logging in flag to prevent invalid token handling during login
 * @param {boolean} value - Whether we're currently logging in
 */
export const setLoggingIn = (value) => {
  isLoggingIn = value;
};

/**
 * Get the Firebase token from localStorage
 * @returns {string|null}
 */
export const getAuthToken = () => {
  return localStorage.getItem('firebase_token');
};

/**
 * Handle invalid token error - show alert, logout, and redirect
 */
const handleInvalidToken = async () => {
  // Prevent multiple simultaneous calls
  if (isHandlingInvalidToken) {
    return;
  }
  
  isHandlingInvalidToken = true;
  
  try {
    // Clear any existing token and session data
    localStorage.removeItem('firebase_token');
    localStorage.removeItem('firebase_uid');
    localStorage.removeItem('session_start_time');
    localStorage.removeItem('token_expiration');
    // Also remove old login_timestamp for backward compatibility
    localStorage.removeItem('login_timestamp');
    
    // Show SweetAlert and WAIT for user to dismiss it
    // The await will pause execution until user clicks OK, clicks outside, or presses ESC
    await Alert.warning(
      'Session Expired',
      'Your session has expired. Please login again to continue.',
      {
        confirmButtonText: 'Go to Login',
        allowOutsideClick: true,  // Allow clicking outside to dismiss
        allowEscapeKey: true,     // Allow ESC to dismiss
      }
    );
    
    // Only proceed after user has dismissed the alert (clicked OK, clicked outside, or pressed ESC)
    
    // Call logout function if available
    if (logoutFunction) {
      await logoutFunction();
    }
    
    // Redirect to login AFTER user has dismissed the alert
    window.location.href = '/login';
  } catch (error) {
    console.error('Error in handleInvalidToken:', error);
    // Even if there's an error, still redirect
    window.location.href = '/login';
  } finally {
    // Reset flag after a delay to allow redirect to complete
    setTimeout(() => {
      isHandlingInvalidToken = false;
    }, 1000);
  }
};

/**
 * Make an authenticated API request
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Check for invalid token errors (but skip during login)
  if (!response.ok && !isLoggingIn) {
    // Try to parse error message
    try {
      const errorData = await response.clone().json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || '';
      
      // Check if it's an authentication error
      if (
        response.status === 401 ||
        errorMessage.toLowerCase().includes('invalid token') ||
        errorMessage.toLowerCase().includes('unauthorized') ||
        errorMessage.toLowerCase().includes('token expired') ||
        errorMessage.toLowerCase().includes('authentication failed')
      ) {
        await handleInvalidToken();
        // Throw error to prevent further processing
        throw new Error('Session expired. Please login again.');
      }
    } catch (parseError) {
      // If response is not JSON or parsing fails, check status code
      if (response.status === 401) {
        await handleInvalidToken();
        throw new Error('Session expired. Please login again.');
      }
    }
  }

  return response;
};

/**
 * Auth Service
 * Handles authentication-related API calls
 */
export const authService = {
  /**
   * Get current authenticated user
   * @returns {Promise<Object>}
   */
  async signUp(idToken, payload) {
    const response = await fetch(`${API_BASE_URL}/auth/sign-up`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.message || json.error || `Sign-up failed (${response.status})`);
    }
    return json.success ? json.data : null;
  },

  async getCurrentUser() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
        
        // If we're logging in, don't throw "Session expired" errors - throw the actual error message
        if (isLoggingIn) {
          throw new Error(errorMessage);
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      // If we're logging in, pass through the original error message
      if (isLoggingIn && error.message.includes('Session expired')) {
        // During login, if we get a session expired error, it's likely a different issue
        // Re-throw with a more appropriate message
        throw new Error('Authentication failed. Please try logging in again.');
      }
      throw error;
    }
  },
};

