// Pink Unicorn stage extras: per-chapter weather that changes during the level, wind, and timed surprises.
// Everything visual is worked out from (ch, t), so a guest device sees the same weather and fly-bys as the host;
// only the host spawns gameplay things (rings, golden enemies, falling rocks) and plays the event sounds.
//
// wx: weather timeline  [second, type, intensity, wind]   (wind pushes players backwards, in px per frame)
// ev: surprises         [second, kind, ...]
//     flyby:  [s, 'flyby', sprite, y, height, speed, sound]   a big friendly thing crossing the background
//     sight:  [s, 'sight', sprite, y, height, speed, sound, voice, banner, name]   like a fly-by, but fly close to say hi
//     rainbow / shower / golden / gust / eruption             see stageFire()
// amb: ambience loop for the chapter (assets/audio/<amb>.mp3)
const STAGES = [
  { amb: 'amb_breeze', wx: [[0, 'sunbeams', .6, 0], [25, 'sparkle', .6, 0]], ev: [[10, 'rainbow'], [22, 'golden'], [30, 'shower']] },
  { amb: 'amb_sea', wx: [[0, 'sunbeams', .4, 0], [20, 'rain', .45, .5], [32, 'sunbeams', .5, 0]], ev: [[8, 'flyby', 'fx_whale', 380, 190, -1.6, 'whale'], [33, 'rainbow'], [26, 'golden']] },
  { amb: 'amb_night', wx: [[0, 'sparkle', .4, 0], [15, 'meteors', .8, 0]], ev: [[10, 'flyby', 'fx_comet', 120, 110, -6, 'comet'], [18, 'shower'], [30, 'golden']] },
  { amb: 'amb_wind', wx: [[0, 'snow', .4, .3], [18, 'snow', 1, 1.4], [32, 'snow', .5, .3]], ev: [[17, 'gust'], [24, 'flyby', 'fx_comet', 100, 110, -6, 'comet'], [34, 'golden']] },
  { amb: 'amb_desert', wx: [[0, 'sunbeams', .5, 0], [16, 'sand', .9, 1.4], [30, 'sunbeams', .5, 0]], ev: [[10, 'flyby', 'fx_phoenix', 150, 150, -3, 'phoenix'], [16, 'gust'], [34, 'rainbow']] },
  { amb: 'amb_underwater', wx: [[0, 'sunbeams', .5, 0]], ev: [[3, 'sight', 'fx_turtle', 300, 170, -1.5, 'splash', 'vo_s_turtle', 'Look! A sea turtle!', 'turtle'], [10, 'rainbow'],   // reef ride (see "Reef ride" below)
    [15, 'sight', 'fx_dolphin', 230, 190, -2, 'splash', 'vo_s_dolphin', 'Dolphins!', 'dolphins'], [25, 'sight', 'fx_whale', 250, 230, -1.3, 'whale', 'vo_ev_whale', 'Look! A whale!', 'whale'], [31, 'shower'],
    [37, 'sight', 'fx_seahorse', 290, 150, -1.4, 'fairy', 'vo_s_seahorse', 'A tiny seahorse!', 'seahorse'], [43, 'rainbow'], [47, 'sight', 'fx_manta', 240, 200, -1.7, 'splash', 'vo_s_manta', 'Wow, a manta ray!', 'manta ray'], [50, 'golden']] },
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
let wxType = '', wxI = 0, windX = 0, gustUntil = 0, banner = null, sightMet = {};

const stageOf = () => STAGES[ch] || STAGES[0];
const stageSec = () => t / 60;
function stageReset() { wxI = 0; windX = 0; gustUntil = 0; banner = null; wxType = ''; sightMet = {}; }

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
  if (host) S.ev.forEach((e, i) => {   // a sea friend says hi when you fly close
    if (e[1] !== 'sight' || sightMet[i]) return; const q = sightPos(e);
    if (q && players.some(p => Math.hypot(p.x - q.x, p.y - q.y) < e[4] * .45 + 34)) meetSight(i, e, q);
  });
  if (banner && t > banner.until) banner = null;
}
function stageFire(e, host) {
  const k = e[1];
  banner = { text: k === 'flyby' ? '' : k === 'sight' ? e[8] : BANNER[k], until: t + 150 };
  if (k === 'gust') gustUntil = t + 240;
  if (!host) return;
  if (k === 'sight') { sfx(e[6]); voice(e[7]); return; }
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
    if (e[1] === 'sight' && dt >= 0) drawSight(e, S.ev.indexOf(e));
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
  if (state === 'play' && tour()) { panel(W - 216, 54, 204, 30, 15, 'rgba(122,26,99,.5)'); txt(`Sea friends ${stat.sights} / ${sightCount()}`, W - 114, 75, 16, '#fff'); }
  if (banner && banner.text) {
    const a = Math.min(1, (banner.until - t) / 20);
    g.globalAlpha = a; panel(W / 2 - 170, 70, 340, 44, 22, lg(0, 70, 0, 114, '#fff3a0', '#ffb300'), '#fff'); txt(banner.text, W / 2, 100, 22, '#fff'); g.globalAlpha = 1;
  }
}

