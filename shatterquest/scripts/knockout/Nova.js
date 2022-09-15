var Nova_fHorizontal = 0x001;
var Nova_fyVertical = 0x002;
var Nova_fxVertical = 0x004;
var Nova_fPanorama = 0x008;
var Nova_fOrthogonal = 0x010;
var Nova_fCullFront = 0x020;
var Nova_fCullBack = 0x040;
var Nova_fSphere = 0x080;
var Nova_fNoRepeat = 0x100;
var Nova_fTransparent = 0x200;
var Nova_fInvisible = 0x400;

var position = [0,0,0];
var xPlane = {}, yPlane = {}, zPlane = {};

var ScreenWidth, ScreenHeight, ScanlineWidth, ScanlinePadding;
var Rotate = 0;
var yScreenMiddle, xScreenMiddle, xMapToScreenConstant, yMapToScreenConstant,
      xScreenToMapConstant, yScreenToMapConstant;

var clipNear = 0.01, clipFar = 55;

var PanoramaDistance = 64;
var PanoramaPolygonCount = 6;
var PanoramaVertexCount = (PanoramaPolygonCount * 4);
var PanoramaPolygon = new Array(PanoramaPolygonCount);
var PanoramaVertex = new Array(PanoramaVertexCount);
var PanoramaGlVerts = new Array(PanoramaVertexCount);
var PanoramaVbos;
var PanoramaVertexOffset = [
	[-.5, -.5, .5],
	[.5, -.5, .5],
	[.5, .5, .5],
	[-.5, .5, .5], // top
	[.5, -.5, -.5],
	[-.5, -.5, -.5],
	[-.5, .5, -.5],
	[.5, .5, -.5], // bottom
	[-.5, -.5, -.5],
	[-.5, -.5, .5],
	[-.5, .5, .5],
	[-.5, .5, -.5], // left
	[.5, -.5, .5],
	[.5, -.5, -.5],
	[.5, .5, -.5],
	[.5, .5, .5], // right
	[-.5, .5, -.5],
	[-.5, .5, .5],
	[.5, .5, .5],
	[.5, .5, -.5], // front
	[-.5, -.5, .5],
	[-.5, -.5, -.5],
	[.5, -.5, -.5],
	[.5, -.5, .5] // back
];

var glPolys = new Array(65536);
var glPolyCount = 0;

var projection_matrix = mat4.identity;
var modelview_matrix = mat4.identity;
var modelview_projection_matrix = mat4.identity;

var textureScale = 512.0;

function Polygon_New()
{
	var poly = {
		plane: {normal:[]},
		vertex: [],
		edgeNormals: []
	};
	poly.primitive = poly;
	return poly;
};
function Polygon_Clone(poly)
{
	var ret = shallowCopy(poly);
	ret.primitive = ret;
	ret.primitive.color = arrdup(poly.primitive.color);
	ret.plane = shallowCopy(poly.plane);
	return ret;
};

function Sphere_New()
{
	var ps = {position:[0,0,0],
	          T:[[1,0,0],
	             [0,1,0],
	             [0,0,1]]};
	ps.primitive = ps;
	return ps;
};

function PointSprite_New()
{
	var ps = {position:[0,0,0]};
	ps.primitive = ps;
	return ps;
};

function updateShaderMatrix()
{
	modelview_projection_matrix = mat4.mul(projection_matrix, modelview_matrix);
	if (current_program && current_program.matrix)
		gl.uniformMatrix4fv(current_program.matrix, false, mat4.transpose(modelview_projection_matrix));
}


function Nova_ProjectionMatrix(mat)
{
	projection_matrix = mat;
	updateShaderMatrix();
}

function Nova_ModelviewMatrix(mat)
{
	modelview_matrix = mat;
	updateShaderMatrix();
}

var modelview_stack = [];
function Nova_PushMatrix()
{
	modelview_stack.push(arrdup(modelview_matrix));
}

function Nova_PopMatrix()
{
	Nova_ModelviewMatrix(modelview_stack.pop());
}

function Nova_MultMatrix(mat)
{
	Nova_ModelviewMatrix(mat4.mul(modelview_matrix, mat));
}

function Nova_Translate(x,y,z)
{
	for (var i = 0; i < 16; i += 4)
	{
		modelview_matrix[i+3] = x*modelview_matrix[i+0] + y*modelview_matrix[i+1]
		                      + z*modelview_matrix[i+2] + 1*modelview_matrix[i+3];
	}
	updateShaderMatrix();
}

function Nova_Scale(x,y,z)
{
	for (var j = 0; j < 4; j++)
	{
		modelview_matrix[4*j+0] *= x;
		modelview_matrix[4*j+1] *= y;
		modelview_matrix[4*j+2] *= z;
	}
	updateShaderMatrix();
}

var nova_program = {};
nova_program.vert_shader =
	"uniform float tex_scale;" +
	"uniform mat4 mvp_matrix;" +
	"attribute vec3 vertex_pos;" +
	"attribute vec2 vertex_texcoord;" +
	"attribute vec4 vertex_color;" +
	"varying vec2 texcoord;" +
	"varying vec4 color;" +

	"void main(void)" +
	"{" +
	"	gl_Position = mvp_matrix * vec4(vertex_pos,1);" +
	"	texcoord = vertex_texcoord * tex_scale;" +
	"	color = vertex_color;" +
	"}";
nova_program.frag_shader =
    "precision mediump float;\n" +
	"uniform sampler2D tex;" +
	"uniform float lod_bias;" +
	"varying vec2 texcoord;" +
	"varying vec4 color;" +

	"void main (void)" +
	"{" +
	"	gl_FragColor = texture2D(tex,texcoord,lod_bias) * color;" +
	"}";

var nova_alpha_program = {};
nova_alpha_program.vert_shader = nova_program.vert_shader;
nova_alpha_program.frag_shader =
    "precision mediump float;\n" +
	"uniform sampler2D tex;" +
	"uniform float lod_bias;" +
	"varying vec2 texcoord;" +
	"varying vec4 color;" +

	"void main (void)" +
	"{" +
	"	vec4 frag_color = texture2D(tex,texcoord,lod_bias) * color;" +
	"	if (frag_color.a < 0.9) discard;" +
	"	gl_FragColor = frag_color;" +
	"}";

var normal_program = {};
normal_program.vert_shader =
	"uniform mat4 mvp_matrix;" +
	"attribute vec3 vertex_pos;" +
	"attribute vec2 vertex_texcoord;" +
	"varying vec2 texcoord;" +

	"void main(void)" +
	"{" +
	"	gl_Position = mvp_matrix * vec4(vertex_pos,1);" +
	"	texcoord = vertex_texcoord;" +
	"}";
