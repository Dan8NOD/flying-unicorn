#!/bin/sh
# Build the itch.io upload: dist/pink-unicorn-itch.zip with index.html at the top level.
# On itch.io: Kind of project = HTML, upload the zip, tick "This file will be played in the browser",
# viewport 960 x 540, enable "Fullscreen button" and "Mobile friendly" (landscape). See ITCH.md.
cd "$(dirname "$0")/.." || exit 1
mkdir -p dist && rm -f dist/pink-unicorn-itch.zip
zip -qr dist/pink-unicorn-itch.zip index.html audio.js game.js stages.js net.js sw.js manifest.json \
  icon-192.png icon-512.png apple-touch-icon.png assets -x '*.DS_Store'
n=$(unzip -l dist/pink-unicorn-itch.zip | tail -1 | awk '{print $2}')
echo "dist/pink-unicorn-itch.zip: $(du -h dist/pink-unicorn-itch.zip | cut -f1), $n files (itch limits: 1000 files, 500 MB)"
