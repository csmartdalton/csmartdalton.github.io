function Vector_Equals(v1,v2) {
	return v1[0] == v2[0] && v1[1] == v2[1] && v1[2] == v2[2];
}
function Vector_VeryClose(v1,v2,slack) {
	return fabs(v1[0] - v2[0]) <= slack && fabs(v1[1] - v2[1]) <= slack && fabs(v1[2] - v2[2]) <= slack;
}
function Nova_Vector3f(x,y,z) {
	return [x,y,z];
}
function Nova_Plane4f(x,y,z,k) {
	return {normal:[x,y,z], k:k};
}
function Vector_Negate(v) {
	return [-v[0], -v[1], -v[2]];
}
function Vector_Subtract(v1,v2) {
	return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
}
function Vector_Add3f(v,X,Y,Z) {
	return [v[0] + X, v[1] + Y, v[2] + Z];
}
function Vector_Add(v1,v2) {
	return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
}
function Vector_Dot3f(v,X,Y,Z) {
	return v[0] * X + v[1] * Y + v[2] * Z;
}
function Vector_Dot(v1,v2) {
	return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
}
function Vector_Scale(v,k) {
	return [v[0] * k, v[1] * k, v[2] * k];
}
function Vector_AddScale(v1,v2,k) {
	return [v1[0] + v2[0] * k, v1[1] + v2[1] * k, v1[2] + v2[2] * k];
}
function Vector_Cross(v1,v2) {
	return [v1[1] * v2[2] - v1[2] * v2[1], v1[2] * v2[0] - v1[0] * v2[2], v1[0] * v2[1] - v1[1] * v2[0]];
}
function Vector_Square(v) {
	return Vector_Dot(v,v);
}
function Vector_Length(v) {
	return Math.sqrt(Vector_Square(v));
}
function Vector_Normalize(v) {
	return Vector_Scale(v, 1 / Vector_Length(v));
}
function GLV_Add(v1,v2) {
	var v = [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2], v1[3] + v2[3], 
	              v1[4] + v2[4], v1[5] + v2[5], v1[6] + v2[6], v1[7] + v2[7], v1[8] + v2[8]];
	if (v[3] > 255) v[3] = 255;
	if (v[4] > 255) v[4] = 255;
	if (v[5] > 255) v[5] = 255;
	if (v[6] > 255) v[6] = 255;
	return v;
}
function GLV_Subtract(v1,v2) {
	var v = [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2], v1[3] - v2[3],
	              v1[4] - v2[4], v1[5] - v2[5], v1[6] - v2[6], v1[7] - v2[7], v1[8] - v2[8]];
	if (v[3] < 0) v[3] = 255;
	if (v[4] < 0) v[4] = 255;
	if (v[5] < 0) v[5] = 255;
	if (v[6] < 0) v[6] = 255;
	return v;
}
function GLV_Scale(v,k) {
	return [v[0] * k, v[1] * k, v[2] * k, v[3] * k, v[4] * k, v[5] * k, v[6], v[7] * k, v[8] * k];
}
function GLV_DotV(v1,v2) {
	return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
}
function GLV_SetV(glv,v) {
	return [v[0], v[1], v[2], glv[3], glv[4], glv[5], glv[6], glv[7], glv[8]];
}
function Matrix_Mult(m,v) {
	return [Vector_Dot(m[0], v), Vector_Dot(m[1], v), Vector_Dot(m[2], v)];
}
function Matrix_Mult3f(m,X,Y,Z) {
	return Matrix_Mult(m, [X,Y,Z]);
}
function Matrix_Transpose(m) {
	return [[m[0][0], m[1][0], m[2][0]],
	        [m[0][1], m[1][1], m[2][1]],
	        [m[0][2], m[1][2], m[2][2]]];
}
function Matrix_Negate(m) {
	return [
		Vector_Negate(m[0]),
		Vector_Negate(m[1]),
		Vector_Negate(m[2]),
	];
}
function Matrix_VeryClose(m1,m2,slack) {
	return Vector_VeryClose(m1[0], m2[0], slack) &&
	       Vector_VeryClose(m1[1], m2[1], slack) &&
	       Vector_VeryClose(m1[2], m2[2], slack);
}
function Matrix_Invert(mat) {
var old = arrdup2d(mat);
var inv = [[1, 0, 0],
         [0, 1, 0],
         [0, 0, 1]];
var val1, val2;

	mat = arrdup2d(mat);	
	var swap = function(i,j) {
		var tmp = mat[i];
		mat[i] = mat[j];
		mat[j] = tmp;
		tmp = inv[i];
		inv[i] = inv[j];
		inv[j] = tmp;
	};
	
	if (!mat[0][0])
		swap(0,(mat[1][0] ? 1 : 2));
	
	inv[0] = Vector_Scale(inv[0], 1.0 / mat[0][0]);
	mat[0] = Vector_Scale(mat[0], 1.0 / mat[0][0]);
	inv[1] = Vector_Subtract(inv[1], Vector_Scale(inv[0], mat[1][0]));
	mat[1] = Vector_Subtract(mat[1], Vector_Scale(mat[0], mat[1][0]));
	inv[2] = Vector_Subtract(inv[2], Vector_Scale(inv[0], mat[2][0]));
	mat[2] = Vector_Subtract(mat[2], Vector_Scale(mat[0], mat[2][0]));
	
	if (!mat[1][1])
		swap(1,2);
	
	inv[1] = Vector_Scale(inv[1], 1.0 / mat[1][1]);
	mat[1] = Vector_Scale(mat[1], 1.0 / mat[1][1]);
	inv[0] = Vector_Subtract(inv[0], Vector_Scale(inv[1], mat[0][1]));
	mat[0] = Vector_Subtract(mat[0], Vector_Scale(mat[1], mat[0][1]));
	inv[2] = Vector_Subtract(inv[2], Vector_Scale(inv[1], mat[2][1]));
	mat[2] = Vector_Subtract(mat[2], Vector_Scale(mat[1], mat[2][1]));
	
	inv[2] = Vector_Scale(inv[2], 1.0 / mat[2][2]);
	mat[2] = Vector_Scale(mat[2], 1.0 / mat[2][2]);
	inv[0] = Vector_Subtract(inv[0], Vector_Scale(inv[2], mat[0][2]));
	mat[0] = Vector_Subtract(mat[0], Vector_Scale(mat[2], mat[0][2]));
	inv[1] = Vector_Subtract(inv[1], Vector_Scale(inv[2], mat[1][2]));
	mat[1] = Vector_Subtract(mat[1], Vector_Scale(mat[2], mat[1][2]));

	val1 = Matrix_Mult(mat, Nova_Vector3f(0.2, 0.5, 0.9));
	ASSERT(Vector_VeryClose(Nova_Vector3f(0.2,0.5,0.9), val1, 0.01));
	val1 = Matrix_Mult(old, Nova_Vector3f(0.2, 0.5, 0.9));
	val2 = Matrix_Mult(inv, val1);
	ASSERT(Vector_VeryClose(Nova_Vector3f(0.2,0.5,0.9), val2, 0.01));

	return inv;
}
function Matrix_GetGLT(m,origin) {
	return [m[0][0], m[0][1], m[0][2], origin[0],
	        m[1][0], m[1][1], m[1][2], origin[1],
	        m[2][0], m[2][1], m[2][2], origin[2],
	        0, 0, 0, 1];
}
function Color_Equals(c1,c2) {
	if (cheat)
		return true;
	else
		return c1[0] == c2[0] && c1[1] == c2[1] && c1[2] == c2[2];
}

