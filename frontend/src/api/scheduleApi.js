/**
 * Frontend API client communicating exclusively with the Node/Express backend.
 */

const API_BASE_URL = '/api';

export const scheduleApi = {
  async getHealth() {
    const res = await fetch(`${API_BASE_URL}/health`);
    return res.json();
  },

  async getDemoData() {
    const res = await fetch(`${API_BASE_URL}/demo-data`);
    return res.json();
  },

  async getCurrentSchedule() {
    const res = await fetch(`${API_BASE_URL}/schedule/current`);
    return res.json();
  },

  async generateSchedule(cases, operatingRooms) {
    const res = await fetch(`${API_BASE_URL}/schedule/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cases, operatingRooms }),
    });
    return res.json();
  },

  async simulateRecovery(emergencyInput) {
    const res = await fetch(`${API_BASE_URL}/recovery/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emergencyInput),
    });
    return res.json();
  },

  async applyRecovery(plan) {
    const res = await fetch(`${API_BASE_URL}/recovery/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    return res.json();
  },

  async resetSchedule() {
    const res = await fetch(`${API_BASE_URL}/schedule/reset`, {
      method: 'POST',
    });
    return res.json();
  },
};
