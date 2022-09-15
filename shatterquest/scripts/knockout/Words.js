var ekCheckpointWord = 0;
var ekForRealsWord = 1;
var ekSecretHeartWord = 2;
var ekInvincibleWord = 3;
var ekJobWord = 4;
var ekJobOrForRealsWord = 5;

var g_wordTex = null;

var word_program = {};
word_program.vert_shader = normal_program.vert_shader;
word_program.frag_shader =
    "precision mediump float;\n" +
	"uniform sampler2D tex;" +
	"uniform vec4 color;" +
	"varying vec2 texcoord;" +

	"void main (void)" +
	"{" +
	"	gl_FragColor = color * texture2D(tex,texcoord).a;" +
	"}";

function WordDecorator_NextFrame(d,spf,step)
{
var wd = d;

	BaseDecorator_NextFrame(d, spf, step);

	wd.pos = Vector_AddScale(wd.pos, wd.step, spf);
	wd.a += wd.da * spf;
	wd.da += -1 * spf;

	if (wd.a <= 0 || wd.pos[2] <= 0)
		wd.d.Free(wd.d);
}
function size(SIZ,Z) { return (0.8 * (SIZ) / (Z)); }
function WordDecorator_DrawOverlay(d)
{
var wd = d;
var width = size(wd.width, wd.pos[2]);
var height = size(wd.height, wd.pos[2]);
var screen = Nova_GetScreenData();

	BaseDecorator_DrawOverlay(d);

	var x = screen.midX + screen.map2screen * wd.pos[0] / wd.pos[2];
	var y = screen.midY - screen.map2screen * wd.pos[1] / wd.pos[2];

	var verts = [
		x - width/2, y - height/2, -1,
		x + width/2, y - height/2, -1,
		x + width/2, y + height/2, -1,
		x - width/2, y + height/2, -1,
	];

	Nova_UseProgram(word_program);
	Nova_Color(1,1,1,wd.a);
	gl.bindTexture(gl.TEXTURE_2D, wd.texGL);
	Nova_DrawArrays(gl.TRIANGLE_FAN, verts, wd.coords, 4);
	Nova_EndSpecialDraw(word_program);
}

function WordDecorator_New(start,width,height)
{
var wd = {};
wd.d = wd;
var screen = Nova_GetScreenData();

	wd.pos = Matrix_Mult(Level_GetCamera().viewAngle, Vector_Subtract(Level_GetCamera().position, start));
	wd.pos[2] = fabs(wd.pos[2]);
	if (wd.pos[2] < 0.3)
		wd.pos[2] = 0.3;

	wd.width = width;
	wd.height = height;

	var x = screen.midX + screen.map2screen * wd.pos[0] / wd.pos[2];
	var y = screen.midY - screen.map2screen * wd.pos[1] / wd.pos[2];

	if (x + size(width/2,wd.pos[2]) > screen.width)
		wd.pos[0] = (screen.width - size(width/2,wd.pos[2]) - screen.midX) * wd.pos[2] * screen.screen2map;
	if (y + size(height/2,wd.pos[2]) > screen.height)
		wd.pos[1] = -(screen.height - size(height/2,wd.pos[2]) - screen.midY) * wd.pos[2] * screen.screen2map;
	if (x - size(width/2,wd.pos[2]) < 0)
		wd.pos[0] = (size(width/2,wd.pos[2]) - screen.midX) * wd.pos[2] * screen.screen2map;
	if (y - size(height/2,wd.pos[2]) < 0)
		wd.pos[1] = -(size(height/2,wd.pos[2]) - screen.midY) * wd.pos[2] * screen.screen2map;

	wd.step = Vector_Scale(wd.pos, -.5);

	wd.a = 1;
	wd.da = 0;

	Decorator_Init(wd.d);
	wd.d.NextFrame = WordDecorator_NextFrame;
	wd.d.DrawOverlay = WordDecorator_DrawOverlay;

	return wd;
}

function Words_ShowInternal(start,left,top,right,bot)
{
var w, h;
var wd;

	var size = Nova_GetScreenSize();
	var w = size[0];
	var h = size[1];
	
	wd = WordDecorator_New(start,
		(right - left) * 512.0 * max(w, h) / 686,
		(bot - top) * 512.0 * max(w, h) / 686);

	wd.texGL = g_wordTex.texGL;
	wd.coords = [
     	left, top,
    	right, top,
    	right, bot,
    	left, bot,
    ];

	Level_AddDecorator(wd.d);
}

function Words_ShowNumber(start,n)
{
var x1, y1, x2, y2;

	switch (n)
	{
		case 3: x1=0,y1=423,x2=109,y2=505; break;
		case 4: x1=109,y1=423,x2=224,y2=505; break;
		case 5: x1=224,y1=423,x2=334,y2=505; break;
		case 6: x1=334,y1=423,x2=451,y2=505; break;
		case 7: x1=0,y1=340,x2=94,y2=413; break;
		case 8: x1=94,y1=340,x2=195,y2=413; break;
		case 9: x1=195,y1=340,x2=296,y2=413; break;
		default: return;
	}

	Words_ShowInternal(start, x1/512.0, y1/512.0, x2/512.0, y2/512.0);
}

function Words_Show(start,word)
{
var x1, y1, x2, y2;

	if (word == ekJobOrForRealsWord)
		word = Math.random() >= .5 ? ekJobWord : ekForRealsWord;
	switch (word)
	{
		case ekCheckpointWord: x1=0,y1=0,x2=507,y2=86; break;
		case ekForRealsWord: x1=0,y1=92,x2=227,y2=250; break;
		case ekSecretHeartWord: x1=231,y1=100,x2=512,y2=253; break;
		case ekInvincibleWord: x1=0,y1=254,x2=498,y2=336; break;
		case ekJobWord: x1=310,y1=338,x2=512,y2=421; break;
		default: return;
	}

	Words_ShowInternal(start, x1/512.0, y1/512.0, x2/512.0, y2/512.0);
}

function Words_Initialize()
{
	g_wordTex = loadTexture(document.getElementById('words-texture'),true,true,gl.CLAMP_TO_EDGE,gl.ALPHA);
	
	word_program.id = compile(word_program.vert_shader, word_program.frag_shader);
	gl.useProgram(word_program.id);
	word_program.vertex_ptr = gl.getAttribLocation(word_program.id,"vertex_pos");
	word_program.texcoord_ptr = gl.getAttribLocation(word_program.id,"vertex_texcoord");
	word_program.arrays = [word_program.vertex_ptr, word_program.texcoord_ptr];
	gl.uniform1i(gl.getUniformLocation(word_program.id, "tex"), 0);
	word_program.color = gl.getUniformLocation(word_program.id, "color");
	word_program.matrix = gl.getUniformLocation(word_program.id, "mvp_matrix");
	gl.useProgram(normal_program.id);
}
