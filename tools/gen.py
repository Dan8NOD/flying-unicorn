#!/usr/bin/env python3
"""Asset generator for Pink Unicorn (Meshy images, ElevenLabs audio).

Keys are read from ~/.config/pink-unicorn/keys.env (MESHY_KEY=..., ELEVEN_KEY=...), never from the repo.
Raw downloads go to ~/.cache/pink-unicorn-raw. Usage:
  gen.py img  NAME "prompt" [--ratio 1:1] [--bg] [--model gpt-image-2]          text-to-image (--bg = transparent)
  gen.py edit NAME FROM_NAME "edit prompt" [--bg] [--model nano-banana-pro]      image-to-image from an earlier result
  gen.py sfx  NAME "description" [--secs 1.5] [--loop]                          ElevenLabs sound effect (mp3)
  gen.py say  NAME VOICE_ID "line"                                              ElevenLabs speech (mp3)
  gen.py music NAME "prompt" --secs 60                                          ElevenLabs instrumental music (mp3)
"""
import json, os, sys, time, argparse, urllib.request, urllib.error, base64

RAW = os.path.expanduser('~/.cache/pink-unicorn-raw')
KEYS = dict(l.strip().split('=', 1) for l in open(os.path.expanduser('~/.config/pink-unicorn/keys.env')) if '=' in l)
LOG = os.path.join(RAW, 'log.json')

def req(url, body=None, headers=None, raw=False, timeout=300):
    data = json.dumps(body).encode() if body is not None else None
    for attempt in range(10):   # back off when the service says "too many requests"
        r = urllib.request.Request(url, data=data, headers={**(headers or {}), **({'Content-Type': 'application/json'} if data else {})}, method='POST' if data else 'GET')
        try:
            with urllib.request.urlopen(r, timeout=timeout) as f:
                out = f.read()
            return out if raw else json.loads(out)
        except urllib.error.HTTPError as e:
            if e.code not in (429, 503) or attempt == 9: raise
            time.sleep(10 + attempt * 10)

def log(name, info):
    d = json.load(open(LOG)) if os.path.exists(LOG) else {}
    d[name] = info; json.dump(d, open(LOG, 'w'), indent=1)

def meshy(path, body, name):
    H = {'Authorization': 'Bearer ' + KEYS['MESHY_KEY']}
    tid = req('https://api.meshy.ai/openapi/v1/' + path, body, H)['result']
    for _ in range(200):
        time.sleep(4)
        t = req('https://api.meshy.ai/openapi/v1/%s/%s' % (path, tid), headers=H)
        if t['status'] in ('SUCCEEDED', 'FAILED', 'CANCELED'): break
    if t['status'] != 'SUCCEEDED': sys.exit('%s: %s %s' % (name, t['status'], t.get('task_error')))
    for i, u in enumerate(t['image_urls']):
        fn = os.path.join(RAW, name + ('' if i == 0 else '_%d' % i) + '.png')
        open(fn, 'wb').write(req(u, raw=True))
        print('saved', fn)
    log(name, {'task': tid, 'path': path, 'body': {k: v for k, v in body.items() if k != 'reference_image_urls'}})

def eleven(url, body, name):
    data = req(url, body, {'xi-api-key': KEYS['ELEVEN_KEY']}, raw=True)
    fn = os.path.join(RAW, name + '.mp3'); open(fn, 'wb').write(data); print('saved', fn, len(data), 'bytes')
    log(name, {'url': url, 'body': body})

a = argparse.ArgumentParser(); a.add_argument('cmd'); a.add_argument('name'); a.add_argument('rest', nargs='+')
a.add_argument('--ratio', default='1:1'); a.add_argument('--bg', action='store_true'); a.add_argument('--model', default='')
a.add_argument('--secs', type=float, default=0); a.add_argument('--loop', action='store_true')
o = a.parse_args()
if o.cmd == 'img':
    meshy('text-to-image', {'ai_model': o.model or 'gpt-image-2', 'prompt': o.rest[0], 'aspect_ratio': o.ratio, 'remove_background': o.bg}, o.name)
elif o.cmd == 'edit':
    src = json.load(open(LOG))[o.rest[0]]
    body = {'ai_model': o.model or 'nano-banana-pro', 'prompt': o.rest[1], 'aspect_ratio': o.ratio, 'remove_background': o.bg}
    png = open(os.path.join(RAW, o.rest[0] + '.png'), 'rb').read()
    body['reference_image_urls'] = ['data:image/png;base64,' + base64.b64encode(png).decode()]
    meshy('image-to-image', body, o.name)
elif o.cmd == 'sfx':
    b = {'text': o.rest[0], 'prompt_influence': 0.5}
    if o.secs: b['duration_seconds'] = o.secs
    if o.loop: b['loop'] = True
    eleven('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_96', b, o.name)
elif o.cmd == 'say':
    eleven('https://api.elevenlabs.io/v1/text-to-speech/%s?output_format=mp3_44100_96' % o.rest[0], {'text': o.rest[1], 'model_id': 'eleven_multilingual_v2', 'voice_settings': {'stability': 0.4, 'similarity_boost': 0.8, 'style': 0.6}}, o.name)
elif o.cmd == 'music':
    eleven('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_96', {'prompt': o.rest[0], 'music_length_ms': int((o.secs or 60) * 1000), 'force_instrumental': True}, o.name)
