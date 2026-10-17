// Page-side helper for tools/shot.js: renders a ~50 s WAV of the title theme, a few chapter songs, a boss fight and some effects.
// Usage: osascript -l JavaScript tools/shot.js sampler.wav "$(cat tools/sampler.js)" 90
(async function () { try {
  const secs = 50, sr = 44100; ac = new OfflineAudioContext(2, sr * secs, sr); buildGraph();
  let at = .1;
  const playSong = (key, boss, dur) => { const sg = makeSong(key, 5, boss), spb = 60 / sg.bpm / 4; let tt = at;
    for (let st = 0; tt < at + dur; st = (st + 1) % sg.len) { for (const e of sg.at[st]) playNote(e[1], e[2], e[3], tt, spb, sg.lead); tt += spb; } at += dur + .4; };
  playSong('title', false, 9); playSong(0, false, 8); playSong(8, false, 8); playSong(2, false, 7); playSong(4, true, 8);
  const fx = ['shot', 'shot', 'ring', 'ring', 'heart', 'power', 'poof', 'hurt', 'shield', 'bomb', 'win'];
  const base = at; let k = 0;
  for (const n of fx) { const t0 = base + k * .6; k++; const old = sfxBus; const sched = () => sfx(n, k); // sfx uses ac.currentTime (0 offline): shift via a delay node
    const dl = ac.createDelay(60); dl.delayTime.value = t0; dl.connect(old); sfxBus = dl; sched(); sfxBus = old; }
  const buf = await ac.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length, b = new DataView(new ArrayBuffer(44 + n * 4));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) b.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); b.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 2, true);
  b.setUint32(24, sr, true); b.setUint32(28, sr * 4, true); b.setUint16(32, 4, true); b.setUint16(34, 16, true); w(36, 'data'); b.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) { b.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); b.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
  let s = ''; const u = new Uint8Array(b.buffer); for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768));
  window.__out = btoa(s);
} catch (e) { document.title = 'ERR ' + e + ' ' + (e.stack || ''); } })(); window.__shot = document.createElement('canvas');
