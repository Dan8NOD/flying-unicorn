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
var _mer_vel := Vector2.ZERO
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
# Wonder World: the free-roam reward space. Opens after the UFO boss is
# defeated (or after WONDER_AT seconds of play, whichever comes first);
# rotation flips it between side-view platformer and overhead wander.
# Nothing hostile in there.
var wonder := false
var wonder_unlocked := false
var powered := false
var play_time := 0.0
# Countdown to the Chapter 2 transition after a boss kill (celebration beat).
var ch2_pending := 0.0
const WONDER_AT := 480.0
# Chapter 2 start option: begin 30s before the Wonder World transition.
const CH2_TIME := 450.0
var bits := 0
var _air_jump := true
var _walk_touch := Vector2(-1, -1)
# Chapter 2 side-view world: camera-follow platformer across WCOLS columns,
# START to FINISH, with one target drone to zap. All x are world coords.
const WCOLS := 34
const WFOOT := 30.0
# Chapter 3: touching the FINISH flag drops her down a long tunnel (steer,
# hop, zap) that opens into an underwater pony lagoon at TUNNEL_H.
const TUNNEL_H := 6400.0
var ch3 := false
var cam_y := 0.0
var ch3_pending := 0.0
var cam_x := 0.0
var stride := 0.0
var _w_grounded := false
var _w_face := 1.0
var _w_zap := false
var _w_fire_cd := 0.0
var _fin_cd := 0.0
var wzaps := []
var drone = null

# ─── Chapter 3 · Overhead ───────────────────────────────────────────────────
# DAN, 2026-10-01: the whole chapter plays top-down — falling down the shaft
# (zoom tunnel), the lagoon from above, then the alien underworld: a wide
# cavern where the hive grows its capsules. Swim freely, zap pods while their
# shields flicker off, dodge tadpole guards. Pods are tough and far apart on
# purpose (~8 min), and this is where purchased companions earn their keep.
const UW := 8160.0
const UH2 := 1280.0
const LAG_W := 1920.0
const LAG_H := 1080.0
const POD_N := 14
const POD_HP := 10
const MERMAID_OWNED := true  # TODO(IAP): gate behind the $5 mermaid purchase
var under := false
var pods := []
var tadpoles := []
var goo_bits := []
var pods_left := 0
var _under_won := false
var _stun_t := 0.0
var _crack_hint := false
var umer = null
# Overhead chapter state: fall depth, rushing obstacles, lagoon flag, facing.
var splashed := false
var fall_d := 0.0
var tobs := []
var _fall_spawn := 0.0
var _o_face := Vector2.RIGHT
var _top_rot := 0.0

# ─── Chapter 5 · Open water and the bad part of town ─────────────────────────
# DAN, 2026-10-01: clearing the underworld tears open a current gate at the
# east wall. It spits her into open water — swim to the flag buoy. The flag
# drops her into the bad area city, GTA 2 format: angled overhead, blocks with
# real height, and every building destructible under her horn (the rubble
# stays as a walkable scar). A walled maze squats at the east end with one lit
# entrance; slipping out its exit opens chapter 6.
var ch5 := false
var ch5_city := false
var ch5_pending := 0.0
var _maze_hint := false
var wobs := []
var wcur := []
var towers := []
var mwalls := []
var maze_exit := Vector2.ZERO

# ─── Chapter 6 · Three little jigsaws ────────────────────────────────────────
# DAN, 2026-10-01: the calm after the city — snap the pony back together, then
# the mermaid, then her rider. Nine chunky pieces each, press-drag with a
# finger, snap onto the ghost board, happy sound on lock. Portraits are baked
# from procedural art in a private SubViewport and sliced into a 3x3 grid.
# After the rider: "The End … for now", fireworks, back to title.
var ch6 := false
var ch6_pending := 0.0
var ch6_end := false
var pz_kind := 0
var pz_pieces := []
var pz_sel = null
var pz_grab := Vector2.ZERO
var pz_tex: Texture2D = null
var pz_done_t := 0.0
var pvp: SubViewport = null
var painter = null
var _pz_bake_seq := 0

# rendering resources
var font: Font
var sky_tex: Texture2D
var btn_tex: Texture2D
var _btn_play := Rect2()
var _btn_ch2 := Rect2()
var _btn_ch5 := Rect2()
var _btn_ch6 := Rect2()
var _btn_end := Rect2()
var _btn_again := Rect2()
var _btn_resume := Rect2()
var _btn_sky := Rect2()
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


# Chapter 6 puzzle portraits: the pony, the mermaid and her rider, drawn big
# and friendly into the bake SubViewport. Self-contained on purpose — inner
# classes can't reach the host's palette or helpers.
class PortraitPainter extends Node2D:
	var kind := 0
	const RB := ["ff5e7e", "ffb13b", "ffe45c", "5fe08b", "4fc3ff", "b77bff"]


	func _draw() -> void:
		match kind:
			0:
				_pony()
			1:
				_merm()
			_:
				_knight()


	func _rc(i: int) -> Color:
		return Color(RB[i % 6])


	func _el(c: Vector2, rx: float, ry: float, col: Color) -> void:
		var pts := PackedVector2Array()
		for i in 28:
			pts.append(c + Vector2(cos(i * TAU / 28) * rx, sin(i * TAU / 28) * ry))
		draw_colored_polygon(pts, col)


	func _sp(c: Vector2, r: float) -> PackedVector2Array:
		return PackedVector2Array([
			c + Vector2(0, -r), c + Vector2(r * 0.3, -r * 0.3), c + Vector2(r, 0), c + Vector2(r * 0.3, r * 0.3),
			c + Vector2(0, r), c + Vector2(-r * 0.3, r * 0.3), c + Vector2(-r, 0), c + Vector2(-r * 0.3, -r * 0.3),
		])


	func _pony() -> void:
		# Sky backdrop, two lazy clouds.
		draw_rect(Rect2(0, 0, 480, 360), Color("aee3ff"))
		draw_rect(Rect2(0, 250, 480, 110), Color("8fd0f5"))
		_el(Vector2(96, 78), 48, 18, Color(1, 1, 1, 0.85))
		_el(Vector2(128, 68), 30, 14, Color(1, 1, 1, 0.85))
		_el(Vector2(402, 302), 52, 16, Color(1, 1, 1, 0.6))
		# Rainbow tail streaming left.
		for i in 6:
			draw_line(Vector2(164, 192 + i * 5), Vector2(96 - i * 2, 232 + i * 8), _rc(i), 9, true)
		# Legs with armored hooves.
		for lx in [196.0, 226.0, 272.0, 298.0]:
			draw_line(Vector2(lx, 228), Vector2(lx - 4, 290), Color("ff9ccf"), 14, true)
			draw_rect(Rect2(lx - 13, 286, 19, 12), Color("b9bfd6"))
			draw_rect(Rect2(lx - 13, 286, 19, 12), Color("5d6384"), false, 1.5)
		# Body + belly.
		_el(Vector2(240, 208), 68, 36, Color("ff9ccf"))
		_el(Vector2(244, 222), 54, 22, Color("ffc9e4"))
		# Back plate with the gold cat dot.
		draw_rect(Rect2(208, 180, 70, 40), Color("c9cde0"))
		draw_rect(Rect2(208, 180, 70, 40), Color("5d6384"), false, 2.5)
		draw_circle(Vector2(243, 200), 7, Color("ffd23f"))
		# Wing folded over the plate.
		_el(Vector2(226, 166), 40, 15, Color("ffe3f1"))
		draw_line(Vector2(194, 170), Vector2(258, 162), Color("d9468f"), 2.5, true)
		# Neck and head.
		draw_colored_polygon(PackedVector2Array([Vector2(288, 196), Vector2(322, 126), Vector2(356, 136), Vector2(322, 210)]), Color("ff9ccf"))
		_el(Vector2(346, 118), 26, 20, Color("ff9ccf"))
		_el(Vector2(372, 130), 16, 12, Color("ffc6e2"))
		draw_circle(Vector2(379, 132), 3, Color("d9468f"))
		# Ear + golden horn.
		draw_colored_polygon(PackedVector2Array([Vector2(332, 102), Vector2(326, 78), Vector2(344, 96)]), Color("ff9ccf"))
		draw_colored_polygon(PackedVector2Array([Vector2(352, 96), Vector2(372, 98), Vector2(366, 58)]), Color("ffd23f"))
		draw_polyline(PackedVector2Array([Vector2(352, 96), Vector2(372, 98), Vector2(366, 58), Vector2(352, 96)]), Color("e0a800"), 2, true)
		# Rainbow mane down the neck.
		for i in 5:
			draw_circle(Vector2(318 + i * 7, 96 + i * 22), 11, _rc(i))
		# Eye.
		_el(Vector2(352, 116), 5, 6, Color("2a1650"))
		draw_circle(Vector2(354, 113), 2, Color.WHITE)


	func _merm() -> void:
		# Lagoon backdrop with rising bubbles.
		draw_rect(Rect2(0, 0, 480, 360), Color("8fd8ee"))
		draw_rect(Rect2(0, 180, 480, 180), Color("4fa8d8"))
		for i in 7:
			draw_circle(Vector2(60 + i * 60, 40 + (i * 53) % 280), 4 + (i % 3) * 2, Color(1, 1, 1, 0.35))
		# Flowing pink hair.
		draw_circle(Vector2(238, 92), 30, Color("ff6fb5"))
		draw_circle(Vector2(212, 120), 18, Color("ff9ccf"))
		draw_circle(Vector2(200, 152), 14, Color("ff9ccf"))
		draw_circle(Vector2(262, 116), 16, Color("ff9ccf"))
		draw_circle(Vector2(272, 146), 12, Color("ff9ccf"))
		# Face + star hairpin.
		draw_circle(Vector2(240, 106), 22, Color("ffd9c9"))
		draw_circle(Vector2(232, 104), 3, Color("2a1650"))
		draw_circle(Vector2(248, 104), 3, Color("2a1650"))
		draw_arc(Vector2(240, 112), 8, PI * 0.15, PI * 0.85, 12, Color("2a1650"), 2, true)
		draw_circle(Vector2(224, 112), 3, Color("ff9ccf"))
		draw_colored_polygon(_sp(Vector2(268, 82), 7), Color("ffd23f"))
		# Torso, shells, reaching arm.
		_el(Vector2(240, 152), 18, 24, Color("ffd9c9"))
		draw_circle(Vector2(230, 142), 6, Color("ff9ccf"))
		draw_circle(Vector2(250, 142), 6, Color("ff9ccf"))
		draw_line(Vector2(254, 148), Vector2(292, 128), Color("ffd9c9"), 7, true)
		draw_circle(Vector2(294, 127), 4.5, Color("ffd9c9"))
		# Tail curving down-right with a split fluke.
		for i in 6:
			var k := i / 5.0
			var tp := Vector2(240 + sin(k * 1.9) * 46, 178 + k * 118)
			draw_circle(tp, 20 - k * 9, Color("1f9e85"))
			draw_circle(tp + Vector2(3, 2), (20 - k * 9) * 0.55, Color("7df0c8"))
		draw_colored_polygon(PackedVector2Array([Vector2(282, 296), Vector2(320, 282), Vector2(312, 314)]), Color("2fbfa0"))
		draw_colored_polygon(PackedVector2Array([Vector2(282, 298), Vector2(322, 310), Vector2(300, 330)]), Color("2fbfa0"))


	func _knight() -> void:
		# Castle-dusk backdrop with a friendly moon.
		draw_rect(Rect2(0, 0, 480, 360), Color("cdbde0"))
		draw_rect(Rect2(0, 200, 480, 160), Color("9a86b5"))
		draw_circle(Vector2(410, 66), 26, Color("fff4b0"))
		draw_circle(Vector2(410, 66), 20, Color("ffe45c"))
		# Lance first (behind the body).
		draw_line(Vector2(300, 300), Vector2(342, 84), Color("8a5f3d"), 7, true)
		draw_colored_polygon(PackedVector2Array([Vector2(342, 84), Vector2(330, 116), Vector2(352, 110)]), Color("ff4d5e"))
		# Legs + sabatons.
		draw_rect(Rect2(218, 250, 18, 60), Color("23232e"))
		draw_rect(Rect2(246, 250, 18, 60), Color("23232e"))
		draw_rect(Rect2(214, 302, 24, 12), Color("0f0f16"))
		draw_rect(Rect2(244, 302, 24, 12), Color("0f0f16"))
		# Arm to the lance, body armor, pauldrons, shine.
		draw_line(Vector2(276, 200), Vector2(300, 240), Color("23232e"), 9, true)
		_el(Vector2(240, 208), 38, 52, Color("23232e"))
		draw_line(Vector2(224, 170), Vector2(216, 220), Color(1, 1, 1, 0.4), 3, true)
		_el(Vector2(198, 178), 16, 12, Color("3a3a4e"))
		_el(Vector2(282, 178), 16, 12, Color("3a3a4e"))
		# Shield with the gold cat dot.
		_el(Vector2(188, 226), 24, 30, Color("c9cde0"))
		draw_circle(Vector2(188, 226), 7, Color("ffd23f"))
		# Helm + glint + glowing eyes + pink plume.
		draw_circle(Vector2(240, 118), 30, Color("23232e"))
		draw_arc(Vector2(240, 118), 30, PI * 0.9, PI * 1.6, 16, Color(1, 1, 1, 0.4), 3, true)
		draw_rect(Rect2(214, 112, 52, 10), Color("0f0f16"))
		draw_circle(Vector2(232, 117), 3.5, Color("7df0ff"))
		draw_circle(Vector2(250, 117), 3.5, Color("7df0ff"))
		for i in 4:
			draw_circle(Vector2(240 - i * 4, 84 - i * 12), 9 - i, Color("ff6fb5"))


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
	wonder_unlocked = bool(cfg.get_value("game", "wonder", false))
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
	# Chapter 6 portrait bake target: a private SubViewport the painter
	# redraws into; only updates while a puzzle is being baked.
	pvp = SubViewport.new()
	pvp.size = Vector2i(480, 360)
	pvp.transparent_bg = true
	pvp.render_target_update_mode = SubViewport.UPDATE_DISABLED
	add_child(pvp)
	painter = PortraitPainter.new()
	pvp.add_child(painter)
	_set_level_sky()
	_setup_input()
	_parse_args()
	reset()
	if _autostart:
		start()
	_apply_test_hooks()


var _autostart := false
var _force_level := 0
var _force_vertical := false
var _force_wonder := false
var _force_ch2 := false
var _force_ch3 := false
var _force_ch5 := false
var _force_ch6 := false
var _force_city := false
var _force_under := false
var _force_lagoon := false
var _start_time := 0.0


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
		elif a.begins_with("--level="):
			_force_level = int(a.get_slice("=", 1))
		elif a == "--vertical":
			_force_vertical = true
		elif a == "--wonder":
			_force_wonder = true
		elif a.begins_with("--time="):
			_start_time = float(a.get_slice("=", 1))
		elif a == "--chapter2":
			_force_ch2 = true
			_autostart = true
		elif a == "--chapter3":
			_force_ch3 = true
			_autostart = true
		elif a == "--lagoon":
			_force_lagoon = true
			_autostart = true
		elif a == "--under":
			_force_under = true
			_autostart = true
		elif a == "--chapter5":
			_force_ch5 = true
			_autostart = true
		elif a == "--chapter6":
			_force_ch6 = true
			_autostart = true
		elif a == "--city":
			_force_city = true
			_autostart = true


# Screenshot/QA hooks: jump straight to a level's palette or force the
# portrait overhead view, so every art pass can be verified headlessly.
func _apply_test_hooks() -> void:
	if _force_level > 1:
		level = _force_level
		speed = 260.0 * pow(1.07, mini(level - 1, 14))
		_set_level_sky()
	if _force_vertical:
		vertical = true
		uni.x = VW / 2
		uni.y = VH * 0.72
	if _force_wonder:
		_enter_wonder()
	if _start_time > 0.0:
		play_time = _start_time
		print("FU start at t=%s" % _start_time)
	if _force_ch2:
		play_time = CH2_TIME
		print("FU chapter2 start at t=%s" % play_time)
	if _force_ch3:
		_enter_wonder()
		_enter_ch3()
	if _force_lagoon:
		_enter_wonder()
		_enter_ch3()
		_splash_lagoon()
	if _force_under:
		_enter_wonder()
		_enter_ch3()
		_enter_under()
	if _force_ch5:
		_enter_wonder()
		_enter_ch5()
	if _force_city:
		_enter_wonder()
		_enter_ch5()
		_enter_city()
	if _force_ch6:
		_enter_wonder()
		_enter_ch6()


