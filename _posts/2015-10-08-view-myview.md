---
layout: post
title: 编写一个属于自己的View
subtitle: Write a view by yourself
keyword: view
---
**本文是作者原创文章，欢迎转载，请注明出处 from:@Eric_Lai**

## 编写自定义view
当我们在开发Android的界面的时候，难免有时会不太满意系统提供给我们的控件，从而需要自己定义一些控件来试用，或者将若干个系统控件封装成一个自定义的控件。这个时候，我们就需要写一个类继承自系统的View。通过IDE，我们可以知道继承自View的类有四个构造器供我们选择，一般情况下我们需要覆盖其中的两个，`MyView(Context context)`和`MyView(Context context, AttributeSet attrs)`。其中，前者供代码使用，后者供布局文件使用（这个在后文会有提及）。除了这两个构造器以外，还有一个方法我们在需要绘制图形的时候重写的，叫做`onDraw（Canvas canvas）`。利用这个方法的canvas，我们可以绘制各个类型的东西，包括有文字、圆形、矩形、圆角矩形和图片等。下面给出代码演示：

首先，我们需要在xml文件里面添加我们的自定义控件：

```xml
<com.eric_lai.myview.MyView
	android:layout_width="match_parent"
	android:layout_height="match_parent" />
```
接着是java的代码：

```java
public class MyView extends View {
    
    private final Bitmap bitmap;
    
    //供java代码使用的构造器
    public MyView(Context context) {
        super(context);
        bitmap = BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher);
    }
    //供布局xml使用的构造器
    public MyView(Context context, AttributeSet attrs) {
        super(context, attrs);
        bitmap = BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher);
    }
    
    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        //实例化一个paint,用来控制样式(包括字体的大小,颜色,形状的样式等)
        Paint paint = new Paint();
        paint.setTextSize(30);
        //绘制文字，以下数字都是坐标，具体值参见API文档
        canvas.drawText("hello word my view", 0, 30, paint);
        //绘制矩形
        canvas.drawRect(0, 60, 180, 120, paint);
        //绘制圆形
        canvas.drawCircle(80, 240, 80, paint);
        //绘制图片(需要从图片工厂里面得到一个图片)
        canvas.drawBitmap(bitmap,0,350,paint);
    }
}
```
MainActivity上的代码很简单，只要在`onCreate()`方法里面执行两行代码就可以了：

```java
super.onCreate(savedInstanceState);
setContentView(R.layout.activity_main);
//下面这个也可以,使用了MyView只有一个上下文参数的构造器
//setContentView(New MyView(this));
```
下面是一张模拟器上运行上述代码的图片：

<img src="/images/view_v1.png"/>

## 设计逻辑线程
以上，我们为自定义的view绘制了一些东西，然而它们现在都是静态的。为了有更好的用户体验，我们要想办法让这些元素动起来。怎么能够让它们动起来呢？我们都知道为什么电影能够给我们动得感觉是将一帧一帧的静态图用比较快得速度拨出来。在Android上应该也是这样的，用不断的重新绘制来给我们一种“动”的效果。

这里我先说一下要实现的效果：

1. 让一行文字从屏幕的一边移动到另一边完全出去了之后，再从原来的地方一个一个进入屏幕；
2. 让一个圆通过扫描的方式画出来；

下面是实现的代码：

```java
ublic class logicView extends View {

    private float mx = 0;
    private Paint paint = new Paint();
    private MyThread thread;
    private float sweepAngle = 0;
    private RectF rectF = new RectF(0, 80, 160, 160);

    public logicView(Context context) {
        super(context);
    }

    public logicView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        paint.setTextSize(40);
        canvas.drawText("你好eric", mx, 40, paint);
        canvas.drawArc(rectF, 0, sweepAngle, true, paint);
        if(thread == null) {
            thread = new MyThread();
            thread.start();
        }
    }

    class MyThread extends Thread {
        @Override
        public void run() {
            while (true) {
                mx += 3;
                if (mx > getWidth()) {
                    mx = 0 - paint.measureText("你好eric");
                }
                sweepAngle ++;
                if (sweepAngle > 360) {
                    sweepAngle = 0;
                }
                postInvalidate();
                try {
                    Thread.sleep(30);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
    }

}
```

## 提取和封装自定义view
上面的代码，虽然实现了我们绘制的元素动起来的目的。但是当中，逻辑代码比较混乱，怎么样可以让我们只专注于view的设计，将”动起来“这些逻辑封装起来呢？接下来，我们来关注一下这里。首先，我打算写一个baseview的抽象类来继承自view类。将转移我们注意力的代码全部扔到这里来实现。然后，其他的自定义view继承自这个view就可以了。抽象类的实现代码：

```java
public abstract class baseView extends View {

    //逻辑线程
    private MyThread thread;
    //停止线程的标志
    private boolean isRuning = true;

    //实现绘制的抽象方法, 在需要的子类当中复写
    protected abstract void drawSub(Canvas canvas);
    //实现逻辑的抽象方法, 在需要的子类当中复写
    protected abstract void logic();

    //两个构造器
    public baseView(Context context) {
        super(context);
    }
    public baseView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    //启动线程, 调用绘制方法
    @Override
    protected void onDraw(Canvas canvas) {
        if (thread == null) {
            thread = new MyThread();
            thread.start();
        } else {
            drawSub(canvas);
        }
    }

    //view退出是回调的方法
    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        isRuning = false;
    }

    //内部类实现一个线程
    class MyThread extends Thread {
        @Override
        public void run() {
            //判断view是否在当前使用
            while (isRuning) {
                //调用逻辑抽象方法
                logic();
                //重新绘制view
                postInvalidate();
                try {
                    //线程休眠30ms
                    Thread.sleep(30);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```
下面是实现这个抽象类的类，效果和第二个标题的一样。这里只是演示了，怎么封装。封装之后，代码更加清晰，增加了可读性，下面没有给出注释，相信也可以看得明白，主要就是实现了两个抽象方法分别是绘制和逻辑。

```java
public class logicView extends baseView {

    private float mx = 0;
    private android.graphics.Paint paint = new Paint();
    private float sweepAngle = 0;
    private RectF rectF = new RectF(0, 80, 160, 160);

    public logicView(Context context) {
        super(context);
    }
    public logicView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    @Override
    protected void drawSub(Canvas canvas) {
        paint.setTextSize(40);
        canvas.drawText("你好eric", mx, 40, paint);
        canvas.drawArc(rectF, 0, sweepAngle, true, paint);
    }

    @Override
    protected void logic() {
        mx += 3;
        if (mx > getWidth()) {
            mx = 0 - paint.measureText("你好eric");
        }
        sweepAngle ++;
        if (sweepAngle > 360) {
            sweepAngle = 0;
        }
    }
}
```
有了上面的储备，相信大家都可以写出自己所需要的view了。后面有时间的话，需要研究一下view的系统底层是怎么实现的。