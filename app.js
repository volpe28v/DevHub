var express = require('express');
var program = require('commander');
var app = express.createServer();

program
  .version('0.0.1')
  .option('-p, --port <n>', 'port no. default is 3008.')
  .parse(process.argv);

// 接続ポートを設定
var port = program.port || 3008;

console.log(' port : ' + port);

// appサーバの設定
app.set('view engine', 'ejs');
app.set('view options', { layout: false });
app.set('views', __dirname + '/views');
app.configure(function(){
  app.use(express.static(__dirname + '/static'));
});

app.get('/', function(req, res) {
  console.log('/');
  res.render('index', { locals: { port: port } });
});

app.get('/notify', function(req, res) {
  console.log('/notify');
  var name = "Ext";
  var msg = req.query.msg;
  var data = {name: name, msg: msg };

  io.sockets.emit('message', data);
  add_msg_log(data);
  send_growl_all(data);
  res.end('recved msg: ' + msg);
});

app.listen(port);

// ここから関数定義
var chat_log = [];
var client_info = {};
var text_log = undefined;
var text_logs = [];
var text_log_id = 0;
var io = require('socket.io').listen(app);
var client_max_id = 0;
console.log("listen!!!");

function send_growl(addr, data){
  var msg = "[" + data.name + "] " + data.msg;
  var exec = require('child_process').exec
  var cmd = 'growl -H ' + addr + ' -t "DevHub" -m "' + msg + '" -P growl';

  exec(cmd, {timeout: 1000},
    function(error, stdout, stderr){
    }
  );
};

Array.prototype.uniq = function(){ 
  tmp = {};
  tmp_arr = []; 
  for( var i=0;i<this.length;i++){
    tmp[this[i]] = i;
  } 
  for( i in tmp){
    tmp_arr.push(i);
  } 
  return tmp_arr; 
};

function send_growl_all(data){
  for (var ip in client_info){
    if ( client_info[ip].pomo != true){
      send_growl(ip,data);
    }
  }
};

function send_growl_without(client, data){
  var current_ip = get_client_ip(client)
  for (var ip in client_info){
    if ( ip != current_ip ){
      if ( client_info[ip].pomo != true){
        send_growl(ip,data);
      }
    }
  }
};

function login(login_ip){
  for (var ip in client_info){
    if(ip == login_ip){
      return true;
    }
  }
  
  client_info[login_ip] = 
  {
    name: undefined, 
    pomo_min: 0,
    id: client_max_id
  }
  client_max_id += 1

  return true; 
};

function set_name(client, name){
  if (name == ""){return false;}

  var current_ip = get_client_ip(client)
  if (client_info[current_ip]){
    client_info[current_ip].name = name;
    return true;
  }

  return false;
};
 
function logout(client){
  var logout_ip = get_client_ip(client)

  // ログイン中のログアウトチェック 
  if ( exist_ip_num(client, logout_ip) > 1 ){
    return false;
  }

  delete client_info[logout_ip]

  return true;
};
 
function ip_list(){
  var ip_list = [];
  for (var ip in client_info){
    var name = get_client_vadlid_name(client_info[ip].name , ip)
    ip_list.push(
      {
        name: name, 
        pomo_min: client_info[ip].pomo_min,
        id: client_info[ip].id
      });
  }
  return ip_list;
}

function get_client_vadlid_name(name,ip){
    if ( name != undefined ){ 
      return name
    }else{
      return ip
    }
}
 
function exist_ip_num(client, ip){
  var ip_count = 0;
  for (var key in client.manager.handshaken){
    if ( client.manager.handshaken[key].address.address == ip ){
     ip_count += 1;
    }
  }
  return ip_count;
}

function get_client_info(client){
  var client_ip = get_client_ip(client);
  return client_info[client_ip];
}

function get_client_ip(client){
  return client.handshake.address.address;
}

function get_name_on_client(client){
  var c = get_client_info(client);
  if ( c.name != undefined ){
    return c.name;
  }else{
    return get_client_ip(client);
  }
}

function get_id(client){
  var c = get_client_info(client);
  return c.id
}

function is_pomo_on_client(client){
  var c = get_client_info(client);
  if ( c.pomo == true ){
    return true;
  }else{
    return false;
  }
}

function set_pomo_on_client(client, pomo_flg,timer_id){
  var c = get_client_info(client);
  c.pomo = pomo_flg;
  if (pomo_flg){
    c.pomo_id = timer_id;
    c.pomo_min = 25
  }else{
    clearTimeout(c.pomo_id);
    c.pomo_id = null;
    c.pomo_min = 0
  }
}

function update_pomo_on_client(client, min){
  var c = get_client_info(client);
  return c.pomo_min -= min
}

function add_msg_log(data){
  chat_log.push(data)
  if (chat_log.length > 100){
    chat_log.shift();
  }
}

function add_text_log(current_log){
  if (can_add_text_log(current_log)){
    add_text_log_impl(text_log)
    text_log = current_log
    console.log("add_text_log is true")
    return true
  }else{
    text_log = current_log
    return false
  }
}
 
