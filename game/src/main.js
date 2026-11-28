// main.js — Gobble Dash: the great turkey escape.
// One job: own the game object, run the loop, and wire the pieces together —
// input, turkey, farmer, world, audio, HUD and screenshot staging. The states
// are title → playing → caught / escaped, with pause and restart throughout.

import { createTurkey, resetTurkey, turkeyJump, turkeySlide, turkeyDash, turkeyHide, turkeyUnhide, turkeyHurt, updateTurkey, drawTurkey, turkeyBounds } from './turkey.js';
import { createFarmer, resetFarmer, updateFarmer, farmerStumblePenalty, farmerDashEscape, farmerCaught, farmerScreenX, drawFarmer, FARMER_STATES } from './farmer.js';
import { createWorld, resetWorld, updateWorld, worldEscaped, nearestHaystack, obstaclesHitTurkey, collectCorn, collectGolden, magnetCorn, drawWorldBackground, drawWorldObjects, WORLD, STAGES } from './world.js';
import { createAudio, ensureAudioContext, setMuted, startMusic, stopMusic, playGobble, playJump, playDash, playPickup, playGolden, playShieldBlock, playStageChime, playHide, playSpotted, playHit, playCaught, playEscapeFanfare } from './audio.js';
import { createInput, attachInput, consumeFrameEdges, pointInRect } from './input.js';
import { drawHud, drawDashCooldown, drawGoldenBadge, drawStageBanner, drawTitleScreen, drawEndScreen, drawPausedOverlay, drawSpottedBanner, drawHiddenBadge, BUTTONS, drawButton } from './hud.js';
import { shotParam, stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');

function loadBestScore() {
  try {
    return Number(window.localStorage.getItem('gobble-dash-best') || 0) || 0;
  } catch (err) {
    return 0;
  }
}

function saveBestScore(score) {
  try {
    window.localStorage.setItem('gobble-dash-best', String(score));
  } catch (err) {
    // Private mode or a host that blocks storage: the best score just lives in memory.
  }
}

export function createGame() {
  const game = {
    canvas,
    ctx,
    state: 'title',
    time: 0,
    score: 0,
    scoreFrac: 0,
    distance: 0,
    corn: 0,
    bestScore: loadBestScore(),
    endStats: { score: 0, distance: 0, corn: 0 },
    paused: false,
    frozen: false,
    hoverButton: null,
    lastSpottedState: null,
    lastStageIndex: 0,
    blinkTimer: 0,
    blink: false,
    turkey: createTurkey(),
    farmer: createFarmer(),
    world: createWorld(),
    audio: createAudio(),
    input: createInput(),
    drawTitleCast: (c, t) => drawTitleCast(game, c, t),
  };
  game.turkey.lives = 3;
  return game;
}

const game = createGame();
attachInput(game.input, canvas);

function setStatus(text) {
  if (statusLine) statusLine.textContent = text;
}

export function startRun(g) {
  resetTurkey(g.turkey);
  resetFarmer(g.farmer);
  resetWorld(g.world);
  g.score = 0;
  g.scoreFrac = 0;
  g.distance = 0;
  g.corn = 0;
  g.state = 'playing';
  g.paused = false;
  g.frozen = false;
  g.lastSpottedState = null;
  g.lastStageIndex = 0;
  ensureAudioContext(g.audio);
  startMusic(g.audio);
  playGobble(g.audio);
  setStatus('The escape begins. Farmer Bram is on your trail — run!');
}

function endRun(g, escaped) {
  g.state = escaped ? 'escaped' : 'caught';
  g.endStats = { score: g.score, distance: Math.floor(g.distance), corn: g.corn };
  if (g.score > g.bestScore) {
    g.bestScore = g.score;
    saveBestScore(g.score);
  }
  stopMusic(g.audio);
  if (escaped) {
    playEscapeFanfare(g.audio);
    setStatus(`Escaped! Score ${g.score}, distance ${Math.floor(g.distance)} metres, ${g.corn} corn.`);
  } else {
    playCaught(g.audio);
    setStatus(`Caught by Farmer Bram. Score ${g.score}, distance ${Math.floor(g.distance)} metres.`);
  }
}

function handleHit(g, obstacle) {
  const now = g.time;
  if (g.turkey.goldenTimer > 0) {
    // Golden Rush: the hit bounces off with a clink, no life lost. A short
    // block cooldown keeps one long overlap from clinking every frame.
    if (now < g.turkey.invulnerableUntil) return;
    g.turkey.invulnerableUntil = now + 0.9;
    g.world.shake = 0.25;
    playShieldBlock(g.audio);
    setStatus('Golden Rush blocks the hit — keep running!');
    return;
  }
  if (!turkeyHurt(g.turkey, now)) return;
  g.world.shake = 0.7;
  g.world.flash = 0.5;
  farmerStumblePenalty(g.farmer, 65);
  playHit(g.audio);
  if (obstacle.kind === 'oven') {
    setStatus('Ouch — the oven! One life lost, and Farmer Bram closes in.');
  } else if (obstacle.kind === 'knife') {
    setStatus('The carving knife! One life lost, and Farmer Bram closes in.');
  } else {
    setStatus('Tripped on the fence! One life lost, and Farmer Bram closes in.');
  }
  if (g.turkey.lives <= 0) endRun(g, false);
}

function updatePlaying(g, dt) {
  const { input, turkey, farmer, world, audio } = g;
  const now = g.time;

  if (input.jumpPressed) {
    if (turkeyJump(turkey, now)) playJump(audio);
  }
  if (input.dashPressed) {
    if (turkeyDash(turkey)) {
      playDash(audio);
      if (farmerDashEscape(farmer)) setStatus('A dash breaks the corner — Farmer Bram stumbles!');
    }
  }
  if (input.down) turkeySlide(turkey);
  if (input.hidePressed) {
    const hay = nearestHaystack(world, turkey.x);
    if (hay && turkeyHide(turkey, hay, now)) {
      hay.used = true;
      playHide(audio);
      setStatus('Hidden in the hay — hold still while Farmer Bram searches.');
    }
  }
  if (turkey.hidden && !input.down && turkey.hideTimer > 0.35) {
    turkeyUnhide(turkey);
  }

  updateTurkey(turkey, dt, input, now, WORLD.groundY);
  const dashing = turkey.dashTimer > 0;
  updateWorld(world, dt, dashing);
  updateFarmer(farmer, dt, turkey, world, now);

  // The farmer's mood changes are worth a sound and a status line.
  if (farmer.state === FARMER_STATES.CHASE && g.lastSpottedState !== FARMER_STATES.CHASE) {
    playSpotted(audio);
    setStatus('Spotted! Farmer Bram is chasing you — run!');
  }
  if (farmer.state === FARMER_STATES.SEARCH && g.lastSpottedState !== FARMER_STATES.SEARCH) {
    setStatus('He lost you in the hay… stay hidden until he gives up.');
  }
  g.lastSpottedState = farmer.state;

  // A new stage opens with a banner and a chime instead of an instant palette swap.
  if (world.stageIndex !== g.lastStageIndex) {
    g.lastStageIndex = world.stageIndex;
    world.stageBanner = STAGES[world.stageIndex].name;
    world.stageBannerTimer = 2.4;
    playStageChime(audio);
  }

  // Distance is the score's backbone; corn is the bonus. Golden Rush doubles it.
  // The fractional part is banked separately: flooring per frame at 60fps
  // rounded the ~0.5 points/frame down to zero, so distance never scored.
  g.distance = world.distance;
  const golden = turkey.goldenTimer > 0;
  g.scoreFrac += world.speed * dt * 0.12 * (golden ? 2 : 1);
  const whole = Math.floor(g.scoreFrac);
  g.score += whole;
  g.scoreFrac -= whole;
  const bounds = turkeyBounds(turkey);
  if (golden) magnetCorn(world, turkey, dt);
  const gold = collectGolden(world, bounds);
  if (gold > 0) {
    turkey.goldenTimer = 6;
    g.corn += gold * 5;
    g.score += gold * 250;
    playGolden(audio);
    setStatus('GOLDEN RUSH! 6 seconds: invincible, double score, corn magnet!');
  }
  const got = collectCorn(world, bounds);
  if (got > 0) {
    g.corn += got;
    g.score += got * 50 * (golden ? 2 : 1);
    farmer.gap = Math.min(330, farmer.gap + got * 6);
    playPickup(audio);
  }
  const hit = obstaclesHitTurkey(world, bounds, now);
  if (hit) handleHit(g, hit);

  if (farmerCaught(farmer)) {
    endRun(g, false);
    return;
  }
  if (worldEscaped(world, turkey.x)) {
    g.score += 1000;
    endRun(g, true);
  }
}

function drawTitleCast(g, ctx, time) {
  // The title screen's face-off: Tilly on the left, Farmer Bram on the right,
  // a haystack between them. Drawn with the same painters the game uses.
  const castTurkey = {
    x: 330, y: 0, vy: 0, onGround: true, sliding: false, hidden: false,
    hideTimer: 0, dashTimer: 0, dashCooldown: 0, dashFlash: 0,
    invulnerableUntil: 0, runPhase: time * 6, squash: Math.sin(time * 2) * 0.05, lives: 3,
  };
  drawTurkey(ctx, castTurkey, time, 600, false);
  const castFarmer = {
    state: 'patrol', gap: 0, stateTimer: 0, searchX: 0, searchHaystack: null,
    walkPhase: time * 5, cornerWarned: false, spottedFlash: 0, grumble: 0,
  };
  // Farmer drawn at a fixed spot by faking the gap: turkey x 950, gap 0 → x 950.
  drawFarmer(ctx, castFarmer, 950, 600, time);
}

function render(g) {
  const { ctx, world, turkey, farmer } = g;
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake * 14, (Math.random() - 0.5) * world.shake * 14);
  }
  if (g.state === 'title') {
    drawTitleScreen(ctx, g, g.time);
    ctx.restore();
    return;
  }
  drawWorldBackground(ctx, world);
  drawWorldObjects(ctx, world, turkey);
  // The farmer runs behind the turkey; the turkey draws over him when close.
  const fx = farmerScreenX(farmer, turkey.x);
  if (fx > -80 && fx < 1360) {
    drawFarmer(ctx, farmer, turkey.x, WORLD.groundY, g.time);
  }
  const blink = g.blink;
  const inv = g.time < turkey.invulnerableUntil;
  if (!inv || Math.floor(g.time * 12) % 2 === 0) {
    drawTurkey(ctx, turkey, g.time, WORLD.groundY, blink);
  }
  if (g.state === 'playing' || g.state === 'caught' || g.state === 'escaped') {
    drawHud(ctx, g);
    if (g.state === 'playing') {
      drawSpottedBanner(ctx, g);
      drawHiddenBadge(ctx, g);
      drawDashCooldown(ctx, g);
      drawGoldenBadge(ctx, g);
      drawStageBanner(ctx, g);
    }
  }
  if (g.state === 'caught') drawEndScreen(ctx, g, false, g.time);
  if (g.state === 'escaped') drawEndScreen(ctx, g, true, g.time);
  if (g.paused && g.state === 'playing') drawPausedOverlay(ctx, g);
  if (world.flash > 0) {
    ctx.fillStyle = `rgba(201, 59, 46, ${world.flash * 0.35})`;
    ctx.fillRect(0, 0, 1280, 720);
  }
  ctx.restore();
}

