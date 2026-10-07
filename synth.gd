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
var _files := {}
var _loopers := {}

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

# Dropped-in audio wins: res://audio/<key>.mp3 (or .wav/.ogg) plays
# instead of the synth render. Missing files fall back to the synth.
func _file_stream(key: String) -> AudioStream:
	if _files.has(key):
		return _files[key]
	for ext in ["mp3", "wav", "ogg"]:
		var path := "res://audio/%s.%s" % [key, ext]
		if ResourceLoader.exists(path):
			var s: AudioStream = load(path)
			if key.ends_with("_loop"):
				if s is AudioStreamMP3 or s is AudioStreamOggVorbis:
					s.loop = true
				elif s is AudioStreamWAV:
					s.loop_mode = AudioStreamWAV.LOOP_FORWARD
			_files[key] = s
			return s
	_files[key] = null
	return null


# Numbered variants rotate for variety: laser1/laser2 alternate per
# shot, thunder1/thunder2 pick at random per strike.
var _rr := {}


func _variant_stream(key: String) -> AudioStream:
	var variants: Array = []
	for n in range(1, 10):
		var path := "res://audio/%s%d.mp3" % [key, n]
		if ResourceLoader.exists(path):
			variants.append(path)
	if variants.is_empty():
		return null
	var i := int(_rr.get(key, 0))
	_rr[key] = i + 1
	var pick: String = variants[randi() % variants.size()] if key == "thunder" else variants[i % variants.size()]
	if _files.has(pick):
		return _files[pick]
	var s: AudioStream = load(pick)
	_files[pick] = s
	return s


func _play(key: String, notes: Array, pitch := 1.0, vol := 0.0) -> void:
	if muted:
		return
	var v := _variant_stream(key)
	if v:
		for p in players:
			if not p.playing:
				p.stream = v
				p.pitch_scale = pitch
				p.volume_db = vol
				p.play()
				return
		players[0].stream = v
		players[0].pitch_scale = pitch
		players[0].volume_db = vol
		players[0].play()
		return
	var f := _file_stream(key)
	if f:
		for p in players:
			if not p.playing:
				p.stream = f
				p.pitch_scale = pitch
				p.volume_db = vol
				p.play()
				return
		players[0].stream = f
		players[0].pitch_scale = pitch
		players[0].volume_db = vol
		players[0].play()
		return
	if not _cache.has(key):
		_cache[key] = _render(notes)
	for p in players:
		if not p.playing:
			p.stream = _cache[key]
			p.pitch_scale = pitch
			p.volume_db = vol
			p.play()
			return
	# all busy: steal the first
	players[0].stream = _cache[key]
	players[0].pitch_scale = pitch
	players[0].volume_db = vol
	players[0].play()

# ─── sfx ────────────────────────────────────────────────────────────────────
func laser() -> void:
	_play("laser", [{ "f": 1200.0, "dur": 0.09, "wave": Wave.SQUARE, "vol": 0.035, "slide": -700.0 }], 1.0, -8.0)

func ring(combo: int) -> void:
	var b := 520.0 + mini(combo, 12) * 40.0
	_play("ring", [
		{ "f": b, "dur": 0.12, "wave": Wave.TRIANGLE, "vol": 0.12 },
		{ "f": b * 1.5, "dur": 0.16, "wave": Wave.TRIANGLE, "vol": 0.1, "delay": 0.07 },
	], 1.0 + mini(combo, 12) * 0.03)

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


func thunder() -> void:
	_play("thunder", [{ "f": 90.0, "dur": 0.6, "wave": Wave.SINE, "vol": 0.14, "slide": -40.0 }])

func reload() -> void:
	_play("reload1", [
		{ "f": 500.0, "dur": 0.5, "wave": Wave.SINE, "vol": 0.1, "slide": 900.0 },
		{ "f": 1400.0, "dur": 0.12, "wave": Wave.TRIANGLE, "vol": 0.12, "delay": 0.55 },
	])

func beam() -> void:
	_play("beam1", [{ "f": 140.0, "dur": 1.2, "wave": Wave.SAWTOOTH, "vol": 0.09, "slide": 60.0 }])

func ready() -> void:
	_play("ready", [{ "f": 880.0, "dur": 0.1, "wave": Wave.TRIANGLE, "vol": 0.1 }])

