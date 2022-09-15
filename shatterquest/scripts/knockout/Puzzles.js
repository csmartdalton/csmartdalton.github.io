function NullFinishedLoading(l)
{
}

function NullReset(l)
{
}

function NullDied(l)
{
}

function NullPersist(l)
{
}

function NullRecover(l,length)
{
}

function newObjectArray(count)
{
	var arr = new Array(count);
	for (var i = 0; i < count; i++)
		arr[i] = {};
	return arr;
}

///////////////////////////////////////////////////////////////////////////////
// Break by number
function Bbn_Reset(l)
{
var bbn = l;
var i;

	if (!bbn.blocks[0].block.group.bVisible)
		Sound_Play(rand() & 1 ? ekChanger0Sound : ekChanger1Sound);

	for (i = 0; i < bbn.blockCount; i++)
	{
		bbn.blocks[i].block.group.bVisible = TRUE;
		Level_GetLevel().map.blockGroups[bbn.blocks[i].block.iBlockGroup].blocksKnockedOut = 0;
		Level_GetLevel().score -= Level_GetLevel().map.blockGroups[bbn.blocks[i].block.iBlockGroup].pointsEarned;
		Level_GetLevel().map.blockGroups[bbn.blocks[i].block.iBlockGroup].pointsEarned = 0;
		Block_SetColor(bbn.blocks[i].block, bbn.blocks[i].orgColor[0],
			bbn.blocks[i].orgColor[1], bbn.blocks[i].orgColor[2]);
		Block_SetAtlasCoords(bbn.blocks[i].block,
			Atlas_NumberCoords(i + 1));
	}

	bbn.locked = FALSE;
}

function Bbn_FinishedLoading(l)
{
var bbn = l;
var i;
var iters = 2*bbn.blockCount + rand() % (2*bbn.blockCount);

	ASSERT(bbn.blockCount == 9);
	bbn.blockCount++; // For the final one

	while (iters--)
	{
		for (i = 1; i < bbn.blockCount - 1; i++)
		{
			if (rand() & 1)
			{
				var b = bbn.blocks[i];
				bbn.blocks[i] = bbn.blocks[i - 1];
				bbn.blocks[i - 1] = b;
			}
		}
	}

	bbn.beaten = FALSE;
	bbn.timesWatched = 0;

	l.Reset(l);
}

function Bbn_Persist(l)
{
var bbn = l;
var i;

	psWriteDword(bbn.beaten);
	for (i = 0; i < bbn.blockCount; i++)
		psWriteDword(bbn.blocks[i].block.group.index);
}

function Bbn_Recover(l,length)
{
var bbn = l;
var i,j;
	
	ASSERT(length == (1 + bbn.blockCount) * 4);
	
	bbn.beaten = psReadDword();
	for (i = 0; i < bbn.blockCount; i++)
	{
		var index = psReadDword();
		for (j = 0; j < bbn.blockCount; j++)		
		{
			if (bbn.blocks[j].block.group.index == index)
			{
				var b = bbn.blocks[j];
				bbn.blocks[j] = bbn.blocks[i];
				bbn.blocks[i] = b;
				Block_SetAtlasCoords(bbn.blocks[i].block, Atlas_NumberCoords(i + 1));
				break;
			}
		}
		ASSERT(j < bbn.blockCount);
	}
}

function Bbn_IndexOf(bbn,b)
{
var i;

	for (i = 0; i < bbn.blockCount; i++)
	{
		if (bbn.blocks[i].block == b)
			return i;
	}

	return -1;
}

function Bbn_DoneWatching(bbn,time)
{
	return time > .5;
}

function Bbn_Collide(pGroup,pPrimitive)
{
var bbn = Bbn_Get();
var idx = Bbn_IndexOf(bbn, pGroup);
var ball = Level_GetBall();

	if (bbn.locked)
	{
		Sound_Play3D(ekClickSound, ball.sphere.position);
		return;
	}

	if (!ball.bInvincible && 
		  !Color_Equals(ball.sphere.primitive.color, (pGroup).color))
	{
		bbn.blocks[idx].PrevCollide(pGroup, pPrimitive);
		return;
	}

	if (idx == 0 || bbn.blocks[idx - 1].block.group.bVisible == FALSE)
	{
		bbn.blocks[idx].PrevCollide(pGroup, pPrimitive);
		if (idx == bbn.blockCount - 1 && !bbn.beaten)
		{
			bbn.beaten = TRUE;
			Level_PuzzleSolved();
		}
	}
	else 
	{
		Sound_Play3D(ekClickSound, ball.sphere.position);
		if (!bbn.easy)
		{
			bbn.locked = TRUE;
			Block_SetColor(bbn.blocks[idx].block, 1, 0, 0);
			if (bbn.timesWatched < 3 && !bbn.blocks[0].block.group.bVisible)
			{
				bbn.timesWatched++;
				Level_AddDecorator(WatchActionDecorator_NewWithCompleteFunc(
					bbn.blocks[0].block, 0.5, Bbn_Reset, bbn, Bbn_DoneWatching, bbn));
			}
			else
			{
				Level_SetTimeout(0.6, Bbn_Reset, bbn);
			}
		}
		Sound_Play(ekBuzzerSound);
	}

}

function Bbn_ParseGroup(f,t,length)
{
var bbn = Bbn_Get();

	ASSERT(t == ekBlockGroupTag || t == ekHiddenGroupTag);
	parseBlockGroup(f,t,length);

	bbn.blocks[bbn.blockCount].block = g_parsedBlock;
	bbn.blocks[bbn.blockCount].orgColor = arrdup(g_parsedBlock.color);
	bbn.blocks[bbn.blockCount].PrevCollide = g_parsedBlock.group.Collide;

	bbn.blockCount++;
	g_parsedBlock.group.Collide = Bbn_Collide;
}

function Bbn_ParseLastGroup(f,t,length)
{
var bbn = Bbn_Get();

	ASSERT(t == ekBlockGroupTag || t == ekHiddenGroupTag);
	parseBlockGroup(f,t,length);

	bbn.blocks[9].block = g_parsedBlock;
	bbn.blocks[9].orgColor = arrdup(g_parsedBlock.color);
	bbn.blocks[9].PrevCollide = g_parsedBlock.group.Collide;
	g_parsedBlock.group.Collide = Bbn_Collide;
}

var g_bbn = NULL;
function Bbn_Free(l)
{
	ASSERT(g_bbn == l);
	g_bbn = NULL;
}

function Bbn_Get()
{
	if (g_bbn == NULL)
	{
		g_bbn = {};
		g_bbn.blocks = newObjectArray(10);
		g_bbn.blockCount = 0;
		g_bbn.easy = FALSE;
		
		g_bbn.listener = g_bbn;
		g_bbn.listener.FinishedLoading = Bbn_FinishedLoading;
		g_bbn.listener.Reset = Bbn_Reset;
		g_bbn.listener.Died = NullDied;
		g_bbn.listener.Free = Bbn_Free;
		g_bbn.listener.Persist = Bbn_Persist;
		g_bbn.listener.Recover = Bbn_Recover;
		Level_RegisterListener(g_bbn.listener);
	}

	return g_bbn;
} 

///////////////////////////////////////////////////////////////////////////////
// Match the pattern
var matchBlockCount = 9;
var matchKeyCount = 5;

function Match_SetKey(match,idx,keyCount)
{
var i;

	for (i = 0; i < matchKeyCount; i++)
	{
		var idx = rand() % matchBlockCount;
		while (match.keys[idx].group.bVisible)
			idx = (idx + 4/*(Must be co-prime to 9!)*/) % matchBlockCount;
		match.keys[idx].group.bVisible = TRUE;
		Level_GetLevel().map.blockGroups[match.keys[idx].iBlockGroup].blocksKnockedOut = 0;
		keyCount++;
	}
	
	return keyCount;
}

function Match_Reset(l)
{
var match = l;
var i;

	if (!match.changer.group.bVisible)
	{
		for (i = 0; i < matchBlockCount; i++)
		{
			match.blocks[i].block.group.bVisible = TRUE;
			Level_GetLevel().map.blockGroups[match.blocks[i].block.iBlockGroup].blocksKnockedOut = 0;
			Level_GetLevel().score -= Level_GetLevel().map.blockGroups[match.blocks[i].block.iBlockGroup].pointsEarned;
			Level_GetLevel().map.blockGroups[match.blocks[i].block.iBlockGroup].pointsEarned = 0;
			match.wrongCount = 0;
			match.matchCount = 0;
		}

		for (i = 0; i < matchBlockCount; i++)
		{
			Level_GetLevel().map.blockGroups[match.keys[i].iBlockGroup].blocksKnockedOut = 1;
		}
	}
}

function MirrorTexture(b,s,t,sParam,tParam)
{
	return {s:(b.atlasCoords.s + Atlas_TexSize * Atlas_Scale) - (s - (b.atlasCoords.s)),
			t:t};
}

function Match_FinishedLoading(l)
{
var match = l;
var keyCount = 0;
var i;
	
	// unmirror - it's too hard mirrored
	for (i = 0; i < 3; i++)
	{
		var swp = match.blocks[3*i];
		match.blocks[3*i] = match.blocks[3*i+2];
		match.blocks[3*i+2] = swp;
	}

	for (i = 0; i < matchBlockCount; i++)
	{
		Block_SetAtlasCoords(match.keys[i], Atlas_SymbolCoords(i >= ekLowerSigma ? i + 1 : i));
		Block_SetAtlasCoords(match.blocks[i].block, Atlas_SymbolCoords(i >= ekLowerSigma ? i + 1 : i));
// don't mirror - it's too hard		Block_TransformAtlasCoords(match.blocks[i].block, MirrorTexture, 0, 0, FALSE);
	}

	for (i = 0; i < matchBlockCount; i++)
	{
		match.keys[i].group.bVisible = FALSE;
		Level_GetLevel().map.blockGroups[match.keys[i].iBlockGroup].blocksKnockedOut = 1;
	}

	keyCount = Match_SetKey(match, rand() % matchBlockCount, keyCount);
	ASSERT(keyCount == matchKeyCount);

	match.changer.group.bVisible = FALSE;
	l.Reset(l);
}

function Match_Persist(l)
{
var match = l;

	psWriteDword(match.matchCount);
	psWriteDword(match.wrongCount);
}

function Match_Recover(l,length)
{
var match = l;
	
	match.matchCount = psReadDword();
	match.wrongCount = psReadDword();
}

function Match_ShowChanger(b)
{
	b.group.bVisible = TRUE;
	Sound_Play(rand() & 1 ? ekChanger0Sound : ekChanger1Sound);
}

function Match_Collide(pGroup,pPrimitive)
{
var match = Match_Get();
var idx;
var i;

	for (i = 0; i < matchBlockCount; i++)
	{
		if (match.blocks[i].block == pGroup)
			break;
	}
	idx = i;
	ASSERT(idx < matchBlockCount);

	if (!match.changer.group.bVisible && (Level_GetBall().bInvincible ||
		 Color_Equals(Level_GetBall().sphere.primitive.color, match.blocks[idx].block.color)))
	{
		if (match.keys[idx].group.bVisible)
		{
			match.wrongCount++;
		}
		else
		{
			match.matchCount++;
			if (match.wrongCount == 0 && match.matchCount == (matchBlockCount - matchKeyCount))
			{
				Level_PuzzleSolved();
				Level_AddDecorator(WatchActionDecorator_New(match.changer, Match_ShowChanger, match.changer));
			}
		}

		if (match.wrongCount > 0 && match.matchCount + match.wrongCount >= 4)
		{
			Sound_Play(ekBuzzerSound);
			Level_SetTimeout(0.3, match.listener.Reset, match);
			return;
		}
	}

	match.blocks[idx].PrevCollide(match.blocks[idx].block.group, pPrimitive);
}

function Match_ParseBlock(f,t,length)
{
var match = Match_Get();

	ASSERT(t == ekBlockGroupTag);
	parseBlockGroup(f,t,length);

	match.blocks[match.nextIndex].block = g_parsedBlock;
	match.blocks[match.nextIndex].PrevCollide = g_parsedBlock.group.Collide;
	g_parsedBlock.group.Collide = Match_Collide;
}

