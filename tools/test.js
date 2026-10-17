// Headless smoke tests for game.js with a fake canvas. Run from the repo root with either:
//   node tools/test.js                      (if Node is installed)
//   osascript -l JavaScript tools/test.js   (works on any Mac, no install)
// Each test loads game.js fresh, drives the game loop by hand and checks the result.
const isNode = typeof require !== 'undefined';
function readFile(p) {
  if (isNode) return require('fs').readFileSync(p, 'utf8');
  ObjC.import('Foundation'); return $.NSString.stringWithContentsOfFileEncodingError(p, 4, null).js;
}
const src = readFile('game.js');

function makeGame(testBody) {
  const ctx = new Proxy({}, { get: (o, p) => p === 'createLinearGradient' ? () => ({ addColorStop() {} }) : (o[p] !== undefined ? o[p] : () => {}), set: (o, p, v) => { o[p] = v; return true; } });
  const cv = { width: 960, height: 540, getContext: () => ctx, addEventListener() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }) };
  const store = {};
  const fn = new Function('document', 'addEventListener', 'requestAnimationFrame', 'window', 'localStorage', 'setTimeout',
    src + '\nfunction step(n) { for (let i = 0; i < n; i++) loop(); }\n' + testBody);
  return fn({ getElementById: () => cv, addEventListener() {}, hidden: false }, () => {}, () => {}, {},
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
    const sent = []; net.sendR = x => sent.push(x); press();
    mode = 'host'; net.role = 'host'; net.remoteTy = 400; state = 'play'; p2.y = 200; p2.ty = 200; step(60);
    return [score === m.sc && ch === m.ch && state === m.st && things.length === m.th.length, sent[0] === '{"p":1}', Math.round(p2.y) === 400];`, 3],
};

let failed = 0;
for (const name of Object.keys(tests)) {
  let res;
  try { res = makeGame(tests[name][0]); } catch (e) { res = ['ERROR ' + e]; }
  const ok = Array.isArray(res) && res.length === tests[name][1] && res.every(x => x === true);
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  ' + JSON.stringify(res)));
  if (!ok) failed++;
}
console.log(failed ? failed + ' test(s) failed' : 'all tests passed');
if (failed) { if (isNode) process.exit(1); else throw new Error('tests failed'); }
