# Pink Unicorn - next steps and handoff notes

## GitHub and the iPad
Repo: https://github.com/Dan8NOD/flying-unicorn (default branch `more-levels`). GitHub Pages serves `more-levels` at
https://dan8nod.github.io/flying-unicorn/ - open it in Safari on the iPad, then Share > Add to Home Screen.
Only the iMac / MacBook Pro pushes. From an editing Mac, hand over new commits with
`git bundle create pink-unicorn-update.bundle origin/more-levels..more-levels`; on the pushing Mac run
`git pull origin more-levels`, `git pull <bundle> more-levels`, `tools/check.sh`, `git push origin more-levels`.
After a push, `sw.js` on the live site should show the new `CACHE` version within 1-2 minutes.
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

## Boss parade (done)
- Every boss now has its own cheered-up portrait (`assets/img/happy_0..26.png`, made with `gen.py edit` from each `boss_N`, gpt-image-2, transparent bg).
  The ending shows all 27 waving as they fly away. About 380 Meshy credits were used (the later calls cost 16 each, not 12). Raw files: `~/.cache/pink-unicorn-raw/happy_N.png`.

## Reef ride and Castle Garden (done, branch claude/reef-ride-garden)
- **Coral Reef (chapter 6) is now a gentle sightseeing ride** (`tour: 1` in CHAPTERS, helpers under "Reef ride" in `stages.js`):
  Mermaid rides on the unicorn's back, five big sea friends swim past (turtle, dolphins, whale, seahorse, manta: fly close to "say hi"),
  stars and bubbles steer themselves toward the few slow grumpy fish, bumps never cost a heart, no spikes or clouds, tiny bubbles
  (so they don't look like rings), a softer boss. Results show "Sea friends met". Any other chapter can become a ride by adding `tour: 1`
  and `sight` events to its STAGES entry (e.g. Mermaid Bay).
- **Castle Garden: new last stage after the castle** (`state === 'walk'`, "Castle Garden" section in `stages.js`): no flying. Walk (drag,
  arrows, mouse), hop (tap, Space, Up; again in the air to flutter), munch apples (bump the tree), cupcakes and carrots, play the music
  flowers, splash in the pond where Mermaid sits, bounce on mushrooms up to cloud platforms, say hi to bunnies (they follow you) and five
  cheered-up bosses, stomp two grumpy rain clouds into rainbows, open the treasure chest, then walk through the castle gate into the ending.
  It also has its own island (28) on the world map once unlocked. Music borrows `music_ch14`; new synth sounds `munch` and `chime`.
- Credits: Meshy 3803 -> 3503 (I used 153 for 16 images; about 147 went elsewhere before my batch started). ElevenLabs: 12 voice lines,
  about 206 characters (`vo_s_*`, `vo_w_*`). Not made: a painted map island for the garden (it is drawn from the garden sprites instead).

## iOS App Store (2026-11-02, branch `ios/capacitor-wrap`)
- The Capacitor 8 wrap is in `ios/`, copied from Bible Story Pals. **Nothing has been built yet:** the first `npm install && npm run ios` and archive happen on the MacBook Pro.
- Fixed for the app: Web Audio routing and the SFX files were switched off on `capacitor://` (iOS). Edge swipes are deferred so dragging near the bottom doesn't go home. 2 Devices and the fullscreen row are hidden in the app.
- The 1024 icon is the 512 icon upscaled. A sharper one needs the raw Meshy art or a new render (after the Meshy key is rotated).
- Still needs real devices: play all 27 chapters on an iPad and an iPhone, check frame rate and volume balance, and check that progress survives force-quitting the app.

## Store characters (2026-11-06)
- Moonbeam, Coral, Ember and Whiskerwing were made with Meshy: `gpt-image-2` for the wings-up frame, then `nano-banana-pro` image-to-image for wings-down, with transparent backgrounds. 72 credits in total, no retries.
- The raw 1024 px art is outside the repo, in `/Volumes/T9/apps/pink-unicorn-art/`. Sprites are cropped to one shared box per character so the body doesn't jump between frames, then scaled to 300 px tall.
- Weapon art is drawn in code in `drawWeaponShot`.
- All four characters still use the unicorn's voice lines (`vo_u_*`).

## Sticker Book and Daily Gift (done, `claude/stickers`)
- 16 stickers (`STICKERS` in `game.js`), saved in `pinkUnicornStickers`, with a pop-up (`toast`) and `vo_u_sticker`. Art reuses existing sprites, so no Meshy credits. `stickerCheck` awards what old saves already earned, silently.
- Daily gift: one per calendar day, `GIFTS` rings on a 7-day cycle. The day count deliberately never resets, because this is a kids' game and shouldn't punish a missed day. Keys: B book, G gift, Esc back from book and shop.