function Match_ParseKey(f,t,length)
{
var match = Match_Get();

	ASSERT(t == ekBlockGroupTag);
	parseBlockGroup(f,t,length);
	match.keys[match.nextIndex] = g_parsedBlock;
}

function Match_ParseChanger(f,t,length)
{
var match = Match_Get();

	ASSERT(t == ekChangerGroupTag);
	parseBlockGroup(f,t,length);
	match.changer = g_parsedBlock;
}

var g_match = NULL;
function Match_Free(l)
{
	ASSERT(g_match == l);
	g_match = NULL;
}

function Match_Get()
{
	if (g_match == NULL)
	{
		g_match = {};
		g_match.keys = newObjectArray(matchBlockCount);
		g_match.blocks = newObjectArray(matchBlockCount);
		g_match.wrongCount = 0;
		g_match.matchCount = 0;
		
		g_match.listener = g_match;
		g_match.listener.FinishedLoading = Match_FinishedLoading;
		g_match.listener.Reset = Match_Reset;
		g_match.listener.Died = NullDied;
		g_match.listener.Free = Match_Free;
		g_match.listener.Persist = Match_Persist;
		g_match.listener.Recover = Match_Recover;		
		Level_RegisterListener(g_match.listener);
	}

	return g_match;
}

///////////////////////////////////////////////////////////////////////////////
// Simon
function Simon_LeaveGarages(simon)
{
var i;

	for (i = 0; i < simon.sliderCount; i++)
	{
		if (simon.sliders[i].s.isHome)
			Level_AddDecorator(ToOriginDecorator_New(simon.sliders[i].s, 0.25));
	}
}

function Simon_IndexOf(simon,s)
{
var i;

	for (i = 0; i < simon.sliderCount; i++)
	{
		if (simon.sliders[i].s == s)
			return i;
	}

	ASSERT(0);
	return -1;
}

function Simon_Shuffle(simon,notFirst,first,last)
{
var iters = 5 * (simon.sliderCount + rand() % simon.sliderCount);
var i;

	while (iters--)
	{
		for (i = 1; i < simon.sliderCount; i++)
		{
			if (rand() & 1)
			{
				var tmp = simon.sliders[i];
				simon.sliders[i] = simon.sliders[i - 1];
				simon.sliders[i - 1] = tmp;
			}
		}
	}

	if (notFirst && simon.sliders[0].s == notFirst)
	{
		var idx = 1 + (rand() % (simon.sliderCount - 1));
		var tmp = simon.sliders[idx];
		simon.sliders[idx] = simon.sliders[0];
		simon.sliders[0] = tmp;
	}

	if (first && simon.sliders[0].s != first)
	{
		var idx = Simon_IndexOf(simon, first);
		var tmp = simon.sliders[idx];
		simon.sliders[idx] = simon.sliders[0];
		simon.sliders[0] = tmp;
	}

	if (last && simon.sliders[simon.sliderCount - 1].s != last)
	{
		var idx = Simon_IndexOf(simon, last);
		var tmp = simon.sliders[idx];
		simon.sliders[idx] = simon.sliders[simon.sliderCount - 1];
		simon.sliders[simon.sliderCount - 1] = tmp;
	}

	simon.shuffled = TRUE;
}

function Simon_Reset(l)
{
var simon = l;

	if (!simon.sliders[simon.sliderCount-1].s.isHome)
	{
		Simon_LeaveGarages(simon);
		simon.shuffled = FALSE;
	}
}

function Simon_FinishedLoading(l)
{
var simon = l;
var i;
var pref = [
	ekPsi, ekOmega, ekLowerSigma, ekUpperDelta, ekUpperSigma, 
	ekPhi, ekLowerDelta, ekPi, ekLambda, ekSymbolCount,
];

	ASSERT(simon.sliderCount < pref.length);

	for (i = 0; i < simon.sliderCount; i++)
		Block_SetAtlasCoords(simon.sliders[i].s.b, Atlas_SymbolCoords(pref[i]));

	l.Reset(l);
}

function Simon_Persist(l)
{
	var simon = l;
	var i;
	
	psWriteDword(simon.shuffled);
	for (i = 0; i < simon.sliderCount; i++)
		psWriteDword(simon.sliders[i].s.b.group.index);
}

function Simon_Recover(l,length)
{
	var simon = l;
	var i,j;
	
	ASSERT(length == (1 + simon.sliderCount) * 4);

	simon.shuffled = psReadDword();
	for (i = 0; i < simon.sliderCount; i++)
	{
		var index = psReadDword();
		for (j = 0; j < simon.sliderCount; j++)		
		{
			if (simon.sliders[j].s.b.group.index == index)
			{
				var s = simon.sliders[j];
				simon.sliders[j] = simon.sliders[i];
				simon.sliders[i] = s;
				break;
			}
		}
		ASSERT(j < simon.sliderCount);
	}
}

function Simon_BlockMadeItHome(simon,s)
{
var idx;

	if (!simon.shuffled)
	{
		Simon_Shuffle(simon, s, NULL, NULL);
	}

	idx = Simon_IndexOf(simon, s);

	if (idx > 0 && !simon.sliders[idx - 1].s.isHome)
	{
		Simon_LeaveGarages(simon);
		Sound_Play(ekBuzzerSound);
		return FALSE;
	}

	if (idx == simon.sliderCount - 1)
	{
		simon.sliders[idx].PrevMadeItHome(s);
		Level_PuzzleSolved();
	}

	return TRUE;
}

function Simon_MadeItHome(s)
{
	Simon_BlockMadeItHome(Simon_Get(), s);
}

function Simon_ParseBlock(simon,f,t,length)
{
	ASSERT(t == ekSwitchGroupTag);
	parseBlockGroup(f,t,length);

	simon.sliders[simon.sliderCount].s = g_parsedBlock;
	simon.sliders[simon.sliderCount].PrevMadeItHome = (g_parsedBlock).MadeItHome;
	simon.sliderCount++;

	(g_parsedBlock).MadeItHome = Simon_MadeItHome;
}

function Simon_ParseGroup(f,t,length)
{
	Simon_ParseBlock(Simon_Get(), f,t,length);
}

var g_simon = NULL;
function Simon_Free(l)
{
	ASSERT(g_simon == l);
	g_simon = NULL;
}

function Simon_Init(simon)
{
	simon.sliders = newObjectArray(10);
	simon.sliderCount = 0;
		
	simon.listener = simon;
	simon.listener.FinishedLoading = Simon_FinishedLoading;
	simon.listener.Reset = Simon_Reset;
	simon.listener.Died = NullDied;
	simon.listener.Free = Simon_Free;
	simon.listener.Recover = Simon_Recover;
	simon.listener.Persist = Simon_Persist;
}

function Simon_Get()
{
	if (g_simon == NULL)
	{
		g_simon = {};
		Simon_Init(g_simon);
		Level_RegisterListener(g_simon.listener);
	}

	return g_simon;
} 

///////////////////////////////////////////////////////////////////////////////
// Simon2
function WatchSimonDecorator_NextFrame(d,spf,step)
{
var wsd = d;
var next;

	Level_GetLevel().spikesMoving = FALSE;
	Level_GetBall().bMoving = FALSE;

	BaseDecorator_NextFrame(wsd.d, spf, step);

	if (wsd.simon2.currentShow != wsd.currentShow)
	{
		var scale = wsd.currentShow == -1 || wsd.simon2.currentShow == -1 ? 1.0/0.75 : 1.0/0.5;

		wsd.currentShow = wsd.simon2.currentShow;

		if (wsd.currentShow != -1)
		{
			wsd.goal = wsd.simon2.s.sliders[wsd.currentShow].s.b.camPos;
			wsd.yawGoal = wsd.simon2.s.sliders[wsd.currentShow].s.b.camYaw;
			wsd.pitchGoal = wsd.simon2.s.sliders[wsd.currentShow].s.b.camPitch;
		}
		else
		{
			wsd.goal = wsd.orgPos;
			wsd.yawGoal = wsd.orgYaw;
			wsd.pitchGoal = wsd.orgPitch;
		}

		if (fabs(wsd.yawGoal + 360 - wsd.yaw) < fabs(wsd.yawGoal - wsd.yaw))
			wsd.yawGoal += 360;
		if (fabs(wsd.yawGoal - 360 - wsd.yaw) < fabs(wsd.yawGoal - wsd.yaw))
			wsd.yawGoal -= 360;

		wsd.step = Vector_Scale(Vector_Subtract(wsd.goal, wsd.pos), scale);
		wsd.yawStep = (wsd.yawGoal - wsd.yaw) * scale;
		wsd.pitchStep = (wsd.pitchGoal - wsd.pitch) * scale;
	}

	next = Vector_Add(wsd.pos, Vector_Scale(wsd.step, spf));
	if (Vector_Dot(Vector_Subtract(wsd.goal, wsd.pos), Vector_Subtract(wsd.goal, next)) <= 0)
		wsd.pos = wsd.goal;
	else
		wsd.pos = next;

	if (fabs(wsd.yawGoal - wsd.yaw) < fabs(wsd.yawStep * spf))
		wsd.yaw = wsd.yawGoal;
	else
		wsd.yaw += wsd.yawStep * spf;

	if (fabs(wsd.pitchGoal - wsd.pitch) < fabs(wsd.pitchStep * spf))
		wsd.pitch = wsd.pitchGoal;
	else
		wsd.pitch += wsd.pitchStep * spf;

	Nova_SetPosition(wsd.pos);
	Camera_SetViewAngle(wsd.yaw, wsd.pitch, 0);

	if (wsd.currentShow == -1 && Vector_Equals(wsd.goal, wsd.pos))
	{
		wsd.d.Free(wsd.d);
	}
}

function WatchSimonDecorator_Free(d)
{
var wsd = d;
	
	Nova_SetPosition(wsd.orgPos);
	Camera_SetViewAngle(wsd.orgYaw, wsd.orgPitch, 0);

	Decorator_Free(d);
}

function WatchSimonDecorator_WillTerminate(d)
{
	BaseDecorator_WillTerminate(d);
	d.Free(d);
}	

function WatchSimonDecorator_New(simon2)
{
	var camera = Level_GetCamera();

	var wsd = {
		simon2:null,
		pos:[0,0,0], step:[0,0,0], goal:[0,0,0], orgPos:[0,0,0],
		yaw:0, yawStep:0, yawGoal:0, orgYaw:0,
		pitch:0, pitchStep:0, pitchGoal:0, orgPitch:0
	};
	wsd.d = wsd;
	
	Decorator_Init(wsd.d);
	wsd.d.NextFrame = WatchSimonDecorator_NextFrame;
	wsd.d.Free = WatchSimonDecorator_Free;
	wsd.d.WillTerminate = WatchSimonDecorator_WillTerminate;

	wsd.simon2 = simon2;
	wsd.pos = arrdup(camera.position);
	wsd.orgPos = arrdup(camera.position);
	wsd.yaw = wsd.orgYaw = camera.yaw;
	wsd.pitch = wsd.orgPitch = camera.pitch;
	wsd.currentShow = -1;

	return wsd;
}

function Simon2_ShowNext(simon2)
{
	Level_AddDecorator(GoHomeDecorator_New(simon2.s.sliders[simon2.currentShow].s, 0.25));
}

function Simon2_Collide(pGroup,pPrimitive)
{
var simon2 = Simon2_Get();

	if (simon2.currentShow != -1 || pGroup.moving)
	{
		Sound_Play3D(ekClickSound, Level_GetBall().sphere.position);
	}
	else
	{
		simon2.PrevCollide[Simon_IndexOf(simon2.s, pGroup)](pGroup, pPrimitive);
	}
}

function Simon2_ShowSolution(simon2)
{
	Level_AddDecorator(WatchSimonDecorator_New(simon2));

	simon2.currentShow = 0;
	simon2.corrects = 0;
	Level_SetTimeout(1, Simon2_ShowNext, simon2);
}

