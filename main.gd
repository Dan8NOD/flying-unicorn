extends Node2D

const SynthClass := preload("res://synth.gd")

# ─── Setup ────────────────────────────────────────────────────────────────
const W := 960.0
const H := 540.0
const RAINBOW_HEX := ["ff5e7e", "ffb13b", "ffe45c", "5fe08b", "4fc3ff", "b77bff"]
const INK := Color(42.0 / 255, 22.0 / 255, 80.0 / 255, 0.75)

var RAINBOW: Array[Color] = []

# Live viewport size in points. Follows rotation and window resizes; all
# layout bounds read VW/VH. W/H stay as the 960x540 design space the cards
# and art were authored in.
var VW := 960.0
var VH := 540.0
# Portrait mode: the 960x540 world is drawn rotated so travel points up.
var vertical := false
# Current sky top color, also used to paint portrait margin bars.
var sky_top := Color("6ec8ff")
# Animated orientation: the world eases between landscape and portrait over
# TRANS_DUR while gameplay stays frozen, so an accidental tilt never
# whips the playfield around mid-flight.
var view_t := 0.0
var view_target := 0.0
var transitioning := false
const TRANS_DUR := 0.9
# Tilt steering (accelerometer, calibrated when switched on).
var tilt_enabled := false
var tilt_base := Vector3.ZERO
const TILT_GAIN := 2.2
const TILT_DEADZONE := 0.08
# Feel: reactions, blinks, twitches and one shooting star. Mechanics untouched.
var react_pop := 0.0
var react_spin := 0.0
var react_angle := 0.0
var blink_timer := 3.0
var blink_on := 0.0
var ear_timer := 4.0
var ear_tw := 0.0
var shoot := {}
var over_fx_timer := 0.0
var _force_over_at := -1.0
# Settings card state and its test hook.
var settings_open := false
var _btn_tilt := Rect2()
var _btn_close := Rect2()
var _elapsed := 0.0
var _shot_settings_at := -1.0

# ─── Game state ───────────────────────────────────────────────────────────
var state := "title"          # title | play | over
var paused := false
var t := 0.0
var title_ms := 0.0
var score := 0
const HP_MAX := 100.0
const MERCD := 4.0
const MER_RANGE := 312.0
const MER_HEAL := 15.0
const ROCKET_CD := 4.0
var hp := HP_MAX
var mer_px := 90.0
var mer_py := 325.0
var mer_cd := 2.0
var mer_spool := 0.0
var mer_lock = null
var arcs: Array = []
var rockets: Array = []
var rocket_cd := 0.0
var gold_in := 3
var dash_t := 0.0
var dash_lock = null
var _rocket_tap := false
var combo := 0
var best_combo := 0
var rings_passed := 0
var level := 1
var speed := 260.0
var ring_timer := 0.6
var cloud_timer := 3.5
var fire_cooldown := 0.0
const FIRE_INTERVAL := 0.3
const HEAT_TIME := 9.0
const RELOAD_TIME := 3.0
const BEAM_PERIOD := 6.0
const BEAM_DUR := 0.75
var heat := 0.0
var shock: Array = []
var overheated := false
var reload_t := 0.0
var fire_ok := true
var beam_cd := BEAM_PERIOD
var beam_t := 0.0
var hill_x := 0.0
var city_x := 0.0
var ground_y := 0.0
var boss: Boss = null
var bolts: Array = []
var boss_t := 0.0
const BOSS_GAP := 180.0
var boss_spawn_t := 20.0
var boss_kills := 0
var bolt_cd := 0.0
var last_ring_y := H / 2
var hurt_timer := 0.0
var flash := 0.0
var level_banner := 2.2
var over_card_timer := 0.0
var over_card_visible := false
var over_is_best := false

var uni := { "x": 190.0, "y": H / 2, "vx": 0.0, "vy": 0.0, "flap": 0.0, "tilt": 0.0 }

var rings: Array = []
var clouds: Array = []
var lasers: Array = []
var particles: Array = []
var pickups: Array = []
var popups: Array = []

var bg_clouds: Array = []
var stars: Array = []

var pointer_y = null
var pointer_down := false
var pointer_pos := Vector2.ZERO
var last_ring_x := 480.0

var best := 0
var synth: SynthClass

# rendering resources
var font: Font
var sky_tex: Texture2D
var floor_poly: PackedVector2Array
var btn_tex: Texture2D
var _btn_play := Rect2()
var _btn_again := Rect2()
var _btn_resume := Rect2()
var _teaser_rect := Rect2()
var _teaser_over_rect := Rect2()

# screenshot hook
var _shot_at := -1.0
var _shot_path := "/tmp/godot_shot.png"
var _shot_elapsed := 0.0


class Ring:
	var x: float
	var y: float
	var base_y: float
	var ry: float
	var rx := 16.0
	var gold := false
	var red := false
	var done := false
	var result := ""
	var bob := 0.0
	var phase := 0.0


class StormCloud:
	var x: float
	var y: float
	var r := 34.0
	var hp := 2
	var phase := 0.0
	var hit_flash := 0.0
	var dead := false
	var rain := false
	var gust := false
	var lit := false
	var zappy := false


class Bolt:
	var x: float
	var y: float
	var vx: float
	var vy: float
	var dead := false


class Boss:
	var x: float
	var y: float
	var hp := 6
	var max_hp := 6
	var phase := 0.0
	var vx := 0.0
	var vy := 0.0
	var retarget := 0.0
	var enter := true
	var leaving := false
	var shielded := false
	var hit_flash := 0.0
	var beam_tick := 0.0
	var dead := false


class Rocket:
	var x: float
	var y: float
	var vx: float
	var vy: float
	var life := 3.0
	var dead := false
	var lock = null


class Laser:
	var x: float
	var y: float
	var vx := 900.0
	var vy := 0.0
	var c: Color
	var dead := false
	var lock = null


class Pickup:
	var x: float
	var y: float
	var phase := 0.0
	var dead := false


class Particle:
	var x: float
	var y: float
	var vx: float
	var vy: float
	var life: float
	var max_life: float
	var r: float
	var c: Color
	var star := false


class ScorePopup:
	var x: float
	var y: float
	var text: String
	var color: Color
	var life := 1.0


func _ready() -> void:
	for h in RAINBOW_HEX:
		RAINBOW.append(Color(h))

	# Font: Trebuchet with emoji fallback, default font elsewhere
	var sf := SystemFont.new()
	sf.font_names = PackedStringArray(["Trebuchet MS", "TrebuchetMS-Bold"])
	var emoji := SystemFont.new()
	emoji.font_names = PackedStringArray(["Apple Color Emoji"])
	sf.fallbacks = [emoji]
	font = sf

	# Persistence
	var cfg := ConfigFile.new()
	if cfg.load("user://flying_unicorn.cfg") == OK:
		best = int(cfg.get_value("game", "best", 0))
	var muted_saved = cfg.get_value("game", "muted", false)
	tilt_enabled = bool(cfg.get_value("game", "tilt", false))
	synth = SynthClass.new()
	synth.muted = bool(muted_saved)
	add_child(synth)

	_read_viewport_size()
	get_tree().root.size_changed.connect(_on_resize)
	for i in 7:
		bg_clouds.append({ "x": randf_range(0, W), "y": randf_range(30, H - 60), "s": randf_range(0.5, 1.1), "layer": i % 2 })
	for i in 40:
		stars.append({ "x": randf_range(0, W), "y": randf_range(0, H * 0.6), "r": randf_range(0.6, 1.8), "p": randf_range(0, 6) })

	_layout()

	btn_tex = _rounded_gradient_tex(Color("ff6fb5"), Color("b77bff"), Vector2i(190, 48), 24)
	_set_level_sky()
	_setup_input()
	_parse_args()
	reset()
	if _autostart:
		start()


var _autostart := false

func _parse_args() -> void:
	var args := OS.get_cmdline_user_args()
	for a in args:
		if a == "--autostart":
			_autostart = true
		elif a.begins_with("--screenshot="):
			_shot_at = float(a.get_slice("=", 1))
			_autostart = true
		elif a.begins_with("--screenshot-title="):
			_shot_at = float(a.get_slice("=", 1))
		elif a.begins_with("--shot-settings="):
			_shot_settings_at = float(a.get_slice("=", 1))
		elif a.begins_with("--force-over="):
			_force_over_at = float(a.get_slice("=", 1))


func _save_cfg() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("game", "best", best)
	cfg.set_value("game", "muted", synth.muted)
	cfg.set_value("game", "tilt", tilt_enabled)
	cfg.save("user://flying_unicorn.cfg")


# Tilt steering from the accelerometer (public motion API, no private
# access). Steers the same axis the finger steers, so it works in both
# orientations. Baseline is captured when switched on; the sign is tuned
# on device (one-line change in the return below if inverted).
func _tilt_steer() -> float:
	var a := Input.get_accelerometer()
	if a.length() < 0.5:
		return 0.0
	var v := (a.x - tilt_base.x) * TILT_GAIN
	if absf(v) < TILT_DEADZONE:
		return 0.0
	return clampf(v - signf(v) * TILT_DEADZONE, -1.0, 1.0)


func _toggle_tilt() -> void:
	tilt_enabled = not tilt_enabled
	if tilt_enabled:
		var a := Input.get_accelerometer()
		tilt_base = a if a.length() > 0.5 else Vector3.ZERO
	_save_cfg()


# ─── Responsive layout ────────────────────────────────────────────────
func _read_viewport_size() -> void:
	var s := get_viewport_rect().size
	VW = maxf(320.0, s.x)
	VH = maxf(320.0, s.y)


func _on_resize() -> void:
	_layout()


func _layout() -> void:
	_read_viewport_size()
	# Portrait screens play the same 960x540 world rotated 90 degrees, so
	# gameplay tuning never forks: logic bounds stay in W/H, only the
	# screen mapping changes.
	vertical = VH > VW
	uni.x = 190.0 if vertical else maxf(110.0, VW * 0.2)
	uni.y = clampf(uni.y, 70.0, H - 60.0)
	last_ring_y = clampf(last_ring_y, 90.0, H - 110.0)
	# Cloud floor scallop polygon (period 80, drawn shifted by -off)
	floor_poly = PackedVector2Array()
	floor_poly.append(Vector2(-80, H))
	var cx := -40.0
	while cx <= W + 160:
		for j in 12:
			var a := PI + PI * float(j) / 11.0
			floor_poly.append(Vector2(cx + 34 * cos(a), H - 8 + 34 * sin(a)))
		cx += 80
	floor_poly.append(Vector2(W + 160, H))
	for cl in bg_clouds:
		cl.x = clampf(cl.x, -140.0, W + 200.0)
		cl.y = clampf(cl.y, 30.0, H - 60.0)
	for st in stars:
		st.x = clampf(st.x, 0.0, W)
		st.y = clampf(st.y, 0.0, H * 0.6)


# Transition progress eased for the crossfade. Portrait plays overhead
# (camera above, travel up-screen); landscape keeps the side view and
# centers the 960x540 world. HUD, cards and buttons stay upright always.
func _view_ease() -> float:
	var t := clampf(view_t, 0.0, 1.0)
	return t * t * t * (t * (t * 6.0 - 15.0) + 10.0)


# Last settled frame, drawn fading out over the new orientation.
var trans_tex: Texture2D = null


func _snap_old_frame() -> void:
	trans_tex = null
	await RenderingServer.frame_post_draw
	await RenderingServer.frame_post_draw
	if not transitioning:
		return
	trans_tex = ImageTexture.create_from_image(get_viewport().get_texture().get_image())


var _wxf_p := Vector2.ZERO
var _wxf_r := 0.0
var _wxf_s := Vector2.ONE


func _world_begin() -> void:
	# Side view centers the 960x540 world (1:1 when it fits, shrunk on
	# small windows). Overhead draws direct in screen coords.
	_wxf_p = Vector2.ZERO
	_wxf_r = 0.0
	_wxf_s = Vector2.ONE
	if not vertical:
		var s := minf(1.0, minf(VW / 960.0, VH / 540.0))
		_wxf_p = Vector2(VW / 2, VH / 2) - s * Vector2(480, 270)
		_wxf_s = Vector2(s, s)
	_world_apply()


func _world_end() -> void:
	if vertical:
		draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)


# Re-apply the world transform after a local pivot. draw_set_transform is
# absolute, never composed, so every world-space pivot below must go
# through _wxf and return through here.
func _world_apply() -> void:
	draw_set_transform(_wxf_p, _wxf_r, _wxf_s)


func _wxf(pos: Vector2, rot: float, sc: Vector2) -> void:
	draw_set_transform(_wxf_p + (_wxf_s * pos).rotated(_wxf_r), _wxf_r + rot, _wxf_s * sc)


# Map a screen-space touch into side-view logic coordinates.
func _to_logic(vp: Vector2) -> Vector2:
	var s := minf(1.0, minf(VW / 960.0, VH / 540.0))
	var sc := Vector2(VW / 2, VH / 2)
	return Vector2(480, 270) + (vp - sc) / s


# Cards are authored in the 960x540 design space. Returns [screen_center, fit]
# so a card always fits with a 24pt margin, at 1:1 whenever it fits.
func _card_fit() -> Array:
	var c := Vector2(VW / 2, VH / 2)
	var s := minf(1.0, minf((VW - 24.0) / 460.0, (VH - 24.0) / 520.0))
	return [c, s]


func _card_begin() -> void:
	var f := _card_fit()
	draw_set_transform(f[0] - f[1] * Vector2(480, 270), 0, Vector2(f[1], f[1]))


func _card_end() -> void:
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)


# Map a screen-space touch into card design coordinates for hit-testing.
func _card_point(vp: Vector2) -> Vector2:
	var f := _card_fit()
	return Vector2(480, 270) + (vp - f[0]) / f[1]


func _setup_input() -> void:
	_add_action("fly_up")
	_add_key("fly_up", KEY_W)
	_add_key("fly_up", KEY_UP)
	_add_joy_button("fly_up", JOY_BUTTON_DPAD_UP)
	_add_joy_axis("fly_up", JOY_AXIS_LEFT_Y, -1.0)
	_add_action("fly_down")
	_add_key("fly_down", KEY_S)
	_add_key("fly_down", KEY_DOWN)
	_add_joy_button("fly_down", JOY_BUTTON_DPAD_DOWN)
	_add_joy_axis("fly_down", JOY_AXIS_LEFT_Y, 1.0)
	_add_action("fly_left")
	_add_key("fly_left", KEY_A)
	_add_key("fly_left", KEY_LEFT)
	_add_joy_button("fly_left", JOY_BUTTON_DPAD_LEFT)
	_add_joy_axis("fly_left", JOY_AXIS_LEFT_X, -1.0)
	_add_action("fly_right")
	_add_key("fly_right", KEY_D)
	_add_key("fly_right", KEY_RIGHT)
	_add_joy_button("fly_right", JOY_BUTTON_DPAD_RIGHT)
	_add_joy_axis("fly_right", JOY_AXIS_LEFT_X, 1.0)
	_add_action("fire")
	_add_key("fire", KEY_SPACE)
	_add_key("fire", KEY_X)
	_add_key("fire", KEY_K)
	_add_joy_button("fire", JOY_BUTTON_A)
	_add_action("rockets")
	_add_key("rockets", KEY_R)
	_add_joy_button("rockets", JOY_BUTTON_Y)
	_add_joy_axis("fire", JOY_AXIS_TRIGGER_RIGHT, 1.0)
	_add_action("pause_game")
	_add_key("pause_game", KEY_P)
	_add_key("pause_game", KEY_ESCAPE)
	_add_joy_button("pause_game", JOY_BUTTON_START)
	_add_action("ui_start")
	_add_key("ui_start", KEY_ENTER)
	_add_key("ui_start", KEY_KP_ENTER)


func _add_action(name: String) -> void:
	if not InputMap.has_action(name):
		InputMap.add_action(name)


func _add_key(action: String, keycode: Key) -> void:
	var e := InputEventKey.new()
	e.physical_keycode = keycode
	InputMap.action_add_event(action, e)


func _add_joy_button(action: String, btn: JoyButton) -> void:
	var e := InputEventJoypadButton.new()
	e.button_index = btn
	InputMap.action_add_event(action, e)


