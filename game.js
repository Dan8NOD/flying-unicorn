// Pink Unicorn - a canvas shooter. No build step. Generated art in assets/ is used when present;
// every sprite also has a code-drawn fallback, so the game still runs without the assets folder.
const cv = document.getElementById('c'), g = cv.getContext('2d');
const W = 960, H = 540;   // game coordinates; the canvas itself is rendered at up to 2x for sharp phone screens
let Q = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
cv.width = W * Q; cv.height = H * Q;

// ---- generated art (Meshy). IMG[name] is set once the file has loaded ----
const NCH = 27;   // number of chapters (keep in step with CHAPTERS below)
const IMG = {};
// Shared sprites stay loaded. Each chapter's backdrop, foreground, boss and fly-by sprites are loaded when the
// chapter starts (plus the next chapter's) and released afterwards, which keeps image memory low on 4 GB phones.
const CORE_ART = ['uni_up', 'uni_down', 'mermaid', 'haz_cloud', 'haz_bat', 'haz_spike', 'happy_0', 'happy_1', 'happy_9',
  ...['pig', 'bird', 'jelly', 'fish', 'owl', 'ghost', 'bug', 'bee', 'storm', 'butterfly', 'balloon'].map(k => 'foe_' + k),
  ...['ring', 'heart', 'star', 'rapid', 'triple', 'magnet', 'bomb'].map(k => 'pick_' + k)];
const loadedArt = {};
function loadArt(n) {
  if (loadedArt[n] || typeof Image === 'undefined') return;
  const im = new Image(); loadedArt[n] = im; im.onload = () => { if (loadedArt[n] === im) IMG[n] = im; };
  im.src = 'assets/img/' + n + (n.startsWith('bg_') ? '.jpg' : '.png');
}
function dropArt(n) { const im = loadedArt[n]; if (!im) return; delete loadedArt[n]; delete IMG[n]; im.onload = null; im.src = ''; }
function chapterArt(c) {
  if (c < 0 || c >= NCH) return [];
  const list = ['bg_' + c, 'fg_' + c, 'boss_' + c];
  if (typeof STAGES !== 'undefined' && STAGES[c]) for (const e of STAGES[c].ev) if (e[1] === 'flyby' || e[1] === 'sight') list.push(e[2]);
  if (CHAPTERS[c] && CHAPTERS[c].tour) list.push('rider');
  return list;
}
let artCh = -1;
function useChapterArt(c) {
  if (c === artCh) return; artCh = c;
  const keep = new Set([...chapterArt(c), ...chapterArt(c + 1), 'bg_0', 'fg_0', 'bg_' + (NCH - 1)]);   // title + ending backdrops always
  for (const n of Object.keys(loadedArt)) if (/^(bg|fg|boss|fx)_/.test(n) && !keep.has(n)) dropArt(n);
  for (const n of keep) loadArt(n);
}
function loadAllArt() { for (let c = 0; c < NCH; c++) chapterArt(c).forEach(loadArt); for (const k of ['mint', 'snow', 'galaxy', 'golden', 'rainbow']) ['up', 'down'].forEach(f => loadArt('skin_' + k + '_' + f)); for (let i = 0; i < NCH; i++) { loadArt('isle_' + i); loadArt('happy_' + i); } if (typeof WALK_ART !== 'undefined') WALK_ART.forEach(loadArt); }   // tools/screenshots only
CORE_ART.push('pick_shoe', 'friend_pegasus'); CORE_ART.forEach(loadArt); ['bg_0', 'fg_0'].forEach(loadArt);
try { const sk0 = localStorage.getItem('pinkUnicornSkin'); if (sk0) ['up', 'down'].forEach(f => loadArt('skin_' + sk0 + '_' + f)); } catch (e) {}
// Draw a loaded sprite centred on (x, y) at height h. Returns false if it isn't loaded (caller draws the fallback).
function spr(n, x, y, h, flipX, flipY) {
  const im = IMG[n]; if (!im) return false;
  const w = h * im.width / im.height;
  if (flipX || flipY) { g.save(); g.translate(x, y); g.scale(flipX ? -1 : 1, flipY ? -1 : 1); g.drawImage(im, -w / 2, -h / 2, w, h); g.restore(); }
  else g.drawImage(im, x - w / 2, y - h / 2, w, h);
  return true;
}
function flashSpr(n, x, y, h, a) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; spr(n, x, y, h); g.restore(); }   // white-ish hit flash

// Each chapter: sky gradient, run-up time (s) and spawn gap (frames), boss, boss pattern, and which hazards appear.
const CHAPTERS = [
  { name: 'Candy Clouds', line: "The sky turned grumpy. Let's fix it!",   sky: ['#ffd6f0', '#c9f0ff'], time: 35, rate: 46, boss: 'Grumpy Saucer', hp: 20, pat: 0, bats: 0, spikes: 0 },
  { name: 'Mermaid Bay', line: "Mermaid knows a shortcut over the waves.",    sky: ['#b8f0ff', '#3f9bd6'], time: 38, rate: 44, boss: 'Bubble Saucer', hp: 28, pat: 1, bats: 0, spikes: 0 },
  { name: 'Starry Night', line: "The saucers hide in the dark. Follow the stars.",   sky: ['#3a1c71', '#0f0c29'], time: 40, rate: 41, boss: 'Moon Saucer',   hp: 36, pat: 0, bats: 1, spikes: 0 },
  { name: 'Aurora Peaks', line: "Lights are dancing over the snowy peaks!",   sky: ['#123a5e', '#0b1e3a'], time: 42, rate: 38, boss: 'Aurora Saucer', hp: 42, pat: 1, bats: 1, spikes: 0 },
  { name: 'Rainbow Canyon', line: "Sunset over the canyon... something is humming.", sky: ['#ffb36b', '#8e44ad'], time: 42, rate: 36, boss: 'Sunset Saucer', hp: 48, pat: 2, bats: 1, spikes: 0 },
  { name: 'Coral Reef', line: "A gentle ride: say hi to the sea friends and keep Mermaid safe.", sky: ['#7fe3d0', '#146b8a'], time: 62, rate: 44, boss: 'Coral Saucer', hp: 30, pat: 0, bats: 0, spikes: 0, tour: 1 },
  { name: 'Crystal Caves', line: "Careful! The crystals are sharp.",  sky: ['#0b3d4a', '#1b1038'], time: 46, rate: 31, boss: 'Gem Saucer',    hp: 60, pat: 1, bats: 1, spikes: 1 },
  { name: 'Storm Fortress', line: "The Storm King's gloomy fortress... but it isn't the end!", sky: ['#4a4e69', '#14141f'], time: 50, rate: 28, boss: 'Storm King',    hp: 78, pat: 2, bats: 1, spikes: 1 },
  { name: 'Enchanted Forest', line: "Fireflies light the way. Watch out for thorns!", sky: ['#1e5b4f', '#0b2a3a'], time: 52, rate: 27, boss: 'Thorn Saucer', hp: 84, pat: 1, bats: 1, spikes: 1, hull: '#3f8f3f', spike: '#3a7d2c' },
  { name: 'Cotton Candy Kingdom', line: "Sweet... but those gumballs are SOUR.", sky: ['#ffc8ea', '#fff0fa'], time: 52, rate: 26, boss: 'Sugar Saucer', hp: 90, pat: 2, bats: 1, spikes: 1, hull: '#ff7eb6', spike: '#ff5d7d' },
  { name: 'Moonlit Lake', line: "Lotus flowers glow on the quiet water.", sky: ['#1a2a6c', '#4b6cb7'], time: 54, rate: 25, boss: 'Moonbeam Saucer', hp: 96, pat: 0, bats: 1, spikes: 0, hull: '#4b6cb7' },
  { name: 'Sakura Valley', line: "Pink petals everywhere! Watch the busy bees.", sky: ['#ffd9ec', '#ffeef6'], time: 54, rate: 25, boss: 'Blossom Saucer', hp: 100, pat: 1, bats: 0, spikes: 0, hull: '#ff9ec8' },
  { name: 'Rainbow Waterfalls', line: "A rainbow in every waterfall. Hold on tight!", sky: ['#a8e6cf', '#3fb8af'], time: 55, rate: 24, boss: 'Splash Saucer', hp: 104, pat: 0, bats: 1, spikes: 1, hull: '#2fbf8f', spike: '#7fe8ff' },
  { name: 'Starlight Carnival', line: "A carnival in the night sky. The last stop before home!", sky: ['#2b1055', '#7597de'], time: 55, rate: 24, boss: 'Carnival Saucer', hp: 110, pat: 2, bats: 1, spikes: 0, hull: '#7b3fe4' },
  { name: 'Sunflower Fields', line: "Golden fields as far as the eye can see!", sky: ['#bfe6ff', '#fff3c4'], time: 56, rate: 24, boss: 'Sunny Saucer', hp: 112, pat: 1, bats: 0, spikes: 0, hull: '#ffc83d' },
  { name: 'Glitter Volcano', line: "The lava sparkles... but it's still hot!", sky: ['#4a1d4f', '#ff8a5c'], time: 56, rate: 23, boss: 'Magma Saucer', hp: 116, pat: 2, bats: 1, spikes: 1, hull: '#ff6a3d', spike: '#ff9a7a' },
  { name: 'Cosmic Nebula', line: "Past the planets and the star clouds, home is near.", sky: ['#140a33', '#4b2a8a'], time: 57, rate: 23, boss: 'Star Saucer', hp: 120, pat: 0, bats: 1, spikes: 0, hull: '#6c4bd6' },
  { name: 'Autumn Woods', line: "Crunchy leaves and cozy mushroom houses.", sky: ['#ffd8a8', '#ff9a6b'], time: 57, rate: 23, boss: 'Acorn Saucer', hp: 122, pat: 1, bats: 0, spikes: 0, hull: '#e8743b' },
  { name: 'Airship Harbor', line: "Ahoy! A whole harbor floating in the clouds.", sky: ['#9fd8ff', '#e8f6ff'], time: 57, rate: 22, boss: 'Pirate Saucer', hp: 126, pat: 2, bats: 1, spikes: 0, hull: '#4a7fd6' },
  { name: 'Dream City', line: "The city sleeps. Fly softly over the rooftops.", sky: ['#1d1b4a', '#6a4fa8'], time: 58, rate: 22, boss: 'Neon Saucer', hp: 130, pat: 0, bats: 1, spikes: 0, hull: '#ff6fd0' },
  { name: 'Tea Party Garden', line: "Pinkies up! The teacups are flying today.", sky: ['#ffe4ef', '#d8f3e4'], time: 58, rate: 22, boss: 'Teacup Saucer', hp: 132, pat: 1, bats: 0, spikes: 0, hull: '#ff8fbf' },
  { name: 'Ice Palace', line: "Everything sparkles, and the spikes are icy!", sky: ['#cfe9ff', '#f3e6ff'], time: 58, rate: 22, boss: 'Frost Saucer', hp: 136, pat: 2, bats: 0, spikes: 1, hull: '#7fc8ff', spike: '#bfeaff' },
  { name: 'Toy Workshop', line: "Wind-up toys everywhere. Who wound them all?", sky: ['#ffe0a8', '#ffb37a'], time: 58, rate: 21, boss: 'Toybox Saucer', hp: 140, pat: 0, bats: 1, spikes: 1, hull: '#ff6b6b', spike: '#ffd36b' },
  { name: 'Lantern Festival', line: "A thousand lanterns light the river tonight.", sky: ['#3b2160', '#ff9a6b'], time: 58, rate: 21, boss: 'Lantern Saucer', hp: 142, pat: 1, bats: 1, spikes: 0, hull: '#e8283c' },
  { name: 'Jungle Temple', line: "Vines, waterfalls and a secret temple!", sky: ['#bff0c8', '#3f9f6b'], time: 59, rate: 21, boss: 'Temple Saucer', hp: 146, pat: 2, bats: 1, spikes: 1, hull: '#d9a43a', spike: '#9be28f' },
  { name: 'Desert Oasis', line: "Golden dunes and a cool blue oasis.", sky: ['#ffd9a0', '#ff8f6b'], time: 59, rate: 20, boss: 'Dune Saucer', hp: 150, pat: 0, bats: 0, spikes: 1, hull: '#ff9f43', spike: '#ffd7a0' },
  { name: 'Unicorn Castle', line: "Home at last. One more grumpy queen to cheer up.", sky: ['#ffd1f0', '#ffa8d8'], time: 56, rate: 24, boss: 'Queen of Sparkles', hp: 120, pat: 2, bats: 1, spikes: 1, hull: '#b8329e', spike: '#ffd36b', crown: 1 },
];
const HULLS = ['#d6199a', '#2d9cdb', '#6c3fb5', '#3aa7a0', '#e8743b', '#ff7a6b', '#18a999', '#5a5f7a'];

