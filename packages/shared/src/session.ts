export function normalizeSessionCode(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function createSessionCode(random: () => number = Math.random): string {
  return random().toString(36).slice(2, 8).toUpperCase();
}
