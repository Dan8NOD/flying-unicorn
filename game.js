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
  { name: 'Storm Fortress', line: "The Storm King's gloomy fortress... but it isn't the end!", sky: ['#4a4e69', '#14141f'], time: 50, rate: 28, boss: 'Storm King',    hp: 78, pat: 2, bats: 1, spikes: 1 },
  { name: 'Enchanted Forest', line: "Fireflies light the way. Watch out for thorns!", sky: ['#1e5b4f', '#0b2a3a'], time: 52, rate: 27, boss: 'Thorn Saucer', hp: 84, pat: 1, bats: 1, spikes: 1, hull: '#3f8f3f', spike: '#3a7d2c' },
  { name: 'Cotton Candy Kingdom', line: "Sweet... but those gumballs are SOUR.", sky: ['#ffc8ea', '#fff0fa'], time: 52, rate: 26, boss: 'Sugar Saucer', hp: 90, pat: 2, bats: 1, spikes: 1, hull: '#ff7eb6', spike: '#ff5d7d' },
  { name: 'Moonlit Lake', line: "Lotus flowers glow on the quiet water.", sky: ['#1a2a6c', '#4b6cb7'], time: 54, rate: 25, boss: 'Moonbeam Saucer', hp: 96, pat: 0, bats: 1, spikes: 0, hull: '#4b6cb7' },
  { name: 'Unicorn Castle', line: "Home at last. One more grumpy queen to cheer up.", sky: ['#ffd1f0', '#ffa8d8'], time: 56, rate: 24, boss: 'Queen of Sparkles', hp: 120, pat: 2, bats: 1, spikes: 1, hull: '#b8329e', spike: '#ffd36b', crown: 1 },
];
const HULLS = ['#d6199a', '#2d9cdb', '#6c3fb5', '#3aa7a0', '#e8743b', '#ff7a6b', '#18a999', '#5a5f7a'];

let state = 'title', ch = 0, t = 0, score = 0, lives = 3, combo = 0, muted = false, best = 0;
let things = [], shots = [], bolts = [], sparks = [], boss = null, clear = 0;
let mode = 'solo', sel = 0, reached = 0, startCh = 0, easy = false;   // solo | local (2 players, one screen) | host / guest (two devices)
let trans = null, ending = 0, shake = 0, paused = false, warn = 0, mt = 0;
const uni = { x: 150, y: H / 2, ty: H / 2, flash: 0, shield: 0, rapid: 0, triple: 0, magnet: 0, i: 0 };     // player 1: the unicorn
const p2 = { x: 110, y: H / 2 + 80, ty: H / 2 + 80, flash: 0, shield: 0, rapid: 0, triple: 0, magnet: 0, i: 1 };   // player 2: the mermaid
let players = [uni];
const maxLives = () => players.length > 1 ? 7 : 5;
const nearest = o => players.reduce((a, b) => Math.hypot(a.x - o.x, a.y - o.y) <= Math.hypot(b.x - o.x, b.y - o.y) ? a : b);
const mer = { x: 80, y: H / 2, cd: 0 };   // computer-controlled mermaid in 1-player games
const keys = {};
try { best = +localStorage.getItem('pinkUnicornBest') || 0; reached = Math.min(CHAPTERS.length - 1, +localStorage.getItem('pinkUnicornReached') || 0); easy = localStorage.getItem('pinkUnicornEasy') === '1'; muted = localStorage.getItem('pinkUnicornMute') === '1'; } catch (e) {}
startCh = Math.min(startCh, reached);
function saveOpt(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function toggleMute() { muted = !muted; saveOpt('pinkUnicornMute', muted ? 1 : 0); }

// ---- input ----
addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) return;   // typing in the lobby
  keys[e.key] = true;
  if (e.key === 'm') toggleMute();
  if (state === 'title' && !trans) {
    if (e.key === 'ArrowUp') sel = (sel + 2) % 3;
    if (e.key === 'ArrowDown') sel = (sel + 1) % 3;
    if (e.key === 'ArrowLeft') startCh = Math.max(0, startCh - 1);
    if (e.key === 'ArrowRight') startCh = Math.min(reached, startCh + 1);
    if (e.key === 'e') { easy = !easy; saveOpt('pinkUnicornEasy', easy ? 1 : 0); }
    if (e.key === '1' || e.key === '2' || e.key === '3') { sel = +e.key - 1; press(); }
  }
  if (e.key === 'p' || e.key === 'Escape') paused = !paused && state === 'play';
  if (e.key === ' ' || e.key === 'Enter') press();
});
addEventListener('keyup', e => keys[e.key] = false);
function pointer(e) {
  const r = cv.getBoundingClientRect();
  for (const p of e.touches ? [...e.touches] : [e]) {   // in 2-player games the right half of the screen steers player 2
    const x = (p.clientX - r.left) * W / r.width, y = (p.clientY - r.top) * H / r.height;
    (mode === 'guest' || (players.length > 1 && x > W / 2 && mode === 'local') ? p2 : uni).ty = y;
  }
}
addEventListener('blur', () => { if (state === 'play') paused = true; });
cv.addEventListener('mousemove', pointer);
cv.addEventListener('touchmove', e => { pointer(e); e.preventDefault(); }, { passive: false });
const MENU = ['1 Player', '2 Players · one screen', '2 Devices · online'];
cv.addEventListener('pointerdown', e => {
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
  pointer(e);
  if (state === 'title' && !trans) {
    if (y > 440 && y < 475 && reached > 0) { if (x < W / 2 - 60) startCh = Math.max(0, startCh - 1); else if (x > W / 2 + 60) startCh = Math.min(reached, startCh + 1); }
    if (x < 220 && y > 488) { easy = !easy; saveOpt('pinkUnicornEasy', easy ? 1 : 0); return; }
    MENU.forEach((_, i) => { if (Math.abs(x - W / 2) < 200 && y > 290 + i * 52 && y < 332 + i * 52) sel = i; }); }
  if (state === 'play') {   // on-screen pause / mute buttons for touch screens
    if (Math.hypot(x - (W - 40), y - (H - 34)) < 24) { if (mode === 'guest') net.sendR('{"p":2}'); else paused = !paused; return; }
    if (Math.hypot(x - (W - 94), y - (H - 34)) < 24) { toggleMute(); return; }
  }
  press();
});
function press() {
  audio();
  if (mode === 'guest') { net.sendR('{"p":1}'); return; }
  if (trans) return;
  if (paused) { paused = false; return; }
  if (state === 'title') chooseMode();
  else if (state === 'over') toTitle();
  else if (state === 'chapter') state = 'play';
  else if (state === 'ending' && ending > 240) toTitle();
}

function chooseMode() {
  if (sel === 2) { netMenu(); return; }
  mode = sel === 0 ? 'solo' : 'local'; start(startCh, true);
}
let lobbyMsg = '', lobbyT = 0;

