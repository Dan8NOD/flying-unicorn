class_name Synth
extends Node

# Tiny oscillator synth mirroring the original WebAudio tones.
# Each sfx is pre-rendered to a mono 16-bit AudioStreamWAV (44.1kHz) and cached.
# To replace with real audio later, swap play() to load res://audio/<name>.wav.

const SR := 44100.0

enum Wave { SINE, SQUARE, TRIANGLE, SAWTOOTH }

var muted := false
var players: Array[AudioStreamPlayer] = []
var _cache := {}

func _init() -> void:
	for i in 4:
		var p := AudioStreamPlayer.new()
		add_child(p)
		players.append(p)

# note: { f, dur, wave, vol, slide, delay }
func _render(notes: Array) -> AudioStreamWAV:
	var total := 0.0
	for n in notes:
		total = maxf(total, n.get("delay", 0.0) + n.dur)
	var frames := int(total * SR)
	var samples := PackedFloat32Array()
	samples.resize(frames)
	samples.fill(0.0)
	for n in notes:
		var f0: float = n.f
		var f1: float = maxf(40.0, f0 + n.get("slide", 0.0))
		var dur: float = n.dur
		var vol: float = n.get("vol", 0.12)
		var start := int(n.get("delay", 0.0) * SR)
		var count := int(dur * SR)
		var phase := 0.0
		for i in count:
			var t := float(i) / SR
			var f := f0 * pow(f1 / f0, t / dur)
			phase += TAU * f / SR
			var v: float
			match n.wave:
				Wave.SINE: v = sin(phase)
				Wave.SQUARE: v = 1.0 if sin(phase) >= 0.0 else -1.0
				Wave.TRIANGLE: v = asin(sin(phase)) * 2.0 / PI
				Wave.SAWTOOTH: v = 2.0 * fmod(phase / TAU, 1.0) - 1.0
			var g := vol * pow(0.0001 / vol, t / dur)
			samples[start + i] += v * g
	var bytes := PackedByteArray()
	bytes.resize(frames * 2)
	for i in frames:
		bytes.encode_s16(i * 2, int(clampf(samples[i], -1.0, 1.0) * 32767.0))
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = int(SR)
	wav.stereo = false
	wav.data = bytes
	return wav

func _play(key: String, notes: Array) -> void:
	if muted:
		return
	if not _cache.has(key):
		_cache[key] = _render(notes)
	for p in players:
		if not p.playing:
			p.stream = _cache[key]
			p.play()
			return
	# all busy: steal the first
	players[0].stream = _cache[key]
	players[0].play()

# ─── sfx ────────────────────────────────────────────────────────────────────
func laser() -> void:
	_play("laser", [{ "f": 1200.0, "dur": 0.09, "wave": Wave.SQUARE, "vol": 0.035, "slide": -700.0 }])

func ring(combo: int) -> void:
	var b := 520.0 + mini(combo, 12) * 40.0
	_play("ring%d" % mini(combo, 12), [
		{ "f": b, "dur": 0.12, "wave": Wave.TRIANGLE, "vol": 0.12 },
		{ "f": b * 1.5, "dur": 0.16, "wave": Wave.TRIANGLE, "vol": 0.1, "delay": 0.07 },
	])

func gold() -> void:
	var notes: Array = []
	var i := 0
	for f in [660.0, 830.0, 990.0, 1320.0]:
		notes.append({ "f": f, "dur": 0.18, "wave": Wave.TRIANGLE, "vol": 0.11, "delay": i * 0.06 })
		i += 1
	_play("gold", notes)

func zap() -> void:
	_play("zap", [{ "f": 300.0, "dur": 0.2, "wave": Wave.SAWTOOTH, "vol": 0.06, "slide": -220.0 }])

func poof() -> void:
	_play("poof", [{ "f": 180.0, "dur": 0.3, "wave": Wave.TRIANGLE, "vol": 0.1, "slide": 300.0 }])

func hurt() -> void:
	_play("hurt", [{ "f": 260.0, "dur": 0.25, "wave": Wave.SAWTOOTH, "vol": 0.08, "slide": -150.0 }])

func heart() -> void:
	var notes: Array = []
	var i := 0
	for f in [523.0, 659.0, 784.0]:
		notes.append({ "f": f, "dur": 0.15, "wave": Wave.SINE, "vol": 0.12, "delay": i * 0.07 })
		i += 1
	_play("heart", notes)

func level_up() -> void:
	var notes: Array = []
	var i := 0
	for f in [523.0, 659.0, 784.0, 1046.0]:
		notes.append({ "f": f, "dur": 0.2, "wave": Wave.TRIANGLE, "vol": 0.1, "delay": i * 0.09 })
		i += 1
	_play("level", notes)
