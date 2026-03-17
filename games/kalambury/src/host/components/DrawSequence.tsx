import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  KalamburyPlayState,
  KalamburySetupPayload,
} from "../../runtime/state-machine";

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

export type DrawSequenceProps = {
  players: KalamburySetupPayload["players"];
  pendingDrawState: KalamburyPlayState;
  onComplete: (finalState: KalamburyPlayState) => void;
  onSkip: () => void;
  canSkip: boolean;
};

const drawAnimationDurations = {
  fanout: 220,
  rouletteTick: 90,
  rouletteLoops: 9,
  flip: 260,
  stack: 220,
  deal: 320,
};

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

function getCardStyle(
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

export function DrawSequence({
  players,
  pendingDrawState,
  onComplete,
  onSkip,
  canSkip,
}: DrawSequenceProps) {
  const [drawSequenceCards, setDrawSequenceCards] = useState<DrawSequenceCard[]>(
    () =>
      players.map((player) => ({
        player,
        revealed: false,
        orderIndex: null,
      })),
  );
  const [drawAnimationPhase, setDrawAnimationPhase] =
    useState<DrawAnimationPhase>("fanout");
  const [drawSequenceBounds, setDrawSequenceBounds] = useState({
    width: 0,
    height: 0,
  });
  const [drawRouletteStep, setDrawRouletteStep] = useState(0);
  const [currentDrawRevealIndex, setCurrentDrawRevealIndex] = useState(0);
  const [activeDrawCardId, setActiveDrawCardId] = useState<string | null>(null);
  const drawAnimationTimerRef = useRef<number | null>(null);
  const drawSequenceRef = useRef<HTMLDivElement | null>(null);

  const turnOrderPlayers = useMemo(
    () =>
      pendingDrawState.turnOrderIds.reduce<
        Array<KalamburySetupPayload["players"][number]>
      >((accumulator, playerId) => {
        const player = players.find(
          (candidate) => candidate.id === playerId,
        );
        if (player) {
          accumulator.push(player);
        }
        return accumulator;
      }, []),
    [pendingDrawState, players],
  );

  const turnOrderGridClassName =
    turnOrderPlayers.length >= 9
      ? "kalambury-order-grid kalambury-order-grid--dense"
      : turnOrderPlayers.length >= 5
        ? "kalambury-order-grid kalambury-order-grid--compact"
        : turnOrderPlayers.length % 2 === 1
          ? "kalambury-order-grid kalambury-order-grid--orphan"
          : "kalambury-order-grid";

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
      drawAnimationPhase === "idle" ||
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

      // "deal" phase complete — notify parent
      drawAnimationTimerRef.current = null;
      onComplete(pendingDrawState);
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
    onComplete,
  ]);

  // LOSOWANIE stage — animated draw sequence
  if (isDrawAnimating && drawAnimationPhase !== "deal") {
    return (
      <div className="kalambury-stage-panel kalambury-stage-panel--draw">
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
              style={getCardStyle(
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
      </div>
    );
  }

  // KOLEJNOSC stage — order display
  return (
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
  );
}
