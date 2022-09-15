var bspVbos = {verts:null, coords:null, colors:null};

var bspGlVertCount = 0;

var g_map;
var g_pos;
var g_mask;

function Intersect(p,v1,v2)
{
	var d = (p.k - GLV_DotV(v1, p.normal)) / GLV_DotV(GLV_Subtract(v2, v1), p.normal);
	return GLV_Add(v1, GLV_Scale(GLV_Subtract(v2, v1), d));
}

function SetGlIndices(n)
{
	var i;
	n.poly.indices = 3 * (n.poly.sides - 2);
	var indices = new Array(n.poly.indices);
	n.index0 = indices[0] = bspGlVertCount;
	bspGlVertCount += n.poly.indices; 
	for (i = 2; i < n.poly.indices; i++)
	{
		indices[(3 * (i - 2))] = indices[0];
		indices[(3 * (i - 2)) + 1] = indices[0] + i - 1;
		indices[(3 * (i - 2)) + 2] = indices[0] + i;
	}
	n.poly.pTriIndices = new Uint16Array(indices);
}

function Insert(parent,n)
{
var i;
var ctBehind = 0, ctInFront = 0;	
	
	ASSERT(n.left == null);
	ASSERT(n.right == null);
	ASSERT(n.parallel == null);	
	
	if (parent == NULL)
	{
		SetGlIndices(n);
		return n;
	}
	
	for (i = 0; i < n.poly.sides; i++)
	{
		var d = parent.poly.plane.k - (GLV_DotV(n.pGlVerts[i], parent.poly.plane.normal));
		if (d > 0.001)
			ctInFront++;
		else if (d < -0.001)
			ctBehind++;
	}
	
	if (ctInFront == 0 && ctBehind == 0)
	{
		SetGlIndices(n);
		n.parallel = parent.parallel;
		parent.parallel = n;
		
		if (Vector_Dot(n.poly.plane.normal, parent.poly.plane.normal) < 0)
			n.poly.primitive.flags ^= (Nova_fCullBack | Nova_fCullFront);
		
		n.poly.plane = parent.poly.plane;
	}
	else if (ctInFront == 0)
	{
		parent.left = Insert(parent.left, n);
	}
	else if (ctBehind == 0)
	{
		parent.right = Insert(parent.right, n);
	}
	else
	{
		var n2 = {};  
		var v = new Array(n.poly.sides);//(GLVERTEX*)my_malloc(n.poly.sides * sizeof(GLVERTEX));
		var pos = new Array(n.poly.sides);//(int*)my_malloc(n.poly.sides * sizeof(int));
		var vFront = new Array(1+n.poly.sides);//(GLVERTEX*)my_malloc((1 + n.poly.sides) * sizeof(GLVERTEX));
		var vBack = new Array(1+n.poly.sides);//(GLVERTEX*)my_malloc((1 + n.poly.sides) * sizeof(GLVERTEX));		
		var i;
		
		for (i = 0; i < n.poly.sides; i++)
			v[i] = arrdup(n.pGlVerts[i]);
		
		ctInFront = ctBehind = 0;
		for (i = 0; i < n.poly.sides; i++)
		{
			var d = parent.poly.plane.k - (GLV_DotV(v[i], parent.poly.plane.normal));
			if (d > 0.001)
				pos[i] = 1;
			else if (d < -0.001)
				pos[i] = -1;
			else
				pos[i] = 0;
			
			if (pos[i] == 0)
			{
				vFront[ctInFront++] = vBack[ctBehind++] = v[i];
			}
			else if (pos[i] == 1)
			{
				if (i > 0 && pos[i - 1] == -1)
					vFront[ctInFront++] = vBack[ctBehind++] = Intersect(parent.poly.plane, v[i], v[i - 1]);

				ASSERT(!i || fabs(n.poly.plane.k - GLV_DotV( vFront[ctInFront - 1], n.poly.plane.normal)) < 0.001);
				
				vFront[ctInFront++] = v[i];
			}
			else
			{
				if (i > 0 && pos[i - 1] == 1)
					vFront[ctInFront++] = vBack[ctBehind++] = Intersect(parent.poly.plane, v[i], v[i - 1]);
				
				ASSERT(!i || fabs(n.poly.plane.k - GLV_DotV(vBack[ctBehind - 1], n.poly.plane.normal)) < 0.001);
																						 
				vBack[ctBehind++] = v[i];
			}
		}
		
		if (pos[0] != 0 && pos[n.poly.sides - 1] != 0 && pos[0] != pos[n.poly.sides - 1])
			vFront[ctInFront++] = vBack[ctBehind++] = Intersect(parent.poly.plane, v[0], v[n.poly.sides - 1]);
		
		ASSERT(fabs(n.poly.plane.k - GLV_DotV(vBack[ctBehind - 1], n.poly.plane.normal)) < 0.001);
		if (ctBehind - 1 > n.poly.sides || ctInFront - 1 > n.poly.sides)
			ASSERT(0);
		
		for (i = 0; i < n.poly.sides; i++)
		{
			var j;
			var b = FALSE;
			for (j = 0; j < ctInFront; j++)
			{
				if (v[i][0] == vFront[j][0] && v[i][1] == vFront[j][1] && v[i][2] == vFront[j][2])
					b = TRUE;
			}
			
			for (j = 0; j < ctBehind; j++)
			{
				if (v[i][0] == vBack[j][0] && v[i][1] == vBack[j][1] && v[i][2] == vBack[j][2])
					b = TRUE;
			}
			
			ASSERT(b);
		}
			
		
		n.poly.sides = ctInFront;
		n.pGlVerts = new Array(ctInFront);
		for (i = 0; i < ctInFront; i++)
			n.pGlVerts[i] = arrdup(vFront[i]);
		
		n2 = shallowCopy(n);
		n2.poly = Polygon_Clone(n.poly);
		n2.poly.sides = ctBehind;
		n2.pGlVerts = new Array(ctBehind);
		for (i = 0; i < ctBehind; i++)
			n2.pGlVerts[i] = arrdup(vBack[i]);
		
		ASSERT(n.poly.sides >= 3);
		ASSERT(n2.poly.sides >= 3);
		
		parent.right = Insert(parent.right, n);
		parent.left = Insert(parent.left, n2);
	}
	
	return parent;
}

