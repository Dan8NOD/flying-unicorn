// Page-side helper for tools/shot.js: renders one song (window.SAMPLE) to a WAV.
// Usage: osascript -l JavaScript tools/shot.js out.wav "window.SAMPLE=['title',false,9]; $(cat tools/sampler.js)" 60  (song key, boss?, seconds)
(async function () { try {
  const S = window.SAMPLE || ['title', false, 9], secs = S[2] + 1, sr = 44100; ac = new OfflineAudioContext(2, sr * secs, sr); buildGraph();
  let at = .1;
  const playSong = (key, boss, dur) => { const sg = makeSong(key, 5, boss), spb = 60 / sg.bpm / 4; let tt = at;
    for (let st = 0; tt < at + dur; st = (st + 1) % sg.len) { for (const e of sg.at[st]) playNote(e[1], e[2], e[3], tt, spb, sg.lead); tt += spb; } at += dur + .4; };
  playSong(S[0], S[1], S[2]);
  document.title = 'rendering'; const buf = await ac.startRendering(); document.title = 'encoding';
  const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length, b = new DataView(new ArrayBuffer(44 + n * 4));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) b.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); b.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 2, true);
  b.setUint32(24, sr, true); b.setUint32(28, sr * 4, true); b.setUint16(32, 4, true); b.setUint16(34, 16, true); w(36, 'data'); b.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) { b.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); b.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
  let s = ''; const u = new Uint8Array(b.buffer); for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768));
  window.__out = btoa(s); document.title = 'done ' + window.__out.length;
} catch (e) { document.title = 'ERR ' + e + ' ' + (e.stack || ''); } })(); window.__shot = document.createElement('canvas');
