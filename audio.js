// Pink Unicorn audio: everything is synthesised with WebAudio (no sound files).
// sfx(name, arg) plays a sound effect; music() keeps the right song playing (call it every frame).
// Uses game globals at run time: muted, state, ch, boss, clear, netEv.
let ac = null, master, sfxBus, musicBus, noiseBuf;
function audio() {
  if (!ac) {
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    buildGraph();
  }
  if (ac.state === 'suspended') ac.resume();
  loadFiles();
}
function buildGraph() {
  {
    const comp = ac.createDynamicsCompressor(); comp.connect(ac.destination);
    master = ac.createGain(); master.gain.value = 2.1; master.connect(comp);
    const verb = ac.createConvolver(), wet = ac.createGain(); wet.gain.value = .28;   // soft hall reverb from decaying noise
    const len = ac.sampleRate * 2.2, ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    verb.buffer = ir; verb.connect(wet); wet.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = .9; sfxBus.connect(master); sfxBus.connect(verb);
    musicBus = ac.createGain(); musicBus.gain.value = .32; musicBus.connect(master); musicBus.connect(verb);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  }
}
const hz = m => 440 * Math.pow(2, (m - 69) / 12);

// ---- building blocks ----
function tone(f, t0, d, v, type = 'sine', o = {}) {
  const osc = ac.createOscillator(), gn = ac.createGain(), a = o.a || .005;
  osc.type = type; osc.frequency.setValueAtTime(f, t0);
  if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t0 + d);
  if (o.vib) { const l = ac.createOscillator(), lg2 = ac.createGain(); l.frequency.value = 5.5; lg2.gain.value = f * .012; l.connect(lg2); lg2.connect(osc.frequency); l.start(t0); l.stop(t0 + a + d + .1); }
  if (o.detune) osc.detune.value = o.detune;
  gn.gain.setValueAtTime(.0001, t0); gn.gain.exponentialRampToValueAtTime(v, t0 + a); gn.gain.exponentialRampToValueAtTime(.0001, t0 + a + d);
  let node = osc;
  if (o.lp) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; osc.connect(fl); node = fl; }
  node.connect(gn); gn.connect(o.bus || sfxBus); osc.start(t0); osc.stop(t0 + a + d + .05);
}
function bell(f, t0, v, d = .6, bus) { tone(f, t0, d, v, 'sine', { bus }); tone(f * 2.76, t0, d * .35, v * .28, 'sine', { bus }); tone(f * 5.4, t0, d * .18, v * .1, 'sine', { bus }); }
function noise(t0, d, v, type, f0, f1, bus) {
  const src = ac.createBufferSource(), fl = ac.createBiquadFilter(), gn = ac.createGain();
  src.buffer = noiseBuf; fl.type = type; fl.frequency.setValueAtTime(f0, t0); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t0 + d); fl.Q.value = type === 'bandpass' ? 1.5 : .7;
  gn.gain.setValueAtTime(.0001, t0); gn.gain.exponentialRampToValueAtTime(v, t0 + .01); gn.gain.exponentialRampToValueAtTime(.0001, t0 + d);
  src.connect(fl); fl.connect(gn); gn.connect(bus || sfxBus); src.start(t0); src.stop(t0 + d + .05);
}