normal_program.frag_shader =
    "precision mediump float;\n" +
	"uniform sampler2D tex;" +
	"uniform vec4 color;" +
	"varying vec2 texcoord;" +

	"void main (void)" +
	"{" +
	"	gl_FragColor = texture2D(tex,texcoord) * color;" +
	"}";

var normal_alpha_program = {};
normal_alpha_program.vert_shader = normal_program.vert_shader;
normal_alpha_program.frag_shader =
    "precision mediump float;\n" +
	"uniform sampler2D tex;" +
	"uniform vec4 color;" +
	"uniform float alpha_test;" +
	"varying vec2 texcoord;" +

	"void main (void)" +
	"{" +
	"	vec4 texel = texture2D(tex,texcoord,-1.0);" +
	"	if (texel.a <= alpha_test) discard;" +
	"	gl_FragColor = vec4(texel.rgb,1) * color;" +
	"}";

var solid_program = {};
solid_program.vert_shader =
	"uniform mat4 mvp_matrix;" +
	"attribute vec3 vertex_pos;" +

	"void main(void)" +
	"{" +
	"	gl_Position = mvp_matrix * vec4(vertex_pos,1);" +
	"}";
solid_program.frag_shader =
    "precision lowp float;\n" +
	"uniform vec4 solid_color;" +

	"void main (void)" +
	"{" +
	"	gl_FragColor = solid_color;" +
	"}";

var sprite_program = {};
sprite_program.vert_shader =
	"uniform mat4 mvp_matrix;" +

	"attribute vec3 vertex_pos;" +
	"attribute vec2 vertex_texcoord;" +

	"varying vec2 texcoord;" +

	"void main(void)" +
	"{" +
	"	gl_Position = mvp_matrix * vec4(vertex_pos,1);" +
	"	texcoord = vertex_texcoord;" +
	"}";
sprite_program.frag_shader =
    "precision mediump float;\n" +

	"uniform sampler2D tex;" +
	"uniform vec4 color;" +

	"varying vec2 texcoord;" +

	"void main (void)" +
	"{" +
	"	vec4 color = texture2D(tex,texcoord) * color;" +
	"	if (color.a < 0.5) discard;" +
	"	gl_FragColor = color;" +
	"}";


var current_program = null;

function Nova_UseProgram(p)
{
	if (current_program)
	{
		for (var i = 0; i < current_program.arrays.length; i++)
			gl.disableVertexAttribArray(current_program.arrays[i]);
	}
	gl.useProgram(p.id);
	for (var i = 0; i < p.arrays.length; i++)
	{
		gl.enableVertexAttribArray(p.arrays[i]);
	}
	if (p.matrix)
	{
		gl.uniformMatrix4fv(p.matrix, false, mat4.transpose(modelview_projection_matrix));
	}
	current_program = p;
}

function compile(vert_shader,frag_shader,silent)
{
	var vs = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vs,vert_shader);
	gl.compileShader(vs);
	if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
		if (!silent)
			alert('vert shader failed:\n\n' + gl.getShaderInfoLog(vs) + '\n\n' + vert_shader)
		return 0;
	}
	

	var fs = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fs,frag_shader);
	gl.compileShader(fs);
	if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
		if (!silent)
			alert('frag shader failed:\n\n' + gl.getShaderInfoLog(fs) + '\n\n' + frag_shader)
		return 0;
	}

	var p = gl.createProgram();
	gl.attachShader(p,vs);
	gl.attachShader(p,fs);
	gl.linkProgram(p);
	if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
		if (!silent)
			alert('program failed\n\n' + gl.getProgramInfoLog(p))
		return 0;
	}

	return p;
}

function Nova_Initialize()
{
var i,j;
var spot;

	PanoramaVbos = Nova_CreateVbos(NULL,PanoramaVertexCount,gl.DYNAMIC_DRAW);

	spot = 0;
	for (i = 0; i < PanoramaVertexCount; i++)
	{
		PanoramaGlVerts[i] = new Array(9);
	}
	for (i = 0; i < PanoramaPolygonCount; i++)
	{
		var polygon = PanoramaPolygon[i] = Polygon_New();

		polygon.vertex = [
   		    PanoramaVertexOffset[0+4*i],
		    PanoramaVertexOffset[1+4*i],
		    PanoramaVertexOffset[2+4*i],
		    PanoramaVertexOffset[3+4*i]];
		polygon.edgeNormals = NULL;
		polygon.sides = 4;
		polygon.primitive.pTexture = {texGL:null};
		polygon.primitive.color = [1,1,1,1];
		polygon.primitive.flags = Nova_fPanorama | Nova_fNoRepeat;

		polygon.pGLVerts = PanoramaGlVerts;
		polygon.vbos = PanoramaVbos;
		polygon.indices = 6;
		polygon.pTriIndices = new Uint16Array([4 * i + 1,
		                                        4 * i + 0,
		                                        4 * i + 2,
		                                        4 * i + 0,
		                                        4 * i + 2,
		                                        4 * i + 3]);
	}
	Nova_PreprocessPolygons(PanoramaPolygon, PanoramaPolygonCount);

	Nova_InitGL();
}

