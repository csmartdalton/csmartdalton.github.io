var stepperCoreVertCount = 8;
var stepperVertCount = (4*6);

var StepperFaces = [[-0.5, -0.5, -0.5],
                    [-0.5, +0.5, -0.5],
                    [+0.5, +0.5, -0.5],
                    [+0.5, -0.5, -0.5],
                    [-0.5, -0.5, +0.5],
                    [-0.5, +0.5, +0.5],
                    [+0.5, +0.5, +0.5],
                    [+0.5, -0.5, +0.5]];

var StepperQuads = [0, 1, 2, 3,
                    7, 6, 5, 4,
                    4, 5, 1, 0,
                    5, 6, 2, 1,
                    6, 7, 3, 2,
                    7, 4, 0, 3];
var StepperQuadsOld = [3, 2, 1, 0,
                       4, 5, 6, 7,
                       0, 1, 5, 4,
                       1, 2, 6, 5,
                       2, 3, 7, 6,
                       3, 0, 4, 7];

var isHomeSlack = 0.075;
var nextGridline = -2; // Used to signify no collision polygon for the next
						// collision of steppers
var noCollision = -1;

var movingBlockSize = (3 + 4 * 14);
var g_movingBlockCount = 0;
var g_movingBlocks = new Array(movingBlockSize);

function MovingBlocks_FindNextCollisions()
{
var i;

	for (i = 0; i < g_movingBlockCount; i++)
	{
		var coll = g_movingBlocks[i].decorator.FindNextCollision(g_movingBlocks[i], g_movingBlocks[i].decorator.direction);
		g_movingBlocks[i].decorator.target = coll.pos;
		g_movingBlocks[i].decorator.iCollisionGroup = coll.group;
	}
}

function MovingBlocks_Add(s)
{
var i;

	ASSERT(g_movingBlockCount + 1 < movingBlockSize);
	for (i = 0; i < g_movingBlockCount; i++)
		ASSERT(g_movingBlocks[i] != s);

	MovingBlocks_FindNextCollisions();

	g_movingBlocks[g_movingBlockCount++] = s;
}

function MovingBlocks_Remove(s)
{
var i;

	for (i = 0; i < g_movingBlockCount; i++)
	{
		if (g_movingBlocks[i] == s)
			break;
	}

	ASSERT(i < g_movingBlockCount); // The block WASN'T in the list!
	g_movingBlockCount--;

	for (; i < g_movingBlockCount; i++)
	{
		g_movingBlocks[i] = g_movingBlocks[i + 1];
	}

	MovingBlocks_FindNextCollisions();
}

function Mover_SetHome(block,v)
{
	block.home = arrdup(v);
}

function Stepper_SyncVerts(s)
{
var i,j;

	ASSERT(8 == stepperCoreVertCount);

	var myFaces = new Array(stepperCoreVertCount);
	for (i = 0; i < stepperCoreVertCount; i++)
		myFaces[i] = Vector_Add(s.origin, Matrix_Mult(s.grid2map, Vector_Add(s.pos, StepperFaces[i]))); 
	
	var idx = 0;
	for (i = 0; i < s.b.group.polyCount; i++)
	{
		var poly = s.b.group.polys[i];
		for (j = 0; j < poly.sides; j++)
		{
			poly.vertex[j] = myFaces[s.stepper_quads[idx]];
			g_glverts[s.glverts+idx] = GLV_SetV(g_glverts[s.glverts+idx], poly.vertex[j]);
			idx++;
		}
	}

	for (i = 0; i < s.b.group.polyCount; i++)
		s.b.group.polys[i].plane.k = Vector_Dot(s.b.group.polys[i].vertex[0], s.b.group.polys[i].plane.normal);

	s.b.middle = Vector_Add(s.origin, Matrix_Mult(s.grid2map, s.pos));

	if (g_vbos.verts)
		Nova_UpdateVerts(g_vbos, g_glverts, s.glverts, stepperVertCount);
}

function Stepper_LoadPolys(block,vertices)
{
var i,j,k,l;
var s = block;
var oldGlVerts = new Array(stepperVertCount);
var glvertStart = g_glvertCount;
var oldPolys = new Array(6);
var axes;
var val, val2;

	if (!block.group.is_model)
		return Stepper_LoadPolysOld(block,vertices);

	Block_LoadPolys(s.b, vertices);

	s.glverts = glvertStart;
	s.glvertCount = g_glvertCount - glvertStart;
	s.isHome = Vector_VeryClose(s.home, s.b.middle, isHomeSlack);
	s.origin = arrdup(s.b.middle);
	s.pos = [0,0,0];
	s.stepper_quads = StepperQuads;
	axes = [Vector_Subtract(vertices[3], vertices[0]),
	        Vector_Subtract(vertices[1], vertices[0]),
	        Vector_Subtract(vertices[4], vertices[0])]
	
	var angle_dir = [cos(block.yaw*pi/180), sin(block.yaw*pi/180)];
	function swapAxes(i,j) {
		var swp = axes[i];
		axes[i] = axes[j]
		axes[j] = swp;
	}
	if (fabs(axes[0][2]) > fabs(axes[2][2]))
		swapAxes(0,2);
	if (fabs(axes[1][2]) > fabs(axes[2][2]))
		swapAxes(1,2);
	if (fabs(axes[0][0]*angle_dir[0] + axes[0][1]*angle_dir[1]) > fabs(axes[1][0]*angle_dir[0] + axes[1][1]*angle_dir[1]))
		swapAxes(0,1);
	if (axes[2][2] < 0)
		axes[2] = Vector_Negate(axes[2]);
	if (axes[1][0]*angle_dir[0] + axes[1][1]*angle_dir[1] < 0)
		axes[1] = Vector_Negate(axes[1]);
	if (Vector_Dot(axes[0], Vector_Cross(axes[1],axes[2])) < 0)
		axes[0] = Vector_Negate(axes[0]);
	
	s.grid2map = Matrix_Transpose(axes);
	s.map2grid = Matrix_Invert(s.grid2map);

	val = Matrix_Mult(s.map2grid, Nova_Vector3f(0.2,0.5,0.9));
	val2 = Matrix_Mult(s.grid2map, val);
	ASSERT(Vector_VeryClose(Nova_Vector3f(0.2,0.5,0.9), val2, isHomeSlack));

	for (i = 0; i < block.group.polyCount; i++)
	{
		s.b.group.polys[i].primitive.color[3] = 1;
		s.b.group.polys[i].primitive.flags &= ~Nova_fCullBack;
		s.b.group.polys[i].primitive.flags |= Nova_fCullFront;
	}

	block.vertices = BlockModel.vertices;
	block.atlas = g_atlasTex;
	
	Stepper_SyncVerts(s);
	Nova_PreprocessPolygons(s.b.group.polys, s.b.group.polyCount);
}

