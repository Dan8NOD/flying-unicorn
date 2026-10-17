# Pink Unicorn - next steps and handoff notes

Read `README.md` first. Everything is plain JS + canvas, no build step. Files: `index.html`, `game.js` (game), `net.js` (two-device lobby/WebRTC), `sw.js` + `manifest.json` + icons (installable/offline app for Android).

## Needs a human with a real device (nothing below has been seen on screen yet)
- Play all 12 chapters in a browser. Check speed, difficulty, readability, and that nothing is unfair (boss bolts, spikes, foe spawn rates).
- Two controllers: pad 1 steers the unicorn, pad 2 the mermaid (2 Players mode). Check the Start button (pause) and A button (tap) mapping on the Lenovo and any pads you own.
- Two devices: needs a real network test. Host picks "2 Devices", taps "I'm hosting", sends the code; guest taps "I'm joining", pastes it, sends back the reply code. Same Wi-Fi first, then different networks (STUN only, no TURN: strict NATs may fail; a TURN server would be the fix).
- Low-end Android (4 GB): watch frame rate. `fx` in `game.js` drops to 0 automatically below ~37 fps and halves particles/fireflies.

## Art and sound (done in the Opus pass; see `previews/`)
- Characters, bosses, enemies, hazards and pickups redrawn with shading, outlines and cute faces.
- All 12 chapters have layered parallax scenery; the interface (logo, menu, HUD, cards) is designed.
- `audio.js`: reverb, bell-like effects, and a generated song per chapter plus boss, title and ending themes.
- Story chats on every chapter card and a longer ending with credits.
- Tools: `tools/shot.js` renders screenshots offscreen (macOS), `tools/sheet.js` makes a contact sheet,
  `tools/mixcheck.js` reports audio levels, `tools/sampler.js` renders a music WAV.

## Still worth doing (needs ears and hands on real devices)
- Listen on a phone: tune song tempos, melody instruments and effect volumes in `audio.js` (`SONGS`, `sfx`).
- Watch a full playthrough for difficulty and readability (are hazards clear against busy backgrounds?).
- Optional: real voice lines (ElevenLabs) for the chapter chats, saved as small compressed files.

## Engineering backlog (mechanical)
- (done) Power-ups, chapter picker with saved progress, easy mode. Mute is saved too. Still open: tune power-up spawn rate and easy-mode numbers by playing.
- (done) Automated smoke tests: `osascript -l JavaScript tools/test.js` (or `node tools/test.js`). Run them after every change.
- Optional: online play with a tiny relay server instead of copy/paste codes.

## Putting it on the Google Play store (do this on the iMac or the external drive, not the small SSD)
1. Host the folder over HTTPS (GitHub Pages works: Settings > Pages > deploy from `main`).
2. Open https://www.pwabuilder.com, enter the Pages URL, choose Android, download the package (a Trusted Web Activity wrapper). This needs no local Android tools.
3. Upload the `.aab` to the Play Console. A one-time developer fee applies, and new personal accounts need closed testing with several testers before production.
4. Target 4 GB devices as the minimum; they are fine: the game uses very little memory.

## Safety
- No API keys are in this repo and none should be. Meshy and ElevenLabs keys were pasted into chat sessions twice: rotate them.
