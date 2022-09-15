#pragma once

#include "emscripten.h"
#include <sstream>

class JS {
public:
    operator int()
    {
        const std::string& codeStr = _code.str();
        _code.str("");
        if (codeStr.length())
            return emscripten_run_script_int(codeStr.c_str());
        return -1;
    }
    ~JS()
    {
        const std::string& codeStr = _code.str();
        if (codeStr.length())
            emscripten_run_script(codeStr.c_str());
    }
    template<typename T> JS& operator <<(const T& t)
    {
        _code << t;
        return *this;
    }
private:
    std::ostringstream _code;
};

class LOG {
public:
    LOG() { _js << "console.log('"; }
    ~LOG() { _js << "')"; }
    template<typename T> LOG& operator <<(const T& t)
    {
        _js << t;
        return *this;
    }
private:
    JS _js;
};