func _save_cfg() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("game", "best", best)
	cfg.set_value("game", "muted", synth.muted)
	cfg.set_value("game", "tilt", tilt_enabled)
	cfg.set_value("game", "wonder", wonder_unlocked)
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
	# Chapters 2+3 are horizontal-only (DAN, 2026-09-30: portrait play moved
	# out to its own game, Pony Space Shooter Express).
	vertical = VH > VW and not wonder
	uni.x = 190.0 if vertical else maxf(110.0, VW * 0.2)
	uni.y = clampf(uni.y, 70.0, H - 60.0)
	last_ring_y = clampf(last_ring_y, 90.0, H - 110.0)
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
	wonder = false; powered = false; bits = 0; ch2_pending = 0
	cam_x = 0.0; stride = 0.0; wzaps = []; drone = null; _w_zap = false; _fin_cd = 0.0
	ch3 = false; cam_y = 0.0; ch3_pending = 0.0
	under = false; pods = []; tadpoles = []; goo_bits = []; pods_left = 0
	_under_won = false; _stun_t = 0.0; _crack_hint = false; umer = null
	splashed = false; fall_d = 0.0; tobs = []; _fall_spawn = 0.0
	_o_face = Vector2.RIGHT; _top_rot = 0.0
	ch5 = false; ch5_city = false; ch5_pending = 0.0; _maze_hint = false
	wobs = []; wcur = []; towers = []; mwalls = []; maze_exit = Vector2.ZERO
	ch6 = false; ch6_pending = 0.0; ch6_end = false
	pz_pieces = []; pz_sel = null; pz_done_t = 0.0; pz_kind = 0; pz_tex = null
	_bit_taken = {}; _walk_touch = Vector2(-1, -1); _wonder_jump = false
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
	# Wonder World entry: boss kill sets ch2_pending; the WONDER_AT clock is
	# the fallback so kids who can't finish the boss still get there.
	if ch2_pending > 0 and state == "play" and not wonder:
		ch2_pending -= delta
		if ch2_pending <= 0:
			_enter_wonder()
	if ch3_pending > 0 and state == "play" and wonder and not ch3:
		ch3_pending -= delta
		if ch3_pending <= 0:
			_enter_ch3()
	# Chapter 5 opens from the underworld gate; chapter 6 from the maze exit.
	if ch5_pending > 0 and state == "play" and wonder and not ch5:
		ch5_pending -= delta
		if ch5_pending <= 0:
			_enter_ch5()
	if ch6_pending > 0 and state == "play" and wonder and ch5 and not ch6:
		ch6_pending -= delta
		if ch6_pending <= 0:
			_enter_ch6()
	if state == "play" and not wonder and play_time >= WONDER_AT:
		_enter_wonder()
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
	if state == "play":
		play_time += dt
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

	if wonder:
		if ch6:
			_pz_update(dt)
		elif ch5:
			if ch5_city:
				_city_over(dt)
			else:
				_water_over(dt)
		elif ch3:
			if under:
				_under_swim(dt)
			elif splashed:
				_lagoon_over(dt)
			else:
				_fall_over(dt)
		else:
			_wonder_side(dt)
		# Taken star bits twinkle back after a few seconds, in every mode.
		if _bit_taken.size() > 40:
			for k in _bit_taken.keys():
				if t - _bit_taken[k] > 6.0:
					_bit_taken.erase(k)
		_update_particles(dt)
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
	if wonder:
		fire_ok = false
		beam_t = 0
		return
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
	if wonder or state != "play":
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
	# Chapter 2 opens from the boss kill: a beat for the explosion, then in.
	_popup(boss.x, boss.y - 110, "CHAPTER 2! ⭐", Color("ffd23f"))
	ch2_pending = 2.4
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
	# Shield bubble once it powers up (the "Shield up!" tell, made visible).
	if boss.shielded:
		var pulse := 0.5 + 0.5 * sin(t * 6)
		draw_arc(Vector2.ZERO, 66, 0, TAU, 48, Color(0.72, 0.48, 1, 0.30 + 0.18 * pulse), 3, true)
		draw_arc(Vector2.ZERO, 66, t * 1.5, t * 1.5 + PI * 0.6, 32, Color(1, 1, 1, 0.35), 2.5, true)
	# Dome with glass shine and shaded base.
	draw_circle(Vector2(0, -12), 20, Color.WHITE if boss.hit_flash > 0 else Color("c9cde0"))
	draw_arc(Vector2(0, -12), 20, 0, PI, 20, Color("8b86a8", 0.6), 4, true)
	draw_arc(Vector2(0, -12), 20, PI, TAU, 24, Color("5d6384"), 2.5, true)
	draw_arc(Vector2(-5, -14), 13, PI * 1.1, PI * 1.6, 12, Color(1, 1, 1, 0.7), 3, true)
	draw_circle(Vector2(6, -18), 6, Color(1, 1, 1, 0.6))
	# Hull: shaded underside + rim lights.
	_fill_ellipse(Vector2.ZERO, 56, 24, Color.WHITE if boss.hit_flash > 0 else Color("8b86a8"))
	_fill_ellipse(Vector2(0, 8), 52, 14, Color("6f6a92", 0.75))
	draw_polyline(_arc_pts(0, 0, 56, 24, PI * 1.05, PI * 1.95, 24), Color("5d5880"), 3, true)
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
	# Swim weave: snake side-to-side across the facing direction so the
	# trail reads as swimming instead of sliding. Smoothed by the lerp.
	var facing := Vector2(uni.x - mer_px, uni.y - mer_py)
	if facing.length() > 1.0:
		var side := Vector2(-facing.y, facing.x).normalized()
		anchor += side * sin(t * 1.7) * 9.0
	# Spool surge: lean toward the locked foe while winding up the zap.
	if mer_spool > 0 and mer_lock != null and is_instance_valid(mer_lock) and not mer_lock.dead:
		var dl := Vector2(mer_lock.x - mer_px, mer_lock.y - mer_py)
		if dl.length() > 1.0:
			anchor += dl.normalized() * 18.0
	# Catch up faster when far so she never gets stranded off-screen.
	var dist := Vector2(anchor.x - mer_px, anchor.y - mer_py).length()
	var k := minf(1.0, dt * (3.0 + dist * 0.012))
	var ox := mer_px
	var oy := mer_py
	mer_px = lerpf(mer_px, anchor.x, k)
	mer_py = lerpf(mer_py, anchor.y, k)
	if dt > 0.0:
		_mer_vel = Vector2(mer_px - ox, mer_py - oy) / dt
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
	var to_pony := (Vector2(uni.x, uni.y) - mp)
	if to_pony.length() < 0.001:
		to_pony = Vector2.RIGHT
	to_pony = to_pony.normalized()
	# Bank into the swim: lean the body frame with lateral velocity.
	var lat := _mer_vel.x * -to_pony.y + _mer_vel.y * to_pony.x
	to_pony = to_pony.rotated(clampf(lat * 0.00045, -0.28, 0.28))
	var back := -to_pony
	var perp := Vector2(-back.y, back.x)
	# DAN, 2026-09-30: clamp the sway — at exactly w1 == -6 the belly-stripe
	# triangle below goes collinear and Godot's triangulation errors every frame.
	var w1 := clampf(sin(t * thrash) * 6.0, -5.7, 5.7)
	var w2 := sin(t * thrash + 1.2) * 8.0
	# Tail: curved body, belly stripe, dorsal fin, notched fluke.
	var tail := PackedVector2Array([mp + perp * 7, mp + back * 28 + perp * w1, mp + back * 13 - perp * 7])
	draw_colored_polygon(tail, Color("1f9e85"))
	draw_colored_polygon(PackedVector2Array([mp + perp * 2, mp + back * 24 + perp * w1, mp + back * 12 - perp * 2]), Color("7df0c8"))
	draw_polyline(PackedVector2Array([mp + perp * 7, mp + back * 14 + perp * (w1 * 0.5), mp + back * 27 + perp * w1]), Color("7df0c8", 0.65), 2.0, true)
	draw_colored_polygon(PackedVector2Array([mp + back * 10 + perp * 4, mp + back * 20 + perp * (w1 * 0.5), mp + back * 12 + perp * 12]), Color("17806c"))
	# Scale freckles along the tail.
	for si in 3:
		var sq := mp + back * (8 + si * 6) + perp * (3.0 - si)
		draw_arc(sq, 2.2, 0, PI, 8, Color("17806c", 0.8), 1.2, true)
	var fluke := mp + back * 28 + perp * w1
	draw_colored_polygon(PackedVector2Array([fluke + perp * 8 + back * 2, fluke - perp * 8 + back * 2, fluke + back * 16 + perp * w2 * 0.4]), Color("2fbfa0"))
	# Hair mass + five flowing strands behind the head.
	var hair_base := mp + back * 8
	draw_circle(hair_base, 9, Color("ff6fb5"))
	draw_circle(hair_base + Vector2(-1.5, -2.5), 4, Color(1, 1, 1, 0.25))
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
	draw_circle(face + to_pony * 2.5 - perp * 3.2, 1.7, Color("2a1650"))
	draw_circle(face + to_pony * 2.5 + perp * 3.2, 1.7, Color("2a1650"))
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
	if state == "play":
		ground_y += speed * dt * 0.25
	if wonder:
		_wonder_top(dt)
		_update_particles(dt)
		return
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
	if not wonder and vp.distance_to(Vector2(VW - 44, VH - 100)) < 32:
		_rocket_tap = true
		return
	if wonder and not vertical and not ch6 and state == "play" and not paused and vp.distance_to(Vector2(VW - 44, VH - 100)) < 32:
		_w_zap = true
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
		if _btn_ch2.has_point(dp):
			start()
			play_time = CH2_TIME
			return
		if _btn_ch5.has_point(dp):
			start()
			_enter_wonder()
			_enter_ch5()
			return
		if _btn_ch6.has_point(dp):
			start()
			_enter_wonder()
			_enter_ch6()
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
	if ch6_end:
		if _btn_end.has_point(dp):
			_back_to_title()
		return
	if state == "play" and paused:
		if _btn_resume.has_point(dp):
			toggle_pause()
			return
		if wonder and _btn_sky.has_point(dp):
			_exit_wonder()
			return
	if wonder and ch6 and state == "play" and not paused:
		_pz_press(_to_logic(vp))
		pointer_down = true
		pointer_pos = vp
		return
	if wonder and state == "play" and not paused:
		_walk_touch = _to_logic(vp) if not vertical else _to_virtual(vp)
		if not vertical:
			_walk_touch.x += cam_x
			if ch3:
				_walk_touch.y += cam_y
			_wonder_jump = true
		pointer_down = true
		pointer_pos = vp
		return
	pointer_down = true
	pointer_y = _to_logic(vp).y
	pointer_pos = vp


func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed:
			_press_at(_to_virtual(event.position))
		else:
			if wonder and ch6:
				_pz_release()
			pointer_down = false
			pointer_y = null
			_walk_touch = Vector2(-1, -1)
	elif event is InputEventScreenDrag:
		if pointer_down:
			if wonder and ch6:
				_pz_move(_to_logic(_to_virtual(event.position)))
			else:
				pointer_pos = _to_virtual(event.position)
				pointer_y = _to_logic(pointer_pos).y
				if wonder:
					_walk_touch = _to_logic(pointer_pos) if not vertical else pointer_pos
					if not vertical:
						_walk_touch.x += cam_x
						if ch3:
							_walk_touch.y += cam_y
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			_press_at(_to_virtual(event.position))
		else:
			if wonder and ch6:
				_pz_release()
			pointer_down = false
			pointer_y = null
			_walk_touch = Vector2(-1, -1)
	elif event is InputEventMouseMotion:
		if pointer_down:
			if wonder and ch6:
				_pz_move(_to_logic(_to_virtual(event.position)))
			else:
				pointer_pos = _to_virtual(event.position)
				pointer_y = _to_logic(pointer_pos).y
				if wonder:
					_walk_touch = _to_logic(pointer_pos) if not vertical else pointer_pos
					if not vertical:
						_walk_touch.x += cam_x
						if ch3:
							_walk_touch.y += cam_y


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


# Cached soft radial glow (opaque core fading out). Keyed by color + size;
# generated once per combo, reused across frames.
var _vignette: Texture2D = null
var _glow_cache := {}


func _vignette_tex() -> Texture2D:
	if _vignette == null:
		var size := 256
		var img := Image.create(size, size, false, Image.FORMAT_RGBA8)
		var half := size / 2.0
		for y in size:
			for x in size:
				var d := Vector2(x + 0.5 - half, y + 0.5 - half).length() / half
				var a := clampf((d - 0.55) / 0.45, 0.0, 1.0)
				img.set_pixel(x, y, Color(0.16, 0.09, 0.32, a * 0.26))
		_vignette = ImageTexture.create_from_image(img)
	return _vignette


func _radial_glow_tex(inner: Color, outer: Color, size := 128) -> Texture2D:
	var key := "%d|%d|%d|%d_%d" % [int(inner.r * 255), int(inner.g * 255), int(inner.b * 255), int(inner.a * 255), size]
	if _glow_cache.has(key):
		return _glow_cache[key]
	var img := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var half := size / 2.0
	for y in size:
		for x in size:
			var d := Vector2(x + 0.5 - half, y + 0.5 - half).length() / half
			var col := inner.lerp(outer, clampf(d, 0.0, 1.0))
			col.a *= 1.0 - clampf(d, 0.0, 1.0)
			img.set_pixel(x, y, col)
	var tex := ImageTexture.create_from_image(img)
	_glow_cache[key] = tex
	return tex


# Layered-ellipse shading: base fill, darker underside, lighter top sheen.
# Reads as a soft shaded puff without any per-pixel work.
func _shaded_ellipse(c: Vector2, rx: float, ry: float, base: Color, shade: Color, sheen := true) -> void:
	_fill_ellipse(c, rx, ry, base)
	_fill_ellipse(c + Vector2(0, ry * 0.38), rx * 0.94, ry * 0.62, Color(shade.r, shade.g, shade.b, shade.a * 0.5))
	if sheen:
		_fill_ellipse(c + Vector2(-rx * 0.16, -ry * 0.34), rx * 0.62, ry * 0.42, Color(1, 1, 1, 0.28))


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
	var raw: Array = []
	for h in _sky_colors():
		raw.append(Color(h))
	# Five-stop gradient: richer mid tones instead of a plain 3-color ramp.
	var cols := [raw[0], raw[0].lerp(raw[1], 0.5), raw[1], raw[1].lerp(raw[2], 0.5), raw[2]]
	sky_top = cols[0]
	sky_tex = _gradient_tex(cols, [0.0, 0.35, 0.62, 0.85, 1.0])


func _puff(x: float, y: float, s: float) -> void:
	_puff_alpha(x, y, s, 1.0)


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
	draw_arc(Vector2(-6, -34), 16, PI * 1.15, PI * 1.6, 12, Color(1, 1, 1, 0.55), 3.5, true)
	for w in 10:
		var wa := w * TAU / 10 + 0.3
		var lit := sin(t * 2 + w * 1.7) > -0.2
		draw_circle(Vector2(cos(wa) * 92, sin(wa) * 33), 4, Color("ffe9a8") if lit else Color("4a4468"))
	var blink := 0.4 + 0.6 * maxf(0, sin(t * 3))
	draw_circle(Vector2(0, -60), 6, Color(1, 0.3, 0.37, blink))
	draw_circle(Vector2(0, -60), 10, Color(1, 0.3, 0.37, blink * 0.3))
	_world_apply()


func _draw_planet(px: float, py: float, pr: float) -> void:
	# Atmosphere halo + night-side limb.
	draw_texture_rect(_radial_glow_tex(Color(0.35, 0.62, 1, 0.5), Color(0.35, 0.62, 1, 0.0)), Rect2(px - pr * 1.4, py - pr * 1.4, pr * 2.8, pr * 2.8), false)
	draw_circle(Vector2(px, py), pr, Color("1f6fd4"))
	draw_arc(Vector2(px, py), pr - 12, PI * 1.05, PI * 1.8, 48, Color(0.04, 0.07, 0.28, 0.5), 24, true)
	draw_arc(Vector2(px, py), pr, 0, TAU, 96, Color(0.55, 0.85, 1, 0.8), 10, true)
	draw_arc(Vector2(px, py), pr - 26, PI * 1.15, PI * 1.75, 40, Color(1, 1, 1, 0.35), 14, true)
	draw_arc(Vector2(px, py), pr - 60, PI * 0.1, PI * 0.5, 32, Color("7df0c8"), 10, true)
	for ci in 12:
		var ca := PI * (0.55 + 0.9 * _hash01(ci * 3 + 1))
		draw_circle(Vector2(px + cos(ca) * (pr - 8), py + sin(ca) * (pr - 8)), 2.5, Color("ffe9a8"))


# Side view: slow countryside hills, quicker line-art city skyline.
func _draw_scenery(dt: float) -> void:
	var moving := state == "play" and not paused
	if moving and not wonder:
		hill_x += speed * dt * 0.1
		city_x += speed * dt * 0.28
	var night := _sky_is_night()
	# Far skyline silhouette — slowest parallax, sits behind the hills.
	var fw := 210.0
	var foff := fmod(hill_x * 0.55, fw)
	var fbase := int(floor(hill_x * 0.55 / fw))
	var fcol := Color(0.34, 0.36, 0.62, 0.5) if night else Color(0.73, 0.78, 0.94, 0.55)
	var fj := -1
	while fj * fw - foff < W + fw:
		var fidx := fbase + fj
		var fx := fj * fw - foff
		var fh := 36.0 + _hash01(fidx * 3 + 11) * 64.0
		var fww := 120.0 + _hash01(fidx * 7 + 5) * 60.0
		draw_rect(Rect2(fx, H - 40 - fh, fww, fh + 40), fcol)
		fj += 1
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
			var hp := Vector2(cx, H + 30 - row * 40)
			var hcol := Color("2c6b58") if (row == 1 or night) else Color("7ed6a8")
			if row == 1 and not night:
				hcol = Color("5cb98a")
			var hi := hcol.lightened(0.22)
			var lo := hcol.darkened(0.20)
			draw_circle(hp, r, hcol)
			draw_polyline(_arc_pts(hp.x, hp.y, r, r, PI * 1.15, PI * 1.85, 24), hi, 5, true)
			draw_polyline(_arc_pts(hp.x, hp.y, r, r, PI * 0.15, PI * 0.85, 24), lo, 6, true)
			for b in 3:
				if _hash01(idx * 17 + row * 5 + b) < 0.55:
					var ba := PI * (1.15 + 0.7 * _hash01(idx * 23 + b * 7 + row))
					var bp := hp + Vector2(cos(ba), sin(ba)) * (r - 5.0)
					draw_circle(bp, 5 + _hash01(idx * 31 + b) * 4, lo)
					if not night and _hash01(idx * 41 + b * 3) < 0.4:
						draw_circle(bp + Vector2(0, -4), 1.6, Color("fff4fa"))
			if _hash01(idx * 13 + row * 3) < 0.3:
				var tx := cx + (_hash01(idx * 29) - 0.5) * 200.0
				var ty: float = H - 60 - row * 40.0
				var trunk := Color("2e2233") if night else Color("6b4a35")
				var leaf := Color("1d4a3a") if night else Color("2f9e5f")
				draw_rect(Rect2(tx - 4, ty - 26, 8, 26), trunk)
				draw_circle(Vector2(tx, ty - 34), 15, leaf)
				draw_circle(Vector2(tx - 4, ty - 40), 9, leaf.lightened(0.16))
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
		var by0 := H - 40 - bh
		var face := bcol.darkened(_hash01(idx * 3 + 7) * 0.12)
		# Facade: sunlit roof edge, shaded street level, side shade.
		draw_rect(Rect2(bx0, by0, bww, bh), face)
		draw_rect(Rect2(bx0, by0, bww, 7), Color(1, 1, 1, 0.14 if not night else 0.05))
		draw_rect(Rect2(bx0, H - 58, bww, 18), face.darkened(0.24))
		draw_rect(Rect2(bx0, by0, 3, bh), face.darkened(0.16))
		draw_rect(Rect2(bx0 + bww - 3, by0, 3, bh), Color(1, 1, 1, 0.09))
		# Window grid, some lit: warm at night, sky-glint by day.
		var rows := mini(int((bh - 26) / 26), 5)
		var wxs := bx0 + (bww - 74.0) / 2.0
		for wy in range(rows):
			for wx in range(3):
				var wy0 := by0 + 14 + wy * 26
				var wx0 := wxs + wx * 30.0
				var lit := _hash01(idx * 31 + wy * 7 + wx) < (0.62 if night else 0.16)
				var wcol: Color
				if night:
					wcol = Color("ffe9a8") if lit else Color("232347")
				else:
					wcol = Color(1, 1, 1, 0.8) if lit else Color(0.72, 0.83, 1.0, 0.9)
				draw_rect(Rect2(wx0, wy0, 12, 16), wcol)
				draw_rect(Rect2(wx0, wy0, 12, 16), face.darkened(0.25), false, 1.0)
		# Roofline: cap plus an antenna beacon or a water tank.
		draw_rect(Rect2(bx0 - 2, by0, bww + 4, 5), face.lightened(0.18))
		var roof_roll := _hash01(idx * 11 + 2)
		if roof_roll < 0.35:
			var ax := bx + bw / 2
			draw_line(Vector2(ax, by0), Vector2(ax, by0 - 16), face.darkened(0.1), 3, true)
			var blink := 0.5 + 0.5 * sin(t * 4 + idx)
			draw_circle(Vector2(ax, by0 - 18), 2.5, Color(1, 0.3, 0.37, 0.35 + 0.6 * blink))
		elif roof_roll < 0.55:
			var tx0 := bx0 + bww * 0.5
			draw_line(Vector2(tx0 - 8, by0), Vector2(tx0 - 8, by0 - 13), face.darkened(0.3), 2, true)
			draw_line(Vector2(tx0 + 8, by0), Vector2(tx0 + 8, by0 - 13), face.darkened(0.3), 2, true)
			_fill_ellipse(Vector2(tx0, by0 - 19), 12, 9, face.darkened(0.12))
		# Striped storefront awning on some sunny blocks.
		if not night and _hash01(idx * 37 + 3) < 0.4:
			var aw := mini(bww - 16.0, 64.0)
			var ax0 := bx0 + (bww - aw) / 2.0
			draw_rect(Rect2(ax0, H - 58, aw, 8), Color("ff6fb5"))
			for si in 4:
				draw_rect(Rect2(ax0 + si * aw / 4.0, H - 58, aw / 8.0, 8), Color(1, 1, 1, 0.65))
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
	var sun_p := Vector2(W - 140, 90)
	if _sky_is_night():
		# Pale moon: soft halo, cratered face, soft crescent shadow.
		draw_texture_rect(_radial_glow_tex(Color(0.82, 0.88, 1, 0.55), Color(0.82, 0.88, 1, 0)), Rect2(sun_p - Vector2(84, 84), Vector2(168, 168)), false)
		draw_circle(sun_p, 34, Color("f4f1ff"))
		for cr in [[-9.0, -6.0, 6.0], [10.0, 4.0, 5.0], [-2.0, 12.0, 4.0], [6.0, -13.0, 3.0]]:
			draw_circle(sun_p + Vector2(cr[0], cr[1]), cr[2], Color("d9d4ef"))
		draw_texture_rect(_radial_glow_tex(Color(0.72, 0.74, 0.95, 0.95), Color(0.72, 0.74, 0.95, 0.0)), Rect2(sun_p - Vector2(32, 32) + Vector2(14, -8), Vector2(64, 64)), false)
	else:
		# Warm sun: layered glow halo around a bright core.
		draw_texture_rect(_radial_glow_tex(Color(1, 0.93, 0.62, 0.9), Color(1, 0.85, 0.45, 0.0)), Rect2(sun_p - Vector2(115, 115), Vector2(230, 230)), false)
		draw_circle(sun_p, 40, Color("fff3c4"))
		_fill_ellipse(sun_p + Vector2(-10, -10), 22, 15, Color(1, 1, 1, 0.5))

	# Warm haze pooling on the horizon behind the skyline (day skies only).
	if not _sky_is_night():
		draw_texture_rect(_radial_glow_tex(Color(1, 0.97, 0.88, 0.33), Color(1, 0.95, 0.85, 0.0)), Rect2(-140, H - 230, W + 280, 260), false)

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
			if wonder:
				cl.x -= (14.0 if cl.layer else 8.0) * dt
			else:
				cl.x -= (0.35 if cl.layer else 0.18) * speed * dt * (0.4 if state == "title" else 1.0)
		if cl.x < -140:
			cl.x = W + randf_range(40, 200)
			cl.y = randf_range(30, H - 60)
		var old_a := 0.85 if cl.layer else 0.55
		_world_apply()
		# draw with alpha via modulated circles: puff uses fixed colors, wrap with canvas alpha
		_puff_alpha(cl.x, cl.y, cl.s, old_a)

	if not wonder:
		# Puffy cloud floor — the reason she can never falls
		var off := fmod(t * speed * 0.5, 80.0)
		var night := _sky_is_night()
		var fcx := -40.0 - off
		while fcx <= W + 120:
			var fcp := Vector2(fcx, H - 8)
			_fill_ellipse(fcp, 36, 36, Color(1, 1, 1, 0.94))
			_fill_ellipse(fcp + Vector2(0, 14), 34, 24, Color(0.79, 0.79, 0.95, 0.5 if night else 0.34))
			_fill_ellipse(fcp + Vector2(-7, -12), 20, 13, Color(1, 1, 1, 0.75))
			fcx += 80
		# Blue-grey valley shading between the puffs.
		_fill_ellipse(Vector2(W / 2, H + 16), W * 0.62, 26, Color(0.72, 0.72, 0.92, 0.4))


