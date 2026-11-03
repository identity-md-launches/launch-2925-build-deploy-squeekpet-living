# SqueekPet design system

## Overview

SqueekPet is a mobile-first pet game for short visits, with an original 16-bit bedroom as the primary surface. Cream surroundings and pastel greens keep the room calm; wooden and patchwork pixel details provide the character. Product and adoption appear on the first 390px screen. Once adopted, the room, four compact stats and five care actions fit above the mobile navigation.

Source of truth: `src/styles.css`, `src/App.tsx`, `src/components/Habitat.tsx` and the shared art in `src/art.ts`. This document describes the implemented export, not proposed components.

## Colors

The existing system uses sRGB hex. Shared semantics are in `src/styles.css:12`; illustration palettes are intentionally local to the SVG/Canvas art.

| Token | Value | Role |
| --- | --- | --- |
| `--bg-page` | `#f7f7ed` | Cream page |
| `--bg-surface` | `#fffef7` | Controls, room strip, wheel panel, dialog |
| `--bg-soft` | `#edf0e1` | Quiet secondary surfaces |
| `--bg-mint` | `#e5ecd9` | Soft green grouping |
| `--text-primary` | `#354631` | Headings and main text |
| `--text-secondary` | `#5c684f` | Supporting text and captions |
| `--accent-solid` | `#4f6c43` | Primary button fill |
| `--accent-hover` | `#3d5734` | Primary hover |
| `--border` | `#dce1ce` | Structural boundaries |
| `--focus` | `#375c88` | 3px keyboard outline, offset 4px |
| `--warning-bg` | `#faedda` | Recoverable storage/feed error surface |
| `--warning-text` | `#794d32` | Error text |

The pet overview uses `#e9eede`. Fullness, happiness, energy and cleanliness fills use `#c2a071`, `#bf9690`, `#aba47a` and `#87a69a`; labels and numeric meters also communicate state. A live connection has explicit source/freshness wording, rather than relying on a green dot.

Measured declared pairs: primary/page 9.40:1, secondary/page 5.49:1, secondary/pet panel 5.00:1, primary-button `#fffef5`/`#4f6c43` 5.83:1, focus/page 6.39:1. The rendered entry probe and axe scans also checked their actual resolved backgrounds; illustration-wide contrast and every focus/background intersection are not certified. Day/night changes the artwork, not the page theme.

## Typography

Both fonts are bundled as Latin variable WOFF2 files under `public/fonts/`, with licenses alongside them. `@font-face` supplies weights 400–700 with `font-display: swap`. Browser font loading was checked.

- **Pixelify Sans**, then Nunito/sans-serif: logo, page titles, pet names, evolution names, runner score, keepsake art. It is the one pixel signature; long prose stays in Nunito.
- **Nunito**, then `ui-rounded`, system-ui/sans-serif: body, buttons, labels and instructions. Used weights are 400, 600 and 700.
- Six token sizes: `--text-xs` 12px; `--text-sm` 14px; `--text-base` 16px; `--text-lg` 20px; `--text-xl` 28px; `--text-display` 40px. Page headings become 28px on compact layouts. Mobile text inputs remain 16px.
- Titles use 1.12 line height and −0.025em tracking (−0.015em on phones). Headings balance; prose wraps naturally/pretty. Body is 1.5, longer help and rules 1.7–1.75. No tracked capital kicker labels.
- Changing values use tabular numerals. Names wrap rather than ellipsize; IDs wrap in disclosed details. Numeric meter suffixes hide on phones to keep labels readable.

## Layout

Spacing uses mostly 4/8px increments, with 12–14px internal gaps and 22–28px between meaningful groups. Main content is at most 1200px including 36px side padding. The header is at most 1320px. Normal desktop Home has a flexible 800px-ish scene column plus a 292px companion column, separated by 26px. At 1440px, the companion column is 300px and the gap 28px.

The habitat keeps an 800:460 art ratio. Its caption and care strip remain HTML, outside the art, so text does not become pixel texture. Controls sit below the scene. My Pet uses two columns; Evolution uses a three-stage row plus a rules/telemetry column; Shop uses three columns.

Implemented breakpoints in `src/styles.css`:

| Width | Behavior |
| --- | --- |
| ≤1150px | Tighter header/columns; room light utility hides temporarily to keep navigation readable |
| ≤950px | Five-item bottom navigation; app scroll viewport ends above it, including safe-area inset; 28px main inset |
| ≤730px | Home stacks; companion information uses two columns where space allows; Shop becomes two columns; title is 28px |
| ≤480px | 16px main inset; compact two-column stats appear beside care; five care targets stay in one row; My Pet stacks; evolution stages become horizontal rows; runner uses its 500-unit world |
| ≤390px | Runner overlays hide their decorative pixel icon, use the 20px `--text-lg` heading and 12px 17px panel padding; all instructions and action buttons remain visible inside the trail |
| ≤350px | Remove the redundant room subtitle and light utility; tighten gaps while preserving all main controls |

