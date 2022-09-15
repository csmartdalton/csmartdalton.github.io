var maxListeners = 10;
var blockBreakPoints = 10;
var maxBreakPoints = 100;
var ballLockTableSize = 16; // MUST be a power of 2

var NullTexture = {
	tex:null,
	value:function() {
		if (!NullTexture.tex) {
			NullTexture.tex = loadTexture(document.getElementById('white-texture'));
			NullTexture.tex.soundId = -1;
		}
		return NullTexture.tex;
	}
};

function foreach_poly_in(map,mask,func)
{
	var iGroup, iPoly;
	for (iGroup = 0; iGroup < (map).polyGroupCount; iGroup++)
	{
		var group = (map).polyGroups[iGroup];
		if (!group.bVisible)
		{
			continue;
		}

		if (iGroup > 0)
		{
			var index = (map).polyGroups[0].polyCount + 6 + (map).polyGroups[iGroup].index - 1;
			if ((mask) && !((mask)[index >> 5] & (1 << (index & 0x1f))))
				continue;
		}

		for (iPoly = 0; iPoly < group.polyCount; iPoly++)
		{
			if (!(mask) || iGroup != 0 || ((mask)[iPoly >> 5] & (1 << (iPoly & 0x1f))))
			{
				func(group.polys[iPoly],group,iGroup);
			}
		}
	}
}

///////////////////////////////////////////////////////////////////////////////
// Singleton class members
var xyMaxMaxDistanceFromBall = 1.75;
function xyMaxDistanceFromBall() {
	var distance = 0.8;
	if (camera.screenHeight < camera.screenWidth)
	{
		distance += 0.3 * camera.screenWidth/camera.screenHeight;
		distance = min(distance, xyMaxMaxDistanceFromBall);
	}
	return distance;
}
var level = {
	map:null,
	max:[0,0,0],
	min:[0,0,0],
	seconds:0,
	score:0,
	nextBreakPoints:0,
	missCount:0,
	frameCount:0,
	collisionCount:0,
	listeners: new Array(maxListeners),
	listenerCount:0,
	stars:new Array(6),
	starCount:0,
	spikesMoving:false,
	spikeHiding:0
};
var ball = {
	sphere:Sphere_New(),
	texture:null,
	forward:[0,0,0],
	controlAngle:[[0,0,0],[0,0,0],[0,0,0]],
	velocity:[0,0,0],
	targetRelativeVelocity:[0,0,0],
	prevCollision:[0,0,0],
	nextCollision:[0,0,0],
	pCollisionPoly:null,
	iCollisionGroup:0,
	bVisible:false,
	bShadowsVisible:false,
	bMoving:false,
	bInvincible:false,
	shouldFindShadows:false,
	shouldFindNextCollision:false,
	speed:0,
	shadowAbove:[0,0,0],
	polyAbove:null,
	shadowBelow:[0,0,0],
	polyBelow:null,
	lockStart:0, lockCount:0,
	locks:new Array(ballLockTableSize)
};
for (var i = 0; i < ballLockTableSize; i++) {
	ball.locks[i] = {
		seconds:0,
		velocity:[0,0,0],
		nextZ:0
	};
}
var camera = {
	position:[0,0,0],
	yaw:0, pitch:0, roll:0,
	viewAngle:[[0,0,0],[0,0,0],[0,0,0]],
	screenWidth:0, screenHeight:0,
	xMouse:0, yMouse:0, turnMag:0,
	xyDistanceFromBall:0,
	zMaxDistanceFromBall:0,
	bEnableAutoLook:false,
	bDisableOscillation:false,
	zTarget:0,
	xyTargetDistanceFromBall:0,
	xyPrevTargetDistanceFromBall:0,   
	xyLockDistanceFromBall:0,
	hasNextCollision:false,
	bShouldFindNextCollision:false,
	lastCollideDetectPos:[0,0,0],
	lookLockTime:0,
	seenShadowAbove:false,
	seenShadowBelow:false
};
var checkpoint = {};
var Decorators = NULL;
var bDead = FALSE;
var bCleared = FALSE;
var willTerminate = FALSE;

///////////////////////////////////////////////////////////////////////////////
// Hooks

var game_listener;
function Level_SetGameListener(listener)
{
	game_listener = {died: listener.died ? listener.died : function() { return TRUE; },
				     cleared: listener.cleared ? listener.cleared : function() { },
	                 blockBroken: listener.blockBroken ? listener.blockBroken : function() { },
	                 bounced: listener.bounced ? listener.bounced : function() { },
	                 finishedLoading: listener.finishedLoading ? listener.finishedLoading : function() { }};
}
Level_SetGameListener({});

///////////////////////////////////////////////////////////////////////////////
// Listeners
function Level_RegisterListener(l)
{
	ASSERT(level.listenerCount + 1 < maxListeners);
	level.listeners[level.listenerCount++] = l;
}

///////////////////////////////////////////////////////////////////////////////
// Persistence
function Level_Persist()
{
	var i;
	for (i = 0; i < level.map.polyGroupCount; i++)  
	{
		psBegin(ekPolyGroupTag);
		psWriteDwordTag(ekPolyGroupIndexTag, level.map.polyGroups[i].index);
		psBegin(ekPolyGroupDataTag);
		level.map.polyGroups[i].Persist(level.map.polyGroups[i]);
		psEnd(ekPolyGroupDataTag);		
		psEnd(ekPolyGroupTag);		
	}	
	
	psBegin(ekBlockGroupsTag);
	for (var i = 0; i < level.map.blockGroupCount; i++)
	{
		var group = level.map.blockGroups[i];
		psWriteDword(group.blockCount);
		psWriteDword(group.blocksKnockedOut);
		psWriteDword(group.pointsEarned);
		psWriteByte(group.specialKnockedOut);
	}
	psEnd(ekBlockGroupsTag);
	
	psBegin(ekBlocksTag);
	Blocks_Persist();
	psEnd(ekBlocksTag);
	
	psWriteDwordTag(ekSpikeCountTag, level.map.spikeCount);
	for (i = 0; i < level.map.spikeCount; i++)
	{
		var spike = level.map.spikeBalls[i];
		var tag = spike.type == ekStatic ? ekStaticSpikeTag : ekDeflectiveSpikeTag; 
		psBegin(tag);
			psWriteDword(i);
			psWriteDword(spike.type);
			psWriteFloatArray(spike.sphere.position, 3);
			psWriteFloatArray(spike.velocity, 3);
			psWriteFloatArray(spike.nextCollision, 3);
			psWriteFloatArray(spike.prevCollision, 3);
			psWriteFloatArray(spike.collisionPlane.normal, 3);
			psWriteFloat(spike.collisionPlane.k);
			psWriteFloatArray(spike.prevPlane.normal, 3);
			psWriteFloat(spike.prevPlane.k);
			psWriteDword(spike.iCollisionGroup);
			psWriteDword(spike.iPrevCollision);
			psWriteFloatArray(spike.color, 3);
		psEnd(tag);
	}
	
	psBegin(ekCheckpointTag);
		psWriteFloatArray(checkpoint.pos, 3);
		psWriteFloat(checkpoint.yaw);
		psWriteFloat(checkpoint.pitch);
	   	psWriteFloatArray(checkpoint.ballColor, 3);
	   	psWriteDword(checkpoint.nextBreakPoints);
	   	psWriteDword(checkpoint.missCount);
	   	psWriteDword(checkpoint.collisionCount);
	psEnd(ekCheckpointTag);
	psWriteFloatTag(ekTimerTag, level.seconds);
	psBegin(ekScoreTag);
	psWriteDword(level.score);
	psWriteDword(level.nextBreakPoints);
	psWriteDword(level.missCount);	
	psWriteDword(level.collisionCount);
	psEnd(ekScoreTag);
	psBegin(ekCameraTag);
		psWriteByte(17);
		psWriteFloatArray(camera.position, 3);
		psWriteFloat(camera.yaw);
		psWriteFloat(camera.pitch);
		psWriteFloat(camera.roll);
		psWriteFloatArray2d(camera.viewAngle, 3, 3);
		psWriteFloat(camera.screenWidth);
		psWriteFloat(camera.screenHeight);
		psWriteFloat(camera.xyDistanceFromBall);
		psWriteFloat(camera.zMaxDistanceFromBall);
		psWriteByte(camera.bEnableAutoLook);
		psWriteByte(camera.bDisableOscillation);
		psWriteFloat(camera.zTarget);
		psWriteFloat(camera.xyTargetDistanceFromBall);
		psWriteFloat(camera.xyPrevTargetDistanceFromBall);   
		psWriteFloat(camera.xyLockDistanceFromBall);
		psWriteFloat(camera.xyMaxLockDistanceFromBall);
		psWriteByte(camera.hasNextCollision);
		psWriteByte(camera.bShouldFindNextCollision);
		psWriteFloatArray(camera.lastCollideDetectPos, 3);
		psWriteFloat(camera.lookLockTime);
		psWriteDword(camera.seenShadowAbove);
		psWriteDword(camera.seenShadowBelow);
	psEnd(ekCameraTag);
	psBegin(ekBallTag);
		psWriteFloatArray(ball.sphere.primitive.color, 4);
		psWriteFloatArray(ball.sphere.position, 3);
		psWriteFloatArray2d(ball.sphere.T, 3, 3);
		psWriteFloatArray(ball.forward, 3);
		psWriteFloatArray2d(ball.controlAngle, 3, 3);
		psWriteFloatArray(ball.velocity, 3);
		psWriteFloatArray(ball.targetRelativeVelocity, 3);
		psWriteFloatArray(ball.angularVelocity, 3);
		psWriteFloatArray(ball.prevCollision, 3);
		psWriteFloatArray(ball.nextCollision, 3);
		psWriteDword(ball.iCollisionGroup);
		psWriteByte(ball.bVisible);
		psWriteByte(ball.bShadowsVisible);
		psWriteByte(ball.bMoving);
		psWriteByte(ball.bInvincible);
		psWriteByte(ball.shouldFindShadows);
		psWriteByte(ball.shouldFindNextCollision);
		psWriteFloat(ball.speed);
		psWriteFloatArray(ball.shadowAbove, 3);
		psWriteFloatArray(ball.shadowBelow, 3);
		//psWriteDword(ball.lockStart);
		psWriteDword(ball.lockCount);
		for (var i = 0; i < ball.lockCount; i++)
		{
			var lock = ball.locks[(i+ball.lockStart) & (ballLockTableSize - 1)];
			psWriteFloat(lock.seconds);
			psWriteFloatArray(lock.velocity, 3);
			psWriteFloat(lock.nextZ);
		}
	psEnd(ekBallTag);

	for (i = 0; i < level.listenerCount; i++)
	{
		psBegin(ekLevelListenerTag);
		psWriteDword(i);
		level.listeners[i].Persist(level.listeners[i]);
		psEnd(ekLevelListenerTag);	
	}
}