function Stepper_LoadPolysOld(pBlock,vertices)
{
var i,j,k,l;
var s = pBlock;
var oldGlVerts = new Array(stepperVertCount);
var glvertStart = g_glvertCount;
var oldPolys = new Array(6);
var axes;
var val, val2;

	Block_LoadPolys(s.b, vertices);

	s.glverts = glvertStart;
	s.glvertCount = g_glvertCount - glvertStart;
	s.isHome = Vector_VeryClose(s.home, s.b.middle, isHomeSlack);
	s.origin = arrdup(s.b.middle);
	s.pos = [0,0,0];
	s.stepper_quads = StepperQuadsOld;
	axes = [Vector_Subtract(vertices[3], vertices[0]),
	axes =  Vector_Subtract(vertices[1], vertices[0]),
	axes =  Vector_Subtract(vertices[4], vertices[0])]

	if (fabs(axes[0][2]) > fabs(axes[2][2]))
	{
		var swp = axes[0];
		axes[0] = axes[2];
		axes[2] = swp;
	}
	if (fabs(axes[1][2]) > fabs(axes[2][2]))
	{
		var swp = axes[1];
		axes[1] = axes[2];
		axes[2] = swp;
	}
	if (fabs(axes[1][0]) > fabs(axes[0][0]))
	{
		var swp = axes[1];
		axes[1] = axes[0];
		axes[0] = swp;
	}

	s.grid2map = Matrix_Transpose(axes);
	s.map2grid = Matrix_Invert(s.grid2map);

	val = Matrix_Mult(s.map2grid, Nova_Vector3f(0.2,0.5,0.9));
	val2 = Matrix_Mult(s.grid2map, val);
	ASSERT(Vector_VeryClose(Nova_Vector3f(0.2,0.5,0.9), val2, isHomeSlack));

	for (i = 0; i < pBlock.group.polyCount; i++)
		s.b.group.polys[i].primitive.color[3] = 1;

	ASSERT(stepperVertCount == s.glvertCount);
	for (i = 0; i < stepperVertCount; i++)
		oldGlVerts[i] = arrdup(g_glverts[s.glverts+i]);
	for (i = 0; i < 6; i++)
		oldPolys[i] = Polygon_Clone(s.b.group.polys[i]);

	Stepper_SyncVerts(s);

	Nova_PreprocessPolygons(s.b.group.polys, s.b.group.polyCount);
	if (pBlock.group.polys[0].plane.k - Vector_Dot(pBlock.group.polys[0].plane.normal, pBlock.middle) > 0)
	{
		s.grid2map = Matrix_Negate(s.grid2map);
		s.map2grid = Matrix_Negate(s.map2grid);
		Stepper_SyncVerts(s);
		Nova_PreprocessPolygons(s.b.group.polys, s.b.group.polyCount);
	}

	for (i = 0; i < pBlock.group.polyCount; i++)
	{
		pBlock.group.polys[i].primitive.flags &= ~Nova_fCullBack;
		pBlock.group.polys[i].primitive.flags |= Nova_fCullFront;
	}

	for (i = 0; i < s.b.group.polyCount; i++)
	{
		var matches = 0;
		var ind_min = s.b.group.polys[i].pTriIndices[0];
		for (j = 1; j < s.b.group.polys[i].indices; j++)
		{
			if (s.b.group.polys[i].pTriIndices[j] < ind_min)
				ind_min = s.b.group.polys[i].pTriIndices[j];
		}

		for (l = 0; l < s.b.group.polyCount; l++)
		{
			var match = TRUE;
			var oldMin = oldPolys[l].pTriIndices[0];
			for (k = 1; k < oldPolys[l].indices; k++)
			{
				if (oldPolys[l].pTriIndices[k] < oldMin)
					oldMin = oldPolys[l].pTriIndices[k];
			}
		 
			for (j = ind_min; j < ind_min + s.b.group.polys[i].sides; j++)
			{
				var count = 0;
				var newVert = s.b.group.polys[i].pGLVerts[j];
				for (k = oldMin - glvertStart; k < oldMin - glvertStart + oldPolys[l].sides; k++)
				{
					var oldVert = oldGlVerts[k];
					if ((fabs(oldVert[0] - newVert[0]) < 0.001) &&
						 (fabs(oldVert[1] - newVert[1]) < 0.001) &&
						 (fabs(oldVert[2] - newVert[2]) < 0.001))
					{
						count++;
					}
				}

				ASSERT(count <= 1);
				match = match && (count == 1);
			}

			if (match)
			{
				var f = Vector_Dot(oldPolys[l].plane.normal, s.b.group.polys[i].plane.normal);
				//ASSERT(fabs(f) > 0.99);


				for (j = ind_min; j < ind_min + s.b.group.polys[i].sides; j++)
				{
					var count = 0;
					var newVert = s.b.group.polys[i].pGLVerts[j];
					for (k = oldMin - glvertStart; k < oldMin - glvertStart + oldPolys[l].sides; k++)
					{
						var oldVert = oldGlVerts[k];
						if ((fabs(oldVert[0] - newVert[0]) < 0.001) &&
							 (fabs(oldVert[1] - newVert[1]) < 0.001) &&
							 (fabs(oldVert[2] - newVert[2]) < 0.001))
						{
							arrcpy(newVert,oldVert,9);
							count++;
						}
					}

					ASSERT(count == 1);
				}

				matches++;
			}
		}
		ASSERT(matches == 1);
	}
}

