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

export function createSessionTransport(
  options: SessionTransportOptions,
): SessionTransport {
  const listeners = new Map<string, Set<RuntimeTransportHandler>>();
  const seenEventIds = new Set<string>();
  const clientId = createClientId();
  const sessionCode = options.sessionCode?.trim().toUpperCase() ?? "";
  const pollIntervalMs = options.pollIntervalMs ?? 800;
  const BroadcastChannelClass = resolveBroadcastChannel(
    options.BroadcastChannelImpl,
  );
  const broadcastChannel =
    BroadcastChannelClass && sessionCode
      ? new BroadcastChannelClass(getChannelName(sessionCode))
      : null;
  let lastOffset = 0;
  let isDestroyed = false;
  let isPolling = false;
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

  async function pollRemote() {
    if (isDestroyed || !sessionCode || isPolling) {
      return;
    }

    isPolling = true;

    try {
      const response = await fetchSessionEventsViaApi(sessionCode, lastOffset);
      lastOffset = Math.max(lastOffset, response.nextOffset);

      for (const eventRecord of response.events) {
        emit(eventRecord);
      }
    } catch {
      // Ignore transient polling failures and retry on the next tick.
    } finally {
      isPolling = false;

      if (!isDestroyed && sessionCode) {
        pollTimer = setTimeout(() => {
          void pollRemote();
        }, pollIntervalMs);
      }
    }
  }

  if (broadcastChannel) {
    broadcastChannel.onmessage = (messageEvent) => {
      if (!isRuntimeTransportEnvelope(messageEvent.data)) {
        return;
      }

      emit(messageEvent.data);
    };
  }

  if (sessionCode) {
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

      if (broadcastChannel) {
        broadcastChannel.onmessage = null;
        broadcastChannel.close();
      }
    },
  };
}
