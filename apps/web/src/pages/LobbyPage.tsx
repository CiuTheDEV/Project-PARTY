import { useEffect, useMemo, useState } from "react";

import { fetchCatalogGamesViaApi } from "../api/platform";
import { GameCard } from "../components/GameCard";
import { PlatformTopbar } from "../components/PlatformTopbar";
import type { CatalogGame } from "../platform/catalog";

type LobbySegment = "all" | "favorites" | "recent";

const segmentOptions: Array<{ label: string; value: LobbySegment }> = [
  { label: "Wszystkie", value: "all" },
  { label: "Ulubione", value: "favorites" },
  { label: "Ostatnie", value: "recent" },
];

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function LobbyPage() {
  const [games, setGames] = useState<CatalogGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSegment, setActiveSegment] = useState<LobbySegment>("all");

  useEffect(() => {
    let isCancelled = false;

    async function loadGames() {
      setIsLoading(true);

      try {
        const loadedGames = await fetchCatalogGamesViaApi();

        if (!isCancelled) {
          setGames(loadedGames);
          setErrorMessage(null);
        }
      } catch {
        if (!isCancelled) {
          setErrorMessage(
            "Nie udalo sie pobrac listy gier. Sprobuj ponownie za chwile.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadGames();

    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredGames = useMemo(() => {
    const query = normalizeText(searchQuery.trim());

    if (!query) {
      return games;
    }

    return games.filter((game) => {
      const haystack = normalizeText(
        `${game.name} ${game.shortDescription} ${game.playMode}`,
      );

      return haystack.includes(query);
    });
  }, [games, searchQuery]);

  return (
    <main className="lobby-page">
      <div className="ambient-orb ambient-orb--primary" aria-hidden="true" />
      <div className="ambient-orb ambient-orb--secondary" aria-hidden="true" />

      <PlatformTopbar />

      <section className="lobby-hero">
        <p className="eyebrow">Project PARTY</p>
        <h1>
          Wybierz gre na <span>dzisiejsza impreze</span>
        </h1>
        <p className="lead">
          Sprawdz, co przygotowalismy dla Twojej ekipy. Od klasycznych
          Kalamburow po kolejne gry, ktore czekaja na domkniecie roadmapy.
        </p>
      </section>

      <section
        className="filters-shell filters-shell--compact"
        aria-label="Nawigacja lobby"
      >
        <div className="filters-capsule filters-capsule--compact">
          <label className="search-field" aria-label="Szukaj gry">
            <span
              className="material-symbols-outlined search-field__icon"
              aria-hidden="true"
            >
              search
            </span>
            <input
              className="search-field__input"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Szukaj gry... (np. Kalambury)"
            />
            <button
              type="button"
              className="search-field__clear"
              onClick={() => setSearchQuery("")}
              aria-label="Wyczysc wyszukiwanie"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                close
              </span>
            </button>
          </label>

          <div
            className="segment-pills"
            role="tablist"
            aria-label="Segmenty lobby"
          >
            {segmentOptions.map((option) => {
              const isActive = activeSegment === option.value;
              const isDisabled = option.value !== "all";

              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-disabled={isDisabled}
                  className={`segment-pill${isActive ? " segment-pill--active" : ""}`}
                  onClick={() => {
                    if (!isDisabled) {
                      setActiveSegment(option.value);
                    }
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="filters-capsule__count">
            {isLoading || errorMessage
              ? "..."
              : `${filteredGames.length} / ${games.length}`}
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="lobby-message" aria-live="polite">
          Ladowanie listy gier...
        </section>
      ) : null}

      {errorMessage ? (
        <section
          className="lobby-message lobby-message--error"
          aria-live="polite"
        >
          {errorMessage}
        </section>
      ) : null}

      {!isLoading && !errorMessage && filteredGames.length === 0 ? (
        <section
          className="lobby-message lobby-message--empty"
          aria-live="polite"
        >
          Brak gier pasujacych do wyszukiwania.
        </section>
      ) : null}

      {!isLoading && !errorMessage && filteredGames.length > 0 ? (
        <section className="games-shell">
          <div className="games-shell__header">
            <h2>Wszystkie gry</h2>
            <p>Widoczne: {filteredGames.length}</p>
          </div>

          <section className="games-section" aria-label="Lista gier">
            {filteredGames.map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </section>
        </section>
      ) : null}
    </main>
  );
}
