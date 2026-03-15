import { handleRequest } from "./http.ts";
import {
  SessionDurableObject,
} from "./durable-object.ts";
import type { DurableObjectNamespaceLike } from "./session-store.ts";

export type WorkerEnv = {
  SESSIONS?: DurableObjectNamespaceLike;
};

export { SessionDurableObject };

export default {
  fetch(request: Request, env: WorkerEnv) {
    return handleRequest(request, env);
  },
};