function StepperDecorator_Free(d)
{
var sd = d;
var s = sd.s;
var stopMovingSound = sd.stopMovingSound;

	s.b.group.moving = FALSE;
	s.decorator = NULL;

	Decorator_Free(sd.d);

	if (s.collidesWithMoving)
		MovingBlocks_Remove(s);

	 if (Vector_VeryClose(s.b.middle, s.home, isHomeSlack))
	 {
		 if (!s.isHome)
		 {
			 Sound_Play3D(s.madeItHomeSound, s.b.middle);
			 s.isHome = TRUE;
			 s.MadeItHome(s);
		 }
	 }
	 else
	 {
		 Sound_Play3D(stopMovingSound, s.b.middle);
		 // ASSERT(s.isHome == FALSE);
		 s.isHome = FALSE;
	 }

	 if (s.b.group.type == ekLockedDoor)
		 Sound_Stop(ekDoorSound);
	
	Level_GetBall().shouldFindNextCollision = TRUE;
}

function Stepper_Contains(s,pt)
{
var i;

	for (i = 0; i < s.b.group.polyCount; i++)
	{
		if (s.b.group.polys[i].plane.k - Vector_Dot(pt, s.b.group.polys[i].plane.normal) > -0.05)
			return FALSE;
	}

	return TRUE;
}

function Stepper_CheckMovingBlocks(s,oldPos)
{
var i, j;

	ASSERT(s.b.group.moving);
	for (i = 0; i < g_movingBlockCount; i++)
	{
		if (g_movingBlocks[i] != s.decorator.s)
		{
			for (j = 0; j < stepperCoreVertCount; j++)
			{
				var r = j%4;
				var q = (j - r)/4;
				if (Stepper_Contains(g_movingBlocks[i], s.polys[q].vertex[r]) ||
					Stepper_Contains(s.decorator.s, g_movingBlocks[i].polys[q].vertex[r]))
				{
					s.pos = arrdup(oldPos);
					Stepper_SyncVerts(s.decorator.s);
					s.decorator.d.Free(s.decorator.d);
					return;
				}
			}
		}
	}
}

function StepperDecorator_NextFrame(d,spf,step)
{
var s = d.s;
var ball = Level_GetBall();
var oldPos = arrdup(s.pos);
var mapDirection = Matrix_Mult(s.grid2map, s.decorator.direction);
var polyOrder = [0, 1, 2, 3, 4, 5];
var i;	

	BaseDecorator_NextFrame(d, spf, step); // Must be before call to Collide

	if (s.decorator == NULL)
		return; // Freed later down

	if (s.decorator.velocity[0] == 0 && s.decorator.velocity[1] == 0 && s.decorator.velocity[2] == 0)
	{
		s.decorator.d.Free(s.decorator.d);
		return;
	}
	else if (s.decorator.iCollisionGroup == noCollision && 
				(s.b.middle[0] > Level_GetLevel().max[0] ||
				 s.b.middle[0] < Level_GetLevel().min[0] ||
				 s.b.middle[1] > Level_GetLevel().max[1] ||
				 s.b.middle[1] < Level_GetLevel().min[1] ||
				 s.b.middle[2] > Level_GetLevel().max[2] ||
				 s.b.middle[2] < Level_GetLevel().min[2]))
	{
		s.b.group.bVisible = FALSE;
		Level_AddDecorator(ShatterDecorator_FromBlock(s.b, NULL));
		s.decorator.d.Free(s.decorator.d);
		return;
	}

	s.pos = Vector_Add(s.pos, 
		Vector_Scale(s.decorator.velocity, spf * step * 1.5));

	if (Vector_Dot(s.pos, s.decorator.velocity) >= Vector_Dot(s.decorator.target, s.decorator.velocity))
	{
		s.pos = arrdup(s.decorator.target);
		Stepper_SyncVerts(s.decorator.s);
		s.decorator.velocity= [0,0,0];
	}

	Stepper_SyncVerts(s.decorator.s);
	
	for (i = 2; i < s.b.group.polyCount; i++)
	{
		if (fabs(Vector_Dot(mapDirection, s.b.group.polys[i].plane.normal)) > 
			 fabs(Vector_Dot(mapDirection, s.b.group.polys[polyOrder[0]].plane.normal)))
		{
			polyOrder[i] = polyOrder[0];
			polyOrder[0] = i;
		}
		
		else if (fabs(Vector_Dot(mapDirection, s.b.group.polys[i].plane.normal)) > 
					fabs(Vector_Dot(mapDirection, s.b.group.polys[polyOrder[1]].plane.normal)))
		{
			polyOrder[i] = polyOrder[1];
			polyOrder[1] = i;
		}
	}

	for (i = 0; i < s.b.group.polyCount; i++)
	{
		var d = s.b.group.polys[polyOrder[i]].plane.k - 
			Vector_Dot(ball.sphere.position, s.b.group.polys[polyOrder[i]].plane.normal); 
		
		if (((s.decorator.distance[polyOrder[i]] < -ball.sphere.radius) != (d < -ball.sphere.radius)) || 
			 ((s.decorator.distance[polyOrder[i]] > ball.sphere.radius) != (d > ball.sphere.radius)) ||
			 ((s.decorator.distance[polyOrder[i]] > 0) != (d > 0)))
		{
			var velRel = Vector_Subtract(ball.velocity, Matrix_Mult(s.grid2map, s.decorator.velocity));
			if ((Vector_Dot(velRel, s.b.group.polys[polyOrder[i]].plane.normal) < 0 || (s.b.group.polys[polyOrder[i]].primitive.flags & Nova_fCullFront)) &&
				 (Vector_Dot(velRel, s.b.group.polys[polyOrder[i]].plane.normal) > 0 || (s.b.group.polys[polyOrder[i]].primitive.flags & Nova_fCullBack)) &&
				 (Polygon_ContainsPoint(s.b.group.polys[polyOrder[i]], ball.sphere.position, 2 * ball.sphere.radius)))
			{
				var idx = (ball.lockStart + ball.lockCount++) & (ballLockTableSize - 1);
				if (ball.lockCount > ballLockTableSize)
				{
					ball.targetRelativeVelocity[2] = ball.locks[ball.lockStart & (ballLockTableSize - 1)].nextZ;
					ball.lockStart++;
					ball.lockCount--;
					ASSERT(!(ball.lockCount > ballLockTableSize));
				}

				// s.decorator.distance[polyOrder[i]] = d;
				s.b.group.Collide(s.b.group, s.b.group.polys[polyOrder[i]].primitive); // **
																						// COULD
																						// FREE
																						// s.decorator!
																						// **

				ball.velocity = s.b.group.polys[polyOrder[i]].plane.normal;// Vector_Negate(Vector_Normalize(Vector_Subtract(ball.velocity,s.b.middle)));
				ball.velocity = Vector_Scale(Vector_Negate(s.b.group.polys[polyOrder[i]].plane.normal), Vector_Dot(s.b.group.polys[polyOrder[i]].plane.normal, ball.velocity));
				ball.locks[idx].velocity = arrdup(ball.velocity);
				ball.locks[idx].seconds = 0.25;

				if (ball.lockCount > 1)
					ball.locks[idx].nextZ = ball.locks[(idx + ballLockTableSize - 1) & (ballLockTableSize - 1)].nextZ;
				else
					ball.locks[idx].nextZ = ball.targetRelativeVelocity[2];

				if (fabs(s.b.group.polys[polyOrder[i]].plane.normal[2]) > 0.707)
					ball.locks[idx].nextZ = -ball.locks[idx].nextZ;

				Ball_SetVelocity(ball.velocity);

				Level_Collided(s.b.group.type);

				return;
			}
		}

		s.decorator.distance[polyOrder[i]] = d;
	}

	if (s.collidesWithMoving)
	{
		Stepper_CheckMovingBlocks(s, oldPos);
	}

	SpikeBalls_CollisionGroupChanged(s.b.group.index);

	Ball_FindShadows();
}