function Nova_InitGL()
{
	checkGlErrors();
	nova_program.id = compile(nova_program.vert_shader, nova_program.frag_shader);
	gl.useProgram(nova_program.id);
	nova_program.vertex_ptr = gl.getAttribLocation(nova_program.id,"vertex_pos");
	nova_program.texcoord_ptr = gl.getAttribLocation(nova_program.id,"vertex_texcoord");
	nova_program.color_ptr = gl.getAttribLocation(nova_program.id,"vertex_color");
	nova_program.arrays = [nova_program.vertex_ptr, nova_program.texcoord_ptr, nova_program.color_ptr];
	gl.uniform1i(gl.getUniformLocation(nova_program.id, "tex"), 0);
	nova_program.tex_scale = gl.getUniformLocation(nova_program.id, "tex_scale");
	nova_program.lod_bias = gl.getUniformLocation(nova_program.id, "lod_bias");
	nova_program.matrix = gl.getUniformLocation(nova_program.id, "mvp_matrix");
	
	nova_alpha_program.id = compile(nova_alpha_program.vert_shader, nova_alpha_program.frag_shader);
	gl.useProgram(nova_alpha_program.id);
	nova_alpha_program.vertex_ptr = gl.getAttribLocation(nova_alpha_program.id,"vertex_pos");
	nova_alpha_program.texcoord_ptr = gl.getAttribLocation(nova_alpha_program.id,"vertex_texcoord");
	nova_alpha_program.color_ptr = gl.getAttribLocation(nova_alpha_program.id,"vertex_color");
	nova_alpha_program.arrays = [nova_alpha_program.vertex_ptr, nova_alpha_program.texcoord_ptr, nova_alpha_program.color_ptr];
	gl.uniform1i(gl.getUniformLocation(nova_alpha_program.id, "tex"), 0);
	nova_alpha_program.tex_scale = gl.getUniformLocation(nova_alpha_program.id, "tex_scale");
	nova_alpha_program.matrix = gl.getUniformLocation(nova_alpha_program.id, "mvp_matrix");

	solid_program.id = compile(solid_program.vert_shader, solid_program.frag_shader);
	gl.useProgram(solid_program.id);
	solid_program.vertex_ptr = gl.getAttribLocation(solid_program.id,"vertex_pos");
	solid_program.arrays = [solid_program.vertex_ptr];
	solid_program.color = gl.getUniformLocation(solid_program.id, "solid_color");
	solid_program.matrix = gl.getUniformLocation(solid_program.id, "mvp_matrix");
	
	sprite_program.id = compile(sprite_program.vert_shader, sprite_program.frag_shader);
	gl.useProgram(sprite_program.id);
	sprite_program.vertex_ptr = gl.getAttribLocation(sprite_program.id,"vertex_pos");
	sprite_program.texcoord_ptr = gl.getAttribLocation(sprite_program.id,"vertex_texcoord");
	sprite_program.arrays = [sprite_program.vertex_ptr, sprite_program.texcoord_ptr];
	gl.uniform1i(gl.getUniformLocation(sprite_program.id, "tex"), 0);
	sprite_program.color = gl.getUniformLocation(sprite_program.id, "color");
	sprite_program.matrix = gl.getUniformLocation(sprite_program.id, "mvp_matrix");

	normal_alpha_program.id = compile(normal_alpha_program.vert_shader, normal_alpha_program.frag_shader);
	gl.useProgram(normal_alpha_program.id);
	normal_alpha_program.vertex_ptr = gl.getAttribLocation(normal_alpha_program.id,"vertex_pos");
	normal_alpha_program.texcoord_ptr = gl.getAttribLocation(normal_alpha_program.id,"vertex_texcoord");
	normal_alpha_program.arrays = [normal_alpha_program.vertex_ptr, normal_alpha_program.texcoord_ptr];
	gl.uniform1i(gl.getUniformLocation(normal_alpha_program.id, "tex"), 0);
	normal_alpha_program.color = gl.getUniformLocation(normal_alpha_program.id, "color");
	normal_alpha_program.alpha_test = gl.getUniformLocation(normal_alpha_program.id, "alpha_test");
	normal_alpha_program.matrix = gl.getUniformLocation(normal_alpha_program.id, "mvp_matrix");

	normal_program.id = compile(normal_program.vert_shader, normal_program.frag_shader);
	gl.useProgram(normal_program.id);
	normal_program.vertex_ptr = gl.getAttribLocation(normal_program.id,"vertex_pos");
	normal_program.texcoord_ptr = gl.getAttribLocation(normal_program.id,"vertex_texcoord");
	normal_program.arrays = [normal_program.vertex_ptr, normal_program.texcoord_ptr];
	gl.uniform1i(gl.getUniformLocation(normal_program.id, "tex"), 0);
	normal_program.color = gl.getUniformLocation(normal_program.id, "color");
	normal_program.matrix = gl.getUniformLocation(normal_program.id, "mvp_matrix");

	Nova_UseProgram(normal_program);
	Nova_Color(1,1,1,1);
	Nova_LoadScreenMatrix();
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	checkGlErrors();
}

function Nova_Deinitialize()
{
}

function Nova_ConfigureScreen(width,height,lineWidth,fov)
{
	ScreenWidth = width;
	ScreenHeight = height;
	ScanlineWidth = lineWidth;
	ScanlinePadding = ScanlineWidth - ScreenWidth;
	xScreenMiddle = ScreenWidth / 2.0;
	yScreenMiddle = ScreenHeight / 2.0;

	// Give the largest dimension of the screen a fov degree field of view
	function RAD(X) { return ((X) * pi / 180); }
	if (width > height)
	{
		xMapToScreenConstant = xScreenMiddle / tan(RAD(fov/2));
		yMapToScreenConstant = -xMapToScreenConstant;//-yScreenMiddle / tan(height * RAD(fov/2) / width);
		xScreenToMapConstant = tan(RAD(fov/2)) / xScreenMiddle;
		yScreenToMapConstant = -xScreenToMapConstant;//-tan(height * RAD(fov/2) / width) / yScreenMiddle;
	}
	else
	{
		yMapToScreenConstant = -yScreenMiddle / tan(RAD(fov/2));
		xMapToScreenConstant = -yMapToScreenConstant;//xScreenMiddle / tan(width * RAD(40) / height);
		yScreenToMapConstant = -tan(RAD(fov/2)) / yScreenMiddle;
		xScreenToMapConstant = -yScreenToMapConstant;//tan(width * RAD(40) / height) / xScreenMiddle;
	}
}

function Nova_ConfigureViewportGL(width,height,fov)
{
	Nova_ConfigureScreen(width, height, width, fov);
	
	// Configure OpenGL
	if (width != 0 && height != 0)
	{
        gl.viewport(0, 0, canvas.width, canvas.height);
		Nova_LoadScreenMatrix();
	}
}

function Nova_LoadScreenMatrix()
{
	// Calculate The Aspect Ratio Of The Window
	var proj = mat4.frustum(0, ScreenWidth * 0.01, ScreenHeight * 0.01, 0, 0.01, 55);
	Nova_ProjectionMatrix(proj);
	Nova_ModelviewMatrix(mat4.identity);
}

