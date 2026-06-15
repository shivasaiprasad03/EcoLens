/**
 * EcoLens — Insights View
 * Personalized reduction tips with what-if simulator.
 * @module views/insights
 */

const InsightsView = (() => {
  'use strict';

  let selectedTips = new Set();

  /**
   * Mounts the insights view.
   * @param {HTMLElement} container
   */
  function mount(container) {
    selectedTips.clear();
    render(container);
  }

  /**
   * Renders the insights view.
   * @param {HTMLElement} container
   */
  function render(container) {
    const tips = Insights.generateTips(12);
    const profile = Store.get('profile');
    const baseline = Emissions.estimateBaseline(profile);

    container.innerHTML = `
      <div class="view">
        <div class="container">
          <div class="view-header">
            <h1 class="view-title">Personalized Insights</h1>
            <p class="view-subtitle">Smart recommendations based on your habits and emission profile</p>
          </div>

          <div class="insights-layout">
            <!-- Tips List -->
            <div id="tips-list">
              ${tips.length > 0 ? tips.map((tip, index) => renderTipCard(tip, index)).join('') : `
                <div class="empty-state">
                  <div class="empty-state-icon">💡</div>
                  <div class="empty-state-title">No tips available</div>
                  <div class="empty-state-text">Complete your profile and log some activities to get personalized tips.</div>
                </div>
              `}
            </div>

            <!-- What-If Panel -->
            <div class="whatif-panel" id="whatif-panel">
              <h2 class="whatif-title">🔮 What-If Simulator</h2>
              <p class="text-sm text-secondary mb-4">Select tips above to see your projected savings</p>

              <div class="whatif-reduction">
                <div class="whatif-value" id="whatif-value">0 kg</div>
                <div class="whatif-label">Potential annual savings</div>
              </div>

              <div style="margin-bottom: var(--space-4);">
                <div class="flex justify-between text-sm mb-2">
                  <span class="text-secondary">Current estimate</span>
                  <span class="font-semibold">${Utils.formatCO2(baseline.total, true)}/yr</span>
                </div>
                <div class="flex justify-between text-sm mb-2">
                  <span class="text-secondary">After changes</span>
                  <span class="font-semibold text-success" id="whatif-after">${Utils.formatCO2(baseline.total, true)}/yr</span>
                </div>
                <div class="progress mt-2">
                  <div class="progress-bar" id="whatif-progress" style="width: 100%;"></div>
                </div>
              </div>

              <div class="divider"></div>

              <div style="padding: var(--space-3); background: var(--color-bg-secondary); border-radius: var(--radius-md);">
                <p class="text-sm text-secondary">
                  🎯 <strong>Paris Target:</strong> ${Emissions.PARIS_TARGET}t/year per person<br>
                  <span class="text-xs">Current: ${(baseline.total / 1000).toFixed(1)}t — 
                  ${baseline.total / 1000 > Emissions.PARIS_TARGET 
                    ? `${((baseline.total / 1000) - Emissions.PARIS_TARGET).toFixed(1)}t to go` 
                    : '✅ You\'re already below!'}
                  </span>
                </p>
              </div>

              <div class="mt-4" id="selected-tips-list"></div>
            </div>
          </div>

          <!-- Carbon Offset Section -->
          <div class="card mt-8">
            <div class="card-header">
              <h2 class="card-title">🌳 Carbon Offset Education</h2>
            </div>
            <div class="card-body">
              <p style="margin-bottom: var(--space-4);">
                Carbon offsets are reductions in CO₂ emissions made to compensate for emissions elsewhere. While reducing your own emissions should always be the priority, offsets can help bridge the gap.
              </p>
              <div class="grid grid-cols-3 gap-4" style="margin-top: var(--space-4);">
                <div style="text-align: center; padding: var(--space-4); background: var(--color-bg-secondary); border-radius: var(--radius-lg);">
                  <div style="font-size: 2rem;" aria-hidden="true">🌳</div>
                  <div class="font-semibold mt-2">Tree Planting</div>
                  <div class="text-xs text-secondary mt-1">1 tree absorbs ~22 kg CO₂/year</div>
                  <div class="text-sm font-semibold text-accent mt-2">${Math.ceil(baseline.total / 22)} trees needed</div>
                </div>
                <div style="text-align: center; padding: var(--space-4); background: var(--color-bg-secondary); border-radius: var(--radius-lg);">
                  <div style="font-size: 2rem;" aria-hidden="true">☀️</div>
                  <div class="font-semibold mt-2">Solar Panels</div>
                  <div class="text-xs text-secondary mt-1">1 panel saves ~400 kg CO₂/year</div>
                  <div class="text-sm font-semibold text-accent mt-2">${Math.ceil(baseline.total / 400)} panels offset it</div>
                </div>
                <div style="text-align: center; padding: var(--space-4); background: var(--color-bg-secondary); border-radius: var(--radius-lg);">
                  <div style="font-size: 2rem;" aria-hidden="true">💨</div>
                  <div class="font-semibold mt-2">Wind Credits</div>
                  <div class="text-xs text-secondary mt-1">~$10-15 per tonne of CO₂</div>
                  <div class="text-sm font-semibold text-accent mt-2">~$${Math.round(baseline.total / 1000 * 12)}/year</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    attachListeners(tips, baseline);
  }

  /**
   * Renders a single tip card.
   * @param {Object} tip
   * @param {number} index
   * @returns {string}
   */
  function renderTipCard(tip, index) {
    const meta = Emissions.getCategoryMeta(tip.category);
    return `
      <div class="tip-card" data-tip-id="${tip.id}" style="animation-delay: ${index * 60}ms;" id="tip-card-${tip.id}">
        <div class="tip-header">
          <div class="tip-icon" style="background: ${meta.color}15;">
            ${meta.icon}
          </div>
          <div style="flex: 1;">
            <div class="tip-title">${Utils.sanitize(tip.title)}</div>
            <div class="badge badge-neutral">${Utils.sanitize(meta.label)}</div>
          </div>
          <label class="form-check" style="margin: 0; min-height: auto;">
            <input type="checkbox" class="form-check-input tip-checkbox" data-tip-id="${tip.id}" data-savings="${tip.savingsKg}" aria-label="Select this tip for what-if simulation">
          </label>
        </div>
        <div class="tip-description">${Utils.sanitize(tip.description)}</div>
        <div class="tip-meta">
          <div class="tip-savings">
            <span aria-hidden="true">📉</span> Save ${Utils.formatCO2(tip.savingsKg, true)}/year
          </div>
          <span class="tip-difficulty ${tip.difficulty}">${tip.difficulty.charAt(0).toUpperCase() + tip.difficulty.slice(1)}</span>
          <button class="btn btn-sm btn-ghost" data-dismiss-tip="${tip.id}" aria-label="Dismiss this tip">
            Dismiss
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Attaches event listeners.
   * @param {Array} tips
   * @param {Object} baseline
   */
  function attachListeners(tips, baseline) {
    // Tip checkboxes for what-if
    document.querySelectorAll('.tip-checkbox').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        const tipId = checkbox.dataset.tipId;
        if (checkbox.checked) {
          selectedTips.add(tipId);
        } else {
          selectedTips.delete(tipId);
        }
        updateWhatIf(tips, baseline);
      });
    });

    // Dismiss buttons
    document.querySelectorAll('[data-dismiss-tip]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tipId = btn.dataset.dismissTip;
        Insights.dismissTip(tipId);
        const card = document.getElementById(`tip-card-${tipId}`);
        if (card) {
          card.style.opacity = '0';
          card.style.transform = 'translateX(-20px)';
          setTimeout(() => card.remove(), 300);
        }
        Toast.info('Tip dismissed', 'You won\'t see this tip again');
      });
    });
  }

  /**
   * Updates the what-if simulator panel.
   * @param {Array} tips
   * @param {Object} baseline
   */
  function updateWhatIf(tips, baseline) {
    const selectedTipObjects = tips.filter((t) => selectedTips.has(t.id));
    const totalSavings = Insights.totalPotentialSavings(selectedTipObjects);
    const newTotal = Math.max(0, baseline.total - totalSavings);

    const valueEl = document.getElementById('whatif-value');
    const afterEl = document.getElementById('whatif-after');
    const progressEl = document.getElementById('whatif-progress');
    const listEl = document.getElementById('selected-tips-list');

    if (valueEl) {
      valueEl.textContent = Utils.formatCO2(totalSavings, true);
      valueEl.style.color = totalSavings > 0 ? 'var(--color-success)' : '';
    }
    if (afterEl) afterEl.textContent = `${Utils.formatCO2(newTotal, true)}/yr`;
    if (progressEl) progressEl.style.width = `${(newTotal / baseline.total) * 100}%`;

    if (listEl) {
      if (selectedTipObjects.length > 0) {
        listEl.innerHTML = `
          <h3 class="text-sm font-semibold mb-2">Selected actions (${selectedTipObjects.length}):</h3>
          ${selectedTipObjects.map((t) => `
            <div class="flex items-center gap-2 text-xs" style="padding: var(--space-1) 0;">
              <span class="text-success">✓</span>
              <span>${Utils.sanitize(t.title)}</span>
            </div>
          `).join('')}
        `;
      } else {
        listEl.innerHTML = '';
      }
    }
  }

  /**
   * Unmounts the insights view.
   */
  function unmount() {
    selectedTips.clear();
  }

  return Object.freeze({
    mount,
    unmount,
  });
})();