function Simon2_MadeItHome(s)
{
var simon2 = Simon2_Get();

	if (simon2.currentShow != -1)
	{
		simon2.currentShow++;
		if (simon2.currentShow < simon2.shows)
		{
			Level_SetTimeout(.25, Simon2_ShowNext, simon2);
		}
		else
		{
			Simon_LeaveGarages(simon2.s);
			simon2.currentShow = -1;
		}
	}
	else
	{
		if (!simon2.s.shuffled)
		{
			Simon_Shuffle(simon2.s, NULL, s, simon2.last);
		}

		if (!Simon_BlockMadeItHome(simon2.s, s))
		{
			Simon_Shuffle(simon2.s, s, NULL, simon2.last);
			simon2.shows = 1;
			
			Simon2_ShowSolution(simon2);
			return;
		}

		else if (++simon2.corrects == simon2.shows && simon2.shows < simon2.s.sliderCount)
		{
			simon2.shows += simon2.shows == 1 ? 2 : 3;
			Simon_LeaveGarages(simon2.s);

			Simon2_ShowSolution(simon2);
		}
	}
}

function Simon2_ParseBlock(f,t,length)
{
var simon2 = Simon2_Get();

	Simon_ParseBlock(simon2.s, f,t,length);
	simon2.PrevCollide[simon2.s.sliderCount - 1] = 
		simon2.s.sliders[simon2.s.sliderCount - 1].s.b.group.Collide;
	simon2.s.sliders[simon2.s.sliderCount - 1].s.MadeItHome = Simon2_MadeItHome;
	simon2.s.sliders[simon2.s.sliderCount - 1].s.b.group.Collide = Simon2_Collide;
}

function Simon2_ParseLast(f,t,length)
{
var simon2 = Simon2_Get();

	ASSERT(!simon2.last);
	Simon2_ParseBlock(f,t,length);
	;//simon2.last = simon2.s.sliders[simon2.s.sliderCount - 1].s;
}

var g_simon2 = NULL;
function Simon2_Free(l)
{
	ASSERT(g_simon2 == l);
	g_simon2 = NULL;
}

function Simon2_Get()
{
	if (g_simon2 == NULL)
	{
		g_simon2 = {};
		g_simon2.s = g_simon2;
		Simon_Init(g_simon2.s);
		
		g_simon2.PrevCollide = new Array(10);
		g_simon2.last = NULL;
		g_simon2.currentShow = -1;
		g_simon2.shows = 1;
		g_simon2.corrects = 0;
		g_simon2.s.listener.Free = Simon2_Free;

		Level_RegisterListener(g_simon2.s.listener);
	}

	return g_simon2;
} 

///////////////////////////////////////////////////////////////////////////////
// Punch in the code
var Code_Combos = [
	{s:0.0 * textureScale, t:0.0 * textureScale, combo:[ekCaterpillar, ekNecklace, ekFoot, ekTwoWeirdThings, ekHand, ekFace]},
	{s:0.5 * textureScale, t:0.0 * textureScale, combo:[ekHand, ekFace, ekFoot, ekCaterpillar, ekNecklace, ekTotemPole]},
	{s:0.5 * textureScale, t:0.5 * textureScale, combo:[ekX, ekCaterpillar, ekHand, ekNecklace, ekFace, ekTwoWeirdThings]},
	{s:0.0 * textureScale, t:0.5 * textureScale, combo:[ekCaterpillar, ekTotemPole, ekHand, ekX, ekNecklace, ekFace]}
];
var Code_ComboCount = Code_Combos.length;
function Code_RestartPuzzle(code)
{
var i;

	for (i = 0; i < code.sliderCount; i++)
	{
		if (code.sliders[i].s.isHome)
			Level_AddDecorator(ToOriginDecorator_New(code.sliders[i].s, 0.25));
	}

	code.nextIndex = 0;
	code.correctOrder = TRUE;
}

function Code_SetKeyCoords(block,s,t,sParam,tParam)
{
	return {s:(abs(block.atlasCoords.s - s) < (textureScale / 128)) ? sParam : sParam + textureScale/2,
	        t:(abs(block.atlasCoords.t - t) < (textureScale / 128)) ? tParam : tParam + textureScale/2};
}

function Code_Reset(l)
{
var code = l;
var iters = code.sliderCount + rand() % code.sliderCount;
var iCombo = rand() % Code_ComboCount;
var i;

	if (!code.sliders[code.sliderCount - 1].s.isHome)
		Code_RestartPuzzle(code);

	code.iCombo = iCombo;
	Block_TransformAtlasCoords(code.key, Code_SetKeyCoords, 
		Code_Combos[iCombo].s, Code_Combos[iCombo].t, TRUE);

	for (i = 0; i < code.sliderCount; i++)
		code.sliders[i].symbol = Code_Combos[code.iCombo].combo[i];
	while (iters--)
	{
		for (i = 1; i < code.sliderCount - 1; i++)
		{
			if (rand() & 1)
			{
				var s = code.sliders[i].symbol;
				code.sliders[i].symbol = code.sliders[i - 1].symbol;
				code.sliders[i - 1].symbol = s;
			}
		}
	}

	for (i = 0; i < code.sliderCount; i++)
		Block_SetAtlasCoords(code.sliders[i].s.b, Atlas_SymbolCoords(code.sliders[i].symbol));
}

function Code_FinishedLoading(l)
{
var code = l;
var theme = Level_GetLevel().map.theme;
var i,j;

	ASSERT(code.sliderCount == 5);
	code.sliderCount++;

	for (i = 0; i < theme.textureCount; i++)
	{
		if (theme.texts[i].name == "codekey")
		{
			for (j = 0; j < code.key.group.polyCount; j++)
				code.key.group.polys[j].primitive.pTexture = theme.texts[i];

			break;
		}
	}
	ASSERT(i < theme.textureCount);

	l.Reset(l);
}

function Code_Persist(l)
{
var code = l;
var i;
	
	psWriteDword(code.iCombo);
	psWriteDword(code.correctOrder);	
	psWriteDword(code.nextIndex);
	for (i = 0; i < code.sliderCount; i++)
		psWriteDword(code.sliders[i].symbol);
}

function Code_Recover(l,length)
{
var code = l;
var i;
	
	ASSERT(length == (3 + code.sliderCount) * 4/*sizeof(DWORD)*/);
	
	code.iCombo = psReadDword();
	Block_TransformAtlasCoords(code.key, Code_SetKeyCoords, Code_Combos[code.iCombo].s, Code_Combos[code.iCombo].t, TRUE);
	code.correctOrder = psReadDword();	
	code.nextIndex = psReadDword();	
	for (i = 0; i < code.sliderCount; i++)
	{
		code.sliders[i].symbol = psReadDword();
		Block_SetAtlasCoords(code.sliders[i].s.b, Atlas_SymbolCoords(code.sliders[i].symbol));		
	}
}

function Code_MadeItHome(s)
{
var code = Code_Get();
var i;
var idx;

	for (i = 0; i < code.sliderCount; i++)
	{
		if (code.sliders[i].s == s)
		{
			idx = i;
			break;
		}
	}
	ASSERT(i != code.sliderCount);

	code.correctOrder = code.correctOrder && 
		(code.sliders[idx].symbol == Code_Combos[code.iCombo].combo[code.nextIndex++]);
}

function Code_LastMadeItHome(s)
{
var code = Code_Get();

	Code_MadeItHome(s);

	if (code.correctOrder)
	{
		Sound_Play(ekSecretSound);
		code.sliders[code.sliderCount - 1].PrevMadeItHome(s);
	}
	else
	{
		Sound_Play(ekBuzzerSound);
		Code_RestartPuzzle(code);
	}
}

function Code_ParseBlock(f,t,length)
{
var code = Code_Get();

	ASSERT(t == ekCoasterGroupTag);
	parseBlockGroup(f,t,length);

	code.sliders[code.sliderCount].s = g_parsedBlock;
	code.sliders[code.sliderCount].PrevMadeItHome = (g_parsedBlock).MadeItHome;
	code.sliderCount++;

	(g_parsedBlock).MadeItHome = Code_MadeItHome;
}

function Code_ParseLast(f,t,length)
{
var code = Code_Get();

	ASSERT(t == ekCoasterGroupTag);
	parseBlockGroup(f,t,length);

	code.sliders[5].s = g_parsedBlock;
	code.sliders[5].PrevMadeItHome = (g_parsedBlock).MadeItHome;
	(g_parsedBlock).MadeItHome = Code_LastMadeItHome;
}

function Code_ParseKey(f,t,length)
{
var code = Code_Get();

	if (!g_parsingBlock)
		Set_pBlock(LockedDoor_New(false));
	parseBlockGroup(f,t,length);
	code.key = g_parsedBlock;
}

var g_code = NULL;
function Code_Free(l)
{
	ASSERT(g_code == l);
	g_code = NULL;
}

function Code_Get()
{
	if (g_code == NULL)
	{
		g_code = {sliderCount:0,
		          sliders:newObjectArray(6),
		          key:null,
		          nextIndex:0,
		          iCombo:0,
		          correctOrder:false};
		
		g_code.listener = g_code;
		g_code.listener.FinishedLoading = Code_FinishedLoading;
		g_code.listener.Reset = Code_Reset;
		g_code.listener.Died = NullDied;
		g_code.listener.Free = Code_Free;
		g_code.listener.Persist = Code_Persist;		
		g_code.listener.Recover = Code_Recover;
		Level_RegisterListener(g_code.listener);
	}

	return g_code;
}

///////////////////////////////////////////////////////////////////////////////
// Indiana Jones Floor
var indyRowCount = 14;
var indyColCount = 4;
function Indy_BlocksHome(indy)
{
var i,j;
	for (i = 0; i < indyRowCount; i++)
	{
		for (j = 0; j < indyColCount; j++)
		{
			if (indy.sliders[i][j].s.decorator)
			{
				indy.sliders[i][j].s.decorator.d.Free(indy.sliders[i][j].s.decorator.d);
			}

			if (indy.sliders[i][j].s.pos[0] != 0 || indy.sliders[i][j].s.pos[1] != 0 ||
				 indy.sliders[i][j].s.pos[2] != 0)
			{
				indy.sliders[i][j].s.pos[2] = -1.5;
				Stepper_SyncVerts(indy.sliders[i][j].s);
				indy.sliders[i][j].s.b.group.bVisible = TRUE;
				Block_SetColor(indy.sliders[i][j].s.b, 1, 1, 1);
				Level_AddDecorator(ToOriginDecorator_New(indy.sliders[i][j].s, 0));
			}
		}
	}
}

function Indy_SwitchHome(indy)
{
	if (indy._switch.s.isHome)
		Level_AddDecorator(ToOriginDecorator_New(indy._switch.s, 0));
}

function Indy_AllHome(indy)
{
	Indy_BlocksHome(indy);
	Indy_SwitchHome(indy);
}

function CheckIfDeadDecorator_SetSong(indy,pos,fluteManSpot,toohotSpot)
{
	if (pos[2] > toohotSpot && indy.song == ekTooHot)
	{
		if (pos[2] > fluteManSpot)
		{
			indy.song = ekFluteMan;
			Music_Load("flute-man");
			Music_Volume(1);
		}
		else
		{
			Music_Volume((fluteManSpot - pos[2]) / (fluteManSpot - toohotSpot));
		}
	}
	
	else if (pos[2] < fluteManSpot && indy.song == ekFluteMan)
	{
		if (pos[2] < toohotSpot)
		{
			indy.song = ekTooHot;
			Music_Load("toohot");
			Music_Volume(1);
		}
		else
		{
			Music_Volume((toohotSpot - pos[2]) / (toohotSpot - fluteManSpot));
		}
	}
}

function CheckIfDeadDecorator_NextFrame(d,spf,step)
{
var pos = Level_GetBall().sphere.position;
var cidd = d;
var indy = Indy_Get();

	BaseDecorator_NextFrame(d, spf, step);

	if (pos[0] < -5 && pos[1] > 11 && pos[1] < 17.19 && pos[2] < -.714)
	{
		if (!cidd.dead)
		{
			Level_AddDecorator(DieDecorator_New(0, 0, 0, 0, 1, 3, TRUE));
			cidd.dead = TRUE;
		}
	}

	else if (pos[0] < .22 && pos[0] > -.22 && pos[1] < 8.3 && pos[1] > 7.6)
	{
		CheckIfDeadDecorator_SetSong(indy, pos, 7, 3);
	}
	
	else if (pos[0] > 5.84 && pos[0] < 6.3 && pos[1] > 7.5 && pos[1] < 8.25)
	{
		CheckIfDeadDecorator_SetSong(indy, pos, 5.25, 2.75);		
	}

	else if (indy.song == ekFluteMan && pos[2] < -0.425)
	{
		if (!cidd.dead)
		{
			Level_AddDecorator(DieDecorator_New(0, 0, 0, 0, 1, 3, TRUE));
			cidd.dead = TRUE;
		}
	}
}

