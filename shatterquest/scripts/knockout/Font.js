var g_fontVertVbo = 0;
var g_fontCoordVbo = 0;
var g_fontIdxVbo = 0;
function drawText(text,font,x,y)
{
var i;
var ch;
var letters = 0;
var verts;
var coords;

	if (!font) return;

	verts = new Array(4*3*text.length);
	coords = new Array(4*2*text.length);
	if (!font.texture)
		return font.texture = loadTexture(font.url,true,false,gl.CLAMP_TO_EDGE,font.colored ? gl.RGBA : gl.ALPHA);
	
	if (!font.texture.texGL)
		return;
	
	gl.bindTexture(gl.TEXTURE_2D, font.texture.texGL);
	
	x /= font.scale;
	y /= font.scale;

	for (i = 0; i < text.length; i++)
	{
		var ch = font.chars[text.charCodeAt(i)];
		if (!ch)
		{
			x += font.height / font.scale;
		}
		else
		{
			var u = [(x + ch.xoffset) * font.scale, (x + ch.xoffset + ch.width) * font.scale];
			var v = [(y + ch.yoffset) * font.scale, (y + ch.yoffset + ch.height) * font.scale];
			var s = [ch.x / font.texture.width, (ch.x + ch.width) / font.texture.width];
			var t = [ch.y / font.texture.height, (ch.y + ch.height) / font.texture.height];
			var vspot = 4*3*letters;
			var cspot = 4*2*letters;

			verts[vspot + 0] = u[0], verts[vspot + 1] = v[0], verts[vspot + 2] = -1,
			verts[vspot + 3] = u[1], verts[vspot + 4] = v[0], verts[vspot + 5] = -1,
			verts[vspot + 6] = u[1], verts[vspot + 7] = v[1], verts[vspot + 8] = -1,
			verts[vspot + 9] = u[0], verts[vspot + 10] = v[1], verts[vspot + 11] = -1;

			coords[cspot + 0] = s[0], coords[cspot + 1] = t[0],
			coords[cspot + 2] = s[1], coords[cspot + 3] = t[0],
			coords[cspot + 4] = s[1], coords[cspot + 5] = t[1],
			coords[cspot + 6] = s[0], coords[cspot + 7] = t[1];
			
			letters++;
			x += ch.xadvance;
		}
	}
	
	if (!g_fontIdxVbo)
	{
		var arr = new Array(6*100);
		for (i = 0; i < 100; i++)
		{
			arr[0 + 6*i] = 0 + 4*i;
			arr[1 + 6*i] = 1 + 4*i;
			arr[2 + 6*i] = 2 + 4*i;
			arr[3 + 6*i] = 0 + 4*i;
			arr[4 + 6*i] = 2 + 4*i;
			arr[5 + 6*i] = 3 + 4*i;
		}
		g_fontIdxVbo = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g_fontIdxVbo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arr), gl.STATIC_DRAW);
	}
	ASSERT(letters <= 100);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g_fontIdxVbo);

	if (!g_fontVertVbo)
	{
		g_fontVertVbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, g_fontVertVbo);
		gl.bufferData(gl.ARRAY_BUFFER, 3*4*100, gl.DYNAMIC_DRAW);
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, g_fontVertVbo);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(verts));
	Nova_VertexPointer(3, gl.FLOAT, gl.FALSE, 0, 0);

	if (!g_fontCoordVbo)
	{
		g_fontCoordVbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, g_fontCoordVbo);
		gl.bufferData(gl.ARRAY_BUFFER, 2*4*100, gl.STATIC_DRAW);
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, g_fontCoordVbo);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(coords));
	Nova_TexcoordPointer(2, gl.FLOAT, gl.FALSE, 0, 0);

	gl.drawElements(gl.TRIANGLES, 6*letters, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

function textWidth(text,font)
{
var ch;
var width = 0;
var i;

	for (i = 0; i < text.length; i++)
	{
		var ch = font.chars[text.charCodeAt(i)];
		if (!ch)
			width += font.height / font.scale;
		else
			width += ch.xadvance;
	}
	return width * font.scale;
}

var Verdana64_chars = new Array(128);
Verdana64_chars[32] = {x:508, y:42, width:1, height:1, xoffset:0, yoffset:53, xadvance:18};
Verdana64_chars[33] = {x:505, y:82, width:6, height:39, xoffset:8, yoffset:14, xadvance:21};
Verdana64_chars[34] = {x:332, y:157, width:16, height:16, xoffset:4, yoffset:12, xadvance:24};
Verdana64_chars[35] = {x:176, y:93, width:34, height:39, xoffset:5, yoffset:14, xadvance:43};
Verdana64_chars[36] = {x:160, y:0, width:26, height:50, xoffset:4, yoffset:12, xadvance:33};
Verdana64_chars[37] = {x:351, y:0, width:50, height:41, xoffset:4, yoffset:13, xadvance:57};
Verdana64_chars[38] = {x:402, y:0, width:38, height:41, xoffset:3, yoffset:13, xadvance:38};
Verdana64_chars[39] = {x:349, y:157, width:6, height:16, xoffset:4, yoffset:12, xadvance:14};
Verdana64_chars[40] = {x:0, y:0, width:16, height:52, xoffset:5, yoffset:12, xadvance:24};
Verdana64_chars[41] = {x:17, y:0, width:16, height:52, xoffset:3, yoffset:12, xadvance:24};
Verdana64_chars[42] = {x:226, y:172, width:26, height:25, xoffset:4, yoffset:12, xadvance:33};
Verdana64_chars[43] = {x:265, y:132, width:33, height:32, xoffset:5, yoffset:20, xadvance:43};
Verdana64_chars[44] = {x:288, y:165, width:11, height:18, xoffset:4, yoffset:45, xadvance:19};
Verdana64_chars[45] = {x:410, y:156, width:16, height:5, xoffset:4, yoffset:34, xadvance:24};
Verdana64_chars[46] = {x:403, y:156, width:6, height:8, xoffset:6, yoffset:45, xadvance:19};
Verdana64_chars[47] = {x:228, y:0, width:23, height:49, xoffset:-1, yoffset:12, xadvance:24};
Verdana64_chars[48] = {x:95, y:52, width:27, height:41, xoffset:3, yoffset:13, xadvance:33};
Verdana64_chars[49] = {x:195, y:133, width:21, height:39, xoffset:7, yoffset:14, xadvance:33};
Verdana64_chars[50] = {x:451, y:42, width:26, height:40, xoffset:4, yoffset:13, xadvance:33};
Verdana64_chars[51] = {x:313, y:43, width:25, height:41, xoffset:4, yoffset:13, xadvance:33};
Verdana64_chars[52] = {x:31, y:135, width:29, height:39, xoffset:2, yoffset:14, xadvance:33};
Verdana64_chars[53] = {x:287, y:47, width:25, height:41, xoffset:5, yoffset:13, xadvance:33};
Verdana64_chars[54] = {x:151, y:51, width:27, height:41, xoffset:3, yoffset:13, xadvance:33};
Verdana64_chars[55] = {x:61, y:135, width:27, height:39, xoffset:4, yoffset:14, xadvance:33};
Verdana64_chars[56] = {x:66, y:52, width:28, height:41, xoffset:3, yoffset:13, xadvance:33};
Verdana64_chars[57] = {x:123, y:51, width:27, height:41, xoffset:3, yoffset:13, xadvance:33};
Verdana64_chars[58] = {x:504, y:123, width:6, height:29, xoffset:9, yoffset:24, xadvance:24};
Verdana64_chars[59] = {x:253, y:132, width:11, height:39, xoffset:6, yoffset:24, xadvance:24};
Verdana64_chars[60] = {x:0, y:176, width:30, height:30, xoffset:6, yoffset:21, xadvance:43};
Verdana64_chars[61] = {x:300, y:161, width:31, height:16, xoffset:6, yoffset:28, xadvance:43};
Verdana64_chars[62] = {x:473, y:123, width:30, height:30, xoffset:7, yoffset:21, xadvance:43};
Verdana64_chars[63] = {x:478, y:42, width:22, height:40, xoffset:4, yoffset:13, xadvance:29};
Verdana64_chars[64] = {x:252, y:0, width:44, height:46, xoffset:4, yoffset:13, xadvance:53};
Verdana64_chars[65] = {x:68, y:94, width:35, height:39, xoffset:0, yoffset:14, xadvance:36};
Verdana64_chars[66] = {x:0, y:136, width:30, height:39, xoffset:5, yoffset:14, xadvance:36};
Verdana64_chars[67] = {x:478, y:0, width:32, height:41, xoffset:3, yoffset:13, xadvance:37};
Verdana64_chars[68] = {x:313, y:85, width:33, height:39, xoffset:5, yoffset:14, xadvance:41};
Verdana64_chars[69] = {x:89, y:134, width:26, height:39, xoffset:5, yoffset:14, xadvance:33};
Verdana64_chars[70] = {x:169, y:133, width:25, height:39, xoffset:5, yoffset:14, xadvance:30};
Verdana64_chars[71] = {x:0, y:53, width:34, height:41, xoffset:3, yoffset:13, xadvance:41};
Verdana64_chars[72] = {x:443, y:83, width:30, height:39, xoffset:5, yoffset:14, xadvance:40};
Verdana64_chars[73] = {x:237, y:132, width:15, height:39, xoffset:3, yoffset:14, xadvance:22};
Verdana64_chars[74] = {x:0, y:95, width:18, height:40, xoffset:1, yoffset:14, xadvance:24};
Verdana64_chars[75] = {x:380, y:84, width:31, height:39, xoffset:5, yoffset:14, xadvance:36};
Verdana64_chars[76] = {x:143, y:133, width:25, height:39, xoffset:5, yoffset:14, xadvance:29};
Verdana64_chars[77] = {x:140, y:93, width:35, height:39, xoffset:5, yoffset:14, xadvance:44};
Verdana64_chars[78] = {x:474, y:83, width:30, height:39, xoffset:5, yoffset:14, xadvance:39};
Verdana64_chars[79] = {x:441, y:0, width:36, height:41, xoffset:3, yoffset:13, xadvance:41};
Verdana64_chars[80] = {x:116, y:134, width:26, height:39, xoffset:5, yoffset:14, xadvance:32};
Verdana64_chars[81] = {x:122, y:0, width:37, height:50, xoffset:3, yoffset:13, xadvance:41};
Verdana64_chars[82] = {x:347, y:85, width:32, height:39, xoffset:5, yoffset:14, xadvance:37};
Verdana64_chars[83] = {x:35, y:52, width:30, height:41, xoffset:3, yoffset:13, xadvance:36};
Verdana64_chars[84] = {x:279, y:89, width:33, height:39, xoffset:0, yoffset:14, xadvance:32};
Verdana64_chars[85] = {x:390, y:42, width:30, height:40, xoffset:4, yoffset:14, xadvance:39};
Verdana64_chars[86] = {x:104, y:94, width:35, height:39, xoffset:0, yoffset:14, xadvance:36};
Verdana64_chars[87] = {x:19, y:95, width:48, height:39, xoffset:2, yoffset:14, xadvance:52};
Verdana64_chars[88] = {x:245, y:92, width:33, height:39, xoffset:2, yoffset:14, xadvance:36};
Verdana64_chars[89] = {x:211, y:92, width:33, height:39, xoffset:0, yoffset:14, xadvance:32};
Verdana64_chars[90] = {x:412, y:83, width:30, height:39, xoffset:3, yoffset:14, xadvance:36};
Verdana64_chars[91] = {x:101, y:0, width:14, height:51, xoffset:6, yoffset:12, xadvance:24};
Verdana64_chars[92] = {x:204, y:0, width:23, height:49, xoffset:2, yoffset:12, xadvance:24};
Verdana64_chars[93] = {x:86, y:0, width:14, height:51, xoffset:4, yoffset:12, xadvance:24};
Verdana64_chars[94] = {x:253, y:172, width:34, height:22, xoffset:5, yoffset:14, xadvance:43};
Verdana64_chars[95] = {x:427, y:156, width:34, height:4, xoffset:0, yoffset:57, xadvance:33};
Verdana64_chars[96] = {x:391, y:156, width:11, height:10, xoffset:9, yoffset:10, xadvance:33};
Verdana64_chars[97] = {x:355, y:125, width:25, height:31, xoffset:2, yoffset:23, xadvance:32};
Verdana64_chars[98] = {x:324, y:0, width:26, height:42, xoffset:5, yoffset:12, xadvance:33};
Verdana64_chars[99] = {x:381, y:124, width:24, height:31, xoffset:2, yoffset:23, xadvance:27};
Verdana64_chars[100] = {x:297, y:0, width:26, height:42, xoffset:2, yoffset:12, xadvance:33};
Verdana64_chars[101] = {x:299, y:129, width:27, height:31, xoffset:2, yoffset:23, xadvance:31};
Verdana64_chars[102] = {x:364, y:42, width:19, height:41, xoffset:1, yoffset:12, xadvance:18};
Verdana64_chars[103] = {x:206, y:50, width:26, height:41, xoffset:2, yoffset:23, xadvance:33};
Verdana64_chars[104] = {x:339, y:43, width:24, height:41, xoffset:5, yoffset:12, xadvance:33};
Verdana64_chars[105] = {x:501, y:42, width:6, height:39, xoffset:4, yoffset:14, xadvance:15};
Verdana64_chars[106] = {x:187, y:0, width:16, height:50, xoffset:-2, yoffset:14, xadvance:18};
Verdana64_chars[107] = {x:179, y:51, width:26, height:41, xoffset:5, yoffset:12, xadvance:31};
Verdana64_chars[108] = {x:384, y:42, width:5, height:41, xoffset:5, yoffset:12, xadvance:15};
Verdana64_chars[109] = {x:430, y:123, width:42, height:30, xoffset:5, yoffset:23, xadvance:51};
Verdana64_chars[110] = {x:31, y:175, width:24, height:30, xoffset:5, yoffset:23, xadvance:33};
Verdana64_chars[111] = {x:327, y:125, width:27, height:31, xoffset:2, yoffset:23, xadvance:32};
Verdana64_chars[112] = {x:260, y:47, width:26, height:41, xoffset:5, yoffset:23, xadvance:33};
Verdana64_chars[113] = {x:233, y:50, width:26, height:41, xoffset:2, yoffset:23, xadvance:33};
Verdana64_chars[114] = {x:207, y:173, width:18, height:29, xoffset:5, yoffset:24, xadvance:22};
Verdana64_chars[115] = {x:406, y:124, width:23, height:31, xoffset:3, yoffset:23, xadvance:27};
Verdana64_chars[116] = {x:217, y:132, width:19, height:39, xoffset:1, yoffset:15, xadvance:21};
Verdana64_chars[117] = {x:56, y:175, width:24, height:30, xoffset:4, yoffset:24, xadvance:33};
Verdana64_chars[118] = {x:122, y:174, width:29, height:29, xoffset:1, yoffset:24, xadvance:31};
Verdana64_chars[119] = {x:81, y:175, width:40, height:29, xoffset:2, yoffset:24, xadvance:43};
Verdana64_chars[120] = {x:152, y:173, width:29, height:29, xoffset:1, yoffset:24, xadvance:31};
Verdana64_chars[121] = {x:421, y:42, width:29, height:40, xoffset:1, yoffset:24, xadvance:31};
Verdana64_chars[122] = {x:182, y:173, width:24, height:29, xoffset:2, yoffset:24, xadvance:28};
Verdana64_chars[123] = {x:60, y:0, width:25, height:51, xoffset:4, yoffset:12, xadvance:33};
Verdana64_chars[124] = {x:116, y:0, width:5, height:51, xoffset:10, yoffset:12, xadvance:24};
Verdana64_chars[125] = {x:34, y:0, width:25, height:51, xoffset:4, yoffset:12, xadvance:33};
Verdana64_chars[126] = {x:356, y:157, width:34, height:15, xoffset:5, yoffset:28, xadvance:43};

var Verdana40Outline_chars = new Array(128);
Verdana40Outline_chars[40] = {x:0, y:0, width:16, height:38, xoffset:0, yoffset:5, xadvance:15};
Verdana40Outline_chars[41] = {x:17, y:0, width:16, height:38, xoffset:-1, yoffset:5, xadvance:15};
Verdana40Outline_chars[42] = {x:0, y:102, width:22, height:21, xoffset:-1, yoffset:5, xadvance:21};
Verdana40Outline_chars[43] = {x:69, y:69, width:27, height:27, xoffset:0, yoffset:9, xadvance:27};
Verdana40Outline_chars[44] = {x:23, y:102, width:13, height:17, xoffset:-1, yoffset:25, xadvance:12};
Verdana40Outline_chars[46] = {x:37, y:102, width:10, height:11, xoffset:1, yoffset:25, xadvance:12};
Verdana40Outline_chars[47] = {x:34, y:0, width:20, height:36, xoffset:-3, yoffset:5, xadvance:15};
Verdana40Outline_chars[48] = {x:76, y:0, width:23, height:31, xoffset:-1, yoffset:5, xadvance:21};
Verdana40Outline_chars[49] = {x:49, y:69, width:19, height:30, xoffset:1, yoffset:6, xadvance:21};
Verdana40Outline_chars[50] = {x:48, y:37, width:22, height:31, xoffset:0, yoffset:5, xadvance:21};
Verdana40Outline_chars[51] = {x:71, y:37, width:22, height:31, xoffset:0, yoffset:5, xadvance:21};
Verdana40Outline_chars[52] = {x:0, y:71, width:25, height:30, xoffset:-2, yoffset:6, xadvance:21};
Verdana40Outline_chars[53] = {x:94, y:32, width:22, height:31, xoffset:0, yoffset:5, xadvance:21};
Verdana40Outline_chars[54] = {x:100, y:0, width:23, height:31, xoffset:-1, yoffset:5, xadvance:21};
Verdana40Outline_chars[55] = {x:26, y:71, width:22, height:30, xoffset:-1, yoffset:6, xadvance:21};
Verdana40Outline_chars[56] = {x:0, y:39, width:23, height:31, xoffset:-1, yoffset:5, xadvance:21};
Verdana40Outline_chars[57] = {x:24, y:39, width:23, height:31, xoffset:-1, yoffset:5, xadvance:21};
Verdana40Outline_chars[58] = {x:117, y:32, width:10, height:24, xoffset:3, yoffset:12, xadvance:15};
Verdana40Outline_chars[92] = {x:55, y:0, width:20, height:36, xoffset:-2, yoffset:5, xadvance:15};
Verdana40Outline_chars[120] = {x:97, y:64, width:24, height:24, xoffset:-2, yoffset:12, xadvance:20};

var Verdana32 = {url:'images/text-64.png', texture:null, colored:false, height:32, scale:.5, chars:Verdana64_chars};
var Verdana32Signs = {url:'images/signs/text-64.png', colored:true, texture:null, height:32, scale:.5, chars:Verdana64_chars};
var Verdana20Outline = {url:'images/Text40Outline.png', texture:null, height:20, scale:.5, chars:Verdana40Outline_chars};