function ParsePolyGroup(param,tag,length)
{
	switch (tag) {
		case ekPolyGroupIndexTag:
			param.index = psReadDword();
			break;
		case ekPolyGroupDataTag:
			level.map.polyGroups[param.index].Recover(level.map.polyGroups[param.index], length);
			break;
	}
}

function ParseLevel(param,tag,length)
{
var bt,i;

	switch (tag) {
	case ekCameraTag:
		//psRead(camera, buf, min(length, sizeof(camera)));
		var food = psReadByte();
		camera.position = psReadFloatArray(3);
		camera.yaw = psReadFloat();
		camera.pitch = psReadFloat();
		camera.roll = psReadFloat();
		camera.viewAngle = psReadFloatArray2d(3,3);
		camera.screenWidth = psReadFloat();
		camera.screenHeight = psReadFloat();
		camera.xyDistanceFromBall = psReadFloat();
		camera.zMaxDistanceFromBall = psReadFloat();
		camera.bEnableAutoLook = psReadByte();
		camera.bDisableOscillation = psReadByte();
		camera.zTarget = psReadFloat();
		camera.xyTargetDistanceFromBall = psReadFloat();
		camera.xyPrevTargetDistanceFromBall = psReadFloat();   
		camera.xyLockDistanceFromBall = psReadFloat();
		camera.xyMaxLockDistanceFromBall = psReadFloat();
		camera.hasNextCollision = psReadByte();
		camera.bShouldFindNextCollision = psReadByte();
		camera.lastCollideDetectPos = psReadFloatArray(3);
		camera.lookLockTime = psReadFloat();
		camera.seenShadowAbove = psReadDword();
		camera.seenShadowBelow = psReadDword();
		Nova_SetPosition(camera.position);
		Nova_SetViewAngle3f(camera.yaw, camera.pitch, camera.roll);
		camera.hasNextCollision = FALSE;
		break;
	case ekBallTag:
		bt = ball.texture.texGL;
		//psRead(ball, buf, min(length, sizeof(ball)));
		ball.sphere.primitive.color = psReadFloatArray(4);
		ball.sphere.position = psReadFloatArray(3);
		ball.sphere.T = psReadFloatArray2d(3,3);
		ball.forward = psReadFloatArray(3);
		ball.controlAngle = psReadFloatArray2d(3,3);
		ball.velocity = psReadFloatArray(3);
		ball.targetRelativeVelocity = psReadFloatArray(3);
		ball.angularVelocity = psReadFloatArray(3);
		ball.prevCollision = psReadFloatArray(3);
		ball.nextCollision = psReadFloatArray(3);
		ball.iCollisionGroup = psReadDword();
		ball.bVisible = psReadByte();
		ball.bShadowsVisible = psReadByte();
		ball.bMoving = psReadByte();
		ball.bInvincible = psReadByte();
		ball.shouldFindShadows = psReadByte();
		ball.shouldFindNextCollision = psReadByte();
		ball.speed = psReadFloat();
		ball.shadowAbove = psReadFloatArray(3);
		ball.shadowBelow = psReadFloatArray(3);
		ball.lockStart = 0;
		ball.lockCount = psReadDword();
		for (var i = 0; i < ball.lockCount; i++)
		{
			var lock = ball.locks[i];
			lock.seconds = psReadFloat();
			lock.velocity = psReadFloatArray(3);
			lock.nextZ = psReadFloat();
		}
		
		ball.sphere.primitive.pTexture = ball.texture;
		ball.texture.texGL = bt;
		Ball_FindNextCollision();
		ball.polyAbove = ball.polyBelow = NULL;
		Ball_FindShadowsInternal();	
		Camera_FindNextCollision();
		camera.xyDistanceFromBall = camera.xyTargetDistanceFromBall;
		camera.xyPrevTargetDistanceFromBall = camera.xyTargetDistanceFromBall;
		camera.xyLockDistanceFromBall = 0;
		camera.position[2] = camera.zTarget;
		break;		  
	case ekBlockGroupsTag:
		if (level.map.blockGroupCount * 13 == length)
		{
			for (var i = 0; i < level.map.blockGroupCount; i++)
			{
				var group = level.map.blockGroups[i];
				group.blockCount = psReadDword();
				group.blocksKnockedOut = psReadDword();
				group.pointsEarned = psReadDword();
				group.specialKnockedOut = psReadByte();
			}
		}
		else
		{
			ASSERT(0);
		}
		break;
	case ekBlocksTag:
		Blocks_Restore({},length);
		break;
	case ekPolyGroupTag:
		psParse({},ParsePolyGroup,length);
		break;
	case ekSpikeCountTag:
		level.map.spikeCount = psReadDword();
		level.map.spikeBalls = new Array(level.map.spikeCount);
		break;
	case ekStaticSpikeTag:
	case ekDeflectiveSpikeTag:
		var spike = level.map.spikeBalls[psReadDword()] = Spike_New();
		spike.type = psReadDword();
		spike.sphere.position = psReadFloatArray(3);
		spike.velocity = psReadFloatArray(3);
		spike.nextCollision = psReadFloatArray(3);
		spike.prevCollision = psReadFloatArray(3);
		spike.collisionPlane = {};
		spike.collisionPlane.normal = psReadFloatArray(3);
		spike.collisionPlane.k = psReadFloat();
		spike.prevPlane = {};
		spike.prevPlane.normal = psReadFloatArray(3);
		spike.prevPlane.k = psReadFloat();
		spike.iCollisionGroup = psReadDword();
		spike.iPrevCollision = psReadDword();
		spike.color = psReadFloatArray(3);
		spike.sphere.primitive.pTexture = ball.sphere.primitive.pTexture;
		break;
	case ekCheckpointTag:
		if (44 == length)
		{
			checkpoint.pos = psReadFloatArray(3);
			checkpoint.yaw = psReadFloat();
			checkpoint.pitch = psReadFloat();
		   	checkpoint.ballColor = psReadFloatArray(3);
		   	checkpoint.nextBreakPoints = psReadDword();
		   	checkpoint.missCount = psReadDword();
		   	checkpoint.collisionCount = psReadDword();
		}
		else
		{
			ASSERT(0);
		}
		break;
	case ekTimerTag:
		level.seconds = psReadFloat();
		break;
	case ekScoreTag:
		level.score = psReadDword();
		level.nextBreakPoints = psReadDword();
		level.missCount = psReadDword();	 
		level.collisionCount = psReadDword();
		break;
	case ekLevelListenerTag:
		i = psReadDword();
		ASSERT(i < level.listenerCount);
		level.listeners[i].Recover(level.listeners[i], length - 4);
		break;
	}
}

function Level_Restore(length)
{
	level.map.spikeCount = 0;
	psParse({},ParseLevel,length);
}

///////////////////////////////////////////////////////////////////////////////
// Singleton level class functions
function Level_GetLevel()
{
	return level;
}

function Level_GetBall()
{
	return ball;
}

function Level_GetCamera()
{
	return camera;
}

function Level_StarBlockCount()
{
var i, count = 0;

	for (i = 0; i < level.starCount; i++)  
	{
		if (!Star_IsShattered(level.stars[i]))
			count++;
	}

	return count;
}

function Level_LightColor(dest,src,n)
{
	var i;
	for (i = 0; i < 3; i++)
	{
		dest[i] = ((level.map.ambientLight[i] + 
					  level.map.lightColor[i] * fabs(Vector_Dot(n, level.map.lightDir))) * src[i] * src[3] * src[3]) +
					  (src[i] * (1 - src[3] * src[3]));
	}
	dest[3] = src[3];
}

function Level_ViewportChanged()
{
	var s = Nova_GetScreenMapSize();
	camera.screenWidth = s[0];
	camera.screenHeight = s[1];	
}