function CheckIfDeadDecorator_New()
{
var cidd = {};
cidd.d = cidd;

	Decorator_Init(cidd.d);
	cidd.d.NextFrame = CheckIfDeadDecorator_NextFrame;
	cidd.dead = FALSE;
	
	return cidd.d;
}

function Indy_Reset(l)
{
var indy = l; 
var i, j;
	
	Indy_AllHome(indy);
	
	for (i = 0; i < indyRowCount; i++)
	{
		for (j = 0; j < indyColCount; j++)
			indy.sliders[i][j].symbol = -1;
	}
	
	indy.safeSymbol = rand() % ekSymbolCount;
	i = rand() % 4;
	do
	{
		indy.sliders[i][rand() % 4].symbol = indy.safeSymbol;
		i += 3 + (rand() & 1);
	} while (i <= 0xd);
	
	for (i = 0; i < indyRowCount; i++)
	{
		for (j = 0; j < indyColCount; j++)
		{
			if (indy.sliders[i][j].symbol != indy.safeSymbol)
			{
				indy.sliders[i][j].symbol = rand() % (ekSymbolCount - 1);
				if (indy.sliders[i][j].symbol >= indy.safeSymbol)
					indy.sliders[i][j].symbol++;
			}
			
			Block_SetAtlasCoords(indy.sliders[i][j].s.b, Atlas_SymbolCoords(indy.sliders[i][j].symbol));
		}
	}
	
	if (indy.winner.s.decorator)
		indy.winner.s.decorator.d.Free(indy.winner.s.decorator.d);
	indy.winner.s.pos = Nova_Vector3f(0,0,0);
	indy.winner.s.isHome = FALSE;
	Stepper_SyncVerts(indy.winner.s);
}

function Indy_FinishedLoading(l)
{
var indy = l;
var i;

	for (i = 0; i < indyRowCount; i++)
		ASSERT(indy.sliderCount[i] == indyColCount);

	ASSERT(!indy.checkDeadDecorator);
	indy.checkDeadDecorator = CheckIfDeadDecorator_New();
	Level_AddDecorator(indy.checkDeadDecorator);

	ASSERT(indy.doorCount == 2);

	l.Reset(l);
}

function Indy_Died(l)
{
var indy = l;
var pos = Level_GetBall().sphere.position;

	if (pos[2] > 3 && pos[1] < -2)
	{
		if (indy.song != ekFluteMan)
		{
			Music_Load("flute-man");
			indy.song = ekFluteMan;
		}
	}
	else
	{
		if (indy.song != ekTooHot)
		{
			Music_Load("toohot");
			indy.song = ekTooHot;
		}
	}

	// It was already freed...
	ASSERT(indy.checkDeadDecorator);
	indy.checkDeadDecorator = CheckIfDeadDecorator_New();
	Level_AddDecorator(indy.checkDeadDecorator);
}

function Indy_Persist(l)
{
var indy = l;
var i,j;
	
	psWriteDword(indy.safeSymbol);
	psWriteDword(indy.song);
	psWriteDword((indy.checkDeadDecorator).dead);
	for (i = 0; i < indyRowCount; i++)
	{
		for (j = 0; j < indyColCount; j++)
			psWriteDword(indy.sliders[i][j].symbol);
	}
}

function Indy_Recover(l,length)
{
var indy = l;
var i,j;
	
	ASSERT(length == (3 + indyRowCount * indyColCount) * 4/*sizeof(DWORD)*/);
	ASSERT(indy.checkDeadDecorator);
	
	indy.safeSymbol = psReadDword();
	indy.song = psReadDword();
	(indy.checkDeadDecorator).dead = psReadDword();

	if (indy.song == ekTooHot)
	{
		Music_Load("toohot");
	}

	for (i = 0; i < indyRowCount; i++)
	{
		for (j = 0; j < indyColCount; j++)
		{
			indy.sliders[i][j].symbol = psReadDword(); 
			Block_SetAtlasCoords(indy.sliders[i][j].s.b, Atlas_SymbolCoords(indy.sliders[i][j].symbol));
		}
	}
}

function IndySymbolDecorator_NextFrame(d,spf,step)
{
var s = (d).s;

	StepperDecorator_NextFrame(d, spf, step);

	if (s.b.middle[2] < -1.2)
	{
		var c = 1 + .6 * (s.b.middle[2] - -1.2) > 0 ? 1 + .6 * (s.b.middle[2] - -1.2) : 0;
		Block_SetColor(s.b, c, c, c);
	}
}

function Indy_Collide(pGroup,pPrimitive)
{
var s = pGroup;
var indy = Indy_Get();
var i,j;

	for (i = 0; i < indyRowCount; i++)
	{
		for (j = 0; j < indyColCount; j++)
		{
			if (indy.sliders[i][j].s == s)
			{
				if (indy.sliders[i][j].symbol != indy.safeSymbol)
				{
					indy.sliders[i][j].PrevCollide(pGroup, pPrimitive);
					if (indy.sliders[i][j].s.b.group.moving)
					{
						var d;
						indy.sliders[i][j].s.decorator.d.NextFrame = IndySymbolDecorator_NextFrame;

						if (!indy.winner.s.isHome)
						{
							for (d = 0; d < indy.doorCount; d++)
							{
								if (indy.doors[d].b.group.moving)
								{
									ASSERT(indy.doors[d].decorator);
									indy.doors[d].decorator.d.Free(indy.doors[d].decorator.d);
									ASSERT(!indy.doors[d].decorator);
								}

								if (!indy.doors[d].isHome)
								{
									Level_AddDecorator(GoHomeDecorator_New(indy.doors[d], 0));
									Sound_Play3D(ekDoorSound, indy.doors[d].b.middle);
									if (d == 0)
										Sound_Play3D(ekLeverSound, s.b.middle);
								}
							}
						}

						ASSERT(indy.checkDeadDecorator);

						Indy_SwitchHome(indy);
					}
				}
				else
				{
					Sound_Play3D(ekClickSound, Level_GetBall().sphere.position);
				}

				return;
			}
		}
	}

	ASSERT(0);
}

function Indy_BlockMadeItHome(s)
{
var indy = Indy_Get();
var i,j;

	for (i = 0; i < indyRowCount; i++)
	{
		for (j = 0; j < indyColCount; j++)
		{
			if (indy.sliders[i][j].s == s)
			{
				if (indy.sliders[i][j].symbol != indy.safeSymbol)
					indy.sliders[i][j].s.b.group.bVisible = FALSE;

				return;
			}
		}
	}

	ASSERT(0);
}

function Indy_SwitchMadeItHome(s)
{
var indy = Indy_Get();

	Indy_BlocksHome(Indy_Get());
	if (indy.switchHitTimes++ < 2)
	{
		indy._switch.PrevMadeItHome(s);
	}
	else
	{
		if (indy.doors[0].isHome)
			LockedDoor_Open(indy.doors[0]);

		if (indy.doors[1].isHome)
			LockedDoor_Open(indy.doors[1]);
	}
}

function Indy_HideUnsafe(indy)
{
var i, j;

	ASSERT(indy.checkDeadDecorator);
	for (i = 0; i < indyRowCount; i++)
	{
		for (j = 0; j < indyColCount; j++)
		{
			if (indy.sliders[i][j].symbol != indy.safeSymbol)
			{
				if (indy.sliders[i][j].s.decorator)
					indy.sliders[i][j].s.decorator.d.Free(indy.sliders[i][j].s.decorator.d);

/*				indy.sliders[i][j].s.pos = Matrix_Mult(indy.sliders[i][j].s.map2grid, 
					Vector_Subtract(indy.sliders[i][j].s.home, indy.sliders[i][j].s.origin));
				indy.sliders[i][j].s.isHome = TRUE;
				indy.sliders[i][j].s.b.group.bVisible = FALSE;
				Stepper_SyncVerts(indy.sliders[i][j].s);*/

				Level_AddDecorator(GoHomeDecorator_New(indy.sliders[i][j].s, 0));
			}
		}
	}

	Sound_Play(ekSliderSound);

	if (indy._switch.s.decorator)
		indy._switch.s.decorator.d.Free(indy._switch.s.decorator.d);

	/*indy._switch.s.pos = Nova_Vector3f(0,0,0);
	indy._switch.s.isHome = FALSE;
	Stepper_SyncVerts(indy._switch.s);*/
}

function Indy_WinnerMadeItHome(s)
{
var indy = Indy_Get();

	indy.winner.PrevMadeItHome(s);
	Level_PuzzleSolved();

	Level_SetTimeout(1.5, Indy_HideUnsafe, indy);
}

function Indy_ParseBlock(f,t,length)
{
var indy = Indy_Get();
var s;

	ASSERT(t == ekSwitchGroupTag);
	if (!g_parsingBlock)
		Set_pBlock(Switch_New(false));
	parseBlockGroup(f,t,length);

	indy.sliders[indy.parseRow][indy.sliderCount[indy.parseRow]].s = g_parsedBlock;
	indy.sliders[indy.parseRow][indy.sliderCount[indy.parseRow]].PrevCollide = g_parsedBlock.group.Collide;
	indy.sliders[indy.parseRow][indy.sliderCount[indy.parseRow]].PrevMadeItHome = (g_parsedBlock).MadeItHome;
	indy.sliderCount[indy.parseRow]++;

	s = g_parsedBlock;
	s.b.group.Collide = Indy_Collide;
	s.MadeItHome = Indy_BlockMadeItHome;
	s.startMovingSound = ekSliderSound;
	s.stopMovingSound = -1;
	s.madeItHomeSound = -1;
}

function Indy_ParseSwitch(f,t,length)
{
var indy = Indy_Get();

	ASSERT(t == ekSwitchGroupTag);
	parseBlockGroup(f,t,length);

	indy._switch.s = g_parsedBlock;
	indy._switch.PrevMadeItHome = (g_parsedBlock).MadeItHome;
	(g_parsedBlock).MadeItHome = Indy_SwitchMadeItHome;
}

function Indy_ParseWinner(f,t,length)
{
var indy = Indy_Get();

	ASSERT(t == ekSwitchGroupTag);
	parseBlockGroup(f,t,length);

	indy.winner.s = g_parsedBlock;
	indy.winner.PrevMadeItHome = (g_parsedBlock).MadeItHome;
	(g_parsedBlock).MadeItHome = Indy_WinnerMadeItHome;
}

function Indy_ParseDoor(f,t,length)
{
var indy = Indy_Get();
	
	ASSERT(t == ekLockedDoorGroupTag);
	parseBlockGroup(f,t,length);
	indy.doors[indy.doorCount++] = g_parsedBlock;
}

var g_indy = NULL;
function Indy_Free(l)
{
	ASSERT(g_indy == l);
	g_indy = NULL;
}

var ekFluteMan = 0;
var ekTooHot = 1;
function Indy_Get()
{
	if (g_indy == NULL)
	{
		g_indy = {
			sliders:new Array(indyRowCount),
			sliderCount:new Array(indyRowCount),
			_switch:{}, winner:{},
			doors:[null,null],
			checkDeadDecorator:null,
			song:ekFluteMan,
			switchHitTimes:0, safeSymbol:0, doorCount:0, parseRow:0
		};
		for (var i = 0; i < indyRowCount; i++)
		{
			g_indy.sliders[i] = newObjectArray(indyColCount);
			g_indy.sliderCount[i] = 0;
		}
		g_indy.doorCount = 0;
		g_indy.parseRow = 0;
		
		g_indy.listener = g_indy;
		g_indy.listener.FinishedLoading = Indy_FinishedLoading;
		g_indy.listener.Reset = Indy_Reset;
		g_indy.listener.Died = Indy_Died;
		g_indy.listener.Free = Indy_Free;
		g_indy.listener.Persist = Indy_Persist;
		g_indy.listener.Recover = Indy_Recover;
		Level_RegisterListener(g_indy.listener);
	}

	return g_indy;
}

