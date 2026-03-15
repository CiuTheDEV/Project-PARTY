import {
  fetchSessionEventsViaApi,
  publishSessionEventViaApi,
} from "../api/platform.ts";

type RuntimeTransportEnvelope = {
  id: string;
  event: string;
  payload?: unknown;
  sourceClientId: string;
  createdAt: string;
};

type RuntimeTransportHandler = (payload: unknown) => void;

type BroadcastChannelLike = {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage: (message: unknown) => void;
  close: () => void;
};

type BroadcastChannelConstructor = new (name: string) => BroadcastChannelLike;

type SessionTransportOptions = {
  sessionCode?: string;
  pollIntervalMs?: number;
  BroadcastChannelImpl?: BroadcastChannelConstructor;
};

type SessionTransport = {
  send: (event: string, payload?: unknown) => Promise<void>;
  on: (event: string, handler: RuntimeTransportHandler) => () => void;
  destroy: () => void;
};

function resolveBroadcastChannel(
  BroadcastChannelImpl?: BroadcastChannelConstructor,
) {
  if (BroadcastChannelImpl) {
    return BroadcastChannelImpl;
  }

  if (typeof BroadcastChannel === "undefined") {
    return null;
  }

  return BroadcastChannel;
}

function createClientId() {
  return `client-${Math.random().toString(36).slice(2, 10)}`;
}

function createEnvelope(
  event: string,
  payload: unknown,
  sourceClientId: string,
): RuntimeTransportEnvelope {
  return {
    id: crypto.randomUUID(),
    event,
    payload,
    sourceClientId,
    createdAt: new Date().toISOString(),
  };
}

function isRuntimeTransportEnvelope(
  value: unknown,
): value is RuntimeTransportEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.event === "string" &&
    typeof candidate.sourceClientId === "string" &&
    typeof candidate.createdAt === "string"
  );
}

function getChannelName(sessionCode: string) {
  return `project-party.runtime.${sessionCode.toUpperCase()}`;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

function getWsUrl(sessionCode: string) {
  if (API_BASE) {
    return `${API_BASE.replace(/^https?/, (p) => (p === "https" ? "wss" : "ws"))}/api/sessions/${sessionCode}/ws`;
  }
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${location.host}/api/sessions/${sessionCode}/ws`;
}

export function createSessionTransport(
  options: SessionTransportOptions,
): SessionTransport {
  const listeners = new Map<string, Set<RuntimeTransportHandler>>();
  const seenEventIds = new Set<string>();
  const clientId = createClientId();
  const sessionCode = options.sessionCode?.trim().toUpperCase() ?? "";
  const pollIntervalMs = options.pollIntervalMs ?? 1500;
  const BroadcastChannelClass = resolveBroadcastChannel(
    options.BroadcastChannelImpl,
  );
  const broadcastChannel =
    BroadcastChannelClass && sessionCode
      ? new BroadcastChannelClass(getChannelName(sessionCode))
      : null;
  let lastOffset = 0;
  let isDestroyed = false;
  let ws: WebSocket | null = null;
  let wsReady = false;
  let wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let pollTimer: ReturnType<typeof setTimeout> | null = null;

  function emit(envelope: RuntimeTransportEnvelope) {
    if (seenEventIds.has(envelope.id)) {
      return;
    }

    seenEventIds.add(envelope.id);

    if (envelope.sourceClientId === clientId) {
      return;
    }

    const handlers = listeners.get(envelope.event);
    if (!handlers) {
      return;
    }

    for (const handler of handlers) {
      handler(envelope.payload);
    }
  }

  // --- WebSocket path ---

  function connectWebSocket() {
    if (isDestroyed || !sessionCode) {
      return;
    }

    try {
      ws = new WebSocket(getWsUrl(sessionCode));
    } catch {
      schedulePollFallback();
      return;
    }

    ws.onopen = () => {
      wsReady = true;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as unknown;
        if (isRuntimeTransportEnvelope(data)) {
          if (data.offset !== undefined) {
            lastOffset = Math.max(lastOffset, (data as { offset: number }).offset);
          }
          emit(data);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      wsReady = false;
      ws = null;

      if (!isDestroyed) {
        // Reconnect after 2s, fall back to poll in the meantime
        schedulePollFallback();
        wsReconnectTimer = setTimeout(() => {
          wsReconnectTimer = null;
          connectWebSocket();
        }, 2000);
      }
    };

    ws.onerror = () => {
      // onclose fires right after, handled there
    };
  }

  // --- Poll fallback (used when WS is not yet connected / reconnecting) ---

  async function pollRemote() {
    if (isDestroyed || !sessionCode || wsReady) {
      return;
    }

    try {
      const response = await fetchSessionEventsViaApi(sessionCode, lastOffset);
      lastOffset = Math.max(lastOffset, response.nextOffset);

      for (const eventRecord of response.events) {
        emit(eventRecord);
      }
    } catch {
      // Ignore transient polling failures
    } finally {
      if (!isDestroyed && !wsReady) {
        pollTimer = setTimeout(() => {
          void pollRemote();
        }, pollIntervalMs);
      }
    }
  }

  function schedulePollFallback() {
    if (pollTimer || isDestroyed || wsReady) {
      return;
    }
    void pollRemote();
  }

  // --- BroadcastChannel (local same-browser) ---

  if (broadcastChannel) {
    broadcastChannel.onmessage = (messageEvent) => {
      if (!isRuntimeTransportEnvelope(messageEvent.data)) {
        return;
      }

      emit(messageEvent.data);
    };
  }

  if (sessionCode) {
    // Try WS first; poll fallback kicks in automatically via onclose/schedulePollFallback
    connectWebSocket();
    // Also start polling immediately so there's no gap during WS handshake
    void pollRemote();
  }

  return {
    async send(event, payload) {
      const envelope = createEnvelope(event, payload, clientId);

      seenEventIds.add(envelope.id);
      broadcastChannel?.postMessage(envelope);

      if (!sessionCode) {
        return;
      }

      await publishSessionEventViaApi(sessionCode, envelope);
    },
    on(event, handler) {
      const handlers = listeners.get(event) ?? new Set<RuntimeTransportHandler>();
      handlers.add(handler);
      listeners.set(event, handlers);

      return () => {
        const currentHandlers = listeners.get(event);

        if (!currentHandlers) {
          return;
        }

        currentHandlers.delete(handler);

        if (currentHandlers.size === 0) {
          listeners.delete(event);
        }
      };
    },
    destroy() {
      isDestroyed = true;
      listeners.clear();

      if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
      }

      if (wsReconnectTimer) {
        clearTimeout(wsReconnectTimer);
        wsReconnectTimer = null;
      }

      if (ws) {
        ws.onclose = null;
        ws.close();
        ws = null;
      }

      if (broadcastChannel) {
        broadcastChannel.onmessage = null;
        broadcastChannel.close();
      }
    },
  };
}
