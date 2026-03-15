type FetcherLike = {
  fetch: (input: Request | URL | string, init?: RequestInit) => Promise<Response>;
};

type WebEnv = {
  API: FetcherLike;
  ASSETS: FetcherLike;
};

export default {
  async fetch(request: Request, env: WebEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return env.API.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};