let state = typeof Image !== 'undefined' ? 'loading' : 'title', ch = 0, t = 0, score = 0, lives = 3, combo = 0, muted = false, best = 0;
let things = [], shots = [], bolts = [], sparks = [], boss = null, clear = 0;
let mode = 'solo', sel = 0, reached = 0, startCh = 0, easy = false;   // solo | local (2 players, one screen) | host / guest (two devices)
let pops = [], kills = 0;
const stat = { rings: 0, ringsAll: 0, foes: 0, hits: 0, stars: 0 };   // this chapter's numbers for the results card
let starsBest = []; try { starsBest = JSON.parse(localStorage.getItem('pinkUnicornStars') || '[]'); } catch (e) {}   // floating "+20" score pop-ups
function pop(x, y, str, col) { if (pops.length < 30) pops.push({ x, y, str, col, l: 50 }); }
let trans = null, ending = 0, shake = 0, paused = false, warn = 0, mt = 0;
const uni = { x: 150, y: H / 2, ty: H / 2, flash: 0, shield: 0, rapid: 0, triple: 0, magnet: 0, i: 0, tx: 150, vx: 0, vy: 0, tilt: 0, fp: 0, dash: 0, dashCd: 0 };     // player 1: the unicorn
const p2 = { x: 110, y: H / 2 + 80, ty: H / 2 + 80, flash: 0, shield: 0, rapid: 0, triple: 0, magnet: 0, i: 1, tx: 110, vx: 0, vy: 0, tilt: 0, fp: 0, dash: 0, dashCd: 0 };   // player 2: the mermaid
let players = [uni];
const maxLives = () => players.length > 1 ? 7 : 5;
const nearest = o => players.reduce((a, b) => Math.hypot(a.x - o.x, a.y - o.y) <= Math.hypot(b.x - o.x, b.y - o.y) ? a : b);
const mer = { x: 80, y: H / 2, cd: 0 };   // computer-controlled mermaid in 1-player games
const keys = {};
try { best = +localStorage.getItem('pinkUnicornBest') || 0; reached = Math.min(CHAPTERS.length - 1, +localStorage.getItem('pinkUnicornReached') || 0); easy = localStorage.getItem('pinkUnicornEasy') === '1'; muted = localStorage.getItem('pinkUnicornMute') === '1'; } catch (e) {}
startCh = Math.min(startCh, reached);
function saveOpt(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
// Sound settings (saved): music 0 = off, 1 = low, 2 = normal; effects and voices on/off.
const opts = { music: 2, sfx: 1, voice: 1, buzz: 1 };
try { Object.assign(opts, JSON.parse(localStorage.getItem('pinkUnicornOpts') || '{}')); } catch (e) {}
let settingsOpen = false;
// Sparkle Shop: rings collected in any game are saved; spend them on unicorn looks.
const SKINS = [{ id: '', name: 'Classic', price: 0 }, { id: 'mint', name: 'Mint', price: 150 }, { id: 'snow', name: 'Snow', price: 300 }, { id: 'galaxy', name: 'Galaxy', price: 600 }, { id: 'golden', name: 'Golden', price: 1000 }, { id: 'rainbow', name: 'Rainbow', price: 0, shoes: 50 }];
const shopCardX = i => W / 2 + (i - (SKINS.length - 1) / 2) * 152;
let wallet = 0, owned = [''], skin = '', hostSkin = '', shopMsg = '', shopMsgT = 0;
try { wallet = +localStorage.getItem('pinkUnicornWallet') || 0; owned = JSON.parse(localStorage.getItem('pinkUnicornOwned') || '[""]'); skin = localStorage.getItem('pinkUnicornSkin') || ''; } catch (e) {}
function saveShop() { saveOpt('pinkUnicornWallet', wallet); saveOpt('pinkUnicornOwned', JSON.stringify(owned)); saveOpt('pinkUnicornSkin', skin); }
// Rainbow Run: endless mode through random chapters that get harder; a boss every third stretch.
let run = false, runSeg = 0, bestRun = 0;
try { bestRun = +localStorage.getItem('pinkUnicornBestRun') || 0; } catch (e) {}
const segTime = () => run ? 30 : CHAPTERS[ch].time;
const runPick = n => Math.min(NCH - 1, Math.floor(n * .8) + (Math.random() * 4 | 0));
function nextRun() {
  if (trans) return;   // already on the way to the next stretch
  runSeg++; const c = runPick(runSeg); useChapterArt(c);
  go(() => { ch = c; t = 0; pops = []; stageReset(); things = []; shots = []; bolts = []; boss = null; clear = 0; state = 'play'; sfx('start'); }, `Rainbow Run · stretch ${runSeg + 1} · ${CHAPTERS[c].name}`);
}
function buzz(ms) { try { if (opts.buzz && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
const SETTING_ROWS = [['music', 'Music', ['Off', 'Low', 'On']], ['sfx', 'Sound effects', ['Off', 'On']], ['voice', 'Voices', ['Off', 'On']], ['buzz', 'Vibration', ['Off', 'On']], ['full', 'Fullscreen (F)', ['Off', 'On']]];
function settingsTap(x, y) {   // rows of the settings panel; returns true if the tap changed a setting
  for (let i = 0; i < SETTING_ROWS.length; i++) {
    if (Math.abs(x - W / 2) < 210 && Math.abs(y - (206 + i * 46)) < 20) {
      const [k, , vals] = SETTING_ROWS[i];
      if (k === 'full') { toggleFullscreen(); sfx('click'); return true; }
      opts[k] = (opts[k] + 1) % vals.length; saveOpt('pinkUnicornOpts', JSON.stringify(opts)); audio(); sfx('click'); return true;
    }
  }
  return false;
}
// ---- isometric world map: one floating island per chapter along a rainbow path; drag to scroll, tap to fly there ----
let mapX = 0, mapDrag = null;
const isoPos = i => ({ x: 150 + i * 178, y: 270 + Math.sin(i * 1.1) * 70 + (i % 2 ? 16 : -16) });
const MAP_W = () => isoPos(NCH).x + 150;   // one extra island at the end: the Castle Garden walk
function centerMap() { mapX = Math.max(0, Math.min(MAP_W() - W, isoPos(startCh).x - W / 2)); }
function openMap() { state = 'map'; centerMap(); for (let i = 0; i < NCH; i++) loadArt('isle_' + i); ['tree_apple', 'pal_bunny', 'food_cupcake'].forEach(loadArt); audio(); sfx('click'); }
function mapPlay(i) { if (i > reached) return; startCh = i; if (sel > 1) sel = 0; chooseMode(); }
function mapTap(x, y) {
  if (y > H - 64 && Math.abs(x - W / 2) < 80) { state = 'title'; sfx('click'); return; }
  if (walkOpen) { const p = isoPos(NCH); if (Math.hypot(x - (p.x - mapX), y - p.y) < 72) { mode = 'solo'; players = [uni]; run = false; startWalk(); return; } }
  for (let i = 0; i < NCH; i++) {
    const p = isoPos(i);
    if (Math.hypot(x - (p.x - mapX), y - p.y) < 72) {
      if (i > reached) { pop(p.x - mapX, p.y - 60, 'Locked', '#fff'); sfx('hurt'); }
      else if (i === startCh) mapPlay(i); else { startCh = i; sfx('click'); }
      return;
    }
  }
}
if (typeof cv.addEventListener === 'function') {
  cv.addEventListener('pointermove', e => { if (state !== 'map' || !mapDrag) return; const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width;
    if (Math.abs(x - mapDrag.x) > 8) mapDrag.moved = true; mapX = Math.max(0, Math.min(MAP_W() - W, mapDrag.mx - (x - mapDrag.x))); });
  cv.addEventListener('pointerup', e => { if (state !== 'map' || !mapDrag) return; const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
    const d = mapDrag; mapDrag = null; if (!d.moved) mapTap(x, y); });
}
function drawMap() {
  g.fillStyle = 'rgba(255,240,250,.25)'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(-mapX, 0);
  g.lineCap = 'round';
  for (let i = 0; i < NCH - 1; i++) {   // rainbow path between islands
    const a = isoPos(i), b = isoPos(i + 1), done = i < reached;
    g.strokeStyle = done ? RAINBOW[i % 6] : 'rgba(255,255,255,.55)'; g.lineWidth = 7; if (g.setLineDash) g.setLineDash(done ? [] : [10, 12]);
    g.beginPath(); g.moveTo(a.x, a.y + 30); g.bezierCurveTo(a.x + 80, a.y + 70, b.x - 80, b.y + 70, b.x, b.y + 30); g.stroke();
  }
  if (g.setLineDash) g.setLineDash([]);
  {   // the Castle Garden island (unlocked by cheering up the Queen)
    const a = isoPos(NCH - 1), p = isoPos(NCH), bob = Math.sin(t / 30 + NCH) * 5;
    g.strokeStyle = walkOpen ? RAINBOW[0] : 'rgba(255,255,255,.55)'; g.lineWidth = 7; if (g.setLineDash) g.setLineDash(walkOpen ? [] : [10, 12]);
    g.beginPath(); g.moveTo(a.x, a.y + 30); g.bezierCurveTo(a.x + 80, a.y + 70, p.x - 80, p.y + 70, p.x, p.y + 30); g.stroke(); if (g.setLineDash) g.setLineDash([]);
    g.fillStyle = 'rgba(60,20,80,.18)'; g.beginPath(); g.ellipse(p.x, p.y + 78, 58, 12, 0, 0, 7); g.fill();
    g.globalAlpha = walkOpen ? 1 : .45;
    {   // a little garden island built from the garden's own sprites
      const y = p.y + bob; g.fillStyle = '#8f7f8f'; g.beginPath(); g.moveTo(p.x - 62, y + 6); g.lineTo(p.x - 30, y + 58); g.lineTo(p.x + 8, y + 72); g.lineTo(p.x + 40, y + 52); g.lineTo(p.x + 64, y + 6); g.closePath(); g.fill();
      g.fillStyle = '#a99aa8'; g.beginPath(); g.moveTo(p.x - 62, y + 6); g.lineTo(p.x - 30, y + 58); g.lineTo(p.x + 2, y + 40); g.lineTo(p.x + 64, y + 6); g.closePath(); g.fill();
      g.fillStyle = '#6cc552'; g.beginPath(); g.ellipse(p.x, y + 4, 68, 30, 0, 0, 7); g.fill(); g.fillStyle = '#9be36e'; g.beginPath(); g.ellipse(p.x, y, 64, 25, 0, 0, 7); g.fill();
      g.fillStyle = '#5cc8ff'; g.beginPath(); g.ellipse(p.x + 26, y + 6, 18, 7, 0, 0, 7); g.fill();
      spr('tree_apple', p.x - 22, y - 38, 92); spr('pal_bunny', p.x + 34, y - 10, 30); spr('food_cupcake', p.x - 2, y + 6, 20);
    }
    g.globalAlpha = 1;
    const label = (NCH + 1) + '. Castle Garden'; g.font = 'bold 14px "Trebuchet MS", sans-serif'; const lw = g.measureText(label).width + 24;
    panel(p.x - lw / 2, p.y + 84, lw, 24, 12, walkOpen ? 'rgba(80,170,90,.85)' : 'rgba(90,70,110,.6)'); g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(label, p.x, p.y + 101);
  }
  for (let i = 0; i < NCH; i++) {
    const p = isoPos(i); if (p.x - mapX < -160 || p.x - mapX > W + 160) continue;
    const locked = i > reached, bob = Math.sin(t / 30 + i) * 5, on = i === startCh;
    g.fillStyle = 'rgba(60,20,80,.18)'; g.beginPath(); g.ellipse(p.x, p.y + 78, 58, 12, 0, 0, 7); g.fill();   // shadow on the clouds below
    if (on) { g.fillStyle = `rgba(255,243,140,${.35 + .15 * Math.sin(t / 8)})`; g.beginPath(); g.ellipse(p.x, p.y + bob, 92, 78, 0, 0, 7); g.fill(); }
    g.globalAlpha = locked ? .45 : 1;
    if (!spr('isle_' + i, p.x, p.y + bob, 150)) { g.fillStyle = CHAPTERS[i].sky[0]; g.beginPath(); g.ellipse(p.x, p.y + bob, 60, 34, 0, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    const label = (i + 1) + '. ' + CHAPTERS[i].name; g.font = 'bold 14px "Trebuchet MS", sans-serif'; const lw = g.measureText(label).width + 24;
    panel(p.x - lw / 2, p.y + 84, lw, 24, 12, locked ? 'rgba(90,70,110,.6)' : on ? 'rgba(232,39,154,.85)' : 'rgba(122,26,99,.6)');
    g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(label, p.x, p.y + 101);
    if (!locked && starsBest[i]) txt('★'.repeat(starsBest[i]), p.x, p.y + 126, 16, '#ffe45c');
    if (!locked && shoes[i]) for (let k = 0; k < shoeBits(shoes[i]); k++) if (!spr('pick_shoe', p.x - 16 + k * 16, p.y + 146, 16)) txt('U', p.x - 16 + k * 16, p.y + 152, 13, '#ffd84a');
    if (locked) { g.fillStyle = '#fff'; rr(p.x - 9, p.y - 4 + bob, 18, 14, 3); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y - 4 + bob, 6, Math.PI, 0); g.stroke(); }
    if (on) { g.save(); g.translate(p.x + 10, p.y - 92 + Math.sin(t / 15) * 6); g.scale(.6, .6); drawUnicorn(0, 0); g.restore(); }
  }
  g.restore();
  fancyText('World Map', W / 2, 58, 40);
  g.font = 'bold 15px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.fillStyle = '#7a1a63'; g.fillText('Drag to explore · tap an island, tap again to fly there', W / 2, 86);
  panel(W / 2 - 70, H - 56, 140, 38, 19, lg(0, H - 56, 0, H - 18, '#ff8fd0', '#e8279a'), '#fff'); txt('Back', W / 2, H - 30, 18, '#fff');
  for (const q of pops) { g.globalAlpha = Math.min(1, q.l / 20); txt(q.str, q.x, q.y, 18, q.col); } g.globalAlpha = 1;
}
function shopTap(x, y) {
  if (y > 452) { state = 'title'; sfx('click'); return; }   // back
  SKINS.forEach((k, i) => {
    const cx = shopCardX(i);
    if (Math.abs(x - cx) > 70 || y < 130 || y > 420) return;
    if (owned.includes(k.id)) { skin = k.id; sfx('click'); }
    else if (k.shoes) { shopMsg = `Find ${Math.max(0, k.shoes - shoeCount())} more golden horseshoes`; shopMsgT = 120; sfx('hurt'); }
    else if (wallet >= k.price) { wallet -= k.price; owned.push(k.id); skin = k.id; sfx('power'); voice('vo_u_power'); shopMsg = k.name + ' look unlocked!'; shopMsgT = 120; }
    else { shopMsg = `You need ${k.price - wallet} more rings`; shopMsgT = 120; sfx('hurt'); }
    saveShop();
  });
}
function drawShop() {
  g.fillStyle = 'rgba(42,15,61,.45)'; g.fillRect(0, 0, W, H);
  fancyText('Sparkle Shop', W / 2, 70, 46);
  panel(W / 2 - 90, 86, 180, 34, 17, 'rgba(122,26,99,.55)'); g.save(); g.translate(W / 2 - 62, 103); g.strokeStyle = '#ffc94a'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 8, 0, 7); g.stroke(); g.restore();
  g.font = 'bold 20px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(wallet + ' rings', W / 2 + 12, 110);
  SKINS.forEach((k, i) => {
    const cx = shopCardX(i), on = skin === k.id, has = owned.includes(k.id);
    panel(cx - 70, 136, 140, 280, 24, on ? lg(0, 136, 0, 416, '#fff3a0', '#ffc8e6') : 'rgba(255,240,250,.9)', on ? '#ffb300' : '#fff');
    g.save(); g.translate(cx, 250 + Math.sin(t / 20 + i) * 5);
    const fr = Math.sin(t / 5) > 0 ? 'up' : 'down';
    if (k.shoes && !has) g.globalAlpha = .45;
    if (!(k.id && spr('skin_' + k.id + '_' + fr, 0, 0, 92)) && !(!k.id && spr('uni_' + fr, 0, 0, 92))) { g.scale(.7, .7); drawUnicorn(0, 10); }
    g.globalAlpha = 1;
    g.restore();
    g.font = 'bold 20px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.fillStyle = '#7a1a63'; g.fillText(k.name, cx, 350);
    g.font = 'bold 16px "Trebuchet MS", sans-serif'; g.fillStyle = on ? '#e8279a' : has ? '#7a1a63' : wallet >= k.price ? '#2a9d5c' : '#a07090';
    g.fillText(on ? 'Wearing' : has ? 'Tap to wear' : k.shoes ? `${shoeCount()}/${k.shoes} shoes` : k.price + ' rings', cx, 384);
  });
  if (shopMsgT > 0) { shopMsgT--; panel(W / 2 - 170, 420, 340, 30, 15, 'rgba(255,179,0,.9)', '#fff'); txt(shopMsg, W / 2, 441, 16, '#fff'); }
  else { panel(W / 2 - 70, 460, 140, 38, 19, lg(0, 460, 0, 498, '#ff8fd0', '#e8279a'), '#fff'); txt('Back', W / 2, 486, 18, '#fff'); }
}
function drawSettings(title) {
  g.fillStyle = 'rgba(42,15,61,.5)'; g.fillRect(0, 0, W, H);
  panel(W / 2 - 250, 104, 500, 372, 30, lg(0, 104, 0, 476, 'rgba(255,242,250,.97)', 'rgba(255,205,236,.97)'), '#fff');
  fancyText(title, W / 2, 162, 44);
  SETTING_ROWS.forEach(([k, label, vals], i) => {
    const y = 206 + i * 46, on = k === 'full' ? isFull() : opts[k] > 0;
    rr(W / 2 - 210, y - 18, 420, 36, 18); g.fillStyle = on ? lg(0, y - 22, 0, y + 22, '#ff8fd0', '#e8279a') : 'rgba(122,26,99,.25)'; g.fill();
    g.font = 'bold 20px "Trebuchet MS", sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(label, W / 2 - 186, y + 7);
    g.textAlign = 'right'; g.fillText(vals[k === 'full' ? +isFull() : opts[k]], W / 2 + 186, y + 7);
  });
  g.font = 'bold 17px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.fillStyle = '#7a1a63'; g.fillText('Tap a row to change it · tap outside to close', W / 2, 456);
}
const touchUI = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;   // phones/tablets vs computers
function isFull() { return typeof document !== 'undefined' && !!(document.fullscreenElement || document.webkitFullscreenElement); }
function toggleFullscreen(onlyEnter) {
  try {
    const d = document.documentElement;
    if (!isFull()) { const f = d.requestFullscreen || d.webkitRequestFullscreen; if (f) { const p = f.call(d); if (p && p.catch) p.catch(() => {}); } }
    else if (!onlyEnter) { const x = document.exitFullscreen || document.webkitExitFullscreen; if (x) x.call(document); }
  } catch (e) {}
}
function toggleMute() { muted = !muted; saveOpt('pinkUnicornMute', muted ? 1 : 0); }

// ---- input ----
addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) return;   // typing in the lobby
  keys[e.key] = true;
  if (e.key === 'm') toggleMute();
  if (e.key === 'f') toggleFullscreen();
  if (state === 'map') {
    if (e.key === 'ArrowLeft') { startCh = Math.max(0, startCh - 1); centerMap(); }
    if (e.key === 'ArrowRight') { startCh = Math.min(reached, startCh + 1); centerMap(); }
    if (e.key === 'Enter' || e.key === ' ') { mapPlay(startCh); return; }
    if (e.key === 'Escape') state = 'title';
    return;
  }
  if (state === 'title' && !trans) {
    if (e.key === 'ArrowUp') { sel = (sel + MENU.length - 1) % MENU.length; audio(); sfx('click'); }
    if (e.key === 'ArrowDown') { sel = (sel + 1) % MENU.length; audio(); sfx('click'); }
    if (e.key === 'ArrowLeft') startCh = Math.max(0, startCh - 1);
    if (e.key === 'ArrowRight') startCh = Math.min(reached, startCh + 1);
    if (e.key === 'e') { easy = !easy; saveOpt('pinkUnicornEasy', easy ? 1 : 0); }
    if (e.key >= '1' && e.key <= '4') { sel = +e.key - 1; press(); }
  }
  if (e.key === 'p' || e.key === 'Escape') paused = !paused && (state === 'play' || state === 'walk');
  if (state === 'walk' && !paused && (e.key === 'ArrowUp' || e.key === 'w')) { if (!e.repeat) walkJump(); return; }
  if (state === 'play' && !paused && (e.key === 'z' || e.key === 'Enter')) { nova(); return; }
  if (state === 'play' && !paused && (e.key === ' ' || e.key === 'Shift' || e.key === 'x' || e.key === 'q')) {   // dash (local 2P: Q dashes player 2)
    const who = mode === 'local' && e.key === 'q' ? p2 : mode === 'guest' ? null : uni;
    if (who) dash(who); else net.sendR('{"p":3}');
    return;
  }
  if (e.key === ' ' || e.key === 'Enter') press();
});
addEventListener('keyup', e => keys[e.key] = false);
function pointer(e) {
  const r = cv.getBoundingClientRect();
  for (const p of e.touches ? [...e.touches] : [e]) {   // in 2-player games the right half of the screen steers player 2
    const x = (p.clientX - r.left) * W / r.width, y = (p.clientY - r.top) * H / r.height;
    if (state === 'walk') { walkAim(x); continue; }
    const who = mode === 'guest' || (players.length > 1 && x > W / 2 && mode === 'local') ? p2 : uni;
    who.ty = y; who.tx = mode === 'local' && players.length > 1 ? (who === p2 ? x - W / 2 : x) * 1.4 : x;
  }
}
addEventListener('blur', () => { if (state === 'play' || state === 'bonus' || state === 'walk') paused = true; });
// iOS only unlocks sound on touchend / click, so try again on those too; resume audio when coming back to the app.
addEventListener('touchend', () => audio(), { passive: true });
addEventListener('click', () => audio());
if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('visibilitychange', () => { if (!document.hidden && typeof ac !== 'undefined' && ac && ac.state !== 'running') ac.resume(); if (document.hidden) saveShop(); });
cv.addEventListener('mousemove', pointer);
cv.addEventListener('touchmove', e => { pointer(e); e.preventDefault(); }, { passive: false });
const MENU = ['1 Player', '2 Players · one screen', '2 Devices · online', 'Rainbow Run · endless'];
cv.addEventListener('pointerdown', e => {
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
  pointer(e);
  if (e.button === 2 && state === 'play' && !paused) { if (mode === 'guest') net.sendR('{"p":3}'); else dash(uni); return; }   // right-click dashes (mouse players)
  if (state === 'play' && !paused) {   // double-tap to dash
    const now = Date.now(), who = mode === 'guest' || (players.length > 1 && x > W / 2 && mode === 'local') ? p2 : uni;
    if (now - (who.lastTap || 0) < 280) { if (mode === 'guest') net.sendR('{"p":3}'); else dash(who); }
    who.lastTap = now;
  }
  if (state === 'title' && !trans) {
    if (settingsOpen) { if (!settingsTap(x, y)) settingsOpen = false; return; }
    if (Math.hypot(x - (W - 40), y - 40) < 24) { settingsOpen = true; audio(); sfx('click'); return; }
    if (y > 452 && y < 484) { if (x < W / 2 - 150) startCh = Math.max(0, startCh - 1); else if (x > W / 2 + 150) startCh = Math.min(reached, startCh + 1); else { openMap(); return; } }
    if (x < 220 && y > 488) { easy = !easy; saveOpt('pinkUnicornEasy', easy ? 1 : 0); return; }
    if (x < 190 && y < 66) { state = 'shop'; audio(); sfx('click'); SKINS.forEach(k => k.id && ['up', 'down'].forEach(f => loadArt('skin_' + k.id + '_' + f))); return; }
    if (y > 452 && y < 484) return;
    MENU.forEach((_, i) => { if (Math.abs(x - W / 2) < 200 && y > 276 + i * 44 && y < 314 + i * 44) sel = i; }); }
  if (state === 'shop') { shopTap(x, y); return; }
  if (state === 'map') { mapDrag = { x, mx: mapX, moved: false }; return; }
  if (state === 'play' && paused && mode !== 'guest' && settingsTap(x, y)) return;
  if (state === 'over' && Math.abs(x - W / 2) < 80 && y > H - 74 && y < H - 22) { toTitle(); return; }   // Menu button
  if ((state === 'bonus' || state === 'walk') && Math.hypot(x - (W - 40), y - (H - 34)) < 24) { paused = !paused; return; }
  if (state === 'walk' && paused && settingsTap(x, y)) return;
  if (state === 'play') {   // on-screen pause / mute buttons for touch screens
    if (Math.hypot(x - (W - 40), y - (H - 34)) < 24) { if (mode === 'guest') net.sendR('{"p":2}'); else paused = !paused; return; }
    if (Math.hypot(x - (W - 94), y - (H - 34)) < 24) { toggleMute(); return; }
    if (Math.hypot(x - 44, y - (H - 44)) < 30) { nova(); return; }   // Sparkle Meter button
  }
  press();
});
function press() {
  audio();
  if (mode === 'guest') { net.sendR('{"p":1}'); return; }
  if (trans) return;
  if (paused) { paused = false; return; }
  if (state === 'title') chooseMode();
  else if (state === 'over' && t > 40) { if (run) { runSeg = 0; start(runPick(0), true); } else start(ch, true); }   // try again right away
  else if (state === 'walk') walkJump();
  else if (state === 'chapter') { state = 'play'; bark(Math.random() < .5 ? 'vo_u_go' : 'vo_m_go', .6); }
  else if (state === 'results' && t > 60) nextChapter();
  else if (state === 'ending' && ending > 240) toTitle();
}

function chooseMode() {
  run = false;
  if (sel === 3) { mode = 'solo'; run = true; runSeg = 0; start(runPick(0), true); return; }
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
    tr: trans ? [trans.t, trans.label || ''] : 0, sk: skin, mt: [meter, novaT], pl: pal ? [rd(pal.x), rd(pal.y), pal.t] : 0, rs: [stat.rings, stat.ringsAll, stat.foes, stat.hits, stat.stars],
    u: [rd(uni.x), rd(uni.y), uni.flash, uni.shield, uni.rapid, uni.triple, uni.magnet, rd(uni.tilt * 100) / 100, uni.dash], p: [p2.x, rd(p2.y), p2.flash, p2.shield, p2.rapid, p2.triple, p2.magnet],
    b: boss ? [rd(boss.x), rd(boss.y), boss.hp, boss.max] : 0,
    th: things.map(o => [o.kind, rd(o.x), rd(o.y), rd(o.vx), rd(o.ph || 0), o.hit || 0, o.top ? 1 : 0, o.foe ? 1 : 0, o.golden ? 1 : 0, rd(o.vy || 0)]),
    sh: shots.map(q => [rd(q.x), rd(q.y), q.m ? 1 : 0, rd(q.vy || 0), q.w || 0, rd(q.vx || 0)]), wp: [uni.weapon || '', uni.weaponT || 0, p2.weapon || '', p2.weaponT || 0], bo: bolts.map(b => [rd(b.x), rd(b.y), rd(b.vx), rd(b.vy)]), ev: net.ev.splice(0) }));
}
function applySnap(m) {
  state = m.st; ch = m.ch; useChapterArt(ch); t = m.t; score = m.sc; lives = m.l; combo = m.cb; clear = m.cl; paused = !!m.pa; warn = m.w; shake = m.sk;
  trans = m.tr ? { t: m.tr[0], label: m.tr[1] } : null;
  hostSkin = m.sk || ''; if (m.mt) [meter, novaT] = m.mt; pal = m.pl ? { x: m.pl[0], y: m.pl[1], t: m.pl[2] } : null;
  if (m.rs) [stat.rings, stat.ringsAll, stat.foes, stat.hits, stat.stars] = m.rs;
  uni.x = m.u[0]; uni.y = m.u[1]; [uni.flash, uni.shield, uni.rapid, uni.triple, uni.magnet, uni.tilt, uni.dash] = m.u.slice(2); uni.fp = t / 5 * 1.3; [p2.flash, p2.shield, p2.rapid, p2.triple, p2.magnet] = m.p.slice(2);   // guest steers its own mermaid locally
  boss = m.b ? { x: m.b[0], y: m.b[1], hp: m.b[2], max: m.b[3] } : null;
  things = m.th.map(a => ({ kind: a[0], x: a[1], y: a[2], y0: a[2], vx: a[3], ph: a[4], hit: a[5], top: !!a[6], foe: a[7], golden: a[8], vy: a[9] }));
  shots = m.sh.map(a => ({ x: a[0], y: a[1], m: a[2], vy: a[3], w: a[4] || undefined, vx: a[5] }));
  if (m.wp) [uni.weapon, uni.weaponT, p2.weapon, p2.weaponT] = m.wp;
  bolts = m.bo.map(a => ({ x: a[0], y: a[1], vx: a[2], vy: a[3] }));
  for (const e of m.ev) { if (e[0] === 'x') sfx(e[1], e[2]); else if (e[0] === 'v') voice(e[1]); else if (e[0] === 'b') boom(e[1], e[2], e[3], e[4]); }
}
function guestTick() {   // between snapshots: keep things moving smoothly and steer the mermaid
  t++;
  const kx = (l, r) => (keys[r] ? 1 : 0) - (keys[l] ? 1 : 0);
  steerDir(p2, kx('ArrowLeft', 'ArrowRight') + kx('a', 'd') + padX[0], kx('ArrowUp', 'ArrowDown') + kx('w', 's') + padDir[0]);
  if ((state === 'play' || state === 'bonus') && !paused) { movePlayer(p2); if (state === 'play') stageTick(false); }
  for (const o of things) { o.x += o.vx; if (o.vy) o.y += o.vy; }
  for (const q of shots) { q.x += q.vx || (q.m ? 10 : 12); q.y += q.vy || 0; if (t % 2 === 0 && !q.m) sparks.push({ x: q.x, y: q.y + (Math.random() - .5) * 10, vx: -1 - Math.random(), vy: (Math.random() - .5) * 1.5, l: 18, col: `hsl(${(t * 15 + q.x) % 360},90%,75%)` }); }
  for (const b of bolts) { b.x += b.vx; b.y += b.vy; }
  if (shake > 0) shake--;
  for (const q of sparks) { q.x += q.vx; q.y += q.vy; q.l--; }
  sparks = sparks.filter(q => q.l > 0);
  if (trans && ++trans.t >= 70) trans = null;
  if (++net.ntk % 2 === 0) net.send(JSON.stringify({ x: rd(p2.tx), y: rd(p2.ty) }));
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
let padPrev = {}, padDir = [0, 0], padX = [0, 0];
function pollPads() {
  padDir = [0, 0]; padX = [0, 0];
  const list = typeof navigator !== 'undefined' && navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  list.slice(0, 2).forEach((gp, i) => {
    const b = n => !!(gp.buttons[n] && gp.buttons[n].pressed);
    let d = Math.abs(gp.axes[1] || 0) > .25 ? gp.axes[1] : 0;
    if (b(12)) d = -1; if (b(13)) d = 1;
    padDir[i] = d;
    let dx = Math.abs(gp.axes[0] || 0) > .25 ? gp.axes[0] : 0; if (b(14)) dx = -1; if (b(15)) dx = 1;
    padX[i] = dx;
    const prev = padPrev[gp.index] || {}, cur = { a: b(0), s: b(9), up: d < 0, down: d > 0, dash: b(1) || b(2), nova: b(3) };
    if (state === 'title' && !trans) { if (cur.up && !prev.up) sel = (sel + MENU.length - 1) % MENU.length; if (cur.down && !prev.down) sel = (sel + 1) % MENU.length; }
    if (cur.a && !prev.a) press();
    if (cur.nova && !prev.nova && state === 'play') nova();
    if (cur.dash && !prev.dash && state === 'play') { const p = mode === 'guest' ? null : players[i]; if (p) dash(p); else net.sendR('{"p":3}'); }
    if (cur.s && !prev.s) { if (state === 'play') paused = !paused; else press(); }
    padPrev[gp.index] = cur;
  });
}

// Sound effects and music live in audio.js (audio(), sfx(name), music()).

// ---- game flow ----
// A rainbow curtain sweeps across; fn runs when the screen is fully covered.
// Even chapters sweep left, odd chapters sweep right; the next stop's name shows at full cover.
function go(fn, label) { if (!trans) trans = { t: 0, fn, label }; }
function start(c, fresh) {
  useChapterArt(c);   // start loading while the rainbow curtain plays
  go(() => {
    if (c > reached) { reached = c; saveOpt('pinkUnicornReached', c); }
    ch = c; t = 0; pops = []; pal = null; stageReset(); Object.assign(stat, { rings: 0, ringsAll: 0, foes: 0, hits: 0, stars: 0, sights: 0 }); things = []; shots = []; bolts = []; boss = null; clear = 0;
    players = mode === 'solo' ? [uni] : [uni, p2];
    for (const p of [uni, p2]) { p.flash = p.shield = p.rapid = p.triple = p.magnet = p.weaponT = p.stompInv = p.squash = 0; p.weapon = ''; p.x = p.tx = p.i ? 110 : 150; p.y = p.ty = H / 2 + (p.i ? 60 : -30); p.vx = p.vy = p.tilt = p.dash = p.dashCd = 0; }
    if (c === 0 || fresh) { score = 0; meter = 0; lives = (mode === 'solo' ? 3 : 5) + (easy ? 2 : 0); }
    novaT = 0;
    combo = 0; state = run ? 'play' : 'chapter'; ending = 0;
    sfx('start');
  }, `Chapter ${c + 1} · ${CHAPTERS[c].name}`);
}
function toTitle() { go(() => { state = 'title'; ending = 0; t = 0; run = false; }, 'Pink Unicorn'); }
function saveBest() { if (score > best) { best = score; try { localStorage.setItem('pinkUnicornBest', best); } catch (e) {} } }
function hurt(p = uni) {
  if (p.flash > 0 || p.shield > 0 || p.dash > 0 || p.stompInv > 0) return;
  if (tour() && state === 'play') { bump(p); return; }   // reef ride: bumps never cost a heart (stages.js)
  lives--; stat.hits++; combo = 0; p.flash = 90; buzz(70); shake = 12; sfx('hurt'); if (lives === 1) voice('vo_u_low'); else bark(lives % 2 ? 'vo_u_hurt' : 'vo_m_look', .8);
  if (lives <= 0) { state = 'over'; t = 0; saveBest(); if (run && score > bestRun) { bestRun = score; saveOpt('pinkUnicornBestRun', bestRun); } sfx('over'); voice('vo_u_over'); }
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
  butterfly: { hp: 1, r: 20, vx: -3.5, pts: 25 }, // flutters in big lazy waves
  balloon: { hp: 2, r: 26, vx: -2.2, pts: 40 },   // balloon animal drifting up from below
};
const FOES = [['bird', 'pig'], ['jelly', 'fish'], ['owl', 'ghost'], ['bird', 'ghost'], ['bird', 'bee', 'pig'], ['fish', 'jelly'],
  ['bug', 'ghost'], ['storm', 'bird'], ['owl', 'bee', 'pig'], ['pig', 'bee', 'bird'], ['bird', 'owl', 'ghost'],
  ['butterfly', 'bee', 'bird'], ['bird', 'fish', 'butterfly', 'bug'], ['balloon', 'ghost', 'storm', 'bird'],
  ['bee', 'butterfly', 'pig', 'bird'], ['storm', 'bug', 'balloon', 'bird'], ['jelly', 'ghost', 'balloon', 'storm'],
  ['owl', 'bird', 'pig', 'butterfly'], ['bird', 'balloon', 'storm', 'bee'], ['ghost', 'bird', 'balloon', 'storm'],
  ['butterfly', 'bee', 'pig', 'bird'], ['ghost', 'bird', 'storm', 'jelly'], ['balloon', 'bird', 'pig', 'bug'],
  ['butterfly', 'ghost', 'balloon', 'bird'], ['bird', 'bee', 'bug', 'owl'], ['bird', 'storm', 'bug', 'pig'], ['pig', 'bird', 'storm', 'balloon']];
const POW = ['rapid', 'triple', 'magnet', 'bomb'];   // rapid fire, triple shot, ring magnet, screen-clearing bomb
function applyPower(p, k) {
  if (k !== 'bomb') { p[k] = 480; sfx('power'); bark(p === uni ? 'vo_u_power' : 'vo_m_bubble', .8); score += 25; return; }
  for (const o of things) if (o.foe || o.kind === 'cloud' || o.kind === 'bat' || o.kind === 'spike' || o.kind === 'rock') { o.dead = true; score += o.foe ? FOE[o.kind].pts : 10; boom(o.x, o.y, '#ffb347', 10); }
  bolts = []; shake = 20; if (boss && !clear) boss.hp = Math.max(1, boss.hp - 6);
  sfx('bomb');
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
  else if (k === 'butterfly') o.y = o.y0 + Math.sin(t / 14 + o.ph) * 70 + Math.sin(t / 5 + o.ph) * 8;
  else if (k === 'balloon') { o.y0 -= .55; o.y = o.y0 + Math.sin(t / 25 + o.ph) * 12; if (o.y < -40) o.dead = true; }
  else if (k === 'storm' && o.x < W - 60 && o.x > 200 && ++o.cd % 90 === 0) {
    const tg = nearest(o), a = Math.atan2(tg.y - o.y, tg.x - o.x); bolts.push({ x: o.x, y: o.y + 20, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5 });
  }
  if (k !== 'balloon') o.y = Math.max(25, Math.min(H - 25, o.y));
}
// Difficulty rises quickly over the first chapters, then levels off (0 at chapter 1, about 0.96 at chapter 27).
const hard = () => 1 - Math.exp(-ch / 8);
const tour = () => !run && !!CHAPTERS[ch].tour;   // gentle sightseeing ride (Coral Reef): see stages.js
function spawn() {
  if (tour()) { tourSpawn(); return; }
  const c = CHAPTERS[ch], r = Math.random(), y = 40 + Math.random() * (H - 80), vx = -(3 + 5.5 * hard() + Math.random() * 2) * (easy ? .85 : 1);
  let kind = r < .45 ? 'ring' : r < .58 ? 'heart' : r < .63 ? 'star' : r < .68 ? POW[Math.random() * 4 | 0] : r < .73 ? 'w_' + Object.keys(WEAPONS)[Math.random() * 4 | 0] : 'cloud';
  if (kind === 'cloud' && c.bats && Math.random() < .4) kind = 'bat';
  if (kind === 'cloud' && c.spikes && Math.random() < .5) kind = 'spike';
  if (kind === 'heart' && lives >= maxLives()) kind = 'ring';
  if (kind === 'cloud' && !pal && !run && Math.random() < .035) kind = 'friend';
  if (kind === 'cloud' && Math.random() < .55) {   // swap hazard for a shootable enemy
    const list = FOES[ch], k = list[Math.random() * list.length | 0], f = FOE[k], top = Math.random() < .5, yy = k === 'bug' ? (top ? 30 : H - 30) : k === 'balloon' ? H - 20 - Math.random() * 120 : y;
    things.push({ kind: k, foe: 1, hp: f.hp, x: W + 40, y: yy, y0: yy, ph: Math.random() * 6, vx: (f.vx - 1.6 * hard()) * (easy ? .85 : 1), r: f.r, top, cd: 60, hit: 0 });
    return;
  }
  if (kind === 'ring') stat.ringsAll++;
  if (kind === 'spike') { const top = Math.random() < .5; things.push({ kind, x: W + 30, y: top ? 20 : H - 20, top, vx, r: 34 }); return; }
  things.push({ kind, x: W + 30, y, y0: y, ph: Math.random() * 6, vx: kind === 'bat' ? vx - 1 : vx, r: kind === 'cloud' ? 28 : kind === 'bat' ? 20 : 16 });
}

// Bosses get angrier: phase 0 above half health, 1 below half, 2 below a quarter.
// Each phase mixes in the next attack pattern, fires faster, and moves around more.
const TAUNTS = ["Hmph! Too many rainbows around here!", "Snip snap! This sea is MY sea!", "Hoo dares wake me up?", "Brrr! Go away, warm sparkles!", "Don't touch! I'm prickly AND grumpy!", "Eight arms, zero smiles!", "Rocks don't do giggles.", "Thunder and grumbles! Bow to the Storm King!", "Keep out of my thorny forest!", "Sour power, activate!", "Ribbit... no wishes tonight!", "No petals! I'm trying to nap!", "Squawk! No rainbows allowed!", "The carnival is closed! Forever!", "My sunflower seeds! Mine!", "Rawr! Too hot to handle!", "Meow-ow! This galaxy is mine!", "These acorns are NOT for sharing!", "Arr! Walk the cloud plank!", "Coo! Shh! The city is sleeping!", "You're late! Very late! No tea for you!", "I'll freeze your sparkles!", "No playing with MY toys!", "Blub! Lanterns out!", "Ooh ooh! The treasure is mine!", "Sand in your mane! Ha!", "I am the Queen! Only I may sparkle!"];
let bossIntro = 0;
const bossPhase = () => boss.hp / boss.max > .5 ? 0 : boss.hp / boss.max > .25 ? 1 : 2;
function bossFire() {
  const ph = bossPhase(), sp = (4.5 + 3.8 * hard()) * (easy ? .8 : 1) * (1 + ph * .12) * (tour() ? .55 : 1), tg = nearest(boss), a = Math.atan2(tg.y - boss.y, tg.x - boss.x);
  const rate = Math.round(Math.max(40, 80 - ch * 8) * (1 - ph * .2) * (tour() ? 1.8 : 1));
  if (t % rate) return;
  const p = tour() ? 0 : (CHAPTERS[ch].pat + (ph > 0 && (t / rate | 0) % 2 ? ph : 0)) % 3;   // alternate with a new pattern once angry
  if (p === 0) bolts.push({ x: boss.x - 40, y: boss.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp });
  else if (p === 1) for (const d of ph === 2 ? [-.5, -.25, 0, .25, .5] : [-.35, 0, .35]) bolts.push({ x: boss.x - 40, y: boss.y, vx: Math.cos(a + d) * sp, vy: Math.sin(a + d) * sp });
  else { const n = 8 + ph * 2; for (let i = 0; i < n; i++) { const b = i / n * 6.283 + t / 30; bolts.push({ x: boss.x, y: boss.y, vx: Math.cos(b) * sp * .8, vy: Math.sin(b) * sp * .8 }); } }
}

// ---- free flying: players steer toward a target point (finger/mouse) or in a direction (keys/pad) ----
const MINX = 50, MAXX = W * .72;
const maxX = () => state === 'bonus' ? W - 50 : MAXX;   // bonus rounds use the whole screen
function steerDir(p, dx, dy) { if (dx) p.tx = p.x + dx * 60; if (dy) p.ty = p.y + dy * 60; }
function dash(p) {   // quick sparkly burst in the flying direction; can't be hurt while dashing
  if (p.dashCd > 0 || state !== 'play' || paused) return;
  let dx = p.vx, dy = p.vy; const m = Math.hypot(dx, dy); if (m < 1) { dx = 1; dy = 0; } else { dx /= m; dy /= m; }
  p.dvx = dx * 17; p.dvy = dy * 17; p.dash = 10; p.dashCd = 45; sfx('dash'); buzz(15); boom(p.x, p.y, '#fff', 14);
}
function movePlayer(p) {
  const sp = 7;
  if (p.dash > 0) { p.dash--; p.vx = p.dvx; p.vy = p.dvy; if (p.dash === 0) { p.tx = p.x + p.vx * 2; p.ty = p.y + p.vy * 2; }
    sparks.push({ x: p.x - 20, y: p.y + (Math.random() - .5) * 30, vx: -3, vy: 0, l: 20, col: RAINBOW[t % 6] }); }
  else {
    p.tx = Math.max(MINX, Math.min(maxX(), p.tx)); p.ty = Math.max(30, Math.min(H - 30, p.ty));
    p.vx += (Math.max(-sp, Math.min(sp, p.tx - p.x)) - p.vx) * .35;
    p.vy += (Math.max(-sp, Math.min(sp, p.ty - p.y)) - p.vy) * .35;
  }
  if (p.dashCd > 0) p.dashCd--;
  p.x = Math.max(MINX, Math.min(maxX(), p.x + p.vx - (state === 'bonus' || p.dash > 0 ? 0 : windX * .8)));   // wind pushes you back
  p.y = Math.max(30, Math.min(H - 30, p.y + p.vy));
  p.tilt += (Math.max(-.45, Math.min(.45, p.vy * .05 - p.vx * .012)) - p.tilt) * .2;   // bank into the move
  p.fp = (p.fp || 0) + .2 + Math.max(0, -p.vy) * .06 + Math.abs(p.vx) * .02;           // wings beat faster when climbing
  if (p.vy < -3.5 && t - (p.lastFlap || 0) > 16) { p.lastFlap = t; sfx('flap'); }
}
function stepPlayers() {   // read keys / pads / remote steering and move every player
  const two = mode === 'local';   // keyboard: arrows = player 1, WASD = player 2 (in 1-player games both steer player 1)
  const kx = (l, r) => (keys[r] ? 1 : 0) - (keys[l] ? 1 : 0);
  steerDir(uni, kx('ArrowLeft', 'ArrowRight') + (two ? 0 : kx('a', 'd')), kx('ArrowUp', 'ArrowDown') + (two ? 0 : kx('w', 's')));
  if (two) steerDir(p2, kx('a', 'd'), kx('w', 's'));
  players.forEach((p, i) => { if (!(mode === 'host' && i === 1)) steerDir(p, padX[i], padDir[i]); });
  if (mode === 'host' && net.remoteTy != null) { p2.ty = net.remoteTy; if (net.remoteTx != null) p2.tx = net.remoteTx; }
  for (const p of players) movePlayer(p);
}
// ---- damage, shared by stars, bubbles, the beam, boomerang hearts, cupcakes and stomps ----
function hurtFoe(o, dmg) {   // returns true when the enemy is cheered up (defeated)
  if (o.dead) return false;
  o.hp -= dmg; o.hit = 6; sfx('pop'); boom(o.x, o.y, RAINBOW[(t + o.x | 0) % 6], 6);   // rainbow impact sparkles
  if (o.hp > 0) return false;
  addMeter(o.golden ? 20 : 6);
  const pts = o.golden ? 300 : FOE[o.kind].pts; o.dead = true; stat.foes++; score += pts; if (++kills % 12 === 0) bark(['vo_m_nice', 'vo_m_amazing', 'vo_m_go', 'vo_u_cheer1', 'vo_u_cheer2', 'vo_u_cheer3'][kills / 12 % 6 | 0], 1); pop(o.x, o.y - 20, '+' + pts, o.golden ? '#ffe45c' : '#fff');
  if (o.golden) { sfx('golden'); boom(o.x, o.y, '#ffe45c', 30); for (let d = 0; d < 4; d++) things.push({ kind: d === 0 ? 'heart' : 'ring', x: o.x + d * 26, y: o.y - 20 + (d % 2) * 40, y0: 0, ph: 0, vx: -2.5, r: 16 }); }
  boom(o.x, o.y, '#fff', 14); boom(o.x, o.y, '#ffd36b', 8); sfx('poof');
  const heart = o.kind === 'pig' && lives < maxLives() && Math.random() < .4;
  if (heart || Math.random() < .35) things.push({ kind: heart ? 'heart' : 'ring', x: o.x, y: o.y, y0: o.y, ph: 0, vx: -3, r: 16 });
  return true;
}
function hurtBoss(dmg, x, y) {
  if (!boss || clear) return;
  boss.hp -= dmg; boss.hit = 4; score += 5 * dmg; boom(x, y, '#ff00cc', 6); sfx('bossHit');
  if (boss.hp <= 0) {
    score += 200 + lives * 50; shake = 40; clear = 1; pop(boss.x, boss.y - 40, '+' + (200 + lives * 50), '#ffe45c');
    for (let i = 0; i < 6; i++) setTimeout(() => boom(boss ? boss.x + (Math.random() - .5) * 120 : 0, boss ? boss.y + (Math.random() - .5) * 60 : 0, '#ff00cc', 20), i * 150);
    sfx('win'); voice('vo_bossdown_' + (Math.random() * 4 | 0)); buzz([40, 40, 90]); saveShop();
    saveBest(); bolts = [];
  }
}

// ---- weapons: picked up for 10 seconds; the unicorn and the mermaid can both use them ----
const WEAPONS = { beam: 'Rainbow Beam', boom: 'Heart Boomerang', seek: 'Butterfly Seekers', lob: 'Cupcake Bombs' };
function muzzle(p) { return p === uni ? [p.x + (IMG.uni_up ? 55 : 46), p.y - (IMG.uni_up ? 64 : 74)] : [p.x + 30, p.y - 25]; }
function fire(p) {
  const star = p === uni, w = p.weapon, [x, y] = muzzle(p);
  if (w === 'beam') { if (t % 8 === 0) beamHit(p); if (t % 16 === 0) sfx('beam'); return; }
  if (w === 'seek') { if (t % 18 === 0) { for (const vy of [-3, 3]) shots.push({ x, y, vx: 6, vy, w: 'seek' }); sfx('fairy'); } return; }
  if (w === 'boom') { if (t % 30 === 0 && shots.filter(q => q.w === 'boom' && q.own === p.i).length < 2) { shots.push({ x, y, vx: 11, vy: 0, w: 'boom', age: 0, own: p.i }); sfx('boomerang'); } return; }
  if (w === 'lob') {   // aimed so it lands on the nearest enemy ahead (or arcs forward if there is none)
    if (t % 30 === 0) {
      let tg = null, bd = 1e9; for (const o of things) if (o.foe && !o.dead && o.x > x + 40 && o.x - x < bd) { bd = o.x - x; tg = o; }
      if (!tg && boss && !clear) tg = boss;
      const T = 46, tx = tg ? tg.x + tg.vx * T : x + 320, ty = tg ? tg.y : y + 120;
      shots.push({ x, y, vx: (tx - x) / T, vy: (ty - y - .5 * .35 * T * T) / T, w: 'lob' }); sfx('bubble');
    }
    return;
  }
  const gap = star ? (p.rapid > 0 ? 7 : 14) : (p.rapid > 0 ? 8 : 16);
  if (t % gap === (star ? 0 : 8 % gap)) {
    for (const vy of p.triple > 0 ? [-2.2, 0, 2.2] : [0]) shots.push({ x, y, vx: star ? 12 : 10, vy, m: star ? 0 : 1 });
    if (star) { boom(x, y, '#fff', 6); boom(x, y, RAINBOW[(t / gap | 0) % 6], 4); p.hornFx = 6; sfx('shot'); } else sfx('bubble');
  }
}
function moveShot(s) {
  if (!s.w && tour()) homeShot(s);   // reef ride: stars and bubbles find the grumpy fish by themselves
  if (s.w === 'seek') {   // turn toward the nearest enemy or boss
    let best = null, bd = 520;
    for (const o of things) if (o.foe && !o.dead) { const d = Math.hypot(o.x - s.x, o.y - s.y); if (d < bd && o.x > s.x - 40) { bd = d; best = o; } }
    if (!best && boss && !clear) best = boss;
    const sp = 9;
    if (best) { const a = Math.atan2(best.y - s.y, best.x - s.x), c = Math.atan2(s.vy, s.vx); let d = a - c; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; const n = c + Math.max(-.12, Math.min(.12, d)); s.vx = Math.cos(n) * sp; s.vy = Math.sin(n) * sp; }
  } else if (s.w === 'boom') {   // out, slow down, then back to whoever threw it
    s.age++;
    const owner = players.find(p => p.i === s.own) || uni;
    if (s.age < 46) { s.vx = 13 - s.age * .15; s.vy = Math.sin(s.age / 6) * 2; }
    else { const a = Math.atan2(owner.y - s.y, owner.x - s.x); s.vx = Math.cos(a) * 12; s.vy = Math.sin(a) * 12; if (Math.hypot(owner.x - s.x, owner.y - s.y) < 34 || s.age > 160) s.dead = true; }
  } else if (s.w === 'lob') s.vy += .35;
  s.x += s.vx; s.y += s.vy || 0;
}
function explode(s) {   // cupcake splash: hurts everything nearby
  if (s.dead) return; s.dead = true;
  boom(s.x, s.y, '#ff8fd0', 24); boom(s.x, s.y, '#fff3a0', 14); sfx('splat'); shake = Math.max(shake, 6);
  for (const o of things) if (o.foe && !o.dead && Math.hypot(o.x - s.x, o.y - s.y) < 95) hurtFoe(o, 3);
  if (boss && !clear && Math.hypot(boss.x - s.x, boss.y - s.y) < 120) hurtBoss(3, s.x, s.y);
}
function beamHit(p) {
  const [x, y] = muzzle(p);
  for (const o of things) if (o.foe && !o.dead && o.x > x && Math.abs(o.y - y) < o.r + 14) hurtFoe(o, 1);
  if (boss && !clear && boss.x > x && Math.abs(boss.y - y) < 64) hurtBoss(1, boss.x - 60, y);
}
// ---- stomp: fly down onto an enemy to squash it and bounce off ----
// ---- Sparkle Meter and Rainbow Nova: the meter fills from rings, defeats and stomps; when full, Z / Enter / Y / the meter button unleashes a screen-wide blast ----
let meter = 0, novaT = 0;
// ---- Golden Horseshoes: three hidden in every chapter; which ones you found is saved. 50 unlock the Rainbow look ----
let shoes = []; try { shoes = JSON.parse(localStorage.getItem('pinkUnicornShoes') || '[]'); } catch (e) {}
const shoeBits = m => (m & 1) + (m >> 1 & 1) + (m >> 2 & 1);
const shoeCount = () => shoes.reduce((a, m) => a + shoeBits(m || 0), 0);
const SHOE_AT = [.28, .55, .82];
function shoeSpot(c, k) { const r = ((c * 7 + k * 13) % 10) / 10; return k === 1 ? 70 + r * 50 : k === 2 ? H - 90 - r * 50 : 200 + r * 160; }   // one high, one low, one in the middle
function getShoe(o) {
  shoes[ch] = (shoes[ch] || 0) | (1 << o.k); saveOpt('pinkUnicornShoes', JSON.stringify(shoes));
  score += 100; sfx('shoe'); boom(o.x, o.y, '#ffd84a', 24); pop(o.x, o.y - 30, 'Golden horseshoe!', '#ffe45c');
  if (shoeBits(shoes[ch]) === 3) voice('vo_u_shoe3'); else bark('vo_u_shoe', 1);
  if (shoeCount() >= 50 && !owned.includes('rainbow')) { owned.push('rainbow'); saveShop(); setTimeout(() => voice('vo_u_rainbow'), 1600); pop(W / 2, 160, 'Rainbow look unlocked in the shop!', '#fff36b'); }
}
// ---- Little Pegasus: a rare pickup; a baby pegasus flies with you for 12 seconds and shoots sparkles ----
let pal = null;
function addMeter(n) { if (meter >= 100) return; meter = Math.min(100, meter + n); if (meter >= 100) { sfx('meter'); bark('vo_u_meter', 1); } }
function nova() {
  if (meter < 100 || state !== 'play' || paused || clear) return;
  if (mode === 'guest') { net.sendR('{"p":4}'); return; }
  novaT = 60; shake = 26; sfx('nova'); voice('vo_u_nova'); buzz([30, 30, 120]);
  setTimeout(() => bark('vo_m_nova', 1), 1700);
  for (const o of things) if (o.foe && !o.dead) hurtFoe(o, o.golden ? 6 : 99);
  for (const o of things) if (o.kind === 'cloud' || o.kind === 'bat' || o.kind === 'rock') { o.dead = true; boom(o.x, o.y, '#fff', 10); }
  bolts = []; hurtBoss(12, boss ? boss.x : 0, boss ? boss.y : 0);
  for (let i = 0; i < 40; i++) boom(uni.x + (Math.random() - .5) * 200, uni.y + (Math.random() - .5) * 160, RAINBOW[i % 6], 3);
  meter = 0;   // after the blast, so its own defeats don't refill it
}
// Catchphrases: skipped while someone is already talking, and only now and then (chance) so they stay special.
function bark(name, chance = .5) { if (typeof voiceUntil !== 'undefined' && Date.now() < voiceUntil + 1200) return; if (Math.random() > chance) return; voice(name); }
function stomp(p, o) {
  hurtFoe(o, o.golden ? 3 : 99);
  p.stompChain = t - (p.stompT || -999) < 100 ? (p.stompChain || 1) + 1 : 1; p.stompT = t; p.stompInv = 18; p.squash = 12;
  p.vy = -10; p.ty = p.y - 130;
  score += 20 * p.stompChain; pop(p.x, p.y - 70, p.stompChain > 1 ? 'Stomp x' + p.stompChain + '!' : 'Stomp!', '#fff36b');
  sfx('boing', p.stompChain); boom(p.x, p.y + 30, '#fff', 12); buzz(20); addMeter(8); bark('vo_u_stomp' + (1 + (p.stompChain - 1) % 3), .45);
}
function update() {
  t++;
  for (const p of players) { for (const k of ['flash', 'shield', 'rapid', 'triple', 'magnet', 'weaponT', 'stompInv', 'squash', 'hornFx']) if (p[k] > 0) p[k]--; if (p.weapon && !(p.weaponT > 0)) p.weapon = ''; }
  if (shake > 0) shake--;
  if (warn > 0) warn--;
  if (novaT > 0) novaT--;
  stepPlayers();
  if (tour()) { mer.x = uni.x - 8; mer.y = uni.y - 50; }   // reef ride: Mermaid sits on the unicorn's back
  else { mer.x += (Math.max(40, uni.x - 90) - mer.x) * .1; mer.y += (uni.y + 30 - mer.y) * .08; }

  // auto-fire: pony-dust stars (or a picked-up weapon) from the horn; a playable mermaid blows bubbles
  for (const p of players) fire(p);
  if (players.length === 1 && (boss || tour()) && ++mer.cd % (tour() ? 50 : 40) === 0) shots.push({ x: mer.x + 20, y: mer.y, vx: 10, vy: 0, m: 1 });

  if (!boss && !clear && t > segTime() * 60 && run && runSeg % 3 !== 2) nextRun();
  else if (!boss && !clear && t > segTime() * 60) {
    const bhp = Math.round(CHAPTERS[ch].hp * (players.length > 1 ? 1.6 : 1) * (easy ? .7 : 1));
    boss = { x: W + 100, y: H / 2, hp: bhp, max: bhp };
    things = []; warn = 120; bossIntro = 200; sfx('warn'); sfx('boss'); setTimeout(() => voice('vo_boss_' + ch), 700);
  }
  if (!boss && !clear && t % (run ? Math.max(14, CHAPTERS[ch].rate - runSeg) : CHAPTERS[ch].rate) === 0) spawn();
  stageTick(true);   // weather, wind and surprises (stages.js)
  if (!run && !boss && !clear) SHOE_AT.forEach((f, k) => {   // drop this chapter's horseshoes you haven't found yet
    if (t === Math.round(segTime() * 60 * f) && !((shoes[ch] || 0) >> k & 1)) {
      const y = shoeSpot(ch, k); things.push({ kind: 'shoe', k, x: W + 40, y, y0: y, ph: k, vx: -3, r: 20 });
      if (k === 2) things.push({ kind: 'cloud', x: W + 40, y: y - 72, vx: -3, r: 28 });   // the last one is guarded
    }
  });
  if (pal) {   // the little pegasus follows the unicorn and shoots seekers
    pal.t--; pal.x += (uni.x + 70 - pal.x) * .08; pal.y += (uni.y - 80 + Math.sin(t / 20) * 14 - pal.y) * .08;
    if (pal.t % 22 === 0) { shots.push({ x: pal.x + 24, y: pal.y, vx: 8, vy: 0, w: 'seek' }); sfx('fairy'); }
    if (pal.t <= 0) { boom(pal.x, pal.y, '#bfe6ff', 20); pal = null; }
  }

  for (const o of things) {
    o.x += o.vx;
    if (o.vy) { o.y += o.vy; if (o.y > H + 60) { o.dead = true; continue; } }
    if (o.foe) { if (tour()) tourFoe(o); moveFoe(o); if (o.hit > 0) o.hit--;
      for (const p of players) if (!o.dead && hit(o, p, o.r + 20)) { if (p.vy > 1.2 && p.y < o.y - o.r * .25) stomp(p, o); else { hurt(p); if (tour()) { o.dead = true; boom(o.x, o.y, '#bfefff', 12); } } }
      if (o.x < -60) o.dead = true; continue; }
    if (o.kind === 'bat') o.y = o.y0 + Math.sin(t / 15 + o.ph) * 70;
    const mg = players.find(p => p.magnet > 0 && Math.hypot(o.x - p.x, o.y - p.y) < 260);
    if (mg && (o.kind === 'ring' || o.kind === 'heart' || o.kind === 'star' || o.kind === 'shoe' || o.kind === 'friend' || o.kind.startsWith('w_'))) { o.x += (mg.x - o.x) * .1; o.y += (mg.y - o.y) * .1; }
    const pp = players.find(p => (o.kind === 'spike' ? Math.hypot(o.x - p.x, (o.top ? o.y + 40 : o.y - 40) - p.y) : Math.hypot(o.x - p.x, o.y - p.y)) < o.r + 22);
    if (pp) {
      if (o.kind === 'spike') { hurt(pp); continue; }
      o.dead = true;
      if (o.kind === 'ring') { combo++; score += 10 * Math.min(combo, 10); sfx('ring', combo); addMeter(2); if (combo === 5 || combo === 10) bark('vo_u_combo', 1); if (combo === 15 || combo === 20) bark('vo_u_cheer' + (1 + combo % 3), 1); boom(o.x, o.y, '#ffc400'); pop(o.x, o.y - 10, '+' + 10 * Math.min(combo, 10), '#ffe45c'); }
      else if (o.kind === 'heart') { lives = Math.min(maxLives(), lives + 1); sfx('heart'); bark('vo_u_heart', .7); boom(o.x, o.y, '#ff4d8d'); pop(o.x, o.y - 10, '+1 heart', '#ff8fc2'); }
      else if (POW.includes(o.kind)) { applyPower(pp, o.kind); boom(o.x, o.y, '#fff', 14); }
      else if (o.kind === 'shoe') getShoe(o);
      else if (o.kind === 'friend') { pal = { t: 720, x: pp.x, y: pp.y - 60 }; sfx('friend'); voice('vo_u_friend'); setTimeout(() => bark('vo_m_friend', 1), 2200); boom(o.x, o.y, '#bfe6ff', 20); }
      else if (o.kind.startsWith('w_')) { pp.weapon = o.kind.slice(2); pp.weaponT = 600; sfx('power'); bark(pp === uni ? 'vo_u_' + pp.weapon : 'vo_m_bubble', 1); pop(o.x, o.y - 30, WEAPONS[pp.weapon] + '!', '#fff36b'); boom(o.x, o.y, '#fff', 14); }
      else if (o.kind === 'star') { pp.shield = 360; score += 50; sfx('shield'); boom(o.x, o.y, '#fff', 20); }
      else hurt(pp);
    }
    if (o.x < -60) { o.dead = true; if (o.kind === 'ring') combo = 0; }
    if (o.dead && o.kind === 'ring' && pp) { stat.rings++; if (mode !== 'guest') { wallet++; if (wallet % 10 === 0) saveShop(); } }
  }
  things = things.filter(o => !o.dead);

  for (const s of shots) {
    moveShot(s);
    for (const o of things) {
      if (!o.foe || o.dead || !hit(s, o, o.r + (s.w === 'lob' ? 14 : 8))) continue;
      if (s.w === 'boom') { if ((o.boomT || 0) <= t) { o.boomT = t + 12; hurtFoe(o, 2); } continue; }   // hearts pass through
      if (s.w === 'lob') { explode(s); break; }
      s.dead = true; hurtFoe(o, !s.m && !s.w ? 2 : 1); break;   // pony-dust stars hit twice as hard
    }
    if (s.dead) continue;
    if (!s.w && !s.m && t % 2 === 0) sparks.push({ x: s.x, y: s.y + (Math.random() - .5) * 10, vx: -1 - Math.random(), vy: (Math.random() - .5) * 1.5, l: 18, col: `hsl(${(t * 15 + s.x) % 360},90%,75%)` });
    if (boss && !clear && hit(s, boss, 60)) {
      if (s.w === 'boom') { if ((boss.boomT || 0) <= t) { boss.boomT = t + 12; hurtBoss(2, s.x, s.y); } }
      else if (s.w === 'lob') explode(s);
      else { s.dead = true; hurtBoss(!s.m && !s.w ? 2 : 1, s.x, s.y); }
    }
    if (s.w === 'lob' && s.y > H - 26) explode(s);
    if (s.w !== 'boom' && (s.x > W + 20 || s.x < -40 || s.y < -60 || s.y > H + 20)) s.dead = true;
  }
  shots = shots.filter(s => !s.dead);

  if (boss && clear) { // boss spins away, then the curtain takes us to the next chapter
    boss.y += 2; boss.x += Math.sin(clear / 3) * 3; clear++;
    if (clear === 100) { boss = null; if (run) nextRun(); else showResults(); }
  } else if (boss) {
    if (boss.hit > 0) boss.hit--;
    for (const p of players) if (p.vy > 1.2 && Math.abs(p.x - boss.x) < 80 && p.y < boss.y - 30 && p.y > boss.y - 110) { hurtBoss(3, p.x, p.y + 30); p.vy = -11; p.ty = p.y - 150; p.squash = 12; p.stompInv = 18; sfx('boing', 3); pop(p.x, p.y - 70, 'Bonk!', '#fff36b'); }
    const ph = bossPhase();
    if (ph > (boss.ph || 0)) { boss.ph = ph; shake = 16; sfx('warn'); if (ph === 1) setTimeout(() => bark('vo_u_half', 1), 900); pop(boss.x, boss.y - 110, ph === 1 ? 'Grrr!' : 'SUPER grumpy!', '#ff6b8b'); }
    boss.x += (W - 170 + Math.sin(t / 55) * 70 * ph - boss.x) * .03;
    boss.y = H / 2 + Math.sin(t / (40 - ph * 8)) * (H / 2 - 100);
    bossFire();
  }
  for (const b of bolts) { b.x += b.vx; b.y += b.vy; const bp = players.find(p => hit(b, p, 28)); if (bp) { b.dead = true; hurt(bp); } if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) b.dead = true; }
  bolts = bolts.filter(b => !b.dead);
}

