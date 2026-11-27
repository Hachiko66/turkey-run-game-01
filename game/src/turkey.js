// turkey.js — Tilly the turkey, the player.
// One job: the turkey's movement (run, jump, slide, hide, dash), its state
// (lives, invulnerability, hidden), and drawing the bird itself.

export const TURKEY_X = 300;
export const TURKEY_W = 64;
export const TURKEY_H = 58;
export const GRAVITY = 2600;
export const JUMP_SPEED = 920;
export const DASH_COOLDOWN = 3.0;
export const HIDE_KEY_HOLD = 0.35;

export function createTurkey() {
  return {
    x: TURKEY_X,
    y: 0, // feet offset above the ground; 0 = standing on it
    vy: 0,
    onGround: true,
    sliding: false,
    hidden: false,
    hideTimer: 0,
    dashTimer: 0,
    dashCooldown: 0,
    dashFlash: 0,
    invulnerableUntil: 0,
    runPhase: 0,
    squash: 0,
    lives: 3,
    facing: 1,
  };
}

export function resetTurkey(turkey) {
  const fresh = createTurkey();
  Object.assign(turkey, fresh);
}

export function turkeyJump(turkey, now) {
  if (turkey.hidden) return false;
  if (!turkey.onGround) return false;
  turkey.vy = JUMP_SPEED;
  turkey.onGround = false;
  turkey.sliding = false;
  turkey.squash = -0.25;
  return true;
}

export function turkeySlide(turkey) {
  if (!turkey.onGround || turkey.hidden) return false;
  turkey.sliding = true;
  return true;
}

export function turkeyDash(turkey) {
  if (turkey.dashCooldown > 0 || turkey.hidden) return false;
  turkey.dashTimer = 0.28;
  turkey.dashCooldown = DASH_COOLDOWN;
  turkey.dashFlash = 0.28;
  return true;
}

export function turkeyHide(turkey, haystack, now) {
  // Hiding only works tucked right behind a haystack, on the ground.
  if (!haystack || !turkey.onGround) return false;
  if (Math.abs(turkey.x - haystack.x) > 70) return false;
  turkey.hidden = true;
  turkey.hideTimer = 0;
  turkey.sliding = false;
  return true;
}

export function turkeyUnhide(turkey) {
  turkey.hidden = false;
  turkey.hideTimer = 0;
}

export function turkeyHurt(turkey, now) {
  // One hit costs a life and buys a short flash of invulnerability.
  if (now < turkey.invulnerableUntil) return false;
  turkey.lives -= 1;
  turkey.invulnerableUntil = now + 1.6;
  turkey.squash = 0.3;
  if (turkey.hidden) turkeyUnhide(turkey);
  return true;
}

export function updateTurkey(turkey, dt, input, now, groundY) {
  turkey.runPhase += dt * (turkey.onGround ? 11 : 4);
  turkey.squash += (0 - turkey.squash) * Math.min(1, dt * 8);
  if (turkey.dashCooldown > 0) turkey.dashCooldown -= dt;
  if (turkey.dashTimer > 0) turkey.dashTimer -= dt;
  if (turkey.dashFlash > 0) turkey.dashFlash -= dt;
  if (turkey.hidden) turkey.hideTimer += dt;

  // Left / right shuffle: the turkey can drift a little to line up a jump.
  if (!turkey.hidden) {
    if (input.left) turkey.x -= 260 * dt;
    if (input.right) turkey.x += 260 * dt;
    turkey.x = Math.max(120, Math.min(560, turkey.x));
  }

  // Jump, slide and hide come from the input edges, applied by main.js.
  if (!turkey.onGround) {
    turkey.vy -= GRAVITY * dt;
    turkey.y += turkey.vy * dt;
    if (turkey.y <= 0) {
      turkey.y = 0;
      turkey.vy = 0;
      turkey.onGround = true;
      turkey.squash = 0.22;
    }
  }
  if (turkey.sliding && !input.down) turkey.sliding = false;
}

