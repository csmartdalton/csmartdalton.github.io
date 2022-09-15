<html>

<head>
<title>Learning WebGL &mdash; lesson 1</title>
<meta http-equiv="content-type" content="text/html; charset=ISO-8859-1">

<script type="text/javascript" src="mat.js"></script>


<script id="shader-vs" type="x-shader/x-vertex">
    attribute vec2 pos;
    attribute vec2 texcoord;
	varying vec2 coord;
    void main(void) {
        gl_Position = vec4(pos,1,1);
		coord = texcoord;
    }
</script>

<script id="shader-fs" type="x-shader/x-fragment">
    precision highp float;
	uniform sampler2D tex;
	varying vec2 coord;
    void main(void) {
		float pi = 3.1416926535897932384626433832795029941971693993751058;
		vec3 pos;
		pos.xy = 2.0*coord - 1.0;
		pos.z = sqrt(1.0 - dot(pos.xy,pos.xy));

		float theta = asin(length(pos.xy));
		float offset = theta/pi;
		vec2 texcoord = vec2(0.5) + offset * normalize(pos.xy);

        gl_FragColor = texture2D(tex,texcoord);
    }
</script>

<script type="text/javascript">

    var gl;
    function initGL(canvas) {
        try {
            gl = canvas.getContext("experimental-webgl", {depth:false});
//alert('gl is ' + gl);
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        } catch (e) {
alert('oh dear i died');
        }
        if (!gl) {
            alert("Could not initialise WebGL, sorry :-(");
        }
    }

    function getShader(gl, id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            return null;
        }

        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;
        }

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

//alert('Testing shader ' + id + ':\n' + gl.getShaderSource(shader));
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert('Shader ' + id + ' messed up');
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }


    var shaderProgram;

    function initShaders() {
	//alert('making shaders');
        var fragmentShader = getShader(gl, "shader-fs");
        var vertexShader = getShader(gl, "shader-vs");

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        } else {
            //alert('LINKED SUCCESSFULLY!');
        }

        gl.useProgram(shaderProgram);

		gl.uniform1i(gl.getUniformLocation(shaderProgram, "tex"), 0);
        shaderProgram.pos = gl.getAttribLocation(shaderProgram, "pos");
        shaderProgram.texcoord = gl.getAttribLocation(shaderProgram, "texcoord");
        gl.enableVertexAttribArray(shaderProgram.pos);
        gl.enableVertexAttribArray(shaderProgram.texcoord);
    }

	function initTexture(url) {
		var image = new Image();
		image.onload = function() {
			tex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		}
		image.src = url;
	}

    function webGLStart() {
        var canvas = document.getElementById("lesson01-canvas");
        initGL(canvas);
        initShaders();
		initTexture('/images/ball7.jpg');

		var verts = [-1,+1,
		             +1,+1,
		             +1,-1,
		             -1,-1];
		var buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
		gl.vertexAttribPointer(shaderProgram.pos,2,gl.FLOAT,false,0,0);

		var coords = [0,0,
		              1,0,
		              1,1,
		              0,1];
		var buf2 = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf2);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW);
		gl.vertexAttribPointer(shaderProgram.texcoord,2,gl.FLOAT,false,0,0);

		setTimeout(function() {
			gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			setTimeout(arguments.callee, 100);
		}, 100);
    }


</script>


</head>


<body onload="webGLStart();" style="padding:0;margin:0">

    <canvas id="lesson01-canvas" style="border: none; margin:0; padding:0; width:1024; height:1024" width="4096" height="4096"></canvas>

</body>

</html>