function Level_SetLevel(levelFile,atlasFile,setProgress,state,continuation)
{
var i,j;
	
	Atlas_Load(atlasFile);
	
	for (i = 0; i < level.listenerCount; i++)
		level.listeners[i].Free(level.listeners[i]);
	level.listenerCount = 0;
	level.starCount = 0;	
	
	// Must do this before erasing the level - these could be referencing thigs in the level
	while (Decorators)
		Decorators.Free(Decorators);

	Nova_ClearAll();
	Blocks_ClearAll();
	
	if (!ball.texture)
	{
		ball.texture = loadTexture(document.getElementById('ball-texture'), false);
		ball.sphere.primitive.pTexture = ball.texture;
	}
	
	loadLevel(levelFile, setProgress, state, function(map) {
		level.map = map;
		level.score = 0;
		level.seconds = 0;
		level.nextBreakPoints = blockBreakPoints;
		level.missCount = 0;
		level.frameCount = 0;
		level.collisionCount = 0;
		
		Nova_SetPanorama(1,1,1,level.map.theme.panorama);
		
		//Models.light(level.map.lightDir,level.map.ambientLight,level.map.lightColor);
		lMax = 0;
		for (i = 0; i < 3; i++)
		{
			if (level.map.ambientLight[i] + level.map.lightColor[i] > lMax)
				lMax = level.map.ambientLight[i] + level.map.lightColor[i];
		}
		for (i = 0; i < 3; i++)
		{
			level.map.ambientLight[i] /= lMax;
			level.map.lightColor[i] /= lMax;
		}
		Models.light(level.map.lightDir,level.map.ambientLight,level.map.lightColor);
	
		i = 0;
		{
			var group = level.map.polyGroups[i];
			for (j = 0; j < group.polyCount; j++)
				group.polys[j].pGLVerts = group.glverts;
		}
	
		for (i = 0; i < level.map.polyGroupCount; i++)  
		{
			if (i > 0)
			{
				var j;
				for (j = 0; j < level.map.polyGroups[i].polyCount; j++)
				{
					Level_LightColor(level.map.polyGroups[i].polys[j].primitive.color, 
										  level.map.polyGroups[i].polys[j].primitive.color,
										  level.map.polyGroups[i].polys[j].plane.normal);
				}
			}
	
			Nova_PreprocessPolygons(level.map.polyGroups[i].polys, level.map.polyGroups[i].polyCount);
		}
		
		level.min = arrdup(level.map.polyGroups[0].polys[0].vertex[0]);
		level.max = arrdup(level.map.polyGroups[0].polys[0].vertex[0]);
		for (j = 0; j < level.map.polyGroupCount; j++)
		{
			for (i = 1; i < level.map.polyGroups[j].polyCount; i++)
			{
				var poly = level.map.polyGroups[j].polys[i];
				for (var k = 0; k < poly.sides; k++)
				{
					for (var l = 0; l < 3; l++)
					{
						level.max[l] = max(level.max[l],poly.vertex[k][l]);
						level.min[l] = min(level.min[l],poly.vertex[k][l]);
					}
				}
			}
		}
		
		for (i = 0; i < level.map.spikeCount; i++)
		{
			level.map.spikeBalls[i].sphere.position = Vector_Scale(
				Vector_Add(level.map.spikeBalls[i].prevCollision, level.map.spikeBalls[i].nextCollision), 0.5);
			Spike_FindCollisions(level.map.spikeBalls[i]);
		}
		
		Ball_SetPosition(level.map.startPos);
		ball.prevCollision = arrdup(level.map.startPos);
		ball.sphere.radius = 0.03;
		ball.sphere.primitive.color = [1,1,1,1];
	
		ball.targetRelativeVelocity = [0,0,1];
		ball.lockCount = 0;
	
		var s = Nova_GetScreenMapSize();
		camera.screenWidth = s[0];
		camera.screenHeight = s[1];
		camera.zMaxDistanceFromBall = 1;
		camera.xyDistanceFromBall = xyMaxDistanceFromBall();	
		camera.bEnableAutoLook = TRUE;
		camera.seenShadowAbove = FALSE;
		camera.seenShadowBelow = FALSE;
		camera.lookLockTime = 0;
		Camera_SetViewAngle(level.map.yawStart, level.map.pitchStart, 0);
		camera.xMouse = camera.yMouse = camera.turnMag = 0;
	
		ball.angularVelocity = [0,0,0];
		Ball_SetVelocity(Matrix_Mult(Matrix_Transpose(ball.controlAngle), ball.targetRelativeVelocity));
		ball.polyAbove = ball.polyBelow = NULL;
		Ball_FindShadowsInternal();
		ball.prevCollision = Nova_Vector3f(ball.shadowBelow[0], ball.shadowBelow[1], ball.shadowBelow[2] + ball.sphere.radius);
	
		Camera_SetPosition(Vector_Add(Matrix_Mult3f(Matrix_Transpose(ball.controlAngle), 0, -xyMaxDistanceFromBall(), 0), ball.sphere.position));
		Camera_SetPosition(Nova_Vector3f(camera.position[0], camera.position[1], (ball.prevCollision[2] + ball.nextCollision[2]) / 2));
		camera.lastCollideDetectPos = arrdup(camera.position);
		Camera_FindNextCollision();
		camera.xyDistanceFromBall = camera.xyTargetDistanceFromBall;
		Level_SetCheckpoint(level.map.startPos, level.map.yawStart, level.map.pitchStart);
		
		// STARS
		for (i = 0; i < level.map.polyGroupCount; i++)  
		{
			if (level.map.polyGroups[i].type == ekStar)
			{
				level.stars[level.starCount++] = level.map.polyGroups[i];
			}
		}
		for (i = 0; i < 3; i++)
		{
			var changed;
			do
			{
				changed = FALSE;
				for (j = 0; j < level.starCount - 1; j++)
				{
					if (level.stars[j].color[i] < level.stars[j + 1].color[i])
					{
						var tmp = level.stars[j];
						level.stars[j] = level.stars[j + 1];
						level.stars[j + 1] = tmp;
						changed = TRUE;
					}
				}
			} while (changed);
		}
		
		i = 0;
		{
			var group = level.map.polyGroups[i];
			group.vbos = Nova_CreateVbos(group.glverts, group.glvertCount, gl.STATIC_DRAW);
			for (j = 0; j < group.polyCount; j++)
				group.polys[j].vbos = group.vbos;
		}
	
		Map_BuildBspTree(level.map);
	
		Level_InitDecorators();
		
		for (i = 0; i < level.map.polyGroupCount; i++)  
			level.map.polyGroups[i].LevelFinishedLoading(level.map.polyGroups[i]);
		for (i = 0; i < level.listenerCount; i++)  
			level.listeners[i].FinishedLoading(level.listeners[i]);
		Blocks_LevelFinishedLoading();
		Spikes_LevelFinishedLoading();
		BlockModel.levelFinishedLoading();
	
		game_listener.finishedLoading();
		
		continuation();
	});
}

function Level_InitDecorators()
{
var d;
	
	while (Decorators)
		Decorators.Free(Decorators);
	
	d = Decorator_New();
	d.Render = LevelDecorator_Render;
	d.RenderTransparent = LevelDecorator_RenderTransparent;
	d.Draw = LevelDecorator_Draw;
	Level_AddDecorator(d);
	
	if (level.map.spikeCount > 0)
	{
		d = Decorator_New();
		d.Draw = SpikeBalls_Draw;
		d.NextFrame = SpikeBalls_NextFrame;
		Level_AddDecorator(d);
	}	
	
	d = Decorator_New();
	d.MouseMove = Camera_MouseMove;
	d.Turn = Camera_Turn;
	//d.MoveForward = Camera_MoveForwardOrSide;
	//d.MoveSide = Camera_MoveForwardOrSide;
	d.NextFrame = Camera_NextFrame;
	Level_AddDecorator(d);
	
	d = Decorator_New();
	d.MoveForward = Ball_MoveForward;
	d.MoveSide = Ball_MoveSide;
	d.Draw = Ball_Draw;
	d.NextFrame = Ball_NextFrame;
	Level_AddDecorator(d);
}

function Level_SetCheckpoint(pos,yaw,pitch)
{
var i;

	checkpoint.pos = arrdup(pos);
	checkpoint.yaw = yaw;
	checkpoint.pitch = pitch;
//	checkpoint.score = level.score;
	checkpoint.nextBreakPoints = level.nextBreakPoints;
	checkpoint.missCount = level.missCount;
	checkpoint.collisionCount = level.collisionCount;
	checkpoint.ballColor = new Array(3);
	arrcpy(checkpoint.ballColor, ball.sphere.primitive.color, 3);
	for (i = 0; i < level.map.polyGroupCount; i++)
		level.map.polyGroups[i].SetCheckpoint(level.map.polyGroups[i]);
}

function Level_MouseMove(x,y)
{
	if (Decorators)	
		Decorators.MouseMove(Decorators, x, y);
}

function Level_MoveForward(magnitude)
{
	if (Decorators)	
		Decorators.MoveForward(Decorators, magnitude);
}

function Level_MoveSide(magnitude)
{
	if (Decorators)	
		Decorators.MoveSide(Decorators, magnitude);
}

function Level_FlipZ()
{
	ball.targetRelativeVelocity[2] = /*ball.lockNextZ = */-ball.targetRelativeVelocity[2];
	Level_Collided(ekEnvironment);
}

function Level_Turn(magnitude)
{
	if (Decorators)
		Decorators.Turn(Decorators, magnitude);
}

function Level_NextFrame(spf,step)
{
	ball.bVisible = ball.bMoving = ball.bShadowsVisible = TRUE;
	level.spikesMoving = TRUE;
	level.spikeHiding = -1;
	ball.bInvincible = FALSE;
	ball.speed = 1;
	
	Decorators.NextFrame(Decorators, spf, step);

	// These shouldn't be here...
	if (ball.shouldFindNextCollision)
	{
		Ball_FindNextCollision();
		ball.shouldFindNextCollision = FALSE;
	}
	Stars_Glitter(spf);
	
	level.seconds += spf;
	level.frameCount++;

	Level_CheckIfFinished();
}

function Level_Die()
{
	bDead = TRUE ;
}

function Level_Explode()
{
	Level_AddDecorator(DieDecorator_New(1, 1, 1, 1.5, 0, 3, FALSE));
	Sound_Play(ekBombSound);
}

function Level_ExplodeWithHook(Finished)
{
	Level_AddDecorator(DieDecorator_NewWithHook(1, 1, 1, 1.5, 0, 3, FALSE, Finished));
	Sound_Play(ekBombSound);
}

function Level_Cleared()
{
	bCleared = TRUE;
}