func _add_joy_axis(action: String, axis: JoyAxis, value: float) -> void:
	var e := InputEventJoypadMotion.new()
	e.axis = axis
	e.axis_value = value
	InputMap.action_add_event(action, e)


func reset() -> void:
	score = 0; hp = HP_MAX; combo = 0; best_combo = 0; rings_passed = 0; level = 1; speed = 260
	react_pop = 0; react_spin = 0; react_angle = 0
	blink_timer = 3.0; blink_on = 0; ear_timer = 4.0; ear_tw = 0; shoot = {}
	over_fx_timer = 0
	rings = []; clouds = []; lasers = []; particles = []; pickups = []; popups = []
	ring_timer = 0.6; cloud_timer = 3.5; fire_cooldown = 0; last_ring_y = H / 2
	heat = 0; overheated = false; reload_t = 0; fire_ok = true; beam_cd = BEAM_PERIOD; beam_t = 0
	shock = []; boss = null; bolts = []; boss_t = 0; boss_spawn_t = 20.0; boss_kills = 0; bolt_cd = 0
	mer_cd = 2.0; mer_spool = 0; mer_lock = null; arcs = []; rockets = []; rocket_cd = 0; _rocket_tap = false; gold_in = 3; dash_t = 0; dash_lock = null;
	hurt_timer = 0; flash = 0; level_banner = 2.2; t = 0
	over_card_timer = 0; over_card_visible = false
	uni.y = H / 2; uni.vy = 0; uni.vx = 0
	last_ring_x = VW / 2
	if vertical:
		uni.x = VW / 2
		uni.y = VH * 0.72
	_set_level_sky()


func start() -> void:
	reset()
	state = "play"
	paused = false
	synth.pony()


func toggle_pause() -> void:
	if state != "play":
		return
	paused = not paused


func game_over() -> void:
	state = "over"
	over_is_best = score > best
	if over_is_best:
		best = score
		_save_cfg()
		# Best-score fanfare around her.
		_burst(uni.x, uni.y, 40, [Color("ffd23f"), Color("fff4b0"), Color.WHITE, Color("ff6fb5")], 260)
	over_card_timer = 1.2
	over_card_visible = false
	over_fx_timer = 0
	boss = null
	bolts = []
	rockets = []
	arcs = []
	dash_t = 0; dash_lock = null;


var _had_focus := false

func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_WINDOW_FOCUS_IN:
		_had_focus = true
	elif what == NOTIFICATION_WM_WINDOW_FOCUS_OUT:
		if _had_focus and state == "play" and not paused:
			toggle_pause()


# ─── Update ───────────────────────────────────────────────────────────────
func _process(delta: float) -> void:
	var dt: float = minf(0.05, delta)
	_elapsed += delta
	if _shot_settings_at >= 0 and _elapsed >= _shot_settings_at:
		_shot_settings_at = -1
		settings_open = true
	if _force_over_at >= 0 and _elapsed >= _force_over_at:
		_force_over_at = -1
		if state == "title":
			start()
		hp = 0.0
		game_over()
	# Gradual orientation tilt; gameplay freezes mid-spin so an
	# accidental rotation never whips the playfield around.
	var want := 1.0 if vertical else 0.0
	if want != view_target:
		view_target = want
		transitioning = true
		# Fresh field on the other side: positions don't translate.
		rings = []; clouds = []; lasers = []; particles = []; pickups = []; popups = []
		_snap_old_frame()
	if transitioning:
		view_t = move_toward(view_t, view_target, delta / TRANS_DUR)
		if view_t == view_target:
			transitioning = false
			trans_tex = null

	# Screenshot test hook
	if _shot_at >= 0:
		_shot_elapsed += delta
		if _shot_elapsed >= _shot_at:
			_shot_at = -1
			_capture()

	# Card / pause hotkeys
	if Input.is_action_just_pressed("pause_game"):
		toggle_pause()
	if (Input.is_action_just_pressed("fire") or Input.is_action_just_pressed("ui_start")) and (state == "title" or (state == "over" and over_card_visible)):
		start()

	if state == "title":
		uni.y = H / 2 + sin(title_ms / 600.0) * 40
	if state == "over":
		uni.y += (H - 110 - uni.y) * minf(1, dt * 1.5)
	if over_card_timer > 0:
		over_card_timer -= dt
		if over_card_timer <= 0 and state == "over":
			over_card_visible = true
	if not paused and not transitioning and not settings_open:
		title_ms += dt * 1000
		_game_update(dt)
	else:
		synth.stop_rain()
		synth.stop_wind()
	queue_redraw()


func _game_update(dt: float) -> void:
	t += dt
	if level_banner > 0: level_banner -= dt
	if flash > 0: flash -= dt
	if hurt_timer > 0: hurt_timer -= dt
	fire_cooldown = maxf(0, fire_cooldown - dt)
	_tick_weapons(dt)
	_boss_update(dt)
	_mermaid_update(dt)
	_update_rockets(dt)
	_dash_step(dt)
	# Feel timers: reactions decay, ambient life goes on.
	react_pop = maxf(0.0, react_pop - dt * 3.5)
	react_angle += react_spin * dt
	react_spin = move_toward(react_spin, 0.0, dt * 14.0)
	# Settle back to upright — a resting tilt reads as stuck sideways.
	if absf(react_spin) < 0.5:
		var full := roundf(react_angle / TAU) * TAU
		react_angle = lerpf(react_angle, full, minf(1.0, dt * 6.0))
		if absf(react_angle - full) < 0.001:
			react_angle = full
	blink_timer -= dt
	if blink_timer <= 0:
		blink_timer = randf_range(2.5, 5.5)
		blink_on = 0.12
	if blink_on > 0: blink_on -= dt
	ear_timer -= dt
	if ear_timer <= 0:
		ear_timer = randf_range(3.0, 7.0)
		ear_tw = 0.25
	if ear_tw > 0: ear_tw -= dt
	# Gentle landing sparkles while she floats down to the card.
	over_fx_timer -= dt
	if state == "over" and not over_card_visible and over_fx_timer <= 0:
		over_fx_timer = 0.15
		_burst(uni.x + randf_range(-30, 30), uni.y + randf_range(-10, 30), 3, [Color.WHITE, Color("ffd9ef"), Color("ffd23f")], 90)
	if shoot.is_empty():
		if level >= 2 and randf() < (dt / 3.0 if _in_space() else dt / 12.0):
			shoot = { "x": randf_range(W * 0.3, W + 100), "y": randf_range(40, H * 0.35), "life": 0.7 }
	else:
		shoot.x -= 700 * dt
		shoot.y += 260 * dt
		shoot.life -= dt
		if shoot.life <= 0: shoot = {}

	if vertical:
		_game_overhead(dt)
		return

	# Movement: pointer steers toward finger; keys/stick/dpad accelerate.
	# Stick and keys also fly her back and forth; touch keeps her lane.
	if state == "play" and dash_t <= 0:
		if pointer_y != null:
			var target: float = clampf(pointer_y, 50, H - 60)
			uni.vy += (target - uni.y) * 14 * dt
			uni.vy *= pow(0.02, dt)
			uni.vx *= pow(0.04, dt)
		else:
			var up := Input.is_action_pressed("fly_up")
			var down := Input.is_action_pressed("fly_down")
			if up: uni.vy -= 1500 * dt
			if down: uni.vy += 1500 * dt
			if not up and not down:
				uni.vy *= pow(0.04, dt)
			if tilt_enabled and not up and not down:
				uni.vy += _tilt_steer() * 1500 * dt
			var left := Input.is_action_pressed("fly_left")
			var right := Input.is_action_pressed("fly_right")
			if left: uni.vx -= 1500 * dt
			if right: uni.vx += 1500 * dt
			if not left and not right:
				uni.vx *= pow(0.04, dt)
	else:
		uni.vy *= pow(0.04, dt)
		uni.vx *= pow(0.04, dt)
	uni.vy = clampf(uni.vy, -520, 520)
	uni.y += uni.vy * dt
	uni.vx = clampf(uni.vx, -460, 460)
	uni.x += uni.vx * dt
	if uni.x < 60:
		uni.x = 60
		uni.vx = absf(uni.vx) * 0.5
	if uni.x > W - 200:
		uni.x = W - 200
		uni.vx = -absf(uni.vx) * 0.5

	# A magic pony never falls: bounce softly off the sky ceiling and cloud floor
	if uni.y > H - 60:
		uni.y = H - 60
		uni.vy = -absf(uni.vy) * 0.5 - 60
		if state == "play":
			_burst(uni.x, uni.y + 34, 4, [Color.WHITE, Color("ffd9ef")], 120)
			react_pop = maxf(react_pop, 0.35)
	if uni.y < 70:
		uni.y = 70
		uni.vy = absf(uni.vy) * 0.4

	uni.tilt += (clampf(uni.vy / 900, -0.35, 0.35) - uni.tilt) * minf(1, dt * 8)
	# Wings beat harder on the climb, glide on the way down.
	var flap_rate := 6.0 if state != "play" else clampf(11.0 - uni.vy / 80.0, 7.0, 16.0)
	uni.flap += dt * flap_rate

	# Rainbow sparkle trail
	if randf() < 0.7:
		var p := Particle.new()
		p.x = uni.x - 70; p.y = uni.y + randf_range(-4, 20)
		p.vx = -speed * 0.6; p.vy = randf_range(-20, 20)
		p.life = 0.6; p.max_life = 0.6; p.r = randf_range(2, 4)
		p.c = RAINBOW[int(t * 12) % 6]
		p.star = randf() < 0.4
		particles.append(p)

	if state != "play":
		_update_particles(dt)
		return

	# Firing (touch / space / gamepad)
	var want_fire := (pointer_down or Input.is_action_pressed("fire")) and fire_ok
	if want_fire and fire_cooldown <= 0:
		var tip := _horn_tip()
		var l := Laser.new()
		l.x = tip.x; l.y = tip.y
		l.c = RAINBOW[lasers.size() % 6]
		lasers.append(l)
		fire_cooldown = FIRE_INTERVAL
		heat += FIRE_INTERVAL / HEAT_TIME
		if heat >= 1.0:
			_start_reload()
		synth.laser()

	# Spawning
	ring_timer -= dt
	if ring_timer <= 0:
		if rings.size() < _ring_target():
			_spawn_ring()
		ring_timer = randf_range(1.25, 1.7) * (260 / speed) * 1.32
	cloud_timer -= dt
	if cloud_timer <= 0:
		_spawn_cloud()
		cloud_timer = randf_range(3.7, 6.7) / (0.8 + level * 0.2)
	if hp < 70.0 and randf() < dt * 0.04 and pickups.is_empty():
		var pk := Pickup.new()
		pk.x = W + 40; pk.y = randf_range(90, H - 120); pk.phase = randf_range(0, 6)
		pickups.append(pk)

	# Rings
	for r in rings:
		r.x -= speed * dt
		if r.bob > 0:
			r.y = r.base_y + sin(t * 1.6 + r.phase) * r.bob
		if not r.done and r.x <= uni.x:
			r.done = true
			if absf(uni.y - r.y) < r.ry - 12:
				r.result = "hit"
				react_pop = 1.0
				if r.gold: _gold_hit()
				elif r.red: _red_hit()
				combo += 1; rings_passed += 1
				best_combo = maxi(best_combo, combo)
				var pts := (50 if r.gold else 10) * combo
				score += pts
				_popup(r.x, r.y - r.ry - 10, "+%d%s" % [pts, "  x%d" % combo if combo > 1 else ""], Color("ffd23f") if r.gold else Color.WHITE)
				_burst(r.x, r.y, 36 if r.gold else 18, [Color("ffd23f"), Color("fff4b0"), Color.WHITE] if r.gold else RAINBOW)
				if r.gold: synth.gold()
				else: synth.ring(combo)
				if rings_passed % 10 == 0:
					_level_up()
			else:
				r.result = "miss"
				if combo > 1:
					_popup(uni.x, uni.y - 70, "combo lost", Color("ffd9ef"))
				combo = 0
	rings = rings.filter(func(r): return r.x > -60)

	# Lasers
	for l in lasers:
		_steer_laser(l, dt)
		l.x += l.vx * dt
		l.y += l.vy * dt
	lasers = lasers.filter(func(l): return l.x < W + 40 and l.x > -60 and l.y > -60 and l.y < H + 60 and not l.dead)

	# Storm clouds
	for c in clouds:
		c.x -= speed * (1.6 if c.gust else 0.85) * dt
		c.y += sin(t * 2 + c.phase) * 30 * dt
		if c.hit_flash > 0: c.hit_flash -= dt
		var flash_now: bool = c.zappy and sin(t * 5 + c.phase) > 0.3
		if flash_now and not c.lit and c.x > -40 and c.x < W + 40:
			synth.thunder()
		c.lit = flash_now
		for l in lasers:
			if not l.dead and Vector2(l.x - c.x, l.y - c.y).length() < c.r + 8:
				l.dead = true; c.hp -= 1; c.hit_flash = 0.08
				_burst(l.x, l.y, 5, [Color.WHITE, l.c], 140)
				synth.zap()
				if c.hp <= 0:
					c.dead = true; score += 25
					_popup(c.x, c.y - 40, "+25 zap!", Color("ffe45c"))
					_burst(c.x, c.y, 28, [Color.WHITE, Color("e8e0ff"), Color("ffe45c"), Color("b77bff")], 260)
					synth.poof()
		if not c.dead and c.gust and Vector2(uni.x - c.x, uni.y - c.y).length() < c.r + 26:
			c.dead = true; score += 5
			uni.vy += signf(uni.y - c.y) * 300
			_popup(c.x, c.y - 40, "+5 whee!", Color("bfe9ff"))
			_burst(c.x, c.y, 12, [Color.WHITE, Color("bfe9ff")], 180)
			synth.poof()
		if not c.dead and hurt_timer <= 0 and Vector2(uni.x + 10 - c.x, uni.y - 10 - c.y).length() < c.r + 26:
			c.dead = true; hp = maxf(0.0, hp - 34.0); combo = 0; hurt_timer = 1.6; flash = 0.25
			react_pop = 1.0; react_spin = -9.0
			_burst(c.x, c.y, 20, [Color("6d6690"), Color("ffe45c")], 200)
			synth.hurt()
			Input.vibrate_handheld(300)
			if hp <= 0:
				game_over()
	clouds = clouds.filter(func(c): return c.x > -80 and not c.dead)

	# Heart pickups
	for p in pickups:
		p.x -= speed * 0.9 * dt
		if Vector2(uni.x - p.x, uni.y - 10 - p.y).length() < 40:
			p.dead = true; hp = minf(HP_MAX, hp + 30.0)
			_popup(p.x, p.y - 30, "+30 HP", Color("ff6fb5"))
			_burst(p.x, p.y, 16, [Color("ff6fb5"), Color.WHITE], 180)
			synth.heart()
	pickups = pickups.filter(func(p): return p.x > -40 and not p.dead)

	_manage_ambience()
	_update_particles(dt)


func _start_reload() -> void:
	overheated = true
	reload_t = RELOAD_TIME
	heat = 1.0
	synth.reload()
	_popup(uni.x, uni.y - 110, "Reloading…", Color("9adcff"))


func _beam_origin() -> Vector2:
	if vertical:
		return Vector2(uni.x, uni.y - 40)
	var cc := cos(uni.tilt)
	var ss := sin(uni.tilt)
	var lx := 12.0
	var ly := -47.0
	return Vector2(uni.x + lx * cc - ly * ss, uni.y + lx * ss + ly * cc)


# Heat, reload and the auto eye-beam. Sets fire_ok for the two fire sites.
func _tick_weapons(dt: float) -> void:
	var want_fire := state == "play" and (pointer_down or Input.is_action_pressed("fire"))
	if overheated:
		reload_t -= dt
		heat = clampf(reload_t / RELOAD_TIME, 0.0, 1.0)
		if reload_t <= 0:
			overheated = false
			heat = 0.0
			synth.ready()
	elif not want_fire:
		heat = maxf(0.0, heat - dt / (HEAT_TIME * 0.5))
	fire_ok = want_fire and not overheated
	if state != "play":
		return
	if beam_t > 0:
		beam_t -= dt
		_beam_hit(dt)
		if beam_t <= 0:
			beam_cd = BEAM_PERIOD - BEAM_DUR
	elif beam_cd > 0:
		beam_cd -= dt
		if beam_cd <= 0:
			beam_t = BEAM_DUR
			if boss != null:
				boss.beam_tick = 0.0
			synth.beam()
			_popup(uni.x, uni.y - 130, "EYE BEAM!", Color("ff4d5e"))


