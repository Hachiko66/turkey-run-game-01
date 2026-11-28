// world.js — the farm, the barn and the kitchen.
// One job: the scrolling world — stages that grow harder from the farmyard to
// the kitchen, obstacle spawning (fences, ovens, knives, haystacks, corn),
// the forest gate at the end, and the painted background of each stage.

import {
  PALETTE,
  drawSun,
  drawCloud,
  drawBarn,
  drawFence,
  drawTree,
  drawHaystack,
  drawCornCob,
  drawGoldenCorn,
  drawRollingPumpkin,
  drawOven,
  drawCarvingKnife,
  drawJumpFence,
  drawForestGate,
  drawPumpkin,
  drawKitchenShelf,
  autumnLeaves,
} from './art.js';

export const WORLD = {
  width: 1280,
  height: 720,
  groundY: 600,
  escapeDistance: 1200,
};

export const STAGES = [
  { name: 'FARMYARD', from: 0, to: 400, speed: 250, sky: PALETTE.skyFarm, ground: PALETTE.groundFarm },
  { name: 'THE BARN', from: 400, to: 900, speed: 300, sky: PALETTE.skyBarn, ground: PALETTE.groundBarn },
  { name: 'THE KITCHEN', from: 900, to: 1200, speed: 350, sky: PALETTE.skyKitchen, ground: PALETTE.groundKitchen },
];

export function stageForDistance(distance) {
  for (let i = 0; i < STAGES.length; i++) {
    if (distance < STAGES[i].to) return i;
  }
  return STAGES.length - 1;
}

export function createWorld() {
  return {
    scrollX: 0,
    distance: 0,
    speed: STAGES[0].speed,
    stageIndex: 0,
    obstacles: [],
    corns: [],
    goldens: [],
    goldenTimer: 8,
    spawnTimer: 0.9,
    gateX: null,
    shake: 0,
    flash: 0,
    time: 0,
    stageBanner: null,
    stageBannerTimer: 0,
  };
}

export function resetWorld(world) {
  Object.assign(world, createWorld());
}

function randomSpawnGap(world) {
  // Tighter gaps as the run goes on: the farm gets meaner with distance.
  const base = 1.15 - Math.min(0.45, world.distance / 2400);
  return base + Math.random() * 0.55;
}

function spawnObstacle(world, x) {
  const stage = world.stageIndex;
  const roll = Math.random();
  const knife = (kx, warnOffset) => ({ kind: 'knife', x: kx, y: -40, vy: 0, state: 'falling', warned: warnOffset || 0 });
  if (stage === 0) {
    // The farmyard stays gentle: no rolling pumpkins yet, so the run opens fair.
    if (roll < 0.42) world.obstacles.push({ kind: 'fence', x, w: 90, h: 58 });
    else if (roll < 0.68) world.obstacles.push({ kind: 'haystack', x, w: 110, h: 84, used: false });
    else if (roll < 0.86) world.obstacles.push(knife(x));
    else world.obstacles.push({ kind: 'oven', x, w: 140, h: 118 });
  } else if (stage === 1) {
    // The barn: pumpkins start rolling in, closing the distance fast.
    if (roll < 0.30) world.obstacles.push({ kind: 'fence', x, w: 90, h: 58 });
    else if (roll < 0.50) world.obstacles.push({ kind: 'oven', x, w: 140, h: 118 });
    else if (roll < 0.72) world.obstacles.push(knife(x));
    else if (roll < 0.86) world.obstacles.push({ kind: 'pumpkin', x, w: 70, h: 62, vx: 130, roll: 0 });
    else world.obstacles.push({ kind: 'haystack', x, w: 110, h: 84, used: false });
  } else {
    // The kitchen: pumpkins roll more often, and knives sometimes drop in
    // staggered pairs — jumping blindly into a drop is punished.
    if (roll < 0.36) world.obstacles.push({ kind: 'oven', x, w: 140, h: 118 });
    else if (roll < 0.62) {
      world.obstacles.push(knife(x));
      if (Math.random() < 0.3) world.obstacles.push(knife(x + 150, -0.25));
    } else if (roll < 0.80) world.obstacles.push({ kind: 'pumpkin', x, w: 70, h: 62, vx: 150, roll: 0 });
    else if (roll < 0.92) world.obstacles.push({ kind: 'fence', x, w: 90, h: 58 });
    else world.obstacles.push({ kind: 'haystack', x, w: 110, h: 84, used: false });
  }
  // Corn often trails an obstacle: the brave get paid. The low cobs sit low
  // enough to grab on the run; the high ones take a hop.
  if (Math.random() < 0.75) {
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      world.corns.push({ x: x + 90 + i * 46, y: WORLD.groundY - 70 - (i % 2) * 40, taken: false });
    }
  }
}

