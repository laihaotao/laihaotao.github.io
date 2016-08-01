---
layout: post
title: Android的SQLite数据库存储
subtitle: introduction about how to use Android's SQLite database
Keyword: android, Android, SQLite
tag:
   - Android
   - 数据库
---

***以下内容是学习android的过程的记录，部分是自己的理解，部分来自与网络，部分来自于书籍《第一行代码》。欢迎转载，请注明出处。***


# 创建数据库

为了帮助我们管理数据库，提供了一个SQLiteOpenHelper帮助类，借助这个类，可以非常简单的对数据库进行创建和升级。

该类是一个抽象类。我们如果想要使用需要创建一个自己的帮助类去继承它，然后在类中重写它的两个**抽象方法onCreate()和onUpgrade()**，分别用于实现创建和升级的逻辑。此外，该类中还有两个非常重要的实例方法，getReadableDatabase()和getWriteableDatabase()。这两个方法都可以用于创建或者打开一个现有的数据库（如果已经存在就直接打开，否则创建一个新的），并返回一个读写操作的对象。不同的是，当数据库不可写入时，getReadableDatabase()返回对象以只读的形式打开数据库，而getWriteableDatabase()则会出现异常。

SQLiteOpenHelper中有两个构造方法可供重写，一般使用参数少的那个即可，这个构造方法接受四个参数：
* 第一个是Context
* 第二个是数据库名
* 第三个允许我们查询数据时返回的一个i额自定义的Cursor，一般传入null
* 第四个是表示当前数据库的版本号
* 具体签名：MyDatabaseHelper(Context context, String name, SursorFactory factory, int version)

下面给出一个具体的使用例子：

```java
public class MyDatabaseHelper extends SQLiteOpenHelper{
	//构建建表语句
	public static final String CREATE_BOOK = "create table Book ("
	       + "id integer primary key autoincrement, "
	       + "author text, "
	       + "price real, "
	       + "pages integer, "
	       + "name text)" ;
	private Context mContext;
	
	public MyDatabaseHelper(Context context, String name, CursorFactory factory, int version){
		super(context, name, factory, version);
		mContext=context;//获取当前的context
	}
	
	@Override
	public void onCreate(SQLiteDatabase db){
		//调用SQLiteOpenHelper的execSQL()方法执行建表
		db.execSQL(CREATE_BOOK);
		//mContext用在这里了
		Toast.makeText(mContext,"Create succeeded", Toast.LENGTH_SHORT).show();
	}
	
	@Override
	public void onUpgrade(SQLiteDatase db, int oldversion, int new version){
	
	}
}
```
下面给出对应的MainActivity的相关代码，活动界面的布局代码就不给出了，只是一个按钮而已。

```java
public class MainActivity extends Activity{
	private MyDatabaseHelper dbHelper;

	@Override
	protected void onCreate(Bundle savedInstanceState){
		super.conCreate(savedInstanceState);
		setContentView(R.layout.activity_main);
		dbHelper = new MyDatabaseHelper(this, "数据库名称.db", null, 1);
		Button createDatabase = (Button) findViewById(R.id.create_database);//id要看你自己起的
		createDatabase.setOnClickListener(new View.OnClickListener(){
			@override
			public void onClick(View v){
				dbHelper.getWritableDatabase();
			}
		});
	}
}
```
***注意：怎么查看数据库和表是否建立成功不在我们的讨论范围，相关详情可以搜索“如何运用Android SDK的adb调试工具”***
**********
# 数据库的升级
## 初级
大家都可以看到，上面的程序有一个空着的方法还没有使用，从它的名字我们也可以看到这是一个用于数据库升级的程序。下面我们来研究一下怎么使用这个方法。比如，现在我想要在上面的数据库的基础上再建多一张表。我们用以下的代码：

```java  
//请注意，这是一个错误的例子！
 
public class MyDatabaseHelper extends SQLiteOpenHelper{
	//构建建表语句
	public static final String CREATE_BOOK = "create table Book ("
	       + "id integer primary key autoincrement, "
	       + "author text, "
	       + "price real, "
	       + "pages integer, "
	       + "name text)" ;
	//构建多一个建表语句
	public static final String CREATE_BOOK_ANOTHER = "create table Book_Another ("
	       + "id integer primary key autoincrement, "
	       + "author text, "
	       + "price real, "
	       + "pages integer, "
	       + "name text)" ;
	private Context mContext;
	
	public MyDatabaseHelper(Context context, String name, CursorFactory factory, int version){
		super(context, name, factory, version);
		mContext=context;//获取当前的context
	}
	
	@Override
	public void onCreate(SQLiteDatabase db){
		//调用SQLiteOpenHelper的execSQL()方法执行建表
		db.execSQL(CREATE_BOOK);
		//执行另一个表的建表语句
		db.execSQL(CREATE_BOOK_ANOTHER);
		//mContext用在这里了
		Toast.makeText(mContext,"Create succeeded", Toast.LENGTH_SHORT).show();
	}
	
	@Override
	public void onUpgrade(SQLiteDatase db, int oldversion, int new version){
	
	}
}
//请注意，这是一个错误的例子！
```
你会发现上面的代码并没有起到什么作用。原因很简单，自从我们点击了上面的按钮之后，数据库就已经建立完成了。无论我们再怎么按那个按钮，MyDatabaseHelper当中的onCreate()方法都不会再执行。当然，一个有效的方法是把这个应用卸载之后再重新安装。但是为了更新数据库而去卸载应用的代价比较大，这个方法比较极端。下面提供一个比较温和的方法来实现，通过SQLiteOpenHelper的升级功能。修改上面的代码如下：

