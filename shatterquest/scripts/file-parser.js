var ekMapStartTag = 0xf02b;
var ekNovaMapStartTag = 0xf02C;
var ekThemeStartTag = 0xf02d;

var ekMapTagsFirst = 0xf100;
var ekVersionTag = 0xf100;
var ekPolygonCountTag = 0xf101;
var ekVertexCountTag = 0xf102;
var ekTextureCountTag = 0xf103;
var ekStartPositionTag = 0xf106;
var ekStartViewAngleTag = 0xf107;
var ekTextureTag = 0xf108;
var ekPolygonTag = 0xf109;
var ekTopGroupTagDeprecated = 0xf10a;
var ekTopGroupTag = 0xf10b;
var ekBlockCountTag = 0xf10c;
var ekAmbientLightTag = 0xf10d;
var ekLightColorTag = 0xf10e;
var ekLightDirTag = 0xf10f;
var ekBspOrderTag = 0xf110;
var	ekMapTagsLast = 0xf10d;

var ekTextureTagsFirst = 0xe000;
var ekScaleTagOldScheme = 0xe000;
var ekScaleTag = 0xe003;
var ekNameTag = 0xe001;
var ekJpgBitsTag = 0xe002;
var ekPngBitsTag = 0xe004;
var ekTextureTagsLast = 0xe003;

var ekPolygonTagsFirst = 0xd000;
var ekTextureIndexTag = 0xd000;
var ekFlagsTag = 0xd001;
var ekMapStartQ8Tag = 0xd002;
var ekVertexTag = 0xd003;
var ekTextureOriginTag = 0xd004;
var ekColorTag = 0xd005;
var ekPolygonListTag = 0xd006;
var ekTriangleIndicesTag = 0xd007;
var ekPolygonTagsLast = 0xd008;

var ekVertexTagsFirst = 0xc000;
var ekXYZDoubleTag = 0xc000;
var ekFloatVerticesTag = 0xc001;
var ekTriangleVerticesTag = 0xc02;
var ekVertexTagsLast = 0xc003;

var ekGroupTagsFirst = 0xb000;
var ekGroupGroupTag = 0xb000;
var ekSinglePolygonGroupTag = 0xb001;
var ekMapPolygonIndexTag = 0xb002;
var ekMapPolygonTag = 0xb003;
var ekBlockGroupTag = 0xb004;
var ekChangerGroupTag = 0xb005;
var ekKillerGroupTag = 0xb006;
var ekInversionGroupTag = 0xb007;
var ekSpeedupGroupTag = 0xb008;
var ekGhostGroupTag = 0xb009;
var ekCheckpointGroupTag = 0xb010;
var ekSpikeBlockGroupTag = 0xb011;
var ekSpikeBallGroupTag = 0xb012;
var ekAngleTag = 0xb013;
var ekBlockGroupGroupTag = 0xb014;
var ekStepperGroupTag = 0xb015;
var ekCoasterGroupTag = 0xb016;
var ekExtraGuyGroupTag = 0xb017;
var ekInvincibleGroupTag = 0xb018;
var ekCustomGroupTag = 0xb019;
var ekHiddenGroupTag = 0xb01a;
var ekCustomIdTag = 0xb01b;
var ekCustomGroupDataTag = 0xb01c;
var ekSpringDoorGroupTag = 0xb01d;
var ekHomePosTag = 0xb01e;
var ekStarGroupTag = 0xb01f;
var ekSlidingStarGroupTag = 0xb020;
var ekOriginalColorTag = 0xb021;
var ekLockedDoorGroupTag = 0xb022;
var ekSwitchGroupTag = 0xb023;
var ekGangSwitchGroupTag = 0xb024; 
var ekCameraAngleTag = 0xb025;
var ekCameraPosTag = 0xb026;
var ekGroupTagsLast = 0xb027;

var ekPVSTagsFirst = 0xa000;
var ekPVSTag = 0xa000;
var ekPVSLeftNodeTag = 0xa001;
var ekPVSRightNodeTag = 0xa002;
var ekPVSDividerPlaneTag = 0xa003;
var ekPVSVisiblePolysTag = 0xa004;
var ekPVSTagsLast = 0xa005;

var ekPanoramaTagsFirst = 0x9000;
var ekPanoramaStartTag = 0x9000;
var ekPanoramaLeftTag = 0x9001;
var ekPanoramaRightTag = 0x9002;
var ekPanoramaTopTag = 0x9003;
var ekPanoramaBotTag = 0x9004;
var ekPanoramaFrontTag = 0x9005;
var ekPanoramaBackTag = 0x9006;
var ekPanoramaTagsLast = 0x9007;

