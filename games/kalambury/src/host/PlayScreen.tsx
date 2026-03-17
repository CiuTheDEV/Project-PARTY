import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  type KalamburyPlayState,
  type KalamburySetupPayload,
  createKalamburyPlayState,
  drawKalamburyTurnOrder,
  enterKalamburyPreparation,
  enterKalamburyScore,
  getKalamburyCurrentPresenterId,
  rerollKalamburyPhrase,
  resolveKalamburyScore,
  startKalamburyTurn,
} from "../runtime/state-machine";
import type { KalamburyPresenterChannel, KalamburyPresenterPairState } from "../shared/presenter/types";
import { PRESENTER_REVEAL_PREVIEW_SECONDS } from "../settings/constants";
import { usePresenterHostBridge } from "./hooks/usePresenterHostBridge";
import { KalamburyPresenterQrModal } from "./setup-modals";

type PlayScreenProps = {
  setupPayload: KalamburySetupPayload;
  sessionCode?: string;
  transportChannel?: KalamburyPresenterChannel;
  onBackToHub: () => void;
};

type ScoreOutcome = "pending" | "guessed" | "missed";
type DrawAnimationPhase =
  | "idle"
  | "fanout"
  | "roulette"
  | "flip"
  | "stack"
  | "deal";

type DrawSequenceCard = {
  player: KalamburySetupPayload["players"][number];
  revealed: boolean;
  orderIndex: number | null;
};

type PresenterRevealStage = "pending" | "preview";

function formatKalamburyTimerValue(seconds: number) {
  return Math.max(0, Math.trunc(seconds)).toString();
}

const drawAnimationDurations = {
  fanout: 220,
  rouletteTick: 90,
  rouletteLoops: 9,
  flip: 260,
  stack: 220,
  deal: 320,
};

const confettiPieces = [
  { x: "8%", y: "6%", delay: "0s", rotate: "-18deg", type: "emoji" },
  { x: "13%", y: "18%", delay: "0.2s", rotate: "14deg", type: "emoji" },
  { x: "22%", y: "30%", delay: "0.35s", rotate: "-30deg", type: "confetti" },
  { x: "34%", y: "12%", delay: "0.1s", rotate: "22deg", type: "confetti" },
  { x: "41%", y: "24%", delay: "0.45s", rotate: "-12deg", type: "confetti" },
  { x: "58%", y: "10%", delay: "0.18s", rotate: "28deg", type: "confetti" },
  { x: "66%", y: "20%", delay: "0.5s", rotate: "-8deg", type: "emoji" },
  { x: "74%", y: "14%", delay: "0.25s", rotate: "20deg", type: "confetti" },
  { x: "84%", y: "8%", delay: "0.4s", rotate: "-26deg", type: "emoji" },
  { x: "90%", y: "28%", delay: "0.55s", rotate: "16deg", type: "confetti" },
  { x: "10%", y: "78%", delay: "0.15s", rotate: "12deg", type: "emoji" },
  { x: "18%", y: "88%", delay: "0.6s", rotate: "-14deg", type: "confetti" },
  { x: "30%", y: "82%", delay: "0.32s", rotate: "18deg", type: "confetti" },
  { x: "48%", y: "90%", delay: "0.48s", rotate: "-20deg", type: "confetti" },
  { x: "66%", y: "84%", delay: "0.22s", rotate: "10deg", type: "emoji" },
  { x: "78%", y: "92%", delay: "0.58s", rotate: "-10deg", type: "confetti" },
  { x: "90%", y: "86%", delay: "0.3s", rotate: "26deg", type: "emoji" },
] as const;

function getDrawSequenceColumns(cardCount: number) {
  void cardCount;
  return 4;
}

function getDrawSequenceMetrics(
  cardCount: number,
  boundsWidth: number,
  boundsHeight: number,
) {
  const columns = getDrawSequenceColumns(cardCount);
  const rows = Math.ceil(cardCount / columns);
  const gapX = 16;
  const gapY = rows >= 3 ? 16 : 18;
  const fallbackWidth =
    typeof window === "undefined" ? 1280 : window.innerWidth;
  const fallbackHeight =
    typeof window === "undefined" ? 900 : window.innerHeight;
  const horizontalInset = 72;
  const verticalInset = rows >= 3 ? 82 : rows === 2 ? 68 : 56;
  const availableWidth = Math.max(
    320,
    Math.min(1320, (boundsWidth || fallbackWidth) - horizontalInset),
  );
  const availableHeight = Math.max(
    280,
    Math.min(640, (boundsHeight || fallbackHeight) - verticalInset),
  );
  const rawCardWidth = Math.floor(
    (availableWidth - gapX * (columns - 1)) / columns,
  );
  const cardWidthCap = cardCount <= 4 ? 300 : cardCount <= 8 ? 248 : 220;
  const cardWidth = Math.min(rawCardWidth, cardWidthCap);
  const maxCardHeight = Math.floor(
    cardWidth * (cardCount <= 4 ? 0.72 : cardCount <= 8 ? 0.76 : 0.78),
  );
  const gridHeight = Math.floor((availableHeight - gapY * (rows - 1)) / rows);
  const minCardHeight = cardCount <= 4 ? 206 : cardCount <= 8 ? 166 : 118;
  const cardHeight = Math.max(
    minCardHeight,
    Math.min(gridHeight, maxCardHeight),
  );

  return { columns, rows, cardWidth, cardHeight, gapX, gapY };
}

