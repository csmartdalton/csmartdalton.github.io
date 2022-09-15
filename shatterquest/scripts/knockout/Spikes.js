var spikeSize = 1.5;
var maxSpikeBalls = 15;
var ekStatic = 0;
var ekDeflective = 1;
var spikeRadius = 0.158;

var spike_program = {};
spike_program.vert_shader =
	"uniform mat4 mvp_matrix;" +
	"uniform vec3 spike_pos;" +
    "uniform vec3 eye_pos;" +
	"varying vec3 map_pos;" +
	"varying float intensity;" +
	
	"attribute vec3 vertex_pos;" +
	"attribute vec3 reflect_dir;" +

	"void main(void)" +
	"{" +
	"	map_pos = vertex_pos + spike_pos;" +
	"	intensity = abs(dot(normalize(vertex_pos + spike_pos - eye_pos), reflect_dir)) * 0.5;" +
	"	gl_Position = mvp_matrix * vec4(vertex_pos + spike_pos,1);" +
	"}";
spike_program.frag_shader =
    "precision highp float;\n" +
    "uniform vec3 spike_pos;" +
    "varying vec3 map_pos;" +
    "varying float intensity;" +

	"void main (void)" +
	"{" +
	"	if (dot(map_pos - spike_pos, map_pos - spike_pos) < " + spikeRadius*spikeRadius + ")" +
	"		discard;" +
	"	gl_FragColor = vec4(vec3(0.3 + intensity), 1.0);" +
	"}";

var spike_die_program = {};
spike_die_program.vert_shader =
	"uniform mat4 mvp_matrix;" +
	"uniform vec3 spike_pos;" +
    "uniform vec3 eye_pos;" +
    "uniform float time;" +
	"varying vec3 map_pos;" +
	"varying float intensity;" +
	
	"attribute vec3 vertex_pos;" +
	"attribute vec3 reflect_dir;" +
	"attribute vec3 velocity;" +

	"void main(void)" +
	"{" +
	"	map_pos = vertex_pos + spike_pos;" +
	"	intensity = abs(dot(normalize(vertex_pos + spike_pos - eye_pos), reflect_dir)) * 0.5;" +
	"	gl_Position = mvp_matrix * vec4(vertex_pos + spike_pos + time*velocity, 1);" +
	"}";
spike_die_program.frag_shader = spike_program.frag_shader;

var spike_shard_program = {};
spike_shard_program.vert_shader =
	"uniform mat4 mvp_matrix;" +
	"uniform vec3 spike_pos;" +
	"uniform float time;" +
	
	"attribute vec4 shard_pos;" +

	"void main(void)" +
	"{" +
	"	gl_Position = mvp_matrix * vec4((1.0 + 5.0*time) * shard_pos.xyz + spike_pos, 1);" +
	"	gl_PointSize = shard_pos.w;" +
	"}";
spike_shard_program.frag_shader =
    "precision highp float;\n" +
	"void main (void)" +
	"{" +
	"	gl_FragColor = vec4(0,0,0,1);" +
	"}";

function SpikeShatterDecorator_Free(d)
{
var sd = d;

	gl.deleteBuffer(sd.velocityVbo);
	gl.deleteBuffer(sd.shardVbo);
	Decorator_Free(d);
}

function SpikeShatterDecorator_NextFrame(d,spf,step)
{
var sd = d;
var i;
		
	BaseDecorator_NextFrame(d, spf, step);
	
	sd.time += spf;
	if (sd.time > 2)
		sd.d.Free(sd.d);
}

