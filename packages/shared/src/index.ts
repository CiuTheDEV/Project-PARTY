export function createSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

export {
  getCatalogGameById,
  getVisibleCatalogGames,
  isCatalogGameLaunchable,
} from "./catalog.ts";
export { createSessionCode, normalizeSessionCode } from "./session.ts";
