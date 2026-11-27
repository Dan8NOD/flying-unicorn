# Google Play: Pink Winged Unicorn 1.0 for Android

How to sign, build and upload the Android app, and what Play Console was told. This repo is public (GitHub Pages serves it), so the upload key, its password and testers' email addresses stay out of it.

## What the build is

| | |
|---|---|
| Package | `com.dancruz.pinkunicorn`, the same as the iOS bundle ID. Permanent once uploaded. |
| Version | 1.0.0, **versionCode 2** (`android/app/build.gradle`). Google Play takes each versionCode once: 1 went to internal testing on 2026-11-26, so the next upload is 2. Log: 1 = first upload, nothing for sale. 2 = this branch (not built with the upload key yet, not uploaded). |
| Android versions | Runs on Android 7.0 (API 24) and up. Targets Android 16 (API 36). |
| Screen | Landscape only, fullscreen (system bars come back with a swipe from an edge). Marked as a game (`android:appCategory="game"`). |
| Permissions | Internet (declared by Capacitor's web view; the game makes no network requests), Vibration (the "Vibration" setting), and from versionCode 2 `com.android.vending.BILLING` and `ACCESS_NETWORK_STATE`, both added by the Google Play Billing library. |
| Backup | Off: progress stays on the device (`allowBackup="false"` and `data_extraction_rules.xml`). |
| Back button | Closes the shop, sticker book, map or settings; pauses a game; leaves the app from the title screen (`backButton` in `game.js`, wired in `index.html`). |
| Purchases | Google Play Billing is in the code but **switched off** in the default build: the shop shows Ring Looks only, as in versionCode 1. See "Purchases" below. |
| Online play | **None.** "2 Devices" is hidden in every native app (`NATIVE_APP`), so the Android app opens no connection, not even to the STUN server. |

## Purchases

The nine products and their prices are in `docs/product-sheet.md`. They are the same IDs the iPhone and iPad app sells.

### Where it stands (2026-11-26)

- **Written and compiled:** `PinkStorePlugin.java` (Google Play Billing Library 8.0.0) and `PlayReceipt.java`, next to `MainActivity.java`. The plugin answers the same calls as `ios/App/App/PinkStorePlugin.swift` (`products`, `owned`, `buy`, `restore`) plus `finish`.
- **Not tested with Google Play:** no purchase has been made, not even a test one. That needs the products in Play Console, the licensing key, a signed build on the internal testing track and a phone. None of that can be done from the repo.
- **So the shop stays gated**, exactly as in versionCode 1. `pinkStoreBilling=false` in `android/gradle.properties` means `MainActivity` does not register the plugin, `STORE_NATIVE` in `game.js` is false, and the Characters and Weapons tabs are not drawn and cannot be opened. Nothing paid is unlocked for free and nothing points at another store.
- The default build still carries the billing permission. That is deliberate: Play Console lets you create products only after a build with that permission has been uploaded.

### The rules the code keeps

| Google Play rule | Where |
|---|---|
| **Nothing for a pending payment.** Cash and pay-later purchases arrive as PENDING. | `paid()` in the plugin counts only `PURCHASED`. `buy` answers `pending`; `game.js` unlocks nothing and says "Payment pending: it unlocks when the payment clears". |
| **Verify.** | `paid()` also needs the purchase to name this app's package and to carry Google's signature, checked on the device against the Play licensing key (`PlayReceipt.genuine`). No key, a bad key or a bad signature all count as not paid. |
| **Grant before acknowledging.** | `game.js` saves the unlock (`storeGot` or `storeOwned`), then calls `finish`. `finish` is the only place the plugin calls `acknowledgePurchase`. |
| **Acknowledge every purchase** (Google refunds after 3 days otherwise). | `game.js` asks `owned` at every launch, every time the app comes back to the front and every time a paid page opens, and passes everything owned to `finish`. A purchase the app missed (closed during the purchase, a pending payment that cleared later) is granted and acknowledged then. |
| **Restore on reinstall.** | The same launch check: `owned` reads what Google Play holds for the account. The Restore Purchases button does it on request. |
| **Refunds.** | A refunded product drops out of `owned`, and `storeOwned` takes it away. If Google Play cannot be reached, `owned` fails and the saved list is kept. |

`tools/test.js` pins these rules (three tests: the Google Play app flow, the billing source, the product sheet). Each rule was broken on purpose once to see its test fail. `android/app/src/test/.../PlayReceiptTest.java` checks the signature code with a made-up key pair.

There is no server. The signature check on the device stops casual fakes; a rooted phone that patches the app can still unlock things for itself, as with any offline game.

### Turning purchases on (in this order)

1. Dan: payments profile linked on the developer account, licence testers added.
2. Upload a signed build of this branch (versionCode 2, billing off) to **internal testing**. It carries the billing permission.
3. Create the nine products from `docs/product-sheet.md` and activate them. Check each ID, price, Active and "Backwards compatible".
4. Copy the licensing key (Monetize with Play, Monetization setup, Licensing) into `pinkPlayLicenseKey` in `android/gradle.properties`. It is a public key, so it may be committed.
5. Raise `versionCode` to 3 and build with billing on: `PINK_STORE_BILLING=1 npm run android:bundle`. The build refuses to start without the licensing key. Upload to internal testing.
6. On a phone signed in as a licence tester, installed **from Play** (not from a cable): buy one product with the test card; close and reopen the app (still owned); uninstall, reinstall from Play (it comes back without tapping anything); try the "slow test card, approves after a few minutes" to see the pending message and that nothing unlocks until it clears. After three days, check Order management: the test orders are not refunded.
7. Only then set `pinkStoreBilling=true` in `gradle.properties` for good, update the listing text and forms (`docs/google-play-listing.md`), and ask Dan before anything goes past internal testing.

## One time: the upload key

Made on Dan's Windows PC on 2026-11-26: `%USERPROFILE%\.pink-unicorn\upload-key.jks` (alias `upload`) with `keystore.properties` beside it. On another machine:

```bash
keytool -genkeypair -v -keystore ~/.pink-unicorn/upload-key.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

and `~/.pink-unicorn/keystore.properties`:

```
storeFile=upload-key.jks
storePassword=<the password you gave keytool>
keyAlias=upload
```

To keep the files elsewhere, set `PINK_UNICORN_KEYSTORE_PROPERTIES` to the full path of the properties file. Keep a copy of both files somewhere safe that is not GitHub. Google holds the real signing key (Play App Signing); a lost upload key can be replaced through Play Console.

## Build the bundle

Needs JDK 21 and the Android SDK (`JAVA_HOME`, `ANDROID_HOME`). The MacBook Pro has neither on its own: Unity's Android module brings an SDK and JDK 17, which is enough to compile and test (see "Checked on the MacBook Pro" below) but is not what a store build should be made with. The upload key is on the Windows PC only.

```bash
npm install
```

```bash
npm run android:bundle
```

It stages the game into `www/`, syncs it into `android/`, builds `android/app/build/outputs/bundle/release/app-release.aab` and says whether the bundle is signed. On Windows, build from a short path (for example a `subst` drive): the full path can pass Windows' 260-character limit.

Check a bundle without the password: `jarsigner -verify -certs app-release.aab`.

The launcher icons and splash screens in `android/app/src/main/res/` were made from `icon-512.png` (adaptive icon: the picture at 86% on `#F2A0DC`).

## Play Console answers (saved 2026-11-26)

| Form | Answer |
|---|---|
| App | Pink Winged Unicorn, Game, Free |
| Privacy policy | https://dan8nod.github.io/fatcatcruz-privacy/pink-unicorn.html (the Android build only; `privacy.html` here describes Apple purchases) |
| Ads | No ads |
| App access | Everything is available without sign-in |
| Data safety | No data collected, none shared |
| Content rating | Game; mild cartoon violence (stars thrown at cartoon saucers); everything else No |
| Target audience | 13-15, 16-17, 18 and over (PR #5: sold as 13+, not a kids' app). The listing makes no claims about young children. |
| Government, financial, health | No |
| Category | Game, Action |

## Checked on the MacBook Pro (2026-11-26)

With Unity's JDK 17 and Android SDK, and a local Gradle init script (not in the repo) that lowers Capacitor's Java level from 21 to 17:

- `./gradlew :app:compileDebugJavaWithJavac :app:testDebugUnitTest`: builds; `PlayReceiptTest` 4 of 4 pass.
- `./gradlew :app:bundleRelease`: builds an **unsigned** 69 MB bundle, versionCode 2, whose manifest has `com.android.vending.BILLING`. It was deleted afterwards. It is not a store build: wrong Java level, no upload key.
- `-PpinkStoreBilling=true` without a licensing key stops the build with a clear message.

## Not done

- **No signed bundle for versionCode 2.** The upload key (`upload-key.jks`) is on Dan's Windows PC; this Mac has no `~/.pink-unicorn/`. Build there: `git pull`, `npm ci`, `npm run android:bundle`.
- **No purchase has been tested.** See "Turning purchases on".
- Nobody has run the Android build on a phone or tablet: frame rate, sound, Back, fullscreen and controllers are untested on a device.