function showResults() {
  stat.stars = 1 + (stat.hits <= 1 ? 1 : 0) + (stat.rings >= Math.max(1, stat.ringsAll) * .7 ? 1 : 0);
  if (stat.stars > (starsBest[ch] || 0)) { starsBest[ch] = stat.stars; saveOpt('pinkUnicornStars', JSON.stringify(starsBest)); }
  state = 'results'; t = 0;
}
// ---- isometric bonus round after every third chapter: fly over the chapter's island diorama and grab the gems ----
let bonusDone = -1, bonusEnd = 0;
function startBonus() {
  bonusDone = ch; loadArt('isle_' + ch);
  go(() => {
    state = 'bonus'; t = 0; bonusEnd = 0; shots = []; bolts = []; boss = null; clear = 0; stageReset();
    things = [];
    for (let i = 0; i < 14; i++) {   // gems spread over the island's top in an isometric diamond
      const a = i / 14 * 6.283 + (i % 2) * .4, r = .35 + (i * 37 % 10) / 15;
      things.push({ kind: 'gem', x: W / 2 + Math.cos(a) * 250 * r, y: 300 + Math.sin(a) * 110 * r - (i % 3) * 30, y0: 0, ph: i, vx: 0, r: 18, col: RAINBOW[i % 6] });
    }
    for (const p of players) { p.x = p.tx = 140 + p.i * 60; p.y = p.ty = 300; p.vx = p.vy = 0; }
    sfx('start');
  }, 'Bonus · Sky Island');
}
function bonusUpdate() {
  t++; stepPlayers();
  for (const o of things) {
    if (o.kind !== 'gem' || o.dead) continue;
    const pp = players.find(p => Math.hypot(o.x - p.x, o.y - p.y) < 40);
    if (pp) { o.dead = true; score += 50; wallet++; sfx('ring', 10 - things.filter(q => !q.dead).length % 10); boom(o.x, o.y, o.col, 16); pop(o.x, o.y - 20, '+50', '#ffe45c'); }
  }
  things = things.filter(o => !o.dead);
  if (!bonusEnd && (t >= 20 * 60 || !things.length)) {
    bonusEnd = t; if (!things.length) { score += 500; pop(W / 2, 200, 'Perfect! +500', '#ffe45c'); sfx('win'); voice('vo_ev_wow'); } saveShop();
  }
  if (bonusEnd && t - bonusEnd > 100) nextChapter();
}
function drawBonus() {
  g.fillStyle = 'rgba(255,240,250,.18)'; g.fillRect(0, 0, W, H);
  const bob = Math.sin(t / 40) * 6;
  g.fillStyle = 'rgba(40,20,60,.2)'; g.beginPath(); g.ellipse(W / 2, 470, 270, 34, 0, 0, 7); g.fill();
  if (!spr('isle_' + ch, W / 2, 300 + bob, 400)) { g.fillStyle = CHAPTERS[ch].sky[0]; g.beginPath(); g.ellipse(W / 2, 320, 280, 130, 0, 0, 7); g.fill(); }
  // painter's order: things further up the screen are further away, so draw them first and smaller
  const list = [...things.map(o => ({ y: o.y, d: () => {
    const s = .75 + o.y / H * .5, gy = o.y + Math.sin(t / 10 + o.ph) * 5;
    g.fillStyle = 'rgba(40,20,60,.18)'; g.beginPath(); g.ellipse(o.x, o.y + 26 * s, 14 * s, 4 * s, 0, 0, 7); g.fill();
    g.save(); g.translate(o.x, gy); g.scale(s, s); g.rotate(Math.sin(t / 20 + o.ph) * .2);
    g.fillStyle = lg(0, -16, 0, 16, '#ffffff', o.col || RAINBOW[(o.ph | 0) % 6]); g.beginPath(); g.moveTo(0, -18); g.lineTo(13, -4); g.lineTo(0, 18); g.lineTo(-13, -4); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; g.stroke(); g.restore();
    if ((t + (o.ph | 0) * 7) % 40 < 8) sparkle(o.x + 8, gy - 12, 5, .9);
  } })), ...players.map(p => ({ y: p.y, d: () => {
    const s = .8 + p.y / H * .45; groundShadow(p.x, p.y, 40 * s);
    g.save(); g.translate(p.x, p.y); g.rotate(p.tilt || 0); g.scale(s, s); p === uni ? drawUnicorn(0, 0, false, p.fp) : drawMermaid(0, 0); g.restore();
  } }))];
  list.sort((a, b) => a.y - b.y).forEach(o => o.d());
  const left = Math.max(0, 20 - (bonusEnd || t) / 60);
  g.fillStyle = 'rgba(122,26,99,.4)'; g.beginPath(); g.arc(W - 40, H - 34, 20, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(W - 47, H - 43, 5, 18); g.fillRect(W - 38, H - 43, 5, 18);
  panel(W / 2 - 150, 14, 300, 40, 20, 'rgba(122,26,99,.55)'); txt(`Sky Island bonus · ${Math.ceil(left)}s · ${things.length} gems`, W / 2, 40, 17, '#fff');
  for (const p of sparks) { g.globalAlpha = Math.max(0, p.l / 30); g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, 2.6, 0, 7); g.fill(); } g.globalAlpha = 1;
  for (const q of pops) { g.globalAlpha = Math.min(1, q.l / 20); txt(q.str, q.x, q.y, 22, q.col); } g.globalAlpha = 1;
  if (paused) drawSettings('Paused');
}
function nextChapter() {
  if (!run && (ch + 1) % 3 === 0 && bonusDone !== ch && ch < NCH - 1 && state === 'results') { startBonus(); return; }
  ch + 1 >= CHAPTERS.length ? (run ? startEnding() : startWalk()) : start(ch + 1);   // the Castle Garden walk (stages.js) leads into the ending
}
function startEnding() { go(() => { for (let i = 0; i < NCH; i++) loadArt('happy_' + i); state = 'ending'; ending = 0; things = []; shots = []; bolts = []; boss = null; sparks = []; saveBest(); }, 'The sky is safe again...'); }

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
// ---- characters: shaded shapes with soft outlines (all art is drawn in code) ----
const RAINBOW = ['#ff6fa8', '#ffa94d', '#ffe45c', '#79e08a', '#5cc8ff', '#b18cff'];
function lg(x0, y0, x1, y1, a, b) { const q = g.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, a); q.addColorStop(1, b); return q; }
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function glowRing(r) { g.fillStyle = `rgba(255,255,255,${.22 + .1 * Math.sin(t / 4)})`; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.strokeStyle = `rgba(255,243,140,${.5 + .3 * Math.sin(t / 4)})`; g.lineWidth = 3; g.stroke(); }
function sparkle(x, y, s, a) { g.globalAlpha = a; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s); g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s); g.fill(); g.globalAlpha = 1; }

