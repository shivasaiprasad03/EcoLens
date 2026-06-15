/**
 * EcoLens — Settings View
 * Profile editing, theme toggle, data export/import, and accessibility settings.
 * @module views/settings
 */

const SettingsView = (() => {
  'use strict';

  /**
   * Mounts the settings view.
   * @param {HTMLElement} container
   */
  function mount(container) {
    render(container);
  }

  /**
   * Renders the settings view.
   * @param {HTMLElement} container
   */
  function render(container) {
    const profile = Store.get('profile');
    const prefs = Store.get('preferences');
    const activities = Store.get('activities') || [];

    const totalActivities = activities.length;
    const totalCO2 = activities.reduce((sum, a) => sum + (a.co2 || 0), 0);
    const firstLogDate = activities.length > 0 ? activities.sort((a, b) => a.timestamp - b.timestamp)[0].date : null;

    container.innerHTML = `
      <div class="view">
        <div class="container">
          <div class="view-header">
            <h1 class="view-title">Settings</h1>
            <p class="view-subtitle">Manage your profile, preferences, and data</p>
          </div>

          <div class="settings-sections">
            <!-- Profile Section -->
            <section class="settings-section" aria-labelledby="settings-profile-title">
              <h2 class="settings-section-title" id="settings-profile-title">📋 Profile Summary</h2>
              <div class="settings-row">
                <div class="settings-row-info">
                  <div class="settings-row-label">Household Size</div>
                  <div class="settings-row-desc">${profile.householdSize} ${profile.householdSize === 1 ? 'person' : 'people'}</div>
                </div>
                <span class="badge badge-neutral">${profile.homeSize || 'medium'}</span>
              </div>
              <div class="settings-row">
                <div class="settings-row-info">
                  <div class="settings-row-label">Diet</div>
                  <div class="settings-row-desc">${Utils.sanitize(profile.diet || 'Not set')}</div>
                </div>
              </div>
              <div class="settings-row">
                <div class="settings-row-info">
                  <div class="settings-row-label">Commute</div>
                  <div class="settings-row-desc">${Utils.sanitize(profile.commute || 'Not set')} ${profile.commuteDistance ? `(${profile.commuteDistance} km)` : ''}</div>
                </div>
              </div>
              <div class="settings-row">
                <div class="settings-row-info">
                  <div class="settings-row-label">Energy Source</div>
                  <div class="settings-row-desc">${Utils.sanitize(profile.energySource || 'Not set')}</div>
                </div>
              </div>
              <div class="settings-row">
                <div class="settings-row-info">
                  <div class="settings-row-label">Region</div>
                  <div class="settings-row-desc">${Utils.sanitize(profile.country || 'global')}</div>
                </div>
              </div>
              <button class="btn btn-secondary mt-4" id="edit-profile-btn">Edit Profile</button>
            </section>

            <!-- Statistics Section -->
            <section class="settings-section" aria-labelledby="settings-stats-title">
              <h2 class="settings-section-title" id="settings-stats-title">📊 Statistics</h2>
              <div class="settings-row">
                <div class="settings-row-info">
                  <div class="settings-row-label">Total Activities Logged</div>
                </div>
                <span class="font-semibold">${totalActivities}</span>
              </div>
              <div class="settings-row">
                <div class="settings-row-info">
                  <div class="settings-row-label">Total CO₂e Tracked</div>
                </div>
                <span class="font-semibold">${Utils.formatCO2(totalCO2, true)}</span>
              </div>
              <div class="settings-row">
                <div class="settings-row-info">
                  <div class="settings-row-label">Tracking Since</div>
                </div>
                <span class="font-semibold">${firstLogDate ? Utils.formatDate(firstLogDate, 'long') : 'N/A'}</span>
              </div>
            </section>

            <!-- Appearance Section -->
            <section class="settings-section" aria-labelledby="settings-appearance-title">
              <h2 class="settings-section-title" id="settings-appearance-title">🎨 Appearance</h2>
              <div class="settings-row">
                <div class="settings-row-info">
                  <div class="settings-row-label">Theme</div>
                  <div class="settings-row-desc">Choose between light, dark, or system preference</div>
                </div>
                <select class="form-select" id="theme-select" style="width: auto; min-width: 120px;">
                  <option value="auto" ${prefs.theme === 'auto' ? 'selected' : ''}>Auto</option>
                  <option value="light" ${prefs.theme === 'light' ? 'selected' : ''}>Light</option>
                  <option value="dark" ${prefs.theme === 'dark' ? 'selected' : ''}>Dark</option>
                </select>
              </div>
              <div class="settings-row">
                <div class="settings-row-info">
                  <div class="settings-row-label">Reduced Motion</div>
                  <div class="settings-row-desc">Minimize animations for accessibility</div>
                </div>
                <label class="toggle">
                  <input type="checkbox" id="reduced-motion-toggle" ${prefs.reducedMotion ? 'checked' : ''} aria-label="Toggle reduced motion">
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="settings-row">
                <div class="settings-row-info">
                  <div class="settings-row-label">Font Size</div>
                  <div class="settings-row-desc">Increase text size for readability</div>
                </div>
                <select class="form-select" id="font-size-select" style="width: auto; min-width: 120px;">
                  <option value="normal" ${prefs.fontSize === 'normal' ? 'selected' : ''}>Normal</option>
                  <option value="large" ${prefs.fontSize === 'large' ? 'selected' : ''}>Large</option>
                </select>
              </div>
            </section>

            <!-- Data Management Section -->
            <section class="settings-section" aria-labelledby="settings-data-title">
              <h2 class="settings-section-title" id="settings-data-title">💾 Data Management</h2>
              <p class="text-sm text-secondary mb-4">
                Your data is stored locally on this device and never sent to any server.
              </p>
              <div class="flex gap-3 flex-wrap">
                <button class="btn btn-secondary" id="export-data-btn">
                  📥 Export Data (JSON)
                </button>
                <button class="btn btn-secondary" id="import-data-btn">
                  📤 Import Data
                </button>
                <input type="file" id="import-file-input" accept=".json" style="display: none;">
              </div>
            </section>

            <!-- Danger Zone -->
            <section class="settings-section" style="border-color: var(--color-danger);" aria-labelledby="settings-danger-title">
              <h2 class="settings-section-title" id="settings-danger-title" style="color: var(--color-danger);">⚠️ Danger Zone</h2>
              <div class="settings-row">
                <div class="settings-row-info">
                  <div class="settings-row-label">Clear All Activities</div>
                  <div class="settings-row-desc">Remove all logged activities. Profile will be kept.</div>
                </div>
                <button class="btn btn-sm btn-danger" id="clear-activities-btn">Clear Activities</button>
              </div>
              <div class="settings-row">
                <div class="settings-row-info">
                  <div class="settings-row-label">Reset Everything</div>
                  <div class="settings-row-desc">Delete all data and start fresh. This cannot be undone.</div>
                </div>
                <button class="btn btn-sm btn-danger" id="reset-all-btn">Reset All Data</button>
              </div>
            </section>

            <!-- About Section -->
            <section class="settings-section" aria-labelledby="settings-about-title">
              <h2 class="settings-section-title" id="settings-about-title">ℹ️ About EcoLens</h2>
              <p class="text-sm text-secondary" style="line-height: var(--leading-relaxed);">
                EcoLens helps you understand, track, and reduce your personal carbon footprint. 
                Emission factors are sourced from EPA (2023), DEFRA (2023), IPCC AR6, and Our World in Data.
                <br><br>
                <strong>Privacy:</strong> All data is stored locally in your browser. No data is sent to any server.
                <br>
                <strong>Version:</strong> 1.0.0
              </p>
            </section>
          </div>
        </div>
      </div>
    `;

    attachListeners(container);
  }

  /**
   * Attaches all event listeners.
   * @param {HTMLElement} container
   */
  function attachListeners(container) {
    // Edit Profile
    document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
      Store.update('profile', { completed: false });
      Navbar.refresh();
      Router.navigate('/');
    });

    // Theme select
    document.getElementById('theme-select')?.addEventListener('change', (e) => {
      const theme = e.target.value;
      Store.update('preferences', { theme });
      if (theme === 'auto') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
      Navbar.refresh();
      Toast.info('Theme updated', `Switched to ${theme} mode`);
    });

    // Reduced motion toggle
    document.getElementById('reduced-motion-toggle')?.addEventListener('change', (e) => {
      Store.update('preferences', { reducedMotion: e.target.checked });
      if (e.target.checked) {
        document.documentElement.style.setProperty('--duration-fast', '0ms');
        document.documentElement.style.setProperty('--duration-normal', '0ms');
        document.documentElement.style.setProperty('--duration-slow', '0ms');
      } else {
        document.documentElement.style.removeProperty('--duration-fast');
        document.documentElement.style.removeProperty('--duration-normal');
        document.documentElement.style.removeProperty('--duration-slow');
      }
      Toast.info('Reduced motion ' + (e.target.checked ? 'enabled' : 'disabled'));
    });

    // Font size select
    document.getElementById('font-size-select')?.addEventListener('change', (e) => {
      Store.update('preferences', { fontSize: e.target.value });
      document.documentElement.style.fontSize = e.target.value === 'large' ? '18px' : '16px';
      Toast.info('Font size updated');
    });

    // Export data
    document.getElementById('export-data-btn')?.addEventListener('click', () => {
      const data = Store.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecolens-data-${Utils.today()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Toast.success('Data exported!', 'Your data has been downloaded as JSON');
    });

    // Import data
    const importBtn = document.getElementById('import-data-btn');
    const importInput = document.getElementById('import-file-input');

    importBtn?.addEventListener('click', () => importInput?.click());

    importInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        Toast.error('File too large', 'Maximum file size is 5 MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = Store.importData(event.target.result);
        if (result.success) {
          Toast.success('Data imported!', 'Your data has been restored');
          Navbar.refresh();
          render(container);
        } else {
          Toast.error('Import failed', result.error);
        }
      };
      reader.onerror = () => {
        Toast.error('Import failed', 'Could not read the file');
      };
      reader.readAsText(file);
    });

    // Clear activities
    document.getElementById('clear-activities-btn')?.addEventListener('click', () => {
      Modal.confirm(
        'Clear All Activities',
        'This will delete all your logged activities. Your profile and settings will be kept. This cannot be undone.',
        () => {
          Store.set('activities', []);
          Toast.info('Activities cleared');
          render(container);
        }
      );
    });

    // Reset all
    document.getElementById('reset-all-btn')?.addEventListener('click', () => {
      Modal.confirm(
        'Reset All Data',
        'This will permanently delete ALL your data including profile, activities, challenges, and settings. This cannot be undone.',
        () => {
          Store.resetAll();
          document.documentElement.removeAttribute('data-theme');
          document.documentElement.style.fontSize = '16px';
          Navbar.refresh();
          Router.navigate('/');
          Toast.info('All data has been reset');
        }
      );
    });
  }

  /**
   * Unmounts the settings view.
   */
  function unmount() {}

  return Object.freeze({
    mount,
    unmount,
  });
})();
