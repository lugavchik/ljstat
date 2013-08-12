// ==UserScript==
// @name       LiveJournal comments statistic
// @namespace  http://www.livejournal.com/
// @version    0.1
// @description  generate comments statistic
// @match      http://www.livejournal.com/*
// @copyright  2008+, Lugavchik
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js
// ==/UserScript==

$(function(){
    var users={0:{id:0,name:'-',comments:0,cbd:{}}}
    var CheckUser=function(){
        if (!users[$(this).attr('id')]){
            users[$(this).attr('id')]={id:$(this).attr('id'),name:$(this).attr('user'),comments:0,cbd:{}}
        }
    }
    var FindUsers=function(x){
            $(x).find('usermap').each(CheckUser);
    }
    var SetComment=function (){
        var id=$(this).attr('posterid')|0
        users[id].comments++;
    }
    var FindComments=function(x){
            $(x).find('comment').each(SetComment);
    }
    var ParseComments=function(x){
        FindUsers(x);
        FindComments(x);
        Print();
    }
    var LoadComments=function(start){
        console.log('start load from '+start);
        $.ajax('/export_comments.bml?get=comment_meta&startid='+start,{
            dataType:'xml',
            type:'POST',
            success:ParseComments
        })
    }
    var SortUsers=function(a,b){
             return b.comments-a.comments;   
    }
    var GetULink=function(user){
        if (user=='-')
            return '<b>Аноним</b>';
            return '<lj user="'+user+'">'+user+'</lj>';    
    }
    var GetProgress=function(c,m){
        return '<img src="http://l-stat.livejournal.com/img/poll/leftbar.gif" height="14"/>'+
            '<img src="http://l-stat.livejournal.com/img/poll/mainbar.gif" height="14" width="'+(Math.floor(800/m*c))+'">'+
            '<img src="http://l-stat.livejournal.com/img/poll/rightbar.gif?v=6803" height="14"/> <b>'+c+'</b> ('+(Math.round(c*1000/m)/10)+'%)';
    }
    var GetLine=function(l,m){
            return '<tr><td>'+GetULink(l.name)+'</td><td>'+GetProgress(l.comments,m)+'</td></tr>';
    }
    var Print=function(){
        var p=[{name:'-','comments':-1}];
        for(var id in users)
            p.push(users[id])
        console.log(p);
        p.sort(SortUsers);
        text='';
        max=p[0].comments;
        $(p).each(function(){
            if (this.comments>0)
                    text+=GetLine(this,max);
               });
        $('#lj-comm-table').html('<table>'+text+'</table>');

    }
    var ShowForm=function(){
        var div=$('<div><div id="lj-comm-table"></div>Загружаем</div>').prependTo('#Content');
        LoadComments(0);
    }
    var button=$('<button/>').css({position:'fixed',top:'10px',right:'10px'}).text('Загрузить статистику').click(ShowForm).prependTo('#Content');
});
