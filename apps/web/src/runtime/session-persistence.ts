type ReusableRuntimeStorage = {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, value: T) => void;
  remove: (key: string) => void;
};

export type ReusableRuntimeSession = {
  sessionId: string;
  sessionCode: string;
  gameId: string;
};

const REUSABLE_RUNTIME_SESSION_KEY = "reusable-session";

function isReusableRuntimeSession(
  value: unknown,
): value is ReusableRuntimeSession {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ReusableRuntimeSession).sessionId === "string" &&
    typeof (value as ReusableRuntimeSession).sessionCode === "string" &&
    typeof (value as ReusableRuntimeSession).gameId === "string"
  );
}

export function getReusableRuntimeSession(
  storage: ReusableRuntimeStorage,
): ReusableRuntimeSession | null {
  const session = storage.get<unknown>(REUSABLE_RUNTIME_SESSION_KEY);
  return isReusableRuntimeSession(session) ? session : null;
}

export function saveReusableRuntimeSession(
  storage: ReusableRuntimeStorage,
  session: ReusableRuntimeSession,
): void {
  storage.set(REUSABLE_RUNTIME_SESSION_KEY, session);
}

export function clearReusableRuntimeSession(
  storage: ReusableRuntimeStorage,
): void {
  storage.remove(REUSABLE_RUNTIME_SESSION_KEY);
}
