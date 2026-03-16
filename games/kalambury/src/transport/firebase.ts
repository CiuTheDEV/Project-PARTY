import type { KalamburyTransport } from "./types";

// Lazy import — firebase SDK loads only when transport mode is "firebase"
// Credentials from .env.local: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN,
// VITE_FIREBASE_DATABASE_URL, VITE_FIREBASE_PROJECT_ID

type FirebaseApp = import("firebase/app").FirebaseApp;
type DatabaseReference = import("firebase/database").DatabaseReference;

let firebaseApp: FirebaseApp | null = null;

async function getFirebaseApp(): Promise<FirebaseApp> {
  if (firebaseApp) return firebaseApp;

  const { initializeApp, getApps } = await import("firebase/app");

  const existing = getApps().find((app) => app.name === "kalambury");
  if (existing) {
    firebaseApp = existing;
    return firebaseApp;
  }

  firebaseApp = initializeApp(
    {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    },
    "kalambury",
  );

  return firebaseApp;
}

export async function createFirebaseAdapter(
  sessionCode: string,
): Promise<KalamburyTransport> {
  const app = await getFirebaseApp();
  const { getDatabase, ref, push, onChildAdded, off } = await import(
    "firebase/database"
  );

  const db = getDatabase(app);
  const sessionRef: DatabaseReference = ref(
    db,
    `sessions/${sessionCode}/events`,
  );

  // Remember join timestamp — do not replay history
  const joinTimestamp = Date.now();

  // Single shared listener that fans out to per-event handlers
  const handlers = new Map<string, Set<(payload: unknown) => void>>();
  let sharedUnsubscribe: (() => void) | null = null;

  function ensureSharedListener() {
    if (sharedUnsubscribe) return;
    const unsub = onChildAdded(sessionRef, (snapshot) => {
      const data = snapshot.val() as {
        event: string;
        payload: unknown;
        createdAt: number;
      } | null;

      if (!data) return;
      if (data.createdAt < joinTimestamp) return;

      const eventHandlers = handlers.get(data.event);
      if (!eventHandlers) return;

      for (const handler of eventHandlers) {
        handler(data.payload);
      }
    });
    sharedUnsubscribe = unsub;
  }

  return {
    send(event, payload) {
      push(sessionRef, {
        event,
        payload: payload ?? null,
        createdAt: Date.now(),
      }).catch((err: unknown) => {
        console.error("[kalambury/firebase] send error:", err);
      });
    },

    on(event, handler) {
      ensureSharedListener();
      if (!handlers.has(event)) {
        handlers.set(event, new Set());
      }
      handlers.get(event)!.add(handler);
      return () => {
        handlers.get(event)?.delete(handler);
      };
    },

    destroy() {
      handlers.clear();
      if (sharedUnsubscribe) {
        try {
          sharedUnsubscribe();
        } catch (err) {
          console.error("[firebase transport] Failed to unsubscribe:", err);
        }
        sharedUnsubscribe = null;
      }
      try {
        off(sessionRef);
      } catch (err) {
        console.error("[firebase transport] Failed to detach listener:", err);
      }
    },
  };
}
