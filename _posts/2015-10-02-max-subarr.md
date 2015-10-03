---
layout: post
title: 算法之最大子数组问题
description：introduction of the big sum of the subarray
keyword: sum of subarray algorithm
---
**本文是作者原创文章，欢迎转载，请注明出处 from:@Eric_Lai**

## 什么是最大子数组
在一个序列当中，有正数、负数和零（如果全是非负数，那么最大子数组问题将没有研究的意义）。最大子数组是指，其中连续的某几个数相加之后和最大，那么这几个连续的数称为该数组的最大子数组。

## 怎么求解一个任意数组的最大子数组
## 暴力无脑法
最最最简单的方法，当然就是遍历这个数组找出它的每一个子数组，然后分别求和，再比较这些和的大小。这个方法我称之为暴力无脑法，虽然它的时间复杂度比较大，但是也是一个解决问题的方法。事实上，很多的问题都可以使用暴力来解决。先看看这个方法是如何实现的。

``` C
violent(int* a, int n){
	int length = n;
	int maxSum = 0；
	int sum = 0；
	for(int i = 0; i < n; i++){
		for(int j = i; j < n; j++){
			sum += a[j]
			if(sum > maxSum){
				maxSum = sum;
			}
		}
		sum = 0;
	}
}
```

暴力法固然简单，但是从上面我们可以看到这是两个for循环的嵌套，最里面的循环从j到n，它的时间复杂度应该是（n²）。

## 分治策略
让我们升级一下，摆脱无脑法，用一些上档次的方法来解决这个问题。分治法，在英文里它叫做divide and conquer。先把问题分开，然后再逐个征服。分治法的指导思想是这样的：

- 把一个问题先分解成若干个小问题
- 递归的调用一个方法来解决这些问题
- 把解决完的问题的答案合并形成原先问题的答案

联系我们在归并排序时候接触到分治法时的解决方案，第一步就是把这个数组或者说序列一分为二，在这里我们同样这样操作，记中间的元素为mid，它归入到前半部分里面。分成两部分之后，最大子数组必然出现在以下三个位置当中：

- 前半部分
- 后半部分
- 跨越前半和后半部分（必然包含了mid）

以上三个问题仍然是最大子数组问题。前两个情况下，我们都还是只需要再次调用求最大子数组的函数即可解决（一直递归下去，直到剩下一个数字）。现在看来，问题的核心就在于求解跨越中点部分的最大子数组。先来研究一下伪码的实现过程：


``` C
find_crossing_mid(int* a, int low, int high, int mid){
	leftSum = 负无穷；
	for(int i = mid; i >= low; i--){
		sum += a[i];
		if(sum > leftSum){
			leftSum = sum;
			cross_low = i;
		}
	}
	rightSum = 负无穷；
	sum = 0;
	for(int j = mid + 1; j <= high; j++){
		sum += a[j];
		if =(sum > rightSum){
			rightSum = sum;
			cross_high = j;
		}
	}
	return (cross_low, cross_high, leftSum + rightSum);
}
```
以上这段伪码的思想是，从mid开始分别向左右两边查找，找到两边的最大子数组以后，再把它们加起来。注意这里是从mid开始向两边查找，左边子数组的范围是从[i.....mid]，右边的子数组的范围是从[mid+1.....j]。

有了上面的方法，我们只需要再写一个处理不跨越中点的方法即可。用于处理最大子数组在mid的完全左边或者完全右边。伪码应该可以写成以下的样子：

``` C
find_max_subarray(int* a, int low, int high){
	//检查基本情况
	if(low == high){
		return (low, high, a[low]);
	}else {
		mid = (low + high) / 2;
		(left_low, left_high, leftSum) = find_max_subarray(a, low, mid);
		(right_low, right_high, rightSum) = find_max_subarrayy(a, mid+1; high);
		(cross_low, cross_high, crossSum) = find_max_subarray(a, low, mid, high);
	}
	if(leftSum >= rightSum && leftSum >= crossSum){
		return leftSum;
	}else if(rightSum >= leftSum && rightSum >= crossSum){
		return rightSum;
	}else{
		return crossSum;
	}
}
```

以上是使用分治法来寻找最大子数组的方法。分析一下这个方法，```find_crossing_mid()```所需要的时间复杂度应该是(n)，而后面这个方法```find_max_subarray()```所需要的时间复杂度应该是(lgn)。后者当中调用了前者，所以应该相乘，总得时间复杂度应该是（nlgn）。
### 线性解法
那么来到这里，是不是（nlgn）已经是最优的解法呢，其实不然。这个题目可以在线性的时间内求解出来，看到了之后觉得也就这么回事，但是真的要想出来还是不那么容易的。我们再来分析一下：

- 要求最大子数组问题，那么数组当中必定有正也有负的元素；
- 如果某个子数组是最大子数组，那么这个子数组的所有元素相加必定大于0；

以上的第二条是重点，如果一个子数组相加反而比0小，那么我随便找一个只有一个正元素的子数组都大过它，所以它必定不是最大子数组。这里我们就可以得到一个算法：**将一个数组从头开始累加，如果碰到结果为负数，则前面元素全部舍弃，重新开始累加**。如此，只需要相加一次即可求出最大子数组。伪码表示应该是这个样子的：

``` C
find_max_subarray(int* a){
	maxSum = 0;
	sum = 0;
	begin = 0;
	last = 0;
	for (int i = 0; i < a.length; i++){
		sum += a[i];
		if(sum > maxSum){
			maxSum = sum;
			last = i;
		}
		if(sum < 0){
			sum = 0;
			begin = i + 1;
		}
	}
	return (begin, last, maxSum);
}
```
以上的方法，很显然只需遍历一次整个数组就可以完成查找最大子数组的操作。它的时间复杂度是线性的。应该是对于这个问题，最快的解法了。

## 结语
从前一段时间开始研究算法，一直都感觉算法好难，好枯燥。作为一个不是计算机专业的计算机科学爱好者，我也深深的知道算法的重要，更重要的是，从其他同学面试回来得到的消息是，什么工作都要面算法。好吧，我承认，这才是我打定心水学算法的最终目的。

这段时间下来，看着算法界的圣经“算法导论”，被”折磨“的不成样子，不过今天接触到了这个之后，发现其实算法也是很有魅力的。一个问题居然可以有这三种解法，而且一个比一个巧妙。刚刚拿到这个问题，我想了大半天，脑袋里就只有着暴力解法。相信，能够坚持下去的话，算法也是可以学好的。
