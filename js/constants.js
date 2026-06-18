/**
 * EcoLens — Application Constants
 * Single source of truth for magic numbers, strings, and configuration.
 * Centralizing constants improves maintainability and prevents inconsistencies.
 * @module constants
 */

const Constants = (() => {
  'use strict';

  // ---- Application Metadata ----

  /** @type {string} Application name */
  const APP_NAME = 'EcoLens';

  /** @type {string} Application version (semver) */
  const APP_VERSION = '1.0.0';

  // ---- Time & Date Constants ----

  /** @type {number} Days in a year (used for annualization) */
  const DAYS_PER_YEAR = 365;

  /** @type {number} Approximate work days per year */
  const WORK_DAYS_PER_YEAR = 250;

  /** @type {number} Months in a year */
  const MONTHS_PER_YEAR = 12;

  /** @type {number} Meals assumed per day for baseline estimation */
  const MEALS_PER_DAY = 3;

  // ---- UI Constants ----

  /** @type {number} Maximum number of tips shown on insights page */
  const MAX_TIPS_DISPLAY = 10;

  /** @type {number} Number of days shown in the trend chart */
  const TREND_CHART_DAYS = 7;

  /** @type {number} Number of days in the activity heatmap */
  const HEATMAP_DAYS = 28;

  /** @type {number} Default commute distance (km) for quick-log fallback */
  const DEFAULT_QUICK_LOG_DISTANCE_KM = 10;

  /** @type {number} Maximum file size for data import (bytes) */
  const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  /** @type {number} Toast auto-dismiss duration (ms) */
  const TOAST_DURATION_MS = 4000;

  /** @type {number} Debounce delay for state persistence (ms) */
  const PERSIST_DEBOUNCE_MS = 300;

  /** @type {number} Micro-animation duration for button feedback (ms) */
  const BUTTON_FEEDBACK_MS = 150;

  // ---- Validation Limits ----

  /** @type {Object} Input validation boundaries */
  const LIMITS = Object.freeze({
    HOUSEHOLD_SIZE: { min: 1, max: 20 },
    COMMUTE_DISTANCE: { min: 0, max: 500 },
    ENERGY_KWH: { min: 0, max: 10000 },
    SHOPPING_QUANTITY: { min: 1, max: 1000 },
    WASTE_KG: { min: 0, max: 5000 },
    FOOD_MEALS: { min: 1, max: 100 },
    FLIGHT_DISTANCE: { min: 0, max: 20000 },
    TRANSPORT_DISTANCE: { min: 0, max: 1000 },
  });

  // ---- Baseline Estimation Defaults ----

  /** @type {number} Default annual shopping emissions (kg CO₂e) when no data */
  const DEFAULT_SHOPPING_ANNUAL_KG = 500;

  /** @type {number} Default annual waste emissions (kg CO₂e) when no data */
  const DEFAULT_WASTE_ANNUAL_KG = 200;

  // ---- Emission Category Keys ----

  /** @type {Array<string>} All tracked emission categories in display order */
  const CATEGORIES = Object.freeze([
    'transport',
    'flight',
    'food',
    'energy',
    'shopping',
    'waste',
  ]);

  // ---- Theme Values ----

  /** @type {Object} Valid theme options */
  const THEMES = Object.freeze({
    AUTO: 'auto',
    LIGHT: 'light',
    DARK: 'dark',
  });

  // ---- Font Size Options ----

  /** @type {Object} Valid font size settings */
  const FONT_SIZES = Object.freeze({
    NORMAL: 'normal',
    LARGE: 'large',
  });

  /** @type {string} CSS font-size value for large mode */
  const LARGE_FONT_SIZE_PX = '18px';

  // ---- Route Paths ----

  /** @type {Object} Application route paths */
  const ROUTES = Object.freeze({
    HOME: '/',
    DASHBOARD: '/dashboard',
    LOG: '/log',
    INSIGHTS: '/insights',
    CHALLENGES: '/challenges',
    SETTINGS: '/settings',
  });

  // ---- Streak Thresholds (for badges) ----

  /** @type {Object} Achievement unlock thresholds */
  const BADGE_THRESHOLDS = Object.freeze({
    WEEK_STREAK: 7,
    MONTH_STREAK: 30,
    GREEN_COMMUTES: 10,
    VEGAN_MEALS: 20,
  });

  // Public API — all frozen for immutability
  return Object.freeze({
    APP_NAME,
    APP_VERSION,
    DAYS_PER_YEAR,
    WORK_DAYS_PER_YEAR,
    MONTHS_PER_YEAR,
    MEALS_PER_DAY,
    MAX_TIPS_DISPLAY,
    TREND_CHART_DAYS,
    HEATMAP_DAYS,
    DEFAULT_QUICK_LOG_DISTANCE_KM,
    MAX_IMPORT_FILE_SIZE,
    TOAST_DURATION_MS,
    PERSIST_DEBOUNCE_MS,
    BUTTON_FEEDBACK_MS,
    LIMITS,
    DEFAULT_SHOPPING_ANNUAL_KG,
    DEFAULT_WASTE_ANNUAL_KG,
    CATEGORIES,
    THEMES,
    FONT_SIZES,
    LARGE_FONT_SIZE_PX,
    ROUTES,
    BADGE_THRESHOLDS,
  });
})();
