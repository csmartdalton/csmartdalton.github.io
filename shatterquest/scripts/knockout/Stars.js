function holderPadding() { return 3 * min(ScreenWidth,ScreenHeight)/320; }
function holderSize() { return 24 * min(ScreenWidth,ScreenHeight)/320; }

var g_holderTex = null;
var g_fillerTex = null;
var g_borderTex = null;
var g_borderTexs = null;

var dustBufSize = 256; // MUST be a power of 2
var newDustTime = (1.0/60.0);

var dust_program = {};
dust_program.vert_shader =
	"uniform mat4 mvp_matrix;" +
	"uniform float point_size;" +
	
	"attribute vec3 vertex_pos;" +

	"void main(void)" +
	"{" +
	"	gl_Position = mvp_matrix * vec4(vertex_pos,1);" +
	"	gl_PointSize = point_size;" +
	"}";
dust_program.frag_shader =
    "precision highp float;\n" +
    "uniform vec4 color;" +

	"void main (void)" +
	"{" +
	"	gl_FragColor = color;" +
	"}";

var g_pixVbo = null;
function StarHomeDecorator_DrawOverlay(shd,verts,coords)
{
	BaseDecorator_DrawOverlay(shd.d);

	if (shd.dustCount >= 3)
	{
		var dusts = min(shd.dustCount, dustBufSize);
		var dust_verts = new Array(3*dusts);
		var i;

		for (i = 0; i < dusts; i++)
		{
			dust_verts[3*i + 0] = shd.dust[i].pos[0];
			dust_verts[3*i + 1] = shd.dust[i].pos[1];
			dust_verts[3*i + 2] = shd.dust[i].pos[2];
		}
		
		Nova_UseProgram(dust_program);
		if (shd.waitTime > 0 && shd.waitTime < 1)
			Nova_Color(1,1,1,shd.waitTime);
		else
			Nova_Color(1,1,1,1);
		if (!g_pixVbo)
		{
			g_pixVbo = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, g_pixVbo);
			gl.bufferData(gl.ARRAY_BUFFER, 4*3*dustBufSize, gl.DYNAMIC_DRAW);
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, g_pixVbo);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(dust_verts));
		
		gl.uniform1f(dust_program.point_size, 2.0 * min(ScreenWidth,ScreenHeight)/800);
		Nova_VertexPointer(3, gl.FLOAT, gl.FALSE, 3*3*4, 0);
		gl.drawArrays(gl.POINTS, 0, dusts/3);

		gl.uniform1f(dust_program.point_size, 3.0 * min(ScreenWidth,ScreenHeight)/800);
		Nova_VertexPointer(3, gl.FLOAT, gl.FALSE, 3*3*4, 3*4);
		gl.drawArrays(gl.POINTS, 0, dusts/3);

		gl.uniform1f(dust_program.point_size, 4.0 * min(ScreenWidth,ScreenHeight)/800);
		Nova_VertexPointer(3, gl.FLOAT, gl.FALSE, 3*3*4, 6*4);
		gl.drawArrays(gl.POINTS, 0, dusts/3);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		Nova_EndSpecialDraw();
	}

	if (!shd.star.fillHolder)
	{
		Nova_Color(1,1,1,1);
		gl.bindTexture(gl.TEXTURE_2D, g_borderTex.texGL);
		Nova_DrawArrays(gl.TRIANGLE_FAN, verts, coords, 4);
	}
}

function StarHomeDecorator_DrawOverlayCenterRelative(d)
{
var shd = d;
var mid = Nova_GetScreenMiddle();
var midX = mid[0];
var midY = mid[1];

	var v = [midX + shd.x - shd.size/2, midY + shd.y - shd.size/2, -1,
	         midX + shd.x + shd.size/2, midY + shd.y - shd.size/2, -1,
	         midX + shd.x + shd.size/2, midY + shd.y + shd.size/2, -1,
	         midX + shd.x - shd.size/2, midY + shd.y + shd.size/2, -1];

	var c = [.15, .15,
	         .85, .15,
	         .85, .85,
	         .15, .85];
	
	StarHomeDecorator_DrawOverlay(shd, v, c);
}

