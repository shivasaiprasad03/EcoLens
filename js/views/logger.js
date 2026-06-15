/**
 * EcoLens — Activity Logger View
 * Tabbed form for logging emissions across all categories.
 * @module views/logger
 */

const LoggerView = (() => {
  'use strict';

  let activeCategory = 'transport';
  let unsubActivities = null;

  const CATEGORIES = ['transport', 'food', 'energy', 'shopping', 'waste'];

  /**
   * Mounts the logger view.
   * @param {HTMLElement} container
   */
  function mount(container) {
    render(container);
    unsubActivities = Store.subscribe('activities', () => renderRecentActivities());
  }

  /**
   * Renders the logger view.
   * @param {HTMLElement} container
   */
  function render(container) {
    container.innerHTML = `
      <div class="view">
        <div class="container">
          <div class="view-header">
            <h1 class="view-title">Log Activity</h1>
            <p class="view-subtitle">Record your daily activities to track your carbon footprint</p>
          </div>

          <div class="logger-layout">
            <!-- Log Form -->
            <div>
              <div class="tabs" role="tablist" aria-label="Activity categories" id="category-tabs">
                ${CATEGORIES.map((cat) => {
                  const meta = Emissions.getCategoryMeta(cat);
                  return `<button class="tab ${cat === activeCategory ? 'active' : ''}" 
                            role="tab" 
                            aria-selected="${cat === activeCategory}" 
                            aria-controls="tab-panel-${cat}" 
                            data-category="${cat}"
                            id="tab-${cat}">
                    <span aria-hidden="true">${meta.icon}</span> ${meta.label}
                  </button>`;
                }).join('')}
              </div>

              <div class="log-form-card mt-4" id="log-form-container">
                ${renderForm(activeCategory)}
              </div>
            </div>

            <!-- Recent Activities Sidebar -->
            <div class="recent-activities" id="recent-activities">
              <h2 class="card-title" style="margin-bottom: var(--space-4);">Recent Activities</h2>
              <div id="activities-list">
                ${renderActivitiesList()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    attachListeners();
  }

  /**
   * Renders the form for a given category.
   * @param {string} category
   * @returns {string}
   */
  function renderForm(category) {
    const profile = Store.get('profile');

    switch (category) {
      case 'transport':
        return `
          <div role="tabpanel" id="tab-panel-transport" aria-labelledby="tab-transport">
            <h3 class="text-lg font-semibold mb-4">Log Transport</h3>
            <div class="form-group">
              <label class="form-label" for="transport-type">Transport Type</label>
              <select class="form-select" id="transport-type">
                ${Emissions.getTransportTypes().map((t) => `
                  <option value="${t.key}" ${t.key === profile.commute ? 'selected' : ''}>${t.icon} ${t.label}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="transport-distance">Distance (km)</label>
              <input type="number" class="form-input" id="transport-distance" min="0" max="50000" step="0.5" 
                     value="${profile.commuteDistance ? profile.commuteDistance * 2 : 10}" placeholder="Enter distance in km">
              <span class="form-hint">Round trip distance for commutes</span>
            </div>
            <button class="btn btn-primary w-full" id="log-submit" type="button">Log Transport Activity</button>
            <div id="log-result"></div>
          </div>
        `;

      case 'food':
        return `
          <div role="tabpanel" id="tab-panel-food" aria-labelledby="tab-food">
            <h3 class="text-lg font-semibold mb-4">Log Meals</h3>
            <div class="form-group">
              <label class="form-label" for="food-type">Meal Type</label>
              <select class="form-select" id="food-type">
                ${Emissions.getFoodTypes().map((f) => `
                  <option value="${f.key}" ${f.key === profile.diet ? 'selected' : ''}>${f.icon} ${f.label} (${f.factor} kg CO₂e/meal)</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="food-meals">Number of Meals</label>
              <input type="number" class="form-input" id="food-meals" min="1" max="20" value="1" step="1">
            </div>
            <button class="btn btn-primary w-full" id="log-submit" type="button">Log Meals</button>
            <div id="log-result"></div>
          </div>
        `;

      case 'energy':
        return `
          <div role="tabpanel" id="tab-panel-energy" aria-labelledby="tab-energy">
            <h3 class="text-lg font-semibold mb-4">Log Energy Usage</h3>
            <div class="form-group">
              <label class="form-label" for="energy-source">Energy Source</label>
              <select class="form-select" id="energy-source">
                <option value="grid" ${profile.energySource === 'grid' ? 'selected' : ''}>🔌 Grid (Global Avg)</option>
                <option value="grid-us" ${profile.energySource === 'grid-us' ? 'selected' : ''}>🇺🇸 US Grid</option>
                <option value="grid-eu" ${profile.energySource === 'grid-eu' ? 'selected' : ''}>🇪🇺 EU Grid</option>
                <option value="grid-uk" ${profile.energySource === 'grid-uk' ? 'selected' : ''}>🇬🇧 UK Grid</option>
                <option value="solar" ${profile.energySource === 'solar' ? 'selected' : ''}>☀️ Solar</option>
                <option value="wind" ${profile.energySource === 'wind' ? 'selected' : ''}>💨 Wind</option>
                <option value="mixed-renewable" ${profile.energySource === 'mixed-renewable' ? 'selected' : ''}>🌿 Green Tariff</option>
                <option value="natural-gas">🔥 Natural Gas</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="energy-kwh">Energy Used (kWh)</label>
              <input type="number" class="form-input" id="energy-kwh" min="0" max="10000" step="0.1" 
                     value="${Emissions.HOME_ENERGY_DAILY[profile.homeSize] || 15}" placeholder="Enter kWh">
              <span class="form-hint">Average daily home usage: ~${Emissions.HOME_ENERGY_DAILY[profile.homeSize] || 15} kWh</span>
            </div>
            <button class="btn btn-primary w-full" id="log-submit" type="button">Log Energy Usage</button>
            <div id="log-result"></div>
          </div>
        `;

      case 'shopping':
        return `
          <div role="tabpanel" id="tab-panel-shopping" aria-labelledby="tab-shopping">
            <h3 class="text-lg font-semibold mb-4">Log Purchase</h3>
            <div class="form-group">
              <label class="form-label" for="shopping-type">Item Category</label>
              <select class="form-select" id="shopping-type">
                ${Emissions.getShoppingTypes().map((s) => `
                  <option value="${s.key}">${s.icon} ${s.label}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="shopping-qty">Quantity</label>
              <input type="number" class="form-input" id="shopping-qty" min="1" max="100" value="1" step="1">
            </div>
            <button class="btn btn-primary w-full" id="log-submit" type="button">Log Purchase</button>
            <div id="log-result"></div>
          </div>
        `;

      case 'waste':
        return `
          <div role="tabpanel" id="tab-panel-waste" aria-labelledby="tab-waste">
            <h3 class="text-lg font-semibold mb-4">Log Waste</h3>
            <div class="form-group">
              <label class="form-label" for="waste-type">Disposal Method</label>
              <select class="form-select" id="waste-type">
                <option value="landfill">🗑️ Landfill</option>
                <option value="recycled">♻️ Recycled</option>
                <option value="composted">🌱 Composted</option>
                <option value="incinerated">🔥 Incinerated</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="waste-kg">Weight (kg)</label>
              <input type="number" class="form-input" id="waste-kg" min="0" max="1000" step="0.1" value="1" placeholder="Enter weight in kg">
            </div>
            <button class="btn btn-primary w-full" id="log-submit" type="button">Log Waste</button>
            <div id="log-result"></div>
          </div>
        `;

      default:
        return '<p>Unknown category</p>';
    }
  }

  /**
   * Renders the recent activities list.
   * @returns {string}
   */
  function renderActivitiesList() {
    const activities = Store.getActivities();
    const recent = activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 15);

    if (recent.length === 0) {
      return `
        <div class="empty-state" style="padding: var(--space-8) 0;">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-title">No activities yet</div>
          <div class="empty-state-text">Log your first activity using the form on the left.</div>
        </div>
      `;
    }

    return recent.map((activity) => {
      const meta = Emissions.getCategoryMeta(activity.category);
      return `
        <div class="activity-item" data-activity-id="${activity.id}">
          <div class="activity-icon" style="background: ${meta.color}15;" aria-hidden="true">
            ${meta.icon}
          </div>
          <div class="activity-info">
            <div class="activity-name">${Utils.sanitize(activity.type)} — ${activity.value} ${Utils.sanitize(activity.unit || '')}</div>
            <div class="activity-time">${Utils.formatDate(activity.date, 'relative')}</div>
          </div>
          <div class="activity-co2">${Utils.formatCO2(activity.co2)}</div>
          <button class="activity-delete" aria-label="Delete activity" data-delete-id="${activity.id}">
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      `;
    }).join('');
  }

  /**
   * Updates the recent activities section.
   */
  function renderRecentActivities() {
    const listEl = document.getElementById('activities-list');
    if (listEl) {
      listEl.innerHTML = renderActivitiesList();
      attachDeleteListeners();
    }
  }

  /**
   * Attaches all event listeners.
   */
  function attachListeners() {
    // Tab switching
    document.querySelectorAll('#category-tabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        activeCategory = tab.dataset.category;

        // Update tab UI
        document.querySelectorAll('#category-tabs .tab').forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        // Re-render form
        const formContainer = document.getElementById('log-form-container');
        if (formContainer) {
          formContainer.innerHTML = renderForm(activeCategory);
          attachFormListeners();
        }
      });
    });

    attachFormListeners();
    attachDeleteListeners();
  }

  /**
   * Attaches form submit listener.
   */
  function attachFormListeners() {
    const submitBtn = document.getElementById('log-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', handleSubmit);
    }
  }

  /**
   * Attaches delete buttons listeners.
   */
  function attachDeleteListeners() {
    document.querySelectorAll('.activity-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.deleteId;
        Store.deleteActivity(id);
        Toast.info('Activity deleted');
      });
    });
  }

  /**
   * Handles form submission.
   */
  function handleSubmit() {
    let type, value, unit, co2;

    switch (activeCategory) {
      case 'transport': {
        type = document.getElementById('transport-type').value;
        const distVal = Utils.validateNumber(document.getElementById('transport-distance').value, 0, 50000);
        if (!distVal.valid) { Toast.error('Invalid distance', distVal.error); return; }
        value = distVal.value;
        unit = 'km';
        co2 = Emissions.calcTransport(type, value);
        break;
      }
      case 'food': {
        type = document.getElementById('food-type').value;
        const mealVal = Utils.validateNumber(document.getElementById('food-meals').value, 1, 20);
        if (!mealVal.valid) { Toast.error('Invalid meals', mealVal.error); return; }
        value = mealVal.value;
        unit = 'meals';
        co2 = Emissions.calcFood(type, value);
        break;
      }
      case 'energy': {
        type = document.getElementById('energy-source').value;
        const kwhVal = Utils.validateNumber(document.getElementById('energy-kwh').value, 0, 10000);
        if (!kwhVal.valid) { Toast.error('Invalid energy', kwhVal.error); return; }
        value = kwhVal.value;
        unit = 'kWh';
        co2 = Emissions.calcEnergy(type, value);
        break;
      }
      case 'shopping': {
        type = document.getElementById('shopping-type').value;
        const qtyVal = Utils.validateNumber(document.getElementById('shopping-qty').value, 1, 100);
        if (!qtyVal.valid) { Toast.error('Invalid quantity', qtyVal.error); return; }
        value = qtyVal.value;
        unit = 'items';
        co2 = Emissions.calcShopping(type, value);
        break;
      }
      case 'waste': {
        type = document.getElementById('waste-type').value;
        const kgVal = Utils.validateNumber(document.getElementById('waste-kg').value, 0, 1000);
        if (!kgVal.valid) { Toast.error('Invalid weight', kgVal.error); return; }
        value = kgVal.value;
        unit = 'kg';
        co2 = Emissions.calcWaste(type, value);
        break;
      }
    }

    // Save activity
    const activity = Store.addActivity({ category: activeCategory, type, value, unit, co2 });
    const meta = Emissions.getCategoryMeta(activeCategory);

    // Show result
    const resultEl = document.getElementById('log-result');
    if (resultEl) {
      const isNegative = co2 < 0;
      resultEl.innerHTML = `
        <div class="log-result">
          <div>
            <div class="log-result-value" style="${isNegative ? 'color: var(--color-success);' : ''}">
              ${isNegative ? '−' : '+'}${Utils.formatCO2(Math.abs(co2))}
            </div>
            <div class="log-result-label">
              ${isNegative ? 'Emissions avoided! 🎉' : 'CO₂e emitted'}
            </div>
          </div>
        </div>
      `;
    }

    Toast.success('Activity logged!', `${meta.icon} ${Utils.formatCO2(Math.abs(co2))} CO₂e ${co2 < 0 ? 'saved' : 'recorded'}`);
  }

  /**
   * Unmounts the logger view.
   */
  function unmount() {
    if (unsubActivities) {
      unsubActivities();
      unsubActivities = null;
    }
  }

  return Object.freeze({
    mount,
    unmount,
  });
})();