function Nova_LoadModelMatrix()
{
	var proj = mat4.frustum(-ScreenWidth / 2 * xScreenToMapConstant * clipNear,
			                +ScreenWidth / 2 * xScreenToMapConstant * clipNear,
			                -ScreenHeight / 2 * xScreenToMapConstant * clipNear,
			                +ScreenHeight / 2 * xScreenToMapConstant * clipNear,
			                clipNear, clipFar);
	
	Nova_ProjectionMatrix(proj);

	/*var model = [-xPlane.normal[0], -yPlane.normal[0], +zPlane.normal[0], 0,
			     -xPlane.normal[1], -yPlane.normal[1], +zPlane.normal[1], 0,
			     -xPlane.normal[2], -yPlane.normal[2], +zPlane.normal[2], 0, +xPlane.k,
			     +yPlane.k, -zPlane.k, 1];*/
	var model = [-xPlane.normal[0], -xPlane.normal[1], -xPlane.normal[2], +xPlane.k,
	             -yPlane.normal[0], -yPlane.normal[1], -yPlane.normal[2], +yPlane.k,
	             +zPlane.normal[0], +zPlane.normal[1], +zPlane.normal[2], -zPlane.k,
	             0, 0, 0, 1];
	
	Nova_ModelviewMatrix(model);
}

function Nova_GetScreenMapSize()
{
	if (Rotate & 1)
		return [-ScreenHeight * yScreenToMapConstant,
		        ScreenWidth * xScreenToMapConstant];
	else
		return [ScreenWidth * xScreenToMapConstant,
		        -ScreenHeight * yScreenToMapConstant];
}

function Nova_GetScreenSize()
{
	if (Rotate & 1)
		return [ScreenHeight,ScreenWidth];
	else
		return [ScreenWidth,ScreenHeight];
}

function Nova_GetScreenMiddle()
{
	var s = Nova_GetScreenSize();
	return [s[0] / 2.0, s[1] / 2.0];
}

function Nova_GetScreenData()
{
	return {width:ScreenWidth,
	        height:ScreenHeight,
	        midX:ScreenWidth/2,
	        midY:ScreenHeight/2,
	        map2screen:xMapToScreenConstant,
	        screen2map:xScreenToMapConstant,
	        near:clipNear,
	        far:clipFar};
}

function Nova_GetPanorama(textures)
{
	var textures = [];
	for (var i = 0; i < 6; i++)	
		textures.push(PanoramaPolygon[i].primitive.pTexture);

	return {r: PanoramaPolygon[0].primitive.color[0],
	        g: PanoramaPolygon[0].primitive.color[1],
	        b: PanoramaPolygon[0].primitive.color[2],
            textures: textures};
}

function Nova_SetPanorama(r,g,b,textures)
{
var i;

	// Set the panorama scale
	for (i = 0; i < 6; i++)
	{
		if (textures[i] != NULL)
		{
			PanoramaPolygon[i].primitive.pTexture = textures[i];
			var scale = (textures[i].width - 6.0) / textures[i].width;
			PanoramaPolygon[i].primitive.pTexture.xScale
					= PanoramaPolygon[i].primitive.pTexture.yScale = 0.02 * scale;

			var sscale, tscale;
			if (i == 0 || i == 1)
			{
				sscale = tscale = -scale;
				if (i == 1) sscale = scale;
				PanoramaGlVerts[4 * i + 1][7] = (1 - sscale) * 0.5 * textureScale;
				PanoramaGlVerts[4 * i + 1][8] = (1 - tscale) * 0.5 * textureScale;
				PanoramaGlVerts[4 * i + 0][7] = (1 + sscale) * 0.5 * textureScale;
				PanoramaGlVerts[4 * i + 0][8] = (1 - tscale) * 0.5 * textureScale;
				PanoramaGlVerts[4 * i + 3][7] = (1 + sscale) * 0.5 * textureScale;
				PanoramaGlVerts[4 * i + 3][8] = (1 + tscale) * 0.5 * textureScale;
				PanoramaGlVerts[4 * i + 2][7] = (1 - sscale) * 0.5 * textureScale;
				PanoramaGlVerts[4 * i + 2][8] = (1 + tscale) * 0.5 * textureScale;
			}
			else
			{
				sscale = tscale = (i == 2 || i == 4) ?-scale : scale;
				PanoramaGlVerts[4 * i + 0][7] = (1 - sscale) * 0.5 * textureScale;
				PanoramaGlVerts[4 * i + 0][8] = (1 - tscale) * 0.5 * textureScale;
				PanoramaGlVerts[4 * i + 3][7] = (1 + sscale) * 0.5 * textureScale;
				PanoramaGlVerts[4 * i + 3][8] = (1 - tscale) * 0.5 * textureScale;
				PanoramaGlVerts[4 * i + 2][7] = (1 + sscale) * 0.5 * textureScale;
				PanoramaGlVerts[4 * i + 2][8] = (1 + tscale) * 0.5 * textureScale;
				PanoramaGlVerts[4 * i + 1][7] = (1 - sscale) * 0.5 * textureScale;
				PanoramaGlVerts[4 * i + 1][8] = (1 + tscale) * 0.5 * textureScale;
			}
		}
		else
		{
			PanoramaPolygon[i].primitive.pTexture = NULL;
		}
		PanoramaPolygon[i].primitive.color[0] = r;
		PanoramaPolygon[i].primitive.color[1] = g;
		PanoramaPolygon[i].primitive.color[2] = b;
	}

	for (i = 0; i < PanoramaVertexCount; i++)
	{
		PanoramaGlVerts[i][3] = 255.9 * r;
		PanoramaGlVerts[i][4] = 255.9 * g;
		PanoramaGlVerts[i][5] = 255.9 * b;
		PanoramaGlVerts[i][6] = 255;
	}

	Nova_UpdatePanoramaPolygons();
}

function Nova_UpdatePanoramaPolygons()
{
	// Update the panorama polygons so that they follow us around
	for (i = 0; i < PanoramaVertexCount; i++)
	{
		PanoramaVertex[i] = Vector_Add(position, PanoramaVertexOffset[i]);
		var pos = Vector_Add(position, Vector_Scale(PanoramaVertexOffset[i],PanoramaDistance));
		PanoramaGlVerts[i][0] = pos[0];
		PanoramaGlVerts[i][1] = pos[1];
		PanoramaGlVerts[i][2] = pos[2];
	}
	Nova_UpdateVerts(PanoramaVbos, PanoramaGlVerts, 0, PanoramaVertexCount);
	Nova_UpdateCoords(PanoramaVbos, PanoramaGlVerts, 0, PanoramaVertexCount);
	Nova_UpdateColors(PanoramaVbos, PanoramaGlVerts, 0, PanoramaVertexCount);

	for (i = 0; i < PanoramaPolygonCount; i++) {
		PanoramaPolygon[i].vertex = [PanoramaVertex[0+4*i],
		                             PanoramaVertex[1+4*i],
		                             PanoramaVertex[2+4*i],
		                             PanoramaVertex[3+4*i]];

		PanoramaPolygon[i].plane.k = Vector_Dot(
				PanoramaPolygon[i].plane.normal, PanoramaPolygon[i].vertex[0]);
	}
}

