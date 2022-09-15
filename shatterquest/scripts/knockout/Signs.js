var firstTimeDirChanges = 7;
var otherTimesDirChanges = 14;

function Menu_ShowThumbs()
{
	window.showMoveInstructions();
}

var g_signVerts;
var g_signCoords;
var g_signMode;
function beginDraw(theMode)
{
	g_signVerts = [];
	g_signCoords = [];
	g_signMode = theMode;
}

function endDraw()
{
	Nova_DrawArrays(g_signMode, g_signVerts, g_signCoords, g_signVerts.length/3);
}

function texCoord2f(s,t)
{
	g_signCoords.push(s);
	g_signCoords.push(t);
}

function vertex3f(x,y,z)
{
	g_signVerts.push(x);
	g_signVerts.push(y);
	g_signVerts.push(z);
}

///////////////////////////////////////////////////////////////////////////////
// Tutorial level signs
var signBufSize = 32;

///////////////////////////////////////////////////////////////////////////////
// Drawing different signs
function DrawImage(tex,left,top,width,height)
{
	gl.bindTexture(gl.TEXTURE_2D, tex.texGL);
	beginDraw(gl.TRIANGLE_FAN);
	texCoord2f(0, 0); vertex3f(left, top, -1);
	texCoord2f(1, 0); vertex3f(left+width, top, -1);
	texCoord2f(1, 1); vertex3f(left+width, top+height, -1);
	texCoord2f(0, 1); vertex3f(left, top+height, -1);
	endDraw();
	gl.bindTexture(gl.TEXTURE_2D, null);
}

function Sign_SetFaceColor(sign)
{
	var c = sign.b.group.polys[sign.face].primitive.color;
	Nova_Color(c[0]*.75,c[1]*.75,c[2]*.75,sign.alpha);
}

function Red_Draw(sign,depth)
{
var signs = Signs_Get();

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/320,1.0/320,1);
	Nova_Translate(0, 0, depth * 0.01);

	DrawImage(signs.changerTex, 50, 160, 220, 220);

	Sign_SetFaceColor(sign);
	drawText("Change your color", Verdana32Signs, 50, 50);
	drawText("to red", Verdana32Signs, 130, 87);
	drawText("Then you can break me!", Verdana32Signs, 5, 420);
}

function Blue_Draw(sign,depth)
{
var signs = Signs_Get();

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/400,1.0/400,1);
	Nova_Translate(0, 0, depth * 0.01);

	DrawImage(signs.changerTex, 110, 170, 190, 190);

	Sign_SetFaceColor(sign);
	drawText("Change your color to blue", Verdana32Signs, 35, 100);
}

function Yellow_Draw(sign,depth)
{
var signs = Signs_Get();

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/400,1.0/400,1);
	Nova_Translate(0, 0, depth * 0.01);

	DrawImage(signs.changerTex, 100, 150, 190, 190);

	Sign_SetFaceColor(sign);
	drawText("Change your color", Verdana32Signs, 75, 50);
	drawText("to yellow", Verdana32Signs, 135, 87);
}

function SqueezeHole_Draw(sign,depth)
{
var signs = Signs_Get();

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/480,1.0/480,1);
	Nova_Translate(0, 0, depth * 0.01);

	Sign_SetFaceColor(sign);
	drawText("See if you can squeeze", Verdana32Signs, 105, 55);
	drawText("through this hole", Verdana32Signs, 145, 93);
}

function Reminder_Draw(sign,depth)
{
var signs = Signs_Get();

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/480,1.0/480,1);
	Nova_Translate(0, 0, depth * 0.01);

	Sign_SetFaceColor(sign);
	drawText("Remember, you need all 4", Verdana32Signs, 111, 55);
	drawText("stars to beat the level", Verdana32Signs, 141, 93);
}

function OtherDoor_Draw(sign,depth)
{
var signs = Signs_Get();

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/320,1.0/320,1);
	Nova_Translate(0, 0, depth * 0.01);

	Sign_SetFaceColor(sign);
	drawText("Use the other doorway", Verdana32Signs, 12, 100);
}

