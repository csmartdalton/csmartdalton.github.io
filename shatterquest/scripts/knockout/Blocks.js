var ekEnvironment = 0;
var ekStar = 1;
var ekSlidingStar = 2;
var ekBlock = 3;
var ekStepper = 4;
var ekCoaster = 5;
var ekSpringDoor = 6;
var ekLockedDoor = 7;
var ekChanger = 8;
var ekCheckpoint = 9;
var ekInversion = 10;
var ekSpeedup = 11;
var ekGhost = 12;
var ekSpike = 13;
var ekKiller = 14;
var ekExtraGuy = 15;
var ekInvincible = 16;
var ekHider = 17;
var ekSpikeBall = 18;

var Atlas_TexSize  = 204.0 / 1024.0;
var Atlas_Scale = 8192.0;
var ekAlpha = 0;
var ekUpperSigma = 1;
var ekPsi = 2;
var ekPhi = 3;
var ekOmega = 4;
var ekLowerDelta = 5;
var ekPi = 6;
var ekLowerSigma = 7;
var ekLambda = 8;
var ekUpperDelta = 9;
var ekSymbolCount = 10;

var ekEyes = 0;
var ekX = 1;
var ekNecklace = 2;
var ekTotemPole = 3;
var ekFoot = 4;
var ekHand = 5;
var ekFunnyHand = 6;
var ekFace = 7;
var ekTwoWeirdThings = 8;
var ekCaterpillar = 9;
var ekMayanSymbolCount = 10;

///////////////////////////////////////////////////////////////////////////////
// PolygonGroup
function PolygonGroup_LevelFinishedLoading(pGroup)
{

}

function PolygonGroup_Collide(pGroup,pPrimitive)
{
	Sound_Play3D(pPrimitive.pTexture.soundId, Level_GetBall().sphere.position);
}

function PolygonGroup_Free(pGroup)
{
	if (pGroup.glverts)
		my_free(pGroup.glverts);
	if (pGroup.vbos)
		my_free(pGroup.vbos);
	if (pGroup.verts)
		my_free(pGroup.verts);
	if (pGroup.edgeNorms)
		my_free(pGroup.edgeNorms);
	if (pGroup.spheres)
		my_free(pGroup.spheres);
	my_free(pGroup.polys);
	my_free(pGroup);
}

function PolygonGroup_SetCheckpoint(group)
{
}

function PolygonGroup_GotoCheckpoint(group)
{
}

function PolygonGroup_Persist(group)
{
}

function PolygonGroup_Recover(group,size)
{
}

function PolygonGroup_New(polyCount)
{
	var pGroup = {};//(PolygonGroup*)my_malloc(sizeof(PolygonGroup));
	//memset(pGroup, 0, sizeof(*pGroup));
	
	pGroup.Collide = PolygonGroup_Collide;
	pGroup.Free = PolygonGroup_Free;
	pGroup.Persist = PolygonGroup_Persist;
	pGroup.Recover = PolygonGroup_Recover;
	pGroup.LevelFinishedLoading = PolygonGroup_LevelFinishedLoading;
	pGroup.SetCheckpoint = PolygonGroup_SetCheckpoint;
	pGroup.GotoCheckpoint = PolygonGroup_GotoCheckpoint;	
	pGroup.polyCount = polyCount;
	pGroup.polys = new Array(polyCount);//(Nova_Polygon*)my_malloc(polyCount * sizeof(Nova_Polygon));
	pGroup.type = ekEnvironment;
	pGroup.bVisible = TRUE;
	pGroup.transparent = FALSE;
	pGroup.moving = FALSE;

	return pGroup;
}

///////////////////////////////////////////////////////////////////////////////
// Block texture atlas
function Atlas_FloatCoords(type)
{
var x = 0, y = 0;

	switch (type)
	{
	case ekBlock:
	case ekChanger:
	case ekStepper:
	case ekStar:
	case ekSlidingStar:
		x = 0, y = 0;
		break;
	case ekSpeedup:
		x = 3, y = 0;
		break;
	case ekInversion:
		x = 3, y = 0;
		break;
	case ekExtraGuy:
		x = 4, y = 0;
		break;
	case ekInvincible:
		x = 5, y = 0;
		break;
	case ekGhost:
		return {s:52 / 1024.0, t:767 / 1024.0};
	case ekKiller:
		return {s:256 / 1024.0, t:767 / 1024.0};
	case ekCheckpoint:
		return {s:512 / 1024.0, t:767 / 1024.0};
	case ekCoaster:
		return {s:768 / 1024.0, t:767 / 1024.0};
	}

	return {s:(170.0 * x) / 1024.0, t:(170.0 * y) / 1024.0};
}

function Atlas_BlockCoords(blockType)
{
	var f = Atlas_FloatCoords(blockType);
	return {s:f.s * Atlas_Scale,
	        t:f.t * Atlas_Scale};
}

function Atlas_NumberCoords(i)
{
	var r = (i - 1) % 6;
	var q = (i - 1 - r) / 6;
	return {s:170.0 * r / 1024.0 * Atlas_Scale,
		    t:170.0 * (1+q) / 1024.0 * Atlas_Scale};
}

function Atlas_SymbolCoords(symbol)
{
var x = 0, y = 0;

	switch (symbol)
	{
	case ekAlpha:
		x = 5; y = 2;
		break;
	case ekUpperSigma:
		x = 1; y = 3;
		break;
	case ekPsi:
		x = 0; y = 3;
		break;
	case ekPhi:
		x = 4; y = 2;
		break;
	case ekOmega:
		x = 2; y = 3;
		break;
	case ekLowerDelta:
		x = 3; y = 3;
		break;
	case ekPi:
		x = 4; y = 3;
		break;
	case ekLowerSigma:
		x = 5; y = 3;
		break;
	case ekLambda:
		x = 1; y = 0;
		break;
	case ekUpperDelta:
		x = 2; y = 0;
		break;
	}

	return {s:(170.0 * x) / 1024.0 * Atlas_Scale,
	        t:(170.0 * y) / 1024.0 * Atlas_Scale};
}

var glVertBufSize = (300 * 24 + 15 * 54 * 4);
var indBufSize = (glVertBufSize * 6 / 4);
var g_glverts = new Array(glVertBufSize);
for (var i = 0; i < glVertBufSize; i++)
	g_glverts[i] = new Array(9);
var g_vbos = {};
var g_inds = new Array(indBufSize);
var g_glvertCount = 0;
var g_indCount = 0;

var g_atlasTex = {};
function Atlas_Load(url)
{
	if (g_atlasTex != null)
		Nova_FreeTextureGL(g_atlasTex);

	g_atlasTex = loadTexture(url,true);
	g_atlasTex.scale = Atlas_Scale;
}

/////////////////////////////////////////////////////////////////////////////////////
// Blocks
function Blocks_LevelFinishedLoading()
{
	Nova_CreateVbos(g_glverts, g_glvertCount, gl.DYNAMIC_DRAW, g_vbos);
}

function Blocks_ClearAll()
{
	g_glvertCount = 0;
	g_indCount = 0;
	if (g_vbos.verts) gl.deleteBuffer(g_vbos.verts);
	if (g_vbos.coords) gl.deleteBuffer(g_vbos.coords);
	if (g_vbos.colors) gl.deleteBuffer(g_vbos.colors);
	g_vbos = {};
}

///////////////////////////////////////////////////////////////////////////////
// Block
function Block_TransformAtlasCoordsIndexed(block,transform,sParam,tParam)
{
var i,j,k;

	for (i = 0; i < block.group.polyCount; i++)
	{
		if (block.group.polys[i].pGLVerts != NULL && block.group.polys[i].pTriIndices != NULL)
		{
			var start = g_glvertCount;
			var poly = block.group.polys[i];
			for (j = 0; j < poly.indices; j++)
			{
				if (poly.pTriIndices[j] < start)
					start = poly.pTriIndices[j];
			}

			for (j = 0; j < poly.sides; j++)
			{
				// Make sure we're getting a right one..
				for (k = 0; k < poly.indices; k++)
				{
					if (poly.pTriIndices[k] == start + j)
						break;
				}
				ASSERT(k < poly.indices);

				var c = transform(block, i, poly.pGLVerts[start + j][7],
					poly.pGLVerts[start + j][8], sParam, tParam);
				poly.pGLVerts[start + j][7] = c.s;
				poly.pGLVerts[start + j][8] = c.t;
			}
		}
	}

	if (g_vbos.coords)
		Nova_UpdateCoords(g_vbos, g_glverts, 0, g_glvertCount);
}

function Block_TransformAtlasCoords(block,transform,sParam,tParam,transformBlockStart)
{
var i,j,k;

	for (i = 0; i < block.group.polyCount; i++)
	{
		if (block.group.polys[i].pGLVerts != NULL && block.group.polys[i].pTriIndices != NULL)
		{
			var start = g_glvertCount;
			var poly = block.group.polys[i];
			for (j = 0; j < poly.indices; j++)
			{
				if (poly.pTriIndices[j] < start)
					start = poly.pTriIndices[j];
			}

			for (j = 0; j < poly.sides; j++)
			{
				// Make sure we're getting a right one..
				for (k = 0; k < poly.indices; k++)
				{
					if (poly.pTriIndices[k] == start + j)
						break;
				}
				ASSERT(k < poly.indices);

				var c = transform(block, poly.pGLVerts[start + j][7],
					poly.pGLVerts[start + j][8], sParam, tParam);
				poly.pGLVerts[start + j][7] = c.s;
				poly.pGLVerts[start + j][8] = c.t;
			}
		}
	}

	if (block.group.transparent)
		Bsp_TransformTexCoords(block.group, transform, sParam, tParam);

	if (transformBlockStart)
	{
		var c = transform(block, block.atlasCoords.s, block.atlasCoords.t, sParam, tParam);
		block.atlasCoords.s = c.s;
		block.atlasCoords.t = c.t;
	}

	if (g_vbos.coords)
		Nova_UpdateCoords(g_vbos, g_glverts, 0, g_glvertCount);
}

