if (window.location.hash != '#menu' && window.location.hash != '#game')
	window.location.hash = '#menu'

var canvas, gl, song, current_mode, screens, current_screen, msgboxes,
    current_msgbox, next_thing_to_do, current_level, progress_title,
    progress_screenshot, progress_spinner, resume_game_btn, city_panorama,
	world_images, level_names, level_titles, current_state = 0,
    cheat = window.location.toString().search(/cheat/i) >= 0;

var requestAnimationFrame = window.setTimeout;/*window.requestAnimationFrame
                            || window.mozRequestAnimationFrame
                            || window.webkitRequestAnimationFrame
                            || window.msRequestAnimationFrame
                            || window.setTimeout;*/

var mouse = {
	x:0, y:0,
	dx1:0, dx2:0, dx3:0,
	dy1:0, dy2:0, dy3:0,
	dragging:false,
	freeview:false
};
document.body.onmousedown = function(event) {
	if (event.which == 1)
		mouse.dragging = true;
	else if (event.which == 2 || event.which == 3)
		Keyboard_KeyPressed(KEYBOARD_RIGHT_MOUSE_BUTTON);
	mouse.last_x = event.pageX;
	mouse.last_y = event.pageY;
	event.preventDefault();
	event.stopPropagation();
	return false;
};
document.body.onmousemove = function(event) {
	if (mouse.dragging != mouse.freeview && mouse.last_x !== undefined && mouse.last_y !== undefined) {
		mouse.dx3 = mouse.dx2, mouse.dy3 = mouse.dy2;
		mouse.dx2 = mouse.dx1, mouse.dy2 = mouse.dy1;
		mouse.dx1 = event.pageX - mouse.last_x;
		mouse.dy1 = event.pageY - mouse.last_y;

		var dx = (mouse.dx1 + mouse.dx2 + mouse.dx3) / 3;
		var dy = (mouse.dy1 + mouse.dy2 + mouse.dy3) / 3;
		if (current_mode && current_mode.mouseMove)
			current_mode.mouseMove(dx, dy);
	}
	mouse.last_x = event.pageX;
	mouse.last_y = event.pageY;
	event.preventDefault();
	event.stopPropagation();
	return false;
};
document.body.onmouseout = function(event) {
	if (event.pageX >= 0 && event.pageX < window.innerWidth
		&& event.pageY >= 0 && event.pageY < window.innerHeight)
	{
		return;
	}
	mouse.dragging = false;
	delete mouse.last_x;
	delete mouse.last_y;
};
document.body.onmouseup = function(event) {
	if (event.which == 1)
		mouse.dragging = false;
	else if (event.which == 2 || event.which == 3)
		Keyboard_KeyReleased(KEYBOARD_RIGHT_MOUSE_BUTTON);
	mouse.last_x = event.pageX;
	mouse.last_y = event.pageY;
	event.preventDefault();
	event.stopPropagation();
	return false;
};
document.body.ondblclick = function(event) {
	mouse.freeview = !mouse.freeview;
	event.preventDefault();
	event.stopPropagation();
	return false;
};
document.body.oncontextmenu = function(event) {
	if (screens && current_screen != screens.game)
		return;
	event.preventDefault();
	event.stopPropagation();
	return false;
};
window.onkeydown = function(event) {
	Keyboard_KeyPressed(event.keyCode);
	if (cheat && event.keyCode == 0x20)
		Level_FlipZ();
	if (current_msgbox) {
		if (event.keyCode == 13) // enter
			current_msgbox.onok();
		else if (event.keyCode == 27) // esc
			current_msgbox.oncancel();
	}
};
window.onkeyup = function(event) {
	Keyboard_KeyReleased(event.keyCode);
};
window.onhashchange = function() {
	if (!screens)
		return;

	if (current_msgbox)
		current_msgbox.oncancel();

	if (window.location.hash == '#game')
		resumeGame();
	else {
		if (window.location.hash != '#menu')
			window.location.hash = '#menu'
		if (current_screen == screens.game)
			stopPlaying();
		else
			setScreen(screens.main_menu);
	}
};
window.onbeforeunload = function() {
	if (current_screen && current_screen == screens.game)
		saveGame();
};
window.onresize = function(event) {
	if (current_mode && current_mode.onresize)
		current_mode.onresize();
};

