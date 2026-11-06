// Headless smoke tests for game.js with a fake canvas. Run from the repo root with either:
//   node tools/test.js                      (if Node is installed)
//   osascript -l JavaScript tools/test.js   (works on any Mac, no install)
// Each test loads game.js fresh, drives the game loop by hand and checks the result.
const isNode = typeof require !== 'undefined';
function readFile(p) {
  if (isNode) return require('fs').readFileSync(p, 'utf8');
  ObjC.import('Foundation'); return $.NSString.stringWithContentsOfFileEncodingError(p, 4, null).js;
}
const src = readFile('audio.js') + '\n' + readFile('game.js') + '\n' + readFile('stages.js');

function makeGame(testBody, win) {
  const ctx = new Proxy({}, { get: (o, p) => p === 'createLinearGradient' || p === 'createRadialGradient' ? () => ({ addColorStop() {} }) : (o[p] !== undefined ? o[p] : () => {}), set: (o, p, v) => { o[p] = v; return true; } });
  const cv = { width: 960, height: 540, getContext: () => ctx, addEventListener() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }) };
  const store = {};
  const fn = new Function('document', 'addEventListener', 'requestAnimationFrame', 'window', 'localStorage', 'setTimeout',
    src + '\nfunction step(n) { for (let i = 0; i < n; i++) loop(); }\n' + testBody);
  return fn({ getElementById: () => cv, addEventListener() {}, hidden: false }, () => {}, () => {}, win || {},
    { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = String(v); } }, f => f());
}

// Autoplayer: stays alive, melts bosses, taps through chapter cards. Returns when the ending shows (or gives up).
const autoplay = `
  function runToEnding() {
    const seen = {}; let k = 0;
    for (; k < 80000 && state !== 'ending'; k++) {
      step(1); seen[state] = 1;
      if (state === 'play') { lives = 5; if (boss && !clear && t % 5 === 0) boss.hp -= 3; if (!boss && !clear && t % 7 === 0 && t < CHAPTERS[ch].time * 60 - 5) t += 50; }
      if (state === 'chapter') press();
      if (state === 'walk') { keys.ArrowRight = true; if (t % 45 === 0) walkJump(); } else keys.ArrowRight = false;   // the Castle Garden: walk to the gate
    }
    step(700); press(); step(5);
    return { ch, state, seen: Object.keys(seen).join(',') };
  }`;