function TranslateCoords(block,s,t,sParam,tParam)
{
	return {s:s + sParam, t:t + tParam};
}

function Block_SetAtlasCoords(block,c)
{
	ASSERT(c);
	ASSERT(block);
	ASSERT(block.atlasCoords);
	Block_TransformAtlasCoords(block, TranslateCoords, 
		c.s - block.atlasCoords.s,
		c.t - block.atlasCoords.t, TRUE);
}

function Block_SetColor(block,r,g,b)
{
var i,j;

	block.color[0] = r;
	block.color[1] = g;
	block.color[2] = b;

	for (i = 0; i < block.group.polyCount; i++)
	{
		var poly = block.group.polys[i];
		var br,bg,bb;
		arrcpy(poly.primitive.color, block.color, 3);
		Level_LightColor(poly.primitive.color, poly.primitive.color, poly.plane.normal);
		br = poly.primitive.color[0] > 1 ? 255 : poly.primitive.color[0] * 255.99;
		bg = poly.primitive.color[1] > 1 ? 255 : poly.primitive.color[1] * 255.99;
		bb = poly.primitive.color[2] > 1 ? 255 : poly.primitive.color[2] * 255.99;
		if (poly.pGLVerts != NULL && poly.pTriIndices != NULL)
		{
			for (j = 0; j < poly.indices; j++)
			{
				poly.pGLVerts[poly.pTriIndices[j]][3] = br;
				poly.pGLVerts[poly.pTriIndices[j]][4] = bg;
				poly.pGLVerts[poly.pTriIndices[j]][5] = bb;
			}
		}
	}

	if (block.group.transparent)
		Bsp_SetColor(block.group, block.color);
	else if (g_vbos.colors)
		Nova_UpdateColors(g_vbos, g_glverts, 0, g_glvertCount);
}

function Block_PlayShatterSound(b,prim)
{
	if (b.largestArea > 1.75)
	{
		Sound_Play3D(ekShatterHugeSound, b.middle);
	}
	else if (b.largestArea < 0.1)
	{
		Sound_Play3D(ekGlassSmallSound, b.middle);
	}
	else
	{
		var i;
		var v1 = [0,0,0];
		var dMax = 0;
		for (i = 0; i < b.group.polyCount; i++)
		{
			if (fabs(Vector_Dot(Level_GetBall().velocity, b.group.polys[i].plane.normal)) > 0.01)
			{
				var d = (b.group.polys[i].plane.k - Vector_Dot(b.group.polys[i].plane.normal, Level_GetBall().sphere.position)) / 
								Vector_Dot(b.group.polys[i].plane.normal, Level_GetBall().velocity);
				var sect = Vector_Add(Level_GetBall().sphere.position, Vector_Scale(Level_GetBall().velocity, d));
				if (d > dMax && Polygon_ContainsPoint(b.group.polys[i], sect, 0))
				{
					dMax = d;
					v1 = sect;
				}
			}
		}
		var coll = Level_FindNextCollision(Level_GetBall().sphere.position, 0, Level_GetBall().velocity, TRUE);
		if (coll.poly && coll.group == 0 && Vector_VeryClose(v1, coll.pos, 0.01))
		{
			Sound_Play3D(ekGlassCrunchSound, b.middle);
		}
		else if (prim == b.group.polys[0].primitive || prim == b.group.polys[1].primitive)
		{
			Sound_Play3D(Level_GetBall().velocity[2] < 0 ? ekGlassHardSound : ekGlassSpreadSound, b.middle);
		}
		else
		{
			Sound_Play3D(rand() & 1 ? ekGlassHardSound : ekGlassSpreadSound, b.middle);			
		}
	}
}

function Block_Collide(pGroup,pPrimitive)
{
var pBall = Level_GetBall();
var block = pGroup;

	if (Color_Equals(pBall.sphere.primitive.color, block.color) || pBall.bInvincible)
	{ 
		pGroup.bVisible = FALSE;
		Level_AddDecorator(ShatterDecorator_FromBlock(block, NULL));

		if (Level_GetLevel().nextBreakPoints/blockBreakPoints >= 10)
		{
			Words_Show(block.middle, ekJobOrForRealsWord);
			Sound_Play3D(ekExtraGuySound, block.middle);
		}
		else if (Level_GetLevel().nextBreakPoints/blockBreakPoints >= 3 && block.group.type != ekInvincible)
		{
			Words_ShowNumber(block.middle, Math.floor(Level_GetLevel().nextBreakPoints/blockBreakPoints));
			Block_PlayShatterSound(block, pPrimitive);
		}
		else
		{
			Block_PlayShatterSound(block, pPrimitive);
		}
		
		Level_BlockBroken(pGroup.index);		
	}
	else
	{
		Sound_Play3D(ekClickSound, pBall.sphere.position);
	}
}

function Block_Group_Free(pGroup)
{
	pGroup.Free(pGroup);
}

function Block_Free(block)
{
	PolygonGroup_Free(block.group);
	// Taken care of there ^ my_free(block);
}

function Block_InitPolys(block,vertices)
{
var i;
var sum = [0,0,0];

var faces = [[vertices[0], vertices[1], vertices[2], vertices[3]],
             [vertices[4], vertices[5], vertices[6], vertices[7]],
             [vertices[0], vertices[1], vertices[5], vertices[4]],
             [vertices[1], vertices[2], vertices[6], vertices[5]],
             [vertices[2], vertices[3], vertices[7], vertices[6]],
             [vertices[3], vertices[0], vertices[4], vertices[7]]];
	
	for (i = 0; i < 8; i++)
		sum = Vector_Add(sum, vertices[i]);
	block.middle = Vector_Scale(sum, 1.0 / 8.0);
	
	block.group.vertexCount = 4*faces.length;
	//block.group.verts = (Nova_Vector*)my_malloc(block.group.vertexCount * sizeof(Nova_Vector));
	//block.group.edgeNorms = (Nova_Vector*)my_malloc(block.group.vertexCount * sizeof(Nova_Vector));	
	//memcpy(block.group.verts, &faces[0], sizeof(Nova_Vertex) * block.group.vertexCount);
	
	block.group.polyCount = 6;
	block.group.polys = new Array(6);//(Nova_Polygon*)my_malloc(block.group.polyCount * sizeof(Nova_Polygon));
	for (i = 0; i < block.group.polyCount; i++)
	{
		block.group.polys[i] = Polygon_New();
		block.group.polys[i].primitive.color = arrdup(block.color);
		block.group.polys[i].sides = 4;
		block.group.polys[i].primitive.pTexture = g_atlasTex;
		block.group.polys[i].vertex = faces[i]; 
		block.group.polys[i].edgeNormals = new Array(4);		 
	}
	Nova_PreprocessPolygons(block.group.polys, block.group.polyCount);
	
	block.largestArea = 0;
	for (i = 0; i < block.group.polyCount; i++)
	{
		if (block.group.polys[i].plane.k - Vector_Dot(block.group.polys[i].plane.normal, block.middle) < 0)
			block.group.polys[i].primitive.flags |= Nova_fCullFront;
		else
			block.group.polys[i].primitive.flags |= Nova_fCullBack;
		
		if (Polygon_Area(block.group.polys[i]) > block.largestArea)
			block.largestArea = Polygon_Area(block.group.polys[i]);
	}
}

