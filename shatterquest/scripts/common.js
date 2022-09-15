var PI = Math.PI;
var pi = Math.PI;
var TRUE = true;
var FALSE = false;
var NULL = null;
function ASSERT(bool) {
	if (!bool) {
		var err = (function() { try {throw(Error(''))} catch (err) {return err} })();
		alert('Assert failed.\n' + err.stack);
	}
}
var fabs = Math.abs;
var sqrt = Math.sqrt;
var cos = Math.cos;
var sin = Math.sin;
var tan = Math.tan;
var atan2 = Math.atan2;
var min = Math.min;
var max = Math.max;
var abs = Math.abs;
function checkGlErrors() {
	var err;
	while (gl.NO_ERROR != (err = gl.getError()))
		alert('GL ERROR! 0x' + err.toString(16));
}
function shallowCopy(obj,dest) {
//	ASSERT(obj);
	if (obj == dest) return dest;
	if (!dest) {
		dest = {};
	} else {
		for (prop in dest)
			delete dest[prop];
	}
	for (prop in obj) {
		dest[prop] = obj[prop];
	}
	return dest;
}
function arrcpy(dest,arr,count) {
//	ASSERT(dest && arr);
	for (var i = 0; i < count; i++)
		dest[i] = arr[i];
}
function arrdup(arr) {
//	ASSERT(arr);
	var newarr = new Array(arr.length);
	for (var i = 0; i < arr.length; i++)
		newarr[i] = arr[i];
	return newarr;
}
function arrdup2d(arr) {
//	ASSERT(arr);
	var newarr = new Array(arr.length);
	for (var i = 0; i < arr.length; i++)
		newarr[i] = arrdup(arr[i]);
	return newarr;
}
var RAND_MAX = 32767;
function rand() {
	return Math.floor(Math.random() * RAND_MAX);
}
function randVec() {
	return [2*Math.random()-1, 2*Math.random()-1, 2*Math.random()-1];
}
function startsWith(str, start)
{
	return (str.indexOf(start) === 0);
}
function swap(array,a,b) {
	var tmp = array[a];
	array[a] = array[b];
	array[b] = tmp;
}