function Level_CheckIfFinished()
{
	if (bDead)
	{
		if (game_listener.died())
		{
			var v = [0,0,1];
			var i,j;
			
			Level_InitDecorators(); // Must be first - this might change the level...
			for (i = 0; i < level.map.polyGroupCount; i++)
			{
				if (level.map.polyGroups[i].bVisible == FALSE)
				{
					if (level.map.polyGroups[i].type == ekBlock || level.map.polyGroups[i].type == ekInvincible)
					{
						var pBlock = level.map.polyGroups[i];
						var pBlockGroup = level.map.blockGroups[pBlock.iBlockGroup];
						if (pBlockGroup.blocksKnockedOut < pBlockGroup.blockCount && !pBlockGroup.specialKnockedOut)
						{
							pBlockGroup.blocksKnockedOut = 0;
							level.score -= pBlockGroup.pointsEarned;
							pBlockGroup.pointsEarned = 0;
							level.map.polyGroups[i].bVisible = TRUE;  
						}
					}
					else
					{
					  // ASSERT(level.map.polyGroups[i].type == ekCheckpoint || level.map.polyGroups[i].type == ekKiller || level.map.polyGroups[i].type == ekCoaster);
					}
				}
				
				level.map.polyGroups[i].GotoCheckpoint(level.map.polyGroups[i]);
			}
			
			Ball_SetPosition(checkpoint.pos);
			ball.prevCollision = arrdup(checkpoint.pos);
			ball.targetRelativeVelocity = v;
			ball.lockStart += ball.lockCount;
			ball.lockCount = 0;
			ball.angularVelocity = [0,0,0];
			Ball_SetVelocity(v);
			Ball_FindShadowsInternal();
			Camera_SetViewAngle(checkpoint.yaw, checkpoint.pitch, 0);
			Camera_SetPosition(Vector_Add(Matrix_Mult3f(Matrix_Transpose(ball.controlAngle), 0, -xyMaxDistanceFromBall(), 0), ball.sphere.position));
			arrcpy(ball.sphere.primitive.color, checkpoint.ballColor, 3);
			
			Camera_FindNextCollision();
			camera.xyDistanceFromBall = camera.xyTargetDistanceFromBall;
			camera.xyPrevTargetDistanceFromBall = camera.xyTargetDistanceFromBall;
			camera.xyLockDistanceFromBall = 0;
			camera.position[2] = camera.zTarget;
			camera.hasNextCollision = FALSE;
			
			
//			level.score = checkpoint.score;
			level.nextBreakPoints = checkpoint.nextBreakPoints;
			level.missCount = checkpoint.missCount;
			level.collisionCount = checkpoint.collisionCount;
			
			for (i = 0; i < level.map.spikeCount; i++)
			{
				if (level.map.spikeBalls[i].type == ekDeflective)
				{
					level.map.spikeCount--;
					for (j = i; j < level.map.spikeCount; j++)
					{
						level.map.spikeBalls[i] = level.map.spikeBalls[i + 1];
					}
					i--;
				}
				else
				{
					Spike_FindCollisions(level.map.spikeBalls[i]);
				}
			}

			for (i = 0; i < level.listenerCount; i++)
				level.listeners[i].Died(level.listeners[i]);
		}
		bDead = FALSE;
	}
	else if (bCleared)
	{
		game_listener.cleared();
		bCleared = FALSE;
	}
}

var g_bBlockBroken = FALSE;
function Level_BlockBroken(iGroup)
{
var block = level.map.polyGroups[iGroup];
var points;

	game_listener.blockBroken(block.group.type);
	
	SpikeBalls_CollisionGroupChanged(iGroup);
	
	Ball_FindShadows();

	switch (block.group.type)
	{
	case ekStar:
		points = Math.floor(level.nextBreakPoints/blockBreakPoints) * blockBreakPoints * 3;
		break;
	case ekExtraGuy:
		points = Math.floor(level.nextBreakPoints/blockBreakPoints) * blockBreakPoints * 5;
		break;
	case ekKiller:
	case ekSpikeBall:
		points = 10 * blockBreakPoints;
		break;
	default:
		points = Math.floor(level.nextBreakPoints/blockBreakPoints) * blockBreakPoints;
		break;
	}
	
	level.score += points;
	level.map.blockGroups[block.iBlockGroup].pointsEarned += points;
	level.nextBreakPoints += blockBreakPoints;
	if (level.nextBreakPoints > maxBreakPoints)
		level.nextBreakPoints = maxBreakPoints;
	level.missCount = 0;
	level.map.blockGroups[block.iBlockGroup].blocksKnockedOut++;
	if (block.group.type == ekExtraGuy || block.group.type == ekCheckpoint || block.group.type == ekStar)
	{
		level.map.blockGroups[block.iBlockGroup].specialKnockedOut = TRUE;
	}

	if (block.group.type != ekSpikeBall)
	{
		g_bBlockBroken = TRUE;
	}
}

function Level_BlockBounced(type)
{
	game_listener.bounced(type);
}

function Level_Collided(type)
{
	if (!g_bBlockBroken)
	{
		if (type != ekEnvironment)
		{
			Level_BlockBounced(type);
		}
		
		if (type != ekChanger && type != ekHider && !ball.bInvincible)
		{
			if (level.missCount < 3)
				level.nextBreakPoints -= Math.floor((level.nextBreakPoints - blockBreakPoints) / (3 - level.missCount));
			else
				level.nextBreakPoints = blockBreakPoints;
			
			level.missCount++;
			
			if (type == ekKiller)
				Ball_FindShadows();
		}

		if (ball.targetRelativeVelocity[0] == 0 && ball.targetRelativeVelocity[1] == 0)
		{
			if (ball.velocity[2] > 0)
				camera.seenShadowAbove = TRUE;
			else
				camera.seenShadowBelow = TRUE;
		}
	}

	level.collisionCount++;
	g_bBlockBroken = FALSE;
}

function Level_PuzzleSolved()
{
	Sound_Play(ekSecretSound);
	level.score += 250;
}

function Level_WillTerminate()
{
	willTerminate = TRUE;
	
	if (Decorators)
		Decorators.WillTerminate(Decorators);
	Level_CheckIfFinished();
	
	willTerminate = FALSE;	
}

var g_rotateDisplayDecorator = NULL;
function RotateDisplayDecorator_HandleRotate(rotate)
{
	Nova_RotateDisplay(rotate);
	camera.viewAngle = Nova_GetViewAngle();
	var s = Nova_GetScreenMapSize();
	camera.screenWidth = s[0];
	camera.screenHeight = s[1];
}

function RotateDisplayDecorator_Free(d)
{
	ASSERT(d == g_rotateDisplayDecorator.d);
	
	if (!g_rotateDisplayDecorator.rotated)
	{
		RotateDisplayDecorator_HandleRotate(g_rotateDisplayDecorator.rotate);
		g_rotateDisplayDecorator.rotated = TRUE;
	}
	
	g_rotateDisplayDecorator = NULL;	
	Decorator_Free(d);
	
	Camera_SetViewAngle(camera.yaw, camera.pitch, 0);
}

function RotateDisplayDecorator_WillTerminate(d)
{
	BaseDecorator_WillTerminate(d);
	d.Free(d);
}

function RotateDisplayDecorator_NextFrame(d,spf,step)
{
var rdd = d;	
	
	if (!rdd.rotated)
	{
		RotateDisplayDecorator_HandleRotate(g_rotateDisplayDecorator.rotate);
		g_rotateDisplayDecorator.rotated = TRUE;
	}
	
	BaseDecorator_NextFrame(d, spf, step);
	
	if (rdd.roll != 0)
	{
		if (rdd.roll > 180 || (rdd.roll == 180  && (rand() & 1)))
		{
			rdd.roll += 270 * spf;
			if (rdd.roll >= 360)
				rdd.roll = 0;
		}
		else
		{
			rdd.roll -= 270 * spf;
			if (rdd.roll < 0)
				rdd.roll = 0;
		}
		
		Camera_SetViewAngle(camera.yaw, camera.pitch, rdd.roll);
	}
	else
	{
		d.Free(d);
	}
}

function Level_RotateDisplay(rotate,animate)
{
var yaw,pitch,roll;
	
	if (rotate == Nova_GetRotation())
		return;
	
	ASSERT(rotate >= 0 && rotate < 4);
	ASSERT(Nova_GetRotation() >= 0 && Nova_GetRotation() < 4);	

	if (!animate)
	{
		if (g_rotateDisplayDecorator != NULL)
			g_rotateDisplayDecorator.d.Free(g_rotateDisplayDecorator.d);
		
		RotateDisplayDecorator_HandleRotate(rotate);
	}
	else
	{
		var rdd = {};
		
		if (g_rotateDisplayDecorator != NULL)
		{
			rdd.roll = g_rotateDisplayDecorator.roll;
			g_rotateDisplayDecorator.d.Free(g_rotateDisplayDecorator.d);
		}
		else
		{
			rdd.roll = 0;
		}
		
		g_rotateDisplayDecorator = rdd;
			
		Decorator_Init(rdd.d);
		
		var a = Camera_GetViewAngle();
		yaw = a[0];
		pitch = a[1];
		roll = a[2];
		roll = rdd.roll > 360 ? 360 : rdd.roll;
		roll = rdd.roll < 0 ? 0 : rdd.roll;	
		rdd.roll += roll;
		rdd.roll += 90 * (rotate - Nova_GetRotation());
		while (rdd.roll > 360)
			rdd.roll -= 360;
		while (rdd.roll < 0)
			rdd.roll += 360;
		
		rdd.rotated = FALSE;
		rdd.rotate = rotate;
		
		rdd.d.NextFrame = RotateDisplayDecorator_NextFrame;	
		rdd.d.Free = RotateDisplayDecorator_Free;
		
		Level_AddDecorator(rdd.d);
	}
}

function Level_IsRotatingDisplay()
{
	return g_rotateDisplayDecorator != null;
}

function Level_SetTimeout(time,TimeUp,param)
{
	Level_AddDecorator(TimerDecorator_New(time, TimeUp, param));
}