func _beam_hit(dt: float) -> void:
	if boss != null and not boss.dead and not boss.leaving:
		var bin: bool = (absf(boss.x - uni.x) < 90 and boss.y < uni.y) if vertical else (boss.x > uni.x - 20 and absf(boss.y - (uni.y - 47)) < 90)
		if bin:
			boss.beam_tick -= dt
			if boss.beam_tick <= 0:
				boss.beam_tick = 0.35
				_damage_boss(1)
				_burst(boss.x, boss.y, 10, [Color.WHITE, Color("ff4d5e")], 220)
	for c in clouds:
		if c.dead:
			continue
		var in_beam: bool = (absf(c.x - uni.x) < 80 and c.y < uni.y) if vertical else (c.x > uni.x - 20 and absf(c.y - (uni.y - 47)) < 70)
		if in_beam:
			c.dead = true
			score += 25
			_burst(c.x, c.y, 24, [Color.WHITE, Color("ff4d5e"), Color("ffd23f")], 260)


func _spawn_boss() -> void:
	var nb := Boss.new()
	nb.hp = 5 + level
	nb.max_hp = nb.hp
	nb.phase = randf_range(0, 6)
	if vertical:
		nb.x = VW / 2
		nb.y = -80
	else:
		nb.x = W + 80
		nb.y = H * 0.25
	boss = nb
	boss_t = 15.0
	bolt_cd = 1.5
	_popup(clampf(nb.x, 140, (VW if vertical else W) - 140), 150, "BOSS! 15s!", Color("c77bff"))
	synth.boss()


func _boss_update(dt: float) -> void:
	if state != "play":
		return
	if boss == null:
		boss_spawn_t -= dt
		if boss_spawn_t <= 0:
			_spawn_boss()
		return
	var b := boss
	if b.hit_flash > 0:
		b.hit_flash -= dt
	var ramp := 1.0 + 0.3 * (1.0 - clampf(boss_t / 15.0, 0.0, 1.0))
	if b.leaving:
		if vertical:
			b.y += 420 * dt
		else:
			b.x += 420 * dt
		_update_bolts(dt, false)
		if (b.y > VH + 100) if vertical else (b.x > W + 100):
			boss = null
		return
	boss_t -= dt
	if boss_t <= 7.5 and not b.shielded:
		b.shielded = true
		b.hp += 2
		b.max_hp += 2
		_popup(b.x, b.y - 70, "Shield up!", Color("b77bff"))
	if boss_t <= 0:
		_boss_escape()
		return
	if b.enter:
		if vertical:
			b.y += 130 * dt
			if b.y >= 150:
				b.enter = false
		else:
			b.x -= 130 * dt
			if b.x <= W - 170:
				b.enter = false
	else:
		b.retarget -= dt
		if b.retarget <= 0:
			b.retarget = randf_range(1.5, 3.0)
			b.vx = randf_range(-55, 55)
			b.vy = randf_range(-40, 40)
		b.x += (b.vx * ramp + sin(t * 1.7 + b.phase) * 20) * dt
		b.y += (b.vy * ramp + cos(t * 1.3 + b.phase) * 16) * dt
		if vertical:
			b.x = clampf(b.x, 70, VW - 70)
			b.y = clampf(b.y, 100, VH * 0.4)
		else:
			b.x = clampf(b.x, W * 0.45, W - 100)
			b.y = clampf(b.y, 80, H * 0.45)
	bolt_cd -= dt
	if bolt_cd <= 0 and not b.enter:
		bolt_cd = 1.6
		var base := Vector2(uni.x - b.x, uni.y - b.y).angle()
		for k in [-1, 0, 1]:
			var nb := Bolt.new()
			nb.x = b.x
			nb.y = b.y + 20
			var ang: float = base + k * 0.18
			nb.vx = cos(ang) * 330
			nb.vy = sin(ang) * 330
			bolts.append(nb)
		synth.zap()
	_laser_vs_boss()
	_update_bolts(dt, true)


func _laser_vs_boss() -> void:
	if boss == null or boss.dead or boss.leaving:
		return
	for l in lasers:
		if not l.dead and Vector2(l.x - boss.x, l.y - boss.y).length() < 64:
			l.dead = true
			_damage_boss(1)
			_burst(l.x, l.y, 6, [Color.WHITE, Color("c77bff")], 160)


func _damage_boss(n: int) -> void:
	if boss == null or boss.dead:
		return
	boss.hp -= n
	boss.hit_flash = 0.08
	if boss.hp <= 0:
		_kill_boss()
	else:
		synth.zap()


func _kill_boss() -> void:
	var pts := 100 + 25 * level
	score += pts
	_popup(boss.x, boss.y - 70, "BOSS DOWN! +%d" % pts, Color("ffd23f"))
	_burst(boss.x, boss.y, 60, [Color.WHITE, Color("c77bff"), Color("ffd23f"), Color("ff4d5e")], 320)
	_burst(boss.x, boss.y, 30, [Color("b77bff"), Color.WHITE], 180)
	synth.level_up()
	synth.poof()
	synth.pony()
	boss_kills += 1
	boss = null
	bolts = []
	boss_spawn_t = BOSS_GAP


func _boss_escape() -> void:
	boss.leaving = true
	boss_spawn_t = BOSS_GAP
	_popup(boss.x, boss.y - 70, "Boss got away…", Color("9adcff"))


func _update_bolts(dt: float, can_hit: bool) -> void:
	for bl in bolts:
		bl.x += bl.vx * dt
		bl.y += bl.vy * dt
		if can_hit and not bl.dead and hurt_timer <= 0 and Vector2(uni.x - bl.x, uni.y - bl.y).length() < 30:
			bl.dead = true
			_hurt_player()
	bolts = bolts.filter(func(bl): return not bl.dead and bl.x > -60 and bl.x < (VW if vertical else W) + 60 and bl.y > -60 and bl.y < (VH if vertical else H) + 60)


func _hurt_player(amount := 25.0) -> void:
	hp = maxf(0.0, hp - amount)
	combo = 0
	hurt_timer = 1.6
	flash = 0.25
	react_pop = 1.0
	react_spin = -9.0
	_burst(uni.x, uni.y, 20, [Color("c77bff"), Color("ffe45c")], 200)
	synth.hurt()
	Input.vibrate_handheld(300)
	if hp <= 0:
		game_over()


func _draw_boss() -> void:
	_wxf(Vector2(boss.x, boss.y), sin(t * 2 + boss.phase) * 0.08, Vector2.ONE)
	_fill_ellipse(Vector2(0, 28), 54, 14, Color(0.7, 0.3, 1, 0.25))
	draw_circle(Vector2(0, -12), 20, Color.WHITE if boss.hit_flash > 0 else Color("c9cde0"))
	draw_arc(Vector2(0, -12), 20, PI, TAU, 24, Color("5d6384"), 2.5, true)
	draw_circle(Vector2(6, -18), 6, Color(1, 1, 1, 0.6))
	_fill_ellipse(Vector2.ZERO, 56, 24, Color.WHITE if boss.hit_flash > 0 else Color("8b86a8"))
	draw_polyline(_arc_pts(0, 0, 56, 24, 0, TAU, 40), Color("3d3a5c"), 3, true)
	_fill_ellipse(Vector2.ZERO, 26, 11, Color("1a1430"))
	draw_polyline(_arc_pts(0, 0, 26, 11, 0, TAU, 28), Color("b77bff"), 2.5, true)
	for i in 3:
		var la := t * 3 + i * TAU / 3.0
		var lc := Color("ff4d5e") if i == 0 else (Color("ffd23f") if i == 1 else Color("7df0c8"))
		draw_circle(Vector2(cos(la) * 44, sin(la) * 18), 5, lc)
	var frac := clampf(float(boss.hp) / float(maxi(boss.max_hp, 1)), 0.0, 1.0)
	draw_arc(Vector2.ZERO, 70, -PI / 2, -PI / 2 + TAU * frac, 44, Color("b77bff"), 5, true)
	_world_apply()


func _hurt_cloud(c, n: int) -> void:
	if c.dead:
		return
	c.hp -= n
	c.hit_flash = 0.08
	_burst(c.x, c.y, 8, [Color.WHITE, Color("ffe45c")], 180)
	if c.hp <= 0:
		c.dead = true
		score += 25
		_popup(c.x, c.y - 40, "+25 zap!", Color("ffe45c"))
		_burst(c.x, c.y, 28, [Color.WHITE, Color("e8e0ff"), Color("ffe45c"), Color("b77bff")], 260)
		synth.poof()


func _mer_pos() -> Vector2:
	return Vector2(mer_px, mer_py + sin(t * 3.0) * 6.0)


func _nearest_foe(mp: Vector2, max_d := MER_RANGE):
	var best = null
	var best_d := max_d
	for c in clouds:
		if c.dead:
			continue
		var d := Vector2(c.x - mp.x, c.y - mp.y).length()
		if d < best_d:
			best_d = d
			best = c
	if boss != null and not boss.dead and not boss.leaving:
		var bd := Vector2(boss.x - mp.x, boss.y - mp.y).length()
		if bd < best_d:
			best = boss
	return best


# Mermaid Medic, FCC-style: 1s spool tell, then a 5s-cycle
# discharge that zaps the locked foe and heals the pony.
func _mermaid_update(dt: float) -> void:
	var anchor := Vector2(uni.x + 75, uni.y - 55) if vertical else Vector2(uni.x + 95, uni.y + 20)
	var k := minf(1.0, dt * 3.0)
	mer_px = lerpf(mer_px, anchor.x, k)
	mer_py = lerpf(mer_py, anchor.y, k)
	if state != "play":
		return
	var mp := _mer_pos()
	if mer_cd > 0:
		mer_cd -= dt
		mer_spool = 0
		mer_lock = null
		return
	if mer_lock == null or not is_instance_valid(mer_lock) or mer_lock.dead:
		mer_lock = _nearest_foe(mp)
		mer_spool = 0
	if mer_lock == null:
		return
	if mer_spool <= 0:
		synth.ready()
	mer_spool += dt
	if mer_spool >= 1.0:
		_discharge(mp)


func _discharge(mp: Vector2) -> void:
	var tgt = mer_lock
	mer_lock = null
	mer_spool = 0
	mer_cd = MERCD
	if tgt == null or not is_instance_valid(tgt) or tgt.dead:
		return
	arcs.append({ "ax": mp.x, "ay": mp.y, "bx": tgt.x, "by": tgt.y, "life": 0.22, "max": 0.22 })
	if tgt is Boss:
		_damage_boss(3)
	else:
		_hurt_cloud(tgt, 2)
	hp = minf(HP_MAX, hp + MER_HEAL)
	_burst(uni.x, uni.y, 8, [Color("7df0c8"), Color.WHITE], 120)
	synth.zap()


func _fire_rockets(free := false) -> void:
	if state != "play" or (rocket_cd > 0 and not free):
		return
	if not free:
		rocket_cd = ROCKET_CD
	var foe = _nearest_foe(Vector2(uni.x, uni.y), 2000.0)
	for k in [-1, 0, 1]:
		var r := Rocket.new()
		if vertical:
			r.x = uni.x + k * 22
			r.y = uni.y - 30
			r.vx = 0
			r.vy = -820
		else:
			r.x = uni.x + 34
			r.y = uni.y + k * 16
			r.vx = 820
			r.vy = 0
		r.lock = foe
		rockets.append(r)
	synth.rocket()


func _rocket_boom(x: float, y: float) -> void:
	flash = maxf(flash, 0.08)
	shock.append({ "x": x, "y": y, "life": 0.45, "max": 0.45 })
	_burst(x, y, 34, [Color.WHITE, Color("ffb13d"), Color("ff4d5e")], 320)
	_burst(x, y, 14, [Color("7a7a8a"), Color.WHITE], 160)
	for c in clouds:
		if not c.dead and Vector2(c.x - x, c.y - y).length() < 85:
			_hurt_cloud(c, 1)
	synth.boom()


func _update_rockets(dt: float) -> void:
	if state == "play":
		rocket_cd = maxf(0.0, rocket_cd - dt)
		if Input.is_action_just_pressed("rockets") or _rocket_tap:
			_rocket_tap = false
			_fire_rockets()
	for r in rockets:
		if r.lock != null and is_instance_valid(r.lock) and not r.lock.dead:
			var want := (Vector2(r.lock.x, r.lock.y) - Vector2(r.x, r.y))
			if want.length() > 1:
				want = want.normalized() * 820.0
				var v := Vector2(r.vx, r.vy).lerp(want, minf(1.0, dt * 5.0))
				if v.length() > 1:
					v = v.normalized() * 820.0
					r.vx = v.x
					r.vy = v.y
		r.x += r.vx * dt
		r.y += r.vy * dt
		r.life -= dt
		var tp := Particle.new()
		tp.x = r.x
		tp.y = r.y
		tp.vx = -r.vx * 0.08 + randf_range(-30, 30)
		tp.vy = -r.vy * 0.08 + randf_range(-30, 30)
		tp.life = 0.35
		tp.max_life = 0.35
		tp.r = randf_range(3, 6)
		tp.c = Color("ffb13d") if randf() < 0.6 else Color("ff4d5e")
		tp.star = false
		particles.append(tp)
		if r.life <= 0:
			r.dead = true
			continue
		for c in clouds:
			if not c.dead and Vector2(r.x - c.x, r.y - c.y).length() < 44:
				r.dead = true
				_rocket_boom(r.x, r.y)
				_hurt_cloud(c, 3)
				break
		if not r.dead and boss != null and not boss.dead and not boss.leaving and Vector2(r.x - boss.x, r.y - boss.y).length() < 72:
			r.dead = true
			_rocket_boom(r.x, r.y)
			_damage_boss(2)
	rockets = rockets.filter(func(r): return not r.dead and r.x > -60 and r.x < (VW if vertical else W) + 60 and r.y > -60 and r.y < (VH if vertical else H) + 60)


func _draw_mermaid() -> void:
	var mp := _mer_pos()
	var spooling := mer_spool > 0
	var thrash := 9.0 if spooling else 2.5
	if spooling:
		draw_circle(mp, 20 + mer_spool * 10, Color(0.55, 1, 1, 0.3 * mer_spool))
		draw_arc(mp, 24 + mer_spool * 10, 0, TAU, 32, Color(1, 1, 1, 0.5 * mer_spool), 2, true)
	var to_pony := (Vector2(uni.x, uni.y) - mp).normalized()
	var back := -to_pony
	var perp := Vector2(-back.y, back.x)
	var w1 := sin(t * thrash) * 6.0
	var w2 := sin(t * thrash + 1.2) * 8.0
	# Tail: curved body, belly stripe, dorsal fin, notched fluke.
	var tail := PackedVector2Array([mp + perp * 7, mp + back * 28 + perp * w1, mp + back * 13 - perp * 7])
	draw_colored_polygon(tail, Color("1f9e85"))
	draw_colored_polygon(PackedVector2Array([mp + perp * 2, mp + back * 24 + perp * w1, mp + back * 12 - perp * 2]), Color("7df0c8"))
	draw_colored_polygon(PackedVector2Array([mp + back * 10 + perp * 4, mp + back * 20 + perp * (w1 * 0.5), mp + back * 12 + perp * 12]), Color("17806c"))
	var fluke := mp + back * 28 + perp * w1
	draw_colored_polygon(PackedVector2Array([fluke + perp * 8 + back * 2, fluke - perp * 8 + back * 2, fluke + back * 16 + perp * w2 * 0.4]), Color("2fbfa0"))
	# Hair mass + five flowing strands behind the head.
	var hair_base := mp + back * 8
	draw_circle(hair_base, 9, Color("ff6fb5"))
	for h in 5:
		var hf: float = h - 2.0
		var sway := sin(t * 4 + h * 1.3) * 3.0
		draw_circle(hair_base + back * (6 + h * 3.0) + perp * (hf * 4.0 + sway), 4.5 - absf(hf) * 0.6, Color("ff9ccf"))
	# Torso, shell top, reaching arm.
	draw_circle(mp + to_pony * 2, 8, Color("ffd9c9"))
	draw_circle(mp + to_pony * 5 + perp * -4, 3.2, Color("ff9ccf"))
	draw_circle(mp + to_pony * 5 + perp * 4, 3.2, Color("ff9ccf"))
	var hand := mp + to_pony * 14 + perp * 3 + Vector2(0, sin(t * 3) * 2)
	draw_line(mp + to_pony * 6, hand, Color("ffd9c9"), 4, true)
	draw_circle(hand, 2.5, Color("ffd9c9"))
	# Happy face toward the pony, star hairpin, drifting bubbles.
	var face := mp + to_pony * 3
	draw_arc(face + perp * 1, 2.5, PI * 0.15, PI * 0.85, 10, Color("2a1650"), 1.5, true)
	draw_circle(face - perp * 4 + to_pony * 1, 1.6, Color("ff9ccf"))
	draw_colored_polygon(_sparkle_poly((face + back * 8 - perp * 6).x, (face + back * 8 - perp * 6).y, 4), Color("ffd23f"))
	for bi in 2:
		var bpos := mp + Vector2(sin(t * 2 + bi * 2.1) * 9, -20 - fmod(t * 18 + bi * 14, 30))
		draw_circle(bpos, 2, Color(1, 1, 1, 0.5))
		draw_arc(bpos, 2, 0, TAU, 10, Color(1, 1, 1, 0.7), 1, true)


