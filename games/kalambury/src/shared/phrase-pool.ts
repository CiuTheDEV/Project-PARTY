// games/kalambury/src/shared/phrase-pool.ts
//
// Persystencja puli haseł bez powtórzeń, per kategoria i poziom trudności.
// Wzorzec identyczny z Tajniacy (words.ts).

import { phraseCatalog } from "../runtime/phrase-catalog";

const STORAGE_PREFIX = "kalambury_used_phrases";

function storageKey(categoryId: string, difficulty: "easy" | "hard"): string {
  return `${STORAGE_PREFIX}_${categoryId}_${difficulty}`;
}

export function loadUsedPhrases(
  categoryId: string,
  difficulty: "easy" | "hard",
): string[] {
  try {
    const raw = localStorage.getItem(storageKey(categoryId, difficulty));
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function saveUsedPhrases(
  categoryId: string,
  difficulty: "easy" | "hard",
  usedPhrases: string[],
): void {
  try {
    localStorage.setItem(
      storageKey(categoryId, difficulty),
      JSON.stringify(usedPhrases),
    );
  } catch {
    // localStorage niedostępny
  }
}

export function resetUsedPhrases(
  categoryId: string,
  difficulty: "easy" | "hard",
): void {
  try {
    localStorage.removeItem(storageKey(categoryId, difficulty));
  } catch {
    // localStorage niedostępny
  }
}

export function resetAllUsedPhrasesForCategory(categoryId: string): void {
  resetUsedPhrases(categoryId, "easy");
  resetUsedPhrases(categoryId, "hard");
}

/** Ile haseł dostępnych (nieużytych) w danej kategorii i trudności. */
export function getAvailableCount(
  categoryId: string,
  difficulty: "easy" | "hard",
): number {
  const catalog = phraseCatalog[categoryId];
  if (!catalog) return 0;
  const base = catalog[difficulty];
  const used = loadUsedPhrases(categoryId, difficulty);
  return base.filter((p) => !used.includes(p)).length;
}

/** Łączna liczba haseł w danej kategorii i trudności. */
export function getTotalCount(
  categoryId: string,
  difficulty: "easy" | "hard",
): number {
  return phraseCatalog[categoryId]?.[difficulty]?.length ?? 0;
}

/**
 * Pobiera dostępną pulę haseł dla kategorii + trudności.
 * Jeśli pula wyczerpana — auto-reset i zwróć pełną pulę.
 */
export function getAvailablePhrases(
  categoryId: string,
  difficulty: "easy" | "hard",
): string[] {
  const catalog = phraseCatalog[categoryId];
  if (!catalog) return [];
  const base = catalog[difficulty];
  if (!base || base.length === 0) return [];
  const used = loadUsedPhrases(categoryId, difficulty);
  const available = base.filter((p) => !used.includes(p));
  if (available.length > 0) return available;
  // Pula wyczerpana — reset i zwróć pełną
  resetUsedPhrases(categoryId, difficulty);
  return [...base];
}

/**
 * Losuje hasło z dostępnej puli i oznacza jako użyte.
 * Zwraca hasło i czy nastąpił auto-reset puli.
 */
export function drawPhrase(
  categoryId: string,
  difficulty: "easy" | "hard",
): { phrase: string; poolReset: boolean } {
  const catalog = phraseCatalog[categoryId];
  if (!catalog) return { phrase: "Kalambury", poolReset: false };
  const base = catalog[difficulty];
  if (!base || base.length === 0) return { phrase: "Kalambury", poolReset: false };

  const used = loadUsedPhrases(categoryId, difficulty);
  const available = base.filter((p) => !used.includes(p));
  const poolReset = available.length === 0;
  const pool = poolReset ? [...base] : available;

  const phrase = pool[Math.floor(Math.random() * pool.length)] ?? "Kalambury";

  const nextUsed = poolReset ? [phrase] : [...used, phrase];
  saveUsedPhrases(categoryId, difficulty, nextUsed);

  return { phrase, poolReset };
}

/**
 * Oznacza hasło jako użyte (np. przy rerollu).
 */
export function markPhraseUsed(
  categoryId: string,
  difficulty: "easy" | "hard",
  phrase: string,
): void {
  const used = loadUsedPhrases(categoryId, difficulty);
  if (!used.includes(phrase)) {
    saveUsedPhrases(categoryId, difficulty, [...used, phrase]);
  }
}