function Level_Render()
{
var mask = Level_GetVisiblesMask(camera.position);
	
	Nova_Begin();

	Decorators.Render(Decorators, mask);

	if (mask)		
	{			
		Nova_End_PanMask(// -1 |			  
			(mask[level.map.polyGroups[0].polyCount >> 5] >> (level.map.polyGroups[0].polyCount & 0x1f)) |				
			(mask[(level.map.polyGroups[0].polyCount >> 5) + 1] << (32 - (level.map.polyGroups[0].polyCount & 0x1f))));		
	}
	else
	{
		Nova_End();
	}
}

function LevelDecorator_Render(d,mask)
{
var i;
	
	for (i = 0; i < level.map.polyGroupCount; i++)
	{
		if (!level.map.polyGroups[i].bVisible)
		{
			continue;
		}
		
		if (i == 0)
		{
			Nova_RenderPolygons(level.map.polyGroups[i].polys, level.map.polyGroups[i].polyCount, mask);
		}
		else
		{  
			var index = level.map.polyGroups[0].polyCount + 6 + level.map.polyGroups[i].index - 1;
			if ((mask[index >> 5] & (1 << (index & 0x1f))) && !level.map.polyGroups[i].transparent && !level.map.polyGroups[i].is_model)
				Nova_RenderPolygons(level.map.polyGroups[i].polys, level.map.polyGroups[i].polyCount, NULL);			  
		}
	}
	
	BaseDecorator_Render(d, mask);
}

function LevelDecorator_RenderTransparent(d,mask)
{
	Bsp_Render(level.map, level.map.bspTree, Nova_GetPosition(), mask);
	
	if (ball.bShadowsVisible)
		Ball_RenderShadows();

	BaseDecorator_RenderTransparent(d, mask);
}

function Level_Draw()
{  
var mask = Level_GetVisiblesMask(camera.position);
var i;

	Decorators.Draw(Decorators, mask);
	
	Nova_Begin();
	// This shouldn't just be here.....
	for (i = 0; i < level.starCount; i++)
	{
		var index = level.map.polyGroups[0].polyCount + 6 + level.stars[i].group.index - 1;
		if (level.stars[i].group.bVisible && (!mask || (mask[index >> 5] & (1 << (index & 0x1f)))))
			Star_DrawBorder(level.stars[i]);
	}
	Nova_DrawGL(true);

	Nova_Begin();
	Decorators.RenderTransparent(Decorators, mask);
	
	gl.depthMask(gl.FALSE);
	gl.enable(gl.BLEND);
	Nova_DrawGL();
	Nova_Color(1, 1, 1, 1);
	gl.disable(gl.BLEND);
	gl.depthMask(gl.TRUE);
}

function Level_DrawOverlay()
{
	Decorators.DrawOverlay(Decorators);
	Stars_DrawHolders(level.stars, level.starCount);	
}

function LevelDecorator_Draw(d,mask)
{
	var i;
	
/*	if (tesselate)
		Nova_DrawGL(Tesselator);
	else*/
		Nova_DrawGL();

	Balls_Begin();
	for (i = 0; i < level.map.polyGroupCount; i++)
	{
		var group = level.map.polyGroups[i]; 
		if (group.bVisible)
		{
			var index = level.map.polyGroups[0].polyCount + 6 + group.index - 1;
			if (i == 0) {
                for (var j = 0; j < group.sphereCount; j++)
    				Balls_Draw(group.spheres[j]);
			} else if ((mask[index >> 5] & (1 << (index & 0x1f)))) {
                for (var j = 0; j < group.sphereCount; j++)
				    Balls_Draw(group.spheres[j]);
            }
		}
	}
	Balls_End();
	
	Models.begin();
	for (i = 1; i < level.map.polyGroupCount; i++)
	{
		var group = level.map.polyGroups[i]; 
		if (group.bVisible && group.is_model)
		{
			var index = level.map.polyGroups[0].polyCount + 6 + group.index - 1;
			if ((mask[index >> 5] & (1 << (index & 0x1f))))
				Models.draw(group);
		}
	}
	Models.end();
		
	BaseDecorator_Draw(d, mask);
}

function Level_AddDecorator(d)
{
	Decorators = Decorator_Add(d, Decorators);
	if (willTerminate)
		d.WillTerminate(d);
}

function Level_RemoveDecorator(d)
{
	Decorators = Decorator_Remove(d, Decorators);
}

function Level_GetVisiblesMask(pos)
{
	var node = level.map.pvsTree;
	if (!node)
		return NULL;
	
	while (node.bVisibles == NULL)
	{
		if (node.divide.k - Vector_Dot(pos, node.divide.normal) < 0)
			node = node.left;
		else
			node = node.right;
	}
	
	return node.bVisibles;
}

function Level_FindNextCollision(pos,radius,velocity,bGhostBlocks)
{
var minDistance = 1e31;
var mask = Level_GetVisiblesMask(pos);

	var coll = {pos:[0,0,0],
	            poly:null,
	            group:-1};
	
	foreach_poly_in(level.map, mask, function(poly,group,iGroup) {
		var rad, distance;
		var point;
		var zDistance;
		var distanceFromPlane = poly.plane.k - Vector_Dot(pos, poly.plane.normal);
		var vn;
		
		if (distanceFromPlane > 0.01)
		{
			if (poly.primitive.flags & Nova_fCullBack && (iGroup == 0 || bGhostBlocks))
				return;
		}
		else if (distanceFromPlane < 0.01)
		{
			if (poly.primitive.flags & Nova_fCullFront && (iGroup == 0 || bGhostBlocks))
				return;
		}
		else
		{
			return;
		}
		if (group.moving)
		{
			return;
		}
		
		vn = Vector_Dot(velocity, poly.plane.normal);
		rad = (vn > 0 ? radius : -radius);
		distance = (distanceFromPlane - rad) / vn;				
		point = Vector_AddScale(pos, velocity, distance);
		
		zDistance = Vector_Dot(Vector_Subtract(point, pos), velocity);
		if (zDistance >=0 && zDistance < minDistance && 
			 Polygon_ContainsPoint(poly, point, radius))
		{
			minDistance = zDistance;
			coll.pos = point;
			coll.poly = poly;
			coll.group = iGroup;
		}
	});

	if (!coll.poly)
	{
		var distance = fabs((velocity[2] > 0.0 ? level.max[2] : level.min[2]) - pos[2]);
		coll.pos = Vector_AddScale(pos, velocity, distance);
	}

	// Give it a little play to not go through corners
	coll.pos = Vector_Subtract(coll.pos, Vector_Scale(velocity, 0.005));
	
	return coll;
}

var maxVerts = 32;
var maxInds = (3 + (maxVerts - 3) * 3);
var shadowTex = null;
var shadowPolys = [Polygon_New(),Polygon_New()];
var shadowVerts = new Array(2);
var shadowIndices = new Array(2);
function Level_RenderShadow(mid,poly,idx)
{
	var zAxis = [0, 0, 1];
	var sides = 0;
	
	if (shadowTex == null)
		shadowTex = loadTexture(document.getElementById('shadow-texture'));
	
	if (mid[2] < level.max[2] && mid[2] > level.min[2])
	{
		var i;
		var color = [255, 255, 255, 110];
		var shad = [[-1, -1, 0, color[0], color[1], color[2], color[3], 0, 0],
		       	    [+1, -1, 0, color[0], color[1], color[2], color[3], textureScale, 0],
		       	    [+1, +1, 0, color[0], color[1], color[2], color[3], textureScale, textureScale],
		       	    [-1, +1, 0, color[0], color[1], color[2], color[3], 0, textureScale]];
		var ind = [1,0,2,0,2,3];
		var sAxis = [1, 0, 0];
		var tAxis = [0, 1, 0];
		for (i = 0; i < 4; i++)
		{
			var p = Vector_Add(Vector_Add(Vector_Scale(sAxis, shad[i][0] * .04), Vector_Scale(tAxis, shad[i][1] * .04)), mid);
			if (fabs(poly.plane.normal[2]) < 0.99 && fabs(poly.plane.normal[2]) > 0.5)
			{
				var ptRef = arrdup(ball.sphere.position);
				var d;
				
//				if (fabs(p[2] - ball.sphere.position[2]) < 0.05)
					ptRef[2] = p[2] + (p[2] > ball.sphere.position[2] ? -0.5 : 0.5);
				
				d = (poly.plane.k - Vector_Dot(ptRef, poly.plane.normal)) / Vector_Dot(Vector_Subtract(p, ptRef), poly.plane.normal);
				p = Vector_Add(ptRef, Vector_Scale(Vector_Subtract(p, ptRef), d));
			}
			shad[i][0] = p[0];
			shad[i][1] = p[1];
			shad[i][2] = p[2] + (camera.position[2] > p[2] ? 0.0025 : -0.0025);
		}
		sides = 4;
		
		shadowVerts[idx] = arrdup(shad);
		shadowIndices[idx] = new Uint16Array(ind);
		shadowPolys[idx].pGLVerts = shadowVerts[idx];
		shadowPolys[idx].pTriIndices = shadowIndices[idx];
		shadowPolys[idx].indices = 6;
		shadowPolys[idx].plane.normal = zAxis;	
		shadowPolys[idx].plane.k = shad[0][2];
		shadowPolys[idx].primitive.pTexture = shadowTex;
		if (shadowPolys[idx].vbos)
			Nova_UpdateVerts(shadowPolys[idx].vbos,shadowVerts[idx],0,sides);
		else
			shadowPolys[idx].vbos = Nova_CreateVbos(shadowVerts[idx],sides,gl.DYNAMIC_DRAW);

		Nova_RenderPolygon(shadowPolys[idx], 1, NULL);
	}
}

///////////////////////////////////////////////////////////////////////////////
// Singleton ball functions
function Ball_MoveForward(d,magnitude)
{
	ball.targetRelativeVelocity[1] = magnitude;
	BaseDecorator_MoveForward(d, magnitude);
}