function hoveredButton(g) {
  const { mouseX, mouseY } = g.input;
  if (g.state === 'title') {
    if (pointInRect(mouseX, mouseY, BUTTONS.start)) return 'start';
    if (pointInRect(mouseX, mouseY, BUTTONS.howto)) return 'howto';
  }
  if (g.state === 'caught' || g.state === 'escaped') {
    const main = g.state === 'caught' ? BUTTONS.restart : BUTTONS.again;
    if (pointInRect(mouseX, mouseY, main)) return g.state === 'caught' ? 'restart' : 'again';
    if (pointInRect(mouseX, mouseY, BUTTONS.menu)) return 'menu';
  }
  if (pointInRect(mouseX, mouseY, BUTTONS.mute)) return 'mute';
  return null;
}

function handleClick(g) {
  const { input } = g;
  const button = hoveredButton(g);
  if (button === 'mute') {
    setMuted(g.audio, !g.audio.muted);
    return;
  }
  if (g.state === 'title') {
    if (button === 'start' || button === 'howto' || input.mouseClicked) {
      if (button === 'howto') {
        setStatus('Space jumps, Down hides in hay, Shift dashes. Reach 1200 metres to escape.');
        return;
      }
      startRun(g);
      return;
    }
  }
  if (g.state === 'caught' || g.state === 'escaped') {
    if (button === 'restart' || button === 'again') startRun(g);
    else if (button === 'menu') g.state = 'title';
    return;
  }
  if (g.state === 'playing') {
    if (g.paused) {
      g.paused = false;
      return;
    }
    if (turkeyJump(g.turkey, g.time)) playJump(g.audio);
  }
}