var frame_time = {
	last_time: 0,
	spf: 0
};
var drawFrame = function() {
	canvas.fitToWindow();

	Level_Render();
	gl.clear(gl.DEPTH_BUFFER_BIT);
	Level_Draw();

	gl.enable(gl.BLEND);
	gl.disable(gl.DEPTH_TEST);
	Level_DrawOverlay();
	gl.enable(gl.DEPTH_TEST);
	gl.disable(gl.BLEND);
};
var play = function() {
	drawFrame();		

	var time = new Date().getTime();
	doFps(time);
	if (frame_time.last_time)
		frame_time.spf = 0.5*frame_time.spf + 0.5*(time - frame_time.last_time)/1000;
	else
		frame_time.spf = 0;
	frame_time.last_time = time;

	var pad = navigator.webkitGetGamepads && navigator.webkitGetGamepads()[0];
  if (pad) {
    var snap = function(n, s) { return Math.abs(n) > (s || .05) ? n : 0; }
    var down = function(id) { return pad.buttons[id] && pad.buttons[id] > .5; }
    Level_MoveForward(-snap(pad.axes[1]));
    Level_MoveSide(snap(pad.axes[0]));
    if (down(4) || down(5) || down(6) || down(7)) {
      Level_Turn(0);
      if (!view_locked) {
        Camera_EnableAutoLook(false);
        view_locked = true;
      }
      Level_MouseMove(720 * snap(pad.axes[2]) * frame_time.spf,
                      600 * snap(pad.axes[3]) * frame_time.spf);
    } else {
      if (view_locked) {
        Camera_EnableAutoLook(true);
        view_locked = false;
      }
      Level_Turn(-snap(pad.axes[2]));
    }


    if (down(12) || down(3))
      Level_MouseMove(0, -720 * frame_time.spf);
    else if (down(13) || down(0))
      Level_MouseMove(0, 720 * frame_time.spf);
    if (down(14) || down(2))
      Level_Turn(1);
    else if (down(15) || down(1))
      Level_Turn(-1);
  }

	
	//checkGlErrors();

	Level_NextFrame(frame_time.spf,1.1);

	requestAnimationFrame(next_thing_to_do);
}

var showLayer = function(layer, visible) {
	layer.style.display = visible ? 'table' : 'none';
};

var messageBox = function(msgbox) {
	if (typeof msgbox == 'string') {
		msgboxes.simple.text.innerHTML = msgbox;
		msgbox = msgboxes.simple;
	}

	if (current_msgbox)
		showLayer(current_msgbox, false);
	if (current_msgbox = msgbox)
		showLayer(current_msgbox, true);
};

var setMode = function(mode) {
	if (current_mode === mode)
		return;

	if (current_mode && current_mode.exit)
		current_mode.exit();
	current_mode = mode;
	if (current_mode && current_mode.enter)
		current_mode.enter();
};

var setScreen = function(screen) {
	if (current_screen === screen)
		return;

	current_state++;

	if (current_screen)
		showLayer(current_screen, false);

	if (current_screen = screen) {
		showLayer(current_screen, true);
		setMode(current_screen.mode);
		if (current_screen.enter)
			current_screen.enter();
	}
};

var checkState = function(state) {
	return current_state == state;
};

