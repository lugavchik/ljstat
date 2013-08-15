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
	var current_user=$('#user').val();
	var options={limit:10,ignore:current_user};
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
    var GetULink=function(user,lite){
		if (lite){
	        if (user=='-')
	            return '<b user="-">Аноним</b>';
	        return '<lj user="'+user+'"/>';    
		}else{
			var close='<span class="addremove" data-u="'+user+'">[x]</span>';
	        if (user=='-')
	            return '<b>Аноним</b>'+close;
	        return '<span class="ljuser i-ljuser" lj:user="'+user+'"><a>'+user+'</a></span>'+close;    
		}
    }
/*	var ShowUserLink=function(){
		var a=GetUlink($(this).attr('user'));
		console.log(a,$(this).attr('user'));
		return a;
	}*/
    var GetProgress=function(c,m,s){
        return '<img src="http://l-stat.livejournal.com/img/poll/leftbar.gif" height="14"/>'+
            '<img src="http://l-stat.livejournal.com/img/poll/mainbar.gif" height="14" width="'+(Math.floor(800/m*c))+'">'+
            '<img src="http://l-stat.livejournal.com/img/poll/rightbar.gif?v=6803" height="14"/> <b>'+c+'</b> ('+(Math.round(c*1000/s)/10)+'%)';
    }
    var GetLine=function(l,c,m,s){
            return '<tr><td>'+c+'.</td><td>'+GetULink(l.name,true)+'</td><td>'+GetProgress(l.comments,m,s)+'</td></tr>';
    }
    var Print=function(){
        var p=[{name:'-','comments':-1}];
        for(var id in users)
            p.push(users[id])
        p.sort(SortUsers);
        var text='';

        var max=p[0].comments,summ=0,hide=0;
        $(p).each(function(){
			if (options.ignore[this.name]){
				hide+=this.comments;
			}else{
	            summ+=this.comments;
			}
        });
		var limit=0;
		var curr=0;
        $(p).each(function(){
			if (!options.ignore[this.name])
	            if (this.comments>0&&limit++<options.limit){
                    text+=GetLine(this,limit,max,summ);
				}
        });
        $('#lj-comm-table').html('<table>'+text+'</table><div>Всего комментариев: <b id="lj-comm-allc"></b><br/>'+(hide?'Из них скрыто: <b id="lj-comm-hidec"></b>':'')+'</div>')
			.find('#lj-comm-allc').html(summ+hide).end()
			.find('#lj-comm-hidec').html(hide).end()
			;
		$('#lj-comm-code').val($('#lj-comm-table').html());
		$('#lj-comm-table [user]').replaceWith(function(){return GetULink($(this).attr('user'));});

    }
	var LoadIgnoreList=function(){
		var ign=GetOption('ignore');
		options.ignore={};
		try{
			if (ign>""){
				var ign=ign.split('|');
				for(var i in ign)
					if (ign.hasOwnProperty(i))
						options.ignore[ign[i]]=true;
			}
		}catch(e){
			console.log('Error Loading Ignore List');
		}
	}

	var SaveIgnoreList=function(){
		var ign=[];
		for(var i in options.ignore)
			if (options.ignore.hasOwnProperty(i))
				ign.push(i);
		SetOption('ignore',ign.join('|'),true);
	}
	var GetOption=function(name){
		return options[name]=localStorage['lj-comm-'+current_user+'-'+name]||options[name];
	}
	var SetOption=function(name,val,noreplace){
		if(!noreplace)
			options[name]=val;
		localStorage.setItem('lj-comm-'+current_user+'-'+name,val);
	}
	var AddRemoveUser=function(){
		var u=$(this).data('u');
		if (options.ignore.hasOwnProperty(u))
			delete options.ignore[u];
		else
			options.ignore[u]=true;
		PrintIgnoreList();
		SaveIgnoreList();
		Print();
	}
	var PrintIgnoreList=function(){
		var a=[];
		for(var i in options.ignore)
			if (options.ignore.hasOwnProperty(i))
				a.push(GetULink(i));
		$('#lj-comm-hideusers').html(a.join(', ')+'.');
	}
    var ShowForm=function(){
        var div=$('<div><div id="lj-comm-form"></div><ul id="lj-comm-menu"><li data-b="table">Таблица</li><li data-b="result">Код вставки</li></ul><div id="lj-comm-blocks"><div id="lj-comm-table">Загружаем данные</div><div id="lj-comm-result">Код для вставки:<br/><textarea id="lj-comm-code"></textarea></div></div>').prependTo('#Content')
			.css({position:'relative','background-color':'#fff','border':'1px solid silver','z-index':19})
			.delegate('.addremove','click',AddRemoveUser)
			.delegate('#lj-comm-menu li','click',function(){
				$(this).parent().find('li').removeClass('active');
				$(this).addClass('active');
				$('#lj-comm-blocks>div:not(#lj-comm-'+$(this).data('b')+')').slideUp();
				$('#lj-comm-'+$(this).data('b')).slideDown();
			}).find('#lj-comm-menu>li:first').click().end()
			.find('#lj-comm-code').focus(function(){this.select()}).end();
		CreateForm();
        LoadComments(0);
		button.fadeOut(function(){$(this).remove()})
    }
	var CreateForm=function(){
		$('head').append('<style>'+
		'.addremove{cursor:pointer;top:-5px;position:relative;font-size:8pt;transition:1s;}'+
		'.addremove:hover{color:red;background-color:#fcc;}'+
		'#lj-comm-menu li{width:49%;padding:0;margin:0;display:block;border:1px solid silver;transition:1s;padding:5px;float:left;}'+
		'#lj-comm-menu li.active{background-color:#ddd;font-weight:bolder;}'+
		'#lj-comm-menu li:not(.active):hover{background-color:#ccc; cursor:pointer;}'+
		'#lj-comm-menu {padding:0;margin:0;clear:both;}'+
		'#lj-comm-code {height:300px;width:100%;}'+
		'</style>');
		
		$('<table><tr><td>Показать не более:</td><td><div id="lj-comm-limitdiv"><input type="number" id="lj-comm-limit" min="5" step="5" max="500"/><span>10</span><span>15</span><span>25</span><span>50</span><span>100</span></div></td></tr><tr><td>Скрытые пользователи:</td><td><div id="lj-comm-hideusers"></div></td></tr></table>').appendTo('#lj-comm-form')
		.find('#lj-comm-limitdiv span').css({padding:'5px',color:'blue',cursor:'pointer'}).click(function(){$('#lj-comm-limit').val($(this).text()).change()}).end()
		.find('#lj-comm-limit').val(GetOption('limit')).change(function(){SetOption('limit',$(this).val());Print()}).end()
		PrintIgnoreList();
		
	}
    var button=$('<button/>').css({position:'fixed',top:'10px',right:'10px'}).text('Загрузить статистику').click(ShowForm).prependTo('#Content');
	LoadIgnoreList();

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