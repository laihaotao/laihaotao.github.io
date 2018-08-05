---
layout: post
title: Jekyll＋GitHub Page 搭建静态博客
data: 2015-08-10
subtitle: introduction about how to built a blog by Jekyll＋github page
keyword: jekyll, github page, pygments, redcarpet, Mac
tag:
   - github
---

***本文是作者原创文章，欢迎转载，请注明出处 from:@Eric_Lai***

# 前言
折腾了好几天，到昨天终于弄出了一个所谓的“静态博客”大概框架，利用现下灰常流行的jekyll和github page。打算写下一些东西记录下这个过程，或许还能帮到其他的人。您现在看到的这个blog就是这样搭出来的，在这里特别感谢[PIZn](http://www.pizn.net)，这个blog的主题是由他设计，我在他的基础上增减并添加了自己的元素。废话不多说，进入正题了。

# 搭建过程
## github page
既然是一个网页，那当然要有网络上的空间来进行存储。现在github当然是主流了，而且它还可以提供我们一个**二级域名**，我们只需要建立一个很你用户名一样的代码仓库即可。什么？不会建代码仓库，那你先按后面的链接访问[Github](http://www.github.com)主页，注册一下即可获得你的账号，然后点击右上角的＋new repository。后面的步骤都比较容易了，注意repository的名字一定要是**/你的用户名.github.io**。这里做好之后，你就已经有了存放网页的空间了，这里有两种选择，一是直接使用github提供的自动生成网页功能，二是使用自定义的Jekyll来搭建，前者不在今天我们的研究范围。

这里需要解释一下，github page本身是支持Jekyll的，也就是说只要我们把文章post上去之后，github的Jekyll就会帮我们自动的解析。那我们为什么要在本地装Jekyll呢？当然是为了我们的调试，但是这并不是必要因素。想了解更多关于Jekyll的资料，请访问它的[官网](http://jekyllrb.com)，如果英文水平有限，可以访问它的[中文翻译网站](http://jekyllcn.com)。

## 安装一些软件
为了方便我们在本地调试，我们还是有必要安装一些东西：
- [ruby](https://www.ruby-lang.org/en/downloads/)
- [rubygems](https://rubygems.org/pages/download)
- [nodejs](https://nodejs.org)或者其他js的运行环境
- linux, mac os x, unix (不推荐在window下使用，当然使用也是可以的，你可以参看[这里](http://jekyllcn.com/docs/windows/))

说了这么多，竟然都还没有说到Jekyll。当你**成功**安装上面的东西之后，最简便的安装方法就是用命令行模式了，打开终端输入以下命令：

```sh
$ gem install jekyll
```
等一段时间，就可以看到完成安装了。这里不打算介绍怎么使用Jekyll的命令了，想了解的可以参看上面列出的相关网站。

## 配置文件夹
你可以使用以下命令来获得一个符合要求的目录结构

```sh
$ cd 你希望的目录地址
$ jekyll new username.github.io
```
这样你就获得了相关的目录，**但是这样使用的将会是Jekyll的默认主题**。我个人觉得不太好看，如果想要更好的主题，最好的方法就是clone一个别人的，然后做自己的修改。当然，别忘了标注原创者的贡献。例如我的这个blog就是在[PIZn](http://www.pizn.net)创作的the one主题的基础上搭建成的。
我们来看看一个基本的blog的目录架构：
- config.yml //重要的配置文件
- _layout
 \------>default.html
 \------>post.html
- _post
 \------>你的文章放在这里
- css
 \------>样式文件放在这里
- index.html //blog的主页

以上是基本的必须东西，每个人都有一些不同也是正常，还有一些是为了做的能好而添加的这里不详细的列举出来了。如果有兴趣可以参看我的blog的目录，请点击[这里](https://github.com/LAIHAOTAO/laihaotao.github.io)。
## config.yml说明
做完上述的这些，一个基本的blog框架就已经搭建出来了。如果你要在其中添加一些个性化的设置，可以再congif.yml里面进行添加。添加完之后，如果后面的代码当中有需要使用，可以用`\{\{site.相关名字(key)\}\}`来取得它的值(value)。在这里，你还可以对Jekyll的一些功能进行配置，详细的功能配置，请看[这里](http://jekyllcn.com/docs/configuration/)。
## 使用cygments配置高亮代码
在前面的基础上，我搭建好之后就迫不及待地把之前写的一篇文章post上来做测试了。但是发现了一个问题，其中的代码部分不会高亮。而且格式还不太对，不能识别围栏式代码块。这可就郁闷了，作为一个准码农（blog主还没毕业哈）的blog，不能高亮代码可不是什么好事。赶快Google了一下，发现比较常用的解决方案时使用pygments来高亮代码。那我就赶快行动起来了，要使用这个首先要安装一下，Mac下使用easy_install安装就可以了（前提是你有这个功能，至于怎么获得这个，还请自行Google一下了哈）。Mac下，打开终端输入以下命令：

```sh
$ easy_install pip
$ pip install pygments
```
过一小会儿，就可以发现安装成功了。然后，用cd命令进入你存放css的文件夹下，执行以下命令：

```sh
$ pygmentize -S xcode -f html > pygments.css
```
如果顺利的执行完这个命令，该目录下就会多出一个叫pygments.css的文件，这就是高亮代码用到的文件了。在这里，`-s xcode`表示的是一种高亮的样式，pygments提供了很多种样式供我们选择，可以访问[这里](http://pygments.org/demo/2352259/?style=xcode)一一查看样式们然后选择你喜欢的。下面，你还需要更改一下config.yml的配置，在开头加入如下代码：

```sh
markdown: redcarpet
markdown_ext:  markdown,mkd,mkdn,md
redcarpet:
  extensions: ["no_intra_emphasis", "fenced_code_blocks", "autolink", "tables", "strikethrough", "superscript", "with_toc_data", "footnotes","space_after_headers","highlight","underline","quote","lax_spacing"]
```
我使用的markdown解释器是redcarpet，可能其他也可以但是我没有测试过。以上添加的是关于解释器部分，现在Jekyll引擎还不知道我们要调用pygments，所以为了告知它我们还需要添加下面这句：

```sh
highlighter: pygments
```
有了上面这些，我们已经可以使用pygments来高亮我们的代码了，但是这个css文件还没有加入到我们的模版当中，这个时候我们需要找一下一个default.html的文件，这是默认的模版，一般放在_layout这个文件夹当中。打开这个文件，在`<head>`和`</head>`的标签之间添加一行代码：

```xml
<link rel="stylesheet" href="/css/pygments.css" type="text/css">
```
**注意了，这里的路径很重要。我的repository下laihaotao.github.css文件夹是专门用来放置css文件的，所以我的路径如上所示。这里没有添加正确的路径的话是没有办法调用该css，也就是你的代码还是没办法高亮。**

到了这里，保存config.yml文件和default.css文件，把这些更改commit之后，再push到master分支上，过个几分钟就可以去访问你的文章看看了。果然，代码已经有高亮了。
# 后记
这一切做完，回顾下来好像又不是很复杂。但是时间也的确用了不少。做完，感觉萌萌嗒。第一篇真正搭完这个blog的文章就先这样，去研究下怎么把以前在csdn上写的文章转移过来。有空post上过程。