func _draw_solid_ground() -> void:
	# Chapter 2's meadow floor, drawn in world space so the camera carries
	# it: grass band at H - 60 (exactly where her hooves land), soil below,
	# tufts and flowers hashed by world column so they never slide.
	var gy := H - 60.0
	var night := _sky_is_night()
	var soil := Color("6b4526").darkened(0.35) if night else Color("6b4526")
	var dirt := Color("7a5230").darkened(0.35) if night else Color("7a5230")
	var grass := Color("4fa361").darkened(0.3) if night else Color("4fa361")
	var lip := Color("7ed6a8").darkened(0.3) if night else Color("7ed6a8")
	draw_rect(Rect2(0, gy + 26, WCOLS * WCOL, H - gy - 18), soil)
	draw_rect(Rect2(0, gy + 16, WCOLS * WCOL, 10), dirt)
	draw_rect(Rect2(0, gy, WCOLS * WCOL, 16), grass)
	draw_rect(Rect2(0, gy, WCOLS * WCOL, 4), lip)
	var i := int(floor(cam_x / 64.0)) - 1
	while i * 64.0 < cam_x + W + 64:
		var gx := i * 64.0 + 26.0
		if gx > 8 and gx < WCOLS * WCOL - 8:
			if _hash01(i * 13 + 5) < 0.5:
				draw_line(Vector2(gx, gy + 2), Vector2(gx - 3, gy - 5), Color("2f9e5f"), 2)
				draw_line(Vector2(gx + 2, gy + 2), Vector2(gx + 4, gy - 6), Color("2f9e5f"), 2)
				draw_line(Vector2(gx + 1, gy + 2), Vector2(gx + 1, gy - 3), Color("3cb973"), 2)
			if _hash01(i * 29 + 11) < 0.35:
				var fcol: Color = [Color("ff9ccf"), Color("fff4b0"), Color("bfe9ff")][absi(i) % 3]
				var fx := gx + 30
				draw_line(Vector2(fx, gy + 2), Vector2(fx, gy - 7), Color("2f9e5f"), 2)
				for pi in 4:
					var pa := pi * TAU / 4.0 + 0.4
					draw_circle(Vector2(fx + cos(pa) * 3, gy - 7 + sin(pa) * 3), 1.8, fcol)
				draw_circle(Vector2(fx, gy - 7), 1.4, Color("ffd23f"))
		i += 1


func _puff_alpha(x: float, y: float, s: float, a: float) -> void:
	_wxf(Vector2(x, y), 0, Vector2(s, s))
	# Flat base, then shaded lobes: lavender underside, white sunlit tops.
	var base := Color(0.93, 0.93, 1.0, a)
	_fill_ellipse(Vector2(4, 10), 70, 18, Color(0.82, 0.82, 0.96, 0.55 * a))
	draw_rect(Rect2(-44, 2, 94, 12), base)
	draw_circle(Vector2(-40, 2), 20, base)
	draw_circle(Vector2(-12, -12), 28, base)
	draw_circle(Vector2(22, -5), 25, base)
	draw_circle(Vector2(48, 5), 17, base)
	var under := Color(0.79, 0.79, 0.95, 0.5 * a)
	draw_circle(Vector2(-38, 8), 17, under)
	draw_circle(Vector2(8, 12), 22, under)
	draw_circle(Vector2(46, 10), 13, under)
	var top := Color(1, 1, 1, 0.85 * a)
	draw_circle(Vector2(-16, -20), 16, top)
	draw_circle(Vector2(16, -13), 13, top)
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
	# Soft lower shading, then feather separations on top.
	_fill_ellipse(Vector2(-30, -18), 26, 12, Color("e8a9c9", 0.5))
	for fn in [Vector2(-48, -34), Vector2(-44, -20), Vector2(-28, -8)]:
		draw_line(Vector2(-4, -4), fn, Color("d9468f", 0.45), 1.5, true)
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

	if wonder and not vertical:
		# Walking legs: full-length trot cycle scaled by speed, hooves plant
		# on the collision plane (y + WFOOT); tucked splay when airborne.
		var legs_w := [[-24.0, 0.0], [-10.0, PI], [12.0, PI], [26.0, 0.0]]
		var amp := clampf(absf(uni.vx) / 120.0, 0.0, 1.0)
		for leg in legs_w:
			var hip := Vector2(leg[0], 10)
			var foot: Vector2
			if _w_grounded:
				var swing := sin(stride * TAU + leg[1]) * amp
				foot = Vector2(leg[0] + swing * 11.0, 25.0 - maxf(0.0, cos(stride * TAU + leg[1])) * 7.0 * amp)
			else:
				foot = Vector2(leg[0] + (11.0 if leg[0] > 0 else -9.0), 18.0)
			draw_line(hip, foot, Color("ff9ccf"), 8, true)
			draw_rect(Rect2(foot.x - 5.5, foot.y - 2, 11, 7), Color("b9bfd6"))
			draw_rect(Rect2(foot.x - 5.5, foot.y - 2, 11, 7), Color("5d6384"), false, 1.5)
			draw_line(Vector2(foot.x - 4, foot.y + 0.5), Vector2(foot.x + 4, foot.y + 0.5), Color(1, 1, 1, 0.55), 1.2, true)
	else:
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
			draw_line(Vector2(sx - 4, sy - 1.6), Vector2(sx + 4, sy - 1.6), Color(1, 1, 1, 0.55), 1.2, true)

	# Body
	_fill_ellipse(Vector2.ZERO, 40, 22, Color("ff9ccf"))
	_fill_ellipse(Vector2(3, 10), 33, 12, Color("ffc9e4"))
	_fill_ellipse(Vector2(-6, -13), 28, 8, Color(0.87, 0.42, 0.62, 0.55))
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
	# Diagonal shine sweeping the plate.
	draw_colored_polygon(PackedVector2Array([Vector2(-24, -4), Vector2(-12, -22), Vector2(-5, -17), Vector2(-17, -1)]), Color(1, 1, 1, 0.20))

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
		var lock := Vector2(42 - i * 6, -44 + i * 8 + sin(t * 9 + i) * 1.5)
		draw_circle(lock, 7, RAINBOW[i])
		draw_circle(lock + Vector2(0, 3.2), 4.6, RAINBOW[i].darkened(0.25))
		if i == 0:
			draw_circle(lock + Vector2(-2.4, -3), 2, Color(1, 1, 1, 0.75))

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
	# Halo behind gold/red rings so they pop against bright skies.
	if r.gold or r.red:
		var halo := Color(1, 0.85, 0.3, 0.30) if r.gold else Color(1, 0.3, 0.37, 0.28)
		draw_texture_rect(_radial_glow_tex(halo, Color(halo.r, halo.g, halo.b, 0)), Rect2(r.x - rx * 1.5, r.y - ry * 1.5, rx * 3.0, ry * 3.0), false)
	draw_polyline(pts, edge, 12, true)
	draw_polyline(pts, col, 7, true)
	# Specular glint along the upper arc, inner glow line.
	if not front:
		draw_polyline(_arc_pts(r.x, r.y - 1.5, rx, ry, start, end, 20), Color(1, 1, 1, 0.65), 2, true)
	draw_polyline(_arc_pts(r.x, r.y, rx - 4, ry - 4, start, end, 20), Color(1, 1, 1, 0.28), 1.5, true)
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
	# Zappy tell: pulsing violet glow behind the whole cloud.
	if c.zappy and c.hit_flash <= 0:
		var zap_a := 0.22 + 0.16 * maxf(0.0, sin(t * 5 + c.phase))
		draw_texture_rect(_radial_glow_tex(Color(0.72, 0.55, 1, zap_a), Color(0.72, 0.55, 1, 0)), Rect2(c.x - 62, c.y - 62, 124, 124), false)
	# Body lobes + darker underside + sunlit tops.
	draw_circle(Vector2(c.x - 22, c.y + 6), 20, shade)
	draw_circle(Vector2(c.x, c.y - 8), 26, shade)
	draw_circle(Vector2(c.x + 24, c.y + 4), 20, shade)
	draw_circle(Vector2(c.x, c.y + 12), 22, shade)
	var under := shade.darkened(0.28)
	draw_circle(Vector2(c.x - 20, c.y + 16), 15, under)
	draw_circle(Vector2(c.x + 4, c.y + 19), 17, under)
	draw_circle(Vector2(c.x + 24, c.y + 14), 13, under)
	if c.hit_flash <= 0:
		draw_circle(Vector2(c.x - 4, c.y - 22), 13, Color(1, 1, 1, 0.22))
		draw_circle(Vector2(c.x + 18, c.y - 10), 9, Color(1, 1, 1, 0.16))
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
		draw_circle(Vector2(rx, y), 20, Color(0.35, 0.55, 0.9, 0.25))
		y += 22.0
	y = -20.0
	while y < VH + 20:
		var rx := VW * 0.72 + sin((y + ground_y) * 0.012) * 90.0
		draw_circle(Vector2(rx, y), 15, Color(0.45, 0.7, 1.0, 0.35))
		y += 22.0


func _draw_storm_top(c) -> void:
	var shade := Color.WHITE if c.hit_flash > 0 else (Color("dceaff") if c.gust else (Color("7d8fc9") if c.rain else Color("6d6690")))
	var core := Color("3d3a5c") if c.hit_flash <= 0 else Color.WHITE
	var spin := 1.6 if c.gust else 0.8
	for arm in 3:
		var a0: float = t * spin + c.phase + arm * TAU / 3
		draw_arc(Vector2(c.x, c.y), c.r * (0.45 + arm * 0.2), a0, a0 + PI * 1.25, 26, shade, 10, true)
	draw_circle(Vector2(c.x, c.y), c.r * 0.3, core)
	draw_arc(Vector2(c.x, c.y), c.r * 0.3, 0, PI, 14, core.darkened(0.35), 3.5, true)
	draw_arc(Vector2(c.x, c.y), c.r * 0.3, 0, TAU, 24, shade, 2, true)
	draw_arc(Vector2(c.x, c.y), c.r * 0.72, PI * 1.15, PI * 1.85, 18, Color(1, 1, 1, 0.16), 5, true)
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
	if r.gold or r.red:
		var halo2 := Color(1, 0.85, 0.3, 0.28) if r.gold else Color(1, 0.3, 0.37, 0.26)
		draw_texture_rect(_radial_glow_tex(halo2, Color(halo2.r, halo2.g, halo2.b, 0)), Rect2(r.x - r.rx * 1.5, r.y - r.rx * 1.5, r.rx * 3.0, r.rx * 3.0), false)
	draw_arc(Vector2(r.x, r.y), r.rx + 4, 0, TAU, 48, edge, 12, true)
	draw_arc(Vector2(r.x, r.y), r.rx + 4, 0, TAU, 48, col, 7, true)
	# Inner glint ring.
	draw_arc(Vector2(r.x, r.y), r.rx, 0, TAU, 48, Color(1, 1, 1, 0.30), 1.5, true)
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
	_wxf(Vector2(uni.x, uni.y), _top_rot + uni.tilt + react_angle, _react_sc())
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
	_fill_ellipse(Vector2(0, 6), 17, 26, Color(0.87, 0.42, 0.62, 0.38))
	_fill_ellipse(Vector2(-6, -18), 11, 14, Color(1, 1, 1, 0.30))
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
	# Drop shadow anchoring the card over the sky.
	var shadow := StyleBoxFlat.new()
	shadow.bg_color = Color(0.08, 0.04, 0.2, 0.35)
	shadow.set_corner_radius_all(26)
	draw_style_box(shadow, rect.grow(8).grow_individual(6, 10, 6, -2))
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
	# Faint glass sheen across the top edge.
	var sheen := StyleBoxFlat.new()
	sheen.bg_color = Color(1, 1, 1, 0.07)
	sheen.corner_radius_top_left = 20
	sheen.corner_radius_top_right = 20
	draw_style_box(sheen, Rect2(rect.position + Vector2(4, 4), Vector2(rect.size.x - 8, rect.size.y * 0.4)))


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


func _ch2_button(center: Vector2, text: String) -> Rect2:
	var rect := Rect2(center - Vector2(95, 20), Vector2(190, 40))
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.55, 0.35, 0.85, 0.55)
	sb.border_color = Color("ffd23f")
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(20)
	draw_style_box(sb, rect)
	_text_c(center + Vector2(0, 6), text, 17, Color("fff4b0"))
	return rect


# Smaller chapter-jump button; three sit in a row under Fly! on the title card.
func _chapter_btn(center: Vector2, text: String) -> Rect2:
	var rect := Rect2(center - Vector2(62, 18), Vector2(124, 36))
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.55, 0.35, 0.85, 0.55)
	sb.border_color = Color("ffd23f")
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(18)
	draw_style_box(sb, rect)
	_text_c(center + Vector2(0, 5), text, 15, Color("fff4b0"))
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
	y += 56
	_btn_ch2 = _chapter_btn(Vector2(W / 2 - 132, y + 18), "⭐ Ch. 2")
	_btn_ch5 = _chapter_btn(Vector2(W / 2, y + 18), "🌊 Ch. 5")
	_btn_ch6 = _chapter_btn(Vector2(W / 2 + 132, y + 18), "🧩 Ch. 6")
	y += 48
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
	_btn_resume = _play_button(Vector2(W / 2, H / 2 - 110 + 148), "Keep Playing")
	if wonder:
		_btn_sky = _play_button(Vector2(W / 2, H / 2 - 110 + 196), "Back to the Sky")


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
func _meter(r: Rect2, frac: float, col: Color) -> void:
	draw_rect(r, Color(0.12, 0.07, 0.25, 0.42))
	draw_rect(r, Color(1, 1, 1, 0.20), false, 1.0)
	var fill := Rect2(r.position + Vector2(1.5, 1.5), Vector2((r.size.x - 3.0) * clampf(frac, 0.0, 1.0), r.size.y - 3.0))
	draw_rect(fill, col)
	draw_rect(Rect2(fill.position, Vector2(fill.size.x, maxf(1.5, fill.size.y * 0.45))), Color(1, 1, 1, 0.28))


func _draw_hud() -> void:
	if wonder:
		_stroke_text(Vector2(22, 44), str(score), 28, Color.WHITE, HORIZONTAL_ALIGNMENT_LEFT, 5)
		_stroke_text(Vector2(22, 76), "⭐ x%d" % bits, 20, Color("ffd23f"), HORIZONTAL_ALIGNMENT_LEFT, 4)
		var label := "Chapter 2"
		if ch6:
			label = "Puzzle %d/3 · %s" % [pz_kind + 1, _pz_name(pz_kind)]
		elif ch5:
			label = "Bad City 🏙" if ch5_city else "Open Water 🌊"
		elif ch3:
			label = "The Underworld 👽" if under else "Chapter 3"
		_stroke_text(Vector2(VW / 2, 40), label, 22, RAINBOW[int(t * 8) % 6], HORIZONTAL_ALIGNMENT_CENTER, 5)
		if under:
			var pcol := Color("9df08a") if pods_left > 0 else Color("ffd23f")
			_stroke_text(Vector2(22, 108), "👽 x%d left" % pods_left if pods_left > 0 else "👽 ALL CLEAR!", 20, pcol, HORIZONTAL_ALIGNMENT_LEFT, 4)
		_draw_round_button(Vector2(VW - 87, 33), "🔇" if synth.muted else "🔊")
		_draw_round_button(Vector2(VW - 33, 33), "❚❚")
		var any_target: bool = drone != null and drone.alive
		if under and pods_left > 0:
			any_target = true
		if ch5:
			any_target = true
		if not vertical and any_target:
			_draw_round_button(Vector2(VW - 44, VH - 100), "⚡")
		if transitioning:
			_pill(Vector2(VW / 2, 76), "TURNING…")
		return
	_stroke_text(Vector2(22, 44), str(score), 28, Color.WHITE, HORIZONTAL_ALIGNMENT_LEFT, 5)
	var hpk := clampf(hp / HP_MAX, 0.0, 1.0)
	var hpcol := Color("7df08a") if hpk > 0.5 else (Color("ffd23f") if hpk > 0.25 else Color("ff4d5e"))
	_meter(Rect2(22, 66, 110, 10), hpk, hpcol)
	var mer_k := mer_spool if mer_spool > 0 else 1.0 - clampf(mer_cd / MERCD, 0.0, 1.0)
	_meter(Rect2(22, 80, 110, 5), clampf(mer_k, 0.0, 1.0), Color("7df0ff"))
	_stroke_text(Vector2(22, 112), "Level %d" % level, 16, Color("ffd9ef"), HORIZONTAL_ALIGNMENT_LEFT, 4)
	# Horn heat bar + eye-beam charge pip.
	var heat_col := Color("ff4d5e") if overheated else Color("ffd23f")
	_meter(Rect2(22, 120, 110, 8), heat, heat_col)
	var beam_k := 1.0 if beam_t > 0 else 1.0 - clampf(beam_cd / BEAM_PERIOD, 0.0, 1.0)
	_meter(Rect2(22, 132, 110, 6), beam_k, Color("ff4d5e"))
	if overheated and int(t * 4) % 2 == 0:
		_stroke_text(Vector2(22, 150), "RELOADING…", 16, Color("9adcff"), HORIZONTAL_ALIGNMENT_LEFT, 4)
	if boss != null:
		var bt := maxi(0, int(ceil(boss_t)))
		_stroke_text(Vector2(VW / 2, 40), "BOSS %d" % bt, 26, Color("ff4d5e") if bt <= 5 else Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER, 5)
		var bfrac := clampf(float(boss.hp) / float(maxi(boss.max_hp, 1)), 0.0, 1.0)
		_meter(Rect2(VW / 2 - 70, 50, 140, 8), bfrac, Color("b77bff"))
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


# ─── Wonder World ─────────────────────────────────────────────────────────
# The free-roam reward space (DAN, 2026-09-30: unlock at ~8 minutes of play,
# Mario-style walk/jump landscape mode, overhead meadow when rotated, nothing
# hostile, pony arrives powered up with a rainbow double jump).
const WCOL := 170.0
const WCELL := 190.0
var _bit_taken := {}
var _wonder_jump := false


