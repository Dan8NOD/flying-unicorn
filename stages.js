// Pink Unicorn stage extras: per-chapter weather that changes during the level, wind, and timed surprises.
// Everything visual is worked out from (ch, t), so a guest device sees the same weather and fly-bys as the host;
// only the host spawns gameplay things (rings, golden enemies, falling rocks) and plays the event sounds.
//
// wx: weather timeline  [second, type, intensity, wind]   (wind pushes players backwards, in px per frame)
// ev: surprises         [second, kind, ...]
//     flyby:  [s, 'flyby', sprite, y, height, speed, sound]   a big friendly thing crossing the background
//     rainbow / shower / golden / gust / eruption             see stageFire()
// amb: ambience loop for the chapter (assets/audio/<amb>.mp3)
const STAGES = [
  { amb: 'amb_breeze', wx: [[0, 'sunbeams', .6, 0], [25, 'sparkle', .6, 0]], ev: [[10, 'rainbow'], [22, 'golden'], [30, 'shower']] },
  { amb: 'amb_sea', wx: [[0, 'sunbeams', .4, 0], [20, 'rain', .45, .5], [32, 'sunbeams', .5, 0]], ev: [[8, 'flyby', 'fx_whale', 380, 190, -1.6, 'whale'], [33, 'rainbow'], [26, 'golden']] },
  { amb: 'amb_night', wx: [[0, 'sparkle', .4, 0], [15, 'meteors', .8, 0]], ev: [[10, 'flyby', 'fx_comet', 120, 110, -6, 'comet'], [18, 'shower'], [30, 'golden']] },
  { amb: 'amb_wind', wx: [[0, 'snow', .4, .3], [18, 'snow', 1, 1.4], [32, 'snow', .5, .3]], ev: [[17, 'gust'], [24, 'flyby', 'fx_comet', 100, 110, -6, 'comet'], [34, 'golden']] },
  { amb: 'amb_desert', wx: [[0, 'sunbeams', .5, 0], [16, 'sand', .9, 1.4], [30, 'sunbeams', .5, 0]], ev: [[10, 'flyby', 'fx_phoenix', 150, 150, -3, 'phoenix'], [16, 'gust'], [34, 'rainbow']] },
  { amb: 'amb_underwater', wx: [[0, 'bubbles', .6, 0], [20, 'bubbles', 1, 0]], ev: [[9, 'flyby', 'fx_whale', 170, 230, -1.4, 'whale'], [22, 'shower'], [35, 'golden']] },
  { amb: 'amb_cave', wx: [[0, 'sparkle', .6, 0], [20, 'fog', .7, 0]], ev: [[12, 'shower'], [28, 'golden'], [38, 'flyby', 'fx_fairy', 220, 110, -2.2, 'fairy']] },
  { amb: 'amb_storm', wx: [[0, 'rain', .6, .6], [14, 'storm', 1, 1], [38, 'rain', .5, .4]], ev: [[20, 'gust'], [30, 'flyby', 'fx_comet', 110, 110, -7, 'comet'], [40, 'golden']] },
  { amb: 'amb_forest', wx: [[0, 'sunbeams', .4, 0], [18, 'fog', .5, 0], [34, 'sparkle', .5, 0]], ev: [[10, 'flyby', 'fx_fairy', 210, 110, -2.2, 'fairy'], [26, 'golden'], [40, 'shower']] },
  { amb: 'amb_breeze', wx: [[0, 'sparkle', .6, 0], [20, 'confetti', .8, .3]], ev: [[8, 'rainbow'], [18, 'flyby', 'fx_train', 170, 130, -3, 'train'], [30, 'shower'], [40, 'golden']] },
  { amb: 'amb_night', wx: [[0, 'sparkle', .5, 0], [20, 'fog', .6, 0], [40, 'meteors', .6, 0]], ev: [[14, 'flyby', 'fx_koi', 400, 150, -1.8, 'splash'], [30, 'golden'], [42, 'shower']] },
  { amb: 'amb_breeze', wx: [[0, 'petals', .5, .4], [20, 'petals', 1.2, 1.4], [38, 'petals', .6, .4]], ev: [[10, 'flyby', 'fx_dragon', 150, 210, -2.4, 'dragon'], [20, 'gust'], [36, 'golden']] },
  { amb: 'amb_waterfall', wx: [[0, 'sunbeams', .5, 0], [16, 'rain', .5, .3], [28, 'sunbeams', .6, 0]], ev: [[10, 'rainbow'], [22, 'flyby', 'fx_phoenix', 140, 150, -3, 'phoenix'], [32, 'rainbow'], [42, 'golden']] },
  { amb: 'amb_carnival', wx: [[0, 'sparkle', .5, 0], [10, 'fireworks', .8, 0]], ev: [[12, 'flyby', 'fx_airship', 150, 160, -1.6, 'airship'], [25, 'shower'], [38, 'golden']] },
  { amb: 'amb_breeze', wx: [[0, 'sunbeams', .6, 0], [18, 'pollen', .8, 1.3], [34, 'sunbeams', .5, 0]], ev: [[12, 'flyby', 'fx_airship', 150, 150, -1.8, 'airship'], [18, 'gust'], [30, 'rainbow'], [42, 'golden']] },
  { amb: 'amb_lava', wx: [[0, 'embers', .6, 0], [22, 'embers', 1.2, 0]], ev: [[20, 'eruption'], [30, 'flyby', 'fx_phoenix', 140, 170, -3, 'phoenix'], [44, 'golden']] },
  { amb: 'amb_space', wx: [[0, 'sparkle', .6, 0], [14, 'meteors', 1, 0]], ev: [[8, 'flyby', 'fx_whale', 180, 250, -1.2, 'whale'], [20, 'shower'], [32, 'flyby', 'fx_comet', 100, 110, -7, 'comet'], [44, 'golden']] },
  { amb: 'amb_forest', wx: [[0, 'leaves', .5, .4], [20, 'leaves', 1.2, 1.5], [36, 'rain', .4, .3]], ev: [[20, 'gust'], [30, 'golden'], [44, 'shower']] },
  { amb: 'amb_wind', wx: [[0, 'sunbeams', .5, 0], [20, 'wind', .9, 1.6], [38, 'sunbeams', .5, 0]], ev: [[8, 'flyby', 'fx_airship', 140, 180, -1.4, 'airship'], [20, 'gust'], [34, 'rainbow'], [44, 'golden']] },
  { amb: 'amb_city', wx: [[0, 'rain', .4, .2], [18, 'rain', .9, .4], [34, 'sparkle', .5, 0]], ev: [[12, 'flyby', 'fx_train', 150, 120, -3.4, 'train'], [36, 'shower'], [46, 'golden']] },
  { amb: 'amb_breeze', wx: [[0, 'petals', .5, .3], [24, 'confetti', .6, .3]], ev: [[10, 'golden'], [22, 'shower'], [34, 'rainbow']] },
  { amb: 'amb_wind', wx: [[0, 'snow', .5, .2], [20, 'snow', 1.3, 1.8], [38, 'sparkle', .6, 0]], ev: [[20, 'gust'], [30, 'flyby', 'fx_comet', 100, 110, -6, 'comet'], [44, 'golden']] },
  { amb: 'amb_workshop', wx: [[0, 'confetti', .4, 0], [24, 'confetti', .9, .3]], ev: [[10, 'flyby', 'fx_train', 180, 130, -3, 'train'], [26, 'shower'], [40, 'golden']] },
  { amb: 'amb_night', wx: [[0, 'embers', .5, 0], [20, 'fireworks', .7, 0]], ev: [[10, 'flyby', 'fx_dragon', 140, 210, -2.2, 'dragon'], [24, 'flyby', 'fx_koi', 400, 140, -1.6, 'splash'], [34, 'shower'], [46, 'golden']] },
  { amb: 'amb_jungle', wx: [[0, 'sunbeams', .5, 0], [16, 'rain', 1, .4], [32, 'fog', .6, 0]], ev: [[10, 'flyby', 'fx_fairy', 190, 110, -2, 'fairy'], [28, 'rainbow'], [44, 'golden']] },
  { amb: 'amb_desert', wx: [[0, 'sunbeams', .6, 0], [18, 'sand', 1.2, 2], [36, 'sunbeams', .5, 0]], ev: [[10, 'flyby', 'fx_phoenix', 150, 160, -3, 'phoenix'], [18, 'gust'], [30, 'shower'], [46, 'golden']] },
  { amb: 'amb_breeze', wx: [[0, 'sparkle', .6, 0], [20, 'fireworks', 1, 0], [36, 'petals', .6, .3]], ev: [[8, 'rainbow'], [16, 'flyby', 'fx_dragon', 140, 210, -2.4, 'dragon'], [26, 'flyby', 'fx_whale', 170, 230, -1.4, 'whale'], [36, 'shower'], [48, 'golden']] },
];
const BANNER = { rainbow: 'Rainbow bridge!', shower: 'Star shower!', golden: 'Something golden!', gust: 'Big gust of wind!', eruption: 'The volcano erupts!' };
const FLY_VOICE = { whale: 'vo_ev_whale' };
const WET = { rain: 1, storm: 1 };
let wxType = '', wxI = 0, windX = 0, gustUntil = 0, banner = null;