function StarHomeDecorator_DrawOverlayCornerRelative(d)
{
var shd = d;

	var v = [shd.x, shd.y, -1,
	         shd.x + shd.size, shd.y, -1,
	         shd.x + shd.size, shd.y + shd.size, -1,
	         shd.x, shd.y + shd.size, -1];

	var c = [.15, .15,
	         .85, .15,
	         .85, .85,
	         .15, .85];
	
	StarHomeDecorator_DrawOverlay(shd, v, c);
}

function StarHomeDecorator_NextFrame(d,spf,step)
{
var shd = d;
var mid = Nova_GetScreenMiddle();
var midX = mid[0];
var midY = mid[1];
var i;

	for (i = 0; i < shd.dustCount && i < dustBufSize; i++)
	{
		shd.dust[i].pos = Vector_AddScale(shd.dust[i].pos, shd.dust[i].velocity, spf);
	}
	
	BaseDecorator_NextFrame(d, spf, step);
	
	if ((shd.x == shd.xGoal) && (shd.y == shd.yGoal) && (shd.size == shd.sizeGoal))
	{
		if (shd.waitTime > 0)
		{
			shd.waitTime -= spf;
		}
		else if (shd.xGoal == 0 && shd.yGoal == 0)
		{
			var level = Level_GetLevel();

			shd.xGoal = shd.yGoal = holderPadding();
			shd.sizeGoal = holderSize();

			for (i = 0; i < level.starCount && shd.star.b != level.stars[i]; i++)
				shd.xGoal += holderSize() + holderPadding();  
			ASSERT(i < level.starCount);

			shd.x += midX - shd.size/2;
			shd.y += midY - shd.size/2;
			
			shd.dx = (shd.xGoal - shd.x) / .3;
			shd.dy = (shd.yGoal - shd.y) / .3;
			shd.dstep = (shd.sizeGoal - shd.size) / .3;
			shd.waitTime = 3;

			shd.d.DrawOverlay = StarHomeDecorator_DrawOverlayCornerRelative;
		}
		else
		{
			shd.d.Free(shd.d);
			return;
		}
	}

	else if (((shd.x + shd.dx * spf < shd.xGoal) != (shd.x < shd.xGoal)) ||
			  ((shd.y + shd.dy * spf < shd.yGoal) != (shd.y < shd.yGoal)) ||
			  ((shd.size + shd.dstep * spf < shd.sizeGoal) != (shd.size < shd.sizeGoal)))
	{
		shd.x = shd.xGoal;
		shd.y = shd.yGoal;
		shd.size = shd.sizeGoal;

		shd.star.fillHolder = (shd.d.DrawOverlay == StarHomeDecorator_DrawOverlayCornerRelative);
	}

	else
	{
		shd.dustTime += spf;
		while (shd.dustTime > newDustTime)
		{
			var pxd = shd.dust[(shd.dustCount++) & (dustBufSize - 1)];
			var v = [rand() - RAND_MAX/2, (shd.yGoal <= shd.y ? rand() - RAND_MAX/4 : RAND_MAX/2 - rand()), 0];
			if (fabs(v[0]) < 0.001 && fabs(v[1]) < 0.001)
				v[0] = v[1] = 0.5;
			
			pxd.velocity = Vector_Scale(Vector_Normalize(v), 5 * 60 * max(midY, midX) / 500);

			pxd.pos = (shd.d.DrawOverlay == StarHomeDecorator_DrawOverlayCenterRelative) ?
				Nova_Vector3f(midX + shd.x, midY + shd.y, -1) :
				Nova_Vector3f(shd.size/2 + shd.x, shd.size/2 + shd.y, -1);

			shd.dustTime -= newDustTime;
		}

		shd.x += shd.dx * spf;
		shd.y += shd.dy * spf;
		shd.size += shd.dstep * spf;
	}
}