function getDrawGridTarget(
  index: number,
  cardCount: number,
  boundsWidth: number,
  boundsHeight: number,
) {
  const { columns, rows, cardWidth, cardHeight, gapX, gapY } =
    getDrawSequenceMetrics(cardCount, boundsWidth, boundsHeight);
  const col = index % columns;
  const row = Math.floor(index / columns);
  const cardsInRow = Math.min(columns, cardCount - row * columns);
  const totalWidth = cardsInRow * cardWidth + (cardsInRow - 1) * gapX;
  const totalHeight = rows * cardHeight + (rows - 1) * gapY;

  return {
    x: col * (cardWidth + gapX) - totalWidth / 2,
    y: row * (cardHeight + gapY) - totalHeight / 2,
    rotate: 0,
    scale: 1,
    opacity: 1,
  };
}

function getDrawTransition(phase: DrawAnimationPhase, isActive: boolean) {
  if (phase === "roulette") {
    return {
      duration:
        (isActive
          ? drawAnimationDurations.rouletteTick
          : drawAnimationDurations.rouletteTick * 0.82) / 1000,
    };
  }

  if (phase === "flip") {
    return {
      duration: drawAnimationDurations.flip / 1000,
    };
  }

  if (phase === "deal") {
    return {
      duration: drawAnimationDurations.deal / 1000,
    };
  }

  return {
    duration:
      drawAnimationDurations[phase === "idle" ? "fanout" : phase] / 1000,
  };
}

function getDrawSequenceTarget(
  card: DrawSequenceCard,
  index: number,
  cardCount: number,
  phase: DrawAnimationPhase,
  isActive: boolean,
  boundsWidth: number,
  boundsHeight: number,
) {
  const centeredIndex = index - (cardCount - 1) / 2;

  if (phase === "idle") {
    return {
      x: centeredIndex * 1.5,
      y: centeredIndex,
      rotate: centeredIndex * 0.8,
      scale: 1,
      opacity: 1,
    };
  }

  if (phase === "fanout") {
    const target = getDrawGridTarget(
      index,
      cardCount,
      boundsWidth,
      boundsHeight,
    );
    return { ...target, rotate: 0, scale: 1, opacity: 1 };
  }

  if (phase === "roulette") {
    const target = getDrawGridTarget(
      index,
      cardCount,
      boundsWidth,
      boundsHeight,
    );
    return {
      ...target,
      y: target.y + (isActive ? -8 : 0),
      rotate: 0,
      scale: isActive ? 1.04 : 1,
      opacity: 1,
    };
  }

  if (phase === "flip") {
    const target = getDrawGridTarget(
      index,
      cardCount,
      boundsWidth,
      boundsHeight,
    );
    return {
      ...target,
      y: target.y + (isActive ? -10 : 0),
      rotate: 0,
      scale: isActive ? 1.05 : 1,
      opacity: 1,
    };
  }

  if (phase === "stack") {
    const stackIndex = (card.orderIndex ?? index + 1) - 1 - (cardCount - 1) / 2;
    return {
      x: stackIndex * 3,
      y: stackIndex * 2,
      rotate: stackIndex * 2.8,
      scale: 1,
      opacity: 1,
    };
  }

  return {
    ...getDrawGridTarget(
      (card.orderIndex ?? index + 1) - 1,
      cardCount,
      boundsWidth,
      boundsHeight,
    ),
    rotate: 0,
    scale: 1,
    opacity: 1,
  };
}

function getDrawCardStyle(
  card: DrawSequenceCard,
  index: number,
  cardCount: number,
  phase: DrawAnimationPhase,
  isActive: boolean,
  boundsWidth: number,
  boundsHeight: number,
) {
  const target = getDrawSequenceTarget(
    card,
    index,
    cardCount,
    phase,
    isActive,
    boundsWidth,
    boundsHeight,
  );
  const transition = getDrawTransition(phase, isActive);

  return {
    transform: `translate(${target.x}px, ${target.y}px) rotate(${target.rotate}deg) scale(${target.scale})`,
    opacity: target.opacity,
    transition: `transform ${transition.duration}s cubic-bezier(0.16, 1, 0.3, 1), opacity ${transition.duration}s cubic-bezier(0.16, 1, 0.3, 1)`,
  } as CSSProperties;
}

