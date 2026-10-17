// Page-side helper for tools/shot.js: draws every chapter mid-fight into one contact sheet (window.__shot).
// Usage: osascript -l JavaScript tools/shot.js sheet.png "$(cat tools/sheet.js)" 2
(function () {
  const S = 1 / 3, cols = 3, sheet = document.createElement('canvas');
  sheet.width = W * S * cols; sheet.height = H * S * Math.ceil(CHAPTERS.length / cols);
  const sg = sheet.getContext('2d');
  mode = 'solo'; players = [uni];
  CHAPTERS.forEach((c, i) => {
    ch = i; state = 'play'; t = 900 + i * 37; boss = null; clear = 0; bolts = []; sparks = []; warn = 0; trans = null;
    uni.y = 250; uni.shield = i % 4 === 3 ? 100 : 0; mer.x = 70; mer.y = 290;
    things = FOES[i].map((k, j) => ({ kind: k, foe: 1, hp: 2, x: 430 + j * 160, y: 140 + j * 120, y0: 140 + j * 120, ph: j, vx: 0, r: FOE[k].r, top: j % 2 === 0, hit: 0 }));
    things.push({ kind: 'ring', x: 330, y: 420, vx: 0 }, { kind: 'heart', x: 400, y: 470, vx: 0 }, { kind: POW[i % 4], x: 260, y: 470, vx: 0 }, { kind: 'cloud', x: 880, y: 450, vx: 0 });
    if (i % 3 === 2) boss = { x: 790, y: 260, hp: 30, max: 40 };
    shots = [{ x: 260, y: 212, vx: 12, vy: 0 }, { x: 330, y: 212, vx: 12, vy: 0 }, { x: 120, y: 290, vx: 10, m: 1 }];
    if (boss) bolts = [{ x: 600, y: 300, vx: -4, vy: 0 }];
    draw();
    sg.drawImage(cv, (i % cols) * W * S, Math.floor(i / cols) * H * S, W * S, H * S);
  });
  window.__shot = sheet;
})()
