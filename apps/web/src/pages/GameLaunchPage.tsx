import { Page } from "@project-party/ui";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import type { SessionCreateResponse } from "@project-party/types";
import { createSessionViaApi, fetchSessionViaApi } from "../api/platform";
import { getGameDefinition } from "../lib/gameRegistry";
import { getCatalogGameById } from "../platform/catalog";
import { mountGameRuntime } from "../runtime/mountRuntime";
import {
  clearReusableRuntimeSession,
  getReusableRuntimeSession,
  saveReusableRuntimeSession,
} from "../runtime/session-persistence";
import { createBrowserRuntimeStorage } from "../runtime/storage";

type GameLaunchPageProps = {
  gameIdOverride?: string;
};

export function GameLaunchPage({ gameIdOverride }: GameLaunchPageProps = {}) {
  const { gameId: routeGameId = "" } = useParams();
  const gameId = gameIdOverride ?? routeGameId;
  const catalogGame = getCatalogGameById(gameId);
  const gameDefinition = getGameDefinition(gameId);
  const isMissingGameModule = !catalogGame || !gameDefinition;

  const defaultConfig = useMemo(() => {
    return Object.fromEntries(
      (gameDefinition?.settings.fields ?? []).map((field) => [
        field.key,
        field.defaultValue ?? "",
      ]),
    );
  }, [gameDefinition]);

  const [session, setSession] = useState<SessionCreateResponse | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [runtimeNode, setRuntimeNode] = useState<ReactNode>(null);
  const runtimeHandleRef = useRef<{
    destroy?: () => Promise<void> | void;
  } | null>(null);
  const runtimeStorage = useMemo(
    () => createBrowserRuntimeStorage(gameId),
    [gameId],
  );

  useEffect(() => {
    if (isMissingGameModule || !catalogGame || !gameDefinition) {
      return;
    }

    const activeCatalogGame = catalogGame;
    const activeGameDefinition = gameDefinition;
    let isCancelled = false;

    setRuntimeNode(null);
    setSession(null);
    setSessionError(null);
    setIsCreatingSession(true);

    async function launchGame() {
      try {
        const persistedSession = getReusableRuntimeSession(runtimeStorage);
        const createdSession =
          persistedSession?.gameId === activeCatalogGame.id
            ? await fetchSessionViaApi(persistedSession.sessionCode).catch(
                () => {
                  clearReusableRuntimeSession(runtimeStorage);
                  return createSessionViaApi({
                    gameId: activeCatalogGame.id,
                    config: defaultConfig,
                  });
                },
              )
            : await createSessionViaApi({
                gameId: activeCatalogGame.id,
                config: defaultConfig,
              });

        if (isCancelled) {
          return;
        }

        setSession(createdSession);
        saveReusableRuntimeSession(runtimeStorage, {
          sessionId: createdSession.sessionId,
          sessionCode: createdSession.sessionCode,
          gameId: activeCatalogGame.id,
        });

        const runtime = mountGameRuntime({
          definition: activeGameDefinition,
          session: {
            sessionId: createdSession.sessionId,
            sessionCode: createdSession.sessionCode,
            gameId: activeCatalogGame.id,
            config: defaultConfig,
          },
          role: "host",
          device: "desktop",
          players: [],
          storage: runtimeStorage,
          mount: (node) => setRuntimeNode(node as ReactNode),
          unmount: () => setRuntimeNode(null),
        });

        runtimeHandleRef.current = runtime;
        await runtime.start();

        if (isCancelled) {
          await runtime.destroy?.();
          if (runtimeHandleRef.current === runtime) {
            runtimeHandleRef.current = null;
          }
        }
      } catch (error) {
        if (!isCancelled) {
          setSessionError(
            error instanceof Error
              ? error.message
              : "Nie udalo sie utworzyc sesji.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsCreatingSession(false);
        }
      }
    }

    void launchGame();

    return () => {
      isCancelled = true;
      const runtime = runtimeHandleRef.current;
      if (runtime) {
        void runtime.destroy?.();
        if (runtimeHandleRef.current === runtime) {
          runtimeHandleRef.current = null;
        }
      }
      setRuntimeNode(null);
    };
  }, [
    catalogGame,
    defaultConfig,
    gameDefinition,
    isMissingGameModule,
    runtimeStorage,
  ]);

  function retryLaunch() {
    const runtime = runtimeHandleRef.current;
    if (runtime) {
      void runtime.destroy?.();
      runtimeHandleRef.current = null;
    }

    setRuntimeNode(null);
    setSession(null);
    setSessionError(null);
  }

  if (isMissingGameModule) {
    return (
      <Page>
        <h1 style={{ color: "#f7f8fa" }}>Brak modulu gry</h1>
        <Link to="/" style={secondaryLinkStyle}>
          Wroc do lobby
        </Link>
      </Page>
    );
  }

  if (sessionError) {
    return (
      <Page>
        <main style={statusShellStyle}>
          <section style={statusCardStyle}>
            <p style={eyebrowStyle}>Kalambury</p>
            <h1 style={headingStyle}>Nie udalo sie uruchomic gry</h1>
            <p style={copyStyle}>{sessionError}</p>
            <div style={statusActionsStyle}>
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={retryLaunch}
              >
                Sprobuj ponownie
              </button>
              <Link to={`/games/${catalogGame.id}`} style={secondaryLinkStyle}>
                Wroc do szczegolow
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
        <main aria-live="polite" style={statusShellStyle}>
          <section style={statusCardStyle}>
            <p style={eyebrowStyle}>Kalambury</p>
            <h1 style={headingStyle}>Ladowanie menu gry...</h1>
            <p style={copyStyle}>
              {isCreatingSession
                ? "Przygotowujemy sesje i uruchamiamy modul gry."
                : "Czekamy na zaladowanie runtime gry."}
            </p>
          </section>
        </main>
      </Page>
    );
  }

  return <>{runtimeNode}</>;
}

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
  fontSize: "clamp(2.4rem, 7vw, 3.6rem)",
  lineHeight: 0.94,
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

const primaryButtonStyle = {
  borderRadius: 999,
  border: "1px solid rgba(124,92,255,0.45)",
  background: "rgba(124,92,255,0.18)",
  color: "#f7f8fa",
  padding: "12px 18px",
  cursor: "pointer",
} as const;

const secondaryLinkStyle = {
  color: "#f7f8fa",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 999,
  padding: "12px 18px",
  display: "inline-flex",
} as const;
