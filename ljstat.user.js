// ==UserScript==
// @name       LiveJournal статистика комментариев
// @namespace  http://lugovov.ru/userjs/lj
// @version    0.1.3
// @description  Генератор статистики комментариев для ЖЖ
// @match      http://www.livejournal.com/*
// @copyright  2008+, Lugavchik
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js
// @updateURL	https://github.com/lugovov/ljstat/raw/public/ljstat.user.js
// ==/UserScript==

(function(){
var run=function(){
    var pageSelector='.s-body';
    jQuery(function($){
	var users={0:{id:0,name:'-',comments:0,cbd:{}}};
	var fullcomments=false;
	var current_user=$('.s-usernav .i-ljuser-username').text();
	var options={limit:10,ignore:current_user,period:'all'};
	var daysecond=86400;
	var periods={
		all:{name:'За весь период',limit:60*365*daysecond},
		day:{name:'За последние сутки',limit:daysecond},
		week:{name:'За неделю',limit:7*daysecond},
		week2:{name:'За 2 недели',limit:14*daysecond},
		month:{name:'За месяц',limit:30*daysecond},
		month2:{name:'За 2 месяца',limit:61*daysecond},
		month6:{name:'За пол года',limit:182*daysecond},
		year:{name:'За год',limit:365*daysecond},
		year2:{name:'За 2 года',limit:2*365*daysecond},
		year5:{name:'За 5 лет',limit:5*365*daysecond},
		year10:{name:'За 10 лет',limit:10*365*daysecond}
	};
	var footer="<div style='text-align:center'>Статистика сделана скриптом от <lj user='lugavchik' title='Лугавчика'/>.<br/><a href='http://lugavchik.ru/lj/comments.php'>Генератор статистики ЖЖ</a> прячется тут.</div>";
	// Возвращает текущий период генерации статистики
	var GetCurrentPeriod = function(){
		var p=GetOption('period');
		if (periods[p])
			return periods[p];
		// Очень странно, но период не найден. Что-то надо вернуть.
		return {name:'',limit:0};
	};
	// Возвращает посчитанный список комментариев.
	var GetResultUsers=function(){
		if (GetOption('period')=='all')
			return users;
		var ld=new Date();
		var p=GetCurrentPeriod();
		ld=ld.getTime()-p.limit*1000;
		console.log(ld);
		lj_fc=fullcomments;
		lj_u=users;
		var result={0:{id:0,name:'-',comments:0,cbd:{}}};
		for(var i in fullcomments)
			if (fullcomments.hasOwnProperty(i))
				if (fullcomments[i].date>ld){
					if (!result[fullcomments[i].user]){
						result[fullcomments[i].user]={
							id:fullcomments[i].user,
							name:users[fullcomments[i].user]?users[fullcomments[i].user].name:'unknown',
							comments:0
						};
					}
					result[fullcomments[i].user].comments++;
				}
		return result;
	};
	var CheckUser=function(){
	    if (!users[$(this).attr('id')]){
		users[$(this).attr('id')]={id:$(this).attr('id'),name:$(this).attr('user'),comments:0,cbd:{}};
	    }
	};
	var FindUsers=function(x){
	    $(x).find('usermap').each(CheckUser);
	};
	var SetComment=function (){
	    var id=$(this).attr('posterid')||0;
	    users[id].comments++;
	};
	var FindComments=function(x){
	    $(x).find('comment').each(SetComment);
	};
	var ProcessComment=function (comment){
        var id=$(comment).attr('id')|0;
		if ($(comment).attr('state')!='D'){
			var user=$(comment).attr('posterid')|0;
			var date=new Date($(comment).find('date').text());
			fullcomments.push({date:date.getTime(),user:user});
		}
		return id;
    };
    var FindFullComments=function(x){
	var maxid=0;
	$(x).find('comment').each(function(){maxid=Math.max(maxid,ProcessComment(this));});
	return maxid;
    };
    var ParseComments=function(x){
        FindUsers(x);
        FindComments(x);
	var next=$(x).find('nextid').text();
	if (next)
		LoadComments(next);
	else
	    form.find('.status').text('Загружено');
	console.log(x);
        Print();
    };
    var ParseFullComments=function(x){
        var next=FindFullComments(x);
	if (next)
		LoadFullComments(next+1);
	else
	    form.find('.status').text('Загружено');
        Print();
    };
    var LoadComments=function(start){
        console.log('start load from '+start);
	form.find('.status').text('Загружаем комментарии с '+start);
        $.ajax('/export_comments.bml?get=comment_meta&startid='+start,{
            dataType:'xml',
            type:'POST',
            success:ParseComments
        });
    };
    var LoadFullComments=function(start){
        console.log('start load from '+start);
	form.find('.status').text('Загружаем полные комментарии с '+start);
        $.ajax('/export_comments.bml?get=comment_body&startid='+start,{
            dataType:'xml',
            type:'POST',
            success:ParseFullComments
        });
    };
	var StartFullLoad=function(){
	   if (fullcomments===false){
		fullcomments=[];
		LoadFullComments(0);
	    }
	};
    var SortUsers=function(a,b){
         return b.comments-a.comments;
    };
	var GetUUrl=function(user){
	    if (user.substr(0,1)=='_'||user.substr(-1)=='_')
		return '//users.livejournal.com/'+user+'/';
	    return '//'+user.replace('_','-')+'.livejournal.com/';
	};
        var GetULink=function(user,lite){
	    if (lite){
	        if (user=='-')
	            return '<b user="-">Аноним</b>';
	        return '<lj user="'+user+'"/>';
	    }else{
		var close='<span class="addremove" data-u="'+user+'">[x]</span>';
	        if (user=='-')
	            return '<b>Аноним</b>'+close;
		var link=GetUUrl(user);
	        return '<span class="ljuser i-ljuser" lj:user="'+user+'"><a href="'+link+'profile"><img src="//l-stat.livejournal.net/img/userinfo.gif"/></a><a>'+user+'</a></span>'+close;    
	    }
        };
/*	var ShowUserLink=function(){
		var a=GetUlink($(this).attr('user'));
		console.log(a,$(this).attr('user'));
		return a;
	}*/
    var GetProgress=function(c,m,s){
        return '<img src="http://l-stat.livejournal.com/img/poll/leftbar.gif" height="14" border="0"/>'+
            '<img src="http://l-stat.livejournal.com/img/poll/mainbar.gif" height="14" border="0" width="'+(Math.floor(800/m*c))+'">'+
            '<img src="http://l-stat.livejournal.com/img/poll/rightbar.gif" height="14" border="0"/> <b>'+c+'</b> ('+(Math.round(c*1000/s)/10)+'%)';
    };
    var GetLine=function(l,c,m,s){
            return '<tr><td>'+c+'.</td><td>'+GetULink(l.name,true)+'</td><td>'+GetProgress(l.comments,m,s)+'</td></tr>';
    };
    var Print=function(){
        var p=[{name:'-','comments':0}];
        var data=GetResultUsers();
        for(var id in data)
            p.push(data[id]);
        p.sort(SortUsers);
        var text='';

        var max=0,summ=0,hide=0;
        $(p).each(function(){
			if (options.ignore[this.name]){
				hide+=this.comments;
			}else{
				max=max||this.comments;
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
	p=GetCurrentPeriod();
        $('#lj-comm-table').html('<table>'+text+'</table><div>Всего комментариев '+p.name.toLowerCase()+': <b id="lj-comm-allc"></b><br/>'+(hide?'Из них скрыто: <b id="lj-comm-hidec"></b>':'')+'</div>')
			.find('#lj-comm-allc').html(summ+hide).end()
			.find('#lj-comm-hidec').html(hide).end()
			;
		$('#lj-comm-code').val($('#lj-comm-table').html()+footer);
		$('#lj-comm-table [user]').replaceWith(function(){return GetULink($(this).attr('user'));});

    };
	var LoadIgnoreList=function(){
		var ign=GetOption('ignore');
		options.ignore={};
		try{
			if (ign>""){
				ign=ign.split('|');
				for(var i in ign)
					if (ign.hasOwnProperty(i))
						options.ignore[ign[i]]=true;
			}
		}catch(e){
			console.log('Error Loading Ignore List');
		}
	};

	var SaveIgnoreList=function(){
		var ign=[];
		for(var i in options.ignore)
			if (options.ignore.hasOwnProperty(i))
				ign.push(i);
		SetOption('ignore',ign.join('|'),true);
	};
	var GetOption=function(name){
		return options[name]=localStorage['lj-comm-'+current_user+'-'+name]||options[name];
	};
	var SetOption=function(name,val,noreplace){
	    if(!noreplace)
		options[name]=val;
	    localStorage.setItem('lj-comm-'+current_user+'-'+name,val);
	};
	var AddRemoveUser=function(){
	    var u=$(this).data('u');
	    if (options.ignore.hasOwnProperty(u))
		delete options.ignore[u];
	    else
		options.ignore[u]=true;
	    PrintIgnoreList();
	    SaveIgnoreList();
	    Print();
	};
	var PrintIgnoreList=function(){
	    var a=[];
	    for(var i in options.ignore)
		if (options.ignore.hasOwnProperty(i))
		    a.push(GetULink(i));
	    var last=a.length>0?(a.length>1?' и ':'')+a.pop():'';
	    $('#lj-comm-hideusers').html(a.join(', ')+last+(a.length>0?'.':''));
	};
    var ShowForm=function(){
        var div=$('<div><div id="lj-comm-form"></div><ul id="lj-comm-menu"><li data-b="table">Таблица</li><li data-b="result">Код вставки</li></ul><div id="lj-comm-blocks"><div id="lj-comm-table">Загружаем данные</div><div id="lj-comm-result">Код для вставки:<br/><textarea id="lj-comm-code"></textarea></div></div>').prependTo(pageSelector)
		.css({position:'relative','background-color':'#fff','border':'1px solid silver','z-index':19})
		.delegate('.addremove','click',AddRemoveUser)
		.delegate('#lj-comm-menu li','click',function(){
			$(this).parent().find('li').removeClass('active');
			$(this).addClass('active');
			$('#lj-comm-blocks>div:not(#lj-comm-'+$(this).data('b')+')').slideUp();
			$('#lj-comm-'+$(this).data('b')).slideDown();
		}).find('#lj-comm-menu>li:first').click().end()
		.find('#lj-comm-code').focus(function(){var el=this;setTimeout(function(){el.select();},200);}).end();
	CreateForm();
        LoadComments(0);
	button.fadeOut(function(){$(this).remove();});
    };
    var form=$('<div></div>');
    // Форма настроек
	var CreateForm=function(){
		$('head').append('<style>'+
		'.addremove{cursor:pointer;top:-5px;position:relative;font-size:8pt;transition:1s;}'+
		'.addremove:hover{color:red;background-color:#fcc;}'+
		'#lj-comm-menu li{width:49%;padding:0;margin:0;display:block;border:1px solid silver;transition:1s;padding:5px;float:left;}'+
		'#lj-comm-table {clear:both}'+
		'#lj-comm-menu li.active{background-color:#ddd;font-weight:bolder;}'+
		'#lj-comm-menu li:not(.active):hover{background-color:#ccc; cursor:pointer;}'+
		'#lj-comm-menu {padding:0;margin:0;clear:both;}'+
		'#lj-comm-code {height:300px;width:100%;}'+
		'</style>');

		form=$('<table><tr><td>Показать не более:</td><td><div id="lj-comm-limitdiv">'+
'<input type="number" id="lj-comm-limit" min="5" step="5" max="500"/><span>10</span><span>15</span><span>25</span><span>50</span><span>100</span></div></td></tr>'+
'<tr><td>Скрытые пользователи:</td><td><div id="lj-comm-hideusers"></div></td>'+
'</tr><tr class="nomore" style="display:none"><td colspan="2"><div id="morelink">Показать больше настроек</div></td></tr>'+
'<tr><td>Считать статистику за</td><td><select id="lj-comm-period"></select></td></tr><tr><td>Состояние</td><td class="status"></td></tr></table>').appendTo('#lj-comm-form')
		.find('#lj-comm-limitdiv span').css({padding:'5px',color:'blue',cursor:'pointer'}).click(function(){$('#lj-comm-limit').val($(this).text()).change();}).end()
		.find('#lj-comm-limit').val(GetOption('limit')).change(function(){SetOption('limit',$(this).val());Print();}).end()
		.find('#lj-comm-period').change(function(){
			if($(this).val()!='all'){
				StartFullLoad();
			}
			SetOption('period',$(this).val());
			Print();
		}).end();
		var cp=GetOption('period');
		if (cp!='all')
			StartFullLoad();
		for (var i in periods)
			if(periods.hasOwnProperty(i)){
				$('#lj-comm-period').append($('<option/>').attr('value',i).attr('selected',i==cp).text(periods[i].name));

			}
		PrintIgnoreList();
	};
    var button=$('<button/>').css({position:'absolute',top:'16px',right:'400px','z-index':10000}).text('Загрузить статистику').click(ShowForm).prependTo(pageSelector);
	LoadIgnoreList();

});
};
if(typeof(jQuery)=='undefined'){
    var s=document.createElement('script');
    s.src='http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js';
    s.onload=run;
    document.body.appendChild(s);
}else
	run();

})();
