import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { defineConfig } from "vite";

import { handleRequest } from "../worker/src/http.ts";

const repoRoot = path.resolve(__dirname, "../..");

async function readRequestBody(
  request: IncomingMessage,
): Promise<Buffer | undefined> {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
}

async function writeResponse(viteResponse: Response, response: ServerResponse) {
  response.statusCode = viteResponse.status;

  viteResponse.headers.forEach((value, key) => {
    response.setHeader(key, value);
  });

  const body = Buffer.from(await viteResponse.arrayBuffer());
  response.end(body);
}

export default defineConfig({
  plugins: [
    {
      name: "project-party-worker-api",
      configureServer(server) {
        server.middlewares.use(async (request, response, next) => {
          if (!request.url?.startsWith("/api/")) {
            next();
            return;
          }

          const body = await readRequestBody(request);
          const requestOrigin = `http://${request.headers.host ?? "127.0.0.1:5173"}`;
          const workerRequest = new Request(
            new URL(request.url, requestOrigin),
            {
              method: request.method,
              headers: new Headers(
                Object.entries(request.headers).flatMap(([key, value]) =>
                  typeof value === "string"
                    ? [[key, value]]
                    : Array.isArray(value)
                      ? value.map((entry) => [key, entry] as const)
                      : [],
                ),
              ),
              body,
            },
          );

          const workerResponse = await handleRequest(workerRequest);
          await writeResponse(workerResponse, response);
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@project-party/design-system": path.resolve(
        repoRoot,
        "packages/design-system/src/index.ts",
      ),
      "@project-party/game-kalambury": path.resolve(
        repoRoot,
        "games/kalambury/src/index.ts",
      ),
      "@project-party/game-tajniacy": path.resolve(
        repoRoot,
        "games/tajniacy/src/index.ts",
      ),
      "@project-party/game-runtime": path.resolve(
        repoRoot,
        "packages/game-runtime/src/index.ts",
      ),
      "@project-party/game-sdk": path.resolve(
        repoRoot,
        "packages/game-sdk/src/index.ts",
      ),
      "@project-party/shared": path.resolve(
        repoRoot,
        "packages/shared/src/index.ts",
      ),
      "@project-party/types": path.resolve(
        repoRoot,
        "packages/types/src/index.ts",
      ),
      "@project-party/ui": path.resolve(repoRoot, "packages/ui/src/index.tsx"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
});