function FirstStar_Draw(sign,depth)
{
var signs = Signs_Get();

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/320,1.0/320,1);
	Nova_Translate(0, 0, depth * 0.01);

	Sign_SetFaceColor(sign);
	drawText("Take your 1st of 4 stars", Verdana32Signs, 5, 100);
}

function Spring_Draw(sign,depth)
{
var signs = Signs_Get();
var door = sign.b;
var offset = Vector_Subtract(door.b.middle, door.home);

	Nova_Translate(offset[0], offset[1], offset[2]);
	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/320,1.0/320,1);
	Nova_Translate(0, 0, depth * 0.01);

	Nova_Color(.25,.125,.125,1);
	drawText("You'll need to be red to", Verdana32, 9, 50);
	drawText("spring through this one!", Verdana32, 4, 87);
		
	Nova_BeginAlphaTest(0.01);
	Nova_Color(sign.b.color[0], sign.b.color[1], sign.b.color[2], 1);
	DrawImage(signs.changerTex, 50, 170, 220, 240);
	Nova_EndSpecialDraw();
}


function Switch_Draw(sign,depth)
{
var signs = Signs_Get();
var door = sign.b;
var offset = Vector_Subtract(door.b.middle, door.home);

	Nova_Translate(offset[0], offset[1], offset[2]);
	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/320,1.0/320,1);
	Nova_Translate(0, 0, depth * 0.01 + .2);

	Nova_Color(.125,.125,.25,1);
	drawText("Some doors can only", Verdana32, 23, 40);
	drawText("be opened", Verdana32, 94, 77);
	drawText("by key blocks", Verdana32, 74, 350);

	Nova_Color(.5,.5,1,1);
	DrawImage(signs.switchTex, 75, 150, 170, 170);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

function Break_Draw(sign,depth)
{
var signs = Signs_Get();
//var l;

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/320,1.0/320,1);
	Nova_Translate(0, 0, depth * 0.01);

	//l = (320 - textWidth("BREAK ME!", Verdana32))/2;
	Sign_SetFaceColor(sign);
	drawText("BREAK ME!", Verdana32Signs, 84, 60);
}

function Smash_Draw(sign,depth)
{
var signs = Signs_Get();
//var l;

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/320,1.0/320,1);
	Nova_Translate(0, 0, depth * 0.01);

	//l = (320 - textWidth("SMASH ME!", Verdana32))/2;
	Sign_SetFaceColor(sign);
	drawText("SMASH ME!", Verdana32Signs, 81, 60);
}

function Shatter_Draw(sign,depth)
{
var signs = Signs_Get();
//var l;

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/320,1.0/320,1);
	Nova_Translate(0, 0, depth * 0.01);

	//l = (320 - textWidth("SHATTER ME!", Verdana32))/2;
	Sign_SetFaceColor(sign);
	drawText("SHATTER ME!", Verdana32Signs, 68, 60);
}

function MeToo_Draw(sign,depth)
{
var signs = Signs_Get();
//var l;

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/320,1.0/320,1);
	Nova_Translate(0, 0, depth * 0.01);

	//l = (320 - textWidth("ME TOO!", Verdana32))/2;
	Sign_SetFaceColor(sign);
	drawText("ME TOO!", Verdana32Signs, 100, 60);
}

function Steer_Draw(sign,depth)
{
var signs = Signs_Get();

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/340,1.0/340,1);
	Nova_Translate(10, 10, depth * 0.01);

	if (signs.use_the_arrows_x === undefined)
		signs.use_the_arrows_x = (320 - textWidth("Use the arrows on your", Verdana32)) / 2;
	if (signs.keyboard_to_move_x === undefined)
		signs.keyboard_to_move_x = (320 - textWidth("Keyboard to move", Verdana32)) / 2;
	drawText("Use the arrows on your", Verdana32, signs.use_the_arrows_x, 15);
	drawText("Keyboard to move", Verdana32, signs.keyboard_to_move_x, 50);

	Nova_Color(1,1,1,1);
	DrawImage(signs.arrowsTex, 50, 85, 220, 220);
}

