<?
	function getOption($name) {
		return array_key_exists($name,$_REQUEST) ? 'true' : 'false';
	}
	
	function getLevel() {
		$levels = array(1 => 'tutorial', 2 => 'temple', 3 => 'pavilion', 4 => 'clubhouse', 5 => 'palace', 6 => 'catacombs', 7 => 'tomb', 8 => 'villa', 9 => 'courtyard');
		$level = $_REQUEST['level'];
		if (array_key_exists($level,$levels))
			return $levels[$level];
		return $level;
	}

	function getAtlas() {
		switch (getLevel()) {
			case 'pavilion':
			case 'tomb':
				return 'mayan';
			case 'catacombs':
				return 'mayan-squashed';
			default:
				return 'greek';
		}
	}

	function getSong() {
		switch (getLevel()) {
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
	}
?>

<html>
<head>
<style type="text/css">
	#loader {
		text-align: center;
		position: absolute;
		top: 50%;
		left: 0px;
		width: 100%;
		height: 1px;
		overflow: visible;
		visibility: visible;
		display: block
	}
	#progress-container {
		margin-left: -300px;
		position: absolute;
		top: -35px;
		left: 50%;
		width: 600px;
		height: 70px;
		visibility: visible
	}
	#fps-counter {
		position: absolute;
		top: 5px;
		right: 5px;
		z-index: 2;
		color: white;
		border: 1px solid #6699FF;
		background-color: #3355FF;
		opacity: 0.5;
		-moz-border-radius: 5px;
		-webkit-border-radius: 5px;
		padding: 5px;
		min-width: 75px;
		text-align: center;
		font-family: verdana;
		font-size: 11pt;
	}
</style>
</head>

<body style='margin:0; padding:0' onload='start()'>

<div id='loader'>
	<div id='progress-container'>
		<textarea rows="1" cols="66" id="progress">&gt;																|</textarea>
		<script type='text/javascript'>
			var setProgress = function(progress) {
				var eqs = 64*progress;
				var i = 0;
				var text = '';
				for (; i < eqs; i++)
					text += '=';
				text += '>'
				for (; i < 64; i++)
					text += ' ';
				text += '|';
				document.getElementById('progress').value = text; 
			};
		</script>
	</div>
</div>

<audio id='song' loop></audio>

<div id='game' style='display:none'>
	<canvas id='canvas' style='border: none;'></canvas>
	<div id="fps-counter"> 
		FPS: <span id="fps">0</span> 
	</div>
</div>

<script type='text/javascript' src='/scripts/download-file.js'></script>
<script type='text/javascript' src='/scripts/base64.js'></script>
<script type='text/javascript' src='/scripts/data-stream.js'></script>
<script type='text/javascript' src='/scripts/load-texture.js'></script>
<script type='text/javascript' src='/scripts/file-parser.js'></script>
<script type='text/javascript' src='/scripts/sound.js'></script>
<script type='text/javascript' src='/scripts/storage.js'></script>
<script type='text/javascript' src='/scripts/common.js'></script>
<script type='text/javascript' src='/scripts/knockout/Vector.js'></script>
<script type='text/javascript' src='/scripts/knockout/Nova.js'></script>
<script type='text/javascript' src='/scripts/knockout/Blocks.js'></script>
<script type='text/javascript' src='/scripts/knockout/BSP.js'></script>
<script type='text/javascript' src='/scripts/knockout/MovingBlocks.js'></script>
<script type='text/javascript' src='/scripts/knockout/Decorators.js'></script>
<script type='text/javascript' src='/scripts/knockout/Words.js'></script>
<script type='text/javascript' src='/scripts/knockout/Stars.js'></script>
<script type='text/javascript' src='/scripts/knockout/Spikes.js'></script>
<script type='text/javascript' src='/scripts/knockout/Level.js'></script>
<script type='text/javascript' src='/scripts/knockout/Keyboard.js'></script>
<script type='text/javascript' src='/scripts/knockout/Puzzles.js'></script>
<script type='text/javascript' src='/scripts/knockout/Signs.js'></script>
<script type='text/javascript' src='/scripts/knockout/Font.js'></script>
<script type='text/javascript' src='/scripts/knockout/Models.js'></script>
<!--<? if (getOption('tesselate') == 'true'): ?>
<script type='text/javascript' src='/scripts/knockout/Tesselator.js'></script>
<? endif; ?>-->
<script type='text/javascript'>

	var cheat = <?= getOption('cheat') ?>;