function SpikeShatterDecorator_Draw(d,mask)
{
var sd = d;
var camPos = Nova_GetPosition();
var pos = [sd.start_pos[0] + sd.velocity[0]*sd.time,
           sd.start_pos[1] + sd.velocity[1]*sd.time,
           sd.start_pos[2] + sd.velocity[2]*sd.time - sd.accel/2*sd.time*sd.time];

	Nova_UseProgram(spike_shard_program);
	Nova_LoadModelMatrix();
	gl.bindBuffer(gl.ARRAY_BUFFER, sd.shardVbo);
	gl.vertexAttribPointer(spike_shard_program.shard_ptr,4,gl.FLOAT,gl.FALSE,0,0);
	gl.uniform3f(spike_shard_program.spike_pos,pos[0],pos[1],pos[2]);
	gl.uniform1f(spike_shard_program.time, sd.time);
	gl.drawArrays(gl.POINTS, 0, sd.shardCount);
	
	Nova_UseProgram(spike_die_program);
	gl.bindBuffer(gl.ARRAY_BUFFER, g_spikeVbo);
	gl.vertexAttribPointer(spike_die_program.vertex_ptr,3,gl.FLOAT,gl.FALSE,0,0);
	gl.bindBuffer(gl.ARRAY_BUFFER, g_spikeNormVbo);
	gl.vertexAttribPointer(spike_die_program.reflect_dir_ptr,3,gl.FLOAT,gl.FALSE,0,0);
	gl.bindBuffer(gl.ARRAY_BUFFER, sd.velocityVbo);
	gl.vertexAttribPointer(spike_die_program.velocity_ptr,3,gl.FLOAT,gl.FALSE,0,0);
	gl.uniform3f(spike_die_program.spike_pos,pos[0],pos[1],pos[2]);
	gl.uniform1f(spike_die_program.time, sd.time);
	gl.drawArrays(gl.TRIANGLES, 0, 9 * (12 + 20));
	Nova_EndSpecialDraw();
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	Nova_LoadScreenMatrix();

	BaseDecorator_Draw(d, mask);
}

function ShatterDecorator_FromSpike(spike,velocity,shardCount)
{
var i;
	
	var sd = {};
	sd.d = sd;
	Decorator_Init(sd.d);
	
	sd.d.NextFrame = SpikeShatterDecorator_NextFrame;
	sd.d.Draw = SpikeShatterDecorator_Draw;
	sd.d.Free = SpikeShatterDecorator_Free;
	
	sd.shardCount = shardCount;
	var shards = new Array(4*sd.shardCount);
	for (i = 0; i < sd.shardCount; i++)
	{
		var pos = randVec();
		while (Vector_Dot(pos,pos) > 1)
			pos = randVec();
		pos = Vector_Scale(pos, spikeRadius);
		shards[0 + 4*i] = pos[0];
		shards[1 + 4*i] = pos[1];
		shards[2 + 4*i] = pos[2];
		shards[3 + 4*i] = min(ScreenWidth,ScreenHeight)/512 * (4 + Math.random()*16);
	}
	sd.shardVbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, sd.shardVbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shards), gl.STATIC_DRAW);
	
	var vels = new Array(3*9*32);
	for (var i = 0; i < 32; i++)
	{
		for (var j = 0; j < 9; j++)
		{
			var idx = 3*(9*i + j);
			vels[0+idx] = spikePoints[i][0];
			vels[1+idx] = spikePoints[i][1];
			vels[2+idx] = spikePoints[i][2];
		}
	}
	sd.velocityVbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, sd.velocityVbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vels), gl.STATIC_DRAW);
	
	sd.velocity = velocity;
	sd.accel = 6;
	sd.start_pos = arrdup(spike.sphere.position);
	
	sd.time = 0;
	
	return sd;
}

function StaticSpike_Reverse(sb)
{
	var vcTmp = arrdup(sb.prevCollision);
	var pnTmp = sb.prevPlane;
	var iColgTmp = sb.iPrevCollision;
	
	ASSERT(sb.type == ekStatic);
	
	sb.prevCollision = arrdup(sb.nextCollision);
	sb.nextCollision = vcTmp;					
	sb.prevPlane = sb.collisionPlane;
	sb.collisionPlane = pnTmp;
	sb.iPrevCollision = sb.iCollisionGroup;
	sb.iCollisionGroup = iColgTmp;
	sb.velocity = Vector_Negate(sb.velocity);
}

