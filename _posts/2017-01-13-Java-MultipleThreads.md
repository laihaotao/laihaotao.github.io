---
layout: post
title: Java多线程
subtitle: Introduction to Java Multiple Thread
keyword: Java, Multiple Thread
tag:
  - Java
---

在并行编程当中，有两个基础的概念：进程(process)和线程(thread)。在Java当中，并行编程一般和线程有关，但是进程也是很重要的概念。

## 线程和进程

### 概述

进程，拥有自己独立的运行环境并且有独立的内存空间。进程经常被同义地视为一个程序或者应用，尽管有时候一个应用并不止一个进程。

线程，有时候又被称为“轻量级”的进程，因为创建一个线程比创建一个进程需要的资源少。一个进程里面的所有子线程共享进程资源，包括内存以及文件。这虽然更加有效率，但是也同时带来了一些问题。例如，线程的通信以及资源的同步。

### 线程的生命周期

在Java当中，任意一个线程必定存在于以下四个状态(state)当中的某一个，它们是:

- new
- runnable
- non-runnable (blocked)
- terminated (dead)

![](http://cdn.journaldev.com/wp-content/uploads/2012/12/Thread-Lifecycle-States.png)

ps：图片来自：http://www.journaldev.com/1044/thread-life-cycle-in-java-thread-states-in-java

## Java的线程对象(Thread Object)

### 创建线程

在Java当中，有两种方法可以创建一个新的线程对象：

- 实现(implement)`Runnable`接口(interface)；
- 创建子类继承自`Thread`类;

```java
public class HelloRunnable implement Runnable {
  public void run() {
    System.out.println("Hello from a thread");
  }
  public static void main(String args[]) {
    Thread thread = new Thread(new HelloRunnable());
    thread.start();
  }
}
```

```java
public class HelloThread extends Thread {
  public void run() {
    System.out.println("Hello from a thread!");
  }
  public static void main(String args[]) {
    (new HelloThread()).start();
  }
}
```

注意：上述两种方法，都需要通过调用`Thread.start()`来启动线程。需要使用哪种情况，需要根据实际情况。第一种更加普遍，如果需要将某个代码更改为多线程或者某类已经有超类了的情况下，第一种方法不会破坏继承关系。

### 暂停线程

使用静态方法`Thread.sleep()`方法，可以使当前线程暂停(或者叫挂起，suspend)。当前线程被挂起，CPU会空闲下来，把资源给其他需要执行的线程。

### Thread.join()方法

`join()`方法允许一个线程等待另一个线程执行完毕。若`t`是一个线程对象，如果在主线程当中执行以下的代码，那么主线程会在`t线程`执行完毕之后执行。

```java
class HelloThread {
  
  public static void main(String args[]) {
    Thread thread = new Thread(new HelloRunnable());
    thread.start();
    thread.join();
    System.out.println("It should println after thread finshed");
  }
}

public class HelloRunnable implement Runnable {
  public void run() {
    Thread.sleep(3000);
    System.out.println("Hello from a thread");
  }
}
```

上述代码，如果没有`第6行`，执行的结果可能是：

>It should println after thread finshed
>
>Hello from a thread

但是如果加上了`第6行`，执行的结果必定是：

> Hello from a thread
>
> It should println after thread finshed

## 同步(Synchronization)

### 多线程带来的问题

有了多线程，可以大大的提高程序效率的同时也带来了一些问题：

- 线程之间的干涉(thread interference)
- 破坏了内存一致性(memory consistency)

先来通过例子看看线程干涉问题：

```java
class Counter {
    private int c = 0;
    public void increment() {
        c++;
    }
    public void decrement() {
        c--;
    }
    public int value() {
        return c;
    }
}
/***********************************************/
// example 1
class Test {
  public static void main(String args[]) {
     Counter counter = new Counter();
     counter.increment();
     counter.decrement(); 
     System.out.println("the value of c: " + counter.c);
  }
}
/***********************************************/
// example 2
class Test {
  public static void main(String args[]) {
    final Counter counter = new Counter();
    Thread thread1 = new Thread(new Runnable() {
      public void run() {
        try {
          Thread.sleep(500);
        } catch (InterruptedException e) {
          e.printStackTrace();
        }
          counter.increment();
        }
    });
    Thread thread2 = new Thread(new Runnable() {
      public void run() {
        try {
          Thread.sleep(500);
        } catch (InterruptedException e) {
          e.printStackTrace();
        }
          counter.decrement();
        }
    });
    thread2.start();
    thread1.start();
    try {
      thread1.join();
      thread2.join();
    } catch (InterruptedException e) {
      e.printStackTrace();
    }
      System.out.println("the value of c: " + counter.value());
    }
}
/***********************************************/
```

在`increment()`方法以及`decrement()`方法当中都只有一条语句(statement)，但是JVM执行这一条语句要通过三步来完成：

1. 检索`c`变量的值；
2. 给`c`变量的值增加1；
3. 将新的值赋给`c`变量；

若如上述代码片段`example 1`所示，执行完毕之后变量`c`的结果当然还是零，这个没有任何的疑问。

但是若如代码片段`example 2`所示，执行之后变量`c`的值就会是不确定的了。因为，在不同的线程中不能确定上述三个步骤执行的顺序。可能顺序是这样的：

1. thread1，检索变量c，c = 0；
2. thread2，检索变量c，c = 0；
3. thread1，增加检索出来的值，c = 1；
4. thread2，减少检索出来的值，c = -1；
5. thread1，重新赋值变量c，c = 1；
6. thread2，重新赋值变量c，c = -1；

此时，最后变量`c`的值就会是`-1`，与我们期待的值`0`，并不相符。

再看看破坏内存一致性的例子：

在此之前需要连接一个概念，先行发生关系(happens-before relationship)：

> 先行发生是Java内存模型中定义的两项操作之间的偏序关系。如果说操作A先行发生于操作B，其实就是说在发生操作B之前，操作A产生的影响被操作B察觉。

下面来考虑如下代码：

```java
int counter = 0;
counter++;
System.out.println("the value of counter:" + counter);
```

首先考虑单线程执行上述代码片段的情况，如果在单线程的状态下，上述代码输出的`counter`的值肯定是`1`无疑。

如果有两个线程A和B共享这段代码，结果有可能会输出`0`，因为线程A执行了`第2行`(假设)，但是线程B在执行`第3行`(假设)的时候并不知道`counter`的值已经被改变了。即，线程A做的改变对线程B并不是可见的。除非，你在这两个语句之间建立一个“先行发生关系”。

在Java当中，有一些已知的先行发生关系，如下所示：

![Java当中已知的先行发生关系](http://ww2.sinaimg.cn/large/6a831d33jw1fbotrtxdz8j21ck0hodr2.jpg)

ps：上图来自于：http://www.cnblogs.com/plxx/p/4376205.html

想要解决这两个问题，需要使用的工具就是同步(synchronization)。

### 同步方法

先要解决上面的问题可以将`Counter`类修改如下：

```java
public class Counter {
    private int c = 0;
    public synchronized void increment() {
        c++;
    }
    public synchronized void decrement() {
        c--;
    }
    public synchronized int value() {
        return c;
    }
}
```

对比可知，新的代码在原来代码的基础上，每个方法的访问修饰符之后添加了一个关键字：`synchronized`。添加之后有以下两点影响：

- 当一个线程A在执行一个对象obj的某一个同步方法method的时候，其他调用`obj.method()`方法的线程全部挂起，直到线程A执行完毕；
- 当一个同步方法存在的时候，它会自动为子调用序列创建一个先行发生关系，保证任何一个改变对各个子线程都是可见的；

注意：构造方法不能使用`synchronized`关键词修饰，这会是一个语法错误(syntax error)。另外，声明为`final`的字段(field)可以不需要被`synchronized`修饰。

### 同步代码块

在解释同步代码块之前，我们需要了解Java当中锁的概念。在Java当中，所有对象都自动含有单一的锁。JVM负责跟踪对象被上锁的次数。当某一个线程需要互斥地、连贯地访问对象的field时，可以要求获得(acquire)该对象的锁。当操作完成之后，释放(release)这个锁即可。当一个对象的锁被某个线程获得时，其他试图获得这个锁的线程将被挂起(或者叫做堵塞)。

同步代码块的意思是可以用`synchronized`关键词修饰一个代码块而不是一整个方法，因为同步的代价是比较高的，为了保证程序的效率，应该尽量少的同步代码。下面的两个代码是等价的：

```java
class Test {
  public synchronized void methodA() {
    // do something here ...
  }
}

class Test {
  public void methodA() {
    synchronized(this) {
      // do something here ...
    }
  }
}
```

```java
// another usage of synchronized block
public class MsLunch {
    private long c1 = 0;
    private long c2 = 0;
    private Object lock1 = new Object();
    private Object lock2 = new Object();
    public void inc1() {
        synchronized(lock1) {
            c1++;
        }
    }
    public void inc2() {
        synchronized(lock2) {
            c2++;
        }
    }
}
```

在同步代码块当中，关键词`synchronized`后面的括号里应该填一个对象。值得注意的是：**同步代码块，锁住的是对象而不是代码**。也就是说，当不是同一个对象访问同步方法或者同步代码块的话，代码是可以并发执行的。考虑如下代码：

```java
class Sync {
	public void test() {
      synchronized(this) {
		System.out.println("test begin ...");
		try {
			Thread.sleep(1000);
		} catch (InterruptedException e) {
			e.printStackTrace();
		}
		System.out.println("test finish ...");
      }
    }
}
class MyThread extends Thread {
	public void run() {
		Sync sync = new Sync();
		sync.test();
	}
}
public class Main {
	public static void main(String[] args) {
		for (int i = 0; i < 3; i++) {
			Thread thread = new MyThread();
			thread.start();
		}
	}
}
```

以上代码来自：http://blog.csdn.net/xiao__gui/article/details/8188833

注意`第14行`，这里创建了三个不同的对象，所以同步方法`test()`并不会达到预期的效果。其中一种可能的输出如下：

> test begin ...
>
> test begin ...
>
> test begin ...
>
> test finished ...
>
> test finished ...
>
> test finished ...

如果希望输出的结果是：

> test begin ...
>
> test finish ...
>
> // 交替出现多两次（共6条记录）

可以将上述代码的`第3行`更改如下：

```java
synchronized (Sync.class) { 
```

### 原子访问(Atomic Access)

在编程当中，一个原子操作(atomic action)是指实际上执行的一条操作。一个院子操作不能在中间停止，它要么发生，要么不发生。上面我们已经看过一个例子了，如下的代码：

```java
c++；
```

这一行代码，实际上应该包含着三个原子操作。常见的原子操作有：

- 引用类型变量的读取或者写入操作，大部分基础类型变量的读取和写入操作(`long`以及`double`类型的读写不是)；
- 所有被声明为`volatile`变量的读写操作(包括`long`类型以及`double`类型变量)；

如果学过ECE可以知道，在c语言当中，被`volati`修饰的变量，每次取值的时候都会从寄存器当中来取，不会从缓存当中来取。所以，这种变量的值肯定是保持着最新的状态的。这种做法，可以减少memory consistency errors出现的次数。

使用原子变量的程序会比使用同步的程序更加高效，但是需要小心编程，避免出现memory consistency errors。

## 活跃性(Liveness)

### 死锁

> 死锁是指两个或者多线线程互相堵塞，因为一直在等待对方结束，所以程序一直无法停止，和死循环类似。

死锁问题最早在1965年由Dijkstra(就是提出“Dijkstra”算法【解决了如何在非负权重的图中找出最短路径的问题】的大牛)在研究银行家问题算法时提出。理论上来说，当一个线程永远地持有一个锁，并且其他线程都尝试去获取这个锁时，这些【其他线程】将会被永远堵塞。死锁最简单的例子应该是这样：

> 线程A持有锁L并且想获得锁M，线程B持有锁M并且想获得锁L

如果出现了上述的情况，线程A和B将永远地等待下去。

我们来看一个具体的例子：如果小明和小红都是受到“良好”礼貌教育的人，他们所受的严格教育规定，当有人向你鞠躬时，你必须等别人向你鞠躬回礼才可起身。但是，这个规则忽略了一个事实，就是当他们同时向对方鞠躬的话，就要一直保持鞠躬的姿势不能起身了。用下面的代码可以描述：(代码来自：http://docs.oracle.com/javase/tutorial/essential/concurrency/deadlock.html)：

```java
public class Deadlock {

    private static class Friend {
        private final String name;
        Friend(String name) {
            this.name = name;
        }
        String getName() {
            return this.name;
        }
        synchronized void bow(Friend bower) {
            System.out.format("%s: %s" + "  has bowed to me!%n", this.name, bower.getName());
            bower.bowBack(this); // attention !!! this, point to bower now
        }
        synchronized void bowBack(Friend bower) {
            System.out.format("%s: %s" + " has bowed back to me!%n", this.name, bower.getName());
        }
    }
    public static void main(String[] args) {
        final Friend xiaoming = new Friend("xiaoming");
        final Friend xiaohong = new Friend("xiaohong");
        Thread thread1 = new Thread(new Runnable() {
            public void run() {
                xiaoming.bow(xiaohong);
            }
        });
        Thread thread2 = new Thread(new Runnable() {
            public void run() {
                xiaohong.bow(xiaoming);
            }
        });
        thread1.start();
        thread2.start();
    }
}
```

理解上面代码，最重要的注意`第13行`处，`this`指向的对象即可。上述代码的执行如下：

1. 执行`bow()`方法，`thread1`和`thread2`分别获得小明、小红对象的锁；
2. `thread1`试图获得小红对象的锁，`thread2`试图获得小明对象的锁；
3. 由于没有获得相应的锁，两个线程皆被堵塞；

两个线程将一直被挂起，形成了死锁。如果打印上述程序运行栈可以得到下面的结果：

```shell
jsatck pid(pid指上述程序的线程号)
```

![打印出来的jstack](http://ww3.sinaimg.cn/large/6a831d33jw1fbpyguto0dj20im094mzu.jpg)

ps：还有两个概念Starvation和Livelock，不过不是很常见的问题，想了解可以看[这里](http://docs.oracle.com/javase/tutorial/essential/concurrency/starvelive.html)。

