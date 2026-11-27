// art.js — all of Gobble Dash's original Thanksgiving art, drawn with canvas paths.
// One job: small reusable painters for the turkey, the farmer, the farm and the kitchen,
// plus the shared autumn palette. No image files, no copied art: every shape is ours.

export const PALETTE = {
  skyFarm: ['#ffd98a', '#f6b73c', '#e88f2a'],
  skyBarn: ['#e8a04c', '#c97b2e', '#8a4b1d'],
  skyKitchen: ['#f2c14e', '#d98e32', '#7a3b16'],
  groundFarm: '#8a5a2b',
  groundBarn: '#6e4520',
  groundKitchen: '#9c6644',
  leafOrange: '#e8702a',
  leafRed: '#c93b2e',
  leafGold: '#f2b234',
  hay: '#e8c25a',
  hayDark: '#c9a13a',
  corn: '#ffd23e',
  ovenIron: '#3a3a42',
  knifeSteel: '#dfe6ee',
  cream: '#fff3d6',
  brownDark: '#4a2c14',
};

export function autumnLeaves(ctx, width, height, time, seed) {
  // Drifting leaves: cheap ambience that sells the season in every stage.
  ctx.save();
  for (let i = 0; i < 14; i++) {
    const s = seed + i * 97;
    const x = ((s * 137) % width + time * (12 + (s % 20)) + width) % width;
    const y = ((s * 71) % (height * 0.55) + time * (18 + (s % 25))) % (height * 0.55);
    const size = 5 + (s % 7);
    const colors = [PALETTE.leafOrange, PALETTE.leafRed, PALETTE.leafGold];
    ctx.fillStyle = colors[i % 3];
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.55, Math.sin(time + i) * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawOven(ctx, x, groundY, scale, time, heat) {
  // The Thanksgiving oven: a black iron box with a glowing door and licking flames.
  // heat 0..1 drives how tall the flames dance — it is a hazard, not scenery.
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  const flameH = 26 + heat * 34 + Math.sin(time * 11) * 7;
  ctx.fillStyle = 'rgba(255, 120, 20, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, -8, 78, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = -2; i <= 2; i++) {
    const fx = i * 26;
    const fh = flameH * (0.75 + ((i + 2) % 3) * 0.16);
    ctx.fillStyle = i % 2 === 0 ? '#ff7a1a' : '#ffb52e';
    ctx.beginPath();
    ctx.moveTo(fx - 13, -6);
    ctx.quadraticCurveTo(fx - 12, -fh * 0.6, fx, -fh);
    ctx.quadraticCurveTo(fx + 12, -fh * 0.6, fx + 13, -6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.ovenIron;
  ctx.fillRect(-72, -118, 144, 112);
  ctx.fillStyle = '#2b2b31';
  ctx.fillRect(-72, -118, 144, 12);
  ctx.fillStyle = '#ff9a3c';
  ctx.fillRect(-52, -96, 104, 62);
  ctx.fillStyle = '#ffd23e';
  ctx.fillRect(-46, -90, 92, 50);
  ctx.strokeStyle = '#1c1c20';
  ctx.lineWidth = 4;
  ctx.strokeRect(-52, -96, 104, 62);
  ctx.fillStyle = '#c9c9d1';
  ctx.fillRect(-58, -26, 116, 8);
  ctx.fillStyle = '#ff5a1a';
  ctx.beginPath();
  ctx.arc(52, -104, 5 + Math.sin(time * 9) * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOT!', 0, -132);
  ctx.restore();
}

export function drawCarvingKnife(ctx, x, y, scale, angle, glint) {
  // The carving knife: long steel blade, dark handle, a glint that warns before it falls.
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  if (glint > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.25 + glint * 0.55})`;
    ctx.beginPath();
    ctx.moveTo(-8, -118);
    ctx.lineTo(8, -118);
    ctx.lineTo(14, -30);
    ctx.lineTo(-14, -30);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.knifeSteel;
  ctx.beginPath();
  ctx.moveTo(-9, -120);
  ctx.lineTo(9, -120);
  ctx.lineTo(15, -34);
  ctx.lineTo(-15, -34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8f9aa8';
  ctx.beginPath();
  ctx.moveTo(-9, -120);
  ctx.lineTo(9, -120);
  ctx.lineTo(0, -96);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4a2c14';
  ctx.fillRect(-12, -34, 24, 40);
  ctx.fillStyle = '#6b4423';
  ctx.beginPath();
  ctx.arc(-6, -14, 2.5, 0, Math.PI * 2);
  ctx.arc(6, -14, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawJumpFence(ctx, x, groundY, scale) {
  // A low hurdle fence the turkey must jump: two posts and a rail, flagged with bunting.
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#7a4a22';
  ctx.fillRect(-46, -58, 10, 58);
  ctx.fillRect(36, -58, 10, 58);
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(-52, -58, 104, 10);
  ctx.fillRect(-52, -30, 104, 8);
  ctx.fillStyle = PALETTE.leafRed;
  ctx.beginPath();
  ctx.moveTo(-40, -48);
  ctx.lineTo(-28, -48);
  ctx.lineTo(-34, -34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.leafGold;
  ctx.beginPath();
  ctx.moveTo(-8, -48);
  ctx.lineTo(4, -48);
  ctx.lineTo(-2, -34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.leafOrange;
  ctx.beginPath();
  ctx.moveTo(24, -48);
  ctx.lineTo(36, -48);
  ctx.lineTo(30, -34);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawForestGate(ctx, x, groundY, scale, time) {
  // The forest gate at the end of the run: two pines, a wooden arch, freedom beyond.
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#1d5c2e';
    ctx.beginPath();
    ctx.moveTo(side * 150 - 44, -40);
    ctx.lineTo(side * 150, -190);
    ctx.lineTo(side * 150 + 44, -40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2f7a2e';
    ctx.beginPath();
    ctx.moveTo(side * 150 - 36, -90);
    ctx.lineTo(side * 150, -210);
    ctx.lineTo(side * 150 + 36, -90);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(side * 150 - 8, -44, 16, 44);
  }
  ctx.fillStyle = '#7a4a22';
  ctx.fillRect(-150, -168, 300, 16);
  ctx.fillRect(-158, -168, 16, 168);
  ctx.fillRect(142, -168, 16, 168);
  ctx.fillStyle = '#e8c25a';
  ctx.beginPath();
  ctx.arc(0, -152, 26 + Math.sin(time * 2) * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a2c14';
  ctx.font = 'bold 17px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FREEDOM', 0, -146);
  ctx.restore();
}

export function drawPumpkin(ctx, x, groundY, scale) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#e8702a';
  ctx.beginPath();
  ctx.ellipse(0, -16, 30, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d2691e';
  ctx.beginPath();
  ctx.ellipse(-12, -16, 12, 22, 0, 0, Math.PI * 2);
  ctx.ellipse(12, -16, 12, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2f7a2e';
  ctx.fillRect(-3, -42, 6, 12);
  ctx.fillStyle = '#1d1d1d';
  ctx.beginPath();
  ctx.moveTo(-14, -20);
  ctx.lineTo(-8, -12);
  ctx.lineTo(-2, -20);
  ctx.closePath();
  ctx.moveTo(4, -20);
  ctx.lineTo(10, -12);
  ctx.lineTo(16, -20);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.quadraticCurveTo(0, 2, 10, -6);
  ctx.lineTo(8, -2);
  ctx.quadraticCurveTo(0, 5, -8, -2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawKitchenShelf(ctx, x, y, width) {
  // A kitchen shelf with hanging pans and a pie cooling: stage-3 dressing.
  ctx.save();
  ctx.fillStyle = '#7a4a22';
  ctx.fillRect(x, y, width, 10);
  for (let i = 0; i < 3; i++) {
    const px = x + 40 + i * ((width - 80) / 2);
    ctx.strokeStyle = '#3a3a42';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, y + 34, 22, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px, y + 12);
    ctx.lineTo(px, y + 16);
    ctx.stroke();
  }
  ctx.fillStyle = '#d2691e';
  ctx.beginPath();
  ctx.ellipse(x + width - 60, y - 12, 34, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a83226';
  ctx.beginPath();
  ctx.ellipse(x + width - 60, y - 16, 30, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawSun(ctx, x, y, radius, time) {
  const wobble = Math.sin(time * 0.8) * 2;
  const glow = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius * 2.2);
  glow.addColorStop(0, 'rgba(255, 236, 170, 0.9)');
  glow.addColorStop(1, 'rgba(255, 236, 170, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffdf6b';
  ctx.beginPath();
  ctx.arc(x, y, radius + wobble, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.55, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCloud(ctx, x, y, scale) {
  ctx.fillStyle = 'rgba(255, 248, 230, 0.92)';
  ctx.beginPath();
  ctx.arc(x, y, 26 * scale, 0, Math.PI * 2);
  ctx.arc(x + 28 * scale, y - 8 * scale, 30 * scale, 0, Math.PI * 2);
  ctx.arc(x + 58 * scale, y, 24 * scale, 0, Math.PI * 2);
  ctx.arc(x + 30 * scale, y + 10 * scale, 26 * scale, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBarn(ctx, x, groundY, scale) {
  // The red barn on the horizon: simple gables, white trim, a hayloft door.
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#a83226';
  ctx.fillRect(-110, -150, 220, 150);
  ctx.beginPath();
  ctx.moveTo(-128, -150);
  ctx.lineTo(0, -225);
  ctx.lineTo(128, -150);
  ctx.closePath();
  ctx.fillStyle = '#8e2a20';
  ctx.fill();
  ctx.strokeStyle = '#fff3d6';
  ctx.lineWidth = 6;
  ctx.strokeRect(-110, -150, 220, 150);
  ctx.beginPath();
  ctx.moveTo(-128, -150);
  ctx.lineTo(0, -225);
  ctx.lineTo(128, -150);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = '#5d1d14';
  ctx.fillRect(-34, -60, 68, 60);
  ctx.strokeStyle = '#fff3d6';
  ctx.lineWidth = 4;
  ctx.strokeRect(-34, -60, 68, 60);
  ctx.beginPath();
  ctx.moveTo(-34, -60);
  ctx.lineTo(34, 0);
  ctx.moveTo(34, -60);
  ctx.lineTo(-34, 0);
  ctx.stroke();
  ctx.fillStyle = '#fff3d6';
  ctx.fillRect(-22, -118, 44, 34);
  ctx.fillStyle = '#5d1d14';
  ctx.fillRect(-18, -114, 36, 26);
  ctx.restore();
}

export function drawFence(ctx, x, groundY, width) {
  // A crooked wooden fence: two rails and a few posts, leaning on purpose.
  ctx.save();
  ctx.strokeStyle = '#7a4a22';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  const posts = Math.max(2, Math.floor(width / 90) + 1);
  for (let i = 0; i < posts; i++) {
    const px = x + (i * width) / (posts - 1);
    ctx.beginPath();
    ctx.moveTo(px, groundY - 52);
    ctx.lineTo(px + 4, groundY + 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x, groundY - 44);
  ctx.lineTo(x + width, groundY - 40);
  ctx.moveTo(x, groundY - 20);
  ctx.lineTo(x + width, groundY - 24);
  ctx.stroke();
  ctx.restore();
}

export function drawTree(ctx, x, groundY, scale, time) {
  const sway = Math.sin(time * 0.7 + x * 0.01) * 3;
  ctx.save();
  ctx.translate(x, groundY);
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(-9 * scale, -90 * scale, 18 * scale, 90 * scale);
  const blobs = [
    [-34, -110, 42], [30, -118, 46], [0, -150, 52],
    [-18, -128, 36], [22, -138, 34],
  ];
  for (const [bx, by, br] of blobs) {
    ctx.fillStyle = (bx + by) % 2 === 0 ? '#d2691e' : '#c2571b';
    ctx.beginPath();
    ctx.arc(bx * scale + sway, by * scale, br * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#e8702a';
  ctx.beginPath();
  ctx.arc(8 * scale + sway, -158 * scale, 20 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawHaystack(ctx, x, groundY, scale) {
  // A haystack the turkey can hide behind: golden arcs and a pitchfork stuck in.
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  ctx.fillStyle = PALETTE.hayDark;
  ctx.beginPath();
  ctx.moveTo(-58, 0);
  ctx.quadraticCurveTo(-52, -78, 0, -84);
  ctx.quadraticCurveTo(52, -78, 58, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.hay;
  ctx.beginPath();
  ctx.moveTo(-50, 0);
  ctx.quadraticCurveTo(-46, -66, 0, -72);
  ctx.quadraticCurveTo(46, -66, 50, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.hayDark;
  ctx.lineWidth = 3;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 14, -66 + Math.abs(i) * 6);
    ctx.quadraticCurveTo(i * 16, -34, i * 15, -6);
    ctx.stroke();
  }
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(30, -70);
  ctx.lineTo(44, -108);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(44, -108);
  ctx.lineTo(36, -96);
  ctx.moveTo(44, -108);
  ctx.lineTo(52, -98);
  ctx.stroke();
  ctx.restore();
}

export function drawCornCob(ctx, x, y, scale, bob) {
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#2f7a2e';
  ctx.beginPath();
  ctx.ellipse(-8, 12, 7, 16, 0.5, 0, Math.PI * 2);
  ctx.ellipse(10, 12, 7, 16, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.corn;
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8a91c';
  for (let row = -2; row <= 2; row++) {
    for (let col = -1; col <= 1; col++) {
      ctx.beginPath();
      ctx.arc(col * 7, row * 8, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