// ---- Level polish: ribbon trail, glowing pickups, depth bokeh, vignette, boss mood, combo frame ----
const TRAIL = [[], []], GLOW = {};
const GLOW_COL = { ring: '255,216,74', heart: '255,111,168', star: '255,243,107' };
function glowSpr(rgb) {   // soft additive halo, drawn once per colour
  if (GLOW[rgb]) return GLOW[rgb];
  try {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const q = x.createRadialGradient(32, 32, 2, 32, 32, 32); q.addColorStop(0, `rgba(${rgb},.9)`); q.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = q; x.fillRect(0, 0, 64, 64); return GLOW[rgb] = c;
  } catch (e) { return GLOW[rgb] = null; }
}
let trailT = -1, vigA = null, vigB = null;
// Behind the characters: rainbow ribbon trails and halos behind everything collectible.
function polishBack() {
  if (state !== 'play') { TRAIL[0].length = TRAIL[1].length = 0; trailT = -1; return; }
  const keep = fx ? 24 : 10;
  if (t !== trailT && !paused) {
    trailT = t;
    players.forEach((p, i) => { const a = TRAIL[i] || (TRAIL[i] = []); for (const q of a) q[0] -= 7; a.push([0, p.y]); if (a.length > keep) a.shift(); });
  }
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  players.forEach((p, i) => {
    const a = TRAIL[i]; if (!a || a.length < 3) return;
    RAINBOW.forEach((c, b) => {
      g.strokeStyle = c; g.lineWidth = 4; g.globalAlpha = .55; g.beginPath();
      a.forEach((q, k) => { const x = p.x + q[0] - 36, y = q[1] + (b - 2.5) * 4.2 + 8; k ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.stroke();
    });
  });
  g.restore();
  if (!fx) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const o of things) {
    const rgb = GLOW_COL[o.kind] || (POW.includes(o.kind) ? '140,240,255' : null); if (!rgb) continue;
    const im = glowSpr(rgb); if (!im) continue;
    const r = 34 + 6 * Math.sin(t / 8 + o.x / 50); g.globalAlpha = .5 + .2 * Math.sin(t / 6 + o.x / 40);
    g.drawImage(im, o.x - r, o.y - r, r * 2, r * 2);
  }
  g.restore();
}
// In front of everything but the HUD.
function polishFront() {
  if (state !== 'play') return;
  if (fx) {   // big soft bokeh drifting past in the foreground gives the scene depth
    const im = glowSpr('255,244,255');
    if (im) { g.save(); g.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 7; k++) { const r = 40 + (k * 17) % 44; g.globalAlpha = .3 + .15 * Math.sin(t / 40 + k); g.drawImage(im, sx(k, 2.6, 170) - r, 60 + (k * 131) % (H - 120) + Math.sin(t / 70 + k) * 18 - r, r * 2, r * 2); }
      g.restore(); }
  }
  if (!vigA) {
    vigA = g.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.0); vigA.addColorStop(0, 'rgba(40,0,60,0)'); vigA.addColorStop(1, 'rgba(40,0,60,.36)');
    vigB = g.createRadialGradient(W / 2, H / 2, H * .4, W / 2, H / 2, H * .95); vigB.addColorStop(0, 'rgba(255,40,160,0)'); vigB.addColorStop(1, 'rgba(255,40,160,.55)');
  }
  g.fillStyle = vigA; g.fillRect(0, 0, W, H);
  if (boss && !clear) { g.globalAlpha = .45 + .35 * Math.sin(t / 14); g.fillStyle = vigB; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }   // boss-fight pulse
  if (combo >= 5) {   // rainbow frame that grows brighter with the combo
    g.save(); g.lineWidth = 8; g.strokeStyle = `hsl(${t * 5 % 360},95%,65%)`; g.globalAlpha = Math.min(.55, combo / 24); g.strokeRect(0, 0, W, H); g.restore();
  }
}