var mat4 = {};
mat4.identity = [1,0,0,0,
                 0,1,0,0,
                 0,0,1,0,
                 0,0,0,1];
mat4.mul = function(m1,m2) {
	var mat = new Array(16);
	for (var i = 0; i < 16; i += 4)
	{
		for (var j = 0; j < 4; j++)
			mat[i+j] = m1[i+0]*m2[0+j] + 
			           m1[i+1]*m2[4+j] + 
			           m1[i+2]*m2[8+j] + 
			           m1[i+3]*m2[12+j]; 
	}
	return mat;
};
mat4.frustum = function(l,r,b,t,n,f) {
	return [2*n/(r-l), 0, (r+l)/(r-l), 0,
	        0, 2*n/(t-b), (t+b)/(t-b), 0,
	        0, 0, -(f+n)/(f-n), -2*f*n/(f-n),
	        0, 0, -1, 0];
};
mat4.transpose = function(m) {
	return [m[0],m[4],m[ 8],m[12],
	        m[1],m[5],m[ 9],m[13],
	        m[2],m[6],m[10],m[14],
	        m[3],m[7],m[11],m[15]];
};

var vec3 = {};
vec3.dot = Vector_Dot;
vec3.square = Vector_Scale;
vec3.add = Vector_Add;
vec3.sub = Vector_Subtract;
vec3.neg = Vector_Negate;
vec3.cross = Vector_Cross;
vec3.length = Vector_Length;
vec3.close = Vector_VeryClose;
vec3.mul = function(v1,v2) {
	return [v1[0]*v2[0], v1[1]*v2[1], v1[2]*v2[2]];
};
vec3.scale = function(k,v) {
	return [k*v[0], k*v[1], k*v[2]];
};

var vec2 = {};
vec2.add = function(v1,v2) {
	return [v1[0]+v2[0], v1[1]+v2[1]];
};
vec2.sub = function(v1,v2) {
	return [v1[0]-v2[0], v1[1]-v2[1]];
};
vec2.negate = function(v) {
	return [-v[0],-v[1]];
};
vec2.dot = function(v1,v2) {
	return v1[0]*v2[0] + v1[1]*v2[1];
};
vec2.square = function(v) {
	return vec2.dot(v,v);
};
vec2.scale = function(k,v) {
	return [k*v[0], k*v[1]];
};
vec2.length = function(v) {
	return Math.sqrt(vec2.dot(v,v));
};
vec2.normalize = function(v) {
	return vec2.scale(1/vec2.length(v),v);
};

var mat3 = {};
mat3.mulv = Matrix_Mult;
mat3.transpose = Matrix_Transpose;
mat3.neg = Matrix_Negate;
mat3.invert = Matrix_Invert;
mat3.close = Matrix_VeryClose;
mat3.mul = function(m1,m2) {
	var m = new Array(3);
	for (i = 0; i < 3; i++) {
		m[i] = new Array(3);
		for (j = 0; j < 3; j++) {
			m[i][j] = m1[i][0] * m2[0][j] + 
			          m1[i][1] * m2[1][j] +
			          m1[i][2] * m2[2][j];
		}
	}
	return m;
};

var mat2x3 = {};
mat2x3.mulv = function(m,v) {
	return [vec3.dot(m[0],v), vec3.dot(m[1],v)];
};
mat2x3.mul3x3 = function(m1,m2) {
	var m = new Array(2);
	for (i = 0; i < 2; i++) {
		m[i] = new Array(3);
		for (j = 0; j < 3; j++) {
			m[i][j] = m1[i][0] * m2[0][j] + 
			          m1[i][1] * m2[1][j] +
			          m1[i][2] * m2[2][j];
		}
	}
	return m;
};