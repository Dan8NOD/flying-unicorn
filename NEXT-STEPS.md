# Pink Unicorn - next steps and handoff notes

## Getting it onto GitHub (needed before the iPad can load it)
This repo has **no GitHub remote yet**. On the Mac that pushes: create an empty repo on GitHub (for example `pink-unicorn`), then
`git remote add origin https://github.com/<you>/pink-unicorn.git` and `git push -u origin main`.
The repo is about 60 MB (art and audio), well within GitHub limits. To play on the iPad, turn on GitHub Pages
(Settings > Pages > deploy from `main`) and open the Pages URL in Safari, then Share > Add to Home Screen.
Agents sharing this repo: read `LANES.md`; every commit must pass `tools/check.sh`.

Read `README.md` first. Everything is plain JS + canvas, no build step. Files: `index.html`, `game.js` (game), `net.js` (two-device lobby/WebRTC), `sw.js` + `manifest.json` + icons (installable/offline app for Android).

## Needs a human with a real device (nothing below has been seen on screen yet)
- Play all 12 chapters in a browser. Check speed, difficulty, readability, and that nothing is unfair (boss bolts, spikes, foe spawn rates).
- Two controllers: pad 1 steers the unicorn, pad 2 the mermaid (2 Players mode). Check the Start button (pause) and A button (tap) mapping on the Lenovo and any pads you own.
- Two devices: needs a real network test. Host picks "2 Devices", taps "I'm hosting", sends the code; guest taps "I'm joining", pastes it, sends back the reply code. Same Wi-Fi first, then different networks (STUN only, no TURN: strict NATs may fail; a TURN server would be the fix).
- Low-end Android (4 GB): watch frame rate. `fx` in `game.js` drops to 0 automatically below ~37 fps and halves particles/fireflies.

## Generated assets (Meshy + ElevenLabs)
- Made with `tools/gen.py` / `tools/batch.py` and processed with `tools/process.py` (crop, resize, JPEG/PNG) into `assets/`.
- Keys live in `~/.config/pink-unicorn/keys.env` (never in the repo). Raw downloads: `~/.cache/pink-unicorn-raw` (move to the external drive; safe to delete).
- Style that worked: Meshy `gpt-image-2`, "cute polished 3D animated-film style render ... side view", `--bg` for transparent sprites;
  wing frames made with `edit` (image-to-image) from the first unicorn so the design stays identical.
- Voices: unicorn = Jessica, mermaid = Laura, narrator = George. Music: ElevenLabs `music_v1`, instrumental, 60-90 s loops.
- About 590 Meshy credits (10,419 left) and a small part of the ElevenLabs quota were used in total.
- Screenshot / review tools: `tools/shot.js` (offscreen render), `tools/sheet.js` (all chapters), `tools/mixcheck.js`, `tools/sampler.js`.

## Weak-spot audit (fixed)
- iPad/iPhone: Safari ignores <audio>.volume, so music/ambience/voices are routed through Web Audio gain nodes (over http/https).
  Sound unlocks on touchend/click too and resumes after the app was in the background.
- Late chapters were nearly impossible (hazards ~20 px/frame by chapter 27); speeds now level off (about 10 px/frame max).
- Game over now retries the same chapter (Menu button for the title); bonus rounds can be paused; phones held upright get a
  rotate screen and the game pauses; a loading screen avoids the title popping in on slow connections.
- Proper home-screen icon and iOS meta tags. Soak tests in real WebKit (all chapters, 2 players, Rainbow Run): no errors.
- Re-run the soak test: start `python3 -m http.server 8765` and see the commands in this note's git history (tools/shot.js with SHOT_URL).

## Still worth doing (needs ears and hands on real devices)
- Play through on a phone: balance volumes of music vs effects vs voices (`musicVol`, `SFX_VOL` in `audio.js`), and difficulty.
- The painted backgrounds scroll by mirroring; if a seam looks odd in a chapter, regenerate that background as a wider panorama (Dream City shows its moon twice).
- Optional: a voice on/off switch, more voice reactions, a happy variant for every boss.

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
- No API keys are in this repo and none should be. The Meshy and ElevenLabs keys were pasted into chat sessions several times: rotate them, then update `~/.config/pink-unicorn/keys.env`.