function StarHomeDecorator_Free(d)
{
//StarHomeDecorator* shd = d;
	
	// *** NOT SO! what if they quit the game in the middle of a star home decorataor???
	//ASSERT(shd.star.fillHolder);
	//ASSERT(shd.star.shattered);

	Decorator_Free(d);
}

function StarHomeDecorator_New(star)
{
var camera = Level_GetCamera();
var vrel =  Vector_Subtract(camera.position, star.middle);
var v = Matrix_Mult(camera.viewAngle, vrel);
var shd = {};

var screen = Nova_GetScreenData();

	shd.d = shd;
	Decorator_Init(shd.d);
	
	shd.star = star;
	
	shd.size = fabs(screen.map2screen * 0.3 / v[2]);
	shd.x = screen.map2screen * v[0] / v[2];
	shd.y = -screen.map2screen * v[1] / v[2];
	
	shd.xGoal = shd.yGoal = 0;
	shd.sizeGoal = min(screen.width, screen.height) / 3;
	
	shd.dx = (shd.xGoal - shd.x) / 2.25;
	shd.dy = (shd.yGoal - shd.y) / 2.25;
	shd.dstep = (shd.sizeGoal - shd.size) / 2.6;
	shd.waitTime = 0;
	shd.dustCount = 0;
	shd.dustTime = 0;
	shd.dust = new Array(dustBufSize);
	for (var i = 0; i < dustBufSize; i++)
		shd.dust[i] = {pos:[0,0,0], velocity:[0,0,0]};
	
	shd.d.DrawOverlay = StarHomeDecorator_DrawOverlayCenterRelative;
	shd.d.NextFrame = StarHomeDecorator_NextFrame;	
	shd.d.Free = StarHomeDecorator_Free;
	
	return shd.d;
}

/////////////////////////////////////////////////////////////////////////////////////
// Star Blocks
function Star_DrawBorder(block)
{
	var star = block;
	
	Nova_RenderPolygons(star.borderPolys, star.b.group.polyCount, NULL);
}

function Star_IsShattered(block)
{
	var star = block;
	
	return star.shattered;
}

function Star_Collide(pGroup,pPrimitive)
{
var star = pGroup;
var ball = Level_GetBall();

	if (Color_Equals(ball.sphere.primitive.color, star.b.color) || ball.bInvincible)
	{ 
		var camera = Level_GetCamera();

		pGroup.bVisible = FALSE;
		Level_AddDecorator(ShatterDecorator_FromBlock(star, NULL));
		
		star.shattered = TRUE;

		Sound_Play(ekStarSound);

		if (Level_StarBlockCount() > 0)
			Level_AddDecorator(ShatterDecorator_FromBlock(star.borderBlock, NULL));
		else
			Level_AddDecorator(ShatterDecorator_FromBlock(star.borderBlock, Level_Cleared));
		
		if (Level_GetLevel().nextBreakPoints/blockBreakPoints >= 9)
		{
			Words_Show(Vector_AddScale(star.b.middle, camera.viewAngle[1], Vector_Dot(camera.viewAngle[1], Vector_Subtract(star.b.middle, camera.position)) > 0 ? -.3 : .3), ekJobOrForRealsWord);
			Sound_Play3D(ekExtraGuySound, star.b.middle);
		}
		else if (Level_GetLevel().nextBreakPoints/blockBreakPoints >= 3)
		{
			Words_ShowNumber(Vector_AddScale(star.b.middle, camera.viewAngle[1], Vector_Dot(camera.viewAngle[1], Vector_Subtract(star.b.middle, camera.position)) > 0 ? -.3 : .3),
				Math.floor(Level_GetLevel().nextBreakPoints/blockBreakPoints));
		}

		//Words_Show(Vector_Add(Vector_Add(camera.position, camera.viewAngle[2]), Vector_Scale(camera.viewAngle[1], 0.4)), ekStarWord);
		Level_AddDecorator(StarHomeDecorator_New(star));
		
		Level_BlockBroken(pGroup.index);
	}
	else
	{
		Sound_Play(ekClickSound);
	}
}

