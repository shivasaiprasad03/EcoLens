/**
 * EcoLens — Utility Functions
 * Shared helpers for sanitization, dates, formatting, and accessibility.
 *
 * Security:
 *  - All user-facing strings pass through escapeHtml() before DOM insertion.
 *  - deepClone() guards against prototype pollution in JSON payloads.
 *  - Input validation functions enforce type, range, and format checks.
 *
 * @module utils
 */

const Utils = (() => {
  'use strict';

  // ---- HTML Sanitization (XSS Prevention) ----

  const ESCAPE_MAP = Object.freeze({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#96;',
  });

  const ESCAPE_REGEX = /[&<>"'/`]/g;

  /**
   * Escapes HTML special characters to prevent XSS.
   * @param {string} str - Raw user input string.
   * @returns {string} Escaped safe string.
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(ESCAPE_REGEX, (char) => ESCAPE_MAP[char] || char);
  }

  /**
   * Sanitizes a value for safe DOM insertion.
   * Handles strings, numbers, booleans, null, undefined.
   * Truncates excessively long strings to prevent DoS via DOM bloat.
   * @param {*} value
   * @returns {string}
   */
  function sanitize(value) {
    if (value == null) return '';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    const str = String(value);
    // Guard: truncate excessively long input to prevent DoS
    const truncated = str.length > 10000 ? str.slice(0, 10000) : str;
    return escapeHtml(truncated);
  }

  // ---- Input Validation ----

  /**
   * Validates a numeric input within a range.
   * @param {*} value
   * @param {number} min
   * @param {number} max
   * @returns {{valid: boolean, value: number, error?: string}}
   */
  function validateNumber(value, min = 0, max = Infinity) {
    const num = parseFloat(value);
    if (isNaN(num)) return { valid: false, value: 0, error: 'Please enter a valid number' };
    if (num < min) return { valid: false, value: num, error: `Value must be at least ${min}` };
    if (num > max) return { valid: false, value: num, error: `Value must be at most ${max}` };
    return { valid: true, value: num };
  }

  /**
   * Validates that a string is not empty after trimming.
   * @param {string} value
   * @returns {{valid: boolean, value: string, error?: string}}
   */
  function validateRequired(value) {
    const trimmed = String(value || '').trim();
    if (!trimmed) return { valid: false, value: '', error: 'This field is required' };
    return { valid: true, value: trimmed };
  }

  // ---- Date Helpers ----

  /**
   * Returns today's date as YYYY-MM-DD string.
   * @returns {string}
   */
  function today() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Returns a date string N days ago.
   * @param {number} days
   * @returns {string}
   */
  function daysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }

  /**
   * Formats a date string to a human-readable format.
   * @param {string} dateStr - YYYY-MM-DD
   * @param {string} format - 'short' | 'long' | 'relative'
   * @returns {string}
   */
  function formatDate(dateStr, format = 'short') {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');

    if (format === 'relative') {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

      if (dateStr === todayStr) return 'Today';
      if (dateStr === yesterdayStr) return 'Yesterday';

      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) return `${diffDays} days ago`;
    }

    if (format === 'long') {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Returns the ISO week number for a date.
   * @param {Date} date
   * @returns {number}
   */
  function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  }

  /**
   * Returns start and end dates for the current week (Mon-Sun).
   * @returns {{start: string, end: string}}
   */
  function currentWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.setDate(diff));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }

  /**
   * Returns start and end dates for the current month.
   * @returns {{start: string, end: string}}
   */
  function currentMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }

  // ---- Number Formatting ----

  /**
   * Formats a number with locale-appropriate separators.
   * @param {number} num
   * @param {number} decimals
   * @returns {string}
   */
  function formatNumber(num, decimals = 1) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    if (Math.abs(num) >= 1000) {
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      });
    }
    return num.toFixed(decimals);
  }

  /**
   * Formats CO2 with unit.
   * @param {number} kg - kilograms of CO2e
   * @param {boolean} compact - if true, uses tonnes for large values
   * @returns {string}
   */
  function formatCO2(kg, compact = false) {
    if (typeof kg !== 'number' || isNaN(kg)) return '0 kg';
    if (compact && Math.abs(kg) >= 1000) {
      return `${(kg / 1000).toFixed(1)} t`;
    }
    return `${formatNumber(kg)} kg`;
  }

  /**
   * Returns a percentage string.
   * @param {number} value
   * @param {number} total
   * @returns {string}
   */
  function percentage(value, total) {
    if (!total) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  }

  // ---- Unit Conversion ----

  /**
   * Converts miles to kilometers.
   * @param {number} miles
   * @returns {number}
   */
  function milesToKm(miles) {
    return miles * 1.60934;
  }

  /**
   * Converts gallons (US) to liters.
   * @param {number} gallons
   * @returns {number}
   */
  function gallonsToLiters(gallons) {
    return gallons * 3.78541;
  }

  // ---- Debounce / Throttle ----

  /**
   * Creates a debounced function.
   * @param {Function} fn
   * @param {number} delay - milliseconds
   * @returns {Function}
   */
  function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * Creates a throttled function.
   * @param {Function} fn
   * @param {number} limit - milliseconds
   * @returns {Function}
   */
  function throttle(fn, limit = 200) {
    let inThrottle = false;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // ---- Accessibility Helpers ----

  /**
   * Announces a message to screen readers via a live region.
   * @param {string} message
   * @param {string} priority - 'polite' | 'assertive'
   */
  function announceToScreenReader(message, priority = 'polite') {
    let region = document.getElementById('aria-live-region');
    if (!region) {
      region = document.createElement('div');
      region.id = 'aria-live-region';
      region.className = 'aria-live';
      region.setAttribute('aria-live', priority);
      region.setAttribute('aria-atomic', 'true');
      region.setAttribute('role', 'status');
      document.body.appendChild(region);
    }
    region.setAttribute('aria-live', priority);
    region.textContent = '';
    // Use setTimeout to ensure the DOM change triggers the screen reader
    setTimeout(() => {
      region.textContent = message;
    }, 100);
  }

  /**
   * Traps focus within an element (for modals).
   * @param {HTMLElement} element
   * @returns {Function} cleanup function
   */
  function trapFocus(element) {
    const focusable = element.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    function handleKeydown(e) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }

    element.addEventListener('keydown', handleKeydown);
    if (firstFocusable) firstFocusable.focus();

    return () => element.removeEventListener('keydown', handleKeydown);
  }

  // ---- ID Generation ----

  /**
   * Generates a unique ID string.
   * @param {string} prefix
   * @returns {string}
   */
  function generateId(prefix = 'el') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  // ---- Deep Clone ----

  /**
   * Deep clones a JSON-serializable object.
   * Includes a prototype pollution guard — rejects objects containing __proto__.
   * @param {*} obj
   * @returns {*}
   */
  function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    const json = JSON.stringify(obj);
    // Security: reject payloads containing prototype pollution vectors
    if (json.includes('"__proto__"')) {
      console.warn('[Utils] deepClone blocked: __proto__ key detected');
      return Array.isArray(obj) ? [] : {};
    }
    return JSON.parse(json);
  }

  // ---- DOM Helpers ----

  /**
   * Creates an element with attributes and children.
   * @param {string} tag
   * @param {Object} attrs
   * @param {...(string|HTMLElement)} children
   * @returns {HTMLElement}
   */
  function createElement(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([k, v]) => (el.dataset[k] = v));
      } else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      } else {
        el.setAttribute(key, value);
      }
    }
    for (const child of children) {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        el.appendChild(child);
      }
    }
    return el;
  }

  // Public API
  return Object.freeze({
    escapeHtml,
    sanitize,
    validateNumber,
    validateRequired,
    today,
    daysAgo,
    formatDate,
    getWeekNumber,
    currentWeekRange,
    currentMonthRange,
    formatNumber,
    formatCO2,
    percentage,
    milesToKm,
    gallonsToLiters,
    debounce,
    throttle,
    announceToScreenReader,
    trapFocus,
    generateId,
    deepClone,
    createElement,
  });
})();