func _steer_laser(l, dt: float) -> void:
	if l.lock == null or not is_instance_valid(l.lock) or l.lock.dead:
		return
	var want := Vector2(l.lock.x, l.lock.y) - Vector2(l.x, l.y)
	if want.length() < 1:
		return
	var spd := Vector2(l.vx, l.vy).length()
	want = want.normalized() * spd
	var v := Vector2(l.vx, l.vy).lerp(want, minf(1.0, dt * 3.0))
	if v.length() > 1:
		v = v.normalized() * spd
		l.vx = v.x
		l.vy = v.y


func _red_hit() -> void:
	flash = maxf(flash, 0.1)
	_start_dash()
	beam_t = BEAM_DUR
	if boss != null:
		boss.beam_tick = 0.0
	synth.beam()
	_popup(uni.x, uni.y - 130, "EYE BEAM!", Color("ff4d5e"))


func _foe_count() -> int:
	var n := 0
	for c in clouds:
		if not c.dead:
			n += 1
	if boss != null and not boss.leaving:
		n += 1
	return n


func _foe_cap() -> int:
	var cap := mini(1 + level / 2, 3)
	if boss != null:
		cap -= 1
	return maxi(0, cap)


func _ring_target() -> int:
	return maxi(2, 2 * _foe_count())


func _start_dash() -> void:
	var best = null
	var best_d := 1e18
	for r in rings:
		if r.done:
			continue
		var ahead: bool = (r.y < uni.y) if vertical else (r.x > uni.x)
		if not ahead:
			continue
		var d: float = absf(r.y - uni.y) if vertical else absf(r.x - uni.x)
		if d < best_d:
			best_d = d
			best = r
	if best == null:
		return
	dash_lock = best
	dash_t = 0.55
	hurt_timer = maxf(hurt_timer, 0.55)
	_burst(uni.x, uni.y, 12, [Color.WHITE, Color("ff4d5e")], 260)


func _dash_step(dt: float) -> void:
	if dash_t <= 0 or state != "play":
		return
	dash_t -= dt
	var tgt = dash_lock
	if tgt == null or not is_instance_valid(tgt) or tgt.done:
		dash_t = 0
		dash_lock = null
		return
	if vertical:
		var dx: float = tgt.x - uni.x
		if absf(dx) < 30:
			dash_t = 0
			dash_lock = null
			return
		uni.vx = clampf(dx * 10.0, -560.0, 560.0)
	else:
		var d := Vector2(tgt.x - uni.x, tgt.y - uni.y)
		if d.length() < 34:
			dash_t = 0
			dash_lock = null
			return
		var v := d.normalized() * 560.0
		uni.vx = v.x
		uni.vy = v.y
	for k in 5:
		var tp := Particle.new()
		tp.x = uni.x + randf_range(-14, 14)
		tp.y = uni.y + randf_range(-14, 14)
		tp.vx = randf_range(-60, 60)
		tp.vy = randf_range(-60, 60)
		tp.life = 0.3
		tp.max_life = 0.3
		tp.r = randf_range(3, 5)
		tp.c = RAINBOW[randi() % 6]
		tp.star = true
		particles.append(tp)
	if dash_t <= 0:
		dash_lock = null


func _roll_cloud_kind(c: StormCloud) -> void:
	var roll := randf()
	c.zappy = randf() < 1.0 / 9.0
	var gust_odds := 0.0
	if level >= 3:
		gust_odds = 0.15 + 0.02 * mini(level - 3, 5)
	if level >= 3 and roll < gust_odds:
		c.gust = true
		c.hp = 1
	elif level >= 2 and roll < 0.5:
		c.rain = true
	if level >= 5 and randf() < 0.3:
		c.hp = 2


# Rain patter while a rain cloud is alive; wind bed through every round.
func _manage_ambience() -> void:
	var any_rain := false
	for c in clouds:
		if not c.dead and c.rain:
			any_rain = true
			break
	if any_rain:
		synth.start_rain()
	else:
		synth.stop_rain()
	if state == "play":
		synth.start_wind()
	else:
		synth.stop_wind()


func _spawn_ring_top() -> void:
	var r := Ring.new()
	r.red = randf() < 0.10
	gold_in -= 1
	if gold_in <= 0:
		r.gold = true
		r.red = false
		gold_in = randi_range(3, 5)
	else:
		r.gold = false
	var rspread: float = randf_range(-220, 220) if boss != null else randf_range(-140, 140)
	r.x = clampf(last_ring_x + rspread, 70, VW - 70)
	last_ring_x = r.x
	r.y = -70
	r.base_y = r.y
	var rad := 46.0 if r.gold else 58.0
	r.rx = rad
	r.ry = rad
	r.bob = randf_range(20, 40 + 8 * mini(level - 3, 4)) if (level >= 3 and randf() < 0.5) or level >= 6 else 0.0
	r.phase = randf_range(0, 6)
	rings.append(r)


# Overhead portrait mode: top-down camera, she strafes across the screen
# on a fixed rail while the world scrolls down. Scoring, combo, levels,
# clouds and pickups mirror the side view one-to-one.
func _game_overhead(dt: float) -> void:
	if state == "play" and not paused:
		ground_y += speed * dt * 0.25
	# Movement: strafe; rail height is fixed.
	if state == "play" and dash_t <= 0:
		if pointer_down:
			var target: float = clampf(pointer_pos.x, 50, VW - 50)
			uni.vx += (target - uni.x) * 14 * dt
			uni.vx *= pow(0.02, dt)
		else:
			var lx := 0.0
			if Input.is_action_pressed("fly_left"): lx -= 1.0
			if Input.is_action_pressed("fly_right"): lx += 1.0
			uni.vx += lx * 2200 * dt
			if tilt_enabled and lx == 0.0:
				uni.vx += _tilt_steer() * 1500 * dt
			if lx == 0.0 and not tilt_enabled:
				uni.vx *= pow(0.04, dt)
	else:
		uni.vx *= pow(0.04, dt)
	uni.vx = clampf(uni.vx, -560, 560)
	uni.x += uni.vx * dt
	if uni.x < 50:
		uni.x = 50
		uni.vx = absf(uni.vx) * 0.5
	if uni.x > VW - 50:
		uni.x = VW - 50
		uni.vx = -absf(uni.vx) * 0.5
	uni.y = VH * 0.72 + sin(t * 2) * 6
	uni.tilt += (clampf(uni.vx / 900, -0.4, 0.4) - uni.tilt) * minf(1, dt * 8)
	uni.flap += dt * (11.0 if state == "play" else 6.0)

	# Sparkle trail falls behind, below her.
	if randf() < 0.7:
		var p := Particle.new()
		p.x = uni.x + randf_range(-6, 6); p.y = uni.y + 70
		p.vx = randf_range(-20, 20); p.vy = speed * 0.6
		p.life = 0.6; p.max_life = 0.6; p.r = randf_range(2, 4)
		p.c = RAINBOW[int(t * 12) % 6]
		p.star = randf() < 0.4
		particles.append(p)

	if state != "play":
		_update_particles(dt)
		return

	# Firing upward.
	if (pointer_down or Input.is_action_pressed("fire")) and fire_ok and fire_cooldown <= 0:
		var l := Laser.new()
		l.x = uni.x; l.y = uni.y - 70
		l.vx = 0; l.vy = -900
		l.c = RAINBOW[lasers.size() % 6]
		lasers.append(l)
		fire_cooldown = FIRE_INTERVAL
		heat += FIRE_INTERVAL / HEAT_TIME
		if heat >= 1.0:
			_start_reload()
		synth.laser()

	# Spawning from the top.
	ring_timer -= dt
	if ring_timer <= 0:
		if rings.size() < _ring_target():
			_spawn_ring_top()
		ring_timer = randf_range(1.25, 1.7) * (260 / speed) * 1.32
	cloud_timer -= dt
	if cloud_timer <= 0:
		if _foe_count() >= _foe_cap():
			cloud_timer = 0.5
		else:
			var c := StormCloud.new()
			c.x = randf_range(80, VW - 80); c.y = -90; c.phase = randf_range(0, 6)
			_roll_cloud_kind(c)
			clouds.append(c)
			cloud_timer = randf_range(3.7, 6.7) / (0.8 + level * 0.2)
	if hp < 70.0 and randf() < dt * 0.04 and pickups.is_empty():
		var pk := Pickup.new()
		pk.x = randf_range(90, VW - 90); pk.y = -50; pk.phase = randf_range(0, 6)
		pickups.append(pk)

	# Rings drift down; pass through near her.
	for r in rings:
		r.y += speed * dt
		if r.bob > 0:
			r.x = clampf(r.x + sin(t * 1.6 + r.phase) * r.bob * dt, 40, VW - 40)
		if not r.done and r.y >= uni.y:
			r.done = true
			if Vector2(uni.x - r.x, uni.y - r.y).length() < r.rx - 10:
				r.result = "hit"
				react_pop = 1.0
				if r.gold: _gold_hit()
				elif r.red: _red_hit()
				combo += 1; rings_passed += 1
				best_combo = maxi(best_combo, combo)
				var pts := (50 if r.gold else 10) * combo
				score += pts
				_popup(r.x, r.y - r.rx - 10, "+%d%s" % [pts, "  x%d" % combo if combo > 1 else ""], Color("ffd23f") if r.gold else Color.WHITE)
				_burst(r.x, r.y, 36 if r.gold else 18, [Color("ffd23f"), Color("fff4b0"), Color.WHITE] if r.gold else RAINBOW)
				if r.gold: synth.gold()
				else: synth.ring(combo)
				if rings_passed % 10 == 0:
					_level_up()
			else:
				r.result = "miss"
				if combo > 1:
					_popup(uni.x, uni.y - 70, "combo lost", Color("ffd9ef"))
				combo = 0
	rings = rings.filter(func(r): return r.y < VH + 80)

	# Lasers fly up.
	for l in lasers:
		_steer_laser(l, dt)
		l.x += l.vx * dt
		l.y += l.vy * dt
	lasers = lasers.filter(func(l): return l.y > -40 and l.y < VH + 60 and l.x > -60 and l.x < VW + 60 and not l.dead)

	# Storm clouds drift down.
	for c in clouds:
		c.y += speed * (1.6 if c.gust else 0.85) * dt
		c.x += sin(t * 2 + c.phase) * 30 * dt
		if c.hit_flash > 0: c.hit_flash -= dt
		var flash_now: bool = c.zappy and sin(t * 5 + c.phase) > 0.3
		if flash_now and not c.lit and c.y > -40 and c.y < VH + 40:
			synth.thunder()
		c.lit = flash_now
		if not c.dead and c.gust and Vector2(uni.x - c.x, uni.y - c.y).length() < c.r + 26:
			c.dead = true; score += 5
			uni.vx += signf(uni.x - c.x) * 300
			_popup(c.x, c.y - 40, "+5 whee!", Color("bfe9ff"))
			_burst(c.x, c.y, 12, [Color.WHITE, Color("bfe9ff")], 180)
			synth.poof()
		for l in lasers:
			if not l.dead and Vector2(l.x - c.x, l.y - c.y).length() < c.r + 8:
				l.dead = true; c.hp -= 1; c.hit_flash = 0.08
				_burst(l.x, l.y, 5, [Color.WHITE, l.c], 140)
				synth.zap()
				if c.hp <= 0:
					c.dead = true; score += 25
					_popup(c.x, c.y - 40, "+25 zap!", Color("ffe45c"))
					_burst(c.x, c.y, 28, [Color.WHITE, Color("e8e0ff"), Color("ffe45c"), Color("b77bff")], 260)
					synth.poof()
		if not c.dead and hurt_timer <= 0 and Vector2(uni.x - c.x, uni.y - c.y).length() < c.r + 26:
			c.dead = true; hp = maxf(0.0, hp - 34.0); combo = 0; hurt_timer = 1.6; flash = 0.25
			react_pop = 1.0; react_spin = -9.0
			_burst(c.x, c.y, 20, [Color("6d6690"), Color("ffe45c")], 200)
			synth.hurt()
			Input.vibrate_handheld(300)
			if hp <= 0:
				game_over()
	clouds = clouds.filter(func(c): return c.y < VH + 80 and not c.dead)

	# Heart pickups drift down.
	for p in pickups:
		p.y += speed * 0.9 * dt
		if Vector2(uni.x - p.x, uni.y - 10 - p.y).length() < 40:
			p.dead = true; hp = minf(HP_MAX, hp + 30.0)
			_popup(p.x, p.y - 30, "+30 HP", Color("ff6fb5"))
			_burst(p.x, p.y, 16, [Color("ff6fb5"), Color.WHITE], 180)
			synth.heart()
	pickups = pickups.filter(func(p): return p.y < VH + 40 and not p.dead)

	_manage_ambience()
	_update_particles(dt)


func _update_particles(dt: float) -> void:
	for a in arcs:
		a.life -= dt
	arcs = arcs.filter(func(a): return a.life > 0)
	for s in shock:
		s.life -= dt
	shock = shock.filter(func(s): return s.life > 0)
	for p in particles:
		p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; p.life -= dt
	particles = particles.filter(func(p): return p.life > 0)
	for p in popups:
		p.y -= 40 * dt; p.life -= dt * 0.9
	popups = popups.filter(func(p): return p.life > 0)


func _horn_tip() -> Vector2:
	var c := cos(uni.tilt)
	var s := sin(uni.tilt)
	var lx := 64.0
	var ly := -64.0
	return Vector2(uni.x + lx * c - ly * s, uni.y + lx * s + ly * c)


func _spawn_ring() -> void:
	var r := Ring.new()
	r.red = randf() < 0.10
	gold_in -= 1
	if gold_in <= 0:
		r.gold = true
		r.red = false
		gold_in = randi_range(3, 5)
	else:
		r.gold = false
	r.y = clampf(last_ring_y + randf_range(-260, 260) if boss != null else last_ring_y + randf_range(-170, 170), 90, H - 110)
	r.base_y = r.y
	last_ring_y = r.y
	r.ry = 50.0 if r.gold else 62.0
	r.bob = randf_range(30, 60 + 8 * mini(level - 3, 4)) if (level >= 3 and randf() < 0.5) or level >= 6 else 0.0
	r.phase = randf_range(0, 6)
	r.x = W + 60
	rings.append(r)


func _spawn_cloud() -> void:
	if _foe_count() >= _foe_cap():
		cloud_timer = 0.5
		return
	var c := StormCloud.new()
	c.x = W + 80; c.y = randf_range(80, H - 120); c.phase = randf_range(0, 6)
	_roll_cloud_kind(c)
	clouds.append(c)


func _burst(x: float, y: float, n: int, colors: Array, spd := 220.0) -> void:
	for i in n:
		var a := randf_range(0, TAU)
		var v := randf_range(spd * 0.3, spd)
		var p := Particle.new()
		p.x = x; p.y = y
		p.vx = cos(a) * v; p.vy = sin(a) * v
		p.life = randf_range(0.4, 0.9); p.max_life = 0.9
		p.r = randf_range(3, 7)
		p.c = colors[i % colors.size()]
		p.star = randf() < 0.6
		particles.append(p)


