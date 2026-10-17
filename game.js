// Pink Unicorn - a tiny canvas shooter. No assets, no build step: everything is drawn in code.
const cv = document.getElementById('c'), g = cv.getContext('2d');
const W = cv.width, H = cv.height;

// Each chapter: sky gradient, run-up time (s) and spawn gap (frames), boss, boss pattern, and which hazards appear.
const CHAPTERS = [
  { name: 'Candy Clouds', line: "The sky turned grumpy. Let's fix it!",   sky: ['#ffd6f0', '#c9f0ff'], time: 35, rate: 46, boss: 'Grumpy Saucer', hp: 20, pat: 0, bats: 0, spikes: 0 },
  { name: 'Mermaid Bay', line: "Mermaid knows a shortcut over the waves.",    sky: ['#b8f0ff', '#3f9bd6'], time: 38, rate: 44, boss: 'Bubble Saucer', hp: 28, pat: 1, bats: 0, spikes: 0 },
  { name: 'Starry Night', line: "The saucers hide in the dark. Follow the stars.",   sky: ['#3a1c71', '#0f0c29'], time: 40, rate: 41, boss: 'Moon Saucer',   hp: 36, pat: 0, bats: 1, spikes: 0 },
  { name: 'Aurora Peaks', line: "Lights are dancing over the snowy peaks!",   sky: ['#123a5e', '#0b1e3a'], time: 42, rate: 38, boss: 'Aurora Saucer', hp: 42, pat: 1, bats: 1, spikes: 0 },
  { name: 'Rainbow Canyon', line: "Sunset over the canyon... something is humming.", sky: ['#ffb36b', '#8e44ad'], time: 42, rate: 36, boss: 'Sunset Saucer', hp: 48, pat: 2, bats: 1, spikes: 0 },
  { name: 'Coral Reef', line: "Dive deep — the reef is hiding something shiny.", sky: ['#7fe3d0', '#146b8a'], time: 44, rate: 34, boss: 'Coral Saucer', hp: 54, pat: 0, bats: 0, spikes: 1 },
  { name: 'Crystal Caves', line: "Careful! The crystals are sharp.",  sky: ['#0b3d4a', '#1b1038'], time: 46, rate: 31, boss: 'Gem Saucer',    hp: 60, pat: 1, bats: 1, spikes: 1 },
  { name: 'Storm Fortress', line: "The Storm King's last stand.", sky: ['#4a4e69', '#14141f'], time: 50, rate: 28, boss: 'Storm King',    hp: 78, pat: 2, bats: 1, spikes: 1 },
];

let state = 'title', ch = 0, t = 0, score = 0, lives = 3, combo = 0, muted = false, best = 0;
let things = [], shots = [], bolts = [], sparks = [], boss = null, flash = 0, shield = 0, clear = 0;
let trans = null, ending = 0, shake = 0, paused = false, warn = 0, mt = 0;
const uni = { x: 150, y: H / 2, ty: H / 2 };
const mer = { x: 80, y: H / 2, cd: 0 };
const keys = {};
try { best = +localStorage.getItem('pinkUnicornBest') || 0; } catch (e) {}

// ---- input ----
addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === 'm') muted = !muted;
  if (e.key === 'p' || e.key === 'Escape') paused = !paused && state === 'play';
  if (e.key === ' ' || e.key === 'Enter') press();
});
addEventListener('keyup', e => keys[e.key] = false);
function pointer(e) {
  const r = cv.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;
  uni.ty = (p.clientY - r.top) * H / r.height;
}
addEventListener('blur', () => { if (state === 'play') paused = true; });
cv.addEventListener('mousemove', pointer);
cv.addEventListener('touchmove', e => { pointer(e); e.preventDefault(); }, { passive: false });
cv.addEventListener('pointerdown', e => { pointer(e); press(); });
function press() {
  audio();
  if (trans) return;
  if (paused) { paused = false; return; }
  if (state === 'title') start(0);
  else if (state === 'over') toTitle();
  else if (state === 'chapter') state = 'play';
  else if (state === 'ending' && ending > 240) toTitle();
}