export function drawTurkey(ctx, turkey, time, groundY, blink) {
  // Tilly, drawn from scratch: brown body, fanned tail, red wattle, bright eye.
  // She leans forward when she runs, tucks when she slides, and puffs up when hurt.
  const x = turkey.x;
  const feetY = groundY - turkey.y;
  const bob = turkey.onGround ? Math.abs(Math.sin(turkey.runPhase)) * 4 : 0;
  const squashY = 1 + turkey.squash;
  const squashX = 1 - turkey.squash * 0.7;

  ctx.save();
  ctx.translate(x, feetY - bob);
  ctx.scale(squashX, squashY);

  if (turkey.hidden) {
    // Hidden: only a nervous eye and a tail feather poke out of the hay.
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.arc(6, -52, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d1d1d';
    ctx.beginPath();
    ctx.arc(8, -52, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const legSwing = turkey.onGround ? Math.sin(turkey.runPhase) * 10 : 6;
  const slide = turkey.sliding ? 1 : 0;

  // Tail fan: five feathers, fanned behind her.
  ctx.save();
  ctx.translate(-26, -34 + slide * 8);
  ctx.rotate(-0.5 - slide * 0.2);
  const featherColors = ['#b85c1e', '#d2691e', '#e8702a', '#c93b2e', '#f2b234'];
  for (let i = 0; i < 5; i++) {
    const a = -0.9 + i * 0.45;
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = featherColors[i];
    ctx.beginPath();
    ctx.ellipse(0, -26, 9, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 243, 214, 0.85)';
    ctx.beginPath();
    ctx.ellipse(0, -44, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Legs: two orange sticks that scissor while she runs.
  ctx.strokeStyle = '#e8912d';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -18);
  ctx.lineTo(-8 + legSwing, 0);
  ctx.moveTo(8, -18);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();
  ctx.fillStyle = '#e8912d';
  for (const lx of [-8 + legSwing, 8 - legSwing]) {
    ctx.beginPath();
    ctx.moveTo(lx - 7, 0);
    ctx.lineTo(lx + 7, 0);
    ctx.lineTo(lx + 2, -5);
    ctx.lineTo(lx - 2, -5);
    ctx.closePath();
    ctx.fill();
  }

  // Body: a plump brown oval, darker on the belly side.
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.ellipse(0, -34 + slide * 10, 30, 24 - slide * 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a06a35';
  ctx.beginPath();
  ctx.ellipse(2, -30 + slide * 10, 22, 17 - slide * 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wing: a darker flap that lifts when she jumps.
  const wingLift = turkey.onGround ? 0 : -10;
  ctx.fillStyle = '#6b4423';
  ctx.beginPath();
  ctx.ellipse(-4, -36 + wingLift + slide * 8, 16, 11, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Neck and head, held high and proud.
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.ellipse(20, -56 + slide * 12, 9, 16, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c98a4b';
  ctx.beginPath();
  ctx.arc(26, -70 + slide * 12, 13, 0, Math.PI * 2);
  ctx.fill();
  // Beak: bright orange, slightly open when she gobbles.
  ctx.fillStyle = '#f28c13';
  ctx.beginPath();
  ctx.moveTo(36, -72 + slide * 12);
  ctx.lineTo(50, -68 + slide * 12);
  ctx.lineTo(36, -64 + slide * 12);
  ctx.closePath();
  ctx.fill();
  // Wattle: the red flap under the beak, the turkey's signature.
  ctx.fillStyle = '#c93b2e';
  ctx.beginPath();
  ctx.ellipse(33, -60 + slide * 12, 4, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Snood: the little red dangler over the beak.
  ctx.fillStyle = '#c93b2e';
  ctx.beginPath();
  ctx.ellipse(38, -76 + slide * 12, 3, 6, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Eye: wide and worried, blinking now and then.
  const eyeH = blink ? 1.5 : 4.5;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(28, -74 + slide * 12, 5, eyeH + 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d1d1d';
  ctx.beginPath();
  ctx.arc(30, -74 + slide * 12, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Dash flash: a golden afterimage streak when she bursts forward.
  if (turkey.dashFlash > 0) {
    ctx.globalAlpha = Math.min(1, turkey.dashFlash * 2.2);
    ctx.strokeStyle = '#ffd23e';
    ctx.lineWidth = 4;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-30 - i * 14, -30 - i * 6);
      ctx.lineTo(-58 - i * 14, -30 - i * 6);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export function turkeyBounds(turkey) {
  // A forgiving hitbox: a little smaller than the drawing, so near misses feel fair.
  const height = turkey.sliding ? 34 : TURKEY_H;
  return {
    x: turkey.x - 24,
    y: turkey.y + (TURKEY_H - height),
    w: 48,
    h: height,
  };
}
