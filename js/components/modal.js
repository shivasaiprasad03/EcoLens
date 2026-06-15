/**
 * EcoLens — Modal Dialog Component
 * Accessible modal with focus trapping and keyboard support.
 * @module components/modal
 */

const Modal = (() => {
  'use strict';

  let activeModal = null;
  let cleanupFocusTrap = null;
  let previouslyFocused = null;

  /**
   * Opens a modal dialog.
   * @param {Object} options
   * @param {string} options.title - Modal title.
   * @param {string} options.body - HTML content for the body.
   * @param {Array<{label: string, className?: string, onClick: Function}>} [options.actions]
   * @param {Function} [options.onClose] - Callback when modal is closed.
   * @returns {HTMLElement} The modal element.
   */
  function open({ title, body, actions = [], onClose = null }) {
    // Close any existing modal
    if (activeModal) close();

    // Save focus
    previouslyFocused = document.activeElement;

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = 'modal-backdrop';
    backdrop.addEventListener('click', () => close());
    document.body.appendChild(backdrop);

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');
    modal.id = 'active-modal';

    const actionsHtml = actions.length > 0
      ? `<div class="modal-footer">
          ${actions.map((a, i) => `
            <button class="btn ${a.className || 'btn-secondary'}" id="modal-action-${i}">
              ${Utils.sanitize(a.label)}
            </button>
          `).join('')}
        </div>`
      : '';

    modal.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title" id="modal-title">${Utils.sanitize(title)}</h2>
        <button class="modal-close" aria-label="Close dialog" id="modal-close-btn">
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      <div class="modal-body" id="modal-body">
        ${body}
      </div>
      ${actionsHtml}
    `;

    document.body.appendChild(modal);
    activeModal = modal;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Event listeners
    const closeBtn = modal.querySelector('#modal-close-btn');
    closeBtn.addEventListener('click', () => close());

    actions.forEach((action, i) => {
      const btn = modal.querySelector(`#modal-action-${i}`);
      if (btn) {
        btn.addEventListener('click', () => {
          if (action.onClick) action.onClick();
          if (action.autoClose !== false) close();
        });
      }
    });

    // ESC to close
    document.addEventListener('keydown', handleEsc);

    // Focus trap
    cleanupFocusTrap = Utils.trapFocus(modal);

    // Announce to screen reader
    Utils.announceToScreenReader(`Dialog opened: ${title}`, 'assertive');

    return modal;
  }

  /**
   * Closes the active modal.
   */
  function close() {
    if (!activeModal) return;

    // Remove event listeners
    document.removeEventListener('keydown', handleEsc);
    if (cleanupFocusTrap) {
      cleanupFocusTrap();
      cleanupFocusTrap = null;
    }

    // Remove elements
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) backdrop.remove();
    activeModal.remove();
    activeModal = null;

    // Restore body scroll
    document.body.style.overflow = '';

    // Restore focus
    if (previouslyFocused && previouslyFocused.focus) {
      previouslyFocused.focus();
    }
    previouslyFocused = null;

    Utils.announceToScreenReader('Dialog closed');
  }

  /**
   * Handles ESC key to close modal.
   * @param {KeyboardEvent} e
   */
  function handleEsc(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  }

  /**
   * Opens a confirmation dialog.
   * @param {string} title
   * @param {string} message
   * @param {Function} onConfirm
   * @param {string} [confirmLabel='Confirm']
   * @param {string} [confirmClass='btn-danger']
   */
  function confirm(title, message, onConfirm, confirmLabel = 'Confirm', confirmClass = 'btn-danger') {
    open({
      title,
      body: `<p>${Utils.sanitize(message)}</p>`,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: () => {} },
        { label: confirmLabel, className: confirmClass, onClick: onConfirm },
      ],
    });
  }

  return Object.freeze({
    open,
    close,
    confirm,
  });
})();
