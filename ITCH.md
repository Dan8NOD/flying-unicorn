# Publishing Pink Unicorn on itch.io

## Build the upload
```
tools/package-itch.sh
```
This makes `dist/pink-unicorn-itch.zip` (index.html at the top level, about 56 MB, ~350 files; itch allows 1000 files / 500 MB).

## Create the project (itch.io > Upload new project)
- **Kind of project:** HTML
- **Uploads:** the zip, tick **This file will be played in the browser**
- **Embed options:** Viewport 960 × 540, tick **Mobile friendly** (orientation: landscape), tick **Fullscreen button**.
  Leave "Automatically start on page load" off (sound needs a click to start in browsers).
- **Cover image:** `previews/itch/cover.jpg` (630 × 500)
- **Screenshots:** everything in `previews/itch/` starting with a number
- **Genre:** Action · **Tags:** shoot-em-up, cute, unicorn, family-friendly, local-multiplayer, casual, html5, 2d, kids
- **Pricing:** your choice (free / pay what you want)
- **Saves:** progress, stars, rings and looks are saved in the browser (localStorage). Some browsers clear storage for
  embedded games; players keep their progress best by playing in fullscreen on the same browser.

## Page text (copy and paste)

**Pink Unicorn** - a magical flying adventure for the whole family.

Fly a rainbow-maned unicorn through 27 hand-painted worlds with your best friend the mermaid. Throw pony-dust stars,
dash through danger, collect rings and cheer up 27 grumpy flying-saucer bosses, each with its own pilot and voice.

- 27 chapters: candy clouds, coral reefs, crystal caves, a storm fortress, cherry blossoms, a night carnival, space and more
- Weather that changes as you fly (storms, blizzards, petal storms, sandstorms) and surprises like whales, comets and a lantern dragon
- Isometric world map and Sky Island bonus rounds
- Rainbow Run endless mode, star ratings, a Sparkle Shop of unicorn looks
- Play together: 2 players on one screen (keyboard, gamepads or touch) or on two devices online
- Full music, sound and voices

**Controls (computer):** fly with the mouse, arrow keys or WASD · Space dash · P pause · M mute · F fullscreen ·
2 players: arrows + WASD (Q to dash) or two gamepads.
**Touch:** drag to fly, double-tap to dash.
