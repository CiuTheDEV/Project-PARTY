import { createSessionCode } from "@project-party/shared";
import type {
  SessionCreateRequest,
  SessionCreateResponse,
} from "@project-party/types";
import { createSessionRecord } from "./session-store.ts";
import type { WorkerEnv } from "./cloudflare-entry.ts";

export async function createSession(
  request: SessionCreateRequest,
  env?: WorkerEnv,
): Promise<SessionCreateResponse> {
  const sessionId = crypto.randomUUID();
  const sessionCode = createSessionCode();

  await createSessionRecord(request, sessionId, sessionCode, env);

  return { sessionId, sessionCode };
}
