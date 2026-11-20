// Main Application Coordinator
const App = {
  currentUser: null,
  isRegisterMode: false,

  async init() {
    this.bindNavigation();
    this.bindAuthModal();

    // Check existing login
    this.currentUser = await API.getMe();
    this.updateAuthUI();

    // Initialize subsystems
    CameraController.init();
    TimerController.init();

    // Fetch initial stats
    this.refreshStats();
  },

  bindNavigation() {
    const navFocus = document.getElementById('navFocus');
    const navDashboard = document.getElementById('navDashboard');
    const focusTab = document.getElementById('focusTab');
    const dashboardTab = document.getElementById('dashboardTab');

    navFocus.addEventListener('click', () => {
      navFocus.classList.add('active');
      navDashboard.classList.remove('active');
      focusTab.classList.add('active');
      dashboardTab.classList.remove('active');
    });

    navDashboard.addEventListener('click', () => {
      navDashboard.classList.add('active');
      navFocus.classList.remove('active');
      dashboardTab.classList.add('active');
      focusTab.classList.remove('active');
      this.refreshStats();
    });
  },

  bindAuthModal() {
    const modal = document.getElementById('authModal');
    const btnOpen = document.getElementById('btnOpenAuth');
    const btnClose = document.getElementById('btnCloseAuth');
    const btnToggleMode = document.getElementById('btnToggleAuthMode');
    const form = document.getElementById('authForm');
    const btnLogout = document.getElementById('btnLogout');

    if (btnOpen) {
      btnOpen.addEventListener('click', () => modal.classList.add('active'));
    }
    if (btnClose) {
      btnClose.addEventListener('click', () => modal.classList.remove('active'));
    }
    if (btnToggleMode) {
      btnToggleMode.addEventListener('click', (e) => {
        e.preventDefault();
        this.isRegisterMode = !this.isRegisterMode;
        document.getElementById('authModalTitle').textContent = this.isRegisterMode ? 'Create Account' : 'Sign In';
        document.getElementById('btnSubmitAuth').textContent = this.isRegisterMode ? 'Create Account' : 'Sign In';
        document.getElementById('authToggleText').textContent = this.isRegisterMode ? 'Already have an account?' : "Don't have an account?";
        btnToggleMode.textContent = this.isRegisterMode ? 'Sign In' : 'Create Account';
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;

        try {
          if (this.isRegisterMode) {
            await API.register(email, password);
          } else {
            await API.login(email, password);
          }
          this.currentUser = await API.getMe();
          this.updateAuthUI();
          modal.classList.remove('active');
          form.reset();
          this.refreshStats();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        API.setToken(null);
        this.currentUser = null;
        this.updateAuthUI();
        this.refreshStats();
      });
    }
  },

  updateAuthUI() {
    const userBadge = document.getElementById('userBadge');
    const btnOpen = document.getElementById('btnOpenAuth');
    const emailEl = document.getElementById('userEmail');
    const streakEl = document.getElementById('streakBadge');

    if (this.currentUser) {
      if (userBadge) userBadge.style.display = 'flex';
      if (btnOpen) btnOpen.style.display = 'none';
      if (emailEl) emailEl.textContent = this.currentUser.email;
      if (streakEl) streakEl.textContent = `🔥 ${this.currentUser.current_streak}d`;
    } else {
      if (userBadge) userBadge.style.display = 'none';
      if (btnOpen) btnOpen.style.display = 'inline-flex';
    }
  },

  async refreshStats() {
    try {
      const stats = await API.getStats();

      // Update stat cards
      const streakEl = document.getElementById('statStreak');
      const focusHoursEl = document.getElementById('statFocusHours');
      const completionRateEl = document.getElementById('statCompletionRate');
      const totalSessionsEl = document.getElementById('statTotalSessions');

      if (streakEl) streakEl.textContent = `${stats.current_streak} Days`;
      if (focusHoursEl) focusHoursEl.textContent = `${stats.total_focus_hours} Hrs`;
      if (completionRateEl) completionRateEl.textContent = `${stats.completion_rate_percentage}%`;
      if (totalSessionsEl) totalSessionsEl.textContent = `${stats.total_sessions}`;

      // Update header streak pill if user logged in
      const navStreak = document.getElementById('streakBadge');
      if (navStreak && this.currentUser) {
        navStreak.textContent = `🔥 ${stats.current_streak}d`;
      }

      // Render Session Audit Log Table
      const tbody = document.getElementById('sessionHistoryBody');
      if (tbody) {
        if (!stats.recent_sessions || stats.recent_sessions.length === 0) {
          tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No recorded sessions yet. Start a focus period to log data.</td></tr>`;
        } else {
          tbody.innerHTML = stats.recent_sessions.map(s => {
            const dateStr = new Date(s.created_at).toLocaleString();
            const badgeClass = s.status === 'Completed' ? 'badge-completed' : 'badge-failed';
            return `
              <tr>
                <td>${dateStr}</td>
                <td>${s.target_duration} mins</td>
                <td><span class="badge ${badgeClass}">${s.status}</span></td>
                <td>${s.status === 'Completed' ? '+ Focus Logged' : 'Breach Recorded'}</td>
              </tr>
            `;
          }).join('');
        }
      }
    } catch (err) {
      console.warn('Could not refresh stats:', err);
    }
  }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