const stageOf = () => STAGES[ch] || STAGES[0];
const stageSec = () => t / 60;
function stageReset() { wxI = 0; windX = 0; gustUntil = 0; banner = null; wxType = ''; }

// Called every tick while playing (host and guest). host = true lets it spawn things and play the event sounds.
function stageTick(host) {
  const S = stageOf(), sec = stageSec(), live = !boss && !clear;
  let cur = S.wx[0];
  for (const w of S.wx) if (w[0] <= sec) cur = w;
  if (cur[1] !== wxType) { if (wxI > .15 && host && WET[cur[1]] && !WET[wxType]) sfx('surprise'); wxType = cur[1]; wxI = Math.min(wxI, .2); }
  wxI += ((boss ? cur[2] * .6 : cur[2]) - wxI) * .01;   // weather builds up slowly
  const wantWind = (cur[3] || 0) * (.6 + .4 * Math.sin(t / 90)) + (t < gustUntil ? 3.2 : 0);
  windX += (wantWind - windX) * .03;
  if (wxType === 'storm' && t % 260 === 130 && host) sfx('thunder');
  if (wxType === 'fireworks' && t % 70 === 0 && host) sfx('firework');
  if (!live) return;
  for (const e of S.ev) if (Math.round(e[0] * 60) === t) stageFire(e, host);
  if (banner && t > banner.until) banner = null;
}
function stageFire(e, host) {
  const k = e[1];
  banner = { text: k === 'flyby' ? '' : BANNER[k], until: t + 150 };
  if (k === 'gust') gustUntil = t + 240;
  if (!host) return;
  if (k === 'flyby') { sfx(e[6]); if (FLY_VOICE[e[6]]) voice(FLY_VOICE[e[6]]); else if ((ch + e[0]) % 3 === 0) voice('vo_ev_wow'); return; }
  sfx('surprise');
  if (k === 'rainbow') {   // an arc of rings to follow
    sfx('rainbow'); voice('vo_ev_rainbow');
    for (let i = 0; i < 14; i++) things.push({ kind: 'ring', x: W + 40 + i * 46, y: 330 - Math.sin(i / 13 * Math.PI) * 190, y0: 0, ph: 0, vx: -4, r: 16 });
  } else if (k === 'shower') {   // rings, stars and the odd heart fall from the sky
    voice('vo_ev_shower');
    for (let i = 0; i < 18; i++) things.push({ kind: i % 6 === 5 ? 'star' : i === 8 ? 'heart' : 'ring', x: 200 + Math.random() * (W - 160), y: -30 - i * 40, y0: 0, ph: 0, vx: -1.2, vy: 2.4, r: 16 });
  } else if (k === 'golden') {   // a golden version of a chapter enemy: tough, worth a lot, drops treasure
    sfx('golden'); voice('vo_ev_golden');
    const list = FOES[ch], kind = list[(ch + 1) % list.length], f = FOE[kind];
    things.push({ kind, foe: 1, golden: 1, hp: 8, x: W + 50, y: 200, y0: 200, ph: 1, vx: -2, r: f.r + 6, top: false, cd: 60, hit: 0 });
  } else if (k === 'gust') { sfx('gust'); voice('vo_ev_gust'); }
  else if (k === 'eruption') {   // shake + glowing rocks raining down
    sfx('eruption'); voice('vo_ev_eruption'); shake = 30;
    for (let i = 0; i < 8; i++) things.push({ kind: 'rock', x: 380 + i * 80, y: -40 - i * 70, y0: 0, ph: i, vx: -2.2, vy: 3.2 + (i % 3), r: 22 });
  }
}

