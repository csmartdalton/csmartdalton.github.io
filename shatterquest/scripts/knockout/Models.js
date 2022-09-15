var model_program = {};
model_program.vert_shader =
	"uniform mat4 mvp_matrix;" +
	"uniform vec3 light_dir;" +
	"uniform vec3 light_color;" +
	"uniform vec3 ambient_light;" +
	"uniform mat3 grid2map;" +
	"uniform mat3 map2grid;" +
	"uniform vec3 middle;" +
	"uniform vec2 atlas_offset;" +
	"uniform vec3 model_color;" +
	"attribute vec3 vertex_pos;" +
	"attribute vec2 vertex_texcoord;" +
	"attribute vec3 vertex_normal;" +
	"varying vec2 texcoord;" +
	"varying vec3 color;" +

	"void main(void)" +
	"{" +
	"	gl_Position = mvp_matrix * vec4(grid2map * vertex_pos + middle, 1);" +
	"	texcoord = vertex_texcoord + atlas_offset;" +
	"	float intensity = abs(dot(normalize(vertex_normal*map2grid), light_dir));" +
	"	color = model_color * (ambient_light + intensity * light_color);" +
	"}";
model_program.frag_shader =
    "precision mediump float;\n" +
	"uniform sampler2D tex;" +
	"varying vec2 texcoord;" +
	"varying vec3 color;" +

	"void main (void)" +
	"{" +
	"	gl_FragColor.rgb = texture2D(tex,texcoord,-2.0).rgb * color;" +
	"	gl_FragColor.a = 1.0;" +
	"}";


var Models = {
	atlasCoords:{},
	color:[],
	grid2map:[-1,-1,-1,-1,-1,-1,-1,-1,-1],
	map2grid:[-1,-1,-1,-1,-1,-1,-1,-1,-1],
	middle:[],
	vertices:null
};

Models.initialize = function() {
	checkGlErrors();
	model_program.id = compile(model_program.vert_shader, model_program.frag_shader);
	gl.useProgram(model_program.id);
	model_program.vertex_ptr = gl.getAttribLocation(model_program.id,"vertex_pos");
	model_program.texcoord_ptr = gl.getAttribLocation(model_program.id,"vertex_texcoord");
	model_program.normal_ptr = gl.getAttribLocation(model_program.id,"vertex_normal");
	model_program.arrays = [model_program.vertex_ptr, model_program.texcoord_ptr, model_program.normal_ptr];
	gl.uniform1i(gl.getUniformLocation(model_program.id, "tex"), 0);
	model_program.matrix = gl.getUniformLocation(model_program.id, "mvp_matrix");
	model_program.light_dir = gl.getUniformLocation(model_program.id, "light_dir");
	model_program.light_color = gl.getUniformLocation(model_program.id, "light_color");
	model_program.ambient_light = gl.getUniformLocation(model_program.id, "ambient_light");
	model_program.grid2map = gl.getUniformLocation(model_program.id, "grid2map");
	model_program.map2grid = gl.getUniformLocation(model_program.id, "map2grid");
	model_program.middle = gl.getUniformLocation(model_program.id, "middle");
	model_program.atlas_offset = gl.getUniformLocation(model_program.id, "atlas_offset");
	model_program.color = gl.getUniformLocation(model_program.id, "model_color");
	gl.useProgram(normal_program.id);
	checkGlErrors();
};

Models.begin = function() {
	Nova_UseProgram(model_program);
	gl.enable(gl.CULL_FACE);
	Nova_LoadModelMatrix();
	Models.atlas = -1;
	Models.vertices = -1;
};

Models.end = function() {
	gl.disable(gl.CULL_FACE);
	Nova_EndSpecialDraw();
};

