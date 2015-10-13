---
layout: post
title: 自上而下的打印二叉树
subtitle: Print the BinTree from top to bottom
keyword: BinTree
---

**本文是作者原创文章，欢迎转载，请注明出处 from:@Eric_Lai**

## 写在前面
最近一直在刷数据结构和算法的内容，今天在《剑指offer》当中看到一个关于广度遍历二叉树的题目，就做了一下下，记录一下内容以备回顾，==实际的编程语言采用的是Java==。首先，把题目贴出来：

>题目描述：
从上往下打印出二叉树的每个节点，同层节点从左至右打印。
>
输入：
输入可能包含多个测试样例，输入以EOF结束。
对于每个测试案例，输入的第一行一个整数n(1<=n<=1000, ：n代表将要输入的二叉树元素的个数（节点从1开始编号）。接下来一行有n个数字,代表第i个二叉树节点的元素的值。
>
接下来有n行，每行有一个字母Ci。
>
- Ci=’d’表示第i个节点有两子孩子，紧接着是左孩子编号和右孩子编号。
- Ci=’l’表示第i个节点有一个左孩子，紧接着是左孩子的编号。
- Ci=’r’表示第i个节点有一个右孩子，紧接着是右孩子的编号。
- Ci=’z’表示第i个节点没有子孩子。
>
输出：
对应每个测试案例，
按照从上之下，从左至右打印出二叉树节点的值。

如果还不是很明白题目要干什么的话,下面是有一个样例的输入和输出供参考。

```
样例输入：
7
8 6 5 7 10 9 11
d 2 5
d 3 4
z
z
d 6 7
z
z
样例输出：
8 6 10 5 7 9 11
```

## 解法分析
根据一般二叉树的结构（没有指向父亲的指针，也没有指向最大弟弟的指针），我们大多数遍历的时候是按照“父亲-->儿子”的顺序来进行的，也就是从根节点开始，遍历完它的左子树然后再去遍历右子树。在这种情况下，我们不可能完成自上而下，自左往右地打印二叉树的任务的。这种，自上而下自左往右的遍历方法，我们先给他起个名字叫做二叉树的广度遍历。

为了完成这个任务，我们需要做到在遍历一个结点（设定为A）的时候先后获得它的左右孩子节点（左是B，右是C），打印出来，然后再返回来对左孩子（B）进行操作，获得它的左右孩子结点（分别是D和E），打印出来。接着，回到上一层的右孩子（C），获得它的左右孩子结点（分别是F和G），打印出来。重复上述的操作，一直到遍历到最右边的叶子结点。

这里，==我们需要用到别的数据结构作为辅助，那就是**队列**！==使用队列，我们可以很方便来完成上诉的操作。我们来详细的分析一下具体的做法：

1. 构建一个队列结构，将根结点放在队列当中；
2. 根结点执行出队操作，此时将出队结点的所有孩子结点（如果有的话）依照从左到右的顺序，插入队列当中；
3. 出队对头的元素，每个出队的结点都重复操作2，直到队列当中没有任何元素；

下面是上述这部分详细的代码：

```java
//遍历二叉树的队列
public static Queue<BinTreeNode> queue1 = new LinkedList<>();
//根节点
public static BinTreeNode realroot;
//按照题目要求(自上而下遍历二叉树)打印输出的函数
public static void printOut() {
    //将根节点插入队列
    queue1.offer(realroot);
    while (!queue1.isEmpty()) {
        //用一个临时的结点来当做当前结点
        BinTreeNode tmp = queue1.poll();
        System.out.print(tmp.value+" ");
        if (tmp.lChild != null) {
            queue1.offer(tmp.lChild);
        }
        if (tmp.rChild != null) {
            queue1.offer(tmp.rChild);
        }
    }
}
```

恭喜大家！执行完上面的三个步骤之后，二叉树就会被我们自上而下自左往右地打印出来了。但是，执行这些操作的**前提**是：==我们已经构建好了二叉树==。怎么从输入的里面解析出表示不同意思的数据，对这些数据的处理，同样是我们需要关注的问题。下面，我们分析一下怎么解析输入的数据:

- 第一个输入的是这棵树的结点个数，这个比较好处理。直接保存为一个整形就可以了。
- 第二个输入的是一个序列，代表每个结点的值（value）
- 接下来是n行，代表第n个结点的孩子的情况，这里我使用两个表来装，一个装孩子的信息，一个装孩子的值，分别用两个指针来维护。

下面是数据处理部分的代码：

```java
//字符串数组,处理输入的信息
private static ArrayList<String> info = new ArrayList<>();
//二叉树的结点总数
private static int n;
//保存二叉树所有结点的值的数组
public static int[] array;
//存放子树的值
public static ArrayList<Character> subTreeValue = new ArrayList<>();
//存放子树的信息
public static ArrayList<Character> subTreeInfo = new ArrayList<>();
//指向子树的值
private static int p1 = 0;
//指向子树的信息
private static int p2 = 0;

//接受输入信息的函数
public static void init() {
    Scanner scanner = new Scanner(System.in);
    if (scanner.hasNext()) {
        //接受树的结点个数
        n = scanner.nextInt();
        array = new int[n];
        //接受树的结点value
        for (int i = 0; i < array.length; i++) {
            array[i] = scanner.nextInt();
        }
        //接受树的子树信息
        for (int t = n; t >= 0; t--) {
            if (scanner.hasNextLine()) {
                String str = scanner.nextLine();
                info.add(str);
            }
        }
    }
}

//处理输入信息的函数
public static void BuildAndJudgeSubTree() {
    //取出info当中的子树信息存入一个字符数组
    for (String p : info) {
        String[] a = p.split(",");
        char[] subTreeInfo1 = a[0].toCharArray();
        //根据子树的信息建立子树
        for (int i = 0; i < subTreeInfo1.length; i++) {
            //拿掉空格(ASCII当中32==space)
            if (subTreeInfo1[i] != 32) {
                //子树的信息            
            	if (subTreeInfo1[i] >= 'a' && subTreeInfo1[i] <= 'z' )
                    subTreeInfo.add(subTreeInfo1[i]);
                //子树的值
                else
                    subTreeValue.add(subTreeInfo1[i]);
            }
        }
    }
}
```

有了上面的两个子树相关的数据，我们就可以着手构建二叉树了。在这里，我们还是需要用到辅助数据结构，队列。同样地，我们先分析一下构建二叉树的步骤应该是怎样的，必须明确的是，数据里面的子树的信息，也是从上往下，从左往右给的。

1. 新建一个结点，将根节点的值放进去，然后将这个结点放入队列当中；
2. 将队列头部元素弹出，这个元素作为当前的操作元素，根据信息构建它的子树，并将子结点按照顺序加入到队列当中；
3. 重复第2步的操作，直到队列为空。

另外，为了方便操作和封装，这里我们需要构建一个二叉树结点类：

```java
class BinTreeNode{

	public int value;
	public BinTreeNode lChild = null;
	public BinTreeNode rChild = null;
	
	public BinTreeNode(int value) {
		this.value = value;
	}
}
```
下面是构建二叉树的详细代码：

```java
//构建二叉树的队列
public static Queue<BinTreeNode> queue = new LinkedList<>();
//遍历二叉树的队列
public static Queue<BinTreeNode> queue1 = new LinkedList<>();
//根节点
private static BinTreeNode root;
//根节点,用于打印
private static BinTreeNode realroot;

//构建二叉树的函数,利用了一个队列
public static void buildTree() {
    root = new BinTreeNode(array[0]);
    realroot = root;
    //将根节点插入队列
    queue.offer(root);
    while (!queue.isEmpty()) {
        //从队列弹出一个结点作为当前结点
        root = queue.poll();
        //判断当前子树的信息,选择其中一项执行,最后"指针"后移一位
        if (subTreeInfo.get(p2) == 'd') {
            //如果当前结点有两个孩子,则新建两个结点放到当前结点的孩子当中
            //注意将字符转换成整形
            root.lChild = new BinTreeNode(array[subTreeValue.get(p1++) - '0' - 1]);
            root.rChild = new BinTreeNode(array[subTreeValue.get(p1++) - '0' - 1]);
            //将左右孩子插入队列当中,以便构建它们的子树
            queue.offer(root.lChild);
            queue.offer(root.rChild);
        }
        //只有一个孩子的话.无论左右孩子对于当前的题目要求没有影响,默认当成左孩子处理
        if (subTreeInfo.get(p2) == 'r' || subTreeInfo.get(p2) == 'r') {
            root.lChild = new BinTreeNode(array[subTreeValue.get(p1++) - '0' - 1]);
            queue.offer(root.lChild);
        }
        //指针后移一位
        p2++;
    }
}
```
### 防坑
上面有一个地方可能造成坑，特别记录下来。为什么会有两个变量，一个叫`root`另一个叫`realroot`，它们有什么区别。一开始呢，`root`和`realroot`都是指根节点的。后来，`root`用来指示当前的操作结点了。遍历完之后，它是最后一个叶子结点。`realroot`则一直表示的都是根节点，没有改变过，所以是”真的根节点“，在其他需要使用根节点的地方可以使用它，但是不要使用`root`，因为有可能会造成错误！

## 结语
这个题目做完还是比较有意思的，使用了一种辅助的数据结构，完成对二叉树的一个比较特别的遍历方法，广度遍历。通过这个题目，加深了对二叉树和队列的认识。好题！