function frame(nowMs) {
  const dt = Math.min(0.05, (nowMs - frame.last) / 1000 || 0.016);
  frame.last = nowMs;
  const g = game;
  g.time += dt;
  window.__gobbleState = g.state;
  g.blinkTimer += dt;
  if (g.blinkTimer > 3.4) {
    g.blink = g.blinkTimer < 3.52;
    if (g.blinkTimer > 3.6) g.blinkTimer = 0;
  }

  g.hoverButton = hoveredButton(g);
  canvas.style.cursor = g.hoverButton ? 'pointer' : 'default';

  if (g.input.mutePressed) setMuted(g.audio, !g.audio.muted);
  if (g.input.pausePressed && g.state === 'playing') g.paused = !g.paused;
  if (g.input.enterPressed) {
    if (g.state === 'title') startRun(g);
    else if (g.state === 'caught' || g.state === 'escaped') startRun(g);
    else if (g.state === 'playing' && g.paused) g.paused = false;
  }
  if (g.input.mouseClicked) handleClick(g);

  if (!g.frozen && !g.paused && g.state === 'playing') updatePlaying(g, dt);
  render(g);
  consumeFrameEdges(g.input);
  requestAnimationFrame(frame);
}
frame.last = 0;

function init() {
  window.__gobbleErrors = [];
  window.__gobbleGame = game;
  window.addEventListener('error', (e) => {
    window.__gobbleErrors.push(String(e.message || e.error || 'unknown error'));
  });
  const shot = shotParam();
  if (shot && stageShot(game, shot)) {
    if (shot === 'play') setStatus('Gobble Dash — mid-run: Tilly jumps the fence as Farmer Bram closes in.');
    if (shot === 'title') setStatus('Gobble Dash — The Great Turkey Escape. Press Enter or click Start.');
    if (shot === 'caught') setStatus('Caught by Farmer Bram.');
    if (shot === 'escaped') setStatus('Escaped! Tilly is free.');
    requestAnimationFrame(frame);
    return;
  }
  setStatus('Gobble Dash — The Great Turkey Escape. Press Enter or click Start.');
  requestAnimationFrame(frame);
}

init();
