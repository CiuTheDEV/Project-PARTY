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
      return onChildAdded(sessionRef, (snapshot) => {
        const data = snapshot.val() as {
          event: string;
          payload: unknown;
          createdAt: number;
        } | null;

        if (!data) return;
        if (data.createdAt < joinTimestamp) return;
        if (data.event !== event) return;

        handler(data.payload);
      });
    },

    destroy() {
      off(sessionRef);
    },
  };
}
