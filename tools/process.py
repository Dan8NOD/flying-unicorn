#!/usr/bin/env python3
"""Turn raw generated images into game assets (no installs: pure-Python PNG reading + macOS `sips`).
  process.py sprite RAW_NAME OUT_NAME HEIGHT    crop to visible pixels, scale to HEIGHT px -> assets/img/OUT_NAME.png
  process.py bg RAW_NAME OUT_NAME WIDTH         scale to WIDTH px, JPEG -> assets/img/OUT_NAME.jpg
  process.py strip RAW_NAME OUT_NAME WIDTH      transparent layer, scale to WIDTH px, PNG
  process.py audio RAW_NAME OUT_NAME            copy mp3 -> assets/audio/OUT_NAME.mp3"""
import os, sys, zlib, struct, subprocess, shutil, tempfile
RAW = os.path.expanduser('~/.cache/pink-unicorn-raw')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def rgba_bbox(path, thresh=24):
    d = open(path, 'rb').read(); pos = 8; idat = b''; w = h = 0; ct = bd = 0
    while pos < len(d):
        n, typ = struct.unpack('>I4s', d[pos:pos + 8]); body = d[pos + 8:pos + 8 + n]; pos += 12 + n
        if typ == b'IHDR': w, h, bd, ct = struct.unpack('>IIBB', body[:10])
        elif typ == b'IDAT': idat += body
    if ct != 6 or bd != 8: return (0, 0, w, h)          # no alpha: keep everything
    raw = zlib.decompress(idat); bpp = 4; stride = w * bpp; prev = bytearray(stride); minx, miny, maxx, maxy = w, h, -1, -1; i = 0
    for y in range(h):
        f = raw[i]; line = bytearray(raw[i + 1:i + 1 + stride]); i += 1 + stride
        if f == 1:
            for x in range(bpp, stride): line[x] = (line[x] + line[x - bpp]) & 255
        elif f == 2:
            for x in range(stride): line[x] = (line[x] + prev[x]) & 255
        elif f == 3:
            for x in range(stride): line[x] = (line[x] + ((line[x - bpp] if x >= bpp else 0) + prev[x]) // 2) & 255
        elif f == 4:
            for x in range(stride):
                a = line[x - bpp] if x >= bpp else 0; b = prev[x]; c = prev[x - bpp] if x >= bpp else 0
                p = a + b - c; pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        alpha = line[3::4]
        if max(alpha) > thresh:
            xs = [x for x, a in enumerate(alpha) if a > thresh]
            minx = min(minx, xs[0]); maxx = max(maxx, xs[-1]); miny = min(miny, y); maxy = y
        prev = line
    if maxx < 0: return (0, 0, w, h)
    pad = 6
    return (max(0, minx - pad), max(0, miny - pad), min(w, maxx + pad + 1), min(h, maxy + pad + 1))

def sips(*a): subprocess.run(['sips', *a], check=True, capture_output=True)

def main():
    kind, src, out = sys.argv[1], sys.argv[2], sys.argv[3]
    os.makedirs(os.path.join(ROOT, 'assets/img'), exist_ok=True); os.makedirs(os.path.join(ROOT, 'assets/audio'), exist_ok=True)
    if kind == 'audio':
        shutil.copy(os.path.join(RAW, src + '.mp3'), os.path.join(ROOT, 'assets/audio', out + '.mp3')); return
    inp = os.path.join(RAW, src + '.png'); size = int(sys.argv[4])
    tmp = tempfile.mktemp(suffix='.png'); shutil.copy(inp, tmp)
    if kind == 'sprite':
        x0, y0, x1, y1 = rgba_bbox(tmp)
        sips('--cropToHeightWidth', str(y1 - y0), str(x1 - x0), '--cropOffset', str(y0), str(x0), tmp)
        sips('--resampleHeight', str(size), tmp)
        shutil.move(tmp, os.path.join(ROOT, 'assets/img', out + '.png'))
    elif kind == 'strip':   # keep the full width (it tiles sideways) but trim empty rows above and below
        x0, y0, x1, y1 = rgba_bbox(tmp); full = int(subprocess.run(['sips', '-g', 'pixelWidth', tmp], capture_output=True, text=True).stdout.split()[-1])
        sips('--cropToHeightWidth', str(y1 - y0), str(full), '--cropOffset', str(y0), '0', tmp)
        sips('--resampleWidth', str(size), tmp); shutil.move(tmp, os.path.join(ROOT, 'assets/img', out + '.png'))
    elif kind == 'bg':
        o = os.path.join(ROOT, 'assets/img', out + '.jpg')
        sips('--resampleWidth', str(size), '-s', 'format', 'jpeg', '-s', 'formatOptions', '78', tmp, '--out', o); os.remove(tmp)
    print(kind, out, os.path.getsize(os.path.join(ROOT, 'assets/img', out + ('.jpg' if kind == 'bg' else '.png'))), 'bytes')

main()
