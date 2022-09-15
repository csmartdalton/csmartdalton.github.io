var ekMaxIndices = 65536;

var Tesselator = {};
Tesselator.program = {};
Tesselator.program.vert_shader =
	"uniform sampler2D height;" +
	"uniform mat2 tri2screen;" +
	"uniform vec2 pos0;" +
	"uniform vec4 plane;" +
	"uniform vec3 Ts;" +
	"uniform vec3 Tt;" +
	"uniform vec2 st0;" +
	"uniform vec4 proj;" +
	"attribute vec2 tricoord;" +
	
	"varying vec2 st;" +

	"void main(void)" +
	"{" +
	"   vec2 s = tri2screen * tricoord + pos0;" +
	"   float t = plane.w / dot(vec3(s,1),plane.xyz);" +
	"   vec3 pos = t * vec3(s,1);" +
	
	"   st = vec2(dot(Ts,pos),dot(Tt,pos)) + st0;" +
	"   pos += plane.xyz * (texture2D(height,st).r * 0.025);" +
	"	gl_Position = vec4(pos.xy*proj.xy, dot(vec2(pos.z,1),proj.zw), pos.z);" +
	"}";
Tesselator.program.frag_shader =
    "precision lowp float;\n" +
    "uniform sampler2D tex;" +
    "varying vec2 st;" +

	"void main (void)" +
	"{" +
	"	gl_FragColor = texture2D(tex,st);" +
	"}";

Tesselator.initialize = function() {
	gl.outlineElements = function(mode,count,type,offset) {
		ASSERT(mode == gl.TRIANGLES);
		ASSERT(type == gl.UNSIGNED_SHORT);
		for (var i = 0; i < count/3; i++)
			gl.drawElements(gl.LINE_LOOP,3,type,2*3*i);
	};
	
	checkGlErrors();
	Tesselator.program.id = compile(Tesselator.program.vert_shader, Tesselator.program.frag_shader);
	gl.useProgram(Tesselator.program.id);
	Tesselator.program.tricoord_ptr = gl.getAttribLocation(Tesselator.program.id,"tricoord");
	Tesselator.program.arrays = [Tesselator.program.tricoord_ptr];
	gl.uniform1i(gl.getUniformLocation(Tesselator.program.id, "tex"), 0);
	gl.uniform1i(gl.getUniformLocation(Tesselator.program.id, "height"), 1);
	Tesselator.program.tri2screen = gl.getUniformLocation(Tesselator.program.id, "tri2screen");
	Tesselator.program.pos0 = gl.getUniformLocation(Tesselator.program.id, "pos0");
	Tesselator.program.plane = gl.getUniformLocation(Tesselator.program.id, "plane");
	Tesselator.program.Ts = gl.getUniformLocation(Tesselator.program.id, "Ts");
	Tesselator.program.Tt = gl.getUniformLocation(Tesselator.program.id, "Tt");
	Tesselator.program.st0 = gl.getUniformLocation(Tesselator.program.id, "st0");
	Tesselator.program.proj = gl.getUniformLocation(Tesselator.program.id, "proj");
	gl.useProgram(normal_program.id);
	checkGlErrors();

	Tesselator.bump_bricks = loadTexture('images/bump-bricks.jpg',true,true,gl.REPEAT,gl.RGBA);
	Tesselator.bricks = loadTexture('images/bricks.jpg',true,true,gl.REPEAT,gl.RGBA);
	
	Tesselator.tesselations = [];
	for (var w = 1; w <= 256; w *= 2)
		Tesselator.tesselations.push(new Tesselation(w));
	checkGlErrors();
};

Tesselator.begin = function(pixelsPerTri) {
	Nova_UseProgram(Tesselator.program);
	var screen = Nova_GetScreenData();
	gl.uniform4f(Tesselator.program.proj,
			     2/(screen.width * screen.screen2map),
			     2/(screen.height * screen.screen2map),
			     (screen.far + screen.near) / (screen.far - screen.near),
			     -2*screen.far*screen.near / (screen.far - screen.near));
	Tesselator.boundTesselation = null;
	Tesselator.pixelsPerTri = pixelsPerTri;
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, Tesselator.bump_bricks.texGL);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, Tesselator.bricks.texGL);
};

triArea2d = function(sc) {
	return fabs(sc[0][0]*(sc[1][1] - sc[2][1]) + sc[1][0]*(sc[2][1] - sc[0][1]) + sc[2][0]*(sc[0][1] - sc[1][1])) / 2;
};

