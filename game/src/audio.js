// audio.js — every sound in Gobble Dash, synthesized live with WebAudio.
// One job: gobbles, jumps, pickups, alarms and a cheerful harvest tune.
// No audio files, no network: oscillators and noise buffers only.

export function createAudio() {
  return {
    ctx: null,
    master: null,
    musicGain: null,
    muted: false,
    musicTimer: null,
    musicStep: 0,
    started: false,
  };
}

export function ensureAudioContext(audio) {
  if (audio.ctx) {
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    return true;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    audio.ctx = new AC();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = audio.muted ? 0 : 0.5;
    audio.master.connect(audio.ctx.destination);
    audio.musicGain = audio.ctx.createGain();
    audio.musicGain.gain.value = 0.16;
    audio.musicGain.connect(audio.master);
    return true;
  } catch (err) {
    return false;
  }
}

export function setMuted(audio, muted) {
  audio.muted = muted;
  if (audio.master && audio.ctx) {
    audio.master.gain.setTargetAtTime(muted ? 0 : 0.5, audio.ctx.currentTime, 0.05);
  }
}

function tone(audio, freq, dur, type, vol, when = 0, slideTo = null) {
  if (!audio.ctx || audio.muted) return;
  const t0 = audio.ctx.currentTime + when;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(audio, dur, vol, filterFreq, when = 0) {
  if (!audio.ctx || audio.muted) return;
  const t0 = audio.ctx.currentTime + when;
  const len = Math.max(1, Math.floor(audio.ctx.sampleRate * dur));
  const buffer = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = audio.ctx.createBufferSource();
  src.buffer = buffer;
  const filter = audio.ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = audio.ctx.createGain();
  gain.gain.value = vol;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(audio.master);
  src.start(t0);
}

export function playGobble(audio) {
  // Gobble-gobble: three quick descending clucks.
  if (!ensureAudioContext(audio)) return;
  for (let i = 0; i < 3; i++) {
    tone(audio, 320 - i * 40, 0.09, 'square', 0.16, i * 0.09, 180 - i * 20);
  }
  tone(audio, 520, 0.12, 'triangle', 0.12, 0.3, 300);
}

export function playJump(audio) {
  if (!ensureAudioContext(audio)) return;
  tone(audio, 280, 0.16, 'sine', 0.22, 0, 620);
  noiseBurst(audio, 0.08, 0.08, 1200);
}

export function playDash(audio) {
  if (!ensureAudioContext(audio)) return;
  noiseBurst(audio, 0.22, 0.2, 2400);
  tone(audio, 500, 0.2, 'sawtooth', 0.08, 0, 900);
}

export function playPickup(audio) {
  if (!ensureAudioContext(audio)) return;
  tone(audio, 880, 0.09, 'triangle', 0.2, 0, 1320);
  tone(audio, 1320, 0.12, 'triangle', 0.14, 0.07, 1760);
}

export function playGolden(audio) {
  // Golden Rush fanfare: a bright rising arpeggio with a shimmer on top.
  if (!ensureAudioContext(audio)) return;
  const notes = [784, 988, 1175, 1568];
  notes.forEach((n, i) => tone(audio, n, 0.16, 'triangle', 0.2, i * 0.07));
  tone(audio, 2093, 0.35, 'sine', 0.1, 0.28, 1568);
  tone(audio, 1568, 0.3, 'triangle', 0.12, 0.28);
}

export function playHide(audio) {
  if (!ensureAudioContext(audio)) return;
  noiseBurst(audio, 0.3, 0.14, 700);
  tone(audio, 220, 0.2, 'sine', 0.1, 0, 140);
}

export function playSpotted(audio) {
  // The alarm: two sharp brass-ish blasts when the farmer sees her.
  if (!ensureAudioContext(audio)) return;
  for (let i = 0; i < 2; i++) {
    tone(audio, 620, 0.16, 'sawtooth', 0.14, i * 0.2, 580);
    tone(audio, 930, 0.16, 'square', 0.07, i * 0.2, 880);
  }
}

export function playHit(audio) {
  if (!ensureAudioContext(audio)) return;
  noiseBurst(audio, 0.25, 0.3, 500);
  tone(audio, 180, 0.3, 'sawtooth', 0.2, 0, 60);
}

export function playShieldBlock(audio) {
  // Golden Rush block: a bright metallic clink — the hit bounced off.
  if (!ensureAudioContext(audio)) return;
  tone(audio, 1568, 0.1, 'triangle', 0.18, 0, 2093);
  tone(audio, 2093, 0.14, 'sine', 0.12, 0.05);
  noiseBurst(audio, 0.06, 0.1, 5000);
}

export function playStageChime(audio) {
  // A new stage opens: two warm bell notes that say "faster now".
  if (!ensureAudioContext(audio)) return;
  tone(audio, 659, 0.22, 'triangle', 0.18, 0, 880);
  tone(audio, 880, 0.3, 'triangle', 0.16, 0.16, 1175);
}

export function playCaught(audio) {
  // A sad little trombone slide down.
  if (!ensureAudioContext(audio)) return;
  tone(audio, 392, 0.5, 'sawtooth', 0.16, 0, 370);
  tone(audio, 370, 0.5, 'sawtooth', 0.16, 0.45, 330);
  tone(audio, 330, 0.7, 'sawtooth', 0.16, 0.9, 196);
  tone(audio, 196, 0.9, 'sawtooth', 0.14, 1.55, 130);
}

export function playEscapeFanfare(audio) {
  // A bright harvest fanfare: rising arpeggio, then a happy chord.
  if (!ensureAudioContext(audio)) return;
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((n, i) => tone(audio, n, 0.22, 'triangle', 0.2, i * 0.11));
  [523, 659, 784].forEach((n) => tone(audio, n, 0.9, 'triangle', 0.12, 0.6));
  playGobble(audio);
  tone(audio, 1047, 0.9, 'triangle', 0.12, 0.6);
}

// A simple harvest tune: a pentatonic walk over a soft bass, looped with a timer.
const MELODY = [
  523, 0, 587, 659, 0, 784, 659, 587,
  523, 0, 587, 659, 784, 0, 880, 784,
  659, 0, 587, 659, 523, 0, 440, 523,
  587, 659, 587, 523, 0, 0, 440, 0,
];
const BASS = [131, 0, 0, 0, 175, 0, 0, 0, 196, 0, 0, 0, 175, 0, 0, 0,
  131, 0, 0, 0, 175, 0, 0, 0, 196, 0, 175, 0, 131, 0, 0, 0];

function musicNote(audio, freq, dur, type, vol) {
  if (!audio.ctx || audio.muted) return;
  const t0 = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(audio.musicGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function startMusic(audio) {
  if (!ensureAudioContext(audio)) return;
  if (audio.musicTimer !== null) return;
  audio.musicTimer = setInterval(() => {
    if (audio.muted || !audio.ctx) return;
    const i = audio.musicStep % MELODY.length;
    const m = MELODY[i];
    const b = BASS[i];
    if (m) musicNote(audio, m, 0.22, 'triangle', 0.5);
    if (b) musicNote(audio, b, 0.4, 'sine', 0.6);
    audio.musicStep++;
  }, 210);
}

export function stopMusic(audio) {
  if (audio.musicTimer !== null) {
    clearInterval(audio.musicTimer);
    audio.musicTimer = null;
  }
}