var MenuMode = function() {
	var drawBackground = function() {
		canvas.fitToWindow();
		Nova_Begin();
		Nova_End();
		Nova_DrawGL();
	};
	this.worlds = [document.getElementById('easy-world-img'),
	               document.getElementById('hard-world-img'),
	               document.getElementById('absurd-world-img')];
	this.fades = [document.getElementById('easy-world-fade'),
	              document.getElementById('hard-world-fade'),
	              document.getElementById('absurd-world-fade')];
	this.current_images = [0, 0, 0];
	this.next_change = 0;
	this.onresize = drawBackground;
	this.enter = function() {
		for (var i = 1; i <= 3; i++) {
			world_images[1][i-1].src = 'images/screenshots/hard-world' + (localStorage.has_beaten_level_1 ? '-' : '-locked-') + i + '.jpg';
			world_images[2][i-1].src = 'images/screenshots/absurd-world' + (localStorage.has_beaten_level_6 ? '-' : '-locked-') + i + '.jpg';
		}
		for (var i = 0; i < 3; i++)
			this.worlds[i].src = world_images[i][this.current_images[i]].src;

		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
	 	gl.disable(gl.DEPTH_TEST);

		this.yaw = -20;
		this.pitch = 0;
		this.max_yaw = this.yaw + 15;
		this.min_yaw = this.yaw - 15;
		this.max_pitch = 10;
		this.min_pitch = -10;
		this.last_view_angle = Nova_GetViewAngle();
		this.last_position = Nova_GetPosition();
		Nova_SetViewAngle3f(this.yaw, this.pitch, 0);
		Nova_SetPosition3f(0, 0, 0);

		this.last_panorama = Nova_GetPanorama();
		if (!this.panorama) {
			this.panorama = [loadTexture(city_panorama.top),
			                 loadTexture(city_panorama.bottom),
			                 0,
			                 loadTexture(city_panorama.right),
			                 0,
			                 loadTexture(city_panorama.back)];
		}
		Nova_SetPanorama(1, 1, 1, this.panorama);
		drawBackground();

		mouse.freeview = true;
		mouse.dragging = false;

		var _this = this;
		this.change_interval = setInterval(function() {
			_this.changeImage();
		}, 3000);
	};
	this.exit = function() {
		clearInterval(this.change_interval);
		if (this.fade_interval)
			this.finishFade();
		if (!this.panorama)
			return;
		var current_panorama = Nova_GetPanorama();
		for (var i in this.panorama) {
			if (this.panorama[i].texGL != current_panorama.textures[i].texGL)
				return;
		}
		Nova_SetPanorama(this.last_panorama.r, this.last_panorama.g, this.last_panorama.b, this.last_panorama.textures);
		Nova_SetViewAngle(this.last_view_angle[0], this.last_view_angle[1], this.last_view_angle[2]);
		Nova_SetPosition(this.last_position);
	};
	this.mouseMove = function(dx, dy) {
		if (current_screen != screens.main_menu)
			return;
		this.yaw = Math.min(Math.max(this.yaw - 0.0075 * dx, this.min_yaw), this.max_yaw);
		this.pitch = Math.min(Math.max(this.pitch - 0.0075 * dy, this.min_pitch), this.max_pitch);
		Nova_SetViewAngle3f(this.yaw, this.pitch, 0);
		drawBackground();
	};
	this.changeImage = function() {
		var randNext = function(i) {
			return (1 + i + (rand() % 2)) % 3;
		};

		if (this.fade_interval)
			return;

		var next = randNext(this.current_images[this.next_change]);
		if (!world_images[this.next_change][next].complete)
			return;

		this.current_images[this.next_change] = next;
		this.fade_index = this.next_change;
		this.fades[this.fade_index].src = world_images[this.next_change][next].src;
		this.fades[this.fade_index].style.visibility = 'visible';
		this.fades[this.fade_index].style.opacity = 0;
		this.fade_opacity = 0;
		var _this = this;
		this.fade_interval = setInterval(function() {
			_this.fadeImage();
		}, 14);
		this.next_change = randNext(this.next_change);
	};
	this.fadeImage = function() {
		this.fade_opacity = Math.min(0.01 + this.fade_opacity, 1);
		if (this.fade_opacity == 1)
			this.finishFade();
		else
			this.fades[this.fade_index].style.opacity = this.fade_opacity;
	};
	this.finishFade = function() {
		clearInterval(this.fade_interval);
		this.fade_interval = 0;
		this.fades[this.fade_index].style.opacity = 0;
		this.worlds[this.fade_index].src = this.fades[this.fade_index].src;
		this.fades[this.fade_index].style.visibility = 'hidden';
	};
};
var menu_mode;