///////////////////////////////////////////////////////////////////////////////
// Tic-Tac-Toe
var ticX = ekPsi;
var ticO = ekUpperDelta;
var ticNil = -1;
function TicBlock_SetSymbol(tb,symbol)
{
	tb.symbol = symbol;
	Block_SetAtlasCoords(tb.b, Atlas_SymbolCoords(symbol));
}

function Tic_SetSymbol(tic,index,symbol)
{
	TicBlock_SetSymbol(tic.blocks[index], symbol);
}

function Tic_Reset(l)
{
var i;
var tic = l;

	if (!tic.beaten)
	{
		for (i = 0; i < 9; i++)
		{
			tic.blocks[i].b.group.bVisible = TRUE;
			Tic_SetSymbol(tic, i, ticNil);
			if (!Color_Equals(tic.color, tic.blocks[i].b.color))
				Block_SetColor(tic.blocks[i].b, tic.color[0], tic.color[1], tic.color[2]);
		}
	}

	tic.locked = FALSE;
}

function Tic_FinishedLoading(l)
{
var tic = l;

	ASSERT(tic.blockCount == 9);
	tic.beaten = FALSE;
	tic.color = arrdup(tic.blocks[0].b.color);
	l.Reset(l);
}

function Tic_Persist(l)
{
var tic = l;
var i;
 
	psWriteDword(tic.locked);
	psWriteDword(tic.beaten);	
	for (i = 0; i < tic.blockCount; i++)
		psWriteDword(tic.blocks[i].symbol);
}

function Tic_Recover(l,length)
{
var tic = l;
var i;
	
	ASSERT(length == (2 + tic.blockCount) * 4/*sizeof(DWORD)*/);
	
	tic.locked = psReadDword();
	tic.beaten = psReadDword();
	for (i = 0; i < tic.blockCount; i++)
	{
		tic.blocks[i].symbol = psReadDword();
		Block_SetAtlasCoords(tic.blocks[i].b, Atlas_SymbolCoords(tic.blocks[i].symbol));
	}
}

function Tic_Hide(tic)
{
var i;

	for (i = 0; i < 9; i++)
	{
		tic.blocks[i].b.group.bVisible = FALSE;
		Level_GetLevel().map.blockGroups[tic.blocks[i].b.iBlockGroup].blocksKnockedOut++;
	}
}

function Tic_VisitLines(tic,Visit)
{
var iLines = [
	[0,1,2],
	[3,4,5],
	[6,7,8],
	[0,3,6],
	[1,4,7],
	[2,5,8],
	[0,4,8],
	[2,4,6]
];
var lineCount = iLines.length;
var i,j;
	
	ASSERT(lineCount == 8);
	for (i = 0; i < lineCount; i++)
	{
		var xCount = 0, oCount = 0, nilCount = 0;
		var iNil;

		for (j = 0; j < 3; j++)
		{
			switch (tic.blocks[iLines[i][j]].symbol)
			{
			case ticX:
				xCount++;
				break;
			case ticO:
				oCount++;
				break;
			case ticNil:
				nilCount++;
				iNil = j;
				break;
			}
		}
		
		if (Visit(tic, iLines[i], xCount, oCount, nilCount, iNil))
			return TRUE;
	}

	return FALSE;
}

function Tic_TakeWinVisitor(tic,line,xCount,oCount,nilCount,iNil)
{
	if (nilCount == 1 && oCount == 2)
	{
		Tic_SetSymbol(tic, line[iNil], ticO);
		return TRUE;
	}

	return FALSE;
}

function Tic_BlockWinVisitor(tic,line,xCount,oCount,nilCount,iNil)
{
	if (nilCount == 1 && xCount == 2)
	{
		Tic_SetSymbol(tic, line[iNil], ticO);
		return TRUE;
	}

	return FALSE;
}

function Tic_StartWinVisitor(tic,line,xCount,oCount,nilCount,iNil)
{
	if (nilCount == 2 && xCount == 0)
	{
		if (tic.blocks[line[1]].symbol == ticNil)
			Tic_SetSymbol(tic, line[1], ticO);
		else
			Tic_SetSymbol(tic, line[2 * (rand() & 1)], ticO);

		return TRUE;
	}

	return FALSE;
}

function Tic_CheckWinVisitor(tic,line,xCount,oCount,nilCount,iNil)
{
var i;

	if (xCount == 3 || oCount == 3)
	{
		for (i = 0; i < 3; i++)
			Block_SetColor(tic.blocks[line[i]].b, (oCount == 3 ? 1 : 0), (xCount == 3 ? 1 : 0), 0);

		if (oCount == 3)
			Sound_Play(ekBuzzerSound);
		else
			Level_PuzzleSolved();

		return TRUE;
	}

	return FALSE;
}

function Tic_ShatterWinVisitor(tic,line,xCount,oCount,nilCount,iNil)
{
var i;

	if (xCount == 3 || oCount == 3)
	{
		ASSERT(xCount == 3);
		for (i = 0; i < 3; i++)
		{
			Level_AddDecorator(ShatterDecorator_FromBlock(tic.blocks[line[i]].b, NULL));
			tic.blocks[line[i]].b.group.bVisible = FALSE;
			Level_GetLevel().map.blockGroups[
				tic.blocks[line[i]].b.iBlockGroup].blocksKnockedOut++;
		}

		Sound_Play3D(ekShatterHugeSound, tic.blocks[line[1]].b.middle);

		return TRUE;
	}

	return FALSE;
}

function Tic_CheckForWinner(tic)
{
	return Tic_VisitLines(tic, Tic_CheckWinVisitor);
}

function Tic_ShatterWin(tic)
{
	Tic_VisitLines(tic, Tic_ShatterWinVisitor);
	tic.locked = FALSE;
}

function Tic_CheckBoardNotFullVisitor(tic,line,xCount,oCount,nilCount,iNil)
{
	return (nilCount != 0);
}

function Tic_CheckForBoardFull(tic)
{
	return !Tic_VisitLines(tic, Tic_CheckBoardNotFullVisitor);
}

function Tic_FinishedExploding()
{
	Tic_Get().listener.Reset(Tic_Get().listener);
}

function Tic_Beat(tic)
{
	Tic_Reset(tic.listener);
	Level_SetTimeout(.75, Tic_TakeNextTurn, tic);
	tic.locked = FALSE;
}

function Tic_TakeNextTurn(tic)
{
	if (!Tic_VisitLines(tic, Tic_TakeWinVisitor) && 
		 !Tic_VisitLines(tic, Tic_BlockWinVisitor) &&
		 !Tic_VisitLines(tic, Tic_StartWinVisitor))
	{
		var spot = rand() % 9;
		while (tic.blocks[spot].symbol != ticNil)
			spot = (spot + 4) % 9; // MUST BE COPRIME WITH 9!

		Tic_SetSymbol(tic, spot, ticO);
	}

	Sound_Play(ekChanger1Sound);

	if (Tic_CheckForWinner(tic))
	{
		tic.locked = TRUE;
		Level_AddDecorator(WatchActionDecorator_New(tic.blocks[0].b, Tic_Beat, tic));
	}
	else
	{
		tic.locked = FALSE;
		if (Tic_CheckForBoardFull(tic))
		{
			Level_AddDecorator(WatchActionDecorator_New(tic.blocks[0].b, Tic_Reset, tic));
		}
	}
}

function Tic_Collide(pGroup,pPrimitive)
{
var tic = Tic_Get();
var ball = Level_GetBall();
var i;

	if (ball.bInvincible)
	{
		tic.beaten = TRUE;
	}

	if (tic.beaten)
	{
		Block_Collide(pGroup, pPrimitive);
		return;
	}

	if (tic.locked)
	{
		Sound_Play3D(ekClickSound, ball.sphere.position);
		return;
	}

	for (i = 0; i < 9; i++)
	{
		if (tic.blocks[i].b.group == pGroup)
		{
			if (tic.blocks[i].symbol == ticNil && 
				 (Color_Equals(ball.sphere.primitive.color, tic.blocks[i].b.color)))
			{
				Tic_SetSymbol(tic, i, ticX);
				tic.locked = TRUE;

				Sound_Play(ekChanger0Sound);

				if (Tic_CheckForWinner(tic))
				{
					tic.beaten = TRUE;
					Level_AddDecorator(WatchActionDecorator_New(tic.blocks[0].b, Tic_ShatterWin, tic));
				}
				else if (Tic_CheckForBoardFull(tic))
				{
					Level_AddDecorator(WatchActionDecorator_New(tic.blocks[0].b, Tic_Reset, tic));
				}
				else
				{
					Level_SetTimeout(0.5, Tic_TakeNextTurn, tic);
				}
			}
			else
			{
				Sound_Play3D(ekClickSound, ball.sphere.position);
			}
			return;
		}
	}

	ASSERT(0);
}

function Tic_ParseBlock(f,t,length)
{
var tic = Tic_Get();

	ASSERT(t == ekBlockGroupTag);
	parseBlockGroup(f,t,length);

	g_parsedBlock.group.Collide = Tic_Collide;
	tic.blocks[tic.parseBlock].b = g_parsedBlock;

	ASSERT(tic.blockCount++ < 9);
}

var g_tic = NULL;
function Tic_Free(l)
{
	ASSERT(g_tic == l);
	g_tic = NULL;
}

function Tic_Get()
{
	if (g_tic == NULL)
	{
		g_tic = {};
		g_tic.blockCount = 0;
		g_tic.parseBlock = 0;
		g_tic.blocks = newObjectArray(9);
		
		g_tic.listener = g_tic;
		g_tic.listener.FinishedLoading = Tic_FinishedLoading;
		g_tic.listener.Reset = Tic_Reset;
		g_tic.listener.Died = NullDied;
		g_tic.listener.Free = Tic_Free;
		g_tic.listener.Recover = Tic_Recover;
		g_tic.listener.Persist = Tic_Persist;  
		Level_RegisterListener(g_tic.listener);
	}

	return g_tic;
}

///////////////////////////////////////////////////////////////////////////////
// Minesweeper
function Mine_ShowBombs(mine,show)
{
var i,j;

	for (i = 0; i < mine.count[1]; i++)
	{
		for (j = 0; j < mine.count[0]; j++)
		{
			if (mine.blocks[i][j].bomb)
			{
				mine.blocks[i][j].collided = TRUE;
				Block_SetAtlasCoords(mine.blocks[i][j].block, Atlas_BlockCoords(show ? ekKiller : ekBlock));
			}
		}
	}
}

function MineCoords_Shift(c,dx,dy)
{
	return [c[0] + dx, c[1] + dy];
}

function Mine_VisitNeighbors(mine,c,Visit,param)
{
function inside(MIN,VAL,MAX) { return (((VAL) > (MIN)) && ((VAL) < (MAX))); }
	var dx, dy;
	var count = 0;
	
	for (dy = -1; dy <= 1; dy++)
	{
		if (inside(-1, c[1] + dy, mine.count[1]))
		{
			for (dx = -1; dx <= 1; dx++)
			{
				if (inside(-1, c[0] + dx, mine.count[0]))
				{
					if (dx != 0 || dy != 0)
					{
						var mc = MineCoords_Shift(c, dx, dy);
						ASSERT(mc[1] >= 0 && mc[1] <= 8 && mc[0] >= 0 && mc[0] <= 8);
						ASSERT(abs(mc[0] - c[0]) <= 1 && abs(mc[1] - c[1]) <= 1);
						ASSERT(mc[0] != c[0] || mc[1] != c[1]);
						param = Visit(mine, mc, param);
						count++;
					}
				}
			}
		}
	}
	
	if ((c[0] == 0 || c[0] == 8) && (c[1] == 0 || c[1] == 8)) {
		ASSERT(count == 3);
	} else if ((c[0] == 0 || c[0] == 8) || (c[1] == 0 || c[1] == 8)) {
		ASSERT(count == 5);
	} else {
		ASSERT(count == 8);
	}
	
	return param;
}

function Mine_CountBombsVisitor(mine,c,param)
{
	if (mine.blocks[c[1]][c[0]].bomb)
		return param + 1;
	
	return param;
}

function Mine_Finished(mine)
{
var i,j;

	for (i = 0; i < mine.count[1]; i++)
	{
		for (j = 0; j < mine.count[0]; j++)
		{
			if (!mine.blocks[i][j].bomb && !mine.blocks[i][j].collided)
				return FALSE;
		}
	}

	return TRUE;
}

