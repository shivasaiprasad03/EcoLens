/**
 * EcoLens — Toast Notification Component
 * Auto-dismissing notifications with ARIA live regions.
 * @module components/toast
 */

const Toast = (() => {
  'use strict';

  const ICONS = Object.freeze({
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  });

  let container = null;

  /**
   * Ensures the toast container exists.
   * @returns {HTMLElement}
   */
  function getContainer() {
    if (!container || !document.body.contains(container)) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', 'Notifications');
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Shows a toast notification.
   * @param {Object} options
   * @param {string} options.title - Toast title.
   * @param {string} [options.message] - Optional message body.
   * @param {string} [options.type='info'] - 'success' | 'error' | 'warning' | 'info'
   * @param {number} [options.duration=4000] - Auto-dismiss time in ms (0 = no auto-dismiss).
   */
  function show({ title, message = '', type = 'info', duration = 4000 }) {
    const containerEl = getContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

    const id = Utils.generateId('toast');
    toast.id = id;

    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${ICONS[type] || ICONS.info}</span>
      <div class="toast-content">
        <div class="toast-title">${Utils.sanitize(title)}</div>
        ${message ? `<div class="toast-message">${Utils.sanitize(message)}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Dismiss notification" data-toast-id="${id}">
        <span aria-hidden="true">✕</span>
      </button>
      ${duration > 0 ? `<div class="toast-progress" style="width: 100%; transition: width ${duration}ms linear;"></div>` : ''}
    `;

    containerEl.appendChild(toast);

    // Start progress bar animation
    if (duration > 0) {
      const progressBar = toast.querySelector('.toast-progress');
      requestAnimationFrame(() => {
        if (progressBar) progressBar.style.width = '0%';
      });
    }

    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => dismiss(toast));

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => dismiss(toast), duration);
    }

    // Announce to screen reader
    Utils.announceToScreenReader(`${type}: ${title}${message ? '. ' + message : ''}`);

    return toast;
  }

  /**
   * Convenience methods.
   */
  function success(title, message) { return show({ title, message, type: 'success' }); }
  function error(title, message) { return show({ title, message, type: 'error' }); }
  function warning(title, message) { return show({ title, message, type: 'warning' }); }
  function info(title, message) { return show({ title, message, type: 'info' }); }

  /**
   * Dismisses a toast with animation.
   * @param {HTMLElement} toast
   */
  function dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 200);
  }

  /**
   * Dismisses all toasts.
   */
  function dismissAll() {
    const containerEl = getContainer();
    containerEl.querySelectorAll('.toast').forEach((t) => dismiss(t));
  }

  return Object.freeze({
    show,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
  });
})();