// ---- drawing ----
// Behind the action: big fly-bys and fading rainbows.
function stageBack() {
  const S = stageOf();
  for (const e of S.ev) {
    const t0 = Math.round(e[0] * 60), dt = t - t0;
    if (e[1] === 'flyby' && dt >= 0) {
      const im = IMG[e[2]], h = e[4], x = W + 200 + e[5] * dt; if (!im || x < -400) continue;
      const w = h * im.width / im.height, y = e[3] + Math.sin(dt / 40) * 14 + (e[2] === 'fx_koi' ? -Math.sin(Math.min(1, dt / 260) * Math.PI) * 140 : 0);
      g.save(); g.globalAlpha = .92; g.translate(x, y); if (e[2] === 'fx_koi') g.rotate(-Math.cos(Math.min(1, dt / 260) * Math.PI) * .5);
      g.drawImage(im, -w / 2, -h / 2, w, h); g.restore();
      if (fx && dt % 4 === 0) sparks.push({ x: x + w / 2, y: y + (Math.random() - .5) * h * .5, vx: 1, vy: 0, l: 25, col: RAINBOW[(dt / 4 | 0) % 6] });
    }
    if (e[1] === 'rainbow' && dt >= 0 && dt < 600) {
      const a = Math.min(1, dt / 60, (600 - dt) / 90) * .55;
      g.globalAlpha = a; g.lineWidth = 14;
      RAINBOW.forEach((c, i) => { g.strokeStyle = c; g.beginPath(); g.arc(W / 2 + 120 - dt * .3, H + 140, 470 - i * 14, Math.PI, 0); g.stroke(); });
      g.globalAlpha = 1;
    }
  }
}
// In front of the action: weather particles, fog, darkness and lightning, and the surprise banner.
function stageFront() {
  const i = wxI * (fx ? 1 : .4), wnd = windX;
  if (i > .02) {
    const typ = wxType;
    if (typ === 'rain' || typ === 'storm') {
      g.fillStyle = `rgba(30,30,70,${(typ === 'storm' ? .28 : .12) * wxI})`; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(200,215,255,.45)'; g.lineWidth = 1.6; g.beginPath();
      const n = 110 * i; for (let k = 0; k < n; k++) { const x = (k * 53 + t * (9 + wnd)) % (W + 120) - 60, y = (k * 97 + t * 16) % (H + 40) - 20; g.moveTo(x, y); g.lineTo(x - 4 - wnd * 3, y + 18); }
      g.stroke();
      if (typ === 'storm' && t % 260 >= 130 && t % 260 < 138) {   // lightning
        g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(0, 0, W, H);
        g.strokeStyle = '#fff6a8'; g.lineWidth = 4; g.beginPath(); let x = 200 + ((t / 260 | 0) * 211) % 560, y = 0; g.moveTo(x, y);
        for (let s2 = 0; s2 < 7; s2++) { x += ((s2 * 41 + t) % 60) - 30; y += 46; g.lineTo(x, y); } g.stroke();
      }
    } else if (typ === 'snow') {
      g.fillStyle = '#fff'; const n = 90 * i;
      for (let k = 0; k < n; k++) { g.globalAlpha = .8; g.beginPath(); g.arc(((k * 61 - t * (wnd * 2 + .3)) % (W + 40) + W + 40) % (W + 40) - 20 + Math.sin(t / 30 + k) * 12, (k * 83 + t * (1 + k % 3 * .6)) % (H + 20) - 10, 1.5 + k % 3, 0, 7); g.fill(); }
      g.globalAlpha = 1; if (wxI > .8) { g.fillStyle = `rgba(240,248,255,${(wxI - .8) * .5})`; g.fillRect(0, 0, W, H); }   // whiteout
    } else if (typ === 'petals' || typ === 'leaves' || typ === 'pollen' || typ === 'confetti') {
      const cols = typ === 'petals' ? ['#ffc2dc', '#fff0f6', '#ff9ec8'] : typ === 'leaves' ? ['#e8743b', '#ffb347', '#c94f2d'] : typ === 'pollen' ? ['#ffd84a', '#fff3a0', '#ffb300'] : RAINBOW;
      const n = 50 * i;
      for (let k = 0; k < n; k++) {
        const x = ((k * 71 - t * (1 + wnd * 2.2)) % (W + 60) + W + 60) % (W + 60) - 30 + Math.sin(t / 25 + k) * 18, y = (k * 67 + t * (1 + k % 3 * .5)) % (H + 20) - 10;
        g.save(); g.translate(x, y); g.rotate(t / 20 + k); g.fillStyle = cols[k % cols.length];
        if (typ === 'confetti') g.fillRect(-4, -2, 8, 4); else { g.beginPath(); g.ellipse(0, 0, typ === 'pollen' ? 2.5 : 6, typ === 'pollen' ? 2.5 : 3.5, 0, 0, 7); g.fill(); }
        g.restore();
      }
    } else if (typ === 'sand' || typ === 'wind') {
      if (typ === 'sand') { g.fillStyle = `rgba(230,170,100,${.22 * wxI})`; g.fillRect(0, 0, W, H); }
      g.strokeStyle = typ === 'sand' ? 'rgba(255,220,160,.55)' : 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.beginPath();
      const n = 60 * i; for (let k = 0; k < n; k++) { const x = ((k * 89 - t * (8 + wnd * 4)) % (W + 200) + W + 200) % (W + 200) - 100, y = (k * 37) % H + Math.sin(t / 20 + k) * 6; g.moveTo(x, y); g.lineTo(x + 26 + wnd * 8, y); }
      g.stroke();
    } else if (typ === 'fog') {
      for (let b = 0; b < 3; b++) { const y = 140 + b * 140; for (let k = 0; k < reps(380); k++) { g.globalAlpha = .18 * wxI; g.fillStyle = '#f2ecff'; g.beginPath(); g.ellipse(sx(k, .5 + b * .4, 380), y + Math.sin(t / 60 + k + b) * 20, 240, 50, 0, 0, 7); g.fill(); } }
      g.globalAlpha = 1;
    } else if (typ === 'embers') {
      const n = 50 * i; for (let k = 0; k < n; k++) { g.globalAlpha = .8; g.fillStyle = k % 3 ? '#ffb36b' : '#ff6fd0'; g.beginPath(); g.arc(sx(k, .7, 30) + Math.sin(t / 22 + k) * 14, H - ((k * 53 + t * (1.2 + k % 3 * .6)) % (H + 20)), 2 + k % 2, 0, 7); g.fill(); }
      g.globalAlpha = 1; const q = g.createLinearGradient(0, H - 160, 0, H); q.addColorStop(0, 'rgba(255,90,60,0)'); q.addColorStop(1, `rgba(255,90,60,${.25 * wxI})`); g.fillStyle = q; g.fillRect(0, H - 160, W, 160);
    } else if (typ === 'meteors') {
      const n = Math.ceil(4 * i); g.lineCap = 'round';
      for (let k = 0; k < n; k++) { const ph = (t + k * 53) % 120; if (ph > 40) continue; const x0 = (k * 277 + (t / 120 | 0) * 191) % W + 200, y0 = (k * 61) % 160; const x = x0 - ph * 14, y = y0 + ph * 6;
        g.strokeStyle = lg(x, y, x + 90, y - 40, '#fff', 'rgba(255,255,255,0)'); g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 90, y - 40); g.stroke(); }
    } else if (typ === 'fireworks') {
      if (t % 70 === 0) for (let k = 0; k < 2; k++) boom(160 + ((t * 37 + k * 300) % (W - 320)), 70 + ((t * 13 + k * 90) % 160), RAINBOW[((t / 70 | 0) + k) % 6], fx ? 34 : 14);
    } else if (typ === 'bubbles') {
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.5; const n = 30 * i;
      for (let k = 0; k < n; k++) { g.beginPath(); g.arc(sx(k, .5, 40) + Math.sin(t / 20 + k) * 8, ((k * 83 - t * (1 + k % 3)) % H + H) % H, 3 + k % 4 * 2, 0, 7); g.stroke(); }
    } else if (typ === 'sunbeams') {
      g.save(); g.globalAlpha = .1 * wxI; g.fillStyle = '#fffbe0';
      for (let k = 0; k < 5; k++) { const x = 120 + k * 210 + Math.sin(t / 150 + k) * 40; g.beginPath(); g.moveTo(x, -10); g.lineTo(x + 70, -10); g.lineTo(x - 80, H); g.lineTo(x - 200, H); g.fill(); }
      g.restore();
    } else if (typ === 'sparkle') {
      for (let k = 0; k < 18 * i; k++) { const a = Math.abs(Math.sin(t / 20 + k * 1.3)); if (a > .5) sparkle(sx(k, .3, 60), (k * 97) % (H - 60) + 20, 3 + a * 3, a * .8); }
    }
  }
  if (Math.abs(windX) > .8 && fx) {   // wind streaks whenever it blows hard
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5; g.beginPath();
    for (let k = 0; k < 14; k++) { const x = ((k * 131 - t * (10 + windX * 4)) % (W + 200) + W + 200) % (W + 200) - 100, y = (k * 71) % H; g.moveTo(x, y); g.quadraticCurveTo(x + 30, y - 6, x + 60, y); }
    g.stroke();
  }
  if (banner && banner.text) {
    const a = Math.min(1, (banner.until - t) / 20);
    g.globalAlpha = a; panel(W / 2 - 170, 70, 340, 44, 22, lg(0, 70, 0, 114, '#fff3a0', '#ffb300'), '#fff'); txt(banner.text, W / 2, 100, 22, '#fff'); g.globalAlpha = 1;
  }
}