function clipPolyToPlane(sides,verts,n,k,vec,keepFront,newVerts) {
	if (!sides) return 0;
	var last = sides-1;
	var lastInFront = (verts[last][n] > k) == keepFront;
	var newSides = 0;
	for (var i = 0; i < sides; last = i++) {
		var inFront = (verts[i][n] > k) == keepFront;
		if (inFront != lastInFront) {
			var t = (k - verts[i][n]) / (verts[last][n] - verts[i][n]);
			newVerts[newSides++] = vec.add(vec.scale(t,verts[last]), vec.scale(1-t,verts[i]));
		}
		if (inFront) {
			newVerts[newSides++] = verts[i];
		}
		lastInFront = inFront;
	}
	return newSides;
}

Tesselator.draw = function(poly) {
	var screen = Nova_GetScreenData();
	var mat = mat3.neg(Nova_GetViewAngle());
	var org = Nova_GetPosition();
	var verts = new Array(16);
	var clippedVerts = new Array(16);
	var sc = new Array(16);
	var sc2 = new Array(16);
	
	// transform to eye coordinates
	for (var i = 0; i < poly.sides; i++)
		verts[i] = mat3.mulv(mat, vec3.sub(poly.vertex[i],org));
	
	var clippedSides = clipPolyToPlane(poly.sides,verts,2,screen.near,vec3,true,clippedVerts);
	if (clippedSides) {
		// project to screen
		for (var i = 0; i < clippedSides; i++) {
			var r = 1 / clippedVerts[i][2];
			sc[i] = [r * clippedVerts[i][0], r * clippedVerts[i][1]];
		};
		
		// clip to screen
		clippedSides = clipPolyToPlane(clippedSides,sc,0,-screen.width/2*screen.screen2map,vec2,true,sc2);
		clippedSides = clipPolyToPlane(clippedSides,sc2,0,screen.width/2*screen.screen2map,vec2,false,sc);
		clippedSides = clipPolyToPlane(clippedSides,sc,1,-screen.height/2*screen.screen2map,vec2,true,sc2);
		clippedSides = clipPolyToPlane(clippedSides,sc2,1,screen.height/2*screen.screen2map,vec2,false,sc);
		if (clippedSides) {
			var norm = mat3.mulv(mat, poly.plane.normal);
			var k = poly.plane.k - vec3.dot(poly.plane.normal,org);
			if (vec3.dot(norm,vec3.sub(verts[0],org)) < 0)
				norm = vec3.neg(norm), k = -k;
			var T = mat2x3.mul3x3(poly.T, mat3.transpose(mat));
			var st0 = mat2x3.mulv(poly.T,org);
			if (poly.st0) st0 = vec2.add(poly.st0,st0);
			gl.uniform4f(Tesselator.program.plane, norm[0], norm[1], norm[2], k);
			gl.uniform3fv(Tesselator.program.Ts, T[0]);
			gl.uniform3fv(Tesselator.program.Tt, T[1]);
			gl.uniform2fv(Tesselator.program.st0, st0);
			
			// stipple polygon into triangles
			var left = clippedSides - 1, right = 0;
			while (1+right < left) {
				Tesselator.drawTriangle([sc[right],sc[1+right],sc[left]], screen);
				right++;
				if (1 + right >= left)
					break;
				Tesselator.drawTriangle([sc[left - 1],sc[left],sc[right]], screen);
				left--;
			}
		}
	}
};