func _popup(x: float, y: float, text: String, color: Color) -> void:
	var p := ScorePopup.new()
	p.x = x; p.y = y; p.text = text; p.color = color
	popups.append(p)


# ─── Input ────────────────────────────────────────────────────────────────
func _to_virtual(screen_pos: Vector2) -> Vector2:
	return get_canvas_transform().affine_inverse() * screen_pos


func _press_at(vp: Vector2) -> void:
	# UI buttons first (screen space, above the card layer)
	if vp.distance_to(Vector2(VW - 44, VH - 100)) < 32:
		_rocket_tap = true
		return
	if vp.distance_to(Vector2(VW - 87, 33)) < 26:
		synth.muted = not synth.muted
		if synth.muted:
			synth.stop_rain()
			synth.stop_wind()
		_save_cfg()
		return
	if vp.distance_to(Vector2(VW - 33, 33)) < 26:
		toggle_pause()
		return
	if vp.distance_to(Vector2(VW - 141, 33)) < 26:
		settings_open = not settings_open
		return
	var dp := _card_point(vp)
	if settings_open:
		if _btn_tilt.has_point(dp):
			_toggle_tilt()
			return
		if _btn_close.has_point(dp):
			settings_open = false
			return
		return
	if state == "title":
		if _btn_play.has_point(dp):
			start()
			return
		if _teaser_rect.has_point(dp):
			OS.shell_open("https://fatcatcruz.itch.io/fat-cat-cruz")
			return
	if state == "over" and over_card_visible:
		if _btn_again.has_point(dp):
			start()
			return
		if _teaser_over_rect.has_point(dp):
			OS.shell_open("https://fatcatcruz.itch.io/fat-cat-cruz")
			return
	if state == "play" and paused:
		if _btn_resume.has_point(dp):
			toggle_pause()
			return
	pointer_down = true
	pointer_y = _to_logic(vp).y
	pointer_pos = vp


func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed:
			_press_at(_to_virtual(event.position))
		else:
			pointer_down = false
			pointer_y = null
	elif event is InputEventScreenDrag:
		if pointer_down:
			pointer_pos = _to_virtual(event.position)
			pointer_y = _to_logic(pointer_pos).y
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			_press_at(_to_virtual(event.position))
		else:
			pointer_down = false
			pointer_y = null
	elif event is InputEventMouseMotion:
		if pointer_down:
			pointer_pos = _to_virtual(event.position)
			pointer_y = _to_logic(pointer_pos).y


# ─── Drawing helpers ──────────────────────────────────────────────────────
func _arc_pts(cx: float, cy: float, rx: float, ry: float, a1: float, a2: float, steps := 28) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in steps + 1:
		var a := a1 + (a2 - a1) * float(i) / steps
		pts.append(Vector2(cx + rx * cos(a), cy + ry * sin(a)))
	return pts


func _quad_pts(p0: Vector2, c: Vector2, p1: Vector2, n := 12) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in n + 1:
		var f := float(i) / n
		pts.append((1 - f) * (1 - f) * p0 + 2 * (1 - f) * f * c + f * f * p1)
	return pts


func _cubic_pts(p0: Vector2, c1: Vector2, c2: Vector2, p1: Vector2, n := 12) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in n + 1:
		var f := float(i) / n
		var g := 1 - f
		pts.append(g * g * g * p0 + 3 * g * g * f * c1 + 3 * g * f * f * c2 + f * f * f * p1)
	return pts


func _fill_ellipse(c: Vector2, rx: float, ry: float, col: Color) -> void:
	draw_colored_polygon(_arc_pts(c.x, c.y, rx, ry, 0, TAU, 36), col)


func _stroke_text(pos: Vector2, text: String, size: int, fill: Color, align := HORIZONTAL_ALIGNMENT_CENTER, outline := 4, outline_col := INK) -> void:
	# width=-1 ignores alignment, so give centered text a wide box instead
	var p := pos
	var w := -1.0
	if align == HORIZONTAL_ALIGNMENT_CENTER:
		p.x -= 2000
		w = 4000
	elif align == HORIZONTAL_ALIGNMENT_RIGHT:
		p.x -= 2000
		w = 2000
	if outline > 0:
		draw_string_outline(font, p, text, align, w, size, outline, outline_col)
	draw_string(font, p, text, align, w, size, fill)


func _text_c(pos: Vector2, text: String, size: int, fill: Color) -> void:
	draw_string(font, Vector2(pos.x - 2000, pos.y), text, HORIZONTAL_ALIGNMENT_CENTER, 4000, size, fill)


func _sparkle_poly(x: float, y: float, r: float) -> PackedVector2Array:
	return PackedVector2Array([
		Vector2(x, y - r), Vector2(x + r * 0.3, y - r * 0.3), Vector2(x + r, y),
		Vector2(x + r * 0.3, y + r * 0.3), Vector2(x, y + r), Vector2(x - r * 0.3, y + r * 0.3),
		Vector2(x - r, y), Vector2(x - r * 0.3, y - r * 0.3),
	])


func _heart_poly(x: float, y: float, s: float) -> PackedVector2Array:
	var pts := PackedVector2Array([Vector2(x, y + s * 0.35)])
	pts.append_array(_cubic_pts(Vector2(x, y + s * 0.35), Vector2(x - s, y - s * 0.4), Vector2(x - s * 0.5, y - s), Vector2(x, y - s * 0.45)))
	pts.append_array(_cubic_pts(Vector2(x, y - s * 0.45), Vector2(x + s * 0.5, y - s), Vector2(x + s, y - s * 0.4), Vector2(x, y + s * 0.35)))
	return pts


func _rounded_gradient_tex(c1: Color, c2: Color, size: Vector2i, radius: float) -> Texture2D:
	var img := Image.create(size.x, size.y, false, Image.FORMAT_RGBA8)
	for y in size.y:
		for x in size.x:
			var col := c1.lerp(c2, float(x) / maxf(1, size.x - 1))
			# rounded-rect mask
			var dx := maxf(radius - x - 0.5, maxf(0, x + 0.5 - (size.x - radius)))
			var dy := maxf(radius - y - 0.5, maxf(0, y + 0.5 - (size.y - radius)))
			if Vector2(dx, dy).length() > radius:
				col.a = 0
			img.set_pixel(x, y, col)
	return ImageTexture.create_from_image(img)


func _gradient_tex(colors: Array, locs: Array, w := 8, h := 270) -> Texture2D:
	var img := Image.create(w, h, false, Image.FORMAT_RGB8)
	for y in h:
		var f := float(y) / (h - 1)
		var col: Color = colors[-1]
		for i in locs.size() - 1:
			if f <= locs[i + 1]:
				var g: float = (f - locs[i]) / maxf(0.0001, locs[i + 1] - locs[i])
				col = colors[i].lerp(colors[i + 1], clampf(g, 0, 1))
				break
		for x in w:
			img.set_pixel(x, y, col)
	return ImageTexture.create_from_image(img)


const LEVEL_NAMES := ["Blueberry Skies", "Sunset Glow", "Dusky Dreams", "Starry Night", "Northern Lights", "Candy Storm", "Cotton Candy", "Rainbow Road", "Deep Space", "Nebula Drift", "Saucer Station"]

func _in_space() -> bool:
	return level > 8


func _level_name() -> String:
	if level <= 8:
		return LEVEL_NAMES[level - 1]
	return LEVEL_NAMES[8 + (level - 9) % 3]


func _sky_pal() -> int:
	return (level - 1) % 8


func _sky_is_night() -> bool:
	return _in_space() or _sky_pal() in [2, 3, 4]


func _sky_colors() -> Array:
	var palettes := [
		["6ec8ff", "b9e6ff", "ffe3f3"],
		["8a7cff", "ff9ccf", "ffd6a0"],
		["4b3aa8", "b566d9", "ff9cc2"],
		["241a66", "5a3aa8", "c46fd4"],
		["0e2a52", "1f7a6d", "7df0c8"],
		["ff6f91", "c65bd4", "5a2a8a"],
		["ffb3d9", "ffd6ec", "fff4fa"],
		["7fe3ff", "d6b3ff", "ffe9a8"],
	]
	if _in_space():
		return [
			["050514", "141433", "2a1a5e"],
			["0d0221", "3a1a6e", "7b2f9e"],
			["020617", "0e2a52", "1f7a6d"],
		][(level - 9) % 3]
	return palettes[_sky_pal()]


func _level_up() -> void:
	level += 1
	speed = 260.0 * pow(1.07, mini(level - 1, 14))
	level_banner = 2.4
	synth.level_up()
	_set_level_sky()


func _set_level_sky() -> void:
	var cols: Array = []
	for h in _sky_colors():
		cols.append(Color(h))
	sky_top = cols[0]
	sky_tex = _gradient_tex(cols, [0.0, 0.6, 1.0])


func _puff(x: float, y: float, s: float) -> void:
	_wxf(Vector2(x, y), 0, Vector2(s, s))
	_fill_ellipse(Vector2(0, 10), 70, 18, Color(210 / 255.0, 190 / 255.0, 1, 0.6))
	draw_circle(Vector2(-40, 0), 22, Color.WHITE)
	draw_circle(Vector2(-12, -14), 30, Color.WHITE)
	draw_circle(Vector2(22, -6), 26, Color.WHITE)
	draw_circle(Vector2(48, 4), 18, Color.WHITE)
	draw_rect(Rect2(-40, 0, 88, 16), Color.WHITE)
	_world_apply()


# ─── Background scenery ───────────────────────────────────────────────────
func _hash01(n: int) -> float:
	var x := (n * 1103515245 + 12345) & 0x7fffffff
	return float(x) / 2147483647.0


# Space endgame: the saucer station hanging overhead and the
# planet's glowing limb below. Shared by both orientations.
func _draw_station(sx: float, sy: float, sc: float) -> void:
	var bob := sin(t * 0.8) * 6.0 * sc
	_wxf(Vector2(sx, sy + bob), 0, Vector2(sc, sc))
	_fill_ellipse(Vector2.ZERO, 120, 44, Color("3d3a5c"))
	draw_polyline(_arc_pts(0, 0, 120, 44, 0, TAU, 48), Color("8b86a8"), 4, true)
	_fill_ellipse(Vector2.ZERO, 58, 20, Color("050514"))
	draw_polyline(_arc_pts(0, 0, 58, 20, 0, TAU, 36), Color("b77bff"), 3, true)
	for sp in [0.0, PI / 2, PI, PI * 1.5]:
		draw_line(Vector2(cos(sp) * 58, sin(sp) * 20), Vector2(cos(sp) * 118, sin(sp) * 43), Color("5d6384"), 5, true)
	draw_circle(Vector2(0, -30), 26, Color("8b86a8"))
	draw_arc(Vector2(0, -30), 26, PI, TAU, 24, Color("c9cde0"), 3, true)
	for w in 10:
		var wa := w * TAU / 10 + 0.3
		var lit := sin(t * 2 + w * 1.7) > -0.2
		draw_circle(Vector2(cos(wa) * 92, sin(wa) * 33), 4, Color("ffe9a8") if lit else Color("4a4468"))
	var blink := 0.4 + 0.6 * maxf(0, sin(t * 3))
	draw_circle(Vector2(0, -60), 6, Color(1, 0.3, 0.37, blink))
	draw_circle(Vector2(0, -60), 10, Color(1, 0.3, 0.37, blink * 0.3))
	_world_apply()


func _draw_planet(px: float, py: float, pr: float) -> void:
	draw_circle(Vector2(px, py), pr, Color("1f6fd4"))
	draw_arc(Vector2(px, py), pr, 0, TAU, 96, Color(0.55, 0.85, 1, 0.8), 10, true)
	draw_arc(Vector2(px, py), pr - 26, PI * 1.15, PI * 1.75, 40, Color(1, 1, 1, 0.35), 14, true)
	draw_arc(Vector2(px, py), pr - 60, PI * 0.1, PI * 0.5, 32, Color("7df0c8"), 10, true)
	for ci in 12:
		var ca := PI * (0.55 + 0.9 * _hash01(ci * 3 + 1))
		draw_circle(Vector2(px + cos(ca) * (pr - 8), py + sin(ca) * (pr - 8)), 2.5, Color("ffe9a8"))


# Side view: slow countryside hills, quicker line-art city skyline.
func _draw_scenery(dt: float) -> void:
	var moving := state == "play" and not paused
	if moving:
		hill_x += speed * dt * 0.1
		city_x += speed * dt * 0.28
	var night := _sky_is_night()
	for row in [0, 1]:
		var w := 340.0
		var rate: float = 1.0 + row * 0.4
		var off := fmod(hill_x * rate, w)
		var base := int(floor(hill_x * rate / w))
		var k := -1
		while k * w - off < W + w:
			var idx := base + k
			var cx := k * w - off
			var r := 150.0 + _hash01(idx * 7 + row) * 90.0
			var hcol := Color("2c6b58") if (row == 1 or night) else Color("7ed6a8")
			if row == 1 and not night:
				hcol = Color("5cb98a")
			draw_circle(Vector2(cx, H + 30 - row * 40), r, hcol)
			if _hash01(idx * 13 + row * 3) < 0.3:
				var tx := cx + (_hash01(idx * 29) - 0.5) * 200.0
				var ty: float = H - 60 - row * 40.0
				draw_rect(Rect2(tx - 4, ty - 26, 8, 26), Color("2e2233") if night else Color("6b4a35"))
				draw_circle(Vector2(tx, ty - 34), 15, Color("1d4a3a") if night else Color("2f9e5f"))
			k += 1
	var bw := 150.0
	var coff := fmod(city_x, bw)
	var cbase := int(floor(city_x / bw))
	var bcol := Color("3d3d75") if night else Color("8fa3d9")
	var j := -1
	while j * bw - coff < W + bw:
		var idx := cbase + j
		var bx := j * bw - coff
		var bh := 60.0 + _hash01(idx * 5 + 1) * 110.0
		var bww: float = 86.0 + _hash01(idx * 5 + 3) * 44.0
		var bx0 := bx + (bw - bww) / 2
		draw_rect(Rect2(bx0, H - 40 - bh, bww, bh), bcol)
		var rows := int((bh - 20) / 26)
		for wy in range(rows):
			for wx in range(3):
				if _hash01(idx * 31 + wy * 7 + wx) < (0.7 if night else 0.25):
					var wcol := Color("ffe9a8") if night else Color(1, 1, 1, 0.7)
					draw_rect(Rect2(bx0 + 14 + wx * 30, H - 40 - bh + 12 + wy * 26, 12, 16), wcol)
		if _hash01(idx * 11 + 2) < 0.4:
			draw_line(Vector2(bx + bw / 2, H - 40 - bh), Vector2(bx + bw / 2, H - 56 - bh), bcol, 3, true)
		j += 1


func _draw_background(dt: float) -> void:
	draw_texture_rect(sky_tex, Rect2(0, 0, W, H), false)

	if _sky_is_night():
		for s in stars:
			var a: float = 0.4 + 0.4 * sin(t * 2 + s.p)
			draw_circle(Vector2(s.x, s.y), s.r, Color(1, 1, 1, a))
	if not shoot.is_empty():
		var sa: float = clampf(shoot.life / 0.7, 0.0, 1.0)
		var sp := Vector2(shoot.x, shoot.y)
		draw_line(sp, sp - Vector2(-80, 30).normalized() * 70 * sa, Color(1, 1, 1, 0.7 * sa), 3, true)
		draw_circle(sp, 3.5, Color(1, 1, 1, sa))

	# Sun / moon
	var sun_col := Color(1, 250 / 255.0, 220 / 255.0, 0.9) if _sky_is_night() else Color(1, 238 / 255.0, 150 / 255.0, 0.9)
	draw_circle(Vector2(W - 140, 90), 64, Color(1, 238 / 255.0, 150 / 255.0, 0.25))
	draw_circle(Vector2(W - 140, 90), 42, sun_col)

	# Faint rainbow arch — skyworlds only, never in deep space.
	if not _in_space():
		for i in 6:
			var pts := _arc_pts(W * 0.35, H + 120, 360 - i * 9, 360 - i * 9, PI * 1.08, PI * 1.92, 40)
			var col: Color = RAINBOW[i]
			col.a = 0.16
			draw_polyline(pts, col, 9, true)

	if _in_space():
		_draw_planet(W * 0.3, H + 520, 600)
		_draw_station(W - 190, 150, 1.0)
	else:
		_draw_scenery(dt)

	# Parallax clouds
	var moving := state == "play" and not paused
	for cl in bg_clouds:
		if moving or state == "title":
			cl.x -= (0.35 if cl.layer else 0.18) * speed * dt * (0.4 if state == "title" else 1.0)
		if cl.x < -140:
			cl.x = W + randf_range(40, 200)
			cl.y = randf_range(30, H - 60)
		var old_a := 0.85 if cl.layer else 0.55
		_world_apply()
		# draw with alpha via modulated circles: puff uses fixed colors, wrap with canvas alpha
		_puff_alpha(cl.x, cl.y, cl.s, old_a)

	# Soft cloud floor — the reason she can never fall
	var off := fmod(t * speed * 0.5, 80.0)
	_wxf(Vector2(-off, 0), 0, Vector2.ONE)
	draw_colored_polygon(floor_poly, Color(1, 1, 1, 0.9))
	_world_apply()


