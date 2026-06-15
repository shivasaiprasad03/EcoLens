/**
 * EcoLens — Onboarding Wizard View
 * Multi-step wizard to collect user profile data and estimate baseline.
 * @module views/onboarding
 */

const OnboardingView = (() => {
  'use strict';

  let currentStep = 0;

  const STEPS = [
    {
      icon: '🌍',
      title: 'Welcome to EcoLens',
      description: 'Understand, track, and reduce your carbon footprint through simple actions and personalized insights. Let\'s set up your profile in under 2 minutes.',
      field: null,
    },
    {
      icon: '🏠',
      title: 'About Your Household',
      description: 'Tell us about your living situation so we can estimate your baseline.',
      field: 'household',
    },
    {
      icon: '🍽️',
      title: 'Your Diet',
      description: 'Food choices have a big impact on your carbon footprint. What best describes your typical diet?',
      field: 'diet',
    },
    {
      icon: '🚗',
      title: 'Your Commute',
      description: 'How do you typically get to work or school?',
      field: 'commute',
    },
    {
      icon: '⚡',
      title: 'Home Energy',
      description: 'What is your primary energy source at home?',
      field: 'energy',
    },
    {
      icon: '📊',
      title: 'Your Carbon Baseline',
      description: 'Based on your answers, here\'s your estimated annual carbon footprint.',
      field: 'summary',
    },
  ];

  /**
   * Mounts the onboarding view.
   * @param {HTMLElement} container
   */
  function mount(container) {
    currentStep = 0;
    container.innerHTML = `
      <div class="onboarding" id="onboarding-view">
        <div class="onboarding-container">
          <div class="onboarding-progress" id="onboarding-progress" role="progressbar" aria-valuenow="1" aria-valuemin="1" aria-valuemax="${STEPS.length}">
            ${renderProgressDots()}
          </div>
          <div id="onboarding-card-wrapper">
            ${renderStep(0)}
          </div>
        </div>
      </div>
    `;

    attachStepListeners();
  }

  /**
   * Renders the progress dots.
   * @returns {string}
   */
  function renderProgressDots() {
    return STEPS.map((_, i) => {
      if (i === STEPS.length - 1) return `<div class="onboarding-step-dot ${i <= currentStep ? (i < currentStep ? 'completed' : 'active') : ''}" aria-label="Step ${i + 1}"></div>`;
      return `
        <div class="onboarding-step-dot ${i <= currentStep ? (i < currentStep ? 'completed' : 'active') : ''}" aria-label="Step ${i + 1}"></div>
        <div class="onboarding-step-line ${i < currentStep ? 'completed' : ''}"></div>
      `;
    }).join('');
  }

  /**
   * Renders a step's content.
   * @param {number} stepIndex
   * @returns {string}
   */
  function renderStep(stepIndex) {
    const step = STEPS[stepIndex];
    let content = '';

    switch (step.field) {
      case null: // Welcome
        content = renderWelcome();
        break;
      case 'household':
        content = renderHousehold();
        break;
      case 'diet':
        content = renderDiet();
        break;
      case 'commute':
        content = renderCommute();
        break;
      case 'energy':
        content = renderEnergy();
        break;
      case 'summary':
        content = renderSummary();
        break;
    }

    return `
      <div class="onboarding-card" role="region" aria-label="Step ${stepIndex + 1}: ${Utils.sanitize(step.title)}">
        <div class="step-icon" aria-hidden="true">${step.icon}</div>
        <h1 class="step-title">${Utils.sanitize(step.title)}</h1>
        <p class="step-description">${Utils.sanitize(step.description)}</p>
        ${content}
        <div class="onboarding-actions">
          ${stepIndex > 0 ? `<button class="btn btn-secondary" id="onboarding-prev" type="button">← Back</button>` : '<div></div>'}
          ${stepIndex < STEPS.length - 1
            ? `<button class="btn btn-primary" id="onboarding-next" type="button">${stepIndex === 0 ? 'Get Started →' : 'Continue →'}</button>`
            : `<button class="btn btn-primary btn-lg" id="onboarding-finish" type="button">Start Tracking 🌿</button>`
          }
        </div>
      </div>
    `;
  }

  function renderWelcome() {
    return `
      <div class="welcome-features" style="margin-top: var(--space-6); gap: var(--space-4); grid-template-columns: 1fr;">
        <div class="flex items-center gap-4" style="text-align: left; padding: var(--space-3);">
          <span style="font-size: 1.5rem;" aria-hidden="true">📊</span>
          <div>
            <div class="font-semibold">Track Daily Activities</div>
            <div class="text-sm text-secondary">Log transport, food, energy, shopping & waste</div>
          </div>
        </div>
        <div class="flex items-center gap-4" style="text-align: left; padding: var(--space-3);">
          <span style="font-size: 1.5rem;" aria-hidden="true">💡</span>
          <div>
            <div class="font-semibold">Get Personalized Tips</div>
            <div class="text-sm text-secondary">AI-powered insights based on your habits</div>
          </div>
        </div>
        <div class="flex items-center gap-4" style="text-align: left; padding: var(--space-3);">
          <span style="font-size: 1.5rem;" aria-hidden="true">🏆</span>
          <div>
            <div class="font-semibold">Complete Challenges</div>
            <div class="text-sm text-secondary">Fun challenges to reduce your footprint</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderHousehold() {
    const profile = Store.get('profile');
    return `
      <div class="form-group">
        <label class="form-label" for="household-size">How many people live in your household?</label>
        <input type="number" class="form-input" id="household-size" min="1" max="20" value="${profile.householdSize || 1}" aria-describedby="household-hint">
        <span class="form-hint" id="household-hint">This helps us calculate per-person emissions</span>
      </div>
      <div class="form-group">
        <label class="form-label">Home size</label>
        <div class="option-grid" role="radiogroup" aria-label="Home size">
          ${['small', 'medium', 'large'].map((size) => `
            <div class="option-card ${profile.homeSize === size ? 'selected' : ''}" 
                 data-field="homeSize" data-value="${size}" role="radio" 
                 aria-checked="${profile.homeSize === size}" tabindex="0">
              <span class="option-icon" aria-hidden="true">${size === 'small' ? '🏢' : size === 'medium' ? '🏠' : '🏡'}</span>
              <span class="option-label">${size.charAt(0).toUpperCase() + size.slice(1)}</span>
              <span class="option-desc">${size === 'small' ? 'Apartment/Studio' : size === 'medium' ? 'Average Home' : 'Large House'}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="country-select">Country/Region</label>
        <select class="form-select" id="country-select">
          <option value="global" ${profile.country === 'global' ? 'selected' : ''}>Global Average</option>
          <option value="us" ${profile.country === 'us' ? 'selected' : ''}>United States</option>
          <option value="uk" ${profile.country === 'uk' ? 'selected' : ''}>United Kingdom</option>
          <option value="eu" ${profile.country === 'eu' ? 'selected' : ''}>European Union</option>
          <option value="canada" ${profile.country === 'canada' ? 'selected' : ''}>Canada</option>
          <option value="australia" ${profile.country === 'australia' ? 'selected' : ''}>Australia</option>
          <option value="germany" ${profile.country === 'germany' ? 'selected' : ''}>Germany</option>
          <option value="france" ${profile.country === 'france' ? 'selected' : ''}>France</option>
          <option value="japan" ${profile.country === 'japan' ? 'selected' : ''}>Japan</option>
          <option value="china" ${profile.country === 'china' ? 'selected' : ''}>China</option>
          <option value="india" ${profile.country === 'india' ? 'selected' : ''}>India</option>
          <option value="brazil" ${profile.country === 'brazil' ? 'selected' : ''}>Brazil</option>
        </select>
      </div>
    `;
  }

  function renderDiet() {
    const profile = Store.get('profile');
    const diets = [
      { key: 'vegan', icon: '🥬', label: 'Vegan', desc: 'No animal products' },
      { key: 'vegetarian', icon: '🥚', label: 'Vegetarian', desc: 'No meat, but dairy/eggs' },
      { key: 'pescatarian', icon: '🐟', label: 'Pescatarian', desc: 'Fish, no other meat' },
      { key: 'mixed', icon: '🍽️', label: 'Mixed', desc: 'Balanced omnivore' },
      { key: 'high-meat', icon: '🥩', label: 'High Meat', desc: 'Meat with most meals' },
    ];

    return `
      <div class="option-grid" role="radiogroup" aria-label="Diet type">
        ${diets.map((d) => `
          <div class="option-card ${profile.diet === d.key ? 'selected' : ''}"
               data-field="diet" data-value="${d.key}" role="radio"
               aria-checked="${profile.diet === d.key}" tabindex="0">
            <span class="option-icon" aria-hidden="true">${d.icon}</span>
            <span class="option-label">${d.label}</span>
            <span class="option-desc">${d.desc}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderCommute() {
    const profile = Store.get('profile');
    const commutes = [
      { key: 'car-petrol', icon: '🚗', label: 'Car (Petrol)' },
      { key: 'car-diesel', icon: '🚙', label: 'Car (Diesel)' },
      { key: 'car-electric', icon: '⚡', label: 'Car (Electric)' },
      { key: 'bus', icon: '🚌', label: 'Bus' },
      { key: 'train', icon: '🚂', label: 'Train' },
      { key: 'bike', icon: '🚲', label: 'Bicycle' },
      { key: 'walk', icon: '🚶', label: 'Walk' },
      { key: 'remote', icon: '🏠', label: 'Remote/WFH' },
    ];

    return `
      <div class="option-grid" role="radiogroup" aria-label="Commute type" style="grid-template-columns: repeat(2, 1fr);">
        ${commutes.map((c) => `
          <div class="option-card ${profile.commute === c.key ? 'selected' : ''}"
               data-field="commute" data-value="${c.key}" role="radio"
               aria-checked="${profile.commute === c.key}" tabindex="0">
            <span class="option-icon" aria-hidden="true">${c.icon}</span>
            <span class="option-label">${c.label}</span>
          </div>
        `).join('')}
      </div>
      <div class="form-group mt-6" id="commute-distance-group" style="${['bike', 'walk', 'remote'].includes(profile.commute) ? 'display:none' : ''}">
        <label class="form-label" for="commute-distance">One-way commute distance (km)</label>
        <input type="number" class="form-input" id="commute-distance" min="0" max="500" value="${profile.commuteDistance || 0}" step="0.5">
      </div>
    `;
  }

  function renderEnergy() {
    const profile = Store.get('profile');
    const sources = [
      { key: 'grid', icon: '🔌', label: 'Grid Electricity', desc: 'Standard power grid' },
      { key: 'solar', icon: '☀️', label: 'Solar', desc: 'Solar panels at home' },
      { key: 'wind', icon: '💨', label: 'Wind', desc: 'Wind energy provider' },
      { key: 'mixed-renewable', icon: '🌿', label: 'Green Tariff', desc: 'Renewable energy plan' },
    ];

    return `
      <div class="option-grid" role="radiogroup" aria-label="Energy source">
        ${sources.map((s) => `
          <div class="option-card ${profile.energySource === s.key ? 'selected' : ''}"
               data-field="energySource" data-value="${s.key}" role="radio"
               aria-checked="${profile.energySource === s.key}" tabindex="0">
            <span class="option-icon" aria-hidden="true">${s.icon}</span>
            <span class="option-label">${s.label}</span>
            <span class="option-desc">${s.desc}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderSummary() {
    const profile = Store.get('profile');
    const baseline = Emissions.estimateBaseline(profile);
    const nationalAvg = Emissions.getNationalAverage(profile.country);
    const totalTonnes = (baseline.total / 1000).toFixed(1);

    const categories = [
      { key: 'transport', label: 'Transport', icon: '🚗', value: baseline.transport },
      { key: 'food', label: 'Food', icon: '🍽️', value: baseline.food },
      { key: 'energy', label: 'Energy', icon: '⚡', value: baseline.energy },
      { key: 'shopping', label: 'Shopping', icon: '🛍️', value: baseline.shopping },
      { key: 'waste', label: 'Waste', icon: '♻️', value: baseline.waste },
    ];

    return `
      <div style="text-align: center; margin-bottom: var(--space-6);">
        <div class="stat-card" style="padding: var(--space-4);">
          <div class="stat-value" style="font-size: var(--text-5xl); color: ${baseline.total / 1000 > nationalAvg ? 'var(--color-danger)' : 'var(--color-success)'};">
            ${totalTonnes}t
          </div>
          <div class="stat-label">Estimated CO₂e per year</div>
          <div class="stat-change ${baseline.total / 1000 <= nationalAvg ? 'positive' : 'negative'}" style="margin-top: var(--space-3);">
            ${baseline.total / 1000 <= nationalAvg ? '↓ Below' : '↑ Above'} national average of ${nationalAvg}t
          </div>
        </div>
      </div>
      <div style="display: grid; gap: var(--space-2);">
        ${categories.map((c) => `
          <div class="flex items-center justify-between" style="padding: var(--space-2) var(--space-3); background: var(--color-bg-secondary); border-radius: var(--radius-md);">
            <div class="flex items-center gap-2">
              <span aria-hidden="true">${c.icon}</span>
              <span class="text-sm font-medium">${c.label}</span>
            </div>
            <span class="text-sm font-semibold">${Utils.formatCO2(c.value, true)}/yr</span>
          </div>
        `).join('')}
      </div>
      <div style="margin-top: var(--space-4); padding: var(--space-3); background: hsla(152, 60%, 38%, 0.08); border-radius: var(--radius-md);">
        <p class="text-sm text-secondary" style="text-align: center;">
          🎯 Paris Agreement target: <strong>${Emissions.PARIS_TARGET}t per person/year</strong>
        </p>
      </div>
    `;
  }

  /**
   * Attaches event listeners for the current step.
   */
  function attachStepListeners() {
    // Navigation buttons
    const nextBtn = document.getElementById('onboarding-next');
    const prevBtn = document.getElementById('onboarding-prev');
    const finishBtn = document.getElementById('onboarding-finish');

    if (nextBtn) nextBtn.addEventListener('click', nextStep);
    if (prevBtn) prevBtn.addEventListener('click', prevStep);
    if (finishBtn) finishBtn.addEventListener('click', finishOnboarding);

    // Option cards
    document.querySelectorAll('.option-card').forEach((card) => {
      card.addEventListener('click', handleOptionClick);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOptionClick.call(card, e);
        }
      });
    });

    // Save input changes
    const householdInput = document.getElementById('household-size');
    if (householdInput) {
      householdInput.addEventListener('change', () => {
        const val = Utils.validateNumber(householdInput.value, 1, 20);
        if (val.valid) Store.update('profile', { householdSize: val.value });
      });
    }

    const countrySelect = document.getElementById('country-select');
    if (countrySelect) {
      countrySelect.addEventListener('change', () => {
        Store.update('profile', { country: countrySelect.value });
      });
    }

    const distanceInput = document.getElementById('commute-distance');
    if (distanceInput) {
      distanceInput.addEventListener('change', () => {
        const val = Utils.validateNumber(distanceInput.value, 0, 500);
        if (val.valid) Store.update('profile', { commuteDistance: val.value });
      });
    }
  }

  /**
   * Handles option card selection.
   */
  function handleOptionClick(e) {
    const card = e.currentTarget || this;
    const field = card.dataset.field;
    const value = card.dataset.value;

    // Deselect siblings
    const parent = card.parentElement;
    parent.querySelectorAll('.option-card').forEach((c) => {
      c.classList.remove('selected');
      c.setAttribute('aria-checked', 'false');
    });

    // Select this one
    card.classList.add('selected');
    card.setAttribute('aria-checked', 'true');

    // Save to state
    Store.update('profile', { [field]: value });

    // Toggle commute distance visibility
    if (field === 'commute') {
      const distGroup = document.getElementById('commute-distance-group');
      if (distGroup) {
        distGroup.style.display = ['bike', 'walk', 'remote'].includes(value) ? 'none' : '';
      }
    }
  }

  /**
   * Advances to the next step.
   */
  function nextStep() {
    // Validate current step
    if (!validateStep(currentStep)) return;

    currentStep++;
    updateView();
  }

  /**
   * Goes back to the previous step.
   */
  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      updateView();
    }
  }

  /**
   * Validates the current step's data.
   * @param {number} step
   * @returns {boolean}
   */
  function validateStep(step) {
    const profile = Store.get('profile');
    const stepConfig = STEPS[step];

    switch (stepConfig.field) {
      case 'diet':
        if (!profile.diet) {
          Toast.warning('Please select your diet type');
          return false;
        }
        return true;
      case 'commute':
        if (!profile.commute) {
          Toast.warning('Please select your commute type');
          return false;
        }
        return true;
      case 'energy':
        if (!profile.energySource) {
          Toast.warning('Please select your energy source');
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  /**
   * Updates the view after step change.
   */
  function updateView() {
    const progressEl = document.getElementById('onboarding-progress');
    const cardWrapper = document.getElementById('onboarding-card-wrapper');

    if (progressEl) {
      progressEl.innerHTML = renderProgressDots();
      progressEl.setAttribute('aria-valuenow', String(currentStep + 1));
    }

    if (cardWrapper) {
      cardWrapper.innerHTML = renderStep(currentStep);
    }

    attachStepListeners();
    Utils.announceToScreenReader(`Step ${currentStep + 1} of ${STEPS.length}: ${STEPS[currentStep].title}`);
  }

  /**
   * Completes onboarding and navigates to dashboard.
   */
  function finishOnboarding() {
    Store.update('profile', { completed: true });
    Navbar.refresh();
    Router.navigate('/dashboard');
    Toast.success('Welcome to EcoLens!', 'Your profile is set up. Start logging your daily activities.');
  }

  /**
   * Unmounts the onboarding view.
   */
  function unmount() {
    currentStep = 0;
  }

  return Object.freeze({
    mount,
    unmount,
  });
})();