// ---- two-device play: the host runs the whole game; the guest draws what the host sends and sends back its steering ----
// (transport and lobby screen live in net.js; this part only needs the `net` object)
const net = { role: null, open: false, ev: [], remoteTy: null, ntk: 0, send() {}, sendR() {} };
function netEv(e) { if (net.role === 'host' && net.open && net.ev.length < 60) net.ev.push(e); }   // sounds/bursts for the guest
const rd = o => Math.round(o * 10) / 10;
function netSnap() {
  net.send(JSON.stringify({ st: state, ch, t, sc: score, l: lives, cb: combo, cl: clear, pa: paused ? 1 : 0, w: warn, sk: shake,
    tr: trans ? [trans.t, trans.label || ''] : 0,
    u: [uni.x, rd(uni.y), uni.flash, uni.shield, uni.rapid, uni.triple, uni.magnet], p: [p2.x, rd(p2.y), p2.flash, p2.shield, p2.rapid, p2.triple, p2.magnet],
    b: boss ? [rd(boss.x), rd(boss.y), boss.hp, boss.max] : 0,
    th: things.map(o => [o.kind, rd(o.x), rd(o.y), rd(o.vx), rd(o.ph || 0), o.hit || 0, o.top ? 1 : 0, o.foe ? 1 : 0]),
    sh: shots.map(q => [rd(q.x), rd(q.y), q.m ? 1 : 0, rd(q.vy || 0)]), bo: bolts.map(b => [rd(b.x), rd(b.y), rd(b.vx), rd(b.vy)]), ev: net.ev.splice(0) }));
}
function applySnap(m) {
  state = m.st; ch = m.ch; t = m.t; score = m.sc; lives = m.l; combo = m.cb; clear = m.cl; paused = !!m.pa; warn = m.w; shake = m.sk;
  trans = m.tr ? { t: m.tr[0], label: m.tr[1] } : null;
  uni.x = m.u[0]; uni.y = m.u[1]; [uni.flash, uni.shield, uni.rapid, uni.triple, uni.magnet] = m.u.slice(2); [p2.flash, p2.shield, p2.rapid, p2.triple, p2.magnet] = m.p.slice(2);   // guest steers its own mermaid locally
  boss = m.b ? { x: m.b[0], y: m.b[1], hp: m.b[2], max: m.b[3] } : null;
  things = m.th.map(a => ({ kind: a[0], x: a[1], y: a[2], y0: a[2], vx: a[3], ph: a[4], hit: a[5], top: !!a[6], foe: a[7] }));
  shots = m.sh.map(a => ({ x: a[0], y: a[1], m: a[2], vy: a[3] }));
  bolts = m.bo.map(a => ({ x: a[0], y: a[1], vx: a[2], vy: a[3] }));
  for (const e of m.ev) { if (e[0] === 's') beep(e[1], e[2], e[3], e[4]); else if (e[0] === 'b') boom(e[1], e[2], e[3], e[4]); }
}
function guestTick() {   // between snapshots: keep things moving smoothly and steer the mermaid
  t++;
  if (keys.ArrowUp || keys.w) p2.ty = p2.y - 40;
  if (keys.ArrowDown || keys.s) p2.ty = p2.y + 40;
  if (padDir[0]) p2.ty = p2.y + padDir[0] * 60;
  p2.ty = Math.max(30, Math.min(H - 30, p2.ty)); p2.y += Math.max(-7, Math.min(7, p2.ty - p2.y));
  for (const o of things) o.x += o.vx;
  for (const q of shots) { q.x += q.m ? 10 : 12; q.y += q.vy || 0; if (t % 2 === 0 && !q.m) sparks.push({ x: q.x, y: q.y + (Math.random() - .5) * 10, vx: -1 - Math.random(), vy: (Math.random() - .5) * 1.5, l: 18, col: `hsl(${(t * 15 + q.x) % 360},90%,75%)` }); }
  for (const b of bolts) { b.x += b.vx; b.y += b.vy; }
  if (shake > 0) shake--;
  for (const q of sparks) { q.x += q.vx; q.y += q.vy; q.l--; }
  sparks = sparks.filter(q => q.l > 0);
  if (trans && ++trans.t >= 70) trans = null;
  if (++net.ntk % 2 === 0) net.send(JSON.stringify({ y: p2.ty }));
}
function netLost() {
  const was = mode; net.open = false; net.role = null;
  if (was === 'guest') { mode = 'solo'; state = 'title'; trans = null; paused = false; }
  else if (was === 'host') { mode = 'solo'; players = [uni]; }
  if (was === 'host' || was === 'guest') { lobbyMsg = 'Your friend disconnected'; lobbyT = 240; }
}
function netMenu() {
  if (net.open && net.role === 'host') { mode = 'host'; start(startCh, true); return; }
  if (typeof showLobby === 'function') showLobby(); else { lobbyMsg = 'Online play is not available here'; lobbyT = 180; }
}
// ---- gamepads: first pad steers player 1, second pad player 2; A = start/tap, Start = pause ----
let padPrev = {}, padDir = [0, 0];
function pollPads() {
  padDir = [0, 0];
  const list = typeof navigator !== 'undefined' && navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  list.slice(0, 2).forEach((gp, i) => {
    const b = n => !!(gp.buttons[n] && gp.buttons[n].pressed);
    let d = Math.abs(gp.axes[1] || 0) > .25 ? gp.axes[1] : 0;
    if (b(12)) d = -1; if (b(13)) d = 1;
    padDir[i] = d;
    const prev = padPrev[gp.index] || {}, cur = { a: b(0), s: b(9), up: d < 0, down: d > 0 };
    if (state === 'title' && !trans) { if (cur.up && !prev.up) sel = (sel + 2) % 3; if (cur.down && !prev.down) sel = (sel + 1) % 3; }
    if (cur.a && !prev.a) press();
    if (cur.s && !prev.s) { if (state === 'play') paused = !paused; else press(); }
    padPrev[gp.index] = cur;
  });
}

// ---- sound (WebAudio blips, created lazily so iOS lets it play) ----
let ac;
function audio() { if (!ac) try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} if (ac && ac.state === 'suspended') ac.resume(); }
function beep(f, d = 0.1, type = 'square', v = 0.05) {
  netEv(['s', f, d, type, v]);
  if (muted || !ac) return;
  const o = ac.createOscillator(), a = ac.createGain();
  o.type = type; o.frequency.value = f; a.gain.value = v;
  a.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d);
  o.connect(a); a.connect(ac.destination); o.start(); o.stop(ac.currentTime + d);
}
function jingle(notes) { notes.forEach((f, i) => setTimeout(() => beep(f, .25, 'triangle', .06), i * 140)); }