func _puff_alpha(x: float, y: float, s: float, a: float) -> void:
	_wxf(Vector2(x, y), 0, Vector2(s, s))
	_fill_ellipse(Vector2(0, 10), 70, 18, Color(210 / 255.0, 190 / 255.0, 1, 0.6 * a))
	var w := Color(1, 1, 1, a)
	draw_circle(Vector2(-40, 0), 22, w)
	draw_circle(Vector2(-12, -14), 30, w)
	draw_circle(Vector2(22, -6), 26, w)
	draw_circle(Vector2(48, 4), 18, w)
	draw_rect(Rect2(-40, 0, 88, 16), w)
	_world_apply()


# ─── Unicorn ──────────────────────────────────────────────────────────────
func _wing_poly() -> PackedVector2Array:
	var pts := PackedVector2Array([Vector2(0, 0)])
	pts.append_array(_quad_pts(Vector2(0, 0), Vector2(-18, -44), Vector2(-58, -58)))
	pts.append_array(_quad_pts(Vector2(-58, -58), Vector2(-50, -40), Vector2(-60, -34)))
	pts.append_array(_quad_pts(Vector2(-60, -34), Vector2(-46, -26), Vector2(-54, -14)))
	pts.append_array(_quad_pts(Vector2(-54, -14), Vector2(-36, -12), Vector2(-38, 0)))
	pts.append_array(_quad_pts(Vector2(-38, 0), Vector2(-18, 4), Vector2(0, 0)))
	return pts


# Body pivots compose with the world transform through _wxf and always
# return through _world_apply — draw_set_transform is absolute, not composed.
const CHAR_SCALE := 0.8
func _react_sc() -> Vector2:
	return Vector2.ONE * CHAR_SCALE * (1.0 + 0.15 * react_pop) * _size_k() * _dash_stretch()

func _size_k() -> float:
	return 1.0


func _dash_stretch() -> Vector2:
	return Vector2(1.22, 0.84) if dash_t > 0 else Vector2.ONE


func _gold_hit() -> void:
	flash = maxf(flash, 0.12)
	_fire_rockets(true)
	shock.append({ "x": uni.x, "y": uni.y, "life": 0.45, "max": 0.45 })
	synth.powerup()
func _draw_wing(front: bool, flap: float, body_rot: float) -> void:
	var wing_off := Vector2(4 if front else 10, -16).rotated(body_rot)
	_wxf(Vector2(uni.x, uni.y) + wing_off, body_rot - 0.35 + flap * 0.65 + react_angle, _react_sc())
	draw_colored_polygon(_wing_poly(), Color("ffe3f1") if front else Color("f5c3dd"))
	draw_polyline(_wing_poly(), Color("d9468f"), 2, true)


func _draw_unicorn() -> void:
	var blink := hurt_timer > 0 and int(hurt_timer * 12) % 2 == 0
	if blink:
		return
	var flap := sin(uni.flap)
	var gallop := sin(t * 10)
	_wxf(Vector2(uni.x, uni.y), uni.tilt + react_angle, _react_sc())

	# Rainbow tail
	for i in 6:
		var wav := sin(t * 8 + i * 0.6) * 6
		var pts := _quad_pts(Vector2(-34, -6 + i * 2), Vector2(-58, -16 + i * 4 + wav), Vector2(-80, 4 + i * 5 - wav))
		draw_polyline(pts, RAINBOW[i], 6, true)

	_draw_wing(false, flap, uni.tilt)
	_wxf(Vector2(uni.x, uni.y), uni.tilt + react_angle, _react_sc())

	# Legs folded back for flight — no more sky-gallop, just a sleepy ripple.
	var fold := sin(t * 3.0) * 2.0
	var legs := [[-24, 0], [-12, 1], [14, 2], [26, 3]]
	for leg in legs:
		var sx: float = leg[0] - 24 + fold * (1 + leg[1] * 0.3)
		var sy: float = 24 + leg[1] * 1.5
		draw_line(Vector2(leg[0], 12), Vector2(sx, sy), Color("ff9ccf"), 9, true)
	# Armored hooves tucked at the folded ends
	for leg in legs:
		var sx: float = leg[0] - 24 + fold * (1 + leg[1] * 0.3)
		var sy: float = 24 + leg[1] * 1.5
		draw_rect(Rect2(sx - 5.5, sy - 3, 11, 8), Color("b9bfd6"))
		draw_rect(Rect2(sx - 5.5, sy - 3, 11, 8), Color("5d6384"), false, 1.5)

	# Body
	_fill_ellipse(Vector2.ZERO, 40, 22, Color("ff9ccf"))
	draw_polyline(_arc_pts(0, 0, 40, 22, 0, TAU, 36), Color("d9468f"), 2.5, true)

	# Neck
	var neck := PackedVector2Array([Vector2(22, -10)])
	neck.append_array(_quad_pts(Vector2(22, -10), Vector2(34, -30), Vector2(40, -40)))
	neck.append(Vector2(56, -30))
	neck.append_array(_quad_pts(Vector2(56, -30), Vector2(46, -10), Vector2(36, 8)))
	draw_colored_polygon(neck, Color("ff9ccf"))

	# Back armor plate with rivets and a gold cat emblem
	var plate := PackedVector2Array([Vector2(-28, -8)])
	plate.append_array(_quad_pts(Vector2(-28, -8), Vector2(-4, -34), Vector2(24, -12)))
	plate.append(Vector2(20, 4))
	plate.append_array(_quad_pts(Vector2(20, 4), Vector2(-4, -12), Vector2(-24, 6)))
	draw_colored_polygon(plate, Color("c9cde0"))
	var plate_outline := plate.duplicate()
	plate_outline.append(Vector2(-28, -8))
	draw_polyline(plate_outline, Color("5d6384"), 2, true)
	for rv in [Vector2(-20, -6), Vector2(-8, -16), Vector2(6, -16), Vector2(16, -8)]:
		draw_circle(rv, 1.6, Color("5d6384"))
	var cat := PackedVector2Array([Vector2(-6, -7), Vector2(-4, -13), Vector2(-1, -9), Vector2(1, -9), Vector2(4, -13), Vector2(6, -7)])
	cat.append_array(_arc_pts(0, -5, 6, 6, -0.2, PI + 0.2, 12))
	draw_colored_polygon(cat, Color("ffd23f"))

	# Her rider: a little knight in shiny black armor, plume bouncing.
	var bob := sin(t * 5.0) * 1.5
	draw_rect(Rect2(-14, -10 + bob, 10, 14), Color("23232e"))
	draw_rect(Rect2(4, -8 + bob, 10, 14), Color("23232e"))
	_fill_ellipse(Vector2(0, -28 + bob), 9, 14, Color("23232e"))
	draw_polyline(_arc_pts(0, -28 + bob, 9, 14, 0, TAU, 20), Color("0f0f16"), 2, true)
	draw_line(Vector2(-4, -38 + bob), Vector2(-6, -20 + bob), Color(1, 1, 1, 0.5), 2, true)
	draw_circle(Vector2(0, -36 + bob), 6, Color("3a3a4e"))
	draw_line(Vector2(4, -30 + bob), Vector2(20, -25), Color("23232e"), 5, true)
	draw_circle(Vector2(20, -25), 3, Color("3a3a4e"))
	draw_circle(Vector2(0, -46 + bob), 10, Color("23232e"))
	draw_polyline(_arc_pts(0, -46 + bob, 10, 10, 0, TAU, 24), Color("0f0f16"), 2, true)
	draw_arc(Vector2(0, -46 + bob), 10, PI * 0.9, PI * 1.6, 12, Color(1, 1, 1, 0.45), 2, true)
	var pspread := 1.8 if dash_t > 0 else 1.0
	for pi in 3:
		draw_circle(Vector2(-9 * pspread - pi * 5 * pspread, -53 + bob - pi * 2 + sin(t * 7 + pi) * 1.5), 3.5, Color("ff6fb5"))
	# Side pouch with rocket tips peeking out.
	draw_rect(Rect2(-8, 6, 24, 15), Color("8a5a3b"))
	draw_rect(Rect2(-8, 6, 24, 6), Color("6e452c"))
	for ti in 3:
		draw_colored_polygon(PackedVector2Array([Vector2(-2 + ti * 8, 6), Vector2(2 + ti * 8, 6), Vector2(ti * 8, -2)]), Color("ff4d5e"))
	# Her eye glows — the beam leaves from here.
	draw_circle(Vector2(7, -47 + bob), 2.8, Color("7df0ff"))
	draw_circle(Vector2(7, -47 + bob), 1.2, Color.WHITE)

	# Head
	_wxf(Vector2(uni.x + 50 * cos(uni.tilt) + 36 * sin(uni.tilt), uni.y + 50 * sin(uni.tilt) - 36 * cos(uni.tilt)), uni.tilt + 0.35 + react_angle, _react_sc())
	_fill_ellipse(Vector2.ZERO, 18, 14, Color("ff9ccf"))
	draw_polyline(_arc_pts(0, 0, 18, 14, 0, TAU, 28), Color("d9468f"), 2.5, true)
	_fill_ellipse(Vector2(16, 6), 12, 9, Color("ff9ccf"))
	draw_polyline(_arc_pts(16, 6, 12, 9, 0, TAU, 24), Color("d9468f"), 2.5, true)
	_fill_ellipse(Vector2(16, 6), 9, 6.5, Color("ffc6e2"))
	draw_circle(Vector2(22, 7), 2, Color("d9468f"))
	draw_colored_polygon(PackedVector2Array([Vector2(-6, -12), Vector2(10, -10), Vector2(18, -1), Vector2(4, -6)]), Color("c9cde0"))
	draw_polyline(PackedVector2Array([Vector2(-6, -12), Vector2(10, -10), Vector2(18, -1), Vector2(4, -6), Vector2(-6, -12)]), Color("5d6384"), 1.5, true)
	draw_circle(Vector2(6, 6), 5, Color(1, 120 / 255.0, 170 / 255.0, 0.45))
	if blink_on > 0:
		draw_line(Vector2(-2, -3), Vector2(6, -3), Color("2a1650"), 2, true)
	else:
		_fill_ellipse(Vector2(2, -3), 4, 5, Color("2a1650"))
		draw_circle(Vector2(3.5, -5), 1.6, Color.WHITE)
	draw_line(Vector2(-4, -9), Vector2(6, -7), Color("2a1650"), 2, true)
	var ear_tip := Vector2(-10, -24 - 6.0 * clampf(ear_tw / 0.25, 0.0, 1.0))
	draw_colored_polygon(PackedVector2Array([Vector2(-8, -10), ear_tip, Vector2(-1, -13)]), Color("ff9ccf"))
	draw_polyline(PackedVector2Array([Vector2(-8, -10), ear_tip, Vector2(-1, -13), Vector2(-8, -10)]), Color("d9468f"), 2, true)

	# Golden horn (tip at local 64,-64) — back in body space
	_wxf(Vector2(uni.x, uni.y), uni.tilt + react_angle, _react_sc())
	var glow := 1.0 if fire_cooldown > 0.08 else 0.5 + 0.3 * sin(t * 6)
	draw_circle(Vector2(64, -64), 10, Color(1, 240 / 255.0, 160 / 255.0, 0.35 * glow))
	draw_colored_polygon(PackedVector2Array([Vector2(48, -48), Vector2(64, -64), Vector2(56, -44)]), Color("ffd23f"))
	draw_polyline(PackedVector2Array([Vector2(48, -48), Vector2(64, -64), Vector2(56, -44), Vector2(48, -48)]), Color("e0a800"), 1.5, true)
	draw_line(Vector2(52, -48), Vector2(57, -49), Color("e0a800"), 1.5, true)
	draw_line(Vector2(56, -53), Vector2(60, -54), Color("e0a800"), 1.5, true)

	# Rainbow mane
	for i in 5:
		draw_circle(Vector2(42 - i * 6, -44 + i * 8 + sin(t * 9 + i) * 1.5), 7, RAINBOW[i])

	_draw_wing(true, flap, uni.tilt)
	_world_apply()


# ─── Rings ────────────────────────────────────────────────────────────────
func _ring_stroke(r: Ring, front: bool) -> void:
	var start := PI / 2 if front else -PI / 2
	var end := PI * 1.5 if front else PI / 2
	var col := Color("ffd23f") if r.gold else (Color("ff4d5e") if r.red else (Color.WHITE if r.result == "hit" else Color("ff6fb5")))
	var edge := Color("c98f00") if r.gold else (Color("a31220") if r.red else Color("b3317a"))
	var rp := 1.0 + 0.03 * sin(t * 4 + r.phase)
	var rx := r.rx * rp
	var ry := r.ry * rp
	var pts := _arc_pts(r.x, r.y, rx, ry, start, end, 20)
	draw_polyline(pts, edge, 12, true)
	draw_polyline(pts, col, 7, true)
	if (r.gold or r.red) and front:
		for i in 3:
			var a := t * 3 + i * 2.1
			draw_colored_polygon(_sparkle_poly(r.x + cos(a) * rx, r.y + sin(a) * ry, 4), Color.WHITE)
	if r.red:
		var ro := 1.0 + 0.06 * sin(t * 7 + r.phase)
		draw_polyline(_arc_pts(r.x, r.y, (rx + 13) * ro, (ry + 13) * ro, start, end, 20), Color("ff4d5e"), 3, true)
		for zi in 4:
			var za := start + (end - start) * (0.15 + 0.7 * _hash01(int(t * 6) + zi * 13))
			draw_circle(Vector2(r.x + cos(za) * (rx + 13) * ro, r.y + sin(za) * (ry + 13) * ro), 3, Color.WHITE)


# ─── Storm clouds ─────────────────────────────────────────────────────────
func _draw_storm_cloud(c: StormCloud) -> void:
	# Grumble shake just before the lightning shows.
	var jx := 0.0
	if sin(t * 5.0 + c.phase) > 0.2:
		jx = 2.0 * sin(t * 40.0 + c.phase)
	_wxf(Vector2(jx, 0), 0, Vector2.ONE)
	var shade := Color.WHITE if c.hit_flash > 0 else (Color("8b86a8") if c.hp == 1 else Color("6d6690"))
	if c.gust:
		shade = Color.WHITE if c.hit_flash > 0 else Color("dceaff")
	elif c.rain:
		shade = Color.WHITE if c.hit_flash > 0 else (Color("7d8fc9") if c.hp == 1 else Color("5d6ba3"))
	draw_circle(Vector2(c.x - 22, c.y + 6), 20, shade)
	draw_circle(Vector2(c.x, c.y - 8), 26, shade)
	draw_circle(Vector2(c.x + 24, c.y + 4), 20, shade)
	draw_circle(Vector2(c.x, c.y + 12), 22, shade)
	if c.rain:
		# Rain streaks scrolling down beneath.
		var fall := fmod(t * 400.0, 50.0)
		for i in 5:
			var sx := c.x - 28 + i * 14
			var sy := c.y + 28 + fmod(fall + i * 13, 50.0) - 50.0
			draw_line(Vector2(sx, sy), Vector2(sx, sy + 22), Color(0.6, 0.8, 1.0, 0.6), 2, true)
	if c.gust:
		# Speed lines trailing behind the gust.
		for i in 3:
			var gy := c.y - 12 + i * 12
			draw_line(Vector2(c.x - 44, gy), Vector2(c.x - 76 - (i * 8), gy), Color(1, 1, 1, 0.55), 3, true)
	# Grumpy face
	draw_circle(Vector2(c.x - 9, c.y), 3.5, Color("2a1650"))
	draw_circle(Vector2(c.x + 9, c.y), 3.5, Color("2a1650"))
	draw_line(Vector2(c.x - 15, c.y - 9), Vector2(c.x - 5, c.y - 5), Color("2a1650"), 2.5, true)
	draw_line(Vector2(c.x + 15, c.y - 9), Vector2(c.x + 5, c.y - 5), Color("2a1650"), 2.5, true)
	draw_polyline(_arc_pts(c.x, c.y + 14, 7, 7, PI * 1.15, PI * 1.85, 10), Color("2a1650"), 2.5, true)
	# Lightning bolt
	if sin(t * 5 + c.phase) > 0.3:
		draw_colored_polygon(PackedVector2Array([
			Vector2(c.x - 4, c.y + 26), Vector2(c.x + 6, c.y + 26), Vector2(c.x, c.y + 38),
			Vector2(c.x + 8, c.y + 38), Vector2(c.x - 6, c.y + 58), Vector2(c.x - 1, c.y + 42),
			Vector2(c.x - 8, c.y + 42),
		]), Color("ffe45c"))
	_world_apply()


