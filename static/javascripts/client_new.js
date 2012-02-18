var latest_login_list = []
var suggest_obj = undefined;
var LOGIN_COLOR_MAX = 10
var COOKIE_NAME = "dev_hub_name";

$(function() {
  init_websocket();

  $('#name').val($.cookie(COOKIE_NAME));

  $('#sequence_button').click(function(){ 
    $('#sequence').slideToggle(); 
  });
});

function init_websocket(){
  var socket = io.connect('/');
  socket.on('connect', function() {
    //console.log('connect');
    socket.emit('name', {name: $.cookie(COOKIE_NAME)});
  });

  socket.on('disconnect', function(){
    //console.log('disconnect');
  });

  // for chat
  socket.on('message', function(data) {
    append_msg(data)
  });

  socket.on('list', function(login_list) {
    latest_login_list = login_list

    var out_list = ""
    for (var i = 0; i < login_list.length; ++i){
      if ( login_list[i].pomo_min > 0 ){
        out_list += '<span class="login-name-pomo">' + login_list[i].name + ' <span class="pomo-min">' + login_list[i].pomo_min + 'min</span></span>'
      }else{
        out_list += '<span class="login-name' + login_list[i].id % LOGIN_COLOR_MAX + '">' + login_list[i].name + '</span>'
      }
    }
      
    if ($('#login_list').html() != out_list){
      $('#login_list').html(out_list);
      $('#login_list').fadeIn();
      suggest_start(login_list);
    }
  });

  socket.on('latest_log', function(msgs) {
    for ( var i = 0 ; i < msgs.length; i++){
      append_msg_without_date(msgs[i])
    }
    show_sequence();
  });

  $('#form').submit(function() {
    var name = $('#name').val();
    var message = $('#message').val();
    $.cookie(COOKIE_NAME,name);

    if ( message && name ){
      var send_msg = "[" + name + "] " + message;
      socket.emit('message', {name:name,msg:message});
      $('#message').attr('value', '');
    }
    return false;
  });

  $('#sync_text').click(function(){
    $('#code').val($('#code_out').text());
  });

  $('#clear_text').click(function(){
    $('#code').val("");
    socket.emit('text',"");
  });

  $('#pomo').click(function(){
    var name = $('#name').val();
    var message = $('#message').val();
    $.cookie(COOKIE_NAME,name);

    $('#message').attr('value', '');
    socket.emit('pomo', {name: name, msg: message});
    return false;
  });

  // for editor
  socket.on('text', function(text_log) {
    $('#text_writer').text("last updated by '" + text_log.name + "' at " + text_log.date);
    $('#text_writer').show();

    $('#code_out').text(text_log.text);
  });

  var code_prev = $('#code').val();
  var loop = function() {
    var code = $('#code').val();
    if (code_prev != code) {
      socket.emit('text',code);
      code_prev = code;
    }
    setTimeout(loop, 200);
  };
  loop();
};

function suggest_start(list){
  var suggest_list = []
  for (var i = 0; i < list.length; ++i){
    suggest_list.push(">" + list[i].name);
  }

  if (suggest_obj == undefined){
    suggest_obj = new Suggest.LocalMulti("message", "suggest", suggest_list, {dispAllKey: false, prefix: true});
  }else{
    suggest_obj.candidateList = suggest_list;
  }
}

function to_sequence(msg){
//  var seq_html = '<div class=wsd wsd_style="vs2010"><pre>MSG</pre></div><script type="text/javascript" src="http://www.websequencediagrams.com/service.js"></script>';
  var seq_html = '<div class=wsd wsd_style="vs2010"><pre>MSG</pre></div></script>';
  return seq_html.replace("MSG",msg);

}

function getFullDate(date){
  var yy = date.getYear();
  var mm = date.getMonth() + 1;
  var dd = date.getDate();
  if (yy < 2000) { yy += 1900; }
  if (mm < 10) { mm = "0" + mm; }
  if (dd < 10) { dd = "0" + dd; }

  return yy + '/' + mm + '/' + dd + ' ' + date.toLocaleTimeString();
};