function Ball_MoveSide(d,magnitude)
{
	ball.targetRelativeVelocity[0] = magnitude;
	BaseDecorator_MoveSide(d, magnitude);
}

function Ball_Draw(d,mask)
{
	if (ball.bVisible)
	{
		Balls_Begin();
		Balls_Draw(ball.sphere);
		Balls_End();
	}

	BaseDecorator_Draw(d, mask);
}

function Ball_SetPosition(v)
{
	if (camera.xyTargetDistanceFromBall < xyMaxDistanceFromBall() - 0.015) // We know there's an obstacle there so we can plan for it
	{
		camera.xyTargetDistanceFromBall += Vector_Dot(ball.forward, Vector_Subtract(v, ball.sphere.position));
		if (camera.xyTargetDistanceFromBall < ball.sphere.radius)
			camera.xyTargetDistanceFromBall = ball.sphere.radius;
	}
	
	ball.sphere.position = v;
}

function rotationMatrix(v,angle)
{
	var trans = [];
	var l = Vector_Length(v);
	trans[2] = Vector_Scale(v, 1/l);
	trans[1] = Vector_Normalize(Vector_Cross(v,fabs(v[0]) > fabs(v[1]) ? [0,1,0] : [1,0,0]));
	trans[0] = Vector_Cross(trans[1],trans[2]);
	
	var cos_a = cos(angle*l), sin_a = sin(angle*l);
	var r = [[cos_a,sin_a,0],
	         [-sin_a,cos_a,0],
	         [0,0,1]];

	return mat3.mul(Matrix_Transpose(trans), mat3.mul(r,trans));
}

function Ball_RunNextFrame(d,spf,step,recurseDepth)
{
var newPos;
var targetVelocity = Matrix_Mult(Matrix_Transpose(ball.controlAngle), ball.targetRelativeVelocity);

	if (ball.bMoving && spf > 0)
	{
		if (ball.lockCount > 0)
		{
			var last = (ball.lockStart + ball.lockCount - 1) & (ballLockTableSize - 1);
			var i;

			//if (!Vector_VeryClose(ball.prevCollision, ball.nextCollision, spf))
			{
				ball.locks[last].seconds -= spf;

				for (i = 0; i < ball.lockCount; i++)
				{
					var idx = (ball.lockStart + i) & (ballLockTableSize - 1);
					var v = Vector_Subtract(targetVelocity, Vector_Scale(Vector_Normalize(ball.locks[idx].velocity), 
						Vector_Dot(targetVelocity, Vector_Normalize(ball.locks[idx].velocity))));
					targetVelocity = Vector_Add(ball.locks[idx].velocity, v);
					//ball.locks[idx].seconds -= spf;
					if (ball.locks[last].seconds <= 0)
					{
						ball.targetRelativeVelocity[2] = ball.locks[idx].nextZ;
						ball.lockStart++;
						ball.lockCount--;
					}
				}
			}

			if (!Vector_Equals(targetVelocity, ball.velocity))
				Ball_SetVelocity(targetVelocity);
		}	 
		else if (!Vector_Equals(ball.velocity, targetVelocity))
		{
			Ball_SetVelocity(targetVelocity);
		}
		
		newPos = Vector_AddScale(ball.sphere.position, ball.velocity, step * spf * ball.speed);
		if (Vector_Dot(Vector_Subtract(ball.nextCollision, newPos), ball.velocity) <= 0)
		{
			var ratio = Vector_Dot(Vector_Subtract(ball.nextCollision, ball.sphere.position), ball.velocity) / 
							  Vector_Dot(Vector_Subtract(newPos, ball.sphere.position), ball.velocity);
			
			newPos = arrdup(ball.nextCollision);
			ball.prevCollision = arrdup(ball.nextCollision);
			camera.xyPrevTargetDistanceFromBall = camera.xyTargetDistanceFromBall;
			camera.hasNextCollision = FALSE;
			if (ball.pCollisionPoly)
			{
				var normal = arrdup(ball.pCollisionPoly.plane.normal);
				var idx = (ball.lockStart + ball.lockCount++) & (ballLockTableSize - 1);
				if (ball.lockCount > ballLockTableSize)
				{
					ball.targetRelativeVelocity[2] = ball.locks[ball.lockStart & (ballLockTableSize - 1)].nextZ;
					ball.lockStart++;
					ball.lockCount--;
					ASSERT(!(ball.lockCount > ballLockTableSize));
				}
				
				if (level.map.polyGroups[ball.iCollisionGroup])
				{
					// SMASH!!!
					var type = level.map.polyGroups[ball.iCollisionGroup].type; // Must be 1st; could change on collide...
					level.map.polyGroups[ball.iCollisionGroup].
						Collide(level.map.polyGroups[ball.iCollisionGroup], ball.pCollisionPoly.primitive);
					
					Level_Collided(type);
				}
				
				if (ball.velocity[2] - normal[2] * (Vector_Dot(ball.velocity, normal) * 2) < 0)
					ball.locks[idx].nextZ = -1;
				else
					ball.locks[idx].nextZ = 1;

				var v = Vector_Scale(Vector_Negate(normal), Vector_Dot(normal, ball.velocity));
				ball.angularVelocity = Vector_Cross(v,ball.velocity);
				ball.angularVelocity = Vector_Add(ball.angularVelocity, Vector_Scale(Vector_Cross(v,randVec()), 0.5));
				Ball_SetVelocity(v);
				ball.locks[idx].velocity = arrdup(ball.velocity);
				ball.locks[idx].seconds = 0.25;
			}
			else
			{
				if (cheat)
				{
					var v = [ball.velocity[0], ball.velocity[0], -ball.velocity[2]];
					Ball_SetVelocity(v);
					ball.targetRelativeVelocity[2] = ball.velocity[2];
					Sound_Play(ekClickSound);
				}
				else
				{
					Level_AddDecorator(DieDecorator_New(0, 0, 0, 0, 1, 3, TRUE));
					ball.nextCollision[2] = ball.velocity[2] > 0 ? 1000 : -1000;
				}
			}

			if (ratio > 0.01 && ratio < 0.99 && 
				 recurseDepth < 24) // This is just a final sanity check to make sure we don't overflow...
										  // In the event that we need to recurse a lot we should as much as we can;
										  // performance is second in that case because the ball might stop completely
			{
				Ball_SetPosition(newPos);
				Ball_RunNextFrame(d, spf * (1 - ratio), step, recurseDepth + 1);
				return;
			}
		}
		
		Ball_SetPosition(newPos);
		if (newPos[0] != ball.shadowAbove[0] || newPos[1] != ball.shadowAbove[1])
		{
			Ball_FindShadows();
		}
		
		if (Vector_Dot(ball.angularVelocity,ball.angularVelocity) > 0.001)
		{
			var rotMat = rotationMatrix(ball.angularVelocity, 10*step*spf*ball.speed);
			ball.sphere.T = mat3.mul(ball.sphere.T, rotMat);
		}
	}
}

function Ball_NextFrame(d,spf,step)
{
	Ball_RunNextFrame(d, spf, step, 0);
	BaseDecorator_NextFrame(d, spf, step);
}

function Ball_SetVelocity(v)
{	
	ball.velocity = v;
	Ball_FindNextCollision();
}

function Ball_FindNextCollision()
{
	var c = Level_FindNextCollision(ball.sphere.position, ball.sphere.radius, ball.velocity, TRUE);
	ball.nextCollision = c.pos;
	ball.pCollisionPoly = c.poly;
	ball.iCollisionGroup = c.group, 
	camera.bShouldFindNextCollision = TRUE;
}

function Ball_FindShadowsInternal()
{
var zAbove = level.max[2] + 1;
var zBelow = level.min[2] - 1;
var polyAbove = NULL;
var polyBelow = NULL;
var mask = Level_GetVisiblesMask(ball.sphere.position);
	
	foreach_poly_in(level.map, mask, function(poly,group,iGroup) {
		if (fabs(poly.plane.normal[2]) > 0.1)
		{
			var d = poly.plane.k - Vector_Dot(ball.sphere.position, poly.plane.normal);
			var pos = arrdup(ball.sphere.position);
			if (d > 0)
			{
				if (poly.primitive.flags & Nova_fCullBack)
					return;
			}
			else
			{
				if (poly.primitive.flags & Nova_fCullFront)
					return;
			}
			
			pos[2] = (poly.plane.k - (poly.plane.normal[0] * pos[0] + poly.plane.normal[1] * pos[1])) / poly.plane.normal[2];
			//ASSERT(fabs(poly.plane.k - Vector_Dot(poly.plane.normal, pos)) < 0.001);
			if (pos[2] > ball.sphere.position[2])
			{
				if (pos[2] < zAbove && Polygon_ContainsPoint(poly, pos, ball.sphere.radius))
				{
					zAbove = pos[2];
					polyAbove = poly;
				}
			}
			else
			{
				if (pos[2] > zBelow && Polygon_ContainsPoint(poly, pos, ball.sphere.radius))
				{
					zBelow = pos[2];
					polyBelow = poly;
				}
			}
		}
	});
	
	var sa = [ball.sphere.position[0], ball.sphere.position[1], zAbove];
	var sb = [ball.sphere.position[0], ball.sphere.position[1], zBelow];
	  
	if (!Vector_VeryClose(ball.shadowAbove, sa, 0.001) || ball.polyAbove != polyAbove)
	{
		 camera.seenShadowAbove = FALSE;
		 camera.xyMaxLockDistanceFromBall = xyMaxMaxDistanceFromBall;
		 camera.lookLockTime = 0;
	}
	if (!Vector_VeryClose(ball.shadowBelow, sb, 0.001) || ball.polyBelow != polyBelow)
	{
		 camera.seenShadowBelow = FALSE;
		 camera.xyMaxLockDistanceFromBall = xyMaxMaxDistanceFromBall;
		 camera.lookLockTime = 0;
	}
	  
	ball.shadowAbove = sa;
	ball.polyAbove = polyAbove;
	ball.shadowBelow = sb;
	ball.polyBelow = polyBelow;  
}

