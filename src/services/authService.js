import { Alert } from '../utils/alert';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Store logout function reference
let logoutFunction = null;

/**
 * Set the logout function to be called on invalid token
 * @param {Function} logoutFn - Logout function from AuthContext
 */
export const setLogoutFunction = (logoutFn) => {
  logoutFunction = logoutFn;
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
  // Clear any existing token
  localStorage.removeItem('firebase_token');
  localStorage.removeItem('firebase_uid');
  localStorage.removeItem('login_timestamp');
  
  // Show SweetAlert
  await Alert.warning(
    'Session Expired',
    'Your session has expired. Please login again to continue.',
    {
      confirmButtonText: 'Go to Login',
      allowOutsideClick: false,
      allowEscapeKey: false,
    }
  );
  
  // Call logout function if available
  if (logoutFunction) {
    await logoutFunction();
  }
  
  // Redirect to login
  window.location.href = '/login';
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

  // Check for invalid token errors
  if (!response.ok) {
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
  async getCurrentUser() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },
};