function Star_Persist(group)
{
var star = group;
	
	psWriteByteTag(ekShatteredTag, star.shattered);
	Block_Persist(group);
}

function Star_ParseTag(b,tag,length)
{
var star = b;
	
	switch (tag) {
		case ekShatteredTag:
			star.shattered = star.fillHolder = psReadByte();
			break;
		default:
			Block_ParseTag(b,tag,length);
			break;
	}
}

function Star_AdjustBorder(star,v)
{
	v[0] = star.b.middle[0] + 1.03 * (v[0] - star.b.middle[0]);
	v[1] = star.b.middle[1] + 1.03 * (v[1] - star.b.middle[1]);
	v[2] = star.b.middle[2] + 1.03 * (v[2] - star.b.middle[2]);
	
	(v[7]) = ((v[7]) > Atlas_TexSize/2 * textureScale ? textureScale : 0);
	(v[8]) = ((v[8]) > Atlas_TexSize/2 * textureScale ? textureScale : 0);

	v[3] = v[4] = v[5] = v[6] = 255;
}

function Star_AdjustVertex(star,v)
{
	arrcpy(v,Vector_AddScale(star.b.middle, Vector_Subtract(v, star.b.middle), 1.03),3);
}

function Star_LevelFinishedLoading(pGroup)
{
var star = pGroup;
var i,j;
	
	ASSERT(star.b.group.polyCount == 6);
	
	star.borderBlock = shallowCopy(star.b);
	star.borderBlock.group = star.borderBlock;
	star.borderPolys = star.borderBlock.polys = new Array(star.polyCount);
	star.borderBlock.color[j] = [1,1,1,1];
	
	for (i = 0; i < star.b.group.polyCount; i++)
	{
		if (star.b.group.polys[i].pGLVerts != NULL && star.b.group.polys[i].pTriIndices != NULL)
		{
			var start = g_glvertCount;
			var poly = star.b.group.polys[i];
			var diff;
			
			star.borderPolys[i] = Polygon_Clone(star.b.group.polys[i]);
			star.borderPolys[i].primitive.pTexture = g_borderTex;
			
			for (j = 0; j < poly.indices; j++)
			{
				if (poly.pTriIndices[j] < start)
					start = poly.pTriIndices[j];
			}
			
			diff = g_glvertCount - start;
			ASSERT(g_glvertCount + poly.sides < glVertBufSize);
			for (j = 0; j < poly.sides; j++)
				g_glverts[j+g_glvertCount] = arrdup(poly.pGLVerts[j+start]);
			
			for (j = 0; j < 4; j++)
				star.borderPolys[i].primitive.color[j] = 1;
			
			var inds = [];
			for (j = 0; j < poly.indices; j++)			
				inds.push(poly.pTriIndices[j] + diff);
			star.borderPolys[i].pTriIndices = new Uint16Array(inds);
			
			for (j = 0; j < star.borderPolys[i].sides; j++)
				Star_AdjustBorder(star, star.borderPolys[i].pGLVerts[g_glvertCount + j]);
			
			for (j = 0; j < star.borderPolys[i].sides; j++)
				Star_AdjustVertex(star, star.borderPolys[i].vertex[j]);
			
			star.borderPolys[i].plane.k = star.b.group.polys[i].plane.k = 
				Vector_Dot(star.borderPolys[i].plane.normal, star.borderPolys[i].vertex[0]);
			
			g_glvertCount += poly.sides;
			g_indCount += poly.indices;
		}
	}  
}