The fixed bottom nav occupies its own reserved viewport area, so it cannot cover scrolling text. `overflow-anchor: none` and a route effect reset page scroll and focus the main landmark after hash navigation. Focusable content can scroll normally inside the app. Widths 320, 390, 768 and 1440 were checked across all five routes. These widths are reflow checks, not a native browser zoom certification.

## Elevation & Depth

Most surfaces are flat, separated by tone or a 1px border. Habitat and wheel panel use a border without a shadow. The generated-card preview, runner start overlay and dialog use soft shadows without structural borders. The native dialog backdrop adds `#25352366` and a 4px blur. No gradient text or repeated nested card system is used.

The habitat supplies depth through stepped silhouettes, layers, a pixel shadow and local night tint. It is original vector art; the runner reuses the hamster and draws a layered pixel woodland on Canvas.

## Shapes

Controls are 8–10px rounded rectangles, care actions 9–12px, panels 12–15px and the native dialog 18px. The room's top corners and care strip's bottom corners share a frame; they are not nested raised cards. Pixel art itself uses crisp stepped outlines and a 32-unit hamster sprite, rather than smoothed geometric mascot art.

## Components

| Component/pattern | Source | Use and behavior |
| --- | --- | --- |
| Primary/secondary/text/icon buttons | `src/styles.css:51` | Filled forest primary; neutral bordered secondary; text utility; 40px icon controls, smaller 32px contextual utilities. Native disabled, visible focus, hover only on hover-capable devices. |
| Five-page navigation | `src/App.tsx:70` | Real hash links, `aria-current`, desktop underline; mobile bottom icons and visible labels. |
| `Modal`, `Adoption` | `src/App.tsx:21` | Native modal dialog, focus isolation/Escape, restoration, labeled name field and native radio coats. Save/edit retain progress. |
| `Stats`, `PetOverview` | `src/App.tsx:33` | Labeled numeric meters, consistent stat colors, XP and derived mood. Mobile care has a compact stats variant; the duplicate sidebar stats are hidden. |
| `Habitat` | `src/components/Habitat.tsx` | `pet`, `night`, `active`, `action`, `paused`, `onPet`; original room, pet touch, care animation, purchased furniture and truthful live breeze. |
| `PetSprite`, `PixelIcon` | `src/components/PetSprite.tsx`, `PixelIcon.tsx`, `src/art.ts` | Shared safe original SVG artwork. Pet coat/stage/sleep determine the sprite. Decorative SVGs are hidden from assistive technology. |
| `WheelPanel` | `src/components/WheelPanel.tsx` | Explicit source/freshness, measured time, real units, last-known labels, retry countdown, loading/error/empty states and documented source link. |
| `Runner` | `src/components/Runner.tsx` | Ready/running/paused/over states, native Start/Jump/Pause/Restart buttons, canvas pointer and keyboard controls, hidden-tab pause. Both Resume controls return focus to the canvas for Space/Arrow Up play. The landscape only runs during play. |
| `PetCard` | `src/components/PetCard.tsx` | Actual progress renders into 900×1100 PNG; preview, busy state, errors, download and actual X intent link. |
| Shop pattern | `src/App.tsx` | Native pressed-state filter buttons; price, owned count, buy/equip state, disabled insufficient-funds explanation and visible item art. Adoption/purchase buttons and identity submission remain blocked until saved-pet loading succeeds; a failed read keeps the record intact for retry. |

The Home save indicator gives save errors priority: an X with “Changes not saved” replaces the success check. It returns to “Saved on this device” after the pending state commits successfully. The existing persistent warning supplies the retry action on all routes, including compact layouts where the header indicator is hidden.

Ambient CSS motion is inside `prefers-reduced-motion: no-preference`; a habitat pause control pauses the app's CSS animations. Active press uses scale 0.96, named transitions are 150ms, and no `transition: all` is used. Action animations also update stats/cooldowns and a polite status region. Canvas motion is essential, user-started gameplay with an explicit pause; reduced motion does not remove the actual game.

## Do's and Don'ts

- Start another game screen with `page-heading` and the existing main container. Give it one actual task, not a separate marketing hero.
- Reuse semantic colors and the six-size scale. Add new decorative colors inside illustration palettes; supporting text uses the shared readable token.
- Put instructions beside the controls. Use a native button for an action and a real hash/URL link for navigation.
- Reuse the shared hamster in room, runner and cards so progression remains consistent. Keep screenshots and telemetry fixtures out of production components.
- Treat missing API data as unknown. Preserve source, time and freshness labels; never animate a live wheel from random numbers.
- Preserve mobile control space and safe-area layout. Do not place another fixed banner over the game.
- For another screen, add a hash entry in `PAGES`, reuse the heading/button/empty/error patterns, then exercise its main task at 320/390/768/1440 and run the browser and accessibility checks again.

Design guidance was adapted from Jakub Krehel's Better Interface (MIT), and the documentation method from Paul Bakaus's Impeccable (Apache-2.0). Exact upstream references, notices and retained licenses are in `artifacts/THIRD_PARTY_NOTICES.md`.