function LookUp_Draw(sign,depth)
{
var signs = Signs_Get();

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/320,1.0/320,1);
	Nova_Translate(0, 0, depth * 0.01);

	if (signs.click_and_drag_x === undefined)
		signs.click_and_drag_x = (320 - textWidth("Click and drag", Verdana32)) / 2;
	if (signs.to_look_around_x === undefined)
		signs.to_look_around_x = (320 - textWidth("to look around", Verdana32)) / 2;
	drawText("Click and drag", Verdana32, signs.click_and_drag_x, 20);
	drawText("to look around", Verdana32, signs.to_look_around_x, 57);

	Nova_Color(1,1,1,1);
	DrawImage(signs.mouseTex, 60, 102, 200, 200);
}

function Stars_Draw(sign,depth)
{
var signs = Signs_Get();

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/320,1.0/320,1);
	Nova_Translate(0, 0, depth * 0.01);

	drawText("Capture all 4 stars", Verdana32, 35, 25);
	drawText("to beat the level", Verdana32, 55, 260);

	Nova_Color(1,1,1,1);
	DrawImage(signs.starTex, 90, 90, 140, 140);
}

function Changers_Draw(sign,depth)
{
var signs = Signs_Get();

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/480,1.0/480,1);
	Nova_Translate(0, 0, depth * 0.01);

	Nova_Scale(1.5,1.5,1);
	drawText("Hit color change blocks", Verdana32, 10, 25);
	drawText("to change your color", Verdana32, 25, 260);

	Nova_Color(1,1,1,1);
	DrawImage(signs.changerRed, 90, 90, 140, 140);
}

function Landscape_Draw(sign,depth)
{
var signs = Signs_Get();

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/320,1.0/320,1);
	Nova_Translate(0, 0, depth * 0.01);

	if (signs.fullscreen_x === undefined)
		signs.fullscreen_x = (320 - textWidth("Try going full screen", Verdana32)) / 2;
	if (signs.press_f11_x === undefined)
		signs.press_f11_x = (320 - textWidth("(Press F11)", Verdana32)) / 2;
	drawText("Try going full screen", Verdana32, signs.fullscreen_x, 60);
	drawText("(Press F11)", Verdana32, signs.press_f11_x, 97);
	Nova_Color(1,1,1,1);
	DrawImage(signs.fullscreenTex, 20, 125, 280, 280);
}

function Joystick_Draw(sign,depth)
{
var signs = Signs_Get();

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/320,1.0/320,1);
	Nova_Translate(0, 0, depth * 0.01);

	Nova_Color(1,1,1,1);
	DrawImage(signs.mouseTex, 50, 130, 220, 220);

	Nova_Color(0,0,0,1);
	if (signs.double_click_x === undefined)
		signs.double_click_x = (320 - textWidth("Double-click to", Verdana32)) / 2;
	if (signs.look_freely_x === undefined)
		signs.look_freely_x = (320 - textWidth("look freely", Verdana32)) / 2;
	drawText("Double-click to", Verdana32, signs.double_click_x, 30);
	drawText("look freely", Verdana32, signs.look_freely_x, 65);

	if (signs.right_click_x === undefined)
		signs.right_click_x = (320 - textWidth("Right-click to go", Verdana32)) / 2;
	if (signs.go_forward_x === undefined)
		signs.go_forward_x = (320 - textWidth("forward", Verdana32)) / 2;
	drawText("Right-click to go", Verdana32, signs.right_click_x, 380);
	drawText("forward", Verdana32, signs.go_forward_x, 415);
}