export function updateWorld(world, dt, dashing) {
  world.time += dt;
  const stage = STAGES[world.stageIndex];
  world.speed = stage.speed + Math.min(60, world.distance * 0.03) + (dashing ? 170 : 0);
  world.scrollX += world.speed * dt;
  world.distance = world.scrollX / 50;
  world.stageIndex = stageForDistance(world.distance);

  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 3);
  if (world.flash > 0) world.flash = Math.max(0, world.flash - dt * 2.5);
  if (world.stageBannerTimer > 0) world.stageBannerTimer = Math.max(0, world.stageBannerTimer - dt);

  // Golden corn: a rare pickup that drifts in every dozen seconds or so.
  world.goldenTimer -= dt;
  if (world.goldenTimer <= 0 && world.distance < WORLD.escapeDistance - 100) {
    world.goldens.push({
      x: WORLD.width + 140,
      y: WORLD.groundY - 60 - Math.random() * 60,
      taken: false,
    });
    world.goldenTimer = 13 + Math.random() * 6;
  }

  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0 && world.distance < WORLD.escapeDistance - 60) {
    spawnObstacle(world, WORLD.width + 120);
    world.spawnTimer = randomSpawnGap(world);
  }

  for (const ob of world.obstacles) {
    ob.x -= world.speed * dt;
    if (ob.kind === 'pumpkin') {
      // Pumpkins roll toward the turkey faster than the world scrolls.
      ob.x -= ob.vx * dt;
      ob.roll += dt * 6;
    }
    if (ob.kind === 'knife') {
      if (ob.state === 'falling') {
        ob.warned += dt;
        if (ob.warned > 0.55) {
          ob.vy += 4200 * dt;
          ob.y += ob.vy * dt;
          if (ob.y >= WORLD.groundY - 150) {
            ob.y = WORLD.groundY - 150;
            ob.state = 'stuck';
            ob.stuckTimer = 0.9;
          }
        }
      } else if (ob.state === 'stuck') {
        ob.stuckTimer -= dt;
        if (ob.stuckTimer <= 0) ob.state = 'gone';
      }
    }
  }
  world.obstacles = world.obstacles.filter((o) => o.x > -220 && o.state !== 'gone');
  for (const c of world.corns) c.x -= world.speed * dt;
  world.corns = world.corns.filter((c) => c.x > -40 && !c.taken);
  for (const gd of world.goldens) gd.x -= world.speed * dt;
  world.goldens = world.goldens.filter((gd) => gd.x > -80 && !gd.taken);

  // The forest gate appears once the turkey has survived the kitchen.
  if (world.distance >= WORLD.escapeDistance - 40 && world.gateX === null) {
    world.gateX = WORLD.width + 200;
  }
  if (world.gateX !== null) world.gateX -= world.speed * dt;
}

export function worldEscaped(world, turkeyX) {
  return world.gateX !== null && world.gateX < turkeyX + 40;
}

export function nearestHaystack(world, turkeyX) {
  let best = null;
  let bestD = 1e9;
  for (const ob of world.obstacles) {
    if (ob.kind !== 'haystack') continue;
    const d = Math.abs(ob.x - turkeyX);
    if (d < bestD) {
      bestD = d;
      best = ob;
    }
  }
  return bestD < 130 ? best : null;
}