//	var tesselate = <?= getOption('tesselate') ?>;

	var canvas, gl, song;
	var mouse = {
		x:0, y:0,
		dx1:0, dx2:0, dx3:0,
		dy1:0, dy2:0, dy3:0,
		dragging:false,
		freeview:false
	};
	window.onmousedown = function(event) {
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
	window.onmousemove = function(event) {
		if (mouse.dragging != mouse.freeview) {
			mouse.dx3 = mouse.dx2, mouse.dy3 = mouse.dy2;
			mouse.dx2 = mouse.dx1, mouse.dy2 = mouse.dy1;
			mouse.dx1 = event.pageX - mouse.last_x;
			mouse.dy1 = event.pageY - mouse.last_y;

			var dx = (mouse.dx1 + mouse.dx2 + mouse.dx3) / 3;
			var dy = (mouse.dy1 + mouse.dy2 + mouse.dy3) / 3;
			Level_MouseMove(1.5*dx,1.5*dy);
		}
		mouse.last_x = event.pageX;
		mouse.last_y = event.pageY;
		event.preventDefault();
		event.stopPropagation();
		return false;
	};
	window.onmouseup = function(event) {
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
	window.ondblclick = function(event) {
		mouse.freeview = !mouse.freeview;
		event.preventDefault();
		event.stopPropagation();
		return false;
	};
	window.onmouseout = function(event) {
		mouse.dragging = false;
	};
	window.oncontextmenu = function(event) {
		event.preventDefault();
		event.stopPropagation();
		return false;
	};
	window.onkeydown = function(event) {
		Keyboard_KeyPressed(event.keyCode);

		if (event.keyCode == 'P'.charCodeAt(0)) {
			Level_WillTerminate();
			psBeginWrite();
			Level_Persist();
			localStorage.saved_game = psEndWrite();
		}
		if (cheat && event.keyCode == 0x20) {
			Level_FlipZ();
		}
		if (event.keyCode == 'L'.charCodeAt(0)) {
			if (localStorage.saved_game)
				Level_Restore(psOpenForRead(localStorage.saved_game));
		}
	};
	window.onkeyup = function(event) {
		Keyboard_KeyReleased(event.keyCode);
	};

	var frame_time = {
		last_time: 0,
		spf: 0
	};
	function play() {
		var time = new Date().getTime();
		doFps(time);
		if (frame_time.last_time)
			frame_time.spf = 0.5*frame_time.spf + 0.5*(time - frame_time.last_time)/1000;
		frame_time.last_time = time;
		
		//checkGlErrors();

		canvas.fitToWindow();

		Level_NextFrame(frame_time.spf,1.1);
		Level_Render();
		gl.clear(gl.DEPTH_BUFFER_BIT);
		Level_Draw();

		gl.enable(gl.BLEND);
		gl.disable(gl.DEPTH_TEST);
		Level_DrawOverlay();
		gl.enable(gl.DEPTH_TEST);
		gl.disable(gl.BLEND);

		setTimeout(play,0);
	}
	
	function start() {
		canvas = document.getElementById('canvas');
		song = document.getElementById('song');

		try {
			gl = canvas.getContext("experimental-webgl", {
				alpha: false
			});
		} catch (e) {
			gl = null;
		}
		if (!gl) {
			alert('Could not initialize WebGL, sorry :-(');
		}
		gl.TRUE = true;
		gl.FALSE = false;

		Nova_Initialize();
		Words_Initialize();
		Stars_Initialize();
		Spikes_Initialize();
		Models.initialize();
//		if (tesselate)
//			Tesselator.initialize();

		gl.depthMask(gl.TRUE);
		gl.disable(gl.BLEND);
	 	gl.enable(gl.DEPTH_TEST);
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

		Keyboard_MapKey('W'.charCodeAt(0), ekForward);
		Keyboard_MapKey('A'.charCodeAt(0), ekLeft);
		Keyboard_MapKey('S'.charCodeAt(0), ekBack);
		Keyboard_MapKey('D'.charCodeAt(0), ekRight);

		Keyboard_MapKey(KEYBOARD_UP_ARROW, ekForward);
		Keyboard_MapKey(KEYBOARD_DOWN_ARROW, ekBack);
		Keyboard_MapKey(KEYBOARD_LEFT_ARROW, ekTurnLeft);
		Keyboard_MapKey(KEYBOARD_RIGHT_ARROW, ekTurnRight);

		Keyboard_MapKey(KEYBOARD_RIGHT_MOUSE_BUTTON, ekForward);

		Level_SetLevel('<?= getLevel() ?>', '/images/atlases/<?= getAtlas() ?>.jpg', setProgress, function(map) {
			Music_Load('<?= getSong() ?>');
			document.getElementById('loader').style.display = 'none';
			document.getElementById('game').style.display = 'block';
			Keyboard_Reset();
			play();			
		});
	}

	var fps = {
		frames:0,
		milliseconds:0,
		last_time:0
	};
	function doFps(time) {
		if (fps.last_time) {
			fps.frames++;
			fps.milliseconds += time - fps.last_time;
			if (fps.milliseconds > 1000) {
				document.getElementById('fps').innerHTML = Math.round(1000 * fps.frames / fps.milliseconds);
				fps.frames = fps.milliseconds = 0;
			} 
		}
		fps.last_time = time;
	}
</script>

</body></html>