function CSmartSoft_com_Draw(sign,depth)
{
var signs = Signs_Get();

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/320,1.0/320,1);
	Nova_Translate(0, 0, depth * 0.01);

	if (signs.exit_any_time_x === undefined)
		signs.exit_any_time_x = (320 - textWidth("Exit the page any time", Verdana32)) / 2;
	drawText("Exit the page any time", Verdana32, signs.exit_any_time_x, 57);


	if (signs.you_can_pick_up_x === undefined)
		signs.you_can_pick_up_x = (320 - textWidth("You can pick up right", Verdana32)) / 2;
	if (signs.where_you_left_off_x === undefined)
		signs.where_you_left_off_x = (320 - textWidth("where you left off", Verdana32)) / 2;
	drawText("You can pick up right", Verdana32, signs.you_can_pick_up_x, 365);
	drawText("where you left off", Verdana32, signs.where_you_left_off_x, 402);

	Nova_Color(1,1,1,1);
	DrawImage(signs.resumeTex, 21, 193, 280, 70);
}

function Hearts_Draw(sign,depth)
{
var signs = Signs_Get();

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/320,1.0/320,1);
	Nova_Translate(0, 0, depth * 0.01);

	drawText("There are 4 hearts", Verdana32, 37, 57);
	drawText("hidden in each level", Verdana32, 30, 389);

	Nova_Color(1,1,1,1);
	DrawImage(signs.heartTex, 50, 137, 220, 220);
}

function Secret_Draw(sign,depth)
{
//var signs = Signs_Get();

	Nova_MultMatrix(sign.matrix);
	Nova_Scale(1.0/320,1.0/320,1);
	Nova_Translate(0, 0, depth * 0.01);

	drawText("The yellow heart", Verdana32, 50, 125);
	drawText("is always in", Verdana32, 87, 175);
	drawText("the secret room", Verdana32, 57, 225);
}


///////////////////////////////////////////////////////////////////////////////

var g_signCurDraw;
function Signs_ParseSign(s,tag,length)
{
var signs = Signs_Get();
var top_left, top_right, bot_left;
var org, vx, vy;
var mat = new Array(3);
var signNorm;
var face = 0;
var bestFace = 0;
var i, j;
var yaw, pitch;

	ASSERT(signs.count < signBufSize);

	if (tag == ekLockedDoorGroupTag && !g_parsingBlock)
		g_parsingBlock = LockedDoor_New(false);
	parseBlockGroup(s,tag,length);

	i = signs.count++;
	signs.signs[i] = {};
	signs.signs[i].b = shallowCopy(g_parsedBlock);
	signs.signs[i].Draw = g_signCurDraw;

	yaw = signs.signs[i].b.camYaw;
	pitch = signs.signs[i].b.camPitch;
	if (signs.signs[i].Draw == Switch_Draw)
	{
		pitch = 0;
		yaw = 90;
	}

	signNorm = Nova_Vector3f(cos(signs.signs[i].b.camYaw * pi/180.0), 
		sin(signs.signs[i].b.camYaw * pi/180.0) * cos(signs.signs[i].b.camPitch * pi/180.0),
		sin(signs.signs[i].b.camYaw * pi/180.0) * sin(signs.signs[i].b.camPitch * pi/180.0));
	for (j = 0; j < 6; j++)
	{
		var dot = fabs(Vector_Dot(signs.signs[i].b.group.polys[j].plane.normal, signNorm));
		if (dot > bestFace && Vector_Dot(signNorm, 
			Vector_Subtract(signs.signs[i].b.middle, signs.signs[i].b.group.polys[j].vertex[0])) > 0)
		{
			bestFace = dot;
			face = j;
		}
	}

	signs.signs[i].face = face;
	if (fabs(signNorm[2]) < 0.9)
	{
		for (j = 0; j < 4; j++)
		{
			if (Vector_Dot(
				Vector_Subtract(signs.signs[i].b.middle, signs.signs[i].b.group.polys[face].vertex[j]),
				Vector_Cross(signNorm, Nova_Vector3f(0, 0, 1))) > 0)
			{
				if (signs.signs[i].b.group.polys[face].vertex[j][2] > signs.signs[i].b.middle[2])
				{
					top_left = signs.signs[i].b.group.polys[face].vertex[j];
				}
				else
				{
					bot_left = signs.signs[i].b.group.polys[face].vertex[j];
				}
			}
			else
			{
				if (signs.signs[i].b.group.polys[face].vertex[j][2] > signs.signs[i].b.middle[2])
				{
					top_right = signs.signs[i].b.group.polys[face].vertex[j];
				}
			}
		}
	}
	else
	{
		for (j = 0; j < 4; j++)
		{
			if (Vector_Dot(
				Vector_Subtract(signs.signs[i].b.middle, signs.signs[i].b.group.polys[face].vertex[j]),
				Vector_Cross(signNorm, Nova_Vector3f(0, -1, 0))) > 0)
			{
				if (signs.signs[i].b.group.polys[face].vertex[j][1] < signs.signs[i].b.middle[1])
					top_left = signs.signs[i].b.group.polys[face].vertex[j];
				else
					bot_left = signs.signs[i].b.group.polys[face].vertex[j];
			}
			else
			{
				if (signs.signs[i].b.group.polys[face].vertex[j][1] < signs.signs[i].b.middle[1])
					top_right = signs.signs[i].b.group.polys[face].vertex[j];
			}
		}
	}

	org = top_left;
	vx = Vector_Subtract(top_right, top_left);
	vy = Vector_Subtract(bot_left, top_left);

	mat[0] = Vector_Scale(vx, 1.0 / Vector_Square(vx));
	mat[1] = Vector_Scale(vy, 1.0 * sqrt(Vector_Square(vy) / Vector_Square(vx)) / Vector_Square(vy));
	mat[2] = Vector_Negate(Vector_Cross(mat[0], mat[1]));
	org = Matrix_Mult(mat, org);
	org[2] += 1.0;
	mat = Matrix_Invert(mat);
	org = Matrix_Mult(mat, org);
	signs.signs[i].matrix = Matrix_GetGLT(mat, org);
}

