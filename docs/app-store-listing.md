# App Store listing: Pink Winged Unicorn 1.0 (draft for Dan to check)

Paste these into App Store Connect. Character counts are checked against Apple's limits (name and subtitle 30, keywords 100, promotional text 170).
Version 1.0 is **free with no in-app purchases**. The Sparkle Shop spends in-game rings only.

## App information

| Field | Value |
|---|---|
| Name on the App Store | **Pink Winged Unicorn** (Dan reserves it when he creates the app record) |
| Name under the home-screen icon | Pink Unicorn |
| Bundle ID | `com.dancruz.pinkunicorn` |
| Version / build | 1.0.0 (1) |
| Primary category | Games, then the Action subcategory |
| Secondary category | Games, then the Family subcategory |
| Kids Category | **None.** Leave it off for 1.0, because it brings stricter review. |
| Price | Free |
| Privacy Policy URL | https://dan8nod.github.io/flying-unicorn/privacy.html |
| Support URL | https://dan8nod.github.io/flying-unicorn/support.html |
| Marketing URL | https://dan8nod.github.io/flying-unicorn/ |
| Copyright | 2026 Dan Cruz |

The Privacy and Support URLs go live only after this PR is merged into `more-levels`, the branch GitHub Pages serves.

## App Privacy ("nutrition label")
- **Data collection:** answer "No, we do not collect data from this app". The label then shows "Data Not Collected".
- **Tracking:** none. The privacy manifest (`ios/App/App/PrivacyInfo.xcprivacy`) says the same.
- **Why that is true:**
  - Progress and settings are saved only in the app's local storage.
  - The app makes no network requests. All art and audio are bundled.
  - The web-only "2 Devices" mode, which uses Google STUN, is hidden in the app (`NATIVE_APP` in `game.js`).

## Age rating questionnaire
- **Cartoon or Fantasy Violence: Infrequent/Mild.** You throw pony-dust stars at cartoon saucers, and bosses are "cheered up", not killed.
- **Everything else: None,** including realistic violence, horror and fear themes, and mature themes.
- **Other questions:**
  - Unrestricted web access: No.
  - User-generated content or chat: No.
  - Gambling or contests: No.
  - Loot boxes: No.
- **Made for Kids:** No.
- **Expected rating:** 4+.

## English (U.S.)

- **Name** (19): `Pink Winged Unicorn`
- **Subtitle** (27): `Magic unicorn sky adventure`
- **Promotional text** (156): `Fly a pink unicorn through 27 magical chapters, throw pony-dust stars and cheer up grumpy saucer bosses. Play alone or with a friend. No ads, works offline.`
- **Keywords** (96): `pegasus,mermaid,rainbow,flying,shooter,kids,cute,magic,fairy,pony,family,2 player,offline,arcade`

**Description:**

> Spread your wings! Fly Pink Unicorn across 27 magical lands, from Candy Clouds and Mermaid Bay to the Ice Palace, the Glitter Volcano and Unicorn Castle.
>
> Drag to fly anywhere on the screen. Pink Unicorn throws pony-dust stars all by herself. Double-tap to dash through danger, stomp grumpy critters, and grab rainbow power-ups. At the end of every chapter a grumpy flying-saucer boss is waiting. Can you cheer it up?
>
> FEATURES
> • 27 chapters with painted worlds, music and voiced story chats
> • Weather that changes as you fly: rainstorms, blizzards, petal storms, meteor showers and fireworks
> • Surprises in every chapter: a whale, a comet, a lantern dragon, a phoenix and more
> • Weapon pickups: Rainbow Beam, Heart Boomerang, Butterfly Seekers and Cupcake Bombs
> • Fill the Sparkle Meter and unleash Rainbow Nova
> • Find 81 hidden Golden Horseshoes and unlock a secret Rainbow look
> • Sparkle Shop: spend the rings you collect on Mint, Snow, Galaxy and Golden unicorns
> • Rainbow Run: an endless mode that gets harder and harder
> • Sky Island bonus rounds and a floating-island world map
> • Easy mode and instant retry, so younger players can finish the story too
>
> PLAY TOGETHER
> Two players on one screen: one flies the unicorn and the other flies her mermaid best friend. You can share a touch screen or use two game controllers.
>
> NO ADS, NO PURCHASES
> No ads, no in-app purchases, no accounts and no tracking. The whole game works offline.

## Screenshots (the MacBook Pro makes these)
- **Sizes:** **iPhone 6.9"** 2868 × 1320 and **iPad 13"** 2752 × 2064, landscape only. 3 to 10 per size, 5 recommended.
- **Easiest way:** run the app in the iPhone 16 Pro Max (or 17 Pro Max) and iPad Pro 13" (M4) simulators and press ⌘S.
- **Suggested order** (`previews/itch/` has older web captures to use as a guide for framing):
  1. Candy Clouds in action: the unicorn throwing stars, power-ups on screen
  2. A boss fight with its name card
  3. Weather: a storm in Storm Fortress, or Aurora Peaks
  4. The floating-island world map
  5. The Sparkle Shop or a 2-player game
- No device frames with real people, and no other companies' names or characters in the captions.

## App Review notes (paste into "Notes")
> Pink Winged Unicorn is a free, offline side-scrolling flying game. There is no sign-in, no network use, no ads, no purchases and no data collection. Controls: drag anywhere to fly, double-tap to dash, and tap the Sparkle Meter when it is full to clear the screen. Easy mode (title screen, bottom left) gives extra lives. To jump to any unlocked chapter, tap the "Map" bar on the title screen. Game controllers are supported.

**Sign-in required: No.** Leave the demo account empty.
