import { createSessionCode } from "@project-party/shared";
import type {
  SessionCreateRequest,
  SessionCreateResponse,
} from "@project-party/types";
import { createSessionRecord } from "./session-store.ts";

export async function createSession(
  request: SessionCreateRequest,
): Promise<SessionCreateResponse> {
  const sessionId = crypto.randomUUID();
  const sessionCode = createSessionCode();

  createSessionRecord(request, sessionId, sessionCode);

  return { sessionId, sessionCode };
}