function drawUnicorn(x, y, glow, phase) {
  g.save(); g.translate(x, y + Math.sin(t / 10) * 2);
  if (glow) glowRing(66);
  const OL = '#b5468f', fl = Math.sin(phase == null ? t / 5 : phase);
  if (IMG.uni_up && IMG.uni_down) {   // generated sprite: two wing frames + a little squash on each beat
    const sk = mode === 'guest' ? hostSkin : skin, fr = fl > 0 ? 'up' : 'down';
    g.scale(1, 1 + fl * .025); if (!(sk && spr('skin_' + sk + '_' + fr, 0, -6, 112))) spr(fl > 0 ? 'uni_up' : 'uni_down', 0, -6, 112);
    sparkle(48, -57, 5 + 2 * Math.sin(t / 5), .9); g.restore(); return;
  }
  g.lineJoin = g.lineCap = 'round';
  // flowing rainbow tail
  RAINBOW.forEach((c, i) => {
    const yy = -8 + i * 3.2, w = Math.sin(t / 6 + i * .5);
    g.strokeStyle = c; g.lineWidth = 5.5; g.beginPath(); g.moveTo(-34, yy);
    g.bezierCurveTo(-50, yy - 8 + w * 5, -60, yy + 12 + w * 8, -76, yy + 4 + Math.sin(t / 5 + i * .7) * 10); g.stroke();
  });
  const leg = (px, py, ph, col) => {
    g.save(); g.translate(px, py); g.rotate(.45 + Math.sin(t / 7 + ph) * .3);
    g.fillStyle = col; rr(-4.5, -2, 9, 20, 4.5); g.fill(); g.strokeStyle = OL; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#c9a3ff'; rr(-4.5, 13, 9, 7, 3); g.fill(); g.restore();
  };
  leg(-24, 10, 0, '#f7a8d6'); leg(8, 12, 1.5, '#f7a8d6');            // far legs
  const wing = (col, edge, a) => {                                      // a fan of pointed feathers
    g.save(); g.translate(-6, -14); g.rotate(a);
    [[42, -2.1], [37, -2.45], [30, -2.8], [22, -3.12]].forEach(([len, ang]) => {
      g.save(); g.rotate(ang); g.fillStyle = col; g.beginPath(); g.moveTo(0, 0);
      g.quadraticCurveTo(len * .45, -13, len, 0); g.quadraticCurveTo(len * .45, 11, 0, 0); g.fill();
      g.strokeStyle = edge; g.lineWidth = 1.8; g.stroke(); g.restore();
    });
    g.restore();
  };
  wing('#e6deff', '#bfaef0', .15 + fl * .35);                          // far wing
  g.fillStyle = lg(0, -20, 0, 22, '#ffe0f2', '#ff9fd0'); g.beginPath(); g.ellipse(-6, 2, 33, 19, 0, 0, 7); g.fill();
  g.strokeStyle = OL; g.lineWidth = 2.5; g.stroke();                    // body
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-10, -8, 18, 5, -.1, 0, 7); g.fill();   // body shine
  g.fillStyle = lg(0, -40, 0, 0, '#ffe0f2', '#ffb6dc');                 // neck
  g.beginPath(); g.moveTo(6, -10); g.quadraticCurveTo(12, -30, 22, -36); g.lineTo(34, -18); g.quadraticCurveTo(26, -6, 22, 4); g.closePath(); g.fill();
  // mane: bouncy pastel curls down the neck
  for (let i = 0; i < 6; i++) {
    const p = i / 5, mx = 17 - p * 15 - 4 + Math.sin(t / 8 + i) * 1.5, my = -42 + p * 28;
    g.fillStyle = RAINBOW[i]; g.beginPath(); g.ellipse(mx, my, 7.5 - p * 2, 6 - p, .5, 0, 7); g.fill();
  }
  // head
  g.fillStyle = lg(0, -50, 0, -6, '#ffe8f5', '#ffb6dc');
  g.beginPath(); g.ellipse(27, -26, 17, 15, -.15, 0, 7); g.fill(); g.strokeStyle = OL; g.lineWidth = 2.5; g.stroke();
  g.fillStyle = '#fff0f8'; g.beginPath(); g.ellipse(40, -19, 10, 8.5, -.1, 0, 7); g.fill(); g.stroke();   // muzzle
  g.fillStyle = OL; g.beginPath(); g.arc(44, -21, 1.6, 0, 7); g.fill();
  g.strokeStyle = OL; g.lineWidth = 1.8; g.beginPath(); g.arc(39, -16, 4, .3, 1.6); g.stroke();             // smile
  g.fillStyle = 'rgba(255,110,170,.45)'; g.beginPath(); g.ellipse(26, -18, 5, 3.5, 0, 0, 7); g.fill();     // blush
  if (t % 230 < 7) { g.strokeStyle = '#4a2266'; g.lineWidth = 2.5; g.beginPath(); g.arc(29, -27, 5, .2, Math.PI - .2); g.stroke(); }
  else {                                                                // big sparkly eye
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(29, -28, 6.5, 7.8, 0, 0, 7); g.fill();
    g.fillStyle = lg(0, -34, 0, -22, '#7b3fb8', '#3a1a66'); g.beginPath(); g.ellipse(30.5, -27, 4.8, 6.4, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(32, -30, 2, 0, 7); g.arc(29, -24.5, 1, 0, 7); g.fill();
    g.strokeStyle = '#4a2266'; g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(34, -34); g.lineTo(37, -37); g.moveTo(31, -36); g.lineTo(33, -39.5); g.stroke();   // lashes
  }
  g.fillStyle = '#ffb6dc'; g.beginPath(); g.moveTo(15, -36); g.lineTo(17, -50); g.lineTo(24, -38); g.fill(); g.strokeStyle = OL; g.lineWidth = 2; g.stroke();   // ear
  g.fillStyle = '#ff8cc6'; g.beginPath(); g.moveTo(17.5, -38); g.lineTo(18.5, -46); g.lineTo(22, -38.5); g.fill();
  // golden spiral horn
  g.fillStyle = lg(28, -64, 34, -38, '#fff7c2', '#ffbe3d'); g.beginPath(); g.moveTo(25, -39); g.lineTo(38, -66); g.lineTo(34, -37); g.closePath(); g.fill();
  g.strokeStyle = '#d99a1e'; g.lineWidth = 1.6; g.stroke();
  for (let i = 1; i < 4; i++) { const k = i / 4; g.beginPath(); g.moveTo(25 + 13 * k + 1, -39 - 27 * k); g.lineTo(34 + 4 * k - 1, -37 - 29 * k + 3); g.stroke(); }
  sparkle(38, -66, 6 + 2 * Math.sin(t / 5), .9);
  // forelock curl on the forehead
  g.fillStyle = RAINBOW[0]; g.beginPath(); g.arc(22, -40, 6, 0, 7); g.fill(); g.fillStyle = RAINBOW[5]; g.beginPath(); g.arc(17, -36, 5, 0, 7); g.fill();
  leg(-16, 12, 3, '#ffc4e4'); leg(16, 12, 4.5, '#ffc4e4');             // near legs
  wing('#ffffff', '#c7b6f4', fl * .4);                            // near wing
  g.restore();
}

function drawMermaid(x, y, glow) {
  g.save(); g.translate(x, y + Math.sin(t / 9 + 1) * 2);
  if (glow) glowRing(50);
  if (IMG.mermaid) { g.rotate(Math.sin(t / 14) * .08); spr('mermaid', 0, 0, 96); g.restore(); return; }
  g.scale(1.2, 1.2); g.lineJoin = g.lineCap = 'round';
  const sw = Math.sin(t / 7);
  // long flowing hair behind
  g.fillStyle = lg(0, -30, 0, 20, '#ff8ccf', '#e0479a');
  g.beginPath(); g.moveTo(8, -26); g.bezierCurveTo(-14, -34, -24, -10, -20 + sw * 3, 8); g.bezierCurveTo(-26, 16, -14, 18, -10 + sw * 2, 10); g.bezierCurveTo(-8, 0, -4, -6, 2, -6); g.closePath(); g.fill();
  // tail with scales and a swishing fin
  g.save(); g.translate(0, 6); g.rotate(sw * .12);
  g.fillStyle = lg(0, 0, 0, 34, '#5ff0d4', '#14a6a0');
  g.beginPath(); g.moveTo(-8, 0); g.bezierCurveTo(-10, 16, -6, 26, -16, 34); g.lineTo(-6, 34); g.bezierCurveTo(4, 24, 9, 12, 8, 0); g.closePath(); g.fill();
  g.strokeStyle = '#1d7f7a'; g.lineWidth = 1.8; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1.2;
  for (let r = 0; r < 4; r++) for (let c = -1; c <= 0; c++) { g.beginPath(); g.arc(c * 6 + 2 - r * 1.5, 6 + r * 6, 3, 0, Math.PI); g.stroke(); }
  g.save(); g.translate(-11, 34); g.rotate(sw * .35);
  g.fillStyle = lg(0, 0, 0, 12, '#8ff7e6', '#35c9bd');
  g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-14, 2, -18, 12, -12, 14); g.quadraticCurveTo(-6, 8, 0, 4); g.quadraticCurveTo(6, 8, 12, 14); g.bezierCurveTo(18, 12, 14, 2, 0, 0); g.fill();
  g.strokeStyle = '#1d7f7a'; g.lineWidth = 1.6; g.stroke(); g.restore();
  g.restore();
  // body, shell top and an arm holding a bubble wand
  g.fillStyle = '#ffdcc8'; rr(-6, -8, 13, 16, 6); g.fill(); g.strokeStyle = '#c98a78'; g.lineWidth = 1.4; g.stroke();
  g.fillStyle = '#c9a3ff'; g.beginPath(); g.arc(-2, -1, 3.6, Math.PI, 0); g.arc(5, -1, 3.6, Math.PI, 0); g.fill();
  g.strokeStyle = '#ffdcc8'; g.lineWidth = 4; g.beginPath(); g.moveTo(5, -4); g.quadraticCurveTo(13, -2, 16, -10); g.stroke();
  g.strokeStyle = '#ffd36b'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(16, -10); g.lineTo(20, -18); g.stroke();
  g.strokeStyle = 'rgba(160,240,255,.9)'; g.beginPath(); g.arc(22, -22, 4.5, 0, 7); g.stroke();
  // head
  g.fillStyle = lg(0, -30, 0, -8, '#ffe9dc', '#ffcfb8'); g.beginPath(); g.arc(3, -17, 10.5, 0, 7); g.fill(); g.strokeStyle = '#c98a78'; g.lineWidth = 1.4; g.stroke();
  g.fillStyle = 'rgba(255,120,150,.45)'; g.beginPath(); g.ellipse(9, -13, 3, 2, 0, 0, 7); g.fill();
  if ((t + 90) % 260 < 7) { g.strokeStyle = '#155e63'; g.lineWidth = 1.8; g.beginPath(); g.arc(7, -18, 3, .2, Math.PI - .2); g.stroke(); }
  else { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(7, -18.5, 3.6, 4.4, 0, 0, 7); g.fill(); g.fillStyle = lg(0, -22, 0, -15, '#2fc6c0', '#0f5f6b'); g.beginPath(); g.ellipse(8, -18, 2.6, 3.6, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(9, -19.6, 1.1, 0, 7); g.fill(); }
  g.strokeStyle = '#a0524a'; g.lineWidth = 1.3; g.beginPath(); g.arc(10, -12.5, 2.2, .3, 2); g.stroke();
  // bangs and a starfish clip
  g.fillStyle = '#ff8ccf'; g.beginPath(); g.moveTo(-7, -18); g.bezierCurveTo(-8, -32, 12, -34, 14, -22); g.quadraticCurveTo(8, -26, 4, -22); g.quadraticCurveTo(0, -27, -3, -20); g.closePath(); g.fill();
  star(-2, -27, 5, t / 40, '#ffd36b');
  g.restore();
}