function DoorDecorator_NextFrame(d,spf,step)
{
var sd = d;
var s = sd.s;
var mapDirection = Matrix_Mult(s.grid2map, sd.direction);
var length = Vector_Length(mapDirection);
var accel = Vector_Scale(sd.direction, Vector_Dot(s.pos, sd.direction) * -min(0.5 / length, 2.2) * spf);
var vel = Vector_Add(sd.velocity, accel);
var oldPos = arrdup(s.pos);

	if (Vector_Dot(vel, vel) > 1.24 * 1.24 / (length * length) * spf)
	{
		// Friction
		vel = Vector_Add(vel, Vector_Scale(sd.direction, -0.5 / length * spf));
	}

	if (Vector_Dot(vel,sd.velocity) <= 0)
	{
		if (Vector_Dot(sd.direction, sd.s.pos) > 0.01)
		{
			// Turned around
			sd.direction = Vector_Negate(sd.direction);
			var coll = s.FindNextCollision(s, sd.direction);
			sd.target = coll.pos;
			sd.iCollisionGroup = coll.group;
			Sound_Play3D(ekSpringReverseSound, s.b.middle);
		}
		else
		{
			// Stopped
			BaseDecorator_NextFrame(d, spf, step);
			sd.d.Free(sd.d);
			return;
		}
	}

	sd.velocity = arrdup(vel);
	StepperDecorator_NextFrame(d, spf, step);
	
	if (s.decorator && Vector_Dot(vel, vel) <= 1.24 * 1.24 / (length * length) * spf && 
		 Vector_Dot(oldPos, s.decorator.direction) > 0 != Vector_Dot(s.pos, s.decorator.direction) > 0)
	{
		s.pos[0] = s.pos[1] = s.pos[2] = 0;
		Stepper_SyncVerts(s);
		s.decorator.d.Free(s.decorator.d);
	}
}

var CutPolygon_newVerts = new Array(64);
function CutPolygon(plane,verts,sides)
{
	if (sides == 0)
		return 0;
	
	var newSides = 0;
	var iPrev = sides - 1;
	var prevInFront = plane.k - Vector_Dot(verts[iPrev], plane.normal) > 0;
	var i;

	for (i = 0; i < sides; i++)
	{
		if (plane.k - Vector_Dot(verts[i], plane.normal) > 0)
		{
			if (!prevInFront)
			{
				var v = Vector_Subtract(verts[i], verts[iPrev]);
				var dv = (plane.k - Vector_Dot(verts[iPrev], plane.normal)) / Vector_Dot(v, plane.normal);
				CutPolygon_newVerts[newSides++] = Vector_Add(verts[iPrev], Vector_Scale(v, dv));
			}
			CutPolygon_newVerts[newSides++] = arrdup(verts[i]);
			prevInFront = TRUE;
		}
		else
		{
			if (prevInFront)
			{
				var v = Vector_Subtract(verts[i], verts[iPrev]);
				var dv = (plane.k - Vector_Dot(verts[iPrev], plane.normal)) / Vector_Dot(v, plane.normal);
				CutPolygon_newVerts[newSides++] = Vector_Add(verts[iPrev], Vector_Scale(v, dv));
			}
			prevInFront = FALSE;
		}

		iPrev = i;
	}

	for (i = 0; i < newSides; i++)
		ASSERT(plane.k - Vector_Dot(CutPolygon_newVerts[i], plane.normal) > -0.01);

	ASSERT(newSides < 64);
	arrcpy(verts,CutPolygon_newVerts,newSides);

	return newSides;
}

