var program = require('commander');

// require my libs
var mongo_builder = require('./lib/mongo_builder');
var app = require('./lib/server');
var chat_log = require('./lib/chat_log');
var text_log = require('./lib/text_log');
var client_info = require('./lib/client_info');
var util = require('./lib/util');
var bots = require('./lib/bots');
var http = require('http');

var server = http.createServer(app);
var io = require('socket.io').listen(server);
io.set("log level", 1);

program
  .version('0.0.3')
  .option('-p, --port <n>', 'port no. default is 3008.')
  .option('-d, --db_name [name]', 'db name. default is "devhub_db".')
  .option('-t, --title_name [name]', 'title name. default is "".')
  .option('NODE_DEVHUB_USER', 'user name of basic authentication. define with env.')
  .option('NODE_DEVHUB_PASS', 'password of basic authentication. define with env.')
  .parse(process.argv);

// load settings.json
var settings = {};
try{
  settings = require('./settings.json');
}catch(e){
  // ファイルが無ければ設定はデフォルト
}

var menu_links = [];
try{
  // メニューにリンクを表示したい場合は以下のファイルに json で記載
  // [{"name": "Google", "url": "https://www.google.co.jp/"}]
  menu_links = require('./lib/menu_links.json');
}catch(e){
  // ファイルが無ければメニューリンクなし
}

app.set('port', program.port || process.env.PORT || 3000);
app.set('db_name', program.db_name || 'devhub_db');
app.set('title_name', program.title_name ? "for " + program.title_name : "");
app.set('basic_user', process.env.NODE_DEVHUB_USER ? process.env.NODE_DEVHUB_USER : "");
app.set('basic_pass', process.env.NODE_DEVHUB_PASS ? process.env.NODE_DEVHUB_PASS : "");
app.set('growl', settings.growl == undefined ? true : settings.growl);
app.set('menu_links', menu_links);

console.log(' port : ' + app.get('port'));
console.log(' db_name : ' + app.get('db_name'));
console.log(' title_name : ' + app.get('title_name'));
console.log(' growl: ' +  app.get('growl'));
console.log(' NODE_DEVHUB_USER : ' + app.get('basic_user'));
console.log(' NODE_DEVHUB_PASS : ' + app.get('basic_pass'));

client_info.options({
  title: app.get('title_name'),
  growl: app.get('growl')
});

// set routing
app.get('/', function(req, res) {
  console.log('/');

  res.render('index',{
    locals:{
      title_name: app.get('title_name'),
      menu_links: app.get('menu_links')
    }
  });
});

app.get('/notify', function(req, res) {
  console.log('/notify');
  var name = unescape(req.query.name);
  var msg = unescape(req.query.msg);
  var avatar = unescape(req.query.avatar);
  var data = {name: name, msg: msg, avatar: avatar, date: util.getFullDate(new Date()), ext: true};

  // 内容が無いものはスルー
  if (name == "" || msg == ""){ return; }

  chat_log.add(data,function(){
    io.sockets.emit('message', data);
    client_info.send_growl_all(data);
    res.end('received msg');
  });

  // for bot
  bots.action(data, function(reply){
    setTimeout(function(){
      reply.date = util.getFullDate(new Date());
      chat_log.add(reply);
      io.sockets.emit('message', reply);
      client_info.send_growl_all(reply);
    },reply.interval * 1000);
  });
});

app.get('/memo', function(req, res) {
  console.log('/memo');
  console.log(req.query);

  var data = {
    name: unescape(req.query.name),
    text: unescape(req.query.msg),
    no: Number(req.query.no || 1),
    line: Number(req.query.line || 0),
    date: util.getFullDate(new Date())
  };

  text_log.insert_latest_text(data,function(latest_log){
    io.sockets.emit('text', latest_log);
    text_log.add_history(latest_log.no, function(result){
      text_log.get_logs_by_no(latest_log.no, function(logs){
        io.sockets.emit('text_logs_with_no', logs);
      });
    });
  });

  res.end('received memo');
});

var routes = {
  upload : require('./routes/upload'),
  blog: require('./routes/blog'),
};
app.post('/upload', routes.upload.post);
app.get('/upload', routes.upload.get);
app.delete('/upload', routes.upload.delete);

