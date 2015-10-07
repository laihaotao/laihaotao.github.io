---
layout: post
title: 获取手机联系人Demo
subtitle: a demo of getting the contact infomation in your phone
keyword: contact, android, number,phone，fragment
---
**本文是作者原创文章，欢迎转载，请注明出处 from:@Eric_Lai**

今天做一个获取手机联系人的实战训练，复习一下ListView的使用方法，顺带学习一下fragment的使用方法。

## 获取手机联系人数据
当我们在手机上新建一些联系人之后，这个联系人的信息就会被存储到我们的手机里，这些信息在手机里面是存储到了数据库当中。我们都已经知道，Android里面自带了一个SQLite的轻量级数据库用来存储数据。为了获取联系人，我们首先就要从数据库里面将这些数据提取出来。通过数据库的学习，我们知道，要从里面获取一些数据执行的当然是查询的操作，也就是使用```query()```这个方法了，这个方法会返回一个cursor。具体的用法应该是这样的：

```java
Cursor cursor = context.getContentResolver().query(Phone.CONTENT_URI,null,null,null,null);
```
通过数据库返回的这个cursor，我们就可以查询它的不同字段，以获取某个联系人的姓名和电话号码，然后使用一个迭代器，遍历手机里面的所有联系人。为了方便调用，我们把这个获取联系人信息的操作封装成一个静态方法放在一个在类当中。下面给出这个类的具体代码：

```java
package com.eric_lai.ericcontact;
import android.content.Context;
import android.database.Cursor;
import android.provider.ContactsContract.CommonDataKinds.Phone;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by ERIC_LAI on 15/10/6.
 */
public class GetNumber {
    //建立一个静态的list用来存储查询到得联系人的信息
    public static List<ContactInfo> list = new ArrayList<>();
    //建立一个静态方法用来执行查询的操作
    public static void getNumber(Context context){
        //获取数据库操作指针
        Cursor cursor = context.getContentResolver().query(Phone.CONTENT_URI,null,null,null,null);
        //定义两个变量来存放查询到的名字和电话
        String PhoneName,PhoneNumber;
        //遍历所有的联系人
        while(cursor.moveToNext()) {
            //获取联系人的名字
            PhoneName = cursor.getString(cursor.getColumnIndex(Phone.DISPLAY_NAME));
            //获取联系人的电话
            PhoneNumber = cursor.getString(cursor.getColumnIndex(Phone.NUMBER));
            //将电话和名字封装
            ContactInfo contactInfo = new ContactInfo(PhoneName, PhoneNumber, null);
            //将封装好的信息添加到list当中
            list.add(contactInfo);
            //打印信息,调试时使用
//            System.out.println(PhoneName+PhoneNumber);
        }
    }
}
```

## 封装数据
从上面的代码当中我们也看到了，我们先将数据取出来之后封装到一个叫```ContactInfo```的类当中，再把这个类当作list的数据类型添加到list当中，用adapter配适到UI上。

封装数据的这个类很简单，就定义它的field、一个构造方法、为每个field变量添加一个get方法即可。下面给出它的具体代码：

```java
package com.eric_lai.ericcontact;
import android.media.Image;
/**
 * Created by ERIC_LAI on 15/10/6.
 */
//其中的image是为了以后实现图片使用，这个demo没有用到
public class ContactInfo {
    private String name;
    private String number;
    private Image image;
    public ContactInfo(String name, String number, Image image){
        this.name = name;
        this.number = number;
        this.image = image;
    }
    public String getName() {
        return name;
    }
    public String getNumber() {
        return number;
    }
    public Image getImage() {
        return image;
    }
}
```

## 改善listview性能（使用自定义Adapter）
前面有一篇文章专门讲了ListView的用法，这里我们来复习一下。改善ListView的性能，我们主要是为了避免它每次滑动都实例化UI控件，这是一个比较重量级的操作，容易造成卡顿。我们将需要加载的控件第一次加载之后，存放在一个ViewHolder里面，以后就从这里面拿出来用，ViewHolder我们可以想象成一个缓存的东东。具体的注释都写在了代码里，下面给出自定义Adapter的代码：

