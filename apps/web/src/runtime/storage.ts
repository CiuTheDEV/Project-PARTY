type RuntimeStorageAdapter = {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, value: T) => void;
  remove: (key: string) => void;
};

function createMemoryRuntimeStorage(): RuntimeStorageAdapter {
  const store = new Map<string, unknown>();

  return {
    get: <T>(key: string) => (store.get(key) as T | undefined) ?? null,
    set: <T>(key: string, value: T) => {
      store.set(key, value);
    },
    remove: (key: string) => {
      store.delete(key);
    },
  };
}

export function createBrowserRuntimeStorage(
  namespace: string,
): RuntimeStorageAdapter {
  if (typeof localStorage === "undefined") {
    return createMemoryRuntimeStorage();
  }

  const prefix = `project-party.runtime.${namespace}.`;

  return {
    get: <T>(key: string) => {
      const rawValue = localStorage.getItem(`${prefix}${key}`);

      if (!rawValue) {
        return null;
      }

      try {
        return JSON.parse(rawValue) as T;
      } catch {
        return null;
      }
    },
    set: <T>(key: string, value: T) => {
      localStorage.setItem(`${prefix}${key}`, JSON.stringify(value));
    },
    remove: (key: string) => {
      localStorage.removeItem(`${prefix}${key}`);
    },
  };
}