function append_msg(data){
  //TODO: System メッセージを非表示にする。
  //      切り替え可能にするかは検討する。
  if (data.name == "System") { return }

  var date = new Date();
  var id = date.getTime();
  var date_color = "#ccc";

  $('#list').prepend($('<li id="' + id + '" style="display:none">' + get_msg_body(data) + ' <span style="color: ' + date_color + ';">(' + getFullDate(date) + ')</span></li>'));
  $('#' + id).fadeIn('slow');

  add_to_sequence(data);
  show_sequence();
};

var seq_msg_log = [];
function add_to_sequence(data){
  if ( (data.name == "System") ||
       (data.name == "Ext") ||
       (data.name == "Pomo") ){ return; }                                           

  seq_msg_log.unshift(data);
  if (seq_msg_log.length > 10){
    seq_msg_log.pop();
  }
}

function show_sequence(){
  var seq_msg = "";
  for(var i = 0; i < seq_msg_log.length; i++){
    other_name = get_other_name(seq_msg_log[i].msg)

    if ( is_login_name(other_name.name) ){
      var msg_body = seq_msg_log[i].msg.replace(other_name.area,"")
      seq_msg += seq_msg_log[i].name + "-->" + other_name.name + ": " + msg_body + "\n";
    }else{
      seq_msg += "note right of " + seq_msg_log[i].name + ": " + seq_msg_log[i].msg + "\n";  
    }
  }

  $('#sequence').html(to_sequence(seq_msg));
}

function append_msg_without_date(data){
  var date = new Date();
  var id = date.getTime();

  $('#list').prepend($('<li id="' + id + '" style="display:none">' + get_msg_body(data) + '</li>'));

  $('#' + id).fadeIn('slow');

  add_to_sequence(data);
};

function get_msg_body(data){
  var date = new Date();
  var id = date.getTime();

  var name_class = "login-name";
  var msg_color = "#555";

  data.id = get_id(data.name)

  if ( data.name == "System" ){
    name_class = "login-name-system";
    msg_color = "#aaa";
  }else if ( data.name == "Ext" ){
    name_class = "login-name-ext";
    msg_color = "#aaa";
  }else if ( data.name == "Pomo" ){
    name_class = "login-name-pomosys";
    msg_color = "orange";
  }else{
    name_class = "login-name" + data.id % LOGIN_COLOR_MAX
    msg_color = "#555";
  }

  return '<span class="' + name_class + '">' + data.name + '</span> <span style="color: ' + msg_color + ';">' + decorate_msg(data.msg) + '</span>';
}

function decorate_msg(msg){
  var deco_msg = msg;
  var other_name = get_other_name(msg)

  if ( is_login_name(other_name.name) ){
    deco_msg = deco_msg.replace(other_name.area,function(){ return '<span style="color: red;">' + other_name.area + '</span>' ;});
  }

  deco_msg = deco_msg.replace(/((https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+))/g,function(){ return '<a href="' + RegExp.$1 + '" target="_blank" >' + RegExp.$1 + '</a>' });

  deco_msg = deco_msg.replace(/(SUCCESS)/, function(){ return '<span style="color: limegreen;">' + RegExp.$1 + '</span>'});
  deco_msg = deco_msg.replace(/(FAILURE)/, function(){ return '<span style="color: red;">' + RegExp.$1 + '</span>'});

  return deco_msg;
};

function get_other_name(msg){
  var match_area = ""
  var other_name = ""
  msg.replace(/((>|＞)[ ]*(.+?)( |$))/,function(){ 
    match_area = RegExp.$1
    other_name = RegExp.$3
  });
  return {name: other_name, area: match_area }
};

function is_login_name(name){
  for(var i = 0; i < latest_login_list.length; ++i ){
    if ( latest_login_list[i].name == name ){
      return true;
    }
  }
  return false;
}

function get_id(name){
  for(var i = 0; i < latest_login_list.length; ++i ){
    if ( latest_login_list[i].name == name ){
      return latest_login_list[i].id;
    }
  }
  return 0;
}

