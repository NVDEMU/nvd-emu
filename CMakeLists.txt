cmake_minimum_required(VERSION 3.24)

project(nvd-emu
    VERSION 0.1.0
    DESCRIPTION "A modular multi-system emulator frontend"
    LANGUAGES CXX
)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

find_package(Qt6 6.7 REQUIRED COMPONENTS Core Gui Widgets Svg)

qt_add_executable(nvd-emu
    WIN32
    MACOSX_BUNDLE
    src/main.cpp
    src/MainWindow.cpp
    src/MainWindow.h
    include/nvd/CoreInterface.h
    resources/resources.qrc
)

target_include_directories(nvd-emu PRIVATE include src)

target_link_libraries(nvd-emu PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Widgets
    Qt6::Svg
)

set_target_properties(nvd-emu PROPERTIES
    OUTPUT_NAME "nvd-emu"
    MACOSX_BUNDLE_BUNDLE_NAME "nvd-emu"
    MACOSX_BUNDLE_GUI_IDENTIFIER "com.nvdemu.nvd-emu"
    MACOSX_BUNDLE_BUNDLE_VERSION "${PROJECT_VERSION}"
    MACOSX_BUNDLE_SHORT_VERSION_STRING "${PROJECT_VERSION}"
)

include(GNUInstallDirs)
install(TARGETS nvd-emu
    BUNDLE DESTINATION .
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)

include(CTest)