app.get('/blog', routes.blog.get);
app.get('/blog/body', routes.blog.body);
app.get('/blog/body_search', routes.blog.body_search);
app.get('/blog/body_older', routes.blog.body_older);
app.post('/blog', routes.blog.post);
app.delete('/blog', routes.blog.delete);

// set db and listen app
mongo_builder.ready(app.get('db_name'), function(db){
  chat_log.set_db(db);
  text_log.set_db(db);
  bots.set(chat_log,text_log);
  routes.blog.set_db(db);

  server.listen(app.get('port'));
  console.log("listen!!!");
});

// define socket.io events
io.sockets.on('connection', function(client) {
  var client_ip = client_info.get_ip(client);
  console.log("New Connection from " + client_ip);

  client_info.login(client_ip);

  text_log.get_active_number(function(number){
    client.emit('memo_number',number);
    for( var i = 1; i <= number.num; i++){
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

  client.on('name', function(data) {
    client_info.set_name(client, data);
    if (data.name == null || data.name == ""){
      client.emit('set_name', client_info.get_name(client));
    }

    var list = client_info.list();
    client.emit('list', list);
    client.broadcast.emit('list', list);

    chat_log.size(function(size){
      if ( size > 0 ){
        chat_log.get(function(logs){
          client.emit('latest_log',logs);
        });
      }else{
        client.emit('latest_log',[]);
      }
    });
  });

  client.on('message', function(data) {
    client_info.set_name(client, data);

    data.date = util.getFullDate(new Date());

    client.emit('list', client_info.list());
    client.broadcast.emit('list', client_info.list());

    chat_log.add(data);
    client.emit('message_own', data);
    client.broadcast.emit('message', data);
    client_info.send_growl_without(client, data);

    // for bot
    bots.action(data, function(reply){
      setTimeout(function(){
        reply.date = util.getFullDate(new Date());
        chat_log.add(reply);
        client.emit('message_own', reply);
        client.broadcast.emit('message', reply);
        client_info.send_growl_without(client, reply);
      },reply.interval * 1000);
    });
  });

  client.on('remove_message', function(data) {
    client.broadcast.emit('remove_message', data);
    chat_log.remove(data.id);
  });

  client.on('load_log_more', function(data) {
    chat_log.get_older(data.id, function(logs){
      client.emit('latest_log',logs);
    });
  });

  client.on('pomo', function(pomo_data){
    client_info.set_name(client, pomo_data);
    var pomo_msg = ""
    if ( pomo_data.msg != "" ){
      pomo_msg = '「' + pomo_data.msg + '」'
    }

    if ( client_info.is_pomo(client) ){
      client_info.set_pomo(client,false);
    }else{
      client_info.set_pomo(client,true,setInterval(function(){
        var current_min = client_info.update_pomo(client, 1);

        if (current_min <= 0 ){
          var data = {name: "Pomo", date: util.getFullDate(new Date()), msg: client_info.get_name(client) + "さんのポモドーロが終了しました。"};
          client_info.set_pomo(client,false);
          client_info.send_growl_to(client,data);
        }

        client.emit('list', client_info.list());
        client.broadcast.emit('list', client_info.list());
      }, 1 * 60000));
    }

    client.emit('list', client_info.list());
    client.broadcast.emit('list', client_info.list());
  });

  client.on('text', function(msg) {
    var name = client_info.get_name(client)
    msg.text = msg.text.replace(/\n/g,"\r\n");

    // [ref]が存在したらIDを追加する
    var ref_count = 0;
    msg.text = msg.text.replace(/\[ref\]/g,
      function(){
        return "[ref:" + String(msg.no) + "-" + new Date().getTime() + String(ref_count++) + "]";
      });

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

  client.on('memo_number', function(data) {
    client.emit('memo_number', data);
    client.broadcast.emit('memo_number', data);
    text_log.update_active_number(data);
  });

  client.on('disconnect', function() {
    client_info.set_pomo(client,false);
    var client_addr = client_info.get_ip(client);

    if( client_info.logout(client) ){
      client.broadcast.emit('list', client_info.list());
    }

    console.log('disconnect:' + client_info.get_ip(client));
  });
});

console.log('Server running at http://127.0.0.1:' + app.get('port') + '/');

