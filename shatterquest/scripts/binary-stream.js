function BinaryStream(data) {
	var spot = 0;
	var checkDataSize = function(extra_bytes) {
		if (spot + extra_bytes > data.length)
			throw 'out-of-data';
	};

	this.tell = function() {
		return spot;
	};
	this.seek = function(loc) {
		spot = loc;
	};

	var nextByte = function() {
		return data.charCodeAt(spot++) & 0xff;
	};
	var nextUint16 = function() {
		var ret = nextByte();
		ret |= (nextByte() << 8);
		return ret;
	};
	var nextUint32 = function() {
		var ret = nextByte();
		ret |= (nextByte() << 8);
		ret |= (nextByte() << 16);
		ret |= (nextByte() << 24);
		return ret;
	};
	var nextFloat = function() {
		var uint32 = nextUint32();
		var sign = uint32 >> 31;
		var exp = (uint32 >> 23) & 0xff;
		var mant = uint32 & 0x7fffff;
		
		var float;
		if (exp == 0)
			float = Math.pow(2, -126-23) * mant;
		else
			float = Math.pow(2, exp-127-23) * (0x800000 + mant);
		if (sign)
			float = -float;
		
		return float;
	};
	var nextVector = function() {
		var ret = new Array(3);
		ret[0] = nextFloat();
		ret[1] = nextFloat();
		ret[2] = nextFloat();	
		return ret;
	};

	this.read = function(length) {
		checkDataSize(length);
		var arr = new Array(length);
		for (var i = 0; i < length; i++)
			arr[i] = nextByte();
		return arr;
	};
	this.string = function(length) {
		checkDataSize(length);
		var str = '';
		for (var i = 0; i < length; i++)
			str += String.fromCharCode(nextByte());
		return str;
	};
	this.nullTerminatedString = function(max_length) {
		checkDataSize(max_length);
		var str = '';
		var byte;
		for (var i = 0; (byte = nextByte()) && i < max_length; i++)
			str += String.fromCharCode(byte);
		return str;
	};

	this.byte = function() {
		checkDataSize(1);
		return nextByte();
	};
	this.uint16 = function() {
		checkDataSize(2);
		return nextUint16();
	};
	this.uint32 = function() {
		checkDataSize(4);
		return nextUint32();
	};
	this.float = function() {
		checkDataSize(4);
		return nextFloat();
	};
	this.vector = function() {
		checkDataSize(3 * 4);
		return nextVector();
	};	

	var makeArray = function(next, count) {
		var arr = new Array(count);
		for (var i = 0; i < count; i++)
			arr[i] = next();
		return arr;

	};
	this.uint16Array = function(count) {
		checkDataSize(2 * count);
		return makeArray(nextUint16, count);
	};
	this.uint32Array = function(count) {
		checkDataSize(4 * count);
		return makeArray(nextUint32, count);
	};
	this.floatArray = function(count) {
		checkDataSize(4 * count);
		return makeArray(nextFloat, count);
	};
	this.vectorArray = function(count) {
		checkDataSize(3 * 4 * count);
		return makeArray(nextVector, count);
	};
}