// ---- sound (WebAudio blips, created lazily so iOS lets it play) ----
let ac;
function audio() { if (!ac) try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} if (ac && ac.state === 'suspended') ac.resume(); }
function beep(f, d = 0.1, type = 'square', v = 0.05) {
  if (muted || !ac) return;
  const o = ac.createOscillator(), a = ac.createGain();
  o.type = type; o.frequency.value = f; a.gain.value = v;
  a.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d);
  o.connect(a); a.connect(ac.destination); o.start(); o.stop(ac.currentTime + d);
}
function jingle(notes) { notes.forEach((f, i) => setTimeout(() => beep(f, .25, 'triangle', .06), i * 140)); }

// Tiny arpeggio music: root note per chapter, faster and higher during boss fights.
const ROOTS = [262, 294, 220, 311, 330, 278, 247, 196], SCALE = [0, 4, 7, 12, 7, 4, 9, 5];
function music() {
  mt++;
  const step = boss && !clear ? 8 : 12;
  if (mt % step) return;
  const i = (mt / step) | 0, f = ROOTS[ch] * Math.pow(2, SCALE[i % 8] / 12) * (boss ? 1 : .5);
  beep(f, .22, 'triangle', .025);
  if (i % 8 === 0) beep(ROOTS[ch] / 4, .5, 'sine', .04);
}

// ---- game flow ----
// A rainbow curtain sweeps across; fn runs when the screen is fully covered.
// Even chapters sweep left, odd chapters sweep right; the next stop's name shows at full cover.
function go(fn, label) { if (!trans) trans = { t: 0, fn, label }; }
function start(c) {
  go(() => {
    ch = c; t = 0; things = []; shots = []; bolts = []; boss = null; clear = 0; shield = 0;
    if (c === 0) { score = 0; lives = 3; }
    combo = 0; state = 'chapter'; ending = 0;
    jingle([523, 659, 784]);
  }, `Chapter ${c + 1} · ${CHAPTERS[c].name}`);
}
function toTitle() { go(() => { state = 'title'; ending = 0; t = 0; }, 'Pink Unicorn'); }
function saveBest() { if (score > best) { best = score; try { localStorage.setItem('pinkUnicornBest', best); } catch (e) {} } }
function hurt() {
  if (flash > 0 || shield > 0) return;
  lives--; combo = 0; flash = 90; shake = 12; beep(120, 0.4, 'sawtooth');
  if (lives <= 0) { state = 'over'; saveBest(); }
}
function boom(x, y, col, n = 12) { for (let i = 0; i < n; i++) sparks.push({ x, y, vx: (Math.random() - .5) * 8, vy: (Math.random() - .5) * 8, l: 30, col }); }
const hit = (a, b, r) => Math.hypot(a.x - b.x, a.y - b.y) < r;

function spawn() {
  const c = CHAPTERS[ch], r = Math.random(), y = 40 + Math.random() * (H - 80), vx = -(3 + ch * .6 + Math.random() * 2);
  let kind = r < .45 ? 'ring' : r < .6 ? 'heart' : r < .65 ? 'star' : 'cloud';
  if (kind === 'cloud' && c.bats && Math.random() < .4) kind = 'bat';
  if (kind === 'cloud' && c.spikes && Math.random() < .5) kind = 'spike';
  if (kind === 'heart' && lives >= 5) kind = 'ring';
  if (kind === 'spike') { const top = Math.random() < .5; things.push({ kind, x: W + 30, y: top ? 20 : H - 20, top, vx, r: 34 }); return; }
  things.push({ kind, x: W + 30, y, y0: y, ph: Math.random() * 6, vx: kind === 'bat' ? vx - 1 : vx, r: kind === 'cloud' ? 28 : kind === 'bat' ? 20 : 16 });
}

function bossFire() {
  const p = CHAPTERS[ch].pat, sp = 4.5 + ch * .5, a = Math.atan2(uni.y - boss.y, uni.x - boss.x);
  const rate = Math.max(40, 80 - ch * 8);
  if (t % rate) return;
  if (p === 0) bolts.push({ x: boss.x - 40, y: boss.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp });
  else if (p === 1) for (const d of [-.35, 0, .35]) bolts.push({ x: boss.x - 40, y: boss.y, vx: Math.cos(a + d) * sp, vy: Math.sin(a + d) * sp });
  else for (let i = 0; i < 8; i++) { const b = i / 8 * 6.283 + t / 30; bolts.push({ x: boss.x, y: boss.y, vx: Math.cos(b) * sp * .8, vy: Math.sin(b) * sp * .8 }); }
}

