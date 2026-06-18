/**
 * EcoLens — State Management
 * Centralized state store with localStorage persistence and pub/sub.
 *
 * Architecture:
 *  - Single source of truth: all app state lives in one object.
 *  - Persistence: state is debounce-persisted to localStorage on every change.
 *  - Reactivity: components subscribe to specific keys and get notified on change.
 *  - Immutability: all reads return deep clones to prevent accidental mutation.
 *
 * @module state
 */

/**
 * @typedef {Object} Activity
 * @property {string} id        - Unique identifier (generated).
 * @property {string} date      - ISO date string (YYYY-MM-DD).
 * @property {number} timestamp - Unix timestamp of creation.
 * @property {string} category  - Emission category ('transport', 'food', etc.).
 * @property {string} type      - Specific type within category.
 * @property {number} value     - Quantity value (km, meals, kWh, etc.).
 * @property {string} unit      - Unit label ('km', 'meals', 'kWh', 'items', 'kg').
 * @property {number} co2       - Calculated CO₂e in kg.
 * @property {string} [note]    - Optional user note.
 */

/**
 * @typedef {Object} UserProfile
 * @property {boolean} completed      - Whether onboarding is finished.
 * @property {number}  householdSize  - Number of people in household.
 * @property {string}  country        - Country code for national comparison.
 * @property {string}  diet           - Diet type key.
 * @property {string}  commute        - Commute transport type key.
 * @property {number}  commuteDistance - One-way commute distance in km.
 * @property {string}  energySource   - Home energy source key.
 * @property {string}  homeSize       - 'small' | 'medium' | 'large'.
 */