function Mine_Reset(l)
{
var mine = l;
var i,j;

	for (i = 0; i < mine.count[1]; i++)
	{
		for (j = 0; j < mine.count[0]; j++)
		{
			Block_SetAtlasCoords(mine.blocks[i][j].block, Atlas_BlockCoords(ekBlock));
			Block_SetColor(mine.blocks[i][j].block, mine.blocks[i][j].orgColor[0], 
				mine.blocks[i][j].orgColor[0], mine.blocks[i][j].orgColor[0]);
			mine.blocks[i][j].bomb = FALSE;
			mine.blocks[i][j].heart = FALSE;
			mine.blocks[i][j].collided = FALSE;
			mine.blocks[i][j].block.group.bVisible = TRUE;
			mine.blocks[i][j].block.group.type = ekBlock;
			mine.blocks[i][j].PrevCollide = Block_Collide;
		}
	}

	mine.set = FALSE;
}

function Mine_FinishedLoading(l)
{
var mine = l;
var changed;
var i,j;

	ASSERT(mine.count[0] == 9 && mine.count[1] == 9);
	ASSERT(mine.changer);

	// Sort by y
	do
	{
		changed = FALSE;
		for (i = 0; i < (9*9) - 1; i++)
		{
			var block1 = mine.blocks[Math.floor(i/9)][i%9];
			var block2 = mine.blocks[Math.floor((1+i)/9)][(1+i)%9];
			if (block1.block.middle[1] > block2.block.middle[1])
			{
				mine.blocks[Math.floor(i/9)][i%9] = block2;
				mine.blocks[Math.floor((1+i)/9)][(1+i)%9] = block1;
				changed = TRUE;
			}
		}
	} while (changed);

	// Sort by x
	for (i = 0; i < mine.count[1]; i++)
	{
		do
		{
			changed = FALSE;
			for (j = 0; j < mine.count[0] - 1; j++)
			{
				if (mine.blocks[i][j].block.middle[0] > mine.blocks[i][j + 1].block.middle[0])
				{
					var tmp = mine.blocks[i][j];
					mine.blocks[i][j] = mine.blocks[i][j + 1];
					mine.blocks[i][j + 1] = tmp;
					changed = TRUE;
				}
			}
		} while (changed);
	}

	l.Reset(l);
}

function Mine_Persist(l)
{
var mine = l;
var i,j;
	
	psWriteDword(mine.set);
	psWriteDword(mine.gotHeart);
	if (mine.set)
	{
		for (i = 0; i < mine.count[1]; i++)
		{
			for (j = 0; j < mine.count[0]; j++)
			{
				psWriteDword(mine.blocks[i][j].bomb);
				psWriteDword(mine.blocks[i][j].heart);
				psWriteDword(mine.blocks[i][j].collided);		

				psWriteFloat(mine.blocks[i][j].block.color[0]);			
				psWriteFloat(mine.blocks[i][j].block.color[1]);			
				psWriteFloat(mine.blocks[i][j].block.color[2]);			
				
				ASSERT(mine.blocks[i][j].block.group.bVisible || mine.blocks[i][j].collided);
			}
		}
	}
}

function Mine_Recover(l,length)
{
var mine = l;
var heart = NULL;
var finished;
var i,j;
	
	mine.set = psReadDword();
	mine.gotHeart = psReadDword();
	if (mine.set)
	{
		ASSERT(length == (2 + mine.count[1] * mine.count[0] * 3) * 4/*sizeof(DWORD)*/ + (mine.count[1] * mine.count[0] * 3) * 4/*sizeof(float)*/);
		for (i = 0; i < mine.count[1]; i++)
		{
			for (j = 0; j < mine.count[0]; j++)
			{
				var color = [0,0,0];
				mine.blocks[i][j].bomb = psReadDword();
				mine.blocks[i][j].heart = psReadDword();
				mine.blocks[i][j].collided = psReadDword();

				color[0] = psReadFloat();
				color[1] = psReadFloat();
				color[2] = psReadFloat();
				Block_SetColor(mine.blocks[i][j].block, color[0], color[1], color[2]);
				
				if (mine.blocks[i][j].heart)
				{
					ASSERT(!heart);
					heart = mine.blocks[i][j].block;
					mine.blocks[i][j].block.group.type = ekExtraGuy;
					mine.blocks[i][j].PrevCollide = ExtraGuy_Collide;
				}
				else if (mine.blocks[i][j].bomb)
				{
					mine.blocks[i][j].block.group.type = ekKiller;
					mine.blocks[i][j].PrevCollide = Killer_Collide;
				}
			}
		}	
	
		ASSERT(mine.gotHeart == (!heart || !heart.group.bVisible));
		finished = Mine_Finished(mine);
		for (i = 0; i < mine.count[1]; i++)
		{
			for (j = 0; j < mine.count[0]; j++)
			{
				if (mine.blocks[i][j].collided)
				{
					var c = [j,i];
					var bombs = Mine_VisitNeighbors(mine, c, Mine_CountBombsVisitor, 0);
					if (mine.blocks[i][j].heart)
						Block_SetAtlasCoords(mine.blocks[i][j].block, Atlas_BlockCoords(ekExtraGuy));
					else if (mine.blocks[i][j].bomb)
						Block_SetAtlasCoords(mine.blocks[i][j].block, Atlas_BlockCoords(ekKiller));
					else if (bombs > 0)
						Block_SetAtlasCoords(mine.blocks[i][j].block, Atlas_NumberCoords(bombs));
				}
			}
		}	
		
		if (Mine_Finished(mine))
			Mine_ShowBombs(mine, TRUE);
	}
}

function Mine_Set(mine,safe)
{
var specialCount;

	ASSERT(mine.count[0] == 9 && mine.count[1] == 9);
	for (specialCount = 11-1; specialCount >= 0; specialCount--)
	{
		var pos = rand() % (9*9);
		var c = [0,0];

		do {
			c[1] = Math.floor(pos / 9);
			c[0] = pos % 9;
			pos = (pos + 8*8) % (9*9);
		} while (mine.blocks[c[1]][c[0]].bomb ||
					(Mine_VisitNeighbors(mine, c, Mine_CountBombsVisitor, 0) > 2) || 
					((abs(c[0] - safe[0]) <= 1) && (abs(c[1] - safe[1]) <= 1)));

		if (specialCount)
		{
			mine.blocks[c[1]][c[0]].bomb = TRUE;
			mine.blocks[c[1]][c[0]].block.group.type = ekKiller;
			mine.blocks[c[1]][c[0]].PrevCollide = Killer_Collide;
		}
		else if (!mine.gotHeart)
		{
			mine.blocks[c[1]][c[0]].heart = TRUE;
			mine.blocks[c[1]][c[0]].block.group.type = ekExtraGuy;
			mine.blocks[c[1]][c[0]].PrevCollide = ExtraGuy_Collide;
		}
	}

	mine.set = TRUE;
	//Mine_ShowBombs(mine,TRUE);
}

function Mine_IndexOf(mine,b)
{
var c = [0,0];
var i,j;

	for (i = 0; i < mine.count[1]; i++)
	{
		for (j = 0; j < mine.count[0]; j++)
		{
			if (mine.blocks[i][j].block == b)
			{
				c[1] = i;
				c[0] = j;
				return c;
			}
		}
	}

	ASSERT(0);
	return c;
}

function Mine_AutoHitVisitor(mine,c,param)
{
	//if (!mine.blocks[c[1]][c[0]].heart)
		Mine_Hit(mine, c);

	return 0;
}

function Mine_ShowChanger(mine)
{
	Mine_ShowBombs(mine, TRUE);
	mine.changer.group.bVisible = TRUE;
	Sound_Play(rand() & 1 ? ekChanger0Sound : ekChanger1Sound);
}

function Mine_Hit(mine,c)
{
var bombs;

	if (mine.blocks[c[1]][c[0]].collided)
		return;

	mine.blocks[c[1]][c[0]].collided = TRUE; // Be at beginnig to avoid endless recursion
	bombs = Mine_VisitNeighbors(mine, c, Mine_CountBombsVisitor, 0);

	if (mine.blocks[c[1]][c[0]].heart)
	{
		Block_SetAtlasCoords(mine.blocks[c[1]][c[0]].block, Atlas_BlockCoords(ekExtraGuy));
		Sound_Play(rand() & 1 ? ekChanger0Sound : ekChanger1Sound);
	}
	else if (bombs > 0)
	{
		Block_SetAtlasCoords(mine.blocks[c[1]][c[0]].block, Atlas_NumberCoords(bombs));
		Block_SetColor(mine.blocks[c[1]][c[0]].block, mine.changer.color[0],
							mine.changer.color[1], mine.changer.color[2]);
		Sound_Play(rand() & 1 ? ekChanger0Sound : ekChanger1Sound);
	}
	else
	{
		var pBlockGroup = Level_GetLevel().map.blockGroups[mine.blocks[c[1]][c[0]].block.iBlockGroup];
		mine.blocks[c[1]][c[0]].block.group.bVisible = FALSE;
		pBlockGroup.blocksKnockedOut++;
		Level_AddDecorator(ShatterDecorator_FromBlock(mine.blocks[c[1]][c[0]].block, NULL));
		Sound_Play(ekGlassHardSound);
		Mine_VisitNeighbors(mine, c, Mine_AutoHitVisitor, 0);
		Ball_FindShadows(); // This will do it lazily - fine to call multiple times per frame
	}

	if (Mine_Finished(mine))
	{
		Level_PuzzleSolved();
		Level_AddDecorator(WatchActionDecorator_New(mine.changer, 
			Mine_ShowChanger, mine));
	}
}

function Mine_ResetAndChirp(mine)
{
	Sound_Play(rand() & 1 ? ekChanger0Sound : ekChanger1Sound);
	mine.listener.Reset(mine.listener);
}

function Mine_DoneWatching(bbn,time)
{
	return time > .5;
}

function Mine_Collide(pGroup,pPrimitive)
{
var mine = Mine_Get();
var c = Mine_IndexOf(mine, pGroup);
var mb = mine.blocks[c[1]][c[0]];
var ball = Level_GetBall();

	if (!ball.bInvincible && !mb.bomb &&
		 !Color_Equals(ball.sphere.primitive.color, mb.block.color))
	{
		Sound_Play3D(ekClickSound, ball.sphere.position);
		return;
	}
	
	if (!mine.set)
		Mine_Set(mine, c);
	
	if (mb.collided)
	{
		mb.PrevCollide(pGroup, pPrimitive);
		if (mb.heart && !mb.block.group.bVisible)
			mine.gotHeart = TRUE;
	}
	else if (mb.bomb)
	{
		if (ball.bInvincible)
		{
			Block_SetAtlasCoords(mb.block, Atlas_BlockCoords(ekKiller));
		}
		else
		{
			Mine_ShowBombs(mine, TRUE);
			Sound_Play(ekBuzzerSound);
			Level_AddDecorator(WatchActionDecorator_New(mb.block, Mine_ResetAndChirp, mine));
		}
	}
	else if (!mb.collided)
	{
		Mine_Hit(mine, c);
	}
}

function Mine_ParseBlock(f,t,length)
{
var mine = Mine_Get();

	ASSERT(t == ekBlockGroupTag);
	parseBlockGroup(f,t,length);

	if (mine.count[0] >= 9)
		mine.count[0] = 0;

	mine.blocks[mine.count[1]][mine.count[0]].block = g_parsedBlock;
	mine.blocks[mine.count[1]][mine.count[0]].PrevCollide = g_parsedBlock.group.Collide;
	mine.blocks[mine.count[1]][mine.count[0]].orgColor = arrdup(g_parsedBlock.color);
	
	if (++mine.count[0] >= 9)
		mine.count[1]++;

	g_parsedBlock.group.Collide = Mine_Collide;
}

function Mine_ParseChanger(f,t,length)
{
var mine = Mine_Get();
	
	ASSERT(t == ekChangerGroupTag);
	ASSERT(!mine.changer);
	parseBlockGroup(f,t,length);
	mine.changer = g_parsedBlock;
	mine.changer.group.bVisible = FALSE;
}

var g_mine = NULL;
function Mine_Free(l)
{
	ASSERT(g_mine == l);
	g_mine = NULL;
}