function Ball_FindShadows()
{
	ball.shouldFindShadows = TRUE;
}

function Ball_RenderShadows()
{
	if (ball.shouldFindShadows)
	{
		Ball_FindShadowsInternal();
		ball.shouldFindShadows = FALSE;
	}
	
	if (ball.polyAbove && ball.shadowAbove[2] > camera.position[2])
		Level_RenderShadow(ball.shadowAbove, ball.polyAbove, 0);
	if (ball.polyBelow && ball.shadowBelow[2] < camera.position[2])
		Level_RenderShadow(ball.shadowBelow, ball.polyBelow, 1);
}

///////////////////////////////////////////////////////////////////////////////
// Singleton camera functions
function Camera_EnableAutoLook(bEnable)
{
	camera.bEnableAutoLook = bEnable;
	if (!bEnable)
	{
		if (camera.pitch > 90)
			Camera_SetViewAngle(camera.yaw, 90, camera.roll);
		else if (camera.pitch < -90)
			Camera_SetViewAngle(camera.yaw, -90, camera.roll);
	}
}

function Camera_MouseMove(d,x,y)
{
	camera.xMouse += x;
	camera.yMouse += y;

	if ((x != 0 || y != 0) && camera.seenShadowAbove && camera.seenShadowBelow)
		camera.lookLockTime = 6;

	BaseDecorator_MouseMove(d, x, y);
}

function Camera_Turn(d,magnitude)
{
	camera.turnMag = magnitude;
	BaseDecorator_Turn(d, magnitude);
}

function Camera_PitchStep(pitchTarget,step,spf)
{
	if (camera.seenShadowAbove && camera.seenShadowBelow)
	{
		return max(0.0025, min(1, fabs(camera.pitch - pitchTarget) / 35)) * 50 * spf * step;
	}
	else
	{
		return 30 * spf * step / camera.xyDistanceFromBall;
	}
}

function Camera_Step(target,pos,step,spf)
{
	if (camera.seenShadowAbove && camera.seenShadowBelow && !Level_IsRotatingDisplay())
	{
		return max(0.0025, min(1, fabs(target - pos))) * spf * step;
	}
	else
	{
		return step * spf;
	}
}

function Camera_SetPosition(v)
{
	camera.position = v;
	Nova_SetPosition(v);
}

function Camera_SetViewAngle(yaw,pitch,roll)
{
var sin_ = sin(yaw * pi / 180);
var cos_ = cos(yaw * pi / 180);
var m = [[sin_,-cos_,0],
         [cos_,sin_,0],
         [0,0,1]];

	if (yaw > 360 * 5 || yaw < -360 * 6)
		yaw = 0;
	
	while (yaw > 360)
		yaw -= 360;
	while (yaw < 0)
		yaw += 360;

	if (pitch > 360 * 5 || pitch < -360 * 5)
		pitch = 0;
	
	while (pitch > 180)
		pitch -= 360;
	while (pitch < -180)
		pitch += 360;

	camera.yaw = yaw;
	camera.pitch = pitch;
	camera.roll = roll;

	ball.controlAngle = m;
	ball.forward = [cos(yaw * pi / 180), sin(yaw * pi / 180), 0];

	Nova_SetViewAngle3f(yaw, pitch, roll);
	camera.viewAngle = Nova_GetViewAngle();
	
	camera.bShouldFindNextCollision = TRUE;
}

function Camera_GetViewAngle()
{
	return [camera.yaw, camera.pitch, camera.roll];
}

function Camera_FindNextCollision()
{
var targetPos;
var mask = Level_GetVisiblesMask(ball.nextCollision);
var spotToSee;
	
	if (ball.velocity[2] > 0)
		spotToSee = Nova_Vector3f(ball.shadowAbove[0], ball.shadowAbove[1], ball.shadowAbove[2] - 4*ball.sphere.radius);
	else
		spotToSee = Nova_Vector3f(ball.shadowBelow[0], ball.shadowBelow[1], ball.shadowBelow[2] + 4*ball.sphere.radius);
	
	if (spotToSee[2] > ball.shadowAbove[2] - 2*ball.sphere.radius ||
		 spotToSee[2] < ball.shadowBelow[2] + 2*ball.sphere.radius)
	{
		spotToSee[2] = (ball.shadowAbove[2] + ball.shadowBelow[2])/2;
	}	
	
	// Get rid of occlusions
	camera.zTarget = (ball.prevCollision[2] + ball.nextCollision[2]) / 2;
	if (spotToSee[2] - camera.zTarget > camera.zMaxDistanceFromBall)
		camera.zTarget = spotToSee[2] - camera.zMaxDistanceFromBall;
	if (camera.zTarget - spotToSee[2] > camera.zMaxDistanceFromBall)
		camera.zTarget = spotToSee[2] + camera.zMaxDistanceFromBall;
	if (camera.zTarget > level.max[2] - .25)
		camera.zTarget = level.max[2] - .25;
	if (camera.zTarget < level.min[2] + .25)
		camera.zTarget = level.min[2] + .25;
	
	targetPos = [0, -(xyMaxDistanceFromBall() + 2*ball.sphere.radius), camera.zTarget - spotToSee[2]];
	targetPos = Vector_Add(Matrix_Mult(Matrix_Transpose(ball.controlAngle), targetPos), spotToSee);
	foreach_poly_in(level.map, mask, function(poly,group,iGroup) {
		var sn = Vector_Dot(spotToSee, poly.plane.normal);
		var tn = Vector_Dot(targetPos, poly.plane.normal);
		var k = poly.plane.k + (sn > poly.plane.k ? 0.029 : -0.029);
		var cameraDistance = k - tn;
		var ballDistance = k - sn;
		
		if ((fabs(tn - sn) > 0.001) && ((cameraDistance > 0) != (ballDistance > 0)))
		{
			var distance = ballDistance / (tn - sn);
			var intersection = Vector_AddScale(spotToSee, Vector_Subtract(targetPos, spotToSee), distance);
			if (Polygon_ContainsPoint(poly, intersection, 0))
			{
				var direction = Matrix_Mult(ball.controlAngle, poly.plane.normal);
				direction[0] = 0;
				direction = Matrix_Mult(Matrix_Transpose(ball.controlAngle), direction);
				direction = Vector_Normalize(direction);
				var distance = (k - Vector_Dot(targetPos, poly.plane.normal)) /
				Vector_Dot(direction, poly.plane.normal);
				targetPos = Vector_Add(targetPos, Vector_Scale(direction, distance + (Vector_Dot(targetPos, direction) < Vector_Dot(spotToSee, direction) ? 0.001 : -0.001)));
			}
		}
	});
			
	camera.xyTargetDistanceFromBall = Vector_Dot(Vector_Subtract(spotToSee, targetPos), ball.forward);
	camera.xyTargetDistanceFromBall -= 2*ball.sphere.radius; // Just so there's no interference with the "camera-crossing-polygon" algorithm
	if (camera.xyTargetDistanceFromBall < ball.sphere.radius)
		camera.xyTargetDistanceFromBall = ball.sphere.radius;
	camera.zTarget = targetPos[2];
	
	camera.bShouldFindNextCollision = FALSE;
	camera.hasNextCollision = TRUE;
}

