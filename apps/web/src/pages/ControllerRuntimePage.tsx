import { Page } from "@project-party/ui";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { fetchSessionViaApi } from "../api/platform";
import { getGameDefinition } from "../lib/gameRegistry";
import { mountGameRuntime } from "../runtime/mountRuntime";
import { createBrowserRuntimeStorage } from "../runtime/storage";

export function ControllerRuntimePage() {
  const location = useLocation() as {
    state?: {
      playerId?: string;
      playerName?: string;
    };
  };
  const { gameId = "", sessionCode = "" } = useParams();
  const gameDefinition = getGameDefinition(gameId);
  const [runtimeNode, setRuntimeNode] = useState<ReactNode>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const runtimeHandleRef = useRef<{
    destroy?: () => Promise<void> | void;
  } | null>(null);
  const playerState = location.state;
  const runtimeStorage = useState(() => createBrowserRuntimeStorage(gameId))[0];

  useEffect(() => {
    if (!gameDefinition || !sessionCode) {
      return;
    }

    let isCancelled = false;

    async function startRuntime() {
      try {
        const session = await fetchSessionViaApi(sessionCode);

        if (isCancelled) {
          return;
        }

        const runtime = mountGameRuntime({
          definition: gameDefinition,
          session: {
            sessionId: session.sessionId,
            sessionCode: session.sessionCode,
            gameId: session.gameId,
            config: session.config,
          },
          role: "controller",
          device: "phone",
          players: playerState?.playerName
            ? [
                {
                  id: playerState.playerId ?? "controller-player",
                  name: playerState.playerName,
                  role: "controller",
                  isConnected: true,
                },
              ]
            : [],
          storage: runtimeStorage,
          mount: (node) => setRuntimeNode(node as ReactNode),
          unmount: () => setRuntimeNode(null),
        });

        runtimeHandleRef.current = runtime;
        await runtime.start();

        if (isCancelled) {
          void runtime.destroy?.();
          if (runtimeHandleRef.current === runtime) {
            runtimeHandleRef.current = null;
          }
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Nie udalo sie uruchomic kontrollera.",
          );
        }
      }
    }

    void startRuntime();

    return () => {
      isCancelled = true;
      const runtime = runtimeHandleRef.current;
      if (runtime) {
        void runtime.destroy?.();
        if (runtimeHandleRef.current === runtime) {
          runtimeHandleRef.current = null;
        }
      }
    };
  }, [
    gameDefinition,
    playerState?.playerId,
    playerState?.playerName,
    runtimeStorage,
    sessionCode,
  ]);

  if (!gameDefinition) {
    return (
      <Page>
        <h1 style={{ color: "#f7f8fa" }}>Brak modulu gry</h1>
        <Link to="/" style={linkStyle}>
          Wroc do lobby
        </Link>
      </Page>
    );
  }

  if (errorMessage) {
    return (
      <Page>
        <main style={statusShellStyle}>
          <section style={statusCardStyle}>
            <p style={eyebrowStyle}>Kalambury</p>
            <h1 style={headingStyle}>
              Nie udalo sie uruchomic telefonu prezentera
            </h1>
            <p style={copyStyle}>{errorMessage}</p>
            <div style={statusActionsStyle}>
              <Link to="/join" style={linkStyle}>
                Wroc do dolaczania
              </Link>
            </div>
          </section>
        </main>
      </Page>
    );
  }

  if (!runtimeNode) {
    return (
      <Page>
        <main style={statusShellStyle}>
          <section style={statusCardStyle}>
            <p style={eyebrowStyle}>Kalambury</p>
            <h1 style={headingStyle}>Uruchamianie telefonu prezentera</h1>
            <p style={copyStyle}>
              Przygotowujemy prywatny ekran prezentera dla tej sesji.
            </p>
          </section>
        </main>
      </Page>
    );
  }

  return <>{runtimeNode}</>;
}

const linkStyle = {
  color: "#f7f8fa",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 999,
  padding: "12px 18px",
  display: "inline-flex",
} as const;

const statusShellStyle = {
  minHeight: "100dvh",
  display: "grid",
  placeItems: "center",
  padding: "32px 20px",
} as const;

const statusCardStyle = {
  width: "min(100%, 540px)",
  display: "grid",
  gap: 18,
  padding: "28px 24px",
  borderRadius: 32,
  border: "1px solid rgba(255,255,255,0.08)",
  background:
    "linear-gradient(180deg, rgba(15, 17, 25, 0.96), rgba(8, 9, 15, 0.96))",
  boxShadow: "0 24px 80px rgba(0,0,0,0.38)",
  backdropFilter: "blur(24px)",
  color: "#f7f8fa",
} as const;

const eyebrowStyle = {
  margin: 0,
  color: "#a1a1aa",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  fontSize: 12,
  fontWeight: 700,
} as const;

const headingStyle = {
  margin: 0,
  fontSize: "clamp(2.2rem, 7vw, 3.2rem)",
  lineHeight: 0.96,
  letterSpacing: "-0.05em",
} as const;

const copyStyle = {
  margin: 0,
  color: "#cbd5e1",
  lineHeight: 1.65,
} as const;

const statusActionsStyle = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
} as const;