```java
package com.eric_lai.ericcontact;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;
import java.util.List;
/**
 * Created by ERIC_LAI on 15/10/6.
 */
public class MyAdapter extends BaseAdapter {
    //通过构造方法传进来的封装好联系人数据list
    private List<ContactInfo> list;
    //调用这个方法的上下文
    private Context context;
    //构造方法,用来传递两个参数
    public MyAdapter(Context context, List<ContactInfo> list) {
        this.context = context;
        this.list = list;
    }
    //一个有需要多少个数据条目显示在listview上
    @Override
    public int getCount() {
        return list.size();
    }
    //每个条目的位置
    @Override
    public Object getItem(int position) {
        return list.get(position);
    }
    //每个条目的id, 其实也就是位置
    @Override
    public long getItemId(int position) {
        return position;
    }
    //主要方法,用来获取listview的显示外观
    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        //缓存控件的viewholder
        ViewHolder viewHolder;
        //判断是否第一次加载
        if (convertView == null) {
            //为当前的view加载布局
            convertView = LayoutInflater.from(context).inflate(R.layout.list_view,null);
            //实例化viewholder
            viewHolder = new ViewHolder();
            //从布局引入控件
            viewHolder.nametv = (TextView) convertView.findViewById(R.id.nametv);
            viewHolder.numbertv = (TextView) convertView.findViewById(R.id.numbertv);
            //设置控件里面显示的内容
            viewHolder.nametv.setText(list.get(position).getName());
            viewHolder.numbertv.setText(list.get(position).getNumber());
            //为当前view打一个标签
            convertView.setTag(viewHolder);
        } else {//不是第一次加载
            //获取之间的view标签
            viewHolder = (ViewHolder) convertView.getTag();
            //设置控件里面显示的内容
            viewHolder.nametv.setText(list.get(position).getName());
            viewHolder.numbertv.setText(list.get(position).getNumber());
        }
        //返回当前的view
        return convertView;
    }
    //一个静态的内部类,用来缓存控件
    private static class ViewHolder{
        TextView nametv;
        TextView numbertv;
    }
}

```
## 配适UI到fragment当中
现在的管理联系人的应用都不应该只有一个项功能，所以为了后续的开发，我们使用一个fragment来显示它的联系人。在一个应用里面用fragment来进行叶面切换而不是Activity是因为fragment比较轻量级，切换的速度比较快，而且可以在平板和手机上又更好的用户体验。

下面，先讲讲怎么使用fragment。使用了fragment之后，一个应用只需要有一个Activity即可，这个Activity就作为一个容器，来承装各个fragment。管理这些fragment，Android为我们提供了一个类叫做```getFragmentManager```。为了实现fragment，我们需要用一个类继承自```Fragment```基类，然后重写它的一些方法。其中，最主要的是它的```onCreateView()```方法。下面给出具体的代码，详细参看代码当中的注释：

```java
package com.eric_lai.ericcontact;
import android.os.Bundle;
import android.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ListView;
public class ContactFragment extends Fragment {
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        //定义一个view加载该fragment的布局文件
        View root = inflater.inflate(R.layout.fragment_contact, container, false);
        //获取在这个fragment上的空间(注意,一定是要从root上获取)
        ListView listView = (ListView) root.findViewById(R.id.contactlv);
        //执行获取联系人的操作
        GetNumber.getNumber(getActivity());
//        System.out.println(getActivity().toString());
        //实例化Adapter
        MyAdapter myAdapter = new MyAdapter(getActivity(), GetNumber.list);
        //绑定listview和adapter
        listView.setAdapter(myAdapter);
        //返回整个布局
        return root;
    }
}
```
最后，我们只要在MainActivity里面加载这个fragment就可以完成了。下面给出MainActivity的代码：

```java
package com.eric_lai.ericcontact;
import android.app.Activity;
import android.os.Bundle;
public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        if (savedInstanceState == null) {
            getFragmentManager().beginTransaction().add(R.id.container, new ContactFragment()).commit();
        }
    }
}
```

至此，整个demo完成，运行一下就可以发现显示出了手机里面联系人的姓名和电话号码。当然，在模拟器里面运行的话，你需要先添加几个联系人。
