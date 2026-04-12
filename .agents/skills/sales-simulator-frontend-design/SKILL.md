---
name: sales-simulator-frontend-design
description: Use when designing or restyling UI in the 销售模拟器 repo. Applies this project's pixel-game visual language, login and onboarding patterns, character preview workflow, and rules for avoiding generic SaaS-style layouts.
---

# Sales Simulator Frontend Design

Use this skill when editing pages, components, or flows in this repo that should feel like part of the same pixel-world as the game itself.

## Design Direction

- Treat each screen like a scene in a game loop, not a generic app page.
- Prefer bold pixel panels, warm parchment surfaces, deep plum night backgrounds, and neon cyan or amber accents.
- Use the existing customizable character pack to make entry, auth, onboarding, and profile surfaces feel connected to gameplay.
- Headings should feel like UI labels or scene titles. Body copy can be more readable, but avoid plain SaaS card layouts.

## Core Workflow

1. Identify where the screen sits in the player journey.
2. Choose one scene-level metaphor before coding.
   Good defaults in this repo: `entry terminal`, `avatar station`, `shop counter`, `night market kiosk`, `town bulletin`.
3. Reuse or extend shared building blocks when possible:
   - `frontend/src/components/auth/pixel-avatar-preview.tsx`
   - `frontend/src/lib/character-appearance.ts`
   - `frontend/src/app/globals.css` pixel utility classes such as `pixel-frame`, `pixel-subframe`, `pixel-button`, `pixel-chip`
4. If auth or onboarding is involved, make the flow feel playable.
   Examples: selected starter role, progress stages, destination hints, character draft syncing.
5. Verify the design still works on mobile and does not bury the primary action.

## Repo-Specific Rules

- Preserve `image-rendering: pixelated` anywhere sprite previews or in-game assets appear.
- When showing a character, prefer layered previews built from `/resource/32x32 Customizable Character Pack`.
- For auth flows, keep these browser session keys stable unless the task explicitly changes them:
  - `secondme-oauth-state`
  - `sales-simulator-login-appearance`
  - `sales-simulator-login-role`
- If a screen sends the player into the game, communicate the next destination explicitly, such as `角色工坊` or `商店街区`.

## What To Avoid

- Plain centered white cards on flat backgrounds
- Generic loading spinners with no game framing
- Default enterprise dashboards or marketing-site gradients
- Mixing realistic glossy UI with pixel assets unless the contrast is intentional
- Replacing existing game-flavored copy with abstract product language

## Done Criteria

- The screen reads as part of a pixel game world within 2 seconds.
- At least one memorable visual hook exists: avatar bay, HUD header, route panel, tiled stage, scanlines, or pixel stats.
- The main call to action is obvious.
- The page still feels coherent on both desktop and mobile.
