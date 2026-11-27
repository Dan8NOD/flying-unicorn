# Steam: what a Pink Winged Unicorn release would still need (notes, 2026-11-26)

Nothing here is built. The game already runs on a computer in a browser with mouse, keyboard and two gamepads, and
two players on one screen is its best fit for Steam. This is the list of work between that and a Steam build.

## Must have

1. **A desktop program.** Steam ships executables, not a web page. Wrap the same files (`index.html`, the four scripts,
   `assets/`) in Electron or Tauri and build for Windows first (Steam Deck runs the Windows build through Proton; macOS
   and Linux builds are optional). About 56 MB of game plus the wrapper. Start in fullscreen, keep F and the settings
   row for windowed play, and switch the service worker off as the phone apps do.
2. **Controller-only menus.** After this branch a controller can pick the mode and the chapter, open the map (Y), fly,
   dash, use Rainbow Nova, pause (Start), go back (B or Back) and leave a paused game. It still **cannot** open or use
   the Sparkle Shop, the sticker book, the daily gift, the settings rows or the Easy switch: those are pointer-only.
   Steam Deck and couch play need a focus cursor on every screen and button glyphs in the hints. Controls have only
   been checked in tests and by reading the code, never with a real pad on this build.
3. **Purchases through Steam only.** Steam does not allow another store's checkout or a pointer to one, so the
   App Store and Google Play code stays out of the build and the "In the app" text must not show. Two honest shapes:
   - **Free to play with DLC:** the nine products in `docs/product-sheet.md` become nine DLC entries at the same
     prices ($2.99 to $9.99; the bundle can also be a Steam bundle of the eight). The game asks Steam which DLC is
     owned (Steamworks `BIsDlcInstalled`, for example through `steamworks.js` in Electron) and feeds the answer to the
     same `storeOwned()` in `game.js`. No server needed.
   - **One paid game** between $2 and $10 with everything unlocked, no shop. Simpler, but it is not free to play.
   Dan picks. In-game microtransactions (Steam's `MicroTxn` web API) need a server and are not worth it here.
4. **Steamworks set-up (Dan):** the Steam Direct fee per app, tax and bank details, the app ID, depots, and an upload
   with `steamcmd`. A new store page must be up as "Coming soon" for two weeks before release, and both the page and
   the build go through Valve's review.
5. **Saves.** Progress lives in the browser's `localStorage`. In a wrapper that is a file inside the app's data
   folder; point Steam Auto-Cloud at it, or better write one `save.json`, so progress follows the player to the Deck.
6. **"2 Devices" online mode:** hide it as the phone apps do (it needs copy-and-paste codes and a public STUN server),
   or leave it for later. Steam Remote Play Together already lets a friend join the one-screen 2 Players mode.

## Store page

- Capsule art in Steam's sizes (header 920 × 430, small 462 × 174, main 1232 × 706, vertical 748 × 896, library
  600 × 900 and 3840 × 1240 hero, logo), at least five 1920 × 1080 screenshots, and a trailer. None exist: the art in
  `previews/` is 960 × 540 web captures.
- Text can start from `ITCH.md` and `docs/app-store-listing.md`. Tags: Shoot 'Em Up, Cute, Local Co-Op, Family
  Friendly, Casual, 2D, Controller.
- Features to tick: Single-player, Shared/Split Screen Co-op, Full controller support (only after item 2), Steam Cloud
  (after item 5), Remote Play Together.
- Content survey: mild cartoon violence, nothing else; in-app purchases if the DLC shape is chosen. Steam has no
  "13+" setting. The page text should keep PR #5's position: it is not presented as a product for young children.
- The art and voices were made with Meshy and ElevenLabs: Steam's content survey asks about AI-made content and
  that answer must be given.

## Nice to have

- Achievements from the 16 stickers (`STICKERS` in `game.js`).
- Keyboard and controller glyphs that follow the device in use.
- A Windows code-signing certificate, so SmartScreen does not warn on a direct download (Steam installs do not need it).
