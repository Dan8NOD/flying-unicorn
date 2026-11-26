# Google Play: Pink Winged Unicorn 1.0 for Android

How to sign, build and upload the Android app, and what Play Console was told. This repo is public (GitHub Pages serves it), so the upload key, its password and testers' email addresses stay out of it.

## What the build is

| | |
|---|---|
| Package | `com.dancruz.pinkunicorn`, the same as the iOS bundle ID. Permanent once uploaded. |
| Version | 1.0.0, versionCode 1 (`android/app/build.gradle`). Google Play takes each versionCode once. |
| Android versions | Runs on Android 7.0 (API 24) and up. Targets Android 16 (API 36). |
| Screen | Landscape only, fullscreen (system bars come back with a swipe from an edge). Marked as a game (`android:appCategory="game"`). |
| Permissions | Internet (declared by Capacitor's web view; the game makes no network requests) and Vibration (the "Vibration" setting). |
| Backup | Off: progress stays on the device (`allowBackup="false"` and `data_extraction_rules.xml`). |
| Back button | Closes the shop, sticker book, map or settings; pauses a game; leaves the app from the title screen (`backButton` in `game.js`, wired in `index.html`). |
| Purchases | **None.** See below. |
| Online play | **None.** "2 Devices" is hidden in every native app (`NATIVE_APP`), so the Android app opens no connection, not even to the STUN server. |

## The shop on Android

The paid Characters and Weapons pages talk to the native `PinkStore` plugin, which exists only in the iOS app (StoreKit). Without it prices would stay "Loading..." and every purchase would fail. So `game.js` checks for the plugin (`STORE_NATIVE`, the same check Bible Story Pals uses for its `Unlocks` plugin):

- **iPhone and iPad app:** plugin present, nothing changes.
- **Website:** unchanged, the pages show "In the app".
- **Android app:** the Characters and Weapons tabs are not drawn and cannot be opened. The Sparkle Shop shows Ring Looks only, which are earned with rings. Nothing paid is unlocked for free, and nothing points at another store.

All 27 chapters, Rainbow Run, 2 Players on one screen, the sticker book and the daily gift are the same as on iOS.

### What a Google Play Billing update needs

1. A Kotlin or Java Capacitor plugin named `PinkStore` in `android/app/src/main/java/com/dancruz/pinkunicorn/`, built on the Play Billing Library, with the four methods `PinkStorePlugin.swift` has: `products` (returns `prices` by product ID), `owned` and `restore` (return `ids`), and `buy` (returns `status`: `purchased`, `pending` or `cancelled`). Register it in `MainActivity` with `registerPlugin` before `super.onCreate`. Purchases must be acknowledged, or Google refunds them after three days.
2. The `com.android.vending.BILLING` permission (the library adds it).
3. The nine products from `docs/app-store-listing.md` created in Play Console as one-time products, and a payments profile on the developer account. Play product IDs allow lowercase letters, digits, underscores and periods, so the iOS IDs can be reused as they are.
4. `game.js` needs no logic change: once the plugin is in the app, `STORE_NATIVE` turns true. The texts "Asking the App Store..." and "Could not reach the App Store" should become store-neutral.
5. In Play Console: change the content rating's digital-purchases answer, the listing text ("nothing to buy") and the privacy page. Test with licence testers, then upload with a higher versionCode.

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

Needs JDK 21 and the Android SDK (`JAVA_HOME`, `ANDROID_HOME`).

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

## Not done

- Nobody has run the Android build on a phone or tablet: frame rate, sound, Back, fullscreen and controllers are untested on a device.
- Google Play Billing (above).