func _enter_wonder() -> void:
	wonder = true
	vertical = false  # chapters 2+3 are horizontal-only
	wonder_unlocked = true
	powered = true
	_save_cfg()
	rings = []; clouds = []; lasers = []; pickups = []; popups = []
	boss = null; bolts = []; rockets = []; arcs = []; dash_t = 0; dash_lock = null
	bits = 0
	cam_x = 0.0; stride = 0.0; _w_face = 1.0; _w_zap = false; _w_fire_cd = 0.0; _fin_cd = 0.0
	wzaps = []
	drone = { "x": WCOLS * WCOL * 0.5, "y": 210.0, "dir": 1.0, "hp": 6, "hit": 0.0, "alive": true, "respawn_t": 0.0, "phase": randf() * TAU }
	uni.x = 220.0
	uni.y = H - 160.0
	uni.vx = 0.0; uni.vy = 0.0
	uni.tilt = 0.0
	level_banner = 2.4
	flash = maxf(flash, 0.25)
	_air_jump = true
	_burst(uni.x, uni.y, 40, [Color("ffd23f"), Color("fff4b0"), Color.WHITE], 320)
	synth.powerup()
	synth.pony()


func _exit_wonder() -> void:
	wonder = false
	powered = false
	paused = false
	play_time = 0.0
	reset()
	state = "play"
	_layout()  # chapter 1 still honors the portrait overhead view


# Column layout is a pure hash of the column index, so wrap-around and
# rotation always agree on where platforms and bits sit.
func _wonder_col(c: int) -> Array:
	var py := 300.0 + _hash01(c * 7 + 3) * 150.0
	var pw := 120.0 + _hash01(c * 5 + 1) * 60.0
	var bounce := _hash01(c * 11 + 2) < 0.3
	var nb := 1 + int(_hash01(c * 13 + 7) * 3.0)
	return [py, pw, bounce, nb]


func _wonder_cols() -> Array:
	var out := []
	var c := clampi(int(floor((cam_x - 100.0) / WCOL)), 0, WCOLS - 1)
	while c < WCOLS and c * WCOL < cam_x + W + 100:
		out.append(c)
		c += 1
	return out


func _wonder_bit_pos(c: int, bi: int) -> Vector2:
	var L := _wonder_col(c)
	var n: int = L[3]
	var bx: float = c * WCOL
	if n > 1:
		bx = c * WCOL - L[1] * 0.3 + bi * (L[1] * 0.6 / (n - 1))
	return Vector2(bx, L[0] - 46.0 - sin(t * 3.0 + c + bi) * 6.0)


func _wonder_side(dt: float) -> void:
	if state != "play":
		uni.y += sin(t * 2.0) * 4.0 * dt
		return
	# Walk: keys/stick, or press-drag toward a spot.
	var walk := 0.0
	if Input.is_action_pressed("fly_left"):
		walk -= 1.0
	if Input.is_action_pressed("fly_right"):
		walk += 1.0
	if pointer_down and _walk_touch.x >= 0:
		var d: float = _walk_touch.x - uni.x
		if absf(d) > 18.0:
			walk = clampf(d / 120.0, -1.0, 1.0)
	uni.vx += walk * 1400.0 * dt
	if walk == 0.0:
		uni.vx *= pow(0.001, dt)
	else:
		_w_face = signf(walk)
	uni.vx = clampf(uni.vx, -300.0, 300.0)
	# Gravity + rainbow double jump.
	uni.vy += 1500.0 * dt
	uni.vy = minf(uni.vy, 900.0)
	if Input.is_action_just_pressed("fly_up") or Input.is_action_just_pressed("fire") or _wonder_jump:
		_wonder_jump = false
		var grounded: bool = uni.y + WFOOT >= H - 66
		if not grounded:
			for c in _wonder_cols():
				var L := _wonder_col(c)
				if absf(uni.x - c * WCOL) < L[1] * 0.5 + 14 and absf(uni.y + WFOOT - L[0]) < 16:
					grounded = true
					break
		if grounded:
			uni.vy = -620
			_air_jump = true
			react_pop = 0.6
			_burst(uni.x, uni.y + 18, 6, [Color.WHITE, Color("ffd9ef")], 120)
			synth.pony()
		elif _air_jump:
			_air_jump = false
			uni.vy = -560
			react_pop = 1.0
			_burst(uni.x, uni.y + 10, 14, RAINBOW, 220)
			synth.gold()
	var prev_foot: float = uni.y + WFOOT
	uni.x += uni.vx * dt
	uni.y += uni.vy * dt
	if uni.x < 30:
		uni.x = 30
		uni.vx = absf(uni.vx) * 0.4
	if uni.x > WCOLS * WCOL - 30:
		uni.x = WCOLS * WCOL - 30
		uni.vx = -absf(uni.vx) * 0.4
	if uni.y < 80:
		uni.y = 80
		uni.vy = absf(uni.vy) * 0.3
	# Land on platforms; rainbow clouds boing.
	var landed := false
	if uni.vy >= 0:
		for c in _wonder_cols():
			var L := _wonder_col(c)
			if absf(uni.x - c * WCOL) < L[1] * 0.5 + 12 and prev_foot <= L[0] + 4 and uni.y + WFOOT >= L[0]:
				if L[2]:
					uni.vy = -760
					react_pop = 1.0
					_burst(uni.x, L[0], 12, [Color.WHITE, Color("bfe9ff")], 180)
					synth.poof()
				else:
					uni.y = L[0] - WFOOT
					uni.vy = 0
					_air_jump = true
				landed = true
				break
		if not landed and uni.y + WFOOT >= H - 60:
			uni.y = H - 60 - WFOOT
			uni.vy = 0
			_air_jump = true
	_w_grounded = landed or (uni.vy == 0.0 and uni.y + WFOOT >= H - 61)
	uni.tilt += (clampf(uni.vx / 700.0, -0.3, 0.3) - uni.tilt) * minf(1, dt * 8)
	uni.flap += dt * (10.0 if not _w_grounded else 3.0)
	stride += absf(uni.vx) * dt * 0.045
	# Camera follows; the backdrop parallax rides it (drawn without the
	# camera transform, so these offsets are the parallax factors).
	cam_x = clampf(lerpf(cam_x, uni.x - W * 0.42, minf(1.0, dt * 6.0)), 0.0, WCOLS * WCOL - W)
	hill_x = cam_x * 0.35
	city_x = cam_x * 0.65
	# Zap button / rockets key fires a bolt the way she's facing.
	_w_fire_cd = maxf(0.0, _w_fire_cd - dt)
	if Input.is_action_just_pressed("rockets") or _w_zap:
		_w_zap = false
		if _w_fire_cd <= 0:
			_w_fire_cd = 0.22
			wzaps.append({ "x": uni.x + _w_face * 30, "y": uni.y - 14, "dir": _w_face, "dy": 0.0, "life": 0.9, "dead": false })
			synth.zap()
	for z in wzaps:
		if z.dead:
			continue
		z.x += z.dir * 760 * dt
		z.life -= dt
		if z.life <= 0:
			z.dead = true
		if drone != null and drone.alive and not z.dead and Vector2(z.x - drone.x, z.y - drone.y).length() < 44:
			z.dead = true
			drone.hp -= 1
			drone.hit = 0.12
			_burst(drone.x, drone.y, 6, [Color.WHITE, Color("ff4d5e")], 140)
			synth.zap()
			if drone.hp <= 0:
				drone.alive = false
				drone.respawn_t = 3.0
				score += 50
				_popup(drone.x, drone.y - 44, "BOOM! +50", Color("ffd23f"))
				_burst(drone.x, drone.y, 30, [Color("ff4d5e"), Color("ffd23f"), Color.WHITE], 240)
				synth.poof()
	wzaps = wzaps.filter(func(z): return not z.dead)
	# Practice drone: a gentle patrol, bonks her back without damage, and
	# comes back for more target practice a few seconds after going down.
	if drone != null:
		if drone.alive:
			drone.x += drone.dir * 70 * dt
			if drone.x > WCOLS * WCOL * 0.8:
				drone.dir = -1.0
			elif drone.x < WCOLS * WCOL * 0.25:
				drone.dir = 1.0
			drone.y = 400.0 + sin(t * 1.3 + drone.phase) * 45.0
			drone.hit = maxf(0.0, drone.hit - dt)
			if Vector2(uni.x - drone.x, uni.y - drone.y).length() < 48:
				uni.vx = signf(uni.x - drone.x) * 280.0
				uni.vy = -340.0
				_burst(uni.x, uni.y, 8, [Color.WHITE, Color("bfe9ff")], 140)
				synth.poof()
		else:
			drone.respawn_t -= dt
			if drone.respawn_t <= 0:
				drone.alive = true
				drone.hp = 6
				drone.x = clampf(uni.x + _w_face * 500.0, WCOLS * WCOL * 0.25, WCOLS * WCOL * 0.8)
				drone.dir = -_w_face
				_popup(drone.x, drone.y - 40, "He's back!", Color("bfe9ff"))
	# FINISH flag: touching the pole opens Chapter 3 — the tunnel drop.
	_fin_cd = maxf(0.0, _fin_cd - dt)
	if uni.x >= WCOLS * WCOL - 170 and _fin_cd <= 0 and ch3_pending <= 0:
		_fin_cd = 5.0
		score += 50
		bits += 3
		_popup(uni.x, uni.y - 70, "FINISH! ⭐", Color("ffd23f"))
		_popup(uni.x, uni.y - 110, "CHAPTER 3! ↓", Color("7df0ff"))
		_burst(uni.x + 40, uni.y - 40, 40, RAINBOW, 260)
		synth.level_up()
		ch3_pending = 1.6
	# Star bits: collect on touch, twinkle back a few seconds later.
	for c in _wonder_cols():
		var L := _wonder_col(c)
		for bi in L[3]:
			var bp := _wonder_bit_pos(c, bi)
			if Vector2(uni.x - bp.x, uni.y - bp.y).length() < 34:
				var key := "%d:%d" % [c, bi]
				if not _bit_taken.has(key):
					_bit_taken[key] = t
					bits += 1
					score += 5
					_burst(bp.x, bp.y, 8, [Color("ffd23f"), Color.WHITE], 160)
					synth.ring(bits)
	# Powered aura sparkles.
	if randf() < 0.5:
		var p := Particle.new()
		p.x = uni.x + randf_range(-22, 22)
		p.y = uni.y + randf_range(-18, 18)
		p.vx = randf_range(-25, 25)
		p.vy = randf_range(-40, -10)
		p.life = 0.5
		p.max_life = 0.5
		p.r = randf_range(2, 4)
		p.c = RAINBOW[int(t * 10) % 6]
		p.star = true
		particles.append(p)


# ─── Chapter 3: the tunnel drop and the pony lagoon ───────────────────────
# Chapter 3 is overhead all the way (DAN, 2026-10-01): phase 1 falls down
# the shaft as a zoom tunnel, phase 2 swims the lagoon from above, phase 3
# hunts the hive capsules in the underworld.
func _enter_ch3() -> void:
	ch3 = true
	splashed = false
	under = false
	fall_d = 0.0
	tobs = []
	_fall_spawn = 0.4
	cam_x = 0.0; cam_y = 0.0
	_w_zap = false
	_w_fire_cd = 0.0
	wzaps = []
	drone = null
	pods = []; tadpoles = []; goo_bits = []
	uni.x = W / 2
	uni.y = H * 0.46
	uni.vx = 0.0; uni.vy = 0.0
	uni.tilt = 0.0
	_o_face = Vector2.DOWN
	_top_rot = _o_face.angle() + PI / 2
	level_banner = 2.4
	flash = maxf(flash, 0.3)
	_burst(uni.x, uni.y, 40, RAINBOW, 300)
	synth.level_up()
	synth.pony()


# Shared 2D swim for the overhead phases: keys/stick or press-drag, gentle
# drag, world-bounds clamp, roaming camera, facing for the top-view art.
func _over_swim(dt: float, world_w: float, world_h: float) -> void:
	_stun_t = maxf(0.0, _stun_t - dt)
	var swim := Vector2.ZERO
	if Input.is_action_pressed("fly_left"):
		swim.x -= 1.0
	if Input.is_action_pressed("fly_right"):
		swim.x += 1.0
	if Input.is_action_pressed("fly_up"):
		swim.y -= 1.0
	if Input.is_action_pressed("fly_down"):
		swim.y += 1.0
	if pointer_down and _walk_touch.x >= 0:
		var d := Vector2(_walk_touch.x - uni.x, _walk_touch.y - uni.y)
		if d.length() > 24.0:
			swim = d.normalized()
	if _stun_t > 0:
		swim = Vector2.ZERO
	if swim.length() > 0.001:
		swim = swim.normalized()
		uni.vx += swim.x * 640.0 * dt
		uni.vy += swim.y * 640.0 * dt
		_o_face = swim
		if swim.x != 0:
			_w_face = signf(swim.x)
	else:
		uni.vx *= pow(0.08, dt)
		uni.vy *= pow(0.08, dt)
	var spd := Vector2(uni.vx, uni.vy).length()
	if spd > 250.0:
		uni.vx *= 250.0 / spd
		uni.vy *= 250.0 / spd
	uni.x = clampf(uni.x + uni.vx * dt, 56.0, world_w - 56.0)
	uni.y = clampf(uni.y + uni.vy * dt, 66.0, world_h - 66.0)
	uni.flap += dt * 5.0
	_top_rot = _o_face.angle() + PI / 2
	cam_x = clampf(lerpf(cam_x, uni.x - W * 0.42, minf(1.0, dt * 4.0)), 0.0, world_w - W)
	cam_y = clampf(lerpf(cam_y, uni.y - H * 0.5, minf(1.0, dt * 4.0)), 0.0, world_h - H)


# Phase 1: the shaft, seen from directly above. Rocks rush up from the
# depths — dodge; star bits and balloons rush up too — grab.
func _fall_over(dt: float) -> void:
	if state != "play":
		return
	_stun_t = maxf(0.0, _stun_t - dt)
	var steer := Vector2.ZERO
	if Input.is_action_pressed("fly_left"):
		steer.x -= 1.0
	if Input.is_action_pressed("fly_right"):
		steer.x += 1.0
	if Input.is_action_pressed("fly_up"):
		steer.y -= 1.0
	if Input.is_action_pressed("fly_down"):
		steer.y += 1.0
	if pointer_down and _walk_touch.x >= 0:
		var d := Vector2(_walk_touch.x - uni.x, _walk_touch.y - uni.y)
		if d.length() > 20.0:
			steer = d.normalized()
	if _stun_t > 0:
		steer = Vector2.ZERO
	if steer.length() > 0.001:
		steer = steer.normalized()
		uni.vx += steer.x * 900.0 * dt
		uni.vy += steer.y * 900.0 * dt
		_o_face = steer
	else:
		uni.vx *= pow(0.02, dt)
		uni.vy *= pow(0.02, dt)
	var sp := Vector2(uni.vx, uni.vy).length()
	if sp > 260.0:
		uni.vx *= 260.0 / sp
		uni.vy *= 260.0 / sp
	uni.x += uni.vx * dt
	uni.y += uni.vy * dt
	# She can only drift as far as the shaft mouth.
	var cen := Vector2(W / 2, H * 0.46)
	var off := Vector2(uni.x - cen.x, uni.y - cen.y)
	if off.length() > 200.0:
		off = off.normalized() * 200.0
		uni.x = cen.x + off.x
		uni.y = cen.y + off.y
		uni.vx *= 0.4
		uni.vy *= 0.4
	uni.flap += dt * 8.0
	_top_rot = _o_face.angle() + PI / 2
	fall_d += 300.0 * dt
	_fall_spawn -= dt
	if _fall_spawn <= 0:
		_fall_spawn = 0.55
		var roll := randf()
		var kind := "rock" if roll < 0.42 else ("bit" if roll < 0.78 else "balloon")
		tobs.append({ "ang": randf() * TAU, "z": 0.0, "kind": kind })
	for o in tobs:
		o.z += dt / 3.2  # ~3s from far speck to the rim
		if o.z < 0.5 or o.z > 1.1:
			continue
		var op := _tobs_pos(o)
		var rr: float = 26.0 * o.z + 10.0
		if Vector2(uni.x - op.x, uni.y - op.y).length() < rr + 14.0:
			if o.kind == "rock":
				o.z = 9.9
				_stun_t = 0.4
				var away := Vector2(uni.x - op.x, uni.y - op.y).normalized()
				uni.vx = away.x * 300.0
				uni.vy = away.y * 300.0
				_popup(uni.x, uni.y - 44, "Ouch!", Color("ff9ccf"))
				_burst(op.x, op.y, 10, [Color("8b86a8"), Color.WHITE], 150)
				synth.poof()
			elif o.kind == "bit":
				o.z = 9.9
				bits += 1
				score += 5
				_burst(op.x, op.y, 8, [Color("ffd23f"), Color.WHITE], 150)
				synth.ring(bits)
			else:
				o.z = 9.9
				score += 15
				_popup(op.x, op.y - 30, "POP! +15", Color("ff9ccf"))
				_burst(op.x, op.y, 18, [Color("ff9ccf"), Color.WHITE], 190)
				synth.poof()
	tobs = tobs.filter(func(o): return o.z <= 1.2)
	# Powered aura sparkles.
	if randf() < 0.5:
		var p := Particle.new()
		p.x = uni.x + randf_range(-22, 22)
		p.y = uni.y + randf_range(-18, 18)
		p.vx = randf_range(-25, 25)
		p.vy = randf_range(-40, -10)
		p.life = 0.5
		p.max_life = 0.5
		p.r = randf_range(2, 4)
		p.c = RAINBOW[int(t * 10) % 6]
		p.star = true
		particles.append(p)
	if fall_d >= TUNNEL_H:
		_splash_lagoon()


func _tobs_pos(o) -> Vector2:
	var cen := Vector2(W / 2, H * 0.46)
	var r: float = 30.0 + o.z * 250.0
	return cen + Vector2(cos(o.ang), sin(o.ang)) * r


func _splash_lagoon() -> void:
	splashed = true
	tobs = []
	uni.x = LAG_W * 0.3
	uni.y = LAG_H * 0.5
	uni.vx = 0.0; uni.vy = 0.0
	_o_face = Vector2.RIGHT
	cam_x = clampf(uni.x - W * 0.42, 0.0, LAG_W - W)
	cam_y = clampf(uni.y - H * 0.5, 0.0, LAG_H - H)
	flash = maxf(flash, 0.35)
	_popup(uni.x + 200, uni.y - 80, "Water World! 🫧", Color("bfe9ff"))
	_burst(uni.x, uni.y, 36, [Color.WHITE, Color("bfe9ff"), Color("7df0c8")], 260)
	synth.poof()
	synth.powerup()


# Phase 2: the lagoon from above. Pearls to gather, the herd bobbing, and a
# whirlpool that spirals down into the underworld.
func _lagoon_over(dt: float) -> void:
	if state != "play":
		return
	_over_swim(dt, LAG_W, LAG_H)
	for i in 10:
		var bp := Vector2(140.0 + _hash01(i * 13 + 5) * (LAG_W - 280.0), 140.0 + _hash01(i * 29 + 3) * (LAG_H - 280.0))
		if not _bit_taken.has("L:%d" % i) and Vector2(uni.x - bp.x, uni.y - bp.y).length() < 36:
			_bit_taken["L:%d" % i] = t
			bits += 1
			score += 5
			_burst(bp.x, bp.y, 8, [Color("ffd23f"), Color.WHITE], 150)
			synth.ring(bits)
	var whirl := Vector2(LAG_W * 0.68, LAG_H * 0.52)
	var wd: float = Vector2(uni.x - whirl.x, uni.y - whirl.y).length()
	if wd < 64.0:
		_enter_under()
		return
	if wd < 420.0 and not _crack_hint:
		_crack_hint = true
		_popup(whirl.x, whirl.y - 90, "Something swirls below… 👽", Color("9df08a"))


func _pod_shield(pd) -> bool:
	# The shield flickers off on a rhythm — zap while it's down.
	return fmod(t + float(pd.phase) * 2.0, 6.5) < 3.8


