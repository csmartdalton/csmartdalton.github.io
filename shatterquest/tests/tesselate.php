<script type='text/javascript'>
	var tri1, tri2;
	function initTest() {
		tri1 = {verts:gl.createBuffer(),
	                    inds:gl.createBuffer()};
		gl.bindBuffer(gl.ARRAY_BUFFER, tri1.verts);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-2,2,-1, -1,2,1, 0,2,-1]), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tri1.inds);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2]), gl.STATIC_DRAW);
	
		tri2 = {vertex:[[0,2,-1], [1,2,1], [2,2,-1]],
		        sides:3,
		        plane:{normal:[0,-1,0], k:-2}};
	}
	function tesselationTest() {
		Nova_BeginSolidColor(1,1,1,1);
		Nova_LoadModelMatrix();
		gl.bindBuffer(gl.ARRAY_BUFFER, tri1.verts);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tri1.inds);
		Nova_VertexPointer(3, gl.FLOAT, false, 0, 0);
		gl.outlineElements(gl.TRIANGLES,3,gl.UNSIGNED_SHORT,0);
	
		Tesselator.begin(512);
		Tesselator.draw(tri2);
		Tesselator.end();
	}
</script>

<?
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

<canvas id='canvas' style='border: none;'></canvas>
<div id="fps-counter"> 
	FPS: <span id="fps">0</span> 
</div>

<script type='text/javascript' src='/scripts/common.js'></script>
<script type='text/javascript' src='/scripts/knockout/Vector.js'></script>
<script type='text/javascript' src='/scripts/knockout/Nova.js'></script>
<script type='text/javascript' src='/scripts/knockout/Keyboard.js'></script>
<script type='text/javascript' src='/scripts/knockout/Tesselator.js'></script>
<script type='text/javascript'>
	window.forward = window.side = window.up = 0;
	function Level_MoveForward(dir)
	{
		window.forward = -.01* dir;
	}

	function Level_MoveSide(dir)
	{
		window.side = -.01*dir;
	}

	function Level_MoveUp(dir)
	{
		window.up = -.01*dir;
	}


	var cheat = false;
	var funball = function() {
		ball.texture = loadTexture('/images/ball2.png',true,true,gl.CLAMP_TO_EDGE);
		ball.sphere.primitive.pTexture = ball.texture;
	};

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
	window.yaw = 90;
	window.pitch = 0;
	window.onmousemove = function(event) {
		if (mouse.dragging != mouse.freeview) {
			mouse.dx3 = mouse.dx2, mouse.dy3 = mouse.dy2;
			mouse.dx2 = mouse.dx1, mouse.dy2 = mouse.dy1;
			mouse.dx1 = event.pageX - mouse.last_x;
			mouse.dy1 = event.pageY - mouse.last_y;

			var dx = (mouse.dx1 + mouse.dx2 + mouse.dx3) / 3;
			var dy = (mouse.dy1 + mouse.dy2 + mouse.dy3) / 3;
			window.yaw -= .3*dx;
			window.pitch -= .3*dy;
			Nova_SetViewAngle3f(window.yaw, window.pitch, 0);
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
			window.saved_game = psEndWrite();
		}
		if (event.keyCode == 0x20) {
			Level_MoveUp(1);
		}
		if (event.keyCode == 'X'.charCodeAt(0)) {
			Level_MoveUp(-1);
		}
	};
	window.onkeyup = function(event) {
		Keyboard_KeyReleased(event.keyCode);
		if (event.keyCode == 0x20) {
			Level_MoveUp(0);
		}
		if (event.keyCode == 'X'.charCodeAt(0)) {
			Level_MoveUp(0);
		}
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
		
		checkGlErrors();

		canvas.fitToWindow();
		
		Nova_SetPosition(
				vec3.add(position,
				vec3.add(vec3.scale(window.forward, zPlane.normal),
			    vec3.add(vec3.scale(window.side, xPlane.normal),
		                 vec3.scale(window.up, yPlane.normal)))));

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		tesselationTest();

		setTimeout(play,0);
	}
	
	function start() {
		canvas = document.getElementById('canvas');

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
		Nova_SetViewAngle3f(window.yaw,window.pitch,0);
		Nova_SetPosition([0,0,0]);
		Tesselator.initialize();
		initTest();

		gl.depthMask(gl.TRUE);
		gl.disable(gl.BLEND);
	 	gl.enable(gl.DEPTH_TEST);
	 	checkGlErrors();

		canvas.fitToWindow = function() {
			if (window.innerWidth != canvas.width || window.innerHeight != canvas.height) {
				canvas.width = window.innerWidth;
				canvas.height = window.innerHeight;
				Nova_ConfigureViewportGL(canvas.width, canvas.height, 90);
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

		play();
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

