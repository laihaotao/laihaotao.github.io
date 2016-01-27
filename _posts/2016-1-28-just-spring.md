---
layout: post
title: 我理解下的spring mvc
subtitle: A demo about spring mvc
keyword: spring mvc
---
**本文是作者原创文章，欢迎转载，请注明出处 from:@[Eric_Lai](http://laihaotao.github.io)**

这几天一直都在做spring+mybaits的整合项目，但是其中遇到很多问题。所以现在开始重新学习一下spring，重最简单的开始，下面演示一个demo。

# 工程目录
本次demo的工程目录如下：
![工程目录图](/images/justspring_proStru.JPG)

注解：其中涂了红色的请忽略，是做其他作用的。包名为：justspring，下面有两个包分别是dao和service。dao用于模拟以后的数据库操作，service，顾名思义是服务层。
这两个包当中各有两个文件，一个是接口（interface）一个是接口的实现（interfaceImpl）。

# 详细代码
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