var express = require('express');
var path = require('path');
var app = module.exports = express();
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');

// appサーバの設定
app.set('views', path.join(__dirname, '/../views'));
app.set('view engine', 'ejs');
app.set('view options', { layout: false });
app.use(favicon(__dirname + '/../static/favicon.ico'));
//app.use(bodyParser({uploadDir: __dirname + '/../static/uploads'}));
app.use(express.static(__dirname + '/../static'));

// Basic認証
if (process.env.BASIC_AUTH_USER && process.env.BASIC_AUTH_PASS){
  app.use(express.basicAuth(process.env.BASIC_AUTH_USER, process.env.BASIC_AUTH_PASS));
}

