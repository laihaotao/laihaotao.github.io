---
layout: post
title: 入门级全排列算法
subtitle: Introduction of permutation
keyword: permutation
tag:
   - algorithm
---
**本文是作者原创文章，欢迎转载，请注明出处 from:@[Eric_Lai](http://laihaotao.github.io)**



## 背景引入
在很多的时候，我们在程序当中需要对一些字符，整形或者其他变量做一些排列的操作。下面我们看一道题目：
> 输入一个字符串,按字典序打印出该字符串中字符的所有排列。例如输入字
> 符串abc,则打印出由字符a,b,c所能排列出来的所有字符串
> abc,acb,bac,bca,cab和cba。

另外还有著名的`八皇后问题`也涉及到全排列的问题，下面也给出这个问题，后面给出一个解法：
>八皇后问题是一个经典的问题，在一个8*8的棋盘上放置8个皇后，每行一个
>并使其不能互相攻击（同一行、同一列、同一斜线上的皇后都会自动攻击）

## 问题分析
首先，我们先关注第一个问题。这个问题很直接，就是求输入字符串的全排列。对于三个字符，它的全排列有多少种，我们运用排列组合的方法都可以知道是一共有3!=3×2×1=6种。但是，怎么让计算机知道呢？下面给出一个思路：

1. 首先，将待排列的字符串分成==两拨==来看，分别是==第一个字符==和==剩下的所有字符==；
2. 然后，将剩下的所有字符按照上面1.的方法再次分成两拨；
3. 最后，将“第一个字符”==分别==和后面的每一个字符调换位置，得到一组排列；

通过这个分析的第1和第2条，我们不难看出应该使用递归来进行分拨的操作。而且，每一次分完之后，就应该要对后面的字符串进行排序。

## 实现分析
具体在实现的时候，我们用一个for循环的循环变量来指示准备当开头的元素请参考下面的循环变量i，它应该要遍历一次字符数组的所有元素。

每遍历一个元素就要完成以这个元素开头，剩下的所有元素的全排列。在执行的过程当中我们可以用一个指针指向当前操作的字符，请看下面的begin。每当begin到了最后一个位置表明完成了一次排列，我们打印出当前的数组即可获得一次排列。

***另外注意，获得了以某一个元素开头的剩下的元素的全排列之后，要将数组还原成原来的样子，以便进行第二次的for循环***。

## 实现代码
有了上面的分析，我们可以写出下面的代码（使用java来实现）：

```java
package com.eric_lai.permutation;

/**
 * Created by ERIC_LAI on 15/10/23.
 */
public class Permutation {

	 //直接传入两个字符数组来测试
	 //在main函数当中创建一个类的实例，调用下面的方法即可
    public void init() {
        char[] ch = {'a','b','c'};
        char[] ch1 = {'a','b','c','d'};
        permutation(ch);
        permutation(ch1);
    }

    private void permutation(char[] ch) {
        if (ch == null || ch.length < 0) {
            return;
        }
        permutation(ch,0);
    }

    /**
     * 排列操作
     * @param ch 待排列的字符数组
     * @param begin 当前操作的字符
     */
    private void permutation(char[] ch, int begin) {
        //如果当前操作的是待排列字符的最后一个,则打印出来
        if (begin == ch.length-1) {
            System.out.print(new String(ch));
            System.out.println();
        } else {
            char tmp;
            for (int i = begin; i < ch.length; i++) {
                //交换
                //第一个数,依次和后面的数交换位置
                tmp = ch[i];
                ch[i] = ch[begin];
                ch[begin] = tmp;
                //递归,操作字符往后移动一位
                permutation(ch,begin+1);
                //将数组排回原来的样子,保证第一个数始终不变
                tmp = ch[i];
                ch[i] = ch[begin];
                ch[begin] = tmp;
            }
        }
    }
}
```

## 八皇后问题分析
这个问题最最最原始的方法应该是回溯法。什么是回溯法呢，回溯算法也叫试探法，它是一种系统地搜索问题的解的方法。回溯算法的基本思想是：从一条路往前走，能进则进，不能进则退回来，换一条路再试。 在现实中，有很多问题往往需要我们把其所有可能穷举出来，然后从中找出满足某种要求的可能或最优的情况，从而得到整个问题的解。回溯算法就是解决这种问题的“通用算法”，有“万能算法”之称。

应用回溯法，我们需要用一个2阶的数组描述棋盘，然后对每一个位置分别检测行是否冲突，列是否冲突，对角线是否冲突。如果冲突，则试下一个位置，一直到试完全部的情况。以上看起来，比较复杂，我们可以对它作适当的优化：

1. 行不能冲突，那么一行就只放一个皇后；
2. 列不能冲突，那么一列就只放一个皇后；
3. 找出棋盘内满足上面两个条件的所有情况，检查对角线是否存在冲突，剔除冲突的情况，剩下的就是解；

## 解决方案
这里，我们用一个一维的数组来存整个棋盘的情况。首先定义一个长度为8的数组，其中的第i项表示：第i行皇后的列号。分别用0~7去初始化这个数组的每一项。然后求这个数组元素的全排列，因为数组当中每一个元素的下标和值都不一样而是0~7任意一个数，可以理解成行和列都没有冲突，即所求的全排列就是满足上述1和2条件的所有情况。

最后一步就是检查对角线冲突，通过观察可以知道，对角线上的元素都满足一个特点：| i - j | = | a[ i ] - a[ j ] |，即对角线上两元素的下标之差的绝对值等于这两下标对应值之差的绝对值。

## 编码实现
从以上的方案可以看出，全排列可以使用上面讲述的permutation方法来实现，而检查绝对值可以用一个两层嵌套的for循环来实现，下面给出详细的java实现代码：

```java
//主函数代码
public class Main {
    public static void main(String[] args) {
        EightQueen eightQueen = new EightQueen();
        eightQueen.init();
    }
 }

```


```java
//实现一个长度为8的一维数组，用0~7分别初始化每一个元素
public class EightQueen {
    public void init() {
        char[] ColumnIndex = {'0','1','2','3','4','5','6','7'};
        Permutation p = new Permutation();
        p.permutation(ColumnIndex);
        System.out.print("0~7的全排列共有:"+" ");
        System.out.println(Permutation.all);
        System.out.print("对这个问题的解法共有:"+" ");
        System.out.println(Permutation.count);
    }
}
```

```java
public class Permutation {

    public static int count = 0;
    private static boolean flag_fail = false;
    public static int all = 0;

    public void permutation(char[] ch) {
        if (ch == null || ch.length < 0) {
            return;
        }
        permutation(ch,0);
    }

    /**
     * 排列操作
     * @param ch 待排列的字符数组
     * @param begin 当前操作的字符
     */
    private void permutation(char[] ch, int begin) {
        boolean flag = true;
        //如果当前操作的是待排列字符的最后一个,则打印出来
        if (begin == ch.length-1) {
            all++;
            for (int k = 0; k < ch.length; k++) {
                for (int h = k + 1; h < ch.length; h++) {
                    if (k - h == ch[k] - ch[h] || h - k == ch[k] - ch[h]){
                        flag_fail = true;
                        break;
                    }
                }
                if (flag_fail) {
                    flag_fail = false;
                    flag = false;
                    break;
                }
            }
            if (flag) count++;
        } else {
            char tmp;
            for (int i = begin; i < ch.length; i++) {
                //交换
                //第一个数,依次和后面的数交换位置
                tmp = ch[i];
                ch[i] = ch[begin];
                ch[begin] = tmp;
                //递归,操作字符往后移动一位
                permutation(ch,begin+1);
                //将数组排回原来的样子,保证第一个数始终不变
                tmp = ch[i];
                ch[i] = ch[begin];
                ch[begin] = tmp;
            }
        }
    }
}
```

## 结果
执行完上面的代码得到的结果如下：
>0~7的全排列共有: 40320
>
>对这个问题的解法共有: 92