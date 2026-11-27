# Google Play listing: Pink Winged Unicorn (draft for Dan to check)

Text and form answers for Play Console. **Nothing here has been entered or changed in Play Console by this branch.**
`docs/google-play.md` records what was saved there on 2026-11-26 for the first upload (versionCode 1, nothing for sale);
this page is what the listing and forms need once the app sells the nine products in `docs/product-sheet.md`.

Position, unchanged from PR #5: **sold to ages 13 and up, not a kids' app.** Nothing below changes the rating or the audience.

## Main store listing (English, United States)

- **App name** (19 of 30): `Pink Winged Unicorn`
- **Short description** (73 of 80): `Fly a pink unicorn through 27 magical chapters and cheer up grumpy bosses`
- **Full description** (limit 4000):

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
> • A sticker book and a daily gift of rings
> • Easy mode and instant retry
>
> PLAY TOGETHER
> Two players on one screen: one flies the unicorn and the other flies her mermaid best friend. Share the touch screen or use two game controllers.
>
> FREE TO PLAY
> All 27 chapters are free. Optional new characters and weapons are one-time purchases from $2.99 to $4.99, or all eight together for $9.99. No ads, no subscriptions, no accounts and no tracking. The whole game works offline.

While the Android build still has billing switched off (see `docs/google-play.md`), the last paragraph must instead read:
`All 27 chapters are free, with no ads, no accounts and no tracking. The whole game works offline.`
A listing must not promise purchases the installed app does not offer.

## In-app products

| Name | Product ID | Price |
|---|---|---|
| Moonbeam | `com.dancruz.pinkunicorn.hero.moonbeam` | $4.99 |
| Coral | `com.dancruz.pinkunicorn.hero.coral` | $4.99 |
| Ember | `com.dancruz.pinkunicorn.hero.ember` | $4.99 |
| Whiskerwing | `com.dancruz.pinkunicorn.hero.whiskerwing` | $4.99 |
| Star Wand | `com.dancruz.pinkunicorn.weapon.starwand` | $2.99 |
| Snowflake Spinners | `com.dancruz.pinkunicorn.weapon.snowflake` | $2.99 |
| Music Harp | `com.dancruz.pinkunicorn.weapon.harp` | $2.99 |
| Thunder Horn | `com.dancruz.pinkunicorn.weapon.thunder` | $2.99 |
| Sparkle Bundle | `com.dancruz.pinkunicorn.bundle.all` | $9.99 |

Descriptions (50 to 200 characters each) and the steps for creating them are in `docs/product-sheet.md`.

## Graphics the listing needs

| Item | Size | State |
|---|---|---|
| App icon | 512 × 512 PNG | `icon-512.png` exists |
| Feature graphic | 1024 × 500 | **Not made.** `previews/itch/cover.jpg` (630 × 500) is the nearest art |
| Phone screenshots | 2 to 8, landscape 16:9, at least 1920 × 1080 to be featured | **Not made for Android.** `previews/` has web captures at other sizes |
| 7-inch and 10-inch tablet screenshots | landscape | **Not made.** Needed for the tablet listing |

Screenshots should come from the Android build on a phone or emulator. Nobody has run it on one yet.

## Forms: what changes when the app starts selling

| Form | Saved 2026-11-26 (versionCode 1) | Needed once purchases are on |
|---|---|---|
| App name, category | Pink Winged Unicorn, Game, Action, Free | No change |
| Ads | No ads | No change |
| App access | Everything available without sign-in | No change. A reviewer buys with a test card; no account of ours is needed |
| Content rating (IARC questionnaire) | Game; mild cartoon violence; everything else No | Answer **Yes** to "Does the app let users purchase digital goods?". Random items (loot boxes): **No**. The rating itself should stay where it is; re-submit the questionnaire so the listing shows "In-app purchases" |
| Target audience and content | 13-15, 16-17, 18 and over | **No change** (PR #5). Do not tick any age group under 13 and do not join the Families programme. The purchase check in the game (a times-table question) stays as a courtesy, not as a kids-app feature |
| Data safety | No data collected, none shared | Still **no data collected by the app**. Google Play handles payment; the app receives only which products are owned and saves that on the device. "Purchase history" is not collected by us, so the answer stays No |
| Privacy policy | https://dan8nod.github.io/fatcatcruz-privacy/pink-unicorn.html | That page must say that optional purchases on Android are handled by Google Play. `privacy.html` in this repo already says so on this branch; the other page lives in another repo and was not touched |
| Government, financial, health | No | No change |
| Payments profile | Not checked from here | The developer account needs a linked payments profile before products can be created. Bank, tax and identity entries are Dan's own |
| Licence testing | Not checked from here | Add the tester Gmail addresses so test purchases are not charged |
| Play licensing key | Not copied | Copy from Monetize with Play, Monetization setup, Licensing into `pinkPlayLicenseKey` in `android/gradle.properties` |

## What is new (release notes for versionCode 2)

```
<en-US>
A Menu button on the pause screen, pause in the bonus round, and a controller can now pick chapters and open the map.
</en-US>
```
