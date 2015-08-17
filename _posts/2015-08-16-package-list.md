---
layout: post
title: 一个简单的公司单据自动生成应用（基于HTML)
description: a kind of list automation-bulit system for small company applicant
keyword: html javascript jquery
---

# 写在前面
前几天去亲戚家玩耍，发现小伙伴在给他父亲的公司开送货单。用的是先在execl上做好然后复制到word上排好版，再打印出来。我看着他操纵觉得有点麻烦，萌生了要不要**“造个轮子”**的想法。虽然“造轮子”是一个很愚蠢的方法，造的时间都可以用上述的方法开几十上百张单了。但是本着做中学的想法，我用了两天时间在家闭门造轮。时间有点长了，大神们勿喷。囧...

在写之前，我纠结了一下用什么来写比较合适的问题。由于本人比较水，c已经还给老师很多年了。现在能用的就只有java了。然而想到要用java来写UI什么的有点蛋疼，去到没有jre的环境下还得部署环境（要知道他们还在用手开发货单，所以我对他们的电脑迟一个怀疑的态度）。思来想去，想来思去，我还是决定用做成一个html应用，正好应应景，现在html5不是火得很么。其中很大原因是，我相信浏览器，他们的电脑里应该还是有的。通过浏览器还能够将网页直接生成PDF用于打印，只要我把格式设定成刚好打印纸的大小就可以了，方便快捷。说干就干，然后我就用了两天时间写了这么一个略鸡肋的东东。囧...


# 开发过程
二话不说先上图，以下是两张屏幕快照，分别是数据采集界面和生成单据界面：
<img src="/images/overlook.png" alt="overlook" >
数据采集界面
<img src="/images/listlook.png" alt="listlook" >
单据生成界面

好吧，看到楼上的图我知道又要吐槽我的界面有多难看了。这个臣妾也不想的啊，但是实在没有什么审美做出好图和好的界面出来，各位忽略这一点吧。相比这些而言，我更想的是记录我在开发过程中的一些感想。

这是我第一次，不对应该是第二次使用html和javascript来写这么个东西，因为没有服务器端，所以我老想着怎么把数据从一个html传到另一个html就用了很多时间。自己想啊想发现然并卵之后就Google了一下，发现原来有个一叫做localstorage的类可以用，使用这个类的setItem(key,value)和getItem(key)和方法就可以把数据存到浏览器本地，然后需要的时候从另一个页面当中取出来了。但是这个是功能并不是所有额浏览器都支持，所以我得先做一个检验，看看这个浏览器是否支持localstoreage这个类。如果不支持，那就劝用户更细下浏览器吧。毕竟太古老的东西都会有各种的不便。

接着我就继续写啊写的，没多久又发现一个问题。我原本是打算出货单只给五个行用来填货物的，后来想想觉得不怎么智能，万一货物超过五行怎么办。我就想这个用javascript写一个可以动态添加任意行货我的功能吧。说干就干，这里添加任意行挺容易的。但是后面可以是拿过来去打印信息的呢。所以怎么编号，怎么给这些数据赋一个名字就显得非常重要了。所以我就用用了点时间来写一个给每个输入框的数据都给一个名字的功能。当然前面那五个就直接给定名字了。这个做完，我就想为了节约打印墨水，最好要有一个功能可以知道我一个工输入了多少行货物的信息，不能每次都全部有得没得有打印出来吧。好在这个比较简单，三下五除二给他解决了。

虽然这次写这个东东用了不少时间，然而其中大部分时间都是在无用功。不过也算做出来了，收获还是不小的，实践才是检验真理的唯一标准。下面就是下几个js的代码了，当中是javascript混夹jquery，不知道这样是不是不规范，我有点偷懒，因为有时候jquery不用打那么多，我就直接打jquery了。html的代码就不放上来了，比较简单，看着都能写出来，或者访问我得github来看看就好了。