var map = 0;
var texture = 0;
var textureCount = 0;

var parse_depth = -1;
var parse_trail = [];
var parse_start_time = 0;
function checkParseTime()
{
	if (new Date().getTime() - parse_start_time > 13)
		throw 'out-of-time';
}

function deserialize(s,length,parse)
{
	parse_depth++;
	if (parse_trail.length != parse_depth) {
		ASSERT(parse_trail.length > parse_depth);
		s.seek(s.tell() + parse_trail[parse_depth]);
	} else
		parse_trail.push(0);

	while (parse_trail[parse_depth] < length)
	{
		var tag = s.uint16();
		var tag_length = s.uint32();
		var next = s.tell() + tag_length;
		parse(s,tag,tag_length);
		s.seek(next);

		ASSERT(parse_trail.length == 1+parse_depth);
		parse_trail[parse_depth] += 2 + 4 + tag_length;

		checkParseTime();
	}

	parse_trail.pop();
	parse_depth--;
}

function parseTexture(s,tag,length)
{
	ASSERT(tag != ekPngBitsTag);
	switch (tag)
	{
	case ekNameTag:
		texture.name = s.nullTerminatedString(length);
		if (startsWith(texture.name, "wood"))
			texture.soundId = ekWoodSound;
		else if (startsWith(texture.name, "carpet"))
			texture.soundId = ekCarpetSound;
		else		  
			texture.soundId = ekClickSound;
		break;
	case ekScaleTag:
		texture.xScale = s.float();
		texture.yScale = s.float();
		break;
	case ekJpgBitsTag:
		if (!texture.read_bytes) {
			texture.read_bytes = 0;
			texture.base64_data = '';
		} else
			s.seek(s.tell() + texture.read_bytes);

		var max_chunk_size = 24;
		while (texture.read_bytes != length) {
			var chunk_size = Math.min(length - texture.read_bytes, max_chunk_size);
			texture.base64_data += base64enc(s.string(chunk_size));
			texture.read_bytes += chunk_size;
			checkParseTime();
		}
		loadTexture(base64ImageUrl('jpeg', texture.base64_data),
		            texture.bMipMap, true, texture.wrap, gl.RGBA, texture);

		delete texture.base64_data;
		break;
	}
}

function parsePanorama(s,tag,length)
{
	if (!texture)
		texture = {wrap:gl.CLAMP_TO_EDGE, bMipmap:false};
	deserialize(s,length,parseTexture);
	switch (tag)
	{
	case ekPanoramaLeftTag:
		map.theme.panorama[2] = texture;
		break;
	case ekPanoramaRightTag:
		map.theme.panorama[3] = texture;
		break;
	case ekPanoramaTopTag:
		map.theme.panorama[0] = texture;
		break;
	case ekPanoramaBotTag:
		map.theme.panorama[1] = texture;
		break;
	case ekPanoramaFrontTag:
		map.theme.panorama[4] = texture;
		break;
	case ekPanoramaBackTag:
		map.theme.panorama[5] = texture;
		break;
	}
	texture = 0;
}

function parseTheme(s,tag,length)
{
	switch (tag)
	{
	case ekTextureCountTag:
		map.theme.textureCount = s.uint32();
		map.theme.texts = new Array(map.theme.textureCount);
		textureCount = 0;
		break;
	case ekTextureTag:
		if (!texture)
			texture = {wrap:gl.REPEAT, bMipmap:true};
		deserialize(s,length,parseTexture);
		map.theme.texts[textureCount++] = texture;
		texture = 0;
		break;
	case ekPanoramaStartTag:
		deserialize(s,length,parsePanorama);
		break;
	}
}

var vertCount;
var polygon = 0;
var polyCount = 0;
var blockVertices;
var pPvsNode;
var spikeBall = 0;
var Set_pBlock;
var g_parsingBlock = 0;
var g_parsedBlock = 0;
var indCount;
var oldPolyGroupCount = -1;

function defaultSetPBlock(b)
{
	g_parsingBlock = b;
}
function hiderSetPBlock(b)
{
	g_parsingBlock = Hider_New(b);
}

