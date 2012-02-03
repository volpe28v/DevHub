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

  socket.on('list', function(msg) {
    $('#login_list').text(msg);
  });

  socket.on('latest_log', function(msgs) {
    for ( var i = 0 ; i < msgs.length; i++){
      append_msg_without_date(msgs[i])
    }
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


  // for editor
  socket.on('text', function(msg) {
    //console.log('text recv');
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
};

function append_msg_without_date(data){
  var date = new Date();
  var id = date.getTime();

  $('#list').prepend($('<li id="' + id + '" style="display:none">' + get_msg_body(data) + '</li>'));

  $('#' + id).fadeIn('slow');
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
  }

  return '<span style="color: ' + name_color + ';">[' + data.name + ']</span> <span style="color: ' + msg_color + ';">' + decorate_msg(data.msg) + '</span>';
};

function decorate_msg(msg){
  var deco_msg = msg.replace(/((https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+))/g,function(){ return '<a href="' + RegExp.$1 + '" target="_blank" >' + RegExp.$1 + '</a>' });

  deco_msg = deco_msg.replace(/(SUCCESS)/, function(){ return '<span style="color: limegreen">' + RegExp.$1 + '</span>'});
  deco_msg = deco_msg.replace(/(FAILURE)/, function(){ return '<span style="color: red">' + RegExp.$1 + '</span>'});
  return deco_msg;
};