func boss() -> void:
	_play("boss1", [{ "f": 220.0, "dur": 0.8, "wave": Wave.SAWTOOTH, "vol": 0.1, "slide": -120.0 }])

func boom() -> void:
	_play("boom1", [{ "f": 120.0, "dur": 0.5, "wave": Wave.SAWTOOTH, "vol": 0.12, "slide": -60.0 }])


func rocket() -> void:
	_play("rocket", [{ "f": 200.0, "dur": 0.4, "wave": Wave.SAWTOOTH, "vol": 0.09, "slide": 900.0 }])


func pony() -> void:
	_play("pony", [{ "f": 700.0, "dur": 0.2, "wave": Wave.TRIANGLE, "vol": 0.1, "slide": 300.0 }])


func powerup() -> void:
	_play("power1", [
		{ "f": 660.0, "dur": 0.12, "wave": Wave.TRIANGLE, "vol": 0.12 },
		{ "f": 880.0, "dur": 0.12, "wave": Wave.TRIANGLE, "vol": 0.12, "delay": 0.1 },
		{ "f": 1320.0, "dur": 0.2, "wave": Wave.TRIANGLE, "vol": 0.12, "delay": 0.2 },
	])


# Hyper spear: a bright rising zing over a low whoosh.
func spear() -> void:
	_play("spear", [
		{ "f": 1400.0, "dur": 0.16, "wave": Wave.SAWTOOTH, "vol": 0.05, "slide": 1800.0 },
		{ "f": 320.0, "dur": 0.22, "wave": Wave.TRIANGLE, "vol": 0.09, "slide": 620.0 },
	])


# Spear detonation: bigger and sharper than the rocket boom — layered thump,
# mid crack, high shatter.
func spear_boom() -> void:
	_play("spearboom", [
		{ "f": 160.0, "dur": 0.55, "wave": Wave.SAWTOOTH, "vol": 0.13, "slide": -110.0 },
		{ "f": 980.0, "dur": 0.2, "wave": Wave.SQUARE, "vol": 0.07, "slide": -760.0 },
		{ "f": 2400.0, "dur": 0.08, "wave": Wave.TRIANGLE, "vol": 0.08 },
	])


# Building collapse: a low rumble with debris clatter on top (ch5 city).
func crumble() -> void:
	_play("crumble", [
		{ "f": 210.0, "dur": 0.6, "wave": Wave.SAWTOOTH, "vol": 0.11, "slide": -150.0 },
		{ "f": 140.0, "dur": 0.5, "wave": Wave.SQUARE, "vol": 0.06, "slide": -70.0, "delay": 0.1 },
		{ "f": 760.0, "dur": 0.09, "wave": Wave.TRIANGLE, "vol": 0.08, "delay": 0.05 },
		{ "f": 620.0, "dur": 0.09, "wave": Wave.TRIANGLE, "vol": 0.07, "delay": 0.16 },
		{ "f": 880.0, "dur": 0.07, "wave": Wave.TRIANGLE, "vol": 0.06, "delay": 0.28 },
	])


# Bright five-note rising run: flag buoy, maze exit.
func fanfare() -> void:
	var notes: Array = []
	var i := 0
	for f in [587.0, 740.0, 880.0, 1174.0, 1480.0]:
		notes.append({ "f": f, "dur": 0.16, "wave": Wave.TRIANGLE, "vol": 0.11, "delay": i * 0.08 })
		i += 1
	_play("fanfare", notes)


# Mysterious two-note chill with a high echo: the maze entrance reveals.
func maze_in() -> void:
	_play("mazein", [
		{ "f": 440.0, "dur": 0.22, "wave": Wave.TRIANGLE, "vol": 0.1 },
		{ "f": 415.0, "dur": 0.3, "wave": Wave.TRIANGLE, "vol": 0.09, "delay": 0.18 },
		{ "f": 880.0, "dur": 0.12, "wave": Wave.SINE, "vol": 0.06, "delay": 0.36 },
	])


# Puzzle piece lock: its own little tick, brighter than gold().
func snap() -> void:
	_play("snap", [
		{ "f": 1500.0, "dur": 0.05, "wave": Wave.TRIANGLE, "vol": 0.12 },
		{ "f": 2100.0, "dur": 0.07, "wave": Wave.TRIANGLE, "vol": 0.1, "delay": 0.04 },
	])


