// API Client and Storage Helper
const API = {
  baseUrl: '/api',

  getToken() {
    return localStorage.getItem('larp_auth_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('larp_auth_token', token);
    } else {
      localStorage.removeItem('larp_auth_token');
    }
  },

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async register(email, password) {
    const res = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    const data = await res.json();
    this.setToken(data.access_token);
    return data;
  },

  async login(email, password) {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    this.setToken(data.access_token);
    return data;
  },

  async getMe() {
    const token = this.getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${this.baseUrl}/auth/me`, {
        headers: this.getHeaders()
      });
      if (!res.ok) {
        this.setToken(null);
        return null;
      }
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async startSession(targetDurationMinutes) {
    if (!this.getToken()) {
      // Local / guest mode fallback
      const guestSession = {
        id: 'guest-' + Date.now(),
        target_duration: targetDurationMinutes,
        status: 'InProgress',
        created_at: new Date().toISOString()
      };
      return guestSession;
    }

    const res = await fetch(`${this.baseUrl}/sessions/start`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ target_duration: targetDurationMinutes })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to start session');
    }
    return await res.json();
  },

  async finishSession(sessionId, status) {
    if (!this.getToken() || sessionId.startsWith('guest-')) {
      // Update local storage history for guest
      const history = JSON.parse(localStorage.getItem('guest_sessions') || '[]');
      history.unshift({
        id: sessionId,
        target_duration: window.currentSessionDuration || 25,
        status: status,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('guest_sessions', JSON.stringify(history.slice(0, 50)));
      return { id: sessionId, status };
    }

    const res = await fetch(`${this.baseUrl}/sessions/finish`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ session_id: sessionId, status })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to finish session');
    }
    return await res.json();
  },

  async getStats() {
    if (!this.getToken()) {
      // Generate guest stats from local history
      const history = JSON.parse(localStorage.getItem('guest_sessions') || '[]');
      const completed = history.filter(s => s.status === 'Completed');
      const failed = history.filter(s => s.status === 'Failed');
      const totalMinutes = completed.reduce((acc, s) => acc + (s.target_duration || 0), 0);
      const total = completed.length + failed.length;
      return {
        current_streak: completed.length > 0 ? 1 : 0,
        total_focus_minutes: totalMinutes,
        total_focus_hours: +(totalMinutes / 60).toFixed(1),
        total_sessions: total,
        completed_sessions: completed.length,
        failed_sessions: failed.length,
        completion_rate_percentage: total > 0 ? Math.round((completed.length / total) * 100) : 0,
        recent_sessions: history.slice(0, 10)
      };
    }

    const res = await fetch(`${this.baseUrl}/sessions/stats`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  }
};
