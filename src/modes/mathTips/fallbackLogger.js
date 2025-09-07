// src/modes/mathTips/fallbackLogger.js

/**
 * FallbackLogger
 * - Works in browser (Vite) and in Node (tests/CLI)
 * - Dev-only console noise (when MODE === 'development')
 * - Never touches `window` or `import.meta.env` when they don't exist
 */

function getMode() {
  // Vite in browser
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE) {
    return import.meta.env.MODE;
  }
  // Node / tests
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  return 'production';
}

class FallbackLogger {
  constructor() {
    this._buf = [];
    this.mode = getMode();
    this.dev = this.mode === 'development';

    // Only expose in a real browser tab and only in dev
    if (this.dev && typeof window !== 'undefined') {
      try {
        // eslint-disable-next-line no-console
        console.log('%c🪐 Fallback Logger active…', 'color: cyan;');
        window.fallbackLogger = this;
      } catch {}
    }
  }

  /**
   * Add a user input to the fallback log (dedup, lowercase)
   * @param {string} input
   */
  add(input) {
    try {
      const clean = String(input).trim().toLowerCase();
      if (!clean) return;
      if (!this._buf.includes(clean)) {
        this._buf.push(clean);
        if (this.dev && typeof console !== 'undefined') {
          // eslint-disable-next-line no-console
          console.warn('🚨 Fallback logged:', JSON.stringify(clean));
        }
      }
    } catch {}
  }

  /**
   * Return a copy of the current buffer
   * @returns {string[]}
   */
  get all() {
    return this._buf.slice();
  }

  /**
   * Pretty-print to console (browser convenience)
   */
  table() {
    if (typeof console !== 'undefined' && console.table) {
      // eslint-disable-next-line no-console
      console.table(this._buf);
    }
    return this._buf.slice();
  }

  /**
   * Export as JSON string
   */
  export() {
    const json = JSON.stringify(this._buf, null, 2);
    if (this.dev && typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('%c📤 JSON Export Ready:', 'color: lightblue;');
      // eslint-disable-next-line no-console
      console.log(json);
    }
    return json;
  }

  /**
   * Clear the buffer
   */
  clear() {
    this._buf = [];
    if (this.dev && typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('%c🧹 Fallback log cleared.', 'color: red;');
    }
  }
}

export const fallbackLogger = new FallbackLogger();
export default fallbackLogger;