# Pearl pickup: soft high pling.
func pearl() -> void:
	_play("pearl", [
		{ "f": 1180.0, "dur": 0.1, "wave": Wave.SINE, "vol": 0.11 },
		{ "f": 1770.0, "dur": 0.14, "wave": Wave.SINE, "vol": 0.09, "delay": 0.06 },
	])


# Barrel pop: a short woody knock.
func pop() -> void:
	_play("pop", [
		{ "f": 420.0, "dur": 0.1, "wave": Wave.SQUARE, "vol": 0.08, "slide": -220.0 },
		{ "f": 260.0, "dur": 0.12, "wave": Wave.TRIANGLE, "vol": 0.09, "slide": 120.0 },
	])


# Current-gate tear (underworld → chapter 5): a long rising whoosh.
func gate() -> void:
	_play("gate", [
		{ "f": 220.0, "dur": 0.7, "wave": Wave.SAWTOOTH, "vol": 0.08, "slide": 880.0 },
		{ "f": 990.0, "dur": 0.4, "wave": Wave.TRIANGLE, "vol": 0.08, "slide": 660.0, "delay": 0.3 },
	])


func crystal() -> void:
	_play("crystal_pickup", [
		{ "f": 784.0, "dur": 0.16, "wave": Wave.SINE, "vol": 0.09 },
		{ "f": 1174.0, "dur": 0.22, "wave": Wave.SINE, "vol": 0.08, "delay": 0.05 },
		{ "f": 1568.0, "dur": 0.28, "wave": Wave.TRIANGLE, "vol": 0.06, "delay": 0.1 },
	])


# Looping ambience beds on dedicated players (never stolen by one-shots).
# Callers poll every frame; starting is idempotent and muting is honored.
func _looper(cue: String) -> AudioStreamPlayer:
	if not _loopers.has(cue):
		var p := AudioStreamPlayer.new()
		p.name = cue
		add_child(p)
		_loopers[cue] = p
	return _loopers[cue]


func start_rain() -> void:
	_loop("rain_loop", -14.0)


func stop_rain() -> void:
	var p: AudioStreamPlayer = _loopers.get("rain_loop")
	if p and p.playing:
		p.stop()


func start_wind() -> void:
	_loop("wind_loop", -20.0)


func stop_wind() -> void:
	var p: AudioStreamPlayer = _loopers.get("wind_loop")
	if p and p.playing:
		p.stop()


func start_crystal() -> void:
	_loop("crystal_loop", -25.0)


func stop_crystal() -> void:
	var p: AudioStreamPlayer = _loopers.get("crystal_loop")
	if p and p.playing:
		p.stop()


func start_sky() -> void:
	_loop("sky_loop", -27.0)


func stop_sky() -> void:
	var p: AudioStreamPlayer = _loopers.get("sky_loop")
	if p and p.playing:
		p.stop()


func _procedural_ambience(cue: String) -> AudioStreamWAV:
	const SECONDS := 4.0
	var frames := int(SECONDS * SR)
	var frequencies: Array[float]
	var gains: Array[float]
	if cue == "crystal_loop":
		frequencies = [130.81, 196.0, 261.63, 392.0, 523.25]
		gains = [0.13, 0.08, 0.055, 0.035, 0.02]
	else:
		frequencies = [55.0, 82.5, 110.0, 165.0]
		gains = [0.12, 0.07, 0.04, 0.025]
	var samples := PackedByteArray()
	samples.resize(frames * 2)
	for i in frames:
		var sample := 0.0
		var phase := float(i) / SR
		for tone in frequencies.size():
			sample += sin(TAU * frequencies[tone] * phase) * gains[tone]
		samples.encode_s16(i * 2, int(clampf(sample, -1.0, 1.0) * 32767.0))
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = int(SR)
	wav.stereo = false
	wav.data = samples
	wav.loop_mode = AudioStreamWAV.LOOP_FORWARD
	wav.loop_begin = 0
	wav.loop_end = frames
	return wav


func _loop(cue: String, db: float) -> void:
	if muted:
		return
	var p := _looper(cue)
	if p.stream == null:
		p.stream = _file_stream(cue)
	if p.stream == null and cue in ["crystal_loop", "sky_loop"]:
		p.stream = _procedural_ambience(cue)
	if p.stream == null:
		return
	if not p.playing:
		p.volume_db = db
		p.play()