export function obstaclesHitTurkey(world, bounds, now) {
  // Returns the first obstacle whose box overlaps the turkey's forgiving box.
  for (const ob of world.obstacles) {
    if (ob.kind === 'fence') {
      const box = { x: ob.x - 40, y: WORLD.groundY - ob.h, w: 80, h: ob.h };
      if (rectsOverlap(bounds, box)) return ob;
    } else if (ob.kind === 'oven') {
      const box = { x: ob.x - 62, y: WORLD.groundY - 96, w: 124, h: 96 };
      if (rectsOverlap(bounds, box)) return ob;
    } else if (ob.kind === 'knife' && ob.state === 'falling' && ob.y > WORLD.groundY - 320) {
      const box = { x: ob.x - 14, y: ob.y - 130, w: 28, h: 130 };
      if (rectsOverlap(bounds, box)) return ob;
    } else if (ob.kind === 'pumpkin') {
      // A rolling pumpkin: low and wide, jump it like a fence — but it
      // closes the distance faster, so the jump has to come earlier.
      const box = { x: ob.x - 30, y: WORLD.groundY - 56, w: 60, h: 56 };
      if (rectsOverlap(bounds, box)) return ob;
    } else if (ob.kind === 'haystack') {
      // Haystacks never hurt: they are shelter, not danger.
      continue;
    }
  }
  return null;
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function collectCorn(world, bounds) {
  let got = 0;
  for (const c of world.corns) {
    if (c.taken) continue;
    const box = { x: c.x - 16, y: c.y - 24, w: 32, h: 48 };
    if (rectsOverlap(bounds, box)) {
      c.taken = true;
      got++;
    }
  }
  return got;
}

export function collectGolden(world, bounds) {
  // Golden corn: worth 5 corn and a Golden Rush. Its glow is big on purpose.
  let got = 0;
  for (const gd of world.goldens) {
    if (gd.taken) continue;
    const box = { x: gd.x - 26, y: gd.y - 26, w: 52, h: 52 };
    if (rectsOverlap(bounds, box)) {
      gd.taken = true;
      got++;
    }
  }
  return got;
}

export function magnetCorn(world, turkey, dt) {
  // Golden Rush magnet: nearby corn flies toward the turkey, so a rush
  // turns into a harvest. Only corn within reach is pulled, and it never
  // overshoots the turkey's beak.
  const cx = turkey.x;
  const cy = WORLD.groundY - turkey.y - 29;
  for (const c of world.corns) {
    if (c.taken) continue;
    const dx = cx - c.x;
    const dy = cy - c.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 240 && dist > 4) {
      const pull = Math.min(dist, 520 * dt);
      c.x += (dx / dist) * pull;
      c.y += (dy / dist) * pull;
    }
  }
}