// Tiny arpeggio music: root note per chapter, faster and higher during boss fights.
const ROOTS = [262, 294, 220, 311, 330, 278, 247, 196, 349, 233, 277, 392], SCALE = [0, 4, 7, 12, 7, 4, 9, 5];
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
function start(c, fresh) {
  go(() => {
    if (c > reached) { reached = c; saveOpt('pinkUnicornReached', c); }
    ch = c; t = 0; things = []; shots = []; bolts = []; boss = null; clear = 0;
    players = mode === 'solo' ? [uni] : [uni, p2];
    for (const p of [uni, p2]) { p.flash = p.shield = p.rapid = p.triple = p.magnet = 0; p.x = p.i ? 110 : 150; p.y = p.ty = H / 2 + (p.i ? 60 : -30); }
    if (c === 0 || fresh) { score = 0; lives = (mode === 'solo' ? 3 : 5) + (easy ? 2 : 0); }
    combo = 0; state = 'chapter'; ending = 0;
    jingle([523, 659, 784]);
  }, `Chapter ${c + 1} · ${CHAPTERS[c].name}`);
}
function toTitle() { go(() => { state = 'title'; ending = 0; t = 0; }, 'Pink Unicorn'); }
function saveBest() { if (score > best) { best = score; try { localStorage.setItem('pinkUnicornBest', best); } catch (e) {} } }
function hurt(p = uni) {
  if (p.flash > 0 || p.shield > 0) return;
  lives--; combo = 0; p.flash = 90; shake = 12; beep(120, 0.4, 'sawtooth');
  if (lives <= 0) { state = 'over'; saveBest(); }
}
function boom(x, y, col, n = 12) { netEv(['b', x | 0, y | 0, col, n]); if (!fx) n >>= 1; for (let i = 0; i < n; i++) sparks.push({ x, y, vx: (Math.random() - .5) * 8, vy: (Math.random() - .5) * 8, l: 30, col }); }
const hit = (a, b, r) => Math.hypot(a.x - b.x, a.y - b.y) < r;

// Shootable enemies. Hit them with pony dust for points (and sometimes a ring or heart); touching them hurts.
const FOE = {
  pig:   { hp: 4, r: 30, vx: -2,   pts: 60 },   // chunky flying pig
  bird:  { hp: 1, r: 18, vx: -6,   pts: 20 },   // swooping angry bird
  jelly: { hp: 2, r: 22, vx: -2.5, pts: 30 },
  fish:  { hp: 3, r: 26, vx: -3.5, pts: 40 },   // puffer fish
  owl:   { hp: 2, r: 24, vx: -4,   pts: 35 },   // homes in on the unicorn
  ghost: { hp: 2, r: 22, vx: -3,   pts: 35 },
  bug:   { hp: 2, r: 20, vx: -3.5, pts: 30 },   // crawls along the floor or ceiling
  bee:   { hp: 1, r: 14, vx: -5,   pts: 20 },   // zig-zags
  storm: { hp: 3, r: 32, vx: -2,   pts: 50 },   // thundercloud that throws lightning
};
const FOES = [['bird', 'pig'], ['jelly', 'fish'], ['owl', 'ghost'], ['bird', 'ghost'], ['bird', 'bee', 'pig'], ['fish', 'jelly'],
  ['bug', 'ghost'], ['storm', 'bird'], ['owl', 'bee', 'pig'], ['pig', 'bee', 'bird'], ['bird', 'owl', 'ghost'], ['pig', 'bird', 'storm']];
const POW = ['rapid', 'triple', 'magnet', 'bomb'];   // rapid fire, triple shot, ring magnet, screen-clearing bomb
function applyPower(p, k) {
  if (k !== 'bomb') { p[k] = 480; jingle([660, 880]); score += 25; return; }
  for (const o of things) if (o.foe || o.kind === 'cloud' || o.kind === 'bat' || o.kind === 'spike') { o.dead = true; score += o.foe ? FOE[o.kind].pts : 10; boom(o.x, o.y, '#ffb347', 10); }
  bolts = []; shake = 20; if (boss && !clear) boss.hp = Math.max(1, boss.hp - 6);
  beep(90, .5, 'sawtooth', .08); jingle([392, 330, 262]);
}
function moveFoe(o) {
  const k = o.kind;
  if (k === 'pig') o.y = o.y0 + Math.sin(t / 30 + o.ph) * 30;
  else if (k === 'bird') o.y = o.y0 + Math.sin(t / 10 + o.ph) * 40;
  else if (k === 'jelly') o.y = o.y0 + Math.sin(t / 25 + o.ph) * 80;
  else if (k === 'fish') o.y = o.y0 + Math.sin(t / 18 + o.ph) * 20;
  else if (k === 'owl') { if (o.x > 350) o.y += Math.max(-1.6, Math.min(1.6, nearest(o).y - o.y)); }
  else if (k === 'ghost') o.y = o.y0 + Math.sin(t / 20 + o.ph) * 50;
  else if (k === 'bee') o.y = o.y0 + Math.sin(t / 6 + o.ph) * 50;
  else if (k === 'storm' && o.x < W - 60 && o.x > 200 && ++o.cd % 90 === 0) {
    const tg = nearest(o), a = Math.atan2(tg.y - o.y, tg.x - o.x); bolts.push({ x: o.x, y: o.y + 20, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5 });
  }
  o.y = Math.max(25, Math.min(H - 25, o.y));
}
function spawn() {
  const c = CHAPTERS[ch], r = Math.random(), y = 40 + Math.random() * (H - 80), vx = -(3 + ch * .6 + Math.random() * 2) * (easy ? .85 : 1);
  let kind = r < .45 ? 'ring' : r < .6 ? 'heart' : r < .65 ? 'star' : r < .7 ? POW[Math.random() * 4 | 0] : 'cloud';
  if (kind === 'cloud' && c.bats && Math.random() < .4) kind = 'bat';
  if (kind === 'cloud' && c.spikes && Math.random() < .5) kind = 'spike';
  if (kind === 'heart' && lives >= maxLives()) kind = 'ring';
  if (kind === 'cloud' && Math.random() < .55) {   // swap hazard for a shootable enemy
    const list = FOES[ch], k = list[Math.random() * list.length | 0], f = FOE[k], top = Math.random() < .5, yy = k === 'bug' ? (top ? 30 : H - 30) : y;
    things.push({ kind: k, foe: 1, hp: f.hp, x: W + 40, y: yy, y0: yy, ph: Math.random() * 6, vx: (f.vx - ch * .1) * (easy ? .85 : 1), r: f.r, top, cd: 60, hit: 0 });
    return;
  }
  if (kind === 'spike') { const top = Math.random() < .5; things.push({ kind, x: W + 30, y: top ? 20 : H - 20, top, vx, r: 34 }); return; }
  things.push({ kind, x: W + 30, y, y0: y, ph: Math.random() * 6, vx: kind === 'bat' ? vx - 1 : vx, r: kind === 'cloud' ? 28 : kind === 'bat' ? 20 : 16 });
}