# ─── Overhead portrait view ─────────────────────────────────────────────
const QUILT := ["a8e6a3", "ffd6ec", "fff4b0", "b3ddff", "e6c3ff", "ffb3b3"]


# Overhead: handmade patchwork quilt of fields far below, with a
# winding river and the odd tiny farmhouse. Scrolls with the world.
func _draw_quilt() -> void:
	var cell := 140.0
	var night := _sky_is_night()
	var r0 := int(floor(ground_y / cell))
	var off := fmod(ground_y, cell)
	var j := -1
	while j * cell - off < VH + cell:
		var i := -1
		while i * cell < VW + cell:
			var idx := (r0 + j) * 131 + i * 17
			var col := Color(QUILT[int(_hash01(idx) * 6) % 6])
			if night:
				col = col.darkened(0.55)
			col.a = 0.3
			var px := i * cell
			var py := j * cell - off
			draw_rect(Rect2(px + 3, py + 3, cell - 6, cell - 6), col)
			var stitch := col.darkened(0.25)
			stitch.a = 0.35
			draw_rect(Rect2(px + 3, py + 3, cell - 6, cell - 6), stitch, false, 2.0)
			if _hash01(idx * 3 + 5) < 0.12:
				var hx := px + cell / 2 + sin(float(idx)) * 5.0
				var hy := py + cell / 2
				draw_rect(Rect2(hx - 14, hy - 6, 28, 20), Color(1, 1, 1, 0.5))
				draw_colored_polygon([Vector2(hx - 18, hy - 6), Vector2(hx + 18, hy - 6), Vector2(hx, hy - 22)], Color(0.85, 0.27, 0.56, 0.5))
			i += 1
		j += 1
	var y := -20.0
	while y < VH + 20:
		var rx := VW * 0.72 + sin((y + ground_y) * 0.012) * 90.0
		draw_circle(Vector2(rx, y), 17, Color(0.45, 0.7, 1.0, 0.3))
		y += 22.0


func _draw_storm_top(c) -> void:
	var shade := Color.WHITE if c.hit_flash > 0 else (Color("dceaff") if c.gust else (Color("7d8fc9") if c.rain else Color("6d6690")))
	var core := Color("3d3a5c") if c.hit_flash <= 0 else Color.WHITE
	var spin := 1.6 if c.gust else 0.8
	for arm in 3:
		var a0: float = t * spin + c.phase + arm * TAU / 3
		draw_arc(Vector2(c.x, c.y), c.r * (0.45 + arm * 0.2), a0, a0 + PI * 1.25, 26, shade, 10, true)
	draw_circle(Vector2(c.x, c.y), c.r * 0.3, core)
	draw_arc(Vector2(c.x, c.y), c.r * 0.3, 0, TAU, 24, shade, 2, true)
	if c.lit:
		draw_arc(Vector2(c.x, c.y), c.r + 5, 0, TAU, 40, Color("ffe45c"), 4, true)
		var zx: float = c.x + sin(t * 30 + c.phase) * 8
		draw_polyline(PackedVector2Array([Vector2(zx - 10, c.y - c.r), Vector2(zx + 6, c.y - 6), Vector2(zx - 6, c.y + 6), Vector2(zx + 10, c.y + c.r)]), Color("fff4b0"), 3, true)
	if c.rain:
		for di in 6:
			var da: float = di * TAU / 6 + c.phase
			draw_circle(Vector2(c.x + cos(da) * (c.r + 12), c.y + sin(da) * (c.r + 12)), 2.5, Color(0.6, 0.8, 1, 0.8))


func _draw_over_bg() -> void:
	draw_texture_rect(sky_tex, Rect2(0, 0, VW, VH), false)
	if _in_space():
		_draw_planet(VW / 2, VH + 700, 800)
		_draw_station(VW - 130, 130, 0.7)
		for s in stars:
			var sx2: float = s.x * VW / 960.0
			var sy2: float = s.y * VH / 540.0
			var a2: float = 0.5 + 0.5 * sin(t * 3 + s.p * 2)
			draw_circle(Vector2(sx2, sy2), s.r + 0.8, Color(1, 1, 1, a2))
	else:
		_draw_quilt()
	for i in 8:
		var gx := (i + 0.5) * VW / 8 + sin(t * 0.3 + i * 2.1) * 20
		var gy := fmod(i * VH / 8 + t * 15, VH + 200) - 100
		_puff_alpha(gx, gy, 0.9, 0.5)
	if _sky_is_night():
		for s in stars:
			var sx: float = s.x * VW / 960.0
			var sy: float = s.y * VH / 540.0
			var a: float = 0.4 + 0.4 * sin(t * 2 + s.p)
			draw_circle(Vector2(sx, sy), s.r, Color(1, 1, 1, a))


func _draw_ring_top(r: Ring) -> void:
	draw_circle(Vector2(r.x + 5, r.y + 9), r.rx + 5, Color(0.2, 0.15, 0.35, 0.12))
	var edge := Color("c98f00") if r.gold else (Color("a31220") if r.red else Color("b3317a"))
	var col := Color("ffd23f") if r.gold else (Color("ff4d5e") if r.red else (Color.WHITE if r.result == "hit" else Color("ff6fb5")))
	draw_arc(Vector2(r.x, r.y), r.rx + 4, 0, TAU, 48, edge, 12, true)
	draw_arc(Vector2(r.x, r.y), r.rx + 4, 0, TAU, 48, col, 7, true)
	if r.gold:
		for i in 3:
			var a := t * 3 + i * 2.1
			draw_colored_polygon(_sparkle_poly(r.x + cos(a) * (r.rx + 4), r.y + sin(a) * (r.rx + 4), 4), Color.WHITE)
	if r.red:
		var ro2 := r.rx + 15 + sin(t * 7 + r.phase) * 2.5
		draw_arc(Vector2(r.x, r.y), ro2, 0, TAU, 48, Color("ff4d5e"), 3, true)
	if r.red:
		var ro2 := r.rx + 16 + sin(t * 7 + r.phase) * 3
		draw_arc(Vector2(r.x, r.y), ro2, 0, TAU, 48, Color("ff4d5e"), 3, true)
		for zi in 4:
			var za2 := zi * TAU / 4 + t * 2
			draw_circle(Vector2(r.x + cos(za2) * ro2, r.y + sin(za2) * ro2), 3, Color.WHITE)


func _draw_pony_top() -> void:
	var blink_hide := hurt_timer > 0 and int(hurt_timer * 12) % 2 == 0
	if blink_hide:
		return
	_wxf(Vector2(uni.x, uni.y), uni.tilt + react_angle, _react_sc())
	# Shadow on the clouds below.
	_fill_ellipse(Vector2(0, 52), 40, 12, Color(0.35, 0.3, 0.55, 0.18))
	# Rainbow tail streaming behind.
	for i in 6:
		var wav := sin(t * 8 + i * 0.6) * 5
		draw_line(Vector2(-8 + i * 3, 28), Vector2(-20 + i * 8 + wav, 64), RAINBOW[i], 6, true)
	# Wings spread wide.
	_fill_ellipse(Vector2(-32, -6), 26, 12, Color("ffe3f1"))
	_fill_ellipse(Vector2(32, -6), 26, 12, Color("f5c3dd"))
	for sx in [-1.0, 1.0]:
		for k in 3:
			var y0 := -12.0 + k * 6.0
			draw_line(Vector2(sx * 12, y0), Vector2(sx * 50, y0 - 4), Color("d9468f"), 1.5, true)
	# Hooves peeking out.
	for hv in [Vector2(-22, -12), Vector2(-22, 12), Vector2(22, -12), Vector2(22, 12)]:
		draw_circle(hv, 4, Color("b9bfd6"))
	# Body (foreshortened from above).
	_fill_ellipse(Vector2.ZERO, 24, 38, Color("ff9ccf"))
	draw_polyline(_arc_pts(0, 0, 24, 38, 0, TAU, 36), Color("d9468f"), 2.5, true)
	# Armor plate with the gold cat dot.
	draw_rect(Rect2(-13, -16, 26, 34), Color("c9cde0"))
	draw_rect(Rect2(-13, -16, 26, 34), Color("5d6384"), false, 2)
	draw_circle(Vector2.ZERO, 4, Color("ffd23f"))
	# Rider from above: dark helm, shoulders, plume behind.
	var bob2 := sin(t * 5.0) * 1.5
	_fill_ellipse(Vector2(-14, 2), 7, 10, Color("23232e"))
	_fill_ellipse(Vector2(14, 2), 7, 10, Color("23232e"))
	draw_circle(Vector2(0, -4 + bob2 * 0.4), 11, Color("23232e"))
	draw_polyline(_arc_pts(0, -4 + bob2 * 0.4, 11, 11, 0, TAU, 26), Color("0f0f16"), 2, true)
	draw_arc(Vector2(0, -4 + bob2 * 0.4), 11, PI * 1.1, PI * 1.7, 12, Color(1, 1, 1, 0.45), 2, true)
	draw_circle(Vector2(0, 10), 4, Color("ff6fb5"))
	draw_rect(Rect2(-32, 2, 14, 20), Color("8a5a3b"))
	draw_rect(Rect2(-32, 2, 14, 7), Color("6e452c"))
	draw_rect(Rect2(18, 2, 14, 20), Color("8a5a3b"))
	draw_rect(Rect2(18, 2, 14, 7), Color("6e452c"))
	draw_circle(Vector2(-4, -9), 2.2, Color("7df0ff"))
	draw_circle(Vector2(4, -9), 2.2, Color("7df0ff"))
	# Head from above, snout forward.
	_fill_ellipse(Vector2(0, -44), 15, 15, Color("ff9ccf"))
	draw_polyline(_arc_pts(0, -44, 15, 15, 0, TAU, 28), Color("d9468f"), 2.5, true)
	_fill_ellipse(Vector2(0, -53), 10, 8, Color("ffc6e2"))
	draw_circle(Vector2(0, -54), 2, Color("d9468f"))
	# Horn pointing at the sky.
	var glow := 1.0 if fire_cooldown > 0.08 else 0.5 + 0.3 * sin(t * 6)
	draw_circle(Vector2(0, -62), 10, Color(1, 240 / 255.0, 160 / 255.0, 0.35 * glow))
	draw_colored_polygon(PackedVector2Array([Vector2(-5, -54), Vector2(5, -54), Vector2(0, -72)]), Color("ffd23f"))
	draw_polyline(PackedVector2Array([Vector2(-5, -54), Vector2(5, -54), Vector2(0, -72), Vector2(-5, -54)]), Color("e0a800"), 1.5, true)
	# Mane arc over the crown.
	var mx := [-18.0, -9.0, 0.0, 9.0, 18.0]
	var my := [-40.0, -48.0, -51.0, -48.0, -40.0]
	for i in 5:
		draw_circle(Vector2(mx[i], my[i] + sin(t * 9 + i) * 1.5), 7, RAINBOW[i])
	_world_apply()


# ─── Cards ────────────────────────────────────────────────────────────────
func _card(rect: Rect2) -> void:
	var glow := StyleBoxFlat.new()
	glow.bg_color = Color(0, 0, 0, 0)
	glow.border_color = Color(1, 111 / 255.0, 181 / 255.0, 0.45)
	glow.set_border_width_all(6)
	glow.set_corner_radius_all(22)
	draw_style_box(glow, rect.grow(6))
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(42 / 255.0, 22 / 255.0, 80 / 255.0, 0.82)
	sb.border_color = Color.WHITE
	sb.set_border_width_all(3)
	sb.set_corner_radius_all(22)
	draw_style_box(sb, rect)


func _rainbow_title(cx: float, baseline_y: float, text: String, size: int) -> void:
	var widths := PackedFloat32Array()
	var total := 0.0
	for i in text.length():
		var w := font.get_string_size(text[i], HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
		widths.append(w)
		total += w
	var x := cx - total / 2
	for i in text.length():
		var p := float(i) / maxf(1, text.length() - 1)
		var seg: float = p * (RAINBOW.size() - 1)
		var idx := mini(int(seg), RAINBOW.size() - 2)
		draw_string(font, Vector2(x, baseline_y), text[i], HORIZONTAL_ALIGNMENT_LEFT, -1, size, RAINBOW[idx].lerp(RAINBOW[idx + 1], seg - idx))
		x += widths[i]


func _play_button(center: Vector2, text: String) -> Rect2:
	var rect := Rect2(center - Vector2(95, 24), Vector2(190, 48))
	var shadow := StyleBoxFlat.new()
	shadow.bg_color = Color("6b2d9e")
	shadow.set_corner_radius_all(24)
	draw_style_box(shadow, Rect2(rect.position + Vector2(0, 6), rect.size))
	draw_texture_rect(btn_tex, rect, false)
	_text_c(center + Vector2(0, 7), text, 20, Color.WHITE)
	return rect


func _pill(center: Vector2, text: String) -> void:
	var w := font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, 12).x + 24
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("ff6fb5")
	sb.set_corner_radius_all(10)
	draw_style_box(sb, Rect2(center.x - w / 2, center.y - 10, w, 20))
	_text_c(center + Vector2(0, 4), text, 12, Color.WHITE)


func _teaser(center: Vector2) -> Rect2:
	var rect := Rect2(center - Vector2(192, 29), Vector2(384, 58))
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(1, 111 / 255.0, 181 / 255.0, 0.18)
	sb.border_color = Color(1, 1, 1, 0.35)
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(14)
	draw_style_box(sb, rect)
	_text_c(center + Vector2(0, -2), "Also try Fat Cat Cruz", 14, Color.WHITE)
	_text_c(center + Vector2(0, 18), "Five minutes, robots, no download →", 13, Color("ffd9ef"))
	return rect


func _draw_title_card() -> void:
	_card(Rect2(W / 2 - 220, H / 2 - 250, 440, 500))
	var y := H / 2 - 250 + 40
	_rainbow_title(W / 2, y, "Flying Unicorn", 44)
	y += 34
	_pill(Vector2(W / 2, y), "STARRING THE PINK PONY")
	y += 32
	_text_c(Vector2(W / 2, y), "Fly through the rings. Zap the storm clouds.", 15, Color("ffd9ef"))
	y += 20
	_text_c(Vector2(W / 2, y), "A magic pony never falls!", 15, Color("ffd9ef"))
	y += 30
	var items := [
		"☝️ Drag to fly · hold to fire · ROCKETS button",
		"🎯 Rings in a row build your combo",
		"🌟 Gold rings fire rockets · red rings call her eye-beam",
		"⛈️ Storm clouds drain her health — zap them first!",
		"🎮 Gamepad: stick flies her around · tilt in Settings ⚙",
	]
	for it in items:
		draw_string(font, Vector2(W / 2 - 176, y), it, HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color("f3e9ff"))
		y += 24
	y += 16
	_btn_play = _play_button(Vector2(W / 2, y + 24), "Fly! ✨")
	y += 72
	_teaser_rect = _teaser(Vector2(W / 2, y + 29))