function Nova_GetAngleVector(yaw,pitch)
{
	return [
		Math.cos(yaw * pi / 180.0) * cos(pitch * pi / 180.0),
		Math.sin(yaw * pi / 180.0) * cos(pitch * pi / 180.0),
		Math.sin(pitch * pi / 180.0)
	];
}

function Nova_GetPosition()
{
	return position;
}

function Nova_SetPosition3f(X,Y,Z)
{
	var i;

	// Set the position
	position[0] = X;
	position[1] = Y;
	position[2] = Z;

	// Update our angle planes
	xPlane.k = Vector_Dot(xPlane.normal, position);
	yPlane.k = Vector_Dot(yPlane.normal, position);
	zPlane.k = Vector_Dot(zPlane.normal, position);

	Nova_UpdatePanoramaPolygons();
}

function Nova_SetPosition(v)
{
	Nova_SetPosition3f(v[0], v[1], v[2]);
}

function Nova_SetViewAngle3f(yaw,pitch,roll)
{
	// Set up a transformation matrix
	var yawCos = -sin(yaw * pi / 180.0);
	var yawSin = -cos(yaw * pi / 180.0);
	var pitchSin = sin(pitch * pi / 180.0);
	var pitchCos = cos(pitch * pi / 180.0);
	var rollSin = sin(roll * pi / 180.0);
	var rollCos = cos(roll * pi / 180.0);
	var tmpVector; // Used for intermediate transformations
	var tmp;
	var i;

	// Load the identity
	xPlane.normal = [1,0,0];
	yPlane.normal = [0,1,0];
	zPlane.normal = [0,0,1];

	// Yaw needs to be applied first
	tmpVector = Vector_Add(Vector_Scale(zPlane.normal, yawCos), Vector_Scale(
			xPlane.normal, -yawSin));
	xPlane.normal = Vector_Add(Vector_Scale(xPlane.normal, yawCos),
			Vector_Scale(zPlane.normal, yawSin));
	zPlane.normal = tmpVector;

	// Next we apply pitch to the mess
	tmpVector = Vector_Add(Vector_Scale(yPlane.normal, pitchCos), Vector_Scale(
			zPlane.normal, -pitchSin));
	zPlane.normal = Vector_Add(Vector_Scale(zPlane.normal, pitchCos),
			Vector_Scale(yPlane.normal, pitchSin));
	yPlane.normal = tmpVector;

	// And finally we complicate it even further by adding roll
	tmpVector = Vector_Add(Vector_Scale(xPlane.normal, rollCos), Vector_Scale(
			yPlane.normal, rollSin));
	yPlane.normal = Vector_Add(Vector_Scale(yPlane.normal, rollCos),
			Vector_Scale(xPlane.normal, -rollSin));
	xPlane.normal = tmpVector;

	tmp = xPlane.normal[1];
	xPlane.normal[1] = -xPlane.normal[2];
	xPlane.normal[2] = tmp;
	tmp = yPlane.normal[1];
	yPlane.normal[1] = -yPlane.normal[2];
	yPlane.normal[2] = tmp;
	tmp = zPlane.normal[1];
	zPlane.normal[1] = -zPlane.normal[2];
	zPlane.normal[2] = tmp;

	yPlane.normal = Vector_Negate(yPlane.normal);
	zPlane.normal = Vector_Negate(zPlane.normal);

	for (i = 0; i < Rotate; i++)
	{
		var vTmp = xPlane.normal;
		xPlane.normal = yPlane.normal;
		yPlane.normal = Vector_Negate(vTmp);
	}

	xPlane.k = Vector_Dot(position, xPlane.normal);
	yPlane.k = Vector_Dot(position, yPlane.normal);
	zPlane.k = Vector_Dot(position, zPlane.normal);
}

function Nova_SetViewAngle(xPlaneNorm,yPlaneNorm,zPlaneNorm)
{
	xPlane.normal = xPlaneNorm;
	xPlane.k = Vector_Dot(xPlane.normal, position);

	yPlane.normal = yPlaneNorm;
	yPlane.k = Vector_Dot(yPlane.normal, position);

	zPlane.normal = zPlaneNorm;
	zPlane.k = Vector_Dot(zPlane.normal, position);
}

function Nova_GetViewAngle()
{
	var i;

	var pxAxis = xPlane.normal;
	var pyAxis = yPlane.normal;
	var pzAxis = zPlane.normal;

	for (i = 0; i < Rotate; i++)
	{
		var vTmp = pxAxis;
		pxAxis = Vector_Negate(pyAxis);
		pyAxis = vTmp;
	}
	
	return [pxAxis,pyAxis,pzAxis];
}

function Nova_GetClipZ()
{
	return [clipNear, clipFar];
}

function Nova_RotateDisplay(rotate)
{
	var diff;
	ASSERT(rotate >= 0 && rotate < 4);
	diff = rotate - Rotate;
	Rotate = rotate;

	if (diff < 0)
		diff += 4;

	while (diff--)
	{
		var vTmp = xPlane.normal;
		xPlane.normal = yPlane.normal;
		yPlane.normal = Vector_Negate(vTmp);
	}
}

function Nova_GetRotation()
{
	return Rotate;
}

function triarea(v0,v1,v2)
{
var p = {};
var height;

	p.normal = Vector_Cross(Vector_Cross(Vector_Subtract(v1, v2),
			Vector_Subtract(v0, v2)), Vector_Subtract(v1, v0));
	p.k = Vector_Dot(p.normal, v0);

	height = (p.k - Vector_Dot(v2, p.normal)) / Vector_Length(p.normal);

	return height * Vector_Length(Vector_Subtract(v1, v0)) / 2;
}

function area(pVerts,sides)
{
var mid = [0,0,0];
var i;
var a;

	for (i = 0; i < sides; i++)
	{
		mid = Vector_Add(mid, pVerts[i]);
	}
	mid = Vector_Scale(mid, 1.0 / sides);

	a = triarea(pVerts[0], pVerts[sides - 1], mid);
	for (i = 0; i + 1 < sides; i++)
	{
		a += triarea(pVerts[i], pVerts[i + 1], mid);
	}

	return a;
}

