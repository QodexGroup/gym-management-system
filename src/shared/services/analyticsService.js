// src/shared/services/analyticsService.js
//
// Thin wrapper around Google Analytics 4 (gtag.js).
//
// Deliberately NOT using firebase/analytics: the GA4 property lives in a
// separate Google account from the Firebase project that backs Auth/Hosting,
// so Analytics is wired directly to GA4 and configured by env var.
//
// Rules:
//  - Every export is safe to call at any time. When analytics is disabled or
//    failed to load, calls are silent no-ops. Analytics must never break the app.
//  - Never send personally identifiable information (email, name, phone).
//    GA4 terms forbid it. user_id is the internal numeric user id only.
//  - Disabled in local dev unless VITE_ANALYTICS_DEBUG=true, so test traffic
//    does not pollute the production GA4 property.
//
// Config:
//  VITE_GA_MEASUREMENT_ID  e.g. G-XXXXXXXXXX. Empty => analytics off.
//  VITE_ANALYTICS_DEBUG    'true' enables analytics in `vite dev` and GA4 DebugView.

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const DEBUG = import.meta.env.VITE_ANALYTICS_DEBUG === 'true';

let enabled = false;
let initialised = false;

function devLog(...args) {
    if (import.meta.env.DEV && DEBUG) console.info('[analytics]', ...args);
}

/**
 * Whether analytics should run in this environment.
 * Prod/staging builds: on when a measurement ID was provided at build time.
 * Local dev: off unless VITE_ANALYTICS_DEBUG=true.
 */
function shouldEnable() {
    if (!MEASUREMENT_ID) return false;
    if (import.meta.env.DEV && !DEBUG) return false;
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    return true;
}

/**
 * Queue a gtag call. gtag.js drains window.dataLayer once loaded, so calls
 * made before the script arrives are not lost.
 */
function gtag() {
    try {
        window.dataLayer = window.dataLayer || [];
        // gtag.js requires the `arguments` object, not a spread array.
        window.dataLayer.push(arguments);
    } catch (err) {
        if (import.meta.env.DEV) console.warn('[analytics] gtag push failed:', err);
    }
}

/**
 * Load gtag.js and configure the GA4 property. Idempotent.
 * @returns {boolean} true when analytics is active.
 */
export function initAnalytics() {
    if (initialised) return enabled;
    initialised = true;

    if (!shouldEnable()) {
        devLog('disabled (no VITE_GA_MEASUREMENT_ID for this environment)');
        return false;
    }

    try {
        gtag('js', new Date());
        // send_page_view:false — the app reports page_view itself on every
        // client-side route change (see AnalyticsTracker), so the automatic
        // one on load would be a duplicate.
        gtag('config', MEASUREMENT_ID, {
            send_page_view: false,
            ...(DEBUG ? { debug_mode: true } : {}),
        });

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
        script.onerror = () => {
            // Ad blockers commonly block this host. Keep going silently.
            enabled = false;
            devLog('gtag.js failed to load (blocked?)');
        };
        document.head.appendChild(script);

        enabled = true;
        devLog('initialised', MEASUREMENT_ID);
        return true;
    } catch (err) {
        if (import.meta.env.DEV) console.warn('[analytics] init failed, continuing without analytics:', err);
        enabled = false;
        return false;
    }
}

/**
 * Record a page view. Called on every client-side route change.
 * @param {string} path  location.pathname (+ search if wanted)
 * @param {string} [title]
 */
export function trackPageView(path, title) {
    if (!initAnalytics()) return;
    gtag('event', 'page_view', {
        page_path: path,
        page_location: window.location.href,
        page_title: title || document.title,
    });
    devLog('page_view', path);
}

/**
 * Record a custom business event, e.g. trackEvent('member_check_in', { method: 'qr' }).
 * Keep names snake_case, <= 40 chars, and params free of PII.
 * @param {string} name
 * @param {Record<string, string|number|boolean>} [params]
 */
export function trackEvent(name, params = {}) {
    if (!initAnalytics()) return;
    gtag('event', name, params);
    devLog('event', name, params);
}

/**
 * Attach the signed-in user to subsequent events.
 * Sends only non-PII identifiers so usage can be sliced per gym (account_id)
 * and per role in GA4.
 * @param {{ id: string|number, role?: string, accountId?: string|number|null, isAccountOwner?: boolean }} u
 */
export function identifyUser(u) {
    if (!u || u.id == null) return;
    if (!initAnalytics()) return;
    gtag('set', 'user_id', String(u.id));
    gtag('set', 'user_properties', {
        role: u.role || 'unknown',
        account_id: u.accountId != null ? String(u.accountId) : 'none',
        is_account_owner: u.isAccountOwner ? 'true' : 'false',
    });
    devLog('identify', u.id, u.role, u.accountId);
}

/**
 * Detach the user on logout so a shared kiosk/tablet does not attribute the
 * next person's activity to the previous login.
 */
export function resetUser() {
    if (!initAnalytics()) return;
    gtag('set', 'user_id', null);
    gtag('set', 'user_properties', { role: null, account_id: null, is_account_owner: null });
    devLog('reset user');
}
