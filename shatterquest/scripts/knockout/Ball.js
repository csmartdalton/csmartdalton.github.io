var ballVertexBuffer;

var ball_program = {};
ball_program.vert_shader =
	"const float ambient_light = 0.75;" +
	"const float light_color = 0.25;" +

	"uniform vec3 light_dir;" +
	"uniform mat3 rotation;" +
	"uniform mat4 mvp_matrix;" +

	"attribute vec3 vertex_pos;" +
	"attribute vec2 vertex_texcoord;" +

	"varying vec2 texcoord;" +
	"varying float light;" +

	"void main(void)" +
	"{" +
	"	vec3 vertex = rotation * vertex_pos;" +
	"	light = ambient_light + abs(dot(vertex, light_dir)) * light_color;" +
	"	texcoord = vertex_texcoord;" +
	"	gl_Position = mvp_matrix * vec4(vertex, 1);" +
	"}";
ball_program.frag_shader =
	"precision highp float;" +

	"uniform sampler2D tex;" +
	"uniform vec3 color;" +

	"varying vec2 texcoord;" +
	"varying float light;" +

	"void main (void)" +
	"{" +
	"	gl_FragColor = vec4(light * color * texture2D(tex,texcoord).xyz, 1);" +
	"}";

var ball_program_simple = {};
ball_program_simple.vert_shader =
	"const float ambient_light = 0.75;" +
	"const float light_color = 0.25;" +

	"uniform vec3 light_dir;" +
	"uniform mat4 mvp_matrix;" +

	"attribute vec3 vertex_pos;" +

	"varying float light;" +

	"void main(void)" +
	"{" +
	"	light = ambient_light + abs(dot(vertex_pos, light_dir)) * light_color;" +
	"	gl_Position = mvp_matrix * vec4(vertex_pos, 1);" +
	"}";
ball_program_simple.frag_shader =
	"precision highp float;" +

	"uniform vec3 color;" +

	"varying float light;" +

	"void main (void)" +
	"{" +
	"	gl_FragColor = vec4(light * color, 1);" +
	"}";

function Balls_Initialize()
{
	ballVertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, ballVertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ballVertices), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	for (var i = 0; i < ballModels.length; i++) {
        ballModels[i].indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ballModels[i].indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ballModels[i].indices), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}

	checkGlErrors();
	ball_program.id = compile(ball_program.vert_shader, ball_program.frag_shader);
	ball_program.vertex_ptr = gl.getAttribLocation(ball_program.id,"vertex_pos");
	ball_program.texcoord_ptr = gl.getAttribLocation(ball_program.id,"vertex_texcoord");
	ball_program.arrays = [ball_program.texcoord_ptr, ball_program.vertex_texcoord];
	ball_program.matrix = gl.getUniformLocation(ball_program.id, "mvp_matrix");
    ball_program.light_dir = gl.getUniformLocation(ball_program.id, "light_dir");
    ball_program.rotation = gl.getUniformLocation(ball_program.id, "rotation");
    ball_program.color = gl.getUniformLocation(ball_program.id, "color");
    Nova_UseProgram(ball_program);
	gl.uniform1i(gl.getUniformLocation(ball_program.id, "tex"), 0);
    Nova_EndSpecialDraw();
	checkGlErrors();

	checkGlErrors();
	ball_program_simple.id = compile(ball_program_simple.vert_shader, ball_program_simple.frag_shader);
	ball_program_simple.vertex_ptr = gl.getAttribLocation(ball_program_simple.id, "vertex_pos");
	ball_program_simple.arrays = [ball_program_simple.vertex_ptr];
	ball_program_simple.matrix = gl.getUniformLocation(ball_program_simple.id, "mvp_matrix");
    ball_program_simple.light_dir = gl.getUniformLocation(ball_program_simple.id, "light_dir");
    ball_program_simple.color = gl.getUniformLocation(ball_program_simple.id, "color");
	checkGlErrors();
}

function Balls_Begin()
{
	Nova_LoadModelMatrix();
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);
	gl.bindBuffer(gl.ARRAY_BUFFER, ballVertexBuffer);
}

function Balls_End()
{
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
    Nova_LoadScreenMatrix();
	Nova_EndSpecialDraw();
	gl.disable(gl.CULL_FACE);
}

function Balls_Draw(sprite)
{
	var r = Nova_PointSpriteOnScreenRadius(sprite);
	var area = 4 * Math.PI * r * r;
	var desired_faces = area / 8;
	var index = 0;
	for (;; index++) {
		if (index == ballModels.length - 1
		    || ballModels[index].faceCount >= desired_faces)
			break;
	}

    var ball = ballModels[index];

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ball.indexBuffer);

    if (sprite.primitive.pTexture) {
	    Nova_UseProgram(ball_program);
	    gl.bindTexture(gl.TEXTURE_2D, sprite.primitive.pTexture.texGL);
        gl.uniform3fv(ball_program.light_dir, Level_GetLevel().map.lightDir);
        var T = new Float32Array(9);
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++)
                T[3*i + j] = sprite.T[i][j];
        }
        gl.uniformMatrix3fv(ball_program.rotation, false, T);
        gl.uniform3f(ball_program.color, sprite.primitive.color[0], sprite.primitive.color[1], sprite.primitive.color[2]);
        gl.vertexAttribPointer(ball_program.vertex_ptr, 3, gl.FLOAT, false, 5*4, 0);
	    gl.vertexAttribPointer(ball_program.texcoord_ptr, 2, gl.FLOAT, false, 5*4, 3*4);
    } else {
        Nova_UseProgram(ball_program_simple);
        gl.uniform3fv(ball_program_simple.light_dir, Level_GetLevel().map.lightDir);
        gl.uniform3f(ball_program_simple.color, sprite.primitive.color[0], sprite.primitive.color[1], sprite.primitive.color[2]);
        gl.vertexAttribPointer(ball_program.vertex_ptr, 3, gl.FLOAT, false, 5*4, 0);
    }

	Nova_PushMatrix();
	Nova_Translate(sprite.position[0], sprite.position[1], sprite.position[2]);
	Nova_Scale(sprite.radius, sprite.radius, sprite.radius);
	gl.drawElements(gl.TRIANGLES, 3*ball.faceCount, gl.UNSIGNED_SHORT, 0);
	Nova_PopMatrix();
}