function Polygon_ContainsPoint(polygon,point,radius)
{
	if (polygon.sides == 4)
	{
		return Vector_Dot(polygon.edgeNormals[0], Vector_Subtract(point,
				polygon.vertex[0])) < radius && Vector_Dot(
				polygon.edgeNormals[1], Vector_Subtract(point,
						polygon.vertex[1])) < radius && Vector_Dot(
				polygon.edgeNormals[2], Vector_Subtract(point,
						polygon.vertex[2])) < radius && Vector_Dot(
				polygon.edgeNormals[3], Vector_Subtract(point,
						polygon.vertex[3])) < radius;
	}
	else
	{
		var j;
		for (j = 0; j < polygon.sides; j++)
		{
			if (Vector_Dot(polygon.edgeNormals[j], Vector_Subtract(point,
					polygon.vertex[j])) >= radius)
				return FALSE;
		}
	}

	return TRUE;
}

function Polygon_Area(p)
{
	return area(p.vertex, p.sides);
}

function Nova_PreprocessPolygons(pFirstPolygon,numPolygons)
{
	var i, j;

	// Assign temporary plane values to each polygon
	for (i = 0; i < numPolygons; i++)
	{
		var polygon = pFirstPolygon[i];
		var A = (polygon.vertex[0][1] - polygon.vertex[1][1])
				* (polygon.vertex[2][2] - polygon.vertex[1][2])
				- (polygon.vertex[0][2] - polygon.vertex[1][2])
						* (polygon.vertex[2][1] - polygon.vertex[1][1]);
		var B = (polygon.vertex[0][2] - polygon.vertex[1][2])
				* (polygon.vertex[2][0] - polygon.vertex[1][0])
				- (polygon.vertex[0][0] - polygon.vertex[1][0])
						* (polygon.vertex[2][2] - polygon.vertex[1][2]);
		var C = (polygon.vertex[0][0] - polygon.vertex[1][0])
				* (polygon.vertex[2][1] - polygon.vertex[1][1])
				- (polygon.vertex[0][1] - polygon.vertex[1][1])
						* (polygon.vertex[2][0] - polygon.vertex[1][0]);

		var length = Math.sqrt(A * A + B * B + C * C);
		polygon.plane.normal[0] = A / length;
		polygon.plane.normal[1] = B / length;
		polygon.plane.normal[2] = C / length;

		polygon.plane.k = Vector_Dot(polygon.plane.normal,
				polygon.vertex[0]);
	}

	// Set the texture-mapping constants
var MIN_DISTANCE = 0.0001;
	for (i = 0; i < numPolygons; i++)
	{
		var polygon = pFirstPolygon[i];
		var scale = [polygon.primitive.pTexture.xScale, polygon.primitive.pTexture.yScale];
		if (fabs(fabs(polygon.plane.normal[2]) - 1) < MIN_DISTANCE)
		{
			
			polygon.primitive.flags |= Nova_fHorizontal;
			polygon.T = [[scale[0],0,0],
			             [0,scale[1],0]];
		}
		else
		{
			var norm = polygon.plane.normal;
			var length = sqrt(norm[0]*norm[0] + norm[1]*norm[1]);
			polygon.T = [[scale[0]*-norm[1]/length, scale[0]*norm[0]/length, 0],
			             [0, 0, scale[1]*Math.sqrt(1 + (length*length)/(norm[2]*norm[2]))]];
			if (fabs(norm[2]) < MIN_DISTANCE)
				polygon.T[1][2] = scale[1];
		}

		if (fabs(fabs(polygon.plane.normal[0]) - 1) < MIN_DISTANCE)
			polygon.primitive.flags |= Nova_fxVertical;
		if (fabs(fabs(polygon.plane.normal[1]) - 1) < MIN_DISTANCE)
			polygon.primitive.flags |= Nova_fyVertical;
		
		if (polygon.edgeNormals != NULL)
		{
			for (j = 0; j < polygon.sides; j++)
			{
				var v0 = polygon.vertex[j];
				var v1 = j + 1 >= polygon.sides ? polygon.vertex[0]
						: polygon.vertex[j + 1];
				polygon.edgeNormals[j] = Vector_Normalize(Vector_Cross(
						Vector_Subtract(v0, v1), polygon.plane.normal));
			}
		}

		if (polygon.pGLVerts != NULL)
		{
			for (j = 0; j < polygon.indices; j++)
			{
				polygon.pGLVerts[polygon.pTriIndices[j]][3]
						= polygon.primitive.color[0] >= 1 ? 255
								: polygon.primitive.color[0] * 255.99;
				polygon.pGLVerts[polygon.pTriIndices[j]][4]
						= polygon.primitive.color[1] >= 1 ? 255
								: polygon.primitive.color[1] * 255.99;
				polygon.pGLVerts[polygon.pTriIndices[j]][5]
						= polygon.primitive.color[2] >= 1 ? 255
								: polygon.primitive.color[2] * 255.99;
				polygon.pGLVerts[polygon.pTriIndices[j]][6]
						= polygon.primitive.color[3] >= 1 ? 255
								: polygon.primitive.color[3] * 255.99;
			}
		}
	}
}

function Nova_LoadTextureGL(tex)
{
	checkGlErrors();
	//ASSERT((!(tex.width & (tex.width - 1))) && tex.width); // Power of 2
	//ASSERT((!(tex.height & (tex.height - 1))) && tex.height); // Power of 2

	tex.texGL = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex.texGL);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, tex.wrap);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, tex.wrap);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, tex.bMipMap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, tex.premultiply);
	gl.texImage2D(gl.TEXTURE_2D, 0, tex.format, tex.format, gl.UNSIGNED_BYTE, tex.image);
	gl.bindTexture(gl.TEXTURE_2D, tex.texGL);
	if (tex.bMipMap) gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	delete tex.image;
	checkGlErrors();
}

function Nova_FreeTextureGL(tex)
{
	if (tex.texGL != 0)
	{
		gl.deleteTexture(tex.texGL);
		tex.texGL = 0;
	}
}

function Nova_FreeTexturesGL(pTextures, count)
{
	var i;
	for (i = 0; i < count; i++)
		Nova_FreeTextureGL(pTextures[i]);
}