Models.draw = function(model) {
	if (Models.atlas != model.atlas) {
		gl.bindTexture(gl.TEXTURE_2D, model.atlas.texGL);
		Models.atlas = model.atlas;
	}
	
	if (Models.atlasCoords.s != model.atlasCoords.s || Models.atlasCoords.t != model.atlasCoords.t) {
		gl.uniform2f(model_program.atlas_offset, model.atlasCoords.s/model.atlas.scale, model.atlasCoords.t/model.atlas.scale);
		Models.atlasCoords.s = model.atlasCoords.s;
		Models.atlasCoords.t = model.atlasCoords.t;
	}
	
	if (Models.color[0] != model.color[0] || Models.color[1] != model.color[1] || Models.color[2] != model.color[2]) {
		gl.uniform3f(model_program.color, model.color[0], model.color[1], model.color[2]);
		Models.color = arrdup(model.color);
	}
	
	if (Models.vertices != model.vertices) {
		gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices.verts);
		gl.vertexAttribPointer(model_program.vertex_ptr, 3, gl.FLOAT, gl.FALSE, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices.coords);
		gl.vertexAttribPointer(model_program.texcoord_ptr, 2, gl.FLOAT, gl.FALSE, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices.norms);
		gl.vertexAttribPointer(model_program.normal_ptr, 3, gl.FLOAT, gl.FALSE, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.vertices.indices);
		Models.vertices = model.vertices;
	}
	
	if (!Vector_VeryClose(model.middle, Models.middle, 0.001)) {
		gl.uniform3f(model_program.middle, model.middle[0], model.middle[1], model.middle[2]);
		Models.middle = arrdup(model.middle);
	}
	
	var same = true;
	for (i = 0; i < 3; i++) {
		for (var j = 0; j < 3; j++) {
			if (fabs(Models.grid2map[3*i+j] - model.grid2map[j][i]) > 0.001)
				same = false;
			Models.grid2map[3*i+j] = model.grid2map[j][i];
			Models.map2grid[3*i+j] = model.map2grid[j][i];
		}
	}
	if (!same) {
		gl.uniformMatrix3fv(model_program.grid2map, false, Models.grid2map);
		gl.uniformMatrix3fv(model_program.map2grid, false, Models.map2grid);
	}
	
	gl.drawElements(gl.TRIANGLES, model.vertices.index_count, gl.UNSIGNED_SHORT, 0);
};

Models.light = function(light_dir,ambient_light,light_color) {
	var old_program = current_program;
	Nova_UseProgram(model_program);
	gl.uniform3f(model_program.light_dir, light_dir[0], light_dir[1], light_dir[2]);
	gl.uniform3f(model_program.ambient_light, ambient_light[0], ambient_light[1], ambient_light[2]);
	gl.uniform3f(model_program.light_color, light_color[0], light_color[1], light_color[2]);
	Nova_UseProgram(old_program);
};