function can_add_text_log(current_log){
  if (text_log == undefined ){ return false }
  // 同ユーザの書き込みであれば保留
  if (text_log.name == current_log.name ){ return false }

  // バックアップ対象が空文字と改行のみの場合は排除
  var blank = new RegExp("(^[ \r\n]+$|^$)");
  if (blank.test(text_log.text)) { return false }

  // 前回のバックアップと同様であれば保留
  if (text_logs.length > 0 && text_logs[0].text == text_log.text ){ return false }

  return true
}

function add_text_log_on_suspend(name){
  if (can_add_text_log_on_suspend(name)){
    add_text_log_impl(text_log)
    console.log("add_text_log_on_suspend is true")
    return true
  }else{
    return false
  }
}

function can_add_text_log_on_suspend(name){
  if (text_log == undefined){ return false }
  if (text_log.name != name ){ return false }

  // バックアップ対象が空文字と改行のみの場合は排除
  var blank = new RegExp("(^[ \r\n]+$|^$)");
  if (blank.test(text_log.text)) { return false }

  // 前回のバックアップと同様であれば保留
  if (text_logs.length > 0 && text_logs[0].text != text_log.text ){ return true }
  if (text_logs.length == 0){ return true }

  return false;
}

function add_text_log_impl(text_log){
  text_log.id = text_log_id;
  text_log_id += 1;
  text_logs.unshift(text_log)
  if (text_logs.length > 20){
    text_logs.pop();
  }
}

function remove_text_log(id){
  for ( var i = 0; i < text_logs.length; ++i){
    if ( text_logs[i].id == id ){
      text_logs.splice(i,1);
      console.log("removed id: ", id)
      return;
    }
  }
}

function is_change_textlog(msg){
  if (text_log == undefined){ return true;}
  if (text_log.text != msg){ return true;}

  return false;
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

io.sockets.on('connection', function(client) {
  var client_ip = get_client_ip(client);
  console.log("New Connection from " + client_ip);

  login(client_ip);

  if ( text_log != undefined ){
    client.emit('text',text_log);
    client.emit('text_logs', text_logs);
  }

  client.on('name', function(data) {
    set_name(client, data.name);

    client.emit('list', ip_list());
    client.broadcast.emit('list', ip_list());

    if (chat_log.length > 0 ){
      client.emit('latest_log',chat_log);
    }
  });
 
  client.on('message', function(data) {
    set_name(client, data.name);

    client.emit('list', ip_list());
    client.broadcast.emit('list', ip_list());

    client.emit('message', data);
    client.broadcast.emit('message', data);

    add_msg_log(data)
    send_growl_without(client, data);
  });

  client.on('pomo', function(pomo_data){
    set_name(client, pomo_data.name);
    var pomo_msg = ""
    if ( pomo_data.msg != "" ){
      pomo_msg = '"' + pomo_data.msg + '"'
    }

    if ( is_pomo_on_client(client) ){
      var data = {name: "Pomo", msg: get_name_on_client(client) + ' がポモドーロを中止しました。' + pomo_msg};
      set_pomo_on_client(client,false);

      client.emit('message', data);
      client.broadcast.emit('message', data);
      send_growl_without(client, data);

      client.emit('list', ip_list());
      client.broadcast.emit('list', ip_list());
    }else{
      var data = {name: "Pomo", msg: get_name_on_client(client) + ' がポモドーロを開始しました。' + pomo_msg};
      client.emit('message', data);
      client.broadcast.emit('message', data);
      send_growl_without(client, data);

      var timer_id = setInterval(function(){
        var current_min = update_pomo_on_client(client, 1);
        //console.log( "current pomo: " + current_min );

        if (current_min <= 0 ){
          var data = {name: "Pomo", msg: get_name_on_client(client) + " のポモドーロが終了しました。"};
          set_pomo_on_client(client,false);
          client.emit('message', data);
          client.broadcast.emit('message', data);
          send_growl_all(data);
        }

        client.emit('list', ip_list());
        client.broadcast.emit('list', ip_list());
      }, 1 * 60000);
      set_pomo_on_client(client,true,timer_id);
      client.emit('list', ip_list());
      client.broadcast.emit('list', ip_list());
    }
  });

  client.on('text', function(msg) {
    var name = get_name_on_client(client)
    var now = new Date();
    msg = msg.replace(/\n/g,"\r\n");

    console.log(msg);

    if ( is_change_textlog(msg) == false ){ return;}

    var current_text_log = { name: name, text: msg, date: getFullDate(now) }

    client.emit('text', current_text_log);
    client.broadcast.emit('text', current_text_log);

    if ( add_text_log(current_text_log) ){
      client.emit('text_logs', text_logs);
      client.broadcast.emit('text_logs', text_logs);
    }
      
  });

  client.on('suspend_text', function() {
    var name = get_name_on_client(client)

    if ( add_text_log_on_suspend(name) ){
      client.emit('text_logs', text_logs);
      client.broadcast.emit('text_logs', text_logs);
    }
    console.log("suspend_text");
  });

  client.on('remove_text', function(id) {
    remove_text_log(id)

    client.broadcast.emit('text_logs', text_logs);

    console.log("remove_text");
  });


  client.on('disconnect', function() {
    set_pomo_on_client(client,false);
    var client_addr = get_client_ip(client);

    if( logout(client) ){
      client.broadcast.emit('list', ip_list());
    }

    console.log('disconnect:' + get_client_ip(client));
  });
});

console.log('Server running at http://127.0.0.1:' + port + '/');

