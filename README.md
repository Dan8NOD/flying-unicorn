# Pink Unicorn
A magical side-scrolling shooter for phones, tablets and computers. Fly a pink unicorn anywhere on screen, throw pony-dust stars, dash through danger, collect rings, hearts, shield stars and power-ups, and cheer up a grumpy flying-saucer boss at the end of each of 12 chapters. Your mermaid best friend helps (or a second player controls her).

Chapters: Candy Clouds, Mermaid Bay, Starry Night, Aurora Peaks, Rainbow Canyon, Coral Reef, Crystal Caves, Storm Fortress, Enchanted Forest, Cotton Candy Kingdom, Moonlit Lake, Unicorn Castle.

**Play:** open `index.html`, or serve the folder (`python3 -m http.server`) for full audio. Mouse, touch, keyboard and gamepads.
Move: drag / arrows / WASD / stick. Dash: double-tap / Space / Shift / X / pad B. M = mute, P = pause, E = easy mode (title screen).

**Modes:** 1 Player; 2 Players on one screen (arrows + WASD, touch halves, or two gamepads); 2 Devices online (host / join by swapping a code, `net.js`).

**Features:** boss phases, 1-3 star ratings per chapter (saved), chapter picker, power-ups (rapid fire, triple shot, ring magnet, bomb), story chats with voices, animated ending with credits. Installable on Android (manifest + service worker).

## Files
- `game.js` game logic and drawing; `audio.js` sound engine; `net.js` two-device play; `index.html`, `sw.js`, `manifest.json`.
- `assets/img` generated art (Meshy): sprites, painted backgrounds and foregrounds. `assets/audio` generated audio (ElevenLabs): music, effects, voices.
- Every sprite and sound also has a code-drawn / synthesised fallback, so the game still works if an asset is missing.
- `previews/` screenshots. `tools/` test and art tools (see `NEXT-STEPS.md`).

Tests: `osascript -l JavaScript tools/test.js` (any Mac) or `node tools/test.js`.
