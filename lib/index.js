var express = require('express');
var app = module.exports = express.createServer();

// appサーバの設定
app.set('view engine', 'ejs');
app.set('view options', { layout: false });
app.configure(function(){
  app.use(express.static(__dirname + '/../static'));
});

app.get('/', function(req, res) {
  console.log('/');
  res.render('index');
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


