CMAKE_MINIMUM_REQUIRED(VERSION 2.8)

PROJECT(swankybird.js CXX)

SET(CMAKE_CXX_COMPILER em++)

ADD_DEFINITIONS(-O3 -Wall -I../src -I../include -I.)

INCLUDE_DIRECTORIES(${CMAKE_SOURCE_DIR}/../src)

SET(SRC 
    FlappyBirdWebGL.cpp
    ../src/ALSounds.cpp
    ../src/Bird.cpp
    ../src/FlappyBird.cpp
    ../src/GameController.cpp
    ../src/Item.cpp
    ../src/Level.cpp
    ../src/Modelview.cpp
    ../src/Numbers.cpp
    ../src/Shader.cpp
    ../src/ShaderSources.cpp
    ../src/Transform.cpp
    ../src/StarDust.cpp
    ../src/VertexArrays.cpp)

ADD_EXECUTABLE(swankybird.js ${SRC})

TARGET_LINK_LIBRARIES(swankybird.js)

