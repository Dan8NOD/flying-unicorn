# Flying Unicorn

A 2D arcade pony flyer built in **Godot 4**. Fly through rings, build combos, zap storm clouds, and try to beat your best score.

This is the Pink Pony pre-flight mini-game from [Fat Cat Cruz](https://fatcatcruz.com).

## Run locally

```bash
cd /path/to/repo
/Applications/Godot.app/Contents/MacOS/Godot --path .
```

## Build for iOS

```bash
/Applications/Godot.app/Contents/MacOS/Godot --headless --export-debug "iOS" build/ios/FlyingUnicorn.xcodeproj
```

Then install to a connected device:

```bash
xcrun devicectl device install app --device <UDID> build/ios/FlyingUnicorn.xcarchive/Products/Applications/FlyingUnicorn.app
```

## Controls

- **Touch:** drag to fly, hold to fire horn lasers
- **Keyboard:** W/S or ↑/↓ to fly, Space to fire, P to pause
- **Gamepad:** left stick / D-pad to fly, A / right trigger to fire, Start to pause

The title screen also has chapter shortcuts. Chapters 7 and 8 add a crystal
forest expedition and a cloud-island summit, with original procedural
backgrounds and synthesized ambient audio.