var Mover_FindNextCollisionWithMask_v = new Array(64);
function Mover_FindNextCollisionWithMask(s,velocity,mask)
{
var m = arrdup2d(s.map2grid);
var minZ = 1 + Vector_Length(Matrix_Mult(s.map2grid, Vector_Subtract(Level_GetLevel().max, Level_GetLevel().min)));
var ret, oldret;
var nVelocity = Vector_Normalize(velocity);
var mapVelocity = Matrix_Mult(s.grid2map, velocity);
var colGroup;
var i;
	
	if (fabs(nVelocity[0]) > 0.5)
	{
		var swp = m[0];
		m[0] = m[2];
		m[2] = swp;
		if (nVelocity[0] < 0)
			m = Matrix_Negate(m);
	}
	else if (fabs(nVelocity[1]) > 0.5)
	{
		var swp = m[1];
		m[1] = m[2];
		m[2] = swp;
		if (nVelocity[1] < 0)
			m = Matrix_Negate(m);
	}
	else if (nVelocity[2] < 0)
	{
		m = Matrix_Negate(m);
	}
	
	colGroup = noCollision;
	foreach_poly_in(Level_GetLevel().map, mask, function(poly,group,iGroup) {
		var distFromPlane = (poly.plane.k - Vector_Dot(s.b.middle, poly.plane.normal));
		if ((group != s.b.group) && (!group.moving) &&
			 (fabs(Vector_Dot(mapVelocity, poly.plane.normal)) > 0.01) &&
			 (distFromPlane / Vector_Dot(mapVelocity, poly.plane.normal) > 0) &&
			 (distFromPlane > 0.001 || !(poly.primitive.flags & Nova_fCullFront)) &&
			 (distFromPlane < -0.001 || !(poly.primitive.flags & Nova_fCullBack)))
		{
			var left = 1, right = 1, above = 1, below = 1, behind = 1;
			ASSERT(poly.sides < 64);
			for (i = 0; i < poly.sides; i++)
			{
				Mover_FindNextCollisionWithMask_v[i] = Matrix_Mult(m, Vector_Subtract(poly.vertex[i], s.b.middle));
				left &= (Mover_FindNextCollisionWithMask_v[i][0] < -0.45);
				right &= (Mover_FindNextCollisionWithMask_v[i][0] > 0.45);
				below &= (Mover_FindNextCollisionWithMask_v[i][1] < -0.45);
				above &= (Mover_FindNextCollisionWithMask_v[i][1] > 0.45);
				behind &= (Mover_FindNextCollisionWithMask_v[i][2] < 0);
			}
			
			if (!(left | right | above | below | behind))
			{
				var sides = poly.sides;
				sides = CutPolygon(Nova_Plane4f(-1, 0, 0, 0.5), Mover_FindNextCollisionWithMask_v, sides);
				sides = CutPolygon(Nova_Plane4f(+1, 0, 0, 0.5), Mover_FindNextCollisionWithMask_v, sides);
				sides = CutPolygon(Nova_Plane4f(0, -1, 0, 0.5), Mover_FindNextCollisionWithMask_v, sides);
				sides = CutPolygon(Nova_Plane4f(0, +1, 0, 0.5), Mover_FindNextCollisionWithMask_v, sides);
				sides = CutPolygon(Nova_Plane4f(0, 0, -1, 0), Mover_FindNextCollisionWithMask_v, sides);
				
				for (i = 0; i < sides; i++)
				{
					ASSERT(Mover_FindNextCollisionWithMask_v[i][2] > -0.01);
					ASSERT(Mover_FindNextCollisionWithMask_v[i][0] > -0.51 && Mover_FindNextCollisionWithMask_v[i][0] < 0.51);
					ASSERT(Mover_FindNextCollisionWithMask_v[i][1] > -0.51 && Mover_FindNextCollisionWithMask_v[i][1] < 0.51);
					if (Mover_FindNextCollisionWithMask_v[i][2] < minZ)
					{
						minZ = Mover_FindNextCollisionWithMask_v[i][2];
						colGroup = iGroup;
					}
				}
			}
		}
	});
	
	oldret = ret = Vector_Add(s.pos, Vector_Scale(nVelocity, (minZ - 0.5)));
	ASSERT(Vector_Length(Vector_Cross(nVelocity, Vector_Subtract(ret, s.pos))) < 0.01);
	
	return {pos:ret, group:colGroup};
	
}

function Mover_FindNextCollision(s,velocity)
{
	return Mover_FindNextCollisionWithMask(s, velocity, Level_GetVisiblesMask(s.b.middle));
}

function LockedDoor_FindNextCollision(s,velocity)
{
	return Mover_FindNextCollision/* WithMask */(s, velocity/* , NULL */);
}

function Stepper_FindNextCollision(s,velocity)
{
	var ret = Mover_FindNextCollision(s, velocity);

	if (velocity[0] > 0.01)
	{
		if (floor(s.pos[0] + 1) < ret.pos[0])
		{
			ret.pos[0] = floor(s.pos[0] + 1);
			ret.group = nextGridline;
		}
	}
	else if (velocity[0] < -0.01)
	{
		if (ceil(s.pos[0] - 1) > ret.pos[0])
		{
			ret.pos[0] = ceil(s.pos[0] - 1);
			ret.group = nextGridline;
		}
	}

	else if (velocity[1] > 0.01)
	{
		if (floor(s.pos[1] + 1) < ret.pos[1])
		{
			ret.pos[1] = floor(s.pos[1] + 1);
			ret.group = nextGridline;
		}
	}
	else if (velocity[1] < -0.01)
	{
		if (ceil(s.pos[1] - 1) > ret.pos[1])
		{
			ret.pos[1] = ceil(s.pos[1] - 1);
			ret.group = nextGridline;
		}
	}

	else if (velocity[2] > 0.01)
	{
		if (floor(s.pos[2] + 1) < ret.pos[2])
		{
			ret.pos[2] = floor(s.pos[2] + 1);
			ret.group = nextGridline;
		}
	}
	else if (velocity[2] < -0.01)
	{
		if (ceil(s.pos[2] - 1) > ret.pos[2])
		{
			ret.pos[2] = ceil(s.pos[2] - 1);
			ret.group = nextGridline;
		}
	}

	return ret;
}

function Switch_FindNextCollision(s,velocity)
{
var dir = Vector_Normalize(velocity);
var org2home = Vector_Normalize(Matrix_Mult(s.map2grid, Vector_Subtract(s.home, s.origin)));
	
	if (Vector_VeryClose(dir, org2home, 0.01))
		return {pos:Matrix_Mult(s.map2grid, Vector_Subtract(s.home, s.origin)), group:0};
	else if (Vector_VeryClose(dir, Vector_Negate(org2home), 0.01))
		return {pos:Nova_Vector3f(0,0,0), group:0};
	
	return {pos:s.pos, group:0};
}

function SpringDoor_CanMove(s,velocity)
{
var maxIdx = function(a,b,c) {
	return ((a) > (b) ? ((a) > (c) ? 0 : 2) : ((b) > (c) ? 1 : 2));
};
var ball = Level_GetBall();

	if (maxIdx(Vector_Dot(s.map2grid[0],s.map2grid[0]), Vector_Dot(s.map2grid[1],s.map2grid[1]),
		 Vector_Dot(s.map2grid[2],s.map2grid[2])) != maxIdx(fabs(velocity[0]), fabs(velocity[1]), fabs(velocity[2])) )
	{
		return FALSE;
	}

	if (ball.bInvincible || !Color_Equals(ball.sphere.primitive.color, s.b.color))
	{
		if (s.b.group.moving)
			s.decorator.velocity = Vector_Scale(s.decorator.velocity, 0.0001);
			
		return FALSE;
	}

	return TRUE;
}

function LockedDoor_CanMove(s,velocity)
{
	return FALSE;
}