function Signs_GetParser(id)
{
	if (id == "sign_red")
		g_signCurDraw = Red_Draw;
	else if (id == "sign_otherDoor")
		g_signCurDraw = OtherDoor_Draw;
	else if (id == "sign_firstStar")
		g_signCurDraw = FirstStar_Draw;
	else if (id == "sign_blue")
		g_signCurDraw = Blue_Draw;
	else if (id == "sign_yellow")
		g_signCurDraw = Yellow_Draw;
	else if (id == "sign_reminder")
		g_signCurDraw = Reminder_Draw;
	else if (id == "sign_squeezeHole")
		g_signCurDraw = SqueezeHole_Draw;
	else if (id == "sign_spring")
		g_signCurDraw = Spring_Draw;
	else if (id == "sign_switch")
		g_signCurDraw = Switch_Draw;
	else if (id == "sign_smash")
		g_signCurDraw = Smash_Draw;
	else if (id == "sign_break")
		g_signCurDraw = Break_Draw;
	else if (id == "sign_shatter")
		g_signCurDraw = Shatter_Draw;
	else if (id == "sign_metoo")
		g_signCurDraw = MeToo_Draw;
	else if (id == "sign_steer")
		g_signCurDraw = Steer_Draw;
	else if (id == "sign_lookup")
		g_signCurDraw = LookUp_Draw;
	else if (id == "sign_changers")
		g_signCurDraw = Changers_Draw;
	else if (id == "sign_stars")
		g_signCurDraw = Stars_Draw;
	else if (id == "sign_landscape")
		g_signCurDraw = Landscape_Draw;
	else if (id == "sign_hearts")
		g_signCurDraw = Hearts_Draw;
	else if (id == "sign_website")
		g_signCurDraw = CSmartSoft_com_Draw;
	else if (id == "sign_joystick")
		g_signCurDraw = Joystick_Draw;
	else if (id == "sign_secret")
		g_signCurDraw = Secret_Draw;
	else
		return parseBlockGroup;

	return Signs_ParseSign;
}

function SignDrawer_NextFrame(d,spf,step)
{
var signs = Signs_Get();
var i;

	for (i = 0; i < signs.count; i++)
	{
		if (!signs.signs[i].b.group.bVisible && signs.signs[i].alpha > 0)
			signs.signs[i].alpha -= 2.5 * step * spf;
		else if (signs.signs[i].b.group.bVisible && signs.signs[i].alpha != 1)
			signs.signs[i].alpha = 1;
	}

	BaseDecorator_NextFrame(d, spf, step);
}

