function HTML5SoundEffect(url, buffer_count) {
	if (!buffer_count)
		buffer_count = 1;

	this.url = url;
	this.idx = 0;
	this.buffers = new Array(buffer_count);
	for (var i = 0; i < buffer_count; i++)
		this.buffers[i] = new Audio(url);
	
	this.play = function() {
		this.buffers[this.idx++ % this.buffers.length].play();
	};
	this.stop = function() {
		this.buffers[this.idx % this.buffers.length].pause();
		this.buffers[this.idx++ % this.buffers.length] = new Audio(this.url);
	};
}

var ekGlassHardSound, ekGlassSpreadSound, ekClickSound, ekWoodSound,
    ekSpeedupSound, ekSlowdownSound, ekShatterHugeSound, ekGlassSmallSound,
    ekGlassCrunchSound, ekGhostStartSound, ekGhostEndSound, ekInvincibleSound,
    ekInvincibleEndSound, ekChanger0Sound, ekChanger1Sound, ekCarpetSound,
    ekBombSound, ekExtraGuySound, ekStarSound, ekCheckpointSound, ekSliderSound,
    ekSwitchSound, ekDoorSound, ekSlamSound, ekThudSound, ekLeverSound,
    ekBuzzerSound, ekSecretSound, ekDingSound, ekDingDistantSound, ekSpringSound,
    ekSpringReverseSound;

function Sound_Initialize()
{
//	var ext = song.canPlayType('audio/mpeg;') ? 'mp3' : 'ogg';
    var ext = 'ogg';
	ekGlassHardSound = new HTML5SoundEffect('sounds/glass-hard.' + ext, 4);
	ekGlassSpreadSound = new HTML5SoundEffect('sounds/glass-spread.' + ext, 4);
	ekClickSound = new HTML5SoundEffect('sounds/pool-balls.' + ext, 8);
	ekWoodSound = new HTML5SoundEffect('sounds/wood.' + ext, 3);
	ekSpeedupSound = new HTML5SoundEffect('sounds/speedup.' + ext, 1);
	ekSlowdownSound = new HTML5SoundEffect('sounds/slowdown.' + ext, 1);
	ekShatterHugeSound = new HTML5SoundEffect('sounds/glass-huge.' + ext, 2);
	ekGlassSmallSound = new HTML5SoundEffect('sounds/glass-small.' + ext, 4);
	ekGlassCrunchSound = new HTML5SoundEffect('sounds/glass-crunch.' + ext, 2);
	ekGhostStartSound = new HTML5SoundEffect('sounds/ghost-start.' + ext, 1);
	ekGhostEndSound = new HTML5SoundEffect('sounds/ghost-end.' + ext, 1);
	ekInvincibleSound = new HTML5SoundEffect('sounds/invincible.' + ext, 1);
	ekInvincibleEndSound = new HTML5SoundEffect('sounds/invincible-end.' + ext, 1);
	ekChanger0Sound = new HTML5SoundEffect('sounds/changer-1.' + ext, 2);
	ekChanger1Sound = new HTML5SoundEffect('sounds/changer-2.' + ext, 2);
	ekCarpetSound = new HTML5SoundEffect('sounds/carpet.' + ext, 1);
	ekBombSound = new HTML5SoundEffect('sounds/explosion.' + ext, 1);			  
	ekExtraGuySound = new HTML5SoundEffect('sounds/extraguy.' + ext, 4);
	ekStarSound = new HTML5SoundEffect('sounds/star.' + ext, 1);
	ekCheckpointSound = new HTML5SoundEffect('sounds/checkpoint.' + ext, 1);
	ekSliderSound = new HTML5SoundEffect('sounds/slider.' + ext, 2);
	ekSwitchSound = new HTML5SoundEffect('sounds/switch.' + ext, 1);
	ekDoorSound = new HTML5SoundEffect('sounds/door.' + ext, 2);
	ekSlamSound = new HTML5SoundEffect('sounds/slam.' + ext, 1);
	ekThudSound = new HTML5SoundEffect('sounds/thud.' + ext, 1);
	ekLeverSound = new HTML5SoundEffect('sounds/lever.' + ext, 1);
	ekBuzzerSound = new HTML5SoundEffect('sounds/buzzer.' + ext, 1);
	ekSecretSound = new HTML5SoundEffect('sounds/secret.' + ext, 1);
	ekDingSound = new HTML5SoundEffect('sounds/ding.' + ext, 4);
	ekDingDistantSound = new HTML5SoundEffect('sounds/ding-distant.' + ext, 4);
	ekSpringSound = new HTML5SoundEffect('sounds/spring.' + ext, 1);
	ekSpringReverseSound = new HTML5SoundEffect('sounds/spring-reverse.' + ext, 1);
}

function Sound_Play(soundId)
{
	if (!soundId || !soundId.play)
		return;

	soundId.play();
	if (soundId == ekBombSound || soundId == ekBuzzerSound || soundId == ekSecretSound)
		Sound_Vibrate();
}

function Sound_Play3D(soundId,location)
{
	Sound_Play(soundId);
}

function Sound_Stop(soundId)
{
	if (!soundId || !soundId.stop)
		return;

	soundId.stop();
}

function Sound_Vibrate()
{
}

function Sound_ReleaseAll()
{
}

function Sound_Release(soundId)
{
}

function Music_Load(url)
{
//	if (song.canPlayType('audio/mpeg;'))
//		song.setAttribute('src', 'songs/' + url + '.mp3');
//	else
		song.setAttribute('src', 'songs/' + url + '.ogg');

	// Loop hack for browsers that don't support loop.
	song.onended = function() {
		song.play();
	};
}

function Music_Play()
{
	song.play();
}

function Music_Kill()
{
	song.pause();
	song.setAttribute('src', '');
}

function Music_Pause()
{
	song.pause();
}

function Music_Volume(v)
{
	song.volume = v;
}

function Music_Persist()
{
	psWriteFloat(song.currentTime);
}

function Music_Restore(size)
{
	song.currentTime = psReadFloat();
}