function Mine_Get()
{
	if (g_mine == NULL)
	{
		g_mine = {};
		g_mine.blocks = new Array(9);
		for (var i = 0; i < 9; i++)
			g_mine.blocks[i] = newObjectArray(9);
		g_mine.count = [0,0];
		g_mine.changer = NULL;
		g_mine.gotHeart = FALSE;
		
		g_mine.listener = g_mine;
		g_mine.listener.FinishedLoading = Mine_FinishedLoading;
		g_mine.listener.Reset = Mine_Reset;
		g_mine.listener.Died = NullDied;
		g_mine.listener.Free = Mine_Free;
		g_mine.listener.Persist = Mine_Persist;
		g_mine.listener.Recover = Mine_Recover;
		Level_RegisterListener(g_mine.listener);
	}

	return g_mine;
} 

///////////////////////////////////////////////////////////////////////////////
// Star picture puzzle
function Pic_ShowStar(pic)
{
	var i, j;
	pic.star.group.bVisible = TRUE;
	for (i = 0; i < pic.size; i++)
	{
		for (j = 0; j < pic.size; j++)
		{
			if (pic.blocks[i][j])
				pic.blocks[i][j].b.group.bVisible = FALSE;
		}
	}
	Sound_Play(rand() & 1 ? ekChanger0Sound : ekChanger1Sound);
	Ball_FindShadows();
}

function Pic_DoneWatching(param,time)
{
	return time > 2;
}

function Pic_Solved(pic)
{
var i,j;

	for (i = 0; i < pic.size; i++)
	{
		for (j = 0; j < pic.size; j++)
		{
			if (pic.key[i][j] != pic.blocks[i][j])
				return FALSE;
		}
	}
	return TRUE;
}

function PicDecorator_Free(d)
{
var pic = Pic_Get();

	ASSERT(pic.key.length == pic.blocks.length);
	if (Pic_Solved(pic))
	{
		Level_AddDecorator(WatchActionDecorator_NewWithCompleteFunc(pic.star, 2, 
			Pic_ShowStar, pic, Pic_DoneWatching, NULL));
		Level_PuzzleSolved();
	}

	pic.moving = FALSE;
	Decorator_Free(d);
}

function PicDecorator_NextFrame(d,spf,step)
{
var pic = Pic_Get();
var i, j;
var changed = 0;

	for (i = 0; i < pic.size; i++)
	{
		for (j = 0; j < pic.size; j++)
		{
			if (pic.blocks[i][j] && (pic.blocks[i][j].pos[0] != j || pic.blocks[i][j].pos[1] != i))
			{
				var speed = 1.5 * pic.blocks[i][j].map2grid[0][0] * spf * step;
				
				if (pic.blocks[i][j].pos[0] - speed > j)
					pic.blocks[i][j].pos[0] -= speed;
				else if (pic.blocks[i][j].pos[0] + speed < j)
					pic.blocks[i][j].pos[0] += speed;
				else
					pic.blocks[i][j].pos[0] = j;

				if (pic.blocks[i][j].pos[1] - speed > i)
					pic.blocks[i][j].pos[1] -= speed;
				else if (pic.blocks[i][j].pos[1] + speed < i)
					pic.blocks[i][j].pos[1] += speed;
				else
					pic.blocks[i][j].pos[1] = i;

				Stepper_SyncVerts(pic.blocks[i][j]);
				changed++;
			}
		}
	}

	Ball_FindShadows();
	BaseDecorator_NextFrame(d, spf, step);

	if (changed == 0)
		d.Free(d);
}

function PicDecorator_WillTerminate(d)
{
	var i,j;
	var pic = Pic_Get();
	
	BaseDecorator_WillTerminate(d);
	
	for (i = 0; i < pic.size; i++)
	{
		for (j = 0; j < pic.size; j++)
		{
			pic.blocks[i][j].pos[0] = j;
			pic.blocks[i][j].pos[1] = i;
		}
	}
}

function Pic_Push(pic,loc,dx,dy)
{
var next = [loc[0] + dx, loc[1] + dy];

	if (loc[0] >= pic.size || loc[1] >= pic.size || loc[0] < 0 || loc[1] < 0)
		return FALSE;

	if (pic.blocks[loc[1]][loc[0]] == NULL)
		return TRUE;

	if (Pic_Push(pic, next, dx, dy))
	{
		ASSERT(pic.blocks[next[1]][next[0]] == NULL);
		pic.blocks[next[1]][next[0]] = pic.blocks[loc[1]][loc[0]];
		
		pic.blockCoords[pic.blocks[next[1]][next[0]].b.group.index] = arrdup(next);

		pic.blocks[loc[1]][loc[0]] = NULL;

		return TRUE;
	}

	return FALSE;
}

function Pic_Reset(l)
{
var pic = l;
var pushes = 100 + rand() % 100;
var i, j;

	ASSERT(!pic.moving);
	ASSERT(pic.key.length == pic.blocks.length);
	while (pushes-- > 0 || Pic_Solved(pic))
	{
		var c = [rand() % pic.size, rand() % pic.size];
		
		while (!(
			Pic_Push(pic, c, +0, +1) ||
			Pic_Push(pic, c, +0, -1) ||
			Pic_Push(pic, c, +1, +0) ||
			Pic_Push(pic, c, -1, +0)))
		{
			c[0] = (c[0] + 1) % pic.size;
		}
	}

	for (i = 0; i < pic.size; i++)
	{
		for (j = 0; j < pic.size; j++)
		{
			if (pic.blocks[i][j])
			{
				pic.blocks[i][j].pos[0] = j;
				pic.blocks[i][j].pos[1] = i;
				Stepper_SyncVerts(pic.blocks[i][j]);
			}
		}
	}

	pic.star.group.bVisible = FALSE;
}

function Pic_StretchStar(block,iPoly,s,t,sParam,tParam)
{
var pic = Pic_Get();

	if (iPoly < 2)
	{
		return {s:block.atlasCoords.s + ((s - block.atlasCoords.s) * textureScale / Atlas_Scale / Atlas_TexSize + sParam * textureScale) / pic.size,
		        t:block.atlasCoords.t + ((t - block.atlasCoords.t) * textureScale / Atlas_Scale / Atlas_TexSize + tParam * textureScale)/ pic.size};
	}
	else
	{
		return {s:(s * textureScale / Atlas_Scale / Atlas_TexSize) * 0.3 + 0.05 * textureScale,
		        t:(t * textureScale / Atlas_Scale / Atlas_TexSize) * 0.3 + 0.01 * textureScale};
	}
}

function Pic_FinishedLoading(l)
{
var pic = l;
var v = [-0.707,-0.707,0];
var min = 0;
var i,j,k;
var holeFound = FALSE;
var s = new Array(15);
var theme = Level_GetLevel().map.theme;
var picture = NULL;

	pic.blockCoords = new Array(Level_GetLevel().map.polyGroupCount);

	if (pic.blockCount == 15)
		pic.size = 4;
	else if (pic.blockCount == 8)
		pic.size = 3;
	else
		ASSERT(0);

	for (i = 0; i < pic.blockCount; i++)
	{
		s[i] = pic.blocks[Math.floor(i/4)][i%4];
	}
	for (i = 0; i < 4; i++)
	{
		for (j = 0; j < 4; j++)
			pic.blocks[i][j] = null;
	}

	v = Matrix_Mult(s[0].grid2map, v);
	for (i = 1; i < pic.blockCount; i++)
	{
		ASSERT(fabs(s[0].b.middle[2] - s[i].b.middle[2]) < 0.01);
		ASSERT(fabs(s[0].pos[2] - s[i].pos[2]) < 0.01);
		ASSERT(Matrix_VeryClose(s[0].map2grid, s[i].map2grid, 0.01));
		if (Vector_Dot(v, s[min].b.middle) < Vector_Dot(v, s[i].b.middle))
		{
			min = i;
		}
	}

	for (i = 0; i < pic.blockCount; i++)
	{
		s[i].origin = s[min].origin;
		s[i].pos = Matrix_Mult(s[i].map2grid, Vector_Subtract(s[i].b.middle, s[min].b.middle));

		pic.blocks[Math.floor(s[i].pos[1] + 0.5)][Math.floor(s[i].pos[0] + 0.5)] = s[i];
		pic.blockCoords[s[i].b.group.index] = [Math.floor(s[i].pos[0] + 0.5),
		                                       Math.floor(s[i].pos[1] + 0.5)];
	}

	for (i = 0; i < theme.textureCount; i++)
	{
		if (theme.texts[i].name == "picture")
		{
			picture = theme.texts[i];
			break;
		}
	}
	ASSERT(picture);

	for (i = 0; i < pic.size; i++)
	{
		for (j = 0; j < pic.size; j++)
		{
			if (pic.blocks[i][j] == NULL)
			{
				ASSERT(!holeFound);
				holeFound = TRUE;
			}
			else
			{
				var color = [0,0,0];
				for (k = 0; k < pic.blocks[i][j].b.group.polyCount; k++)
					pic.blocks[i][j].b.group.polys[k].primitive.pTexture = picture;

				Block_SetAtlasCoords(pic.blocks[i][j].b, Atlas_BlockCoords(ekStar));
				Block_TransformAtlasCoordsIndexed(pic.blocks[i][j].b, Pic_StretchStar, j, i);
				arrcpy(color, pic.blocks[i][j].b.color, 3);
				Block_SetColor(pic.blocks[i][j].b, 1, 1, 1);
				arrcpy(pic.blocks[i][j].b.color, color, 3);
			}
		}
	}

	ASSERT(pic.key.length == pic.blocks.length);
	for (i = 0; i < 4; i++)
	{
		for (j = 0; j < 4; j++)
			pic.key[i][j] = pic.blocks[i][j];
	}
	pic.moving = FALSE;

	l.Reset(l);
}

function Pic_Persist(l)
{
	var pic = l;
	var i,j;
	
	for (i = 0; i < pic.size; i++)
	{
		for (j = 0; j < pic.size; j++)
		{
			if (pic.blocks[i][j])
				psWriteDword(pic.blocks[i][j].b.group.index);
			else
				psWriteDword(-1);
		}
	}
}

function Pic_Recover(l,length)
{
	var pic = l;
	var i,j;
	
	ASSERT(length == pic.size * pic.size * 4/*sizeof(DWORD)*/);
	
	for (i = 0; i < pic.size; i++)
	{
		for (j = 0; j < pic.size; j++)
		{
			var dest = [j, i];
			var index = psReadDword();			
			if (index != -1)
			{
				var cur = pic.blockCoords[index];
				
				if (dest[0] != cur[0] || dest[1] != cur[1])
				{
					var tmp = pic.blocks[dest[1]][dest[0]];
					pic.blocks[dest[1]][dest[0]] = pic.blocks[cur[1]][cur[0]];
					pic.blocks[cur[1]][cur[0]] = tmp;
					
					pic.blockCoords[pic.blocks[dest[1]][dest[0]].b.group.index] = dest;
					if (pic.blocks[cur[1]][cur[0]])
						pic.blockCoords[pic.blocks[cur[1]][cur[0]].b.group.index] = cur;
				}
				
				pic.blocks[dest[1]][dest[0]].pos[0] = j;
				pic.blocks[dest[1]][dest[0]].pos[1] = i;
				Stepper_SyncVerts(pic.blocks[dest[1]][dest[0]]);
			}
		}
	}
}

function Pic_Collide(pGroup,pPrimitive)
{
var pic = Pic_Get();
var ball = Level_GetBall();
var loc = pic.blockCoords[pGroup.index];

	if (pic.moving || 
		 !Color_Equals(ball.sphere.primitive.color, (pGroup).color))
	{
		Sound_Play3D(ekClickSound, ball.sphere.position);
		return;
	}

	if (Pic_Push(pic, loc, +1, +0) ||
		 Pic_Push(pic, loc, +0, +1) ||
		 Pic_Push(pic, loc, -1, +0) ||
		 Pic_Push(pic, loc, +0, -1))
	{
		var d = Decorator_New();
		d.NextFrame = PicDecorator_NextFrame;
		d.Free = PicDecorator_Free;
		d.WillTerminate = PicDecorator_WillTerminate;
		Level_AddDecorator(d);

		Sound_Play3D(ekSliderSound, ball.sphere.position);
	}
	else
	{
		Sound_Play3D(ekClickSound, ball.sphere.position);
	}
}

