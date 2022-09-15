var KEYBOARD_LEFT_ARROW = 37;
var KEYBOARD_UP_ARROW = 38;
var KEYBOARD_RIGHT_ARROW = 39;
var KEYBOARD_DOWN_ARROW = 40;
var KEYBOARD_RIGHT_MOUSE_BUTTON = 65536;

var ekNoAction = 0;
var ekMenu = 1;
var ekForward = 2;
var ekBack = 3;
var ekLeft = 4;
var ekRight = 5;
var ekTurnLeft = 6;
var ekTurnRight = 7;
var ekToggleTurn = 8;
var ekActionCount = 9;

var KeyMap = {};
var KeysDown = {};
var KeyPresses = new Array(ekActionCount);
for (var i = 0; i < ekActionCount; i++)
	KeyPresses[i] = 0;

function KeyPressed(action)
{
	switch (action)
	{
		case ekMenu:
			return FALSE;			
		case ekForward:
			KeyPresses[ekBack] = 0;
			Level_MoveForward(1);
			break;
		case ekBack:
			KeyPresses[ekForward] = 0;			
			Level_MoveForward(-1);			
			break;
		case ekLeft:
			KeyPresses[ekRight] = 0;			
			Level_MoveSide(-1);			
			break;
		case ekRight:
			KeyPresses[ekLeft] = 0;			
			Level_MoveSide(1);			
			break;
		case ekTurnLeft:
			KeyPresses[ekTurnRight] = 0;			
			Level_Turn(1);
			break;
		case ekTurnRight:
			KeyPresses[ekTurnLeft] = 0;			
			Level_Turn(-1);			
			break;
		case ekToggleTurn:
			break;
	}
	return TRUE;
}

function KeyReleased(action)
{
	switch (action)
	{
		case ekMenu:
			break;
		case ekForward:
		case ekBack:
			Level_MoveForward(0);
			break;
		case ekLeft:
		case ekRight:
			Level_MoveSide(0);
			break;
		case ekTurnLeft:
		case ekTurnRight:
			Level_Turn(0);
			break;
		case ekToggleTurn:
			break;
	}
}

function Keyboard_Reset()
{
	var KeysDown = {};
	for (var i = 0; i < ekActionCount; i++)
		KeyPresses[i] = 0;
	Level_MoveForward(0);
	Level_MoveSide(0);
	Level_Turn(0);
}

function Keyboard_KeyPressed(key)
{
	if (KeysDown[key])
		return;
	KeysDown[key] = true;
	
	var action = KeyMap[key] ? KeyMap[key] : ekNoAction;
	
	if (!KeyPresses[action])
	{
		KeyPresses[action]++;
		return KeyPressed(action);
	}
	else
	{
		KeyPresses[action]++;
		return TRUE;
	}

}

function Keyboard_KeyReleased(key)
{
var action = KeyMap[key] ? KeyMap[key] : ekNoAction;

	KeysDown[key] = false;
	
	if (KeyPresses[action])
	{
		KeyPresses[action]--;
		if (!KeyPresses[action])
			KeyReleased(action);
	}
}

function Keyboard_MapKey(key,action)
{
	while (KeyPresses[KeyMap[key]])
		KeyReleased(KeyMap[key]);
	
	KeyMap[key] = action;
}