func _enter_under() -> void:
	under = true
	pods = []
	tadpoles = []
	goo_bits = []
	wzaps = []
	_under_won = false
	_stun_t = 0.0
	for i in POD_N:
		var px := 700.0 + i * ((UW - 1400.0) / (POD_N - 1)) + _hash01(i * 91 + 7) * 140.0 - 70.0
		var py := 150.0 + _hash01(i * 37 + 5) * (UH2 - 300.0)
		pods.append({ "x": px, "y": py, "hp": POD_HP, "alive": true, "hit": 0.0, "spawn_cd": 1.5 + _hash01(i * 3) * 3.0, "phase": randf() * TAU })
	pods_left = POD_N
	umer = null
	uni.x = 420.0
	uni.y = UH2 * 0.5
	uni.vx = 0.0; uni.vy = 0.0
	_o_face = Vector2.RIGHT
	cam_x = 0.0
	cam_y = clampf(uni.y - H * 0.5, 0.0, UH2 - H)
	flash = maxf(flash, 0.35)
	_popup(uni.x + 260, uni.y - 60, "The Alien Underworld! 👽", Color("9df08a"))
	_popup(uni.x + 260, uni.y - 24, "Smash every capsule!", Color("bfe9ff"))
	_burst(uni.x, uni.y, 40, [Color("9df08a"), Color("b77bff"), Color.WHITE], 300)
	synth.level_up()


func _under_exit() -> void:
	under = false
	splashed = true
	tadpoles = []
	umer = null
	uni.x = LAG_W * 0.68 - 180.0
	uni.y = LAG_H * 0.52
	uni.vx = -120.0; uni.vy = 0.0
	flash = maxf(flash, 0.3)
	_popup(uni.x, uni.y - 70, "Back to the lagoon! 🫧", Color("bfe9ff"))
	synth.poof()


func _pop_pod(pd) -> void:
	pd.alive = false
	pods_left -= 1
	score += 100
	_popup(pd.x, pd.y - 60, "SMASH! +100", Color("9df08a"))
	_burst(pd.x, pd.y, 40, [Color("9df08a"), Color("b77bff"), Color.WHITE], 300)
	for i in 4:
		goo_bits.append({ "x": pd.x + randf_range(-50, 50), "y": pd.y + randf_range(-40, 40), "taken": false, "phase": randf() * TAU })
	synth.poof()
	synth.gold()


func _under_swim(dt: float) -> void:
	if state != "play":
		return
	_over_swim(dt, UW, UH2)
	# The west portal rides back up to the lagoon.
	if Vector2(uni.x - 130.0, uni.y - UH2 * 0.5).length() < 56.0:
		_under_exit()
		return
	# Zap: same button / R key; auto-aims at the nearest capsule in range.
	_w_fire_cd = maxf(0.0, _w_fire_cd - dt)
	if Input.is_action_just_pressed("rockets") or _w_zap:
		_w_zap = false
		if _w_fire_cd <= 0:
			_w_fire_cd = 0.22
			var aim := _o_face
			var best := 520.0
			for pd in pods:
				if not pd.alive:
					continue
				var dv := Vector2(pd.x - uni.x, pd.y - uni.y)
				if dv.length() > 1.0 and dv.length() < best:
					best = dv.length()
					aim = dv.normalized()
			wzaps.append({ "x": uni.x + aim.x * 30, "y": uni.y + aim.y * 30, "dir": aim.x, "dy": aim.y, "life": 0.9, "dead": false })
			synth.zap()
	# Zaps fly; they clip pods only while a shield is flickered off.
	for z in wzaps:
		if z.dead:
			continue
		z.x += z.dir * 760 * dt
		z.y += z.dy * 760 * dt
		z.life -= dt
		if z.life <= 0:
			z.dead = true
		for pd in pods:
			if z.dead or not pd.alive:
				continue
			if Vector2(z.x - pd.x, z.y - pd.y).length() < 46:
				z.dead = true
				if _pod_shield(pd):
					_burst(z.x, z.y, 5, [Color("9adcff"), Color.WHITE], 110)
					synth.ring(1)
				else:
					pd.hp -= 1
					pd.hit = 0.12
					_burst(z.x, z.y, 6, [Color("9df08a"), Color.WHITE], 140)
					synth.zap()
					if pd.hp <= 0:
						_pop_pod(pd)
		for td in tadpoles:
			if z.dead or not td.alive:
				continue
			if Vector2(z.x - td.x, z.y - td.y).length() < 34:
				z.dead = true
				td.hp -= 1
				td.hit = 0.12
				_burst(td.x, td.y, 6, [Color("b77bff"), Color.WHITE], 130)
				synth.zap()
				if td.hp <= 0:
					td.alive = false
					score += 20
					_popup(td.x, td.y - 30, "+20", Color("ffd23f"))
					_burst(td.x, td.y, 16, [Color("b77bff"), Color("9df08a"), Color.WHITE], 200)
					synth.poof()
	wzaps = wzaps.filter(func(z): return not z.dead)
	# Pods wake near her and spit tadpole guards on a cooldown.
	for pd in pods:
		if not pd.alive:
			continue
		pd.hit = maxf(0.0, pd.hit - dt)
		var near: bool = Vector2(uni.x - pd.x, uni.y - pd.y).length() < 560.0
		if near:
			pd.spawn_cd -= dt
			var mine := 0
			for td in tadpoles:
				if td.alive and td.pod == pd:
					mine += 1
			if pd.spawn_cd <= 0 and mine < 2:
				pd.spawn_cd = 5.0
				tadpoles.append({ "x": pd.x, "y": pd.y, "vx": 0.0, "vy": 0.0, "hp": 3, "hit": 0.0, "alive": true, "pod": pd, "phase": randf() * TAU })
				_burst(pd.x, pd.y, 8, [Color("9df08a"), Color.WHITE], 120)
				synth.poof()
	# Tadpoles chase lazily; a bump shoves her but never ends the run.
	for td in tadpoles:
		if not td.alive:
			continue
		td.hit = maxf(0.0, td.hit - dt)
		var to := Vector2(uni.x - td.x, uni.y - td.y)
		if to.length() > 1.0:
			to = to.normalized()
			td.vx += to.x * 300.0 * dt
			td.vy += to.y * 300.0 * dt
		td.vx += sin(t * 3.0 + td.phase) * 60.0 * dt
		td.vy += cos(t * 2.4 + td.phase) * 60.0 * dt
		var tspd := Vector2(td.vx, td.vy).length()
		if tspd > 145.0:
			td.vx *= 145.0 / tspd
			td.vy *= 145.0 / tspd
		td.x += td.vx * dt
		td.y += td.vy * dt
		if _stun_t <= 0 and Vector2(uni.x - td.x, uni.y - td.y).length() < 40:
			_stun_t = 0.5
			var away := Vector2(uni.x - td.x, uni.y - td.y).normalized()
			uni.vx = away.x * 320.0
			uni.vy = away.y * 320.0
			td.vx = -away.x * 200.0
			td.vy = -away.y * 200.0
			_popup(uni.x, uni.y - 50, "Ouch!", Color("ff9ccf"))
			_burst(uni.x, uni.y, 10, [Color.WHITE, Color("ff9ccf")], 160)
			synth.poof()
	tadpoles = tadpoles.filter(func(td): return td.alive)
	# Star-bit goo left behind by popped pods.
	for g in goo_bits:
		g.y += sin(t * 2.2 + g.phase) * 8.0 * dt
		if not g.taken and Vector2(uni.x - g.x, uni.y - g.y).length() < 34:
			g.taken = true
			bits += 1
			score += 5
			_burst(g.x, g.y, 8, [Color("ffd23f"), Color.WHITE], 150)
			synth.ring(bits)
	goo_bits = goo_bits.filter(func(g): return not g.taken)
	# The mermaid companion (TODO(IAP): only once purchased) tails her and
	# zaps tadpole guards — this chapter is where she earns her $5.
	if MERMAID_OWNED:
		if umer == null:
			umer = { "x": uni.x - 90.0, "y": uni.y + 50.0, "cd": 2.0 }
		umer.x += (uni.x - _w_face * 84.0 - umer.x) * minf(1.0, dt * 2.2)
		umer.y += (uni.y + 44.0 - umer.y) * minf(1.0, dt * 2.2)
		umer.cd -= dt
		if umer.cd <= 0:
			var tgt = null
			var bd := 300.0
			for td in tadpoles:
				if td.alive:
					var dd: float = Vector2(td.x - umer.x, td.y - umer.y).length()
					if dd < bd:
						bd = dd
						tgt = td
			if tgt != null:
				umer.cd = 3.0
				arcs.append({ "ax": umer.x, "ay": umer.y, "bx": tgt.x, "by": tgt.y, "life": 0.22, "max": 0.22 })
				tgt.hp -= 1
				tgt.hit = 0.12
				synth.zap()
				if tgt.hp <= 0:
					tgt.alive = false
					score += 20
					_burst(tgt.x, tgt.y, 16, [Color("7df0c8"), Color.WHITE], 200)
			else:
				umer.cd = 0.5
	# Every capsule gone: fireworks, and the cavern stays open to roam.
	if pods_left <= 0 and not _under_won:
		_under_won = true
		score += 500
		_popup(uni.x, uni.y - 90, "ALL CAPSULES SMASHED! 🎉", Color("ffd23f"))
		_popup(uni.x, uni.y - 50, "+500  The Underworld is free!", Color("9df08a"))
		_burst(uni.x, uni.y, 60, RAINBOW, 380)
		synth.powerup()
		synth.level_up()
	if _under_won and randf() < dt * 1.5:
		_burst(cam_x + randf_range(100, W - 100), cam_y + randf_range(80, H - 120), 24, RAINBOW, 260)
	# Out the east gate: the current carries her to chapter 5's open water.
	if _under_won and ch5_pending <= 0 and Vector2(uni.x - (UW - 190.0), uni.y - UH2 * 0.5).length() < 60.0:
		ch5_pending = 1.6
		score += 50
		_popup(uni.x, uni.y - 80, "CHAPTER 5! 🌊", Color("7df0ff"))
		_popup(uni.x, uni.y - 118, "Out to the open water!", Color("bfe9ff"))
		_burst(uni.x, uni.y, 40, RAINBOW, 280)
		synth.level_up()
	# Ambient bubbles rising through the cavern.
	if randf() < 0.3:
		var p := Particle.new()
		p.x = cam_x + randf_range(0, W)
		p.y = cam_y + H + 10
		p.vx = randf_range(-8, 8)
		p.vy = randf_range(-70, -40)
		p.life = 2.2
		p.max_life = 2.2
		p.r = randf_range(2, 4)
		p.c = Color(0.7, 0.95, 1, 0.5)
		particles.append(p)


func _wonder_top(dt: float) -> void:
	if state != "play":
		return
	var walk := Vector2.ZERO
	if Input.is_action_pressed("fly_left"):
		walk.x -= 1.0
	if Input.is_action_pressed("fly_right"):
		walk.x += 1.0
	if Input.is_action_pressed("fly_up"):
		walk.y -= 1.0
	if Input.is_action_pressed("fly_down"):
		walk.y += 1.0
	if pointer_down and _walk_touch.x >= 0:
		var d := _walk_touch - Vector2(uni.x, uni.y)
		if d.length() > 24:
			walk = d.normalized()
	uni.vx += walk.x * 1400.0 * dt
	uni.vy += walk.y * 1400.0 * dt
	if walk.x == 0:
		uni.vx *= pow(0.001, dt)
	if walk.y == 0:
		uni.vy *= pow(0.001, dt)
	uni.vx = clampf(uni.vx, -260, 260)
	uni.vy = clampf(uni.vy, -260, 260)
	uni.x = wrapf(uni.x + uni.vx * dt, 20, VW - 20)
	uni.y = wrapf(uni.y + uni.vy * dt, 40, VH - 40)
	uni.tilt += (clampf(uni.vx / 800.0, -0.35, 0.35) - uni.tilt) * minf(1, dt * 8)
	uni.flap += dt * 10.0
	# Meadow bits on a hashed grid; same touch-collect rule.
	var ci := int(floor(-80.0 / WCELL))
	while ci * WCELL < VW + 100:
		var cj := int(floor(-80.0 / WCELL))
		while cj * WCELL < VH + 100:
			if _hash01(ci * 31 + cj * 7) < 0.55:
				var bx := ci * WCELL + 30 + _hash01(ci * 17 + cj * 13) * (WCELL - 60)
				var by := cj * WCELL + 30 + _hash01(ci * 23 + cj * 5) * (WCELL - 60)
				by += sin(t * 2.5 + ci + cj) * 5
				if Vector2(uni.x - bx, uni.y - by).length() < 36:
					var key := "T:%d:%d" % [ci, cj]
					if not _bit_taken.has(key):
						_bit_taken[key] = t
						bits += 1
						score += 5
						_burst(bx, by, 8, [Color("ffd23f"), Color.WHITE], 160)
						synth.ring(bits)
			cj += 1
		ci += 1
	if _bit_taken.size() > 80:
		for k in _bit_taken.keys():
			if t - _bit_taken[k] > 6.0:
				_bit_taken.erase(k)
	if randf() < 0.4:
		var p := Particle.new()
		p.x = uni.x + randf_range(-20, 20)
		p.y = uni.y + randf_range(-16, 16)
		p.vx = randf_range(-20, 20)
		p.vy = randf_range(-30, -8)
		p.life = 0.5
		p.max_life = 0.5
		p.r = randf_range(2, 4)
		p.c = RAINBOW[int(t * 10) % 6]
		p.star = true
		particles.append(p)


func _draw_wonder() -> void:
	if vertical:
		# Overhead meadow: scattered flowers over the quilt.
		for i in 14:
			var fx := _hash01(i * 41 + 3) * VW
			var fy := _hash01(i * 29 + 11) * VH
			var fcol: Color = [Color("ff9ccf"), Color("fff4b0"), Color(1, 1, 1), Color("bfe9ff")][i % 4]
			for pi in 5:
				var pa := pi * TAU / 5 + i
				draw_circle(Vector2(fx + cos(pa) * 4, fy + sin(pa) * 4), 2.4, fcol)
			draw_circle(Vector2(fx, fy), 2, Color("ffd23f"))
		# Bits grid.
		var ci := int(floor(-80.0 / WCELL))
		while ci * WCELL < VW + 100:
			var cj := int(floor(-80.0 / WCELL))
			while cj * WCELL < VH + 100:
				if _hash01(ci * 31 + cj * 7) < 0.55:
					var bx := ci * WCELL + 30 + _hash01(ci * 17 + cj * 13) * (WCELL - 60)
					var by := cj * WCELL + 30 + _hash01(ci * 23 + cj * 5) * (WCELL - 60) + sin(t * 2.5 + ci + cj) * 5
					if not _bit_taken.has("T:%d:%d" % [ci, cj]):
						_bit_star(Vector2(bx, by))
				cj += 1
			ci += 1
		return
	if ch6:
		_draw_ch6()
		return
	if ch5:
		_draw_ch5()
		return
	if ch3:
		_draw_ch3()
		return
	# Side view: solid ground, markers, drone, cloud platforms, star bits,
	# and her zap bolts — all world coords; the camera transform is on.
	_draw_solid_ground()
	_draw_wonder_markers()
	if drone != null and drone.alive:
		_draw_drone()
	for c in _wonder_cols():
		var L := _wonder_col(c)
		var px := Vector2(c * WCOL, L[0])
		var hw: float = L[1] * 0.5
		_fill_ellipse(px + Vector2(0, 8), hw, 17, Color(0.82, 0.82, 0.96, 0.5))
		draw_rect(Rect2(px.x - hw, px.y - 12, L[1], 16), Color(0.97, 0.97, 1))
		draw_circle(px + Vector2(-hw + 10, -8), 13, Color(0.97, 0.97, 1))
		draw_circle(px + Vector2(0, -14), 15, Color(0.97, 0.97, 1))
		draw_circle(px + Vector2(hw - 12, -7), 12, Color(0.97, 0.97, 1))
		draw_rect(Rect2(px.x - hw, px.y + 2, L[1], 4), Color(0.75, 0.78, 0.94, 0.8))
		if L[2]:
			draw_polyline(_arc_pts(px.x, px.y - 10, hw + 6, 16, PI * 1.1, PI * 1.9, 16), RAINBOW[int(t * 6) % 6], 3, true)
		for bi in L[3]:
			if not _bit_taken.has("%d:%d" % [c, bi]):
				_bit_star(_wonder_bit_pos(c, bi))
	_draw_wzaps()


func _draw_wzaps() -> void:
	for z in wzaps:
		var zglow := Color(1, 0.6, 0.85, 0.4)
		var zback := Vector2(z.dir, z.dy).normalized() * 26.0
		draw_line(Vector2(z.x, z.y) - zback, Vector2(z.x, z.y), zglow, 6, true)
		draw_line(Vector2(z.x, z.y) - zback * 0.62, Vector2(z.x, z.y), Color.WHITE, 2.5, true)
		draw_circle(Vector2(z.x, z.y), 3, Color("ffd9ef"))


func _draw_wonder_markers() -> void:
	var gy := H - 60.0
	# START sign at the west end.
	var sx := 96.0
	draw_rect(Rect2(sx - 4, gy - 62, 8, 62), Color("6b4a35"))
	draw_rect(Rect2(sx - 42, gy - 92, 84, 32), Color("8a5f3d"))
	draw_rect(Rect2(sx - 42, gy - 92, 84, 32), Color("5d3f26"), false, 2)
	_text_c(Vector2(sx, gy - 70), "START", 16, Color("fff4b0"))
	# Rainbow FINISH flag at the east end.
	var fx := WCOLS * WCOL - 140.0
	draw_rect(Rect2(fx - 3, gy - 126, 6, 126), Color("8a5f3d"))
	for i in 6:
		var wave := sin(t * 5.0 + i * 0.8) * 2.0
		draw_colored_polygon(PackedVector2Array([Vector2(fx + 3, gy - 124 + i * 7), Vector2(fx + 54 - i * 3, gy - 120 + i * 7 + wave), Vector2(fx + 3, gy - 117 + i * 7)]), RAINBOW[i])
	draw_colored_polygon(_sparkle_poly(fx, gy - 136, 11), Color("ffd23f"))
	_text_c(Vector2(fx + 34, gy - 98), "FINISH", 14, Color.WHITE)


func _draw_drone(d = null) -> void:
	# The practice target: a cute mini-saucer with a bullseye.
	if d == null:
		d = drone
	var p := Vector2(d.x, d.y)
	var flash: bool = d.hit > 0
	_fill_ellipse(p + Vector2(0, 30), 28, 7, Color(0.4, 0.3, 0.6, 0.25))
	draw_circle(p + Vector2(0, -14), 12, Color.WHITE if flash else Color("d9dce8"))
	draw_arc(p + Vector2(0, -14), 12, PI * 1.1, PI * 1.6, 10, Color(1, 1, 1, 0.7), 2.5, true)
	_fill_ellipse(p, 34, 15, Color.WHITE if flash else Color("9aa0c0"))
	_fill_ellipse(p + Vector2(0, 5), 30, 9, Color("6f6a92", 0.8))
	draw_polyline(_arc_pts(p.x, p.y, 34, 15, 0, TAU, 28), Color("5d5880"), 2.5, true)
	draw_circle(p, 9, Color("ff4d5e"))
	draw_circle(p, 5.5, Color.WHITE)
	draw_circle(p, 2.5, Color("ff4d5e"))
	var bl := 0.4 + 0.6 * (0.5 + 0.5 * sin(t * 4))
	draw_line(p + Vector2(0, -24), p + Vector2(0, -30), Color("5d5880"), 2, true)
	draw_circle(p + Vector2(0, -32), 3, Color(1, 0.85, 0.3, bl))


func _draw_tunnel_bg() -> void:
	# Screen space: the shaft darkens with depth, and the lagoon glows
	# up from below once the bottom is near.
	var depth := clampf(fall_d / TUNNEL_H, 0.0, 1.0)
	var bands := 10
	for i in bands:
		var k0 := float(i) / bands
		var k1 := float(i + 1) / bands
		var shade := clampf(depth * 1.15 + k0 * 0.1, 0.0, 1.0)
		var col := Color("3a2a5e").lerp(Color("0a1430"), shade)
		draw_rect(Rect2(0, VH * k0, VW, VH * (k1 - k0) + 1), col)
	var glow := clampf((fall_d - (TUNNEL_H - 800.0)) / 800.0, 0.0, 1.0)
	if glow > 0:
		draw_texture_rect(_radial_glow_tex(Color(0.3, 0.7, 1, 0.5 * glow), Color(0.2, 0.5, 0.9, 0)), Rect2(VW * 0.5 - VW * 0.8, VH - VH * 0.5 * glow, VW * 1.6, VH * 0.7), false)