function Nova_CreateVbos(glverts,count,usage,vbos)
{
	if (usage === undefined)
		usage = gl.STATIC_DRAW;

	if (vbos === undefined)
		vbos = {};
	
	vbos.verts = gl.createBuffer();
	vbos.coords = gl.createBuffer();
	vbos.colors = gl.createBuffer();

	if (glverts)
	{
		var verts = new Array(3*count);
		var coords = new Array(2*count);
		var colors = new Array(4*count);
		var j;

		for (j = 0; j < count; j++)
		{
			var glvert = glverts[j];
			verts[3*j + 0] = glvert[0];
			verts[3*j + 1] = glvert[1];
			verts[3*j + 2] = glvert[2];

			coords[2*j + 0] = glvert[7];
			coords[2*j + 1] = glvert[8];

			var a = glvert[6] ? glvert[6]/255 : 1;
			colors[4*j + 0] = glvert[3]*a;
			colors[4*j + 1] = glvert[4]*a;
			colors[4*j + 2] = glvert[5]*a;
			colors[4*j + 3] = glvert[6];
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, vbos.verts);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), usage);
		gl.bindBuffer(gl.ARRAY_BUFFER, vbos.coords);
		gl.bufferData(gl.ARRAY_BUFFER, new Int16Array(coords), usage);
		gl.bindBuffer(gl.ARRAY_BUFFER, vbos.colors);
		gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(colors), usage);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}
	else
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, vbos.verts);
		gl.bufferData(gl.ARRAY_BUFFER, 3*4*count, usage);
		gl.bindBuffer(gl.ARRAY_BUFFER, vbos.coords);
		gl.bufferData(gl.ARRAY_BUFFER, 2*2*count, usage);
		gl.bindBuffer(gl.ARRAY_BUFFER, vbos.colors);
		gl.bufferData(gl.ARRAY_BUFFER, 4*1*count, usage);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}
	return vbos;
}

function Nova_UpdateVerts(vbos,glverts,start,count)
{
var verts = new Array(3*count);
var j;

	for (j = 0; j < count; j++)
	{
		var glvert = glverts[j+start];
		verts[3*j + 0] = glvert[0];
		verts[3*j + 1] = glvert[1];
		verts[3*j + 2] = glvert[2];
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, vbos.verts);
	gl.bufferSubData(gl.ARRAY_BUFFER, 3*4*start, new Float32Array(verts));
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function Nova_UpdateCoords(vbos,glverts,start,count)
{
var coords = new Array(2*count);
var j;

	for (j = 0; j < count; j++)
	{
		var glvert = glverts[j+start];
		coords[2*j + 0] = glvert[7];
		coords[2*j + 1] = glvert[8];
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, vbos.coords);
	gl.bufferSubData(gl.ARRAY_BUFFER, 2*2*start, new Int16Array(coords));
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function Nova_UpdateColors(vbos,glverts,start,count)
{
var colors = new Array(4*count);
var j;

	for (j = 0; j < count; j++)
	{
		var glvert = glverts[j+start];
		var a = glvert[6] ? glvert[6]/255 : 1;
		colors[4*j + 0] = glvert[3]*a;
		colors[4*j + 1] = glvert[4]*a;
		colors[4*j + 2] = glvert[5]*a;
		colors[4*j + 3] = glvert[6];
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, vbos.colors);
	gl.bufferSubData(gl.ARRAY_BUFFER, 4*1*start, new Uint8Array(colors));
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function Nova_FreeVbos(vbos)
{
	gl.bindBuffer(gl.ARRAY_BUFFER, null)
	if (vbos.verts)
		gl.deleteBuffer(vbos.verts);
	if (vbos.coords)
		gl.deleteBuffer(vbos.coords);
	if (vbos.colors)
		gl.deleteBuffer(vbos.colors);
}

function Nova_AddPolygonToDrawList(polygon)
{
	//ASSERT(polygon.vbos);
	//ASSERT(polygon.vbos.verts);
	glPolys[glPolyCount++] = polygon;
}

function Nova_RenderPolygon(poly)
{
	var distanceFromPlane = poly.plane.k - Vector_Dot(
			position, poly.plane.normal);
	if ((distanceFromPlane > 0.001 && !(poly.primitive.flags
			& (Nova_fCullBack | Nova_fInvisible)))
			|| (distanceFromPlane < -0.001
					&& !(poly.primitive.flags
							& (Nova_fCullFront | Nova_fInvisible))))
	{
		//ASSERT(poly.vbos);
		//ASSERT(poly.vbos.verts);
		glPolys[glPolyCount++] = poly;
	}
}

function Nova_RenderPolygons(polygons,numPolygons,mask)
{
	var index;

	for (index = 0; index < numPolygons; index++)
	{
		if (!mask || (mask[index >> 5] & (1 << (index & 0x1f))))
			Nova_RenderPolygon(polygons[index]);
	}

	return TRUE;
}

function Nova_ClearAll()
{
	Nova_Begin();
}

function Nova_Begin()
{
	glPolyCount = 0;
}

function Nova_End()
{
	return Nova_End_PanMask(-1);
}

function Nova_End_PanMask(mask)
{
	// Render the special panorama polygons
	if (!Nova_RenderPolygons(PanoramaPolygon, PanoramaPolygonCount, mask != -1 ? [mask] : NULL))
	{
		ASSERT(0);
		return FALSE;
	}

	return TRUE;
}

// these should DEFINITELY NOT be down in this layer...
var Atlas_Scale = 8192.0;
// these should

var index_buffer = null;
var nova_indices = new Uint16Array(65536);
var index_count = 0;
function Nova_DrawGL(/*tesselator,*/alpha_test)
{
	/*if (tesselator) {
		tesselator.begin(1);
		for (var i = 0; i < glPolyCount; i++)
			tesselator.draw(glPolys[i]);
		tesselator.end();
		return;
	}*/
	
	var texGL = -1;
	var color = [-900, -900, -902, -9];
	var vertPtr = NULL;

	if (index_buffer == null)
	{
		index_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 2*65526, gl.DYNAMIC_DRAW);
	}
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

	Nova_UseProgram(alpha_test ? nova_alpha_program : nova_program);
	Nova_LoadModelMatrix();
	gl.uniform1f(current_program.tex_scale, 1.0/textureScale);
	gl.uniform1f(current_program.lod_bias, 0);
	for (var i = 0; i < glPolyCount; i++)
	{
		var polygon = glPolys[i];
		if (texGL != polygon.primitive.pTexture.texGL || vertPtr != polygon.pGLVerts)
		{
			if (index_count > 0)
			{
				gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, nova_indices.subarray(0,index_count));
				gl.drawElements(gl.TRIANGLES, index_count, gl.UNSIGNED_SHORT, 0);
				index_count = 0;
			}

			if (texGL != polygon.primitive.pTexture.texGL)
			{
				// might be supported per texture now (?)
				if (texGL === g_atlasTex.texGL)
				{
					gl.uniform1f(current_program.lod_bias, 0);
					gl.uniform1f(current_program.tex_scale, 1.0/textureScale);
				}

				texGL = polygon.primitive.pTexture.texGL;
				gl.bindTexture(gl.TEXTURE_2D, texGL);

				if (texGL === g_atlasTex.texGL)
				{
					gl.uniform1f(current_program.lod_bias, -2);
					gl.uniform1f(current_program.tex_scale, 1.0/Atlas_Scale);
				}
			}

			if (vertPtr != polygon.pGLVerts)
			{
				vertPtr = polygon.pGLVerts;
				gl.bindBuffer(gl.ARRAY_BUFFER, polygon.vbos.verts);
				Nova_VertexPointer(3, gl.FLOAT, false, 0, 0);
				gl.bindBuffer(gl.ARRAY_BUFFER, polygon.vbos.coords);
				Nova_TexcoordPointer(2, gl.SHORT, false, 0, 0);
				gl.bindBuffer(gl.ARRAY_BUFFER, polygon.vbos.colors);
				Nova_ColorPointer(4, gl.UNSIGNED_BYTE, true, 0, 0);
				gl.bindBuffer(gl.ARRAY_BUFFER, null)
			}
		}

		for (var j = 0; j < polygon.indices; j++)
			nova_indices[index_count++] = polygon.pTriIndices[j];
	}

	if (index_count > 0)
	{
		gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, nova_indices.subarray(0,index_count));
		gl.drawElements(gl.TRIANGLES, index_count, gl.UNSIGNED_SHORT, 0);
		index_count = 0;
	}

	if (texGL === g_atlasTex.texGL)
		gl.uniform1f(current_program.lod_bias, 0);

	Nova_LoadScreenMatrix();
	Nova_UseProgram(normal_program);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
	
	return TRUE;
}