function Map_BuildBspTree(map)
{
	var i,j,noct,ysct;
	//var polyBufSize = 6 * map.polyGroupCount;
	var pPolys = [];//(Nova_Polygon**)my_malloc(polyBufSize * sizeof(Nova_Polygon**));
	var pGroups = [];//(PolygonGroup**)my_malloc(polyBufSize * sizeof(PolygonGroup**)); 
	var polyCount = 0;
	
	bspGlVertCount = 0;
	map.bspTree = null;
	g_map = map;
	noct = 0;
	ysct = 0;
	for (j = 1; j < map.polyGroupCount; j++)
	{
		var pGroup = map.polyGroups[j];
		
		if (pGroup.transparent)
		{
//			ASSERT(pGroup.type == ekBlock || pGroup.type == ekCheckpoint || pGroup.type == ekKiller);
			ASSERT(pGroup.polyCount == 6);
			for (i = 0; i < pGroup.polyCount; i++)
			{
				pGroups.push(pGroup);
				pPolys.push(pGroup.polys[i]);
			}
			ysct++;
		}
		else
		{
			noct++;
		}
	}
	
	var polyCount = pPolys.length;
	if (map.bspOrderCount == polyCount)
	{
		for (i = 0; polyCount > 0; i++,polyCount--)
		{
			ASSERT(map.bspOrder[i] < polyCount);
			var j;
			var p = Polygon_Clone(pPolys[map.bspOrder[i]]);
			var n = {poly:p, left:null, right:null};
			n.pGlVerts = new Array(p.indices);
			var hit = new Array(p.sides);
			for (j = 0; j < p.sides; j++)
				hit[j] = FALSE;
			for (j = 0; j < p.sides; j++)
			{
				var k;
				for (k = 0; k < p.indices; k++)
				{
					if (fabs(p.vertex[j][0] - p.pGLVerts[p.pTriIndices[k]][0]) < 0.0001 &&
						 fabs(p.vertex[j][1] - p.pGLVerts[p.pTriIndices[k]][1]) < 0.0001 &&
						 fabs(p.vertex[j][2] - p.pGLVerts[p.pTriIndices[k]][2]) < 0.0001)
					{
						n.pGlVerts[j] = arrdup(p.pGLVerts[p.pTriIndices[k]]);
						hit[j] = TRUE;						
						bspGlVertCount++;
						break;
					}
				}

				// Make sure the vertex has a matching glvert
				ASSERT(k < p.indices);
			}
			for (j = 0; j < p.sides; j++)
			{
				var d = p.plane.k - /*Vector_Dot(p.vertex[j], p.plane.normal);*/ GLV_DotV(n.pGlVerts[j], p.plane.normal);
				ASSERT(fabs(d) < 0.001);
				ASSERT(hit[j]);
			}
			n.poly.vertex = NULL;
			n.pGroup = pGroups[map.bspOrder[i]];
			n.poly.pTriIndices = NULL;
			n.poly.indices = 0;
			
			map.bspTree = Insert(map.bspTree, n);
			
			for (j = map.bspOrder[i]; j + 1 < polyCount; j++)
			{
				pPolys[j] = pPolys[j + 1];
				pGroups[j] = pGroups[j + 1];
			}
		}
		Bsp_GenVbos();
	}
	else  
	{
		ASSERT(0);
	}
}

