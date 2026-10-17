// Page-side helper for tools/shot.js: renders each song (and the sound effects) offline and reports peak / loudness.
// Usage: osascript -l JavaScript tools/shot.js /dev/null "$(cat tools/mixcheck.js)" 12   -> result printed via document.title
(async function () { try {
  const res = [];
  const render = async (fn, secs) => {
    ac = new OfflineAudioContext(2, 44100 * secs, 44100); buildGraph(); fn();
    const buf = await ac.startRendering(), d = buf.getChannelData(0);
    let pk = 0, sum = 0; for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > pk) pk = v; sum += d[i] * d[i]; }
    document.title = 'progress ' + res.length; return [pk.toFixed(2), Math.sqrt(sum / d.length).toFixed(3)];
  };
  const songRender = (key, boss) => () => { const sg = makeSong(key, 5, boss), spb = 60 / sg.bpm / 4; let tt = .05;
    for (let st = 0; st < sg.len; st++) { for (const e of sg.at[st]) playNote(e[1], e[2], e[3], tt, spb, sg.lead); tt += spb; } };
  for (const k of ['title', 0, 2, 6, 7, 9, 11, 'ending']) res.push('song ' + k + ' ' + (await render(songRender(k, false), 6)).join('/'));
  res.push('boss ' + (await render(songRender(4, true), 6)).join('/'));
  for (const n of ['shot', 'ring', 'heart', 'power', 'hurt', 'poof', 'win', 'bomb', 'warn']) res.push('sfx ' + n + ' ' + (await render(() => sfx(n, 5), 2)).join('/'));
  document.title = res.join(' | ');
} catch (e) { document.title = 'ERR ' + e; } })(); window.__shot = document.createElement('canvas');