function Camera_NextFrame(d,spf,step)
{
var yaw = camera.yaw;
var pitch = camera.pitch;
var roll = camera.roll;

var rollStep = 30 * spf;
var rollTarget = 0;

var newCameraPos = arrdup(camera.position);
var xyNewDistanceFromBall = camera.xyDistanceFromBall;
var i, j, bChanged;
	
var camMask = Level_GetVisiblesMask(camera.position);
var ballMask = Level_GetVisiblesMask(ball.sphere.position);
	
var tries = 0;
	
	if (!ball.bMoving)
	{
		BaseDecorator_NextFrame(d, spf, step);
		return;
	}

	if (camera.xMouse || (camera.turnMag != 0))
	{
		if (camera.xMouse)
		{
			yaw += -camera.xMouse / 4.0;
			rollTarget = -camera.xMouse / (spf * 60.0);
			camera.xMouse = 0;
		}
		else if (camera.turnMag != 0)
		{
			yaw += camera.turnMag * spf * 180;
			rollTarget = camera.turnMag * 6;
		}

		while (yaw > 360)
			yaw -= 360;
		while (yaw < 0)
			yaw += 360;
		
		Camera_SetViewAngle(yaw, pitch, roll);
		camera.xyLockDistanceFromBall = 0;
		camera.xyMaxLockDistanceFromBall = xyMaxMaxDistanceFromBall;
	}

	// Follow the ball
	if ((camera.xyDistanceFromBall - step * spf > 0.2) || (camera.xyTargetDistanceFromBall > camera.xyDistanceFromBall) ||
		 (ball.sphere.position[2] - ball.sphere.radius > camera.position[2] && ball.velocity[2] > 0) ||
		 (ball.sphere.position[2] + ball.sphere.radius < camera.position[2] && ball.velocity[2] < 0))
	{
		var target = camera.xyTargetDistanceFromBall;
		var xyStep = Camera_Step(target, camera.xyDistanceFromBall, step, spf);

		if (camera.seenShadowAbove && camera.seenShadowBelow && camera.bEnableAutoLook && !Level_IsRotatingDisplay())
		{
			if (camera.xyTargetDistanceFromBall > camera.xyLockDistanceFromBall && ball.velocity[0] == 0 && ball.velocity[1] == 0)
				camera.xyLockDistanceFromBall = camera.xyTargetDistanceFromBall;
			if (camera.xyLockDistanceFromBall > xyMaxDistanceFromBall())
				camera.xyLockDistanceFromBall = xyMaxDistanceFromBall();
			
			target = min(camera.xyLockDistanceFromBall, camera.xyMaxLockDistanceFromBall);
		}
		
		if (fabs(target - xyNewDistanceFromBall) < xyStep)
			xyNewDistanceFromBall = target;
		else
			xyNewDistanceFromBall = xyNewDistanceFromBall + (xyNewDistanceFromBall > target ? -xyStep : xyStep);
	}

	//xyNewDistanceFromBall = camera.xyTargetDistanceFromBall;

	newCameraPos[0] = 0;
	newCameraPos[1] = -xyNewDistanceFromBall;
	newCameraPos[2] = newCameraPos[2] - ball.sphere.position[2];
	newCameraPos = Vector_Add(Matrix_Mult(Matrix_Transpose(ball.controlAngle), newCameraPos), ball.sphere.position);

	var atZTarget = false;
	if (((ball.sphere.position[2] > camera.position[2]) == (ball.velocity[2] > 0)) ||
		((camera.zTarget > camera.position[2]) != (ball.velocity[2] > 0)) ||
		(camera.seenShadowAbove && camera.seenShadowBelow))
	{
		var zTarget = camera.seenShadowAbove && camera.seenShadowBelow ? (ball.nextCollision[2] + ball.prevCollision[2])/2 : camera.zTarget;
		var zStep = Camera_Step(zTarget, camera.position[2], step, spf);
		if (fabs(zTarget - newCameraPos[2]) < zStep)
		{
			newCameraPos[2] = zTarget;
			atZTarget = true;
		}
		else
		{
			newCameraPos[2] = newCameraPos[2] + (newCameraPos[2] > zTarget ? -zStep : zStep);
		}
	}
	
	if (1)//(level.frameCount & 3) != 3)
	{
		do
		{
			bChanged = 0;
			for (j = 0; j < level.map.polyGroupCount; j++)
			{
				var pGroup = level.map.polyGroups[j];
				if (!pGroup.bVisible)
				{
					continue;
				}

				if (j > 0)
				{
					var index = level.map.polyGroups[0].polyCount + 6 + level.map.polyGroups[j].index - 1;
					if (camMask && !(camMask[index >> 5] & (1 << (index & 0x1f))))
						continue;
				}
				
				for (i = 0; i < pGroup.polyCount; i++)
				{
					var pPolygon;
					var k;
					var lcn;
					var ncn;
					var oldCameraDistance;
					var newCameraDistance;

					if (camMask && j == 0 && !(camMask[i >> 5] & (1 << (i & 0x1f))))
						continue;
				
					pPolygon = pGroup.polys[i];
					k = pPolygon.plane.k;// + (Vector_Dot(ball.sphere.position, pPolygon.plane.normal) > pPolygon.plane.k ? 0.029 : -0.029);
					lcn = Vector_Dot(camera.lastCollideDetectPos, pPolygon.plane.normal);
					ncn = Vector_Dot(newCameraPos, pPolygon.plane.normal);
					oldCameraDistance = k - lcn;
					newCameraDistance = k - ncn;
					
					if (oldCameraDistance > 0 && pPolygon.primitive.flags & Nova_fCullBack)
						continue;
					if (oldCameraDistance < 0 && pPolygon.primitive.flags & Nova_fCullFront)
						continue;
					
					if (((oldCameraDistance <= -0.029) && (newCameraDistance > -0.029)) || ((oldCameraDistance >= 0.029) && (newCameraDistance < 0.029)) || ((oldCameraDistance < 0) != (newCameraDistance < 0)))
					{
						var distance = oldCameraDistance / (ncn - lcn);
						var cross = Vector_AddScale(camera.lastCollideDetectPos, Vector_Subtract(newCameraPos, camera.lastCollideDetectPos), distance);
						if (Polygon_ContainsPoint(pPolygon, cross, 0.029))
						{
							var spotToSee = arrdup(ball.sphere.position);

							if (spotToSee[2] > ball.shadowAbove[2] - 4*ball.sphere.radius)
								spotToSee = Nova_Vector3f(ball.shadowAbove[0], ball.shadowAbove[1], ball.shadowAbove[2] - 4*ball.sphere.radius);
							else if (spotToSee[2] < ball.shadowBelow[2] + 4*ball.sphere.radius)
								spotToSee = Nova_Vector3f(ball.shadowBelow[0], ball.shadowBelow[1], ball.shadowBelow[2] + 4*ball.sphere.radius);

							if (spotToSee[2] > ball.shadowAbove[2] - 2*ball.sphere.radius ||
								 spotToSee[2] < ball.shadowBelow[2] + 2*ball.sphere.radius)
							{
								spotToSee[2] = (ball.shadowAbove[2] + ball.shadowBelow[2])/2;
							}

							foreach_poly_in(level.map, ballMask, function(poly,group,iGroup) {
								var bsn = Vector_Dot(spotToSee, poly.plane.normal);
								var ncn = Vector_Dot(newCameraPos, poly.plane.normal);
								var k = poly.plane.k + (bsn > poly.plane.k ? 0.029 : -0.029);
								var ballDistance = k - bsn;
								var newCameraDistance = k - ncn;
								if ((ballDistance > 0) != (newCameraDistance > 0))
								{
									var distance = ballDistance / (ncn - bsn);
									var intersection = Vector_AddScale(spotToSee, Vector_Subtract(newCameraPos, spotToSee), distance);
									if (Polygon_ContainsPoint(poly, intersection, 0.029))
									{
										direction = Matrix_Mult(ball.controlAngle, poly.plane.normal);
										direction[0] = 0;
										direction = Matrix_Mult(Matrix_Transpose(ball.controlAngle), direction);
										direction = Vector_Normalize(direction);
										var distance = (k - Vector_Dot(newCameraPos, poly.plane.normal)) /
										Vector_Dot(direction, poly.plane.normal);
										newCameraPos = Vector_Add(newCameraPos, Vector_Scale(direction, distance + (Vector_Dot(newCameraPos, direction) < Vector_Dot(spotToSee, direction) ? 0.001 : -0.001)));
										xyNewDistanceFromBall = Vector_Dot(Vector_Subtract(spotToSee, newCameraPos), ball.forward);
										if (camera.seenShadowAbove && camera.seenShadowBelow && atZTarget)
											camera.xyMaxLockDistanceFromBall = xyNewDistanceFromBall;
										bChanged = 1;
									}
								}
							});
						}
					}
				}
			}
		} while (bChanged && ++tries < 25);
		
		camera.lastCollideDetectPos = arrdup(camera.position);
	}

	camera.xyDistanceFromBall = xyNewDistanceFromBall;
	Camera_SetPosition(newCameraPos);

	if (camera.yMouse)
	{
		pitch += -camera.yMouse / 4.0;
		camera.yMouse = 0;
		if (pitch > 90)
			pitch = 90;
		if (pitch < -90)
			pitch = -90;
	}
	else if (camera.bEnableAutoLook)
	{
		var ballPos = Matrix_Mult(camera.viewAngle, Vector_Subtract(camera.position, ball.sphere.position));
		var collisionPos = Matrix_Mult(camera.viewAngle, Vector_Subtract(camera.position, ball.velocity[2] > 0 ? ball.shadowAbove : ball.shadowBelow));
		var k = 7.0/8 * camera.screenHeight / 2;
		var pitchTarget = -pitch; // zero degrees
		var collisionTarget;
		
		if (ball.velocity[2] > 0)
		{
			var ballMax = atan2((ballPos[1] + k * ballPos[2]), (ballPos[2] - k * ballPos[1])) * 180/pi;
			collisionTarget = atan2((collisionPos[1] - k * collisionPos[2]), (collisionPos[2] + k * collisionPos[1])) * 180/pi;
			if (pitchTarget < collisionTarget)
				pitchTarget = collisionTarget;

			if (pitchTarget > ballMax)
				pitchTarget = max(ballMax, 0); // Don't look away from the shadow if you're already half-way there...
		}
		else
		{
			var ballMin = atan2((ballPos[1] - k * ballPos[2]), (ballPos[2] + k * ballPos[1])) * 180/pi;
			collisionTarget = atan2((collisionPos[1] + k * collisionPos[2]), (collisionPos[2] - k * collisionPos[1])) * 180/pi;
			if (pitchTarget > collisionTarget)
				pitchTarget = collisionTarget;

			if (pitchTarget < ballMin)
				pitchTarget = min(ballMin, 0); // Don't look away from the shadow if you're already half-way there...
		}
		pitchTarget = pitch + pitchTarget; // Relative to absolute degrees

		if ((ball.shadowAbove[2] - ball.shadowBelow[2])/camera.xyDistanceFromBall < camera.screenHeight * .99)
			pitchTarget = 0;

		if (camera.seenShadowAbove && camera.seenShadowBelow)
			pitchTarget = 0;

		if (camera.lookLockTime > 0)
		{
			camera.lookLockTime -= spf;
		}
		else
		{
			var pitchStep = Camera_PitchStep(pitchTarget, step, spf);
			if (fabs(pitch - pitchTarget) > pitchStep)
				pitch += (pitch > pitchTarget ? -pitchStep : pitchStep);
			else
				pitch = pitchTarget;
		}
	}
		 
/*	if (camera.bEnableAutoLook)
	{
		 if (pitch > 90)
			pitch = 90;
		 else if (pitch < -90)
			pitch = -90;
	}*/

	if (roll != rollTarget)
	{
		if (fabs(roll - rollTarget) > rollStep)
			roll += (roll > rollTarget ? -rollStep : rollStep);
		else
			roll = rollTarget;
	}

	if (camera.yaw != yaw || camera.pitch != pitch || camera.roll != roll)
		Camera_SetViewAngle(yaw, pitch, roll);
	
	if (camera.bShouldFindNextCollision && (level.frameCount & 3) == 3)
		Camera_FindNextCollision();

	BaseDecorator_NextFrame(d, spf, step);
}
