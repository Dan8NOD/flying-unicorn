# Product sheet: Pink Winged Unicorn (2026-11-26)

The one list of what the game sells. `game.js`, `docs/app-store-listing.md`, `docs/google-play-listing.md` and both store
consoles follow this sheet; `tools/test.js` fails if `game.js` or the listings drift from it.

- **The game is free to download.** All 27 chapters, Rainbow Run, 2 Players, the sticker book, the daily gift and every ring look are free.
- **Every product costs between $2 and $10** (Dan, 2026-11-26). All nine are one-time purchases that never run out
  (App Store: non-consumable; Google Play: one-time product, not consumed). No subscriptions, no coin packs.
- **Product IDs are permanent** and are the same in both stores, byte for byte. They are the IDs the game has used since PR #4.
- **Nothing has been created or changed in either store console by this branch.** If the nine products already exist in
  App Store Connect at the 2026-11-06 prices, only their prices change; the IDs stay.

## What changed from the 2026-11-06 prices

| | 2026-11-06 | Now | Why |
|---|---|---|---|
| Characters | $4.99 | **$4.99** | Already inside $2 to $10. Dan's own price, left alone. |
| Weapons | $1.99 | **$2.99** | $1.99 is under the $2 floor. |
| Sparkle Bundle | $19.99 | **$9.99** | $19.99 is over the $10 ceiling. |

Bought one by one, the eight items cost $31.92; the bundle is $9.99. If Dan would rather narrow that gap, characters at
$3.99 also fit the rule (then $27.92 against $9.99). That is a one-line change here, in `game.js` and in the consoles.

## Products

Limits checked by the test: Google Play name at most 55 characters and description 50 to 200; App Store display name at
most 30 and description at most 45.

| Product ID | Name | Kind | USD | Google Play description | App Store description |
|---|---|---|---|---|---|
| `com.dancruz.pinkunicorn.hero.moonbeam` | Moonbeam | Character | $4.99 | Unlock Moonbeam, a silver-blue night unicorn, to fly in every chapter. Her dash leaves a trail of stars. One-time purchase, yours to keep. | Night unicorn. Her dash leaves a star trail. |
| `com.dancruz.pinkunicorn.hero.coral` | Coral | Character | $4.99 | Unlock Coral, a sea pegasus with a seahorse tail, to fly in every chapter. Her bubbles slow foes down. One-time purchase, yours to keep. | Sea pegasus. Her bubbles slow foes down. |
| `com.dancruz.pinkunicorn.hero.ember` | Ember | Character | $4.99 | Unlock Ember, a friendly pink baby dragon, to fly in every chapter. Ember breathes fast, short sparkle-flames. One-time purchase, yours to keep. | Baby dragon with fast sparkle-flames. |
| `com.dancruz.pinkunicorn.hero.whiskerwing` | Whiskerwing | Character | $4.99 | Unlock Whiskerwing, a winged kitten, to fly in every chapter. Her yarn-ball stars bounce once. One-time purchase, yours to keep. | Winged kitten. Yarn stars bounce once. |
| `com.dancruz.pinkunicorn.weapon.starwand` | Star Wand | Weapon | $2.99 | Unlock the Star Wand as your starting shot in every chapter. It fires three homing mini-stars. One-time purchase, yours to keep. | Fires three homing mini-stars. |
| `com.dancruz.pinkunicorn.weapon.snowflake` | Snowflake Spinners | Weapon | $2.99 | Unlock Snowflake Spinners as your starting shot in every chapter. The flakes spin through a whole row of foes. One-time purchase, yours to keep. | Flakes that spin through a row of foes. |
| `com.dancruz.pinkunicorn.weapon.harp` | Music Harp | Weapon | $2.99 | Unlock the Music Harp as your starting shot in every chapter. Notes fly in a wave and every eighth note is a big chord. One-time purchase, yours to keep. | Wavy notes. Every 8th is a big chord. |
| `com.dancruz.pinkunicorn.weapon.thunder` | Thunder Horn | Weapon | $2.99 | Unlock the Thunder Horn as your starting shot in every chapter. Its bolt jumps to three foes. One-time purchase, yours to keep. | A horn bolt that jumps to three foes. |
| `com.dancruz.pinkunicorn.bundle.all` | Sparkle Bundle | Bundle | $9.99 | Unlock all four characters (Moonbeam, Coral, Ember, Whiskerwing) and all four weapons (Star Wand, Snowflake Spinners, Music Harp, Thunder Horn) in one purchase. Yours to keep. | All 4 characters and all 4 weapons. |

**Stores:** all nine go on the **App Store** (iPhone and iPad) and on **Google Play** (Android). A Steam version would sell
the same nine as DLC or fold them into a paid build (`docs/steam.md`). The website and itch.io sell nothing: the paid
pages there say "In the app".

## Entering them

**App Store Connect** (each product: In-App Purchases, type Non-Consumable):
- Product ID and reference name from the table; price from the USD column (Apple fills in other countries).
- Display name = Name, description = the App Store column, English (U.S.).
- Family Sharing on, so one purchase covers the household (planned since `docs/store-catalog.md`).
- A review screenshot of the product's shop page, then attach all nine to the app version.

**Play Console** (each product: Monetize with Play, Products, One-time products):
- Product ID from the table, typed exactly. Name = Name. Description = the Google Play column.
- One purchase option, ID `buy`, type Buy, USD price from the table, all countries, then Activate. Check it reads "Backwards compatible".
- Play Console will not let anyone create products until a build with the billing permission has been uploaded: versionCode 2 from this branch carries it.

**In the game:** the price shown on a card is whatever the store answers in the buyer's currency. The prices in `game.js`
are only what a test build shows when no store answers.