func _over_title() -> String:
	if score >= 1500:
		return "Rainbow Legend!"
	if score >= 600:
		return "Sky Superstar!"
	if score >= 150:
		return "What a Flight!"
	return "Sweet Dreams!"


func _draw_over_card() -> void:
	_card(Rect2(W / 2 - 220, H / 2 - 200, 440, 400))
	var y := H / 2 - 200 + 40
	_rainbow_title(W / 2, y, _over_title(), 40)
	y += 50
	_text_c(Vector2(W / 2, y), "She floated down safe on a fluffy cloud. Best combo: x%d · Bosses: %d" % [best_combo, boss_kills], 15, Color("ffd9ef"))
	y += 42
	_text_c(Vector2(W / 2, y), str(score), 40, Color("ffd23f"))
	y += 38
	_text_c(Vector2(W / 2, y), "✨ New best score! ✨" if over_is_best else "Best: %d" % best, 15, Color("ffd9ef"))
	y += 30
	_text_c(Vector2(W / 2, y), "The End … or is it?", 14, Color("f3e9ff"))
	y += 30
	_btn_again = _play_button(Vector2(W / 2, y + 24), "Fly Again ✨")
	y += 72
	_teaser_over_rect = _teaser(Vector2(W / 2, y + 29))


func _draw_pause_card() -> void:
	_card(Rect2(W / 2 - 190, H / 2 - 110, 380, 220))
	_rainbow_title(W / 2, H / 2 - 110 + 42, "Paused", 44)
	_text_c(Vector2(W / 2, H / 2 - 110 + 82), "Taking a little rest on a cloud.", 15, Color("ffd9ef"))
	_btn_resume = _play_button(Vector2(W / 2, H / 2 - 110 + 148), "Keep Flying")


func _toggle_button(center: Vector2, text: String, on: bool) -> Rect2:
	var rect := Rect2(center - Vector2(55, 20), Vector2(110, 40))
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("5fe08b") if on else Color(93 / 255.0, 99 / 255.0, 132 / 255.0, 1)
	sb.border_color = Color.WHITE
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(20)
	draw_style_box(sb, rect)
	_text_c(center + Vector2(0, 5), text, 16, Color.WHITE)
	return rect


func _draw_settings_card() -> void:
	_card(Rect2(W / 2 - 200, H / 2 - 150, 400, 300))
	_rainbow_title(W / 2, H / 2 - 150 + 44, "Settings", 36)
	_text_c(Vector2(W / 2, H / 2 - 150 + 82), "Hold your device how you play,", 14, Color("ffd9ef"))
	_text_c(Vector2(W / 2, H / 2 - 150 + 102), "then switch tilt on.", 14, Color("ffd9ef"))
	draw_string(font, Vector2(W / 2 - 170, H / 2 - 150 + 148), "Tilt steering", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color.WHITE)
	_btn_tilt = _toggle_button(Vector2(W / 2 + 105, H / 2 - 150 + 140), "On" if tilt_enabled else "Off", tilt_enabled)
	_btn_close = _play_button(Vector2(W / 2, H / 2 - 150 + 216), "Close")


func _draw_round_button(center: Vector2, glyph: String) -> void:
	draw_circle(center, 21, Color(42 / 255.0, 22 / 255.0, 80 / 255.0, 0.55))
	draw_arc(center, 21, 0, TAU, 32, Color(1, 1, 1, 0.7), 2, true)
	_text_c(center + Vector2(0, 5), glyph, 15, Color.WHITE)


# ─── HUD ──────────────────────────────────────────────────────────────────
func _draw_hud() -> void:
	_stroke_text(Vector2(22, 44), str(score), 28, Color.WHITE, HORIZONTAL_ALIGNMENT_LEFT, 5)
	var hpk := clampf(hp / HP_MAX, 0.0, 1.0)
	var hpcol := Color("7df08a") if hpk > 0.5 else (Color("ffd23f") if hpk > 0.25 else Color("ff4d5e"))
	draw_rect(Rect2(22, 66, 110, 10), Color(1, 1, 1, 0.25))
	draw_rect(Rect2(22, 66, 110 * hpk, 10), hpcol)
	var mer_k := mer_spool if mer_spool > 0 else 1.0 - clampf(mer_cd / MERCD, 0.0, 1.0)
	draw_rect(Rect2(22, 80, 110, 5), Color(1, 1, 1, 0.2))
	draw_rect(Rect2(22, 80, 110 * clampf(mer_k, 0.0, 1.0), 5), Color("7df0ff"))
	_stroke_text(Vector2(22, 112), "Level %d" % level, 16, Color("ffd9ef"), HORIZONTAL_ALIGNMENT_LEFT, 4)
	# Horn heat bar + eye-beam charge pip.
	draw_rect(Rect2(22, 120, 110, 8), Color(1, 1, 1, 0.25))
	var heat_col := Color("ff4d5e") if overheated else Color("ffd23f")
	draw_rect(Rect2(22, 120, 110 * clampf(heat, 0.0, 1.0), 8), heat_col)
	var beam_k := 1.0 if beam_t > 0 else 1.0 - clampf(beam_cd / BEAM_PERIOD, 0.0, 1.0)
	draw_rect(Rect2(22, 132, 110, 6), Color(1, 1, 1, 0.25))
	draw_rect(Rect2(22, 132, 110 * beam_k, 6), Color("ff4d5e"))
	if overheated and int(t * 4) % 2 == 0:
		_stroke_text(Vector2(22, 150), "RELOADING…", 16, Color("9adcff"), HORIZONTAL_ALIGNMENT_LEFT, 4)
	if boss != null:
		var bt := maxi(0, int(ceil(boss_t)))
		_stroke_text(Vector2(VW / 2, 40), "BOSS %d" % bt, 26, Color("ff4d5e") if bt <= 5 else Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER, 5)
		var bfrac := clampf(float(boss.hp) / float(maxi(boss.max_hp, 1)), 0.0, 1.0)
		draw_rect(Rect2(VW / 2 - 70, 50, 140, 8), Color(1, 1, 1, 0.25))
		draw_rect(Rect2(VW / 2 - 70, 50, 140 * bfrac, 8), Color("b77bff"))
	if boss_kills > 0:
		_stroke_text(Vector2(22, 166), "BOSS x%d" % boss_kills, 15, Color("c77bff"), HORIZONTAL_ALIGNMENT_LEFT, 4)
	if combo > 1:
		_stroke_text(Vector2(VW / 2, 40), "Combo x%d" % combo, 22, RAINBOW[int(t * 8) % 6], HORIZONTAL_ALIGNMENT_CENTER, 5)
	if level_banner > 0 and state == "play":
		var col := Color("ffe45c")
		col.a = minf(1, level_banner)
		var ol := INK
		ol.a = minf(1, level_banner)
		_stroke_text(Vector2(VW / 2, VH / 2 - 120), "Fly through the rings!" if level == 1 else "Level %d — %s!" % [level, _level_name()], 44, col, HORIZONTAL_ALIGNMENT_CENTER, 7, ol)
	_draw_round_button(Vector2(VW - 87, 33), "🔇" if synth.muted else "🔊")
	_draw_round_button(Vector2(VW - 33, 33), "❚❚")
	_draw_round_button(Vector2(VW - 141, 33), "⚙")
	draw_circle(Vector2(VW - 44, VH - 100), 21, Color(42 / 255.0, 22 / 255.0, 80 / 255.0, 0.55))
	draw_arc(Vector2(VW - 44, VH - 100), 21, 0, TAU, 32, Color(1, 1, 1, 0.7), 2, true)
	var rp := Vector2(VW - 44, VH - 100)
	var rdim := 0.45 if rocket_cd > 0 else 1.0
	draw_colored_polygon(PackedVector2Array([rp + Vector2(9, -11), rp + Vector2(1, -3), rp + Vector2(-5, -3), rp + Vector2(-5, 5), rp + Vector2(1, 5)]), Color(0.79, 0.81, 0.88, rdim))
	draw_colored_polygon(PackedVector2Array([rp + Vector2(9, -11), rp + Vector2(2, -6), rp + Vector2(2, 6)]), Color(1, 0.3, 0.37, rdim))
	draw_colored_polygon(PackedVector2Array([rp + Vector2(-5, 0), rp + Vector2(-10, -4), rp + Vector2(-10, 4)]), Color(1, 0.69, 0.24, rdim))
	if rocket_cd > 0:
		draw_arc(Vector2(VW - 44, VH - 100), 26, -PI / 2, -PI / 2 + TAU * (1.0 - rocket_cd / ROCKET_CD), 32, Color("ffd23f"), 4, true)
	if transitioning and state == "play":
		_pill(Vector2(VW / 2, 76), "TURNING…")


# ─── Draw ─────────────────────────────────────────────────────────────────
func _draw() -> void:
	var dt := get_process_delta_time()
	if paused:
		dt = 0
	# Sky base across the whole viewport; the world layer covers the middle.
	# (Kills the dark margin bars on wide/tall screens.)
	draw_texture_rect(sky_tex, Rect2(0, 0, VW, VH), false)
	_world_begin()
	if vertical:
		_draw_over_bg()
	else:
		_draw_background(dt)

	for r in rings:
		if vertical:
			_draw_ring_top(r)
		else:
			_ring_stroke(r, false)
	for c in clouds:
		if vertical:
			_draw_storm_top(c)
		else:
			_draw_storm_cloud(c)
	for p in pickups:
		var y: float = p.y + sin(t * 3 + p.phase) * 8
		draw_circle(Vector2(p.x, y - 4), 22, Color(1, 1, 1, 0.5))
		draw_colored_polygon(_sparkle_poly(p.x, y, 20), Color("7df0c8"))
		draw_circle(Vector2(p.x, y), 6, Color.WHITE)

	# Lasers
	for l in lasers:
		if vertical:
			var vglow: Color = l.c
			vglow.a = 0.35
			draw_line(Vector2(l.x, l.y + 44), Vector2(l.x, l.y), vglow, 7, true)
			draw_line(Vector2(l.x, l.y + 30), Vector2(l.x, l.y), Color.WHITE, 3, true)
		else:
			var glow: Color = l.c
			glow.a = 0.35
			draw_line(Vector2(l.x - 44, l.y), Vector2(l.x, l.y), glow, 7, true)
			draw_line(Vector2(l.x - 30, l.y), Vector2(l.x, l.y), Color.WHITE, 3, true)

	# Eye beam: thick red lance with a white-hot core, flickering hard.
	if beam_t > 0 and state == "play":
		var o := _beam_origin()
		var fl := 11.0 + 4.0 * sin(t * 40.0)
		var far := Vector2(o.x, -40) if vertical else Vector2(W + 40, o.y)
		draw_line(o, far, Color(1, 0.15, 0.2, 0.35), fl + 9, true)
		draw_line(o, far, Color(1, 0.3, 0.35, 0.9), fl, true)
		draw_line(o, far, Color.WHITE, 4, true)
		draw_circle(o, 13, Color(1, 0.4, 0.45, 0.9))

	# Boss saucer and its purple bolts.
	if boss != null:
		_draw_boss()
	for bl in bolts:
		draw_circle(Vector2(bl.x, bl.y), 9, Color(0.72, 0.48, 1, 0.4))
		draw_circle(Vector2(bl.x, bl.y), 5, Color("c77bff"))
		draw_circle(Vector2(bl.x, bl.y), 2.5, Color.WHITE)
	for r in rockets:
		var rang := Vector2(r.vx, r.vy).angle()
		_wxf(Vector2(r.x, r.y), rang, Vector2.ONE)
		draw_colored_polygon(PackedVector2Array([Vector2(14, 0), Vector2(2, -6), Vector2(-8, -6), Vector2(-8, 6), Vector2(2, 6)]), Color("c9cde0"))
		draw_colored_polygon(PackedVector2Array([Vector2(14, 0), Vector2(4, -4), Vector2(4, 4)]), Color("ff4d5e"))
		var fl := 10.0 + sin(t * 50 + r.x) * 4.0
		draw_colored_polygon(PackedVector2Array([Vector2(-8, -4), Vector2(-8 - fl, 0), Vector2(-8, 4)]), Color("ffb13d"))
		_world_apply()
	for za in arcs:
		var ak := clampf(za.life / za.max, 0.0, 1.0)
		var zp0 := Vector2(za.ax, za.ay)
		var zp3 := Vector2(za.bx, za.by)
		var zd := zp3 - zp0
		var zn := Vector2(-zd.y, zd.x).normalized() if zd.length() > 1 else Vector2.ZERO
		var zpts := PackedVector2Array([zp0])
		for zk in [1, 2]:
			var zp: float = zk / 3.0
			zpts.append(zp0.lerp(zp3, zp) + zn * sin(t * 90 + zk * 7 + za.ax) * 14)
		zpts.append(zp3)
		draw_polyline(zpts, Color(0.55, 1, 1, ak), 3, true)
		draw_polyline(zpts, Color(1, 1, 1, ak * 0.7), 1.5, true)
	if dash_t > 0 and state == "play":
		for si in 5:
			var sly: float = uni.y + randf_range(-44, 44)
			var slx: float = uni.x - 80 - si * 38
			draw_line(Vector2(slx, sly), Vector2(slx - 64, sly), Color(1, 1, 1, 0.5), 3, true)

	_draw_mermaid()
	if vertical:
		_draw_pony_top()
		if state == "over" and over_card_visible:
			_puff(uni.x, uni.y + 56, 1.6)
	else:
		# Soft drop shadow on the cloud floor — fades as she climbs.
		var sh_h := clampf(H - 60 - uni.y, 0.0, 600.0)
		var sh_k := 1.0 - sh_h / 600.0
		_fill_ellipse(Vector2(uni.x, H - 56), 46.0 * (0.5 + 0.5 * sh_k), 10.0, Color(0.35, 0.3, 0.55, 0.22 * sh_k))
		_draw_mermaid()
		_draw_unicorn()
		if state == "over" and over_card_visible:
			_puff(uni.x, uni.y + 44, 1.6)
	for r in rings:
		if vertical:
			_draw_ring_top(r)
		else:
			_ring_stroke(r, true)

	for s in shock:
		var sk := clampf(s.life / s.max, 0.0, 1.0)
		var scol := Color(1, 0.84, 0.25, sk)
		draw_arc(Vector2(s.x, s.y), 14 + (1.0 - sk) * 95, 0, TAU, 48, scol, 6, true)
		draw_arc(Vector2(s.x, s.y), 14 + (1.0 - sk) * 70, 0, TAU, 40, Color(1, 1, 1, sk * 0.8), 3, true)
	for p in particles:
		var col: Color = p.c
		col.a = maxf(0, p.life / p.max_life)
		if p.star:
			draw_colored_polygon(_sparkle_poly(p.x, p.y, p.r + 1), col)
		else:
			draw_circle(Vector2(p.x, p.y), p.r * 0.7, col)

	for p in popups:
		var col: Color = p.color
		col.a = minf(1, p.life * 1.5)
		_stroke_text(Vector2(p.x, p.y), p.text, 20, col, HORIZONTAL_ALIGNMENT_CENTER, 4, Color(42 / 255.0, 22 / 255.0, 80 / 255.0, 0.7))
	_world_end()
	if transitioning and trans_tex != null:
		draw_texture_rect(trans_tex, Rect2(0, 0, VW, VH), false, Color(1, 1, 1, 1.0 - _view_ease()))

	if flash > 0:
		draw_rect(Rect2(0, 0, VW, VH), Color(1, 1, 1, minf(1, flash * 1.6)))

	if state == "play" or state == "over":
		_draw_hud()

	if state == "title":
		_card_begin()
		_draw_title_card()
		_card_end()
	elif state == "over" and over_card_visible:
		_card_begin()
		_draw_over_card()
		_card_end()
	elif state == "play" and paused:
		_card_begin()
		_draw_pause_card()
		_card_end()
	if settings_open:
		_card_begin()
		_draw_settings_card()
		_card_end()


# ─── Screenshot test hook ─────────────────────────────────────────────────
func _capture() -> void:
	await RenderingServer.frame_post_draw
	var img := get_viewport().get_texture().get_image()
	var err := img.save_png(_shot_path)
	print("FU screenshot -> %s (err=%d)" % [_shot_path, err])
	get_tree().quit()