function Mover_CanMove(s,velocity)
{
	return !s.b.group.moving && !Level_GetBall().bInvincible &&
			 Color_Equals(Level_GetBall().sphere.primitive.color, s.b.color);
}

function Stepper_MadeItHome(s)
{
}

function StepperDecorator_InsertNewWithCollision(s,velocity,FindNextCollision)
{
var sd = {};
sd.d = sd;
var ball = Level_GetBall();
var i;
		
	Decorator_Init(sd.d);
	sd.d.Free = StepperDecorator_Free;
	sd.d.NextFrame = StepperDecorator_NextFrame;
	sd.velocity = arrdup(velocity);
	sd.direction = Vector_Normalize(velocity);
	sd.FindNextCollision = FindNextCollision;
	sd.distance = new Array(6);
	sd.s = s;

	ASSERT(sd.s.b.group.polyCount <= 6);
	for (i = 0; i < sd.s.b.group.polyCount; i++)
	{
		sd.distance[i] = sd.s.b.group.polys[i].plane.k - 
			Vector_Dot(ball.sphere.position, sd.s.b.group.polys[i].plane.normal); 
	}

	if (s.decorator != NULL)
	{
		s.decorator.d.Free(s.decorator.d);
	}

	s.b.group.moving = TRUE;
	s.decorator = sd;
	if (s.collidesWithMoving)
		MovingBlocks_Add(s);

	var coll = sd.FindNextCollision(s, sd.velocity);
	sd.target = coll.pos;
	sd.iCollisionGroup = coll.group;
	sd.stopMovingSound = s.stopMovingSound;
	
	if (s.isHome)
		s.isHome = Vector_VeryClose(Matrix_Mult(s.map2grid, Vector_Subtract(s.home, s.origin)), sd.target, isHomeSlack);
	
	Level_AddDecorator(sd.d);	

	if (Vector_VeryClose(sd.target, s.pos, 0.001))
	{
		sd.d.Free(sd.d);
	}

	return s.decorator;
}

function StepperDecorator_InsertNew(s,velocity)
{
	return StepperDecorator_InsertNewWithCollision(s, velocity, s.FindNextCollision);
}

function Stepper_Collide(pGroup,pPrimitive)
{
var s = pGroup;

	if (s.CanMove(s, Matrix_Mult(s.map2grid, pPrimitive.plane.normal)))
	{ 
		StepperDecorator_InsertNew(s, Matrix_Mult(s.map2grid, pPrimitive.plane.normal));
		if (s.decorator && !Vector_VeryClose(s.decorator.target, s.pos, 0.1))
		{
			Sound_Play3D(s.startMovingSound, s.b.middle);
		}
		else
		{
			Sound_Play3D(ekClickSound, s.b.middle);
		}
	}
	else
	{
		Sound_Play3D(ekClickSound, s.b.middle);
	}
}

function Door_Collide(pGroup,pPrimitive)
{
var s = pGroup;
var distance = new Array(6);
var wasMoving = s.b.group.moving;
var oldNextFrame;

	if (s.b.group.moving)
	{
		arrcpy(distance, s.decorator.distance, 6);
		oldNextFrame = s.decorator.d.NextFrame;
	}

	Stepper_Collide(pGroup, pPrimitive);

	if (s.b.group.moving)
	{
		if (wasMoving)
		{
			s.decorator.d.NextFrame = oldNextFrame;
			arrcpy(s.decorator.distance,6);
		}
		else 
		{
			s.decorator.d.NextFrame = DoorDecorator_NextFrame;
		}

	}
}

function Stepper_LevelFinishedLoading(g)
{
}

function Coaster_SwitchHit(b,on)
{
}

function GangSwitch_SwitchHit(b,on)
{
	if (on && b.isHome)
		Level_AddDecorator(ToOriginDecorator_New(b, 0));
}

function LockedDoor_Open(s)
{
var velocity = Nova_GetAngleVector(s.b.yaw, s.b.pitch);
var sd;

	if (s.b.group.moving)
	{
	 // ASSERT(0);
		s.decorator.d.Free(s.decorator.d);
	}

	sd = StepperDecorator_InsertNew(s, 
		Matrix_Mult(s.map2grid, Vector_Scale(velocity, 0.125)));
	
	if (sd)
	{
		sd.d.NextFrame = StepperDecorator_NextFrame;
		Sound_Play3D(
			Vector_Dot(Vector_AddScale(sd.s.pos, sd.velocity, 2 * 1.1 * 1.5), sd.velocity) < 
			Vector_Dot(sd.target, sd.velocity) ? ekDoorSound : ekDoorSound, s.b.middle);
	}
}

function LockedDoor_SwitchHit(b,on)
{
	if (on)
	{
		if (b.isHome)
		{
			LockedDoor_Open(b);
		}
		else
		{
			Level_AddDecorator(GoHomeDecorator_New(b, 0));
			Sound_Play3D(ekDoorSound, b.middle);
		}
	}
}

function Coaster_SwitchGroupies(block,show)
{
var map = Level_GetLevel().map;
var i;

	ASSERT(block.group.type == ekCoaster || block.group.type == ekSlidingStar);
	
	for (i = 0; i < map.polyGroupCount; i++)
	{
		if (map.polyGroups[i].type != ekEnvironment)
		{
			var b = map.polyGroups[i];
			if (b.iBlockGroup == block.iBlockGroup && b != block)
			{
				var wasVisible = b.group.bVisible;
				b.SwitchHit(b, show);

				if (!wasVisible && b.group.bVisible && block.group.bVisible)
				{
					block.group.bVisible = FALSE;
					Level_AddDecorator(ShatterDecorator_FromBlock(block, NULL));
					Sound_Play3D(ekGlassCrunchSound, b.middle);
				}
			}
		}
	}
	
	Ball_FindShadows();
}

function Coaster_LevelFinishedLoading(g)
{
	Coaster_SwitchGroupies(g, FALSE);
}

function ToOriginDecorator_FindNextCollision(s,velocity)
{
	var coll = s.FindNextCollision(s, velocity);
	var target1 = coll.pos;
	var target2 = [0, 0, 0];

	return {pos:Vector_Dot(Vector_Subtract(target1, target2), s.decorator.direction) > 0 ? target2 : target1,
			group:coll.group};
}

