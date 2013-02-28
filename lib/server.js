var express = require('express');
var app = module.exports = express.createServer();

// appサーバの設定
app.set('view engine', 'ejs');
app.set('view options', { layout: false });
app.configure(function(){
  app.use(express.static(__dirname + '/../static'));
  app.use(express.bodyParser());
});

