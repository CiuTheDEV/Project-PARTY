import { useEffect, useRef, useState } from "react";

import {
  type KalamburyPresenterChannel,
  type KalamburyPresenterPhrasePayload,
  type KalamburyPresenterPreviewState,
  createKalamburyPresenterControllerBridge,
} from "../shared/presenter-bridge";

const PRESENTER_DEVICE_ID_STORAGE_KEY =
  "project-party.kalambury.presenter-device-id";

type KalamburyControllerAppProps = {
  sessionCode?: string;
  playerName?: string;
  transportChannel?: KalamburyPresenterChannel;
};

function getPresenterDeviceId() {
  if (typeof localStorage === "undefined") {
    return `presenter-${Math.random().toString(36).slice(2, 10)}`;
  }

  const existingDeviceId = localStorage.getItem(PRESENTER_DEVICE_ID_STORAGE_KEY);
  if (existingDeviceId) {
    return existingDeviceId;
  }

  const nextDeviceId = `presenter-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(PRESENTER_DEVICE_ID_STORAGE_KEY, nextDeviceId);
  return nextDeviceId;
}

export function KalamburyControllerApp({
  sessionCode,
  playerName,
  transportChannel,
}: KalamburyControllerAppProps) {
  const controllerBridgeRef = useRef<ReturnType<
    typeof createKalamburyPresenterControllerBridge
  > | null>(null);
  const [connectionState, setConnectionState] = useState<
    "pending" | "connected" | "rejected"
  >("pending");
  const [privatePhrase, setPrivatePhrase] =
    useState<KalamburyPresenterPhrasePayload | null>(null);
  const [previewState, setPreviewState] =
    useState<KalamburyPresenterPreviewState>("pending-reveal");
  const [presenterName, setPresenterName] = useState(
    playerName?.trim() || "Prezenter",
  );
  const [previewCountdown, setPreviewCountdown] = useState(10);

  useEffect(() => {
    setPresenterName(playerName?.trim() || "Prezenter");
  }, [playerName]);

  useEffect(() => {
    if (!sessionCode) {
      return;
    }

    const bridge = createKalamburyPresenterControllerBridge(sessionCode, {
      channel: transportChannel,
      deviceId: getPresenterDeviceId(),
      onPhraseChange: (payload) => {
        setPrivatePhrase(payload);
        if (payload?.presenterName?.trim()) {
          setPresenterName(payload.presenterName.trim());
        }
      },
      onPreviewStateChange: setPreviewState,
      onConnectionStateChange: (state) => {
        setConnectionState(state);
        if (state !== "connected") {
          setPrivatePhrase(null);
        }
      },
    });
    controllerBridgeRef.current = bridge;
    bridge.announceReady();

    const handlePageClose = () => {
      bridge.destroy();
    };

    window.addEventListener("pagehide", handlePageClose);
    window.addEventListener("beforeunload", handlePageClose);

    return () => {
      window.removeEventListener("pagehide", handlePageClose);
      window.removeEventListener("beforeunload", handlePageClose);
      bridge.destroy();
      if (controllerBridgeRef.current === bridge) {
        controllerBridgeRef.current = null;
      }
    };
  }, [sessionCode, transportChannel]);

  useEffect(() => {
    if (previewState !== "preview") {
      setPreviewCountdown(10);
      return;
    }

    setPreviewCountdown(10);
  }, [previewState, privatePhrase?.phrase]);

  useEffect(() => {
    if (previewState !== "preview" || previewCountdown <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPreviewCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [previewCountdown, previewState]);

  const canRevealPhrase =
    connectionState === "connected" &&
    previewState === "pending-reveal" &&
    privatePhrase !== null;
  const isPreviewVisible = previewState === "preview" && privatePhrase !== null;
  const isLiveHidden = previewState === "hidden-live";
  const statusLabel =
    connectionState === "rejected"
      ? "Slot prezentera jest zajety"
      : isPreviewVisible
        ? "Zapamietaj haslo"
        : isLiveHidden
          ? "Tura trwa"
          : "Karta czeka na odkrycie";
  const presenterLabel = presenterName;
  const shellClassName =
    connectionState === "rejected"
      ? "kalambury-controller-shell kalambury-controller-shell--rejected"
      : "kalambury-controller-shell";
  const statusClassName =
    connectionState === "rejected"
      ? "kalambury-controller-status kalambury-controller-status--rejected"
      : isPreviewVisible
        ? "kalambury-controller-status kalambury-controller-status--preview"
        : isLiveHidden
          ? "kalambury-controller-status kalambury-controller-status--live"
          : "kalambury-controller-status";
  const cardClassName = isPreviewVisible
    ? "kalambury-controller-card kalambury-controller-card--revealed"
    : "kalambury-controller-card";
  const cardFaceClassName = isPreviewVisible
    ? "kalambury-controller-card__face kalambury-controller-card__face--revealed"
    : "kalambury-controller-card__face";
  const phraseChangeRemaining = privatePhrase?.phraseChangeRemaining ?? 0;
  const phraseChangeAllowed = privatePhrase?.phraseChangeAllowed ?? false;
  const changeButtonLabel =
    phraseChangeRemaining === "infinite"
      ? "Zmien haslo (INF)"
      : `Zmien haslo (${phraseChangeRemaining})`;

  if (connectionState === "rejected") {
    return (
      <main className={shellClassName}>
        <section className="kalambury-controller-rejected">
          <span className={statusClassName}>{statusLabel}</span>
          <h1>To miejsce jest juz zajete</h1>
          <p>
            Uzyj sparowanego telefonu albo rozlacz urzadzenie na ekranie hosta.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className={shellClassName}>
      <section className="kalambury-controller-layout">
        <header className="kalambury-controller-header">
          <div className="kalambury-controller-presenter">
            <span className="kalambury-controller-presenter__eyebrow">
              PREZENTUJE
            </span>
            <strong className="kalambury-controller-presenter__name">
              {presenterLabel}
            </strong>
          </div>
          <span className={statusClassName}>{statusLabel}</span>
        </header>

        <section className={cardClassName}>
          <div className={cardFaceClassName}>
            {isPreviewVisible && privatePhrase ? (
              <>
                <span className="kalambury-controller-card__eyebrow">
                  Tajne haslo
                </span>
                <span className="kalambury-controller-card__countdown">
                  {previewCountdown}
                </span>
                <strong className="kalambury-controller-card__phrase">
                  {privatePhrase.phrase}
                </strong>
              </>
            ) : (
              <>
                <span className="kalambury-controller-card__eyebrow">
                  Karta prezentera
                </span>
                <span className="kalambury-controller-card__backmark">
                  KALAMBURY
                </span>
              </>
            )}
          </div>

          <div className="kalambury-controller-card__actions">
            {!isLiveHidden ? (
              <button
                className="kalambury-controller-button kalambury-controller-button--primary"
                type="button"
                disabled={!canRevealPhrase}
                onClick={() => controllerBridgeRef.current?.revealPhrase()}
              >
                Odkryj karte
              </button>
            ) : null}

            {isPreviewVisible ? (
              <button
                className="kalambury-controller-button"
                type="button"
                disabled={!phraseChangeAllowed}
                onClick={() => controllerBridgeRef.current?.requestPhraseChange()}
              >
                {changeButtonLabel}
              </button>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