function Block_LoadPolys(block,vertices)
{
	var i;
	
	Block_InitPolys(block, vertices);
	ASSERT(block.group.polyCount == 6);	
	for (i = 0; i < 6; i++)
	{
		var sPlane = {normal:[0,0,0], k:0};
		var tPlane = {normal:[0,0,0], k:0};
		var mid = [0,0,0,0];
		var j;
		var ds, dt;
		
		ASSERT(block.group.polys[i].sides == 4);
		for (j = 0; j < 4; j++)
			mid = Vector_Add(mid, block.group.polys[i].vertex[j]);
		mid = Vector_Scale(mid, 0.25);
 
		if (block.group.polys[i].primitive.flags & Nova_fHorizontal)
		{
			var texYaw;
			var yaw = block.yaw;
			
			if (yaw < 0)
				yaw = 0;
			if (yaw > 360)
				yaw = 360;
			/*yaw -= 45;
			if (yaw < 0)
				yaw += 360;*/

			tPlane.normal = fabs(Vector_Normalize(Vector_Subtract(block.group.polys[i].vertex[1], block.group.polys[i].vertex[0]))[1]) >
								 fabs(Vector_Normalize(Vector_Subtract(block.group.polys[i].vertex[3], block.group.polys[i].vertex[0]))[1]) ?
									Vector_Normalize(Vector_Subtract(block.group.polys[i].vertex[1], block.group.polys[i].vertex[0])) :
									Vector_Normalize(Vector_Subtract(block.group.polys[i].vertex[3], block.group.polys[i].vertex[0]));
			
			texYaw = atan2(tPlane.normal[1], tPlane.normal[0]) * 180.0 / 3.141592654;
			if (texYaw > yaw)
				texYaw -= 360;

			while (yaw - texYaw > 45)
			{
				var tmp = tPlane.normal[0];
				tPlane.normal[0] = -tPlane.normal[1];
				tPlane.normal[1] = tmp;
				yaw -= 90;
			}
		}
		else
		{
			tPlane.normal = fabs(Vector_Normalize(Vector_Subtract(block.group.polys[i].vertex[1], block.group.polys[i].vertex[0]))[2]) >
			fabs(Vector_Normalize(Vector_Subtract(block.group.polys[i].vertex[3], block.group.polys[i].vertex[0]))[2]) ?
			Vector_Normalize(Vector_Subtract(block.group.polys[i].vertex[1], block.group.polys[i].vertex[0])) :
			Vector_Normalize(Vector_Subtract(block.group.polys[i].vertex[3], block.group.polys[i].vertex[0]));
			if (tPlane.normal[2] < 0)
				tPlane.normal = Vector_Negate(tPlane.normal);
		}
		sPlane.normal = Vector_Normalize(Vector_Cross(tPlane.normal, Vector_Subtract(mid, block.middle)));
		ds = fabs(Vector_Dot(block.group.polys[i].vertex[0], sPlane.normal) - Vector_Dot(block.group.polys[i].vertex[2], sPlane.normal));		
		dt = fabs(Vector_Dot(block.group.polys[i].vertex[0], tPlane.normal) - Vector_Dot(block.group.polys[i].vertex[2], tPlane.normal));

		block.atlasCoords = Atlas_BlockCoords(block.group.type);
		ds = fabs(Vector_Dot(block.group.polys[i].vertex[0], sPlane.normal) - Vector_Dot(block.group.polys[i].vertex[2], sPlane.normal));		
		dt = fabs(Vector_Dot(block.group.polys[i].vertex[0], tPlane.normal) - Vector_Dot(block.group.polys[i].vertex[2], tPlane.normal));

		sPlane.normal = Vector_Scale(sPlane.normal, Atlas_TexSize / ds * Atlas_Scale);
		tPlane.normal = Vector_Scale(tPlane.normal, -Atlas_TexSize / dt * Atlas_Scale);
		sPlane.k = -Vector_Dot(sPlane.normal, mid) + 0.5 * Atlas_TexSize * Atlas_Scale + block.atlasCoords.s;
		tPlane.k = -Vector_Dot(tPlane.normal, mid) + 0.5 * Atlas_TexSize * Atlas_Scale + block.atlasCoords.t;

		if (ds / dt < 1.0 / 3.0)
		{
			sPlane.normal = Vector_Scale(sPlane.normal, 34.0 / 204.0);
			sPlane.k = -Vector_Dot(sPlane.normal, mid) + 0.5 * Atlas_TexSize * 34.0 / 204.0 * Atlas_Scale + block.atlasCoords.s;
		}
		else if (dt / ds < 1.0 / 3.0)
		{
			tPlane.normal = Vector_Scale(tPlane.normal, 34.0 / 204.0);
			tPlane.k = -Vector_Dot(tPlane.normal, mid) + 0.5 * Atlas_TexSize * 34.0 / 204.0 * Atlas_Scale + block.atlasCoords.t;
		}
		
		block.group.polys[i].pGLVerts = g_glverts;
		block.group.polys[i].vbos = g_vbos;
		block.group.polys[i].pTriIndices = new Uint16Array([g_inds[0] = g_glvertCount + 1,
		                                                    g_inds[1] = g_glvertCount + 0,
		                                                    g_inds[2] = g_glvertCount + 2,
		                                                    g_inds[3] = g_glvertCount + 0,
		                                                    g_inds[4] = g_glvertCount + 2,		
		                                                    g_inds[5] = g_glvertCount + 3]);
		block.group.polys[i].indices = 6;
		
		for (j = 0; j < 4; j++)
		{
			g_glverts[g_glvertCount][0] = block.group.polys[i].vertex[j][0];
			g_glverts[g_glvertCount][1] = block.group.polys[i].vertex[j][1];
			g_glverts[g_glvertCount][2] = block.group.polys[i].vertex[j][2];
			g_glverts[g_glvertCount][7] = (Vector_Dot(sPlane.normal, block.group.polys[i].vertex[j]) + sPlane.k);
			g_glverts[g_glvertCount][8] = (Vector_Dot(tPlane.normal, block.group.polys[i].vertex[j]) + tPlane.k);
			
			/*{var k; for (k = 0; k < j; k++)
				if (!(block.group.polys[i].primitive.flags & Nova_fHorizontal) && (g_glverts[g_glvertCount - j + k][8] != g_glverts[g_glvertCount][8]))
					ASSERT((g_glverts[g_glvertCount - j + k][8] < g_glverts[g_glvertCount][8]) != (g_glverts[g_glvertCount - j + k][2] < g_glverts[g_glvertCount][2]));}*/

			g_glvertCount++;
		}
		
		if (abs(g_glverts[g_glvertCount - j][7] - g_glverts[g_glvertCount - j + 1][7]) < 2 &&
			 abs(g_glverts[g_glvertCount - j + 2][7] - g_glverts[g_glvertCount - j + 1][7]) < 2 && (
																																abs(g_glverts[g_glvertCount - j][8] - g_glverts[g_glvertCount - j + 1][8]) > 2 ||
																																abs(g_glverts[g_glvertCount - j + 2][8] - g_glverts[g_glvertCount - j + 1][8]) > 2))
		{
			block.group.polys[i].primitive.color[0] = 1;
						block.group.polys[i].primitive.color[1] = .75;
						block.group.polys[i].primitive.color[2] = .31;
		}
	}
	
	ASSERT(g_glvertCount < glVertBufSize);
	ASSERT(g_indCount < indBufSize);
	
	if (block.group.transparent)
		block.color[3] = 0.64;
	else
		block.color[3] = 1;
	for (i = 0; i < block.group.polyCount; i++)
		block.group.polys[i].primitive.color[3] = block.color[3];
}

function Block_SwitchHit(block,on)
{
	block.group.bVisible = on;
}

function Block_Persist(group)
{
	var b = group.bVisible;
	psWriteByteTag(ekVisibleTag, b);
}

function Block_ParseTag(b,tag,length)
{
	switch (tag) {
		case ekVisibleTag:
			b.group.bVisible = psReadByte();
			break;
	}
}

function Block_Recover(group,size)
{
	psParse(group,group.ParseTag,size);
}

function Block_New()
{
	var block = {};//(Block*)my_malloc(sizeof(Block));
	block.group = block;
	
	block.group.LevelFinishedLoading = PolygonGroup_LevelFinishedLoading;
	block.group.SetCheckpoint = PolygonGroup_SetCheckpoint;
	block.group.GotoCheckpoint = PolygonGroup_GotoCheckpoint;	
	block.group.Collide = Block_Collide;
	block.group.Free = Block_Group_Free;
	block.Free = Block_Free;
	block.LoadPolys = Block_LoadPolys;
	block.SwitchHit = Block_SwitchHit;
	block.group.Persist = Block_Persist;
	block.group.Recover = Block_Recover;
	block.ParseTag = Block_ParseTag;

	block.group.transparent = TRUE;
	block.group.moving = FALSE;
	block.color = [1,1,1];
	block.group.bVisible = TRUE;
	block.group.type = ekBlock;

	return block;
}

///////////////////////////////////////////////////////////////////////////////
// Changer
function Changer_SetColor(pChanger,color)
{
var i,j;
	
	arrcpy(pChanger.b.color, color, 3);
	arrcpy(pChanger.b.group.spheres[0].primitive.color, color, 3);

	for (i = 0; i < pChanger.b.group.polyCount; i++)
	{
		var p = pChanger.b.group.polys[i];
		Level_LightColor(p.primitive.color, color, p.plane.normal);
		
		for  (j = 0; j < p.indices; j++)
		{
			p.pGLVerts[p.pTriIndices[j]][3] = p.primitive.color[0] >= 1 ? 255 : p.primitive.color[0] * 255.99;
			p.pGLVerts[p.pTriIndices[j]][4] = p.primitive.color[1] >= 1 ? 255 : p.primitive.color[1] * 255.99;
			p.pGLVerts[p.pTriIndices[j]][5] = p.primitive.color[2] >= 1 ? 255 : p.primitive.color[2] * 255.99;
			p.pGLVerts[p.pTriIndices[j]][6] = p.primitive.color[3] >= 1 ? 255 : p.primitive.color[3] * 255.99;
		}
	}

	if (g_vbos.colors)
		Nova_UpdateColors(g_vbos, g_glverts, 0, g_glvertCount);
}

function Changer_SetCheckpoint(g)
{
var ch = g;

	arrcpy(ch.checkColor, ch.b.color, 4);
	ch.checkCollisionCount = ch.lastCollisionCount;
}

function Changer_GotoCheckpoint(g)
{
var ch = g;
	
	Changer_SetColor(ch, ch.checkColor);
	ch.lastCollisionCount = ch.checkCollisionCount;
}

