/**
 * EcoLens — Navbar Component
 * Responsive navigation with theme toggle and mobile menu.
 * @module components/navbar
 */

const Navbar = (() => {
  'use strict';

  let isMenuOpen = false;

  /**
   * Renders the navbar into the app shell.
   * @param {HTMLElement} container
   */
  function render(container) {
    const profile = Store.get('profile');
    const prefs = Store.get('preferences');
    const showNav = profile && profile.completed;

    const nav = document.createElement('nav');
    nav.className = 'navbar';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Main navigation');

    nav.innerHTML = `
      <div class="navbar-inner">
        <a href="#/" class="navbar-brand" aria-label="EcoLens Home">
          <div class="navbar-logo" aria-hidden="true">🌿</div>
          <span>EcoLens</span>
        </a>

        ${showNav ? `
          <button class="nav-toggle btn-icon" aria-label="Toggle navigation menu" aria-expanded="false" id="nav-toggle-btn">
            <span aria-hidden="true">☰</span>
          </button>

          <div class="navbar-nav" id="navbar-nav" role="menubar">
            <a href="#/dashboard" class="nav-link" role="menuitem" id="nav-dashboard">
              <span class="nav-icon" aria-hidden="true">📊</span>
              <span>Dashboard</span>
            </a>
            <a href="#/log" class="nav-link" role="menuitem" id="nav-log">
              <span class="nav-icon" aria-hidden="true">📝</span>
              <span>Log Activity</span>
            </a>
            <a href="#/insights" class="nav-link" role="menuitem" id="nav-insights">
              <span class="nav-icon" aria-hidden="true">💡</span>
              <span>Insights</span>
            </a>
            <a href="#/challenges" class="nav-link" role="menuitem" id="nav-challenges">
              <span class="nav-icon" aria-hidden="true">🏆</span>
              <span>Challenges</span>
            </a>
            <a href="#/settings" class="nav-link" role="menuitem" id="nav-settings">
              <span class="nav-icon" aria-hidden="true">⚙️</span>
              <span>Settings</span>
            </a>
          </div>
        ` : ''}

        <div class="navbar-actions">
          <button class="btn-icon btn-ghost" id="theme-toggle-btn" aria-label="Toggle dark mode" title="Toggle dark mode">
            <span aria-hidden="true">${prefs.theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>
        </div>
      </div>
    `;

    container.prepend(nav);

    // Event listeners
    const toggleBtn = nav.querySelector('#nav-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleMenu);
    }

    const themeBtn = nav.querySelector('#theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }

    // Close menu on nav link click (mobile)
    nav.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        if (isMenuOpen) closeMenu();
      });
    });

    // Close menu on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMenuOpen) closeMenu();
    });
  }

  /**
   * Toggles the mobile nav menu.
   */
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    const navMenu = document.getElementById('navbar-nav');
    const toggleBtn = document.getElementById('nav-toggle-btn');

    if (navMenu) {
      navMenu.classList.toggle('open', isMenuOpen);
    }
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', String(isMenuOpen));
      toggleBtn.querySelector('span').textContent = isMenuOpen ? '✕' : '☰';
    }
  }

  /**
   * Closes the mobile nav menu.
   */
  function closeMenu() {
    isMenuOpen = false;
    const navMenu = document.getElementById('navbar-nav');
    const toggleBtn = document.getElementById('nav-toggle-btn');

    if (navMenu) navMenu.classList.remove('open');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.querySelector('span').textContent = '☰';
    }
  }

  /**
   * Toggles between light and dark theme.
   */
  function toggleTheme() {
    const prefs = Store.get('preferences');
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    Store.update('preferences', { theme: newTheme });

    // Update button icon
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.querySelector('span').textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }

    Utils.announceToScreenReader(`Switched to ${newTheme} mode`);
  }

  /**
   * Re-renders the navbar (e.g., after profile completion).
   */
  function refresh() {
    const existingNav = document.querySelector('.navbar');
    if (existingNav) {
      existingNav.remove();
    }
    const shell = document.querySelector('.app-shell');
    if (shell) {
      render(shell);
    }
  }

  return Object.freeze({
    render,
    refresh,
    toggleTheme,
  });
})();