var game_mode = {
	enter: function() {
	 	gl.enable(gl.DEPTH_TEST);
		mouse.freeview = false;
		mouse.dragging = false;
	}, mouseMove: function(dx, dy) {
		Level_MouseMove(1.5*dx, 1.5*dy);
	}, onresize: function() {
		if (next_thing_to_do != play)
			drawFrame();
	}
};

var init = function() {
	if (!city_panorama) {
		city_panorama = {top: document.getElementById('city-top'),
		                 bottom: document.getElementById('city-bottom'),
		                 right: document.getElementById('city-right'),
		                 back: document.getElementById('city-back')};
	}
	if (!world_images) {
		world_images = [[],[],[]];
		for (var i = 1; i <= 3; i++) {
			world_images[0].push(document.getElementById('easy-world-' + i));
			world_images[1].push(document.getElementById('hard-world-' + i));
			world_images[2].push(document.getElementById('absurd-world-' + i));
		}
	}

	if (!city_panorama.top.complete || !city_panorama.bottom.complete
	    || !city_panorama.right.complete || !city_panorama.back.complete)
	{
		setTimeout(init, 64);
		return;
	}
	for (var i = 0; i < 3; i++) {
		for (var j = 0; j < 3; j++) {
			if (!world_images[i][j].complete) {
				setTimeout(init, 64);
				return;
			}
		}
	}

	document.getElementById('loading').style.display = 'none';

	progress_title = document.getElementById('progress-title');
	progress_screenshot = document.getElementById('progress-screenshot');
	progress_spinner = document.getElementById('progress-spinner');
	progress_bar = document.getElementById('progress-bar');
	resume_game_btn = document.getElementById('resume-game');

	canvas = document.getElementById('canvas');
	song = document.getElementById('song');

	level_names = ['none', 'tutorial', 'temple', 'pavilion', 
	               'clubhouse', 'palace', 'catacombs',
	               'tomb', 'villa', 'courtyard'];
	level_titles = ['', 'Tutorial', 'Greek Temple', 'Mayan Pavilion',
	                'Modern Clubhouse', 'Roman Palace', 'Mayan Catacombs',
	                'Mayan Tomb', 'Modern Villa', 'Greek Courtyard'];

	msgboxes = {move_instructions: document.getElementById('move-instructions-msgbox'),
				next_level: document.getElementById('next-level-msgbox'),
				confirm_new_game: document.getElementById('confirm-new-game-msgbox'),
				pick_level: document.getElementById('pick-level-msgbox'),
				simple: document.getElementById('simple-msgbox'),
	            no_webgl: document.getElementById('no-webgl-msgbox')};

	msgboxes.move_instructions.onok = msgboxes.move_instructions.oncancel = function() {
		messageBox(0);
		startPlaying();
	};

	msgboxes.next_level.onok = function() {
		messageBox(0);
		localStorage.level = 1 + current_level;
		resumeGame();
	};
	msgboxes.next_level.oncancel = function() {
		messageBox(0);
		window.location.hash = '#menu';
	};

	msgboxes.confirm_new_game.onok = function() {
		messageBox(0);
		next_game.confirmed = true;
		newGame();
	};
	msgboxes.confirm_new_game.oncancel = function() {
		messageBox(0);
		next_game = {};
	};

	msgboxes.pick_level.table_row = document.getElementById('pick-level-table-row');
	msgboxes.pick_level.onok = function() {};
	msgboxes.pick_level.onchoose = function(level) {
		messageBox(0);
		next_game.level = next_game.first_level + level;
		newGame();
	};
	msgboxes.pick_level.oncancel = function() {
		messageBox(0);
		next_game = {};
	};

	msgboxes.simple.text = document.getElementById('simple-msgbox-text');
	msgboxes.simple.onok = msgboxes.simple.oncancel = function() {
		messageBox(0);
	};

	try {
		gl = canvas.getContext("webgl", {alpha: false})
		     || canvas.getContext("experimental-webgl", {alpha: false});
	} catch (e) {
		gl = 0;
	}
	if (!gl) {
		canvas.style.display = 'none';
		showLayer(msgboxes.no_webgl, true);
		return;
	}

	// gl = WebGLDebugUtils.makeDebugContext(gl);
	gl.TRUE = true;
	gl.FALSE = false;

	Nova_Initialize();
	Nova_SetViewAngle3f(0, 0, 0);
	Nova_SetPosition3f(0, 0, 0)
	Words_Initialize();
	Stars_Initialize();
	Spikes_Initialize();
	Sound_Initialize();
	Models.initialize();
	Balls_Initialize();

	gl.depthMask(gl.TRUE);
	gl.disable(gl.BLEND);
 	checkGlErrors();

	canvas.fitToWindow = function() {
		if (window.innerWidth != canvas.width || window.innerHeight != canvas.height) {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			Nova_ConfigureViewportGL(canvas.width, canvas.height, 90);
			Level_ViewportChanged();
		}
	};
	canvas.fitToWindow();

	menu_mode = new MenuMode();
	screens = {main_menu: document.getElementById('main-menu'),
	           level_loader: document.getElementById('level-loader'),
	           game: document.getElementById('game')};

	screens.main_menu.mode = screens.level_loader.mode = menu_mode;
	screens.main_menu.enter = function() {
		resume_game_btn.style.display = localStorage.saved_game ? 'block' : 'none';
	};
	screens.game.mode = game_mode;

	Keyboard_MapKey('W'.charCodeAt(0), ekForward);
	Keyboard_MapKey('A'.charCodeAt(0), ekLeft);
	Keyboard_MapKey('S'.charCodeAt(0), ekBack);
	Keyboard_MapKey('D'.charCodeAt(0), ekRight);

	Keyboard_MapKey(KEYBOARD_UP_ARROW, ekForward);
	Keyboard_MapKey(KEYBOARD_DOWN_ARROW, ekBack);
	Keyboard_MapKey(KEYBOARD_LEFT_ARROW, ekTurnLeft);
	Keyboard_MapKey(KEYBOARD_RIGHT_ARROW, ekTurnRight);

	Keyboard_MapKey(KEYBOARD_RIGHT_MOUSE_BUTTON, ekForward);

	Level_SetGameListener({
		blockBroken: function(type) {
			if (type == ekCheckpoint)
				saveGame();
		}, cleared: function() {
			localStorage['has_beaten_level_' + current_level] = true;

			delete localStorage.saved_game;
			delete localStorage.level;

			next_thing_to_do = function() {
				Music_Kill();
				setScreen(0);
				if (current_level % 3 != 0)
					messageBox(msgboxes.next_level);
				else
					window.location.hash = '#menu';
			};
		}
	});

	if (location.hash != '#game')
		setScreen(screens.main_menu);
	else if (localStorage.level)
		resumeGame();
}

