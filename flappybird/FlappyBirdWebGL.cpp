#include "FlappyBird.h"

#include "js.h"
#include <stdarg.h>
#include <string>
#include <flappy/GL.h>

static OwnPtr<FlappyBird> flappyBird;

extern "C" void EMSCRIPTEN_KEEPALIVE onPlatformInit()
{
    srand(static_cast<unsigned>((1 << 24) * EM_ASM_DOUBLE_V({ return Math.random() })));
    flappyBird = adoptPtr(new FlappyBird);
    flappyBird->onPlatformInit();
}

extern "C" void EMSCRIPTEN_KEEPALIVE onPlatformPause() { flappyBird->onPlatformPause(); }
extern "C" void EMSCRIPTEN_KEEPALIVE onPlatformResume() { flappyBird->onPlatformResume(); }
extern "C" void EMSCRIPTEN_KEEPALIVE onPlatformInterstitialShown() { flappyBird->onPlatformInterstitialShown(); }
extern "C" void EMSCRIPTEN_KEEPALIVE onPlatformInterstitialClosed() { flappyBird->onPlatformInterstitialClosed(); }
extern "C" void EMSCRIPTEN_KEEPALIVE onPlatformVideoAdClosed() { flappyBird->onPlatformVideoAdClosed(); }
extern "C" void EMSCRIPTEN_KEEPALIVE onPlatformConfigurationChanged() { flappyBird->onPlatformConfigurationChanged(); }
extern "C" void EMSCRIPTEN_KEEPALIVE onPlatformExitMenu(int levelNumber, long highScore) { flappyBird->onPlatformExitMenu(levelNumber, highScore); }
extern "C" void EMSCRIPTEN_KEEPALIVE onPlatformEnterMenu() { flappyBird->onPlatformEnterMenu(); }
extern "C" void EMSCRIPTEN_KEEPALIVE onPlatformBackButton() { flappyBird->onPlatformBackButton(); }
extern "C" void EMSCRIPTEN_KEEPALIVE onPlatformTap() { flappyBird->onPlatformTap(false); }
extern "C" void EMSCRIPTEN_KEEPALIVE onPlatformRetryLevel() { flappyBird->onPlatformRetryLevel(); }
extern "C" void EMSCRIPTEN_KEEPALIVE onPlatformNextLevel(int levelNumber, long highScore) { flappyBird->onPlatformNextLevel(levelNumber, highScore); }
extern "C" void EMSCRIPTEN_KEEPALIVE onPlatformEnableHighQuality(bool enable) { flappyBird->onPlatformEnableHighQuality(enable); }
extern "C" void EMSCRIPTEN_KEEPALIVE onPlatformPauseButton() { flappyBird->onPlatformPauseButton(); }
extern "C" void EMSCRIPTEN_KEEPALIVE onPlatformSurfaceChanged(int w, int h) { flappyBird->onPlatformSurfaceChanged(w, h); }
extern "C" void EMSCRIPTEN_KEEPALIVE onPlatformDrawFrame() { flappyBird->onPlatformDrawFrame(); }

void FlappyBird::platformLoadTexture2D(const char* filename, int textureUnit,
                                       int format, bool premultiply)
{
    JS() << "platformLoadTexture2d('" << filename << "', " << textureUnit << ", "
                                   << format << ", " << premultiply << ", "
                                   << maxTextureSize << ")";
}

class LoadSkyboxJS : public PlatformLoadSkybox {
public:
    LoadSkyboxJS(const char* name, int loaderId)
        : PlatformLoadSkybox(name)
        , mLoaderId(loaderId)
    {}

    virtual void abort() { JS() << "platformSkyboxLoaderAbort(" << mLoaderId << ")"; }
    virtual bool isDoneDecoding()
    {
        return JS() << "platformSkyboxLoaderIsFinished(" << mLoaderId << ")";
    }
    virtual bool finishGL()
    {
        return JS() << "platformSkyboxLoaderFinish(" << mLoaderId << ")";
    }

private:
    int mLoaderId;
};

PassRefPtr<PlatformLoadSkybox> FlappyBird::platformLoadSkybox(const char* name)
{
    int loaderId = JS() << "platformLoadSkybox('" << name << "', " << maxCubeMapTextureSize << ")";
    return adoptRef(new LoadSkyboxJS(name, loaderId));
}