function bossFire() {
  const p = CHAPTERS[ch].pat, sp = (4.5 + ch * .5) * (easy ? .8 : 1), tg = nearest(boss), a = Math.atan2(tg.y - boss.y, tg.x - boss.x);
  const rate = Math.max(40, 80 - ch * 8);
  if (t % rate) return;
  if (p === 0) bolts.push({ x: boss.x - 40, y: boss.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp });
  else if (p === 1) for (const d of [-.35, 0, .35]) bolts.push({ x: boss.x - 40, y: boss.y, vx: Math.cos(a + d) * sp, vy: Math.sin(a + d) * sp });
  else for (let i = 0; i < 8; i++) { const b = i / 8 * 6.283 + t / 30; bolts.push({ x: boss.x, y: boss.y, vx: Math.cos(b) * sp * .8, vy: Math.sin(b) * sp * .8 }); }
}

function update() {
  t++;
  for (const p of players) for (const k of ['flash', 'shield', 'rapid', 'triple', 'magnet']) if (p[k] > 0) p[k]--;
  if (shake > 0) shake--;
  if (warn > 0) warn--;
  music();
  const sp = 7;
  const two = mode === 'local';   // keyboard: arrows = player 1, W/S = player 2 (in 1-player games both steer player 1)
  if (keys.ArrowUp || (!two && keys.w)) uni.ty = uni.y - 40;
  if (keys.ArrowDown || (!two && keys.s)) uni.ty = uni.y + 40;
  if (two && keys.w) p2.ty = p2.y - 40;
  if (two && keys.s) p2.ty = p2.y + 40;
  players.forEach((p, i) => { if (padDir[i] && !(mode === 'host' && i === 1)) p.ty = p.y + padDir[i] * 60; });
  if (mode === 'host' && net.remoteTy != null) p2.ty = net.remoteTy;
  for (const p of players) { p.ty = Math.max(30, Math.min(H - 30, p.ty)); p.y += Math.max(-sp, Math.min(sp, p.ty - p.y)); }
  mer.x += (uni.x - 90 - mer.x) * .1; mer.y += (uni.y + 30 - mer.y) * .08;

  // auto-fire: the unicorn throws pony-dust stars from her horn, a playable mermaid blows bubbles
  for (const p of players) {
    const star = p === uni, gap = star ? (p.rapid > 0 ? 7 : 14) : (p.rapid > 0 ? 8 : 16);
    if (t % gap === (star ? 0 : 8 % gap)) {
      const x = star ? p.x + 48 : p.x + 20, y = star ? p.y - 40 : p.y;
      for (const vy of p.triple > 0 ? [-2.2, 0, 2.2] : [0]) shots.push({ x, y, vx: star ? 12 : 10, vy, m: star ? 0 : 1 });
      if (star) { boom(x, y, '#fff', 4); beep(880, .05, 'triangle', .03); }
    }
  }
  if (players.length === 1 && boss && ++mer.cd % 40 === 0) shots.push({ x: mer.x + 20, y: mer.y, vx: 10, vy: 0, m: 1 });

  if (!boss && !clear && t > CHAPTERS[ch].time * 60) {
    const bhp = Math.round(CHAPTERS[ch].hp * (players.length > 1 ? 1.6 : 1) * (easy ? .7 : 1));
    boss = { x: W + 100, y: H / 2, hp: bhp, max: bhp };
    things = []; warn = 120; beep(200, .6, 'sawtooth');
  }
  if (!boss && !clear && t % CHAPTERS[ch].rate === 0) spawn();

  for (const o of things) {
    o.x += o.vx;
    if (o.foe) { moveFoe(o); if (o.hit > 0) o.hit--; for (const p of players) if (hit(o, p, o.r + 20)) hurt(p);
      if (o.x < -60) o.dead = true; continue; }
    if (o.kind === 'bat') o.y = o.y0 + Math.sin(t / 15 + o.ph) * 70;
    const mg = players.find(p => p.magnet > 0 && Math.hypot(o.x - p.x, o.y - p.y) < 260);
    if (mg && (o.kind === 'ring' || o.kind === 'heart' || o.kind === 'star')) { o.x += (mg.x - o.x) * .1; o.y += (mg.y - o.y) * .1; }
    const pp = players.find(p => (o.kind === 'spike' ? Math.hypot(o.x - p.x, (o.top ? o.y + 40 : o.y - 40) - p.y) : Math.hypot(o.x - p.x, o.y - p.y)) < o.r + 22);
    if (pp) {
      if (o.kind === 'spike') { hurt(pp); continue; }
      o.dead = true;
      if (o.kind === 'ring') { combo++; score += 10 * Math.min(combo, 10); beep(660 + combo * 40, .1); boom(o.x, o.y, '#ffc400'); }
      else if (o.kind === 'heart') { lives = Math.min(maxLives(), lives + 1); beep(990, .2, 'sine'); boom(o.x, o.y, '#ff4d8d'); }
      else if (POW.includes(o.kind)) { applyPower(pp, o.kind); boom(o.x, o.y, '#fff', 14); }
      else if (o.kind === 'star') { pp.shield = 360; score += 50; jingle([784, 988, 1175]); boom(o.x, o.y, '#fff', 20); }
      else hurt(pp);
    }
    if (o.x < -60) { o.dead = true; if (o.kind === 'ring') combo = 0; }
  }
  things = things.filter(o => !o.dead);

  for (const s of shots) {
    s.x += s.vx; s.y += s.vy || 0;
    for (const o of things) {
      if (!o.foe || o.dead || !hit(s, o, o.r + 8)) continue;
      s.dead = true; o.hp--; o.hit = 6; beep(500, .05);
      if (o.hp <= 0) {
        o.dead = true; score += FOE[o.kind].pts; boom(o.x, o.y, '#fff', 14); boom(o.x, o.y, '#ffd36b', 8); beep(700, .12, 'triangle');
        const heart = o.kind === 'pig' && lives < maxLives() && Math.random() < .4;
        if (heart || Math.random() < .35) things.push({ kind: heart ? 'heart' : 'ring', x: o.x, y: o.y, y0: o.y, ph: 0, vx: -3, r: 16 });
      }
      break;
    }
    if (s.dead) continue;
    if (t % 2 === 0) sparks.push({ x: s.x, y: s.y + (Math.random() - .5) * 10, vx: -1 - Math.random(), vy: (Math.random() - .5) * 1.5, l: 18, col: `hsl(${(t * 15 + s.x) % 360},90%,75%)` });
    if (boss && hit(s, boss, 60)) {
      s.dead = true; boss.hp--; score += 5; boom(s.x, s.y, '#ff00cc', 6); beep(300, .05);
      if (boss.hp <= 0) {
        score += 200 + lives * 50; shake = 40; clear = 1;
        for (let i = 0; i < 6; i++) setTimeout(() => boom(boss ? boss.x + (Math.random() - .5) * 120 : 0, boss ? boss.y + (Math.random() - .5) * 60 : 0, '#ff00cc', 20), i * 150);
        jingle([523, 659, 784, 1047]);
        saveBest(); bolts = [];
      }
    }
    if (s.x > W + 20 || s.y < -20 || s.y > H + 20) s.dead = true;
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
  for (const b of bolts) { b.x += b.vx; b.y += b.vy; const bp = players.find(p => hit(b, p, 28)); if (bp) { b.dead = true; hurt(bp); } if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) b.dead = true; }
  bolts = bolts.filter(b => !b.dead);
}

