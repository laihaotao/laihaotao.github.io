---
layout: post
title: 毕设记录python利用socket进行文件传输
subtitle: Introduction of socket in python
keyword: socket tcp
---
**本文是作者原创文章，欢迎转载，请注明出处 from:@[Eric_Lai](http://laihaotao.github.io)**

# 前言
大四下学期，寒假不努力，现在要拼命赶进度了。毕业设计当中，我需要下位机stm32将图片发送（串口转wifi）到上位机（pc）进行图像处理。以前没有试过这样的操作，思考了一下，因为有串口转wifi的模块，所以决定上位机用python来写一个socket实现这个功能（由于下位机是stm32，所以下位机的发送就只能用c来写了）。

# 尝试
先用python写一个demo来测试下是否可以实现，写两个python程序。一个python程序充当下位机（客户端），一个pyhon充当上位机（服务端）。

逻辑如下：首先，服务端代码是一直在运行，监听着端口，如果有客户端发起请求，则连接之建立socket。客户端与服务端连接后，开始发送文件。期间，输出发送的状态信息。

我的目录结构是这样子的：

- 桌面新建一个send_image_test文件夹
- send_image_test文件夹里面分别建py_s文件夹和py_c文件夹
- 以上两个文件夹里面分别建py_s.py和py_c.py
- 在文件夹py_c里面放了一张bmp格式的图片，命名为image.bmp

根据上面的逻辑，写出下面的代码：

```python
# 服务端代码，环境Mac
#!/usr/bin/env python
# -*- coding: UTF-8 -*-

# 导入库
import socket, threading, os

SIZE = 1024

# 检查当前目录下是否有等下要命名的图片,有的话删除之
def checkFile():
	list = os.listdir('.')
	for iterm in list:
		if iterm == 'image.bmp':
			os.remove(iterm)
			print 'remove'
		else:
			pass

# 接受数据线程
def tcplink(sock, addr):
	print 'Accept new connection from %s:%s...' % addr
	sock.send('Welcome from server!')
	print 'receiving, please wait for a second ...'
	while True:
		data = sock.recv(SIZE)
		if not data :
			print 'reach the end of file'
			break
		elif data == 'begin to send':
			print 'create file'
			checkFile()
			with open('./image.bmp', 'wb') as f:
				pass
		else:
			with open('./image.bmp', 'ab') as f:
				f.write(data)
	sock.close()
	print 'receive finished'
	print 'Connection from %s:%s closed.' % addr


# 创建一个socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# 监听端口（这里的ip要在不同的情况下更改）
s.bind(('127.0.0.1', 9999))
# 每次只允许一个客户端接入
s.listen(1)
print 'Waiting for connection...'
while True:
	sock, addr = s.accept()
	# 建立一个线程用来监听收到的数据
	t = threading.Thread(target = tcplink, args = (sock, addr))
	# 线程运行
	t.start()
```

```python
# 客户端代码，环境Mac
#!/usr/bin/env python
# -*- coding: UTF-8 -*-

import socket

SIZE = 1024

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# 建立连接:
s.connect(('127.0.0.1', 9999))
# 接收欢迎消息:
print s.recv(SIZE)
s.send('begin to send')
print 'sending, please wait for a second ...'
with open('./image.bmp', 'rb') as f:
	for data in f:
		s.send(data)
print 'sended !'
s.close()
print 'connection closed'
```

需要注意的是，以上的代码是在本地测试的。所以地址使用的是127.0.0.1（如需在不同的机器上测试，请使用对应的ip地址），端口号使用一个没有被其他应用程序使用的即可（我随便选了一个9999）。

以上的两个程序当中都有一个SIZE常量，是接收缓冲区的最大字节数，如果每次发送的数据大过SIZE个字节，则肯定会出现错误，这里需要谨慎对待。

发送数据时，我们是从文件当中读取数据到内存，然后再往外发送。那么如果读取的数据很大，超过了内存怎么办。上面的方法就是最好的方法，不要使用file.read(size)这类的方法，容易出错。而是，将整个file当做一个对象来处理，python虚拟机会自己分配缓冲区和内存，参看这里：

> [读取大文件时的方法（这种方法需要python2.5以上）](http://stackoverflow.com/questions/8009882/how-to-read-large-file-line-by-line-in-python)

另外，写代码时需要注意缩进。要么使用四个空格，要么使用一个tab。不能同时使用两种，否则，需要在你的编辑器上做空格和tab的转换处理。

提供一下python 2.7的socket库相关文档链接：

> [官方文档（英文）](https://docs.python.org/2/library/socket.html)
> 
> [翻译的文档（中文）](http://python.usyiyi.cn/python_278/library/socket.html)

通过运行上面的代码，图片成功的传输了到服务端的文件夹下：

![测试结果](http://upload-images.jianshu.io/upload_images/735527-d3b21be123068767.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
s
# 进阶修改
上述的代码只是直接将一张图片，从客户端发送到了服务端。在实际的使用当中，应该是需要发送命令和文件两种形式。所以，我们需要对上面的代码进行一些修改。

我们先定义一个通信协议：

>	建立连接后开启一个线程，用于处理本次的通信（一个while循环），如果遇到接收文件的情况，则开启一个子线程用于接收。

>	发送数据有两种情况，发送命令，发送文件
>	接收数据有两种情况，一种是接收命令，一种是接收文件

>	发送数据：
>		发送命令时，第一个字符为c（command）表示后面接的是命令，第二个字符是命令代号。
>            发送文件时，第一个字符为f（file）表示后面接的是文件，后面就是文件的二进制形式。
>	接收数据：
>		接收数据分成两段，首先查看第一段报文是命令还是文件标识，第二段则是接收具体的数据
>		命令标识为”c“，文件标识为”f“

修改后的代码粘贴如下：

```
#!/usr/bin/env python
# -*- coding: UTF-8 -*-

# 导入socket库
import socket, threading, time, os

SIZE = 1024

# 检查当前目录下是否有等下要命名的图片,有的话删除之
def checkExsit():
	list = os.listdir('.')
	for iterm in list:
		if iterm == 'image.bmp':
			os.remove(iterm)
			print 'Exsit file has been removed'
	print 'Create file ...'
	with open('./image.bmp', 'wb') as f: pass

def recvImage(sock):
	while True:
		data = sock.recv(SIZE)
		if not data:
			break
		else:
			with open('./image.bmp', 'ab') as f:
				f.write(data)
	print 'data received'

def saveImage(sock):
	print 'Begin to save image ...'
	checkExsit()
	t = threading.Thread(target = recvImage, args = (sock,))
	t.setDaemon(True)
	t.start()
	t.join()
	print 'Finished saving image ...'

def tcplink(sock, addr):
	# 打印连接信息
	print 'Accept new connection from %s:%s...' % addr
	# 发送问候信息(客户端接收到后返回一个'hello server')
	sock.send('hello client')
	print sock.recv(SIZE)
	print 'Communication test success'
	# 接受数据循环（一直等待接收数据并进行处理 *****注意这是在一个线程里面******）
	while True:
		recv = sock.recv(SIZE)
		# 接收命令
		if recv == 'c':
			print 'receive command'
			cmd = sock.recv(SIZE)
			print 'recv: %s' %cmd
			# 判断命令并执行相应的程序
			recv = None
		# 接收文件（这里主要是图片）
		elif recv == 'f':
			print 'file command'
			saveImage(sock)
			recv = None

# 创建一个socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# 监听端口（这里的ip要在不同的情况下更改）
s.bind(('127.0.0.1', 9999))
# 每次只允许一个客户端接入
s.listen(1)
print 'Waiting for connection...'
while True:
	sock, addr = s.accept()
	# 建立一个线程用来监听收到的数据
	t = threading.Thread(target = tcplink, args = (sock, addr))
	# 线程运行
	t.start()
```

```
#!/usr/bin/env python
# -*- coding: UTF-8 -*-

import socket,time

SIZE = 1024

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# 建立连接:
s.connect(('127.0.0.1', 9999))
# 接收欢迎消息:
print s.recv(SIZE)

s.send('hello server')
time.sleep(0.5)
print 'command test begins ...'
s.send('c')
s.send('weeding')
print 'command test ended'
time.sleep(0.5)

print 'image test begins ...'
s.send('f')
time.sleep(0.2)
with open('./image.bmp', 'rb') as f:
	for data in f:
		s.send(data)
print 'image test ended'

s.close()
print 'connection closed'
```
上面的代码，运用了一个子线程来执行接收图片。使用多线程，最好可以了解下下面的内容：

> 守护线程
> 
> 线程锁
> 
>[线程的中文文档](http://python.usyiyi.cn/python_278/library/threading.html#module-threading)

![修改后运行结果](http://upload-images.jianshu.io/upload_images/735527-87aab063dc414a8a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
