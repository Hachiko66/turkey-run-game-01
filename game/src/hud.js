// hud.js — everything drawn on top of the world: the HUD, the title screen,
// the end screens and the clickable buttons.
// One job: present the run's numbers and the game's menus, and report which
// button the mouse is over so main.js can act on the click.

export const BUTTONS = {
  start: { x: 490, y: 500, w: 300, h: 64 },
  howto: { x: 490, y: 580, w: 300, h: 48 },
  restart: { x: 490, y: 520, w: 300, h: 64 },
  again: { x: 490, y: 520, w: 300, h: 64 },
  menu: { x: 490, y: 600, w: 300, h: 48 },
  mute: { x: 1196, y: 16, w: 68, h: 36 },
};

function roundPanel(ctx, x, y, w, h, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
}

export function drawButton(ctx, rect, label, hovered, accent = false) {
  ctx.save();
  roundPanel(ctx, rect.x, rect.y, rect.w, rect.h, 14);
  ctx.fillStyle = hovered ? (accent ? '#e8702a' : '#ffd23e') : (accent ? '#c2571b' : '#e8c25a');
  ctx.fill();
  ctx.strokeStyle = '#4a2c14';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#4a2c14';
  ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  ctx.restore();
}

export function drawHud(ctx, game) {
  const { score, distance, corn, turkey, farmer, world } = game;
  const stage = world.stageIndex;

  // Top bar: a warm wooden plank holding the run's numbers.
  ctx.save();
  ctx.fillStyle = 'rgba(74, 44, 20, 0.88)';
  roundPanel(ctx, 16, 14, 1248, 62, 14);
  ctx.fill();
  ctx.strokeStyle = '#e8c25a';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.fillText('SCORE', 36, 30);
  ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
  ctx.fillText(String(score).padStart(6, '0'), 36, 56);

  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.fillText('DISTANCE', 250, 30);
  ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
  const distText = `${Math.floor(distance)} m / 1200 m`;
  ctx.fillText(distText, 250, 56);
  // Distance progress bar under the number.
  ctx.fillStyle = 'rgba(255, 243, 214, 0.25)';
  roundPanel(ctx, 250, 66, 200, 6, 3);
  ctx.fill();
  ctx.fillStyle = '#ffd23e';
  roundPanel(ctx, 250, 66, 200 * Math.min(1, distance / 1200), 6, 3);
  ctx.fill();

  // Lives: three hearts, empty ones greyed out.
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#fff3d6';
  ctx.fillText('LIVES', 500, 30);
  for (let i = 0; i < 3; i++) {
    const hx = 516 + i * 34;
    const hy = 56;
    ctx.fillStyle = i < turkey.lives ? '#c93b2e' : 'rgba(255, 243, 214, 0.25)';
    ctx.beginPath();
    ctx.arc(hx - 6, hy - 3, 8, 0, Math.PI * 2);
    ctx.arc(hx + 6, hy - 3, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx - 13, hy - 1);
    ctx.lineTo(hx, hy + 11);
    ctx.lineTo(hx + 13, hy - 1);
    ctx.closePath();
    ctx.fill();
  }

  // Corn collected.
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.fillText('CORN', 640, 30);
  ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#ffd23e';
  ctx.fillText(`🌽 ${corn}`, 640, 56);

  // Stage badge.
  const stageNames = ['FARMYARD', 'THE BARN', 'THE KITCHEN'];
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.fillText('STAGE', 1080, 30);
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
  ctx.fillText(stageNames[stage], 1080, 56);
  ctx.restore();

  drawFarmerMeter(ctx, game);
  drawMuteButton(ctx, game);
}