function SpikeBalls_NextFrame(d,spf,step)
{
var i, j;
	if (!level.spikesMoving)
	{
		BaseDecorator_NextFrame(d, spf, step);
		return;
	}

	for (i = 0; i < level.map.spikeCount; i++)
	{
		for (j = i + 1; j < level.map.spikeCount; j++)
		{
			var iNextPos = Vector_AddScale(level.map.spikeBalls[i].sphere.position, level.map.spikeBalls[i].velocity, spf * step * 1.5);
			var jNextPos = Vector_AddScale(level.map.spikeBalls[j].sphere.position, level.map.spikeBalls[j].velocity, spf * step * 1.5);
			var diff = Vector_Subtract(iNextPos, jNextPos);
			var len = level.map.spikeBalls[i].sphere.radius + level.map.spikeBalls[j].sphere.radius;
			if (Vector_Dot(diff, diff) < len * len)
			{
				diff = Vector_Subtract(level.map.spikeBalls[i].sphere.position, level.map.spikeBalls[j].sphere.position);
				if (level.map.spikeBalls[i].type == ekDeflective && level.map.spikeBalls[j].type == ekDeflective)
				{
					var iV, jV;
					var tries = 0;
					var iRel2j = Vector_Subtract(level.map.spikeBalls[i].velocity, level.map.spikeBalls[j].velocity);
					var v = Vector_Normalize(Vector_Subtract(level.map.spikeBalls[i].sphere.position, level.map.spikeBalls[j].sphere.position));
					
					var xFer = Vector_Scale(v, Vector_Dot(iRel2j, v));
					iV = Vector_Subtract(level.map.spikeBalls[i].velocity, xFer);
					jV = Vector_Add(level.map.spikeBalls[j].velocity, xFer);
					
					Spike_SetVelocity(level.map.spikeBalls[i], iV);
					Spike_SetVelocity(level.map.spikeBalls[j], jV);					

					while (Vector_Dot(diff, diff) - 0.001 <= len * len && tries++ < 25)
					{
						level.map.spikeBalls[i].sphere.position = Vector_AddScale(level.map.spikeBalls[i].sphere.position, iV, 1.0/60.0);
						level.map.spikeBalls[j].sphere.position = Vector_AddScale(level.map.spikeBalls[j].sphere.position, jV, 1.0/60.0);						
						diff = Vector_Subtract(level.map.spikeBalls[i].sphere.position, level.map.spikeBalls[j].sphere.position);
					}
				}
				else if (level.map.spikeBalls[i].type == ekDeflective)
				{
					var tries = 0;
					var v = Vector_Scale(Vector_Normalize(Vector_Subtract(level.map.spikeBalls[j].velocity, level.map.spikeBalls[i].velocity)), Vector_Length(level.map.spikeBalls[i].velocity));
					Spike_SetVelocity(level.map.spikeBalls[i], v);
					while (Vector_Dot(diff, diff) - 0.001 <= len * len && tries++ < 25)
					{
						level.map.spikeBalls[i].sphere.position = Vector_AddScale(level.map.spikeBalls[i].sphere.position, v, 1.0/60.0);
						diff = Vector_Subtract(level.map.spikeBalls[i].sphere.position, level.map.spikeBalls[j].sphere.position);
					}
				}
				else if (level.map.spikeBalls[j].type == ekDeflective)
				{
					var tries = 0;					
					var v = Vector_Scale(Vector_Normalize(Vector_Subtract(level.map.spikeBalls[i].velocity, level.map.spikeBalls[j].velocity)), Vector_Length(level.map.spikeBalls[j].velocity));
					Spike_SetVelocity(level.map.spikeBalls[j], v);					
					while (Vector_Dot(diff, diff) - 0.001 <= len * len && tries++ < 25)
					{
						level.map.spikeBalls[j].sphere.position = Vector_AddScale(level.map.spikeBalls[j].sphere.position, v, 1.0/60.0);
						diff = Vector_Subtract(level.map.spikeBalls[i].sphere.position, level.map.spikeBalls[j].sphere.position);
					}
				}
				else
				{
					var tries = 0;
					if (Vector_Dot(jNextPos, level.map.spikeBalls[i].velocity) > Vector_Dot(iNextPos, level.map.spikeBalls[i].velocity))
						StaticSpike_Reverse(level.map.spikeBalls[i]);
					if (Vector_Dot(iNextPos, level.map.spikeBalls[j].velocity) > Vector_Dot(jNextPos, level.map.spikeBalls[j].velocity))					
						StaticSpike_Reverse(level.map.spikeBalls[j]);				  
					
					while (Vector_Dot(diff, diff) - 0.001 <= len * len && tries++ < 25)
					{
						level.map.spikeBalls[i].sphere.position = Vector_AddScale(level.map.spikeBalls[i].sphere.position, level.map.spikeBalls[i].velocity, 1.0/60.0);
						level.map.spikeBalls[j].sphere.position = Vector_AddScale(level.map.spikeBalls[j].sphere.position, level.map.spikeBalls[j].velocity, 1.0/60.0);						
						diff = Vector_Subtract(level.map.spikeBalls[i].sphere.position, level.map.spikeBalls[j].sphere.position);
					}
				}

				{var v = Vector_Subtract(ball.sphere.position, level.map.spikeBalls[i].sphere.position);
				if (Vector_Dot(v, v) < 1.5*1.5)
					Sound_Play3D(ekDingSound, level.map.spikeBalls[i].sphere.position);
				else if (Vector_Dot(v, v) < 3*3)
					Sound_Play3D(ekDingDistantSound, level.map.spikeBalls[i].sphere.position);
				}
			}
		}		
	}
	
	for (i = 0; i < level.map.spikeCount; i++)
	{
		if (ball.bMoving)
		{
			var d = Vector_Subtract(level.map.spikeBalls[i].sphere.position, ball.sphere.position);
			var r = level.map.spikeBalls[i].sphere.radius + ball.sphere.radius;
			if (Vector_Dot(d, d) <  (r * r))
			{
				if (ball.bInvincible ||
					 Color_Equals(ball.sphere.primitive.color, level.map.spikeBalls[i].color))
				{
					Level_AddDecorator(ShatterDecorator_FromSpike(
						level.map.spikeBalls[i], 
						Vector_Normalize(Vector_Add(ball.velocity, level.map.spikeBalls[i].velocity)), 
						75));
					Sound_Play3D(ekExtraGuySound, level.map.spikeBalls[i].sphere.position);
					Sound_Play(ekSpeedupSound);
					Words_Show(level.map.spikeBalls[i].sphere.position, ekJobOrForRealsWord);
					level.map.spikeCount--;
					for (j = i; j < level.map.spikeCount; j++)
						level.map.spikeBalls[j] = level.map.spikeBalls[j+1];
					i--;
					game_listener.blockBroken(ekSpikeBall);
					continue;
				}
				else
				{
					Level_AddDecorator(DieDecorator_NewHidingSpike(1, 1, 1, 1.5, 0, 3, FALSE, i));
					Sound_Play(ekBombSound);
				}
			}
		}

		level.map.spikeBalls[i].sphere.position = 
			Vector_AddScale(level.map.spikeBalls[i].sphere.position, level.map.spikeBalls[i].velocity, spf * step * 1.5);
		if (level.map.spikeBalls[i].iCollisionGroup == -1)
		{
			var maxDiff = Vector_Subtract(level.map.spikeBalls[i].sphere.position, level.max);
			var minDiff = Vector_Subtract(level.min, level.map.spikeBalls[i].sphere.position);
			var max = 10;
			if (minDiff[0] > max || minDiff[1] > max || minDiff[2] > max || maxDiff[0] > max || maxDiff[1] > max || maxDiff[2] > max)
			{
				level.map.spikeCount--;
				for (j = i; j < level.map.spikeCount; j++)
				{
					level.map.spikeBalls[j] = level.map.spikeBalls[j + 1];
				}
				i--;
			}
		}
		else if (Vector_Dot(level.map.spikeBalls[i].sphere.position, level.map.spikeBalls[i].velocity) > 
			 Vector_Dot(level.map.spikeBalls[i].nextCollision, level.map.spikeBalls[i].velocity))
		{
			level.map.spikeBalls[i].sphere.position = arrdup(level.map.spikeBalls[i].nextCollision);				
			if (level.map.spikeBalls[i].type == ekStatic)
				StaticSpike_Reverse(level.map.spikeBalls[i]);
			else
				Spike_Deflect(level.map.spikeBalls[i], level.map.spikeBalls[i].collisionPlane.normal);
			
			// Play sound if close
			if (i != level.spikeHiding)
			{
				var v = Vector_Subtract(ball.sphere.position, level.map.spikeBalls[i].sphere.position);
				if (Vector_Dot(v, v) < 1.5*1.5)
					Sound_Play3D(ekDingSound, level.map.spikeBalls[i].sphere.position);
				else if (Vector_Dot(v, v) < 3*3)
					Sound_Play3D(ekDingDistantSound, level.map.spikeBalls[i].sphere.position);
			}
		}	
	}
		
	BaseDecorator_NextFrame(d, spf, step);
}

