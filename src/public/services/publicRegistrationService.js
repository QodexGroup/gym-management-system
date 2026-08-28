const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Read the API error message out of a failed response.
 *
 * @param {Response} response
 * @param {string} fallback
 * @returns {Promise<{message: string, errors: Object|null}>}
 */
const parseError = async (response, fallback) => {
  try {
    const body = await response.json();
    return { message: body.message || fallback, errors: body.errors || null };
  } catch {
    return { message: fallback, errors: null };
  }
};

/**
 * An API failure carrying the HTTP status and any per-field validation errors.
 */
export class PublicRegistrationError extends Error {
  /**
   * @param {string} message
   * @param {number} status
   * @param {Object|null} errors Laravel-style field => messages map.
   */
  constructor(message, status, errors = null) {
    super(message);
    this.name = 'PublicRegistrationError';
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Public registration API client.
 *
 * Plain fetch on purpose — no shared authService, which would pull in Firebase
 * and, on a 401, wipe localStorage and redirect a member to the staff login.
 * These endpoints take no credentials.
 */
export const publicRegistrationService = {
  /**
   * Fetch the gym's public registration details.
   *
   * @param {string} publicCode The account's permanent ULID.
   * @returns {Promise<{gymName: string, welcomeText: string, successText: string, requireEmail: boolean, requireAddress: boolean, requireEmergencyContact: boolean}>}
   * @throws {PublicRegistrationError} 404 when the link is unknown, disabled, or the gym is inactive.
   */
  async getGymRegistrationInfo(publicCode) {
    const response = await fetch(`${API_BASE_URL}/public/gyms/${encodeURIComponent(publicCode)}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const { message, errors } = await parseError(response, 'This registration link is not available.');
      throw new PublicRegistrationError(message, response.status, errors);
    }

    const body = await response.json();
    return body.data;
  },

  /**
   * Submit a member registration.
   *
   * @param {string} publicCode
   * @param {Object} payload Camel-case member fields plus the honeypot field.
   * @returns {Promise<{firstName: string, gymName: string, successText: string}>}
   * @throws {PublicRegistrationError} 422 on validation or duplicate phone, 429 when rate limited.
   */
  async createRegistration(publicCode, payload) {
    const response = await fetch(
      `${API_BASE_URL}/public/gyms/${encodeURIComponent(publicCode)}/registrations`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const { message, errors } = await parseError(response, 'Could not complete your registration.');
      throw new PublicRegistrationError(message, response.status, errors);
    }

    const body = await response.json();
    return body.data;
  },
};