function Star_New()
{
	var star = {};
	star.b = star;
	star.b.group = star.b;
	
	star.b.group.LevelFinishedLoading = Star_LevelFinishedLoading;
	star.b.group.SetCheckpoint = PolygonGroup_SetCheckpoint;
	star.b.group.GotoCheckpoint = PolygonGroup_GotoCheckpoint;	
	star.b.group.Collide = Star_Collide;
	star.b.group.Free = Block_Group_Free;
	star.b.Free = Block_Free;
	star.b.LoadPolys = Block_LoadPolys;
	star.b.SwitchHit = Block_SwitchHit;
	star.b.group.Persist = Star_Persist;
	star.b.group.Recover = Block_Recover;
	star.b.ParseTag = Star_ParseTag;
	
	star.b.group.transparent = TRUE;
	star.b.group.moving = FALSE;
	star.b.color  = [1,1,1];
	star.b.group.bVisible = TRUE;
	star.b.group.type = ekStar;
	
	star.shattered = FALSE;
	star.fillHolder = FALSE;
	
	return star.b;
}

function cheatStar(i)
{
	Level_GetLevel().stars[i].fillHolder = 1;
}

function Stars_DrawHolders(stars,starCount)
{
var v = [holderPadding(), holderPadding(), -1,
         holderPadding() + holderSize(), holderPadding(), -1,
         holderPadding() + holderSize(), holderPadding() + holderSize(), -1,
         holderPadding(), holderPadding() + holderSize(), -1];
var c = [0, 0,
         1, 0,
         1, 1,
         0, 1];
var i, j;
	
	gl.bindTexture(gl.TEXTURE_2D, g_holderTex.texGL);
	
	for (i = 0; i < starCount; i++)
	{
		Nova_Color(stars[i].color[0], stars[i].color[1], stars[i].color[2], 0.5);
		Nova_DrawArrays(gl.TRIANGLE_FAN, v, c, 4);
		
		for (j = 0; j < 4; j++)
			v[3*j + 0] += holderPadding() + holderSize();
	}
	
	gl.bindTexture(gl.TEXTURE_2D, g_fillerTex.texGL);
	Nova_Color(1,1,1,1);
	for (i = starCount - 1; i >= 0; i--)
	{
		for (j = 0; j < 4; j++)
			v[3*j + 0] -= holderPadding() + holderSize();
		
		if (stars[i].fillHolder)
			Nova_DrawArrays(gl.TRIANGLE_FAN, v, c, 4);
	}
}

function GoldBorderTransform(bits,width,height,lineSize)
{
var i,j;
	for (j = 0; j < height; j++)
	{
		for (i = 0; i < width; i++)
		{
			var a = bits[j * lineSize + i * 4 + 3];
			if (a != 255)
			{
				bits[j * lineSize + i * 4 + 0] = 247;
				bits[j * lineSize + i * 4 + 1] = 202;
				bits[j * lineSize + i * 4 + 2] = 72;
			}
		}
	}
}

function Stars_Initialize()
{
	g_holderTex = loadTexture(document.getElementById('star-holder-texture'));
	g_fillerTex = loadTexture(document.getElementById('star-filler-texture'));
	g_borderTexs = [loadTexture(document.getElementById('star-border-texture-1')),
	                loadTexture(document.getElementById('star-border-texture-2')),
	                loadTexture(document.getElementById('star-border-texture-3')),
	                loadTexture(document.getElementById('star-border-texture-4'))];
	g_borderTex = shallowCopy(g_borderTexs[0]);

	checkGlErrors();
	dust_program.id = compile(dust_program.vert_shader, dust_program.frag_shader);
	dust_program.vertex_ptr = gl.getAttribLocation(dust_program.id,"vertex_pos");
	dust_program.arrays = [dust_program.vertex_ptr];
	dust_program.matrix = gl.getUniformLocation(dust_program.id, "mvp_matrix");
	dust_program.color = gl.getUniformLocation(dust_program.id, "color");
	dust_program.point_size = gl.getUniformLocation(dust_program.id, "point_size");
	checkGlErrors();
}

var stg_time = 0;
var stg_idx = 0;
function Stars_Glitter(spf)
{
	stg_time += spf;
	if (stg_time > 1.0 / 8.0)
	{
		stg_time = 0;
		g_borderTex.texGL = g_borderTexs[stg_idx++ % 4].texGL;
	}
}
