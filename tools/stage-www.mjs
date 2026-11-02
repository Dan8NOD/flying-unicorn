// Copies the game into www/ for Capacitor (`npm run ios` runs this, then cap sync).
// The game needs no build step; this only leaves out tools, previews, the
// service worker and node_modules.
import { cp, rm, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');
const FILES = ['index.html', 'manifest.json', 'audio.js', 'game.js', 'stages.js', 'net.js',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'assets'];

await rm(out, { recursive: true, force: true });
await mkdir(out);
// filter: skip macOS AppleDouble files (._*) that exFAT drives leave next to every file
for (const f of FILES) await cp(join(root, f), join(out, f), { recursive: true, filter: s => !s.split('/').pop().startsWith('._') });
console.log(`Staged ${FILES.join(', ')} into www/`);