func _draw_under_bg() -> void:
	# Screen space: deep violet hush with a slow alien glow at the heart.
	var bands := 10
	for i in bands:
		var k0 := float(i) / bands
		var k1 := float(i + 1) / bands
		draw_rect(Rect2(0, VH * k0, VW, VH * (k1 - k0) + 1), Color("1a0f38").lerp(Color("071022"), k0))
	var pulse := 0.5 + 0.5 * sin(t * 0.8)
	draw_texture_rect(_radial_glow_tex(Color(0.35, 1, 0.55, 0.10 + 0.06 * pulse), Color(0, 0.4, 0.2, 0)), Rect2(VW * 0.2, VH * 0.1, VW * 0.6, VH * 0.8), false)


func _draw_under() -> void:
	# World space (camera transform on): walls ringing the cavern, floor
	# dressing, portal, goo bits, pods, tadpoles, companion, bolts.
	var cx0 := cam_x - 80.0
	var cx1 := cam_x + W + 80.0
	var cy0 := cam_y - 80.0
	var cy1 := cam_y + H + 80.0
	# Rocky walls ringing the world.
	draw_rect(Rect2(cx0, -90, cx1 - cx0, 90), Color("2a1b52"))
	draw_rect(Rect2(cx0, UH2, cx1 - cx0, 90), Color("2a1b52"))
	draw_rect(Rect2(-90, cy0, 90, cy1 - cy0), Color("2a1b52"))
	draw_rect(Rect2(UW, cy0, 90, cy1 - cy0), Color("2a1b52"))
	draw_rect(Rect2(cx0, -90, cx1 - cx0, 10), Color("4a3578"))
	draw_rect(Rect2(cx0, UH2, cx1 - cx0, 10), Color("4a3578"))
	draw_rect(Rect2(-90, cy0, 10, cy1 - cy0), Color("4a3578"))
	draw_rect(Rect2(UW, cy0, 10, cy1 - cy0), Color("4a3578"))
	# Hashed veins, glow pockets, crystal clusters, spores across the floor.
	var c0 := int(floor(cx0 / 140.0))
	var c1 := int(ceil(cx1 / 140.0))
	for c in range(c0, c1 + 1):
		var gcol: Color = [Color("9df08a"), Color("b77bff"), Color("7df0ff")][c % 3]
		var gx := c * 140.0 + _hash01(c * 7 + 1) * 60.0
		if _hash01(c * 31 + 9) < 0.55:
			var vy := 120.0 + _hash01(c * 37 + 4) * (UH2 - 240.0)
			var vpts := PackedVector2Array()
			for k in 6:
				vpts.append(Vector2(c * 140.0 + k * 28.0, vy + sin(t * 0.9 + c + k) * 10.0))
			draw_polyline(vpts, Color(gcol.r, gcol.g, gcol.b, 0.14 + 0.08 * sin(t * 1.3 + c)), 2.5, true)
		if _hash01(c * 41 + 6) < 0.4:
			var pk := Vector2(c * 140.0 + 70.0, 100.0 + _hash01(c * 43 + 8) * (UH2 - 200.0))
			draw_texture_rect(_radial_glow_tex(Color(gcol.r, gcol.g, gcol.b, 0.10), Color(0, 0, 0, 0)), Rect2(pk.x - 90, pk.y - 90, 180, 180), false)
		if _hash01(c * 13 + 2) < 0.45:
			# Crystal cluster from above: shards leaning out of a hub.
			var cp := Vector2(gx, 90.0 + _hash01(c * 17 + 3) * (UH2 - 180.0))
			var glow := 0.6 + 0.4 * sin(t * 2.0 + c)
			for s in 3:
				var sa := _hash01(c * 19 + s) * TAU
				var tip := cp + Vector2(cos(sa), sin(sa)) * (12.0 + _hash01(c * 23 + s) * 14.0)
				draw_line(cp, tip, Color(gcol.r, gcol.g, gcol.b, 0.5 + 0.3 * glow), 5, true)
			draw_circle(cp, 4, Color(gcol.r, gcol.g, gcol.b, 0.8))
		if _hash01(c * 23 + 5) < 0.6:
			var ey := 90.0 + _hash01(c * 29 + 7) * (UH2 - 180.0)
			for s in 3:
				draw_circle(Vector2(gx + 40 + s * 9, ey + sin(t + c + s) * 14.0), 2.2 + s * 0.5, Color(0.6, 1, 0.7, 0.35))
	# The ride home: portal back up to the lagoon at the west end.
	var port := Vector2(130.0, UH2 * 0.5)
	var pp := 1.0 + 0.12 * sin(t * 3.0)
	draw_texture_rect(_radial_glow_tex(Color(0.5, 0.85, 1, 0.5), Color(0.2, 0.5, 1, 0)), Rect2(port.x - 70 * pp, port.y - 70 * pp, 140 * pp, 140 * pp), false)
	draw_arc(port, 34 * pp, 0, TAU, 40, Color("bfe9ff"), 4, true)
	draw_arc(port, 24 * pp, t, t + PI * 1.4, 32, Color.WHITE, 3, true)
	_text_c(port + Vector2(0, -52), "LAGOON", 13, Color("bfe9ff"))
	# Chapter 5 gate: a bright current tearing open the east wall once won.
	if _under_won:
		var gate := Vector2(UW - 190.0, UH2 * 0.5)
		var gp := 1.0 + 0.15 * sin(t * 4.0)
		draw_texture_rect(_radial_glow_tex(Color(0.3, 0.9, 1, 0.5), Color(0.1, 0.4, 0.9, 0)), Rect2(gate.x - 80 * gp, gate.y - 80 * gp, 160 * gp, 160 * gp), false)
		draw_arc(gate, 36 * gp, 0, TAU, 40, Color("7df0ff"), 4, true)
		draw_arc(gate, 26 * gp, t * 2.0, t * 2.0 + PI * 1.4, 32, Color.WHITE, 3, true)
		_text_c(gate + Vector2(0, -56), "CHAPTER 5 🌊", 13, Color("7df0ff"))
	for g in goo_bits:
		_bit_star(Vector2(g.x, g.y))
	for pd in pods:
		if pd.alive:
			_draw_pod(pd)
	for td in tadpoles:
		if td.alive:
			_draw_tadpole(td)
	if MERMAID_OWNED and umer != null:
		var keep := Vector2(mer_px, mer_py)
		mer_px = umer.x
		mer_py = umer.y
		_draw_mermaid()
		mer_px = keep.x
		mer_py = keep.y
	_draw_wzaps()


func _draw_pod(pd) -> void:
	# A hive capsule from above: membrane ring, glass dome, sleeping alien,
	# nourishment veins, shield hex.
	var p := Vector2(pd.x, pd.y)
	var pulse := 0.5 + 0.5 * sin(t * 2.6 + float(pd.phase))
	var near: bool = Vector2(uni.x - pd.x, uni.y - pd.y).length() < 560.0
	if near:
		draw_texture_rect(_radial_glow_tex(Color(0.55, 1, 0.5, 0.35 + 0.15 * pulse), Color(0.2, 0.7, 0.3, 0)), Rect2(p.x - 90, p.y - 90, 180, 180), false)
	draw_circle(p + Vector2(4, 6), 46, Color(0, 0, 0, 0.25))
	draw_circle(p, 46, Color("3d6b33"))
	draw_circle(p, 40, Color.WHITE if pd.hit > 0 else Color("6fae4e"))
	draw_circle(p, 30, Color(0.75, 1, 0.9, 0.45))
	draw_arc(p + Vector2(-8, -8), 18, PI, PI * 1.5, 12, Color(1, 1, 1, 0.6), 3, true)
	var squirm := sin(t * 3.0 + float(pd.phase)) * 2.0
	draw_circle(p + Vector2(squirm, 0), 14, Color("2a1650"))
	draw_circle(p + Vector2(-5.5 + squirm, -4), 3.6, Color("9df08a"))
	draw_circle(p + Vector2(5.5 + squirm, -4), 3.6, Color("9df08a"))
	draw_arc(p + Vector2(squirm, 3), 5, PI * 0.15, PI * 0.85, 10, Color("9df08a"), 1.8, true)
	# Nourishment veins creeping across the cavern floor.
	for v in 3:
		var va := _hash01(int(pd.phase * 100.0) + v * 7) * TAU
		draw_polyline(_quad_pts(p + Vector2(cos(va), sin(va)) * 40, p + Vector2(cos(va), sin(va)) * 62 + Vector2(6, 0), p + Vector2(cos(va + 0.5), sin(va + 0.5)) * 84), Color("3d6b33"), 5, true)
	if _pod_shield(pd):
		var hex := PackedVector2Array()
		for i in 6:
			var a := i * TAU / 6 + t * 0.7
			hex.append(p + Vector2(cos(a), sin(a)) * 62.0)
		hex.append(hex[0])
		draw_polyline(hex, Color(0.6, 0.9, 1, 0.5 + 0.3 * pulse), 3, true)
		draw_polyline(hex, Color(1, 1, 1, 0.25), 1.5, true)
	else:
		draw_colored_polygon(_sparkle_poly(p.x, p.y - 64, 8 + 3 * pulse), Color("ffd23f"))
	# HP pips in a little arc under the pod.
	for i in POD_HP:
		if i < pd.hp:
			var pa := PI * 0.25 + i * (PI * 0.5) / (POD_HP - 1)
			draw_circle(p + Vector2(cos(pa), sin(pa)) * 56.0, 2.6, Color("9df08a"))


func _draw_tadpole(td) -> void:
	# A one-eyed tadpole guard, wobbling after her.
	var p := Vector2(td.x, td.y)
	var wob := sin(t * 6.0 + float(td.phase)) * 3.0
	draw_polyline(_quad_pts(p + Vector2(-14, 0), p + Vector2(-24, wob), p + Vector2(-32, -wob)), Color("6a3fb0"), 5, true)
	draw_circle(p, 13, Color.WHITE if td.hit > 0 else Color("8a5fd6"))
	draw_circle(p + Vector2(0, -4), 9, Color("a883f0"))
	draw_circle(p + Vector2(4, -3), 4.6, Color.WHITE)
	draw_circle(p + Vector2(5.5, -3), 2.4, Color("2a1650"))
	draw_arc(p + Vector2(2, 5), 4, PI * 0.2, PI * 0.8, 8, Color("2a1650"), 1.6, true)


func _draw_ch3() -> void:
	if under:
		_draw_under()
	elif splashed:
		_draw_lagoon_over()
	else:
		_draw_fall_over()


func _draw_fall_over() -> void:
	# World space: the shaft from directly above — rock rings rush outward
	# as she falls; obstacles grow from far specks to rim-sized.
	var cen := Vector2(W / 2, H * 0.46)
	for i in 14:
		var z := fmod(fall_d * 0.0016 + float(i) / 14.0, 1.0)
		var r := 30.0 + z * 250.0
		var w := 5.0 + z * 24.0
		var shade := Color("4a3f6e").lerp(Color("171232"), z * 0.8)
		draw_arc(cen, r, 0, TAU, 64, shade, w, true)
		for b in 3:
			var ba := _hash01(i * 17 + b * 31) * TAU
			draw_circle(cen + Vector2(cos(ba), sin(ba)) * r, (3.0 + _hash01(i * 7 + b) * 7.0) * (0.3 + z), shade.lightened(0.18))
	# The shaft rim she fell in through.
	draw_arc(cen, 284, 0, TAU, 72, Color("5d5680"), 16, true)
	draw_arc(cen, 296, 0, TAU, 72, Color("8b86a8"), 4, true)
	for o in tobs:
		var op := _tobs_pos(o)
		if o.kind == "rock":
			var rr: float = 20.0 * o.z + 6.0
			var rp := PackedVector2Array()
			for k in 7:
				var ka: float = k * TAU / 7 + o.ang
				var kr: float = rr * (0.75 + _hash01(k * 13 + int(o.ang * 100.0)) * 0.5)
				rp.append(op + Vector2(cos(ka), sin(ka)) * kr)
			draw_colored_polygon(rp, Color("6a6488"))
			rp.append(rp[0])
			draw_polyline(rp, Color("3d3854"), 2, true)
		elif o.kind == "bit":
			var tw: float = 0.5 + 0.5 * o.z
			draw_colored_polygon(_sparkle_poly(op.x, op.y, (5.0 + 8.0 * o.z) * tw), Color("ffd23f"))
			draw_circle(op, 2.0 * o.z + 1.0, Color.WHITE)
		else:
			draw_line(op + Vector2(0, 10 * o.z), op + Vector2(0, 24 * o.z + 8), Color(1, 1, 1, 0.5), 1.5)
			draw_circle(op, 6.0 + 12.0 * o.z, Color("ff6fb5"))
			draw_circle(op + Vector2(-2, -2) * o.z, 2.5 + 2.0 * o.z, Color(1, 1, 1, 0.5))
	# Depth readout for mom and dad.
	_text_c(Vector2(W / 2, H - 26), "▼ %d m to the water" % int(maxf(0.0, TUNNEL_H - fall_d) / 100.0), 16, Color("bfe9ff"))


func _draw_lagoon_over() -> void:
	# World space (camera on): sandy rim, seaweed shadows, sun ripples,
	# pearls, the herd bobbing, the whirlpool down to the underworld.
	var cx0 := cam_x - 80.0
	var cx1 := cam_x + W + 80.0
	var cy0 := cam_y - 80.0
	var cy1 := cam_y + H + 80.0
	# Sandy shore ringing the lagoon.
	draw_rect(Rect2(cx0, -70, cx1 - cx0, 70), Color("d9c48f"))
	draw_rect(Rect2(cx0, LAG_H, cx1 - cx0, 70), Color("d9c48f"))
	draw_rect(Rect2(-70, cy0, 70, cy1 - cy0), Color("d9c48f"))
	draw_rect(Rect2(LAG_W, cy0, 70, cy1 - cy0), Color("d9c48f"))
	draw_rect(Rect2(cx0, -70, cx1 - cx0, 8), Color("efe0b0"))
	draw_rect(Rect2(cx0, LAG_H, cx1 - cx0, 8), Color("efe0b0"))
	draw_rect(Rect2(-70, cy0, 8, cy1 - cy0), Color("efe0b0"))
	draw_rect(Rect2(LAG_W, cy0, 8, cy1 - cy0), Color("efe0b0"))
	# Seaweed shadows drifting under the surface.
	for i in 10:
		var sx := 90.0 + _hash01(i * 31) * (LAG_W - 180.0)
		var sy := 90.0 + _hash01(i * 17) * (LAG_H - 180.0)
		var sway := sin(t * 1.4 + i) * 0.15
		for k in 3:
			var ka := k * TAU / 3 + i + sway
			draw_line(Vector2(sx, sy), Vector2(sx + cos(ka) * 26, sy + sin(ka) * 26), Color(0.05, 0.3, 0.35, 0.25), 7, true)
	# Sun-shimmer ripples.
	for i in 8:
		var rp2 := Vector2(_hash01(i * 11 + 1) * LAG_W, _hash01(i * 23 + 2) * LAG_H)
		var rr := 20.0 + fmod(t * 26.0 + i * 40.0, 110.0)
		draw_arc(rp2, rr, 0, TAU, 32, Color(1, 1, 1, 0.10 * (1.0 - rr / 130.0)), 2, true)
	# Pearls.
	for i in 10:
		if not _bit_taken.has("L:%d" % i):
			_bit_star(Vector2(140.0 + _hash01(i * 13 + 5) * (LAG_W - 280.0), 140.0 + _hash01(i * 29 + 3) * (LAG_H - 280.0)))
	# The herd bobbing in the shallows, seen from above.
	var herd := [Color("ff9ccf"), Color("a8e6cf"), Color("c5b3f0"), Color("ffd3a0"), Color("9fd8ff"), Color("fff4b0")]
	for i in 6:
		var hx := 200.0 + _hash01(i * 13 + 1) * (LAG_W - 400.0)
		var hy := 180.0 + _hash01(i * 7 + 2) * (LAG_H - 360.0)
		_draw_pony_top_mini(hx, hy + sin(t * 1.4 + i * 1.1) * 5.0, herd[i], i)
	# The whirlpool down to the underworld.
	_draw_whirlpool(Vector2(LAG_W * 0.68, LAG_H * 0.52))


func _draw_pony_top_mini(x: float, y: float, col: Color, seed_i: int) -> void:
	# A herd pony seen from above: oval body, head, pink mane and tail.
	var c := Color(col.r, col.g, col.b, 0.85)
	var dk := c.darkened(0.3)
	_fill_ellipse(Vector2(x + 3, y + 5), 20, 14, Color(0, 0, 0, 0.15))
	_fill_ellipse(Vector2(x, y), 20, 14, c)
	draw_polyline(_arc_pts(x, y, 20, 14, 0, TAU, 24), dk, 2, true)
	draw_circle(Vector2(x + 22, y - 4), 8, c)
	draw_circle(Vector2(x + 25, y - 6), 1.6, Color("23232e"))
	var sw := sin(t * 2.0 + seed_i) * 3.0
	draw_polyline(_quad_pts(Vector2(x + 14, y - 10), Vector2(x + 6, y - 14 + sw), Vector2(x + 2, y - 8)), Color("ff6fb5", 0.8), 4, true)
	draw_polyline(_quad_pts(Vector2(x - 18, y), Vector2(x - 28, y + sw), Vector2(x - 26, y + 8)), Color("ff6fb5", 0.8), 4, true)


func _draw_whirlpool(p: Vector2) -> void:
	var pulse := 0.6 + 0.4 * sin(t * 3.0)
	draw_texture_rect(_radial_glow_tex(Color(0.5, 1, 0.4, 0.45 * pulse), Color(0.1, 0.5, 0.2, 0)), Rect2(p.x - 80, p.y - 80, 160, 160), false)
	for i in 3:
		var rr := 18.0 + i * 15.0
		var a0 := t * (1.4 + i * 0.4)
		draw_arc(p, rr, a0, a0 + PI * 1.5, 32, Color(0.10, 0.06, 0.22), 5, true)
	draw_circle(p, 8, Color("120a28"))
	_text_c(p + Vector2(0, -62), "👽 ?", 18, Color("9df08a"))


func _draw_lagoon_bg() -> void:
	# Screen space: tropical blue from above with a soft sun shimmer.
	var bands := 10
	for i in bands:
		var k0 := float(i) / bands
		var k1 := float(i + 1) / bands
		draw_rect(Rect2(0, VH * k0, VW, VH * (k1 - k0) + 1), Color("2f9bd6").lerp(Color("1a6fb0"), k0))
	draw_texture_rect(_radial_glow_tex(Color(0.6, 0.95, 1, 0.16), Color(0.2, 0.6, 0.9, 0)), Rect2(VW * 0.2, VH * 0.15, VW * 0.6, VH * 0.7), false)


