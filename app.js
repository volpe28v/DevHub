var program = require('commander');

// require my libs
var mongo_builder = require('./lib/mongo_builder'); 
var app = require('./lib/server');
var chat_log = require('./lib/chat_log');
var text_log = require('./lib/text_log');
var client_info = require('./lib/client_info');
var util = require('./lib/util');

var io = require('socket.io').listen(app);

program
  .version('0.0.2')
  .option('-p, --port <n>', 'port no. default is 3008.')
  .option('-d, --db_name [name]', 'db name. default is "devhub_db".')
  .option('-t, --title_name [name]', 'title name. default is "".')
  .parse(process.argv);

var port = program.port || process.env.PORT || 3000;
console.log(' port : ' + port);

var db_name = program.db_name || 'devhub_db';
console.log(' db_name : ' + db_name);

var title_name = program.title_name ? "for " + program.title_name : "";
console.log(' title_name : ' + title_name);

client_info.set_optional_title( title_name );

// set routing
app.get('/', function(req, res) {
  console.log('/');
  res.render('index',{locals:{title_name:title_name}});
});

app.get('/mobile', function(req, res) {
  console.log('/mobile');
  res.render('index_mobile',{locals:{title_name:title_name}});
});

app.get('/notify', function(req, res) {
  console.log('/notify');
  console.log(req.query);
  var name = decodeURI(req.query.name);
  var msg = decodeURI(req.query.msg);
  var data = {name: name, msg: msg, date: util.getFullDate(new Date()), ext: true};

  chat_log.add(data,function(){
    io.sockets.emit('message', data);
    client_info.send_growl_all(data);
    res.end('recved msg: ' + msg);
  });
});

app.post('/notify_memo', function(req, res) {
  console.log('/notify_memo');
  var name = req.body.name;
  var msg = req.body.msg;
  console.log(name, msg);

  if ( text_log.is_change(msg) == false ){
      res.json({result: "success"});
      return;
  }
  var current_text_log = { name: name, text: msg, date: util.getFullDate(new Date()) }
  io.sockets.emit('text', current_text_log);

  text_log.add(current_text_log, function(result){
    if ( result ){
      text_log.get_logs(function(logs){
        io.sockets.emit('text_logs', logs);
      });
    }
  });
  res.json({result: "success"});
});

// set db and listen app
mongo_builder.ready(db_name, function(db){
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

  text_log.get_active_number(function(number){
    client.emit('memo_number',number);
    for( var i = 0; i < number.num; i++){
      text_log.get_logs_by_no(i, function(logs){
        client.emit('text_logs_with_no', logs);
      });
    }
  });

  text_log.get_latest(function(latest_texts){
    console.log("latest_text: " + latest_texts.length);
    var length = latest_texts.length;
    for( var i = 0; i < length; i++){
      client.emit('text',latest_texts[i]);
    }
  });

//  text_log.get_logs(function(logs){
//    client.emit('text_logs', logs);
//  });

//  text_log.get_favo_logs(function(logs){
//    client.emit('favo_logs', logs);
//  });

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

    chat_log.add(data,function(){
      client.emit('message_own', data);
      client.broadcast.emit('message', data);
    });

    client_info.send_growl_without(client, data);
  });

  client.on('remove_message', function(data) {
    client.broadcast.emit('remove_message', data);
    chat_log.remove(data.id);
  });

  client.on('pomo', function(pomo_data){
    client_info.set_name(client, pomo_data.name);
    var pomo_msg = ""
    if ( pomo_data.msg != "" ){
      pomo_msg = '「' + pomo_data.msg + '」'
    }

    var data = {name: "Pomo", date: util.getFullDate(new Date())};
    if ( client_info.is_pomo(client) ){
      data.msg = client_info.get_name(client) + 'さん がポモドーロを中止しました。' + pomo_msg;
      client_info.set_pomo(client,false);
    }else{
      data.msg = client_info.get_name(client) + 'さん がポモドーロを開始しました。' + pomo_msg;

      client_info.set_pomo(client,true, setInterval(function(){
        var current_min = client_info.update_pomo(client, 1);

        if (current_min <= 0 ){
          var data = {name: "Pomo", date: util.getFullDate(new Date()), msg: client_info.get_name(client) + "さんのポモドーロが終了しました。"};
          client_info.set_pomo(client,false);
          chat_log.add(data,function(){
            client.emit('message', data);
            client.broadcast.emit('message', data);
            client_info.send_growl_all(data);
          });
        }

        client.emit('list', client_info.ip_list());
        client.broadcast.emit('list', client_info.ip_list());
      }, 1 * 60000));
    }
    chat_log.add(data,function(){
      client.emit('message', data);
      client.broadcast.emit('message', data);
      client_info.send_growl_without(client, data);

      client.emit('list', client_info.ip_list());
      client.broadcast.emit('list', client_info.ip_list());
    });
  });

  client.on('text', function(msg) {
    var name = client_info.get_name(client)
    msg.text = msg.text.replace(/\n/g,"\r\n");

    if ( text_log.is_change(msg) == false ){ return;}

    var current_text_log = { name: name, no: msg.no, text: msg.text, date: util.getFullDate(new Date()) }

    client.emit('text', current_text_log);
    client.broadcast.emit('text', current_text_log);

    text_log.update_latest_text(current_text_log);
  });

  client.on('add_history', function(msg) {
    text_log.add_history(msg.no, function(result){
      text_log.get_logs_by_no(msg.no, function(logs){
        client.emit('text_logs_with_no', logs);
        client.broadcast.emit('text_logs_with_no', logs);
      });
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

  client.on('memo_number', function(data) {
    client.emit('memo_number', data);
    client.broadcast.emit('memo_number', data);
    text_log.update_active_number(data);
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