function Changer_Collide(pGroup,pPrimitive)
{
var pBall = Level_GetBall();
var pChanger = pGroup;
var oldColor = new Array(3);

	if ((pChanger.lastCollisionCount != Level_GetLevel().collisionCount) && 
		  !Color_Equals(pBall.sphere.primitive.color, pChanger.b.color) &&
		  !pBall.bInvincible)
	{
		arrcpy(oldColor, pBall.sphere.primitive.color, 3);
		oldColor[3] = 1;
		arrcpy(pBall.sphere.primitive.color, pChanger.b.color, 3);
		
		Changer_SetColor(pChanger, oldColor);
		Sound_Play(rand() & 1 ? ekChanger0Sound : ekChanger1Sound);
	}
	else
	{
		Sound_Play3D(ekClickSound, pBall.sphere.position);
	}

	pChanger.lastCollisionCount = Level_GetLevel().collisionCount + 1;
}

function Changer_Persist(group)
{
	Block_Persist(group);
	psWriteFloatArrayTag(ekChangerColorTag, group.color, 3);
	psWriteFloatArrayTag(ekChangerCheckColorTag, group.checkColor, 3);
}

function Changer_ParseTag(b,tag,length)
{
	switch (tag) {
		case ekChangerColorTag:
			var color = psReadFloatArray(3);
			color.push(1);
			Changer_SetColor(b, color);
			break;
		case ekChangerCheckColorTag:
			b.checkColor = psReadFloatArray(3);
			b.checkColor.push(1);
			break;
		default:
			Block_ParseTag(b, tag, length);
			break;
	}
}

function Changer_LoadPolys(block,vertices)
{
var i,j;
var m;

	var faces = [
		[0.0, 0.0, 0.0], [1.0, 0.0, 0.0], [1.0, 0.15, 0.0], [0.0, 0.15, 0.0],
		[0.0, 0.85, 0.0], [1.0, 0.85, 0.0], [1.0, 1.0, 0.0], [0.0, 1.0, 0.0],
		[0.0, 0.15, 0.0], [0.15, 0.15, 0.0], [0.15, 0.85, 0.0], [0.0, 0.85, 0.0],
		[0.85, 0.15, 0.0], [1.0, 0.15, 0.0], [1.0, 0.85, 0.0], [0.85, 0.85, 0.0],

		[0.0, 0.0, 1.0], [1.0, 0.0, 1.0], [1.0, 0.15, 1.0], [0.0, 0.15, 1.0],
		[0.0, 0.85, 1.0], [1.0, 0.85, 1.0], [1.0, 1.0, 1.0], [0.0, 1.0, 1.0],
		[0.0, 0.15, 1.0], [0.15, 0.15, 1.0], [0.15, 0.85, 1.0], [0.0, 0.85, 1.0],
		[0.85, 0.15, 1.0], [1.0, 0.15, 1.0], [1.0, 0.85, 1.0], [0.85, 0.85, 1.0],


		[0.0, 0.0, 0.0], [1.0, 0.0, 0.0], [1.0, 0.0, 0.15], [0.0, 0.0, 0.15],
		[0.0, 0.0, 0.85], [1.0, 0.0, 0.85], [1.0, 0.0, 1.0], [0.0, 0.0, 1.0],
		[0.0, 0.0, 0.15], [0.15, 0.0, 0.15], [0.15, 0.0, 0.85], [0.0, 0.0, 0.85],
		[0.85, 0.0, 0.15], [1.0, 0.0, 0.15], [1.0, 0.0, 0.85], [0.85, 0.0, 0.85],

		[0.0, 1.0, 0.0], [1.0, 1.0, 0.0], [1.0, 1.0, 0.15], [0.0, 1.0, 0.15],
		[0.0, 1.0, 0.85], [1.0, 1.0, 0.85], [1.0, 1.0, 1.0], [0.0, 1.0, 1.0],
		[0.0, 1.0, 0.15], [0.15, 1.0, 0.15], [0.15, 1.0, 0.85], [0.0, 1.0, 0.85],
		[0.85, 1.0, 0.15], [1.0, 1.0, 0.15], [1.0, 1.0, 0.85], [0.85, 1.0, 0.85],


		[0.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 1.0, 0.15], [0.0, 0.0, 0.15],
		[0.0, 0.0, 0.85], [0.0, 1.0, 0.85], [0.0, 1.0, 1.0], [0.0, 0.0, 1.0],
		[0.0, 0.0, 0.15], [0.0, 0.15, 0.15], [0.0, 0.15, 0.85], [0.0, 0.0, 0.85],
		[0.0, 0.85, 0.15], [0.0, 1.0, 0.15], [0.0, 1.0, 0.85], [0.0, 0.85, 0.85],
																							  
		[1.0, 0.0, 0.0], [1.0, 1.0, 0.0], [1.0, 1.0, 0.15], [1.0, 0.0, 0.15],
		[1.0, 0.0, 0.85], [1.0, 1.0, 0.85], [1.0, 1.0, 1.0], [1.0, 0.0, 1.0],
		[1.0, 0.0, 0.15], [1.0, 0.15, 0.15], [1.0, 0.15, 0.85], [1.0, 0.0, 0.85],
		[1.0, 0.85, 0.15], [1.0, 1.0, 0.15], [1.0, 1.0, 0.85], [1.0, 0.85, 0.85],


		[0.15, 0.0, 0.15], [0.85, 0.0, 0.15], [0.85, 0.15, 0.15], [0.15, 0.15, 0.15],
		[0.15, 0.85, 0.15], [0.85, 0.85, 0.15], [0.85, 1.0, 0.15], [0.15, 1.0, 0.15],
		[0.0, 0.15, 0.15], [0.15, 0.15, 0.15], [0.15, 0.85, 0.15], [0.0, 0.85, 0.15],
		[0.85, 0.15, 0.15], [1.0, 0.15, 0.15], [1.0, 0.85, 0.15], [0.85, 0.85, 0.15],

		[0.15, 0.0, 0.85], [0.85, 0.0, 0.85], [0.85, 0.15, 0.85], [0.15, 0.15, 0.85],
		[0.15, 0.85, 0.85], [0.85, 0.85, 0.85], [0.85, 1.0, 0.85], [0.15, 1.0, 0.85],
		[0.0, 0.15, 0.85], [0.15, 0.15, 0.85], [0.15, 0.85, 0.85], [0.0, 0.85, 0.85],
		[0.85, 0.15, 0.85], [1.0, 0.15, 0.85], [1.0, 0.85, 0.85], [0.85, 0.85, 0.85],


		[0.15, 0.15, 0.0], [0.85, 0.15, 0.0], [0.85, 0.15, 0.15], [0.15, 0.15, 0.15],
		[0.15, 0.15, 0.85], [0.85, 0.15, 0.85], [0.85, 0.15, 1.0], [0.15, 0.15, 1.0],
		[0.0, 0.15, 0.15], [0.15, 0.15, 0.15], [0.15, 0.15, 0.85], [0.0, 0.15, 0.85],
		[0.85, 0.15, 0.15], [1.0, 0.15, 0.15], [1.0, 0.15, 0.85], [0.85, 0.15, 0.85],
																									
		[0.15, 0.85, 0.0], [0.85, 0.85, 0.0], [0.85, 0.85, 0.15], [0.15, 0.85, 0.15],
		[0.15, 0.85, 0.85], [0.85, 0.85, 0.85], [0.85, 0.85, 1.0], [0.15, 0.85, 1.0],
		[0.0, 0.85, 0.15], [0.15, 0.85, 0.15], [0.15, 0.85, 0.85], [0.0, 0.85, 0.85],
		[0.85, 0.85, 0.15], [1.0, 0.85, 0.15], [1.0, 0.85, 0.85], [0.85, 0.85, 0.85],


		[0.15, 0.15, 0.0], [0.15, 0.85, 0.0], [0.15, 0.85, 0.15], [0.15, 0.15, 0.15],
		[0.15, 0.15, 0.85], [0.15, 0.85, 0.85], [0.15, 0.85, 1.0], [0.15, 0.15, 1.0],
		[0.15, 0.0, 0.15], [0.15, 0.15, 0.15], [0.15, 0.15, 0.85], [0.15, 0.0, 0.85],
		[0.15, 0.85, 0.15], [0.15, 1.0, 0.15], [0.15, 1.0, 0.85], [0.15, 0.85, 0.85],
																											
		[0.85, 0.15, 0.0], [0.85, 0.85, 0.0], [0.85, 0.85, 0.15], [0.85, 0.15, 0.15],
		[0.85, 0.15, 0.85], [0.85, 0.85, 0.85], [0.85, 0.85, 1.0], [0.85, 0.15, 1.0],
		[0.85, 0.0, 0.15], [0.85, 0.15, 0.15], [0.85, 0.15, 0.85], [0.85, 0.0, 0.85],
		[0.85, 0.85, 0.15], [0.85, 1.0, 0.15], [0.85, 1.0, 0.85], [0.85, 0.85, 0.85],
		
		[0.15, 0.15, 0.15], [0.85, 0.15, 0.15], [0.85, 0.15, 0.85], [0.15, 0.15, 0.85],
		[0.15, 0.15, 0.15], [0.15, 0.85, 0.15], [0.15, 0.85, 0.85], [0.15, 0.15, 0.85],
		[0.15, 0.15, 0.15], [0.15, 0.85, 0.15], [0.85, 0.85, 0.15], [0.85, 0.15, 0.15],
		
		[0.15, 0.85, 0.15], [0.85, 0.85, 0.15], [0.85, 0.85, 0.85], [0.15, 0.85, 0.85],
		[0.85, 0.15, 0.15], [0.85, 0.85, 0.15], [0.85, 0.85, 0.85], [0.85, 0.15, 0.85],
		[0.15, 0.15, 0.85], [0.15, 0.85, 0.85], [0.85, 0.85, 0.85], [0.85, 0.15, 0.85]
	];
	var spv = [0.5, 0.5, 0.5];

	block.group.vertexCount = faces.length;
	//block.group.verts = (Nova_Vector*)my_malloc(block.group.vertexCount * sizeof(Nova_Vector));
	//block.group.edgeNorms = (Nova_Vector*)my_malloc(block.group.vertexCount * sizeof(Nova_Vector)); 
	m = [Vector_Subtract(vertices[3], vertices[0]),
	     Vector_Subtract(vertices[1], vertices[0]),
	     Vector_Subtract(vertices[4], vertices[0])];
	m = Matrix_Transpose(m);
	var verts = new Array(block.group.vertexCount);
	for (i = 0; i < block.group.vertexCount; i++)
	{
		verts[i] = Vector_Add(vertices[0], Matrix_Mult(m, faces[i]));
	}

	block.group.polyCount = block.group.vertexCount / 4;
	block.group.polys = new Array(block.group.polyCount);//(Nova_Polygon*)my_malloc(block.group.polyCount * sizeof(Nova_Polygon));
	ASSERT(block.group.polyCount == 54);
	for (i = 0; i < block.group.polyCount; i++)
	{
		block.group.polys[i] = Polygon_New();
		var poly = block.group.polys[i];
		poly.primitive.color = [block.color[0], block.color[1], block.color[2], 1];
		poly.sides = 4;
		poly.primitive.pTexture = g_atlasTex;
		poly.vertex =[verts[0+4*i], verts[1+4*i], verts[2+4*i], verts[3+4*i]];
		poly.edgeNormals = new Array(4);
		poly.pGLVerts = g_glverts;
		poly.vbos = g_vbos;
		poly.pTriIndices = new Uint16Array(6);
		poly.indices = 0;		
		block.atlasCoords = Atlas_BlockCoords(ekChanger);
		Nova_PreprocessPolygons([poly], 1);
		for (j = 0; j < poly.sides; j++)
		{
			g_glverts[g_glvertCount + j][0] = poly.vertex[j][0];
			g_glverts[g_glvertCount + j][1] = poly.vertex[j][1];
			g_glverts[g_glvertCount + j][2] = poly.vertex[j][2];
			if (faces[4 * i][0] == faces[4 * i + 2][0])
			{
				g_glverts[g_glvertCount + j][7] = faces[4 * i + j][1] * Atlas_Scale;
				g_glverts[g_glvertCount + j][8] = faces[4 * i + j][2] * Atlas_Scale;
			}
			else if (faces[4 * i][1] == faces[4 * i + 2][1])
			{
				g_glverts[g_glvertCount + j][7] = faces[4 * i + j][2] * Atlas_Scale;
				g_glverts[g_glvertCount + j][8] = faces[4 * i + j][0] * Atlas_Scale;
			}
			else 
			{
				g_glverts[g_glvertCount + j][7] = faces[4 * i + j][0] * Atlas_Scale;
				g_glverts[g_glvertCount + j][8] = faces[4 * i + j][1] * Atlas_Scale;
			}
			if (j >= 2)
			{
				poly.pTriIndices[poly.indices++] = g_glvertCount;
				poly.pTriIndices[poly.indices++] = g_glvertCount + j - 1;
				poly.pTriIndices[poly.indices++] = g_glvertCount + j;				
			}

			g_glverts[g_glvertCount + j][7] = block.atlasCoords.s + g_glverts[g_glvertCount + j][7] * Atlas_TexSize;
			g_glverts[g_glvertCount + j][8] = block.atlasCoords.t + g_glverts[g_glvertCount + j][8] * Atlas_TexSize;
		}
		g_glvertCount += j;
	}
	
	ASSERT(g_glvertCount < glVertBufSize);
	ASSERT(g_indCount < indBufSize);

	block.group.sphereCount = 1;
	block.group.spheres = [];
	block.group.spheres[0] = Sphere_New();
	block.group.spheres[0].primitive.pTexture = NullTexture.value();//Level_GetBall().texture;
	block.group.spheres[0].primitive.color = [block.color[0], block.color[1], block.color[2], 1];
	block.group.spheres[0].position = block.middle = Vector_Add(vertices[0], Matrix_Mult(m, spv));
	block.group.spheres[0].radius = 
		(Vector_Length(m[0]) < Vector_Length(m[1]) ?
			(Vector_Length(m[0]) < Vector_Length(m[2]) ? Vector_Length(m[0]) : Vector_Length(m[2])) :
			(Vector_Length(m[1]) < Vector_Length(m[2]) ? Vector_Length(m[1]) : Vector_Length(m[2]))) / 4.5;
	
	for (i = 0; i < (block.group.polyCount - 6)/2; i++)
	{
		if (block.group.polys[i].plane.k - Vector_Dot(block.group.polys[i].plane.normal, block.group.spheres[0].position) < 0)
			block.group.polys[i].primitive.flags |= Nova_fCullFront;
		else
			block.group.polys[i].primitive.flags |= Nova_fCullBack;
	}
	for (; i < block.group.polyCount - 6; i++)
	{
		if (block.group.polys[i].plane.k - Vector_Dot(block.group.polys[i].plane.normal, block.group.spheres[0].position) < 0)
			block.group.polys[i].primitive.flags |= Nova_fCullBack;
		else
			block.group.polys[i].primitive.flags |= Nova_fCullFront;
	}
	for (; i < block.group.polyCount; i++)
	{
		block.group.polys[i].primitive.flags |= Nova_fInvisible;
		if (block.group.polys[i].plane.k - Vector_Dot(block.group.polys[i].plane.normal, block.group.spheres[0].position) < 0)
			block.group.polys[i].primitive.flags |= Nova_fCullFront;
		else
			block.group.polys[i].primitive.flags |= Nova_fCullBack;
	}
}