func _bit_star(bp: Vector2) -> void:
	var tw := 0.75 + 0.25 * sin(t * 5 + bp.x * 0.05)
	draw_texture_rect(_radial_glow_tex(Color(1, 0.85, 0.3, 0.4 * tw), Color(1, 0.85, 0.3, 0)), Rect2(bp.x - 22, bp.y - 22, 44, 44), false)
	draw_colored_polygon(_sparkle_poly(bp.x, bp.y, 9 * tw), Color("ffd23f"))
	draw_circle(bp, 2.2, Color.WHITE)


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
	elif wonder and ch6:
		_draw_ch6_bg()
	elif wonder and ch5:
		if ch5_city:
			_draw_city_bg()
		else:
			_draw_water_bg()
	elif wonder and ch3:
		if under:
			_draw_under_bg()
		elif splashed:
			_draw_lagoon_bg()
		else:
			_draw_tunnel_bg()
	else:
		_draw_background(dt)
	# Chapter 2 side view is a world bigger than the screen: shift the
	# world transform by the camera so everything world-anchored (ground,
	# platforms, pony, mermaid, particles, popups, zaps) follows her.
	if wonder and not vertical:
		_wxf_p.x -= cam_x * _wxf_s.x
		_wxf_p.y -= cam_y * _wxf_s.y
		_world_apply()

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
	if wonder:
		_draw_wonder()
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

	if not ch6:
		_draw_mermaid()
	if vertical:
		_draw_pony_top()
		if state == "over" and over_card_visible:
			_puff(uni.x, uni.y + 56, 1.6)
	else:
		if not wonder:
			# Soft drop shadow on the cloud floor — fades as she climbs.
			var sh_h := clampf(H - 60 - uni.y, 0.0, 600.0)
			var sh_k := 1.0 - sh_h / 600.0
			_fill_ellipse(Vector2(uni.x, H - 56), 46.0 * (0.5 + 0.5 * sh_k), 10.0, Color(0.35, 0.3, 0.55, 0.22 * sh_k))
		if not ch6 and not (wonder and ch3 and under):
			_draw_mermaid()
		if wonder and (ch3 or ch5):
			_draw_pony_top()
		elif not wonder:
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
			var core := col
			core.v = minf(1.0, core.v + 0.55)
			draw_colored_polygon(_sparkle_poly(p.x, p.y, p.r + 1), core)
			draw_circle(Vector2(p.x, p.y), p.r * 0.28, Color(1, 1, 1, col.a * 0.9))
		else:
			draw_circle(Vector2(p.x, p.y), p.r * 0.7, col)
			var hot := col
			hot.v = minf(1.0, hot.v + 0.5)
			draw_circle(Vector2(p.x - p.r * 0.15, p.y - p.r * 0.15), p.r * 0.34, Color(hot.r, hot.g, hot.b, col.a * 0.8))

	for p in popups:
		var col: Color = p.color
		col.a = minf(1, p.life * 1.5)
		_stroke_text(Vector2(p.x, p.y), p.text, 20, col, HORIZONTAL_ALIGNMENT_CENTER, 4, Color(42 / 255.0, 22 / 255.0, 80 / 255.0, 0.7))
	_world_end()
	# Soft vignette pulls focus toward her lane.
	draw_texture_rect(_vignette_tex(), Rect2(0, 0, VW, VH), false)
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
	elif ch6_end:
		_card_begin()
		_draw_end_card()
		_card_end()
	elif state == "play" and paused:
		_card_begin()
		_draw_pause_card()
		_card_end()
	if settings_open:
		_card_begin()
		_draw_settings_card()
		_card_end()


# ─── Chapter 5: open water → the bad part of town ────────────────────────────
const W5W := 2400.0
const W5H := 1500.0
const CITY_W := 3200.0
const CITY_H := 2000.0
const MAZE_C := 13
const MAZE_R := 9
const MAZE_CELL := 110.0


func _maze_origin() -> Vector2:
	return Vector2(CITY_W - 1690.0, (CITY_H - MAZE_R * MAZE_CELL) * 0.5)


func _enter_ch5() -> void:
	ch5 = true
	ch5_city = false
	ch5_pending = 0.0
	wzaps = []
	towers = []
	mwalls = []
	wobs = []
	wcur = []
	drone = null
	umer = null
	uni.x = 300.0
	uni.y = W5H * 0.5
	uni.vx = 0.0
	uni.vy = 0.0
	_o_face = Vector2.RIGHT
	cam_x = 0.0
	cam_y = clampf(uni.y - H * 0.5, 0.0, W5H - H)
	# Drifting junk to dodge or zap, and three current lanes that shove.
	for i in 10:
		wobs.append({
			"x": 700.0 + _hash01(i * 17 + 3) * (W5W - 1100.0),
			"y": 140.0 + _hash01(i * 29 + 7) * (W5H - 280.0),
			"alive": true, "phase": randf() * TAU,
		})
	for i in 3:
		wcur.append({ "y": 200.0 + _hash01(i * 43 + 11) * (W5H - 500.0), "dir": 1.0 if i % 2 == 0 else -1.0 })
	flash = maxf(flash, 0.3)
	_popup(uni.x + 260, uni.y - 70, "Open Water! 🌊", Color("bfe9ff"))
	_popup(uni.x + 260, uni.y - 34, "Swim to the flag! 🚩", Color.WHITE)
	_burst(uni.x, uni.y, 36, [Color.WHITE, Color("bfe9ff"), Color("7df0c8")], 260)
	synth.powerup()


func _water_over(dt: float) -> void:
	if state != "play":
		return
	_over_swim(dt, W5W, W5H)
	# Current lanes push sideways; the streaks show which way.
	for cb in wcur:
		if uni.y > cb.y and uni.y < cb.y + 130.0:
			uni.x = clampf(uni.x + cb.dir * 130.0 * dt, 56.0, W5W - 56.0)
	# Barrels bob; a bump shoves her (never hurts), a zap pops them.
	for b in wobs:
		if not b.alive:
			continue
		if _stun_t <= 0 and Vector2(uni.x - b.x, uni.y - b.y).length() < 42.0:
			_stun_t = 0.35
			var away := Vector2(uni.x - b.x, uni.y - b.y).normalized()
			uni.vx = away.x * 300.0
			uni.vy = away.y * 300.0
			_popup(uni.x, uni.y - 48, "Bump!", Color("bfe9ff"))
			_burst(b.x, b.y, 8, [Color("8a5f3d"), Color.WHITE], 140)
			synth.poof()
	_ch5_zap(dt, false)
	# Pearls scattered across the swim.
	for i in 8:
		var bp := Vector2(220.0 + _hash01(i * 13 + 5) * (W5W - 440.0), 160.0 + _hash01(i * 29 + 3) * (W5H - 320.0))
		if not _bit_taken.has("W5:%d" % i) and Vector2(uni.x - bp.x, uni.y - bp.y).length() < 36:
			_bit_taken["W5:%d" % i] = t
			bits += 1
			score += 5
			_burst(bp.x, bp.y, 8, [Color("ffd23f"), Color.WHITE], 150)
			synth.ring(bits)
	# Ambient bubbles rising.
	if randf() < 0.25:
		var p := Particle.new()
		p.x = cam_x + randf_range(0, W)
		p.y = cam_y + H + 10
		p.vx = randf_range(-8, 8)
		p.vy = randf_range(-70, -40)
		p.life = 2.2
		p.max_life = 2.2
		p.r = randf_range(2, 4)
		p.c = Color(0.7, 0.95, 1, 0.5)
		particles.append(p)
	# The flag buoy: touch it and the city swallows her.
	var flag := Vector2(W5W - 260.0, W5H * 0.45)
	if Vector2(uni.x - flag.x, uni.y - flag.y).length() < 60.0:
		_enter_city()


# Horn zaps for both ch5 phases: straight along the facing. Barrels pop,
# buildings chip toward collapse, maze walls just spark — the maze is the one
# thing she has to walk, not blast.
func _ch5_zap(dt: float, in_city: bool) -> void:
	_w_fire_cd = maxf(0.0, _w_fire_cd - dt)
	if Input.is_action_just_pressed("rockets") or _w_zap:
		_w_zap = false
		if _w_fire_cd <= 0:
			_w_fire_cd = 0.22
			wzaps.append({ "x": uni.x + _o_face.x * 30, "y": uni.y + _o_face.y * 30, "dir": _o_face.x, "dy": _o_face.y, "life": 0.9, "dead": false })
			synth.zap()
	for z in wzaps:
		if z.dead:
			continue
		z.x += z.dir * 760 * dt
		z.y += z.dy * 760 * dt
		z.life -= dt
		if z.life <= 0:
			z.dead = true
		if z.dead:
			continue
		if in_city:
			for tw in towers:
				if z.dead or tw.rubble:
					continue
				if Rect2(tw.x - 4, tw.y - 4, tw.w + 8, tw.d + 8).has_point(Vector2(z.x, z.y)):
					z.dead = true
					_hit_tower(tw)
			if not z.dead:
				for wr in mwalls:
					if wr.has_point(Vector2(z.x, z.y)):
						z.dead = true
						_burst(z.x, z.y, 4, [Color("ffd23f"), Color.WHITE], 100)
						synth.ring(1)
						break
		else:
			for b in wobs:
				if z.dead or not b.alive:
					continue
				if Vector2(z.x - b.x, z.y - b.y).length() < 26.0:
					z.dead = true
					b.alive = false
					score += 5
					_popup(b.x, b.y - 30, "POP! +5", Color("bfe9ff"))
					_burst(b.x, b.y, 14, [Color("8a5f3d"), Color("d9c48f"), Color.WHITE], 180)
					synth.poof()
	wzaps = wzaps.filter(func(z): return not z.dead)


func _hit_tower(tw) -> void:
	tw.hp -= 1
	tw.hit = 0.12
	if tw.hp <= 0:
		tw.rubble = true
		score += 50
		_popup(tw.x + tw.w * 0.5, tw.y - 20, "CRASH! +50", Color("ffb13b"))
		_burst(tw.x + tw.w * 0.5, tw.y + tw.d * 0.5, 46, [Color("8b8fa0"), Color("5a5f6e"), Color("ffb13b"), Color.WHITE], 320)
		synth.boom()
	else:
		_burst(tw.x + tw.w * 0.5, tw.y + tw.d * 0.6, 8, [Color("8b8fa0"), Color.WHITE], 150)
		synth.zap()


func _enter_city() -> void:
	ch5_city = true
	wzaps = []
	wobs = []
	_maze_hint = false
	uni.x = 240.0
	uni.y = CITY_H * 0.5
	uni.vx = 0.0
	uni.vy = 0.0
	_o_face = Vector2.RIGHT
	_build_city()
	cam_x = 0.0
	cam_y = clampf(uni.y - H * 0.5, 0.0, CITY_H - H)
	flash = maxf(flash, 0.35)
	_popup(uni.x + 320, uni.y - 70, "The Bad Part of Town 🏙", Color("ffb13b"))
	_popup(uni.x + 320, uni.y - 34, "Zap the blocks! Find the maze!", Color.WHITE)
	_burst(uni.x, uni.y, 40, [Color("ffb13b"), Color("8b8fa0"), Color.WHITE], 300)
	synth.level_up()


# Blocks on a street grid east of the spawn, all destructible; a real walled
# maze (recursive backtracker, one entrance west, one exit east) squats at the
# far end. Sorted far-to-near once so the 2.5D faces overlap right.
func _build_city() -> void:
	var mo := _maze_origin()
	var mz := Rect2(mo, Vector2(MAZE_C * MAZE_CELL, MAZE_R * MAZE_CELL))
	towers = []
	var pal := ["6a6f7e", "7a5248", "5a6a5e", "6e5a7a", "5f6672"]
	var bi := 0
	var gx := 140.0
	while gx < CITY_W - 320.0:
		var gy := 140.0
		while gy < CITY_H - 300.0:
			var bw := 120.0 + _hash01(bi * 7 + 1) * 70.0
			var bd := 110.0 + _hash01(bi * 13 + 3) * 60.0
			if _hash01(bi * 31 + 5) < 0.6 and gx > 620.0 and not mz.grow(160.0).intersects(Rect2(gx, gy, bw, bd)):
				var th := 60.0 + _hash01(bi * 17 + 9) * 130.0
				var thp := 3 + int(th / 55.0)
				towers.append({
					"x": gx, "y": gy, "w": bw, "d": bd, "h": th,
					"hp": thp, "max_hp": thp, "hit": 0.0, "rubble": false,
					"col": Color(pal[bi % pal.size()]), "seed": bi,
				})
			bi += 1
			gy += 240.0
		gx += 260.0
	towers.sort_custom(func(a, b): return a.y + a.d < b.y + b.d)
	_maze_gen()


func _maze_gen() -> void:
	mwalls = []
	var mo := _maze_origin()
	var rng := RandomNumberGenerator.new()
	rng.seed = 20261005
	# vw[c][r]: wall on the west edge of cell c (c == MAZE_C is the east rim).
	# hw[c][r]: wall on the north edge of cell r.
	var vw := []
	for c in MAZE_C + 1:
		var col := []
		col.resize(MAZE_R)
		col.fill(true)
		vw.append(col)
	var hw := []
	for c in MAZE_C:
		var col2 := []
		col2.resize(MAZE_R + 1)
		col2.fill(true)
		hw.append(col2)
	var seen := {}
	var start := Vector2i(0, MAZE_R / 2)
	var stack := [start]
	seen[start] = true
	while not stack.is_empty():
		var cur: Vector2i = stack[stack.size() - 1]
		var opts := []
		for d in [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]:
			var n: Vector2i = cur + d
			if n.x >= 0 and n.x < MAZE_C and n.y >= 0 and n.y < MAZE_R and not seen.has(n):
				opts.append(d)
		if opts.is_empty():
			stack.pop_back()
			continue
		var d: Vector2i = opts[rng.randi() % opts.size()]
		var nxt: Vector2i = cur + d
		if d == Vector2i(1, 0):
			vw[cur.x + 1][cur.y] = false
		elif d == Vector2i(-1, 0):
			vw[cur.x][cur.y] = false
		elif d == Vector2i(0, 1):
			hw[cur.x][cur.y + 1] = false
		else:
			hw[cur.x][cur.y] = false
		seen[nxt] = true
		stack.append(nxt)
	# One entrance west, one exit east, both mid-row.
	vw[0][MAZE_R / 2] = false
	vw[MAZE_C][MAZE_R / 2] = false
	for c in MAZE_C + 1:
		for r in MAZE_R:
			if vw[c][r]:
				mwalls.append(Rect2(mo.x + c * MAZE_CELL - 9.0, mo.y + r * MAZE_CELL, 18.0, MAZE_CELL))
	for c in MAZE_C:
		for r in MAZE_R + 1:
			if hw[c][r]:
				mwalls.append(Rect2(mo.x + c * MAZE_CELL, mo.y + r * MAZE_CELL - 9.0, MAZE_CELL, 18.0))
	mwalls.sort_custom(func(a, b): return a.position.y + a.size.y < b.position.y + b.size.y)
	maze_exit = Vector2(mo.x + MAZE_C * MAZE_CELL + 80.0, mo.y + (MAZE_R / 2) * MAZE_CELL + MAZE_CELL * 0.5)


func _city_over(dt: float) -> void:
	if state != "play":
		return
	_over_swim(dt, CITY_W, CITY_H)
	# Solid things: standing towers and the maze walls push her out.
	for tw in towers:
		if not tw.rubble:
			_city_push(Rect2(tw.x, tw.y, tw.w, tw.d))
	for wr in mwalls:
		_city_push(wr)
	for tw in towers:
		tw.hit = maxf(0.0, tw.hit - dt)
	_ch5_zap(dt, true)
	# The lit entrance calls itself out on first approach.
	var mo := _maze_origin()
	var gate_in := Vector2(mo.x, mo.y + (MAZE_R / 2) * MAZE_CELL + MAZE_CELL * 0.5)
	if not _maze_hint and Vector2(uni.x - gate_in.x, uni.y - gate_in.y).length() < 420.0:
		_maze_hint = true
		_popup(gate_in.x + 60, gate_in.y - 90, "The maze! 🌀", Color("9df08a"))
	# Out the east gap: puzzle time.
	if ch6_pending <= 0 and Vector2(uni.x - maze_exit.x, uni.y - maze_exit.y).length() < 56.0:
		ch6_pending = 1.6
		score += 100
		_popup(uni.x, uni.y - 80, "MAZE CLEARED! 🎉", Color("ffd23f"))
		_popup(uni.x, uni.y - 118, "CHAPTER 6! 🧩", Color("7df0ff"))
		_burst(uni.x, uni.y, 44, RAINBOW, 300)
		synth.level_up()


func _city_push(r: Rect2) -> void:
	var cx := clampf(uni.x, r.position.x, r.end.x)
	var cy := clampf(uni.y, r.position.y, r.end.y)
	var dx: float = uni.x - cx
	var dy: float = uni.y - cy
	var dl := Vector2(dx, dy).length()
	if dl >= 26.0:
		return
	if dl < 0.01:
		# Dead inside (dragged against a corner): pop her out the west side.
		uni.x = r.position.x - 26.0
		return
	uni.x = cx + dx / dl * 26.0
	uni.y = cy + dy / dl * 26.0


func _draw_ch5() -> void:
	if ch5_city:
		_draw_city()
	else:
		_draw_water()
	_draw_wzaps()


func _draw_water() -> void:
	# World space: open sea — deep edges, current streaks, drifting barrels,
	# pearls, and the flag buoy that ends the swim.
	var cx0 := cam_x - 80.0
	var cx1 := cam_x + W + 80.0
	var cy0 := cam_y - 80.0
	var cy1 := cam_y + H + 80.0
	# The edge of the map reads as deeper, darker water.
	draw_rect(Rect2(cx0, -70, cx1 - cx0, 70), Color("0a1c38"))
	draw_rect(Rect2(cx0, W5H, cx1 - cx0, 70), Color("0a1c38"))
	draw_rect(Rect2(-70, cy0, 70, cy1 - cy0), Color("0a1c38"))
	draw_rect(Rect2(W5W, cy0, 70, cy1 - cy0), Color("0a1c38"))
	# Current lanes: animated streak arrows sliding along the band.
	for cb in wcur:
		for row in 2:
			for i in 9:
				var sx2: float = fmod(i * 300.0 + t * 110.0 * cb.dir + row * 150.0, W5W)
				var sy2: float = cb.y + 30.0 + row * 70.0
				draw_line(Vector2(sx2, sy2), Vector2(sx2 + 44.0 * cb.dir, sy2), Color(1, 1, 1, 0.22), 4, true)
				draw_colored_polygon(PackedVector2Array([
					Vector2(sx2 + 52.0 * cb.dir, sy2),
					Vector2(sx2 + 40.0 * cb.dir, sy2 - 6),
					Vector2(sx2 + 40.0 * cb.dir, sy2 + 6),
				]), Color(1, 1, 1, 0.22))
	# Sun-shimmer ripples.
	for i in 8:
		var rp2 := Vector2(_hash01(i * 11 + 1) * W5W, _hash01(i * 23 + 2) * W5H)
		var rr := 24.0 + fmod(t * 26.0 + i * 40.0, 110.0)
		draw_arc(rp2, rr, 0, TAU, 32, Color(1, 1, 1, 0.08 * (1.0 - rr / 134.0)), 2, true)
	# Pearls.
	for i in 8:
		if not _bit_taken.has("W5:%d" % i):
			_bit_star(Vector2(220.0 + _hash01(i * 13 + 5) * (W5W - 440.0), 160.0 + _hash01(i * 29 + 3) * (W5H - 320.0)))
	# Drifting barrels.
	for b in wobs:
		if not b.alive:
			continue
		var by2: float = b.y + sin(t * 2.0 + float(b.phase)) * 4.0
		draw_circle(Vector2(b.x + 3, by2 + 5), 18, Color(0, 0, 0, 0.18))
		draw_circle(Vector2(b.x, by2), 18, Color("8a5f3d"))
		draw_arc(Vector2(b.x, by2), 18, 0, TAU, 24, Color("5d3f26"), 2, true)
		draw_line(Vector2(b.x - 17, by2 - 6), Vector2(b.x + 17, by2 - 6), Color("5d3f26"), 3, true)
		draw_line(Vector2(b.x - 17, by2 + 6), Vector2(b.x + 17, by2 + 6), Color("5d3f26"), 3, true)
		draw_circle(Vector2(b.x - 5, by2 - 6), 4, Color(1, 1, 1, 0.3))
	# The flag buoy, waving her in.
	var flag := Vector2(W5W - 260.0, W5H * 0.45)
	var fp := 1.0 + 0.1 * sin(t * 3.0)
	draw_texture_rect(_radial_glow_tex(Color(1, 0.85, 0.3, 0.4), Color(1, 0.85, 0.3, 0)), Rect2(flag.x - 70 * fp, flag.y - 70 * fp, 140 * fp, 140 * fp), false)
	_fill_ellipse(flag + Vector2(0, 18), 26, 10, Color("ff4d5e"))
	_fill_ellipse(flag + Vector2(0, 22), 26, 6, Color("a31220"))
	for i in 4:
		draw_rect(Rect2(flag.x - 3, flag.y - 60 + i * 18, 6, 18), Color.WHITE if i % 2 == 0 else Color("ff4d5e"))
	for i in 6:
		var wave := sin(t * 5.0 + i * 0.8) * 2.0
		draw_colored_polygon(PackedVector2Array([Vector2(flag.x + 3, flag.y - 62 + i * 5), Vector2(flag.x + 44 - i * 2, flag.y - 59 + i * 5 + wave), Vector2(flag.x + 3, flag.y - 55 + i * 5)]), RAINBOW[i])
	_text_c(flag + Vector2(6, -74), "FLAG 🚩", 13, Color.WHITE)