var icosahedronVertices = [
	[0, -0.525731, 0.850651],
	[0.850651, 0, 0.525731],
	[0.850651, 0, -0.525731],
	[-0.850651, 0, -0.525731],
	[-0.850651, 0, 0.525731],
	[-0.525731, 0.850651, 0],
	[0.525731, 0.850651, 0],
	[0.525731, -0.850651, 0],
	[-0.525731, -0.850651, 0],
	[0, -0.525731, -0.850651],
	[0, 0.525731, -0.850651],
	[0, 0.525731, 0.850651]
   ];
   var icosahedronFaces = [
	1, 2, 6,
	1, 7, 2,
	3, 4, 5,
	4, 3, 8,
	6, 5, 11,
	5, 6, 10,
	9, 10, 2,
	10, 9, 3,
	7, 8, 9,
	8, 7, 0,
	11, 0, 1,
	0, 11, 4,
	6, 2, 10,
	1, 6, 11,
	3, 5, 10,
	5, 4, 11,
	2, 7, 9,
	7, 1, 0,
	3, 9, 8,
	4, 8, 0,
];
var spikePoints = new Array(12 + 20);
var g_spikeVbo;
var g_spikeNormVbo;
var bInited = FALSE;
function SpikeBalls_Draw(d,mask)
{
var i, j;
var diff = [0,0,0], curPos = [0,0,0];
var camPos = Nova_GetPosition();
var zK;
var v;

	m = Nova_GetViewAngle();
	zK = Vector_Dot(m[2], camPos);
	if (!bInited)
	{
		var spikeTris = new Array(9 * (12 + 20));
		for (j = 0; j < 12; j++)
			spikePoints[j] = icosahedronVertices[j];
		for (j = 0; j < 20; j++)
			spikePoints[12 + j] = Vector_Normalize(
				 Vector_Add(icosahedronVertices[icosahedronFaces[3 * j]], Vector_Add(icosahedronVertices[icosahedronFaces[3 * j + 1]], icosahedronVertices[icosahedronFaces[3 * j + 2]])));
		for (j = 0; j < 12 + 20; j++)
		{
			var tip = Vector_Scale(spikePoints[j], spikeRadius*spikeSize);
			var centroid = Vector_Scale(spikePoints[j], spikeRadius*0.8);
			
			var vZ = Vector_Normalize(Vector_Subtract(tip, centroid));
			var vY = Vector_Cross(vZ, randVec());
			while (Vector_Dot(vY,vY) < 0.00001)
				vY = Vector_Cross(vZ, randVec());
			vY = Vector_Normalize(vY);
			var vX = Vector_Cross(vY, vZ);
			
			var height = 0.025;
			var tri = [Vector_Add(centroid, Vector_Scale(vY, 2*height/3)),
			           Vector_Add(Vector_Add(centroid, Vector_Scale(vY, -height/3)), Vector_Scale(vX, height/Math.sqrt(3))),
			           Vector_Add(Vector_Add(centroid, Vector_Scale(vY, -height/3)), Vector_Scale(vX, -height/Math.sqrt(3)))];
			
			spikeTris[9 * j + 0] = tip;
			spikeTris[9 * j + 1] = tri[0];
			spikeTris[9 * j + 2] = tri[1];
			spikeTris[9 * j + 3] = tip;
			spikeTris[9 * j + 4] = tri[1];
			spikeTris[9 * j + 5] = tri[2];
			spikeTris[9 * j + 6] = tip;
			spikeTris[9 * j + 7] = tri[2];
			spikeTris[9 * j + 8] = tri[0];
		}
		
		var data = new Array(3 * 9*(12 + 20));
		for (i = 0; i < 9*(12 + 20); i++)
		{
			data[3*i + 0] = spikeTris[i][0];
			data[3*i + 1] = spikeTris[i][1];
			data[3*i + 2] = spikeTris[i][2];
		}

		g_spikeVbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, g_spikeVbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		
		var norms = new Array(9*(12 + 20));
		for (i = 0; i < 3*(12 + 20); i++)
		{
			var norm = Vector_Cross(Vector_Subtract(spikeTris[3*i + 0], spikeTris[3*i + 1]),
									Vector_Subtract(spikeTris[3*i + 0], spikeTris[3*i + 2]));
			norm = Vector_Normalize(norm);
			var light_dir = Level_GetLevel().map.lightDir;
			var reflect_dir = Vector_Subtract(light_dir, Vector_Scale(norm, 2.0*Vector_Dot(light_dir, norm)));
			norms[3*i + 0] = norms[3*i + 1] = norms[3*i + 2] = Vector_Normalize(reflect_dir);
		}
		for (i = 0; i < 9*(12 + 20); i++)
		{
			data[3*i + 0] = norms[i][0];
			data[3*i + 1] = norms[i][1];
			data[3*i + 2] = norms[i][2];
		}
		g_spikeNormVbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, g_spikeNormVbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

		bInited = TRUE;
	}
	
	Nova_BeginSpheres();
	for (i = 0; i < level.map.spikeCount; i++)
	{
		if (level.spikeHiding != i)
			Nova_DrawSphere(level.map.spikeBalls[i].sphere);
	}
	Nova_EndSpheres();
	
	Nova_UseProgram(spike_program);
	Nova_LoadModelMatrix();
	gl.bindBuffer(gl.ARRAY_BUFFER, g_spikeVbo);
	gl.vertexAttribPointer(spike_program.vertex_ptr,3,gl.FLOAT,gl.FALSE,0,0);
	gl.bindBuffer(gl.ARRAY_BUFFER, g_spikeNormVbo);
	gl.vertexAttribPointer(spike_program.reflect_dir_ptr,3,gl.FLOAT,gl.FALSE,0,0);
	//Nova_BeginSolidColor(level.map.spikeBalls[0].color[0],level.map.spikeBalls[0].color[1],level.map.spikeBalls[0].color[2],1);
	gl.uniform3f(spike_program.eye_pos,camPos[0],camPos[1],camPos[2]);
	for (i = 0; i < level.map.spikeCount; i++)
	{
		if (i != level.spikeHiding)
		{
			var pos = level.map.spikeBalls[i].sphere.position;
			gl.uniform3f(spike_program.spike_pos,pos[0],pos[1],pos[2]);
			gl.drawArrays(gl.TRIANGLES, 0, 9 * (12 + 20));
		}
	}
	Nova_EndSpecialDraw();
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	Nova_LoadScreenMatrix();
	
	BaseDecorator_Draw(d, mask);
}