function ToOriginDecorator_Free(d)
{
var ghd = d;
var dir = Vector_Scale(ghd.switchBlock.pos, -2);

	StepperDecorator_InsertNewWithCollision(ghd.switchBlock, dir, ToOriginDecorator_FindNextCollision);

	Decorator_Free(d);
}

function ToOriginDecorator_WillTerminate(d)
{
	BaseDecorator_WillTerminate(d);
	d.Free(d);
}	

function ToOriginDecorator_NextFrame(d,spf,step)
{
var ghd = d;

	BaseDecorator_NextFrame(d, spf, step);
	ghd.time -= spf;
	if (ghd.time <= 0)
		ghd.d.Free(ghd.d);
}

function ToOriginDecorator_New(s,waitTime)
{
	var ghd = {};
	ghd.d = ghd;
	Decorator_Init(ghd.d);
	ghd.d.NextFrame = ToOriginDecorator_NextFrame;
	ghd.d.Free = ToOriginDecorator_Free;
	ghd.d.WillTerminate = ToOriginDecorator_WillTerminate;

	ghd.switchBlock = s;
	ghd.time = waitTime;

	return ghd.d;
}

function GoHomeDecorator_FindNextCollision(s,velocity)
{
	var coll = s.FindNextCollision(s, velocity);
	var target1 = coll.pos;
	var target2 = Matrix_Mult(s.map2grid, Vector_Subtract(s.home, s.origin));

	return {pos:Vector_Dot(Vector_Subtract(target1, target2), s.decorator.direction) > 0 ? target2 : target1,
			group:coll.group};
}

function GoHomeDecorator_Free(d)
{
var ghd = d;

	var dir = Vector_Scale(Vector_Subtract(ghd.switchBlock.pos, Matrix_Mult(ghd.switchBlock.map2grid, Vector_Subtract(ghd.switchBlock.home, ghd.switchBlock.origin))), -2);
	StepperDecorator_InsertNewWithCollision(ghd.switchBlock, dir, GoHomeDecorator_FindNextCollision);

	Decorator_Free(d);
}

function GoHomeDecorator_WillTerminate(d)
{
	BaseDecorator_WillTerminate(d);
	d.Free(d);
}	

function GoHomeDecorator_NextFrame(d,spf,step)
{
var ghd = d;

	BaseDecorator_NextFrame(d, spf, step);
	ghd.time -= spf;
	if (ghd.time <= 0)
		ghd.d.Free(ghd.d);
}

function GoHomeDecorator_New(s,waitTime)
{
	var ghd = {};
	ghd.d = ghd;
	Decorator_Init(ghd.d);
	ghd.d.NextFrame = GoHomeDecorator_NextFrame;
	ghd.d.Free = GoHomeDecorator_Free;
	ghd.d.WillTerminate = GoHomeDecorator_WillTerminate;
	
	ghd.switchBlock = s;
	ghd.time = waitTime;

	return ghd.d;
}

function Coaster_SwitchGroupiesOn(b)
{
	Coaster_SwitchGroupies(b, TRUE);
}

function Door_DoneOpening(door,time)
{
	return !door.b.group.moving;
}

function Key_DoneOpening(door,time)
{
	return time > .75;
}

function Coaster_MadeItHome(s)
{
var doors = new Array(5);
var doorCount = 0;
var map = Level_GetLevel().map;
var i;

	for (i = 0; i < map.polyGroupCount; i++)
	{
		if (map.polyGroups[i].type != ekEnvironment)
		{
			var b = map.polyGroups[i];
			if (b.iBlockGroup == s.b.iBlockGroup && b != s.b && b.group.type == ekLockedDoor)
			{
				doors[doorCount++] = b;
				if (doorCount >= 5)
					break;
			}
		}
	}

	if (doorCount)
	{
		var done = false;
		for (i = 0; i < doorCount; i++)
		{
			if (doors[i].isHome) // Give priority to opening doors
			{
				Level_AddDecorator(WatchActionDecorator_NewWithCompleteFunc(doors[i], .25, 
				                   Coaster_SwitchGroupiesOn, s, Door_DoneOpening, doors[i]));
				done = true;
				break;
			}
		}

		if (!done)
		{
			Level_AddDecorator(WatchActionDecorator_NewWithCompleteFunc(doors[0], .25, 
					Coaster_SwitchGroupiesOn, s, Door_DoneOpening, doors[0]));
		}
	}

	else
	{
		var camera = Level_GetCamera();
		var blockPos = Matrix_Mult(camera.viewAngle, Vector_Subtract(camera.position, s.b.middle));
		Level_AddDecorator(WatchActionDecorator_NewWithCompleteFuncAndCoords(camera.position, camera.yaw, 
			camera.pitch + atan2(blockPos[1], blockPos[2]) * 180 / 3.14159, .45, .25, Coaster_SwitchGroupiesOn,
			s, Key_DoneOpening, NULL));
	}
}

var CollisionFuncs = [Mover_FindNextCollision,
                      Stepper_FindNextCollision,
                      ToOriginDecorator_FindNextCollision,
                      GoHomeDecorator_FindNextCollision,
                      LockedDoor_FindNextCollision,
                      Switch_FindNextCollision];

var NextFrameFuncs = [StepperDecorator_NextFrame,
                      DoorDecorator_NextFrame,
                      ToOriginDecorator_NextFrame,
                      GoHomeDecorator_NextFrame/*
												 * ,
												 * IndySymbolDecorator_NextFrame
												 */];

function StepperDecorator_Persist(sd)
{
var i;
	
	psBegin(ekStepperDecoratorDataTag);
		psWriteFloatArray(sd.velocity, 3);
		psWriteFloatArray(sd.direction, 3);
		psWriteFloatArray(sd.target, 3);
		psWriteDword(sd.iCollisionGroup);
		psWriteFloatArray(sd.distance, 6);
		psWriteDword(sd.stopMovingSound);
	psEnd(ekStepperDecoratorDataTag)
	
	for (i = 0; i < CollisionFuncs.length; i++)
	{
		if (CollisionFuncs[i] == sd.FindNextCollision)
		{
			psWriteDwordTag(ekStepperDecoratorCollisionFuncTag, i);
			break;
		}
	}
	ASSERT(i < CollisionFuncs.length);
	
	for (i = 0; i < NextFrameFuncs.length; i++)
	{
		if (NextFrameFuncs[i] == sd.d.NextFrame)
		{
			psWriteDwordTag(ekStepperDecoratorNextFrameFuncTag, i);
			break;
		}
	}
	ASSERT(i < NextFrameFuncs.length);
}