function update() {
  t++;
  if (flash > 0) flash--;
  if (shield > 0) shield--;
  if (shake > 0) shake--;
  if (warn > 0) warn--;
  music();
  const sp = 7;
  if (keys.ArrowUp || keys.w) uni.ty = uni.y - 40;
  if (keys.ArrowDown || keys.s) uni.ty = uni.y + 40;
  uni.ty = Math.max(30, Math.min(H - 30, uni.ty));
  uni.y += Math.max(-sp, Math.min(sp, uni.ty - uni.y));
  mer.x += (uni.x - 90 - mer.x) * .1; mer.y += (uni.y + 30 - mer.y) * .08;

  // auto-fire rainbow sparkles
  if (t % 14 === 0) { shots.push({ x: uni.x + 40, y: uni.y, vx: 12 }); beep(880, .05, 'triangle', .03); }
  if (boss && ++mer.cd % 40 === 0) shots.push({ x: mer.x + 20, y: mer.y, vx: 10, m: 1 });

  if (!boss && !clear && t > CHAPTERS[ch].time * 60) {
    boss = { x: W + 100, y: H / 2, hp: CHAPTERS[ch].hp, max: CHAPTERS[ch].hp };
    things = []; warn = 120; beep(200, .6, 'sawtooth');
  }
  if (!boss && !clear && t % CHAPTERS[ch].rate === 0) spawn();

  for (const o of things) {
    o.x += o.vx;
    if (o.kind === 'bat') o.y = o.y0 + Math.sin(t / 15 + o.ph) * 70;
    const d = o.kind === 'spike' ? Math.hypot(o.x - uni.x, (o.top ? o.y + 40 : o.y - 40) - uni.y) : Math.hypot(o.x - uni.x, o.y - uni.y);
    if (d < o.r + 22) {
      if (o.kind === 'spike') { hurt(); continue; }
      o.dead = true;
      if (o.kind === 'ring') { combo++; score += 10 * Math.min(combo, 10); beep(660 + combo * 40, .1); boom(o.x, o.y, '#ffc400'); }
      else if (o.kind === 'heart') { lives = Math.min(5, lives + 1); beep(990, .2, 'sine'); boom(o.x, o.y, '#ff4d8d'); }
      else if (o.kind === 'star') { shield = 360; score += 50; jingle([784, 988, 1175]); boom(o.x, o.y, '#fff', 20); }
      else hurt();
    }
    if (o.x < -60) { o.dead = true; if (o.kind === 'ring') combo = 0; }
  }
  things = things.filter(o => !o.dead);

  for (const s of shots) {
    s.x += s.vx;
    if (boss && hit(s, boss, 60)) {
      s.dead = true; boss.hp--; score += 5; boom(s.x, s.y, '#ff00cc', 6); beep(300, .05);
      if (boss.hp <= 0) {
        score += 200 + lives * 50; shake = 40; clear = 1;
        for (let i = 0; i < 6; i++) setTimeout(() => boom(boss ? boss.x + (Math.random() - .5) * 120 : 0, boss ? boss.y + (Math.random() - .5) * 60 : 0, '#ff00cc', 20), i * 150);
        jingle([523, 659, 784, 1047]);
        saveBest(); bolts = [];
      }
    }
    if (s.x > W + 20) s.dead = true;
  }
  shots = shots.filter(s => !s.dead);

  if (boss && clear) { // boss spins away, then the curtain takes us to the next chapter
    boss.y += 2; boss.x += Math.sin(clear / 3) * 3; clear++;
    if (clear === 100) { boss = null; ch + 1 >= CHAPTERS.length ? startEnding() : start(ch + 1); }
  } else if (boss) {
    boss.x += (W - 170 - boss.x) * .03;
    boss.y = H / 2 + Math.sin(t / 40) * (H / 2 - 100);
    bossFire();
  }
  for (const b of bolts) { b.x += b.vx; b.y += b.vy; if (hit(b, uni, 28)) { b.dead = true; hurt(); } if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) b.dead = true; }
  bolts = bolts.filter(b => !b.dead);
}