function parsePolygon(s,tag,length)
{
	switch (tag)
	{
	case ekTextureIndexTag:
		var i = s.uint32();
		if (i != -1)
			polygon.primitive.pTexture = map.theme.texts[i];
		else
			polygon.primitive.pTexture = NullTexture.value();
		break;
	case ekFlagsTag:
		polygon.primitive.flags = s.uint32();
		break;
	case ekTextureOriginTag:
		polygon.st0 = s.floatArray(2);
		break;
	case ekColorTag:
		polygon.primitive.color = s.floatArray(3);
		polygon.primitive.color.push(1);
		break;
	case ekFloatVerticesTag:
		var count = length/(4*3);
		polygon.vertex = s.vectorArray(count);
		polygon.sides = count;
		vertCount += count;
		break;
	case ekTriangleIndicesTag:
		var count = length/2;
		polygon.pTriIndices = new Uint16Array(s.uint16Array(count));
		polygon.indices = count;
		break;
	}
}

function parsePolygonList(s,tag,length)
{
	switch (tag)
	{
	case ekTriangleVerticesTag:
		var float_count = length / 4;
		var floats = s.floatArray(float_count);
		map.polyGroups[0].glvertCount = float_count / 5;
		map.polyGroups[0].glverts = [];
		for (i = 0; i < float_count; i += 5)
		{
			map.polyGroups[0].glverts.push([
				floats[0+i], floats[1+i], floats[2+i],
				0, 0, 0, 0,
				floats[3+i] * textureScale, floats[4+i] * textureScale
			]);
		}
		break;
	case ekPolygonTag:
		if (!polygon)
			polygon = Polygon_New();
		deserialize(s,length,parsePolygon);
		map.polyGroups[0].polys[polyCount++] = polygon;
		polygon = 0;
		break;
	}
}

function parsePvsNode(s,tag,length)
{
	switch (tag)
	{
	case ekPVSLeftNodeTag:
		var pThis = pPvsNode;
		if (!pThis.left)
			pThis.left = {};
		pPvsNode = pThis.left;
		deserialize(s,length,parsePvsNode);
		pPvsNode = pThis;
		break;
	case ekPVSRightNodeTag:
		pThis = pPvsNode;
		if (!pThis.right)
			pThis.right = {};
		pPvsNode = pThis.right;
		deserialize(s,length,parsePvsNode);
		pPvsNode = pThis;
		break;
	case ekPVSDividerPlaneTag:
		var v = s.vector();
		var k = s.float();
		pPvsNode.divide = {
			normal: v,
			k: k
		};
		break;
	case ekPVSVisiblePolysTag:
		pPvsNode.bVisibles = s.uint32Array(length/4);
		break;
	}
}

function parseSpikeBall(s,tag,length)
{
	switch (tag)
	{
	case ekAngleTag:
		var yaw = s.float();
		var pitch = s.float();
		spikeBall.velocity = [cos(yaw * pi/180) * cos(pitch * pi/180),
		                      sin(yaw * pi/180) * cos(pitch * pi/180),
		                      sin(pitch * pi/180)];
		break;
	case ekFloatVerticesTag:
		var sum = [0,0,0];
		var count = 0;
		while (length > 0)
		{
			sum = Vector_Add(sum, s.vector());
			count++;
			length -= 3 * 4;
		}
		spikeBall.sphere.position = Vector_Scale(sum, 1 / count);
		spikeBall.prevCollision = Vector_Scale(sum, 1 / count);
		spikeBall.nextCollision = Vector_Scale(sum, 1 / count);
		break;
	case ekColorTag:
		spikeBall.color = s.floatArray(3);
		break;
	}
}

function parseBlock(s,tag,length)
{
	switch (tag)
	{
	case ekColorTag:
		g_parsingBlock.color = s.floatArray(3).concat([g_parsingBlock.group.transparent ? 0.64 : 1]);
		break;
	case ekFloatVerticesTag:
		ASSERT(length == 4 * 3 * 8);
		blockVertices = s.vectorArray(8);
		break;
	case ekAngleTag:
		g_parsingBlock.yaw = s.float();
		g_parsingBlock.pitch = s.float();
		break;
	case ekCameraAngleTag:
		g_parsingBlock.camYaw = s.float();
		g_parsingBlock.camPitch = s.float();
		break;
	case ekCameraPosTag:
		g_parsingBlock.camPos = s.vector();
		break;
	}
}

var g_customParseFunc;
function parseCustomGroup(s,tag,length)
{
	switch (tag)
	{
	case ekCustomIdTag:
		ASSERT(length == 17);
		var id = s.nullTerminatedString(length);
		g_customParseFunc = Puzzles_GetParser(id);
		break;
	case ekCustomGroupDataTag:
		deserialize(s,length,g_customParseFunc);
		break;
	}
}