function Spike_New()
{
	var spike = {sphere:Sphere_New()};
	spike.sphere.primitive.pTexture = NullTexture.value();
	spike.sphere.radius = spikeRadius;
	spike.sphere.primitive.color = [0,0,0,1.0];
	
	return spike;
}

function SpikeBalls_CollisionGroupChanged(iGroup)
{
var i;

	for (i = 0; i < level.map.spikeCount; i++)
	{
		if (level.map.spikeBalls[i].iCollisionGroup == iGroup || 
			 (level.map.spikeBalls[i].iPrevCollision == iGroup && level.map.spikeBalls[i].type == ekStatic))
		{
			Spike_FindCollisions(level.map.spikeBalls[i]);
		}
	}
}

function Spike_SetVelocity(sb,vel)
{
	sb.prevCollision = arrdup(sb.nextCollision);
	sb.velocity = arrdup(vel);
	Spike_FindCollisions(sb);
}

function Spike_Deflect(sb,dir)
{
	Spike_SetVelocity(sb, Vector_Subtract(sb.velocity, 
		Vector_Scale(dir, Vector_Dot(sb.velocity, dir) * 2)));
}

function Spike_FindCollisions(sb)
{
	var poly;
	if (sb.type == ekStatic)
	{
		var mid = Vector_Scale(Vector_Add(sb.prevCollision, sb.nextCollision), 0.5);
		var coll = Level_FindNextCollision(mid, sb.sphere.radius * spikeSize, Vector_Negate(sb.velocity), FALSE);
		sb.prevCollision = coll.pos;
		sb.iPrevCollision = coll.group;
		if (coll.poly) sb.prevPlane = coll.poly.plane;
		
		coll = Level_FindNextCollision(mid, sb.sphere.radius * spikeSize, sb.velocity, FALSE);
		sb.nextCollision = coll.pos;
		sb.iCollisionGroup = coll.group;
		if (coll.poly) sb.collisionPlane = coll.poly.plane;
	}
	else
	{
		var coll = Level_FindNextCollision(sb.sphere.position, sb.sphere.radius * spikeSize, FALSE);
		sb.nextCollision = coll.pos;
		sb.iCollisionGroup = coll.group;
		if (coll.poly) sb.collisionPlane = coll.poly.plane;
	}
}