void FlappyBird::platformPlaySound(PlatformSound sound, float volume)
{
    JS() << "platformPlaySound(" << sound << ", " << volume << ")";
}

void FlappyBird::platformStopAllSounds()
{
    JS() << "platformStopAllSounds()";
}

void FlappyBird::platformPreloadMedia(PlatformMedia media)
{
    JS() << "platformPreloadMedia(" << media << ")";
}

void FlappyBird::platformPlayMedia(PlatformMedia media)
{
    JS() << "platformPlayMedia(" << media << ")";
}

void FlappyBird::platformStopMedia(PlatformMedia media)
{
    JS() << "platformStopMedia(" << media << ")";
}

void FlappyBird::platformSetMediaVolume(PlatformMedia media, float volume)
{
    JS() << "platformSetMediaVolume(" << media << ", " << volume << ")";
}

void FlappyBird::platformReleaseMedia(PlatformMedia media)
{
    JS() << "platformReleaseMedia(" << media << ")";
}

void FlappyBird::platformPauseAllAudio(bool pause)
{
    JS() << "platformPauseAllAudio(" << pause << ")";
}

void FlappyBird::platformBindDefaultFramebuffer()
{
    glBindFramebuffer(GL_FRAMEBUFFER, 0);
}

double FlappyBird::platformGetTime() const
{
    return EM_ASM_DOUBLE_V({ return platformGetTime() });
}

void FlappyBird::platformSetProgressScale(float scale)
{
    JS() << "platformSetProgressScale(" << scale << ")";
}

void FlappyBird::platformToast(PlatformToast message)
{
    JS() << "platformToast(" << message << ")";
}

void FlappyBird::platformKillToast()
{
    JS() << "platformKillToast()";
}

void FlappyBird::platformSetProgressText(long value)
{
    JS() << "platformSetProgressText(" << value << ")";
}

void FlappyBird::platformPutBeatenLevel(int levelNumber)
{
    JS() << "platformPutBeatenLevel(" << levelNumber << ")";
}

void FlappyBird::platformShowBeatenMenu(int nextLevelNumber)
{
    JS() << "platformShowBeatenMenu(" << nextLevelNumber << ")";
}

void FlappyBird::platformShowPauseButton(bool show)
{
    JS() << "platformShowPauseButton(" << show << ")";
}

void FlappyBird::platformShowStats(bool show)
{
    JS() << "platformShowStats(" << show << ")";
}

void FlappyBird::platformShowPausedMenu(bool show)
{
    JS() << "platformShowPausedMenu(" << show << ")";
}

void FlappyBird::platformPutHighScore(long score)
{
    JS() << "platformPutHighScore(" << score << ")";
}

void FlappyBird::platformShowDeadMenu(const char* scoreLabel, long scoreValue,
                                      const char* highScoreLabel, long highScoreValue, bool)
{
    JS() << "platformShowDeadMenu('" << scoreLabel << "', " << scoreValue << ", "
                                  << "'" << highScoreLabel << "', " << highScoreValue << ")";
}

void FlappyBird::platformShowMainMenu()
{
    JS() << "platformShowMainMenu()";
}

void FlappyBird::platformShowLevelsMenu()
{
    JS() << "platformShowLevelsMenu()";
}

void FlappyBird::platformSuggestLowQuality()
{
    JS() << "platformSuggestLowQuality()";
}

void FlappyBird::platformEnableContinuousRendering(bool enable)
{
    JS() << "platformEnableContinuousRendering(" << enable << ")";
}

void FlappyBird::platformFail(const char* message, ...) const
{
    char str[2048];

    va_list args;
    va_start (args, message);
    vsnprintf (str, sizeof(str), message, args);
    va_end (args);

    JS() << "platformFail('" << str << "')";
}

bool FlappyBird::platformShowInterstitialAd() { return false; }
void FlappyBird::platformToastBlockIcon() {}
void FlappyBird::platformShowBannerAd(bool) {}
bool FlappyBird::platformShowVideoAd() { return false; }
void FlappyBird::platformRequestRender() {}
void FlappyBird::platformPreloadVideoAd() {}
