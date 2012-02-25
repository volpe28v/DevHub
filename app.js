var program = require('commander');
var app = require('./lib/index');

program
  .version('0.0.1')
  .option('-p, --port <n>', 'port no. default is 3008.')
  .parse(process.argv);

// 接続ポートを設定
var port = program.port || process.env.PORT || 3000;

console.log(' port : ' + port);

app.listen(port);

var chat_log = require('./lib/chat_log');
var text_log = require('./lib/text_log');
var client_info = require('./lib/client_info');

var io = require('socket.io').listen(app);
console.log("listen!!!");

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
  var client_ip = client_info.get_ip(client);
  console.log("New Connection from " + client_ip);

  client_info.login(client_ip);

  if ( !text_log.empty() ){
    client.emit('text',text_log.get_latest());
    client.emit('text_logs', text_log.get_logs());
  }

  client.on('name', function(data) {
    client_info.set_name(client, data.name);

    client.emit('list', client_info.ip_list());
    client.broadcast.emit('list', client_info.ip_list());

    if (chat_log.size() > 0 ){
      client.emit('latest_log',chat_log.get());
    }
  });
 
  client.on('message', function(data) {
    client_info.set_name(client, data.name);

    var now = new Date();
    data.date = getFullDate(now);

    client.emit('list', client_info.ip_list());
    client.broadcast.emit('list', client_info.ip_list());

    client.emit('message', data);
    client.broadcast.emit('message', data);

    chat_log.add(data)
    client_info.send_growl_without(client, data);
  });

  client.on('pomo', function(pomo_data){
    client_info.set_name(client, pomo_data.name);
    var pomo_msg = ""
    if ( pomo_data.msg != "" ){
      pomo_msg = '「' + pomo_data.msg + '」'
    }

    var now = new Date();
    var data = {name: "Pomo", date: getFullDate(now)};
    if ( client_info.is_pomo(client) ){
      data.msg = client_info.get_name(client) + ' がポモドーロを中止しました。' + pomo_msg;
      client_info.set_pomo(client,false);
    }else{
      data.msg = client_info.get_name(client) + ' がポモドーロを開始しました。' + pomo_msg;

      client_info.set_pomo(client,true, setInterval(function(){
        var current_min = client_info.update_pomo(client, 1);

        if (current_min <= 0 ){
          var now = new Date();
          var data = {name: "Pomo", date: getFullDate(now), msg: client_info.get_name(client) + " のポモドーロが終了しました。"};
          client_info.set_pomo(client,false);
          client.emit('message', data);
          client.broadcast.emit('message', data);
          client_info.send_growl_all(data);
        }

        client.emit('list', client_info.ip_list());
        client.broadcast.emit('list', client_info.ip_list());
      }, 1 * 60000));
    }
    client.emit('message', data);
    client.broadcast.emit('message', data);
    client_info.send_growl_without(client, data);

    client.emit('list', client_info.ip_list());
    client.broadcast.emit('list', client_info.ip_list());
 
  });

  client.on('text', function(msg) {
    var name = client_info.get_name(client)
    var now = new Date();
    msg = msg.replace(/\n/g,"\r\n");

    console.log(msg);

    if ( text_log.is_change(msg) == false ){ return;}

    var current_text_log = { name: name, text: msg, date: getFullDate(now) }

    client.emit('text', current_text_log);
    client.broadcast.emit('text', current_text_log);

    if ( text_log.add(current_text_log) ){
      client.emit('text_logs', text_log.get_logs());
      client.broadcast.emit('text_logs', text_log.get_logs());
    }
  });

  client.on('suspend_text', function() {
    var name = client_info.get_name(client)

    if ( text_log.add_on_suspend(name) ){
      client.emit('text_logs', text_log.get_logs());
      client.broadcast.emit('text_logs', text_log.get_logs());
    }
    console.log("suspend_text");
  });

  client.on('remove_text', function(id) {
    text_log.remove(id)

    client.broadcast.emit('text_logs', text_log.get_logs());

    console.log("remove_text");
  });

  client.on('disconnect', function() {
    client_info.set_pomo(client,false);
    var client_addr = client_info.get_ip(client);

    if( client_info.logout(client) ){
      client.broadcast.emit('list', client_info.ip_list());
    }

    console.log('disconnect:' + client_info.get_ip(client));
  });
});

console.log('Server running at http://127.0.0.1:' + port + '/');