function Changer_New()
{
	var pChanger = {};
	pChanger.b = pChanger;
	pChanger.b.group = pChanger;
	//memset(pChanger, 0, sizeof(*pChanger));

	pChanger.b.group.LevelFinishedLoading = PolygonGroup_LevelFinishedLoading;
	pChanger.b.group.SetCheckpoint = Changer_SetCheckpoint;
	pChanger.b.group.GotoCheckpoint = Changer_GotoCheckpoint;
	pChanger.b.group.Collide = Changer_Collide;
	pChanger.b.group.Free = Block_Group_Free;
	pChanger.b.Free = Block_Free;
	pChanger.b.LoadPolys = Changer_LoadPolys;
	pChanger.b.SwitchHit = Block_SwitchHit;
	pChanger.b.group.Persist = Changer_Persist;
	pChanger.b.group.Recover = Block_Recover;	
	pChanger.b.ParseTag = Changer_ParseTag;
	
	pChanger.b.group.transparent = FALSE;
	pChanger.b.group.moving = FALSE;
	pChanger.b.color = [1,1,1,1];
	pChanger.checkColor = [1,1,1,1];
	pChanger.b.group.bVisible = TRUE;
	pChanger.b.group.type = ekChanger;
	pChanger.lastCollisionCount = -1;
	pChanger.checkCollisionCount = -1;

	return pChanger.b;
}

///////////////////////////////////////////////////////////////////////////////
// Killer
function Killer_Collide(pGroup,pPrimitive)
{
var block = pGroup;

	if (Level_GetBall().bInvincible || cheat)
	{
		Level_AddDecorator(ShatterDecorator_FromBlock(block, NULL));
		Level_BlockBroken(block.group.index);
		block.group.bVisible = FALSE;
		Words_Show(block.middle, ekJobOrForRealsWord);
		Sound_Play3D(ekExtraGuySound, block.middle);
	}
	else
	{
		pGroup.bVisible = FALSE;
		Level_Explode();
	}
}

function Killer_LoadPolys(block,vertices)
{
	block.color[0] = block.color[1] = block.color[2] = 1;
	Block_LoadPolys(block, vertices);
}

function Killer_New()
{
	var pKiller = {};//(Block*)my_malloc(sizeof(Block));
	pKiller.group = pKiller;
	//memset(pKiller, 0, sizeof(*pKiller));a
	
	pKiller.group.LevelFinishedLoading = PolygonGroup_LevelFinishedLoading;
	pKiller.group.SetCheckpoint = PolygonGroup_SetCheckpoint;
	pKiller.group.GotoCheckpoint = PolygonGroup_GotoCheckpoint;
	pKiller.group.Collide = Killer_Collide;
	pKiller.group.Free = Block_Group_Free;
	pKiller.Free = Block_Free;
	pKiller.LoadPolys = Killer_LoadPolys;
	pKiller.SwitchHit = Block_SwitchHit;
	pKiller.group.Persist = Block_Persist;
	pKiller.group.Recover = Block_Recover;	
	pKiller.ParseTag = Block_ParseTag;	

	pKiller.group.transparent = TRUE;
	pKiller.group.moving = FALSE;
	pKiller.group.bVisible = TRUE;
	pKiller.group.type = ekKiller;

	return pKiller;
}

