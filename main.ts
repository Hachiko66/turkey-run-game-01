// Gobble Dash — the entry program for turkey-run-game-01.
//
// This program is the hand-in: it gathers the game and its screenshots from
// this repository, lays them out in the output directory, and writes the
// dossier the judge reads, using the vendored make.fun library.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The grader runs it twice in a fresh container (Node 22, standard library
// only, no network, read-only repository, writable /output) and both runs must
// produce identical bytes. Nothing here reads the environment except the
// output-directory override the kit documents, and nothing writes outside it.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');

function copyTree(from, to) {
  if (!existsSync(from)) return;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

// Start from a clean output directory so a stale file can never leak into the
// entry: the grader compares the two runs byte for byte.
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

copyTree(gameDir, join(outputDir, 'game'));
copyTree(shotsDir, join(outputDir, 'screenshots'));

// The dossier is built from the copied files, exactly as the gate rebuilds it:
// same text cap, same screenshot limits, same game caps as the scorer's own.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