function Bsp_ForEach(visitor,node) {
	if (!node) node = g_map.bspTree;
	if (node.left) Bsp_ForEach(visitor,node.left);
	visitor(node);
	if (node.parallel) Bsp_ForEach(visitor,node.parallel);
	if (node.right) Bsp_ForEach(visitor,node.right);
}

function Bsp_GenVbos()
{
	var bspGlVerts = [];
	var verts = new Array(bspGlVertCount);
	var coords = new Array(bspGlVertCount);
	var colors = new Array(bspGlVertCount);
	
	Bsp_ForEach(function(n) {
		n.poly.pGLVerts = bspGlVerts;
		n.poly.vbos = bspVbos;
		for (var i = 0; i < n.poly.sides; i++) {
			var glvert = n.pGlVerts[i];
			
			verts[3*(n.index0 + i) + 0] = glvert[0];
			verts[3*(n.index0 + i) + 1] = glvert[1];
			verts[3*(n.index0 + i) + 2] = glvert[2];
			
			coords[2*(n.index0 + i) + 0] = glvert[7];
			coords[2*(n.index0 + i) + 1] = glvert[8];
			
			var a = glvert[6] ? glvert[6]/255 : 1;
			colors[4*(n.index0 + i) + 0] = glvert[3]*a;
			colors[4*(n.index0 + i) + 1] = glvert[4]*a;
			colors[4*(n.index0 + i) + 2] = glvert[5]*a;
			colors[4*(n.index0 + i) + 3] = glvert[6];
		}
	});
	
	if (bspVbos.verts) gl.deleteBuffer(bspVbos.verts);
	bspVbos.verts = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, bspVbos.verts);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
	
	if (bspVbos.coords) gl.deleteBuffer(bspVbos.coords);
	bspVbos.coords = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, bspVbos.coords);
	gl.bufferData(gl.ARRAY_BUFFER, new Int16Array(coords), gl.DYNAMIC_DRAW);
	
	if (bspVbos.colors) gl.deleteBuffer(bspVbos.colors);
	bspVbos.colors = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, bspVbos.colors);
	gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(colors), gl.DYNAMIC_DRAW);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function Bsp_TransformTexCoords(group,transform,sParam,tParam)
{
	ASSERT(group.type != ekEnvironment && group.index != 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, bspVbos.coords);
	Bsp_ForEach(function(n) {
		if (n.pGroup == group)
		{
			var coords = new Array(2*n.poly.sides);
			for (var j = 0; j < n.poly.sides; j++)
			{
				var c = transform(group, n.pGlVerts[j][7], n.pGlVerts[j][8], sParam, tParam);
				n.pGlVerts[j][7] = coords[2*j + 0] = c.s;
				n.pGlVerts[j][8] = coords[2*j + 1] = c.t;
			}
			gl.bufferSubData(gl.ARRAY_BUFFER, 2*2*n.index0, new Uint16Array(coords));
		}
	});
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function UpdateCoords(block,s,t,sParam,tParam)
{
	return {s:sParam+s, t:tParam+t};
}

function Bsp_UpdateTexCoords(group,ds,dt)
{
	Bsp_TransformTexCoords(group, UpdateCoords, ds, dt);
}

function Bsp_UpdateGroup(oldGroup,newGroup)
{
	Bsp_ForEach(function(n) {
		if (n.pGroup == oldGroup)
			n.pGroup = newGroup;
	});
}

function Bsp_SetColor(oldGroup,color)
{
	gl.bindBuffer(gl.ARRAY_BUFFER, bspVbos.colors);
	Bsp_ForEach(function(n) {
		if (n.pGroup == oldGroup)
		{
			var r,g,b;
			var poly = n.poly;
			arrcpy(poly.primitive.color, color, 3);
			Level_LightColor(poly.primitive.color, poly.primitive.color, poly.plane.normal);

			r = poly.primitive.color[0] > 1 ? 255 : poly.primitive.color[0] * 255.99;
			g = poly.primitive.color[1] > 1 ? 255 : poly.primitive.color[1] * 255.99;
			b = poly.primitive.color[2] > 1 ? 255 : poly.primitive.color[2] * 255.99;
			
			var colors = new Array(4*n.poly.sides);
			for (j = 0; j < n.poly.sides; j++)
			{
				n.pGlVerts[j][3] = r;
				n.pGlVerts[j][4] = g;
				n.pGlVerts[j][5] = b;
				var a = n.pGlVerts[j][6]/255;
				colors[4*j + 0] = a*r;
				colors[4*j + 1] = a*g;
				colors[4*j + 2] = a*b;
				colors[4*j + 3] = n.pGlVerts[j][6];
			}
			gl.bufferSubData(gl.ARRAY_BUFFER, 4*1*n.index0, new Uint8Array(colors));
		}
	});
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function Render(n)
{
//var bInFront;
var distance;
	
	if (n == NULL)
		return;
	
	
	distance = (n.poly.plane.k - Vector_Dot(g_pos, n.poly.plane.normal));
	
	if (distance > 0)
		Render(n.left);
	else
		Render(n.right);
	
	if (fabs(distance) > 0.001)
	{
		var curNode = n;
		do
		{
			if (curNode.pGroup.bVisible)
			{
				var index = g_map.polyGroups[0].polyCount + 6 + curNode.pGroup.index - 1;
				if (!g_mask || (g_mask[index >> 5] & (1 << (index & 0x1f))))
				{					
					if ((distance > 0 && !(curNode.poly.primitive.flags & Nova_fCullBack)) ||
						 (distance < 0 && !(curNode.poly.primitive.flags & Nova_fCullFront)))
					{
						Nova_AddPolygonToDrawList(curNode.poly);
					}
				}
			}
			
			curNode = curNode.parallel;
		} while (curNode);
	}

	if (distance > 0)
		Render(n.right);
	else
		Render(n.left);
}

function Bsp_Render(_map,n,_pos,_mask)
{
	g_map = _map;
	g_pos = _pos;
	g_mask = _mask;
	Render(n);
}
