// ──────────────────────────────────────────────
// Tajniacy – DEV stats (request counter)
// Only active in development builds.
// ──────────────────────────────────────────────

export type DevStats = {
  messagesSent: number;
  messagesReceived: number;
  syncRetries: number;
  reannounces: number;
};

let stats: DevStats = {
  messagesSent: 0,
  messagesReceived: 0,
  syncRetries: 0,
  reannounces: 0,
};

const listeners = new Set<() => void>();

export function devTrack(key: keyof DevStats) {
  if (import.meta.env.PROD) return;
  stats = { ...stats, [key]: stats[key] + 1 };
  for (const l of listeners) l();
}

export function getDevStats(): DevStats {
  return stats;
}

export function resetDevStats() {
  stats = { messagesSent: 0, messagesReceived: 0, syncRetries: 0, reannounces: 0 };
  for (const l of listeners) l();
}

export function subscribeDevStats(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
