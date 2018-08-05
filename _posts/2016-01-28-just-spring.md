---
layout: post
title: 再探spring+mbybaits
subtitle: A demo about spring and spring+mybatis
keyword: spring mvc
tag:
   - java_ee
---
**本文是作者原创文章，欢迎转载，请注明出处 from:@[Eric_Lai](http://laihaotao.github.io)**

这几天一直都在做spring+mybaits的整合项目，但是其中遇到很多问题。所以现在开始重新学习一下spring，重最简单的开始，下面演示一个demo。

# 工程目录
本次demo的工程目录如下：
![工程目录图](/images/justspring_proStru.JPG)

注解：其中涂了红色的请忽略，是做其他作用的。包名为：justspring，下面有两个包分别是dao和service。dao用于模拟以后的数据库操作，service，顾名思义是服务层。
这两个包当中各有两个文件，一个是接口（interface）一个是接口的实现（interfaceImpl）。

# 详细代码（version 1.0）
## dao（数据持久层）

```java
//dao.java 文件名(下同)

package justspring.dao;

public interface Dao {
	String sayHello();
}
```

```java
//daoImpl.java

package justspring.dao;

public class DaoImpl implements Dao {
    @Override
    public String sayHello() {
        return "hello by dao";
    }
}
```

以上是dao层的代码，因为这是一个demo，所以每个文件只有一个方法用于示范。在真实的环境当中，dao层应该是和数据库打交道的，dao只提供接口而具体的实现可以通过mybatis的sql映射来实现，或者自己编写数据库的操作语句。在这里，因为是demo所以采用了后者，并且没有写数据库操作语句。

## service（服务层）

```java
//service.java 

package justspring.service;

public interface Service {
    String sayHello();
    String otherService();
}
```

```java
//serviceImpl.java

package justspring.service;

import justspring.dao.Dao;

public class ServiceImpl implements Service {
    private Dao dao;
    public void setDao(Dao dao) {
        this.dao = dao;
    }
    @Override
    public String sayHello() {
        return dao.sayHello();
    }
    @Override
    public String otherService() {
        return "other service";
    }
}
```
服务，是用来承接控制层和数据层的，数据层取得的数据要在这里进行各种逻辑操作。将service细分为两小层：

- service 服务接口层
- serviceImpl 服务实现层

服务接口层很简单，就是将提供的服务逐一的列出来，不管具体的实现。服务实现层，则是负责实现每一个服务，这样有利于后期的维护和升级。一般来说，我们从数据库查到的信息都是要拿来进行各种逻辑操作的，这个操作的场所正是服务实现层。所以，等下会在服务实现层里面由spring注入dao接口。既然如此为什么服务实现层不直接实现dao接口就好了呢？因为，真正的系统里面还会有一些不依靠数据库或者不同数据库的操作，所以其他服务需要在服务接口层进行声明。

在这里，最重要的就是这个serviceImpl了。它负责实现服务，我们可以看到这里面有一个Dao的对象，但是奇怪的是我们并没有给它new任何的实例。如果你对spring有一点了解的话就会知道，这里将会使用spring的依赖注入（Ioc）来实现了。后面的spring的配置文件里会有说明。

这里有两个方法，其中的sayHello方法是使用了dao的方法，otherService则可以想象成是一些不需要数据库的服务。

## spring配置文件
相信熟悉spring的都会知道，spring需要有一个配置文件，主要就是用来配置bean的。所以，这个文件很重要，随着spring的发展，越来越多简便的配置方法也出来了，很容易把人搞晕，我这次重新研究的重点就是想找到最简便最清晰的配置方法。但是，我还没研究出来，所以这里采用最原始的配置方法来演示。

```xml
//spring1.xml 这个名字大家可以随便起
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">

       <!--创建一个一个名字（可以用name或者id来表示，唯一标识，不可重复）为dao的bean，class表示它的类（必须是类，不可以是接口或者抽象类）-->
       <!--这个主要是用来等着被下面的bean使用的-->
       <bean id="dao" class="justspring.dao.DaoImpl"/>

       <!--创建一个名字为service，类型是ServiceImpl的bean，并且将这个bean注入到ServiceImpl.java的成员变量dao当中-->
       <!--property 当中的name是成员变量的名字（需要保持一致），ref是指注入的是上面创建的bean-->
       <bean id="service" class="justspring.service.ServiceImpl">
              <property name="dao" ref="dao"/>
       </bean>
</beans>
```

## 测试
做到这里就基本是万事具备了，我们来测试一下是否真的成功了。为了不写main函数那套这里用了Junit4来进行，需要在maven下添加一下依赖包。

```xml
<dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <version>4.12</version>
    <scope>testJustSpring</scope>
</dependency>
```

```java
import justspring.service.Service;
import org.junit.Test;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;

public class testJustSpring {

    @Test
    public void test() {
		//引入spring的配置文件获取上下文
        ApplicationContext context = new ClassPathXmlApplicationContext("spring1.xml");
		//通过上下文和bean的名字获取service实例，就是刚才在配置文件下配置的第二个
		//其实这里也可以通过依赖注入来实现，不过需要写setter代码不太好看        
		Service service = (Service) context.getBean("service");
        String string = service.sayHello();
        System.out.println(string);
    }
}
```
通过上面的代码，我们可以得到的结果如下：

> hello by dao

## 简化spring配置过程
通过上面的配置，成功地得到了想要的结果。但是，如果bean很多的时候，我们都需要逐一的去配置就会显得非常的麻烦。spring团队也一直致力于简化.xml的配置步骤，这里简述一下如何使用注解来简化配置。

要想使用注解进行xml配置，需要在xml当中添加以下代码：

```xml
<context:annotation-config/>
<context:component-scan base-package="justspring.service,justspring.dao"/>
```
以上第一行是开启注解，第二行是扫描注解包。如果有第二行代码，第一行可以省略。

对于不同的层，spring提供了不同的注解。详细的情况如下所示：

> - dao层使用 @Repository，可以在其后添加("")来指定bean的名字（即name或者id）
> - service层使用 @Service，可以在其后添加("")来指定bean的名字（即name或者id）
> - controller层使用 @Controller，可以在其后添加("")来指定bean的名字（即name或者id）
> - 其他情况下可以使用 @Component，可以在其后添加("")来指定bean的名字（即name或者id）

注意，以上注解都是在接口的实现类进行。并且，如果没有指定名字，系统会默认起名，规则是：取类名，将第一个字母转换为小写。

使用以上的方法，我们可以完成将bean在xml的注册。但是，如果在某一类当中，我们需要使用bean时，怎么将xml当中的bean注入到类当中呢？这里要涉及到bean的自动装配策略。相关的注释主要有@Resource和@Autowired。这里不详细讲述他们的区别，需要看详细介绍了可以看这篇[文章](http://www.ibm.com/developerworks/cn/opensource/os-cn-spring-iocannt/)，本文使用@Resource进行。回到代码当中，将上面的代码做出如下的修改。

```java
//DaoImpl.java

package justspring.dao;

import org.springframework.stereotype.Repository;

@Repository("dao") //添加了这行代码
public class DaoImpl implements Dao {
    @Override
    public String sayHello() {
        return "hello by dao";
    }
}
```

```java
//ServiceImpl.java

package justspring.service;

import justspring.dao.Dao;
import javax.annotation.Resource;

//因为这个工程里有Service类，为了不发生歧义，使用包名+类名
@org.springframework.stereotype.Service("service")
public class ServiceImpl implements Service {

    @Resource //添加了这个注释，将上面的dao注入到这里
    private Dao dao;

    @Override
    public String sayHello() {
        return dao.sayHello();
    }

    @Override
    public String otherService() {
        return "other service";
    }
}
```

有了上面两个代码文件，我们的xml就解放出来了。不需要再进行任何的bean注册了，现在的xml应该如下所示：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context.xsd">

       <context:annotation-config/>
       <context:component-scan base-package="justspring.service,justspring.dao"/>
</beans>
```

xml文件一下子干净了很多，省掉了配置的麻烦。测试类的代码不作任何的变化，运行后可以得到与之前一样的结果。测试类当中的service还是要通过getBean来实现的，我尝试着用@Resource像注入dao那样的方法来做，但是并没有能够成功。报错空指针，这里接下来还需要认真的研究一下。

# 详细代码（version 2.0）
前面已经得到了一个完整的spring工程，但是dao部分关于数据库的还没有实现，下面来完成怎么连接数据库，并且从数据库里面获取到数据的操作。首先需要在maven下添加需要的依赖包，这里不一一列举了，可以参看我这个系列的第一篇[文章](http://laihaotao.github.io/2015/11/13/spring-myabtis/)。

## Mybatis-Spring
Mybatis，是支持定制化 SQL、存储过程以及高级映射的优秀的持久层框架。MyBatis 避免了几乎所有的 JDBC 代码和手动设置参数以及获取结果集。MyBatis 可以对配置和原生Map使用简单的 XML 或注解，将接口和 Java 的 POJOs(Plain Old Java Objects,普通的 Java对象)映射成数据库中的记录。

> Mybatis有一个中文的说明文档，需要可以点击[这里](http://www.mybatis.org/mybatis-3/zh/)查看

由于我们是在spring的框架下使用mybait，所以除了配置mybatis外，还需要将它和spring框架结合在一起。方便的是，已经存在无缝连接它们的库了，那就是Mybaits-Spring。

> Mybatis-Spring有一个中文的说明文档，需要可以点击[这里](http://www.mybatis.org/spring/zh/)查看
> 
> 注意，中文版不够详细，有能力还是请阅读英文版

通过这个文档，总结一下使用的方法。

### 安装
使用整个模块前需要引入必要的jar包，或者添加依赖文件.
如果使用的是maven，在pom.xml当中添加如下：

```xml
<dependency>
  <groupId>org.mybatis</groupId>
  <artifactId>mybatis-spring</artifactId>
  <version>x.x.x</version>
</dependency>
```
### 开始
要和spring一起使用mybatis，需要在spring的上下文当中定义至少两样东西。分别是：

- 一个SqlSessionFactory
- 至少一个数据映射器类

#### 配置SqlSessionFactory
其中，第一点很容易配置，先把它干掉。直接在spring的上下文配置就可以了，注意，整合后，不需要单独的mybatis配置文件，全部的配置内容都可以在spring的上下文当中进行。

```xml
//spring1.xml 在上面已有的基础上添加

//数据源配置，需要根据个人情况填写
<bean id="dataSource" class="org.apache.commons.dbcp.BasicDataSource">
  <property name="driverClassName" value="com.mysql.jdbc.Driver" />
  <property name="url" value="jdbc:mysql://localhost:3306/数据库名" />
  <property name="username" value="用户名" />
  <property name="password" value="密码" />
</bean>

//SqlSessionFactory配置，注意此处有大坑（如果你使用Intellij这个ide的话请看后面的填坑指南）
<bean id="sqlSessionFactory" class="org.mybatis.spring.SqlSessionFactoryBean">
  <property name="dataSource" ref="dataSource"/>
  <property name="mapperLocations" value="classpath:mapper/*.xml"/>
</bean>
```

注意：上面的的文件不能照着填，需要将路径理清楚，如果你自己在尝试着写的话，请把路径换成你自己的。这里使用的是mysql数据库，如果不是请按照实际情况填写。Intellij编译工程的时候，会按照目录的种类进行编译，xml文件在src的源码目录下的话不会编译到target里面，需要单独进行设置。

#### 配置数据映射器类
配置数据映射器的方法有很多，先简要的叙述一下：

> 官方说明文档在[这里](http://www.mybatis.org/spring/mappers.html)（这里不要去看中文的翻译版，不单止内容缺少，而且讲得非常不清楚）
> 
> 总结一下来说就是两种方法：
> - 利用xml来进行显示的逐一配置（如果mapper很多的话就会很麻烦）
> - 利用mybatis-spring提供的自动扫描机制（就像spring当中扫描dao和service组件那样）

有简单的方法使用，相信没有人希望用难的方法，所以这里使用上述的第二种方法进行，在spring1.xml（即spring的配置文件）当中添加几句代码可以：

```
//spring1.xml 现在我的spring1.xml看起来是这样的

<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:mybatis="http://mybatis.org/schema/mybatis-spring"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd
       http://www.springframework.org/schema/context
       http://www.springframework.org/schema/context/spring-context.xsd
       http://mybatis.org/schema/mybatis-spring
       http://mybatis.org/schema/mybatis-spring.xsd">

		//添加了这一句和多引用了一个命名空间，请和上面的文件对比着看
       	<mybatis:scan base-package="justspring.dao" />

       	...省略相同的代码

</beans>
```

#### 添加数据库查询操作以及包装服务层代码
配置方面现在就都做好了，需要添加一些数据库的操作代码（写在xml配置文件上），另外在dao和service提供一些接口并实现它。在dao真正操作数据库的时候不需要我们自己写实现类，按照上面的配置，保证xml的名字和接口类的名字对应一致，框架会替我们做好实现。要实现操作数据库，首先要有数据表，我们这里建了一个用来测试，如下：

>括号表示存在表里的数据
>
>表名：person
>
>字段1：LOG_NM（"管理员0"）
>
>字段2：LOG_PW（"123456"）



```java
//Dao.java

package justspring.dao;

import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Repository;

@Repository //没有实现类DaoImpl，所以将这个注解放在了这里
public interface Dao {
//    @Select("SELECT LOG_PW FROM person WHERE LOG_NM = #{name}")
//通过@Select注释也可以不用写xml直接进行数据库操作，但是在比较复杂的查询情况下还是需要xml的（官方的说法），所以这里还是使用xml的方法
    String getPwByUserNm(@Param("name")String name);
//@Param是一个注解，表示传进去的参数名字，在xml当中通过@Param括号里面的名字，可以获取到传进去的参数
}
```

```java
//Service.java

package justspring.service;

public interface Service {
    String getPwByUserNm(String name);
}
```

```java
//ServciceImpl.java

package justspring.service;

import justspring.dao.Dao;
import org.apache.ibatis.annotations.Param;

import javax.annotation.Resource;

@org.springframework.stereotype.Service("service")
public class ServiceImpl implements Service {

	//同上，注入一个dao
    @Resource
    private Dao dao;

	//实现通过用户名获取密码的服务
    @Override
    public String getPwByUserNm(String name) {
        return this.dao.getPwByUserNm(name);
    }
}

```

```xml
//Dao.xml

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd" >
//命名空间必须指向接口类
<mapper namespace="justspring.dao.Dao">
    <select id="getPwByUserNm" resultType="java.lang.String">
        SELECT LOG_PW FROM person WHERE LOG_NM = #{name}
    </select>
</mapper>
```

```java
//testJustSpring.java

package justspring.test;

import justspring.service.Service;
import org.junit.Test;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;

import javax.annotation.Resource;

public class testJustSpring {

    @Test
    public void test() {
        ApplicationContext context = new ClassPathXmlApplicationContext("spring1.xml");
        Service service = (Service) context.getBean("service");
        String name = "管理员0";
        String password = service.getPwByUserNm(name);
        System.out.println(password);
    }
}

```
以上，代码已经完全展示出来。但是前面说的大坑还没有解决，为解决它先看一下正确的文件结构应该这样设置：

![新文件结构](/images/justspring_proStr2.JPG)

请将文件结构调整如上！

请将文件结构调整如上！

请将文件结构调整如上！

重要的事情说三遍，test的包可以不调整，没有影响。并且点击工程根目录，按下F12打开模块设置，将resources目录设置为resources root类型，点击apply。重新编译一次，应该就能够在.targe下看到Dao.xml文件了。详情请看[这里](http://blog.csdn.net/XiWenRen/article/details/49101605)，非常感谢解决方案。

