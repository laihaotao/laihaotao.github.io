---
layout: post
title: CMake 简要教程
subtitle: Introduction to CMake
keyword: C++, cmake, build tool
tag:
    - C++, cmake
---

在 C/C++ 领域， 一直很困扰我的是它没有一个令我觉得很 “用户友好” 的 “编译/构建” 系统(很可能是有，只是我不知道而已)。 一般情况下，如果只是写一个 demo，我就直接命令行 `gcc` 编译了；如果是小工程，就手写一个 `Makefile` 编译了。

记得刚接触 `OpenCV` 的时候，想自己编译一份源码，那真是的一场 “战争”。各种编译，各种报错。从那时候起，就想着要好好学习一下 `CMake` 了，但是每次都是看一下就忘，看一下就忘。

最近，因为迫不得已要联调一些 `Java` 和 `C++` 的代码，不能连怎么编译人家的代码都不会，并且想要在 `Java` 里调用 `C++` 还涉及到库的连接等一堆问题。所以，决定好好学习一下 `CMake`。

在往下面写之前先强调几个事情：

1. 不是迫不得已，不要搞什么 `JNI` （就是别没事要在 Java 里调 C++，反之亦然）；
2. 不是迫不得已，不要写 C++ 了 （我是 C++ 劝退党）；
3. 不是迫不得己，也不要学什么 `CMake` ；

如果你还在看，那肯定就是迫不得已了，那没招了，好好往下看吧。本文将会按照以下几个步骤来讲解怎么使用 `CMake`：

1. 最最最简单的一个 `CMakeLists.txt` 怎么写以及怎么使用它；
2. 如何使用 `CMake` 进行工程管理和构建 （每个子目录都要写一个 `CMakeLists.txt `）；
3. 如何构建静态库和动态库；
4. 如何使用别人构建好的库；

最后，本文默认读者具有一定的命令行使用经验。

## 最简单的例子

打开命令行：

```
// cd 到一处你准备放置本文示例的目录下
mkdir cmake_practice && cd cmake_practice
mkdir simple_example && cd simple_example

// 创建两个文件
touch main.c
touch CMakeLists.txt

// 创建一个目标文件夹 (所有的构建结果和中间文件会在这里面, 不污染源吗目录)
// 这是 cmake 推荐的 build out-of-source, 全文都采取这种方式
mkdir build
```

往建好的两个文件里填入如下内容：

```c
// main.c

#include<stdio.h>

int main(int argc, char *argv[]) {
	printf("Hello world (build from cmake)");
	return 0;
}
```

```
// CMakeLists.txt

cmake_minimum_required (VERSION 3.8)

project (HelloWorld)
add_executable (HelloWorld main.c)
```

上面这一小段一共有三个命令，逐一解释一下：

- `cmake_minimum_required` : 这个顾名思义了，最小的 cmake 版本要求；
- `project` : 给项目起一个名字，这个命令会隐式的定义两个变量，`PROJECT_SOURCE_DIR` 和 `PROJECT_BINARY_DIR`；
- `add_executable` : 定义可执行文件的名字 (第一个参数) 和 用于编译得到这个可执行文件的依赖文件 (第二个参数)；

再回到命令行，`cd` 到刚才建好的 `build` 文件夹下面：

```
cmake .. && make
```

如此，我们就完成了使用 `CMake` 构建一个可执行文件的最简单例子。在实际生活中，如果只是需要编译一个文件我们不需要使用如此复杂的步骤，直接命令行 `gcc` 即可，这里仅仅是为了演示 `CMake` 的使用。

## 工程化

一般来说，当我们的文件比较多的时候，我们会根据某种逻辑，把不同的源码文件放在不同的子文件夹中进行管理。要到达这个目标，我们需要在每一个子文件夹下写一个 `CMakeLists.txt` 这个文件负责告诉 `CMake` 如何处理这个文件夹下的文件。

继续拿上面的例子为例，但是这一次，我需要把所有的源码文件放大一个 `src` 目录下。

打开命令行：

```
// 假设我们在上面设置好的 "cmake_practice" 目录下
mkdir work_with_sub_dir && cd work_with_sub_dir
mkdir src && cd src

touch main.c
touch CMakeLists.txt

cd ..
mkdir build
touch CMakeLists.txt
```

然后分别在新建的三个文件中填入如下内容：

```
// work_with_sub_dir 目录下的 CMakeLists.txt
cmake_minimum_required (VERSION 3.8)

project (WorkWithSubDir)
add_subdirectory(src bin)
```

这里有一个新的命令：

`add_subdirectory` ： 这个命令的意思是，在构建的目标文件夹下，用 `bin` 作为目录明替换掉原来的 `src`


```
// src 目录下的 CMakeLists.txt
cmake_minimum_required (VERSION 3.8)
add_executable (WorkWithSubDir main.c)
```

```c
// src 目录下的 main.c
#include<stdio.h>

int main() {
    printf("Hello world from main.c in src\n");
    return 0;
}
```