export function drawFarmerMeter(ctx, game) {
  // The farmer meter: how close Farmer Bram is. Green is safe, red is dinner.
  const { farmer } = game;
  const gapFrac = Math.max(0, Math.min(1, (farmer.gap - 46) / (330 - 46)));
  const x = 16;
  const y = 640;
  const w = 300;
  ctx.save();
  ctx.fillStyle = 'rgba(74, 44, 20, 0.88)';
  roundPanel(ctx, x, y, w, 56, 12);
  ctx.fill();
  ctx.strokeStyle = '#e8c25a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const label = farmer.state === 'chase' ? 'FARMER — HE SEES YOU!' :
    farmer.state === 'search' ? 'FARMER — SEARCHING...' :
    farmer.state === 'corner' ? 'FARMER — CORNERED!' : 'FARMER — ON YOUR TRAIL';
  ctx.fillText(label, x + 14, y + 14);
  ctx.fillStyle = 'rgba(255, 243, 214, 0.25)';
  roundPanel(ctx, x + 14, y + 32, w - 28, 10, 5);
  ctx.fill();
  ctx.fillStyle = gapFrac > 0.55 ? '#7ab648' : gapFrac > 0.28 ? '#f2b234' : '#c93b2e';
  roundPanel(ctx, x + 14, y + 32, (w - 28) * gapFrac, 10, 5);
  ctx.fill();
  ctx.restore();
}

export function drawMuteButton(ctx, game) {
  const rect = BUTTONS.mute;
  const hovered = game.hoverButton === 'mute';
  ctx.save();
  roundPanel(ctx, rect.x, rect.y, rect.w, rect.h, 9);
  ctx.fillStyle = hovered ? '#ffd23e' : 'rgba(74, 44, 20, 0.88)';
  ctx.fill();
  ctx.strokeStyle = '#e8c25a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = hovered ? '#4a2c14' : '#fff3d6';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(game.audio.muted ? 'MUTED' : 'SOUND', rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  ctx.restore();
}

export function drawDashCooldown(ctx, game) {
  const { turkey } = game;
  if (turkey.dashCooldown <= 0) return;
  ctx.save();
  ctx.fillStyle = 'rgba(74, 44, 20, 0.7)';
  roundPanel(ctx, 330, 640, 150, 56, 12);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DASH recharging…', 405, 658);
  ctx.fillStyle = '#ffd23e';
  roundPanel(ctx, 350, 672, 110 * (1 - turkey.dashCooldown / 3), 8, 4);
  ctx.fill();
  ctx.restore();
}

