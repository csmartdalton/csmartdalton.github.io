// Definitions.
var SKYBOX_TEXTURE_UNIT = 1

// Entrypoints.
var onPlatformPause = cwrap('onPlatformPause', 'void', []);
var onPlatformResume = cwrap('onPlatformResume', 'void', []);
var onPlatformInterstitialShown = cwrap('onPlatformInterstitialShown', 'void', []);
var onPlatformInterstitialClosed = cwrap('onPlatformInterstitialClosed', 'void', []);
var onPlatformVideoAdClosed = cwrap('onPlatformVideoAdClosed', 'void', []);
var onPlatformConfigurationChanged = cwrap('onPlatformConfigurationChanged', 'void', []);
var onPlatformExitMenu = cwrap('onPlatformExitMenu', 'void', ['number', 'number']);
var onPlatformEnterMenu = cwrap('onPlatformEnterMenu', 'void', []);
var onPlatformBackButton = cwrap('onPlatformBackButton', 'void', []);
var onPlatformTap = cwrap('onPlatformTap', 'void', ['number']);
var onPlatformRetryLevel = cwrap('onPlatformRetryLevel', 'void', []);
var onPlatformNextLevel = cwrap('onPlatformNextLevel', 'void', ['number', 'number']);
var onPlatformEnableHighQuality = cwrap('onPlatformEnableHighQuality', 'void', ['number']);
var onPlatformPauseButton = cwrap('onPlatformPauseButton', 'void', []);
var onPlatformInit = cwrap('onPlatformInit', 'void', []);
var onPlatformSurfaceChanged = cwrap('onPlatformSurfaceChanged', 'void', ['number', 'number']);
var onPlatformDrawFrame = cwrap('onPlatformDrawFrame', 'void', []);

// Sounds.
var HTML5SoundEffect = function(url, buffer_count) {
	this.url = url;
	this.idx = 0;
	this.buffers = new Array(buffer_count || 1);

	for (var i = 0; i < this.buffers.length; i++)
		this.buffers[i] = new Audio(url);

	this.play = function() {
		this.buffers[this.idx++ % this.buffers.length].play();
	};
	this.stop = function() {
		this.buffers[this.idx % this.buffers.length].pause();
		this.buffers[this.idx++ % this.buffers.length] = new Audio(this.url);
	};
}
var sounds = [new HTML5SoundEffect('sound_fx/changer_0q.wav', 1),
              new HTML5SoundEffect('sound_fx/changer_1q.wav', 1),
              new HTML5SoundEffect('sound_fx/explosion.wav', 1),
              new HTML5SoundEffect('sound_fx/star.wav', 2),
              new HTML5SoundEffect('sound_fx/pipe_snap.wav', 1),
              new HTML5SoundEffect('sound_fx/pipe_splat.wav', 1),
              new HTML5SoundEffect('sound_fx/pipe_smash.wav', 3),
              new HTML5SoundEffect('sound_fx/ding.wav', 1),
              new HTML5SoundEffect('sound_fx/ding_snap.wav', 1),
              new HTML5SoundEffect('sound_fx/ding_plop.wav', 1),
              new HTML5SoundEffect('sound_fx/flap.wav', 10),
              new HTML5SoundEffect('sound_fx/splash.wav', 1),
              new HTML5SoundEffect('sound_fx/drip.wav', 1),
              new HTML5SoundEffect('sound_fx/cork.wav', 1),
              new HTML5SoundEffect('sound_fx/checkpoint.wav', 1),
              new HTML5SoundEffect('sound_fx/extra_guy.wav', 3)];
var mediaURLs = ['sound_fx/jungle_ambiance.mp3',
                 'sound_fx/urban_crickets.mp3',
                 'sound_fx/pastoral_ambiance.mp3',
                 'sound_fx/summer_nights.mp3',
                 'sound_fx/the_moors_of_freedom.mp3'];
