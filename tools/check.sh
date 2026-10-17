#!/bin/sh
# Toll booth: every change must pass this before it is committed (installed as .git/hooks/pre-commit).
#   tools/check.sh          run all checks
# Checks: JS parses, smoke tests pass, no API keys in tracked files, no oversized files.
cd "$(dirname "$0")/.." || exit 1
fail=0
for f in game.js stages.js audio.js net.js sw.js; do
  osascript -l JavaScript -e "ObjC.import('Foundation'); var s=\$.NSString.stringWithContentsOfFileEncodingError('$PWD/$f',4,null).js; try { new Function(s); '' } catch(e) { 'SYNTAX $f: ' + e }" | grep SYNTAX && fail=1
done
osascript -l JavaScript tools/test.js 2>&1 | grep -E "FAIL|failed" && fail=1
if git grep -nE "msy_[A-Za-z0-9]{20,}|sk_[a-f0-9]{30,}" -- . ':!tools/check.sh' >/dev/null 2>&1; then echo "KEYS: an API key is in a tracked file"; fail=1; fi
big=$(git ls-files -z | xargs -0 ls -l 2>/dev/null | awk '$5 > 1572864 {print $9}')
[ -n "$big" ] && { echo "SIZE: files over 1.5 MB:"; echo "$big"; fail=1; }
[ $fail = 0 ] && echo "toll booth: all checks passed" || echo "toll booth: FAILED (fix the items above)"
exit $fail
