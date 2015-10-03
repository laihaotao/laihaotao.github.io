---
layout: post
title: Android Activity的四种启动模式
subtitle: Introduction about the launch mode of the android activity
keyword: Android activity launch_mode
---
**本文是作者原创文章，欢迎转载，请注明出处 from:@Eric_Lai**

## 写在前面
最近在一个blog上看到了一篇关于Android的Activity的启动模式分析的文章，觉得写得甚好。看完之后，我自己总结了一下得出这篇文章，我看的blog名字叫做``技术小黑屋``，点击[这里](http://droidyue.com/blog/2015/08/16/dive-into-android-activity-launchmode/)可以查看原文。本文引用了原文的一些图片，如果不欢迎引用请和我联系。

## 几个概念
下文当中会运动到一些概念，这里先做简要的介绍：

- ``Task``，这里指与用户交互的Activity实例的集合
- Task中的Activity实例以栈的形式存放，这个栈叫做Activity的退回栈
- ``栈(stack)``，一种数据类型，遵循后进先出的原则

## 什么是启动模式
在Android当中，每个Activity的实例被创建的时候都可以选择四种不同的创建模式，分别是：``standard``、``singleTop``、``singleTask``、``singleInstance``，这些创建Activity的方式，我们就称为Activity的启动模式。当我们没有添加其他的要求是系统默认的启动方式是standard。想要使用不同的启动方式，我们只需要在Mainfest当中添加如下代码：

```xml
<activity
    android:name=".SingleTaskActivity"
    android:label="singleTask launchMode"
    android:launchMode="singleTask(选择一种你希望的方式)">
</activity>
```

下面我们就开始详细研究一下这四种模式

## standard模式
在这个模式下，每一次有Intent请求过来要求启动一个Activity的时候都会生成一个新的实例。

**在Android 5.0以前**的版本当中，这种新生成的Activity会放入发送Intent的Task的栈顶，不论它们是否同属于一个应用程序。下面两图分别表示了同应用程序之间和不同应用程序之间启动的示意图。

![同程序的Standard启动](http://7jpolu.com1.z0.glb.clouddn.com/pre_lollipop_standard_activity_in_same_app.jpg)

![不同程序间的Standard启动](http://7jpolu.com1.z0.glb.clouddn.com/pre_lollipop_standard_activity_across_app.jpg)

**在Android 5.0以后**的版本当中，不同引用程序之间这种新生成的Activity会被放入一个新的Task当中，如下图所示。相同应用程序之间的方法没有变化。

![](http://7jpolu.com1.z0.glb.clouddn.com/lollipop_across_app_new_task.jpg)

standard模式的使用场景：适合于撰写邮件Activity或者社交网络消息发布Activity。如果你想为每一个intent创建一个Activity处理，那么就是用standard这种模式。

## singleTop模式
singleTop和standard其实很像，它也可以创建多个Activity实例。但是有一点不同，如下图所示，**如果调用的目标Activity已经位于调用者的Task的栈顶，则不创建新实例，而是使用当前的这个Activity实例，并调用这个实例的onNewIntent方法。**

![](http://7jpolu.com1.z0.glb.clouddn.com/singletop.jpg)

singleTop模式的使用场景：搜索功能的应用，每次都搜索的是时候都是使用一个Activity的实例，避免浪费资源和内存。

## singleTask模式
在这个模式下启动的Activity在系统当中只会存在一个实例。如果这个实例已经存在，Intent会通过onNewItent传递到Activity当中。否则就会新建一个实例。

在同一个应用程序内，如果系统不存在singleTask的Activity实例，那么就会创建一个新的实例，并把它放在调用者的Task的栈顶，如下图所示。

![](http://7jpolu.com1.z0.glb.clouddn.com/singletask_inapp_create_new_instance.jpg)

如果系统内已经存在这个实例，那么在这个实例上面的其他实例全部出栈（回调相关的生命周期函数来销毁），这样使得singleTask Activity位于栈顶，展示在用户的操作下。与此同时，Intent会通过onNewIntent传递到这个Activity当中，如下图所示。

![](http://7jpolu.com1.z0.glb.clouddn.com/singletask_sameapp_instance_exists.jpg)

在跨应用(即不同的引用程序间)Intent传递时，如果系统中不存在singleTask Activity的实例，那么将创建一个新的Task，然后创建SingleTask Activity的实例，将其放入新的Task中。Task变化如下所示。

![](http://7jpolu.com1.z0.glb.clouddn.com/singletask_across_app_no_instance.jpg)

如果singleTask Activity所在的应用进程存在，但是singleTask Activity实例不存在，那么从别的应用启动这个Activity，新的Activity实例会被创建，并放入到调用者所在的Task中，并位于栈顶位置。

![](http://7jpolu.com1.z0.glb.clouddn.com/singletask_acrossapp_application_exists_activity_nonexists.jpg)

还有一种更加复杂的情况，如果singleTask Activity所在的进程存在并且它的实例也存在。在这种情况下，这个实例所在的Task会移动到调用者所在的Task上方，singleTask Activity上得其他实例全部出栈。也就是说这种情况下，如果按下back键，会返回到singleTask Activity所在的Task的其他Activity实例。直到这个栈空了，才会回到调用者的Task，如下图所示。

![](http://7jpolu.com1.z0.glb.clouddn.com/singletask_acrossapp_instance_exists_and_back.jpg)

singleTask模式的使用场景：该模式的使用场景多类似于邮件客户端的收件箱或者社交应用的时间线Activity。上述两种场景需要对应的Activity只保持一个实例即可，但是也要谨慎使用这种模式，因为它可以在用户未感知的情况下销毁掉其他Activity。

## singleInstance模式
这个模式跟singleTask差不多，它们在系统里面都只有一个实例。唯一不同的就是存放singleInstance的Task只能存放一个该模式的Activity实例。也就是说，如果从singleInstance模式的Activity当中启动另一个Activity，系统会创建一个新的Task来存在实例，同理，一个singleInstance的Activity被启动的话，它不会被放在调用者的Task当中，而是放在一个新创建的Task当中。如下图所示。

![](http://7jpolu.com1.z0.glb.clouddn.com/singleInstance_new_instance.jpg)

最后，这种模式的使用情况比较罕见，在Launcher中可能使用。或者你确定你需要使Activity只有一个实例。建议谨慎使用。