const Store = (() => {
  'use strict';

  const STORAGE_KEY = 'ecolens_data';
  const SCHEMA_VERSION = 1;

  /** @type {Map<string, Set<Function>>} */
  const listeners = new Map();

  /**
   * Default state schema — used for initialization and migrations.
   */
  const DEFAULT_STATE = Object.freeze({
    _version: SCHEMA_VERSION,
    profile: {
      completed: false,
      householdSize: 1,
      country: 'global',
      diet: '',          // vegan | vegetarian | mixed | high-meat
      commute: '',       // car-petrol | car-diesel | car-electric | bus | train | bike | walk | remote
      commuteDistance: 0, // km one-way
      energySource: '',  // grid | solar | wind | mixed-renewable
      homeSize: 'medium', // small | medium | large
    },
    activities: [],      // { id, date, category, type, value, unit, co2, note? }
    challenges: {
      active: null,      // challenge id
      completed: [],     // [{ id, completedDate }]
      streak: 0,
      lastLogDate: null,
    },
    preferences: {
      theme: 'auto',       // 'auto' | 'light' | 'dark'
      reducedMotion: false,
      fontSize: 'normal',  // 'normal' | 'large'
      unit: 'metric',      // 'metric' | 'imperial'
    },
    insightsDismissed: [], // tip IDs the user dismissed
  });

  /** @type {Object} Current in-memory state */
  let state = loadState();

  /**
   * Loads state from localStorage, applying migrations if needed.
   * @returns {Object}
   */
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Utils.deepClone(DEFAULT_STATE);

      const parsed = JSON.parse(raw);

      // Schema migration
      if (!parsed._version || parsed._version < SCHEMA_VERSION) {
        return migrateState(parsed);
      }

      // Merge with defaults to handle new fields
      return mergeDefaults(parsed);
    } catch (err) {
      console.warn('[Store] Failed to load state, using defaults:', err);
      return Utils.deepClone(DEFAULT_STATE);
    }
  }

  /**
   * Merges saved state with defaults to fill any missing fields.
   * @param {Object} saved
   * @returns {Object}
   */
  function mergeDefaults(saved) {
    const merged = Utils.deepClone(DEFAULT_STATE);
    for (const key of Object.keys(merged)) {
      if (key === '_version') continue;
      if (saved[key] !== undefined) {
        if (typeof merged[key] === 'object' && !Array.isArray(merged[key]) && merged[key] !== null) {
          merged[key] = { ...merged[key], ...saved[key] };
        } else {
          merged[key] = saved[key];
        }
      }
    }
    return merged;
  }

  /**
   * Handles schema migrations from older versions.
   * @param {Object} oldState
   * @returns {Object}
   */
  function migrateState(oldState) {
    console.info('[Store] Migrating state from version', oldState._version || 0, 'to', SCHEMA_VERSION);
    const migrated = mergeDefaults(oldState);
    migrated._version = SCHEMA_VERSION;
    return migrated;
  }

  /**
   * Persists current state to localStorage (debounced).
   */
  const persistState = Utils.debounce(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('[Store] Failed to persist state:', err);
    }
  }, 300);

  /**
   * Gets a top-level section of the state.
   * @param {string} key
   * @returns {*} A deep clone of the value.
   */
  function get(key) {
    if (key === undefined) return Utils.deepClone(state);
    return Utils.deepClone(state[key]);
  }

  /**
   * Sets a top-level section of the state and notifies subscribers.
   * @param {string} key
   * @param {*} value
   */
  function set(key, value) {
    state[key] = Utils.deepClone(value);
    persistState();
    notify(key);
  }

  /**
   * Updates a top-level object by merging partial updates.
   * @param {string} key
   * @param {Object} partial
   */
  function update(key, partial) {
    if (typeof state[key] === 'object' && !Array.isArray(state[key]) && state[key] !== null) {
      state[key] = { ...state[key], ...Utils.deepClone(partial) };
    } else {
      state[key] = Utils.deepClone(partial);
    }
    persistState();
    notify(key);
  }

  /**
   * Subscribes to changes on a specific state key.
   * @param {string} key
   * @param {Function} callback - receives (newValue)
   * @returns {Function} Unsubscribe function.
   */
  function subscribe(key, callback) {
    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }
    listeners.get(key).add(callback);
    return () => listeners.get(key).delete(callback);
  }

  /**
   * Notifies all subscribers for a given key.
   * @param {string} key
   */
  function notify(key) {
    const subs = listeners.get(key);
    if (subs) {
      const value = get(key);
      subs.forEach((cb) => {
        try {
          cb(value);
        } catch (err) {
          console.error(`[Store] Subscriber error for key "${key}":`, err);
        }
      });
    }
  }

  // ---- Activity-specific helpers ----

  /**
   * Adds a new activity log entry.
   * @param {Object} activity - { category, type, value, unit, co2, note? }
   * @returns {Object} The saved activity with id and date.
   */
  function addActivity(activity) {
    const entry = {
      id: Utils.generateId('act'),
      date: Utils.today(),
      timestamp: Date.now(),
      ...Utils.deepClone(activity),
    };
    state.activities.push(entry);

    // Update streak
    const todayStr = Utils.today();
    if (state.challenges.lastLogDate !== todayStr) {
      const yesterday = Utils.daysAgo(1);
      if (state.challenges.lastLogDate === yesterday) {
        state.challenges.streak += 1;
      } else if (state.challenges.lastLogDate !== todayStr) {
        state.challenges.streak = 1;
      }
      state.challenges.lastLogDate = todayStr;
    }

    persistState();
    notify('activities');
    notify('challenges');
    return entry;
  }

  /**
   * Deletes an activity by ID.
   * @param {string} id
   * @returns {boolean}
   */
  function deleteActivity(id) {
    const idx = state.activities.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    state.activities.splice(idx, 1);
    persistState();
    notify('activities');
    return true;
  }

  /**
   * Gets activities filtered by date range and/or category.
   * @param {Object} filters - { startDate?, endDate?, category? }
   * @returns {Array}
   */
  function getActivities(filters = {}) {
    let activities = state.activities;
    if (filters.startDate) {
      activities = activities.filter((a) => a.date >= filters.startDate);
    }
    if (filters.endDate) {
      activities = activities.filter((a) => a.date <= filters.endDate);
    }
    if (filters.category) {
      activities = activities.filter((a) => a.category === filters.category);
    }
    return Utils.deepClone(activities);
  }

  /**
   * Gets total CO2 for a date range, optionally grouped by category.
   * @param {string} startDate
   * @param {string} endDate
   * @param {boolean} grouped
   * @returns {number | Object}
   */
  function getTotalCO2(startDate, endDate, grouped = false) {
    const acts = getActivities({ startDate, endDate });
    if (!grouped) {
      return acts.reduce((sum, a) => sum + (a.co2 || 0), 0);
    }
    const groups = {};
    acts.forEach((a) => {
      groups[a.category] = (groups[a.category] || 0) + (a.co2 || 0);
    });
    return groups;
  }

  // ---- Data Export / Import ----

  /**
   * Exports all state as a JSON string.
   * @returns {string}
   */
  function exportData() {
    return JSON.stringify(state, null, 2);
  }

  /**
   * Imports state from a JSON string, with strict validation.
   * Security measures:
   *  - Input size limit (prevents DoS via huge payloads)
   *  - Prototype pollution guard (__proto__, constructor, prototype keys rejected)
   *  - Schema validation (expected keys, types, and structure)
   *  - Version field required (prevents importing arbitrary JSON)
   *
   * @param {string} jsonStr - JSON string from a trusted file input.
   * @returns {{success: boolean, error?: string}}
   */
  function importData(jsonStr) {
    try {
      // Guard: input type and size
      if (typeof jsonStr !== 'string') {
        return { success: false, error: 'Invalid input type' };
      }
      if (jsonStr.length > Constants.MAX_IMPORT_FILE_SIZE) {
        return { success: false, error: 'File exceeds maximum allowed size' };
      }

      const data = JSON.parse(jsonStr);

      // Guard: must be a plain object
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return { success: false, error: 'Invalid data format — expected a JSON object' };
      }

      // Guard: prototype pollution prevention
      const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
      const allKeys = JSON.stringify(data);
      for (const key of dangerousKeys) {
        if (allKeys.includes('"' + key + '"')) {
          return { success: false, error: 'Rejected: contains disallowed key "' + key + '"' };
        }
      }

      // Guard: version field is required and must be a number
      if (!data._version || typeof data._version !== 'number') {
        return { success: false, error: 'Missing or invalid version field — not an EcoLens export' };
      }

      // Guard: validate expected structure
      if (data.activities && !Array.isArray(data.activities)) {
        return { success: false, error: 'Invalid data: activities must be an array' };
      }
      if (data.profile && typeof data.profile !== 'object') {
        return { success: false, error: 'Invalid data: profile must be an object' };
      }

      state = mergeDefaults(data);
      state._version = SCHEMA_VERSION;
      persistState();

      // Notify all listeners
      for (const key of Object.keys(state)) {
        if (key !== '_version') notify(key);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to parse JSON' };
    }
  }

  /**
   * Resets all state to defaults.
   */
  function resetAll() {
    state = Utils.deepClone(DEFAULT_STATE);
    persistState();
    for (const key of Object.keys(state)) {
      if (key !== '_version') notify(key);
    }
  }

  // Public API
  return Object.freeze({
    get,
    set,
    update,
    subscribe,
    addActivity,
    deleteActivity,
    getActivities,
    getTotalCO2,
    exportData,
    importData,
    resetAll,
    DEFAULT_STATE,
    SCHEMA_VERSION,
  });
})();