// ---- Reef ride (Coral Reef, CHAPTERS[i].tour): a gentle sightseeing chapter for small players ----
// Mermaid rides on the unicorn's back. Big sea friends swim past (fly close to say hi), stars steer themselves
// toward the few slow grumpy fish, and a bump just gives you a fright: no hearts are lost.
const sightCount = () => (STAGES[ch] || STAGES[0]).ev.filter(e => e[1] === 'sight').length;
function sightPos(e) {
  const dt = t - Math.round(e[0] * 60); if (dt < 0) return null;
  const x = W + 200 + e[5] * dt; if (x < -320) return null;
  return { x, y: e[3] + Math.sin(dt / 40) * 14, dt };
}
function meetSight(i, e, q) {
  sightMet[i] = t; stat.sights++; score += 100; addMeter(10);
  sfx('heart'); boom(q.x, q.y, '#ff8fc2', 24); boom(q.x, q.y, '#fff', 14); pop(q.x, q.y - e[4] * .5, 'Hi, ' + e[9] + '!  +100', '#fff36b');
  if (stat.sights === sightCount()) { pop(W / 2, 150, 'You met all the sea friends!', '#fff36b'); sfx('win'); bark('vo_ev_wow', 1); }
}
function drawSight(e, i) {
  const im = IMG[e[2]], q = sightPos(e); if (!im || !q) return;
  const h = e[4], w = h * im.width / im.height, met = sightMet[i], wig = met ? Math.sin((t - met) / 5) * Math.max(0, 1 - (t - met) / 90) * .25 : 0;
  if (!met && fx) { const gl = glowSpr('255,244,190'); if (gl) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .55 + .2 * Math.sin(t / 8); g.drawImage(gl, q.x - w * .62, q.y - h * .62, w * 1.24, h * 1.24); g.restore(); } }
  g.save(); g.translate(q.x, q.y); g.rotate(wig); g.drawImage(im, -w / 2, -h / 2, w, h); g.restore();
  if (!met && q.x < W + 40 && q.x > -40) { panel(q.x - 46, q.y - h / 2 - 34, 92, 26, 13, 'rgba(255,111,168,.85)', '#fff'); txt('Say hi!', q.x, q.y - h / 2 - 15, 15, '#fff'); }
  if (met && t % 24 === 0 && q.x > -60 && q.x < W + 60) sparks.push({ x: q.x + (Math.random() - .5) * w * .5, y: q.y - h * .4, vx: 0, vy: -1.2, l: 40, col: '#ff8fc2' });
}
function tourSpawn() {   // lots of rings (in little rows), a few slow grumpy fish and jellies, nothing sharp
  const r = Math.random(), y = 80 + Math.random() * (H - 180);
  if (r < .24) { const k = Math.random() < .5 ? 'jelly' : 'fish', f = FOE[k]; things.push({ kind: k, foe: 1, hp: 2, x: W + 40, y, y0: y, ph: Math.random() * 6, vx: -1.5, r: f.r, top: false, cd: 60, hit: 0 }); return; }
  if (r < .78) { for (let i = 0; i < 3; i++) { things.push({ kind: 'ring', x: W + 30 + i * 44, y, y0: y, ph: 0, vx: -2.4, r: 16 }); stat.ringsAll++; } return; }
  const kind = r < .87 ? (lives < maxLives() ? 'heart' : 'star') : r < .94 ? 'star' : POW[Math.random() * 3 | 0];   // no bombs needed here
  things.push({ kind, x: W + 30, y, y0: y, ph: Math.random() * 6, vx: -2.4, r: 16 });
}
function tourFoe(o) {   // grumpy fish drift toward the riders, slowly, so there is something to protect Mermaid from
  const p = nearest(o); if (o.x > p.x + 60) o.y0 += Math.max(-.45, Math.min(.45, (p.y - o.y0) * .006));
}
function homeShot(s) {   // turn a little toward the nearest grumpy fish ahead (or the boss)
  let best = null, bd = 460;
  for (const o of things) if (o.foe && !o.dead && o.x > s.x) { const d = Math.hypot(o.x - s.x, o.y - s.y); if (d < bd) { bd = d; best = o; } }
  if (!best && boss && !clear && boss.x > s.x) best = boss;
  if (!best) return;
  const sp = Math.hypot(s.vx, s.vy || 0) || 10, a = Math.atan2(best.y - s.y, best.x - s.x), c = Math.atan2(s.vy || 0, s.vx);
  let d = a - c; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283;
  const n = c + Math.max(-.08, Math.min(.08, d)); s.vx = Math.cos(n) * sp; s.vy = Math.sin(n) * sp;
}
function bump(p) {   // a fright instead of a lost heart
  p.flash = 70; combo = 0; stat.hits++; shake = 5; buzz(30); sfx('boing'); pop(p.x, p.y - 84, 'Eek!', '#bfefff');
  if (players.length === 1) bark('vo_s_eek', .9);
}
function drawRider() {   // Mermaid sitting on the unicorn's back (drawn inside the unicorn's transform)
  const b = Math.sin(t / 10) * 2;
  if (spr('rider', -10, -27 + b, 66)) return;
  g.save(); g.translate(-12, -46 + b); g.scale(.6, .6); drawMermaid(0, 0); g.restore();
}

