# Pink Unicorn
A magical side-scrolling shooter for phones, tablets and computers. Fly a pink unicorn anywhere on screen, throw pony-dust stars, dash through danger, collect rings, hearts, shield stars and power-ups, and cheer up a grumpy flying-saucer boss at the end of each of 27 chapters. Your mermaid best friend helps (or a second player controls her).

Chapters: Candy Clouds, Mermaid Bay, Starry Night, Aurora Peaks, Rainbow Canyon, Coral Reef, Crystal Caves, Storm Fortress, Enchanted Forest, Cotton Candy Kingdom, Moonlit Lake, Sakura Valley, Rainbow Waterfalls, Starlight Carnival, Sunflower Fields, Glitter Volcano, Cosmic Nebula, Autumn Woods, Airship Harbor, Dream City, Tea Party Garden, Ice Palace, Toy Workshop, Lantern Festival, Jungle Temple, Desert Oasis, Unicorn Castle.

**Play:** on phones, tablets and computers (Windows/Mac/Linux browsers). Publish to itch.io with `tools/package-itch.sh` (see `ITCH.md`). Locally: open `index.html`, or serve the folder (`python3 -m http.server`) for full audio. Mouse, touch, keyboard and gamepads.
Move: drag / arrows / WASD / stick. Dash: double-tap / Space / Shift / X / right-click / pad B. Rainbow Nova: Z / Enter / pad Y / tap the meter. M = mute, P = pause, E = easy mode (title screen).

**Modes:** 1 Player; Rainbow Run (endless, random chapters that get harder, boss every third stretch, best run saved); 2 Players on one screen (arrows + WASD, touch halves, or two gamepads); 2 Devices online (host / join by swapping a code, `net.js`).

**Features:** 81 Golden Horseshoes to find (3 per chapter, saved; 50 unlock the secret Rainbow look); Little Pegasus friend pickup; Sparkle Meter and Rainbow Nova screen-clearing special (Z / Enter / pad Y / tap the meter); stomp enemies by flying down onto them (bounce combos, bonk the boss's dome); weapon pickups: Rainbow Beam, Heart Boomerang, Butterfly Seekers, Cupcake Bombs; isometric world map (a floating island per chapter, drag to explore, tap to fly there); isometric Sky Island bonus round after every third chapter; boss name cards with voiced taunts; ground shadows for depth; Sparkle Shop (rings you collect are saved; spend them on Mint, Snow, Galaxy and Golden unicorn looks); sound settings (music, effects, voices, vibration); weather that changes during each level (rain and lightning storms, blizzards, petal and leaf storms, sandstorms, fog, embers, meteor showers, fireworks) with wind that pushes you around; surprises in every chapter (fly-bys of a whale, comet, lantern dragon, phoenix, fairy, koi, airship and toy train, rainbow ring bridges, star showers, golden bonus enemies, gusts, a volcano eruption); ambient soundscapes; boss phases, 1-3 star ratings per chapter (saved), chapter picker, power-ups (rapid fire, triple shot, ring magnet, bomb), story chats with voices, animated ending with credits. Installable on Android (manifest + service worker).

## Files
- `game.js` game logic and drawing; `stages.js` per-chapter weather and surprises; `audio.js` sound engine; `net.js` two-device play; `index.html`, `sw.js`, `manifest.json`.
- `assets/img` generated art (Meshy): sprites, painted backgrounds and foregrounds. `assets/audio` generated audio (ElevenLabs): music, effects, voices.
- Every sprite and sound also has a code-drawn / synthesised fallback, so the game still works if an asset is missing.
- `previews/` screenshots. `tools/` test and art tools (see `NEXT-STEPS.md`).

Tests: `osascript -l JavaScript tools/test.js` (any Mac) or `node tools/test.js`. Before committing: `tools/check.sh` (the toll booth; also runs as a pre-commit hook). Several AI agents share this repo: see `LANES.md`.
