var program = require('commander');

// require my libs
var mongo_builder = require('./lib/mongo_builder'); 
var app = require('./lib/index');
var chat_log = require('./lib/chat_log');
var text_log = require('./lib/text_log');
var client_info = require('./lib/client_info');
var util = require('./lib/util');

var io = require('socket.io').listen(app);

program
  .version('0.0.1')
  .option('-p, --port <n>', 'port no. default is 3008.')
  .parse(process.argv);

var port = program.port || process.env.PORT || 3000;
console.log(' port : ' + port);

// set routing
app.get('/', function(req, res) {
  console.log('/');
  res.render('index');
});

app.get('/notify', function(req, res) {
  console.log('/notify');
  var name = "Ext";
  var msg = req.query.msg;
  var data = {name: name, msg: msg, date: util.getFullDate(new Date()) };

  io.sockets.emit('message', data);
  chat_log.add(data);
  client_info.send_growl_all(data);
  res.end('recved msg: ' + msg);
});

// set db and listen app
mongo_builder.ready(function(db){
  chat_log.set_db(db);
  text_log.set_db(db);
  app.listen(port);
  console.log("listen!!!");
});

// define socket.io events
io.sockets.on('connection', function(client) {
  var client_ip = client_info.get_ip(client);
  console.log("New Connection from " + client_ip);

  client_info.login(client_ip);

  text_log.get_latest(function(latest_text){
    if (latest_text != ""){
      client.emit('text',latest_text);
    }
  });

  text_log.get_logs(function(logs){
    client.emit('text_logs', logs);
  });

  text_log.get_favo_logs(function(logs){
    client.emit('favo_logs', logs);
  });

  client.on('name', function(data) {
    client_info.set_name(client, data.name);

    client.emit('list', client_info.ip_list());
    client.broadcast.emit('list', client_info.ip_list());

    chat_log.size(function(size){
      if ( size > 0 ){
        chat_log.get(function(logs){
          client.emit('latest_log',logs);
        });
      }
    });
  });
 
  client.on('message', function(data) {
    client_info.set_name(client, data.name);

    data.date = util.getFullDate(new Date());

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

    var data = {name: "Pomo", date: util.getFullDate(new Date())};
    if ( client_info.is_pomo(client) ){
      data.msg = client_info.get_name(client) + ' がポモドーロを中止しました。' + pomo_msg;
      client_info.set_pomo(client,false);
    }else{
      data.msg = client_info.get_name(client) + ' がポモドーロを開始しました。' + pomo_msg;

      client_info.set_pomo(client,true, setInterval(function(){
        var current_min = client_info.update_pomo(client, 1);

        if (current_min <= 0 ){
          var data = {name: "Pomo", date: util.getFullDate(new Date()), msg: client_info.get_name(client) + " のポモドーロが終了しました。"};
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
    msg = msg.replace(/\n/g,"\r\n");

    console.log(msg);

    if ( text_log.is_change(msg) == false ){ return;}

    var current_text_log = { name: name, text: msg, date: util.getFullDate(new Date()) }

    client.emit('text', current_text_log);
    client.broadcast.emit('text', current_text_log);

    text_log.add(current_text_log, function(result){
      if ( result ){
        text_log.get_logs(function(logs){
          client.emit('text_logs', logs);
          client.broadcast.emit('text_logs', logs);
        });
      }
    });
  });

  client.on('suspend_text', function() {
    var name = client_info.get_name(client)

    text_log.add_on_suspend(name,function(result){
      if ( result ){
        text_log.get_logs(function(logs){
          client.emit('text_logs', logs);
          client.broadcast.emit('text_logs', logs);
        });
      }
      console.log("suspend_text");
    });
  });

  client.on('remove_text', function(id) {
    text_log.remove(id,function(){
      text_log.get_logs(function(logs){
        client.broadcast.emit('text_logs', logs);
      });

      text_log.get_favo_logs(function(logs){
        client.emit('favo_logs', logs);
        client.broadcast.emit('favo_logs', logs);
      });
    });

    console.log("remove_text");
  });

  client.on('add_favo_text', function(id) {
    text_log.add_favo(id,function(){
      text_log.get_logs(function(logs){
        client.broadcast.emit('text_logs', logs);
      });

      text_log.get_favo_logs(function(logs){
        client.emit('favo_logs', logs);
        client.broadcast.emit('favo_logs', logs);
      });
    });

    console.log("add_favo_text: " + id );
  });

  client.on('remove_favo_text', function(id) {
    text_log.remove_favo(id,function(){

      text_log.get_logs(function(logs){
        client.emit('text_logs', logs);
        client.broadcast.emit('text_logs', logs);
      });

      text_log.get_favo_logs(function(logs){
        client.emit('favo_logs', logs);
        client.broadcast.emit('favo_logs', logs);
      });
    });

    console.log("remove_favo_text: " + id );
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

