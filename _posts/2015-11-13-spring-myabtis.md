---
layout: post
title: 初探Spring+myBatis
subtitle: A demo about spring and mybatis
keyword: spring, mybatis
---
**本文是作者原创文章，欢迎转载，请注明出处 from:@[Eric_Lai](http://laihaotao.github.io)**

## 写在前面
最近实习了，很多东西要学没有太多的时间来更新。公司用的大框架是SpringMVC+myBatis，这段时间一直在扒这个框架。今天终于做完了一个demo记录一下以备查阅。

## 工程组织
建立工程也是一个技巧活，下面先来配置一下工程的文件架构。

- 首先是新建一个工程，我将它命名为myBatisDemo
- 然后在这个工程的src下建立两个子文件夹分别是com和mian
- com下是各位的java文件，详细参见下图
- main下有一个resources文件夹，放置myBatis的自动生成功能的两个配置文件（命名为generatorConfig.xml，它的property文件是generatorConfig.properties）
- 工程目录下还有一些配置文件，pom.xml是用来管理Maven的，Configuration是myBatis的核心管理文件

![工程结构](/images/mybatisDemoProject.JPG)

## 详解配置过程
首先你需要准备一个数据库和表，这里不赘述这部分操作。我的表（表名student，数据库名test）如下所示：

![数据库表内容](/images/mybatisDemoTable.JPG)

### Maven的配置过程
为了方便进行各种依赖关系的管理，整个工程用Maven来进行管理，它的配置文件是pom.xml。

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" 
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
	http://maven.apache.org/xsd/maven-4.0.0.xsd">

	<modelVersion>4.0.0</modelVersion>
	<groupId>myBatisDemo</groupId>
	<artifactId>myBatisDemo</artifactId>
	<version>1.0-SNAPSHOT</version>

	<properties>
		<!-- 项目的文件的格式编码 -->
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<!-- spring版本号 -->
		<spring.version>4.2.2.RELEASE</spring.version>
	</properties>

	<dependencies>
		<dependency>
			<groupId>javax</groupId>
			<artifactId>javaee-web-api</artifactId>
			<version>7.0</version>
			<scope>provided</scope>
		</dependency>
		<!--spring支持包 -->
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-core</artifactId>
			<version>${spring.version}</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-web</artifactId>
			<version>${spring.version}</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-oxm</artifactId>
			<version>${spring.version}</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-tx</artifactId>
			<version>${spring.version}</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-jdbc</artifactId>
			<version>${spring.version}</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-webmvc</artifactId>
			<version>${spring.version}</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-aop</artifactId>
			<version>${spring.version}</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-context-support</artifactId>
			<version>${spring.version}</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-test</artifactId>
			<version>${spring.version}</version>
		</dependency>
		<!--mybatis核心包 -->
		<dependency>
			<groupId>org.mybatis</groupId>
			<artifactId>mybatis</artifactId>
			<version>3.2.8</version>
		</dependency>
		<!--mybatis-spring包 -->
		<dependency>
			<groupId>org.mybatis</groupId>
			<artifactId>mybatis-spring</artifactId>
			<version>1.2.2</version>
		</dependency>
		<!-- 导入Mysql数据库链接jar包 -->
		<dependency>
			<groupId>mysql</groupId>
			<artifactId>mysql-connector-java</artifactId>
			<version>5.1.37</version>
		</dependency>
		<!-- 导入dbcp的jar包，用来在applicationContext.xml中配置数据库 -->
		<dependency>
			<groupId>commons-dbcp</groupId>
			<artifactId>commons-dbcp</artifactId>
			<version>1.2.2</version>
		</dependency>
		<!-- JSTL标签类 -->
		<dependency>
			<groupId>jstl</groupId>
			<artifactId>jstl</artifactId>
			<version>1.2</version>
		</dependency>
		<!-- 映入JSON -->
		<dependency>
			<groupId>org.codehaus.jackson</groupId>
			<artifactId>jackson-mapper-asl</artifactId>
			<version>1.9.13</version>
		</dependency>
	</dependencies>

	<build>
		<sourceDirectory>src</sourceDirectory>
		<plugins>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-compiler-plugin</artifactId>
				<version>3.1</version>
				<configuration>
					<source>1.7</source>
					<target>1.7</target>
				</configuration>
			</plugin>
			<!-- 自动生成实体类、dao、Mapper的插件 -->
			<plugin>
				<groupId>org.mybatis.generator</groupId>
				<artifactId>mybatis-generator-maven-plugin</artifactId>
				<version>1.3.2</version>
				<configuration>
					<verbose>true</verbose>
					<overwrite>true</overwrite>
				</configuration>
			</plugin>
		</plugins>
	</build>

</project>
```
### myBatis配置过程
所有需要用到的依赖包都下载之后，接下来是配置myBatis。核心配置文件是Configuration.xml（主要用于构建SqlSessionFactory）。我的配置如下：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!-- 格式头一定要有 -->
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
  <environments default="development">
    <environment id="development">
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED">
      	<!-- 按照你选择的数据库来添加，我用的是MySql -->
        <property name="driver" value="com.mysql.jdbc.Driver"/>
        <!-- 你的数据库地址 -->
        <property name="url" value="jdbc:mysql://localhost:3306/test"/>
        <!-- 数据库访问用户名 -->
        <property name="username" value="root"/>
        <!-- 数据库访问密码，我这里是空 -->
        <property name="password" value=""/>
      </dataSource>
    </environment>
  </environments>
  <mappers>
    <mapper resource="com/ericlai/myBatisDemo/mapper/StudentMapper.xml"/>
  </mappers>
</configuration>
```
下面，对这个配置文件进行一下详细解释：

- propeties：这些属性都是可以从外部配置且可以动态替换的（我没有使用这个功能，而是直接写了上去）如需使用需要指明从哪个文件当中读取值,例如：

```xml
<properties resource="com/myBatisDemo/*.properties"(引入需要读取值文件)>
	...
	<property name="driver" value="${driver}">
	<property name="url" value="${url}">
	...
</properties>
```
- environment:为了方便将SQL应用于多种不同的数据库当中，我们这里只用了MySql所以配置一个environment就可以了。不过需要注意，如果连接了两个以上的数据库，就要创建多个SqlSessionFactory实例；
- dataSource：用来指定连接数据库的JDBC连接对象资源，myBatis有三种内奸额数据源，分别是`UNPOOLED`,`POLLED`,`JNDI`(这里我使用的时数据库连接池，第一种是不适用连接池，第三种是为了在EJB或者应用服务器当中使用放置一个上下文);
- mapper：这是为了告诉myBatis去哪里寻找sql语句可以使用resource或者url等；

注：还有这里没有用到的settings，typeAliases、typeHandlers、objectFactoryplugins没有详解，想要更深层次的了解可以点击[这里](http://mybatis.org/mybatis-3/zh/configuration.html)。
### myBatis的自动生成配置
我们访问数据库的时候需要写sql语句、封装数据的实体类、dao和Mapper文件等，过程比较漫长的枯燥。myBatis有插件可以自动生成这些代码，下面将演示如何实现这个功能：

- 首先，需要在Maven的pom.xml文件当中添加自动生成插件（我上面已经添加了）
- 然后，建立一个generatorConfig.xml文件来进行自动生成的配置操作
- 最后，在==同一个目录下==（方便使用resource）建立一个propeties文件辅助配置

```xml
<?xml version="1.0" encoding="UTF-8"?>

<!DOCTYPE generatorConfiguration
        PUBLIC "-//mybatis.org//DTD MyBatis Generator Configuration 1.0//EN"
        "http://mybatis.org/dtd/mybatis-generator-config_1.0.dtd">

<generatorConfiguration>

	<!--导入属性配置 
		注意genertaorConfig.propeties需要在于此文件同一目录下-->
	<properties
		resource="genertaorConfig.propeties"></properties>

	<!--指定特定数据库的jdbc驱动jar包的位置 -->
	<classPathEntry
		location="C:\Users\Administrator\.m2\repository\mysql\mysql-connector-java\5.1.30\mysql-connector-java-5.1.30.jar" />

	<context id="MySQLTables" targetRuntime="MyBatis3">

		<!--jdbc的数据库连接 -->
		<jdbcConnection driverClass="${jdbc.driverClass}"
			connectionURL="${jdbc.connectionURL}" userId="${jdbc.userId}"
			password="${jdbc.password}">
		</jdbcConnection>

		<!-- false：JDBC DECIMAL、NUMERIC类型解析为Integer，默认方式 -->
		<!-- true： JDBC DECIMAL、NUMERIC类型解析为java.math.BigDecimal -->
		<javaTypeResolver>
			<property name="forceBigDecimals" value="false" />
		</javaTypeResolver>

		<!--生成的model 包路径 -->
		<javaModelGenerator targetPackage="${model.package}"
			targetProject="${target.project}">
			<property name="enableSubPackages" value="ture" />
			<property name="trimStrings" value="true" />
		</javaModelGenerator>

		<!--Mapper映射文件生成所在的目录 为每一个数据库的表生成对应的SqlMap文件 -->
		<sqlMapGenerator targetPackage="${xml.mapper.package}"
			targetProject="${target.project}">
			<property name="enableSubPackages" value="false" />
		</sqlMapGenerator>

		<!-- 生成的Dao接口 的包路径 -->
		<javaClientGenerator type="XMLMAPPER"
			targetPackage="${dao.package}" targetProject="${target.project}">
			<property name="enableSubPackages" value="ture" />
		</javaClientGenerator>

		<!--用到的数据库表名 -->
		<table tableName="student"></table>

	</context>
</generatorConfiguration>
```

```propeties
jdbc.driverLocation=C:\Users\Administrator\.m2\repository\mysql\mysql-connector-java\5.1.30\mysql-connector-java-5.1.30.jar
jdbc.driverClass=com.mysql.jdbc.Driver
jdbc.connectionURL=jdbc:mysql://localhost:3306/test
jdbc.userId=root
jdbc.password=

model.package=com.ericlai.myBatisDemo.model
dao.package=com.ericlai.myBatisDemo.dao
xml.mapper.package=com.ericlai.myBatisDemo.mapper

target.project=src
```
做完上述操作之后，我们就可以使用自动生成工具来进行相应文件的生成了。因为这个工具是一个Maven插件，所以我们需要在IDE当中点击Run傍边的箭头图标选择run congiguration然后添加一个Maven的运行项（我命名为mybatis-generator），命令是`mybatis-generator:generate -e -X`这里的两个参数，-e是显示错误信息，-X是显示详细的debug信息。

现在点击一下Run------>mybatis-generator，就可以自动生成对应的文件了。

## 测试
下面，做一个测试类来试验下以上的配置是否成功。新建一个Test类装在Test包下放在src的目录下，代码如下：

```java
package com.ericlai.myBatisDemo.test;

import java.io.Reader;

import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;

import com.ericlai.myBatisDemo.dao.StudentMapper;
import com.ericlai.myBatisDemo.model.Student;

public class Test {

	private static SqlSessionFactory sqlSessionFactory;
	private static Reader reader;

	static {
		try {
			reader = Resources.getUrlAsReader("file:///C:\\Users\\Administrator\\workspace\\myBatisDemo\\Configuration.xml");
			sqlSessionFactory = new SqlSessionFactoryBuilder().build(reader);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public static SqlSessionFactory getSession() {
		return sqlSessionFactory;
	}

	public static void main(String[] args) {
		SqlSession session = sqlSessionFactory.openSession();
		try {
			StudentMapper mapper = session.getMapper(StudentMapper.class);
			Student student = mapper.selectByPrimaryKey(2);
			System.out.println(student.getName());
			System.out.println(student.getId());
		} finally {
			session.close();
		}
	}

}
```
运行后，可以得到结果如下：
>李四
>
>1