function startEnding() { go(() => { state = 'ending'; ending = 0; things = []; shots = []; bolts = []; boss = null; sparks = []; saveBest(); }, 'The sky is safe again...'); }

// ---- drawing ----
function txt(s, x, y, size = 28, col = '#fff', align = 'center') {
  g.font = `bold ${size}px "Trebuchet MS", sans-serif`; g.textAlign = align;
  g.lineWidth = 5; g.strokeStyle = '#7a1a63'; g.lineJoin = 'round'; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y);
}
function drawUnicorn(x, y, glow) {
  g.save(); g.translate(x, y);
  if (glow) { g.fillStyle = `rgba(255,255,255,${.25 + .1 * Math.sin(t / 4)})`; g.beginPath(); g.arc(0, 0, 60, 0, 7); g.fill(); }
  g.fillStyle = '#ffb3e1'; g.beginPath(); g.ellipse(-10, 0, 38, 20, 0, 0, 7); g.fill();     // body
  g.beginPath(); g.ellipse(30, -14, 15, 12, -.3, 0, 7); g.fill();                              // head
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(36, -24); g.lineTo(50, -48); g.lineTo(42, -22); g.fill(); // horn
  g.fillStyle = '#ff5fc4'; g.beginPath(); g.ellipse(18, -22, 8, 14, .4, 0, 7); g.fill();       // mane
  const wing = Math.sin(t / 5) * 10;
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-12, -18 - wing / 2, 26, 10 + wing / 2, -.6, 0, 7); g.fill(); // wing
  g.strokeStyle = '#ffb3e1'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(-18, 14); g.lineTo(-22, 30); g.moveTo(10, 14); g.lineTo(14, 30); g.stroke();
  g.strokeStyle = '#ff5fc4'; g.beginPath(); g.moveTo(-46, -2); g.quadraticCurveTo(-70, 12, -56, 22); g.stroke(); // tail
  g.fillStyle = '#222'; g.beginPath(); g.arc(34, -16, 2.5, 0, 7); g.fill();
  g.restore();
}
function drawMermaid(x, y) {
  g.save(); g.translate(x, y);
  g.fillStyle = '#ffd9c2'; g.beginPath(); g.arc(0, -12, 9, 0, 7); g.fill();
  g.fillStyle = '#ff6fb5'; g.beginPath(); g.ellipse(-6, -10, 8, 13, .3, 0, 7); g.fill();       // pink hair
  g.fillStyle = '#18c4b4'; g.beginPath(); g.ellipse(0, 8, 8, 16, 0, 0, 7); g.fill();            // teal body/tail
  const f = Math.sin(t / 6) * 6;
  g.beginPath(); g.moveTo(0, 22); g.lineTo(-12 + f, 34); g.lineTo(12 + f, 34); g.fill();
  g.restore();
}
function drawBoss(b) {
  g.save(); g.translate(b.x, b.y);
  if (clear) g.rotate(clear / 12);
  g.fillStyle = '#d6199a'; g.beginPath(); g.ellipse(0, 10, 80, 24, 0, 0, 7); g.fill();
  g.fillStyle = '#a8e6ff'; g.beginPath(); g.ellipse(0, -8, 34, 30, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#555'; g.beginPath(); g.arc(0, -12, 14, 0, 7); g.fill();                        // grumpy pilot
  g.strokeStyle = '#000'; g.lineWidth = 3; g.beginPath(); g.moveTo(-9, -18); g.lineTo(-2, -14); g.moveTo(9, -18); g.lineTo(2, -14); g.stroke();
  for (let i = -2; i <= 2; i++) { g.fillStyle = (t / 8 + i) % 2 < 1 ? '#ffe84d' : '#fff'; g.beginPath(); g.arc(i * 28, 14, 5, 0, 7); g.fill(); }
  g.strokeStyle = '#7a1a63'; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, 92, 0, 7); g.stroke();   // health ring
  g.strokeStyle = '#7dff7d'; g.beginPath(); g.arc(0, 0, 92, -Math.PI / 2, -Math.PI / 2 + 6.283 * Math.max(0, b.hp) / b.max); g.stroke();
  g.restore();
}
function blob(x, y, s, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, 26 * s, 0, 7); g.arc(x + 24 * s, y + 6 * s, 20 * s, 0, 7); g.arc(x - 24 * s, y + 6 * s, 20 * s, 0, 7); g.fill(); }
const scroll = (i, sp, w = W + 200) => ((i * 197 - t * sp) % w + w) % w - 100;

