# UI_RULES.md

This file defines UI and visual quality rules for Project Party.

## Core Principles

UI should feel:
- intentional,
- premium,
- readable,
- playful,
- polished,
- and clearly part of the Project Party ecosystem.

UI should not feel like:
- a generic SaaS dashboard,
- random AI-generated layout soup,
- unrelated mini-projects taped together,
- or visually dead utility screens.

## Platform Identity

The hub and all game entry menus should feel recognizably connected.

That usually means consistency in:
- typography,
- button language,
- spacing systems,
- icon style,
- motion tone,
- overlay treatment,
- and overall polish.

## Shared Game UI Shell

The `main menu` and `setup screen` of each game should use a shared game UI shell.

This is a platform-level UI rule.
It does not mean that every game must have identical content or identical implementation.

What should stay consistent across games:
- screen hierarchy,
- section rhythm,
- CTA priority,
- spacing logic,
- visual density,
- and the overall sense that the player is still inside the same Project Party product.

What may vary by game:
- copy,
- settings fields,
- supporting illustrations,
- iconography details,
- and color palette / theme tokens.

The visual reference point is the current entry flow quality established by Kalambury and Tajniacy.
Treat them as implementation references, not as files to copy 1:1.

## Suggested Main Menu Anatomy

The exact content depends on the game, but a strong `main menu` usually includes:
- a hero area with the game name, short pitch, and visual identity,
- a primary CTA leading into setup or start,
- a compact area for key info such as player format, device expectations, or match style,
- optional secondary blocks such as rules, modes, or quick explanation,
- a layout that reads clearly from top to bottom without feeling like a dashboard.

Good defaults:
- make the primary action obvious immediately,
- avoid burying the core action under decorative content,
- keep supporting information scannable,
- use the color palette to reinforce identity, not to fight readability.

## Suggested Setup Screen Anatomy

The exact fields depend on the game, but a strong `setup screen` usually includes:
- a clear page header with context and purpose,
- grouped settings sections,
- a stable visual hierarchy between important and optional options,
- a clear start CTA,
- and a predictable way to go back or revise choices.

Good defaults:
- group related options together,
- avoid long unstructured forms,
- keep the most important settings near the top,
- make the final launch action visually decisive,
- preserve readability on both desktop and mobile.

## Game Freedom

Gameplay screens may vary significantly between games.
That is expected.

Shared identity should be strongest in:
- hub,
- game cards,
- filters/search,
- game entry menus,
- game setup screens,
- common controls,
- and cross-game shared components.

## Reuse

Always prefer:
- existing tokens,
- existing shared components,
- existing layout patterns,
- and existing motion rules.

Create game-specific visuals only when the gameplay genuinely needs it.

## Layout

- maintain strong hierarchy
- keep spacing systematic
- avoid random pixel nudging
- avoid cluttered screens
- do not waste huge areas if the screen should feel immersive
- avoid unnecessary mobile scrolling in critical gameplay views

## Buttons and Controls

- label and icon should read as one unit
- CTAs should have clear priority
- important controls must be obvious at a distance when shown on shared screens
- touch targets must be comfortable on phones

## Mobile

- prioritize clarity and fast comprehension
- keep secret or personal information readable without clutter
- avoid tiny targets and fragile layouts

## Shared Screen / TV

- prioritize large-scale readability
- avoid tiny text and brittle dense layouts
- keep core game information stable and visually obvious

## Animation

Animation should add energy and delight, not chaos.

Use motion to:
- guide attention,
- reward actions,
- improve transitions,
- support the party feel.

Do not use motion that:
- makes screens harder to read,
- delays core interactions,
- or feels like the UI drank six energy drinks.