export function drawTitleScreen(ctx, game, time) {
  const { width, height } = game.canvas;
  ctx.save();
  // Warm autumn backdrop with drifting leaves.
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#ffd98a');
  sky.addColorStop(0.6, '#f6b73c');
  sky.addColorStop(1, '#e88f2a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(0, 600, width, 120);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(0, 600, width, 8);

  // Big friendly title, bobbing gently.
  const bob = Math.sin(time * 1.6) * 6;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(74, 44, 20, 0.35)';
  ctx.font = 'bold 96px "Trebuchet MS", sans-serif';
  ctx.fillText('GOBBLE DASH', width / 2 + 5, 128 + bob + 6);
  ctx.fillStyle = '#c93b2e';
  ctx.fillText('GOBBLE DASH', width / 2, 128 + bob);
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
  ctx.fillText('— The Great Turkey Escape —', width / 2, 196 + bob);
  ctx.fillStyle = '#4a2c14';
  ctx.font = '20px "Trebuchet MS", sans-serif';
  ctx.fillText('Thanksgiving is tonight. Farmer Bram has the oven hot and the carving', width / 2, 246);
  ctx.fillText('knife sharp. Tilly the turkey has other plans. Run, jump, hide — and don’t get caught!', width / 2, 274);

  // The stars of the show, facing off on the title screen.
  game.drawTitleCast(ctx, time);

  // Controls, plain and readable.
  ctx.fillStyle = 'rgba(74, 44, 20, 0.9)';
  ctx.beginPath();
  ctx.roundRect(250, 326, 780, 132, 14);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 19px "Trebuchet MS", sans-serif';
  ctx.fillText('HOW TO PLAY', width / 2, 352);
  ctx.font = '17px "Trebuchet MS", sans-serif';
  ctx.fillText('SPACE / ↑ / CLICK — jump        ↓ — hide in a haystack        SHIFT — dash away', width / 2, 382);
  ctx.fillText('← → — shuffle        P — pause        M — mute        Grab corn, dodge the oven & knives!', width / 2, 408);
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 17px "Trebuchet MS", sans-serif';
  ctx.fillText('Reach the forest gate at 1200 m to escape. If Farmer Bram closes in — RUN!', width / 2, 436);

  drawButton(ctx, BUTTONS.start, '▶  START THE ESCAPE', game.hoverButton === 'start', true);
  drawButton(ctx, BUTTONS.howto, 'How to play (keys above)', game.hoverButton === 'howto', false);

  if (game.bestScore > 0) {
    ctx.fillStyle = '#4a2c14';
    ctx.font = 'bold 18px "Trebuchet MS", sans-serif';
    ctx.fillText(`Best score so far: ${game.bestScore}`, width / 2, 660);
  }
  ctx.fillStyle = '#4a2c14';
  ctx.font = '16px "Trebuchet MS", sans-serif';
  ctx.fillText('An original game — art, sounds and code made for this bounty. No turkeys were harmed.', width / 2, 690);
  ctx.restore();
}

export function drawEndScreen(ctx, game, escaped, time) {
  const { width, height } = game.canvas;
  const stats = game.endStats;
  ctx.save();
  ctx.fillStyle = escaped ? 'rgba(29, 92, 46, 0.82)' : 'rgba(74, 20, 14, 0.82)';
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const pop = 1 + Math.sin(Math.min(1, time * 2)) * 0.02;
  ctx.save();
  ctx.translate(width / 2, 150);
  ctx.scale(pop, pop);
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 84px "Trebuchet MS", sans-serif';
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', 0, 0);
  ctx.restore();

  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
  ctx.fillText(
    escaped
      ? 'Tilly slipped through the forest gate — Thanksgiving is cancelled!'
      : 'Farmer Bram got his dinner… this time. The oven stays hot.',
    width / 2, 224,
  );

  // The run's numbers, big and proud.
  ctx.fillStyle = 'rgba(255, 243, 214, 0.12)';
  ctx.beginPath();
  ctx.roundRect(390, 270, 500, 200, 16);
  ctx.fill();
  ctx.strokeStyle = '#e8c25a';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
  const rows = [
    ['SCORE', String(stats.score)],
    ['DISTANCE', `${Math.floor(stats.distance)} m`],
    ['CORN COLLECTED', String(stats.corn)],
    ['BEST SCORE', String(Math.max(stats.score, game.bestScore))],
  ];
  rows.forEach(([label, value], i) => {
    const y = 302 + i * 44;
    ctx.textAlign = 'left';
    ctx.fillText(label, 420, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd23e';
    ctx.fillText(value, 860, y);
    ctx.fillStyle = '#fff3d6';
  });

  const button = escaped ? BUTTONS.again : BUTTONS.restart;
  drawButton(ctx, button, escaped ? '↻  RUN AGAIN' : '↻  TRY AGAIN', game.hoverButton === 'restart' || game.hoverButton === 'again', true);
  drawButton(ctx, BUTTONS.menu, 'Back to title', game.hoverButton === 'menu', false);

  ctx.fillStyle = '#fff3d6';
  ctx.font = '17px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Press ENTER or click the button to run again.', width / 2, 680);
  ctx.restore();
}

export function drawPausedOverlay(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(20, 12, 6, 0.6)';
  ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 56px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', game.canvas.width / 2, 320);
  ctx.font = '20px "Trebuchet MS", sans-serif';
  ctx.fillText('Press P or click to keep running.', game.canvas.width / 2, 380);
  ctx.restore();
}

export function drawSpottedBanner(ctx, game) {
  const { farmer } = game;
  if (farmer.state !== 'chase' && farmer.state !== 'corner') return;
  const pulse = 0.65 + Math.sin(game.time * 10) * 0.35;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = farmer.state === 'corner' ? '#c93b2e' : '#e8702a';
  ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(farmer.state === 'corner' ? '⚠ CORNERED — DASH! (SHIFT) ⚠' : '⚠ SPOTTED! RUN! ⚠', 640, 120);
  ctx.restore();
}

export function drawHiddenBadge(ctx, game) {
  if (!game.turkey.hidden) return;
  ctx.save();
  ctx.fillStyle = 'rgba(29, 92, 46, 0.9)';
  ctx.beginPath();
  ctx.roundRect(540, 100, 200, 44, 12);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🤫 HIDDEN IN THE HAY', 640, 123);
  ctx.restore();
}
