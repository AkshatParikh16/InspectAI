// InspectAI API client — all calls go to /api/* on the same origin (FastAPI)
window.API = {
  async getRuns() {
    const r = await fetch('/api/runs');
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
  },

  async getRun(id) {
    const r = await fetch(`/api/runs/${id}`);
    if (!r.ok) return null;
    return r.json();
  },

  async startRun(config) {
    const r = await fetch('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(text || `${r.status} ${r.statusText}`);
    }
    return r.json();
  },

  async deleteRun(id) {
    await fetch(`/api/runs/${id}`, { method: 'DELETE' });
  },

  // Poll a run until it reaches terminal status (completed / failed).
  // Calls onUpdate(run) each tick. Returns the final run object.
  poll(id, onUpdate, intervalMs = 2500) {
    return new Promise((resolve) => {
      const tick = async () => {
        const run = await this.getRun(id).catch(() => null);
        if (!run) return;
        onUpdate(run);
        if (run.status === 'completed' || run.status === 'failed') {
          resolve(run);
        } else {
          setTimeout(tick, intervalMs);
        }
      };
      tick();
    });
  },
};
