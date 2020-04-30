---
layout: post
title: 区间动态规划例题
subtitle: An example about dp
keyword: dynamic programming
tag:
    - algorithm
---

**本文是作者原创文章，欢迎转载，请注明出处 from:@[Eric_Lai](http://laihaotao.github.io)**

## 题目

考虑如下问题，一堵有n条条纹的墙壁，需要把每个条纹按照规定的要求刷上颜色。条纹颜色用字符串来表示，每刷一种颜色需要不同颜色的笔，求如何在最少的换笔次数内，将这堵墙刷到规定的颜色。例如，给定颜色“BGRGB”。我们可以把墙壁分成5块条纹，然后依次刷5次。或者，可以先全部刷成B，再把中间三个刷成G，最后把最中间的刷成R（颜色可以覆盖），如此只需要更换3次笔即可完成。

实例输入:

> YBYB  
> YAYBYCY  
> AABBBCCCDABABBBB

对应的输出：

> 3  
> 4  
> 6

## 分析

整个题目，拿到的第一时间很容易想到是一个DP问题。但是，难点在于找状态。曾经想过，可不可以用贪心，每次刷最多的颜色。但是，写出来都被test case推翻了。这类似matrix chain multiplication的问题，状态还算容易找，可令`dp(i, j)`表示从第`i`个元素开始刷到第`j`个元素所需要的最小换笔次数。接下来是最难的部分了，如何找状态转移方程。从矩阵链相乘问题推广到这里，因为`i`, `j`表示的是下标，所以必须满足条件`i < j`，也就是说最后的表（或者说矩阵）当中，只有上三角是有用的数据，知道这个可以用于减少不必要的运算。

分析一下如何决定状态方程：由于这是一个连续的下标问题，很明显我们首先注意到的是最开始的下标和最后的下标，以及它们所对应的元素, 用colors[ ]表示给出的字符串对应的字符数组.

如果`colors[i] = colors[j]`，很显然这是可以一次涂完的（把`i`到`j`涂成同一种颜色，再考虑中间剩下的）。但是，我们不知道是先涂完`i`还是先涂完`j`。所以，应该取它们当中的最小值：

    dp(i ,j) = min(dp(i - 1, j), dp(i, j - 1))

如果`colors[i] != colors[j]`，那就不能一次涂完了，继续应用矩阵链相乘的方法，假设中间有一个位置`k`，先涂它可以获得最少的换笔次数。但是，我们并不知道`k`的位置，需要遍历全部可能位置选取最小的。那么，可以得到如下方程：

    dp(i ,j) = min(dp(i, j), dp(i, k) + dp(k + 1, j))   其中，k >= i && k < j

综合以上的两个方程，即可以获得完整的状态转移方程：

    if colors[i] == colors[j] --> dp(i ,j) = min(dp(i - 1, j), dp(i, j - 1))
    if colors[i] != colors[j] --> dp(i ,j) = min(dp(i, j), dp(i, k) + dp(k + 1, j))

## 伪码

有了状态转移方程，写伪码就不是什么难事了。

```
minChange(string)
    N <-- string.length() + 1
    let colors to be an array with length of N, colors[0] = null
    copy string.toCharArray() to colors, begin from colors[1]
    let dp to be an 2-d array with length of N * N
    initialize the upper triangle of dp array to be infinity
    initialize the main diagonal element of dp array to be 1
    for l begin from 1 to N  // l is the distance from i to j
        for i begin from 1 to N - 1
            j <-- i + l
            if j < colors.length
                if colors[i] = colors[j]
                    dp[i][j] = min(dp[i - 1][j], dp[i][j - 1])
                else
                    for k from i to N - 1
                        dp[i][j] = min(dp[i][j], dp[i][k] + dp[k + 1][j])
    return dp[1][N - 1]
```

## Java实现

```java
public class PaintWall {

    // an array stored the color
    private static char[] colors;
    // 2-d array stored the status, the final answer should be dp[1][dp.length - 1] (right corner)
    // dp(i, j) denote minimize the number of times changing the paintbrush while drawing the
    // segments from i to j
    private static int[][] dp;

    public static int minChange(String str) {

        // the length of the dp array
        final int N = str.length() + 1;
        colors = new char[N];
        System.arraycopy(str.toCharArray(), 0, colors, 1, colors.length - 1);
        dp = new int[N][N];
        // initialize the dp array with infinity, except the position(i, i) with number 1
        init(str);

        // l denote the length between i and j
        for (int l = 1; l < N; l++) {
            // fill the table begin with i = 1
            for (int i = 1; i + 1 < N; i++) {

                // get the number j, because the length of i and j has been defined as l
                int j = l + i;
                // if j less than the length of given the string
                if (j < colors.length) {

                    // if two pointer point at the same kind of color, choose the min of two
                    // situation: position i may be painted when painting j, or position j may be
                    // painted when painting i. So can get:
                    //          dp(i ,j) = min(dp(i + 1 , j), dp(i, j - 1))
                    if (colors[i] == colors[j]) {
                        dp[i][j] = Math.min(dp[i + 1][j], dp[i][j - 1]);
                    }

                    // if two pointer point at the different color, we assume that there is a k
                    // position can be make the number of change paintbrush minimum. Try
                    // all the possibilities of the position k
                    else {
                        for (int k = i; k + 1 < N; k++) {
                            dp[i][j] = Math.min(dp[i][j], dp[i][k] + dp[k + 1][j]);
                        }
                    }
                }
            }
        }
        return dp[1][N - 1];
    }

    private static void init(String str) {
        for (int i = 1; i < dp.length; i++) {
            for (int j = i; j < dp[i].length; j++)
                dp[i][j] = Integer.MAX_VALUE;
        }
        for (int i = 1; i <= str.length(); i++) dp[i][i] = 1;
    }
}
```