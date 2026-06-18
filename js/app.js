/**
 * EcoLens — Application Entry Point
 * Initializes the app, sets up router, and manages the app shell.
 * @module app
 */

const App = (() => {
  'use strict';

  /**
   * Initializes the EcoLens application.
   * Sets up preferences, renders the app shell, and boots the router.
   */
  function init() {
    console.log(`[${Constants.APP_NAME}] v${Constants.APP_VERSION} — Initializing...`);

    // Apply saved preferences before first paint
    applyPreferences();

    // Set up the app shell
    const shell = document.getElementById('app');
    if (!shell) {
      console.error(`[${Constants.APP_NAME}] #app element not found`);
      return;
    }

    shell.className = 'app-shell';

    // Render navbar
    Navbar.render(shell);

    // Create main content area
    const main = document.createElement('main');
    main.className = 'app-main';
    main.id = 'main-content';
    main.setAttribute('role', 'main');
    shell.appendChild(main);

    // Register routes — order matches navbar link order
    Router.register(Constants.ROUTES.HOME, OnboardingView);
    Router.register(Constants.ROUTES.DASHBOARD, DashboardView);
    Router.register(Constants.ROUTES.LOG, LoggerView);
    Router.register(Constants.ROUTES.INSIGHTS, InsightsView);
    Router.register(Constants.ROUTES.CHALLENGES, ChallengesView);
    Router.register(Constants.ROUTES.SETTINGS, SettingsView);

    // Initialize router (triggers first route render)
    Router.init(main);

    console.log(`[${Constants.APP_NAME}] Ready ✓`);
  }

  /**
   * Applies saved user preferences (theme, font size, reduced motion).
   * Called once during init, before any views render.
   */
  function applyPreferences() {
    const prefs = Store.get('preferences');

    // Theme — only override if user has explicitly chosen (not 'auto')
    if (prefs.theme && prefs.theme !== Constants.THEMES.AUTO) {
      document.documentElement.setAttribute('data-theme', prefs.theme);
    }

    // Font size — scale up root font size for accessibility
    if (prefs.fontSize === Constants.FONT_SIZES.LARGE) {
      document.documentElement.style.fontSize = Constants.LARGE_FONT_SIZE_PX;
    }

    // Reduced motion — disable all CSS transition durations
    if (prefs.reducedMotion) {
      document.documentElement.style.setProperty('--duration-fast', '0ms');
      document.documentElement.style.setProperty('--duration-normal', '0ms');
      document.documentElement.style.setProperty('--duration-slow', '0ms');
    }
  }

  return Object.freeze({ init });
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