///////////////////////////////////////////////////////////////////////////////
// Inversion
var Inversion_rollOffset;
var Inversion_seconds;
var Inversion_bInUse = FALSE;
function Inversion_MoveForward(d,mag)
{
	BaseDecorator_MoveForward(d, -mag);
}

function InversionDecorator_Free(d)
{
	Inversion_bInUse = FALSE;
	Decorator_Free(d);
}

function Inversion_NextFrame(d,spf,step)
{
	BaseDecorator_NextFrame(d, spf, step);

	if (Inversion_seconds < 12)
	{
		if (Inversion_rollOffset < 180 || Inversion_rollOffset > 180 + (5 * 250) / 60)
			Inversion_rollOffset += 250 * spf;
		if (Inversion_rollOffset >= 180 && Inversion_rollOffset <= 180 + (5 * 250) / 60)
			Inversion_rollOffset = 180;

		var angle = Camera_GetViewAngle();
		Nova_SetViewAngle3f(angle.yaw, angle.pitch, angle.roll + Inversion_rollOffset);
		
		Inversion_seconds += spf;
		if (Inversion_seconds >= 12)
			Sound_Play(ekUninvertSound);
	}
	else
	{
		if (Inversion_rollOffset < 360)
			Inversion_rollOffset += 250 * spf;
		if (Inversion_rollOffset >= 360)
			Inversion_rollOffset = 0;
		
		var angle = Camera_GetViewAngle();
		Nova_SetViewAngle3f(angle.yaw, angle.pitch, angle.roll + Inversion_rollOffset);
		
		Inversion_seconds += spf;
		
		if (Inversion_rollOffset == 0)
		{
			d.Free(d);
		}
	}
}

function InversionDecorator_New()
{
	var d = Decorator_New();
	d.NextFrame = Inversion_NextFrame;
	d.MoveForward = Inversion_MoveForward;
	d.Free = InversionDecorator_Free;
	
	return d;
}

function Inversion_Collide(pGroup,pPrimitive)
{
	if (cheat) { Sound_Play(ekClickSound); return; }
	if (!Inversion_bInUse)
	{
		var d = InversionDecorator_New();
		Inversion_rollOffset = 0;
		Inversion_seconds = 0;
		Inversion_bInUse = TRUE;
		Level_AddDecorator(d);
		Sound_Play(ekInvertSound);
	}
	else
	{
		Inversion_seconds = 0; // Restart the timer
		Sound_Play(ekInvertSound);
	}
}

function Inversion_New()
{
	var pInversion = {};//(Block*)my_malloc(sizeof(Block));
	pInversion.group = pInversion;
	//memset(pInversion, 0, sizeof(*pInversion));

	pInversion.group.LevelFinishedLoading = PolygonGroup_LevelFinishedLoading;
	pInversion.group.SetCheckpoint = PolygonGroup_SetCheckpoint;
	pInversion.group.GotoCheckpoint = PolygonGroup_GotoCheckpoint;
	pInversion.group.Collide = Inversion_Collide;
	pInversion.group.Free = Block_Group_Free;
	pInversion.Free = Block_Free;
	pInversion.LoadPolys = Block_LoadPolys;
	pInversion.SwitchHit = Block_SwitchHit;
	pInversion.group.Persist = Block_Persist;
	pInversion.group.Recover = Block_Recover;
	pInversion.ParseTag = Block_ParseTag;

	pInversion.group.transparent = FALSE;
	pInversion.group.moving = FALSE;
	pInversion.group.bVisible = TRUE;
	pInversion.group.type = ekInversion;

	return pInversion;
}

///////////////////////////////////////////////////////////////////////////////
// Speedup
var Speedup_bInUse = FALSE;
var Speedup_Seconds;

function SpeedupDecorator_Free(d)
{
	Speedup_bInUse = FALSE;
	Decorator_Free(d);
}

function Speedup_NextFrame(d,spf,step)
{
	Level_GetBall().speed *= 2.2;
	BaseDecorator_NextFrame(d, spf, step);
	Speedup_Seconds += spf;
	if (Speedup_Seconds > 12)
	{
		d.Free(d);
	}
}

function SpeedupDecorator_New()
{
	var d = Decorator_New();
	d.NextFrame = Speedup_NextFrame;
	d.Free = SpeedupDecorator_Free;
	
	return d;
}

function Speedup_Collide(pGroup,pPrimitive)
{
	if (cheat) { Sound_Play(ekClickSound); return; }
	if (!Speedup_bInUse)
	{
		var d = SpeedupDecorator_New();
		Speedup_Seconds = 0;
		Speedup_bInUse = TRUE;
		Level_AddDecorator(d);
		Sound_Play(ekSpeedupSound);
	}
	else
	{
		Speedup_Seconds = 0; // Restart the timer
		Sound_Play(ekSpeedupSound);
	}
}

function Speedup_New()
{
	var pSpeedup = {};//(Block*)my_malloc(sizeof(Block));
	pSpeedup.group = pSpeedup;
	//memset(pSpeedup, 0, sizeof(*pSpeedup));

	pSpeedup.group.LevelFinishedLoading = PolygonGroup_LevelFinishedLoading;
	pSpeedup.group.SetCheckpoint = PolygonGroup_SetCheckpoint;
	pSpeedup.group.GotoCheckpoint = PolygonGroup_GotoCheckpoint;
	pSpeedup.group.Collide = Speedup_Collide;
	pSpeedup.group.Free = Block_Group_Free;
	pSpeedup.Free = Block_Free;
	pSpeedup.LoadPolys = Block_LoadPolys;
	pSpeedup.SwitchHit = Block_SwitchHit;
	pSpeedup.group.Persist = Block_Persist;
	pSpeedup.group.Recover = Block_Recover;
	pSpeedup.ParseTag = Block_ParseTag;

	pSpeedup.group.transparent = FALSE;
	pSpeedup.group.moving = FALSE;
	pSpeedup.group.bVisible = TRUE;
	pSpeedup.group.type = ekSpeedup;

	return pSpeedup;
}

///////////////////////////////////////////////////////////////////////////////
// Ghost
var Ghost_bInUse = FALSE;
var Ghost_Seconds;
function GhostDecorator_Free(d)
{
	Ghost_bInUse = FALSE;
	Decorator_Free(d);
}

function Ghost_NextFrame(d,spf,step)
{
	BaseDecorator_NextFrame(d, spf, step);
	Ghost_Seconds += spf;
	if (Ghost_Seconds > 12)
	{
		Sound_Play(ekGhostEndSound);
		d.Free(d);
	}
}

function Ghost_Draw(d,mask)
{
	Level_GetBall().bVisible = FALSE;
	BaseDecorator_Draw(d, mask);
}

function GhostDecorator_New()
{
	var d = Decorator_New();
	d.NextFrame = Ghost_NextFrame;
	d.Draw = Ghost_Draw;
	d.Free = GhostDecorator_Free;
	
	return d;
}

function Ghost_Collide(pGroup,pPrimitive)
{
	if (cheat) { Sound_Play(ekClickSound); return; }
	if (!Ghost_bInUse)
	{
		var d = GhostDecorator_New();
		Ghost_Seconds = 0;
		Ghost_bInUse = TRUE;
		Level_AddDecorator(d);
		Sound_Play(ekGhostStartSound);
	}
	else
	{
		Ghost_Seconds = 0; // Restart the timer
		Sound_Play(ekGhostStartSound);
	}
}

function Ghost_New()
{
	var pGhost = {};//(Block*)my_malloc(sizeof(Block));
	pGhost.group = pGhost;
	//memset(pGhost, 0, sizeof(*pGhost));

	pGhost.group.LevelFinishedLoading = PolygonGroup_LevelFinishedLoading;
	pGhost.group.SetCheckpoint = PolygonGroup_SetCheckpoint;
	pGhost.group.GotoCheckpoint = PolygonGroup_GotoCheckpoint;
	pGhost.group.Collide = Ghost_Collide;
	pGhost.group.Free = Block_Group_Free;
	pGhost.Free = Block_Free;
	pGhost.LoadPolys = Block_LoadPolys;
	pGhost.SwitchHit = Block_SwitchHit;
	pGhost.group.Persist = Block_Persist;
	pGhost.group.Recover = Block_Recover;
	pGhost.ParseTag = Block_ParseTag;

	pGhost.group.transparent = FALSE;
	pGhost.group.moving = FALSE;
	pGhost.group.bVisible = TRUE;
	pGhost.group.type = ekGhost;

	return pGhost;
}

///////////////////////////////////////////////////////////////////////////////
// Checkpoint
function Checkpoint_Collide(pGroup,pPrimitive)
{
var i;
var b = pGroup;

	b.group.bVisible = FALSE;
	Level_SetCheckpoint(b.middle, b.yaw, b.pitch);
	
	Level_BlockBroken(b.group.index);
	
	Level_AddDecorator(ShatterDecorator_FromBlock(b, NULL));
	
	Sound_Play3D(ekCheckpointSound, b.middle);
	Words_Show(b.middle, ekCheckpointWord);
}