const tests = {
  'solo: all chapters reach the ending': [autoplay + `sel = 0; press(); const r = runToEnding(); return [r.ch === CHAPTERS.length - 1, r.seen.includes('play') && r.seen.includes('ending'), mode === 'solo' && players.length === 1];`, 3],
  'local 2P: all chapters reach the ending': [autoplay + `sel = 1; press(); const r = runToEnding(); return [r.ch === CHAPTERS.length - 1, mode === 'local', players.length === 2];`, 3],
  'every enemy type runs and draws in every chapter': [`
    sel = 0; press(); for (let q = 0; q < 400 && state !== 'play'; q++) { step(1); if (state === 'chapter') press(); }
    for (let c = 0; c < CHAPTERS.length; c++) { ch = c;
      for (const k of Object.keys(FOE)) { things = [{ kind: k, foe: 1, hp: FOE[k].hp, x: 700, y: 200, y0: 200, ph: 1, vx: FOE[k].vx, r: FOE[k].r, top: c % 2 === 0, cd: 60, hit: 0 }]; lives = 5; step(40); }
      for (let n = 0; n < 100; n++) spawn(); step(5); things = []; }
    return [true];`, 1],
  'power-ups apply (rapid, triple, magnet, bomb)': [`
    sel = 0; press(); for (let q = 0; q < 400 && state !== 'play'; q++) { step(1); if (state === 'chapter') press(); }
    const out = [];
    for (const k of POW) { things = [{ kind: k, x: uni.x, y: uni.y, y0: uni.y, vx: -1, ph: 0, r: 16 }, { kind: 'cloud', x: 600, y: 100, y0: 100, vx: -1, ph: 0, r: 28 }]; step(2);
      out.push(k === 'bomb' ? !things.some(o => o.kind === 'cloud') : uni[k] > 400); }
    return out;`, 4],
  'online: host snapshot is applied by the guest': [`
    const snaps = []; net.send = x => snaps.push(x); mode = 'host'; net.role = 'host'; net.open = true; sel = 1; start(0, true);
    for (let q = 0; q < 400 && state !== 'play'; q++) { step(1); if (state === 'chapter') press(); }
    for (let q = 0; q < 1500; q++) { lives = 5; step(1); }
    const m = JSON.parse(snaps[snaps.length - 1]);
    mode = 'guest'; net.role = 'guest'; things = []; shots = []; score = -1; ch = -1; state = 'title'; applySnap(m); step(30);
    const same = score === m.sc && ch === m.ch && state === m.st && things.length === m.th.length;
    const sent = []; net.sendR = x => sent.push(x); press();
    mode = 'host'; net.role = 'host'; net.remoteTy = 400; state = 'play'; p2.y = 200; p2.ty = 200; step(60);
    return [same, sent[0] === '{"p":1}', Math.round(p2.y) === 400];`, 3],
  'music: every song builds with valid notes': [`
    const out = [];
    for (const k of ['title', 'ending', ...CHAPTERS.map((_, i) => i)]) for (const b of [false, true]) {
      const sg = makeSong(k, 5, b), notes = sg.at.flat();
      out.push(notes.length > 50 && notes.every(e => e[1] === 'kick' || e[1] === 'hat' || e[1] === 'snare' || (isFinite(e[2]) && e[2] > 20 && e[2] < 110)));
    }
    return [out.every(x => x), out.length === (CHAPTERS.length + 2) * 2];`, 2],
  'free flying: move in all directions, tilt, dash': [`
    sel = 0; press(); for (let q = 0; q < 400 && state !== 'play'; q++) { step(1); if (state === 'chapter') press(); }
    things = []; const x0 = uni.x, y0 = uni.y;
    keys.ArrowRight = true; keys.ArrowUp = true; step(30); keys.ArrowRight = false; keys.ArrowUp = false;
    const movedRight = uni.x > x0 + 50, movedUp = uni.y < y0 - 50, tilted = uni.tilt < -.05;
    keys.ArrowLeft = true; step(40); keys.ArrowLeft = false; const movedLeft = uni.x < x0 + 20;
    uni.vx = 5; uni.vy = 0; dash(uni); const dashing = uni.dash > 0; lives = 3; hurt(uni); const safe = lives === 3;
    return [movedRight, movedUp, tilted, movedLeft, dashing, safe];`, 6],
  'chapter lists stay in step': [`
    return [CHAPTERS.length === NCH, FOES.length === NCH, TALK.length === NCH, CHAPTERS.every((_, i) => SONGS[i]), FOES.every(l => l.every(k => FOE[k]))];`, 5],
  'every chapter: weather, wind and surprises run': [`
    sel = 0; press(); for (let q = 0; q < 400 && state !== 'play'; q++) { step(1); if (state === 'chapter') press(); }
    let fired = 0, golden = 0, flyOk = true;
    for (let c = 0; c < NCH; c++) {
      ch = c; stageReset(); boss = null; clear = 0; things = []; lives = 5;
      for (t = 0; t < 52 * 60; t++) { stageTick(true); if (banner && banner.until === t + 150) fired++; if (t % 30 === 0) { stageBack(); stageFront(); for (const o of things) drawThing(o); } }
      golden += things.some(o => o.golden) ? 1 : 0;
    }
    return [STAGES.length === NCH, fired > NCH, golden >= NCH - 2, isFinite(windX)];`, 4],
  'rainbow run: endless stretches, boss every third': [`
    sel = 3; press(); step(80);
    const direct = state === 'play' && run;
    lives = 9; t = 30 * 60; step(80); const seg2 = runSeg === 1 && state === 'play';
    lives = 9; t = 30 * 60; step(80); lives = 9; t = 30 * 60; step(5); const bossCame = runSeg === 2 && !!boss;
    return [direct, seg2, bossCame];`, 3],
  'characters for sale: grown-ups gate, buying, cancelling, restoring, refunds': [`
    const calls = []; let buyStatus = 'purchased', ownedIds = [];
    window.Capacitor.nativePromise = (pl, m, a) => { calls.push(m); const res = m === 'products' ? { prices: { [HEROES[0].pid]: '$4.99' } } : m === 'buy' ? { status: buyStatus } : { ids: ownedIds }; return { then(ok) { ok(res); } }; };
    state = 'shop'; shopPage = 'heroes'; storeRefresh();
    const price = heroPrice(HEROES[0]) === '$4.99';
    heroesTap(heroCardX(0), 250); const gated = !!gate && !calls.includes('buy');
    const wrong = gate.choices.findIndex(c => c !== gate.good); gateTap(gateX(wrong), 310); const refused = !calls.includes('buy') && !gate;
    heroesTap(heroCardX(0), 250); buyStatus = 'cancelled'; gateTap(gateX(gate.choices.indexOf(gate.good)), 310); const cancelled = calls.includes('buy') && !paid.includes('moonbeam');
    heroesTap(heroCardX(0), 250); buyStatus = 'purchased'; gateTap(gateX(gate.choices.indexOf(gate.good)), 310); const bought = paid.includes('moonbeam') && skin === 'moonbeam';
    ownedIds = [HEROES[1].pid]; storeRestore(); const restored = paid.includes('coral');
    const refunded = !paid.includes('moonbeam') && skin === '';
    return [price, gated, refused, cancelled, bought, restored, refunded];`, 7, { Capacitor: { isNativePlatform: () => true, nativePromise: () => ({ then() {} }) } }],
  'characters for sale: the website offers no purchase and rings cannot buy them': [`
    wallet = 99999; state = 'shop'; shopPage = 'heroes'; heroesTap(heroCardX(0), 250);
    return [!gate, !paid.length, shopMsg.includes('app'), wallet === 99999];`, 4],
  'store: bundle unlocks everything, weapons equip and refunds clear them': [`
    let ownedIds = [BUNDLE.pid]; window.Capacitor.nativePromise = (pl, m) => ({ then(ok) { ok(m === 'owned' || m === 'restore' ? { ids: ownedIds } : { prices: {}, status: 'purchased' }); } });
    storeRefresh(); const all = STORE_ITEMS.every(k => paid.includes(k.id));
    state = 'shop'; shopPage = 'gear'; heroesTap(heroCardX(3), 250); const equipped = gear === 'thunder';
    ownedIds = []; storeRefresh(); const cleared = gear === '' && !paid.length;
    ownedIds = [GEAR[0].pid]; storeRefresh(); const one = paid.length === 1 && paid[0] === 'starwand';
    openGate(BUNDLE); gateTap(gateX(gate.choices.indexOf(gate.good)), 310); const bundleBuy = STORE_ITEMS.every(k => paid.includes(k.id));
    return [all, equipped, cleared, one, bundleBuy];`, 5, { Capacitor: { isNativePlatform: () => true, nativePromise: () => ({ then() {} }) } }],
  'store: every paid shot fires, flies, draws and hurts foes': [`
    sel = 0; press(); for (let q = 0; q < 400 && state !== 'play'; q++) { step(1); if (state === 'chapter') press(); }
    const res = {}; lives = 99; const kinds = [['gear', 'starwand', 'wand'], ['gear', 'snowflake', 'flake'], ['gear', 'harp', 'note'], ['gear', 'thunder', 'zap'], ['skin', 'whiskerwing', 'yarn'], ['skin', 'coral', 'bub'], ['skin', 'ember', 'flame']];
    const out = [];
    for (const [k, id, w] of kinds) {
      gear = k === 'gear' ? id : ''; skin = k === 'skin' ? id : ''; uni.weapon = ''; shots = []; lives = 99;
      let seen = false, hurt = false;
      for (let f = 0; f < 45; f++) { fire(uni); seen = seen || shots.some(q => q.w === w); shots.forEach(q => moveShot(q)); t++; }
      const foe = { kind: 'pig', foe: 1, hp: 50, x: 300, y: 200, y0: 200, ph: 0, vx: -2, r: 30, hit: 0 }; things = [foe];
      shots = [{ x: 300, y: 200, vx: 1, vy: 0, w, dmg: w === 'flake' ? undefined : 2, age: 0 }]; const h0 = foe.hp; t += 20; step(1); lives = 99; hurt = foe.hp < h0;
      out.push(seen && hurt && (w !== 'bub' || foe.slowed === 1));
    }
    gear = ''; skin = 'moonbeam'; shots = []; uni.dash = 5; t = t + (t % 2); fire(uni); out.push(shots.some(q => q.w === 'trail'));
    return out;`, 8],
  'sparkle shop: buy, wear, and refuse when short': [`
    wallet = 200; owned = ['']; skin = ''; state = 'shop';
    shopTap(shopCardX(1), 250); const bought = owned.includes('mint') && skin === 'mint' && wallet === 50;
    shopTap(shopCardX(4), 250); const refused = !owned.includes('golden') && wallet === 50;
    shopTap(shopCardX(0), 250); const back = skin === '';
    return [bought, refused, back];`, 3],
  'isometric bonus round after every third chapter': [`
    sel = 0; press(); for (let q = 0; q < 400 && state !== 'play'; q++) { step(1); if (state === 'chapter') press(); }
    ch = 2; state = 'results'; t = 100; nextChapter(); step(80);
    const inBonus = state === 'bonus' && things.filter(o => o.kind === 'gem').length === 14;
    const g0 = things[0]; uni.x = uni.tx = g0.x; uni.y = uni.ty = g0.y; step(2); const got = things.length < 14;
    t = 20 * 60; step(220); const after = state === 'chapter' || state === 'play';
    return [inBonus, got, after && ch === 3];`, 3],
  'game over: tap retries the same chapter; late chapters stay dodgeable': [`
    sel = 0; press(); for (let q = 0; q < 400 && state !== 'play'; q++) { step(1); if (state === 'chapter') press(); }
    ch = 9; lives = 1; uni.flash = 0; uni.shield = 0; hurt(uni); const over = state === 'over';
    step(50); press(); step(80); const retried = (state === 'chapter' || state === 'play') && ch === 9 && lives >= 3;
    ch = 26; const vs = []; for (let i = 0; i < 200; i++) { things = []; spawn(); if (things[0] && !things[0].foe) vs.push(-things[0].vx); }
    return [over, retried, Math.max(...vs) < 11.5];`, 3],
  'stomp and weapons: squash enemies, beam, boomerang, seekers, cupcakes': [`
    sel = 0; press(); for (let q = 0; q < 400 && state !== 'play'; q++) { step(1); if (state === 'chapter') press(); }
    const foe = (x, y) => ({ kind: 'pig', foe: 1, hp: 4, x, y, y0: y, ph: 0, vx: 0, r: 30, hit: 0 });
    things = [foe(300, 300)]; lives = 3; const pig = things[0]; uni.x = uni.tx = 300; uni.y = pig.y - 90; uni.vy = 3;
    let bounced = false; for (let k = 0; k < 30 && !pig.dead; k++) { uni.tx = pig.x; uni.ty = pig.y + 60; step(1); } bounced = uni.vy < 0;
    const stomped = pig.dead && bounced && lives === 3;
    const out = [];
    for (const w of ['beam', 'boom', 'seek', 'lob']) {
      const targets = [foe(620, 210), foe(700, 260)]; things = targets.slice(); shots = []; uni.weapon = w; uni.weaponT = 600; uni.x = uni.tx = 200; uni.y = uni.ty = 270; uni.vy = 0; lives = 3;
      for (let k = 0; k < 240; k++) { step(1); uni.ty = 270; }
      out.push(targets.some(o => o.dead));
    }
    uni.weapon = ''; things = [{ kind: 'w_lob', x: uni.x, y: uni.y, vx: 0, r: 16 }]; step(2); const picked = uni.weapon === 'lob';
    return [stomped, ...out, picked];`, 6],
  'sparkle meter fills and Rainbow Nova clears the screen': [`
    sel = 0; press(); for (let q = 0; q < 400 && state !== 'play'; q++) { step(1); if (state === 'chapter') press(); }
    meter = 0; things = []; for (let i = 0; i < 20; i++) addMeter(6); const full = meter === 100;
    things = [{ kind: 'pig', foe: 1, hp: 4, x: 500, y: 200, y0: 200, ph: 0, vx: 0, r: 30, hit: 0 }, { kind: 'cloud', x: 600, y: 300, vx: 0, r: 28 }];
    boss = { x: 780, y: 250, hp: 40, max: 40 }; bolts = [{ x: 400, y: 200, vx: -3, vy: 0 }];
    nova(); const cleared = things.every(o => o.dead || !o.foe) && bolts.length === 0 && boss.hp === 28 && meter === 0;
    boss = null; meter = 50; nova(); const notReady = meter === 50;
    return [full, cleared, notReady];`, 3],
  'golden horseshoes drop, save, unlock Rainbow; pegasus friend helps': [`
    sel = 0; press(); for (let q = 0; q < 400 && state !== 'play'; q++) { step(1); if (state === 'chapter') press(); }
    shoes = []; owned = ['']; things = []; t = Math.round(segTime() * 60 * SHOE_AT[0]) - 1; step(1);
    const s0 = things.find(o => o.kind === 'shoe'); const dropped = !!s0 && s0.k === 0;
    s0.x = uni.x; s0.y = s0.y0 = uni.y; step(2); const saved = (shoes[ch] & 1) === 1;
    things = []; t = Math.round(segTime() * 60 * SHOE_AT[0]) - 1; step(1); const notAgain = !things.some(o => o.kind === 'shoe');
    shoes = Array.from({ length: 17 }, () => 7); getShoe({ k: 1, x: 300, y: 200 }); const unlocked = shoeCount() >= 50 && owned.includes('rainbow');
    things = [{ kind: 'friend', x: uni.x, y: uni.y, vx: 0, r: 16 }]; shots = []; step(30); const helper = !!pal && shots.some(s => s.w === 'seek');
    return [dropped, saved, notAgain, unlocked, helper];`, 5],
  'reef ride: bumps cost no hearts, sea friends say hi, stars steer themselves': [`
    sel = 0; startCh = 5; press(); for (let q = 0; q < 400 && state !== 'play'; q++) { step(1); if (state === 'chapter') press(); }
    const ride = ch === 5 && tour();
    lives = 3; uni.flash = 0; things = [{ kind: 'fish', foe: 1, hp: 2, x: uni.x, y: uni.y, y0: uni.y, ph: 0, vx: 0, r: 26, hit: 0 }]; step(2);
    const safe = lives === 3 && uni.flash > 0 && things.every(o => o.dead || o.kind !== 'fish');
    const e = STAGES[5].ev.find(x => x[1] === 'sight'); things = []; t = Math.round(e[0] * 60) + 300; const q = sightPos(e); uni.flash = 0;
    uni.x = uni.tx = Math.max(MINX, Math.min(MAXX, q.x)); uni.y = uni.ty = q.y; const s0 = stat.sights; step(2); const met = stat.sights === s0 + 1;
    shots = [{ x: 300, y: 270, vx: 12, vy: 0 }]; things = [{ kind: 'jelly', foe: 1, hp: 2, x: 640, y: 120, y0: 120, ph: 0, vx: 0, r: 22, hit: 0 }]; uni.y = uni.ty = 450; step(8);
    const homed = shots.length === 0 || shots[0].vy < -1;
    for (let k = 0; k < 300; k++) { things = []; spawn(); }
    return [ride, safe, met, homed, !things.some(o => o.kind === 'spike' || o.kind === 'cloud' || o.kind === 'bat')];`, 5],
  'castle garden: walk, hop, munch, make friends, open the treasure, go home': [`
    sel = 0; press(); for (let q = 0; q < 400 && state !== 'play'; q++) { step(1); if (state === 'chapter') press(); }
    ch = 26; state = 'results'; t = 100; nextChapter(); step(80);
    const there = state === 'walk' && !!wk;
    walkJump(); step(3); const hopped = wk.y < GY - 10; step(60);
    wk.x = 1240; wk.face = 1; step(40); const ate = wk.yum >= 1;
    wk.x = 1660; step(20); const friend = wk.met >= 1;
    wk.x = CHEST_X - 40; step(10); const treasure = !!wk.chestOpen;
    keys.ArrowRight = true; for (let k = 0; k < 600 && state === 'walk'; k++) step(1); keys.ArrowRight = false; step(80);
    return [there, hopped, ate, friend, treasure, state === 'ending'];`, 6],
  'stickers: earned once, saved, old saves catch up, book opens and closes': [`
    const before = stickerCount(); award('nova'); award('nova'); const once = stickerCount() === before + 1 && toasts.length === 1;
    starsBest = [3]; stickerCheck(); const three = !!(stk.got.first && stk.got.shine);
    const saved = JSON.parse(localStorage.getItem('pinkUnicornStickers')).got.shine === 1;
    openStickers(); const open = state === 'stickers'; stickerTap(stickerX(9), stickerY(9)); const hint = stkMsg.startsWith('To earn it'); step(5);
    stickerTap(W / 2, 480); step(250);
    return [once, three, saved, open, hint, state === 'title' && toasts.length < 3];`, 6],
  'daily gift: once a day, more rings each day, the count never resets': [`
    wallet = 0; gift = { d: '', n: 0 }; const ready = giftReady(); openGift(); const first = wallet === GIFTS[0]; openGift(); const onlyOnce = wallet === GIFTS[0];
    gift.d = '2000-1-1'; gift.n = 6; openGift();
    return [ready, first, onlyOnce, wallet === GIFTS[0] + 30 && gift.n === 7 && !giftReady()];`, 4],
  'App Store app (Capacitor): no 2 Devices, no fullscreen row, Rainbow Run still starts': [`
    const noNet = !MENU.some(s => s.startsWith('2 Devices')) && MENU.length === 3, noFull = !SETTING_ROWS.some(r => r[0] === 'full');
    sel = 2; press(); return [noNet, noFull, run === true && mode === 'solo'];`, 3, { Capacitor: { isNativePlatform: () => true } }],
  'web: 2 Devices and Rainbow Run keep their menu rows': [`
    return [MENU.length === 4 && MENU[2].startsWith('2 Devices'), SETTING_ROWS.some(r => r[0] === 'full')];`, 2],
};

let failed = 0;
for (const name of Object.keys(tests)) {
  let res;
  try { res = makeGame(tests[name][0], tests[name][2]); } catch (e) { res = ['ERROR ' + e]; }
  const ok = Array.isArray(res) && res.length === tests[name][1] && res.every(x => x === true);
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  ' + JSON.stringify(res)));
  if (!ok) failed++;
}
console.log(failed ? failed + ' test(s) failed' : 'all tests passed');
if (failed) { if (isNode) process.exit(1); else throw new Error('tests failed'); }
