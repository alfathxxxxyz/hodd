# H00dle

H00dle is a responsive pixel arcade whitelist campaign game. The player is a Lantern Hunter who collects Whitelist Sparks, uses Soul Flare Orbs to capture vulnerable Drifters, and opens the Mint Gate before the run timer expires.

## Installation

```bash
npm install
npm run dev
```

## Project Structure

- `src/game` contains Phaser scenes, entities, maps, and gameplay systems.
- `src/components` contains the React shell, wallet placeholder, leaderboard, result panel, and mobile controls.
- `src/services/runApi.ts` contains the local mock run API and validation helpers.

## Controls

- Desktop: Arrow keys or WASD.
- Mobile: Swipe on the game board or use the on-screen D-pad.

## Gameplay Rules

- Runs last 120 seconds.
- The player starts with 3 charms.
- Collect Whitelist Sparks and rare Mint Sparks for score.
- Collect Soul Flare Orbs to make ghosts vulnerable for 7 seconds.
- Capture vulnerable ghosts for combo score.
- The Mint Gate opens after 80 collected sparks.
- Enter the open Mint Gate to complete the run.

## Campaign Rules

- Practice mode does not submit ranked scores.
- Ranked mode uses a local mock attempt counter.
- Top 50 scores receive guaranteed whitelist.
- Rank 51 to 200 enter the whitelist raffle.
- Only the highest score per wallet should be shown by a real backend.

## Placeholder Art

Current characters and map art are generated with Phaser primitives for a clean pixel arcade look. Replace or extend these in:

- `src/game/entities/Player.ts`
- `src/game/entities/Hunter.ts`
- `src/game/scenes/GameScene.ts`
- `src/game/maps/level01.ts`

## Backend Integration

Replace the local mock functions in `src/services/runApi.ts` with REST calls:

- `startRun()`
- `submitRun()`
- `getLeaderboard()`

Keep the server authoritative for run validation and final score calculation. The local `ScoreSystem` and `validateRun()` helpers are intentionally reusable so the same rules can be mirrored server-side.