// Parallax scenery that differs per chapter
function drawBg(i) {
  const c = CHAPTERS[i], gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, c.sky[0]); gr.addColorStop(1, c.sky[1]);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (i === 0) for (let k = 0; k < 6; k++) blob(scroll(k, .5 + k % 3 * .3), 60 + k * 70 % 400, 1.4, 'rgba(255,255,255,.55)');
  if (i === 1 || i === 5) {
    for (let k = 0; k < 14; k++) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.beginPath(); g.arc(scroll(k, .6), ((k * 83 - t * (1 + k % 3)) % H + H) % H, 4 + k % 4 * 2, 0, 7); g.stroke(); }
    g.strokeStyle = i === 5 ? '#e2725b' : '#1f8a5b'; g.lineWidth = 6;
    for (let k = 0; k < 12; k++) { const x = scroll(k, 1.5); g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + Math.sin(t / 25 + k) * 14, H - 40, x, H - 80 - k % 3 * 20); g.stroke(); }
  }
  if (i === 2 || i === 3 || i === 7) {
    g.fillStyle = '#fff';
    for (let k = 0; k < 40; k++) g.fillRect(scroll(k, 1 + k % 3, W), (k * 71) % H, 2, 2);
    if (i === 2) { g.fillStyle = '#fff6c9'; g.beginPath(); g.arc(780, 100, 44, 0, 7); g.fill(); g.fillStyle = CHAPTERS[2].sky[0]; g.beginPath(); g.arc(800, 90, 40, 0, 7); g.fill(); }
  }
  if (i === 3) { // Aurora Peaks: wavy light curtains over snowy ridges
    for (let b = 0; b < 4; b++) { g.strokeStyle = `hsla(${140 + b * 40},90%,65%,.35)`; g.lineWidth = 16 - b * 3; g.beginPath();
      for (let x = 0; x <= W; x += 20) g.lineTo(x, 70 + b * 34 + Math.sin(x / 90 + t / 30 + b) * 22); g.stroke(); }
    g.fillStyle = '#eaf6ff'; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W + 40; x += 40) g.lineTo(x, H - 60 - 50 * Math.abs(Math.sin(x / 150 + 1))); g.lineTo(W, H); g.fill();
  }
  if (i === 4) {
    g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(700, 330, 80, 0, 7); g.fill();
    for (let l = 0; l < 2; l++) { g.fillStyle = l ? '#5b2a7d' : '#7d3c98'; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W + 40; x += 40) g.lineTo(x, H - 90 - l * 40 - 60 * Math.abs(Math.sin((x + t * (1 + l)) / 120 + l))); g.lineTo(W, H); g.fill(); }
  }
  if (i === 6) for (let k = 0; k < 10; k++) {
    const x = scroll(k, 1.2), h = 50 + k * 37 % 70;
    g.fillStyle = k % 2 ? 'rgba(120,255,230,.35)' : 'rgba(255,120,220,.35)';
    g.beginPath(); g.moveTo(x - 18, H); g.lineTo(x, H - h); g.lineTo(x + 18, H); g.fill();
    g.beginPath(); g.moveTo(x - 18, 0); g.lineTo(x, h); g.lineTo(x + 18, 0); g.fill();
  }
  if (i === 7) {
    for (let k = 0; k < 5; k++) blob(scroll(k, 1.2), 50 + k * 30, 1.8, 'rgba(20,20,35,.8)');
    if (t % 240 < 6) { g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(0, 0, W, H); }
  }
}
function drawThing(o) {
  if (o.kind === 'cloud') blob(o.x, o.y, 1, ch === CHAPTERS.length - 1 ? '#34344a' : '#8a7a9c');
  else if (o.kind === 'ring') { g.strokeStyle = '#ffc400'; g.lineWidth = 5; g.beginPath(); g.arc(o.x, o.y, 13, 0, 7); g.stroke(); }
  else if (o.kind === 'heart') txt('♥', o.x, o.y + 10, 34, '#ff4d8d');
  else if (o.kind === 'star') txt('★', o.x, o.y + 12, 38, '#fff36b');
  else if (o.kind === 'bat') { const f = Math.sin(t / 3) * 10; g.fillStyle = '#2b1b3d'; g.beginPath(); g.ellipse(o.x, o.y, 9, 11, 0, 0, 7); g.moveTo(o.x - 4, o.y); g.lineTo(o.x - 28, o.y - 10 + f); g.lineTo(o.x - 8, o.y + 8); g.moveTo(o.x + 4, o.y); g.lineTo(o.x + 28, o.y - 10 + f); g.lineTo(o.x + 8, o.y + 8); g.fill(); g.fillStyle = '#f33'; g.fillRect(o.x - 5, o.y - 3, 3, 3); g.fillRect(o.x + 2, o.y - 3, 3, 3); }
  else if (o.kind === 'spike') { g.fillStyle = '#9ff'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(o.x - 22, o.top ? 0 : H); g.lineTo(o.x, o.top ? o.y + 55 : o.y - 55); g.lineTo(o.x + 22, o.top ? 0 : H); g.closePath(); g.fill(); g.stroke(); }
}
// Transition: rainbow bands sweep across, cover the screen, then sweep out the other side.
// Odd chapters mirror the sweep; at full cover the curtain names the next stop.
function drawTrans() {
  const p = trans.t / 70, cols = ['#ff5fa8', '#ff9a3c', '#ffe84d', '#7dff7d', '#4dd2ff', '#9b6bff', '#ff5fe0'], bh = Math.ceil(H / cols.length);
  const flip = ch % 2 === 1;
  cols.forEach((c, i) => {
    const q = Math.max(0, Math.min(1, p * 2.2 - i * .08)), o = Math.max(0, Math.min(1, p * 2.2 - 1.1 - i * .08));
    g.fillStyle = c;
    g.fillRect(flip ? W - o * W - (q - o) * W : o * W, i * bh, (q - o) * W + 1, bh + 1);
  });
  if (trans.label && p > .42 && p < .68) txt(trans.label, W / 2, H / 2, 34, '#fff');
}