function Checkpoint_New()
{
	var pCheckpoint = {};//(Block*)my_malloc(sizeof(Block));
	pCheckpoint.group = pCheckpoint;
	//memset(pCheckpoint, 0, sizeof(*pCheckpoint));

	pCheckpoint.group.LevelFinishedLoading = PolygonGroup_LevelFinishedLoading;
	pCheckpoint.group.SetCheckpoint = PolygonGroup_SetCheckpoint;
	pCheckpoint.group.GotoCheckpoint = PolygonGroup_GotoCheckpoint;
	pCheckpoint.group.Collide = Checkpoint_Collide;
	pCheckpoint.group.Free = Block_Group_Free;
	pCheckpoint.Free = Block_Free;
	pCheckpoint.LoadPolys = Block_LoadPolys;
	pCheckpoint.SwitchHit = Block_SwitchHit;
	pCheckpoint.group.Persist = Block_Persist;
	pCheckpoint.group.Recover = Block_Recover;
	pCheckpoint.ParseTag = Block_ParseTag;

	pCheckpoint.group.transparent = TRUE;
	pCheckpoint.group.moving = FALSE;
	pCheckpoint.group.bVisible = TRUE;
	pCheckpoint.group.type = ekCheckpoint;

	return pCheckpoint;
}

///////////////////////////////////////////////////////////////////////////////
// SpikeBlock

function SpikeBlock_Collide(pGroup,pPrimitive)
{
if (cheat) { Sound_Play(ekClickSound); return; }
var block = pGroup;
var b;
var ball = Level_GetBall();

	b = Spike_New();
	if (b)
	{
		b.type = ekDeflective;
		b.sphere.position = arrdup(block.middle);		
		var coll = Level_FindNextCollision(b.sphere.position, 0, ball.velocity, FALSE);
		b.sphere.position = coll.pos;
		Spike_SetVelocity(b, ball.velocity);
		Sound_Play3D(ekClickSound, ball.sphere.position);
	}
	else
	{
		Sound_Play3D(ekClickSound, ball.sphere.position);
	}
}

function SpikeBlock_LoadPolys(block,vertices)
{
	block.color[0] = block.color[1] = block.color[2] = 
		block.color[3] = 1;
	Block_LoadPolys(block, vertices);
}

function SpikeBlock_New()
{
	var pSpikeBlock = {};//(Block*)my_malloc(sizeof(Block));
	pSpikeBlock.group = pSpikeBlock;
	//memset(pSpikeBlock, 0, sizeof(*pSpikeBlock));

	pSpikeBlock.group.LevelFinishedLoading = PolygonGroup_LevelFinishedLoading;
	pSpikeBlock.group.SetCheckpoint = PolygonGroup_SetCheckpoint;
	pSpikeBlock.group.GotoCheckpoint = PolygonGroup_GotoCheckpoint;
	pSpikeBlock.group.Collide = SpikeBlock_Collide;
	pSpikeBlock.group.Free = Block_Group_Free;
	pSpikeBlock.Free = Block_Free;
	pSpikeBlock.LoadPolys = SpikeBlock_LoadPolys;
	pSpikeBlock.SwitchHit = Block_SwitchHit;
	pSpikeBlock.group.Persist = Block_Persist;
	pSpikeBlock.group.Recover = Block_Recover;
	pSpikeBlock.ParseTag = Block_ParseTag;

	pSpikeBlock.group.transparent = FALSE;
	pSpikeBlock.group.moving = FALSE;
	pSpikeBlock.group.bVisible = TRUE;
	pSpikeBlock.group.type = ekSpike;

	return pSpikeBlock;
}

/////////////////////////////////////////////////////////////////////////////////////
// Extra Guy
function ExtraGuy_Collide(pGroup,pPrimitive)
{
var ball = Level_GetBall();
var block = pGroup;

	if (Color_Equals(ball.sphere.primitive.color, block.color) || ball.bInvincible)
	{ 
		pGroup.bVisible = FALSE;
		Level_AddDecorator(ShatterDecorator_FromBlock(block, NULL));
		Level_BlockBroken(pGroup.index);

		if (block.color[0] > .9 && block.color[1] > .9 && block.color[2] < .6)
		{
			Words_Show(block.middle, ekSecretHeartWord);
			Block_PlayShatterSound(block, pPrimitive);
			Sound_Play(ekSecretSound);
		}
		else
		{
			Words_Show(block.middle, ekJobOrForRealsWord);
			Sound_Play3D(ekExtraGuySound, block.middle);
		}
	}
	else
	{
		Sound_Play3D(ekClickSound, ball.sphere.position);
	}
}

function ExtraGuy_New()
{
	var b = Block_New();
	b.group.type = ekExtraGuy;
	b.group.Collide = ExtraGuy_Collide;
	return b;
}

/////////////////////////////////////////////////////////////////////////////////////
// Invincible
var Invincible_Seconds;
var Invincible_bInUse = FALSE;
var Invincible_InitialColor = [0,0,0];
function InvincibleDecorator_Free(d)
{
	Invincible_bInUse = FALSE;
	arrcpy(Level_GetBall().sphere.primitive.color, Invincible_InitialColor, 3);
	Decorator_Free(d);
}

function InvincibleDecorator_NextFrame(d,spf,step)
{
var i;
var ball = Level_GetBall();
var last = NULL;

	ball.bInvincible = TRUE;

	if (!ball.bMoving)
	{
		BaseDecorator_NextFrame(d, spf, step);
		return;
	}
	
	for (i = 0; i < 3; i++)
	{
		var c = ball.sphere.primitive.color[i] + rand() / (10.0 * RAND_MAX);
		ball.sphere.primitive.color[i] = 0.4 + (c - Math.floor(c)) * 0.6;
	}
	
	ball.angularVelocity = Vector_Scale(ball.controlAngle[0], -4);

	if (Invincible_Seconds < 12 - 1.5 && !(Invincible_Seconds + spf < 12 - 1.5))
		Sound_Play(ekInvincibleEndSound);

	Invincible_Seconds += spf;

	while (ball.iCollisionGroup != 0 && ball.bMoving && ball.pCollisionPoly != NULL &&
			 (Vector_Dot(Vector_Subtract(ball.nextCollision, Vector_AddScale(
			  ball.sphere.position, ball.velocity, step * spf * ball.speed)), ball.velocity) <= 0))
	{
		var block = Level_GetLevel().map.polyGroups[ball.iCollisionGroup];
		if (block == last)
			break;
		last = block;

		if (block.group.transparent && block.group.type != ekHider)
		{
			if (block.group.type == ekCheckpoint)
				arrcpy(ball.sphere.primitive.color, Invincible_InitialColor, 3);
			
			block.group.Collide(block.group, ball.pCollisionPoly.primitive);
			Level_Collided(block.group.type);
			if (!block.group.bVisible)
				Sound_Play(ekSpeedupSound);
		}
		else
		{
			break;
		}

		Ball_FindNextCollision();
		Ball_FindShadows();
	}

	BaseDecorator_NextFrame(d, spf, step);

	if (Invincible_Seconds > 12)
	{
		d.Free(d);
	}
}

function InvincibleDecorator_New()
{
	var d = Decorator_New();
	d.NextFrame = InvincibleDecorator_NextFrame;
	d.Free = InvincibleDecorator_Free;
	
	return d;
}

function Invincible_Collide(pGroup,pPrimitive)
{
	Block_Collide(pGroup, pPrimitive);

	if (!pGroup.bVisible) // It was shattered
	{
		if (!Invincible_bInUse)
		{
			var d = InvincibleDecorator_New();
			Invincible_Seconds = 0;
			Invincible_bInUse = TRUE;
			Level_AddDecorator(d);
			arrcpy(Invincible_InitialColor, Level_GetBall().sphere.primitive.color, 3);
		}
		else
		{
			Invincible_Seconds -= 12; // Add 12 more seconds
		}

		Sound_Play(ekInvincibleSound);
		Words_Show(pGroup.middle, ekInvincibleWord);
	}
	else
	{
		Sound_Play3D(ekClickSound, Level_GetBall().sphere.position);
	}
}
function Invincible_New()
{
	var b = Block_New();
	b.group.type = ekInvincible;
	b.group.Collide = Invincible_Collide;
	return b;
}

/////////////////////////////////////////////////////////////////////////////////////
// Hider
function Hider_SetHiderColor(block,color)
{
var h = block;
var i;

	arrcpy(h.hider.color, color, 3);
	h.hider.color[3] = 0.64;
	if (h.current == h.hider)
		arrcpy(h.base.color, color, 4);

	for (i = 0; i < h.hider.group.polyCount; i++)
		arrcpy(h.hider.group.polys[i].primitive.color, h.hider.color, 4);
}

function Hider_SetBlock(d,s)
{
	if (s.color) d.color = arrdup(s.color);
	d.yaw = s.yaw;
	d.pitch = s.pitch;
	if (s.middle) d.middle = arrdup(s.middle);
	d.largestArea = s.largestArea;
	d.iBlockGroup = s.iBlockGroup;
	if (s.atlasCoords) d.atlasCoords = shallowCopy(s.atlasCoords);
	if (s.camPos) d.camPos = arrdup(s.camPos);
	d.camYaw = s.camYaw;
	d.camPitch = s.camPitch;
	d.polys = s.polys;
	d.polyCount = s.polyCount;
	d.spheres = s.spheres;
	d.sphereCount = s.sphereCount;
	d.verts = s.verts;
	d.glverts = s.glverts;
	d.vbos = s.vbos;
	d.edgeNorms = s.edgeNorms;
	d.vertexCount = s.vertexCount;
	d.glvertCount = s.glvertCount;
	d.index = s.index;
	d.bVisible = s.bVisible;
	d.transparent = s.transparent;
	d.moving = s.moving;
	d.type = s.type;
}