```javascript
/**
  * author:        Eric_Lai
  * page:          laiihaotao.github.io
  * name:          util.js
  * date:          Aug 10, 2015
  * description:   Print package list
  * license:       MIT
  * copyright:     All right reserved
  */

var goodsData = new Array("goods_name", "size", "acount", "weight");
var count = 5;
var num = 1;
var moreGood = false;

//check the explore whether support this system or not
//检查浏览器是否支持
function check() {
    if (window.localStorage) {
        alert('恭喜你,你的浏览器能够支持本系统');
    } else {
        alert('非常抱歉你的浏览器不能支持本系统');
    }
}

//清除localstorage的缓存
function clearStorage(){
    localStorage.clear();
    var c = confirm("请在此确定是否要清空缓存");
    if( c===true ){
        alert("本地缓存已经清空");
    }
}
//get the data you store
//取出存进去的货物信息，返回该数组的首地址
function getData(level) {
    var goodsName = findItem(level);
    var array     = new Array(4);
    for (var i = 0; i <= 3; i++) {
        array[i] = localStorage.getItem(goodsName[i]);
    }
    return array;
}

//store the data filled in the blank
//储存货物的信息
function storeData(level, n, s, a, w) {
    var goodsName = findItem(level);
    var array     = new Array(n, s, a, w);
    for (var i  = 0; i <= 3; i++) {
        localStorage.setItem(goodsName[i], array[i]);
    }
}

//create table
//增加一个货物
function createTable(n, s, a, w) {
    var good = new Array(n,s,a,w);
    $("tbody").append("<tr>" +
            "<td>" + num + "</td>" +
            "<td>" + good[0] + "</td>" +
            "<td>" + good[1] + "</td>" +
            "<td>" + good[2] + "</td>" +
            "<td colspan='3'>" + good[3] + "</td>" +
            "</tr>"
            );
    //window.alert(num.toString());
    num++;

}

//a row about sum up
//创建表尾的信息
function createSumUp(allAccount,allWeight){
    $("tbody").append("<tr>" +
            "<td>" + "合计" + "</td>" +
            "<td>" + "&nbsp" + "</td>" +
            "<td>" + "&nbsp" + "</td>" +
            "<td>" + allAccount + "</td>" +
            "<td colspan='3'>" + allWeight + "</td>" +
            "</tr>"
            );
}


//get date
//获取当前时间
function getYMD() {
    var dateObject = new Date();
    var year       = dateObject.getFullYear().toString();
    //月份前要加1
    var month      = (dateObject.getMonth() + 1).toString();
    var date       = dateObject.getDate().toString();
    var string     = year + "-" + month + "-" + date;
    return string;
}

//find out how many goods item we have
function goodAccount() {
        if (moreGood === false) {
            if ($("#goods_name3").val() !== "") {
                //at least use 3
                if ($("#goods_name5").val() !== "") {
                    return 5;
                } else if ($("#goods_name4").val() !== "") {
                    return 4;
                } else {
                    return 3;
                }
            } else if ($("#goods_name2").val() !== "") {
                return 2;
            } else {
                return 1;
            }
        }else{
            return count;
        }
}

//get the name of the data information
//获得货物信息的名字
function findItem(t){
    var i    = t;
    var n    = "goods_name" + i.toString();
    var s    = "size" + i.toString();
    var a    = "acount" + i.toString();
    var w    = "weight" + i.toString();
    var list = new Array(n, s, a, w);
    return list;
}

```
上面的是两个页面当中有会用到的js函数，下面的两个是两个页面各自的js文件：

```javascript
/**
  * author:        Eric_Lai
  * page:          laiihaotao.github.io
  * name:          index.js
  * date:          Aug 10, 2015
  * description:   Print package list
  * license:       MIT
  * copyright:     All right reserved
  */
 
$(document).ready(function () {
    
    //add more good
    $("#add_good").click(function () {
        addGood();
    });
    
    //finish and ready to quicklook
    $("#turn_to_quicklook").on("click",function(){
        localStorage.clear();
        howManyGoods = goodAccount();
        //keep this varaible for ohter html
        localStorage.setItem("howManyGoods",howManyGoods.toString());
        //goodArray was used to storage the information's name about the goods
        var goodArray = new Array(howManyGoods);
        //alert(howManyGoods);
        for (var i = 0; i < howManyGoods; i++) {
            goodArray[i] = new Array(4);
            goodArray[i] = findItem(i+1);
        }
        for (var i = 0; i < howManyGoods; i++) {
            var goods_name = $("#" + goodArray[i][0]).val();
            var size       = $("#" + goodArray[i][1]).val();
            var acount     = $("#" + goodArray[i][2]).val();
            var weight     = $("#" + goodArray[i][3]).val();
            storeData(i+1, goods_name, size, acount, weight);
        }
        storageInfo();
        window.open("quicklook.html");
    });

});

//add goods item
//注意，分清什么时候要用双引号加上单引号，什么时候只用一种引号
function addGood(){
    moreGood = true;
    var good = findItem(count+1);
    var text = "<div class=" + "'good_info'" + ">"+
                    "请输入货品名称:"
                    + "<input class=" + "'textbox'"  + "type=" + "'text'" + "id="
                    + "'_name'" + "/>" + "<br/>"
                    + "包装规格:<input class=" + "'sub_attr'" + "type=" + "'text'"
                    + "id=" + "'_size'" + "/>"
                    + "数量:<input class=" + "'sub_attr'" + "type=" + "'text'"
                    + "id=" + "'_acount'" +"/>"
                    + "净重量:<input class=" + "'sub_attr'" + "type=" + "'text'"
                    + "id=" + "'_weight'" + "/>"
                    + "<hr/>" 
                + "</div>";
    $("#good_list").append(text);
    $("#_name").attr("id",good[0]);
    $("#_size").attr("id",good[1]);
    $("#_acount").attr("id",good[2]);
    $("#_weight").attr("id",good[3]);
    count++;
}

//keep info in local
function storageInfo(){
    var company_name     = $("#company_name").val();
    var list_id          = $("#list_id").val();
    var receiver_address = $("#receiver_address").val();
    var worker_name      = $("#worker_name").val();
    var worker_phone     = $("#worker_phone").val();
    var pay_method       = $("#pay_method").find("option:selected").text();
    var transmit_method  = $("#transmit_method").find("option:selected").text();
    var array1 = new Array(company_name,list_id,receiver_address,
                          worker_name,worker_phone,pay_method,transmit_method);
    var array2 = new Array("company_name","list_id","receiver_address",
                          "worker_name","worker_phone","pay_method","transmit_method");
    for (var i = 0, max = 7; i < max; i++) {
        localStorage.setItem(array2[i],array1[i]);
    }
}

```