// Short animated ending: sunrise, the unicorn and mermaid fly home, fireworks, credits.
function drawEnding() {
  const e = ending, k = Math.min(1, e / 600);
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, `rgb(${40 + 215 * k | 0},${20 + 160 * k | 0},${100 + 100 * k | 0})`); gr.addColorStop(1, `rgb(${255},${120 + 100 * k | 0},${150 + 50 * k | 0})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff2a8'; g.beginPath(); g.arc(W / 2, H - 40 - k * 200, 70, 0, 7); g.fill();             // rising sun
  for (let i = 0; i < 6; i++) blob(scroll(i, .6), 90 + i * 60 % 300, 1.5, 'rgba(255,255,255,.6)');
  g.fillStyle = '#c15fa8'; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 40) g.lineTo(x, H - 50 - 30 * Math.sin(x / 90)); g.lineTo(W, H); g.fill();
  const fx = Math.min(e * 3 - 100, W / 2 - 40);   // flies in, then hovers
  const hy = H / 2 + Math.sin(e / 20) * 12;
  drawMermaid(fx - 120, hy + 30);
  drawUnicorn(fx, hy);
  if (e > 120 && e % 6 === 0) sparks.push({ x: fx - 50, y: hy, vx: -2 - Math.random() * 2, vy: (Math.random() - .5) * 2, l: 40, col: `hsl(${e * 7 % 360},90%,60%)` });
  if (e > 300 && e % 30 === 0) boom(100 + Math.random() * (W - 200), 80 + Math.random() * 200, `hsl(${Math.random() * 360},90%,65%)`, 30);
  if (e > 60 && e < 300) txt('The sky is safe again...', W / 2, 90, 36, '#fff');
  if (e >= 300) { txt('Thank you, Pink Unicorn!', W / 2, 90, 44, '#fff'); txt('with Mermaid, best friend & co-pilot', W / 2, 130, 22, '#ffe84d'); }
  if (e >= 300) { // a rainbow grows over the sunrise as the credits land
    const cols = ['#ff5fa8', '#ff9a3c', '#ffe84d', '#7dff7d', '#4dd2ff', '#9b6bff'];
    cols.forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 10; g.globalAlpha = Math.min(1, (e - 300) / 120); g.beginPath(); g.arc(W / 2, H - 40, 300 - i * 11, Math.PI, 0); g.stroke(); });
    g.globalAlpha = 1;
  }
  if (e > 420) { txt('THE END', W / 2, H - 120, 56, '#fff'); txt(`Final score ${score}   Best ${best}`, W / 2, H - 80, 24); txt(`All ${CHAPTERS.length} chapters cleared!`, W / 2, H - 52, 20, '#ffe84d'); }
  if (e > 240 && e % 120 < 80) txt('tap to play again', W / 2, H - 22, 20);
}
function draw() {
  g.save();
  if (shake > 0) g.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
  if (state === 'ending') drawEnding();
  else {
    drawBg(state === 'title' ? 0 : ch);
    if (state === 'title') {
      drawUnicorn(W / 2, 250 + Math.sin(t / 20) * 10);
      txt('PINK UNICORN', W / 2, 130, 64, '#fff');
      txt('Tap, click or press Space to start', W / 2, 400, 26);
      txt('Move mouse / finger / arrow keys · M = mute', W / 2, 440, 18);
      if (best) txt(`Best ${best}`, W / 2, 490, 22);
    } else {
      for (const o of things) drawThing(o);
      if (boss) drawBoss(boss);
      for (const s of shots) { g.fillStyle = `hsl(${(t * 15 + s.x) % 360},90%,60%)`; g.beginPath(); g.arc(s.x, s.y, s.m ? 5 : 7, 0, 7); g.fill(); }
      for (const b of bolts) { g.fillStyle = '#ffee00'; g.beginPath(); g.arc(b.x, b.y, 9, 0, 7); g.fill(); }
      drawMermaid(mer.x, mer.y);
      if (!(flash > 0 && t % 8 < 4)) drawUnicorn(uni.x, uni.y, shield > 0);
      const c = CHAPTERS[ch];
      txt(`Score ${score}`, 16, 34, 24, '#fff', 'left');
      txt('♥'.repeat(lives), W - 16, 34, 26, '#ff4d8d', 'right');
      if (combo > 1) txt(`Combo x${Math.min(combo, 10)}`, W / 2, 34, 22, '#ffe84d');
      if (shield > 0) txt('★ ' + Math.ceil(shield / 60), 16, 64, 20, '#fff36b', 'left');
      if (!boss) { g.fillStyle = '#ffffff99'; g.fillRect(0, H - 8, W * Math.min(1, t / (CHAPTERS[ch].time * 60)), 8); }
      if (boss && !clear) txt(c.boss, W / 2, H - 16, 20);
      if (clear) txt('Boss defeated!', W / 2, 230, 52);
      if (warn > 0 && warn % 30 < 20) txt('! WARNING !', W / 2, 150, 54, '#ff4d4d');
      if (paused) { g.fillStyle = '#0008'; g.fillRect(0, 0, W, H); txt('Paused', W / 2, 260, 56); txt('tap or press P to resume', W / 2, 310, 22); }
      if (state === 'chapter') { g.fillStyle = '#0006'; g.fillRect(0, 0, W, H); txt(`Chapter ${ch + 1}`, W / 2, 230, 56); txt(c.name, W / 2, 290, 34); txt(c.line, W / 2, 335, 20); txt('Tap to fly!', W / 2, 380, 24); }
      if (state === 'over') { g.fillStyle = '#0008'; g.fillRect(0, 0, W, H); txt('Game Over', W / 2, 250, 60); txt(`Score ${score} · Best ${best} · tap to retry`, W / 2, 310, 26); }
    }
    for (const p of sparks) { g.fillStyle = p.col; g.globalAlpha = Math.max(0, p.l / 30); g.fillRect(p.x, p.y, 5, 5); } g.globalAlpha = 1;
  }
  g.restore();
  if (trans) drawTrans();
}

function loop() {
  if (state === 'play') { if (!paused) update(); }
  else { t++; if (state === 'ending') ending++; }
  if (state === 'chapter' && t > 150) state = 'play';
  for (const p of sparks) { p.x += p.vx; p.y += p.vy; p.l--; }
  sparks = sparks.filter(p => p.l > 0);
  if (trans) { if (++trans.t === 35) trans.fn(); if (trans.t >= 70) trans = null; }
  draw(); requestAnimationFrame(loop);
}
loop();
