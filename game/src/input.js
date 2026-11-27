// input.js — keyboard and mouse, the two ways to play Gobble Dash.
// One job: turn raw DOM events into a clean per-frame input state with edges
// (just-pressed), so the game never has to read the DOM itself.

export function createInput() {
  return {
    left: false,
    right: false,
    down: false,
    jumpPressed: false,
    dashPressed: false,
    hidePressed: false,
    enterPressed: false,
    pausePressed: false,
    mutePressed: false,
    mouseX: 0,
    mouseY: 0,
    mousePressed: false,
    mouseClicked: false,
    keys: new Set(),
  };
}

export function attachInput(input, canvas) {
  const downKeys = new Set();

  function keyName(e) {
    return e.code;
  }

  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.repeat) return;
    const code = keyName(e);
    downKeys.add(code);
    input.keys.add(code);
    if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') input.jumpPressed = true;
    if (code === 'ArrowLeft' || code === 'KeyA') input.left = true;
    if (code === 'ArrowRight' || code === 'KeyD') input.right = true;
    if (code === 'ArrowDown' || code === 'KeyS') {
      input.down = true;
      input.hidePressed = true;
    }
    if (code === 'ShiftLeft' || code === 'ShiftRight') input.dashPressed = true;
    if (code === 'Enter' || code === 'NumpadEnter') input.enterPressed = true;
    if (code === 'KeyP' || code === 'Escape') input.pausePressed = true;
    if (code === 'KeyM') input.mutePressed = true;
  });

  window.addEventListener('keyup', (e) => {
    const code = keyName(e);
    downKeys.delete(code);
    input.keys.delete(code);
    if (code === 'ArrowLeft' || code === 'KeyA') input.left = false;
    if (code === 'ArrowRight' || code === 'KeyD') input.right = false;
    if (code === 'ArrowDown' || code === 'KeyS') input.down = false;
  });

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 1280,
      y: ((e.clientY - rect.top) / rect.height) * 720,
    };
  }

  canvas.addEventListener('mousemove', (e) => {
    const p = canvasPos(e);
    input.mouseX = p.x;
    input.mouseY = p.y;
  });

  canvas.addEventListener('mousedown', (e) => {
    const p = canvasPos(e);
    input.mouseX = p.x;
    input.mouseY = p.y;
    input.mousePressed = true;
    input.mouseClicked = true;
  });

  canvas.addEventListener('mouseup', () => {
    input.mousePressed = false;
  });

  window.addEventListener('blur', () => {
    input.left = false;
    input.right = false;
    input.down = false;
    input.keys.clear();
    downKeys.clear();
  });
}

export function consumeFrameEdges(input) {
  // Called once per frame after the game has read the edges.
  input.jumpPressed = false;
  input.dashPressed = false;
  input.hidePressed = false;
  input.enterPressed = false;
  input.pausePressed = false;
  input.mutePressed = false;
  input.mouseClicked = false;
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