function deserializeBlockWith(block,s,length,parseFunc)
{
	if (!g_parsingBlock)
		Set_pBlock(block);
	deserialize(s,length,parseFunc);
	g_parsingBlock.group.index = map.polyGroupCount; 
	g_parsingBlock.iBlockGroup = map.blockGroupCount;
	g_parsingBlock.LoadPolys(g_parsingBlock, blockVertices);
	ASSERT(g_parsingBlock.group.polys);
	map.polyGroups[map.polyGroupCount++] = g_parsingBlock;
	g_parsedBlock = g_parsingBlock;
	g_parsingBlock = 0;
}

function deserializeBlock(block,s,length)
{
	deserializeBlockWith(block,s,length,parseBlock);
}

function parseMover(s,tag,length)
{
	switch (tag)
	{
		case ekHomePosTag:
			Mover_SetHome(g_parsingBlock, s.vector());
			break;
		default:
			parseBlock(s,tag,length);
			break;
	}
}

function parseHiderGroup(s,tag,length)
{
	switch (tag)
	{
	case ekOriginalColorTag:
		Hider_SetHiderColor(g_parsedBlock, s.floatArray(3));	  
		break;
	default:
		parseBlockGroup(s,tag,length);
		break;
	}
}

function parseBlockGroup(s,tag,length)
{
	switch (tag)
	{
		case ekStarGroupTag:
			deserializeBlock(Star_New(),s,length);
			break;
		case ekBlockGroupTag:
			deserializeBlock(Block_New(),s,length);
			break;
		case ekStepperGroupTag:
			deserializeBlockWith(Stepper_New(),s,length, parseMover);
			break;
		case ekCoasterGroupTag:
			deserializeBlockWith(Coaster_New(),s,length, parseMover);
			break;
		case ekSwitchGroupTag:
			deserializeBlockWith(Switch_New(),s,length, parseMover);
			break;
		case ekGangSwitchGroupTag:
			deserializeBlockWith(GangSwitch_New(),s,length, parseMover);
			break;
		case ekSpringDoorGroupTag:
			deserializeBlockWith(SpringDoor_New(),s,length, parseMover);
			break;
		case ekLockedDoorGroupTag:
			deserializeBlockWith(LockedDoor_New(),s,length, parseMover);
			break;
		case ekChangerGroupTag:
			deserializeBlock(Changer_New(),s,length);
			break;
		case ekKillerGroupTag:
			deserializeBlock(Killer_New(),s,length);
			break; 
		case ekInversionGroupTag:
			deserializeBlock(Inversion_New(),s,length);
			break; 
		case ekSpeedupGroupTag:
			deserializeBlock(Speedup_New(),s,length);
			break; 
		case ekGhostGroupTag:
			deserializeBlock(Ghost_New(),s,length);
			break;
		case ekCheckpointGroupTag:
			deserializeBlock(Checkpoint_New(),s,length);
			break;
		case ekExtraGuyGroupTag:
			deserializeBlock(ExtraGuy_New(),s,length);
			break;
		case ekInvincibleGroupTag:
			deserializeBlock(Invincible_New(),s,length);
			break;
		case ekHiddenGroupTag:
			if (oldPolyGroupCount == -1)
				oldPolyGroupCount = map.polyGroupCount;
			var oldSetter = Set_pBlock;
			Set_pBlock = hiderSetPBlock;
			deserialize(s,length,parseHiderGroup);
			ASSERT(map.polyGroupCount == oldPolyGroupCount + 1);
			Set_pBlock = oldSetter;
			oldPolyGroupCount = -1;
			break;
		case ekCustomGroupTag:
			deserialize(s,length,parseCustomGroup);
			break;
		case ekSpikeBallGroupTag:
			if (map.spikeCount + 1 < maxSpikeBalls)
			{
				if (!spikeBall)
					spikeBall = Spike_New();
				deserialize(s,length,parseSpikeBall);
				spikeBall.type = ekStatic;
				ASSERT(map.spikeCount < maxSpikeBalls);
				map.spikeBalls[map.spikeCount++] = spikeBall;
				spikeBall = 0;
			}
			break;
		case ekBlockGroupGroupTag:
			deserialize(s,length,parseBlockGroup);
			break;
	}
}

