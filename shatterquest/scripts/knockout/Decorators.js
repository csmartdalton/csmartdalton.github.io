function BaseDecorator_MouseMove(d,x,y)
{
	if (d.next)
		d.next.MouseMove(d.next, x, y);
}

function BaseDecorator_MoveForward(d,mag)
{
	if (d.next)
		d.next.MoveForward(d.next, mag);
}

function BaseDecorator_MoveSide(d,mag)
{
	if (d.next)
		d.next.MoveSide(d.next, mag);
}

function BaseDecorator_Turn(d,mag)
{
	if (d.next)
		d.next.Turn(d.next, mag);
}

function BaseDecorator_NextFrame(d,spf,step)
{
	if (d.next)
		d.next.NextFrame(d.next, spf, step);
}

function BaseDecorator_Render(d,mask)
{
	if (d.next)
		d.next.Render(d.next, mask);
}

function BaseDecorator_Draw(d,mask)
{
	if (d.next)
		d.next.Draw(d.next, mask);
}

function BaseDecorator_RenderTransparent(d,mask)
{
	if (d.next)
		d.next.RenderTransparent(d.next, mask);
}

function BaseDecorator_DrawOverlay(d)
{
	if (d.next)
		d.next.DrawOverlay(d.next);
}

function BaseDecorator_WillTerminate(d)
{
	if (d.next)
		d.next.WillTerminate(d.next);
}

function Decorator_New()
{
	var d = {};
	Decorator_Init(d);
	return d;
}

function Decorator_Init(d)
{
	d.MouseMove = BaseDecorator_MouseMove;
	d.MoveForward = BaseDecorator_MoveForward;
	d.MoveSide = BaseDecorator_MoveSide;
	d.Turn = BaseDecorator_Turn;
	d.NextFrame = BaseDecorator_NextFrame;
	d.Render = BaseDecorator_Render;
	d.Draw = BaseDecorator_Draw;
	d.RenderTransparent = BaseDecorator_RenderTransparent;
	d.DrawOverlay = BaseDecorator_DrawOverlay;
	d.Free = Decorator_Free;
	d.WillTerminate = BaseDecorator_WillTerminate;
	d.next = NULL;
}

function Decorator_Add(d,next)
{
	d.next = next;
	return d;
}

function Decorator_Remove(d,parent)
{
	if (d == parent)
	{
		return parent.next;
	}
	else
	{
		parent.next = Decorator_Remove(d,parent.next);
		return parent;
	}
}

