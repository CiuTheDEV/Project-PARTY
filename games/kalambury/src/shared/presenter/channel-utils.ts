// games/kalambury/src/shared/presenter/channel-utils.ts

import type {
  BroadcastChannelConstructor,
  KalamburyPresenterChannel,
  KalamburyPresenterMessage,
} from "./types.ts";
import { isPresenterMessage } from "./types.ts";
// isPresenterMessage is used inside createPresenterChannel's subscribe() handler

export function resolveBroadcastChannel(
  BroadcastChannelImpl?: BroadcastChannelConstructor,
): BroadcastChannelConstructor | null {
  if (BroadcastChannelImpl) return BroadcastChannelImpl;
  if (typeof BroadcastChannel === "undefined") return null;
  return BroadcastChannel as unknown as BroadcastChannelConstructor;
}

export function getChannelName(sessionCode: string): string {
  return `project-party.kalambury.presenter.${sessionCode.toUpperCase()}`;
}

export function createPresenterChannel(
  sessionCode: string,
  BroadcastChannelImpl?: BroadcastChannelConstructor,
): KalamburyPresenterChannel | null {
  const Channel = resolveBroadcastChannel(BroadcastChannelImpl);
  if (!Channel || !sessionCode) return null;

  const channel = new Channel(getChannelName(sessionCode));

  return {
    postMessage(message: KalamburyPresenterMessage) {
      channel.postMessage(message);
    },
    subscribe(handler: (message: KalamburyPresenterMessage) => void) {
      channel.onmessage = (event: MessageEvent<unknown>) => {
        if (!isPresenterMessage(event.data)) return;
        handler(event.data);
      };
      return () => {
        channel.onmessage = null;
      };
    },
    close() {
      channel.close();
    },
  };
}