// ---- sound effects ----
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
let shotN = 0;
function sfx(name, arg = 0) {
  if (typeof netEv === 'function') netEv(['x', name, arg]);   // the guest device plays the same sounds
  if (muted || !ac || (typeof opts !== 'undefined' && !opts.sfx && name !== 'click')) return;
  if (playBuf(name, arg)) return;
  const n = ac.currentTime + .005;
  switch (name) {
    case 'shot': bell(hz(84 + PENTA[shotN++ % 5]), n, .035, .16); break;                                  // pony-dust twinkle
    case 'bubble': tone(500, n, .12, .03, 'sine', { slide: 900 }); break;
    case 'ring': { const s = PENTA[Math.min(arg, 10) - 1] || 0; bell(hz(76 + s), n, .11, .5); bell(hz(88 + s), n + .06, .05, .4); break; }
    case 'heart': [0, 4, 7, 12].forEach((s, i) => bell(hz(72 + s), n + i * .07, .07, .7)); tone(hz(48), n, .6, .05, 'triangle', { a: .05, lp: 800 }); break;
    case 'power': for (let i = 0; i < 8; i++) bell(hz(72 + PENTA[i]), n + i * .04, .05, .5); noise(n, .5, .03, 'bandpass', 6000, 9000); break;
    case 'shield': for (let i = 0; i < 10; i++) bell(hz(79 + PENTA[i]), n + i * .035, .05, .6); noise(n, .7, .04, 'highpass', 5000); break;
    case 'hurt': tone(520, n, .28, .26, 'triangle', { slide: 170, lp: 1400 }); noise(n, .12, .1, 'lowpass', 900); break;
    case 'pop': tone(760, n, .06, .08, 'sine', { slide: 420 }); break;
    case 'poof': tone(280, n, .09, .16, 'sine', { slide: 1300 }); noise(n, .14, .08, 'bandpass', 2400, 800); bell(hz(91), n + .03, .05, .25); break;
    case 'bossHit': tone(190, n, .09, .07, 'triangle', { slide: 120, lp: 900 }); break;
    case 'warn': [0, .24, .48].forEach((d, i) => tone(i % 2 ? 494 : 659, n + d, .2, .05, 'square', { lp: 1600, a: .02 })); break;
    case 'boss': tone(hz(40), n, 1.2, .14, 'sawtooth', { lp: 300, a: .2 }); noise(n, 1, .05, 'lowpass', 400, 120); break;
    case 'win': [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => bell(hz(72 + s), n + i * .09, .08, .9)); [48, 55, 60].forEach(m => tone(hz(m), n + .5, 1.4, .05, 'triangle', { a: .1, lp: 900 })); break;
    case 'bomb': noise(n, .8, .25, 'lowpass', 3000, 150); tone(130, n, .6, .25, 'sine', { slide: 38 }); break;
    case 'start': for (let i = 0; i < 9; i++) bell(hz(67 + PENTA[i]), n + i * .05, .045, .6); break;
    case 'flap': noise(n, .16, .07, 'bandpass', 900, 350); tone(180, n, .1, .03, 'sine', { slide: 120 }); break;              // soft wing whoosh
    case 'dash': noise(n, .3, .14, 'bandpass', 1200, 5000); [0, 4, 7].forEach((s, i) => bell(hz(84 + s), n + .05 + i * .03, .04, .3)); break;
    case 'click': bell(hz(96), n, .03, .1); break;
    case 'over': [7, 4, 0, -5].forEach((s, i) => bell(hz(72 + s), n + i * .22, .07, .9)); break;
  }
}

