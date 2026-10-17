# Pink Unicorn - next steps and handoff notes

Read `README.md` first. Everything is plain JS + canvas, no build step. Files: `index.html`, `game.js` (game), `net.js` (two-device lobby/WebRTC), `sw.js` + `manifest.json` + icons (installable/offline app for Android).

## Needs a human with a real device (nothing below has been seen on screen yet)
- Play all 12 chapters in a browser. Check speed, difficulty, readability, and that nothing is unfair (boss bolts, spikes, foe spawn rates).
- Two controllers: pad 1 steers the unicorn, pad 2 the mermaid (2 Players mode). Check the Start button (pause) and A button (tap) mapping on the Lenovo and any pads you own.
- Two devices: needs a real network test. Host picks "2 Devices", taps "I'm hosting", sends the code; guest taps "I'm joining", pastes it, sends back the reply code. Same Wi-Fi first, then different networks (STUN only, no TURN: strict NATs may fail; a TURN server would be the fix).
- Low-end Android (4 GB): watch frame rate. `fx` in `game.js` drops to 0 automatically below ~37 fps and halves particles/fireflies.

## Work that benefits from taste (art / sound / feel) - good for a stronger model
1. **Characters**: unicorn, mermaid, boss saucers and the nine foes are drawn from basic shapes in code. Make them cuter (bigger eyes, blush, sparkle highlights, idle animation, a real mane and tail that flow). Boss designs per chapter (currently only hull color and a crown on the last boss differ).
2. **Backgrounds**: chapters 1-8 have simpler scenery than chapters 9-12 (forest, candy land, lake, castle have 4-5 parallax layers). Bring the older ones up to that standard (Mermaid Bay, Coral Reef, Starry Night, Aurora, Canyon, Caves, Storm).
3. **Music**: currently one repeating arpeggio per chapter. Compose real short loops (melody + bass + light percussion, WebAudio only), a calmer title theme, a boss theme, a victory sting, and a proper ending theme. Keep it small, no audio files.
4. **Sound effects**: replace the square-wave blips with softer, magical sounds (chimes, whooshes, pops) and a distinct sound per enemy type.
5. **Transitions and ending**: the rainbow curtain and the sunrise ending work but are basic. Ideas: story panels between chapters, the mermaid and unicorn talking, a longer ending with credits.
6. **UI**: title screen logo, menu buttons (rounded, glowing), HUD icons instead of text glyphs, game-over screen, chapter cards with a picture.
7. **Power-up and enemy art**: the four power-up discs (R/»/✦/M/!) and the nine foes are placeholders; give each a clear, cute icon.
8. **Feel**: screen shake, hit flashes, combo effects, boss intro animation, a satisfying boss death.

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