function Decorator_Free(d)
{
	Level_RemoveDecorator(d);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
// Specific
function DieDecorator_Finish(d)
{
var dd = d;

	Level_Die();	

	if (dd.Finished)
		dd.Finished();

	dd.d.Free(dd.d);
}

function DieDecorator_WillTerminate(d)
{
	BaseDecorator_WillTerminate(d);
	DieDecorator_Finish(d);
}

function DieDecorator_NextFrame(d,spf,step)
{
var dd = d;
	
	dd.a = dd.a += dd.da * spf;
	dd.sec += spf;
	
	if (!dd.bShowBall)
	{
		var ball = Level_GetBall();
		ball.bMoving = ball.bVisible = ball.bShadowsVisible = FALSE;
	}

	Level_GetLevel().spikeHiding = dd.spikeHiding;

	Level_GetCamera().zTarget = Level_GetCamera().position[2] = dd.camPos[2];
	
	BaseDecorator_NextFrame(d, spf, step);
	
	if (dd.sec >= dd.time)
		DieDecorator_Finish(dd.d);
}

function DieDecorator_DrawOverlay(d)
{
var dd = d;

	var size = Nova_GetScreenSize();
	var w = size[0];
	var h = size[1];
	var verts = [
		0, 0, -1,
		0, h, -1,
		w, h, -1,
		w, 0, -1,		 
	];
	
	BaseDecorator_DrawOverlay(d);
	
	Nova_BeginSolidColor(dd.r, dd.g, dd.b, dd.a);
	Nova_DrawArrays(gl.TRIANGLE_FAN, verts, NULL, 4);
	Nova_EndSolidColor();
}

function DieDecorator_MoveForward(d,mag)
{
	// Withhold message from others
	BaseDecorator_MoveForward(d, 0);
}

function DieDecorator_MoveSide(d,mag)
{
	// Withhold message from others
	BaseDecorator_MoveSide(d, 0);	
}

function DieDecorator_MouseMove(d,x,y)
{
	// Withhold message from others
	BaseDecorator_MouseMove(d, 0, 0);	
}

function DieDecorator_Turn(d,mag)
{
	// Withhold message from others
	BaseDecorator_Turn(d, 0);	
}


function DieDecorator_NewHidingSpike(r,g,b,a0,a1,sec,bShowBall,spikeHiding)
{
var dd = {};
dd.d = dd;

	Decorator_Init(dd.d);
	dd.d.DrawOverlay = DieDecorator_DrawOverlay;
	dd.d.NextFrame = DieDecorator_NextFrame;
	dd.d.WillTerminate = DieDecorator_WillTerminate;
	dd.d.MoveForward = DieDecorator_MoveForward;
	dd.d.MoveSide = DieDecorator_MoveSide;	
	dd.d.MouseMove = DieDecorator_MouseMove;
	dd.d.Turn = DieDecorator_Turn;	
	dd.r = r;
	dd.g = g;
	dd.b = b;
	dd.a = a0;
	dd.da = (a1 - a0) / sec;	
	dd.time = sec;
	dd.sec = 0;
	dd.bShowBall = bShowBall;
	dd.spikeHiding = spikeHiding;
	dd.Finished = NULL;
	dd.camPos = Level_GetCamera().position;

	Level_MoveForward(0);
	Level_MoveSide(0);
	
	return dd;
}

function DieDecorator_New(r,g,b,a0,a1,sec,bShowBall)
{
	Level_MoveForward(0);
	Level_MoveSide(0);

	return DieDecorator_NewHidingSpike(r, g, b, a0, a1, sec, bShowBall, -1);
}

function DieDecorator_NewWithHook(r,g,b,a0,a1,sec,bShowBall,Finished)
{
var dd = DieDecorator_New(r, g, b, a0, a1, sec, bShowBall);

	dd.Finished = Finished;

	Level_MoveForward(0);
	Level_MoveSide(0);

	return dd;
}

function BlockShatterDecorator_Free(d)
{
	var bsd = d;
	Nova_FreeVbos(bsd.vbos);
	Decorator_Free(d);
}

function BlockShatterDecorator_Finish(d)
{
var bsd = d;
var finished = bsd.finished;
	
	bsd.d.Free(bsd.d);
	if (finished)
		finished();
}

function BlockShatterDecorator_WillTerminate(d)
{
	BaseDecorator_WillTerminate(d);
	if (d.finished)
		BlockShatterDecorator_Finish(d);	
}

function BlockShatterDecorator_NextFrame(d,spf,step)
{
var i, j;
var glvert = 0;
var bsd = d;

	bsd.time += spf;
	
	for (i = 0; i < bsd.polyCount; i++)
	{
		for (j = 0; j < bsd.polys[i].sides; j++)
		{
	  //	 bsd.polys[i].vertex[j] = Vector_Add(bsd.polys[i].vertex[j], Vector_Scale(bsd.vels[i], spf * step));
			bsd.glverts[glvert][0] += bsd.vels[i][0] * spf * step;
			bsd.glverts[glvert][1] += bsd.vels[i][1] * spf * step;
			bsd.glverts[glvert][2] += bsd.vels[i][2] * spf * step;
			glvert++;
		}
		bsd.polys[i].plane.k += Vector_Dot(bsd.vels[i], bsd.polys[i].plane.normal) * spf * step;
		bsd.vels[i][2] -= 6 * spf * step;
	}
	Nova_UpdateVerts(bsd.vbos, bsd.glverts, 0, glvert);
	
	if (bsd.finished)
		Level_GetBall().bMoving = FALSE;
	
	//Nova_PreprocessPolygons(bsd.polys, bsd.polyCount);	
	BaseDecorator_NextFrame(d, spf, step);
	
	if (bsd.time >= bsd.sec)
		BlockShatterDecorator_Finish(bsd.d);
}

function BlockShatterDecorator_Render(d,mask)
{
var bsd = d;

	Nova_RenderPolygons(bsd.polys, bsd.polyCount, NULL);	
	BaseDecorator_Render(d, mask);
}

function BlockShatterDecorator_RenderTransparent(d,mask)
{
var bsd = d;

	BaseDecorator_RenderTransparent(d, mask);
	Nova_RenderPolygons(bsd.polys, bsd.polyCount, NULL);	
}

var totalSplits = 4;
var shardsPerPoly = (1 << totalSplits);
var maxVertsPerShard = (4 + totalSplits);
var maxFacesPerBlock = 6;
function ShatterDecorator_FromBlock(pBlock,finished)
{
var i;
var b = pBlock;
var bsd = {};
bsd.d = bsd;
var vertCount = 0;
var splits;
var glvertCount = 0, glvertBufSize = 0;
var s = new Array(maxFacesPerBlock * shardsPerPoly);//[maxVertsPerShard];
var t = new Array(maxFacesPerBlock * shardsPerPoly);//[maxVertsPerShard];
	
	Decorator_Init(bsd.d);
	bsd.d.NextFrame = BlockShatterDecorator_NextFrame;
	if (b.group.transparent)
		bsd.d.RenderTransparent = BlockShatterDecorator_RenderTransparent;
	else
		bsd.d.Render = BlockShatterDecorator_Render;
	bsd.d.Free = BlockShatterDecorator_Free;
	bsd.d.WillTerminate = BlockShatterDecorator_WillTerminate;
	bsd.pBlock = b;
	bsd.polyCount = b.group.polyCount;
	ASSERT(bsd.polyCount <= maxFacesPerBlock);
	bsd.polys = [];//new Array(shardsPerPoly * bsd.polyCount);
	//memset(bsd.polys, 0, shardsPerPoly * bsd.polyCount * sizeof(Nova_Polygon));
	bsd.vels = [];//new Array(shardsPerPoly * bsd.polyCount);	
	bsd.time = 0;
	bsd.sec = finished ? 5 : 2;
	bsd.finished = finished;
	for (i = 0; i < bsd.polyCount; i++)
	{  
		bsd.polys[i] = Polygon_Clone(b.group.polys[i]);
		bsd.polys[i].vertex = arrdup(b.group.polys[i].vertex);
		bsd.polys[i].edgeNormals = NULL;		
		bsd.polys[i].primitive.flags &= ~Nova_fCullBack & ~Nova_fCullFront;
		bsd.polys[i].pGLVerts = NULL;
		bsd.polys[i].vbos = NULL;
		bsd.polys[i].pTriIndices = NULL;
		bsd.polys[i].indices = 0;

		s[i] = new Array(3);
		t[i] = new Array(3);
		s[i][0] = b.group.polys[i].pGLVerts[b.group.polys[i].pTriIndices[1]][7];
		t[i][0] = b.group.polys[i].pGLVerts[b.group.polys[i].pTriIndices[1]][8];
		s[i][1] = b.group.polys[i].pGLVerts[b.group.polys[i].pTriIndices[0]][7];
		t[i][1] = b.group.polys[i].pGLVerts[b.group.polys[i].pTriIndices[0]][8];
		s[i][2] = b.group.polys[i].pGLVerts[b.group.polys[i].pTriIndices[2]][7];
		t[i][2] = b.group.polys[i].pGLVerts[b.group.polys[i].pTriIndices[2]][8];
		s[i][3] = b.group.polys[i].pGLVerts[b.group.polys[i].pTriIndices[5]][7];
		t[i][3] = b.group.polys[i].pGLVerts[b.group.polys[i].pTriIndices[5]][8];
		
		vertCount += maxVertsPerShard;
	}
	
	for (splits = 0; splits < totalSplits; splits++)
	{
		var oldCount = bsd.polyCount;
		for (i = 0; i < oldCount; i++)
		{
			var front = [];//new Array(maxVertsPerShard);
			var back = [];//new Array(maxVertsPerShard);
			var sFront = [];//new Array(maxVertsPerShard);
			var sBack = [];//new Array(maxVertsPerShard);
			var tFront = [];//new Array(maxVertsPerShard);
			var tBack = [];//new Array(maxVertsPerShard);
			var frontCount = 0, backCount = 0;
			var j;
			
			var cut1 = rand() % (2*bsd.polys[i].sides);
			var cut2 = (cut1 + (cut1 & 1 ? 2 : 3) + rand() % (2*bsd.polys[i].sides - (cut1 & 1 ? 3 : 5)))  % (2*bsd.polys[i].sides);
			
			if (cut1 > cut2)
			{
				var tmp = cut1;
				cut1 = cut2;
				cut2 = tmp;
			}
			
			for (j = 0; j <= cut1 >> 1; j++)
			{
				sFront[frontCount] = s[i][j];
				tFront[frontCount] = t[i][j];
				front[frontCount++] = arrdup(bsd.polys[i].vertex[j]);
			}
			
			j = cut1 >> 1;
			if (cut1 & 1)
			{
				var next = (j + 1 >= bsd.polys[i].sides ? 0 : j + 1);
				var d = Vector_Subtract(bsd.polys[i].vertex[next], bsd.polys[i].vertex[j]);
				var amt = rand() / RAND_MAX;
				sFront[frontCount] = sBack[backCount] = s[i][j] + (s[i][next] - s[i][j]) * amt;
				tFront[frontCount] = tBack[backCount] = t[i][j] + (t[i][next] - t[i][j]) * amt;				
				front[frontCount++] = back[backCount++] = Vector_Add(bsd.polys[i].vertex[j], Vector_Scale(d, amt));
			}
			else
			{
				sBack[backCount] = s[i][cut1 >> 1];
				tBack[backCount] = t[i][cut1 >> 1];
				back[backCount++] = bsd.polys[i].vertex[cut1 >> 1];
			}
			
			for (j = (cut1 >> 1) + 1; j <= cut2 >> 1; j++)
			{
				sBack[backCount] = s[i][j];
				tBack[backCount] = t[i][j];
				back[backCount++] = arrdup(bsd.polys[i].vertex[j]);
			}
			
			j = cut2 >> 1;
			if (cut2 & 1)
			{
				var next = (j + 1 >= bsd.polys[i].sides ? 0 : j + 1);
				var d = Vector_Subtract(bsd.polys[i].vertex[next], bsd.polys[i].vertex[j]);
				var amt = rand() / RAND_MAX;
				sFront[frontCount] = sBack[backCount] = s[i][j] + (s[i][next] - s[i][j]) * amt;
				tFront[frontCount] = tBack[backCount] = t[i][j] + (t[i][next] - t[i][j]) * amt;				
				front[frontCount++] = back[backCount++] = Vector_Add(bsd.polys[i].vertex[j], Vector_Scale(d, amt));
			}
			else
			{
				sFront[frontCount] = s[i][cut2 >> 1];
				tFront[frontCount] = t[i][cut2 >> 1];
				front[frontCount++] = bsd.polys[i].vertex[cut2 >> 1];
			}
			
			for (j = (cut2 >> 1) + 1; j < bsd.polys[i].sides; j++)
			{
				sFront[frontCount] = s[i][j];
				tFront[frontCount] = t[i][j];
				front[frontCount++] = arrdup(bsd.polys[i].vertex[j]);
			}
			
			bsd.polys[bsd.polyCount] = shallowCopy(bsd.polys[i]);
			bsd.polys[i].sides = frontCount;
			bsd.polys[i].vertex = arrdup(front);
			s[i] = arrdup(sFront);
			t[i] = arrdup(tFront);			
			bsd.polys[bsd.polyCount].sides = backCount;
			bsd.polys[bsd.polyCount].vertex = arrdup(back);
			s[bsd.polyCount] = arrdup(sBack);
			t[bsd.polyCount] = arrdup(tBack);						
			
			ASSERT(frontCount <= maxVertsPerShard);
			ASSERT(backCount <= maxVertsPerShard);
			
			bsd.polyCount++;
		}		
	}
	
	for (i = 0; i < bsd.polyCount; i++)
	{
		var sum = [0,0,0];
		var j;
		for (j = 0; j < bsd.polys[i].sides; j++)
			sum = Vector_Add(sum, bsd.polys[i].vertex[j]);
		bsd.vels[i] = Vector_Add(Vector_Add(Vector_Scale(Level_GetBall().velocity, Level_GetBall().speed), 
														 Vector_Scale(Vector_Normalize(Vector_Subtract(Vector_Scale(sum, 1.0 / j), b.middle)), 0.5)),
														 Vector_Scale(Vector_Normalize(Nova_Vector3f(rand()-RAND_MAX/2,rand()-RAND_MAX/2,rand()-RAND_MAX/2)), 0.5));
		glvertBufSize += bsd.polys[i].sides;
	}
	
	bsd.glverts = new Array(glvertBufSize);
	glvertCount = 0;
	for (i = 0; i < bsd.polyCount; i++)
	{
		var j;
		ASSERT(bsd.polys[i].sides <= maxVertsPerShard);
		bsd.polys[i].pGLVerts = bsd.glverts;
		for (j = 0; j < bsd.polys[i].sides; j++)
		{
			bsd.glverts[glvertCount + j] = new Array(9);
			bsd.glverts[glvertCount + j][0] = bsd.polys[i].vertex[j][0];
			bsd.glverts[glvertCount + j][1] = bsd.polys[i].vertex[j][1];
			bsd.glverts[glvertCount + j][2] = bsd.polys[i].vertex[j][2];
			bsd.glverts[glvertCount + j][7] = s[i][j];
			bsd.glverts[glvertCount + j][8] = t[i][j];
		}
		
		bsd.polys[i].indices = 3 * (bsd.polys[i].sides - 2);
		var inds = [];
		for (j = 2; j < bsd.polys[i].sides; j++)
		{
			inds.push(glvertCount);
			inds.push(glvertCount + j - 1);
			inds.push(glvertCount + j);
		}
		bsd.polys[i].pTriIndices = new Uint16Array(inds); 
		
		ASSERT(bsd.polys[i].edgeNormals == NULL);
		bsd.polys[i].edgeNormals = NULL;
		
		glvertCount += bsd.polys[i].sides;
	}
	
	ASSERT(vertCount < bsd.polyCount * shardsPerPoly * maxVertsPerShard);
	ASSERT(bsd.polyCount <= shardsPerPoly * 6);
	ASSERT(glvertCount <= glvertBufSize);
	
	Nova_PreprocessPolygons(bsd.polys, bsd.polyCount);
	bsd.vbos = Nova_CreateVbos(bsd.glverts, glvertCount, gl.DYNAMIC_DRAW);
	for (i = 0; i < bsd.polyCount; i++)
		bsd.polys[i].vbos = bsd.vbos;

	return bsd;
}

///////////////////////////////////////////////////////////////////////////////
// Timer
function TimerDecorator_Free(d)
{
var td = d;

	td.TimeUp(td.param);
	Decorator_Free(d);
}

function TimerDecorator_WillTerminate(d)
{
	BaseDecorator_WillTerminate(d);
	d.Free(d);
}

function TimerDecorator_NextFrame(d,spf,step)
{
var td = d;

	BaseDecorator_NextFrame(d, spf, step);

	td.time -= spf;

	if (td.time <= 0)
		d.Free(d);
}

function TimerDecorator_New(time,TimeUp,param)
{
	var td = {};
	td.d = td;
	Decorator_Init(td.d);
	td.d.NextFrame = TimerDecorator_NextFrame;
	td.d.Free = TimerDecorator_Free;
	td.d.WillTerminate = TimerDecorator_WillTerminate;
	td.time = time;
	td.TimeUp = TimeUp;
	td.param = param;

	return td.d;
}

function WatchActionDecorator_Free(d)
{
var wad = d;

	Nova_SetPosition(wad.startPos);
	Camera_SetViewAngle(wad.startY, wad.startP, 0);

	Level_GetCamera().position = wad.startPos;
	Level_GetCamera().yaw = wad.startY;
	Level_GetCamera().pitch = wad.startP;
	Level_GetCamera().roll = 0;

	Decorator_Free(wad.d);
}

function WatchActionDecorator_WillTerminate(d)
{
var wad = d;

	BaseDecorator_WillTerminate(wad.d);

	if (!wad.doneAction)
	{
		wad.doneAction = TRUE;
		wad.DoAction(wad.doParam);
	}

	wad.d.Free(wad.d);
}

function WatchActionDecorator_NextFrame(d,spf,step)
{
var wad = d;

	Level_GetLevel().spikesMoving = FALSE;
	Level_GetBall().bMoving = FALSE;

	BaseDecorator_NextFrame(d, spf, step);

	wad.time += spf;

	if (wad.time < wad.travelTime)
	{
		var pos;
		var scale = wad.time * (1 - (wad.collEnd - wad.collStart)) / wad.travelTime;
		if (scale >= wad.collStart)
			scale += wad.collEnd - wad.collStart;
		pos  = Vector_AddScale(wad.startPos, Vector_Subtract(wad.targPos, wad.startPos), scale);
		Nova_SetPosition(pos);
		Camera_SetViewAngle(
			wad.startY + (wad.targY - wad.startY) * scale,
			wad.startP + (wad.targP - wad.startP) * scale, 0);
		wad.mask = Level_GetVisiblesMask(pos);
	}

	else if (wad.time < wad.travelTime + wad.startWaitTime)
	{
		Nova_SetPosition(wad.targPos);
		Camera_SetViewAngle(wad.targY, wad.targP, 0);
	}

	else if (!wad.doneAction || !wad.completedAction)
	{
		Nova_SetPosition(wad.targPos);
		Camera_SetViewAngle(wad.targY, wad.targP, 0);
		if (!wad.doneAction)
		{
			wad.doneAction = TRUE;
			wad.DoAction(wad.doParam);
		}
		if (wad.ActionComplete(wad.completedParam, wad.time - wad.travelTime - wad.startWaitTime))
		{
			wad.completeTime = wad.time;
			wad.completedAction = TRUE;
		}
	}

	else if (wad.time < wad.completeTime + .45)
	{
		var pos;
		var scale = (wad.completeTime + .45 - wad.time) * (1 - (wad.collEnd - wad.collStart)) / .45;
		if (scale >= wad.collStart)
			scale += wad.collEnd - wad.collStart;
		pos  = Vector_AddScale(wad.startPos, Vector_Subtract(wad.targPos, wad.startPos), scale);
		Nova_SetPosition(pos);
		Camera_SetViewAngle(
			wad.startY + (wad.targY - wad.startY) * scale,
			wad.startP + (wad.targP - wad.startP) * scale, 0);
		wad.mask = Level_GetVisiblesMask(pos);
	}

	else
	{
		wad.d.Free(wad.d);
	}
}

function WatchActionDecorator_Render(d,mask)
{
	BaseDecorator_Render(d, d.mask);
}

function WatchActionDecorator_Draw(d,mask)
{
	BaseDecorator_Draw(d, d.mask);
}

function WatchActionDecorator_RenderTransparent(d,mask)
{
	BaseDecorator_RenderTransparent(d, d.mask);
}

function WatchActionDecorator_NewWithCompleteFuncAndCoords(pos,yaw,pitch,travelTime,startWaitTime,DoAction,doParam,ActionComplete,completedParam)
{
var wad = {};
wad.d = wad;
var camera = Level_GetCamera();

	Decorator_Init(wad.d);
	wad.startPos = arrdup(camera.position);
	wad.startY = camera.yaw;
	wad.startP = camera.pitch;
	wad.targPos = arrdup(pos);
	wad.targY = yaw;
	wad.targP = pitch;
	wad.DoAction = DoAction;
	wad.ActionComplete = ActionComplete;
	wad.mask = Level_GetVisiblesMask(wad.startPos);

	if (fabs(wad.startY - (wad.targY + 360)) < fabs(wad.startY - wad.targY))
		wad.targY += 360;
	else if (fabs(wad.startY - (wad.targY - 360)) < fabs(wad.startY - wad.targY))
		wad.targY -= 360;

	var coll = Level_FindNextCollision(wad.startPos, 0, 
		Vector_Subtract(wad.targPos, wad.startPos), TRUE);
	if (coll.poly != NULL)
	{
		var v = Vector_Subtract(wad.targPos, wad.startPos);
		var pad = 0.03 / Vector_Length(v);
		var start;
		v = Vector_Scale(v, 1.0/Vector_Dot(v,v));

		start = Vector_Dot(Vector_Subtract(coll.pos, wad.startPos), v) - pad;

		if (start < 1)
		{
			wad.collStart = start;

			coll = Level_FindNextCollision(wad.targPos, 0, 
				Vector_Subtract(wad.startPos, wad.targPos), TRUE);
			ASSERT(coll.poly);
			
			wad.collEnd = Vector_Dot(Vector_Subtract(coll.pos, wad.startPos), v) + pad;
			
			if (wad.collEnd < wad.collStart) // e.g. Ghosted polygon...
				wad.collStart = wad.collEnd = 1;
		}
		else
		{
			wad.collStart = wad.collEnd = 1;
		}
	}
	else
	{
		wad.collStart = wad.collEnd = 1;
	}

	wad.time = 0;
	wad.travelTime = travelTime;
	wad.startWaitTime = startWaitTime;
	wad.doneAction = FALSE;
	wad.completedAction = FALSE;
	wad.doParam = doParam;
	wad.completedParam = completedParam;

	wad.d.NextFrame = WatchActionDecorator_NextFrame;
	wad.d.WillTerminate = WatchActionDecorator_WillTerminate;
	wad.d.Free = WatchActionDecorator_Free;

	wad.d.Render = WatchActionDecorator_Render;
	wad.d.Draw = WatchActionDecorator_Draw;
	wad.d.RenderTransparent = WatchActionDecorator_RenderTransparent;

	return wad.d;
}

function WatchActionDecorator_NewWithCompleteFunc(block,startWaitTime,DoAction,doParam,ActionComplete,completedParam)
{
	return WatchActionDecorator_NewWithCompleteFuncAndCoords(block.camPos, block.camYaw, 
		block.camPitch, .75, startWaitTime, DoAction, doParam, ActionComplete, completedParam);
}

function WatchActionDecorator_DefComplete(param,time)
{
	return time >= .75;
}

function WatchActionDecorator_New(block,DoAction,param)
{
	return WatchActionDecorator_NewWithCompleteFunc(block, .75, DoAction, param, WatchActionDecorator_DefComplete, NULL);
}