function SignDrawer_Draw(d,mask)
{
var signs = Signs_Get();
var map = Level_GetLevel().map;
var camera = Level_GetCamera();
var i;

	BaseDecorator_Draw(d, mask);

	Nova_PushMatrix();
	Nova_LoadModelMatrix();
	
	gl.enable(gl.BLEND);
	for (i = 0; i < signs.count; i++)
	{
		var index = map.polyGroups[0].polyCount + 6 + signs.signs[i].b.group.index - 1;
		if (signs.signs[i].alpha > 0 && (!mask || (mask[index >> 5] & (1 << (index & 0x1f)))))
		{
			var depth = Vector_Dot(Vector_Subtract(camera.position, signs.signs[i].b.middle), camera.viewAngle[2]);

			Nova_PushMatrix();
			if (signs.signs[i].b.group.transparent)
			{
				Nova_BeginAlphaTest(0.5);
				Nova_Color(signs.signs[i].color[0], signs.signs[i].color[1],
					signs.signs[i].color[2], signs.signs[i].alpha);
				signs.signs[i].Draw(signs.signs[i], depth);
				Nova_EndSpecialDraw();
			}
			else
			{
				Nova_Color(0,0,0,1);
				signs.signs[i].Draw(signs.signs[i], depth);
			}
			Nova_PopMatrix();
		}
	}
	
	Nova_Color(1, 1, 1, 1);
	gl.disable(gl.BLEND);

	Nova_PopMatrix();
	
	if (signs.showThumbs)
	{
		signs.showThumbs = FALSE;
		Menu_ShowThumbs();
	}
}

function SignDrawer_MoveForward(d,magnitude)
{
var signs = Signs_Get();
	
	if (signs.goodTurns < 4 && fabs(magnitude) > 0.75)
	{
		var dir = magnitude > 0 ? 1 : 0;
		if (dir != signs.dir)
			signs.dirChanges--;
		signs.dir = dir;
		if (signs.dirChanges <= 0)
		{
			Menu_ShowThumbs();
			signs.dirChanges = otherTimesDirChanges;
		}
	}
		
	BaseDecorator_MoveForward(d, magnitude);
}

function SignDrawer_MouseMove(d,x,y)
{
var signs = Signs_Get();
	
	signs.turn += x;
	if (fabs(signs.turn) > 2)
	{
		signs.turn = 0;
		if (signs.dirChanges != otherTimesDirChanges)
		{
			signs.dirChanges = otherTimesDirChanges;
			signs.goodTurns++;			
		}
		
	}
	
	BaseDecorator_MouseMove(d, x, y);
}

function SignDrawer_Turn(d,magnitude)
{
var signs = Signs_Get();
	
	signs.turn += magnitude;
	if (fabs(signs.turn) > 2)
	{
		signs.turn = 0;
		if (signs.dirChanges != otherTimesDirChanges)
		{
			signs.dirChanges = otherTimesDirChanges;
			signs.goodTurns++;			
		}
	}
	
	BaseDecorator_Turn(d, magnitude);
}

function SignDrawer_New()
{
	var d = {};
	Decorator_Init(d);
	d.NextFrame = SignDrawer_NextFrame;
	d.Draw = SignDrawer_Draw;
	d.MoveForward = SignDrawer_MoveForward;
	d.Turn = SignDrawer_Turn;
	d.MouseMove = SignDrawer_MouseMove;
	return d;
}

function Atlas2Marble(block,s,t,sParam,tParam)
{
	return {s:s * sParam / (Atlas_TexSize*Atlas_Scale),
	        t:t * tParam / (Atlas_TexSize*Atlas_Scale)};
}

