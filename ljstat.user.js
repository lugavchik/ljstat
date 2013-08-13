// ==UserScript==
// @name       LiveJournal comments statistic
// @namespace  http://www.livejournal.com/
// @version    0.1
// @description  generate comments statistic
// @match      http://www.livejournal.com/*
// @copyright  2008+, Lugavchik
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js
// ==/UserScript==

(function(){
var run=function(){jQuery(function($){
    var users={0:{id:0,name:'-',comments:0,cbd:{}}}
	var options={limit:10};
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
        return '<span class="ljuser i-ljuser" lj:user="'+user+'"><a>'+user+'</a></span>';    
    }
    var GetProgress=function(c,m,s){
        return '<img src="http://l-stat.livejournal.com/img/poll/leftbar.gif" height="14"/>'+
            '<img src="http://l-stat.livejournal.com/img/poll/mainbar.gif" height="14" width="'+(Math.floor(800/m*c))+'">'+
            '<img src="http://l-stat.livejournal.com/img/poll/rightbar.gif?v=6803" height="14"/> <b>'+c+'</b> ('+(Math.round(c*1000/s)/10)+'%)';
    }
    var GetLine=function(l,c,m,s){
            return '<tr><td>'+c+'.</td><td>'+GetULink(l.name)+'</td><td>'+GetProgress(l.comments,m,s)+'</td></tr>';
    }
    var Print=function(){
        var p=[{name:'-','comments':-1}];
        for(var id in users)
            p.push(users[id])
        p.sort(SortUsers);
        text='';
        max=p[0].comments;
		summ=0;
        $(p).each(function(){
            summ+=this.comments;
               });
		var limit=0;
        $(p).each(function(){
            if (this.comments>0&&limit++<options.limit){
                    text+=GetLine(this,limit,max,summ);
				}
               });
        $('#lj-comm-table').html('<table>'+text+'</table>');

    }
	var GetOption=function(name){
		return options[name]=localStorage['lj-comm-'+name]|options[name];
	}
	var SetOption=function(name,val){
		options[name]=val;
		localStorage.setItem('lj-comm-'+name,val);
	}
    var ShowForm=function(){
        var div=$('<div><div id="lj-comm-form"></div><div id="lj-comm-table"></div>Загружаем</div>').prependTo('#Content').css({position:'relative','background-color':'#fff','border':'1px solid silver','z-index':19});
		CreateForm();
        LoadComments(0);
		button.fadeOut(function(){$(this).remove()})
    }
	var CreateForm=function(){
		$('<table><tr><td>Показать не более:</td><td><div id="lj-comm-limitdiv"><input type="number" id="lj-comm-limit" min="5" step="5" max="500"/><br/><span>10</span><span>15</span><span>25</span><span>50</span><span>100</span></div></td></tr><tr><td>Скрытые пользователи:</td><td><div id="lj-comm-hideusers"></div></td></tr></table>').appendTo('#lj-comm-form')
		.find('#lj-comm-limitdiv span').css({padding:'5px',color:'blue',cursor:'pointer'}).click(function(){$('#lj-comm-limit').val($(this).text()).change()}).end()
		.find('#lj-comm-limit').val(GetOption('limit')).change(function(){SetOption('limit',$(this).val());Print()}).end();
	}
    var button=$('<button/>').css({position:'fixed',top:'10px',right:'10px'}).text('Загрузить статистику').click(ShowForm).prependTo('#Content');
});
}
if(typeof(jQuery)=='undefined'){
var s=document.createElement('script');
s.src='http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js';
s.onload=run;
document.body.appendChild(s);
}else
	run();

})();