function Hider_SetProxy(h,b)
{
	ASSERT(b == h.hider || b == h.block);

	// Persist the changes
	Hider_SetBlock(h.current, h.base);
	Hider_SetBlock(h.base, b);

	h.current = b;
}

function Hider_Free(block)
{
var h = block;
	
	h.hider.Free(h.hider);
	h.block.Free(h.block);

	my_free(h);
}

function Hider_LoadPolys(block,vertices)
{
var h = block;
 
	ASSERT(h.current == h.block);
	Hider_SetBlock(h.block, h.base);
	h.block.LoadPolys(h.block, vertices);
	Hider_SetBlock(h.base, h.block);

	h.hider.yaw = h.current.yaw;
	h.hider.pitch = h.current.pitch;
	h.hider.iBlockGroup = h.current.iBlockGroup;
	h.hider.LoadPolys(h.hider, vertices);

	// Anything that needs to be the same for the two...
	h.hider.group.index = h.base.group.index;

	Hider_SetProxy(h, h.hider);
}

function Hider_Uncover(h)
{
var i,j;
	
	ASSERT(h.current == h.hider);
	
	for (i = 0; i < h.block.group.polyCount; i++)
	{
		var poly = h.block.group.polys[i];
		
		Level_LightColor(poly.primitive.color, h.block.color, poly.plane.normal);
		
		if (poly.pGLVerts != NULL)
		{
			for  (j = 0; j < poly.indices; j++)
			{
				poly.pGLVerts[poly.pTriIndices[j]][3] = poly.primitive.color[0] >= 1 ? 255 : poly.primitive.color[0] * 255.99;
				poly.pGLVerts[poly.pTriIndices[j]][4] = poly.primitive.color[1] >= 1 ? 255 : poly.primitive.color[1] * 255.99;
				poly.pGLVerts[poly.pTriIndices[j]][5] = poly.primitive.color[2] >= 1 ? 255 : poly.primitive.color[2] * 255.99;
				poly.pGLVerts[poly.pTriIndices[j]][6] = poly.primitive.color[3] >= 1 ? 255 : poly.primitive.color[3] * 255.99;
			}
		}
	}
	
	if (g_vbos.coords)
		Nova_UpdateCoords(g_vbos, g_glverts, 0, g_glvertCount);
	if (g_vbos.colors)
		Nova_UpdateColors(g_vbos, g_glverts, 0, g_glvertCount);
	
	Hider_SetProxy(h, h.block);
	h.hider.group.bVisible = FALSE;
	if (h.current.group.transparent)
	{
		Bsp_UpdateTexCoords(h.base.group, h.current.atlasCoords.s - h.hider.atlasCoords.s,
								  h.current.atlasCoords.t - h.hider.atlasCoords.t);
		Bsp_SetColor(h.base.group, h.current.color);
	}
	else
	{
		Bsp_UpdateGroup(h.base.group, h.hider.group);
	}
}

function Hider_LevelFinishedLoading(g)
{
var h = g;
var unused = h.current == h.block ? h.hider : h.block;
	
	Hider_SetBlock(h.current, h.base);
	h.current.group.LevelFinishedLoading(h.current.group);
	Hider_SetBlock(h.base, h.current);
	
	unused.group.LevelFinishedLoading(unused.group);
}

function Hider_SetCheckpoint(g)
{
var h = g;
	
	Hider_SetBlock(h.current, h.base);
	h.hider.group.SetCheckpoint(h.hider.group);
	h.block.group.SetCheckpoint(h.block.group);
	Hider_SetBlock(h.base, h.current);
}

function Hider_GotoCheckpoint(g)
{
var h = g;
	
	Hider_SetBlock(h.current, h.base);
	h.hider.group.GotoCheckpoint(h.hider.group);
	h.block.group.GotoCheckpoint(h.block.group);
	Hider_SetBlock(h.base, h.current);
}

function Hider_Collide(pGroup,pPrimitive)
{
var h = pGroup;

	if (h.current == h.hider)
	{
		if (!Level_GetBall().bInvincible && 
			 !Color_Equals(Level_GetBall().sphere.primitive.color, h.hider.color))
		{
			Sound_Play(ekClickSound);
			return;
		}

		Hider_Uncover(h);
		Sound_Play(rand() & 1 ? ekChanger0Sound : ekChanger1Sound);
	}
	else
	{
		Hider_SetBlock(h.current, h.base);
		h.current.group.Collide(h.current.group, pPrimitive);
		Hider_SetBlock(h.base, h.current);
	}
}

function Hider_SwitchHit(b,on)
{
var h = b;
	
	Hider_SetBlock(h.current, h.base);
	h.current.SwitchHit(h.current, on);
	Hider_SetBlock(h.base, h.current);
}

function Hider_Persist(group)
{
var h = group;
	
	Hider_SetBlock(h.current, h.base);
	
	psBegin(ekHiderBlockTag);
	h.hider.group.Persist(h.hider.group);
	psEnd(ekHiderBlockTag);
	
	psBegin(ekHiddenBlockTag);
	h.block.group.Persist(h.block.group);
	psEnd(ekHiddenBlockTag);
	
	Hider_SetBlock(h.base, h.current);
	
	psWriteByteTag(ekHiderProxyTag, h.current == h.hider);
}

function Hider_ParseTag(b,tag,length)
{
var h = b;

	Hider_SetBlock(h.current, h.base);

	switch (tag) {
		case ekHiderBlockTag:
			h.hider.group.Recover(h.hider.group, length);
			break;
		case ekHiddenBlockTag:
			h.block.group.Recover(h.block.group, length);
			break;  
		case ekHiderProxyTag:
			if (!psReadByte())
				Hider_Uncover(h);
			break;
	}
	
	Hider_SetBlock(h.base, h.current);
}

function Hider_New(b)
{
	var h = {};//(HiderBlock*)my_malloc(sizeof(HiderBlock));
	h.base = h;
	h.base.group = h;
	//memset(h, 0, sizeof(*h));

	h.base.group.LevelFinishedLoading = Hider_LevelFinishedLoading;
	h.base.group.SetCheckpoint = Hider_SetCheckpoint;
	h.base.group.GotoCheckpoint = Hider_GotoCheckpoint;
	h.base.group.Collide = Hider_Collide;
	h.base.group.Free = Block_Group_Free;
	h.base.Free = Hider_Free;
	h.base.LoadPolys = Hider_LoadPolys;
	h.base.SwitchHit = Hider_SwitchHit;
	h.base.group.Persist = Hider_Persist;	
	h.base.group.Recover = Block_Recover;
	h.base.ParseTag = Hider_ParseTag;
	h.base.color = [0,0,0];

	h.hider = Block_New();
	h.hider.group.type = ekHider;
	h.block = b;
	h.current = h.base;
	Hider_SetProxy(h, b);

	return h.base;
}

function SlidingStar_New()
{
	var b = Coaster_New();
	b.group.type = ekSlidingStar;
	return b;
}

/////////////////////////////////////////////////////////////////////////////////////
// Persistence
function Blocks_Persist()
{
	if (Inversion_bInUse)
	{
		psBegin(ekInversionTag);
		
		psWriteFloat(Inversion_seconds);
		psWriteFloat(Inversion_rollOffset);
		
		psEnd(ekInversionTag);
	}
	if (Ghost_bInUse)
	{
		psWriteFloatTag(ekGhostTag, Ghost_Seconds);
	}
	if (Speedup_bInUse)
	{
		psWriteFloatTag(ekSpeedupTag, Speedup_Seconds);
	}
	if (Invincible_bInUse)
	{
		psBegin(ekInvincibleTag);
		
		psWriteFloat(Invincible_Seconds);
		psWriteFloatArray(Invincible_InitialColor, 3);
		
		psEnd(ekInvincibleTag);
	}
}

function ParseBlocks(param,tag,length)
{
	switch (tag)
	{
		case ekInversionTag:
			Inversion_seconds = psReadFloat();
			Inversion_rollOffset = psReadFloat();
			Inversion_bInUse = TRUE;
			Level_AddDecorator(InversionDecorator_New());
			break;
		case ekGhostTag:
			Ghost_Seconds = psReadFloat();
			Ghost_bInUse = TRUE;
			Level_AddDecorator(GhostDecorator_New());
			break;
		case ekSpeedupTag:
			Speedup_Seconds = psReadFloat();
			Speedup_bInUse = TRUE;
			Level_AddDecorator(SpeedupDecorator_New());
			break;
		case ekInvincibleTag:
			Invincible_Seconds = psReadFloat();
			Invincible_InitialColor = psReadFloatArray(3);
			Invincible_bInUse = TRUE;
			Level_AddDecorator(InvincibleDecorator_New());
			break;
	}
}

function Blocks_Restore(param,size)
{
	psParse({},ParseBlocks,size);
}