// ---- Castle Garden: the last stage, after the castle. No flying and almost no enemies: the unicorn walks, hops,
// eats treats, plays with friends and walks home through the castle gate, which starts the ending. ----
const GW = 3950, GY = H - 66;   // garden width, and the ground line where hooves touch
const WALK_ART = ['bg_walk', 'uni_stand', 'uni_eat', 'tree_apple', 'food_apple', 'food_cupcake', 'food_carrot', 'obj_mushroom', 'pal_bunny', 'obj_chest', 'obj_gate', 'isle_27', 'happy_0', 'happy_4', 'happy_9', 'happy_14', 'happy_21'];
const PALS = [[0, "I'm not grumpy anymore. Thank you!"], [4, 'This garden is so pretty!'], [9, "Have a cupcake! They're sweet now!"], [14, 'I planted sunflowers for you!'], [21, 'Brrr... I mean, hooray!']];
let wk = null, walkOpen = false;
try { walkOpen = localStorage.getItem('pinkUnicornWalk') === '1'; } catch (e) {}
function startWalk() {
  WALK_ART.forEach(loadArt); walkOpen = true; saveOpt('pinkUnicornWalk', 1);
  go(() => { state = 'walk'; t = 0; paused = false; things = []; shots = []; bolts = []; boss = null; clear = 0; sparks = []; pops = []; wk = makeWalk(); sfx('start'); }, 'The Castle Garden');
}
function makeWalk() {
  const food = (k, x, y) => ({ k, x, y: y || GY - 16, vy: 0 });
  return {
    x: 150, y: GY, vx: 0, vy: 0, ground: true, face: 1, eat: 0, jumps: 0, cam: 0, tx: null, squash: 0, fp: 0, belly: 0, bumpT: 0, splashT: 0, end: 0,
    yum: 0, met: 0, chestOpen: 0, treeShake: 0, treeCd: 0,
    food: [food('apple', 1250), food('apple', 1360), food('cupcake', 2440), food('cupcake', 2500), food('cupcake', 2560), food('carrot', 2860), food('carrot', 2920), food('carrot', 2980), food('cupcake', 2330, GY - 330)],
    flowers: RAINBOW.map((col, i) => ({ x: 760 + i * 62, col, note: i + 2, on: false, bounce: 0 })),
    bunnies: [{ x: 1620, x0: 1620, y: GY, vy: 0, met: false, f: -1 }, { x: 1720, x0: 1720, y: GY, vy: 0, met: false, f: -1 }],
    pals: PALS.map(([n, line], i) => ({ n, line, x: 2960 + i * 105, y: GY - 120 - (i % 2) * 40, met: false, talk: 0 })),
    clouds: [{ x0: 2150, y0: GY - 250, happy: 0, ph: 0 }, { x0: 2760, y0: GY - 240, happy: 0, ph: 2 }],
    rings: [...[2050, 2090, 2130].map(x => ({ x, y: GY - 250 })), ...[2580, 2620, 2660].map(x => ({ x, y: GY - 240 })), ...[700, 1000, 1500, 1850].map(x => ({ x, y: GY - 120 }))],
    mush: [{ x: 1960, sq: 0 }, { x: 2250, sq: 0 }],
    plats: [{ x: 2090, y: GY - 205, w: 180 }, { x: 2340, y: GY - 300, w: 180 }, { x: 2620, y: GY - 195, w: 180 }],
  };
}
const MUSH_TOP = GY - 98, TREE_X = 1300, POND = [420, 620], CHEST_X = 3480, GATE_X = 3760;
function walkAim(x) { if (wk) wk.tx = wk.cam + x; }
function walkJump() {
  const w = wk; if (!w || w.eat > 0 || w.end) return;
  if (w.ground) { w.vy = -12.5; w.ground = false; w.jumps = 1; sfx('flap'); }
  else if (w.jumps < 2) { w.vy = -10.5; w.jumps = 2; sfx('flap'); boom(w.x - w.face * 24, w.y - 50, '#fff', 10); }   // a flutter of the wings: double jump
}
function walkUpdate() {
  t++; const w = wk; if (!w) return;
  const kd = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0) + (padX[0] || 0);
  let want = 0;
  if (kd) { want = Math.max(-1, Math.min(1, kd)); w.tx = null; }
  else if (w.tx != null) { const d = w.tx - w.x; want = Math.abs(d) > 16 ? Math.sign(d) * Math.min(1, Math.abs(d) / 70) : 0; }
  if (w.eat > 0) { w.eat--; want = 0; }
  if (w.bumpT > 0) w.bumpT--;
  if (w.end) want = 1;
  w.vx += (want * 4.6 - w.vx) * (w.ground ? .2 : .08);
  if (Math.abs(w.vx) > .4) w.face = w.vx > 0 ? 1 : -1;
  w.vy = Math.min(14, w.vy + .6);
  const oy = w.y; w.x = Math.max(60, Math.min(GW - 40, w.x + w.vx)); w.y += w.vy; w.ground = false;
  const land = y => { if (w.vy > 6) { w.squash = 10; boom(w.x, y, '#fff', 6); } w.y = y; w.vy = 0; w.ground = true; w.jumps = 0; };
  if (w.y >= GY) land(GY);
  for (const p of w.plats) if (w.vy >= 0 && oy <= p.y && w.y >= p.y && Math.abs(w.x - p.x) < p.w / 2) land(p.y);
  for (const m of w.mush) if (w.vy > 0 && oy <= MUSH_TOP && w.y >= MUSH_TOP && Math.abs(w.x - m.x) < 54) {   // bouncy mushroom
    w.y = MUSH_TOP; w.vy = -19; w.jumps = 1; m.sq = 14; sfx('boing', 2); pop(m.x, MUSH_TOP - 40, 'Boing!', '#fff36b'); score += 10;
  }
  if (w.squash > 0) w.squash--;
  w.fp += w.ground ? Math.abs(w.vx) * .05 : .35;
  w.cam += (Math.max(0, Math.min(GW - W, w.x - W * .42)) - w.cam) * .12;
  const mouthX = w.x + w.face * 34, mouthY = w.y - 34;
  // treats: walk into them to munch
  for (const f of w.food) {
    if (f.got) continue;
    if (f.vy || f.y < GY - 16 && f.k === 'apple') { f.vy += .45; f.y = Math.min(GY - 16, f.y + f.vy); if (f.y >= GY - 16) { f.vy = 0; boom(f.x, f.y + 10, '#79e08a', 4); } }
    if (Math.abs(mouthX - f.x) < 42 && Math.abs(mouthY - f.y) < 64) {
      f.got = 1; w.yum++; w.eat = 34; w.belly = Math.min(.14, w.belly + .02); score += 30;
      sfx('munch'); boom(f.x, f.y, f.k === 'carrot' ? '#ffa94d' : f.k === 'apple' ? '#ff6b6b' : '#ff9ec8', 14); pop(f.x, f.y - 40, 'Yum!', '#fff36b');
      bark(w.yum % 2 ? 'vo_w_yum' : 'vo_w_munch', .7);
    }
  }
  // the apple tree drops apples when you bump or hop into it
  if (w.treeCd > 0) w.treeCd--; if (w.treeShake > 0) w.treeShake--;
  if (!w.treeCd && Math.abs(w.x - TREE_X) < 70 && (!w.ground || Math.abs(w.vx) > 2) && w.food.filter(f => f.k === 'apple' && !f.got).length < 5) {
    w.treeCd = 200; w.treeShake = 24; sfx('pop');
    for (let i = 0; i < 3; i++) w.food.push({ k: 'apple', x: TREE_X - 70 + i * 70, y: GY - 250 + (i % 2) * 30, vy: .5 });
  }
  // music flowers: each plays a note when you step on it
  for (const f of w.flowers) { const on = Math.abs(w.x - f.x) < 26 && w.y > GY - 30; if (on && !f.on) { sfx('chime', f.note); f.bounce = 12; boom(f.x, GY - 40, f.col, 8); score += 5; } f.on = on; if (f.bounce > 0) f.bounce--; }
  // the pond: splash!
  if (w.splashT > 0) w.splashT--;
  if (w.x > POND[0] && w.x < POND[1] && w.ground && w.y >= GY - 2 && Math.abs(w.vx) > 1 && !w.splashT) { w.splashT = 40; sfx('splash'); for (let i = 0; i < 10; i++) sparks.push({ x: w.x, y: GY - 6, vx: (Math.random() - .5) * 6, vy: -3 - Math.random() * 4, l: 34, col: '#9fe9ff' }); }
  // bunnies hop about; say hi and they hop along behind you
  w.bunnies.forEach((b, i) => {
    const goal = b.met ? w.x - w.face * (90 + i * 46) : b.x0 + Math.sin(t / 120 + i * 3) * 50;
    if (b.y >= GY && t % 50 === (i * 20) % 50) { b.vy = -6; b.f = goal < b.x ? -1 : 1; }
    if (b.y < GY || b.vy < 0) { b.vy += .5; b.y = Math.min(GY, b.y + b.vy); b.x += Math.max(-4, Math.min(4, (goal - b.x) * .04)); }
    if (!b.met && Math.abs(w.x - b.x) < 60 && w.y > GY - 80) { b.met = true; w.met++; score += 60; sfx('heart'); boom(b.x, b.y - 30, '#ff8fc2', 18); pop(b.x, b.y - 70, 'Hi, bunny!', '#fff36b'); bark('vo_w_hello', .8); }
  });
  // cheered-up bosses waiting in the garden
  for (const p of w.pals) { if (p.talk > 0) p.talk--; if (!p.met && Math.abs(w.x - p.x) < 80) { for (const o of w.pals) o.talk = 0; p.met = true; p.talk = 220; w.met++; score += 60; sfx('friend'); boom(p.x, p.y, '#fff36b', 18); bark('vo_w_hello', .8); } }
  // two grumpy rain clouds: hop on top to cheer them up; bumping into one just gets you wet
  for (const c of w.clouds) {
    c.x = c.x0 + Math.sin(t / 110 + c.ph) * 120; c.y = c.y0 + Math.sin(t / 40 + c.ph) * 10;
    if (c.happy) continue;
    if (w.vy > 1 && Math.abs(w.x - c.x) < 56 && w.y > c.y - 46 && w.y < c.y + 6) { c.happy = t; w.vy = -13; w.jumps = 1; sfx('boing', 3); sfx('rainbow'); boom(c.x, c.y, '#fff36b', 20); pop(c.x, c.y - 50, 'Cheered up!', '#fff36b'); score += 80; }
    else if (!w.bumpT && Math.abs(w.x - c.x) < 50 && Math.abs(w.y - 50 - c.y) < 46) { w.bumpT = 50; w.vx = -w.face * 6; w.vy = Math.min(w.vy, -4); sfx('boing'); pop(w.x, w.y - 110, 'Brrr, wet!', '#bfefff'); }
  }
  // rings
  for (const r of w.rings) if (!r.got) {
    if (r.vy !== undefined) { r.vy += .4; r.y += r.vy; r.x += r.vx; if (r.y > GY - 20) { r.y = GY - 20; r.vy = -r.vy * .4; r.vx *= .6; if (Math.abs(r.vy) < 1) { r.vy = 0; r.vx = 0; } } }
    if (Math.hypot(w.x - r.x, w.y - 50 - r.y) < 52) { r.got = 1; wallet++; score += 10; sfx('ring', 1 + w.rings.filter(q => q.got).length % 10); boom(r.x, r.y, '#ffc400', 8); }
  }
  // the treasure chest
  if (!w.chestOpen && Math.abs(w.x - CHEST_X) < 60) {
    w.chestOpen = t; score += 300; sfx('golden'); voice('vo_w_treasure'); boom(CHEST_X, GY - 50, '#ffe45c', 30); pop(CHEST_X, GY - 150, 'Treasure!  +300', '#fff36b');
    for (let i = 0; i < 12; i++) w.rings.push({ x: CHEST_X, y: GY - 60, vx: (Math.random() - .5) * 9, vy: -8 - Math.random() * 5 });
  }
  // walk through the castle gate to go home
  if (!w.end && w.x > GATE_X) { w.end = t; saveShop(); saveBest(); sfx('win'); voice('vo_w_home'); }
  if (w.end && t - w.end === 80) startEnding();
  if (t === 70) voice('vo_w_start');
  if (t === 260) voice('vo_w_pond');
}
function drawWalk() {
  const w = wk, q = g.createLinearGradient(0, 0, 0, H); q.addColorStop(0, '#bfe8ff'); q.addColorStop(1, '#ffe6f4'); g.fillStyle = q; g.fillRect(0, 0, W, H);
  if (!w) { txt('Your friend is playing in the Castle Garden!', W / 2, H / 2, 24, '#fff'); return; }
  const cam = w.cam, im = IMG.bg_walk;
  if (im) {   // painted meadow, mirrored so it never runs out, drifting slower than the ground (parallax)
    const mc = mirrorCanvas(im) || im, w2 = H * mc.width / mc.height, off = -((cam * .3) % w2);
    for (let x = off; x < W; x += w2) g.drawImage(mc, x, 0, w2 + .5, H);
  } else { hills('#a8e6a0', GY - 60, 30, 0, 160); hills('#79c96e', GY - 20, 20, 0, 120); }
  g.save(); g.translate(-cam, 0);
  // the ground: a soft lawn with grass tufts and little flowers
  const gq = g.createLinearGradient(0, GY - 10, 0, H); gq.addColorStop(0, '#9be36e'); gq.addColorStop(1, '#4fae4a'); g.fillStyle = gq;
  g.beginPath(); g.moveTo(cam - 20, H); for (let x = Math.floor(cam / 30) * 30 - 30; x < cam + W + 40; x += 30) g.lineTo(x, GY - 4 - 4 * Math.sin(x / 47)); g.lineTo(cam + W + 40, H); g.closePath(); g.fill();
  g.strokeStyle = '#6cc552'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath();
  for (let x = Math.floor(cam / 22) * 22; x < cam + W + 22; x += 22) { const y = GY - 4 - 4 * Math.sin(x / 47), k = (x / 22) | 0; g.moveTo(x, y + 4); g.lineTo(x - 3 + k % 3 * 3, y - 6 - k % 4 * 2); }
  g.stroke();
  for (let x = Math.floor(cam / 46) * 46; x < cam + W + 46; x += 46) { if (x > POND[0] - 20 && x < POND[1] + 20) continue; const k = (x / 46) | 0; g.fillStyle = ['#fff', '#ffe45c', '#ff9ec8', '#b18cff'][k % 4]; g.beginPath(); g.arc(x + (k * 13) % 20, GY + 14 + (k * 7) % 30, 3, 0, 7); g.fill(); }
  // the pond and Mermaid sitting on her rock
  const pc = (POND[0] + POND[1]) / 2, pw = (POND[1] - POND[0]) / 2;
  g.fillStyle = '#3fa7e0'; g.beginPath(); g.ellipse(pc, GY + 16, pw + 6, 30, 0, 0, 7); g.fill();
  const pq = g.createLinearGradient(0, GY - 12, 0, GY + 44); pq.addColorStop(0, '#9fe9ff'); pq.addColorStop(1, '#3fb4ec'); g.fillStyle = pq; g.beginPath(); g.ellipse(pc, GY + 14, pw, 25, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; for (let k = 0; k < 3; k++) { const rx = pc - 60 + k * 50 + Math.sin(t / 30 + k) * 8; g.beginPath(); g.ellipse(rx, GY + 12 + k * 5, 22, 4, 0, 0, 7); g.stroke(); }
  g.fillStyle = '#8f86a8'; g.beginPath(); g.ellipse(568, GY + 2, 44, 24, 0, 0, 7); g.fill(); g.fillStyle = '#a99fc2'; g.beginPath(); g.ellipse(560, GY - 4, 34, 15, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(550, GY - 10, 14, 5, -.2, 0, 7); g.fill();
  g.save(); g.translate(568, GY - 46 + Math.sin(t / 20) * 3); g.scale(.9, .9); if (!spr('rider', 0, 0, 92)) drawMermaid(0, 0); g.restore();
  if (t > 260 && t < 470) bubble(568, GY - 170, "I'll splash in the pond. Have fun!", Math.min(1, (t - 260) / 12), false);
  // music flowers
  for (const f of w.flowers) { const b = f.bounce > 0 ? Math.sin(f.bounce / 12 * Math.PI) * 10 : 0;
    g.strokeStyle = '#3f9b3f'; g.lineWidth = 4; g.beginPath(); g.moveTo(f.x, GY); g.lineTo(f.x, GY - 46 - b); g.stroke();
    g.fillStyle = f.col; g.beginPath(); g.moveTo(f.x - 16, GY - 64 - b); g.lineTo(f.x - 16, GY - 44 - b); g.quadraticCurveTo(f.x, GY - 34 - b, f.x + 16, GY - 44 - b); g.lineTo(f.x + 16, GY - 64 - b); g.lineTo(f.x + 8, GY - 54 - b); g.lineTo(f.x, GY - 66 - b); g.lineTo(f.x - 8, GY - 54 - b); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(f.x - 6, GY - 52 - b, 3, 6, 0, 0, 7); g.fill(); if (f.bounce) sparkle(f.x + 12, GY - 74 - b, 6, .9); }
  // apple tree
  g.save(); g.translate(TREE_X, GY + 8); g.rotate(w.treeShake ? Math.sin(w.treeShake) * .04 : 0);
  if (!spr('tree_apple', 0, -170, 340)) { g.fillStyle = '#8a5a3a'; g.fillRect(-16, -170, 32, 170); g.fillStyle = '#5fbf4f'; g.beginPath(); g.arc(0, -220, 110, 0, 7); g.fill(); }
  g.restore();
  // cloud platforms, mushrooms, the chest, the gate
  for (const p of w.plats) { cloud(p.x, p.y + 14, 1.5, .95); sparkle(p.x + 50, p.y - 2, 4, .5 + .4 * Math.sin(t / 9 + p.x)); }
  for (const m of w.mush) { const s = m.sq > 0 ? Math.sin(m.sq / 14 * Math.PI) * .25 : 0; if (m.sq > 0) m.sq--;
    g.save(); g.translate(m.x, GY + 4); g.scale(1 + s, 1 - s); if (!spr('obj_mushroom', 0, -56, 112)) { g.fillStyle = '#fff4e0'; g.fillRect(-14, -50, 28, 50); g.fillStyle = '#ff5f6d'; g.beginPath(); g.arc(0, -50, 52, Math.PI, 0); g.fill(); } g.restore(); }
  g.save(); g.translate(CHEST_X, GY + 4); if (w.chestOpen) { g.globalCompositeOperation = 'lighter'; const gl = glowSpr('255,220,120'); if (gl) g.drawImage(gl, -90, -150, 180, 180); g.globalCompositeOperation = 'source-over'; }
  if (!spr('obj_chest', 0, -42, 84)) { g.fillStyle = '#b8763a'; rr(-40, -70, 80, 66, 10); g.fill(); g.fillStyle = '#ffd36b'; g.fillRect(-6, -48, 12, 16); } g.restore();
  if (!spr('obj_gate', GATE_X + 40, GY - 150, 310)) { g.fillStyle = '#f7a6d4'; g.fillRect(GATE_X - 60, GY - 260, 200, 260); g.fillStyle = '#fff0b0'; rr(GATE_X - 10, GY - 180, 100, 180, 50); g.fill(); }
  if (!w.end) { const by = GY - 340 + Math.sin(t / 15) * 6; panel(GATE_X - 25, by, 130, 34, 17, 'rgba(232,39,154,.85)', '#fff'); txt('Home ➜', GATE_X + 40, by + 24, 18, '#fff'); }
  // grumpy (or cheered-up) clouds
  for (const c of w.clouds) {
    if (c.happy) { g.lineWidth = 6; g.globalAlpha = Math.min(.8, (t - c.happy) / 40); RAINBOW.forEach((col, i) => { g.strokeStyle = col; g.beginPath(); g.arc(c.x, c.y + 40, 70 - i * 6, Math.PI, 0); g.stroke(); }); g.globalAlpha = 1; cloud(c.x, c.y, 1.1, 1); eye(c.x - 10, c.y + 2, 4, 0); eye(c.x + 10, c.y + 2, 4, 0); continue; }
    g.strokeStyle = 'rgba(120,170,255,.7)'; g.lineWidth = 2; for (let r = 0; r < 5; r++) { const ry = (t * 3 + r * 17) % 60; g.beginPath(); g.moveTo(c.x - 24 + r * 12, c.y + 26 + ry); g.lineTo(c.x - 26 + r * 12, c.y + 34 + ry); g.stroke(); }
    if (!spr('haz_cloud', c.x, c.y, 86)) { blob(c.x, c.y, 1.1, '#a9a3c4'); eye(c.x - 9, c.y + 2, 4, 2); eye(c.x + 9, c.y + 2, 4, 2); }
  }
  // rings, treats, friends
  for (const r of w.rings) if (!r.got) { g.save(); g.translate(r.x, r.y); g.scale(Math.abs(Math.cos(t / 14 + r.x / 90)) * .7 + .3, 1); if (!spr('pick_ring', 0, 0, 34)) { g.strokeStyle = '#ffb300'; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 13, 0, 7); g.stroke(); } g.restore(); }
  for (const f of w.food) if (!f.got) { const bob = f.vy ? 0 : Math.sin(t / 12 + f.x) * 2; if (!spr('food_' + f.k, f.x, f.y + bob, f.k === 'carrot' ? 50 : 40)) { g.fillStyle = f.k === 'carrot' ? '#ff8a3d' : f.k === 'apple' ? '#ff4d5e' : '#ff9ec8'; g.beginPath(); g.arc(f.x, f.y, 14, 0, 7); g.fill(); } if ((t + f.x) % 60 < 10) sparkle(f.x + 12, f.y - 14, 5, .9); }
  for (const b of w.bunnies) { g.fillStyle = 'rgba(40,60,30,.2)'; g.beginPath(); g.ellipse(b.x, GY + 4, 24, 6, 0, 0, 7); g.fill(); if (!spr('pal_bunny', b.x, b.y - 30, 62, b.f > 0)) { g.fillStyle = '#fff'; g.beginPath(); g.arc(b.x, b.y - 20, 18, 0, 7); g.fill(); } if (!b.met && t % 40 < 20) txt('?', b.x, b.y - 72, 18, '#fff'); }
  for (const p of w.pals) { const y = p.y + Math.sin(t / 25 + p.x) * 8; g.fillStyle = 'rgba(40,60,30,.18)'; g.beginPath(); g.ellipse(p.x, GY + 4, 50, 9, 0, 0, 7); g.fill(); happySaucer(p.x, y, HULLS[p.n % 8], .62, p.n); if (p.talk > 0) bubble(p.x, y - 110, p.line, Math.min(1, (220 - p.talk) / 12), true); }
  // the unicorn: standing, walking, munching, or fluttering in the air
  { const s = 1.02, sq = w.squash > 0 ? Math.sin(w.squash / 10 * Math.PI) * .18 : 0, walkBob = w.ground && Math.abs(w.vx) > .6 ? Math.abs(Math.sin(w.fp)) * 5 : 0;
    { const k = Math.max(.35, 1 - (GY - w.y) / 400); g.fillStyle = `rgba(40,60,30,${.25 * k})`; g.beginPath(); g.ellipse(w.x, (w.ground ? w.y : GY) + 4, 50 * k, 10 * k, 0, 0, 7); g.fill(); }
    if (!(w.bumpT && t % 8 < 4)) {
      g.save(); g.translate(w.x, w.y - walkBob); g.scale(w.face * s * (1 + w.belly + sq), s * (1 - sq));
      if (!w.ground) { g.rotate(Math.max(-.25, Math.min(.25, w.vy * .02))); drawUnicorn(0, -58, false, w.fp); }
      else if (!(w.eat > 0 ? spr('uni_eat', 6, -46, 92) : spr('uni_stand', 0, -60, 120))) drawUnicorn(0, -58, false, 0);
      g.restore();
      if (w.eat > 0 && w.eat % 8 < 4) txt('munch', w.x + w.face * 50, w.y - 110, 14, '#fff');
    } }
  for (const p of sparks) { g.globalAlpha = Math.max(0, p.l / 30); g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, 2.6, 0, 7); g.fill(); } g.globalAlpha = 1;
  for (const q2 of pops) { g.globalAlpha = Math.min(1, q2.l / 20); txt(q2.str, q2.x, q2.y, 20, q2.col); } g.globalAlpha = 1;
  g.restore();
  // HUD: score, and the three garden goals
  panel(10, 10, 170, 40, 20, 'rgba(122,26,99,.45)'); g.font = 'bold 22px "Trebuchet MS", sans-serif'; g.textAlign = 'left'; g.fillStyle = '#fff'; g.fillText(score, 50, 38);
  g.save(); g.translate(32, 30); g.strokeStyle = '#ffc94a'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 8, 0, 7); g.stroke(); g.restore();
  const chip = (x, icon, label, done) => { panel(x - 78, 12, 156, 36, 18, done ? 'rgba(80,200,120,.75)' : 'rgba(122,26,99,.45)'); if (!spr(icon, x - 52, 30, 28)) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 52, 30, 9, 0, 7); g.fill(); } txt(label, x + 12, 37, 17, '#fff'); };
  chip(W / 2 - 170, 'food_apple', `Yum ${w.yum}`, w.yum >= 5); chip(W / 2, 'pal_bunny', `Friends ${w.met}/${w.bunnies.length + w.pals.length}`, w.met >= w.bunnies.length + w.pals.length); chip(W / 2 + 170, 'obj_chest', w.chestOpen ? 'Found!' : 'Treasure', !!w.chestOpen);
  if (t < 600 && !w.end) { const tip = t < 300 ? (touchUI ? 'Drag to walk · tap to hop (tap again to flutter)' : 'Walk: arrows, A/D or the mouse · Jump: Up, Space or click (twice to flutter)') : 'Eat treats, say hi to friends, then walk into the castle!';
    g.globalAlpha = Math.min(1, Math.min(t % 300, 300 - t % 300) / 30); panel(W / 2 - 260, 64, 520, 36, 18, 'rgba(122,26,99,.6)'); txt(tip, W / 2, 89, 16, '#fff'); g.globalAlpha = 1; }
  const btn = (x, d) => { g.fillStyle = 'rgba(122,26,99,.4)'; g.beginPath(); g.arc(x, H - 34, 20, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2.5; g.stroke(); g.fillStyle = '#fff'; d(); };
  btn(W - 40, () => { g.fillRect(W - 47, H - 43, 5, 18); g.fillRect(W - 38, H - 43, 5, 18); });
  if (paused) drawSettings('Paused');
}
