var ekGameDataTag = 0xa90f;
var ekGameStateTag = 0xa036;

var ekSingleLevelGameTag = 0xe000;
var ekMultiLevelGameTag = 0xe001;
var ekLifeCountTag = 0xe002;
var ekLevelStateTag = 0xe003;
var ekMusicStateTag = 0xe005;

var ekGameIndexTag = 0xd000;
var ekCurrentLevelTag = 0xd001;
var ekCurrentScoreTag = 0xd002;
var ekGameNavigatorTag = 0xd003;

var ekBlocksTag = 0xc000;
var ekBallTag = 0xc002;
var ekCameraTag = 0xc003;
var ekStaticSpikeTag = 0xc004;
var ekSpikeCountTag = 0xc005;
var ekDeflectiveSpikeTag = 0xc006;
var ekCheckpointTag = 0xc007;
var ekScoreTag = 0xc008;
var ekTimerTag = 0xc009;
var ekBlockGroupsTag = 0xc00a;
var ekLevelListenerTag = 0xc00b;

var ekInversionTag = 0xb000;
var ekGhostTag = 0xb001;
var ekSpeedupTag = 0xb002;
var ekInvincibleTag = 0xb003;

var ekLevelStatsTag = 0xa000;
var ekGameStatsTag = 0xa001;
var ekMusicEnabledTag = 0xa002;
var ekSoundEnabledTag = 0xa003;
var ekNoTiltTag = 0xa004;
var ekTurnTiltTag = 0xa005;
var ekMoveTiltTag = 0xa006;
var ekVibrationEnabledTag = 0xa007;
var ekTipsGivenTag = 0xa008;
var ekVersionFromLastRunTag = 0xa009;

var ekPolyGroupTag = 0x9000;
var ekPolyGroupIndexTag = 0x9001;
var ekPolyGroupDataTag = 0x902;

var ekVisibleTag = 0x8000;
var ekChangerColorTag = 0x8001;
var ekHiderBlockTag = 0x8002;
var ekHiddenBlockTag = 0x8003;
var ekHiderProxyTag = 0x8004;
var ekShatteredTag = 0x8005;
var ekChangerCheckColorTag = 0x8006;

var ekStepperPosTag = 0x7000;
var ekStepperDecoratorTag = 0x7001;
var ekStepperDecoratorDataTag = 0x7002;
var ekStepperDecoratorCollisionFuncTag = 0x7003;
var ekStepperDecoratorNextFrameFuncTag = 0x7004;

var ekJoystickTypeTag = 0x6001;
var ekJoystickPositionTag = 0x6002;
var ekJoystickVisibleTag = 0x6003;

var psarr;
var ps_stack;
function psBeginWrite()
{
	psarr = [];
	ps_stack = [];
}

function psEndWrite()
{
	var data_string = '';
	for (var i = 0; i < psarr.length; i++)
		data_string += String.fromCharCode(psarr[i]);
	return base64enc(data_string);
}

var psstream;
function psOpenForRead(base64_string)
{
	var data = base64dec(base64_string);
	psstream = new BinaryStream(data);
	return data.length;
}

function psWriteTag(t)
{
	psarr.push(t & 0xff);
	psarr.push((t >> 8) & 0xff);
}

function psBegin(t)
{
	psWriteTag(t);
	psWriteDword(0);
	ps_stack.push({spot:psarr.length, tag:t});
}

function psWriteDwordTag(t,x)
{
	psWriteTag(t);
	psWriteDword(4);
	psWriteDword(x);
}

function psWriteDwordArrayTag(t,arr,n)
{
	psWriteTag(t);
	psWriteDword(4*n);
	psWriteDwordArray(arr,n);
}

function psWriteFloatTag(t,x)
{
	psWriteTag(t);
	psWriteDword(4);
	psWriteFloat(x);
}

function psWriteFloatArrayTag(t,arr,n)
{
	psWriteTag(t);
	psWriteDword(4*n);
	psWriteFloatArray(arr,n);
}

function psWriteFloatArray2dTag(t,arr,h,w)
{
	psWriteTag(t);
	psWriteDword(4*n);
	psWriteFloatArray2d(arr,h,w);
}

function psWriteByteTag(t,x)
{
	psWriteTag(t);
	psWriteDword(1);
	psWriteByte(x);
}

function psWriteByteArrayTag(t,arr,n)
{
	psWriteTag(t);
	psWriteDword(1*n);
	psWriteByteArray(arr,n);
}

function psWriteDword(x)
{
	psarr.push((x >> 0) & 0xff);
	psarr.push((x >> 8) & 0xff);
	psarr.push((x >> 16) & 0xff);
	psarr.push((x >> 24) & 0xff);
}

function psWriteDwordArray(arr,n)
{
	for (var i = 0; i < n; i++)
		psWriteDword(arr[i]);
}

function psWriteFloat(f)
{
	var sign = f < 0;
	f = Math.abs(f);
	var exp,mantissa;
	if (f < 1.0 * Math.pow(2,-126)) {
		exp = 0-127;
		mantissa = Math.floor(f * Math.pow(2,126+23));
	} else {
		exp = 0;
		while (f >= 2) {
			f /= 2;
			exp++;
		}
		while (f < 1) {
			f *= 2;
			exp--;
		}
		mantissa = Math.floor(f * Math.pow(2,23));
	}
	var bits = (((exp+127) & 0xff) << 23) | (mantissa & 0x7fffff);
	if (sign)
		bits |= 1 << 31;
	psWriteDword(bits);
}

function psWriteFloatArray(arr,n)
{
	ASSERT(arr);
	for (var i = 0; i < n; i++)
		psWriteFloat(arr[i]);
}

function psWriteFloatArray2d(arr,h,w)
{
	for (var i = 0; i < h; i++)
		psWriteFloatArray(arr[i], w);
}

function psWriteByte(x)
{
	psarr.push(x & 0xff);
}

function psWriteByteArray(arr,n)
{
	for (var i = 0; i < n; i++)
		psWriteByte(arr[i]);
}

function psEnd(t)
{
	ASSERT(ps_stack.length);
	var last = ps_stack.pop();
	ASSERT(last.tag == t);
	var size = psarr.length - last.spot;
	psarr[last.spot-4] = (size >> 0) & 0xff;
	psarr[last.spot-3] = (size >> 8) & 0xff;
	psarr[last.spot-2] = (size >> 16) & 0xff;
	psarr[last.spot-1] = (size >> 24) & 0xff;
}

function psParse(param,parseFunc,length)
{
	var read = 0;
	while (read < length)
	{
		var t = psstream.uint16();
		var l = psstream.uint32();
		var next = psstream.tell() + l;
		parseFunc(param, t, l);
		psstream.seek(next);
		read += 2 + 4 + l;
	}
}

function psReadFloat()
{
	return psstream.float();
}

function psReadFloatArray(n)
{
	return psstream.floatArray(n);
}

function psReadFloatArray2d(h,w)
{
	var mat = new Array(h);
	for (var i = 0; i < h; i++)
		mat[i] = psstream.floatArray(w);
	return mat;
}

function psReadDword()
{
	return psstream.uint32();
}

function psReadDwordArray(n)
{
	return psstream.uint32Array(n);
}

function psReadByte()
{
	return psstream.byte();
}

function psReadByteArray(n)
{
	return psstream.read(n);
}