// ---- music: small generated songs (melody + chords + bass + light drums), one per chapter ----
const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
//            key  mode  chord degrees  bpm  lead     drums arp
const SONGS = {
  title:  [72, MAJ, [1, 6, 4, 5], 96, 'box', 0, 1],
  ending: [72, MAJ, [4, 5, 3, 6], 104, 'bell', 1, 1],
  0: [72, MAJ, [1, 5, 6, 4], 112, 'bell', 1, 0],   1: [74, MAJ, [1, 4, 1, 5], 100, 'flute', 1, 1],
  2: [69, MAJ, [1, 6, 4, 5], 84, 'box', 0, 1],     3: [70, MAJ, [1, 4, 6, 5], 96, 'flute', 0, 1],
  4: [67, MAJ, [1, 4, 5, 1], 116, 'pluck', 1, 1],  5: [76, MAJ, [1, 6, 2, 5], 104, 'bell', 1, 1],
  6: [69, MIN, [1, 6, 7, 5], 92, 'box', 0, 1],     7: [64, MIN, [1, 6, 3, 7], 120, 'pluck', 2, 1],
  8: [74, MAJ, [4, 5, 3, 6], 98, 'flute', 1, 1],   9: [72, MAJ, [1, 6, 2, 5], 126, 'bell', 2, 0],
  10: [65, MAJ, [1, 6, 4, 5], 80, 'box', 0, 1],    11: [70, MAJ, [1, 5, 6, 4], 100, 'flute', 1, 1],
  12: [74, MAJ, [1, 4, 5, 4], 110, 'pluck', 1, 1],  13: [67, MAJ, [1, 6, 2, 5], 124, 'box', 2, 1],
  14: [67, MAJ, [1, 4, 1, 5], 108, 'pluck', 1, 0],  15: [64, MIN, [1, 6, 3, 7], 118, 'pluck', 2, 1],
  16: [69, MAJ, [1, 6, 4, 5], 100, 'flute', 1, 1],
  17: [65, MAJ, [1, 6, 4, 5], 96, 'flute', 1, 1],  18: [69, MAJ, [1, 4, 5, 1], 120, 'pluck', 2, 0],
  19: [62, MAJ, [4, 5, 3, 6], 92, 'box', 1, 1],
  20: [70, MAJ, [1, 6, 2, 5], 104, 'pluck', 1, 0],  21: [76, MAJ, [1, 4, 6, 5], 96, 'box', 0, 1],
  22: [67, MAJ, [1, 5, 6, 4], 118, 'bell', 2, 1],
  23: [69, MAJ, [1, 6, 4, 5], 92, 'flute', 0, 1],  24: [64, MIN, [1, 6, 7, 5], 120, 'pluck', 2, 1],
  25: [62, MIN, [1, 4, 7, 1], 104, 'flute', 1, 1],
  26: [72, MAJ, [4, 5, 1, 6], 118, 'bell', 2, 1],
};
const RHYTHMS = ['1000101010001000', '1010100010101000', '1000100010101010', '1001001010001000', '1000101000101000', '1010001010100010'];
function makeSong(key, seed, boss) {
  let [root, scale, prog, bpm, lead, drums, arp] = SONGS[key];
  if (boss) { scale = MIN; prog = [1, 6, 4, 5]; bpm = 138; lead = 'pluck'; drums = 2; arp = 1; root -= 2; }
  let r = seed * 9301 + 49297; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const deg = d => { const o = Math.floor(d / 7); return scale[((d % 7) + 7) % 7] + 12 * o; };   // scale step -> semitones
  const ev = [], bars = 8; let mel = 7;   // melody position in scale steps above the key
  const melodyBars = [];
  for (let b = 0; b < 4; b++) {
    const chord = prog[b] - 1, tones = [chord, chord + 2, chord + 4], rh = RHYTHMS[(seed + b * 3) % RHYTHMS.length], notes = [];
    for (let s = 0; s < 16; s++) if (rh[s] === '1') {
      if (s % 8 === 0) { let best = tones[0] + 7; for (const tt of [tones[0], tones[1], tones[2], tones[0] + 7, tones[1] + 7, tones[2] + 7]) if (Math.abs(tt - mel) < Math.abs(best - mel)) best = tt; mel = best; }
      else mel += [-2, -1, -1, 1, 1, 2][rnd() * 6 | 0];
      mel = Math.max(4, Math.min(13, mel)); notes.push([s, mel]);
    }
    melodyBars.push(notes);
  }
  for (let b = 0; b < bars; b++) {
    const chord = prog[b % 4] - 1, base = b * 16;
    let notes = melodyBars[b % 4];
    if (b === bars - 1) notes = [[0, 7], [4, 9], [8, 7]];   // resolve home at the end of the loop
    notes.forEach(([s, d], i) => { const next = i + 1 < notes.length ? notes[i + 1][0] : 16; ev.push([base + s, 'lead', root + deg(d) - 12, next - s]); });
    ev.push([base, 'pad', root - 12 + deg(chord), 16], [base, 'pad', root - 12 + deg(chord + 2), 16], [base, 'pad', root - 12 + deg(chord + 4), 16]);
    const bassR = root - 24 + deg(chord);
    [[0, bassR], [6, bassR + 12], [8, root - 24 + deg(chord + 4)], [14, bassR + 12]].forEach(([s, m]) => ev.push([base + s, 'bass', m, 2]));
    if (arp) for (let s = 0; s < 16; s += 2) ev.push([base + s, 'arp', root + deg(chord + [0, 2, 4, 7][(s / 2) % 4]), 1]);
    if (drums) for (let s = 0; s < 16; s++) {
      if (s % 8 === 0) ev.push([base + s, 'kick']);
      if (s % 4 === 2 || (drums > 1 && s % 2 === 1)) ev.push([base + s, 'hat']);
      if (drums > 1 && s % 8 === 4) ev.push([base + s, 'snare']);
    }
  }
  const at = Array.from({ length: bars * 16 }, () => []); for (const e of ev) at[e[0]].push(e);   // events grouped by step
  return { bpm, lead, at, len: bars * 16 };
}
function playNote(kind, m, steps, t0, spb, lead) {
  const d = steps * spb, B = musicBus;
  if (kind === 'lead') {
    if (lead === 'bell' || lead === 'box') bell(hz(m + (lead === 'box' ? 12 : 0)), t0, lead === 'box' ? .09 : .1, Math.max(.35, d * 1.2), B);
    else if (lead === 'flute') tone(hz(m), t0, d * .95, .09, 'sine', { a: .04, vib: 1, lp: 2400, bus: B });
    else tone(hz(m), t0, Math.min(.3, d), .1, 'triangle', { lp: 2600, bus: B });
  }
  else if (kind === 'pad') { tone(hz(m), t0, d, .022, 'triangle', { a: .25, lp: 900, bus: B }); tone(hz(m), t0, d, .016, 'sine', { a: .3, detune: 7, bus: B }); }
  else if (kind === 'bass') tone(hz(m), t0, d * .9, .1, 'triangle', { lp: 500, bus: B });
  else if (kind === 'arp') tone(hz(m), t0, .18, .025, 'triangle', { lp: 3000, bus: B });
  else if (kind === 'kick') tone(110, t0, .18, .22, 'sine', { slide: 42, bus: B });
  else if (kind === 'hat') noise(t0, .04, .035, 'highpass', 7000, 0, B);
  else if (kind === 'snare') noise(t0, .14, .08, 'bandpass', 1800, 900, B);
}
let song = null, songKey = '', songStep = 0, songTime = 0;
function music() {
  if (!ac) return;
  const key = state === 'title' ? 'title' : state === 'ending' ? 'ending' : state === 'over' ? '' : (boss && !clear ? 'b' : '') + ch;
  ambienceTick();
  if (streamMusic(key)) { songKey = ''; song = null; return; }   // a generated track is playing
  if (key !== songKey) {
    songKey = key; songStep = 0; songTime = ac.currentTime + .08;
    song = key === '' ? null : makeSong(key[0] === 'b' ? ch : key === 'title' || key === 'ending' ? key : ch, (key.length * 7 + (ch | 0) * 13 + 3), key[0] === 'b');
  }
  if (!song || muted || (typeof opts !== 'undefined' && !opts.music)) { if (song) songTime = ac.currentTime + .05; return; }
  const spb = 60 / song.bpm / 4;
  if (songTime < ac.currentTime - .5) songTime = ac.currentTime + .05;   // fell behind (tab was hidden): skip ahead
  while (songTime < ac.currentTime + .2) {
    for (const e of song.at[songStep]) playNote(e[1], e[2], e[3], songTime, spb, song.lead);
    songStep = (songStep + 1) % song.len; songTime += spb;
  }
}