function ModelBuilder() {
	this.FLIP = -1;
	this.ABSOLUTE = -2;
	this.RELATIVE = -3;
	
	this.verts = [];
	this.coords = [];
	this.norms = [];
	this.indices = [];
	this.count = 0;
	this.tex_scale = 1;
	this._color = [1,1,1,1];
	this.s0 = 0;
	this.s = [1,0,0];
	this.t0 = 1;
	this.t = [0,0,-1];
	this.tex_relative = this.ABSOLUTE;
	this.mat = [[1,0,0],[0,1,0],[0,0,1]];
	this.offset = [-.5,-.5,-.5];
	
	this.transform = function(mat,offset) {
		this.mat = arrdup2d(mat);
		if (offset) this.offset = arrdup(offset);
	};
	this.translate = function(offset) {
		this.offset = Vector_Add(offset,this.offset);
	};
	this.texScale = function(scale) {
		this.tex_scale = scale;
	};
	this.texGen = function(s0,s,t0,t,relative) {
		this.s0 = s0;
		this.s = arrdup(s);
		this.t0 = t0;
		this.t = arrdup(t);
		this.tex_relative = relative;
	}
	this.color = function(color_) {
		this._color = arrdup(color_);
	};
	
	this.beginPolygon = function() {
		this.poly_verts = [];
		this.poly_coords = [];
		this.poly_colors = [];
	};
	
	this.vertex = function(vert,coord,color) {
		ASSERT(vert.length == 3);
		var absolute_vert = Vector_Add(Matrix_Mult(this.mat,vert),this.offset);
		this.poly_verts.push(absolute_vert);
		if (!coord && this.tex_relative == this.RELATIVE)
			coord = [this.s0 + Vector_Dot(this.s,vert), this.t0 + Vector_Dot(this.t,vert)];
		else if (!coord && this.tex_relative == this.ABSOLUTE)
			coord = [this.s0 + Vector_Dot(this.s,absolute_vert), this.t0 + Vector_Dot(this.t,absolute_vert)];
		ASSERT(coord.length == 2);
		this.poly_coords.push(arrdup(coord));
		if (!color)
			color = this._color;
		ASSERT(color.length == 4);
		this.poly_colors.push(arrdup(color));
	};
	
	this.endPolygon = function(flip) {
		var sides = this.poly_verts.length;
		ASSERT(sides >= 3);
		ASSERT(sides == this.poly_coords.length);
		ASSERT(sides == this.poly_colors.length);
		
		for (var idx = 0; idx < sides; idx++) {
			var i = flip == this.FLIP ? sides - idx - 1 : idx;
			this.verts.push(this.poly_verts[i][0]);
			this.verts.push(this.poly_verts[i][1]);
			this.verts.push(this.poly_verts[i][2]);
			
			this.coords.push(this.poly_coords[i][0] * this.tex_scale);
			this.coords.push(this.poly_coords[i][1] * this.tex_scale);
			
			var norm = Vector_Normalize(Vector_Cross(
					Vector_Subtract(this.poly_verts[1], this.poly_verts[0]),
					Vector_Subtract(this.poly_verts[2], this.poly_verts[1])));
			this.norms.push(norm[0]);
			this.norms.push(norm[1]);
			this.norms.push(norm[2]);
		}
		
		var l = sides - 1, r = 0;
		while (1+r < l) {
			this.indices.push(this.count + r);
			this.indices.push(this.count + r+1);
			this.indices.push(this.count + l);
			r++;
			
			if (1+r >= l) break;
			
			this.indices.push(this.count + l-1);
			this.indices.push(this.count + l);
			this.indices.push(this.count + r);
			l--;
		}
		this.count += sides;
	};
	
	this.finish = function(vertices) {
		if (!vertices)
			vertices = {};
		
		vertices.verts = gl.createBuffer();
		vertices.coords = gl.createBuffer();
		vertices.norms = gl.createBuffer();
		vertices.indices = gl.createBuffer();
		vertices.index_count = this.indices.length;
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertices.verts);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.verts), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, vertices.coords);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.coords), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, vertices.norms);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.norms), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertices.indices);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		
		return vertices;
	};
}

