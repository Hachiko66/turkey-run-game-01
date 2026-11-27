// farmer.js — Farmer Bram, the hunter.
// One job: the farmer's AI (patrol, chase, search, corner) and his gap behind the
// turkey, plus drawing him. The gap is the game's real health bar: when it closes,
// the turkey is caught.

export const FARMER_STATES = {
  PATROL: 'patrol',
  CHASE: 'chase',
  SEARCH: 'search',
  CORNER: 'corner',
};

export const GAP_START = 280;
export const GAP_MAX = 330;
export const GAP_CAUGHT = 46;
export const GAP_CHASE_BELOW = 205;
export const GAP_CORNER_BELOW = 112;

export function createFarmer() {
  return {
    state: FARMER_STATES.PATROL,
    gap: GAP_START,
    stateTimer: 0,
    searchX: 0,
    searchHaystack: null,
    walkPhase: 0,
    cornerWarned: false,
    spottedFlash: 0,
    grumble: 0,
  };
}

export function resetFarmer(farmer) {
  Object.assign(farmer, createFarmer());
}

export function farmerScreenX(farmer, turkeyX) {
  return turkeyX - farmer.gap;
}

export function farmerLabel(farmer) {
  switch (farmer.state) {
    case FARMER_STATES.CHASE: return 'SPOTTED!';
    case FARMER_STATES.SEARCH: return 'SEARCHING...';
    case FARMER_STATES.CORNER: return 'CORNERED!';
    default: return 'ON THE TRAIL';
  }
}

export function updateFarmer(farmer, dt, turkey, world, now) {
  farmer.stateTimer += dt;
  farmer.walkPhase += dt * (farmer.state === FARMER_STATES.CHASE ? 13 : 7);
  if (farmer.spottedFlash > 0) farmer.spottedFlash -= dt;
  if (farmer.grumble > 0) farmer.grumble -= dt;

  const speed = world.speed;
  const turkeyVisible = !turkey.hidden;

  switch (farmer.state) {
    case FARMER_STATES.PATROL: {
      // Ambling along the trail, slowly gaining when the turkey dawdles.
      farmer.gap -= 4 * dt;
      if (turkeyVisible && farmer.gap < GAP_CHASE_BELOW) {
        farmer.state = FARMER_STATES.CHASE;
        farmer.stateTimer = 0;
        farmer.spottedFlash = 0.9;
        farmer.grumble = 1.2;
      }
      break;
    }
    case FARMER_STATES.CHASE: {
      // He has seen her: he runs, and the gap shrinks fast.
      farmer.gap -= (26 + world.stageIndex * 4) * dt;
      if (!turkeyVisible) {
        farmer.state = FARMER_STATES.SEARCH;
        farmer.stateTimer = 0;
        farmer.searchX = turkey.x - 40;
      } else if (farmer.gap > GAP_CHASE_BELOW + 60) {
        farmer.state = FARMER_STATES.PATROL;
        farmer.stateTimer = 0;
      }
      break;
    }
    case FARMER_STATES.SEARCH: {
      // He lost her at the haystack: he walks up to it and pokes around.
      farmer.gap = Math.max(farmer.gap - 30 * dt, 60);
      if (farmer.stateTimer > 2.4) {
        // Gave up: the trail is cold, he falls back and she slips away.
        farmer.gap = Math.min(GAP_MAX, farmer.gap + 110);
        farmer.state = FARMER_STATES.PATROL;
        farmer.stateTimer = 0;
      }
      break;
    }
    case FARMER_STATES.CORNER: {
      // He has her nearly cornered: one lunge and it is over.
      farmer.gap -= 55 * dt;
      if (farmer.stateTimer > 1.1) {
        farmer.gap = GAP_CAUGHT - 1;
      }
      break;
    }
    default:
      break;
  }

  // Corner trigger: when he gets very close while she is out in the open,
  // he stops ambling and lunges. A dash is the only way out.
  if (
    turkeyVisible &&
    farmer.gap < GAP_CORNER_BELOW &&
    farmer.state !== FARMER_STATES.CORNER &&
    farmer.state !== FARMER_STATES.SEARCH
  ) {
    farmer.state = FARMER_STATES.CORNER;
    farmer.stateTimer = 0;
    farmer.cornerWarned = true;
    farmer.spottedFlash = 1.1;
  }

  // Clean running earns breathing room; stumbling never does.
  if (farmer.state === FARMER_STATES.PATROL && turkey.onGround && !turkey.hidden) {
    farmer.gap = Math.min(GAP_MAX, farmer.gap + 5 * dt);
  }
  farmer.gap = Math.max(20, Math.min(GAP_MAX, farmer.gap));
}

export function farmerStumblePenalty(farmer, amount) {
  // A hit lets him close in: the turkey's mistake is his opportunity.
  farmer.gap = Math.max(20, farmer.gap - amount);
  if (farmer.state === FARMER_STATES.PATROL) {
    farmer.state = FARMER_STATES.CHASE;
    farmer.stateTimer = 0;
    farmer.spottedFlash = 0.9;
  }
}