function StepperDecorator_ParseTag(sd,tag,length)
{
	switch (tag)
	{
		case ekStepperDecoratorDataTag:
			ASSERT(length == 68);
			// psRead(sd, buf, length);
			sd.velocity = psReadFloatArray(3);
			sd.direction = psReadFloatArray(3);
			sd.target = psReadFloatArray(3);
			sd.iCollisionGroup = psReadDword();
			sd.distance = psReadFloatArray(6);
			sd.stopMovingSound = psReadDword();
			
			Decorator_Init(sd.d);
			sd.d.Free = StepperDecorator_Free;
			break;
		case ekStepperDecoratorCollisionFuncTag:
			sd.FindNextCollision = CollisionFuncs[psReadDword()];
			break;
		case ekStepperDecoratorNextFrameFuncTag:
			sd.d.NextFrame =  NextFrameFuncs[psReadDword()];			
			break;
	}
}

function Stepper_Persist(group)
{
var s = group;
	
	Block_Persist(group);

	psBegin(ekStepperPosTag);
	
	psWriteFloat(s.pos[0]);
	psWriteFloat(s.pos[1]);
	psWriteFloat(s.pos[2]);
	
	psEnd(ekStepperPosTag);	
	
	if (s.b.group.moving)
	{
		psBegin(ekStepperDecoratorTag);
		StepperDecorator_Persist(s.decorator);
		psEnd(ekStepperDecoratorTag);		
	}
}

function Stepper_ParseTag(b,tag,length)
{
var s = b;
	
	switch (tag)
	{
		case ekStepperPosTag:
			s.pos[0] = psReadFloat();
			s.pos[1] = psReadFloat();
			s.pos[2] = psReadFloat();
			Stepper_SyncVerts(s);
			s.isHome = Vector_VeryClose(s.home, s.b.middle, isHomeSlack);			
			break;
		case ekStepperDecoratorTag:
			s.decorator = {};
			s.decorator.d = s.decorator;
			psParse(s.decorator, StepperDecorator_ParseTag, length);
			s.decorator.s = s;
			s.b.group.moving = TRUE;
			Level_AddDecorator(s.decorator.d);
			if (s.collidesWithMoving)
				MovingBlocks_Add(s);
			break;
		default:
			Block_ParseTag(s.b,tag,length);
			break;
	}
}

function Mover_New(type, is_model)
{
	var stepper = {};
	stepper.b = stepper;
	stepper.b.group = stepper.b;
	stepper.b.group.LevelFinishedLoading = Stepper_LevelFinishedLoading;
	stepper.b.group.SetCheckpoint = PolygonGroup_SetCheckpoint;
	stepper.b.group.GotoCheckpoint = PolygonGroup_GotoCheckpoint;
	stepper.b.group.Collide = Stepper_Collide;
	stepper.b.group.Free = Block_Group_Free;
	stepper.b.Free = Block_Free;
	stepper.b.LoadPolys = Stepper_LoadPolys;
	stepper.b.SwitchHit = Block_SwitchHit;
	stepper.b.group.Persist = Block_Persist;
	stepper.b.group.Recover = Block_Recover;
	stepper.b.ParseTag = Block_ParseTag;
	
	stepper.b.group.transparent = FALSE;
	stepper.b.group.is_model = is_model !== undefined ? is_model : TRUE;
	stepper.b.group.moving = FALSE;
	stepper.b.group.polyCount = 0;
	stepper.b.group.bVisible = TRUE;
	stepper.b.group.type = type;
	stepper.b.color = [1,1,1,1];
	stepper.b.group.Persist = Stepper_Persist;
	stepper.b.ParseTag = Stepper_ParseTag;
	stepper.decorator = NULL;

	stepper.startMovingSound = ekSliderSound;
	stepper.stopMovingSound = null;// ekDingSound;
	stepper.madeItHomeSound = ekLeverSound;
	
	return stepper;
}

function Stepper_New()
{
	var s = Mover_New(ekStepper);
	s.collidesWithMoving = TRUE;
	s.FindNextCollision = Stepper_FindNextCollision;
	s.MadeItHome = Stepper_MadeItHome;
	s.CanMove = Mover_CanMove;

	return s;
}

function Coaster_New(is_model)
{
	var s = Mover_New(ekCoaster, is_model);
	s.b.SwitchHit = Coaster_SwitchHit;
	s.FindNextCollision = Mover_FindNextCollision;
	s.collidesWithMoving = TRUE;
	s.MadeItHome = Coaster_MadeItHome;
	s.b.group.LevelFinishedLoading = Coaster_LevelFinishedLoading;
	s.CanMove = Mover_CanMove;

	return s;
}

function Switch_New(is_model)
{
	var s = Coaster_New(is_model);
	s.collidesWithMoving = FALSE;
	s.FindNextCollision = Switch_FindNextCollision;

	s.startMovingSound = ekSwitchSound;

	return s.b;
}

function GangSwitch_New()
{
	var s = Coaster_New();
	s.b.SwitchHit = GangSwitch_SwitchHit;
	s.collidesWithMoving = FALSE;
	s.FindNextCollision = Switch_FindNextCollision;

	s.startMovingSound = ekSwitchSound;

	return s.b;
}

function SpringDoor_New()
{
	var s = Mover_New(ekSpringDoor);
	s.FindNextCollision = Mover_FindNextCollision;
	s.collidesWithMoving = TRUE;
	s.MadeItHome = Stepper_MadeItHome;
	s.b.group.Collide = Door_Collide;
	s.CanMove = SpringDoor_CanMove;
	s.madeItHomeSound =null;
	s.startMovingSound = ekSpringSound;

	return s;
}

function LockedDoor_New(is_model)
{
	var s = Mover_New(ekLockedDoor, is_model);
	s.FindNextCollision = LockedDoor_FindNextCollision;
	s.collidesWithMoving = FALSE;
	s.MadeItHome = Stepper_MadeItHome;
	s.b.group.Collide = Door_Collide;
	s.b.SwitchHit = LockedDoor_SwitchHit;
	s.CanMove = LockedDoor_CanMove;

	s.startMovingSound = ekSwitchSound;
	s.stopMovingSound = ekThudSound;
	s.madeItHomeSound = ekSlamSound;

	return s;
}