var medias = new Array(mediaURLs.length);
var audioPaused = false;
var platformStopAllSounds = function()
{
    for (var i = 0; i < sounds.length; i++)
        sounds[i].stop();
}
var platformPlaySound = function(soundId, volume)
{
    if (audioPaused)
        return;
    sounds[soundId].volume = volume;
    sounds[soundId].play();
}
var platformPreloadMedia = function(mediaId)
{
    if (medias[mediaId])
        return;
    medias[mediaId] = new Audio(mediaURLs[mediaId]);
    medias[mediaId].loop = true;
}
var platformPlayMedia = function(mediaId)
{
    platformPreloadMedia(mediaId);
    if (audioPaused) {
        medias[i].pendingResume = true;
        return;
    }
    medias[mediaId].play();
}
var platformStopMedia = function(mediaId)
{
    if (!medias[i])
        return;
    if (audioPaused) {
        delete medias[i].pendingResume;
        return;
    }
    medias[mediaId].pause();
}
var platformSetMediaVolume = function(mediaId, volume)
{
    medias[mediaId].volume = volume;
}
var platformReleaseMedia = function(mediaId)
{
    delete medias[mediaId];
}
var platformPauseAllAudio = function(paused)
{
    audioPaused = paused;
    if (!audioPaused) {
        for (var i = 0; i < mediaURLs.length; i++) {
            if (mediaPaused[i] && medias[i].pendingResume)
                medias[i].play();
            delete medias[i].pendingResume;
        }
    } else {
        platformStopAllSounds();
        for (var i = 0; i < mediaURLs.length; i++) {
            if (medias[i] && medias[i].playing) {
                medias[i].pause();
                medias[i].pendingResume = true;
            }
        }
    }
}

// Persistence.
var platformPutBeatenLevel = function(levelNumber)
{
    localStorage.beatenLevel = Math.max(levelNumber, lookupBeatenLevel());
}
var platformPutHighScore = function(score)
{
    localStorage.highScore = Math.max(score, lookupHighScore());
}

// UI.
var platformSetProgressScale = function(scale)
{
    progress_label.style.transform = 'scale(' + scale + ', ' + scale + ')';
}
var platformToast = function(messageId)
{
    toast_label.innerHTML = ['3 pipes left',
                             '2 more coins',
                             'Cross 10 pipes',
                             'Cross 20 pipes',
                             'Collect 10 coins',
                             'New high score',
                             'Too close',
                             'HD enabled',
                             'HD disabled',
                             'Muted',
                             'Unmuted'][messageId];
    toast_label.style.animationName = 'toast-bounce';
    toast_label.style.WebkitAnimationName = 'toast-bounce';
    toast_label.style.display = 'table';
    toast_label.addEventListener("animationend", platformKillToast, false);
    toast_label.addEventListener("webkitAnimationEnd", platformKillToast, false);
}
var platformKillToast = function()
{
    toast_label.style.display = 'none';
    toast_label.style.animationName = '';
    toast_label.style.WebkitAnimationName = '';
}
var platformSetProgressText = function(value)
{
    progress_label.innerHTML = value;
}
var platformShowBeatenMenu = function(nextLevelNumber)
{
    canvas.style.cursor = 'inherit';
    if (nextLevelNumber > 0) {
        beaten_menu_caption.innerHTML = 'Level Complete';
        beaten_menu_link.href = 'javascript:window.location.replace("#level' + nextLevelNumber + '")';
        beaten_menu_link.innerHTML = 'Next level';
    } else {
        beaten_menu_caption.innerHTML = 'Game Complete';
        beaten_menu_link.href = 'javsacript:window.location.back()';
        beaten_menu_link.innerHTML = 'Menu';
    }
    beaten_menu_content.style.animationName = 'fade-in';
    beaten_menu_content.style.WebkitAnimationName = 'fade-in';
    beaten_menu.style.display = 'table';
}
var platformShowStats = function(show)
{
    progress_label.style.display = show ? 'inline-block' : 'none';
}
var platformShowDeadMenu = function(scoreLabel, scoreValue, highScoreLabel, highScoreValue)
{
    canvas.style.cursor = 'inherit';
    dead_menu_score_label.innerHTML = scoreLabel;
    dead_menu_score_value.innerHTML = scoreValue;
    dead_menu_high_score_label.innerHTML = highScoreLabel;
    dead_menu_high_score_value.innerHTML = highScoreValue;
    dead_menu_content.style.animationName = 'fade-in';
    dead_menu_content.style.WebkitAnimationName = 'fade-in';
    dead_menu.style.display = 'table';
}
var platformShowPauseButton = function(show) {}
var platformShowPausedMenu = function(show) {}
var platformShowMainMenu = function() {}
var platformShowLevelsMenu = function() {}
var platformSuggestLowQuality = function() {}
var platformEnableContinuousRendering = function(enable) {}

// Utils.
var platformGetTime = (window.performance && performance.now)
    ? function() { return performance.now() / 1000 }
    : function() { return new Date().getTime() / 1000 };
var platformFail = function(message) { throw {msg:message} }

