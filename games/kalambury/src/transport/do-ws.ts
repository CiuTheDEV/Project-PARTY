import type { KalamburyTransport, PlatformTransport } from "./types";

export function createDoWsAdapter(transport: PlatformTransport): KalamburyTransport {
  return {
    send: (event, payload) => transport.send(event, payload),
    on: (event, handler) => transport.on(event, handler),
    destroy() {
      // context.transport is managed by the platform — do not destroy it here
    },
  };
}
