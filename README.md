# SqueekPet: Living Evolution

A playable, original pixel-art hamster game built for Squeekchain Genesis Code. Adopt a friend, care for them, decorate their bedroom and run the woodland trail. Fresh hardware wheel activity from Squeektoshi can bring a temporary breeze and real, timestamped Wheel Memories.

The finished static site is in **`dist/`**, alongside the complete React, TypeScript and Tailwind source and `package-lock.json`. There is no wallet, backend, private key, payment or account requirement. Acorns are fictional game currency; the downloadable pet card is a PNG keepsake, not an NFT.

## Install, preview and rebuild

Use Node.js 22.18+ or 24 and npm.

```sh
npm ci
npm run dev
```

Create and preview the production export:

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

Vite prints the preview address. Serve `dist/` with any static HTTP host. `base: './'` produces relative asset URLs, and the five pages use hash navigation, so gateway subpaths work without rewrite rules. Required fonts, art, favicon and social image are local. The only runtime network dependency is the optional public wheel API. After the game has loaded, care, the shop, runner and PNG export work if that API becomes unavailable. An offline reload of the entire site requires the host/browser to have cached its assets; this version does not install a service worker.

Do not submit dependency folders, caches or downloaded browser binaries. This delivery builds in an isolated temporary directory; none of those directories is in the submitted tree. No ignore file was added or changed.

## Play

- **Home:** adopt a free hamster, choose Honey, Snow or Cocoa, and name them. Adoption includes 30 Acorns. Feed, Play, Sleep, Clean and Exercise change real game state. Free seeds are unlimited; the snack picker uses purchased food. Cooldowns are 8, 15, 5, 20 and 25 seconds respectively.
- **Pet care:** the Fullness meter represents hunger satisfaction. Fullness, happiness, energy and cleanliness decay with elapsed time. Sleep restores 2 energy/minute. Stats stay in 0–100; a hamster can always recover and never permanently dies. Long absences apply at most 72 hours of decay. Every 100 XP earns a level.
- **Wheel Runner:** Space, Arrow Up, a click on the trail or the mobile Jump button makes the hamster jump. Obstacles speed up, seeds can be collected, Escape pauses and a finished run can restart. Earn `floor(score / 40) + seeds` Acorns, limited to 20/run and 60/local calendar day. Partial runs do not pay out. A finished run also earns up to 20 XP.
- **Shop:** buy three consumable snacks and four decorations. Decorations equip on purchase and can be put away or placed again without repurchasing.
- **My Pet:** edit name/coat, inspect earned achievements, download a 900 × 1100 PNG card and open a Share on X intent.
- **Evolution:** inspect all three visual stages, requirements, actual collected events and the wheel rules.

IndexedDB stores one pet at `squeekpet-living-evolution` → `progress` → `pet`. Actions save immediately through a serialized write queue; elapsed state reconciles on load and every 30 seconds. Storage errors remain visible and can be retried. Use one game tab at a time. This is local progress, not a shared account, leaderboard or cloud backup; clearing site data removes it.

## The real wheel

Implementation follows the documented schemas at <https://docs.squeekchain.com/developers/api/>:

| Source | Purpose | Visible-tab polling |
| --- | --- | --- |
| `https://api.squeekchain.com/v1/status` | Schema v1; measurement status, source, freshness, observation/receipt times, RPM and daily distance | 10 seconds |
| `https://api.squeekchain.com/v1/events?category=measurement&limit=40` | Schema v3; accepted measurement milestones with stable event IDs and timestamps | 30 seconds |

`rpmMilli / 1000` yields RPM; `distanceMm / 1000000` yields kilometres. Missing or malformed data is unknown, never an invented zero. Previous values are explicitly marked “last known” on an error or stale connection. Hardware, simulated, replay, derived, sensor-fault, stale, unavailable and loading states are distinguished. The app stops polling hidden tabs, uses browser cache revalidation, times out requests, backs off failures and respects exposed `Retry-After` seconds or HTTP dates across both endpoints. The API documents 1-second status and 5-second event shared caches; these polling intervals are slower.

A breeze requires `hardware`, `online`, `ACTIVE`, positive RPM and observation/receipt clocks within the API freshness window. The observation must also be no more than 60 seconds old for bonuses. Future clock skew beyond 5 seconds disables rewards. The breeze provides +50% care XP and +25% runner score and changes the habitat. It disappears on a browser offline event, status error, ineligible provenance or expiry. It never manufactures XP or Acorns just for elapsed time.

