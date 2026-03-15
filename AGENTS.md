# AGENTS.md

To repo jest przeznaczone zarówno dla ludzi, jak i dla agentów kodujących.

## Kolejność czytania przed zmianami

Przed dotknięciem kodu przeczytaj w tej kolejności:
1. `docs/PROJECT_CONTEXT.md`
2. `docs/REPO_ARCHITECTURE.md`
3. `docs/TECH_STACK.md`
4. `docs/GAME_MODULE_STANDARD.md`
5. `docs/RUNTIME_CONTRACT.md`
6. `docs/CODEX_WORKFLOW.md`

Czytaj dodatkowe pliki tylko wtedy, gdy zadanie tego wymaga.

Jeśli zadanie dotyczy:
- dodawania nowej gry z remote transportem,
- Cloudflare Workers,
- Durable Objects,
- deployu gry na production,

przeczytaj dodatkowo `docs/CLOUDFLARE_GAME_DEPLOY.md`.

Traktuj jako archiwum, a nie source of truth:
- `docs/plans/`
- `docs/PRD/`
- mockupy i stare artefakty wizualne w `docs/mockups/` oraz `docs/MOCUPS/`

## Zasady nienegocjowalne

- Traktuj Project Party jako **hub + autonomiczne moduły gier**.
- Nie zakładaj jednego globalnego modelu rozgrywki.
- Nie zakładaj, że każda gra używa modelu `host + telefony`.
- Nie przenoś logiki konkretnej gry do platformy bez wyraźnego powodu.
- Nie buduj „sprytnego” wspólnego gameplay engine tylko dlatego, że dwa pliki wyglądają podobnie.
- Najpierw użyj istniejących `packages/`, dopiero potem twórz nowe abstrakcje.
- Gdy zmieniasz kontrakt integracyjny gry, zaktualizuj odpowiednie pliki w `docs/`.

## Granice odpowiedzialności

### Platforma (`apps/web`, `apps/worker`)
Może posiadać:
- hub,
- routing platformy,
- tworzenie sesji,
- dołączanie do sesji,
- platformowe UI,
- lekkie współdzielone API.

Nie może posiadać:
- scoringu konkretnej gry,
- stage flow konkretnej gry,
- internal state machine konkretnej gry,
- reguł rund konkretnej gry.

### Pakiety współdzielone (`packages/*`)
Mogą posiadać:
- typy,
- utils,
- design tokens,
- komponenty UI,
- runtime contract,
- helpery dla autorów gier.

Nie powinny posiadać:
- semantyki jednej gry,
- custom flow kalamburów, tajniaków itd.

### Gry (`games/*`)
Powinny posiadać:
- metadata,
- settings schema,
- runtime entrypoint,
- własne ekrany,
- własną logikę,
- własne zasady sesji jeśli to potrzebne.

## Sposób pracy

Gdy zadanie jest większe:
1. określ wpływ architektoniczny,
2. wskaż obszary repo,
3. dopiero potem implementuj.

Gdy zadanie jest lokalne:
- preferuj najmniejszą bezpieczną zmianę,
- trzymaj ją jak najbliżej właściciela odpowiedzialności.

## Oczekiwany format odpowiedzi przy pracy w repo

Gdy to ma sens, raportuj:
1. Plan
2. Zmienione pliki
3. Walidację
4. Ryzyka

## Stop condition

Zatrzymaj się po wykonaniu zadanego scope.
Nie wchodź w dodatkowy polish i poboczne refaktory, jeśli nie zostało to wyraźnie zlecone.