```java
public class MyDatabaseHelper extends SQLiteOpenHelper{
	...
	@Override
	public void onUpgrade(SQLiteDatase db, int oldversion, int new version){
	//通过以上例子可以总结出，这个的用法----> db.execSQL("SQL语句");
	db.execSQL("drop table if exists Book");
	db.execSQL("drop table if exists Book_Another");
	onCreate(db);
	}
}
```
通过以上代码，可以看到我们把原来的表drop掉了。然后在调用onCreate方法创建了两个新的表。但是我们需要怎么做才可以让这个onUpgrade(）方法执行呢？其实很简单，只要我们在MainActivity当中MyDatabaseHelper 的构造将version参数改为比原来的大就好了（一开始是1的话现在可以改成2），如下：

```java 
dbHelper = new MyDatabaseHelper(this, "数据库名称.db", null, 1);
```
改为：

```java 
dbHelper = new MyDatabaseHelper(this, "数据库名称.db", null, 2);
```
## 进阶
利用上面的方法，我们不需要每次都卸载app了。但是要把整个数据表直接删除再新建一个的代价也是挺大的。还有没有别的方法可以用来实现呢，而且只要把新的加进去就可以了。答案当然是有的！请看：

```java 
...
@Override
public void onUpgrade(SQLiteDatase db, int oldversion, int new version){
	switch(oldversion){
		case 1:
			db.execSQL(BOOK_ANOTHER);
		default:
	}
}
...
```
这样，通过判断就的版本号，我们可以知道当前的版本，然后仅仅执行添加的操作就可以了。如果以后还有什么操作可以就这用case用下面接。**注意，这里的case后面没有接break语句。**因为当前用户的版本可能离现在的版本不止差一个。所以需要它一直更新下去，直到最新的版本。
********
#四种数据的操作CRUD

对于数据库的操作，通常情况下有一下四种：
* 添加Create
* 查询Retrieve
* 更新Updata
* 删除Delete

Android提供了两种操作数据库的方法，一种是使用传统的SQL语句（*推荐熟悉SQL的使用这种方法更加简便*），通过调用db.execSQL()方法来实现。还有一种就是利用getReadableDatabase()和getWriteableDatabase()这两个方法返回的SQLiteDatabase对象。利用这个对象的一系列方法，可以完成对数据库的一系列操作。该对象提供的方法如下：
>- **insert(table, null, vaules)**
>- **updata(table, values, selection, selectionArgs)**
>eg :    db.updata("Book", values, "name=?", new String[] {"The Dacinci Code"});
>"?"代表占位符，后面字符串数组的每一个元素就代表着一个占位符的内容，代表SQL当中的where
>- **delete((table, selection, selectionArgs)**
>eg:   db.delete(("Book", "page>?", new String[] {"500"});
>"?"代表占位符，后面字符串数组的每一个元素就代表着一个占位符的内容，代表SQL当中的where
>上面的eg的意思是删除Book表当中page大于500的所有行的数据  
>- **query(table, columns, selection, selectionArgs, groupBy, having, orderBy)**
 >这个函数比较复杂,因为参数比较多。使用的时候不必全部参数都传入，多数情况下只要传入几个参数，其他保持默认即可。这个方法调用后会返回一个Cursor对象，保存有查询出来的全部数据。使用get方法取出需要的数据即可。**注意，使用完Cursor后要调用Cursor.close()来关闭这个对象！**
 
 以上有关values的使用会在下面的小节里面的代码当中展示出来。
 
 ****
#使用事务
我们什么时候需要使用事务：
> 事务的特性可以让一系列的操作要么全部完成要都不完成。
> eg：转账的过程当中需要将钱用一个账户中取出来再放到另一个账户当中。如果钱取出来了，但是发生异常，这个资金没有去到应该去的账户当中，那钱不就凭空的消失了？使用事务可以有效的避免这种情况的发生。

 下面是一个使用数据库事务的**代码片段**不能直接作为demo使用：
 
```java 
...
private MyDatabaseHelper dbHelper;
dbHelper = new MyDatabaseHelper("数据表名","数据库名",null,version);
...
SQLiteDatabase db = dbHelper.getWritableDatabase();
db.beginTransaction();//启用事务的方法
try{
	db.delete("表名"，null，null)；//企图删除整个表
	if(true){
		//抛出一个异常
		throw new NullPointerException();
	}
	//这里是values的使用，将要添加的数据放到这个对象里面在加入到数据库当中
	ContentValues values = new ContentValues ();
	values.put("name","第一行代码");
	values.put("author","郭霖");
	values.put("pages",552);
	values.put("price",79);
	db.insert("表名", null, values);
}catch(Exception e){
	e.printStackTrace();
}finally{
	db.endTransaction();//终止事务
}
...
```
******
好了，Android的SQLite数据库就基本到这里。水平有限，若有错漏，还请指正。





