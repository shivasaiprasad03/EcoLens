/**
 * EcoLens — Hash-based SPA Router
 * Manages view lifecycle and navigation.
 * @module router
 */

const Router = (() => {
  'use strict';

  /** @type {Map<string, {mount: Function, unmount: Function}>} */
  const routes = new Map();

  /** @type {string|null} */
  let currentRoute = null;

  /** @type {HTMLElement|null} */
  let mountPoint = null;

  /**
   * Initializes the router with a mount point element.
   * @param {HTMLElement} element - The DOM element to render views into.
   */
  function init(element) {
    mountPoint = element;
    window.addEventListener('hashchange', handleHashChange);
    // Handle initial route
    handleHashChange();
  }

  /**
   * Registers a route.
   * @param {string} path - Route path (e.g., '/dashboard').
   * @param {Object} viewModule - Object with mount(container) and unmount() methods.
   */
  function register(path, viewModule) {
    if (!viewModule || typeof viewModule.mount !== 'function') {
      console.error(`[Router] Invalid view module for path "${path}"`);
      return;
    }
    routes.set(path, viewModule);
  }

  /**
   * Navigates to a route.
   * @param {string} path
   */
  function navigate(path) {
    window.location.hash = '#' + path;
  }

  /**
   * Gets the current route path from the hash.
   * @returns {string}
   */
  function getCurrentPath() {
    const hash = window.location.hash.slice(1) || '/';
    return hash;
  }

  /**
   * Handles hash change events — unmounts old view, mounts new one.
   */
  function handleHashChange() {
    const path = getCurrentPath();

    // Skip if same route
    if (path === currentRoute) return;

    // Unmount current view
    if (currentRoute && routes.has(currentRoute)) {
      const oldView = routes.get(currentRoute);
      if (typeof oldView.unmount === 'function') {
        try {
          oldView.unmount();
        } catch (err) {
          console.error(`[Router] Error unmounting "${currentRoute}":`, err);
        }
      }
    }

    // Clear mount point
    if (mountPoint) {
      mountPoint.innerHTML = '';
    }

    // Determine which view to mount
    let viewPath = path;
    if (!routes.has(viewPath)) {
      // Fallback to default route
      const profile = Store.get('profile');
      viewPath = profile && profile.completed ? '/dashboard' : '/';
      // Update hash silently
      if (path !== viewPath) {
        history.replaceState(null, '', '#' + viewPath);
      }
    }

    // Mount new view
    const view = routes.get(viewPath);
    if (view && mountPoint) {
      currentRoute = viewPath;
      try {
        view.mount(mountPoint);
      } catch (err) {
        console.error(`[Router] Error mounting "${viewPath}":`, err);
        mountPoint.innerHTML = `
          <div class="container" style="padding-top: var(--space-16); text-align: center;">
            <p class="text-xl font-semibold">Something went wrong</p>
            <p class="text-secondary mt-2">Please try refreshing the page.</p>
          </div>
        `;
      }

      // Announce route change to screen readers
      Utils.announceToScreenReader(`Navigated to ${viewPath.slice(1) || 'home'} page`);

      // Move focus to main content for accessibility
      if (mountPoint) {
        mountPoint.setAttribute('tabindex', '-1');
        mountPoint.focus({ preventScroll: true });
        mountPoint.removeAttribute('tabindex');
      }

      // Update nav active states
      updateNavActiveState(viewPath);
    }
  }

  /**
   * Updates the active class on nav links.
   * @param {string} activePath
   */
  function updateNavActiveState(activePath) {
    document.querySelectorAll('.nav-link').forEach((link) => {
      const href = link.getAttribute('href');
      if (href === '#' + activePath) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  /**
   * Destroys the router (cleanup).
   */
  function destroy() {
    window.removeEventListener('hashchange', handleHashChange);
    routes.clear();
    currentRoute = null;
  }

  return Object.freeze({
    init,
    register,
    navigate,
    getCurrentPath,
    destroy,
  });
})();