function Nova_Color(r,g,b,a)
{
	gl.uniform4f(current_program.color,r*a,g*a,b*a,a);
}

var g_novaVerts = null;
var g_novaCoords = null;
function Nova_DrawArrays(mode,verts,coords,count)
{
	if (verts)
	{
		if (!g_novaVerts)
		{
			g_novaVerts = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, g_novaVerts);
			gl.bufferData(gl.ARRAY_BUFFER, 4*3*16, gl.DYNAMIC_DRAW);
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, g_novaVerts);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(verts));
		Nova_VertexPointer(3, gl.FLOAT, false, 0, 0);
	}

	if (coords)
	{
		if (!g_novaCoords)
		{
			g_novaCoords = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, g_novaCoords);
			gl.bufferData(gl.ARRAY_BUFFER, 4*2*16, gl.DYNAMIC_DRAW);
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, g_novaCoords);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(coords));
		Nova_TexcoordPointer(2, gl.FLOAT, false, 0, 0);
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, null)
	gl.drawArrays(mode,0,count);
}

function Nova_VertexPointer(size,type,normalize,stride,pointer)
{
	gl.vertexAttribPointer(current_program.vertex_ptr,size,type,normalize,stride,pointer);
}

function Nova_TexcoordPointer(size,type,normalize,stride,pointer)
{
	gl.vertexAttribPointer(current_program.texcoord_ptr,size,type,normalize,stride,pointer);
}

function Nova_ColorPointer(size,type,normalize,stride,pointer)
{
	gl.vertexAttribPointer(current_program.color_ptr,size,type,normalize,stride,pointer);
}

function Nova_BeginSolidColor(r,g,b,a)
{
	Nova_UseProgram(solid_program);
	Nova_Color(r,g,b,a);
}

function Nova_BeginAlphaTest(threshold)
{
	Nova_UseProgram(normal_alpha_program);
	gl.uniform1f(normal_alpha_program.alpha_test, threshold);
}

function Nova_BeginSprites()
{
	Nova_UseProgram(sprite_program);
}

function Nova_EndSprites()
{
	Nova_EndSpecialDraw();
}

function Nova_EndSolidColor()
{
	Nova_UseProgram(normal_program);
}

function Nova_EndSpecialDraw()
{
	Nova_UseProgram(normal_program);
}

function Nova_DrawSpheres(spheres,count)
{
	for (var i = 0; i < count; i++)
		Nova_DrawSphere(spheres[i]);

	return TRUE;
}

function Nova_PointSpriteOnScreenRadius(sprite)
{
    return xMapToScreenConstant * sprite.radius / (zPlane.k - Vector_Dot(sprite.position, zPlane.normal));
}

function Nova_DrawPointSprite(pSprite)
{
	var newPoint = [];
	var color = new Array(4);
	var j;

	newPoint[2] = zPlane.k - Vector_Dot(pSprite.position, zPlane.normal);
	if (newPoint[2] > -.05)
	{
		var x, y, radius;

		if (newPoint[2] < .05)
			newPoint[2] = .05;

		newPoint[0] = xPlane.k - Vector_Dot(pSprite.position, xPlane.normal);
		newPoint[1] = yPlane.k - Vector_Dot(pSprite.position, yPlane.normal);

		x = xScreenMiddle + xMapToScreenConstant * newPoint[0] / newPoint[2];
		y = yScreenMiddle + yMapToScreenConstant * newPoint[1] / newPoint[2];
		radius = xMapToScreenConstant * pSprite.radius / newPoint[2];
		{
			var coords = [0, 0, 1, 0, 1, 1, 0, 1];
			var verts = [(x - radius) * newPoint[2], (y - radius) * newPoint[2],
					-newPoint[2], (x + radius) * newPoint[2], (y - radius)
							* newPoint[2], -newPoint[2], (x + radius)
							* newPoint[2], (y + radius) * newPoint[2],
					-newPoint[2], (x - radius) * newPoint[2], (y + radius)
							* newPoint[2], -newPoint[2]];

			for (j = 0; j < 3; j++)
			{
				color[j] = pSprite.primitive.color[j];
				// color[j] = (ambient[j] + light[j] * fabs(Vector_Dot(lightDir, zPlane.normal)))
			}
			color[3] = pSprite.primitive.color[3];

			Nova_Color(color[0], color[1], color[2], color[3]);
			gl.bindTexture(gl.TEXTURE_2D, pSprite.primitive.pTexture.texGL);
			Nova_DrawArrays(gl.TRIANGLE_FAN, verts, coords, 4);
		}
	}
}