A Wheel Memory requires a supported, accepted **measurement** event, matching installation, after both adoption and the current visit began, no more than 120 seconds old, and correlated with a fresh active hardware reading. Source observation/receipt times are checked. The full event ID is persisted before it can count again. Older visits are not backfilled; simulated, replayed, stale, missing or disconnected telemetry cannot produce memories. The latest 40 measurement events are inspected; this conservative collector does not crawl historical pages.

The event schema does not carry a hardware signature/provenance field. “Verified” means the API reports accepted measurement evidence correlated with current hardware telemetry from that installation. SqueekPet does **not** independently verify device signatures or attest every event's historical provenance. This trust boundary is also stated in the in-game help.

Visual evolution requires both care and memories:

| Stage | Requirements | Appearance |
| --- | --- | --- |
| Little sprout | Adopt, level 1 | Chosen coat |
| Clover companion | Level 3 + 3 memories | Clover sprout |
| Starlight explorer | Level 6 + 8 memories | Clover and starry blue scarf |

## Reproduce browser checks

```sh
npx playwright install chromium
npm run build
npm run test:browser
```

The validator starts and closes its own HTTP server, serves the **production export under `/preview/`**, and isolates test telemetry to its own browser. It uses the actual public API separately for the delivery screenshots. Default evidence goes to `/tmp/squeekpet-browser-evidence`; `npm run test:browser -- --record` writes the reviewable results and screenshots under `artifacts/`.

The source social image can be regenerated with `npm run social` after installing Chromium, followed by `npm run build`. It renders the same original habitat component and local fonts into `public/social.png`.

Recorded local results: **14 rule tests passed, 22 Chromium interaction checks passed, and taste@1 passed all 16 checks**. The automated axe scan reported zero violations on the five routes and help dialog. Mobile widths 320/390, tablet 768 and desktop 1440 were exercised. The live status and events requests both returned HTTP 200, reporting fresh hardware at rest during validation. See [the validation report](artifacts/validation.md), [browser evidence](artifacts/browser-results.json) and [the design system](DESIGN.md).

WebKit launch was attempted but this machine lacks its Linux libraries, so Safari behavior is not certified. Physical phones, a screen reader, native 200% browser zoom, and independently signed hardware evidence were not tested. Real running/milestone branches were checked with isolated schema-shaped fixtures; no real milestone occurred during the live check. The source and evidence distinguish those checks.

## Publication and verification

Revision validation: all four reviewer findings were reproduced and fixed with focused changes to the runner layout/focus and saved-pet guards/status. The rebuilt export passed the typecheck, 14 rule tests, 5 focused Chromium regression checks, all 22 original Chromium interaction checks, and all 16 taste@1 checks. Run `node tests/revision.mjs` after building to repeat the focused regressions. See [revision validation and limitations](artifacts/revision-validation.md), [before-fix evidence](artifacts/revision-before.json), [after-fix evidence](artifacts/revision-after.json), and the required reviewer responses in `.imd-responses.json`. The live API was unreachable during this revision's browser check; it displayed unavailable state and did not block gameplay. WebKit still could not launch because required system libraries are missing. The earlier results above describe the original round, not a new live-hardware observation.

IMD assignment reference: **`3689a751-4d5a-40dc-a80d-ac82dfd51920`**. IMD refused manual publication and explicitly stated that the plane hosts a job website when its job completes. The live URL is therefore pending submission; no separate site/hosting ID was returned. That actual response is recorded in `artifacts/deployment.json`. The complete `dist/` export is the submission artifact for IMD static hosting. No Genesis Code campaign approval or prize eligibility is claimed.

## Source map and notices

`src/game.ts` owns deterministic game rules; `storage.ts` owns IndexedDB; `telemetry.ts` validates/polls the documented API and deduplicates memories; `art.ts` owns the shared hamster sprite. The habitat, runner, card, wheel panel and pixel icons are in `src/components/`. `src/styles.css` is the implemented token/component system; Tailwind v4 is included through the Vite plugin and theme.

Artwork is original SVG/CSS/Canvas. Nunito and Pixelify Sans are bundled with their SIL Open Font Licenses. Runtime/build notices are in `public/THIRD_PARTY_LICENSES.txt`. Interface guidance attribution and its retained license texts are in `artifacts/THIRD_PARTY_NOTICES.md` and `artifacts/interface-guidance-LICENSE.txt`.
