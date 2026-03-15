import { normalizeSessionCode } from "@project-party/shared";

export type JoinFlowState = "idle" | "incomplete" | "ready";
export function getJoinFlowState(input: {
  code: string;
  playerName: string;
}): JoinFlowState {
  if (!normalizeSessionCode(input.code) && !input.playerName.trim()) {
    return "idle";
  }

  if (!normalizeSessionCode(input.code) || !input.playerName.trim()) {
    return "incomplete";
  }

  return "ready";
}