回到命令行切换到 `build` 目录下：

```
bin/WorkWithSubDir
```

应该可以看到 `Hello world from main.c in src` 在控制台输出。需要在多层目录下构建时，重点就在于为每一个子目录写一个 `CMakeLists.txt` 文件，告诉 cmake 如何处理该文件下的文件。

## 构建库以及库安装

首先新建一个目录，按照如下的结构新建文件：

![](/images/cmake/cmake_adv1.png)

分别填入内容：

```
// CMakeLists.txt

# define minimum version of cmake
cmake_minimum_required (VERSION 3.8)

PROJECT(create_lib)
ADD_SUBDIRECTORY(lib)
```

```c
// hello.c
#include "hello.h"

void HelloFunc() { 
    printf("Hello World\n"); 
}
```

```c
// hello.h
#ifndef HELLO_H 
#define HELLO_H 
#include <stdio.h> 
void HelloFunc(); 
#endif
```

前面的内容都很寻常，唯一比较复杂的是 `lib/CMakeLists.txt`

```
// lib/CMakeLists.txt
# define minimum version of cmake
cmake_minimum_required (VERSION 3.8)

SET(LIBHELLO_SRC hello.c)
ADD_LIBRARY(hello SHARED ${LIBHELLO_SRC})

ADD_LIBRARY(hello_static STATIC ${LIBHELLO_SRC})
SET_TARGET_PROPERTIES(hello_static PROPERTIES OUTPUT_NAME "hello")

INSTALL(
    TARGETS hello hello_static
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
)
INSTALL(FILES hello.h DESTINATION include/hello)
```

一个一个地看看这些命令：

- SET(LIBHELLO_SRC hello.c), 设置一个变量
- ADD_LIBRARY(hello SHARED ${LIBHELLO_SRC}), 编译一个动态库
- ADD_LIBRARY(hello_static STATIC ${LIBHELLO_SRC}), 编译一个静态库，第一个参数是名字，由于不能重名所以这样命名
- SET_TARGET_PROPERTIES(hello_static PROPERTIES OUTPUT_NAME "hello”), 因为不管动态还是静态库 我们期望他们的名字应该是一样的，这里把名字设置成一样都是 “hello”
- INSTALL(FILES hello.h DESTINATION include/hello) 安装一系列的头文件
- INSTALL(TARGETS hello hello_static LIBRARY DESTINATION lib ARCHIVE DESTINATION lib), 安装库文件

编译完成了，下面关心一下怎么安装。

安装的主要作用是，把一些需要的头文件和编译好的库文件放到系统特定的目录中 (比如 /usr/local/lib, /usr/local/include 等)。想到达到这一步需要知道两个事情：

- cmake 的 `-DCMAKE_INSTALL_PREFIX` 标志 : 这个标志主要用于制定安装的路径前缀；
- cmake 的 `INSTALL` 命令 : 这个命令用来告诉 cmake 怎么安装各种不同的文件或者库 (怎么使用看上面的示例)；

继续用上面的例子，命令行 `cd` 到 `build` 文件下：

```
cmake DCMAKE_INSTALL_PREFIX=../install ..
cmake .. && make && make install
```

因为我不想污染系统环境，所以就安装在了当前的工程的根目录下，执行完上面的命令，应该能看到如下的目录结构：

![](/images/cmake/cmake_adv2.png)


## 使用编译好的库

终于来到了最后一步，我们继续上面的例子，我们已经编译了一个静态一个动态库并且将相关的头文件安装在了一些特定的目录里面。下面我们来看看如何调用已经编译好的库。

建立如下所示的文件：

![](/images/cmake/cmake_adv3.png)

填入如下的内容：

```
// CMakeLists.txt
# define minimum version of cmake
cmake_minimum_required (VERSION 3.8)

PROJECT(use_lib)
ADD_SUBDIRECTORY(src bin)
```

```
// src/CMakeLists.txt
# define minimum version of cmake
cmake_minimum_required (VERSION 3.8)

ADD_EXECUTABLE(main main.c)
INCLUDE_DIRECTORIES(<where you install the header files>/create_lib/install/include/hello)

FIND_LIBRARY(HELLO_LIB hello <where you install your libraries file>/create_lib/install/lib)
TARGET_LINK_LIBRARIES(main ${HELLO_LIB})
```

```c
#include <hello.h>

int main() {
    HelloFunc();
    return 0;
}
```

这里重点是两个命令：

- `INCLUDE_DIRECTORIES` : 如果你的头文件不是安装在系统必须搜寻的路径，需要这个命令告诉 cmake 去找到你的头文件
- `FIND_LIBRARY` : 如果你的库文件不是安装在系统必须搜寻的路径，需要这个命令告诉 cmake 去找到你的库文件
- `TARGET_LINK_LIBRARIES` : 将找到的库和可执行文件 (或者其他的库) 连接到一起

最后 `cd build && cmake .. && make` 应该可以看到调用了之前写的 `HelloFunc()` 函数。