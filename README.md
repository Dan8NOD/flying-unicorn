# Pink Unicorn
A small browser shooter: fly a pink unicorn, collect gold rings, hearts and shield stars, dodge storm clouds, bats and spikes, shoot chunky flying pigs, angry birds, jellyfish, puffer fish, owls, ghosts, crystal bugs, bees and thunderclouds, and beat the flying-saucer boss in each of 12 chapters. A mermaid sidekick follows and helps in boss fights. Rainbow-curtain transitions between chapters (alternating sweep direction, next chapter named at full cover) and a short animated ending with sunrise, rainbow and fireworks.

Chapters: Candy Clouds, Mermaid Bay, Starry Night, Aurora Peaks, Rainbow Canyon, Coral Reef, Crystal Caves, Storm Fortress, Enchanted Forest, Cotton Candy Kingdom, Moonlit Lake, Unicorn Castle. The unicorn shoots pony-dust stars and the mermaid shoots bubbles.

Source only, no build step, no assets (all art and sound is drawn/synthesised in code).
Run: open `index.html`, or serve the folder (`python3 -m http.server`). Works with mouse, touch (iPad) and keyboard. M = mute, P = pause.

Modes: 1 Player, 2 Players on one screen (arrows + W/S, touch halves, or two gamepads), and 2 Devices online (host / join with a pasted code, `net.js`). Installable on Android as an app (manifest + service worker). See `NEXT-STEPS.md`.

Extras: power-ups (rapid fire, triple shot, ring magnet, bomb), chapter picker with saved progress, easy mode (press E on the title screen).

Tests: `osascript -l JavaScript tools/test.js` (any Mac) or `node tools/test.js`.