var next_game = {};
newGame = function(world) {
	if (world)
		next_game.world = world;

	if (next_game.world == 'hard' && !localStorage.has_beaten_level_1) {
		messageBox("World 2 is locked until you beat World 1, Level 1");
		next_game = {};
		return;
	}
	if (next_game.world == 'absurd' && !localStorage.has_beaten_level_6) {
		messageBox("World 3 is locked until you beat World 2");
		next_game = {};
		return;
	}

	if (localStorage.saved_game && !next_game.confirmed) {
		messageBox(msgboxes.confirm_new_game);
		return;
	}

	if (!next_game.level) {
		next_game.first_level = (function() {
			switch (next_game.world) {
				case 'easy': return 1;
				case 'hard': return 4;
				case 'absurd': return 7;
			}
			return 1;
		})();

	
		if (localStorage['has_beaten_level_' + next_game.first_level]) {
			var html = '';
			for (var i = 0; i < 3; i++) {
				var level = i + next_game.first_level;
				if (i && !localStorage['has_beaten_level_' + (level-1)])
					break;
				html += '<td><a href=\'javascript:current_msgbox.onchoose(' + i + ')\'><img src=\'images/screenshots/' + level_names[level] + '-thumb.jpg\' /></a></td>';
			}
			msgboxes.pick_level.table_row.innerHTML = html;
			messageBox(msgboxes.pick_level);
			return;
		}	
		
		next_game.level = next_game.first_level;
	}

	localStorage.level = next_game.level;
	delete localStorage.saved_game;
	next_game = {};

	window.location.hash = '#game';
};