function Signs_FinishedLoading(l)
{
var signs = l;
var signTex = NULL;
var theme = Level_GetLevel().map.theme;
var i,j;

	ASSERT(signs.drawer == NULL);
	signs.drawer = SignDrawer_New();
	Level_AddDecorator(signs.drawer);

	for (i = 0; i < theme.textureCount; i++)
	{
		if (theme.texts[i].name == "sign_tex")
		{
			signTex = theme.texts[i];
			break;
		}
	}
	ASSERT(signTex);

	for (i = 0; i < signs.count; i++)
	{
		signs.signs[i].color = arrdup(signs.signs[i].b.color);
		Level_LightColor(signs.signs[i].color, signs.signs[i].color, signs.signs[i].b.group.polys[signs.signs[i].face].plane.normal);
		signs.signs[i].alpha = 0;
		if (!signs.signs[i].b.group.transparent && signs.signs[i].b.color[1] == 1)
		{
			for (j = 0; j < signs.signs[i].b.group.polyCount; j++)
				signs.signs[i].b.group.polys[j].primitive.pTexture = signTex;
			Block_TransformAtlasCoords(signs.signs[i].b, Atlas2Marble, signTex.xScale*textureScale, signTex.yScale*textureScale, FALSE);
		}
	}
	

	signs.showThumbs = TRUE;
}

function Signs_Died(l)
{
var signs = l;

	// It was already freed...
	ASSERT(signs.drawer);
	signs.drawer = SignDrawer_New();
	Level_AddDecorator(signs.drawer);
}

var g_signs = NULL;
function Signs_Free(l)
{
var signs = l;

	ASSERT(g_signs == signs);
	if (signs.drawer) signs.drawer.Free(signs.drawer);
	if (signs.changerTex) Nova_FreeTextureGL(signs.changerTex);
	if (signs.starTex) Nova_FreeTextureGL(signs.starTex);
	if (signs.changerTex) Nova_FreeTextureGL(signs.changerTex);
	if (signs.changerRed) Nova_FreeTextureGL(signs.changerRed);
	if (signs.switchTex) Nova_FreeTextureGL(signs.switchTex);
	if (signs.arrowsTex) Nova_FreeTextureGL(signs.arrowsTex);
	if (signs.mouseTex) Nova_FreeTextureGL(signs.mouseTex);
	if (signs.fullscreenTex) Nova_FreeTextureGL(signs.fullscreenTex);
	if (signs.resumeTex) Nova_FreeTextureGL(signs.resumeTex);
	if (signs.heartTex) Nova_FreeTextureGL(signs.heartTex);
	if (Verdana32Signs.texture) Nova_FreeTextureGL(Verdana32Signs.texture);
	if (Verdana32Signs.texture) delete Verdana32Signs.texture;
	g_signs = NULL;
}

function Signs_Get()
{
	if (g_signs == NULL)
	{
		g_signs = {
			count:0,
			signs:new Array(signBufSize)
		};
		g_signs.listener = g_signs;
		
		g_signs.dirChanges = firstTimeDirChanges;	
		g_signs.changerTex = loadTexture("images/signs/changer.png",true,false);
		g_signs.starTex = loadTexture("images/signs/star.png");
		g_signs.changerRed = loadTexture("images/signs/changer-red.png");
		g_signs.switchTex = loadTexture("images/signs/switch.png");
		g_signs.arrowsTex = loadTexture("images/signs/arrows.png");
		g_signs.mouseTex = loadTexture("images/signs/mouse.png");
		g_signs.fullscreenTex = loadTexture("images/signs/fullscreen.png");
		g_signs.resumeTex = loadTexture("images/signs/resume.png");
		g_signs.heartTex = loadTexture("images/signs/heart.png");
		Verdana32Signs.texture = loadTexture(Verdana32Signs.url, true, false, gl.CLAMP_TO_EDGE, gl.RGBA);

		g_signs.listener.FinishedLoading = Signs_FinishedLoading;
		g_signs.listener.Reset = NullReset;
		g_signs.listener.Died = Signs_Died;
		g_signs.listener.Free = Signs_Free;
		g_signs.listener.Recover = NullRecover;
		g_signs.listener.Persist = NullPersist;
		Level_RegisterListener(g_signs.listener);
	}

	return g_signs;
}
