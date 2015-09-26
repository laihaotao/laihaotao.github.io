---
layout: post
title: netbean下部署tomcat服务器连接mysql数据库
description: introduction how to deployment tomcat server and link to mysql database under netbean
keyword: netbean, tomcat, database, mysql
---
**本文是作者原创文章，欢迎转载，请注明出处 from:@Eric_Lai**
# 前言

继续上文，由于学校的项目没人。只好自己来现学现卖，今天研究了一番怎么配置数据库到服务器上。也是废了好一番功夫，我显示参考了NetBeans的官方教程，然而它使用的不是我们常用的Tomcat服务器，而且教程不讲原理只讲步骤我看得好痛苦。一番摸索下来，通过stackflow和tomcat自带的说明文档，用于研究出来了怎么部署。记录一番，以备查用。

# 环境准备
在准备布置这些之前需要的工具如下并且配置好所需的环境：
NetBeans IDE、tomcat8.0、mysql数据库、一张数据表（本文默认你已经知道怎么把数据库连接到IDE里面，如果不知道的请看这里）
==友情提示1==：tomcat8.0在NetBeans上无法部署的问题，如果报错是 '127.0.0.1' is not recognized as an internal or external command  的话，你需要在tomcat安装目录下找到bin文件夹下的catalina.bat文件，然后用记事本打开它的第179到184行，将以下内容

```
:noJuliConfig
set "JAVA_OPTS=%JAVA_OPTS% %LOGGING_CONFIG%"
..
:noJuliManager
set "JAVA_OPTS=%JAVA_OPTS% %LOGGING_MANAGER%"
更改为：

:noJuliConfig
set JAVA_OPTS=%JAVA_OPTS% %LOGGING_CONFIG%
..
:noJuliManager
set JAVA_OPTS=%JAVA_OPTS% %LOGGING_MANAGER%
```
**简单的说就是把这两出的双引号去掉。然后保存，重新打开tomcat即可完成部署。**
==友情提示2==：在进入NetBeans开始配置之前还有很重要的事情，要把从mysql上下载的JDBC驱动放到tomcat的安装目录的cof目录下，通过它的官方文档可以知道，只有这样只有在这个文件夹里的文件对tomcat启动的时候才是可见的。而且每次启动tomcat只会读取一次，所以必须要在没有启动服务器之前放到这个文件夹里面。注意这个JDBC的jre版本有讲究，太新的驱动不能配太老的数据库。这里我给出一个我可以用的。

# 在IDE下配置数据库连接池

在这之前我们需要下载两个Apache要求的jre文件（分别是jstl和stander），并把他们添加到工程的WEB-INF下的lib文件夹里（没有就新建）。没有的话下载的连接在这里。
首先，我们需要配置JNDI到tomcat。找到Context.xml这个文件，双击之打开源码。加入以下内容：

```xml
<Resource name="jdbc/DbTest(你的工程名字)" 
				auth="Container" type="javax.sql.DataSource"
               maxTotal="100" maxIdle="30" maxWaitMillis="10000"
               username="你的数据库用户名" password="数据库密码" driverClassName="com.mysql.jdbc.Driver"
               url="jdbc:mysql://localhost:3306/你的数据库名字"/>
```
然后，找到WEB-INF/web.xml这个文件，同样双击之打开源码。进行注册，在`<web-app>`和`</web-app>`标签之间加入以下代码：

```xml
  <resource-ref>
      <description>DB Connection</description>
      <res-ref-name>jdbc/工程名字</res-ref-name>
      <res-type>javax.sql.DataSource</res-type>
      <res-auth>Container</res-auth>
  </resource-ref>
```
最后，如果你建数据表的时候没有取得最高权限的话你需要在mysql的命令行模式下执行如下命令来取得权限：

```sh
mysql> GRANT ALL PRIVILEGES ON *.* TO 用户名@localhost
    ->   IDENTIFIED BY '密码' WITH GRANT OPTION;
```
至此，你完成了连接部分的配置。