function startEnding() { go(() => { state = 'ending'; ending = 0; things = []; shots = []; bolts = []; boss = null; sparks = []; saveBest(); }, 'The sky is safe again...'); }

// ---- drawing ----
function star(x, y, r, rot, col) {
  g.fillStyle = col; g.beginPath();
  for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fill();
}
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
function drawMermaid(x, y, glow) {
  g.save(); g.translate(x, y);
  if (glow) { g.fillStyle = `rgba(255,255,255,${.25 + .1 * Math.sin(t / 4)})`; g.beginPath(); g.arc(0, 4, 46, 0, 7); g.fill(); }
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
  const cc = CHAPTERS[ch];
  g.fillStyle = cc.hull || HULLS[ch]; g.beginPath(); g.ellipse(0, 10, 80, 24, 0, 0, 7); g.fill();
  if (cc.crown) { g.fillStyle = '#ffd36b'; g.beginPath(); g.moveTo(-22, -34); g.lineTo(-22, -52); g.lineTo(-11, -42); g.lineTo(0, -58); g.lineTo(11, -42); g.lineTo(22, -52); g.lineTo(22, -34); g.fill(); }
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

// Seamless horizontal scroller: x for the k-th repeat of a layer spaced `gap` apart.
const sx = (k, sp, gap) => { const span = Math.ceil((W + 200) / gap) * gap; return ((k * gap - t * sp) % span + span) % span - 100; };
const reps = gap => Math.ceil((W + 200) / gap);
function hills(col, base, amp, sp, per) {
  g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W + 20; x += 20) g.lineTo(x, base - amp * Math.sin((x + t * sp) / per) - amp * .5 * Math.sin((x + t * sp) / (per * .37)));
  g.lineTo(W, H); g.fill();
}
function tree(x, base, h, trunk, leaf, blossom) {
  g.fillStyle = trunk; g.fillRect(x - h * .05, base - h * .55, h * .1, h * .55);
  g.fillStyle = leaf; g.beginPath(); g.arc(x, base - h * .72, h * .28, 0, 7); g.arc(x - h * .2, base - h * .55, h * .2, 0, 7); g.arc(x + h * .2, base - h * .55, h * .2, 0, 7); g.fill();
  if (blossom) { g.fillStyle = blossom; for (let b = 0; b < 5; b++) { g.beginPath(); g.arc(x + Math.sin(b * 2.4 + x) * h * .2, base - h * .7 + Math.cos(b * 1.7) * h * .18, 3, 0, 7); g.fill(); } }
}
function fireflies(n, col) {
  if (!fx) n >>= 2;
  for (let k = 0; k < n; k++) {
    const x = sx(k, .5 + k % 3 * .3, 60) + Math.sin(t / 40 + k) * 15, y = (k * 53) % (H - 80) + 20 + Math.sin(t / 30 + k * 2) * 20, a = .5 + .5 * Math.sin(t / 12 + k * 3);
    g.globalAlpha = a * .25; g.fillStyle = col; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill();
    g.globalAlpha = a; g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
}
function forest() {
  g.fillStyle = 'rgba(255,240,170,.07)';
  for (let k = 0; k < 5; k++) { const x = 100 + k * 200 + Math.sin(t / 200 + k) * 40; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 70, 0); g.lineTo(x - 90, H); g.lineTo(x - 200, H); g.fill(); }
  for (let k = 0; k < reps(260); k++) tree(sx(k, .4, 260), H - 40, 320 + k * 37 % 80, '#0c2f33', '#124a47');
  for (let k = 0; k < reps(200); k++) tree(sx(k, .9, 200), H - 10, 240 + k * 53 % 60, '#14423a', '#1f6b52', '#ffb3d9');
  g.fillStyle = '#0c2a28'; g.fillRect(0, H - 26, W, 26);
  for (let k = 0; k < reps(230); k++) {   // glowing mushrooms
    const x = sx(k, 1.8, 230), c = k % 2 ? '#ff8ad8' : '#7ef0e0';
    g.globalAlpha = .18 + .08 * Math.sin(t / 15 + k); g.fillStyle = c; g.beginPath(); g.arc(x, H - 30, 34, 0, 7); g.fill(); g.globalAlpha = 1;
    g.fillStyle = '#f4ead5'; g.fillRect(x - 3, H - 30, 6, 14); g.fillStyle = c; g.beginPath(); g.ellipse(x, H - 30, 15, 10, 0, Math.PI, 0); g.fill();
  }
  fireflies(30, '#fff7a0');
  g.strokeStyle = '#2f7d4f'; g.lineWidth = 4;                                  // hanging vines, fastest layer
  for (let k = 0; k < reps(170); k++) { const x = sx(k, 2.4, 170), l = 50 + k % 3 * 30; g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + Math.sin(t / 40 + k) * 10, l / 2, x, l); g.stroke(); g.fillStyle = '#3fa564'; g.beginPath(); g.ellipse(x, l, 6, 9, 0, 0, 7); g.fill(); }
}
function candyland() {
  hills('#ffb3dc', H - 90, 40, .3, 170); hills('#b8e6ff', H - 50, 34, .55, 130); hills('#ffd9ec', H - 20, 26, .9, 100);
  for (let k = 0; k < 5; k++) blob(sx(k, .4, 260), 70 + k * 90 % 260, 1.5, 'rgba(255,255,255,.8)');
  const cols = ['#ff5fa8', '#ffb347', '#7ee8e0', '#b48cff'];
  for (let k = 0; k < reps(210); k++) {   // lollipops
    const x = sx(k, 1.2, 210), y = H - 110 - k % 3 * 20;
    g.fillStyle = '#fff'; g.fillRect(x - 3, y, 6, 120);
    g.fillStyle = cols[k % 4]; g.beginPath(); g.arc(x, y, 28, 0, 7); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.arc(x, y, 18, 0, 5); g.arc(x, y, 8, 0, 5); g.stroke();
  }
  for (let k = 0; k < 40; k++) { g.fillStyle = cols[k % 4]; g.fillRect(sx(k, .5, 26), ((k * 47 + t * (1 + k % 3)) % H), 8, 3); }  // sprinkles
}
function lake() {
  g.fillStyle = '#fff'; for (let k = 0; k < 40; k++) g.fillRect(sx(k, .1 + k % 3 * .05, 26), (k * 61) % (H * .6), 2, 2);
  g.globalAlpha = .2; g.fillStyle = '#fff6c9'; g.beginPath(); g.arc(700, 120, 80, 0, 7); g.fill(); g.globalAlpha = 1;
  g.fillStyle = '#fff6c9'; g.beginPath(); g.arc(700, 120, 52, 0, 7); g.fill();
  hills('#14214f', H * .66, 60, .15, 220); hills('#0d1740', H * .66, 30, .35, 160);
  const wy = H * .66, wg = g.createLinearGradient(0, wy, 0, H); wg.addColorStop(0, '#2c4a9c'); wg.addColorStop(1, '#0c1840');
  g.fillStyle = wg; g.fillRect(0, wy, W, H - wy);
  g.fillStyle = 'rgba(255,246,201,.35)';                                      // moon glitter on the water
  for (let k = 0; k < 9; k++) g.fillRect(700 - 50 + Math.sin(t / 20 + k) * 10 + k * 3, wy + 10 + k * 16, 100 - k * 8, 3);
  for (let k = 0; k < reps(180); k++) {   // lily pads and lotus flowers
    const x = sx(k, 2, 180), y = H - 30 - k % 3 * 28;
    g.fillStyle = '#2e9d6a'; g.beginPath(); g.ellipse(x, y, 34, 10, 0, 0, 7); g.fill();
    if (k % 2) { g.fillStyle = '#ffb3e1'; for (let p = -1; p <= 1; p++) { g.beginPath(); g.ellipse(x + p * 8, y - 10, 5, 12, p * .4, 0, 7); g.fill(); } }
  }
  fireflies(22, '#b8ffe9');
  if (t % 300 < 30) { const q = t % 300; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(W - q * 25, q * 7); g.lineTo(W - q * 25 + 70, q * 7 - 20); g.stroke(); }
}
function castle() {
  const cols = ['#ff7eb6', '#ffb347', '#ffe84d', '#7dff7d', '#4dd2ff', '#9b6bff'];
  g.lineWidth = 12; g.globalAlpha = .55;
  cols.forEach((c, i) => { g.strokeStyle = c; g.beginPath(); g.arc(300, H + 160, 480 - i * 12, Math.PI, 0); g.stroke(); });
  g.globalAlpha = 1;
  for (let k = 0; k < 4; k++) blob(sx(k, .3, 300), 80 + k * 70 % 200, 1.6, 'rgba(255,255,255,.7)');
  g.fillStyle = '#f7a6d4';                                                    // far castle
  g.fillRect(560, 240, 260, 220);
  [[540, 170, 60], [640, 120, 70], [760, 170, 60]].forEach(([x, y, w]) => { g.fillStyle = '#f7a6d4'; g.fillRect(x, y + 40, w, 260); g.fillStyle = '#c94f9c'; g.beginPath(); g.moveTo(x - 8, y + 40); g.lineTo(x + w / 2, y - 30); g.lineTo(x + w + 8, y + 40); g.fill(); });
  g.fillStyle = '#fff6c9'; [[570, 240], [660, 190], [780, 240]].forEach(([x, y]) => g.fillRect(x, y, 14, 24));
  hills('#9be28f', H - 40, 30, .5, 160); hills('#6fcf7b', H - 10, 24, 1, 120);
  for (let k = 0; k < 24; k++) {   // floating hearts and petals
    const x = sx(k, .6, 40) + Math.sin(t / 50 + k) * 12, y = H - ((k * 61 + t * (.8 + k % 3 * .4)) % H);
    g.globalAlpha = .75; g.fillStyle = k % 2 ? '#ff4d8d' : '#ffd1f0'; g.font = '16px sans-serif'; g.textAlign = 'center'; g.fillText(k % 2 ? '♥' : '✿', x, y);
  }
  g.globalAlpha = 1;
}
// Parallax scenery that differs per chapter
const skyCache = [];
function drawBg(i) {
  const c = CHAPTERS[i];
  if (!skyCache[i]) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, c.sky[0]); gr.addColorStop(1, c.sky[1]); skyCache[i] = gr; }
  g.fillStyle = skyCache[i]; g.fillRect(0, 0, W, H);
  if (i >= 8) { [forest, candyland, lake, castle][i - 8](); return; }
  if (i === 0) { hills('#f7b6e0', H - 70, 40, .3, 150); hills('#e48fcf', H - 30, 30, .6, 110); }
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
function drawFoe(o) {
  g.save(); g.translate(o.x, o.y);
  const h = o.hit > 0, C = c => h ? '#fff' : c, fl = Math.sin(t / 3 + o.ph) * 10, k = o.kind;
  g.lineWidth = 3; g.lineCap = 'round';
  if (k === 'pig') {
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(4, -24 - fl * .6, 15, 7 + Math.abs(fl) * .4, -.4, 0, 7); g.fill();   // tiny wing
    g.fillStyle = C('#ff9ec4'); g.beginPath(); g.ellipse(0, 0, 32, 25, 0, 0, 7); g.fill();                              // chunky body
    g.fillStyle = C('#ff7fb0'); g.beginPath(); g.moveTo(-14, -20); g.lineTo(-24, -34); g.lineTo(-4, -24); g.fill();
    g.fillStyle = C('#ffc2da'); g.beginPath(); g.ellipse(-30, 4, 10, 9, 0, 0, 7); g.fill();                             // snout
    g.fillStyle = '#b8456f'; g.fillRect(-34, 2, 3, 5); g.fillRect(-27, 2, 3, 5); g.fillRect(-14, 22, 8, 6); g.fillRect(8, 22, 8, 6);
    g.fillStyle = 'rgba(255,90,140,.5)'; g.beginPath(); g.arc(-8, 6, 6, 0, 7); g.fill();
    g.fillStyle = '#222'; g.beginPath(); g.arc(-16, -6, 3, 0, 7); g.fill();
    g.strokeStyle = '#222'; g.beginPath(); g.moveTo(-23, -13); g.lineTo(-11, -9); g.stroke();                          // grumpy brow
    g.strokeStyle = C('#ff7fb0'); g.beginPath(); g.arc(34, -2, 5, 0, 5); g.stroke();                                    // curly tail
  } else if (k === 'bird') {
    g.fillStyle = C('#ff5a5a'); g.beginPath(); g.ellipse(0, 0, 18, 14, 0, 0, 7); g.fill();
    g.fillStyle = C('#ff8a8a'); g.beginPath(); g.ellipse(4, -2 - fl * .4, 12, 6 + Math.abs(fl) * .6, .4, 0, 7); g.fill();  // flapping wing
    g.fillStyle = '#ffc400'; g.beginPath(); g.moveTo(-17, -2); g.lineTo(-30, 3); g.lineTo(-17, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(-8, -4, 4, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(-9, -4, 2, 0, 7); g.fill();
    g.strokeStyle = '#222'; g.beginPath(); g.moveTo(-14, -11); g.lineTo(-4, -7); g.stroke();
  } else if (k === 'jelly') {
    g.fillStyle = C('rgba(190,120,255,.85)'); g.beginPath(); g.ellipse(0, 0, 22, 18, 0, Math.PI, 0); g.fill();
    g.strokeStyle = C('rgba(190,120,255,.85)'); for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 8, 0); g.quadraticCurveTo(i * 8 + Math.sin(t / 8 + i) * 8, 14, i * 8, 28); g.stroke(); }
    g.fillStyle = '#222'; g.beginPath(); g.arc(-7, -6, 2.5, 0, 7); g.arc(7, -6, 2.5, 0, 7); g.fill();
  } else if (k === 'fish') {
    g.fillStyle = C('#ffb23c'); g.beginPath(); g.arc(0, 0, 26, 0, 7); g.fill();
    g.fillStyle = C('#ff8a2b'); g.beginPath(); g.moveTo(24, 0); g.lineTo(38, -12 + fl * .5); g.lineTo(38, 12 - fl * .5); g.fill();
    g.strokeStyle = C('#ff8a2b'); for (let a = 0; a < 8; a++) { g.beginPath(); g.moveTo(Math.cos(a * .785) * 24, Math.sin(a * .785) * 24); g.lineTo(Math.cos(a * .785) * 33, Math.sin(a * .785) * 33); g.stroke(); }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(-12, -6, 5, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(-13, -6, 2.5, 0, 7); g.fill();
    g.beginPath(); g.arc(-18, 8, 5, Math.PI, 0); g.strokeStyle = '#222'; g.stroke();
  } else if (k === 'owl') {
    g.fillStyle = C('#9a6b3f'); g.beginPath(); g.ellipse(0, 0, 20, 24, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(-16, -18); g.lineTo(-14, -32); g.lineTo(-5, -22); g.moveTo(16, -18); g.lineTo(14, -32); g.lineTo(5, -22); g.fill();
    g.fillStyle = C('#c9955f'); g.beginPath(); g.ellipse(-4 + fl * .3, 6, 14, 8 + Math.abs(fl) * .5, .3, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(-8, -8, 7, 0, 7); g.arc(8, -8, 7, 0, 7); g.fill();
    g.fillStyle = '#222'; g.beginPath(); g.arc(-9, -8, 3, 0, 7); g.arc(7, -8, 3, 0, 7); g.fill();
    g.fillStyle = '#ffc400'; g.beginPath(); g.moveTo(-3, -2); g.lineTo(3, -2); g.lineTo(0, 5); g.fill();
  } else if (k === 'ghost') {
    g.globalAlpha = .65 + .25 * Math.sin(t / 10 + o.ph); g.fillStyle = C('#eef'); g.beginPath(); g.arc(0, -4, 22, Math.PI, 0);
    for (let i = 0; i < 4; i++) g.lineTo(22 - i * 14.7, 22 + (i % 2 ? 0 : 7) + Math.sin(t / 6 + i) * 3);
    g.closePath(); g.fill(); g.globalAlpha = 1;
    g.fillStyle = '#334'; g.beginPath(); g.ellipse(-8, -6, 3, 5, 0, 0, 7); g.ellipse(8, -6, 3, 5, 0, 0, 7); g.ellipse(0, 8, 4, 5, 0, 0, 7); g.fill();
  } else if (k === 'bug') {
    if (!o.top) g.scale(1, -1);
    g.fillStyle = C('#57e0d0'); g.beginPath(); g.ellipse(0, 0, 22, 14, 0, Math.PI, 0); g.fill();
    g.strokeStyle = C('#2aa595'); g.beginPath(); g.moveTo(0, -14); g.lineTo(0, 0); g.stroke();
    for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 10, 0); g.lineTo(i * 10 + Math.sin(t / 3 + i) * 5, 12); g.stroke(); }
    g.fillStyle = '#222'; g.beginPath(); g.arc(-16, -3, 2.5, 0, 7); g.fill();
  } else if (k === 'bee') {
    g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(-2, -12 - fl * .4, 8, 5 + Math.abs(fl) * .3, 0, 0, 7); g.ellipse(6, -12 + fl * .4, 8, 5 + Math.abs(fl) * .3, 0, 0, 7); g.fill();
    g.fillStyle = C('#ffd93c'); g.beginPath(); g.ellipse(0, 0, 15, 10, 0, 0, 7); g.fill();
    g.fillStyle = h ? '#fff' : '#222'; g.fillRect(-2, -10, 4, 20); g.fillRect(6, -9, 4, 18);
    g.beginPath(); g.arc(-12, -2, 2, 0, 7); g.fill();
  } else if (k === 'storm') {
    blob(0, 0, 1.2, h ? '#fff' : '#3b3d55');
    g.fillStyle = '#ffe84d'; g.beginPath(); g.moveTo(-2, 14); g.lineTo(8, 14); g.lineTo(0, 28); g.lineTo(10, 28); g.lineTo(-8, 48); g.lineTo(-2, 32); g.lineTo(-8, 32); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(-10, -4, 5, 0, 7); g.arc(10, -4, 5, 0, 7); g.fill();
    g.strokeStyle = '#222'; g.beginPath(); g.moveTo(-17, -12); g.lineTo(-6, -7); g.moveTo(17, -12); g.lineTo(6, -7); g.stroke();
  }
  g.restore();
}
function drawThing(o) {
  if (o.foe) return drawFoe(o);
  if (o.kind === 'cloud' && ch === 8) { g.fillStyle = '#2a5a2a'; g.beginPath(); g.arc(o.x, o.y, 22, 0, 7); g.fill(); g.strokeStyle = '#1a3a1a'; g.lineWidth = 4; for (let a = 0; a < 8; a++) { g.beginPath(); g.moveTo(o.x + Math.cos(a * .785) * 18, o.y + Math.sin(a * .785) * 18); g.lineTo(o.x + Math.cos(a * .785) * 32, o.y + Math.sin(a * .785) * 32); g.stroke(); } }
  else if (o.kind === 'cloud' && ch === 9) { g.fillStyle = '#9a4fd1'; g.beginPath(); g.arc(o.x, o.y, 24, 0, 7); g.fill(); g.fillStyle = '#d9a8ff'; g.beginPath(); g.arc(o.x - 8, o.y - 8, 5, 0, 7); g.arc(o.x + 9, o.y + 6, 4, 0, 7); g.fill(); g.strokeStyle = '#2a0a3a'; g.lineWidth = 3; g.beginPath(); g.arc(o.x, o.y + 12, 8, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
  else if (o.kind === 'cloud') blob(o.x, o.y, 1, ch === 7 ? '#34344a' : ch === 10 ? '#1c2452' : ch === 11 ? '#b77ab0' : '#8a7a9c');
  else if (o.kind === 'ring') { g.strokeStyle = '#ffc400'; g.lineWidth = 5; g.beginPath(); g.arc(o.x, o.y, 13, 0, 7); g.stroke(); }
  else if (o.kind === 'heart') txt('♥', o.x, o.y + 10, 34, '#ff4d8d');
  else if (o.kind === 'star') txt('★', o.x, o.y + 12, 38, '#fff36b');
  else if (POW.includes(o.kind)) {
    const d = { rapid: ['#ff9a3c', '»'], triple: ['#b48cff', '✦'], magnet: ['#4dd2ff', 'M'], bomb: ['#ff4d4d', '!'] }[o.kind];
    g.fillStyle = d[0]; g.beginPath(); g.arc(o.x, o.y, 16 + Math.sin(t / 8) * 2, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); txt(d[1], o.x, o.y + 7, 20);
  }
  else if (o.kind === 'bat') { const f = Math.sin(t / 3) * 10; g.fillStyle = ch >= 8 ? '#8a3fb5' : '#2b1b3d'; g.beginPath(); g.ellipse(o.x, o.y, 9, 11, 0, 0, 7); g.moveTo(o.x - 4, o.y); g.lineTo(o.x - 28, o.y - 10 + f); g.lineTo(o.x - 8, o.y + 8); g.moveTo(o.x + 4, o.y); g.lineTo(o.x + 28, o.y - 10 + f); g.lineTo(o.x + 8, o.y + 8); g.fill(); g.fillStyle = '#f33'; g.fillRect(o.x - 5, o.y - 3, 3, 3); g.fillRect(o.x + 2, o.y - 3, 3, 3); }
  else if (o.kind === 'spike') { g.fillStyle = CHAPTERS[ch].spike || '#9ff'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(o.x - 22, o.top ? 0 : H); g.lineTo(o.x, o.top ? o.y + 55 : o.y - 55); g.lineTo(o.x + 22, o.top ? 0 : H); g.closePath(); g.fill(); g.stroke(); }
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
      if (mode === 'guest') txt('Connected! Waiting for the host to start...', W / 2, 340, 24);
      else MENU.forEach((s, i) => {
        g.fillStyle = i === sel ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.4)'; g.fillRect(W / 2 - 200, 290 + i * 52, 400, 42);
        txt(s, W / 2, 320 + i * 52, 22, i === sel ? '#d6199a' : '#fff');
      });
      if (reached > 0 && mode !== 'guest') txt(`◀   Chapter ${startCh + 1} · ${CHAPTERS[startCh].name}   ▶`, W / 2, 462, 18, '#fff');
      txt(`Easy mode: ${easy ? 'ON' : 'off'} (E)`, 16, 506, 15, easy ? '#7dff7d' : '#fff', 'left');
      txt('Mouse / touch / arrows / gamepad · 2P: arrows + W/S or two pads', W / 2, 482, 15);
      txt('M = mute · P = pause' + (best ? `   ·   Best ${best}` : ''), W / 2, 506, 15);
      if (lobbyT > 0) { lobbyT--; txt(lobbyMsg, W / 2, 272, 20, '#fff36b'); }
    } else {
      for (const o of things) drawThing(o);
      if (boss) drawBoss(boss);
      for (const s of shots) {
        if (s.m) { g.strokeStyle = '#7ee8e0'; g.lineWidth = 2; g.beginPath(); g.arc(s.x, s.y, 7, 0, 7); g.stroke(); g.fillStyle = '#fff'; g.fillRect(s.x - 3, s.y - 3, 3, 3); }
        else { star(s.x, s.y, 13, t / 6 + s.x / 20, `hsl(${(t * 15 + s.x) % 360},95%,72%)`); star(s.x, s.y, 5, 0, '#fff'); }
      }
      for (const b of bolts) { g.fillStyle = '#ffee00'; g.beginPath(); g.arc(b.x, b.y, 9, 0, 7); g.fill(); }
      if (players.length === 1) drawMermaid(mer.x, mer.y);
      for (const p of players) {
        if (p.flash > 0 && t % 8 < 4) continue;
        p === uni ? drawUnicorn(p.x, p.y, p.shield > 0) : drawMermaid(p.x, p.y, p.shield > 0);
        if (players.length > 1) txt('P' + (p.i + 1), p.x, p.y - 62, 16, p.i ? '#7ee8e0' : '#ffb3e1');
      }
      const c = CHAPTERS[ch];
      txt(`Score ${score}`, 16, 34, 24, '#fff', 'left');
      txt('♥'.repeat(lives), W - 16, 34, 26, '#ff4d8d', 'right');
      if (combo > 1) txt(`Combo x${Math.min(combo, 10)}`, W / 2, 34, 22, '#ffe84d');
      players.forEach((p, i) => {
        const b = [['★', p.shield], ['»', p.rapid], ['✦', p.triple], ['M', p.magnet]].filter(a => a[1] > 0).map(a => a[0] + Math.ceil(a[1] / 60)).join('  ');
        if (b) txt(b, 16, 64 + i * 26, 20, '#fff36b', 'left');
      });
      txt('II', W - 40, H - 27, 18, '#fff'); txt(muted ? 'x' : '♪', W - 94, H - 27, 20, '#fff');
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
  pollPads();
  if (mode === 'guest') { guestTick(); return; }
  if (state === 'play') { if (!paused) update(); }
  else { t++; if (state === 'ending') ending++; }
  if (state === 'chapter' && t > 150) state = 'play';
  for (const p of sparks) { p.x += p.vx; p.y += p.vy; p.l--; }
  sparks = sparks.filter(p => p.l > 0);
  if (trans) { if (++trans.t === 35) trans.fn(); if (trans.t >= 70) trans = null; }
  if (sparks.length > (fx ? 300 : 100)) sparks.splice(0, sparks.length - (fx ? 300 : 100));
  if (mode === 'host' && net.open && ++net.ntk % 2 === 0) netSnap();
}

// Fixed 60 Hz game clock so 90/120 Hz phones don't run fast and slow phones don't run slow.
// If frames take too long on average, `fx` drops to 0 and the game draws fewer particles and background extras.
const STEP = 1000 / 60;
let last = 0, acc = 0, avg = 16.7, fx = 1;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(100, now - last || STEP); last = now;
  acc += dt; avg = avg * .97 + dt * .03;
  if (avg > 27 && fx) fx = 0; else if (avg < 18 && !fx) fx = 1;
  let n = 0;
  while (acc >= STEP - 1.5 && n < 3) { loop(); acc -= STEP; n++; }
  if (acc > STEP * 2) acc = 0;
  if (n) draw();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') paused = true; });
requestAnimationFrame(frame);