```javascript
/**
  * author:        Eric_Lai
  * page:          laiihaotao.github.io
  * name:          quicklook.js
  * date:          Aug 10, 2015
  * description:   Print package list
  * license:       MIT
  * copyright:     All right reserved
  */

$("document").ready(function(){
    fillDate();
    fillInfo();
    quickLookTable();
});

//fill the info in the blank
function fillInfo(){
    var company_name = localStorage.getItem("company_name");
    var list_id      = localStorage.getItem("list_id");
    $("#company_name").attr("value", company_name);
    $("#company_name").attr("readonly", "readonly");
    $("#list_id").attr("value",list_id);
    $("#list_id").attr("readonly", "readonly");
    
}

function fillDate() {
    var year_month_day = getYMD();
    $("#dateYMD").attr("value", year_month_day);
    $("#dateYMD").attr("readonly", "readonly");
}

//bulit the table
function quickLookTable(){
    var allAccount       = 0;
    var allWeight        = 0;
    var receiver_address = localStorage.getItem("receiver_address");
    var worker_name      = localStorage.getItem("worker_name");
    var worker_phone     = localStorage.getItem("worker_phone");
    var pay_method       = localStorage.getItem("pay_method");
    var transmit_method  = localStorage.getItem("transmit_method");
    //goodArray was used to storage the information's name about the goods
    var howManyGoods = localStorage.getItem("howManyGoods");
    var goodArray = new Array(howManyGoods);
    for (var i = 0; i < howManyGoods; i++) {
        goodArray[i] = new Array(4);
        goodArray[i] = findItem(i+1);
    }
    for (var i = 0; i < howManyGoods; i++) {
        var table  = getData(i+1);
        createTable(table[0],table[1],table[2],table[3]);
        var t2     = parseInt(table[2]);
        var t3     = parseInt(table[3]);
        allAccount += t2;
        allWeight  += t3;
    }
    createSumUp(allAccount,allWeight);
    tableFoot(receiver_address,worker_name,worker_phone,pay_method,transmit_method);
}

//print the table foot
function tableFoot(receiver_address,worker_name,worker_phone,pay_method,transmit_method){
    var text = "<tr>"+
                    "<td>"+"结算方式"+"</td>"+
                    "<td>"+pay_method+"</td>"+
                    "<td>"+"送货地址"+"</td>"+
                    "<td colspan='3'>"+receiver_address+"</td>"+
                "</tr>"+
                "<tr>"+
                    "<td>"+"运输方式"+"</td>"+
                    "<td>"+transmit_method+"</td>"+
                    "<td>"+"联系人"+"</td>"+
                    "<td>"+"&nbsp"+"</td>"+
                    "<td width='12%'>"+"联系电话"+"</td>"+
                    "<td>"+"&nbsp"+"</td>"+
                "</tr>"+
                "<tr>"+
                    "<td>"+"业务员"+"</td>"+
                    "<td>"+worker_name+"</td>"+
                    "<td>"+"手机号"+"</td>"+
                    "<td>"+worker_phone+"</td>"+
                    "<td colspan='1'>"+"客户签名"+"</td>"+
                    "<td>"+"&nbsp"+"</td>"+
                "</tr>";
    $("tbody").append(text);
    $("#need_change").attr("colspan","3");
}
```
接下来是一个css的文件，本来这个我没有单独写出来而是直接嵌在每一个的html当中。但是强迫症患者最终还是接受不了，就抽出来单独写了一个css的文件。

```css
#container1{margin: 0;padding: 0;}
#container2{width:  21cm;padding: 0;margin-left: auto;margin-right: auto;}
.title{margin: 0;padding: 5px;font-size: 30px;}
#head{margin: 0;padding: 3px;text-align: center;border-color: gray;}
#mainbody{margin: 0;padding: 0;border-style: ridge;border-color: gray;height: 500px;}
#info{width: 32%;height: 450px;float: left;margin-left: 5%;}
#goods{width: 35%;height: 450px;float: right;margin-right: 3%;font-size: 15px;overflow: scroll;}
#foot{margin: 0;padding: 10px;font-size: 12px;text-align: center;}
#tip{font-size: 12px;color: blue;}
#abovetable{margin: auto;width: 80%;margin-top: 0;padding-top: 0;}
#content{margin: auto;margin-top: 0;padding-top: 0;padding: 0;
}
#belowtable{margin: auto;width: 80%;font-size: 12px;}
table{border-collapse: collapse;}
td{ border:1px solid #999999;text-align: center;font-size: 13px;padding: 0;margin: 0;}
.center{margin:auto;width:80%;}
input.textbox, select.textbox {width: 250px;padding: 4px;}
input.sub_attr{width: 64px}
```