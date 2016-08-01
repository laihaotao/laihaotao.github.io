---
layout: post
title: 毕设记录之libjpeg将bmp格式转换成jpg格式
subtitle: Using LIBJPEG change bmp to jpg
keyword: LIBJPEG bmp jpg
tag:
   - 毕业设计
---
**本文是作者原创文章，欢迎转载，请注明出处 from:@[Eric_Lai](http://laihaotao.github.io)**


# 前言
在毕业设计里面，下位机通过OV7725和屏幕截屏，获得了一张bmp格式的图像。我希望可以将这个图片发送到上位机进行图像处理，但是由于bmp格式的图片比较大，在传输过程当中需要的时间比较长。所以，我希望可以将这个bmp图像转换成jpg格式，然后再发送。经过试验，220多k得bmp图片，转换成jpg格式后只有20多k（注意，**这不是压缩比**，要根据具体的图片来确定，图片越单一压缩比越高）。

# 获得源码
通过资料搜集，发现一个开源库[libjpeg](http://libjpeg.sourceforge.net)可以用来实现这个功能，这个库的主要作者是[LJG](http://www.ijg.org)，通过上面的两个连接你都可以获得源码。我采用的后面的LJG的连接的源码，下载对应机器的版本，然后编译之。

# 编译源码
编译源码也是一个技术活，我的环境是Mac OS X EI 10.11（后文的C集成开发环境是Xcode 6）。

在Mac下编译源码的话比较简单，将下载的压缩包解压，打开命令行，cd进入目录，执行命令：

> ./configure --prefix=“你希望编译后文件的绝对路径”（不要带引号）

然后就执行make和make install命令，你就会在你规定的路径下看到编译出来的文件。

# BMP格式
bmp格式，是window的标准位图格式。详细介绍，百度百科请点击在[这里](http://baike.baidu.com/link?url=mvmulyFnT9OILvkaAn8Ebl_GraAtVhCy2QRpdlamxeqcg1CAeiIuq3PoZbge8DfgnBiKSn2qXu_NIKE-YotSIXkSpwBuiuxFUmajUZ9Q5D_)。下面是简要介绍，典型的BMP图像文件由四部分组成：

1. 位图头文件数据结构，它包含BMP图像文件的类型、显示内容等信息；
2. 位图信息数据结构，它包含有BMP图像的宽、高、压缩方法，以及定义颜色等信息；
3. 调色板，这个部分是可选的，有些位图需要调色板，有些位图，比如真彩色图（24位的BMP）就不需要调色板 (**注意，本文仅仅处理24位的bmp，非24位的用后面的算法是行不通的！**)；
4. 位图数据，这部分的内容根据BMP位图使用的位数不同而不同，在24位图中直接使用RGB，而其他的小于24位的使用调色板中颜色索引值。 

# 读取BMP图片算法
既然，我们要讲bmp图片转换，那第一步首先是要将bmp图片读到内存当中才可以进行处理。下面，叙述bmp的读取方法。

## 读取BMP头文件数据
根据上面的知识，我们先尝试以下读取BMP的头文件数据。由资料可知，BMP头文件具体包括以下内容：

- 位图文件类型 【1，2】字节
- 位图文件大小（单位：字节）【3，6】字节
- 保留字1 【7，8】字节
- 保留字2 【9，10】字节
- 位图数据偏移量（单位：字节）【11，14】字节

根据以上的内容，这些信息都是按照顺序存放的。不难理解出，我们的处理方法，应该是定义一个结构体来存放它们。先看一下目录结构，在一个文件夹（我命名为c_test）下新建三个文件：bmp2jpg.h，bmp2jpg.c和main.c。 

下面是结构体定义的代码：

```c
//以下代码放在bmp2jpg.h文件里面
//关于其中DWORD WORD这些变量的说明如下：
//请自己根据自己使用的系统来确定 WORD是两个字节，DWORD是4个字节
typedef struct tagBITMAPFILEHEADER {
  DWORD bfSize;
  WORD bfReserved1; 
  WORD bfReserved2; 
  DWORD bfOffBits;
} BITMAPFILEHEADER,tagBITMAPFILEHEADER;
```
细心的读者肯定会发现，上面定义的结构体怎么少了位图文件类型一项。这里作出解释：一般来说，会在程序开始先读取并判断前面2个字节（即位图文件类型）是否为BM（若是，说明这儿文件是bmp格式。否则，就不再执行后面的处理了），所以结构体里面没有定义。**另外，编译器默认是4字节对齐的（一次读取4个字节），直接添加这个会导致后面的数据读取错误**。

```c
//bmp2jpg.c
#include "bmp2jpg.h"

// 头文件结构体
BITMAPFILEHEADER bmpFileHeader;
// 位图类型
char fileType[2];
// bmp文件指针
FILE *bmp;

void showBmpHead(BITMAPFILEHEADER *pBmpHead) {
    printf("bmp文件大小:%u\r\n", (*pBmpHead).bfSize);
    printf("保留字1:%d\r\n", (*pBmpHead).bfReserved1);
    printf("保留字2:%d\r\n", (*pBmpHead).bfReserved2);
    printf("实际位图数据的偏移字节数:%u\r\n", (*pBmpHead).bfOffBits);
    printf("\r\n");
}

// 读取bmp图片，成功返回 0
int readBmpFileHeader(const char *bmp_file) {
    bmp = fopen(bmp_file, "rb");
    if (bmp == NULL) {
        printf("%s\n", "fail to open");
        return -1;
    }
    // 读取文件前两个字节判断是否bmp格式
    fread(fileType, sizeof(char), 2, bmp);
    if (strcmp(fileType, "BM")==0) {
        fread(&bmpFileHeader, sizeof(tagBITMAPFILEHEADER), 1, bmp);
        showBmpHead(&bmpFileHeader);
    }else {
        printf("%s\n", "this file is not a bmp file");
        return -1;
    }
    return 0;
}
```
上面是读取bmp的代码，用fopen以二进制的形式打开图片文件，然后读取一定的字节数（[2,14]字节，共12字节），放到结构体变量当中，再通过showBmpHead将它们显示出来。主函数那里调用一下readBmpFileHeader()并把图片的路径以字符串的形式传进去即可。主函数如下：

```c
//main.c
#include <stdio.h>
#include "bmp2jpg.h"

int main() {   
    readBmpFileHeader("/Users/ERIC_LAI/Desktop/bmp2jpg/bmp2jpg/image2.bmp");
    return 0;
}
```
结果如下所示：

>bmp文件大小:230454
>保留字1:0
>保留字2:0
>实际位图数据的偏移字节数:54

应用同样的道理，我们可以把第二部分的信息也获取出来并保存到一个结构体上，这里不一一赘述。

# 读取BMP图片数据
读取的方法很简单，定义一个容器，接着上面的操作把剩下的数据读取进容器里面就可以了。这里叙述的是在pc上的读取，在stm32等内存有限的设备上不能使用这种方法（后文会叙述）。

```c
// 这里将函数写成内部方法，可以根据需要自行调整
// show？的方法是调试用的，这里注释掉了
// 读取bmp图片，成功返回 0
static int readBmpFile(const char *bmp_file) {
    FILE *bmp;
    static char fileType[2];
    bmp = fopen(bmp_file, "rb");
    if (bmp == NULL) {
        printf("%s\n", "fail to open");
        return -1;
    }
    // 读取文件前两个字节判断是否bmp格式
    fread(fileType, sizeof(char), 2, bmp);
    // 读取头文件
    if (strcmp(fileType, "BM")==0) {
        readFlag = fread(&bmpFileHeader, sizeof(tagBITMAPFILEHEADER), 1, bmp);
//        showBmpHead(&bmpFileHeader);
        // 读取位图信息
        if (readFlag == 1) {
            readFlag = fread(&bmpInfoHeader, sizeof(tagBITMAPINFOHEADER), 1, bmp);
//            showBmpInfo(&bmpInfoHeader);
        } else {
            printf("%s\n", "fail to read the bmp information");
            return -1;
        }
        // 读取位图数据
        data_size = bmpInfoHeader.biWidth * bmpInfoHeader.biHeight * depth;
        //动态分配内存，记得需要释放（这里在调用这个函数的函数里面释放，下文可以看到）
        bmp_data = malloc(data_size);
        fread(bmp_data, sizeof(BYTE), data_size, bmp);
    }else {
        printf("%s\n", "this file is not a bmp file");
        return -1;
    }
    fclose(bmp);
    return 0;
```
由于本文只研究真彩色的图（毕业设计时间有限，以后可能会研究对其他类型图片的操作），所以对于这种bmp图片，剩下的部分就是具体的图片数据编码了。在真彩色的bmp格式的图片当中，每一个像素用三个数据来表示，分别是BGR（blue green red）。因为在第二部分，我们获取了图片的宽度和高度。通过这两个参数，我们便可以知道整个图片的排列规则，以及应该怎么显示它们了。

下面，就是正菜了！演示如何使用jpeglib库将bmp图片转换成jpg格式图片，使用之前需要注意，**将编译的时候生成的lib和include文件夹添加到当前工程的目录下，否则会报错找不到某些函数**，转换函数代码如下：

```c
// 这个函数对外暴露，输入两个参数，分别是待转换的bmp图片路径和希望生成jpg图片的路径
int mp2jpg(const char *bmp_file, const char *jeg_file) {
    FILE *outfile;
    struct jpeg_compress_struct cinfo;
    struct jpeg_error_mgr jerr;
    JSAMPROW row_pointer[1]; /* 行指针 */
    int row_stride; /* 行跨度（图像中一行需要多少个字节来表示） */
    char tmp = '0';
    int index = 0;
    // 读取bmp图像
    if (readBmpFile(bmp_file) == -1) return -1;
    // 将BGR编码方式转换成RGB编码方式
    for (index = 0; index < data_size; index = index+3) {
        tmp = bmp_data[index];
        bmp_data[index] = bmp_data[index+2];
        bmp_data[index+2] = tmp;
    }
    cinfo.err = jpeg_std_error(&jerr);
    jpeg_create_compress(&cinfo);
    if ((outfile = fopen(jeg_file, "wb")) == NULL) {
        fprintf(stderr, "can't open %s\n", jeg_file);
        return -1;
    }
    // 设置jpeg参数
    jpeg_stdio_dest(&cinfo, outfile);
    cinfo.image_width = bmpInfoHeader.biWidth;
    cinfo.image_height = bmpInfoHeader.biHeight;
    cinfo.input_components = 3;
    cinfo.in_color_space = JCS_RGB;
    jpeg_set_defaults(&cinfo);
    jpeg_set_quality(&cinfo, JPEG_QUALITY, TRUE);
    jpeg_start_compress(&cinfo, TRUE);
    
    /* 这里使用库提供的cinfo.next_scanline作为循环计数器，这样我们不需要自己来追踪。
     * 如果下一行小于图片的高度则继续循环
     */
    row_stride = bmpInfoHeader.biWidth * depth;
    while (cinfo.next_scanline < bmpInfoHeader.biHeight) {
        // 取当前行最后一位数据的地址
        row_pointer[0] =  & bmp_data[cinfo.next_scanline * row_stride];
        // 写入jpg格式数据
        (void) jpeg_write_scanlines(&cinfo, row_pointer, 1);
    }
    // 完成转换，释放对象空间，关闭文件
    jpeg_finish_compress(&cinfo);
    jpeg_destroy_compress(&cinfo);
    free(bmp_data);
    fclose(outfile);
    return 0;
}
```
总结之，目前整个工程下有3个文件，分别是main.c，bmp2jpg.c和bmp2jpg.h。bmp2jpg.c有上文的两个函数readBmp和bmp2jpg，main.c也很简单只是调用了一下bmp2jpg这个函数。比较复杂的是bmp2jpg.h，这里定义了一些结构体，暴露了一个函数。下面给出代码：

```c
//main.c
#include <stdio.h>
#include "bmp2jpg.h"
int main() {
    bmp2jpg("/Users/ERIC_LAI/Desktop/bmp2jpg/bmp2jpg/image2.bmp", 
            "/Users/ERIC_LAI/Desktop/bmp2jpg/bmp2jpg/image.jpg");
    return 0;
}
```

```c
//bmp2jpg.h
#include <string.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include "jpeglib.h"
#include <setjmp.h>

// #define WIDTHunsigned charS(bits) (((bits)+31)/32*4)
typedef unsigned char BYTE;             //1
typedef unsigned short WORD;            //2
typedef unsigned int DWORD;             //4
typedef long LONG;                      //8

typedef struct tagBITMAPFILEHEADER {
  DWORD bfSize;             //4
  WORD bfReserved1;           //2
  WORD bfReserved2;           //2
  DWORD bfOffBits;           //4
} BITMAPFILEHEADER,tagBITMAPFILEHEADER;

typedef struct tagBITMAPINFOHEADER {
     DWORD biSize;                      //4
     DWORD biWidth;           //4
     DWORD biHeight;           //4
     WORD biPlanes;                     //2
     WORD biBitCount;                   //2
     DWORD biCompression;               //4
     DWORD biSizeImage;                 //4
     DWORD biXPelsPerMeter;       //4
     DWORD biYPelsPerMeter;             //4
     DWORD biClrUsed;                   //4
     DWORD biClrImportant;              //4
 } BITMAPINFOHEADER,tagBITMAPINFOHEADER;

typedef struct tagBGRA {
    BYTE rgbBlue;
    BYTE rgbGreen;
    BYTE rgbRed;
    BYTE rgbReserved;
} BGRA,tagBGRA;

int bmp2jpg(const char *bmp_file, const char *jeg_file);
```