resumeGame = function() {
	if (!localStorage.level) {
		window.location.hash = '#menu';
		return;
	}

	if (localStorage.saved_game && current_level == localStorage.level) {
		Music_Play();
		startPlaying();
		return;
	}

	current_level = parseInt(localStorage.level);
	var level_name = level_names[current_level];

	var atlas = (function() {
		switch (level_name) {
			case 'pavilion':
			case 'tomb':
				return 'mayan';
			case 'catacombs':
				return 'mayan-squashed';
			default:
				return 'greek';
		}
	})();

	var song = (function() {
		switch (level_name) {
			case 'tutorial':
			case 'villa':
				return 'palmtree';
			case 'temple':
			case 'courtyard':
				return 'smash';
			case 'pavilion':
			case 'catacombs':
			case 'tomb':
				return 'flute-man';
			case 'clubhouse':
				return 'rhino';
			case 'palace':
				return 'pretty-song';
		}
	})();

	setScreen(screens.level_loader);
	startProgress(level_name, 1 + (localStorage.level - 1) % 3, level_titles[current_level]);
	Music_Load(song);
	Level_SetLevel(level_name, 'images/atlases/' + atlas + '.jpg', setProgress, current_state, function(map) {
		if (localStorage.saved_game) {
			psParse({}, function(param, tag, length) {
				switch (tag) {
				case ekLevelStateTag:
					Level_Restore(length);
					break;
				case ekMusicStateTag:
					Music_Restore();
					break;
				};
			}, psOpenForRead(localStorage.saved_game));
		}
		Music_Play();
		Keyboard_Reset();
		startPlaying();
	});
};

var startPlaying = function() {
	frame_time.last_time = frame_time.spf = 0;
	setScreen(screens.game);
	(next_thing_to_do = play)();
};

var stopPlaying = function() {
	saveGame();
	Music_Pause();
	var old_thing_to_do = next_thing_to_do;
	next_thing_to_do = function() { setScreen(screens.main_menu) };
	if (old_thing_to_do != play)
		setTimeout(next_thing_to_do, 0);
};

var saveGame = function() {
	if (current_level != localStorage.level)
		return;

	Level_WillTerminate();

	if (current_level != localStorage.level)
		return;

	psBeginWrite();
	psBegin(ekLevelStateTag);
		Level_Persist();
	psEnd(ekLevelStateTag);
	psBegin(ekMusicStateTag);
		Music_Persist();
	psEnd(ekMusicStateTag);
	localStorage.saved_game = psEndWrite();
};

var showMoveInstructions = function() {
	setTimeout(function() {
		if (next_thing_to_do != play)
			return;
		next_thing_to_do = function() {
			messageBox(msgboxes.move_instructions);
		};
	}, 100);
};

var current_progress;
var startProgress = function(level_name, current_level, level_title) {
	progress_title.innerHTML = 'Level ' + current_level + ' of 3 - ' + level_title;
	progress_screenshot.onload = function() {
		progress_screenshot.onload = function() {};
		progress_screenshot.src = 'images/screenshots/' + level_name + '.jpg';
	};
	progress_screenshot.src = progress_spinner.src;
	progress_bar.style.width = 0;
	current_progress = 0;
};

var setProgress = function(progress) {
	if (progress < .01)
		return;

	if (progress <= current_progress)
		return;

	current_progress = progress;
	progress_bar.style.width = (100 * current_progress) + '%';
};

var fps = {
	frames:0,
	milliseconds:0,
	last_time:0
};
var doFps = function(time) {
	if (fps.last_time) {
		fps.frames++;
		fps.milliseconds += time - fps.last_time;
		if (fps.milliseconds > 1000) {
			console.log((1000 * fps.frames / fps.milliseconds).toFixed(2) + ' FPS');
			fps.frames = fps.milliseconds = 0;
		} 
	}
	fps.last_time = time;
}
