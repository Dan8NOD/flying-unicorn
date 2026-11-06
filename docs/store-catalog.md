# Pink Unicorn store: characters and weapons for sale (draft 1, 2026-11-02)

Families asked for more characters and more weapons. This draft covers what to sell, how to price it, the App Store product IDs and the art each item needs.
**Nothing here is built yet.** Dan approves the list, the prices and the art spend first.

## Ground rules (kids play this, parents pay)
- **One-time unlocks only (non-consumable).** No coin packs and no "gems". That way:
  - parents pay once;
  - Restore Purchases brings everything back on a new device;
  - Family Sharing can cover the whole household.
- **Rings stay free.** Everything that can be earned with rings today stays earnable: the Sparkle Shop looks and the pickup weapons. Paid items are extras, never walls. No chapter is locked behind money.
- **Grown-ups gate before every purchase:** press and hold for 3 seconds, the same pattern as Bible Story Pals' parent area. A child can't buy by accident, and the gate also covers us if we ever join the Kids Category.
- **A Restore Purchases button** in the shop. Apple requires it.
- **The web version** shows the paid items as "Get it in the app". Selling on the web would need Stripe; leave that out for now.

## What a "character" and a "weapon" mean in the game
- **Character:** a new flyer you pick before a chapter. The Classic unicorn and her mermaid friend stay free.
  - **Art:** two flight frames (wings up and wings down), like the current looks (`skin_*_up.png` / `skin_*_down.png`).
  - **Optional:** 3–5 voice lines from ElevenLabs.
  - **Code:** a new "Heroes" page in the shop, plus each hero's own shot style. That part is code-only, with no new art.
- **Weapon:** a permanent **starting shot** that replaces pony-dust stars while it's equipped.
  - Today the four pickup weapons (Rainbow Beam, Heart Boomerang, Butterfly Seekers, Cupcake Bombs) last about 10 seconds. Those stay as free pickups.
  - Paid weapons are new ones you equip in the shop.
  - **Art:** 1 projectile sprite and 1 shop icon each. Each also needs one new sound.

## Catalog: launch set (8 items plus a bundle)

| # | Item | Type | Price | Product ID | What it is |
|---|---|---|---|---|---|
| 1 | **Whiskerwing** | Character | $4.99 | `com.dancruz.pinkunicorn.hero.whiskerwing` | A winged kitten. Shoots yarn-ball stars that bounce once. |
| 2 | **Moonbeam Alicorn** | Character | $4.99 | `com.dancruz.pinkunicorn.hero.moonbeam` | A silver-blue night unicorn. Her dash leaves a trail of stars. |
| 3 | **Coral the Sea-Pegasus** | Character | $4.99 | `com.dancruz.pinkunicorn.hero.coral` | A seahorse-tailed pegasus. Shoots bubbles that slow foes. |
| 4 | **Ember the Baby Dragon** | Character | $4.99 | `com.dancruz.pinkunicorn.hero.ember` | A friendly pink dragon. Shoots short warm sparkle-flames. |
| 5 | **Star Wand** | Weapon | $0.99 | `com.dancruz.pinkunicorn.weapon.starwand` | Fires 3 homing mini-stars. |
| 6 | **Snowflake Spinners** | Weapon | $0.99 | `com.dancruz.pinkunicorn.weapon.snowflake` | Spinning flakes that pass through a row of foes. |
| 7 | **Music Note Harp** | Weapon | $0.99 | `com.dancruz.pinkunicorn.weapon.harp` | Notes fly in a wave; every 8th note is a big chord. |
| 8 | **Thunder Horn** | Weapon | $1.99 | `com.dancruz.pinkunicorn.weapon.thunder` | A charged horn bolt that chains to 3 foes. |
| 9 | **Sparkle Bundle** | Bundle | $5.99 | `com.dancruz.pinkunicorn.bundle.all` | All 8 above (a $9.92 value) plus everything added later in 1.x. |

