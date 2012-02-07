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
  res.render('editor', { locals: { port: port } });
});

app.get('/editor', function(req, res) {
  console.log('/editor');
  res.render('editor', { locals: { port: port } });
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

var chat_log = [];
var client_info = [];
var text_log = "";
var io = require('socket.io').listen(app);
console.log("listen!!!");

function send_growl(addr, data){
  var msg = "[" + data.name + "] " + data.msg;
  var exec = require('child_process').exec
  var cmd = 'growl -H ' + addr + ' -t "Dev Hub" -m "' + msg + '" -P growl';

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
  for ( var i = 0; i < client_info.length; i++){
    if ( client_info[i].pomo != true){
      send_growl(client_info[i].ip,data);
    }
  }
};

function login(ip){
  for(var i = 0; i < client_info.length; i++){
    if(client_info[i].ip == ip){
      return true;
    }
  }
  
  client_info.push({ip: ip, name: "unknown"})
  return true; 
};

function set_name(client, name){
  for(var i = 0; i < client_info.length; i++){
    if(client_info[i].ip == client.handshake.address.address ){
      client_info[i].name = name;
      return true;
    }
  }
  
  return false; 
};
 
function logout(client, ip){
  // ログイン中のログアウトチェック 
  if ( exist_ip_num(client, ip) > 1 ){
    return false;
  }

  for(var i = 0; i < client_info.length; i++){
    if(client_info[i].ip == ip){
      client_info.splice(i,1);
      return true;
    }
  }

  return false;
};
 
function ip_list(){
  var ip_list = "";
  for(var i = 0; i < client_info.length; i++){
    if ( client_info[i].name != "unknown" ){ 
      ip_list += "[" + client_info[i].name + "] ";
    }else{
      ip_list += "[" + client_info[i].ip + "] ";
    }
  }
  return ip_list;
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
  var client_addr = client.handshake.address.address;
  for(var i = 0; i < client_info.length; i++){
    if ( client_info[i].ip == client_addr ){ 
      return client_info[i];
    }
  }
  return null;
}

function get_name_on_client(client){
  var c = get_client_info(client);
  if ( c.name != 'unknown' ){
    return c.name;
  }else{
    return c.ip;
  }
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
  }else{
    clearTimeout(c.pomo_id);
    c.pomo_id = null;
  }
}


function add_msg_log(data){
  chat_log.push(data)
  if (chat_log.length > 100){
    chat_log.shift();
  }
}
 
io.sockets.on('connection', function(client) {
  console.log("connection!!!");
  var client_addr = client.handshake.address;
  login(client_addr.address);

  console.log("New Connection from " + client_addr.address);

  if (chat_log.length > 0 ){
    client.emit('latest_log',chat_log);
  }
  client.emit('list', ip_list());
  client.broadcast.emit('list', ip_list());

  client.emit('text',text_log);
  client.emit('message', {name:"System", msg: "you join in  : " + client_addr.address });

  if ( exist_ip_num(client, client_addr.address) <= 1 ){
    client.broadcast.emit('message', {name:"System", msg: "in  : " + client_addr.address });
  }

  client.on('message', function(data) {
    client.emit('message', data);
    client.broadcast.emit('message', data);

    set_name(client, data.name);
    client.emit('list', ip_list());
    client.broadcast.emit('list', ip_list());

    add_msg_log(data)
    send_growl_all(data);
  });

  client.on('pomo', function(){
    if ( is_pomo_on_client(client) ){
      var data = {name: "Pomo", msg: get_name_on_client(client) + " がポモドーロを中止しました。"};
      set_pomo_on_client(client,false);

      client.emit('message', data);
      client.broadcast.emit('message', data);
      send_growl_all(data);
    }else{
      var data = {name: "Pomo", msg: get_name_on_client(client) + " がポモドーロを開始しました。(残り25分)"};
      client.emit('message', data);
      client.broadcast.emit('message', data);
      send_growl_all(data);

      var timer_id = setTimeout(function(){
      var data = {name: "Pomo", msg: get_name_on_client(client) + " のポモドーロが終了しました。"};
        set_pomo_on_client(client,false);
        client.emit('message', data);
        client.broadcast.emit('message', data);
        send_growl_all(data);
      }, 25 * 60000);
      set_pomo_on_client(client,true,timer_id);
    }
  });

  client.on('text', function(msg) {
    msg = msg.replace(/\n/g,"\r\n");
    text_log = msg;
    console.log(msg);
    client.emit('text',msg);
    client.broadcast.emit('text', msg);
  });

  client.on('disconnect', function() {
    var client_addr = client.handshake.address;

    if( logout(client, client_addr.address) ){
      client.broadcast.emit('message', {name:"System", msg: "out : " + client_addr.address });
      client.broadcast.emit('list', ip_list());
    }

    console.log('disconnect:' + client_addr.address);
  });
});

console.log('Server running at http://127.0.0.1:' + port + '/');