function Spikes_Initialize()
{
	checkGlErrors();
	spike_program.id = compile(spike_program.vert_shader, spike_program.frag_shader);
	spike_program.vertex_ptr = gl.getAttribLocation(spike_program.id,"vertex_pos");
	spike_program.reflect_dir_ptr = gl.getAttribLocation(spike_program.id,"reflect_dir");
	spike_program.arrays = [spike_program.vertex_ptr, spike_program.reflect_dir_ptr];
	spike_program.matrix = gl.getUniformLocation(spike_program.id, "mvp_matrix");
	spike_program.spike_pos = gl.getUniformLocation(spike_program.id, "spike_pos");
	spike_program.eye_pos = gl.getUniformLocation(spike_program.id, "eye_pos");
	
	spike_die_program.id = compile(spike_die_program.vert_shader, spike_die_program.frag_shader);
	spike_die_program.vertex_ptr = gl.getAttribLocation(spike_die_program.id,"vertex_pos");
	spike_die_program.reflect_dir_ptr = gl.getAttribLocation(spike_die_program.id,"reflect_dir");
	spike_die_program.velocity_ptr = gl.getAttribLocation(spike_die_program.id,"velocity");
	spike_die_program.arrays = [spike_die_program.vertex_ptr, spike_die_program.reflect_dir_ptr, spike_die_program.velocity_ptr];
	spike_die_program.matrix = gl.getUniformLocation(spike_die_program.id, "mvp_matrix");
	spike_die_program.spike_pos = gl.getUniformLocation(spike_die_program.id, "spike_pos");
	spike_die_program.eye_pos = gl.getUniformLocation(spike_die_program.id, "eye_pos");
	spike_die_program.time = gl.getUniformLocation(spike_die_program.id, "time");
	
	spike_shard_program.id = compile(spike_shard_program.vert_shader, spike_shard_program.frag_shader);
	spike_shard_program.shard_ptr = gl.getAttribLocation(spike_shard_program.id,"shard_pos");
	spike_shard_program.arrays = [spike_shard_program.shard_ptr];
	spike_shard_program.matrix = gl.getUniformLocation(spike_shard_program.id, "mvp_matrix");
	spike_shard_program.spike_pos = gl.getUniformLocation(spike_shard_program.id, "spike_pos");
	spike_shard_program.time = gl.getUniformLocation(spike_shard_program.id, "time");	
	checkGlErrors();
}

function Spikes_LevelFinishedLoading()
{
}
