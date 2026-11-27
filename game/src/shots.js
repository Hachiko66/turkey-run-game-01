// shots.js — screenshot staging for the maker.
// One job: when the page is opened with ?shot=title|play|caught|escaped, put the
// game into that exact state with a staged, readable scene and freeze it, so a
// screenshot is a real render of the game's own code, deterministic and legible.
// This is the maker's own camera, not a cheat: every pixel still comes from the
// game's draw code, and the game plays normally without the parameter.

export function shotParam() {
  try {
    return new URLSearchParams(window.location.search).get('shot');
  } catch (err) {
    return null;
  }
}

export function stageShot(game, kind) {
  const { world, turkey, farmer } = game;
  if (kind === 'title') {
    game.state = 'title';
    return true;
  }
  if (kind === 'play') {
    game.state = 'playing';
    game.frozen = true;
    game.score = 1840;
    game.corn = 12;
    game.distance = 523;
    world.distance = 523;
    world.scrollX = 523 * 50;
    world.stageIndex = 1;
    world.speed = 300;
    world.time = 4.2;
    turkey.x = 300;
    turkey.y = 130;
    turkey.vy = 240;
    turkey.onGround = false;
    turkey.runPhase = 2.1;
    farmer.gap = 150;
    farmer.state = 'chase';
    farmer.stateTimer = 0.6;
    farmer.spottedFlash = 0.6;
    farmer.walkPhase = 3.4;
    // A busy, readable mid-run moment: fence to jump, oven glowing, a knife
    // about to fall, corn to grab, a haystack to hide behind.
    world.obstacles = [
      { kind: 'fence', x: 640, w: 90, h: 58 },
      { kind: 'oven', x: 900, w: 140, h: 118 },
      { kind: 'knife', x: 1080, y: 60, vy: 0, state: 'falling', warned: 0.3 },
      { kind: 'haystack', x: 1130, w: 110, h: 84, used: false },
    ];
    world.corns = [
      { x: 560, y: 480, taken: false },
      { x: 606, y: 440, taken: false },
      { x: 652, y: 440, taken: false },
      { x: 760, y: 480, taken: false },
    ];
    world.spawnTimer = 2;
    return true;
  }
  if (kind === 'caught') {
    game.state = 'caught';
    game.score = 2310;
    game.distance = 687;
    game.corn = 18;
    game.endStats = { score: 2310, distance: 687, corn: 18 };
    game.bestScore = 2310;
    world.distance = 687;
    world.stageIndex = 1;
    world.time = 6.5;
    farmer.gap = 40;
    farmer.state = 'corner';
    return true;
  }
  if (kind === 'escaped') {
    game.state = 'escaped';
    game.score = 5420;
    game.distance = 1200;
    game.corn = 41;
    game.endStats = { score: 5420, distance: 1200, corn: 41 };
    game.bestScore = 5420;
    world.distance = 1200;
    world.stageIndex = 2;
    world.time = 8.0;
    world.gateX = 700;
    turkey.x = 300;
    turkey.runPhase = 5.0;
    return true;
  }
  return false;
}
