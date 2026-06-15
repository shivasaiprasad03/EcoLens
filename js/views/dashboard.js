/**
 * EcoLens — Dashboard View
 * Main overview with stats, charts, trends, and quick-log buttons.
 * @module views/dashboard
 */

const DashboardView = (() => {
  'use strict';

  let unsubActivities = null;

  /**
   * Mounts the dashboard view.
   * @param {HTMLElement} container
   */
  function mount(container) {
    render(container);
    unsubActivities = Store.subscribe('activities', () => render(container));
  }

  /**
   * Renders the dashboard.
   * @param {HTMLElement} container
   */
  function render(container) {
    const profile = Store.get('profile');
    const today = Utils.today();
    const week = Utils.currentWeekRange();
    const month = Utils.currentMonthRange();

    const todayCO2 = Store.getTotalCO2(today, today);
    const weekCO2 = Store.getTotalCO2(week.start, week.end);
    const monthCO2 = Store.getTotalCO2(month.start, month.end);
    const baseline = Emissions.estimateBaseline(profile);
    const nationalAvg = Emissions.getNationalAverage(profile.country);

    // Calculate weekly change
    const lastWeekStart = Utils.daysAgo(14);
    const lastWeekEnd = Utils.daysAgo(7);
    const lastWeekCO2 = Store.getTotalCO2(lastWeekStart, lastWeekEnd);
    const weekChange = lastWeekCO2 > 0 ? ((weekCO2 - lastWeekCO2) / lastWeekCO2) * 100 : 0;

    const trendInsight = Insights.getTrendInsight();

    container.innerHTML = `
      <div class="view">
        <div class="container">
          <div class="view-header">
            <h1 class="view-title">Dashboard</h1>
            <p class="view-subtitle">Your carbon footprint at a glance</p>
          </div>

          <!-- Trend Insight Banner -->
          <div class="card" style="margin-bottom: var(--space-6); border-left: 4px solid var(--color-${trendInsight.type === 'success' ? 'success' : trendInsight.type === 'warning' ? 'warning' : 'info'});">
            <div class="flex items-center gap-3">
              <span style="font-size: 1.5rem;" aria-hidden="true">${trendInsight.emoji}</span>
              <p class="text-sm" style="margin: 0;">${Utils.sanitize(trendInsight.message)}</p>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="dashboard-grid stagger-children" id="stats-grid">
            <div class="card stat-card">
              <div class="stat-icon" style="background: hsla(152, 60%, 38%, 0.1);" aria-hidden="true">🌿</div>
              <div class="stat-value" id="stat-today">${Utils.formatCO2(todayCO2)}</div>
              <div class="stat-label">Today</div>
            </div>
            <div class="card stat-card">
              <div class="stat-icon" style="background: hsla(210, 80%, 56%, 0.1);" aria-hidden="true">📅</div>
              <div class="stat-value" id="stat-week">${Utils.formatCO2(weekCO2)}</div>
              <div class="stat-label">This Week</div>
              ${lastWeekCO2 > 0 ? `
                <div class="stat-change ${weekChange <= 0 ? 'positive' : 'negative'}">
                  ${weekChange <= 0 ? '↓' : '↑'} ${Math.abs(Math.round(weekChange))}%
                </div>
              ` : ''}
            </div>
            <div class="card stat-card">
              <div class="stat-icon" style="background: hsla(38, 92%, 50%, 0.1);" aria-hidden="true">📊</div>
              <div class="stat-value" id="stat-month">${Utils.formatCO2(monthCO2)}</div>
              <div class="stat-label">This Month</div>
            </div>
            <div class="card stat-card">
              <div class="stat-icon" style="background: hsla(330, 70%, 56%, 0.1);" aria-hidden="true">🎯</div>
              <div class="stat-value" id="stat-baseline">${(baseline.total / 1000).toFixed(1)}t</div>
              <div class="stat-label">Est. Yearly</div>
              <div class="stat-change ${baseline.total / 1000 <= nationalAvg ? 'positive' : 'negative'}">
                ${baseline.total / 1000 <= nationalAvg ? '↓ Below' : '↑ Above'} avg (${nationalAvg}t)
              </div>
            </div>
          </div>

          <!-- Comparison Row -->
          <div class="comparison-row">
            <div class="comparison-badge">
              <div class="comparison-icon" style="background: hsla(152, 60%, 38%, 0.1);">🌍</div>
              <div>
                <div class="comparison-label">Global Average</div>
                <div class="comparison-value">${Emissions.getNationalAverage('global')}t / year</div>
              </div>
            </div>
            <div class="comparison-badge">
              <div class="comparison-icon" style="background: hsla(38, 92%, 50%, 0.1);">🏳️</div>
              <div>
                <div class="comparison-label">National Average</div>
                <div class="comparison-value">${nationalAvg}t / year</div>
              </div>
            </div>
            <div class="comparison-badge">
              <div class="comparison-icon" style="background: hsla(145, 65%, 42%, 0.1);">🎯</div>
              <div>
                <div class="comparison-label">Paris Target</div>
                <div class="comparison-value">${Emissions.PARIS_TARGET}t / year</div>
              </div>
            </div>
          </div>

          <!-- Charts -->
          <div class="dashboard-charts">
            <div class="chart-container">
              <div class="chart-header">
                <h2 class="chart-title">Category Breakdown</h2>
                <span class="badge badge-neutral">This Month</span>
              </div>
              <div style="display: flex; justify-content: center;">
                <canvas id="donut-chart" aria-label="Carbon emissions breakdown by category" role="img"></canvas>
              </div>
              <div class="chart-legend" id="donut-legend"></div>
              <div id="donut-data-table"></div>
            </div>
            <div class="chart-container">
              <div class="chart-header">
                <h2 class="chart-title">7-Day Trend</h2>
                <span class="badge badge-neutral">Daily CO₂</span>
              </div>
              <canvas id="line-chart" aria-label="Carbon emissions trend over the last 7 days" role="img"></canvas>
              <div id="line-data-table"></div>
            </div>
          </div>

          <!-- Quick Log -->
          <div class="card" style="margin-top: var(--space-6);">
            <div class="card-header">
              <h2 class="card-title">Quick Log</h2>
              <a href="#/log" class="btn btn-sm btn-secondary">Full Logger →</a>
            </div>
            <div class="quick-log">
              <button class="quick-log-btn" data-category="transport" data-type="car-petrol" data-quick="true" id="quick-car">
                <span class="ql-icon" aria-hidden="true">🚗</span> Car Trip
              </button>
              <button class="quick-log-btn" data-category="transport" data-type="bike" data-quick="true" id="quick-bike">
                <span class="ql-icon" aria-hidden="true">🚲</span> Bike Ride
              </button>
              <button class="quick-log-btn" data-category="food" data-type="vegan" data-quick="true" id="quick-vegan">
                <span class="ql-icon" aria-hidden="true">🥬</span> Vegan Meal
              </button>
              <button class="quick-log-btn" data-category="food" data-type="mixed" data-quick="true" id="quick-mixed">
                <span class="ql-icon" aria-hidden="true">🍽️</span> Regular Meal
              </button>
              <button class="quick-log-btn" data-category="transport" data-type="bus" data-quick="true" id="quick-bus">
                <span class="ql-icon" aria-hidden="true">🚌</span> Bus Ride
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    renderCharts();
    attachListeners();
  }

  /**
   * Renders the canvas charts.
   */
  function renderCharts() {
    const month = Utils.currentMonthRange();
    const breakdown = Store.getTotalCO2(month.start, month.end, true);

    // Donut chart
    const donutCanvas = document.getElementById('donut-chart');
    if (donutCanvas) {
      const categories = ['transport', 'flight', 'food', 'energy', 'shopping', 'waste'];
      const donutData = categories
        .filter((cat) => (breakdown[cat] || 0) > 0)
        .map((cat) => {
          const meta = Emissions.getCategoryMeta(cat);
          return { label: meta.label, value: breakdown[cat] || 0, color: meta.color };
        });

      const totalMonth = Object.values(breakdown).reduce((s, v) => s + v, 0);

      Charts.drawDonut(donutCanvas, donutData, {
        size: 220,
        lineWidth: 28,
        centerText: Utils.formatCO2(totalMonth),
        centerSubtext: 'this month',
      });

      // Legend
      const legendEl = document.getElementById('donut-legend');
      if (legendEl) {
        legendEl.innerHTML = donutData.map((d) => `
          <div class="legend-item">
            <span class="legend-dot" style="background: ${d.color};"></span>
            <span>${Utils.sanitize(d.label)}: ${Utils.formatCO2(d.value)}</span>
          </div>
        `).join('');
      }

      // Accessibility table
      const tableEl = document.getElementById('donut-data-table');
      if (tableEl) {
        tableEl.innerHTML = Charts.generateDataTable(donutData, 'kg CO₂e');
      }
    }

    // Line chart — last 7 days
    const lineCanvas = document.getElementById('line-chart');
    if (lineCanvas) {
      const lineData = [];
      for (let i = 6; i >= 0; i--) {
        const date = Utils.daysAgo(i);
        const dayCO2 = Store.getTotalCO2(date, date);
        lineData.push({
          label: Utils.formatDate(date, 'short'),
          value: dayCO2,
        });
      }

      Charts.drawLineChart(lineCanvas, lineData, {
        height: 240,
      });

      const lineTableEl = document.getElementById('line-data-table');
      if (lineTableEl) {
        lineTableEl.innerHTML = Charts.generateDataTable(lineData, 'kg CO₂e');
      }
    }
  }

  /**
   * Attaches quick-log button listeners.
   */
  function attachListeners() {
    document.querySelectorAll('.quick-log-btn').forEach((btn) => {
      btn.addEventListener('click', handleQuickLog);
    });
  }

  /**
   * Handles quick-log button clicks.
   */
  function handleQuickLog(e) {
    const btn = e.currentTarget;
    const category = btn.dataset.category;
    const type = btn.dataset.type;

    let value = 1;
    let unit = 'meals';

    if (category === 'transport') {
      const profile = Store.get('profile');
      value = profile.commuteDistance > 0 ? profile.commuteDistance * 2 : 10;
      unit = 'km';
    }

    const co2 = Emissions.calculate(category, type, value);
    const meta = Emissions.getCategoryMeta(category);

    Store.addActivity({
      category,
      type,
      value,
      unit,
      co2,
    });

    Toast.success('Activity logged!', `${meta.icon} ${Utils.formatCO2(co2)} CO₂e added`);

    // Add micro-animation to the button
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => (btn.style.transform = ''), 150);
  }

  /**
   * Unmounts the dashboard view.
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
