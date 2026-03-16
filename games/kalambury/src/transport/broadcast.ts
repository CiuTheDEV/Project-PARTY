import type { KalamburyTransport } from "./types";

type MessageEnvelope = { event: string; payload: unknown };

export function createBroadcastAdapter(sessionCode: string): KalamburyTransport {
  const channel = new BroadcastChannel(`kalambury:${sessionCode}`);
  const handlers = new Map<string, Set<(payload: unknown) => void>>();

  channel.onmessage = (event) => {
    const envelope = event.data as MessageEnvelope;
    if (!envelope?.event) return;
    const eventHandlers = handlers.get(envelope.event);
    if (!eventHandlers) return;
    for (const handler of eventHandlers) {
      handler(envelope.payload);
    }
  };

  return {
    send(event, payload) {
      channel.postMessage({ event, payload } satisfies MessageEnvelope);
    },
    on(event, handler) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
      return () => handlers.get(event)?.delete(handler);
    },
    destroy() {
      handlers.clear();
      channel.close();
    },
  };
}