var one_over_log_2 = 1/Math.log(2);
var cos_75_degrees = Math.cos(75*pi/180);
var sqrt_2 = Math.sqrt(2);
Tesselator.drawTriangle = function(sc,screen) {
	// sort triangle sides by length
	var lengths = [vec2.length(vec2.sub(sc[1],sc[0])),
	               vec2.length(vec2.sub(sc[2],sc[1])),
	               vec2.length(vec2.sub(sc[0],sc[2]))];
	if (lengths[1] < lengths[0])
		swap(lengths,0,1), swap(sc,0,2);
	if (lengths[2] < lengths[0])
		swap(lengths,2,0), swap(sc,2,1);
	if (lengths[2] < lengths[1])
		swap(lengths,1,2), swap(sc,1,0);
	
	// decide if we need to split in two
	if (lengths[1]/lengths[0] >= sqrt_2) {
		var cos_theta = vec2.dot(vec2.sub(sc[1],sc[0]),vec2.sub(sc[1],sc[2]))/(lengths[0]*lengths[1])
		if (Math.abs(cos_theta) > cos_75_degrees) {
			var n = vec2.sub(sc[0],sc[2]);
			n = [-n[1] / lengths[2], n[0] / lengths[2]];
			ASSERT(fabs(vec2.dot(sc[0],n) - vec2.dot(sc[2],n)) < 0.001);
			var t = vec2.dot(n, vec2.sub(sc[0],sc[1]));
			var pt = vec2.add(sc[1], vec2.scale(t,n));
			ASSERT(fabs(vec2.dot(pt,n) - vec2.dot(sc[0],n)) < 0.001);
			Tesselator.drawTriangle([pt,sc[1],sc[0]], screen);
			Tesselator.drawTriangle([pt,sc[1],sc[2]], screen);
			return;
		}
	}
	
	var tesselation_idx = Math.round(Math.log(lengths[1]/lengths[0]) * one_over_log_2);
	tesselation_idx = Math.min(tesselation_idx, Tesselator.tesselations.length-1);
	var tesselation = Tesselator.tesselations[tesselation_idx];
	var pixels = triArea2d(sc)*screen.map2screen*screen.map2screen;
	var rows = tesselation.nearestRowCount(pixels/Tesselator.pixelsPerTri);
	//if (tesselation.triCount(rows) > 40) {
		var r = 1/rows;
		if (Tesselator.boundTesselation != tesselation) {
			tesselation.bind();
			Tesselator.boundTesselation = tesselation;
		}
		gl.uniformMatrix2fv(Tesselator.program.tri2screen, false, 
				[r*(sc[1][0] - sc[0][0]), r*(sc[1][1] - sc[0][1]),
				 r*(sc[2][0] - sc[1][0]), r*(sc[2][1] - sc[1][1])]);
		gl.uniform2f(Tesselator.program.pos0, sc[0][0], sc[0][1]);
		gl.drawElements(gl.TRIANGLES, 3*tesselation.triCount(rows), gl.UNSIGNED_SHORT, 0);
		//gl.outlineElements(gl.TRIANGLES, 3*tesselation.triCount(rows), gl.UNSIGNED_SHORT, 0);
		//gl.outlineElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
	//}
};

Tesselator.end = function() {
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	Nova_EndSpecialDraw();
};

function Tesselation(w) {
	this.triCount = function(rows) {
		return rows * (w*rows + (w-1));
	};
	this.nearestRowCount = function(tris) {
		if (tris >= this.maxTris)
			return this.maxRows;
		return Math.ceil((1 - w +  Math.sqrt((w-1)*(w-1) + 4*w*tris)) / (2*w));
	};
	this.bind = function() {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.verts);
		gl.vertexAttribPointer(Tesselator.program.tricoord_ptr, 2, gl.FLOAT, gl.FALSE, 0, 0);
	};
	this.maxRows = Math.floor((-3*w + Math.sqrt(9*w*w - 4*w*(-2*ekMaxIndices + 2))) / (2*w));
	this.maxTris = this.triCount(this.maxRows);
	
	var verts = [];
	var r = 1/w;
	for (var i = 0; i <= this.maxRows; i++) {
		var j = 0;
		for (; j <= w*i; j++) {
			verts.push(i);
			verts.push(r*j);
		}
		if (i < this.maxRows) {
			for (; j < w*(1+i); j++) {
				verts.push(r*j);
				verts.push(r*j);	
			}
		}
	}
	ASSERT(verts.length/2 <= ekMaxIndices);
	this.verts = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.verts);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	var indices = [];
	var top_idx = 0;
	var bot_idx = w;
	for (var i = 0; i < this.maxRows; i++) {
		indices.push(bot_idx);
		indices.push(top_idx);
		indices.push(++bot_idx);
		for (var j = 0; j < w*i + w - 1; j++) {
			indices.push(top_idx);
			indices.push(bot_idx);
			indices.push(++top_idx);
			indices.push(bot_idx);
			indices.push(top_idx);
			indices.push(++bot_idx);
		}
		top_idx++;
		bot_idx += w;
	}
	ASSERT(bot_idx - w < ekMaxIndices && top_idx <= ekMaxIndices);
	this.indices = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}