function drawBoss(b) {
  g.save(); g.translate(b.x, b.y);
  if (clear) g.rotate(clear / 12);
  const cc = CHAPTERS[ch], hull = cc.hull || HULLS[ch], hp = Math.max(0, b.hp) / b.max;
  if (IMG['boss_' + ch]) {
    g.save(); g.rotate(Math.sin(t / 20) * .05); spr('boss_' + ch, 0, -8, 180); if (b.hit > 0) flashSpr('boss_' + ch, 0, -8, 180, .45); g.restore();
    g.lineWidth = 7; g.strokeStyle = 'rgba(60,20,70,.35)'; g.beginPath(); g.arc(0, 0, 104, 0, 7); g.stroke();
    g.strokeStyle = `hsl(${hp * 120},85%,58%)`; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, 104, -Math.PI / 2, -Math.PI / 2 + 6.283 * hp); g.stroke();
    g.restore(); return;
  }
  g.lineJoin = g.lineCap = 'round';
  g.fillStyle = 'rgba(255,240,170,.12)'; g.beginPath(); g.moveTo(-40, 24); g.lineTo(40, 24); g.lineTo(70, 140); g.lineTo(-70, 140); g.fill();   // tractor beam
  // dome + grumpy cloud pilot
  g.fillStyle = 'rgba(190,240,255,.55)'; g.beginPath(); g.ellipse(0, -6, 38, 34, 0, Math.PI, 0); g.fill();
  const pc = cc.crown ? '#ffc4e8' : '#8d90a8';
  g.fillStyle = pc; [[-10, -16, 11], [8, -18, 12], [0, -26, 11], [-16, -8, 8], [16, -8, 8]].forEach(([px, py, r]) => { g.beginPath(); g.arc(px, py, r, 0, 7); g.fill(); });
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-7, -14, 4.5, 5, 0, 0, 7); g.ellipse(7, -14, 4.5, 5, 0, 0, 7); g.fill();
  g.fillStyle = '#2b2440'; g.beginPath(); g.arc(-6, -13, 2.4, 0, 7); g.arc(6, -13, 2.4, 0, 7); g.fill();
  g.strokeStyle = '#2b2440'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(-13, -22); g.lineTo(-3, -19); g.moveTo(13, -22); g.lineTo(3, -19); g.stroke();
  g.beginPath(); g.arc(0, -3, 4, Math.PI * 1.15, Math.PI * 1.85); g.stroke();                                         // pout
  if (cc.crown) { g.fillStyle = lg(0, -60, 0, -40, '#fff3a0', '#ffb83d'); g.beginPath(); g.moveTo(-16, -38); g.lineTo(-18, -54); g.lineTo(-8, -46); g.lineTo(0, -60); g.lineTo(8, -46); g.lineTo(18, -54); g.lineTo(16, -38); g.closePath(); g.fill(); g.strokeStyle = '#c98a1e'; g.lineWidth = 1.8; g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-16, -26, 7, 12, -.6, 0, 7); g.fill();               // glass shine
  g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(0, -6, 38, 34, 0, Math.PI, 0); g.stroke();
  // hull with rim band and blinking lights
  g.fillStyle = lg(0, -6, 0, 30, '#ffffff', hull); g.beginPath(); g.ellipse(0, 8, 86, 24, 0, 0, 7); g.fill();
  g.fillStyle = hull; g.beginPath(); g.ellipse(0, 14, 86, 18, 0, 0, Math.PI); g.fill();
  g.strokeStyle = 'rgba(40,20,60,.55)'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(0, 8, 86, 24, 0, 0, 7); g.stroke();
  for (let i = -3; i <= 3; i++) { const on = Math.floor(t / 8 + i) % 2 === 0; g.fillStyle = on ? '#fff36b' : '#ffffff'; g.beginPath(); g.arc(i * 23, 14 + Math.abs(i) * -1.2, 4.5, 0, 7); g.fill(); if (on) { g.fillStyle = 'rgba(255,243,107,.35)'; g.beginPath(); g.arc(i * 23, 14, 9, 0, 7); g.fill(); } }
  if (b.hit > 0) { g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(0, 8, 86, 24, 0, 0, 7); g.fill(); }
  // health ring: soft backing, colour goes green > yellow > red
  g.lineWidth = 7; g.strokeStyle = 'rgba(60,20,70,.35)'; g.beginPath(); g.arc(0, 0, 100, 0, 7); g.stroke();
  g.strokeStyle = `hsl(${hp * 120},85%,58%)`; g.beginPath(); g.arc(0, 0, 100, -Math.PI / 2, -Math.PI / 2 + 6.283 * hp); g.stroke();
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
// Soft shadow on the ground under something flying at height y: smaller and fainter the higher it is (cheap 3D depth).
function groundShadow(x, y, w) {
  if (ch === 16 || state === 'title') return;   // no ground in space
  const gy = H - 24, k = Math.max(.25, 1 - (gy - y) / H * .9);
  g.fillStyle = `rgba(40,20,60,${.22 * k})`; g.beginPath(); g.ellipse(x, gy, w * k, w * .2 * k, 0, 0, 7); g.fill();
}
// Mirrored copies are prebuilt once per image, so scrolling costs one or two plain draws per frame.
function mirrorCanvas(im) {
  if (im._mir !== undefined) return im._mir;
  im._mir = null;
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
  const c = document.createElement('canvas'); if (!c || !c.getContext) return null;
  c.width = im.width * 2; c.height = im.height; const x = c.getContext('2d');
  x.drawImage(im, 0, 0); x.translate(im.width * 2, 0); x.scale(-1, 1); x.drawImage(im, 0, 0);
  return (im._mir = c);
}
function mirrorScroll(im, sp, y, h) {
  const mc = mirrorCanvas(im);
  if (mc) { const w2 = h * mc.width / mc.height, off = -((t * sp) % w2); for (let x = off; x < W; x += w2) g.drawImage(mc, x, y, w2 + .5, h); return; }
  const w = h * im.width / im.height, off = -((t * sp) % (w * 2));
  for (let x = off, k = 0; x < W; x += w, k++) {
    if (k % 2) { g.save(); g.translate(x + w, y); g.scale(-1, 1); g.drawImage(im, 0, 0, w + .5, h); g.restore(); }
    else g.drawImage(im, x, y, w + .5, h);
  }
}
function bgFx(i) {   // light particles over the painted backgrounds
  if (!fx) return;
  if (i === 2 || i === 3 || i === 10 || i === 13 || i === 16 || i === 19) twinkles(i === 16 ? 60 : 30, .05, i === 16 ? H : H * .5);
  if (i === 15 || i === 23) for (let k = 0; k < 24; k++) { g.globalAlpha = .75; g.fillStyle = k % 3 ? '#ffb36b' : '#ff6fd0'; g.beginPath(); g.arc(sx(k, .8, 40) + Math.sin(t / 25 + k) * 10, H - ((k * 53 + t * (1 + k % 3 * .5)) % H), 2 + k % 2, 0, 7); g.fill(); g.globalAlpha = 1; }   // rising glitter embers
  if (i === 13 && t % 70 === 0) boom(150 + (t * 37) % (W - 300), 60 + (t * 13) % 140, RAINBOW[(t / 70 | 0) % 6], 24);   // carnival fireworks
  if (i === 12) { g.fillStyle = 'rgba(255,255,255,.55)'; for (let k = 0; k < 30; k++) { g.beginPath(); g.arc(sx(k, 1.4, 34), H - ((k * 71 + t * (2 + k % 3)) % 260), 1.5 + k % 3, 0, 7); g.fill(); } }   // waterfall spray
  if (i === 3 || i === 21) { g.fillStyle = '#fff'; g.globalAlpha = .75; for (let k = 0; k < 40; k++) { g.beginPath(); g.arc(sx(k, 1.2, 24) + Math.sin(t / 30 + k) * 10, (k * 61 + t * (1 + k % 3 * .4)) % H, 1.5 + k % 3, 0, 7); g.fill(); } g.globalAlpha = 1; }
  if (i === 1 || i === 5) for (let k = 0; k < 14; k++) { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5; g.beginPath(); g.arc(sx(k, .6, 70) + Math.sin(t / 20 + k) * 6, ((k * 83 - t * (1 + k % 3)) % H + H) % H, i === 5 ? 1.5 + k % 3 * .8 : 3 + k % 4 * 2, 0, 7); g.stroke(); }   // reef bubbles stay tiny so they never look like rings
  if (i === 6 || i === 8 || i === 10 || i === 24) fireflies(22, i === 6 ? '#b8fff2' : '#fff7a0');
  if (i === 7) { g.strokeStyle = 'rgba(180,190,230,.35)'; g.lineWidth = 1.5; g.beginPath(); for (let k = 0; k < 60; k++) { const x = (k * 53 + t * 9) % (W + 100) - 50, y = (k * 97 + t * 14) % (H + 40) - 20; g.moveTo(x, y); g.lineTo(x - 6, y + 16); } g.stroke(); if (t % 240 < 8) { g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(0, 0, W, H); } }
  if (i === 9 || i === 22) { const cols = ['#ff5fa8', '#ffb347', '#7ee8e0', '#b48cff']; for (let k = 0; k < 30; k++) { g.fillStyle = cols[k % 4]; g.fillRect(sx(k, .5, 32), (k * 47 + t * (1 + k % 3)) % H, 7, 3); } }
  if (i === 11 || i === 20) for (let k = 0; k < 26; k++) { const x = sx(k, .9, 40) + Math.sin(t / 30 + k) * 20, y = (k * 67 + t * (1 + k % 3 * .5)) % (H + 20) - 10; g.save(); g.translate(x, y); g.rotate(t / 30 + k); g.fillStyle = k % 3 ? '#ffc2dc' : '#fff0f6'; g.beginPath(); g.ellipse(0, 0, 5, 3, 0, 0, 7); g.fill(); g.restore(); }   // blossom petals
  if (i === 17) for (let k = 0; k < 22; k++) { const x = sx(k, 1, 44) + Math.sin(t / 25 + k) * 24, y = (k * 71 + t * (1 + k % 3 * .4)) % (H + 20) - 10; g.save(); g.translate(x, y); g.rotate(t / 20 + k); g.fillStyle = ['#e8743b', '#ffb347', '#c94f2d'][k % 3]; g.beginPath(); g.ellipse(0, 0, 7, 4, 0, 0, 7); g.fill(); g.restore(); }   // falling leaves
  if (i === 26 || i === 0) for (let k = 0; k < 16; k++) { g.globalAlpha = .7; g.fillStyle = k % 2 ? '#ff8fc2' : '#fff'; g.beginPath(); g.arc(sx(k, .6, 60) + Math.sin(t / 50 + k) * 12, H - ((k * 61 + t * (.8 + k % 3 * .4)) % H), 2.5, 0, 7); g.fill(); g.globalAlpha = 1; }
  if (i === 4 || i === 14 || i === 25) for (let k = 0; k < 18; k++) { g.globalAlpha = .5; g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(sx(k, 1.5, 50), H - 30 - (k * 37) % 200 + Math.sin(t / 20 + k) * 6, 2, 0, 7); g.fill(); g.globalAlpha = 1; }
}
function drawBg(i) {
  const c = CHAPTERS[i];
  if (!skyCache[i]) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, c.sky[0]); gr.addColorStop(1, c.sky[1]); skyCache[i] = gr; }
  g.fillStyle = skyCache[i]; g.fillRect(0, 0, W, H);
  if (IMG['bg_' + i]) {   // painted background, mirrored so it scrolls forever without a seam, plus a faster foreground layer
    mirrorScroll(IMG['bg_' + i], .35, 0, H);
    g.globalAlpha = .14; g.fillStyle = skyCache[i]; g.fillRect(0, 0, W, H); g.globalAlpha = 1;   // soft haze so the characters stand out
    if (IMG['fg_' + i]) { const im = IMG['fg_' + i], fh = Math.min(150, W * im.height / im.width); mirrorScroll(im, 1.6, H - fh, fh); }
    bgFx(i); return;
  }
  [candyClouds, mermaidBay, starryNight, auroraPeaks, rainbowCanyon, coralReef, crystalCaves, stormFortress, forest, candyland, lake, candyClouds, mermaidBay, starryNight, candyClouds, rainbowCanyon, starryNight, forest, candyClouds, starryNight, candyland, auroraPeaks, candyland, starryNight, forest, rainbowCanyon, castle][i]();
}
// ---- scenery for chapters 1-8 (each a stack of parallax layers, slowest first) ----
function cloud(x, y, s, a, shade) { g.globalAlpha = a; blob(x, y + 5 * s, s, shade || '#f3d3ee'); blob(x, y, s, '#ffffff'); g.globalAlpha = 1; }
function sunGlow(x, y, r, col) {
  const q = g.createRadialGradient(x, y, r * .2, x, y, r * 2.6); q.addColorStop(0, col); q.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = q; g.fillRect(x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);
}
function twinkles(n, sp, maxY) {
  for (let k = 0; k < n; k++) { const a = .4 + .6 * Math.abs(Math.sin(t / 25 + k * 1.7)), x = sx(k, sp, (W + 200) / n), y = (k * 97) % maxY;
    if (k % 7 === 0) sparkle(x, y, 3 + a * 2, a); else { g.globalAlpha = a; g.fillStyle = '#fff'; g.fillRect(x, y, 2, 2); } }
  g.globalAlpha = 1;
}
function pine(x, base, h, col, snow) {
  g.fillStyle = col; g.beginPath();
  for (let i = 0; i < 3; i++) { const y = base - h * (.25 + i * .25), w = h * (.32 - i * .07); g.moveTo(x - w, y + h * .22); g.lineTo(x, y - h * .2); g.lineTo(x + w, y + h * .22); }
  g.fill(); g.fillRect(x - h * .04, base - h * .1, h * .08, h * .1);
  if (snow) { g.fillStyle = snow; for (let i = 0; i < 3; i++) { const y = base - h * (.25 + i * .25); g.beginPath(); g.moveTo(x - h * .08, y - h * .1); g.lineTo(x, y - h * .2); g.lineTo(x + h * .08, y - h * .1); g.fill(); } }
}
function candyClouds() {
  sunGlow(800, 80, 60, 'rgba(255,250,220,.9)');
  g.save(); g.translate(800, 80); g.rotate(t / 600); g.fillStyle = 'rgba(255,255,255,.18)';
  for (let k = 0; k < 10; k++) { g.rotate(.628); g.beginPath(); g.moveTo(0, 0); g.lineTo(600, -40); g.lineTo(600, 40); g.fill(); } g.restore();
  g.lineWidth = 10; g.globalAlpha = .25; RAINBOW.forEach((c, i) => { g.strokeStyle = c; g.beginPath(); g.arc(250, H + 120, 420 - i * 10, Math.PI, 0); g.stroke(); }); g.globalAlpha = 1;
  for (let k = 0; k < reps(320); k++) cloud(sx(k, .2, 320), 80 + (k * 53) % 120, 1.6, .55);
  hills('#f9c6e6', H - 110, 36, .35, 170);
  for (let k = 0; k < reps(150); k++) { const x = sx(k, .55, 150) + 30, y = H - 118 - 18 * Math.sin((x + t * .35) / 170); g.fillStyle = '#e88ac4'; g.fillRect(x - 2, y, 4, 22); g.fillStyle = k % 2 ? '#fff0fa' : '#ffd6f0'; g.beginPath(); g.arc(x, y, 14, 0, 7); g.arc(x - 9, y + 6, 9, 0, 7); g.arc(x + 9, y + 6, 9, 0, 7); g.fill(); }
  hills('#ef9fd1', H - 60, 30, .6, 120);
  for (let k = 0; k < reps(90); k++) { const x = sx(k, .6, 90); g.fillStyle = ['#fff', '#ffe45c', '#ffb3e1'][k % 3]; g.beginPath(); g.arc(x, H - 48 - 20 * Math.sin((x + t * .6) / 120) - 6, 4, 0, 7); g.fill(); }
  hills('#e17ec0', H - 22, 22, 1, 90);
  if (fx) for (let k = 0; k < reps(260); k++) cloud(sx(k, 2.2, 260), H - 6 + (k % 2) * 8, 1.3, .9);
}
function mermaidBay() {
  sunGlow(720, 110, 50, 'rgba(255,255,230,.9)');
  g.fillStyle = '#fffbe0'; g.beginPath(); g.arc(720, 110, 34, 0, 7); g.fill();
  for (let k = 0; k < reps(300); k++) cloud(sx(k, .25, 300), 60 + (k * 41) % 90, 1.3, .8, '#d8eefc');
  const sea = H * .55;
  g.fillStyle = '#8fd3e8'; g.beginPath(); g.moveTo(0, sea); for (let x = 0; x <= W; x += 30) g.lineTo(x, sea - 8 - 6 * Math.abs(Math.sin((x + t * .15) / 70))); g.lineTo(W, sea + 10); g.lineTo(0, sea + 10); g.fill();   // distant isles
  const lx = ((620 - t * .15) % (W + 300) + W + 300) % (W + 300) - 100;   // lighthouse drifting by
  g.fillStyle = '#fff'; g.fillRect(lx, sea - 70, 18, 70); g.fillStyle = '#ff6fa8'; for (let i = 0; i < 3; i++) g.fillRect(lx, sea - 62 + i * 22, 18, 8);
  g.fillStyle = '#ffe45c'; g.fillRect(lx + 3, sea - 82, 12, 12); g.fillStyle = '#c94f9c'; g.beginPath(); g.moveTo(lx - 2, sea - 82); g.lineTo(lx + 9, sea - 94); g.lineTo(lx + 20, sea - 82); g.fill();
  const bands = [['#5bc0e8', .5, 14], ['#3aa6db', .9, 18], ['#2a8fcc', 1.5, 22], ['#1f78b8', 2.3, 26]];
  bands.forEach(([col, sp, amp], b) => {
    const y0 = sea + 10 + b * 45; g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W + 20; x += 20) g.lineTo(x, y0 + amp * .5 * Math.sin((x + t * sp) / (60 + b * 10)));
    g.lineTo(W, H); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2.5; g.beginPath();
    for (let x = 0; x <= W + 20; x += 20) { const y = y0 + amp * .5 * Math.sin((x + t * sp) / (60 + b * 10)); if (Math.sin((x + t * sp) / (60 + b * 10)) < -.6) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
  });
  for (let k = 0; k < 18; k++) if ((t + k * 37) % 90 < 30) sparkle(sx(k, 1, 70), sea + 20 + (k * 53) % (H - sea - 30), 4, .8);
  for (let k = 0; k < reps(380); k++) {   // rocks with shells near the shore
    const x = sx(k, 2.6, 380); g.fillStyle = '#8a6f9e'; g.beginPath(); g.ellipse(x, H - 6, 46, 26, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#a58cb8'; g.beginPath(); g.ellipse(x - 10, H - 18, 20, 9, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#ffc4dc'; g.beginPath(); g.arc(x + 14, H - 24, 7, Math.PI, 0); g.fill();
  }
}
function starryNight() {
  g.fillStyle = 'rgba(190,150,255,.12)'; g.beginPath(); g.moveTo(0, 260); g.quadraticCurveTo(480, 40, W, 120); g.lineTo(W, 200); g.quadraticCurveTo(480, 120, 0, 340); g.fill();   // milky way
  twinkles(70, .08, H * .7);
  sunGlow(780, 100, 46, 'rgba(255,246,200,.35)');
  g.fillStyle = '#fff6c9'; g.beginPath(); g.arc(780, 100, 42, 0, 7); g.fill(); g.fillStyle = '#e8dca8'; g.beginPath(); g.arc(768, 92, 7, 0, 7); g.arc(792, 116, 5, 0, 7); g.arc(796, 86, 4, 0, 7); g.fill();
  if (t % 360 < 26) { const q = t % 360; g.strokeStyle = lg(0, 0, 80, 0, 'rgba(255,255,255,0)', '#fff'); g.lineWidth = 2.5; g.beginPath(); g.moveTo(820 - q * 22, 40 + q * 6); g.lineTo(900 - q * 22, 20 + q * 6); g.stroke(); }
  hills('#2a1858', H - 120, 40, .2, 200);
  for (let k = 0; k < reps(240); k++) {   // sleepy village on the far hill
    const x = sx(k, .2, 240) + 40, y = H - 128 - 40 * Math.sin((x + t * .2) / 200) - 20 * Math.sin((x + t * .2) / 74);
    g.fillStyle = '#3b2672'; g.fillRect(x - 12, y - 4, 24, 20); g.beginPath(); g.moveTo(x - 15, y - 3); g.lineTo(x, y - 16); g.lineTo(x + 15, y - 3); g.fill();
    g.fillStyle = (k + (t / 120 | 0)) % 4 ? '#ffd86b' : '#3b2672'; g.fillRect(x - 6, y + 2, 5, 5); g.fillRect(x + 2, y + 2, 5, 5);
  }
  hills('#1d1042', H - 60, 26, .5, 140);
  for (let k = 0; k < reps(110); k++) pine(sx(k, .8, 110), H - 30 - (k % 3) * 8, 90 + (k * 37) % 40, '#140a30');
  fireflies(fx ? 24 : 8, '#ffe98a');
}
function auroraPeaks() {
  twinkles(50, .05, H * .5);
  for (let b = 0; b < 3; b++) {   // aurora ribbons
    const hue = [150, 190, 290][b];
    for (let x = 0; x <= W; x += 14) {
      const y = 60 + b * 40 + Math.sin(x / 110 + t / 40 + b * 2) * 26, hgt = 70 + 30 * Math.sin(x / 60 + t / 25 + b);
      const q = g.createLinearGradient(0, y, 0, y + hgt); q.addColorStop(0, `hsla(${hue},90%,70%,0)`); q.addColorStop(.3, `hsla(${hue},90%,70%,.28)`); q.addColorStop(1, `hsla(${hue},90%,70%,0)`);
      g.fillStyle = q; g.fillRect(x, y, 14, hgt);
    }
  }
  const peaks = (col, shade, base, hgt, sp, gap) => { for (let k = 0; k < reps(gap); k++) { const x = sx(k, sp, gap), h = hgt * (.8 + (k * 37 % 10) / 25);
    g.fillStyle = col; g.beginPath(); g.moveTo(x - gap * .75, base); g.lineTo(x, base - h); g.lineTo(x + gap * .75, base); g.fill();
    g.fillStyle = shade; g.beginPath(); g.moveTo(x, base - h); g.lineTo(x + gap * .75, base); g.lineTo(x + gap * .1, base); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x - h * .22, base - h * .7); g.lineTo(x, base - h); g.lineTo(x + h * .22, base - h * .7); g.lineTo(x + h * .08, base - h * .64); g.lineTo(x - h * .06, base - h * .72); g.fill(); } };
  peaks('#5d7fb8', '#46679e', H - 80, 260, .15, 260);
  peaks('#8eaee0', '#6f8fc8', H - 50, 180, .4, 200);
  hills('#eaf4ff', H - 50, 20, .7, 150);
  for (let k = 0; k < reps(120); k++) pine(sx(k, 1, 120), H - 40 - (k % 2) * 10, 70 + (k * 29) % 30, '#1e4a5e', '#ffffff');
  hills('#ffffff', H - 14, 14, 1.4, 110);
  if (fx) { g.fillStyle = '#fff'; for (let k = 0; k < 50; k++) { const x = (sx(k, 1.2, 24) + Math.sin(t / 30 + k) * 10), y = ((k * 61 + t * (1 + k % 3 * .4)) % H); g.globalAlpha = .7; g.beginPath(); g.arc(x, y, 1.5 + k % 3, 0, 7); g.fill(); } g.globalAlpha = 1; }
}
function rainbowCanyon() {
  sunGlow(680, 300, 80, 'rgba(255,230,160,.8)');
  g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(680, 300, 70, 0, 7); g.fill();
  for (let k = 0; k < reps(340); k++) { const x = sx(k, .25, 340); g.fillStyle = 'rgba(255,190,220,.5)'; g.beginPath(); g.ellipse(x, 90 + (k * 47) % 80, 70, 12, 0, 0, 7); g.fill(); }
  for (let k = 0; k < reps(420); k++) {   // hot-air balloons drifting
    const x = sx(k, .35, 420) + 60, y = 150 + (k * 71) % 90 + Math.sin(t / 50 + k) * 8, c = RAINBOW[k % 6];
    g.strokeStyle = '#7a3a5e'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 8, y + 14); g.lineTo(x - 5, y + 26); g.moveTo(x + 8, y + 14); g.lineTo(x + 5, y + 26); g.stroke();
    g.fillStyle = c; g.beginPath(); g.arc(x, y, 15, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x - 3, y - 15, 6, 30);
    g.fillStyle = '#a0623a'; g.fillRect(x - 5, y + 25, 10, 7);
  }
  const mesas = (col, top, base, sp, gap) => { for (let k = 0; k < reps(gap); k++) { const x = sx(k, sp, gap), w = gap * (.45 + (k * 31 % 10) / 40), h = base - top - (k * 23 % 40);
    g.fillStyle = col; g.beginPath(); g.moveTo(x - w * .6, base); g.lineTo(x - w * .45, base - h); g.lineTo(x + w * .45, base - h); g.lineTo(x + w * .6, base); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x - w * .45, base - h, w * .9, 6); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x - w * .45, base - h * .55, w * .95, 5); } };
  mesas('#c86d9a', 300, H - 40, .3, 260);
  mesas('#a8528a', 360, H - 20, .7, 220);
  hills('#7d3c80', H - 40, 18, 1.1, 130);
  hills('#5e2a68', H - 12, 12, 1.8, 100);
  if (fx) for (let k = 0; k < 20; k++) { g.globalAlpha = .5; g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(sx(k, 1.5, 50), H - 30 - (k * 37) % 200 + Math.sin(t / 20 + k) * 6, 2, 0, 7); g.fill(); } g.globalAlpha = 1;
}
function coralReef() {
  g.fillStyle = 'rgba(255,255,255,.12)';   // sun shafts from the surface
  for (let k = 0; k < 6; k++) { const x = 80 + k * 170 + Math.sin(t / 90 + k) * 30; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 50, 0); g.lineTo(x - 30, H); g.lineTo(x - 110, H); g.fill(); }
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2;   // shimmering surface
  for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x, 8 + Math.sin(x / 30 + t / 12) * 4); g.quadraticCurveTo(x + 20, 2, x + 40, 8 + Math.sin((x + 40) / 30 + t / 12) * 4); g.stroke(); }
  for (let k = 0; k < reps(260); k++) {   // far fish school
    const x0 = sx(k, .5, 260), y0 = 120 + (k * 61) % 140;
    g.fillStyle = 'rgba(20,90,120,.35)'; for (let f = 0; f < 6; f++) { const x = x0 + (f % 3) * 16, y = y0 + (f / 3 | 0) * 12 + Math.sin(t / 10 + f) * 2; g.beginPath(); g.ellipse(x, y, 6, 3, 0, 0, 7); g.moveTo(x + 5, y); g.lineTo(x + 10, y - 3); g.lineTo(x + 10, y + 3); g.fill(); }
  }
  hills('#1f7f99', H - 110, 34, .3, 180);
  const corals = ['#ff7eb6', '#ffa94d', '#b48cff', '#ff6b6b', '#ffd36b'];
  for (let k = 0; k < reps(140); k++) {   // branching corals
    const x = sx(k, .9, 140), base = H - 50, c = corals[k % 5];
    g.strokeStyle = c; g.lineCap = 'round';
    const branch = (bx, by, len, a, d) => { const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len; g.lineWidth = 7 - d * 2; g.beginPath(); g.moveTo(bx, by); g.lineTo(ex, ey); g.stroke(); if (d < 2) { branch(ex, ey, len * .7, a - .5, d + 1); branch(ex, ey, len * .7, a + .45, d + 1); } };
    if (k % 2) branch(x, base, 34, -Math.PI / 2 + Math.sin(t / 60 + k) * .05, 0);
    else { g.fillStyle = c; g.globalAlpha = .9; g.beginPath(); g.moveTo(x, base); g.arc(x, base, 38, Math.PI * 1.15, Math.PI * 1.85); g.closePath(); g.fill(); g.globalAlpha = 1;
      g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1.5; for (let r = 0; r < 4; r++) { g.beginPath(); g.moveTo(x, base); g.lineTo(x + Math.cos(Math.PI * (1.2 + r * .2)) * 36, base + Math.sin(Math.PI * (1.2 + r * .2)) * 36); g.stroke(); } }
  }
  g.fillStyle = '#f2d9a6'; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 30) g.lineTo(x, H - 40 - 8 * Math.sin((x + t * 1.4) / 80)); g.lineTo(W, H); g.fill();   // sand
  for (let k = 0; k < reps(120); k++) { const x = sx(k, 1.4, 120); g.fillStyle = k % 3 ? '#ff9ec4' : '#ffd36b'; if (k % 2) star(x, H - 22, 7, .3, '#ff8a5c'); else { g.beginPath(); g.arc(x, H - 24, 6, Math.PI, 0); g.fill(); } }
  g.strokeStyle = '#2fa86e'; g.lineWidth = 6;   // swaying kelp in front
  for (let k = 0; k < reps(190); k++) { const x = sx(k, 2.2, 190); g.beginPath(); g.moveTo(x, H); g.bezierCurveTo(x + Math.sin(t / 30 + k) * 18, H - 50, x - Math.sin(t / 30 + k) * 18, H - 90, x + Math.sin(t / 25 + k) * 10, H - 130 - (k % 3) * 20); g.stroke(); }
  if (fx) for (let k = 0; k < 16; k++) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.5; g.beginPath(); g.arc(sx(k, .6, 70) + Math.sin(t / 20 + k) * 6, ((k * 83 - t * (1 + k % 3)) % H + H) % H, 3 + k % 4 * 2, 0, 7); g.stroke(); }
}
function crystalCaves() {
  for (let k = 0; k < reps(200); k++) {   // far stalactites
    const x = sx(k, .25, 200), h = 60 + (k * 37) % 70; g.fillStyle = '#1a2a4a'; g.beginPath(); g.moveTo(x - 30, 0); g.lineTo(x, h); g.lineTo(x + 30, 0); g.fill();
    g.beginPath(); g.moveTo(x + 70, H); g.lineTo(x + 100, H - h * .8); g.lineTo(x + 130, H); g.fill();
  }
  const cluster = (x, base, s, col, up) => {   // glowing crystal cluster
    g.globalAlpha = .2 + .08 * Math.sin(t / 20 + x); g.fillStyle = col; g.beginPath(); g.arc(x, base, 50 * s, 0, 7); g.fill(); g.globalAlpha = 1;
    [[-14, 34, -.3], [0, 52, 0], [14, 40, .3], [-26, 22, -.6], [24, 26, .55]].forEach(([dx, h, a]) => {
      g.save(); g.translate(x + dx * s, base); g.rotate(up ? a : Math.PI - a); const hh = h * s;
      g.fillStyle = lg(0, 0, 0, -hh, col, '#ffffff'); g.beginPath(); g.moveTo(-6 * s, 0); g.lineTo(-6 * s, -hh * .75); g.lineTo(0, -hh); g.lineTo(6 * s, -hh * .75); g.lineTo(6 * s, 0); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -hh); g.lineTo(6 * s, -hh * .75); g.lineTo(6 * s, 0); g.fill(); g.restore();
    });
  };
  for (let k = 0; k < reps(170); k++) {   // rock pillars, middle distance
    const x = sx(k, .45, 170), w = 26 + (k * 13) % 20; g.fillStyle = '#16233f';
    g.beginPath(); g.moveTo(x - w, H); g.lineTo(x - w * .6, H - 180 - (k * 41) % 90); g.lineTo(x + w * .6, H - 190 - (k * 29) % 70); g.lineTo(x + w, H); g.fill();
  }
  for (let k = 0; k < reps(240); k++) { const x = sx(k, .8, 240); cluster(x, H - 26, 1.5, ['#5ff0d4', '#ff7ad9', '#b18cff'][k % 3], true); cluster(x + 120, 26, 1.1, ['#5cc8ff', '#ffd36b', '#ff7ad9'][k % 3], false); }
  for (let k = 0; k < reps(150); k++) {   // hanging glow gems on threads
    const x = sx(k, 1.1, 150) + 40, l = 40 + (k * 37) % 80, sw = Math.sin(t / 40 + k) * 4;
    g.strokeStyle = 'rgba(180,220,255,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, 20); g.lineTo(x + sw, l); g.stroke();
    g.globalAlpha = .3; g.fillStyle = '#b8fff2'; g.beginPath(); g.arc(x + sw, l + 6, 12, 0, 7); g.fill(); g.globalAlpha = 1;
    g.fillStyle = k % 2 ? '#b8fff2' : '#ffc4f0'; g.beginPath(); g.moveTo(x + sw, l); g.lineTo(x + sw + 5, l + 6); g.lineTo(x + sw, l + 14); g.lineTo(x + sw - 5, l + 6); g.fill();
  }
  g.fillStyle = '#0f1830'; g.beginPath(); g.moveTo(0, 0); for (let x = 0; x <= W; x += 30) g.lineTo(x, 24 + 10 * Math.sin((x + t * 1.2) / 60)); g.lineTo(W, 0); g.fill();
  g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 30) g.lineTo(x, H - 26 - 10 * Math.sin((x + t * 1.2) / 70)); g.lineTo(W, H); g.fill();
  fireflies(fx ? 26 : 8, '#b8fff2');
}
function stormFortress() {
  for (let k = 0; k < reps(300); k++) blob(sx(k, .15, 300), 50 + (k * 37) % 60, 2.2, 'rgba(60,62,90,.9)');
  const fx0 = 680 - (t * .05) % 520;   // the fortress, drifting slowly across the back
  g.fillStyle = '#23233a';
  g.fillRect(fx0, H - 260, 220, 200); [[-20, 90], [80, 130], [190, 100]].forEach(([dx, h]) => { g.fillRect(fx0 + dx, H - 260 - h + 60, 50, h + 140); g.beginPath(); g.moveTo(fx0 + dx - 8, H - 260 - h + 60); g.lineTo(fx0 + dx + 25, H - 320 - h + 60); g.lineTo(fx0 + dx + 58, H - 260 - h + 60); g.fill(); });
  g.fillStyle = `rgba(255,216,107,${.6 + .3 * Math.sin(t / 15)})`; [[0, 150], [100, 200], [205, 160], [60, 110], [150, 120]].forEach(([dx, y]) => g.fillRect(fx0 + dx, H - y, 10, 16));
  hills('#2c2c45', H - 50, 24, .6, 140);
  if (t % 240 < 10) {   // lightning bolt + flash
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#fff6a8'; g.lineWidth = 4; g.beginPath(); let x = 300 + ((t / 240 | 0) * 173) % 400, y = 0; g.moveTo(x, y);
    for (let i = 0; i < 6; i++) { x += ((i * 37) % 50) - 25; y += 50; g.lineTo(x, y); } g.stroke();
  }
  for (let k = 0; k < reps(220); k++) blob(sx(k, 1.4, 220), 30 + (k % 2) * 14, 1.6, 'rgba(30,30,48,.85)');
  hills('#1b1b2c', H - 14, 14, 1.6, 100);
  if (fx) { g.strokeStyle = 'rgba(180,190,230,.35)'; g.lineWidth = 1.5; g.beginPath(); for (let k = 0; k < 70; k++) { const x = (k * 53 + t * 9) % (W + 100) - 50, y = (k * 97 + t * 14) % (H + 40) - 20; g.moveTo(x, y); g.lineTo(x - 6, y + 16); } g.stroke(); }
}
function eye(x, y, r, brow) {   // cartoon eye with a shine; brow > 0 tilts an angry eyebrow
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, r, r * 1.15, 0, 0, 7); g.fill();
  g.fillStyle = '#2b2440'; g.beginPath(); g.ellipse(x - r * .2, y + r * .1, r * .6, r * .72, 0, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x - r * .05, y - r * .3, r * .28, 0, 7); g.fill();
  if (brow) { g.strokeStyle = '#2b2440'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x - r * 1.2, y - r * 1.5 - brow); g.lineTo(x + r * .9, y - r * 1.05); g.stroke(); }
}
const FOE_H = { pig: 76, bird: 48, jelly: 68, fish: 68, owl: 64, ghost: 60, bug: 48, bee: 44, storm: 76, butterfly: 56, balloon: 70 };
function drawFoe(o) {
  g.save(); g.translate(o.x, o.y);
  const h = o.hit > 0, fl = Math.sin(t / 3 + o.ph), k = o.kind, OL = 'rgba(70,30,80,.55)';
  if (o.golden) { g.save(); g.globalCompositeOperation = 'lighter'; const gq = g.createRadialGradient(0, 0, 4, 0, 0, FOE_H[k] * .85); gq.addColorStop(0, `rgba(255,220,90,${.55 + .2 * Math.sin(t / 5)})`); gq.addColorStop(1, 'rgba(255,200,60,0)'); g.fillStyle = gq; g.beginPath(); g.arc(0, 0, FOE_H[k] * .85, 0, 7); g.fill(); g.restore();
    g.strokeStyle = `rgba(255,228,92,${.6 + .3 * Math.sin(t / 4)})`; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, FOE_H[k] * .62, 0, 7); g.stroke(); if (t % 6 === 0) sparks.push({ x: o.x + (Math.random() - .5) * 60, y: o.y + (Math.random() - .5) * 60, vx: 0, vy: -.5, l: 25, col: '#ffe45c' }); }
  if (IMG['foe_' + k]) {   // generated sprite with a little wobble and squash
    const fh = FOE_H[k], sq = 1 + Math.sin(t / 4 + o.ph) * .04;
    g.rotate(Math.sin(t / 10 + o.ph) * .08); g.scale(1 / sq, sq);
    spr('foe_' + k, 0, 0, fh, false, k === 'bug' && o.top); if (h) flashSpr('foe_' + k, 0, 0, fh, .55); else if (o.golden) flashSpr('foe_' + k, 0, 0, fh, .3 + .1 * Math.sin(t / 4));
    g.restore(); return;
  }
  const F = (a, b, y0, y1) => h ? '#ffffff' : lg(0, y0, 0, y1, a, b);
  g.lineJoin = g.lineCap = 'round';
  const outline = () => { g.strokeStyle = OL; g.lineWidth = 2; g.stroke(); };
  if (k === 'pig') {   // chunky flying pig
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(6, -24 - fl * 6, 15, 7 + Math.abs(fl) * 4, -.5 - fl * .3, 0, 7); g.fill(); outline();
    g.fillStyle = F('#ffc3dd', '#ff86b8', -25, 25); g.beginPath(); g.ellipse(0, 0, 32, 25, 0, 0, 7); g.fill(); outline();
    g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(4, -13, 16, 5, -.1, 0, 7); g.fill();
    g.fillStyle = '#ff7fb0'; g.beginPath(); g.moveTo(-12, -20); g.lineTo(-22, -34); g.lineTo(-2, -24); g.closePath(); g.fill(); outline();
    g.fillStyle = '#d65f92'; [-16, -6, 8, 18].forEach(x => { rr(x - 4, 19, 8, 9, 3); g.fill(); });
    g.fillStyle = F('#ffd8e8', '#ffaacb', -4, 12); g.beginPath(); g.ellipse(-30, 4, 10, 9, 0, 0, 7); g.fill(); outline();
    g.fillStyle = '#c4487c'; g.beginPath(); g.ellipse(-33, 4, 1.6, 3, 0, 0, 7); g.ellipse(-27, 4, 1.6, 3, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,90,140,.45)'; g.beginPath(); g.ellipse(-10, 8, 6, 4, 0, 0, 7); g.fill();
    eye(-16, -6, 4.5, 2);
    g.strokeStyle = '#ff6ea8'; g.lineWidth = 3; g.beginPath(); g.arc(35, -3, 5, -.5, 4.5); g.stroke();
  } else if (k === 'bird') {
    g.fillStyle = F('#ff8a8a', '#e83f5b', -14, 14); g.beginPath(); g.ellipse(0, 0, 18, 14, 0, 0, 7); g.fill(); outline();
    g.fillStyle = '#ffd1d1'; g.beginPath(); g.ellipse(-4, 6, 10, 6, 0, 0, 7); g.fill();
    g.fillStyle = '#e83f5b'; g.beginPath(); g.moveTo(6, -12); g.lineTo(2, -22); g.lineTo(10, -14); g.fill();   // head tuft
    g.fillStyle = h ? '#fff' : '#ff6b7f'; g.beginPath(); g.ellipse(9, 1 - fl * 5, 12, 6 + Math.abs(fl) * 4, .5 + fl * .3, 0, 7); g.fill(); outline();
    g.fillStyle = '#ffc94a'; g.beginPath(); g.moveTo(-16, -3); g.lineTo(-29, 2); g.lineTo(-16, 6); g.closePath(); g.fill(); outline();
    eye(-9, -5, 4.2, 2);
  } else if (k === 'jelly') {
    g.globalAlpha = .9;
    g.strokeStyle = h ? '#fff' : '#c79bff'; g.lineWidth = 3;
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 8, 0); g.bezierCurveTo(i * 8 + Math.sin(t / 8 + i) * 8, 10, i * 8 - Math.sin(t / 8 + i) * 8, 20, i * 8, 30); g.stroke(); }
    g.fillStyle = F('#e6d0ff', '#a970ff', -18, 2); g.beginPath(); g.ellipse(0, 0, 23, 19, 0, Math.PI, 0); g.quadraticCurveTo(0, 6, -23, 0); g.fill(); outline();
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(-8, -11, 6, 3, -.5, 0, 7); g.fill();
    eye(-7, -5, 3.4, 0); eye(7, -5, 3.4, 0);
    g.fillStyle = 'rgba(255,110,170,.5)'; g.beginPath(); g.arc(-13, 0, 2.5, 0, 7); g.arc(13, 0, 2.5, 0, 7); g.fill();
  } else if (k === 'fish') {   // puffer fish
    g.strokeStyle = h ? '#fff' : '#f07a1a'; g.lineWidth = 3;
    for (let a = 0; a < 10; a++) { const q = a * .628; g.beginPath(); g.moveTo(Math.cos(q) * 22, Math.sin(q) * 22); g.lineTo(Math.cos(q) * 32, Math.sin(q) * 32); g.stroke(); }
    g.fillStyle = h ? '#fff' : '#ff9a3c'; g.beginPath(); g.moveTo(22, 0); g.lineTo(38, -12 + fl * 5); g.lineTo(38, 12 - fl * 5); g.closePath(); g.fill(); outline();
    g.fillStyle = F('#ffe08a', '#ffa53c', -26, 26); g.beginPath(); g.arc(0, 0, 26, 0, 7); g.fill(); outline();
    g.fillStyle = '#fff6d6'; g.beginPath(); g.ellipse(-2, 12, 16, 9, 0, 0, 7); g.fill();
    eye(-12, -6, 5.5, 2);
    g.strokeStyle = '#7a3a12'; g.lineWidth = 2.2; g.beginPath(); g.arc(-19, 9, 4, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  } else if (k === 'owl') {
    g.fillStyle = F('#b8875a', '#7d5230', -24, 24); g.beginPath(); g.ellipse(0, 0, 20, 24, 0, 0, 7); g.fill(); outline();
    g.beginPath(); g.moveTo(-16, -16); g.lineTo(-15, -32); g.lineTo(-5, -21); g.moveTo(16, -16); g.lineTo(15, -32); g.lineTo(5, -21); g.fill();
    g.fillStyle = '#f2d7b0'; g.beginPath(); g.ellipse(0, 9, 12, 12, 0, 0, 7); g.fill();
    g.strokeStyle = '#d4b080'; g.lineWidth = 1.4; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(-4 + i * 4, 6 + i * 3, 2.5, 0, Math.PI); g.stroke(); }
    g.fillStyle = h ? '#fff' : '#946338'; g.beginPath(); g.ellipse(-18, 4 - fl * 4, 7, 14, .3 + fl * .3, 0, 7); g.ellipse(18, 4 - fl * 4, 7, 14, -.3 - fl * .3, 0, 7); g.fill();
    g.fillStyle = '#f2d7b0'; g.beginPath(); g.arc(-8, -8, 8.5, 0, 7); g.arc(8, -8, 8.5, 0, 7); g.fill();
    eye(-8, -8, 5.5, 0); eye(8, -8, 5.5, 0);
    g.fillStyle = '#ffb12e'; g.beginPath(); g.moveTo(-3, -2); g.lineTo(3, -2); g.lineTo(0, 5); g.closePath(); g.fill();
  } else if (k === 'ghost') {
    g.globalAlpha = .75 + .2 * Math.sin(t / 10 + o.ph);
    g.fillStyle = F('#ffffff', '#d9dcff', -26, 22); g.beginPath(); g.moveTo(-20, 18); g.lineTo(-20, -6); g.arc(0, -6, 20, Math.PI, 0); g.lineTo(20, 18);
    for (let i = 0; i < 4; i++) { const x0 = 20 - i * 10; g.quadraticCurveTo(x0 - 5, 26 + Math.sin(t / 6 + i) * 3, x0 - 10, 18); }
    g.closePath(); g.fill(); outline(); g.globalAlpha = 1;
    eye(-7, -6, 4, 0); eye(7, -6, 4, 0);
    g.fillStyle = 'rgba(255,130,180,.5)'; g.beginPath(); g.arc(-12, 2, 3, 0, 7); g.arc(12, 2, 3, 0, 7); g.fill();
    g.fillStyle = '#4a3f6b'; g.beginPath(); g.ellipse(0, 5, 3, 4, 0, 0, 7); g.fill();
  } else if (k === 'bug') {   // crystal beetle crawling on the floor or ceiling
    if (o.top) g.scale(1, -1);
    g.strokeStyle = '#2a7f78'; g.lineWidth = 2.4;
    for (let i = -1; i <= 1; i++) { const sw = Math.sin(t / 3 + i * 2) * 4; g.beginPath(); g.moveTo(i * 9, 2); g.lineTo(i * 9 + sw - 4, 12); g.stroke(); }
    g.fillStyle = F('#b8fff2', '#36c9b8', -18, 4); g.beginPath(); g.ellipse(2, 0, 22, 16, 0, Math.PI, 0); g.closePath(); g.fill(); outline();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(2, -16); g.lineTo(2, 0); g.moveTo(-10, -12); g.lineTo(2, -6); g.lineTo(14, -12); g.stroke();
    g.fillStyle = F('#7fe8da', '#2a9f94', -10, 4); g.beginPath(); g.arc(-20, -4, 8, 0, 7); g.fill(); outline();
    eye(-23, -6, 3, 1);
    g.strokeStyle = '#2a7f78'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-24, -11); g.quadraticCurveTo(-30, -20, -34, -18); g.stroke();
  } else if (k === 'bee') {
    g.fillStyle = 'rgba(220,245,255,.85)'; g.beginPath(); g.ellipse(-2, -13 - fl * 4, 8, 5 + Math.abs(fl) * 3, -.3, 0, 7); g.ellipse(7, -13 + fl * 4, 8, 5 + Math.abs(fl) * 3, .3, 0, 7); g.fill(); outline();
    g.fillStyle = F('#ffeb7a', '#ffc21f', -10, 10); g.beginPath(); g.ellipse(0, 0, 15, 11, 0, 0, 7); g.fill(); outline();
    g.save(); g.beginPath(); g.ellipse(0, 0, 15, 11, 0, 0, 7); g.clip(); g.fillStyle = h ? '#fff' : '#3a2a3f'; g.fillRect(-1, -12, 5, 24); g.fillRect(8, -12, 5, 24); g.restore();
    g.fillStyle = '#3a2a3f'; g.beginPath(); g.moveTo(14, -2); g.lineTo(20, 0); g.lineTo(14, 2); g.fill();
    eye(-8, -2, 3.4, 1.5);
  } else if (k === 'butterfly') {
    for (const sd of [-1, 1]) { g.fillStyle = h ? '#fff' : sd < 0 ? '#ffb3e1' : '#d8b4ff'; g.beginPath(); g.ellipse(sd * 12, -4, 14 * Math.abs(fl), 18, sd * .3, 0, 7); g.fill(); outline(); }
    g.fillStyle = '#5a3a6a'; g.beginPath(); g.ellipse(0, 0, 4, 14, 0, 0, 7); g.fill(); eye(-1, -10, 3, 1.5);
  } else if (k === 'balloon') {
    g.fillStyle = F('#d9a8ff', '#9a4fd1', -26, 26); [[0, -8, 16], [-14, 8, 11], [14, 8, 11], [0, 20, 9]].forEach(([x, y, r]) => { g.beginPath(); g.ellipse(x, y, r, r * 1.2, 0, 0, 7); g.fill(); });
    g.strokeStyle = '#ccc'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 30); g.lineTo(0, 46); g.stroke(); eye(-5, -10, 3.5, 2); eye(6, -10, 3.5, 2);
  } else if (k === 'storm') {
    blob(0, 0, 1.2, h ? '#fff' : '#4a4d6a'); blob(2, -5, 1, h ? '#fff' : '#5c6080');
    g.fillStyle = '#ffe84d'; g.beginPath(); g.moveTo(-2, 16); g.lineTo(8, 16); g.lineTo(1, 28); g.lineTo(10, 28); g.lineTo(-8, 48); g.lineTo(-2, 32); g.lineTo(-8, 32); g.closePath(); g.fill(); g.strokeStyle = '#d9a400'; g.lineWidth = 1.5; g.stroke();
    eye(-10, -4, 5, 2.5); eye(10, -4, 5, 2.5);
    g.strokeStyle = '#2b2440'; g.lineWidth = 2.4; g.beginPath(); g.arc(0, 10, 5, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
  }
  g.restore();
}
const WCOL = { beam: ['#fff3a0', '#ff6fd0'], boom: ['#ffc2dc', '#ff2f7d'], seek: ['#d9f7ff', '#8f5cff'], lob: ['#ffe2c2', '#ff8a3d'] };
function weaponIcon(k) {   // white icon centred on 0,0 (about 24 px)
  g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = g.lineJoin = 'round';
  if (k === 'beam') { g.lineWidth = 5; g.beginPath(); g.moveTo(-10, 0); g.lineTo(10, 0); g.stroke(); sparkle(10, 0, 6, 1); }
  else if (k === 'boom') { heartPath(0, 1, 10); g.fill(); }
  else if (k === 'seek') { g.beginPath(); g.ellipse(-5, -3, 6, 8, -.5, 0, 7); g.ellipse(5, -3, 6, 8, .5, 0, 7); g.ellipse(-4, 6, 4, 5, -.4, 0, 7); g.ellipse(4, 6, 4, 5, .4, 0, 7); g.fill(); }
  else { g.beginPath(); g.moveTo(-8, 2); g.lineTo(8, 2); g.lineTo(6, 11); g.lineTo(-6, 11); g.closePath(); g.fill(); g.beginPath(); g.arc(0, 1, 9, Math.PI, 0); g.fill(); g.fillStyle = '#ff2f7d'; g.beginPath(); g.arc(0, -9, 3, 0, 7); g.fill(); }
}
function drawWeaponShot(s) {
  g.save(); g.translate(s.x, s.y);
  if (s.w === 'seek') {   // fluttering butterfly sparkle
    const f = Math.abs(Math.sin(t / 3 + s.x / 30)); g.rotate(Math.atan2(s.vy, s.vx)); g.scale(1.6, 1.6);
    g.fillStyle = 'rgba(200,150,255,.35)'; g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill();
    g.fillStyle = lg(0, -10, 0, 10, '#ff8fd0', '#8f5cff'); g.beginPath(); g.ellipse(0, -6, 5, 9 * f + 2, -.4, 0, 7); g.ellipse(0, 6, 5, 9 * f + 2, .4, 0, 7); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 1.2; g.stroke(); g.fillStyle = '#4a2266'; g.fillRect(-4, -1, 8, 2);
    if (t % 3 === 0) sparks.push({ x: s.x, y: s.y, vx: -s.vx * .1, vy: -s.vy * .1, l: 14, col: '#d9b8ff' });
  } else if (s.w === 'boom') {   // spinning heart
    g.rotate(t / 4); g.fillStyle = 'rgba(255,150,200,.3)'; g.beginPath(); g.arc(0, 0, 20, 0, 7); g.fill(); heartPath(0, 0, 16); g.fillStyle = lg(0, -12, 0, 14, '#ff9ec8', '#ff2f7d'); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.stroke();
    if (t % 2 === 0) sparks.push({ x: s.x, y: s.y, vx: 0, vy: 0, l: 12, col: '#ffb3d6' });
  } else if (s.w === 'lob') {   // cupcake bomb
    g.rotate(s.vx * .05 + t / 12); g.scale(1.5, 1.5);
    g.fillStyle = '#c98a5a'; g.beginPath(); g.moveTo(-10, 2); g.lineTo(10, 2); g.lineTo(7, 14); g.lineTo(-7, 14); g.closePath(); g.fill();
    g.fillStyle = '#ffb3d6'; g.beginPath(); g.arc(0, 2, 12, Math.PI, 0); g.fill(); g.fillStyle = '#ff2f7d'; g.beginPath(); g.arc(0, -10, 4, 0, 7); g.fill();
    g.fillStyle = '#fff'; [[-5, -2], [4, -4], [0, -7]].forEach(([a, b]) => g.fillRect(a, b, 3, 2));
  }
  g.restore();
}
function drawBeam(p) {   // rainbow beam from the horn to the edge of the screen
  const [x, y] = muzzle(p), w = W - x, wob = Math.sin(t / 3) * 2;
  g.save();
  g.fillStyle = 'rgba(255,255,255,.35)'; rr(x, y - 17 - wob, w + 20, 34 + wob * 2, 17); g.fill();
  RAINBOW.forEach((c, i) => { g.fillStyle = c; g.globalAlpha = .9; g.fillRect(x, y - 12 + i * 4, w, 4); });
  g.globalAlpha = .85; g.fillStyle = '#fff'; g.fillRect(x, y - 2, w, 4);
  g.restore(); sparkle(x, y, 12 + wob * 2, 1);
  if (t % 3 === 0) sparks.push({ x: x + Math.random() * w, y: y + (Math.random() - .5) * 20, vx: 0, vy: (Math.random() - .5) * 2, l: 16, col: RAINBOW[t % 6] });
}
function heartPath(x, y, s) { g.beginPath(); g.moveTo(x, y + s * .9); g.bezierCurveTo(x - s * 1.3, y, x - s * .9, y - s * 1.1, x, y - s * .4); g.bezierCurveTo(x + s * .9, y - s * 1.1, x + s * 1.3, y, x, y + s * .9); g.closePath(); }
function powIcon(k) {   // white icon on a power-up bubble, centred on 0,0
  g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.lineCap = g.lineJoin = 'round';
  if (k === 'rapid') { for (const dx of [-5, 3]) { g.beginPath(); g.moveTo(dx - 3, -7); g.lineTo(dx + 4, 0); g.lineTo(dx - 3, 7); g.stroke(); } }
  else if (k === 'triple') { star(0, -7, 5, 0, '#fff'); star(-7, 5, 5, 0, '#fff'); star(7, 5, 5, 0, '#fff'); }
  else if (k === 'magnet') { g.lineWidth = 5; g.beginPath(); g.arc(0, -1, 7, Math.PI, 0, true); g.stroke(); g.fillStyle = '#ffe1e1'; g.fillRect(-9.5, -3, 5, 5); g.fillRect(4.5, -3, 5, 5); }
  else { g.beginPath(); g.arc(-1, 2, 8, 0, 7); g.fill(); g.lineWidth = 2; g.beginPath(); g.moveTo(4, -5); g.quadraticCurveTo(8, -11, 11, -9); g.stroke(); sparkle(11, -10, 4, 1); }
}
function drawThingSprite(o) {
  const k = o.kind, bob = Math.sin(t / 9 + o.x / 40) * 3;
  if (k === 'cloud') return spr('haz_cloud', o.x, o.y + bob, 72);
  if (k === 'bat') { if (!IMG.haz_bat) return false; g.save(); g.translate(o.x, o.y); g.scale(1, 1 + Math.sin(t / 3 + o.x / 50) * .15); spr('haz_bat', 0, 0, 54); g.restore(); return true; }
  if (k === 'spike') return spr('haz_spike', o.x, o.top ? 40 : H - 40, 84, false, o.top);
  if (k === 'shoe') {   // golden horseshoe with a soft halo
    g.fillStyle = `rgba(255,216,74,${.3 + .15 * Math.sin(t / 6)})`; g.beginPath(); g.arc(o.x, o.y + bob, 30, 0, 7); g.fill();
    if (!spr('pick_shoe', o.x, o.y + bob, 46)) { g.strokeStyle = '#ffc400'; g.lineWidth = 8; g.beginPath(); g.arc(o.x, o.y + bob, 14, Math.PI * .15, Math.PI * .85, true); g.stroke(); }
    if (t % 12 < 4) sparkle(o.x + 14, o.y - 14 + bob, 6, 1); return true;
  }
  if (k === 'friend') {   // little pegasus waiting to be picked up
    g.fillStyle = 'rgba(191,230,255,.4)'; g.beginPath(); g.arc(o.x, o.y + bob, 30, 0, 7); g.fill();
    if (!spr('friend_pegasus', o.x, o.y + bob, 54)) { g.save(); g.translate(o.x, o.y + bob); g.scale(.45, .45); drawUnicorn(0, 0); g.restore(); }
    return true;
  }
  if (k === 'ring') { if (!IMG.pick_ring) return false; g.save(); g.translate(o.x, o.y); g.scale(Math.abs(Math.cos(t / 14 + o.x / 90)) * .7 + .3, 1); spr('pick_ring', 0, 0, 34); g.restore(); if ((t + (o.x | 0)) % 50 < 12) sparkle(o.x + 9, o.y - 10, 5, .9); return true; }
  if (k === 'heart' || k === 'star' || POW.includes(k)) {
    if (!IMG['pick_' + k]) return false;
    const p = 1 + Math.sin(t / 7) * .07; g.save(); g.translate(o.x, o.y + bob); g.scale(p, p);
    if (k === 'star') { g.fillStyle = `rgba(255,243,140,${.25 + .15 * Math.sin(t / 5)})`; g.beginPath(); g.arc(0, 0, 26, 0, 7); g.fill(); }
    spr('pick_' + k, 0, 0, k === 'heart' ? 38 : 42); g.restore(); return true;
  }
  return false;
}
function drawThing(o) {
  if (o.foe) return drawFoe(o);
  if (o.kind === 'rock') {   // glowing volcano rock with a trail
    const tail = g.createLinearGradient(o.x, o.y, o.x + 50, o.y - 70); tail.addColorStop(0, 'rgba(255,140,60,.85)'); tail.addColorStop(1, 'rgba(255,90,160,0)');
    g.fillStyle = tail; g.beginPath(); g.moveTo(o.x - 16, o.y - 6); g.lineTo(o.x + 60, o.y - 80); g.lineTo(o.x + 14, o.y + 10); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,150,80,.35)'; g.beginPath(); g.arc(o.x, o.y, 28, 0, 7); g.fill();
    g.fillStyle = lg(0, o.y - 20, 0, o.y + 20, '#6a4a6a', '#2a1a2e'); g.beginPath(); g.moveTo(o.x - 20, o.y - 4); g.lineTo(o.x - 10, o.y - 19); g.lineTo(o.x + 12, o.y - 17); g.lineTo(o.x + 21, o.y + 2); g.lineTo(o.x + 8, o.y + 19); g.lineTo(o.x - 14, o.y + 15); g.closePath(); g.fill();
    g.strokeStyle = '#ff8fd0'; g.lineWidth = 2.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(o.x - 12, o.y - 2); g.lineTo(o.x - 2, o.y + 4); g.lineTo(o.x + 4, o.y - 8); g.moveTo(o.x - 2, o.y + 4); g.lineTo(o.x + 6, o.y + 12); g.stroke();
    g.strokeStyle = 'rgba(255,220,120,.9)'; g.lineWidth = 1.2; g.stroke();
    if (t % 3 === 0) sparks.push({ x: o.x, y: o.y - 14, vx: 1, vy: -1.5, l: 18, col: '#ffb36b' });
    return;
  }
  if (drawThingSprite(o)) return;
  if (o.kind === 'cloud' && ch === 8) { g.fillStyle = '#2a5a2a'; g.beginPath(); g.arc(o.x, o.y, 22, 0, 7); g.fill(); g.strokeStyle = '#1a3a1a'; g.lineWidth = 4; for (let a = 0; a < 8; a++) { g.beginPath(); g.moveTo(o.x + Math.cos(a * .785) * 18, o.y + Math.sin(a * .785) * 18); g.lineTo(o.x + Math.cos(a * .785) * 32, o.y + Math.sin(a * .785) * 32); g.stroke(); } }
  else if (o.kind === 'cloud' && ch === 9) { g.fillStyle = '#9a4fd1'; g.beginPath(); g.arc(o.x, o.y, 24, 0, 7); g.fill(); g.fillStyle = '#d9a8ff'; g.beginPath(); g.arc(o.x - 8, o.y - 8, 5, 0, 7); g.arc(o.x + 9, o.y + 6, 4, 0, 7); g.fill(); g.strokeStyle = '#2a0a3a'; g.lineWidth = 3; g.beginPath(); g.arc(o.x, o.y + 12, 8, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
  else if (o.kind === 'cloud') {   // grumpy rain cloud
    const dark = [7, 10, 13, 15, 16, 19, 23].includes(ch), top = dark ? '#6a6d8c' : ch === 26 ? '#d79ac8' : '#a9a3c4', bot = dark ? '#3a3c58' : ch === 26 ? '#a96a9e' : '#7d7699';
    g.strokeStyle = 'rgba(120,170,255,.6)'; g.lineWidth = 2; for (let r = 0; r < 4; r++) { const ry = (t * 2 + r * 9) % 24; g.beginPath(); g.moveTo(o.x - 15 + r * 10, o.y + 18 + ry); g.lineTo(o.x - 17 + r * 10, o.y + 24 + ry); g.stroke(); }
    blob(o.x, o.y + 3, 1.05, bot); blob(o.x, o.y - 1, 1, top);
    g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(o.x - 6, o.y - 16, 12, 5, 0, 0, 7); g.fill();
    eye(o.x - 9, o.y + 2, 4, 2); eye(o.x + 9, o.y + 2, 4, 2);
    g.strokeStyle = '#2b2440'; g.lineWidth = 2; g.beginPath(); g.arc(o.x, o.y + 15, 4, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
  }
  else if (o.kind === 'ring') {   // spinning gold ring
    const sq = Math.abs(Math.cos(t / 14 + o.x / 90)) * .7 + .3;
    g.save(); g.translate(o.x, o.y); g.scale(sq, 1);
    g.strokeStyle = '#b87a00'; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, 13, 0, 7); g.stroke();
    g.strokeStyle = lg(0, -14, 0, 14, '#fff6b0', '#ffb300'); g.lineWidth = 5; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 13, 3.6, 4.6); g.stroke(); g.restore();
    if ((t + (o.x | 0)) % 50 < 12) sparkle(o.x + 9, o.y - 10, 5, .9);
  }
  else if (o.kind === 'heart') {
    g.save(); g.translate(o.x, o.y); const p = 1 + Math.sin(t / 7) * .08; g.scale(p, p);
    heartPath(0, 0, 16); g.fillStyle = lg(0, -14, 0, 16, '#ff9ec8', '#ff2f7d'); g.fill(); g.strokeStyle = '#b0175a'; g.lineWidth = 2.2; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(-6, -5, 4, 2.5, -.6, 0, 7); g.fill(); g.restore();
  }
  else if (o.kind === 'star') {
    g.save(); g.translate(o.x, o.y); g.rotate(Math.sin(t / 15) * .2);
    g.fillStyle = `rgba(255,243,140,${.25 + .15 * Math.sin(t / 5)})`; g.beginPath(); g.arc(0, 0, 26, 0, 7); g.fill();
    star(0, 0, 19, 0, '#d99a1e'); star(0, 1, 16, 0, '#ffe45c'); star(-2, -2, 8, 0, '#fff7c2'); g.restore();
  }
  else if (o.kind.startsWith('w_')) {   // weapon pickup bubble
    const k = o.kind.slice(2), col = WCOL[k];
    g.save(); g.translate(o.x, o.y + Math.sin(t / 9 + o.x / 40) * 3); const p = 1 + Math.sin(t / 6) * .08; g.scale(p, p);
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(0, 0, 24, 0, 7); g.fill();
    g.fillStyle = lg(0, -19, 0, 19, col[0], col[1]); g.beginPath(); g.arc(0, 0, 19, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
    weaponIcon(k); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-7, -10, 7, 3, -.5, 0, 7); g.fill(); g.restore();
    if (t % 20 < 6) sparkle(o.x + 16, o.y - 16, 5, .9);
  }
  else if (POW.includes(o.kind)) {
    const col = { rapid: ['#ffc06b', '#ff7a1a'], triple: ['#d9c2ff', '#8f5cff'], magnet: ['#9fe9ff', '#1fa8e0'], bomb: ['#ff9a9a', '#e8283c'] }[o.kind];
    g.save(); g.translate(o.x, o.y + Math.sin(t / 9) * 3);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(0, 0, 22, 0, 7); g.fill();
    g.fillStyle = lg(0, -17, 0, 17, col[0], col[1]); g.beginPath(); g.arc(0, 0, 17, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
    powIcon(o.kind);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-6, -9, 6, 3, -.5, 0, 7); g.fill(); g.restore();
  }
  else if (o.kind === 'bat') {   // little bat with flapping wings
    const f = Math.sin(t / 3 + o.x / 50), col = ch >= 8 ? ['#c58cf0', '#7d3fb5'] : ['#7d6aa8', '#3d2a5e'];
    g.save(); g.translate(o.x, o.y); g.scale(1.3, 1.3); g.fillStyle = col[1];
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 6, -2); g.quadraticCurveTo(sd * 18, -18 - f * 10, sd * 30, -6 - f * 8); g.quadraticCurveTo(sd * 24, 0, sd * 26, 6 - f * 4); g.quadraticCurveTo(sd * 16, 0, sd * 6, 6); g.closePath(); g.fill(); }
    g.fillStyle = lg(0, -12, 0, 12, col[0], col[1]); g.beginPath(); g.ellipse(0, 0, 10, 12, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(-8, -8); g.lineTo(-6, -17); g.lineTo(-2, -10); g.moveTo(8, -8); g.lineTo(6, -17); g.lineTo(2, -10); g.fill();
    eye(-4, -2, 3, 1); eye(4, -2, 3, 1);
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-2, 5); g.lineTo(-1, 8); g.lineTo(0, 5); g.fill(); g.restore();
  }
  else if (o.kind === 'spike') {   // crystal spike growing from the floor or ceiling
    const col = CHAPTERS[ch].spike || '#7ff0ff', base = o.top ? 0 : H, tip = o.top ? o.y + 55 : o.y - 55;
    g.fillStyle = lg(0, base, 0, tip, col, '#ffffff'); g.beginPath(); g.moveTo(o.x - 22, base); g.lineTo(o.x, tip); g.lineTo(o.x + 22, base); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(o.x, base); g.lineTo(o.x, tip); g.lineTo(o.x + 22, base); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(70,30,80,.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(o.x - 22, base); g.lineTo(o.x, tip); g.lineTo(o.x + 22, base); g.stroke();
    if ((t + o.x) % 60 < 15) sparkle(o.x, tip + (o.top ? -8 : 8), 5, .9);
  }
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

// ---- story: a little chat on each chapter card, and the ending ----
const TALK = [
  ['The clouds look grumpy today!', "Let's sprinkle some sparkle on them!"],
  ['Whoa, the sea is so shiny!', 'This is my home! Follow me!'],
  ['Shh... the stars are sleeping.', "Then let's be sneaky-quiet heroes!"],
  ['Brrr! My hooves are chilly!', 'Look at the dancing lights!'],
  ['I can see a hundred rainbows!', 'And a humming saucer behind them...'],
  ['Can unicorns swim?', 'With a mermaid friend, they can!'],
  ['So many sparkly crystals!', 'Careful, the pointy ones are sharp!'],
  ['That fortress looks spooky...', "We're brave together. Let's go!"],
  ['The fireflies are showing the way!', 'Mind the thorny bits!'],
  ['Can I eat the clouds?', 'Yes! Just not the sour gumballs!'],
  ['The lake is like a mirror.', 'Make a wish on the moon!'],
  ['Pink petals everywhere! Just like my mane!', 'Catch them before the bees do!'],
  ['A rainbow in every waterfall!', "Hold on tight, it's going to be splashy!"],
  ['A carnival in the sky? At night?!', "Last stop before home. Let's have fun!"],
  ['Sunflowers taller than me!', 'They always face the sun. Just like us!'],
  ['Is the lava... sparkly?', "It's glitter lava! Still, don't touch it!"],
  ["We're flying in space?!", 'Wave to the planets on the way home!'],
  ['Crunchy leaves! I love autumn!', 'Look out for the grumpy squirrel!'],
  ['So many airships! Ahoy!', 'Arr! Full speed ahead, captain!'],
  ['The city looks like a dream.', "Everyone's asleep. Let's fly quietly!"],
  ['A tea party in the sky? How fancy!', 'Pinkies up! And dodge the flying cups!'],
  ['Everything sparkles like diamonds!', 'Brrr! Keep flying to stay warm!'],
  ["Giant toys! It's like a dream!", 'Watch out, the toys are wound up!'],
  ['So many lanterns! Make a wish!', 'I wished for us to get home safe!'],
  ['A secret jungle temple!', "Maybe there's treasure inside!"],
  ['Hot sand and cool water!', 'Fly fast, the sand is ticklish!'],
  ["We're almost home!", 'One last grumpy queen to cheer up!'],
];
function wrapText(s, maxW) { const out = []; let line = ''; for (const w of s.split(' ')) { const tt = line ? line + ' ' + w : w; if (g.measureText(tt).width > maxW && line) { out.push(line); line = w; } else line = tt; } out.push(line); return out; }
function bubble(x, y, s, pop, tailLeft) {   // speech bubble that pops in (pop 0..1)
  if (pop <= 0) return;
  g.save(); g.translate(x, y); const sc = pop < 1 ? .6 + .4 * pop + Math.sin(pop * Math.PI) * .12 : 1; g.scale(sc, sc);
  g.font = 'bold 19px "Trebuchet MS", sans-serif'; const lines = wrapText(s, 230), w = Math.max(...lines.map(l => g.measureText(l).width)) + 36, h = lines.length * 24 + 24;
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(tailLeft ? -w / 2 + 30 : w / 2 - 30, h / 2 - 2); g.lineTo(tailLeft ? -w / 2 + 14 : w / 2 - 14, h / 2 + 22); g.lineTo(tailLeft ? -w / 2 + 52 : w / 2 - 52, h / 2 - 2); g.fill();
  panel(-w / 2, -h / 2, w, h, 18, '#fff', '#ffb3e1');
  g.fillStyle = '#7a1a63'; g.textAlign = 'center'; lines.forEach((l, i) => g.fillText(l, 0, -h / 2 + 30 + i * 24));
  g.restore();
}
function resultsCard() {
  const p = Math.min(1, t / 20), y = 70 + (1 - p) * 60;
  g.fillStyle = `rgba(42,15,61,${.5 * p})`; g.fillRect(0, 0, W, H);
  g.globalAlpha = p; panel(W / 2 - 280, y, 560, 380, 34, lg(0, y, 0, y + 380, 'rgba(255,242,250,.97)', 'rgba(255,205,236,.97)'), '#fff');
  fancyText('Chapter cleared!', W / 2, y + 66, 44);
  for (let i = 0; i < 3; i++) {   // stars pop in one by one
    const on = i < stat.stars && t > 30 + i * 30, s = on ? Math.min(1, (t - 30 - i * 30) / 10) : 1, x = W / 2 + (i - 1) * 90, sy = y + 140 - (i === 1 ? 14 : 0);
    g.save(); g.translate(x, sy); g.scale(s * (on ? 1 + .15 * Math.max(0, 1 - (t - 30 - i * 30) / 15) : 1), s);
    star(0, 3, 38, 0, on ? '#d99a1e' : 'rgba(122,26,99,.2)'); if (on) { star(0, 0, 34, 0, '#ffe45c'); star(-5, -6, 14, 0, '#fff7c2'); }
    g.restore();
  }
  g.font = 'bold 20px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.fillStyle = '#7a1a63';
  const lines = [`Rings  ${stat.rings} / ${stat.ringsAll}   ·   Horseshoes  ${shoeBits(shoes[ch] || 0)} / 3`, CHAPTERS[ch].tour ? `Sea friends met  ${stat.sights} / ${sightCount()}   ·   Grumpy fish cheered up  ${stat.foes}` : `Enemies cheered up  ${stat.foes}`, stat.hits ? `Hits taken  ${stat.hits}` : 'No hits. Perfect flying!', `Score  ${score}`];
  lines.forEach((l, i) => g.fillText(l, W / 2, y + 222 + i * 30));
  if (t > 60 && t % 50 < 36) { g.fillStyle = '#e8279a'; g.fillText('Tap to continue', W / 2, y + 356); }
  g.globalAlpha = 1;
}
function chapterCard() {
  const c = CHAPTERS[ch], p = Math.min(1, t / 20);
  g.fillStyle = `rgba(42,15,61,${.45 * p})`; g.fillRect(0, 0, W, H);
  panel(W / 2 - 250, 34 - (1 - p) * 120, 500, 106, 30, lg(0, 30, 0, 140, 'rgba(255,240,250,.97)', 'rgba(255,200,235,.97)'), '#fff');
  fancyText(`Chapter ${ch + 1}`, W / 2, 92 - (1 - p) * 120, 46);
  g.font = 'bold 22px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.fillStyle = '#7a1a63'; g.fillText(c.name, W / 2, 126 - (1 - p) * 120);
  const ux = 250 - (1 - p) * 300, mx = 720 + (1 - p) * 300;
  g.save(); g.translate(ux, 360 + Math.sin(t / 15) * 6); g.scale(1.7, 1.7); drawUnicorn(0, 0); g.restore();
  g.save(); g.translate(mx, 370 + Math.sin(t / 15 + 1) * 6); g.scale(1.5, 1.5); drawMermaid(0, 0); g.restore();
  const [a, b] = TALK[ch] || ['', ''];
  bubble(330, 222, a, Math.min(1, (t - 25) / 12), true);
  bubble(640, 262, b, Math.min(1, (t - 125) / 12), false);
  if (t > 100 && t % 50 < 36) { panel(W / 2 - 90, H - 62, 180, 40, 20, lg(0, H - 62, 0, H - 22, '#ff8fd0', '#e8279a'), '#fff'); txt('Tap to fly!', W / 2, H - 34, 20, '#fff'); }
}
function happySaucer(x, y, hull, s, n = 0) {   // a cheered-up boss waving goodbye
  const hs = IMG['happy_' + n] ? 'happy_' + n : ['happy_0', 'happy_1', 'happy_9'][n % 3];   // each boss has its own cheered-up portrait
  if (IMG[hs]) { g.save(); g.translate(x, y); g.rotate(Math.sin(t / 12 + x) * .08); spr(hs, 0, 0, 150 * s); g.restore(); return; }
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(Math.sin(t / 12 + x) * .08);
  g.fillStyle = 'rgba(190,240,255,.6)'; g.beginPath(); g.ellipse(0, -6, 30, 26, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#ffd1ec'; g.beginPath(); g.arc(0, -14, 12, 0, 7); g.fill();
  g.strokeStyle = '#2b2440'; g.lineWidth = 2.2; g.beginPath(); g.arc(-4, -16, 2.5, Math.PI, 0); g.arc(4, -16, 2.5, Math.PI, 0); g.stroke();
  g.beginPath(); g.arc(0, -10, 4, .2, Math.PI - .2); g.stroke();
  g.strokeStyle = '#ffd1ec'; g.lineWidth = 3; g.beginPath(); g.moveTo(10, -16); g.lineTo(18, -26 + Math.sin(t / 4) * 4); g.stroke();   // waving arm
  g.fillStyle = lg(0, -4, 0, 24, '#fff', hull); g.beginPath(); g.ellipse(0, 6, 62, 18, 0, 0, 7); g.fill();
  for (let i = -2; i <= 2; i++) { g.fillStyle = (Math.floor(t / 8) + i) % 2 ? '#fff36b' : '#fff'; g.beginPath(); g.arc(i * 22, 10, 3.5, 0, 7); g.fill(); }
  g.restore();
}
// Ending (about 25 s, tap to skip after 4 s): dawn breaks, the cheered-up saucers wave goodbye,
// the friends fly to the castle under fireworks, then the credits roll.
function drawEnding() {
  const e = ending, k = Math.min(1, e / 500);
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, `rgb(${40 + 215 * k | 0},${20 + 170 * k | 0},${100 + 130 * k | 0})`); gr.addColorStop(1, `rgb(255,${130 + 90 * k | 0},${170 + 40 * k | 0})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (IMG.bg_26) {   // painted castle at dawn: starts dark, brightens as the sun rises
    g.drawImage(IMG.bg_26, 0, 0, W, H);
    g.fillStyle = `rgba(40,20,90,${.6 * (1 - k)})`; g.fillRect(0, 0, W, H);
    if (k < 1) twinkles(40, .05, H * .5);
    endingActors(e); return;
  }
  if (k < 1) twinkles(40, .05, H * .6);
  sunGlow(W / 2, H - 60 - k * 180, 60, `rgba(255,240,180,${.4 + .4 * k})`);
  g.fillStyle = '#fff2a8'; g.beginPath(); g.arc(W / 2, H - 60 - k * 180, 60, 0, 7); g.fill();
  if (e > 200) { g.lineWidth = 12; g.globalAlpha = Math.min(.8, (e - 200) / 200); RAINBOW.forEach((c, i) => { g.strokeStyle = c; g.beginPath(); g.arc(W / 2, H + 60, 420 - i * 12, Math.PI, 0); g.stroke(); }); g.globalAlpha = 1; }
  for (let i = 0; i < reps(300); i++) cloud(sx(i, .4, 300), 70 + (i * 61) % 120, 1.4, .7);
  if (e > 380) {   // the castle rises into view
    const cy = Math.max(0, 140 - (e - 380) * .8);
    g.save(); g.translate(0, cy); g.fillStyle = '#f7a6d4'; g.fillRect(560, 250, 260, 230);
    [[540, 180, 60], [640, 130, 70], [760, 180, 60]].forEach(([x, y, w]) => { g.fillStyle = '#f7a6d4'; g.fillRect(x, y + 40, w, 300); g.fillStyle = '#c94f9c'; g.beginPath(); g.moveTo(x - 8, y + 40); g.lineTo(x + w / 2, y - 30); g.lineTo(x + w + 8, y + 40); g.fill(); g.fillStyle = '#ff6fa8'; g.fillRect(x + w / 2 - 1, y - 52, 2, 24); g.beginPath(); g.moveTo(x + w / 2 + 1, y - 52); g.lineTo(x + w / 2 + 16, y - 46); g.lineTo(x + w / 2 + 1, y - 40); g.fill(); });
    g.fillStyle = '#fff6c9'; [[570, 250], [660, 200], [780, 250], [670, 320]].forEach(([x, y]) => { rr(x, y, 16, 26, 8); g.fill(); });
    g.restore();
  }
  hills('#e88ac4', H - 40, 26, .5, 140); hills('#d670b4', H - 12, 18, .9, 110);
  endingActors(e);
}
function endingActors(e) {
  // cheered-up saucers float away waving
  if (e > 60) for (let i = 0; i < NCH; i++) { const x = W + 120 - (e - 60 - i * 22) * 2.6, y = 100 + (i * 53) % 200 + Math.sin(e / 20 + i) * 10; if (x > -120 && x < W + 120) happySaucer(x, y, HULLS[(i * 3) % 8], .55, i); }   // the whole boss parade, one per chapter
  // the friends
  const fx = e < 380 ? Math.min(e * 2.5 - 100, 300) : 300 + (e - 380) * .5, hy = H / 2 + 20 + Math.sin(e / 20) * 12;
  if (fx < W - 120) { drawMermaid(fx - 120, hy + 30); drawUnicorn(fx, hy); }
  if (e > 120 && e % 5 === 0) sparks.push({ x: fx - 60, y: hy, vx: -2 - Math.random() * 2, vy: (Math.random() - .5) * 2, l: 40, col: RAINBOW[(e / 5 | 0) % 6] });
  if (e > 420 && e % 24 === 0) boom(120 + Math.random() * (W - 240), 70 + Math.random() * 180, RAINBOW[Math.random() * 6 | 0], 34);
  if (e > 40 && e < 300) bubble(W / 2, 80, 'The sky is happy again!', Math.min(1, (e - 40) / 14), false);
  if (e >= 300 && e < 700) bubble(W / 2, 80, 'Thank you, Pink Unicorn and Mermaid!', Math.min(1, (e - 300) / 14), true);
  if (e >= 700) {   // credits roll
    const lines = ['PINK UNICORN', '', 'Starring', 'Pink Unicorn  &  Mermaid', '', 'Featuring', `${CHAPTERS.length} cheered-up saucers`, 'chunky pigs, sleepy owls, bubbly jellyfish, grumpy balloons', 'and one very sparkly queen', '', `Chapters cleared: ${CHAPTERS.length}`, `Final score: ${score}`, `Best: ${best}`, '', 'Made with love', '', 'THE END'];
    const y0 = H + 20 - (e - 700) * .9;
    panel(W / 2 - 250, 20, 500, H - 40, 30, 'rgba(122,26,99,.45)', 'rgba(255,255,255,.6)');
    g.save(); rr(W / 2 - 250, 20, 500, H - 40, 30); g.clip();
    lines.forEach((l, i) => { const y = Math.max(y0 + i * 40, i === lines.length - 1 ? H / 2 : -100); if (i === 0 || i === lines.length - 1) fancyText(l, W / 2, y, 44); else { g.font = `bold ${['Starring', 'Featuring'].includes(l) ? 16 : 22}px "Trebuchet MS", sans-serif`; g.textAlign = 'center'; g.fillStyle = ['Starring', 'Featuring'].includes(l) ? '#ffd1ec' : '#fff'; g.fillText(l, W / 2, y); } });
    g.restore();
  }
  if (e > 240 && e % 120 < 80) { panel(W / 2 - 100, H - 52, 200, 34, 17, 'rgba(122,26,99,.55)'); txt('tap to play again', W / 2, H - 29, 17, '#fff'); }
}
// ---- interface pieces ----
function panel(x, y, w, h, r, fill, edge) { rr(x, y, w, h, r); g.fillStyle = fill; g.fill(); g.strokeStyle = edge || 'rgba(255,255,255,.75)'; g.lineWidth = 2.5; g.stroke(); }
function fancyText(s, x, y, size) {   // candy-gradient text with a white rim and a purple outline
  g.font = `900 ${size}px "Trebuchet MS", "Arial Rounded MT Bold", sans-serif`; g.textAlign = 'center'; g.lineJoin = 'round';
  g.lineWidth = size * .28; g.strokeStyle = '#7a1a63'; g.strokeText(s, x, y + 3);
  g.lineWidth = size * .16; g.strokeStyle = '#fff'; g.strokeText(s, x, y);
  g.fillStyle = lg(0, y - size * .8, 0, y, '#ffb3e1', '#e8279a'); g.fillText(s, x, y);
}
function logo(x, y) {
  const word = 'PINK UNICORN', size = 72; g.font = `900 ${size}px "Trebuchet MS", "Arial Rounded MT Bold", sans-serif`;
  let cx = x - g.measureText(word).width / 2;
  for (let i = 0; i < word.length; i++) {
    const ch1 = word[i], w = g.measureText(ch1).width, by = y + Math.sin(t / 14 + i * .6) * 5;
    if (ch1 !== ' ') {
      g.textAlign = 'left'; g.lineJoin = 'round';
      g.lineWidth = 20; g.strokeStyle = '#7a1a63'; g.strokeText(ch1, cx, by + 4);
      g.lineWidth = 11; g.strokeStyle = '#fff'; g.strokeText(ch1, cx, by);
      g.fillStyle = lg(0, by - 60, 0, by, i < 4 ? '#ffc6e8' : '#fff1a8', i < 4 ? '#ff3fa4' : RAINBOW[(i - 5) % 6]); g.fillText(ch1, cx, by);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(cx + 6, by - 52, w * .25, 8);
    }
    cx += w;
  }
  sparkle(x + 270, y - 54, 9 + 3 * Math.sin(t / 6), .95); sparkle(x - 280, y - 10, 7 + 3 * Math.sin(t / 7 + 2), .9);
}
function menuButton(s, y, on) {
  const x = W / 2 - 190, w = 380, h = 38;
  if (on) { g.fillStyle = `rgba(255,255,255,${.35 + .15 * Math.sin(t / 8)})`; rr(x - 6, y - 5, w + 12, h + 10, 26); g.fill(); }
  rr(x, y, w, h, 21); g.fillStyle = on ? lg(0, y, 0, y + h, '#ff8fd0', '#e8279a') : 'rgba(255,255,255,.72)'; g.fill();
  g.strokeStyle = on ? '#fff' : 'rgba(214,25,154,.45)'; g.lineWidth = 3; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.35)'; rr(x + 10, y + 4, w - 20, 12, 6); g.fill();
  g.font = 'bold 22px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.fillStyle = on ? '#fff' : '#c2197f'; g.fillText(s, W / 2, y + 27);
  if (on) { star(x + 26, y + 21, 9, t / 20, '#fff36b'); star(x + w - 26, y + 21, 9, -t / 20, '#fff36b'); }
}
function card(title, lines, big) {
  g.fillStyle = 'rgba(42,15,61,.45)'; g.fillRect(0, 0, W, H);
  const h = 120 + lines.length * 34, y = H / 2 - h / 2 - 10;
  panel(W / 2 - 260, y, 520, h, 30, lg(0, y, 0, y + h, 'rgba(255,240,250,.96)', 'rgba(255,200,235,.96)'), '#fff');
  fancyText(title, W / 2, y + 66, big ? 52 : 46);
  lines.forEach((s, i) => { g.font = `bold ${i === 0 && big ? 26 : 19}px "Trebuchet MS", sans-serif`; g.textAlign = 'center'; g.fillStyle = i === lines.length - 1 ? '#e8279a' : '#7a1a63'; g.fillText(s, W / 2, y + 108 + i * 34); });
  sparkle(W / 2 - 230, y + 24, 8, .9); sparkle(W / 2 + 232, y + h - 26, 7, .9);
}
function hud() {
  panel(10, 10, 170, 40, 20, 'rgba(122,26,99,.45)');
  g.save(); g.translate(32, 30); g.strokeStyle = '#ffc94a'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 8, 0, 7); g.stroke(); g.restore();
  g.font = 'bold 22px "Trebuchet MS", sans-serif'; g.textAlign = 'left'; g.fillStyle = '#fff'; g.fillText(score, 50, 38);
  for (let i = 0; i < lives; i++) { g.save(); g.translate(W - 26 - i * 34, 30); const p = i === lives - 1 ? 1 + .1 * Math.sin(t / 6) : 1; g.scale(p, p); heartPath(0, 0, 13); g.fillStyle = lg(0, -12, 0, 12, '#ff9ec8', '#ff2f7d'); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.stroke(); g.restore(); }
  if (combo > 1) { const cx = W / 2; panel(cx - 64, 12, 128, 34, 17, lg(0, 12, 0, 46, '#fff3a0', '#ffb300'), '#fff'); txt(`Combo x${Math.min(combo, 10)}`, cx, 36, 18, '#fff'); }
  players.forEach((p, i) => {   // active power-ups as small bubbles with a countdown ring
    let x = 26;
    if (p.weapon && p.weaponT > 0) {   // current weapon with its countdown
      const y = 72 + i * 40; g.save(); g.translate(x, y); g.fillStyle = WCOL[p.weapon][1]; g.beginPath(); g.arc(0, 0, 15, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 15, -Math.PI / 2, -Math.PI / 2 + 6.283 * p.weaponT / 600); g.stroke(); g.scale(.62, .62); weaponIcon(p.weapon); g.restore(); x += 38;
    }
    for (const [k, v, col] of [['shield', p.shield, '#ffd84a'], ['rapid', p.rapid, '#ff7a1a'], ['triple', p.triple, '#8f5cff'], ['magnet', p.magnet, '#1fa8e0']]) {
      if (v <= 0) continue;
      const y = 72 + i * 40; g.save(); g.translate(x, y);
      g.fillStyle = col; g.beginPath(); g.arc(0, 0, 15, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 15, -Math.PI / 2, -Math.PI / 2 + 6.283 * v / (k === 'shield' ? 360 : 480)); g.stroke();
      g.scale(.62, .62); if (k === 'shield') star(0, 0, 13, 0, '#fff'); else powIcon(k); g.restore(); x += 38;
    }
  });
  {   // Sparkle Meter (bottom left): fills up; glows and pulses when the Rainbow Nova is ready
    const full = meter >= 100, cx = 44, cy = H - 44, pul = full ? 1 + .08 * Math.sin(t / 5) : 1;
    g.save(); g.translate(cx, cy); g.scale(pul, pul);
    if (full) { g.fillStyle = `rgba(255,243,140,${.35 + .2 * Math.sin(t / 5)})`; g.beginPath(); g.arc(0, 0, 36, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(122,26,99,.5)'; g.beginPath(); g.arc(0, 0, 26, 0, 7); g.fill();
    g.lineWidth = 6; g.lineCap = 'round'; const q = g.createLinearGradient(-26, 0, 26, 0); RAINBOW.forEach((c, i) => q.addColorStop(i / 5, c)); g.strokeStyle = q;
    g.beginPath(); g.arc(0, 0, 22, -Math.PI / 2, -Math.PI / 2 + 6.283 * meter / 100); g.stroke();
    star(0, 0, 12, full ? t / 15 : 0, full ? '#fff36b' : 'rgba(255,255,255,.7)'); g.restore();
    if (full) txt(touchUI ? 'Tap!' : 'Z', cx, cy - 40, 15, '#fff36b');
  }
  const btn = (x, draw) => { g.fillStyle = 'rgba(122,26,99,.4)'; g.beginPath(); g.arc(x, H - 34, 20, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2.5; g.stroke(); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; draw(); };
  btn(W - 40, () => { g.fillRect(W - 47, H - 43, 5, 18); g.fillRect(W - 38, H - 43, 5, 18); });
  btn(W - 94, () => { g.beginPath(); g.moveTo(W - 104, H - 39); g.lineTo(W - 99, H - 39); g.lineTo(W - 92, H - 45); g.lineTo(W - 92, H - 23); g.lineTo(W - 99, H - 29); g.lineTo(W - 104, H - 29); g.closePath(); g.fill();
    g.lineWidth = 2.5; if (muted) { g.beginPath(); g.moveTo(W - 88, H - 39); g.lineTo(W - 80, H - 29); g.moveTo(W - 80, H - 39); g.lineTo(W - 88, H - 29); g.stroke(); } else { g.beginPath(); g.arc(W - 91, H - 34, 7, -.8, .8); g.stroke(); } });
  if (!boss) {   // level progress: a rainbow bar with a tiny star racing to the boss
    const p = Math.min(1, t / (segTime() * 60)), bx = W / 2 - 160, by = H - 18;
    rr(bx, by, 320, 8, 4); g.fillStyle = 'rgba(122,26,99,.35)'; g.fill();
    if (p > .02) { rr(bx, by, 320 * p, 8, 4); const q = g.createLinearGradient(bx, 0, bx + 320, 0); RAINBOW.forEach((c, i) => q.addColorStop(i / 5, c)); g.fillStyle = q; g.fill(); }
    star(bx + 320 * p, by + 4, 9, t / 10, '#fff36b');
  }
}
function drawLoading() {   // first visit: wait (up to 6 s) for the main sprites so the title doesn't pop
  const gq = g.createLinearGradient(0, 0, 0, H); gq.addColorStop(0, '#ffd6f0'); gq.addColorStop(1, '#c9a8ff'); g.fillStyle = gq; g.fillRect(0, 0, W, H);
  logo(W / 2, 220);
  const p = Math.min(1, Object.keys(IMG).length / (CORE_ART.length + 2));
  rr(W / 2 - 180, 300, 360, 16, 8); g.fillStyle = 'rgba(122,26,99,.25)'; g.fill();
  rr(W / 2 - 180, 300, 360 * Math.max(.04, p), 16, 8); const q = g.createLinearGradient(W / 2 - 180, 0, W / 2 + 180, 0); RAINBOW.forEach((c, i) => q.addColorStop(i / 5, c)); g.fillStyle = q; g.fill();
  star(W / 2 - 180 + 360 * p, 308, 12, t / 10, '#fff36b');
  g.font = 'bold 18px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.fillStyle = '#7a1a63'; g.fillText('Sprinkling sparkles...', W / 2, 350);
}
function draw() {
  g.setTransform(Q, 0, 0, Q, 0, 0);
  if (state === 'loading') { drawLoading(); return; }
  g.save();
  if (shake > 0) g.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
  if (state === 'ending') drawEnding();
  else if (state === 'walk') drawWalk();
  else {
    drawBg(state === 'title' || state === 'shop' || state === 'map' ? 0 : ch);
    if (state === 'bonus') drawBonus();
    else if (state === 'shop') drawShop();
    else if (state === 'map') drawMap();
    else if (state === 'title') {
      drawMermaid(W / 2 - 150, 228 + Math.sin(t / 18 + 1) * 8);
      g.save(); g.translate(W / 2 + 20, 215 + Math.sin(t / 20) * 10); g.scale(1.45, 1.45); drawUnicorn(0, 0); g.restore();
      logo(W / 2, 112);
      if (mode === 'guest') { panel(W / 2 - 260, 300, 520, 60, 22, 'rgba(255,255,255,.85)'); txt('Connected! Waiting for the host to start...', W / 2, 338, 22, '#d6199a'); }
      else MENU.forEach((s, i) => menuButton(s, 276 + i * 44, i === sel));
      if (mode !== 'guest') { panel(W / 2 - 200, 452, 400, 30, 15, 'rgba(122,26,99,.35)'); txt(`◀   Map · ${startCh + 1}. ${CHAPTERS[startCh].name}  ${'★'.repeat(starsBest[startCh] || 0)}${'☆'.repeat(3 - (starsBest[startCh] || 0))}   ▶`, W / 2, 473, 16, '#fff'); }
      panel(10, 488, 196, 30, 15, easy ? 'rgba(80,200,120,.55)' : 'rgba(122,26,99,.35)'); txt(`Easy mode: ${easy ? 'ON' : 'off'} (E)`, 108, 509, 15, '#fff');
      txt(touchUI ? 'Drag to fly · double-tap to dash · two players: one half of the screen each' : 'Fly: mouse, arrows or WASD · Dash: Space or right-click · 2P: arrows + WASD (Q dash) or gamepads', W / 2 + 60, 500, 13);
      txt((touchUI ? '' : 'P pause · M mute · F fullscreen') + (best ? `${touchUI ? '' : '   ·   '}Best ${best}` : ''), W / 2 + 60, 521, 13);
      if (lobbyT > 0) { lobbyT--; txt(lobbyMsg, W / 2, 274, 20, '#fff36b'); }
      if (mode !== 'guest') {   // settings gear
        g.fillStyle = 'rgba(122,26,99,.45)'; g.beginPath(); g.arc(W - 40, 40, 22, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.stroke();
        g.save(); g.translate(W - 40, 40); g.fillStyle = '#fff'; for (let k = 0; k < 8; k++) { g.rotate(Math.PI / 4); g.fillRect(-3, -12, 6, 6); } g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill(); g.fillStyle = 'rgba(122,26,99,.9)'; g.beginPath(); g.arc(0, 0, 3.5, 0, 7); g.fill(); g.restore();
      }
      if (settingsOpen) drawSettings('Settings');
      else {   // shop bag button
        panel(16, 18, 168, 44, 22, lg(0, 18, 0, 62, '#ff8fd0', '#e8279a'), '#fff');
        g.font = 'bold 19px "Trebuchet MS", sans-serif'; g.textAlign = 'left'; g.fillStyle = '#fff'; g.fillText('Shop', 34, 47);
        g.strokeStyle = '#ffd84a'; g.lineWidth = 4; g.beginPath(); g.arc(102, 40, 8, 0, 7); g.stroke(); g.fillText(wallet, 116, 47);
        g.textAlign = 'right'; g.fillText((bestRun ? 'Best run ' + bestRun + '   ·   ' : '') + 'Horseshoes ' + shoeCount() + '/' + NCH * 3, W - 72, 46);
      }
    } else {
      stageBack();
      if (state === 'play') { for (const o of things) if (o.foe) groundShadow(o.x, o.y, FOE_H[o.kind] * .45); if (boss) groundShadow(boss.x, boss.y, 90); for (const p of players) groundShadow(p.x, p.y, 48); if (players.length === 1 && !tour()) groundShadow(mer.x, mer.y, 36); }
      if (state === 'play') polishBack();
      for (const o of things) drawThing(o);
      if (boss) drawBoss(boss);
      for (const s of shots) {
        if (s.w) { drawWeaponShot(s); continue; }
        if (s.m) { g.fillStyle = 'rgba(160,240,255,.25)'; g.beginPath(); g.arc(s.x, s.y, 8, 0, 7); g.fill(); g.strokeStyle = '#8ff0ff'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(s.x - 3, s.y - 3, 2.2, 0, 7); g.fill(); }
        else { g.globalAlpha = .35; star(s.x, s.y, 20, t / 6 + s.x / 20, `hsl(${(t * 15 + s.x) % 360},95%,80%)`); g.globalAlpha = 1; star(s.x, s.y, 13, t / 6 + s.x / 20, `hsl(${(t * 15 + s.x) % 360},95%,70%)`); star(s.x, s.y, 5, 0, '#fff'); }
      }
      for (const b of bolts) {   // boss energy orbs
        g.fillStyle = 'rgba(255,90,200,.3)'; g.beginPath(); g.arc(b.x, b.y, 14, 0, 7); g.fill();
        g.fillStyle = lg(b.x, b.y - 9, b.x, b.y + 9, '#ffe0f6', '#ff3fb4'); g.beginPath(); g.arc(b.x, b.y, 9, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(b.x - 3, b.y - 3, 2.5, 0, 7); g.fill();
      }
      for (const p of players) if (p.weapon === 'beam' && state === 'play') drawBeam(p);
      if (pal) { g.save(); g.translate(pal.x, pal.y); g.rotate(Math.sin(t / 15) * .1); if (!spr('friend_pegasus', 0, 0, 62)) { g.scale(.5, .5); drawUnicorn(0, 0); } g.restore(); if (pal.t < 120 && t % 10 < 5) sparkle(pal.x, pal.y - 30, 6, .9); }
      if (players.length === 1 && state !== 'chapter' && !tour()) drawMermaid(mer.x, mer.y);
      for (const p of state === 'chapter' ? [] : players) {
        if (p.flash > 0 && t % 8 < 4) continue;
        const one = (ox, a) => { g.save(); g.globalAlpha = a; g.translate(p.x + ox * p.vx, p.y + ox * p.vy); g.rotate(p.tilt || 0); const sq = p.squash > 0 ? Math.sin(p.squash / 12 * Math.PI) * .22 : 0; g.scale(1.15 * (1 + sq), 1.15 * (1 - sq)); p === uni ? drawUnicorn(0, 0, p.shield > 0, p.fp) : drawMermaid(0, 0, p.shield > 0); if (p === uni && players.length === 1 && tour()) drawRider(); g.restore(); g.globalAlpha = 1; };
        if (p.dash > 0) { one(-4, .2); one(-2, .35); }   // dash after-images
        if (p.hornFx > 0 && p === uni) { const [hx, hy] = muzzle(p); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,240,200,${p.hornFx / 10})`; g.beginPath(); g.arc(hx, hy, 10 + p.hornFx * 2, 0, 7); g.fill(); g.restore(); }
        one(0, 1);
        if (players.length > 1) { panel(p.x - 16, p.y - 92, 32, 20, 10, p.i ? 'rgba(20,160,160,.8)' : 'rgba(214,25,154,.8)'); txt('P' + (p.i + 1), p.x, p.y - 77, 14, '#fff'); }
      }
      for (const p of sparks) { g.globalAlpha = Math.max(0, p.l / 30); g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, 2.6, 0, 7); g.fill(); } g.globalAlpha = 1;
      for (const q of pops) { g.globalAlpha = Math.min(1, q.l / 20); txt(q.str, q.x, q.y, 18 + (q.l > 42 ? (50 - q.l) : 8), q.col); } g.globalAlpha = 1;
      if (state === 'play') stageFront();
      if (novaT > 0) {   // Rainbow Nova: expanding rainbow rings and a bright flash
        const k = 1 - novaT / 60; g.save(); g.lineWidth = 18 * (1 - k) + 2;
        RAINBOW.forEach((c, i) => { g.strokeStyle = c; g.globalAlpha = 1 - k; g.beginPath(); g.arc(uni.x, uni.y, 40 + k * 900 - i * 22, 0, 7); g.stroke(); });
        g.globalAlpha = Math.max(0, .5 - k); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.restore();
      }
      polishFront();
      if (state !== 'chapter' && state !== 'results') hud();
      if (state === 'play' && (ch === 0 || tour()) && !boss && t < 600) {   // first-time tips
        const tip = tour() ? (t < 300 ? 'Fly close to the sea friends to say hi!' : 'Your stars find the grumpy fish by themselves') : t < 300 ? 'Drag, or use the arrows, to fly anywhere' : 'Double-tap, Space or B to dash through danger!';
        g.globalAlpha = Math.min(1, Math.min(t % 300, 300 - t % 300) / 30); panel(W / 2 - 230, 64, 460, 36, 18, 'rgba(122,26,99,.6)'); txt(tip, W / 2, 89, 17, '#fff'); g.globalAlpha = 1;
      }
      const c = CHAPTERS[ch];
      if (boss && !clear) { panel(W / 2 - 110, H - 40, 220, 28, 14, 'rgba(122,26,99,.6)'); txt(c.boss, W / 2, H - 20, 17, '#fff'); }
      if (clear) { const p = Math.min(1, clear / 20); g.save(); g.translate(W / 2, 220); g.scale(p * (1 + .05 * Math.sin(t / 4)), p * (1 + .05 * Math.sin(t / 4))); fancyText('Boss defeated!', 0, 0, 56); g.restore(); }
      if (bossIntro > 0 && boss) {   // boss name card with a grumpy taunt
        const a = Math.min(1, bossIntro / 20, (200 - bossIntro) / 12), y = 12 + (1 - a) * -60;
        g.globalAlpha = a; panel(W / 2 - 230, y, 460, 92, 24, lg(0, y, 0, y + 92, 'rgba(255,240,250,.96)', 'rgba(255,200,230,.96)'), '#fff');
        g.save(); g.beginPath(); g.arc(W / 2 - 180, y + 46, 38, 0, 7); g.fillStyle = CHAPTERS[ch].sky[0]; g.fill(); g.clip(); spr('boss_' + ch, W / 2 - 180, y + 52, 80); g.restore();
        g.font = 'bold 22px "Trebuchet MS", sans-serif'; g.textAlign = 'left'; g.fillStyle = '#c2197f'; g.fillText(CHAPTERS[ch].boss, W / 2 - 128, y + 38);
        g.font = 'italic bold 16px "Trebuchet MS", sans-serif'; g.fillStyle = '#7a1a63'; g.fillText('“' + (TAUNTS[ch] || '') + '”', W / 2 - 128, y + 66); g.globalAlpha = 1;
      }
      if (warn > 0 && warn % 30 < 20 && bossIntro <= 0) { panel(W / 2 - 160, 112, 320, 56, 28, 'rgba(255,60,90,.85)'); txt('!  WARNING  !', W / 2, 152, 38, '#fff'); }
      if (paused) drawSettings('Paused');
      if (state === 'chapter') chapterCard();
      if (state === 'results') resultsCard();
      if (state === 'over') card(run ? 'Run Over' : 'Game Over', run ? [`Score ${score}   ·   Stretches ${runSeg + 1}`, `Best Rainbow Run ${bestRun}`, 'tap to run again'] : [`Score ${score}   ·   Best ${best}`, `tap to try ${CHAPTERS[ch].name} again`]);
      if (state === 'over') { panel(W / 2 - 70, H - 72, 140, 44, 22, lg(0, H - 72, 0, H - 28, '#c27ab0', '#7a1a63'), '#fff'); txt('Menu', W / 2, H - 43, 18, '#fff'); }
    }
  }
  g.restore();
  if (trans) drawTrans();
}

