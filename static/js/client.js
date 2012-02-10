function init_websocket(socket){
  socket.on('connect', function() {
    //console.log('connect');
  });

  socket.on('disconnect', function(){
    //console.log('disconnect');
  });

  // for chat
  socket.on('message', function(data) {
    append_msg(data)
  });

  socket.on('list', function(login_list) {
    var out_list = ""
    for (var i = 0; i < login_list.length; ++i){
      if ( login_list[i].pomo_min > 0 ){
        out_list += "[" + login_list[i].name + "(" + login_list[i].pomo_min + "min)]"
      }else{
        out_list += "[" + login_list[i].name + "]"
      }
    }
      
    $('#login_list').text(out_list);
    suggest_start(login_list);
  });

  socket.on('latest_log', function(msgs) {
    for ( var i = 0 ; i < msgs.length; i++){
      append_msg_without_date(msgs[i])
    }
    show_sequence();
  });

  $('#form').submit(function() {
    //console.log('send');
    var name = $('#name').val();
    var message = $('#message').val();
    if ( message && name ){
      var send_msg = "[" + name + "] " + message;
      socket.emit('message', {name:name,msg:message});
      $('#message').attr('value', '');
    }
    return false;
  });

  $('#copy_text').click(function(){
    $('#code').val($('#code_out').text());
  });

  $('#pomo').click(function(){
    socket.emit('pomo', "");
  });

  // for editor
  socket.on('text', function(msg) {
    $('#code_out').text(msg);
  });

  var code_prev = $('#code').val();
  var loop = function() {
    var code = $('#code').val();
    if (code_prev != code) {
      socket.emit('text',code);
      code_prev = code;
    }
    setTimeout(loop, 100);
  };
  loop();
};

var suggest_obj = undefined;
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
  console.log(suggest_list)
}

function to_sequence(msg){
  var seq_html = '<div class=wsd wsd_style="vs2010"><pre>MSG</pre></div><script type="text/javascript" src="http://www.websequencediagrams.com/service.js"></script>';
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
  var other_name = "";
  for(var i = 0; i < seq_msg_log.length; i++){
    other_name = "";
    seq_msg_log[i].msg.replace(/(>|＞)[ ]*(.+)/,function(){ return other_name = RegExp.$2;});
    var msg_body = seq_msg_log[i].msg.replace(/((>|＞)[ ]*(.+))/,"");

    if ( other_name ){
      seq_msg += seq_msg_log[i].name + "-->" + other_name + ": " + msg_body + "\n";
    }else{
      seq_msg += "note right of " + seq_msg_log[i].name + ": " + msg_body + "\n";  
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

  var name_color = "blue";
  var msg_color = "#555";
  var date_color = "#ccc";

  if ( data.name == "System" ){
    name_color = "#caa";
    msg_color = "#aaa";
  }else if ( data.name == "Ext" ){
    name_color = "#aca";
    msg_color = "#aaa";
  }else if ( data.name == "Pomo" ){
    name_color = "tomato";
    msg_color = "orange";
  }

  data.msg.replace(/>[ ]*(.+)/,function(){ return other_name = RegExp.$1;});
  return '<span style="color: ' + name_color + ';">' + data.name + '</span> <span style="color: ' + msg_color + ';">' + decorate_msg(data.msg) + '</span>';
}

function decorate_msg(msg){
  var deco_msg = msg;
  
  deco_msg = deco_msg.replace(/((>|＞)[ ]*(.+))/,function(){ return '<span style="color: red;">' + RegExp.$1 + '</span>' ;});

  deco_msg = deco_msg.replace(/((https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+))/g,function(){ return '<a href="' + RegExp.$1 + '" target="_blank" >' + RegExp.$1 + '</a>' });

  deco_msg = deco_msg.replace(/(SUCCESS)/, function(){ return '<span style="color: limegreen;">' + RegExp.$1 + '</span>'});
  deco_msg = deco_msg.replace(/(FAILURE)/, function(){ return '<span style="color: red;">' + RegExp.$1 + '</span>'});


  return deco_msg;
};