func _draw_city() -> void:
	# World space, GTA 2 angle: asphalt ground plane, street grid, then the
	# blocks pulled up-screen by their height so the tops read as roofs.
	var cx0 := cam_x - 220.0
	var cx1 := cam_x + W + 220.0
	var cy0 := cam_y - 260.0
	var cy1 := cam_y + H + 120.0
	draw_rect(Rect2(cx0, cy0, cx1 - cx0, cy1 - cy0), Color("33363e"))
	# Streets: darker bands with tired lane dashes.
	var sy := 140.0
	while sy < CITY_H:
		draw_rect(Rect2(cx0, sy + 170.0, cx1 - cx0, 70.0), Color("26282e"))
		var dx0 := floorf(cx0 / 60.0) * 60.0
		while dx0 < cx1:
			draw_rect(Rect2(dx0, sy + 202.0, 30.0, 4.0), Color(1, 0.8, 0.3, 0.16))
			dx0 += 60.0
		sy += 240.0
	var sx := 140.0
	while sx < CITY_W:
		draw_rect(Rect2(sx + 190.0, cy0, 70.0, cy1 - cy0), Color("26282e"))
		sx += 260.0
	# Grime and old stains.
	for i in 14:
		var gxp := _hash01(i * 57 + 3) * CITY_W
		var gyp := _hash01(i * 73 + 9) * CITY_H
		draw_circle(Vector2(gxp, gyp), 20.0 + _hash01(i * 7) * 30.0, Color(0, 0, 0, 0.12))
	# The maze district slab, darker than the streets around it.
	var mo := _maze_origin()
	draw_rect(Rect2(mo.x - 40, mo.y - 40, MAZE_C * MAZE_CELL + 80, MAZE_R * MAZE_CELL + 80), Color("1e2026"))
	# Blocks far-to-near, then the maze walls.
	for tw in towers:
		_draw_tower(tw)
	for wr in mwalls:
		_draw_maze_wall(wr)
	# The lit entrance on the west face of the maze.
	var gate_in := Vector2(mo.x, mo.y + (MAZE_R / 2) * MAZE_CELL + MAZE_CELL * 0.5)
	var gp := 0.6 + 0.4 * sin(t * 4.0)
	draw_texture_rect(_radial_glow_tex(Color(0.6, 1, 0.55, 0.25 + 0.2 * gp), Color(0, 0.5, 0.2, 0)), Rect2(gate_in.x - 70, gate_in.y - 70, 140, 140), false)
	_text_c(gate_in + Vector2(-6, -60), "MAZE ➡", 15, Color("9df08a"))
	# The exit beacon with its own little rainbow flag.
	var bp := 1.0 + 0.12 * sin(t * 3.0)
	draw_texture_rect(_radial_glow_tex(Color(1, 0.85, 0.3, 0.45), Color(1, 0.85, 0.3, 0)), Rect2(maze_exit.x - 60 * bp, maze_exit.y - 60 * bp, 120 * bp, 120 * bp), false)
	draw_arc(maze_exit, 30 * bp, 0, TAU, 36, Color("ffd23f"), 3, true)
	draw_rect(Rect2(maze_exit.x - 2, maze_exit.y - 66, 4, 66), Color("8a8fa0"))
	for i in 6:
		var wave := sin(t * 5.0 + i * 0.8) * 1.6
		draw_colored_polygon(PackedVector2Array([Vector2(maze_exit.x + 2, maze_exit.y - 66 + i * 4), Vector2(maze_exit.x + 34 - i * 2, maze_exit.y - 63 + i * 4 + wave), Vector2(maze_exit.x + 2, maze_exit.y - 59 + i * 4)]), RAINBOW[i])
	_text_c(maze_exit + Vector2(0, 44), "EXIT 🧩", 13, Color("ffd23f"))


func _draw_tower(tw) -> void:
	var base := Rect2(tw.x, tw.y, tw.w, tw.d)
	if tw.rubble:
		# A crossable scar: cracked slab, lumps, settling dust.
		draw_rect(base.grow(3), Color("22242a"))
		for i in 7:
			var lx: float = tw.x + _hash01(tw.seed * 41 + i * 7) * tw.w
			var ly: float = tw.y + _hash01(tw.seed * 23 + i * 13) * tw.d
			var lr := 6.0 + _hash01(tw.seed * 11 + i * 3) * 12.0
			draw_circle(Vector2(lx, ly), lr, Color("4a4e5a"))
			draw_circle(Vector2(lx - lr * 0.3, ly - lr * 0.3), lr * 0.4, Color("6a6f7e"))
		draw_rect(base.grow(3), Color(0, 0, 0, 0.25), false, 2)
		return
	var lift: Vector2 = Vector2(-0.22, -1.0) * tw.h
	var p00 := Vector2(tw.x, tw.y)
	var p10 := Vector2(tw.x + tw.w, tw.y)
	var p11 := Vector2(tw.x + tw.w, tw.y + tw.d)
	var p01 := Vector2(tw.x, tw.y + tw.d)
	var col: Color = tw.col
	if tw.hit > 0:
		col = Color.WHITE
	# Shadow spilling onto the street, south face, east cheek, roof.
	draw_colored_polygon(PackedVector2Array([p01, p11 + Vector2(14, 10), p11 + lift + Vector2(14, 10), p01 + lift]), Color(0, 0, 0, 0.22))
	draw_colored_polygon(PackedVector2Array([p01, p11, p11 + lift, p01 + lift]), col.darkened(0.30))
	draw_colored_polygon(PackedVector2Array([p10, p11, p11 + lift, p10 + lift]), col.darkened(0.45))
	var roof := PackedVector2Array([p00 + lift, p10 + lift, p11 + lift, p01 + lift])
	draw_colored_polygon(roof, col.darkened(0.12))
	var roof_line := roof.duplicate()
	roof_line.append(roof[0])
	draw_polyline(roof_line, col.darkened(0.55), 2, true)
	# Rooftop clutter: an AC box and, on the tall ones, a water tank.
	draw_rect(Rect2(tw.x + lift.x + 12, tw.y + lift.y + 12, 22, 16), col.darkened(0.4))
	if tw.h > 140.0:
		draw_circle(Vector2(tw.x + lift.x + tw.w - 24, tw.y + lift.y + 22), 11, col.darkened(0.3))
	# Tired windows on the south face, some lit sodium-amber.
	var rows := int(tw.h / 34.0)
	var cols := int(tw.w / 30.0)
	for wy in rows:
		for wx in cols:
			var k := float(wy + 1) / float(rows + 1)
			var wpx: float = p01.x + (float(wx) + 0.5) / cols * tw.w + lift.x * k
			var wpy: float = p01.y + lift.y * k
			var lit := _hash01(tw.seed * 97 + wy * 13 + wx * 7) < 0.4
			var wcol := Color(1, 0.75, 0.35, 0.85) if lit else Color(0.12, 0.12, 0.18, 0.8)
			draw_rect(Rect2(wpx - 6, wpy - 9, 12, 16), wcol)
	# Cracks creep as her horn chips the HP away.
	var dmg := 1.0 - float(tw.hp) / float(maxi(tw.max_hp, 1))
	if dmg > 0.01:
		var nc := int(dmg * 4.0)
		for ci2 in nc:
			var kx: float = tw.x + _hash01(tw.seed * 53 + ci2 * 17) * tw.w
			var pts := PackedVector2Array()
			for s in 4:
				var kk := float(s) / 3.0
				pts.append(Vector2(kx + sin(s * 2.4 + tw.seed) * 8.0 + lift.x * kk, tw.y + tw.d + lift.y * kk))
			draw_polyline(pts, Color(0.1, 0.1, 0.14, 0.7), 2.5, true)
	# Some blocks buzz neon.
	if _hash01(tw.seed * 71 + 3) < 0.35:
		var ncol := Color("ff4d9a") if tw.seed % 2 == 0 else Color("4dd2ff")
		var nk := 0.5 + 0.5 * sin(t * 7.0 + tw.seed)
		var ns := Vector2(tw.x + 10 + lift.x * 0.5, tw.y + tw.d + lift.y * 0.5)
		draw_rect(Rect2(ns.x, ns.y - 5, 26, 8), Color(ncol.r, ncol.g, ncol.b, 0.5 + 0.4 * nk))


func _draw_maze_wall(wr: Rect2) -> void:
	# Low hazard-striped blocks: same 2.5D lift as the towers, but solid.
	var lift: Vector2 = Vector2(-0.22, -1.0) * 44.0
	var p00 := wr.position
	var p11 := wr.end
	var col := Color("4e4658")
	draw_colored_polygon(PackedVector2Array([Vector2(p00.x, p11.y), p11, p11 + lift, Vector2(p00.x, p11.y) + lift]), col.darkened(0.3))
	draw_colored_polygon(PackedVector2Array([p00 + lift, Vector2(p11.x, p00.y) + lift, p11 + lift, Vector2(p00.x, p11.y) + lift]), col.lightened(0.15))
	# Hazard dashes along the top slab so the maze reads "keep out".
	var top := Rect2(p00 + lift, wr.size)
	var n := int(maxf(top.size.x, top.size.y) / 16.0)
	for i in n:
		if i % 2 != 0:
			continue
		var q := float(i) / maxf(1, n)
		if wr.size.x >= wr.size.y:
			draw_rect(Rect2(top.position.x + q * top.size.x, top.position.y + 2, minf(14.0, top.size.x - q * top.size.x), top.size.y - 4), Color(1, 0.82, 0.2, 0.55))
		else:
			draw_rect(Rect2(top.position.x + 2, top.position.y + q * top.size.y, top.size.x - 4, minf(14.0, top.size.y - q * top.size.y)), Color(1, 0.82, 0.2, 0.55))


func _draw_water_bg() -> void:
	# Screen space: open-sea blue with a soft sun shimmer.
	var bands := 10
	for i in bands:
		var k0 := float(i) / bands
		var k1 := float(i + 1) / bands
		draw_rect(Rect2(0, VH * k0, VW, VH * (k1 - k0) + 1), Color("1c5a9e").lerp(Color("0c2f5e"), k0))
	draw_texture_rect(_radial_glow_tex(Color(0.6, 0.95, 1, 0.14), Color(0.2, 0.6, 0.9, 0)), Rect2(VW * 0.25, VH * 0.1, VW * 0.5, VH * 0.6), false)


func _draw_city_bg() -> void:
	# Screen space: smog over the bad blocks — bruised amber sinking to soot.
	var bands := 10
	for i in bands:
		var k0 := float(i) / bands
		var k1 := float(i + 1) / bands
		draw_rect(Rect2(0, VH * k0, VW, VH * (k1 - k0) + 1), Color("4a3040").lerp(Color("14101a"), k0))
	var pulse := 0.5 + 0.5 * sin(t * 0.7)
	draw_texture_rect(_radial_glow_tex(Color(1, 0.6, 0.25, 0.10 + 0.05 * pulse), Color(0.4, 0.15, 0.05, 0)), Rect2(VW * 0.1, VH * 0.55, VW * 0.8, VH * 0.5), false)


# ─── Chapter 6: three little jigsaws ─────────────────────────────────────────
const PZ_O := Vector2(240.0, 76.0)
const PZ_PW := 160.0
const PZ_PH := 120.0


func _enter_ch6() -> void:
	ch6 = true
	ch6_pending = 0.0
	ch6_end = false
	wzaps = []
	drone = null
	umer = null
	cam_x = 0.0
	cam_y = 0.0
	flash = maxf(flash, 0.3)
	synth.powerup()
	_pz_setup(0)


func _pz_name(idx: int) -> String:
	return ["The Pony 🦄", "The Mermaid 🧜‍♀️", "Her Rider 🛡"][clampi(idx, 0, 2)]


func _pz_setup(idx: int) -> void:
	pz_kind = idx
	pz_sel = null
	pz_done_t = 0.0
	pz_pieces = []
	for i in 9:
		var left_side := i % 2 == 0
		pz_pieces.append({
			"gx": i % 3, "gy": i / 3, "locked": false,
			"pos": Vector2(randf_range(14.0, 70.0) if left_side else randf_range(730.0, 786.0), randf_range(30.0, 400.0)),
		})
	pz_pieces.shuffle()
	_popup(W * 0.5, 60.0, "Puzzle %d/3 · %s" % [idx + 1, _pz_name(idx)], Color("ffd23f"))
	_pz_bake()


# Portrait bake: the painter redraws pony/mermaid/rider into the private
# SubViewport; we snapshot it and slice the grid. Headless QA gets a flat
# stand-in so the smoke run never touches the dummy renderer.
func _pz_bake() -> void:
	_pz_bake_seq += 1
	var seq := _pz_bake_seq
	if DisplayServer.get_name() == "headless":
		pz_tex = _pz_fallback_tex(pz_kind)
		return
	painter.kind = pz_kind
	painter.queue_redraw()
	pvp.render_target_update_mode = SubViewport.UPDATE_ONCE
	await RenderingServer.frame_post_draw
	await RenderingServer.frame_post_draw
	if seq != _pz_bake_seq:
		return
	pvp.render_target_update_mode = SubViewport.UPDATE_DISABLED
	var img := pvp.get_texture().get_image()
	if img == null or img.is_empty():
		pz_tex = _pz_fallback_tex(pz_kind)
	else:
		pz_tex = ImageTexture.create_from_image(img)


func _pz_fallback_tex(idx: int) -> Texture2D:
	var img := Image.create(480, 360, false, Image.FORMAT_RGBA8)
	var base: Color = [Color("ff9ccf"), Color("7df0c8"), Color("8a8fa8")][clampi(idx, 0, 2)]
	img.fill(base.darkened(0.15))
	for i in 9:
		var gx := i % 3
		var gy := i / 3
		img.fill_rect(Rect2i(gx * 160 + 3, gy * 120 + 3, 154, 114), base.lightened(0.25) if (gx + gy) % 2 == 0 else base)
	return ImageTexture.create_from_image(img)


func _pz_press(lp: Vector2) -> void:
	for i in range(pz_pieces.size() - 1, -1, -1):
		var pc = pz_pieces[i]
		if pc.locked:
			continue
		if Rect2(pc.pos, Vector2(PZ_PW, PZ_PH)).has_point(lp):
			pz_sel = pc
			pz_grab = lp - pc.pos
			pz_pieces.erase(pc)
			pz_pieces.append(pc)
			synth.ring(1)
			return


func _pz_move(lp: Vector2) -> void:
	if pz_sel != null:
		pz_sel.pos = lp - pz_grab


func _pz_release() -> void:
	if pz_sel == null:
		return
	var pc = pz_sel
	pz_sel = null
	var slot := PZ_O + Vector2(pc.gx * PZ_PW, pc.gy * PZ_PH)
	if (pc.pos - slot).length() < 52.0:
		pc.pos = slot
		pc.locked = true
		score += 25
		_popup(slot.x + 80, slot.y - 8, "Snap! +25", Color("ffd23f"))
		_burst(slot.x + 80, slot.y + 60, 16, RAINBOW, 200)
		synth.gold()
		var done := true
		for q in pz_pieces:
			if not q.locked:
				done = false
				break
		if done:
			pz_done_t = 1.8
			_popup(PZ_O.x + 240, PZ_O.y - 30, "Beautiful! 🎉", Color("ff6fb5"))
			synth.level_up()


func _pz_update(dt: float) -> void:
	if pz_done_t > 0:
		if randf() < dt * 6.0:
			_burst(randf_range(300.0, 660.0), randf_range(120.0, 420.0), 18, RAINBOW, 240)
		pz_done_t -= dt
		if pz_done_t <= 0:
			if pz_kind < 2:
				_pz_setup(pz_kind + 1)
			else:
				ch6_end = true
				score += 250
				synth.powerup()
	if ch6_end and randf() < dt * 2.0:
		_burst(randf_range(200.0, 760.0), randf_range(100.0, 400.0), 22, RAINBOW, 260)


func _draw_ch6() -> void:
	# The ghost board: the full portrait, faint, with the grid on top.
	var board := Rect2(PZ_O, Vector2(480, 360))
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.2, 0.1, 0.35, 0.30)
	sb.border_color = Color(1, 1, 1, 0.5)
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(16)
	draw_style_box(sb, board.grow(10))
	if pz_tex != null:
		draw_texture_rect(pz_tex, board, false, Color(1, 1, 1, 0.13))
	for gy in 3:
		for gx in 3:
			draw_rect(Rect2(PZ_O + Vector2(gx * PZ_PW, gy * PZ_PH), Vector2(PZ_PW, PZ_PH)), Color(1, 1, 1, 0.35), false, 1.5)
	if not ch6_end:
		_stroke_text(Vector2(W / 2, 462), "Drag the pieces onto the picture!", 18, Color(1, 1, 1, 0.75), HORIZONTAL_ALIGNMENT_CENTER, 4)
	# Locked pieces sit flush; loose ones cast a shadow, dragged rides on top.
	if pz_tex != null:
		for pc in pz_pieces:
			var src := Rect2(pc.gx * PZ_PW, pc.gy * PZ_PH, PZ_PW, PZ_PH)
			if pc.locked:
				draw_texture_rect_region(pz_tex, Rect2(PZ_O + Vector2(pc.gx * PZ_PW, pc.gy * PZ_PH), Vector2(PZ_PW, PZ_PH)), src)
			else:
				draw_rect(Rect2(pc.pos + Vector2(5, 7), Vector2(PZ_PW, PZ_PH)), Color(0.1, 0.05, 0.2, 0.3))
				draw_texture_rect_region(pz_tex, Rect2(pc.pos, Vector2(PZ_PW, PZ_PH)), src)
				draw_rect(Rect2(pc.pos, Vector2(PZ_PW, PZ_PH)), Color(1, 1, 1, 0.6), false, 2)
	# Progress dots.
	var locked := pz_pieces.filter(func(q): return q.locked).size()
	for i in 9:
		draw_circle(Vector2(W / 2 - 64 + i * 16, H - 24), 5, Color("ffd23f") if i < locked else Color(1, 1, 1, 0.3))


func _draw_ch6_bg() -> void:
	# Screen space: calm crafting-table pastel after the grit of the city.
	var bands := 8
	for i in bands:
		var k0 := float(i) / bands
		var k1 := float(i + 1) / bands
		draw_rect(Rect2(0, VH * k0, VW, VH * (k1 - k0) + 1), Color("ffeef7").lerp(Color("dccbf5"), k0))
	for i in 24:
		var dx := _hash01(i * 17 + 3) * VW
		var dy := _hash01(i * 29 + 7) * VH
		draw_circle(Vector2(dx, dy), 5.0 + _hash01(i * 7) * 8.0, Color(1, 1, 1, 0.25))


func _draw_end_card() -> void:
	_card(Rect2(W / 2 - 230, H / 2 - 190, 460, 380))
	var y := H / 2 - 190 + 46
	_rainbow_title(W / 2, y, "The End … for now", 36)
	y += 44
	_text_c(Vector2(W / 2, y), "The pony, the mermaid and her knight —", 15, Color("ffd9ef"))
	y += 20
	_text_c(Vector2(W / 2, y), "all snapped back together. 🧩", 15, Color("ffd9ef"))
	y += 40
	_text_c(Vector2(W / 2, y), str(score), 40, Color("ffd23f"))
	y += 34
	_text_c(Vector2(W / 2, y), "Chapters 1–6 complete. Chapter 7 soon? 🦄", 14, Color("f3e9ff"))
	y += 36
	_btn_end = _play_button(Vector2(W / 2, y + 24), "Back to Title 🏠")


func _back_to_title() -> void:
	wonder = false
	powered = false
	paused = false
	play_time = 0.0
	reset()
	state = "title"
	_layout()


# ─── Screenshot test hook ─────────────────────────────────────────────────
func _capture() -> void:
	await RenderingServer.frame_post_draw
	var img := get_viewport().get_texture().get_image()
	var err := img.save_png(_shot_path)
	print("FU screenshot -> %s (err=%d)" % [_shot_path, err])
	get_tree().quit()