function parseMap(s,tag,length)
{
	switch (tag)
	{
	case ekBlockCountTag:
		var count = s.uint32();
		map.polyGroups = new Array(1+count);
		map.blockGroups = new Array(count);
		map.blockGroupCount = 0;
		for (var i = 0; i < count; i++)
		{
			map.blockGroups[i] = {blockCount:0,
			                      blocksKnockedOut:0,
			                      pointsEarned:0,
			                      specialKnockedOut:false};
		}
		break;
	case ekPolygonCountTag:
		var count = s.uint32();
		map.polyGroupCount = 1;
		map.polyGroups[0] = PolygonGroup_New(count);
		map.polyGroups[0].polyCount = count;
		map.polyGroups[0].index = 0;
		polyCount = 0;
		break;
	case ekVertexCountTag:
		map.polyGroups[0].vertexCount = s.uint32();
		//map.polyGroups[0].verts = [];
		//map.polyGroups[0].edgeNorms = [];
		break;
	case ekStartPositionTag:
		map.startPos = s.vector();
		break;
	 case ekStartViewAngleTag:
		map.yawStart = s.float();
		map.pitchStart = s.float();
		break;
	 case ekAmbientLightTag:
 		map.ambientLight = s.floatArray(3);
	 	break;
	 case ekLightColorTag:
 		map.lightColor = s.floatArray(3);
	 	break;
	 case ekLightDirTag:
	 	map.lightDir = s.vector();
	 	break;
	 case ekPolygonListTag:
	 	deserialize(s,length,parsePolygonList);
		break;
	 case ekBlockGroupGroupTag:
		var i = map.polyGroupCount;
		deserialize(s,length,parseBlockGroup);
		map.blockGroups[map.blockGroupCount++].blockCount = map.polyGroupCount - i; 
		break;
	 case ekPVSTag:
		if (!map.pvsTree)
			map.pvsTree = {};
		pPvsNode = map.pvsTree;
		deserialize(s,length,parsePvsNode);
		break;
	case ekBspOrderTag:
		map.bspOrderCount = length/2;
		map.bspOrder = s.uint16Array(map.bspOrderCount);
		break;
	}
}

function parseMapEntry(s,tag,length)
{
	if (tag == ekThemeStartTag)
	{
		if (!map)
		{
			map = {theme: {panorama:[]},
			       spikeCount: 0,
			       spikeBalls: new Array(maxSpikeBalls)};
		}
		deserialize(s,length,parseTheme);
	}
	else if (tag == ekNovaMapStartTag)
	{
		Set_pBlock = defaultSetPBlock;
		deserialize(s,length,parseMap);
	}
}

function loadLevel(name, setProgress, state, continuation)
{
	parse_trail = [];

	map = 0;
	texture = 0;
	polygon = 0;
	g_parsingBlock = 0;
	g_parsedBlock = 0;
	spikeBall = 0;
	oldPolyGroupCount = -1;

	var parse_pending = false;
	var parseRequest = function(file_size) {
		parse_pending = false;

		if (!checkState(state)) {
			request.abort();
			return;
		}

		parse_depth = -1;
		var stream = new BinaryStream(request.responseText);
		parse_start_time = new Date().getTime();
		try {
			deserialize(stream, file_size, parseMapEntry);
			setProgress(.95);
			setTimeout(function() {
				if (!checkState(state))
					return;

				// let the textures load
				if (!total_textures_still_loading) {
					setProgress(1);
					continuation(map);
					map = 0;
				} else
					setTimeout(arguments.callee, 64);
			}, 64);
		} catch (err) {
			if (err === 'out-of-data') {
				setProgress(.95 * request.responseText.length / file_size);
				return;
			}
			if (err === 'out-of-time') {
				setProgress(.95 * stream.tell() / file_size);
				setTimeout(function() {
					parseRequest(file_size);
				}, 1);
				parse_pending = true;
				return;
			}
			throw err;
		}

	};
	var request = new XMLHttpRequest();
	request.onprogress = function(event) {
		if (!parse_pending) {
			setTimeout(function() {parseRequest(event.total)}, 1);
			parse_pending = true;
		}
	}
	request.onreadystatechange = function() {
		if (!parse_pending && request.readyState == 4 && request.status==200) {
			setTimeout(function() {parseRequest(request.responseText.length)}, 1);
			parse_pending = true;
		}
	};
	request.open('GET', 'levels/' + name, true);
	request.overrideMimeType('text/plain; charset=x-user-defined');
	request.setRequestHeader('Content-Type', 'text/plain');
	request.send();
}
