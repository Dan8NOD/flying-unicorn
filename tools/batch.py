#!/usr/bin/env python3
"""Run many tools/gen.py jobs in parallel. Usage: batch.py jobs.json [workers]
jobs.json = [["img", "name", "prompt", "--bg"], ...]  (same arguments as gen.py). Skips names that already exist."""
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
RAW = os.path.expanduser('~/.cache/pink-unicorn-raw')
jobs = json.load(open(sys.argv[1])); n = int(sys.argv[2]) if len(sys.argv) > 2 else 5
gen = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gen.py')
def run(j):
    if any(os.path.exists(os.path.join(RAW, j[1] + ext)) for ext in ('.png', '.mp3')): return j[1] + ': exists'
    r = subprocess.run([sys.executable, '-I', gen] + j, capture_output=True, text=True)
    return j[1] + ': ' + (r.stdout.strip() or r.stderr.strip()[-300:])
with ThreadPoolExecutor(n) as ex:
    for line in ex.map(run, jobs): print(line, flush=True)