var BlockModel = {};
BlockModel.vertices = {};
BlockModel.levelFinishedLoading = function() {
	if (BlockModel.vertices.verts)
		gl.deleteBuffer(BlockModel.vertices.verts);
	if (BlockModel.vertices.coords)
		gl.deleteBuffer(BlockModel.vertices.coords);
	if (BlockModel.vertices.colors)
		gl.deleteBuffer(BlockModel.vertices.colors);
	if (BlockModel.vertices.indices)
		gl.deleteBuffer(BlockModel.vertices.indices);
	
	var b = new ModelBuilder();
	b.texScale(Atlas_TexSize);
	
	var bevel = 0.2;
	var bevelEdge = 0.04;
	var face = function(mat,offset,flip) {
		b.transform(mat,offset);
		b.beginPolygon();
			b.vertex([bevel,1-bevelEdge,0]);
			b.vertex([1-bevel,1-bevelEdge,0]);
			b.vertex([1-bevelEdge,1-bevel,0]);
			b.vertex([1-bevelEdge,bevel,0]);
			b.vertex([1-bevel,bevelEdge,0]);
			b.vertex([bevel,bevelEdge,0]);
			b.vertex([bevelEdge,bevel,0]);
			b.vertex([bevelEdge,1-bevel,0]);
		b.endPolygon(flip);
	};
	b.texGen(0,[1,0,0],1,[0,-1,0],b.RELATIVE);
	face([[1,0,0],[0,0,1],[0,1,0]],[-.5,-.5,-.5],b.FLIP);
	face([[1,0,0],[0,0,1],[0,1,0]],[-.5,.5,-.5]);
	face([[0,0,1],[1,0,0],[0,1,0]],[-.5,-.5,-.5]);
	face([[0,0,1],[1,0,0],[0,1,0]],[.5,-.5,-.5],b.FLIP);
	face([[1,0,0],[0,1,0],[0,0,1]],[-.5,-.5,-.5]);
	face([[1,0,0],[0,1,0],[0,0,1]],[-.5,-.5,.5],b.FLIP);
	
	var corner = function(x,y,z,flip) {
		b.transform([[x,0,0],[0,y,0],[0,0,z]],[0,0,0]);
		b.beginPolygon();
			b.vertex([-.5+bevel,-.5,.5-bevelEdge]);
			b.vertex([-.5+bevelEdge,-.5,.5-bevel]);
			b.vertex([-.5,-.5+bevelEdge,.5-bevel]);
			b.vertex([-.5,-.5+bevel,.5-bevelEdge]);
			b.vertex([-.5+bevelEdge,-.5+bevel,.5]);
			b.vertex([-.5+bevel,-.5+bevelEdge,.5]);
		b.endPolygon(flip);
	};
	b.texGen(0.5, [1,0,0], 0.5, [0,-1,0], b.ABSOLUTE);
	corner(+1,+1,+1,b.FLIP);
	corner(+1,-1,+1);
	corner(-1,+1,+1);
	corner(-1,-1,+1,b.FLIP);
	
	b.texGen(0.5, [-1,0,0], 0.5, [0,-1,0], b.ABSOLUTE);
	corner(+1,+1,-1);
	corner(+1,-1,-1,b.FLIP);
	corner(-1,+1,-1,b.FLIP);
	corner(-1,-1,-1);
	
	var edge = function(mat,flip) {
		b.transform(mat,[0,0,0]);
		b.beginPolygon();
			b.vertex([-.5+bevel,-.5,.5-bevelEdge]);
			b.vertex([-.5+bevel,-.5+bevelEdge,.5]);
			b.vertex([.5-bevel,-.5+bevelEdge,.5]);
			b.vertex([.5-bevel,-.5,.5-bevelEdge]);
		b.endPolygon(flip);
	};
	b.texGen(0.5, [1,0,0], 0.5, [0,-1,0], b.ABSOLUTE);
	edge([[1,0,0],[0,1,0],[0,0,1]],b.FLIP);
	edge([[0,-1,0],[1,0,0],[0,0,1]],b.FLIP);
	edge([[0,1,0],[1,0,0],[0,0,1]]);
	edge([[1,0,0],[0,-1,0],[0,0,1]]);
	
	b.texGen(0.5, [-1,0,0], 0.5, [0,-1,0], b.ABSOLUTE);
	edge([[1,0,0],[0,1,0],[0,0,-1]]);
	edge([[0,-1,0],[1,0,0],[0,0,-1]]);
	edge([[0,1,0],[1,0,0],[0,0,-1]],b.FLIP);
	edge([[1,0,0],[0,-1,0],[0,0,-1]],b.FLIP);
	
	b.texGen(0.5, [1,0,0], 0.5, [0,0,-1], b.ABSOLUTE);
	edge([[0,0,1],[0,1,0],[1,0,0]]);
	edge([[0,0,-1],[0,1,0],[1,0,0]],b.FLIP);
	
	b.texGen(0.5, [-1,0,0], 0.5, [0,0,-1], b.ABSOLUTE);
	edge([[0,0,1],[0,-1,0],[1,0,0]],b.FLIP);
	edge([[0,0,-1],[0,-1,0],[1,0,0]]);
	
	
	b.finish(BlockModel.vertices);
};