function Pic_ParseBlock(f,t,length)
{
var pic = Pic_Get();

	ASSERT(t == ekStepperGroupTag);
	if (!g_parsingBlock)
		Set_pBlock(Coaster_New(false));
	parseBlockGroup(f,t,length);

	g_parsedBlock.group.Collide = Pic_Collide;
	pic.blocks[Math.floor(pic.blockCount/4)][pic.blockCount%4] = g_parsedBlock;
	pic.blockCount++;
}

function Pic_ParseStar(f,t,length)
{
var pic = Pic_Get();

	ASSERT(t == ekStarGroupTag);
	parseBlockGroup(f,t,length);
	pic.star = g_parsedBlock;
}

var g_pic = NULL;
function Pic_Free(l)
{
	ASSERT(g_pic == l);
	g_pic = NULL;
}

function Pic_Get()
{
	if (g_pic == NULL)
	{
		g_pic = {blocks:new Array(4),
                 key:new Array(4)};
		for (var i = 0; i < 4; i++)
		{
			g_pic.blocks[i] = newObjectArray(4);
			g_pic.key[i] = newObjectArray(4);
		}
		g_pic.blockCount = 0;
		g_pic.blockCoords = NULL;
		
		g_pic.listener = g_pic;
		g_pic.listener.FinishedLoading = Pic_FinishedLoading;
		g_pic.listener.Reset = Pic_Reset;
		g_pic.listener.Died = NullDied;
		g_pic.listener.Free = Pic_Free;
		g_pic.listener.Persist = Pic_Persist;
		g_pic.listener.Recover = Pic_Recover;
		Level_RegisterListener(g_pic.listener);
	}

	return g_pic;
}

///////////////////////////////////////////////////////////////////////////////
// Doorstop
function Doorstop_Reset(l)
{

}

function Doorstop_FinishedLoading(l)
{
var doorstop = l;
var i;

	ASSERT(doorstop.stopCount == 2);

	for (i = 0; i < doorstop.stopCount; i++)
	{
		doorstop.stops[i].s.origin = arrdup(doorstop.stops[i].s.home);
		doorstop.stops[i].s.origin[2] += 0.2;
		doorstop.stops[i].s.pos = Matrix_Mult(doorstop.stops[i].s.map2grid, 
			Vector_Subtract(doorstop.stops[i].s.b.middle, doorstop.stops[i].s.origin));
	}

	doorstop.timesWatched = 0;
	doorstop.solved = FALSE;
}

function Doorstop_Persist(l)
{
var doorstop = l;

	psWriteDword(doorstop.timesWatched);
	psWriteDword(doorstop.solved);
}

function Doorstop_Recover(l,length)
{
var doorstop = l;

	ASSERT(length == 2*4/*sizeof(DWORD)*/);

	doorstop.timesWatched = psReadDword();
	doorstop.solved = psReadDword();
}

function Doorstop_StopDoors(doorstop)
{
	LockedDoor_Open(doorstop.door2);
	if (!doorstop.door.isHome)
		doorstop.door.b.SwitchHit(doorstop.door.b, TRUE);

	if (doorstop._switch.s.isHome)
		Level_AddDecorator(ToOriginDecorator_New(doorstop._switch.s, 0));
}

function Doorstop_SwitchDoors(doorstop)
{
	LockedDoor_Open(doorstop.door);
	if (!doorstop.door2.isHome)
		doorstop.door2.b.SwitchHit(doorstop.door2.b, TRUE);

	if (doorstop.stops[0].s.isHome)
		Level_AddDecorator(ToOriginDecorator_New(doorstop.stops[0].s, 0));
	else if (doorstop.stops[1].s.isHome)
		Level_AddDecorator(ToOriginDecorator_New(doorstop.stops[1].s, 0));
}

function Doorstop_DoneOpening(doorstop,time)
{
	if (doorstop.timesWatched == 1)
	{
		return !doorstop.door.b.group.moving;
	}
	else if (doorstop.timesWatched == 2)
	{
		return !doorstop.door2.b.group.moving;
	}
	else
	{
var doorstopSolveWatchTime = 1;
		
		if (doorstop.solved && time > doorstopSolveWatchTime)
		{
			Level_PuzzleSolved();
			return TRUE;
		}
		
		return time > doorstopSolveWatchTime;
	}
}

function Doorstop_SwitchMadeItHome(s)
{
var doorstop = Doorstop_Get();

	if (doorstop.timesWatched++ < 2)
	{
		Level_AddDecorator(WatchActionDecorator_NewWithCompleteFunc(doorstop._switch.s, .25, 
				Doorstop_SwitchDoors, doorstop, 
				Doorstop_DoneOpening, doorstop));
	}
	else
	{
		Doorstop_SwitchDoors(doorstop);
	}
}

function Doorstop_StopMadeItHome(s)
{
var doorstop = Doorstop_Get();
var watch = FALSE;

	if (doorstop.timesWatched++ < 2)
	{
		watch = TRUE;
	}
	else if (!doorstop.solved)
	{
		var dir = Vector_Scale(Vector_Subtract(doorstop.door.pos, Matrix_Mult(doorstop.door.map2grid, 
										 Vector_Subtract(doorstop.door.home, doorstop.door.origin))), -2);
		var coll = doorstop.door.FindNextCollision(doorstop.door, dir);
		if ((coll.group == doorstop.stops[0].s.b.group.index) || (coll.group == doorstop.stops[1].s.b.group.index))
		{
			doorstop.solved = TRUE;
			watch = TRUE;
		}
	}

	if (watch)
	{
		Level_AddDecorator(WatchActionDecorator_NewWithCompleteFunc(doorstop.solved ? doorstop.door : doorstop._switch.s, .25, 
				Doorstop_StopDoors, doorstop, 
				Doorstop_DoneOpening, doorstop));
	}
	else
	{
		Doorstop_StopDoors(doorstop);
	}
}

function Doorstop_ParseStop(f,t,length)
{
var doorstop = Doorstop_Get();

	ASSERT(t == ekCoasterGroupTag);
	parseBlockGroup(f,t,length);

	doorstop.stops[doorstop.stopCount].s = g_parsedBlock;
	doorstop.stops[doorstop.stopCount].PrevMadeItHome = (g_parsedBlock).MadeItHome;
	doorstop.stopCount++;

	(g_parsedBlock).MadeItHome = Doorstop_StopMadeItHome;
}

function Doorstop_ParseSwitch(f,t,length)
{
var doorstop = Doorstop_Get();

	ASSERT(!doorstop._switch.s);
	ASSERT(t == ekSwitchGroupTag);
	parseBlockGroup(f,t,length);

	doorstop._switch.s = g_parsedBlock;
	doorstop._switch.PrevMadeItHome = (g_parsedBlock).MadeItHome;
	(g_parsedBlock).MadeItHome = Doorstop_SwitchMadeItHome;
}

function Doorstop_ParseDoor(f,t,length)
{
var doorstop = Doorstop_Get();

	ASSERT(t == ekLockedDoorGroupTag);
	ASSERT(!doorstop.door);
	parseBlockGroup(f,t,length);
	doorstop.door = g_parsedBlock;
}

function Doorstop_ParseDoor2(f,t,length)
{
var doorstop = Doorstop_Get();

	ASSERT(t == ekLockedDoorGroupTag);
	ASSERT(!doorstop.door2);
	parseBlockGroup(f,t,length);
	doorstop.door2 = g_parsedBlock;
}

var g_doorstop = NULL;
function Doorstop_Free(l)
{
	ASSERT(g_doorstop == l);
	g_doorstop = NULL;
}

function Doorstop_Get()
{
	if (g_doorstop == NULL)
	{
		g_doorstop = {
			stops:[{},{}],
			_switch:{s:null}, door:null, door2:null,
			timesWatched:0, solved:false, stopCount:0
		};
		
		g_doorstop.listener = g_doorstop;
		g_doorstop.listener.FinishedLoading = Doorstop_FinishedLoading;
		g_doorstop.listener.Reset = Doorstop_Reset;
		g_doorstop.listener.Died = NullDied;
		g_doorstop.listener.Free = Doorstop_Free;
		g_doorstop.listener.Recover = Doorstop_Recover;
		g_doorstop.listener.Persist = Doorstop_Persist;
		Level_RegisterListener(g_doorstop.listener);
	}

	return g_doorstop;
} 

///////////////////////////////////////////////////////////////////////////////
// Puzzle assignments
function Puzzles_GetParser(id)
{
	if (startsWith(id, "mine"))
	{
		if (id == "mine")
		{
			return Mine_ParseBlock;
		}
		else
		{
			return Mine_ParseChanger;
		}
	}
	if (startsWith(id, "indy"))
	{
		if (id == "indyswitch")
		{
			return Indy_ParseSwitch;
		}
		if (id == "indywin")
		{
			return Indy_ParseWinner;
		}
		else if (id == "indydoor")
		{
			return Indy_ParseDoor;
		}
		else
		{
			if (id.charCodeAt(4) >= '0'.charCodeAt(0) && id.charCodeAt(4) <= '9'.charCodeAt(0))
				Indy_Get().parseRow = id.charCodeAt(4) - '0'.charCodeAt(0);
			else
				Indy_Get().parseRow = 10 + id.charCodeAt(4) - 'a'.charCodeAt(0);

			return Indy_ParseBlock;
		}
	}
	if (startsWith(id, "match"))
	{
		if (id == "matchchanger")
		{
			return Match_ParseChanger;
		}
		else if (startsWith(id, "matchkey"))
		{
			Match_Get().nextIndex = id[8] - '0';
			ASSERT(Match_Get().nextIndex >= 0 && Match_Get().nextIndex <= 9);
			return Match_ParseKey;
		}
		else
		{
			Match_Get().nextIndex = id[5] - '0';
			ASSERT(Match_Get().nextIndex >= 0 && Match_Get().nextIndex <= 9);
			return Match_ParseBlock;
		}
	}
	if (startsWith(id, "bbn"))
	{
		if (id == "bbnlast")
		{
			return Bbn_ParseLastGroup;
		}
		else if (id == "bbnlasteasy")
		{
			//Bbn_Get().easy = TRUE;
			return Bbn_ParseLastGroup;
		}
		else
		{
			return Bbn_ParseGroup;
		}
	}
	if (startsWith(id, "pic"))
	{
		if (id == "picstar")
			return Pic_ParseStar;
		else
			return Pic_ParseBlock;
	}
	if (startsWith(id, "cycle"))
	{
		if (id == "cyclechanger")
		{
			return Cycle_ParseChanger;
		}
		else
		{
			Cycle_Get().parseGroup = id[5] - '0';
			Cycle_Get().parseBlock = id[6] - '0';
			return Cycle_ParseBlock;
		}
	}
	if (startsWith(id, "bin"))
	{
		if (id[3] >= '0' && id[3] <= '9')
			Bin_Get().parseBlock = id[3] - '0';
		else
			Bin_Get().parseBlock = 10 + id[3] - 'a';

		return Bin_ParseBlock;
	}
	if (startsWith(id, "simon2"))
	{
		if (id == "simon2")
			return Simon2_ParseBlock;
		if (id == "simon2_last")
			return Simon2_ParseLast;
	}
	if (startsWith(id, "code"))
	{
		if (id == "codelast")
			return Code_ParseLast;
		else if (id == "codekey")
			return Code_ParseKey;
		else
			return Code_ParseBlock;
	}
	if (id == "simon")
	{
		return Simon_ParseGroup;
	}
	if (startsWith(id, "tic"))
	{
		Tic_Get().parseBlock = id[3] - '0';
		return Tic_ParseBlock;
	}
	if (startsWith(id, "doorstop"))
	{
		if (id == "doorstop")
			return Doorstop_ParseStop;
		else if (id == "doorstopswitch")
			return Doorstop_ParseSwitch;
		else if (id == "doorstopdoor")
			return Doorstop_ParseDoor;
		else if (id == "doorstopdoor2")
			return Doorstop_ParseDoor2;
	}
	if (startsWith(id, "sign"))
	{
		return Signs_GetParser(id);
	}

	return parseBlockGroup;
}