function loop() {
  if (cv.style) { const c = (state === 'play' || state === 'bonus') && !paused ? 'none' : 'default'; if (cv.style.cursor !== c) cv.style.cursor = c; }
  pollPads();
  music();
  if (mode === 'guest') { guestTick(); return; }
  if (state === 'bonus') { if (!paused) bonusUpdate(); for (const p of sparks) { p.x += p.vx; p.y += p.vy; p.l--; } sparks = sparks.filter(p => p.l > 0); for (const q of pops) { q.y -= .9; q.l--; } pops = pops.filter(q => q.l > 0); if (trans) { if (++trans.t === 35) trans.fn(); if (trans.t >= 70) trans = null; } if (mode === 'host' && net.open && ++net.ntk % 2 === 0) netSnap(); return; }
  if (state === 'walk') { if (!paused) walkUpdate(); for (const p of sparks) { p.x += p.vx; p.y += p.vy; p.l--; } sparks = sparks.filter(p => p.l > 0); for (const q of pops) { q.y -= .9; q.l--; } pops = pops.filter(q => q.l > 0); if (trans) { if (++trans.t === 35) trans.fn(); if (trans.t >= 70) trans = null; } if (mode === 'host' && net.open && ++net.ntk % 2 === 0) netSnap(); return; }
  if (state === 'loading') { t++; const need = CORE_ART.length + 2, have = Object.keys(IMG).length; if (have >= need || t > 360) { state = 'title'; t = 0; } return; }
  if (state === 'play') { if (!paused) update(); }
  else {
    t++; if (state === 'ending') ending++;
    if (state === 'chapter' && t === 25) voice('vo_ch' + ch + '_u');
    if (state === 'chapter' && t === 125) voice('vo_ch' + ch + '_m');
    if (state === 'ending' && ending === 40) voice('vo_n_end1');
    if (state === 'ending' && ending === 330) voice('vo_n_end2');
  }
  if (state === 'chapter' && t > 360) state = 'play';
  if (state === 'results' && t > 480 && mode !== 'guest') nextChapter();
  if (state === 'results' && t === 20) voice('vo_u_win');
  if (bossIntro > 0 && state === 'play' && !paused) bossIntro--;
  if (state === 'results' && t >= 30 && t <= 90 && t % 30 === 0 && t / 30 <= stat.stars) sfx('ring', t / 3);
  for (const p of sparks) { p.x += p.vx; p.y += p.vy; p.l--; }
  sparks = sparks.filter(p => p.l > 0);
  for (const q of pops) { q.y -= .9; q.l--; }
  pops = pops.filter(q => q.l > 0);
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
  if (avg > 27 && fx) { fx = 0; if (Q > 1) { Q = 1; cv.width = W; cv.height = H; } } else if (avg < 18 && !fx) fx = 1;   // slow phone: fewer effects, 1x resolution
  let n = 0;
  while (acc >= STEP - 1.5 && n < 3) { loop(); acc -= STEP; n++; }
  if (acc > STEP * 2) acc = 0;
  if (n) draw();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') paused = true; });
requestAnimationFrame(frame);
