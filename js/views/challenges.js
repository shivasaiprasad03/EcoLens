/**
 * EcoLens — Challenges & Achievements View
 * Weekly challenges, streak tracking, and achievement badges.
 * @module views/challenges
 */

const ChallengesView = (() => {
  'use strict';

  /**
   * Mounts the challenges view.
   * @param {HTMLElement} container
   */
  function mount(container) {
    render(container);
  }

  /**
   * Renders the challenges view.
   * @param {HTMLElement} container
   */
  function render(container) {
    const challengeState = Store.get('challenges');
    const challenges = Insights.getChallenges();
    const achievements = Insights.getAchievements();
    const earnedCount = achievements.filter((a) => a.earned).length;

    container.innerHTML = `
      <div class="view">
        <div class="container">
          <div class="view-header">
            <h1 class="view-title">Challenges & Achievements</h1>
            <p class="view-subtitle">Take on eco-challenges and earn badges for your efforts</p>
          </div>

          <!-- Streak Card -->
          <div class="streak-card" role="status" aria-label="Current logging streak">
            <div class="streak-number">${challengeState.streak || 0}</div>
            <div class="streak-label">Day Logging Streak 🔥</div>
            <p style="font-size: var(--text-sm); opacity: 0.7; margin-top: var(--space-2);">
              ${challengeState.streak >= 7 
                ? 'Amazing consistency! Keep it up!' 
                : challengeState.streak >= 3 
                  ? 'Great start! Aim for 7 days!' 
                  : 'Log daily to build your streak!'}
            </p>
          </div>

          <!-- Activity Heatmap -->
          <div class="card mb-6">
            <div class="card-header">
              <h2 class="card-title">Activity Calendar</h2>
              <span class="badge badge-neutral">Last 28 days</span>
            </div>
            <div class="heatmap" id="activity-heatmap" role="img" aria-label="Activity heatmap for the last 28 days">
              ${renderHeatmap()}
            </div>
            <div class="flex justify-between mt-4" style="font-size: var(--text-xs); color: var(--color-text-tertiary);">
              <span>Less</span>
              <div class="flex gap-1">
                <div class="heatmap-cell" style="width: 14px; height: 14px;"></div>
                <div class="heatmap-cell level-1" style="width: 14px; height: 14px;"></div>
                <div class="heatmap-cell level-2" style="width: 14px; height: 14px;"></div>
                <div class="heatmap-cell level-3" style="width: 14px; height: 14px;"></div>
                <div class="heatmap-cell level-4" style="width: 14px; height: 14px;"></div>
              </div>
              <span>More</span>
            </div>
          </div>

          <!-- Active Challenges -->
          <h2 class="text-2xl font-bold mb-4">Eco Challenges</h2>
          <div class="challenges-grid mb-8" id="challenges-grid">
            ${challenges.map((challenge) => renderChallengeCard(challenge, challengeState)).join('')}
          </div>

          <!-- Achievement Badges -->
          <h2 class="text-2xl font-bold mb-4">Achievements <span class="badge badge-primary">${earnedCount}/${achievements.length}</span></h2>
          <div class="card">
            <div class="badges-grid" id="badges-grid">
              ${achievements.map((badge) => `
                <div class="achievement-badge ${badge.earned ? 'earned' : 'locked'}" title="${Utils.sanitize(badge.description)}">
                  <div class="badge-icon">${badge.emoji}</div>
                  <div class="badge-name">${Utils.sanitize(badge.name)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    attachListeners();
  }

  /**
   * Renders the 28-day activity heatmap.
   * @returns {string}
   */
  function renderHeatmap() {
    const cells = [];
    for (let i = 27; i >= 0; i--) {
      const date = Utils.daysAgo(i);
      const dayCO2 = Store.getTotalCO2(date, date);
      const activities = Store.getActivities({ startDate: date, endDate: date });

      let level = '';
      if (activities.length > 0) {
        if (activities.length >= 6) level = 'level-4';
        else if (activities.length >= 4) level = 'level-3';
        else if (activities.length >= 2) level = 'level-2';
        else level = 'level-1';
      }

      cells.push(`
        <div class="heatmap-cell ${level}" 
             title="${Utils.formatDate(date, 'short')}: ${activities.length} activities, ${Utils.formatCO2(dayCO2)}"
             aria-label="${Utils.formatDate(date, 'short')}: ${activities.length} activities">
        </div>
      `);
    }
    return cells.join('');
  }

  /**
   * Renders a challenge card.
   * @param {Object} challenge
   * @param {Object} challengeState
   * @returns {string}
   */
  function renderChallengeCard(challenge, challengeState) {
    const isActive = challenge.isActive;
    const isCompleted = challenge.isCompleted;
    const meta = Emissions.getCategoryMeta(challenge.category);

    let statusBadge = '';
    let actionBtn = '';

    if (isCompleted) {
      statusBadge = '<span class="badge badge-success">✅ Completed</span>';
    } else if (isActive) {
      statusBadge = '<span class="badge badge-primary">🟢 Active</span>';
      actionBtn = `<button class="btn btn-sm btn-danger mt-2" data-complete-challenge="${challenge.id}" id="complete-${challenge.id}">Mark Complete</button>`;
    } else {
      actionBtn = `<button class="btn btn-sm btn-primary mt-2" data-start-challenge="${challenge.id}" id="start-${challenge.id}" ${challengeState.active ? 'disabled' : ''}>
        ${challengeState.active ? 'Finish current first' : 'Start Challenge'}
      </button>`;
    }

    return `
      <div class="challenge-card ${isActive ? 'active-challenge' : ''} ${isCompleted ? 'completed-challenge' : ''}">
        <div class="flex justify-between items-start">
          <div class="challenge-emoji" aria-hidden="true">${challenge.emoji}</div>
          ${statusBadge}
        </div>
        <h3 class="challenge-title">${Utils.sanitize(challenge.title)}</h3>
        <p class="challenge-desc">${Utils.sanitize(challenge.description)}</p>
        <div class="flex items-center gap-3 flex-wrap">
          <span class="badge badge-neutral">${challenge.durationDays} days</span>
          <span class="badge badge-neutral">${meta.icon} ${meta.label}</span>
          <span class="badge badge-success">Save ~${Utils.formatCO2(challenge.savingsKg)}</span>
        </div>
        ${actionBtn}
      </div>
    `;
  }

  /**
   * Attaches event listeners.
   */
  function attachListeners() {
    // Start challenge
    document.querySelectorAll('[data-start-challenge]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const challengeId = btn.dataset.startChallenge;
        Store.update('challenges', { active: challengeId });
        Toast.success('Challenge started!', 'Good luck! Track your progress daily.');
        render(document.querySelector('.app-main'));
      });
    });

    // Complete challenge
    document.querySelectorAll('[data-complete-challenge]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const challengeId = btn.dataset.completeChallenge;
        const challenges = Store.get('challenges');
        const completed = challenges.completed || [];
        completed.push({ id: challengeId, completedDate: Utils.today() });
        Store.update('challenges', { active: null, completed });
        Toast.success('🎉 Challenge completed!', 'You\'ve earned a badge!');
        render(document.querySelector('.app-main'));
      });
    });
  }

  /**
   * Unmounts the challenges view.
   */
  function unmount() {}

  return Object.freeze({
    mount,
    unmount,
  });
})();