// ---- generated audio files (ElevenLabs) in assets/audio; everything above stays as the fallback ----
// Music streams through two <audio> elements that crossfade (low memory on 4 GB phones).
// Effects are decoded once into buffers (needs http/https; on file:// the synth versions play).
// Voices play through one <audio> element and duck the music while someone talks.
const FILE_SFX = ['shot', 'bubble', 'ring', 'heart', 'power', 'shield', 'hurt', 'pop', 'poof', 'bossHit', 'warn', 'boss', 'win', 'bomb', 'flap', 'dash', 'start', 'click', 'over',
  'thunder', 'whale', 'comet', 'phoenix', 'fairy', 'train', 'splash', 'dragon', 'airship', 'gust', 'rainbow', 'golden', 'eruption', 'firework', 'surprise'];
const SFX_VOL = { shot: .22, bubble: .25, ring: .5, pop: .35, flap: .3, click: .4, poof: .55, dash: .6 };
let ambEl = null, wxEl = null, ambFile = '';
const sbuf = {}; let sfxLoading = false, mEl = null, mCur = 0, mFile = '', mFail = {}, voiceEl = null, voiceUntil = 0, musicVol = .55;
function loadFiles() {
  if (typeof Audio === 'undefined') return;
  if (!mEl) {   // create (and unlock, inside this tap) the music and voice players
    mEl = [new Audio(), new Audio()]; voiceEl = new Audio(); ambEl = new Audio(); wxEl = new Audio();
    for (const el of [...mEl, voiceEl, ambEl, wxEl]) { el.preload = 'auto'; el.src = 'assets/audio/sfx_click.mp3'; el.volume = 0; const p = el.play(); if (p) p.then(() => el.pause()).catch(() => {}); }
    [...mEl, ambEl, wxEl].forEach(el => { el.loop = true; });
  }
  if (sfxLoading || !ac || typeof fetch === 'undefined' || !/^https?:/.test(location.protocol)) return;
  sfxLoading = true;
  for (const n of FILE_SFX) fetch('assets/audio/sfx_' + n + '.mp3').then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(b => ac.decodeAudioData(b)).then(buf => { sbuf[n] = buf; }).catch(() => {});
}
function playBuf(name, arg) {
  const buf = sbuf[name]; if (!buf) return false;
  const src = ac.createBufferSource(), gn = ac.createGain();
  src.buffer = buf; src.playbackRate.value = name === 'ring' ? 1 + Math.min(arg, 10) * .035 : name === 'shot' || name === 'pop' || name === 'flap' ? .92 + Math.random() * .16 : 1;
  gn.gain.value = SFX_VOL[name] || .7; src.connect(gn); gn.connect(sfxBus); src.start(); return true;
}
function voice(name) {
  if (typeof netEv === 'function') netEv(['v', name]);
  if (muted || !voiceEl || (typeof opts !== 'undefined' && !opts.voice)) return;
  try { voiceEl.pause(); voiceEl.src = 'assets/audio/' + name + '.mp3'; voiceEl.volume = 1; voiceEl.currentTime = 0; const p = voiceEl.play(); if (p) p.catch(() => {}); voiceUntil = Date.now() + 2600; voiceEl.onended = () => { voiceUntil = 0; }; } catch (e) {}
}
function musicFileFor(key) { return key === '' ? '' : key === 'title' ? 'music_title' : key === 'ending' ? 'music_ending' : key[0] === 'b' ? 'music_boss' : 'music_ch' + key; }
function streamMusic(key) {   // returns true while a music file is handling playback
  if (!mEl) return false;
  const file = musicFileFor(key);
  if (file !== mFile) {
    mFile = file;
    if (file && !mFail[file]) { mCur ^= 1; const el = mEl[mCur]; el.src = 'assets/audio/' + file + '.mp3'; el.volume = 0; el.onerror = () => { mFail[file] = 1; }; const p = el.play(); if (p) p.catch(() => {}); }
  }
  const mv = typeof opts !== 'undefined' ? [0, .3, musicVol][opts.music] : musicVol;
  const target = muted || !file ? 0 : mv * (Date.now() < voiceUntil ? .35 : 1);
  mEl.forEach((el, i) => {   // crossfade: the current track fades in, the old one fades out
    const want = i === mCur && file && !mFail[file] ? target : 0;
    el.volume = Math.max(0, Math.min(1, el.volume + Math.max(-.03, Math.min(.03, want - el.volume))));
    if (el.volume === 0 && i !== mCur && !el.paused) el.pause();
  });
  if (muted && !mEl[mCur].paused) mEl[mCur].pause(); else if (!muted && file && !mFail[file] && mEl[mCur].paused && ac && ac.state === 'running') { const p = mEl[mCur].play(); if (p) p.catch(() => {}); }
  return !!file && !mFail[file];
}

