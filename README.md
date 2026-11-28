# Gobble Dash — The Great Turkey Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/Hachiko66/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/Hachiko66/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Thanksgiving is tonight. Farmer Bram has the oven hot and the carving knife
sharp — and Tilly the turkey has other plans. **Gobble Dash** is a complete,
original 2D turkey-escape game that runs offline in a desktop browser from its
own static files: no libraries, no network requests, all art and sound drawn
and synthesized by its own code.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Or serve `game/` with any static server and open `game/index.html`.

## The game

- **Run, jump, hide, dash.** Space / ↑ / click to jump, ↓ to slide and hide in
  a haystack, Shift to dash, ← → to shuffle, P to pause, M to mute.
- **Farmer Bram hunts you.** He patrols the trail, chases when he spots you,
  searches the haystacks when he loses you, and corners you when he gets too
  close — a well-timed dash is the only way out of a corner. The farmer meter
  shows how close dinner is.
- **Dodge the oven and the carving knife.** Ovens glow and burn, knives fall
  with a warning glint, fences must be jumped. Corn is worth grabbing: every
  cob buys a little breathing room.
- **Golden corn, Golden Rush.** A rare golden cob appears every dozen seconds:
  grab it for 6 seconds of invincibility, double score, and a magnet that
  pulls nearby corn toward you. A hit while golden just bounces off.
- **Rolling pumpkins and paired knives.** From the barn on, jack-o'-lanterns
  roll at you faster than the world scrolls — jump them early. In the kitchen,
  knives sometimes drop in staggered pairs.
- **Three stages, one escape.** The farmyard, the barn, then the kitchen —
  faster and meaner as you go, each opening with a stage banner and a chime.
  Reach the forest gate at 1200 m to escape.
- **Complete:** title screen, gameplay with a HUD (score, distance, lives,
  corn, stage, farmer meter), caught / escaped end screens with stats, and
  restart. Synthesized WebAudio sounds and a harvest tune included.

## Layout

- `game/` — the playable game (static files, `index.html` + `src/*.js`)
  - `src/main.js` — game object, loop, state machine, wiring
  - `src/turkey.js` — Tilly: movement, hiding, drawing the bird
  - `src/farmer.js` — Farmer Bram: patrol / chase / search / corner AI
  - `src/world.js` — stages, obstacles, scrolling, backgrounds
  - `src/art.js` — all original canvas art (turkey, farmer, farm, kitchen)
  - `src/audio.js` — WebAudio sounds and music, generated live
  - `src/hud.js` — HUD, menus, end screens, buttons
  - `src/input.js` — keyboard and mouse
  - `src/shots.js` — screenshot staging (`?shot=title|play|caught|escaped`)
- `screenshots/` — real renders of the game itself
- `main.ts` — the entry program: copies `game/` + `screenshots/` to `/output`
  and writes `dossier.json` (run with `MAKEFUN_OUTPUT_DIR=out node main.ts`)
- `vendor/makefun-game.ts` — the kit's library, unchanged

## License

MIT — see [LICENSE](LICENSE).