- **Character prices:** Dan set about $5 each on 2026-11-06, so they are $4.99. Weapon and bundle prices were set before that and still need his decision: the $5.99 bundle now costs about the same as one character.
- **Prices** are Apple price tiers (US). Apple fills in other countries automatically.
- **Product IDs can never be reused** once created, so Dan confirms the names before they go into App Store Connect.
- **The bundle** must be a non-consumable that unlocks the other IDs in code. Apple has no native "bundle" type for non-consumables.

**Later ideas (not in the launch set):** mermaid outfits, more trails (comet, flower petals), a "Pegasus Friend+" that stays all chapter, and seasonal heroes (snow pony in December).

## Art and voice budget (Meshy and ElevenLabs)
Art uses the method that worked before (`NEXT-STEPS.md`): Meshy `gpt-image-2`, "cute polished 3D animated-film style, side view", transparent background. The second wing frame is made with image-to-image from the first, so the design stays the same.

| Work | Count | Meshy credits (approx.) |
|---|---|---|
| Hero: 1st frame (text-to-image, 9) plus 2nd frame (image-to-image, 12) | 4 heroes | 84 |
| Weapon projectile plus shop icon (text-to-image, 9 each) | 4 weapons × 2 | 72 |
| Retries (about 50%) | | about 80 |
| **Total** | | **about 240 of the 10,419 left** |

- **Voices:** about 4 lines per hero with ElevenLabs (small). Sounds: 4 weapon sounds.
- **Before generating anything:**
  1. **Rotate the Meshy and ElevenLabs keys** (they were pasted in chats).
  2. Confirm both accounts are on paid plans, because this art is now sold.
  3. Dan OKs this budget.
- **Originality:** every hero must be our own design. No look-alikes of other games' or shows' characters, either in the art or in the names.

## Code work (after Dan approves)
1. **Store plugin:** add a Capacitor in-app purchase plugin and test which one works with Capacitor 8 on the MacBook. Candidates: `cordova-plugin-purchase` (works under Capacitor) and `@capgo/native-purchases`.
2. **Ownership:** a single `entitlements` list saved like `owned` is today. On launch it is refreshed from the App Store, which is the source of truth, so deleting the app doesn't lose purchases.
3. **Shop:** "Heroes" and "Weapons" pages, the grown-ups gate, Restore Purchases, and "Get it in the app" on the web.
4. **Gameplay:** hero selection (one shot style per hero), and the equipped weapon as the starting shot.
5. **Tests:** fake-store smoke tests for buying, restoring, the bundle unlocking all items, and the web showing no purchase buttons.

## App Store Connect and policy changes
- **Listing:** change "free, no in-app purchases" to "free, offers in-app purchases". The 8 items and the bundle show on the App Store page.
- **Privacy label:** still **Data Not Collected**. Apple processes purchases; we keep no purchase data.
- **Each in-app purchase needs** a display name, a description, a 1024 review screenshot, and review notes. Submit them with a new app version.
- **Sandbox:** a sandbox tester account in App Store Connect, and test each purchase plus Restore on a real device. Dan creates the tester password himself.
- **Paid Apps Agreement:** Active (confirmed 11/1).

## When: decided by Dan on 2026-11-03
**1.0 ships free on Sunday 11/8 (PR #1). The store comes in 1.1.**
The item list, names, prices and art spend are still waiting for Dan.
- **Why not 1.0:** adding purchases now means a new plugin, App Store Connect products, sandbox testing and a first-time in-app purchase review, all before Thursday. One rejection there would push the whole launch past Sunday.
- **Rough 1.1 timeline once Dan approves this list:**
  - art: 1–2 days;
  - code and tests: 2–3 days;
  - sandbox testing and submission: 1 day.
  - **That's 1.1 in review around Fri 11/13 to Mon 11/16.**
- **What families get meanwhile:** the free looks in the Sparkle Shop. "New heroes coming soon!" can go in the 1.0 promotional text, which can be changed at any time without a new build.
