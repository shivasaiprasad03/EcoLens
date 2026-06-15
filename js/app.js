/**
 * EcoLens — Application Entry Point
 * Initializes the app, sets up router, and manages the app shell.
 * @module app
 */

const App = (() => {
  'use strict';

  /**
   * Initializes the EcoLens application.
   */
  function init() {
    console.log('[EcoLens] Initializing...');

    // Apply saved preferences
    applyPreferences();

    // Set up the app shell
    const shell = document.getElementById('app');
    if (!shell) {
      console.error('[EcoLens] #app element not found');
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

    // Register routes
    Router.register('/', OnboardingView);
    Router.register('/dashboard', DashboardView);
    Router.register('/log', LoggerView);
    Router.register('/insights', InsightsView);
    Router.register('/challenges', ChallengesView);
    Router.register('/settings', SettingsView);

    // Initialize router
    Router.init(main);

    console.log('[EcoLens] Ready ✓');
  }

  /**
   * Applies saved user preferences (theme, font size, reduced motion).
   */
  function applyPreferences() {
    const prefs = Store.get('preferences');

    // Theme
    if (prefs.theme && prefs.theme !== 'auto') {
      document.documentElement.setAttribute('data-theme', prefs.theme);
    }

    // Font size
    if (prefs.fontSize === 'large') {
      document.documentElement.style.fontSize = '18px';
    }

    // Reduced motion
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
