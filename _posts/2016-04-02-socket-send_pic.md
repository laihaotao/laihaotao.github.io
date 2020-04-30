---
layout: post
title: 毕设记录之socket自定义数据包发送图片
subtitle: Using Socket to send picture by my-defined digital package 
keyword: Socket Send-picture
tag:
   - 毕业设计
---
**本文是作者原创文章，欢迎转载，请注明出处 from:@[Eric_Lai](http://laihaotao.github.io)**


# 写在前面
还是毕业设计的事儿，还是发送图片的事儿。前面已经用了python实现图片的发送，但是很蛋疼的是，上位机用的是vb.net来进行开发，python的在图片发送和接收又变得不好使了。实验了若干种方法，下面记录一下。

目标：在vb.net的环境下和Android之间使用socket进行图片的传输。

实现：自定义一个简单的传输协议，将图片用字节流的方式发送和接收。

环境：在vb.net和Android上已经试验成功，但是本文用java进行演示（原因是：1.懒得连接Android了；2.实在很讨厌vb的语言....）。逻辑是一样的，只是具体的语法会有些少出入。

# 原理介绍
这次，在具体的实现之前，先扒一下原理。网络传输，使用的时socket，这是一个建立在tcp协议上的通信机制。所以，有必要了解一下什么是tcp协议，什么是socket。

## TCP / IP 协议
Transmission Control Protocol/Internet Protocol的简写，中译名为传输控制协议/因特网互联协议，又名网络通讯协议，是Internet最基本的协议、Internet国际互联网络的基础，由网络层的IP协议和传输层的TCP协议组成。TCP/IP 定义了电子设备如何连入因特网，以及数据如何在它们之间传输的标准。协议采用了4层的层级结构，如下图所示，每一层都呼叫它的下一层所提供的协议来完成自己的需求。（来自百度百科）

![tcp ip协议层级示意图](/images/socket-send_pic1.jpg)

通俗而言：IP协议是给因特网的每一台联网设备规定一个地址，以便能够在因特上上定位到该设备。TCP负责发现传输的问题，一有问题就发出信号，要求重新传输，直到所有数据安全正确地传输到目的地。

## socket
我们知道，程序在设备当中运行时是以进程的形式被操作系统管理的。在本地，两个进程之间要通信，首先必须知道的是它们的PID。在网络上，依靠PID来识别不同的进程，显然是不科学的，因为它们会重复。从上面，我们了解到每个连接到因特网的设备的ip都是唯一的。所以，我们可以借助ip再加上一个端口号，来进行进程的唯一识别。**当网络进程可以唯一识别之后，就可以使用socket进行通信了。**

socket，翻译成中文是“套接字”。它是应用层和传输层之间的一个抽象层，它把TCP/IP层复杂的操作抽象为几个简单的接口供应用层调用已实现进程在网络中通信，如下图所示。socket源起于UNIX，在一切皆是文件的哲学思想下，socket是“打开-读写-关闭”模式的实现，服务端和客户端共同维护一个“文件”，在连接建立之后，双方都可以对文件进行读写操作；通讯结束时，关闭该文件。

![socket 示意图](/images/socket-send_pic2.jpg)

# 具体实现
有了上面的原理，我们可以着手来实现以下了。以下出现的代码，只是为了演示，真实开发环境下不要这样写。

Java提供了socket的相关API，我们不需要知道怎么写socket的底层，通过调用API就可以建立连接了。在建立连接之前，我们需要自己定义一个用于发送图片的简单的通信协议。我自己随便定义了一个，如下图中间部分所示。

![自定义socket通信](/images/socket-send_pic3.jpg)

通信协议，顾名思义，是用来规定通信过程的一种约定。只有服务端和客户端都遵循同一个协议，才可以完成有效的通信。就想上图表示的一样，我规定了如下的内容：

-  每次发送的数据包长度为1029个字节（数据包是一个有符号的字节数组，下标从0开始到1028结束）
- 第一个字节是标志位，该位为1时，表示后面还有数据；该位为2时，表示这是最后一包数据
- 数据包的[1 : 4]表示该数据包的有效数据长度，因为数据包最大可以存放1024字节的数据，所以[1 : 4]每一位分别表示“个十百千”位上的数字。除去最后一包数据，其他包都应该是放满的，最后一包的数据则很大可能都不满1024（配合流的read方法可以避免接收冗余数据）。

有了上面的约定，我们就可以写代码了：

```java
// SocketTest.java 下面代码的运行环境是Mac intellij14
import java.io.*;
import java.net.ServerSocket;
import java.net.Socket;

/**
 * Created by eric_lai on 2016/3/31.
 */
public class SocketTest {

    // 服务端, 用来接收图片
    public static void ServerSocket() {

        // 调试标志
        String TAG = "ServerSocket: ";
        // 服务端socket
        ServerSocket serverSocket = null;
        // 端口号
        int port = 9998;
        // 缓冲区
        byte[] buffer = new byte[1029];
        int len = buffer.length;
        // 实际长度
        int dataLen = 0;
        // 文件输出流
        FileOutputStream fileOutputStream = null;
        // client输入流
        InputStream clientInputStream = null;
        // 文件路径
        File file = new File("res/image2.jpg");
        try {
            fileOutputStream = new FileOutputStream(file);
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }

        try {
            // 绑定端口号
            serverSocket = new ServerSocket(port);
            // 堵塞线程, 等待连接
            System.out.println(TAG + "waitting for connection ...");
            Socket client = serverSocket.accept();
            System.out.println(TAG + "connection has been set up");
            // 获取client输入流
            clientInputStream = client.getInputStream();
            // 读取数据
            byte[] lenInByte = new byte[4];
            clientInputStream.read(buffer, 0, len);
            byte flag = buffer[0];
            System.arraycopy(buffer, 1, lenInByte, 0, lenInByte.length);
            dataLen = ChangeByte2Int(lenInByte);
            System.out.println(TAG + "begin to receive image ...");
            while (true) {
                if (fileOutputStream != null) {
                    if (flag == 1) {
                        // 写入文件
                        fileOutputStream.write(buffer, 5, dataLen);
                        // 读取数据
                        clientInputStream.read(buffer, 0, len);
                        flag = buffer[0];
                        System.arraycopy(buffer, 1, lenInByte, 0, lenInByte.length);
                        dataLen = ChangeByte2Int(lenInByte);
                    } else {
                        // 写入文件
                        fileOutputStream.write(buffer, 5, dataLen);
                        break;
                    }
                }
            }
            System.out.println(TAG + "image successfully received ...");
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                if (fileOutputStream != null) {
                    fileOutputStream.close();
                }
                if (clientInputStream != null) {
                    clientInputStream.close();
                }
                if (serverSocket != null) {
                    serverSocket.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }

        }

    }

    public static void ClientSocket() {

        // 调试标志
        String TAG = "ClientSocket: ";
        // 客户端socket
        Socket clientSocket = null;
        // 服务器地址
        String ip = "127.0.0.1";
        // 端口号
        int port = 9998;
        // 缓冲区
        byte[] buffer = new byte[1029];
        int len = buffer.length;
        byte[] fullData = {0, 1, 0, 2, 4};
        // 实际长度
        int realLen = 0;
        // 文件末尾标志
        int cf = 0;
        // 文件输入流
        FileInputStream fileInputStream = null;
        // client输出流
        OutputStream clientOutputStream = null;
        // 文件路径
        File file = new File("res/image1.jpg");

        try {
            // 建立socket
            System.out.println(TAG+"set up connection to the server ...");
            clientSocket = new Socket(ip, port);
            // 获取文件输入流(读取要发送的图片)
            fileInputStream = new FileInputStream(file);
            // 获取socket输出流(发送数据包)
            clientOutputStream = clientSocket.getOutputStream();
        } catch (IOException e) {
            e.printStackTrace();
        }

        if (clientOutputStream != null) {
            try {
                System.out.println(TAG+"begin to send the image ...");
                while (cf != -1) {
                    // 读取数据放到数据区域
                    cf = fileInputStream.read(buffer, 5, len - 5);
                    if (cf == -1) {
                        // 将长度转为byte[]
                        byte[] by = ChangeInt2Byte(realLen);
                        // 将长度数据整合到数据包里面
                        System.arraycopy(by, 0, buffer, 0, by.length);
                        // 标志位置2
                        buffer[0] = 2;
                        // 发送数据
                        clientOutputStream.write(buffer, 0, realLen + 5);
                    }else {
                        // 缓存实际的数据长度
                        realLen = cf;
                        System.arraycopy(fullData, 0, buffer, 0, fullData.length);
                        // 标志位置1
                        buffer[0] = 1;
                        // 发送数据
                        clientOutputStream.write(buffer, 0, len);
                    }
                }
                System.out.println(TAG+"image has been sent ...");
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    public static int ChangeByte2Int(byte[] bytes) {
        int result = 0;
        int[] a = {1000, 100, 10, 1};
        for (int i = 0, j = 0; i < bytes.length; i++, j++) {
            int k = (int) bytes[i];
            result += k * a[j];
        }
        return result;
    }

    public static byte[] ChangeInt2Byte(int len) {
        byte[] bytes = new byte[5];
        byte[] bytesReturn = new byte[5];
        int result = 0;
        int i;
        int j = 1;
        int z = 4;
        int k = 1;
        for (i = 4; i >= 0; i--) {
            result = len % 10;
            bytes[i] = (byte) result;
            len /= 10;
        }

        for (; j < bytes.length; j++) {
            bytesReturn[k] = bytes[j];
            k++;
        }
        return bytesReturn;
    }

    public static void PrintBytes(byte[] bytes) {
        int len = bytes.length;
        for (byte b : bytes) {
            System.out.print(b + " ");
        }
    }

}
```

```java
// main.java 
import java.net.Socket;
import java.util.Timer;

public class Main {

    public static void main(String[] args) {
        beginTest();
    }

    private static void beginTest() {
        Thread server = new Thread(new Runnable() {
            @Override
            public void run() {
                SocketTest.ServerSocket();
            }
        });
        Thread client = new Thread(new Runnable() {
            @Override
            public void run() {
                SocketTest.ClientSocket();
            }
        });
        server.start();

        // 确保服务端先启动
        try {
            server.sleep(100);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        client.start();
    }
}
```

运行上述代码后，结果如下：

![运行结果](/images/socket-send_pic4.png)

注意，需要自己准备图片！