export function drawWorldBackground(ctx, world) {
  const stage = STAGES[world.stageIndex];
  const { width, height, groundY } = WORLD;
  const t = world.time;
  const sx = world.scrollX;

  // Sky gradient per stage.
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, stage.sky[0]);
  sky.addColorStop(0.6, stage.sky[1]);
  sky.addColorStop(1, stage.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, groundY + 2);

  drawSun(ctx, 1060, 96, 44, t);
  const cloudX = (x, speed) => ((x - sx * speed) % (width + 320) + width + 320) % (width + 320) - 160;
  drawCloud(ctx, cloudX(200, 0.08), 90, 1);
  drawCloud(ctx, cloudX(700, 0.12), 150, 0.8);
  drawCloud(ctx, cloudX(1100, 0.06), 60, 1.15);
  autumnLeaves(ctx, width, height, t, 7);

  if (world.stageIndex === 0) {
    // Farmyard: barn and trees drift by slowly, fence runs along the ground.
    drawBarn(ctx, ((300 - sx * 0.25) % 1600 + 1600) % 1600 - 200, groundY, 0.9);
    drawTree(ctx, ((500 - sx * 0.4) % 1400 + 1400) % 1400 - 100, groundY, 1, t);
    drawTree(ctx, ((1100 - sx * 0.4) % 1400 + 1400) % 1400 - 100, groundY, 0.8, t);
    drawPumpkin(ctx, ((800 - sx * 0.55) % 1200 + 1200) % 1200 - 60, groundY, 1);
  } else if (world.stageIndex === 1) {
    // The barn: wooden walls, hanging lanterns, a hayloft window.
    ctx.fillStyle = '#5d3a1a';
    ctx.fillRect(0, 0, width, groundY);
    ctx.fillStyle = '#6e4520';
    for (let x = -((sx * 0.3) % 120); x < width; x += 120) {
      ctx.fillRect(x, 0, 10, groundY);
    }
    ctx.fillStyle = '#3a2410';
    ctx.fillRect(0, 0, width, 26);
    drawKitchenShelf(ctx, 120, 150, 300);
    ctx.fillStyle = '#ffd23e';
    for (const lx of [300, 760, 1120]) {
      const flicker = 0.75 + Math.sin(t * 6 + lx) * 0.12;
      ctx.globalAlpha = flicker;
      ctx.beginPath();
      ctx.arc(lx, 120, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#4a2c14';
      ctx.fillRect(lx - 3, 88, 6, 18);
      ctx.fillStyle = '#ffd23e';
    }
  } else {
    // The kitchen: tiled walls, a shelf of pans, a pie cooling, danger everywhere.
    ctx.fillStyle = '#e8d9b8';
    ctx.fillRect(0, 0, width, groundY);
    ctx.strokeStyle = 'rgba(122, 74, 34, 0.35)';
    ctx.lineWidth = 2;
    for (let x = 0; x < width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, groundY);
      ctx.stroke();
    }
    for (let y = 0; y < groundY; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    drawKitchenShelf(ctx, 90, 120, 340);
    drawKitchenShelf(ctx, 820, 90, 300);
    ctx.fillStyle = '#a83226';
    ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THANKSGIVING DINNER — TONIGHT!', width / 2, 260);
  }

  // Ground: packed earth in the farm, boards in the barn, tiles in the kitchen.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, groundY, width, height - groundY);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.fillRect(0, groundY, width, 8);
  if (world.stageIndex === 2) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 2;
    for (let x = -((sx * 1) % 80); x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  } else {
    // Grass tufts and straw on the farm ground.
    ctx.strokeStyle = 'rgba(60, 90, 30, 0.7)';
    ctx.lineWidth = 3;
    for (let x = -((sx * 1) % 90); x < width; x += 90) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + 40);
      ctx.lineTo(x + 6, groundY + 26);
      ctx.moveTo(x + 12, groundY + 40);
      ctx.lineTo(x + 16, groundY + 28);
      ctx.stroke();
    }
  }
}

export function drawWorldObjects(ctx, world, turkey) {
  const { groundY } = WORLD;
  const t = world.time;

  for (const c of world.corns) {
    if (!c.taken) drawCornCob(ctx, c.x, c.y, 1, Math.sin(t * 4 + c.x * 0.05) * 4);
  }
  for (const gd of world.goldens) {
    if (!gd.taken) drawGoldenCorn(ctx, gd.x, gd.y, 1, t);
  }
  for (const ob of world.obstacles) {
    if (ob.kind === 'fence') {
      drawJumpFence(ctx, ob.x, groundY, 1);
    } else if (ob.kind === 'pumpkin') {
      drawRollingPumpkin(ctx, ob.x, groundY, ob.roll);
    } else if (ob.kind === 'oven') {
      drawOven(ctx, ob.x, groundY, 1, t, 0.7);
    } else if (ob.kind === 'haystack') {
      drawHaystack(ctx, ob.x, groundY, 1);
      if (!ob.used) {
        // A little "HIDE" hint floats over fresh haystacks.
        ctx.fillStyle = 'rgba(255, 243, 214, 0.95)';
        ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('HIDE ↓', ob.x, groundY - 96 + Math.sin(t * 3) * 3);
      }
    } else if (ob.kind === 'knife' && ob.state !== 'gone') {
      if (ob.state === 'falling' && ob.warned <= 0.55) {
        // Warning shadow: the knife is about to fall here.
        ctx.fillStyle = 'rgba(201, 59, 46, 0.35)';
        ctx.beginPath();
        ctx.ellipse(ob.x, groundY + 4, 26, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c93b2e';
        ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', ob.x, groundY - 150 + Math.sin(t * 8) * 4);
      }
      const glint = ob.state === 'falling' ? Math.max(0, 1 - ob.warned) : 0.4;
      drawCarvingKnife(ctx, ob.x, ob.y + 130, 1, ob.state === 'stuck' ? 0.06 : 0, glint);
    }
  }
  if (world.gateX !== null) {
    drawForestGate(ctx, world.gateX, groundY, 1, t);
  }
}