export function PlayScreen({
  setupPayload,
  sessionCode,
  transportChannel,
  onBackToHub,
}: PlayScreenProps) {
  const [playState, setPlayState] = useState<KalamburyPlayState | null>(() =>
    createKalamburyPlayState(setupPayload),
  );
  const [scoreOutcome, setScoreOutcome] = useState<ScoreOutcome>("pending");
  const [selectedGuesserId, setSelectedGuesserId] = useState<string | null>(
    null,
  );
  const [presenterBonus, setPresenterBonus] = useState(false);
  const [isPhraseRevealed, setIsPhraseRevealed] = useState(false);
  const [drawAnimationPhase, setDrawAnimationPhase] =
    useState<DrawAnimationPhase>("idle");
  const [pendingDrawState, setPendingDrawState] =
    useState<KalamburyPlayState | null>(null);
  const [drawSequenceCards, setDrawSequenceCards] = useState<
    DrawSequenceCard[]
  >([]);
  const [activeDrawCardId, setActiveDrawCardId] = useState<string | null>(null);
  const [currentDrawRevealIndex, setCurrentDrawRevealIndex] = useState(0);
  const [drawRouletteStep, setDrawRouletteStep] = useState(0);
  const [drawSequenceBounds, setDrawSequenceBounds] = useState({
    width: 0,
    height: 0,
  });
  const drawAnimationTimerRef = useRef<number | null>(null);
  const drawSequenceRef = useRef<HTMLDivElement | null>(null);
  const lastRerollRef = useRef(0);
  const [presenterRevealStage, setPresenterRevealStage] =
    useState<PresenterRevealStage>("pending");
  const [presenterRevealCountdown, setPresenterRevealCountdown] = useState(
    PRESENTER_REVEAL_PREVIEW_SECONDS,
  );
  useEffect(() => {
    setPlayState(createKalamburyPlayState(setupPayload));
    setPresenterRevealStage("pending");
    setPresenterRevealCountdown(PRESENTER_REVEAL_PREVIEW_SECONDS);
  }, [setupPayload]);

  useEffect(() => {
    if (playState?.stage !== "PRZYGOTOWANIE") {
      setPresenterRevealStage("pending");
      setPresenterRevealCountdown(PRESENTER_REVEAL_PREVIEW_SECONDS);
    }
  }, [playState?.stage]);

  useEffect(() => {
    if (!playState || playState.stage !== "SCORE") {
      setScoreOutcome("pending");
      setSelectedGuesserId(null);
      setPresenterBonus(false);
      setIsPhraseRevealed(false);
    }
  }, [playState]);

  const { pairState: presenterPairState, bridge: presenterBridge } =
    usePresenterHostBridge({
      sessionCode,
      enabled: setupPayload.presenterDevice?.enabled ?? false,
      initialPairedDeviceId:
        setupPayload.presenterDevice?.pairedDeviceId ?? null,
      channel: transportChannel,
      pingIntervalMs: 3000,
      pingTimeoutMs: 5000,
      onRevealRequest: () => {
        // These values come from the latest render's closure — safe because the hook
        // stores onRevealRequest in a ref and reads .current at call time.
        if (playState?.stage !== "PRZYGOTOWANIE") {
          return;
        }

        setPresenterRevealStage("preview");
        setPresenterRevealCountdown(PRESENTER_REVEAL_PREVIEW_SECONDS);
        presenterBridge.startPreviewWindow();
      },
      onRerollRequest: () => {
        if (
          playState?.stage !== "PRZYGOTOWANIE" ||
          presenterRevealStage !== "preview"
        ) {
          return;
        }

        if (Date.now() - lastRerollRef.current < 1000) return;
        lastRerollRef.current = Date.now();

        setPlayState((current) =>
          current ? rerollKalamburyPhrase(current, setupPayload) : current,
        );
      },
    });

  const presenterReconnectRequired =
    Boolean(setupPayload.presenterDevice?.enabled) &&
    Boolean(sessionCode) &&
    (playState?.stage === "PRZYGOTOWANIE" || playState?.stage === "ACT") &&
    !presenterPairState.connected;

  useEffect(() => {
    if (!playState || playState.stage !== "ACT" || presenterReconnectRequired) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setPlayState((current) => {
        if (!current) {
          return current;
        }

        if (current.activeEvent === "rush") {
          const nextTime = current.timerSeconds + 1;
          if (nextTime >= 60) {
            return enterKalamburyScore({ ...current, timerSeconds: 60 });
          }
          return { ...current, timerSeconds: nextTime };
        }

        const nextTime = current.timerSeconds - 1;
        if (nextTime <= 0) {
          return enterKalamburyScore({ ...current, timerSeconds: 0 });
        }

        return { ...current, timerSeconds: nextTime };
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [playState?.stage, presenterReconnectRequired]);

  // Clear presenter phrase when PlayScreen unmounts
  useEffect(() => {
    return () => {
      presenterBridge.clearPhrase();
    };
  }, [presenterBridge]);

  useEffect(() => {
    if (
      playState?.stage !== "PRZYGOTOWANIE" ||
      presenterRevealStage !== "preview" ||
      presenterReconnectRequired
    ) {
      return;
    }

    if (presenterRevealCountdown <= 0) {
      presenterBridge.finishPreviewWindow();
      setPlayState((current) =>
        current ? startKalamburyTurn(current) : current,
      );
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPresenterRevealCountdown((current) => current - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    playState?.stage,
    presenterReconnectRequired,
    presenterRevealCountdown,
    presenterRevealStage,
  ]);

  useEffect(() => {
    const updateBounds = () => {
      const bounds = drawSequenceRef.current?.getBoundingClientRect();
      setDrawSequenceBounds({
        width: bounds?.width ?? 0,
        height: bounds?.height ?? 0,
      });
    };

    updateBounds();

    if (typeof ResizeObserver !== "undefined" && drawSequenceRef.current) {
      const observer = new ResizeObserver(() => {
        updateBounds();
      });
      observer.observe(drawSequenceRef.current);

      return () => {
        observer.disconnect();
      };
    }

    window.addEventListener("resize", updateBounds);
    return () => {
      window.removeEventListener("resize", updateBounds);
    };
  }, []);

  useEffect(() => {
    if (
      playState?.stage !== "LOSOWANIE" &&
      drawAnimationTimerRef.current !== null
    ) {
      window.clearTimeout(drawAnimationTimerRef.current);
      drawAnimationTimerRef.current = null;
    }

    if (playState?.stage !== "LOSOWANIE") {
      setDrawAnimationPhase("idle");
      setPendingDrawState(null);
      setDrawSequenceCards([]);
      setActiveDrawCardId(null);
      setCurrentDrawRevealIndex(0);
      setDrawRouletteStep(0);
    }
  }, [playState?.stage]);

  useEffect(() => {
    if (
      drawAnimationPhase === "idle" ||
      !pendingDrawState ||
      drawSequenceCards.length === 0
    ) {
      return;
    }

    const unrevealedIds = drawSequenceCards
      .filter((card) => !card.revealed)
      .map((card) => card.player.id);
    const delay =
      drawAnimationPhase === "roulette"
        ? drawAnimationDurations.rouletteTick
        : drawAnimationPhase === "flip"
          ? drawAnimationDurations.flip
          : drawAnimationDurations[drawAnimationPhase];

    const timeoutId = window.setTimeout(() => {
      if (drawAnimationPhase === "fanout") {
        setDrawRouletteStep(0);
        setActiveDrawCardId(null);
        setDrawAnimationPhase("roulette");
        return;
      }

      if (drawAnimationPhase === "roulette") {
        if (unrevealedIds.length === 0) {
          setActiveDrawCardId(null);
          setDrawAnimationPhase("stack");
          return;
        }

        const targetPlayerId =
          pendingDrawState.turnOrderIds[currentDrawRevealIndex];
        if (!targetPlayerId) {
          setActiveDrawCardId(null);
          setDrawAnimationPhase("stack");
          return;
        }

        const targetOffset = unrevealedIds.indexOf(targetPlayerId);
        const nextActiveId =
          unrevealedIds[drawRouletteStep % unrevealedIds.length];
        const totalSteps =
          drawAnimationDurations.rouletteLoops + Math.max(targetOffset, 0);

        setActiveDrawCardId(nextActiveId);

        if (drawRouletteStep >= totalSteps && nextActiveId === targetPlayerId) {
          const revealOrder = currentDrawRevealIndex + 1;
          setDrawSequenceCards((current) =>
            current.map((card) =>
              card.player.id === targetPlayerId
                ? { ...card, revealed: true, orderIndex: revealOrder }
                : card,
            ),
          );
          setDrawAnimationPhase("flip");
          return;
        }

        setDrawRouletteStep((current) => current + 1);
        return;
      }

      if (drawAnimationPhase === "flip") {
        const nextRevealIndex = currentDrawRevealIndex + 1;
        if (nextRevealIndex >= pendingDrawState.turnOrderIds.length) {
          setActiveDrawCardId(null);
          setDrawAnimationPhase("stack");
          return;
        }

        setCurrentDrawRevealIndex(nextRevealIndex);
        setDrawRouletteStep(0);
        setActiveDrawCardId(null);
        setDrawAnimationPhase("roulette");
        return;
      }

      if (drawAnimationPhase === "stack") {
        setDrawAnimationPhase("deal");
        return;
      }

      setPlayState(pendingDrawState);
      setPendingDrawState(null);
      setDrawSequenceCards([]);
      setActiveDrawCardId(null);
      setCurrentDrawRevealIndex(0);
      setDrawRouletteStep(0);
      setDrawAnimationPhase("idle");
      drawAnimationTimerRef.current = null;
    }, delay);

    drawAnimationTimerRef.current = timeoutId;
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    currentDrawRevealIndex,
    drawAnimationPhase,
    drawRouletteStep,
    drawSequenceCards,
    pendingDrawState,
  ]);

  const presenter = useMemo(() => {
    if (!playState) {
      return null;
    }

    const presenterId = getKalamburyCurrentPresenterId(playState);
    return (
      setupPayload.players.find((player) => player.id === presenterId) ?? null
    );
  }, [playState, setupPayload.players]);
  const presenterPhraseChangeRemaining =
    presenter && playState
      ? (playState.phraseChangeRemainingByPlayerId[presenter.id] ?? 0)
      : 0;
  const presenterPhraseChangeAllowed = presenterPhraseChangeRemaining !== 0;

  const turnOrderPlayers = useMemo(
    () =>
      playState
        ? playState.turnOrderIds.reduce<
            Array<KalamburySetupPayload["players"][number]>
          >((accumulator, playerId) => {
            const player = setupPayload.players.find(
              (candidate) => candidate.id === playerId,
            );
            if (player) {
              accumulator.push(player);
            }
            return accumulator;
          }, [])
        : [],
    [playState, setupPayload],
  );

  const sortedScoreboard = useMemo(
    () =>
      playState
        ? [...setupPayload.players].sort(
            (left, right) =>
              (playState.scores[right.id] ?? 0) -
              (playState.scores[left.id] ?? 0),
          )
        : [],
    [playState, setupPayload],
  );

  const turnOrderGridClassName =
    turnOrderPlayers.length >= 9
      ? "kalambury-order-grid kalambury-order-grid--dense"
      : turnOrderPlayers.length >= 5
        ? "kalambury-order-grid kalambury-order-grid--compact"
        : turnOrderPlayers.length % 2 === 1
          ? "kalambury-order-grid kalambury-order-grid--orphan"
          : "kalambury-order-grid";

  const hostHintChips = useMemo(() => {
    if (!playState) {
      return [];
    }

    const hints = setupPayload.modeSettings.hints ?? {
      enabled: false,
      showWordCount: false,
      showCategory: false,
    };
    if (!hints.enabled) {
      return [];
    }

    return [
      hints.showWordCount ? `Ilosc slow: ${playState.wordCount}` : null,
      hints.showCategory ? `Kategoria: ${playState.phraseCategoryLabel}` : null,
    ].filter(Boolean) as string[];
  }, [playState, setupPayload]);

  const winner = sortedScoreboard[0] ?? null;
  const isDrawAnimating = drawAnimationPhase !== "idle";
  const drawSequenceMetrics = useMemo(
    () =>
      getDrawSequenceMetrics(
        Math.max(drawSequenceCards.length, 2),
        drawSequenceBounds.width,
        drawSequenceBounds.height,
      ),
    [
      drawSequenceBounds.height,
      drawSequenceBounds.width,
      drawSequenceCards.length,
    ],
  );
  const drawSequenceClassName =
    drawSequenceCards.length >= 9
      ? "kalambury-draw-sequence kalambury-draw-sequence--dense"
      : drawSequenceCards.length >= 5
        ? "kalambury-draw-sequence kalambury-draw-sequence--compact"
        : "kalambury-draw-sequence";
  const drawSequenceStyle = {
    ["--draw-card-width" as const]: `${drawSequenceMetrics.cardWidth}px`,
    ["--draw-card-height" as const]: `${drawSequenceMetrics.cardHeight}px`,
  } as CSSProperties;

  useEffect(() => {
    if (
      !playState ||
      !presenter ||
      playState.stage !== "PRZYGOTOWANIE" ||
      !presenterPairState.connected ||
      !presenterPairState.pairedDeviceId
    ) {
      presenterBridge.clearPhrase();
      return;
    }

    presenterBridge.publishPhrase({
      phrase: playState.phrase,
      categoryLabel: playState.phraseCategoryLabel,
      wordCount: playState.wordCount,
      presenterName: presenter.name,
      phraseChangeAllowed: presenterPhraseChangeAllowed,
      phraseChangeRemaining: presenterPhraseChangeRemaining,
    });
  }, [
    playState,
    presenter,
    presenterPairState,
    presenterPhraseChangeAllowed,
    presenterPhraseChangeRemaining,
    presenterBridge,
  ]);

  useEffect(() => {
    if (!playState || !presenterPairState.connected) {
      return;
    }

    if (playState.stage === "ACT") {
      presenterBridge.finishPreviewWindow();
      presenterBridge.clearPhrase();
    }
  }, [playState, presenterPairState.connected, presenterBridge]);

  useEffect(() => {
    if (
      !playState ||
      playState.stage !== "PRZYGOTOWANIE" ||
      !presenterPairState.connected
    ) {
      return;
    }

    if (presenterRevealStage === "pending") {
      presenterBridge.resetPreviewWindow();
    }
  }, [playState, presenterPairState.connected, presenterRevealStage, presenterBridge]);

  if (!playState) {
    return null;
  }

  const setup = setupPayload;
  const currentPlayState = playState;
  const currentTurnLabel = `${currentPlayState.turnInRound + 1}/${setup.players.length}`;
  const eventLabel =
    currentPlayState.activeEvent === "golden-points"
      ? "Golden Points"
      : currentPlayState.activeEvent === "rush"
        ? "Rush"
        : null;
  const scoreResolutionValid =
    scoreOutcome === "missed" ||
    (scoreOutcome === "guessed" && selectedGuesserId !== null);
  const guesserOptions = setup.players.filter(
    (player) => player.id !== presenter?.id,
  );

  function getStageLabel(stage: KalamburyPlayState["stage"]) {
    if (stage === "LOSOWANIE" || stage === "KOLEJNOSC") {
      return "LOSOWANIE";
    }
    if (stage === "PRZYGOTOWANIE") {
      return "PRZYGOTOWANIE";
    }
    if (stage === "ACT") {
      return "PREZENTOWANIE";
    }
    if (stage === "SCORE") {
      return "WERDYKT";
    }
    return "PODSUMOWANIE";
  }

  function getAdvanceLabel() {
    if (
      currentPlayState.turnInRound + 1 >= setup.players.length &&
      currentPlayState.roundNumber >= currentPlayState.totalRounds
    ) {
      return "Zakoncz gre";
    }
    if (currentPlayState.turnInRound + 1 >= setup.players.length) {
      return "Nowa runda";
    }
    return "Zapisz i dalej";
  }

  function getDrawCtaLabel() {
    if (drawAnimationPhase === "fanout") {
      return "Rozkladanie kart...";
    }
    if (drawAnimationPhase === "roulette") {
      return "Wybieranie karty...";
    }
    if (drawAnimationPhase === "flip") {
      return "Odkrywanie karty...";
    }
    if (drawAnimationPhase === "stack") {
      return "Zbijanie kart...";
    }
    if (drawAnimationPhase === "deal") {
      return "Ustawianie kolejnosci...";
    }
    return "Losowanie kolejnosci";
  }

  function handleDrawOrder() {
    if (isDrawAnimating) {
      return;
    }

    setPlayState((current) => {
      if (!current) {
        return current;
      }

      const nextState = drawKalamburyTurnOrder(current, setup);
      setPendingDrawState(nextState);
      setDrawSequenceCards(
        setup.players.map((player) => ({
          player,
          revealed: false,
          orderIndex: null,
        })),
      );
      setActiveDrawCardId(null);
      setCurrentDrawRevealIndex(0);
      setDrawRouletteStep(0);
      setDrawAnimationPhase("fanout");
      return current;
    });
  }

  function handleSkipDraw() {
    if (!isDrawAnimating || !pendingDrawState) {
      return;
    }

    if (drawAnimationTimerRef.current !== null) {
      window.clearTimeout(drawAnimationTimerRef.current);
      drawAnimationTimerRef.current = null;
    }

    setPlayState(pendingDrawState);
    setPendingDrawState(null);
    setDrawSequenceCards([]);
    setActiveDrawCardId(null);
    setCurrentDrawRevealIndex(0);
    setDrawRouletteStep(0);
    setDrawAnimationPhase("idle");
  }

  function handleShowPreparation() {
    setPlayState((current) =>
      current ? enterKalamburyPreparation(current, setup) : current,
    );
    setPresenterRevealStage("pending");
    setPresenterRevealCountdown(PRESENTER_REVEAL_PREVIEW_SECONDS);
  }

  function handleScoreStage() {
    if (presenterReconnectRequired) {
      return;
    }

    setPlayState((current) =>
      current ? enterKalamburyScore(current) : current,
    );
  }

  function handleResolveScore() {
    if (!scoreResolutionValid) {
      return;
    }

    setPlayState((current) =>
      current
        ? resolveKalamburyScore(current, setup, {
            guessedByPlayerId:
              scoreOutcome === "guessed" ? selectedGuesserId : null,
            presenterBonus,
          })
        : current,
    );
  }

  function handleBackFromScore() {
    if (scoreOutcome === "pending") {
      return;
    }

    setScoreOutcome("pending");
    setSelectedGuesserId(null);
    setPresenterBonus(false);
    setIsPhraseRevealed(false);
  }

  return (
    <main className="app-shell app-shell--kalambury-play">
      <div className="ambient-orb ambient-orb--primary" aria-hidden="true" />
      <div
        className="ambient-orb ambient-orb--kalambury-secondary"
        aria-hidden="true"
      />

      <section className="hero hero--kalambury-play hero--kalambury-playwide">
        <header className="kalambury-playtopbar kalambury-playbar">
          <div className="kalambury-playtopbar__left">
            <span className="kalambury-stage-pill">
              {getStageLabel(playState.stage)}
            </span>
            {Boolean(setupPayload.presenterDevice?.enabled) && (
              <span
                className={
                  presenterPairState.connected
                    ? "kalambury-presenter-status kalambury-presenter-status--connected"
                    : "kalambury-presenter-status kalambury-presenter-status--disconnected"
                }
                aria-label={
                  presenterPairState.connected
                    ? "Telefon prezentera połączony"
                    : "Czekam na telefon prezentera..."
                }
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {presenterPairState.connected
                    ? "smartphone"
                    : "phonelink_off"}
                </span>
              </span>
            )}
          </div>
          <div className="kalambury-playtopbar__actions">
            {isDrawAnimating && setup.players.length > 4 ? (
              <button
                className="kalambury-playtopbar__skip-draw"
                type="button"
                onClick={handleSkipDraw}
                aria-label="Pominij animacje losowania"
              >
                Pomiń losowanie
              </button>
            ) : null}
            <button
              className="kalambury-playtopbar__settings"
              type="button"
              onClick={onBackToHub}
              aria-label="Wroc do menu gry i ustawien"
            >
              Ustawienia
            </button>
          </div>
        </header>

        <section className="kalambury-stage-shell kalambury-stage-shell--fullstage">
          <div className="kalambury-stage-canvas">
            {playState.stage === "LOSOWANIE" ? (
              <div className="kalambury-stage-panel kalambury-stage-panel--draw">
                {isDrawAnimating ? (
                  <div
                    ref={drawSequenceRef}
                    className={drawSequenceClassName}
                    style={drawSequenceStyle}
                    aria-live="polite"
                  >
                    {drawSequenceCards.map((card, index) => (
                      <article
                        key={card.player.id}
                        className={
                          card.revealed
                            ? "kalambury-draw-card kalambury-draw-card--revealed"
                            : activeDrawCardId === card.player.id
                              ? "kalambury-draw-card kalambury-draw-card--active"
                              : "kalambury-draw-card"
                        }
                        data-gender={card.player.gender}
                        style={getDrawCardStyle(
                          card,
                          index,
                          drawSequenceCards.length,
                          drawAnimationPhase,
                          activeDrawCardId === card.player.id,
                          drawSequenceBounds.width,
                          drawSequenceBounds.height,
                        )}
                      >
                        <div className="kalambury-draw-card__inner">
                          <div className="kalambury-draw-card__face kalambury-draw-card__face--front">
                            <span className="kalambury-draw-card__index">
                              {card.orderIndex ?? "?"}
                            </span>
                            <span
                              className="kalambury-draw-card__avatar"
                              aria-hidden="true"
                            >
                              {card.player.avatar}
                            </span>
                            <span className="kalambury-draw-card__name">
                              {card.player.name}
                            </span>
                          </div>
                          <div className="kalambury-draw-card__face kalambury-draw-card__face--back">
                            <span className="kalambury-draw-card__back-mark">
                              KALAMBURY
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="kalambury-card-stack" aria-hidden="true">
                    <div className="kalambury-card-stack__card kalambury-card-stack__card--back" />
                    <div className="kalambury-card-stack__card kalambury-card-stack__card--mid" />
                    <div className="kalambury-card-stack__card kalambury-card-stack__card--front">
                      <span>KALAMBURY</span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {playState.stage === "KOLEJNOSC" ? (
              <div className="kalambury-stage-panel kalambury-stage-panel--order">
                <div className={turnOrderGridClassName}>
                  {turnOrderPlayers.map((player, index) => (
                    <article
                      className="kalambury-persona-card kalambury-persona-card--order kalambury-order-card"
                      data-gender={player.gender}
                      key={player.id}
                    >
                      <span className="kalambury-persona-card__badge kalambury-order-card__index">
                        {index + 1}
                      </span>
                      <div
                        className="kalambury-persona-card__avatar kalambury-order-card__avatar"
                        aria-hidden="true"
                      >
                        {player.avatar}
                      </div>
                      <strong className="kalambury-persona-card__nameplate kalambury-order-card__name">
                        {player.name}
                      </strong>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {playState.stage === "PRZYGOTOWANIE" && presenter ? (
              <div className="kalambury-stage-panel kalambury-stage-panel--prepare">
                <div className="kalambury-prepare-presenter-column">
                  <p className="kalambury-stage-counter kalambury-stage-counter--prepare">
                    TURA {currentTurnLabel}
                  </p>
                  <article
                    className="kalambury-persona-card kalambury-persona-card--presenter kalambury-presenter-hero"
                    data-gender={presenter.gender}
                  >
                    <strong className="kalambury-presenter-hero__label">
                      PREZENTUJE
                    </strong>
                    <div
                      className="kalambury-persona-card__avatar kalambury-presenter-hero__avatar"
                      aria-hidden="true"
                    >
                      {presenter.avatar}
                    </div>
                    <strong className="kalambury-persona-card__nameplate kalambury-presenter-hero__name">
                      {presenter.name}
                    </strong>
                  </article>
                </div>
                <div
                  className={[
                    "kalambury-host-status",
                    "kalambury-host-status--prepare",
                    presenterRevealStage === "preview"
                      ? "kalambury-host-status--timed"
                      : "",
                    presenterRevealStage === "preview"
                      ? "kalambury-host-status--prepare-preview"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="kalambury-host-status__copy kalambury-host-status__copy--prepare">
                    <h2>
                      {presenterReconnectRequired
                        ? "Gra wstrzymana do czasu ponownego podlaczenia urzadzenia prezentera"
                        : presenterRevealStage === "preview"
                          ? "Prezenter zapoznaje sie z haslem"
                          : "Karta czeka na odkrycie na telefonie"}
                    </h2>
                    <p>
                      {presenterReconnectRequired
                        ? "Podlacz ponownie telefon prezentera. Runda wznowi sie dokladnie z tego miejsca po sparowaniu nowego lub tego samego urzadzenia."
                        : presenterRevealStage === "preview"
                          ? "Po 10 sekundach runda rozpocznie sie automatycznie. Host nadal nie widzi hasla."
                          : "Prezenter musi odkryc karte na telefonie. Dopiero wtedy zacznie sie okno na zapoznanie z haslem."}
                    </p>
                  </div>
                  {presenterRevealStage === "preview" ? (
                    <div className="kalambury-play__timer kalambury-play__timer--prepare">
                      {formatKalamburyTimerValue(presenterRevealCountdown)}
                    </div>
                  ) : null}
                  {presenterRevealStage === "preview" ? (
                    <div
                      className="kalambury-host-status__footer"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            {playState.stage === "ACT" && presenter ? (
              <div className="kalambury-stage-panel kalambury-stage-panel--act-host">
                <div className="kalambury-prepare-presenter-column">
                  <p className="kalambury-stage-counter kalambury-stage-counter--prepare">
                    TURA {currentTurnLabel}
                  </p>
                  <article
                    className="kalambury-persona-card kalambury-persona-card--presenter kalambury-presenter-hero"
                    data-gender={presenter.gender}
                  >
                    <strong className="kalambury-presenter-hero__label">
                      PREZENTUJE
                    </strong>
                    <div
                      className="kalambury-persona-card__avatar kalambury-presenter-hero__avatar"
                      aria-hidden="true"
                    >
                      {presenter.avatar}
                    </div>
                    <strong className="kalambury-persona-card__nameplate kalambury-presenter-hero__name">
                      {presenter.name}
                    </strong>
                  </article>
                </div>
                <div className="kalambury-host-status kalambury-host-status--prepare kalambury-host-status--timed kalambury-host-status--act">
                  <div className="kalambury-host-status__copy kalambury-host-status__copy--prepare">
                    <h2>Czas do konca prezentowania</h2>
                    {eventLabel ? (
                      <span className="kalambury-play__event-badge">
                        {eventLabel}
                      </span>
                    ) : null}
                  </div>
                  <div className="kalambury-play__timer kalambury-play__timer--act">
                    {playState.activeEvent === "rush"
                      ? `+${formatKalamburyTimerValue(playState.timerSeconds)}`
                      : formatKalamburyTimerValue(playState.timerSeconds)}
                  </div>
                  <div className="kalambury-host-status__footer">
                    {presenterReconnectRequired ? (
                      <div className="kalambury-host-status__copy kalambury-host-status__copy--reconnect">
                        <h2>
                          Gra wstrzymana do czasu ponownego podlaczenia
                          urzadzenia prezentera
                        </h2>
                        <p>
                          Podlacz telefon prezentera ponownie, aby wznowic ture
                          bez utraty czasu i zsynchronizowac haslo na nowym
                          urzadzeniu.
                        </p>
                      </div>
                    ) : null}
                    {hostHintChips.length > 0 ? (
                      <div className="kalambury-hint-chips kalambury-hint-chips--act">
                        {hostHintChips.map((chip) => (
                          <span className="kalambury-hint-chip" key={chip}>
                            {chip}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {playState.stage === "SCORE" && presenter ? (
              <div className="kalambury-stage-panel kalambury-stage-panel--verdict">
                {scoreOutcome === "pending" ? (
                  <div className="kalambury-verdict-shell">
                    <h2>Werdykt tury</h2>
                    <div className="kalambury-verdict-choice-row">
                      <button
                        className="kalambury-verdict-choice"
                        type="button"
                        onClick={() => setScoreOutcome("missed")}
                      >
                        Nikt nie zgadl
                      </button>
                      <button
                        className="kalambury-verdict-choice"
                        type="button"
                        onClick={() => setScoreOutcome("guessed")}
                      >
                        Kto zgadl?
                      </button>
                    </div>
                  </div>
                ) : null}

                {scoreOutcome === "missed" ? (
                  <div className="kalambury-verdict-shell kalambury-verdict-shell--missed">
                    <h2>NIKT NIE ZGADL</h2>
                    <button
                      className="kalambury-secondary-action"
                      type="button"
                      onClick={() => setIsPhraseRevealed((current) => !current)}
                    >
                      {isPhraseRevealed ? "Ukryj haslo" : "Pokaz haslo"}
                    </button>
                    <p className="kalambury-host-copy">
                      {isPhraseRevealed
                        ? `Haslo: ${playState.phrase}`
                        : "Haslo jest ukryte."}
                    </p>
                  </div>
                ) : null}

                {scoreOutcome === "guessed" ? (
                  <div className="kalambury-verdict-shell kalambury-verdict-shell--guessed">
                    <h2>KTO ZGADL?</h2>
                    <div className="kalambury-verdict-player-grid kalambury-verdict-player-grid--guessers">
                      {guesserOptions.map((player) => (
                        <button
                          key={player.id}
                          className={
                            selectedGuesserId === player.id
                              ? "kalambury-persona-card kalambury-persona-card--interactive kalambury-persona-card--verdict kalambury-verdict-player-card kalambury-verdict-player-card--guesser kalambury-verdict-player-card--active"
                              : "kalambury-persona-card kalambury-persona-card--interactive kalambury-persona-card--verdict kalambury-verdict-player-card kalambury-verdict-player-card--guesser"
                          }
                          data-gender={player.gender}
                          type="button"
                          onClick={() => setSelectedGuesserId(player.id)}
                        >
                          <span
                            className="kalambury-persona-card__avatar kalambury-verdict-player-card__avatar"
                            aria-hidden="true"
                          >
                            {player.avatar}
                          </span>
                          <span className="kalambury-persona-card__nameplate kalambury-verdict-player-card__name">
                            {player.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {playState.stage === "FINISHED" ? (
              <div className="kalambury-stage-panel kalambury-stage-panel--summary">
                <div className="kalambury-summary-confetti" aria-hidden="true">
                  {confettiPieces.map((piece, index) => (
                    <span
                      key={`${piece.x}-${piece.y}-${index}`}
                      className={
                        piece.type === "emoji"
                          ? "kalambury-summary-confetti__emoji"
                          : "kalambury-summary-confetti__piece"
                      }
                      style={{
                        left: piece.x,
                        top: piece.y,
                        animationDelay: piece.delay,
                        transform: `rotate(${piece.rotate})`,
                      }}
                    >
                      {piece.type === "emoji" ? "✦" : ""}
                    </span>
                  ))}
                </div>
                <div className="kalambury-summary-head">
                  <h2>PODSUMOWANIE GRY</h2>
                  {winner ? (
                    <p>
                      Zwyciezca: <strong>{winner.name}</strong> (
                      {playState.scores[winner.id] ?? 0})
                    </p>
                  ) : null}
                </div>
                <div className="kalambury-summary-rankings">
                  {sortedScoreboard.map((player, index) => (
                    <article
                      className={
                        index === 0
                          ? "kalambury-persona-card kalambury-persona-card--summary kalambury-summary-rank kalambury-summary-rank--winner"
                          : "kalambury-persona-card kalambury-persona-card--summary kalambury-summary-rank"
                      }
                      data-gender={player.gender}
                      key={player.id}
                    >
                      <span className="kalambury-summary-rank__position">
                        #{index + 1}
                      </span>
                      <span
                        className="kalambury-persona-card__avatar kalambury-summary-rank__avatar"
                        aria-hidden="true"
                      >
                        {player.avatar}
                      </span>
                      <strong className="kalambury-persona-card__nameplate kalambury-summary-rank__name">
                        {player.name}
                      </strong>
                      <span className="kalambury-summary-rank__score">
                        {playState.scores[player.id] ?? 0}
                      </span>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {playState.stage === "LOSOWANIE" ? (
          <footer className="kalambury-stage-footer kalambury-playbar">
            <button
              className="kalambury-footer-button kalambury-footer-button--primary kalambury-stage-footer__cta"
              type="button"
              disabled={isDrawAnimating}
              onClick={handleDrawOrder}
            >
              {getDrawCtaLabel()}
            </button>
          </footer>
        ) : null}

        {playState.stage === "KOLEJNOSC" ? (
          <footer className="kalambury-stage-footer kalambury-playbar">
            <button
              className="kalambury-footer-button kalambury-footer-button--primary kalambury-stage-footer__cta"
              type="button"
              onClick={handleShowPreparation}
            >
              Pokaz prezentera
            </button>
          </footer>
        ) : null}

        {playState.stage === "PRZYGOTOWANIE" ? (
          <footer className="kalambury-stage-footer kalambury-playbar" />
        ) : null}

        {playState.stage === "ACT" ? (
          <footer className="kalambury-stage-footer kalambury-playbar">
            <button
              className="kalambury-footer-button kalambury-footer-button--danger kalambury-stage-footer__cta"
              type="button"
              disabled={presenterReconnectRequired}
              onClick={handleScoreStage}
            >
              STOP
            </button>
          </footer>
        ) : null}

        {playState.stage === "SCORE" ? (
          <footer className="kalambury-stage-footer kalambury-playbar kalambury-stage-footer--verdict-layout">
            <div className="kalambury-verdict-strip__bonus">
              <span className="kalambury-verdict-strip__plus">+1</span>
              <span>
                punkt dla prezentera: <strong>{presenter?.name ?? "-"}</strong>,
                jesli uwazacie, ze zasluzyl/a
              </span>
            </div>
            <div className="kalambury-verdict-actions">
              <button
                className={
                  presenterBonus
                    ? "kalambury-switch kalambury-switch--active"
                    : "kalambury-switch"
                }
                type="button"
                onClick={() => setPresenterBonus((current) => !current)}
              >
                <span>{presenterBonus ? "WLACZONE" : "WYLACZONE"}</span>
                <span className="kalambury-switch__thumb" />
              </button>
              <button
                className="kalambury-footer-button kalambury-footer-button--ghost"
                type="button"
                onClick={handleBackFromScore}
              >
                Wroc
              </button>
              <button
                className="kalambury-footer-button kalambury-footer-button--primary"
                type="button"
                disabled={!scoreResolutionValid}
                onClick={handleResolveScore}
              >
                {getAdvanceLabel()}
              </button>
            </div>
          </footer>
        ) : null}

        {playState.stage === "FINISHED" ? (
          <footer className="kalambury-stage-footer kalambury-playbar kalambury-stage-footer--split">
            <button
              className="kalambury-footer-button kalambury-footer-button--ghost"
              type="button"
              onClick={onBackToHub}
            >
              Wroc do menu gry
            </button>
            <button
              className="kalambury-footer-button kalambury-footer-button--primary"
              type="button"
              onClick={onBackToHub}
            >
              Powrot do menu
            </button>
          </footer>
        ) : null}

        <KalamburyPresenterQrModal
          isOpen={presenterReconnectRequired}
          sessionCode={sessionCode}
          controllerHref={
            sessionCode
              ? `/games/kalambury/controller/${sessionCode}`
              : undefined
          }
          dismissible={false}
          onClose={() => {}}
          connected={false}
        />
      </section>
    </main>
  );
}
