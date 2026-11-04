# Lanes: who works where

More than one AI agent works on this repo (Claude now; Codex joining). To avoid stepping on each other,
each agent owns a lane. Stay in your lane; if you must touch another lane's file, keep the change small and
log it under **Crossings** below.

## Lane: game (Claude)
- `game.js` (gameplay, drawing, UI), `stages.js` (weather and surprises), `audio.js` (sound engine)
- Generated art and audio: `assets/`, `tools/gen.py`, `tools/batch.py`, `tools/process.py`
- Art and sound direction, chapters, enemies, bosses, story

## Lane: platform (Codex)
- Android/iPad packaging and store listing (Trusted Web Activity or Capacitor), `manifest.json`, icons
- Offline caching `sw.js`, online play `net.js` (for example a small relay server instead of copy/paste codes)
- CI (run `tools/test.js` with Node on every push), real-device performance checks on 4 GB phones

## Shared (append, don't rewrite)
- `README.md`, `NEXT-STEPS.md`, `tools/test.js` (add tests; never delete someone else's), `index.html`

## Rules
1. Work on a branch named after your lane: `claude/<topic>` or `codex/<topic>`. Merge into `main` only when the toll booth passes.
2. **Toll booth:** `tools/check.sh` runs on every commit (git pre-commit hook). It checks that the JS parses,
   all smoke tests pass, no API keys are committed, and no file is over 1.5 MB. Install the hook on a new clone with
   `ln -sf ../../tools/check.sh .git/hooks/pre-commit`.
3. Small commits with clear messages. Don't reformat files you didn't otherwise change.
4. API keys live only in `~/.config/pink-unicorn/keys.env`, never in the repo.
5. Leave a short note in `NEXT-STEPS.md` when you stop, so the next agent can pick up.

## Crossings
- Claude added the iOS app (`ios/`, `package.json`, `capacitor.config.json`, `tools/stage-www.mjs`), `privacy.html` / `support.html` and the store listing, copied from Bible Story Pals (platform lane). `net.js` is untouched; 2 Devices is only hidden in the iOS app.
- Claude added PC/itch.io support (fullscreen, desktop hints, `tools/package-itch.sh`, `ITCH.md`) and iOS home-screen tags in `index.html` / `manifest.json` (platform lane).
- Claude prepared GitHub Actions CI in `tools/ci-workflow.yml` (node tests, key scan, file-size check); to enable, copy it to `.github/workflows/ci.yml` once the GitHub login has the `workflow` permission (platform lane).
