// Pomodoro Timer and Strict Tab-Switch Enforcement Engine
const TimerController = {
  currentDurationMinutes: 25,
  remainingSeconds: 25 * 60,
  timerInterval: null,
  isSessionActive: false,
  currentSessionId: null,

  // Grace Period Enforcement
  graceRemainingSeconds: 15,
  graceInterval: null,
  isGracePeriodActive: false,

  // Audio synthesizer for alarms
  audioCtx: null,

  init() {
    this.bindEvents();
    this.updateDisplay();
  },

  bindEvents() {
    // Preset buttons
    document.querySelectorAll('.preset-btn[data-minutes]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (this.isSessionActive) return;
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const mins = parseInt(e.target.getAttribute('data-minutes'), 10);
        this.setDuration(mins);
      });
    });

    // Custom time button
    const btnCustom = document.getElementById('btnCustomTime');
    if (btnCustom) {
      btnCustom.addEventListener('click', () => {
        if (this.isSessionActive) return;
        const input = prompt('Enter focus duration in minutes (e.g. 45):', '45');
        const mins = parseInt(input, 10);
        if (!isNaN(mins) && mins > 0 && mins <= 180) {
          document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
          btnCustom.classList.add('active');
          this.setDuration(mins);
        }
      });
    }

    // Session Start & Abandon buttons
    const btnStart = document.getElementById('btnStartSession');
    const btnAbandon = document.getElementById('btnAbandonSession');

    if (btnStart) {
      btnStart.addEventListener('click', () => this.startSession());
    }
    if (btnAbandon) {
      btnAbandon.addEventListener('click', () => this.abandonSession());
    }

    // STRICT TAB MONITORING: Page Visibility API & Window Focus
    document.addEventListener('visibilitychange', () => {
      if (!this.isSessionActive) return;

      if (document.hidden) {
        // Tab switch detected!
        this.triggerGracePeriod();
      } else {
        // User returned to tab!
        this.cancelGracePeriod();
      }
    });

    window.addEventListener('blur', () => {
      if (!this.isSessionActive) return;
      this.triggerGracePeriod();
    });

    window.addEventListener('focus', () => {
      if (!this.isSessionActive) return;
      this.cancelGracePeriod();
    });
  },

  setDuration(minutes) {
    this.currentDurationMinutes = minutes;
    this.remainingSeconds = minutes * 60;
    window.currentSessionDuration = minutes;
    this.updateDisplay();
  },

  updateDisplay() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    const str = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const display = document.getElementById('timerDisplay');
    if (display) display.textContent = str;
    if (this.isSessionActive) {
      document.title = `[${str}] LARPING Surveillance Active`;
    } else {
      document.title = `LARPING APP - Focus`;
    }
  },

  async startSession() {
    try {
      const session = await API.startSession(this.currentDurationMinutes);
      this.currentSessionId = session.id;
      this.isSessionActive = true;
      this.remainingSeconds = this.currentDurationMinutes * 60;

      // Update UI
      document.getElementById('btnStartSession').style.display = 'none';
      document.getElementById('btnAbandonSession').style.display = 'inline-flex';
      document.querySelectorAll('.preset-btn').forEach(b => b.disabled = true);

      const statusElem = document.getElementById('sessionStatus');
      if (statusElem) {
        statusElem.textContent = 'SURVEILLANCE ACTIVE // MAINTAIN VISUAL FOCUS';
        statusElem.style.color = 'var(--accent-red)';
      }

      // Interval countdown
      this.timerInterval = setInterval(() => {
        if (this.remainingSeconds > 0) {
          this.remainingSeconds--;
          this.updateDisplay();
        } else {
          this.completeSession();
        }
      }, 1000);

    } catch (err) {
      alert('Error starting session: ' + err.message);
    }
  },

  async completeSession() {
    clearInterval(this.timerInterval);
    this.isSessionActive = false;
    this.playTone(880, 0.4); // Success tone

    const statusElem = document.getElementById('sessionStatus');
    if (statusElem) {
      statusElem.textContent = 'SESSION COMPLETED // EXCELLENT DISCIPLINE';
      statusElem.style.color = 'var(--accent-green)';
    }

    try {
      if (this.currentSessionId) {
        await API.finishSession(this.currentSessionId, 'Completed');
      }
      if (window.App && window.App.refreshStats) {
        window.App.refreshStats();
      }
    } catch (err) {
      console.error('Error logging completion:', err);
    }

    this.resetControls();
    alert('🎉 Focus session completed successfully! Streak maintained.');
  },

  async abandonSession() {
    if (!confirm('Are you sure you want to abandon this session? It will be logged as Failed.')) {
      return;
    }
    await this.failSession('User voluntarily abandoned session.');
  },

  triggerGracePeriod() {
    if (!this.isSessionActive || this.isGracePeriodActive) return;

    this.isGracePeriodActive = true;
    this.graceRemainingSeconds = 15;

    // Show warning banner
    const overlay = document.getElementById('warningOverlay');
    const countdownEl = document.getElementById('graceCountdown');
    if (overlay) overlay.style.display = 'flex';
    if (countdownEl) countdownEl.textContent = '15';

    this.playWarningBuzzer();

    this.graceInterval = setInterval(() => {
      this.graceRemainingSeconds--;
      if (countdownEl) countdownEl.textContent = this.graceRemainingSeconds;

      this.playWarningBuzzer();

      if (this.graceRemainingSeconds <= 0) {
        clearInterval(this.graceInterval);
        this.failSession('Tab switch grace period expired (15 seconds elapsed).');
      }
    }, 1000);
  },

  cancelGracePeriod() {
    if (!this.isGracePeriodActive) return;
    this.isGracePeriodActive = false;
    clearInterval(this.graceInterval);

    const overlay = document.getElementById('warningOverlay');
    if (overlay) overlay.style.display = 'none';
  },

  async failSession(reason) {
    clearInterval(this.timerInterval);
    clearInterval(this.graceInterval);
    this.isSessionActive = false;
    this.isGracePeriodActive = false;

    const overlay = document.getElementById('warningOverlay');
    if (overlay) overlay.style.display = 'none';

    const statusElem = document.getElementById('sessionStatus');
    if (statusElem) {
      statusElem.textContent = 'SESSION FAILED // SURVEILLANCE COMPROMISED';
      statusElem.style.color = 'var(--accent-red)';
    }

    try {
      if (this.currentSessionId) {
        await API.finishSession(this.currentSessionId, 'Failed');
      }
      if (window.App && window.App.refreshStats) {
        window.App.refreshStats();
      }
    } catch (err) {
      console.error('Error logging failure:', err);
    }

    this.resetControls();
    alert(`❌ SESSION FAILED\nReason: ${reason}\nStay committed on your next attempt!`);
  },

  resetControls() {
    document.getElementById('btnStartSession').style.display = 'inline-flex';
    document.getElementById('btnAbandonSession').style.display = 'none';
    document.querySelectorAll('.preset-btn').forEach(b => b.disabled = false);
    this.remainingSeconds = this.currentDurationMinutes * 60;
    this.updateDisplay();
  },

  playTone(freq, duration) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  },

  playWarningBuzzer() {
    this.playTone(400, 0.15);
  }
};