// Ambience: one looping soundscape per chapter (STAGES[ch].amb, stages.js) plus a rain layer while it rains.
function ambienceTick() {
  if (!ambEl || typeof STAGES === 'undefined') return;
  const S = STAGES[ch], bed = S && (state === 'play' || state === 'chapter' || state === 'results') ? S.amb : '';
  if (bed !== ambFile) { ambFile = bed; if (bed) { ambEl.src = 'assets/audio/' + bed + '.mp3'; ambEl.volume = 0; const p = ambEl.play(); if (p) p.catch(() => {}); } }
  const wet = state === 'play' && (wxType === 'rain' || wxType === 'storm') ? Math.min(1, wxI) : 0;
  if (wet > .05 && !muted && wxEl.paused) { if (!/wx_rain/.test(wxEl.src)) wxEl.src = 'assets/audio/wx_rain.mp3'; const p = wxEl.play(); if (p) p.catch(() => {}); }
  const duck = Date.now() < voiceUntil ? .6 : 1;
  const ramp = (el, want) => { el.volume = Math.max(0, Math.min(1, el.volume + Math.max(-.02, Math.min(.02, want - el.volume)))); if (el.volume === 0 && !el.paused && want === 0) el.pause(); };
  const fxOn = typeof opts === 'undefined' || opts.sfx;
  ramp(ambEl, muted || !bed || !fxOn ? 0 : .32 * duck);
  ramp(wxEl, muted || !fxOn ? 0 : .5 * wet * duck);
  if (!muted && bed && ambEl.paused && ac && ac.state === 'running') { const p = ambEl.play(); if (p) p.catch(() => {}); }
}