export function farmerDashEscape(farmer) {
  // A well-timed dash breaks his corner: he stumbles and loses the trail.
  if (farmer.state !== FARMER_STATES.CORNER) return false;
  farmer.gap = Math.min(GAP_MAX, farmer.gap + 130);
  farmer.state = FARMER_STATES.PATROL;
  farmer.stateTimer = 0;
  farmer.grumble = 1.5;
  return true;
}

export function farmerCaught(farmer) {
  return farmer.gap <= GAP_CAUGHT;
}

export function drawFarmer(ctx, farmer, turkeyX, groundY, time) {
  // Farmer Bram: straw hat, red-check shirt, blue overalls, big boots and a
  // pitchfork. He leans into his run when he chases and scratches his head
  // when he searches — the animation tells the player what he is thinking.
  const x = farmerScreenX(farmer, turkeyX);
  const running = farmer.state === FARMER_STATES.CHASE || farmer.state === FARMER_STATES.CORNER;
  const searching = farmer.state === FARMER_STATES.SEARCH;
  const legSwing = Math.sin(farmer.walkPhase) * (running ? 14 : 7);
  const bob = Math.abs(Math.sin(farmer.walkPhase)) * (running ? 5 : 2);
  const lean = running ? 0.18 : (searching ? -0.08 : 0.05);

  ctx.save();
  ctx.translate(x, groundY - bob);
  ctx.rotate(lean);

  // Boots and legs.
  ctx.strokeStyle = '#5d3a1a';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -46);
  ctx.lineTo(-8 + legSwing, 0);
  ctx.moveTo(8, -46);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();
  ctx.fillStyle = '#4a2c14';
  ctx.beginPath();
  ctx.ellipse(-8 + legSwing, -2, 10, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(8 - legSwing, -2, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Overalls: blue body with straps and a front pocket.
  ctx.fillStyle = '#3b5b8c';
  ctx.beginPath();
  ctx.roundRect(-20, -92, 40, 48, 6);
  ctx.fill();
  ctx.fillStyle = '#2f4a73';
  ctx.fillRect(-20, -92, 40, 8);
  ctx.fillStyle = '#c9a13a';
  ctx.fillRect(-8, -72, 16, 12);

  // Shirt: red check, sleeves rolled.
  ctx.fillStyle = '#a83226';
  ctx.beginPath();
  ctx.roundRect(-24, -118, 48, 30, 8);
  ctx.fill();
  ctx.strokeStyle = '#fff3d6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-24, -104);
  ctx.lineTo(24, -104);
  ctx.moveTo(0, -118);
  ctx.lineTo(0, -88);
  ctx.stroke();

  // Arms: one carries the pitchfork, the other swings — or scratches his head.
  const armSwing = searching ? 0 : Math.sin(farmer.walkPhase) * 8;
  ctx.strokeStyle = '#a83226';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(20, -112);
  ctx.lineTo(34, -78 + armSwing);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-20, -112);
  ctx.lineTo(searching ? -6 : -30, searching ? -132 : -80 - armSwing);
  ctx.stroke();

  // Head: round face, white beard, angry eyebrows when chasing.
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.arc(0, -134, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2f2f2';
  ctx.beginPath();
  ctx.ellipse(2, -122, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eyes: narrow slits when he chases, round dots when he patrols.
  ctx.fillStyle = '#1d1d1d';
  const eyeH = running ? 1.6 : 3.2;
  ctx.beginPath();
  ctx.ellipse(-5, -138, 3, eyeH, 0, 0, Math.PI * 2);
  ctx.ellipse(6, -138, 3, eyeH, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eyebrows: slanted down when he is on the hunt.
  ctx.strokeStyle = '#6b4423';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-9, running ? -146 : -143);
  ctx.lineTo(-1, running ? -141 : -144);
  ctx.moveTo(3, running ? -141 : -144);
  ctx.lineTo(11, running ? -146 : -143);
  ctx.stroke();
  // Nose and moustache.
  ctx.fillStyle = '#d98a5f';
  ctx.beginPath();
  ctx.arc(1, -132, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2f2f2';
  ctx.beginPath();
  ctx.ellipse(1, -128, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Straw hat: wide brim, dented crown.
  ctx.fillStyle = '#e8c25a';
  ctx.beginPath();
  ctx.ellipse(0, -148, 26, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9ad45';
  ctx.beginPath();
  ctx.ellipse(0, -156, 13, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a83226';
  ctx.fillRect(-13, -152, 26, 4);

  // Pitchfork, held high: the tool of a man who wants his dinner.
  ctx.save();
  ctx.translate(38, -70);
  ctx.rotate(running ? -0.35 : -0.15);
  ctx.strokeStyle = '#7a4a22';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -72);
  ctx.stroke();
  ctx.strokeStyle = '#9aa5b1';
  ctx.lineWidth = 3;
  for (const tx of [-8, 0, 8]) {
    ctx.beginPath();
    ctx.moveTo(tx, -72);
    ctx.lineTo(tx, -88);
    ctx.stroke();
  }
  ctx.restore();

  // Spotted "!" bubble when he catches sight of her.
  if (farmer.spottedFlash > 0 && (running || farmer.state === FARMER_STATES.CORNER)) {
    const alpha = Math.min(1, farmer.spottedFlash);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.arc(30, -182, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c93b2e';
    ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', 30, -174);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