// Textures.
var get_raw_image = function(img, maxSize)
{
    var w = img.width, h = img.height;
    if (w > maxSize || h > maxSize) {
        if (w > height) {
            h = Math.floor(maxSize * h/w);
            w = maxSize;
        } else {
            w = Math.floor(maxSize * w/h);
            h = maxSize;
        }
    }

    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    return ctx.getImageData(0, 0, w, h);
}
var resizing_teximage_2d = function(target, format, img, maxSize)
{
    if (img.width <= maxSize && img.height <= maxSize && format == gl.RGBA) {
        gl.texImage2D(target, 0, format, format, gl.UNSIGNED_BYTE, img);
        return;
    }

    var raw = get_raw_image(img, maxSize);
    if (format == gl.RGBA) {
        gl.texImage2D(target, 0, format, raw.width, raw.height,
                      0, format, gl.UNSIGNED_BYTE, new Uint8Array(raw.data));
    } else {
        if (format != gl.ALPHA) throw "unsupported texture format";
        var alphaData = new Uint8Array(raw.height * raw.width);
        for (var i = 0; i < alphaData.length; i++)
            alphaData[i] = raw.data[4 * i];
        gl.texImage2D(target, 0, gl.ALPHA, raw.width, raw.height,
                      0, gl.ALPHA, gl.UNSIGNED_BYTE, alphaData);
    }
}
var platformLoadTexture2d = function(filename, textureUnit, format, premultiply, maxTextureSize)
{
    var img = new Image();
    img.src = 'textures/' + filename;
    img.onload = function() {
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply);
        resizing_teximage_2d(gl.TEXTURE_2D, format, img, maxTextureSize);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
}
var nextSkyboxLoaderId = 1;
var skyboxLoaders = {};
var platformLoadSkybox = function(name, maxCubeMapTextureSize)
{
    var skyboxSuffices = ["xp", "xm",
                          "yp", "ym",
                          "zp", "zm"];
    var loaderId = nextSkyboxLoaderId++;
    var loader = skyboxLoaders[loaderId] = {rgb:[],
                                            a:[],
                                            remaining:0,
                                            abort:false,
                                            maxCubeMapTextureSize:maxCubeMapTextureSize,
                                            finishedCallbacks:[],
                                            didAbort:false};
    var onload = function() {
        if (--loader.remaining || loader.didAbort)
            return;
        for (var i = 0; i < loader.finishedCallbacks.length; i++)
            setTimeout(loader.finishedCallbacks[i]);
    };

    for (var i = 0; i < 6; i++) {
        loader.rgb.push(new Image());
        loader.rgb[i].src = 'textures/' + name + '_' + skyboxSuffices[i] + '.jpg';
        loader.rgb[i].onload = onload;
        loader.remaining++;
        if (i < 4) {
            loader.a.push(new Image());
            loader.a[i].src = 'textures/' + name + '_' + skyboxSuffices[i] + '_alpha.png';
            loader.a[i].onload = onload;
            loader.remaining++;
        }
    }

    return loaderId;
}
var platformSkyboxLoaderIsFinished = function(loaderId)
{
    var loader = skyboxLoaders[loaderId];
    if (loader === undefined)
        return true;
    return !loader.remaining;
}
var platformSkyboxLoaderAbort = function(loaderId)
{
    var loader = skyboxLoaders[loaderId];
    if (loader === undefined)
        return;
    delete skyboxLoaders[loaderId];
    for (var i = 0; i < loader.finishedCallbacks.length; i++)
        setTimeout(loader.finishedCallbacks[i]);
    loader.didAbort = true;
}
var platformSkyboxLoaderFinish = function(loaderId)
{
    var loader = skyboxLoaders[loaderId];
    if (loader === undefined)
        return true;
    if (loader.remaining)
        throw {msg:"skybox loader not finished", loader:loader};

    delete skyboxLoaders[loaderId];

    var skyboxTargets = [gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                         gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                         gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];
    gl.activeTexture(gl.TEXTURE0 + SKYBOX_TEXTURE_UNIT);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    for (var i = 0; i < 6; i++) {
        if (i >= loader.a.length) {
            resizing_teximage_2d(skyboxTargets[i], gl.RGBA, loader.rgb[i],
                                 loader.maxCubeMapTextureSize);
            continue;
        }
        var img = get_raw_image(loader.rgb[i], loader.maxCubeMapTextureSize);
        var alpha = get_raw_image(loader.a[i], loader.maxCubeMapTextureSize);
        if (img.width != alpha.width) throw "mismatched rgb/alpha skybox image sizes";
        if (img.height != alpha.height) throw "mismatched rgb/alpha skybox image sizes";
        var imgLength = img.height * img.width;
        for (var j = 0; j < imgLength; j++)
            img.data[4 * j + 3] = alpha.data[4 * j];
        gl.texImage2D(skyboxTargets[i], 0, gl.RGBA, img.width, img.height,
                      0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(img.data));
    }
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

    return true;
}
