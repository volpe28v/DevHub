var app = require('./lib/server');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server,{ 'destroy buffer size': Infinity });
io.set("log level", 1);

var index_socket = require('./lib/index_socket');
index_socket.setup(io);

var program = require('commander');
program
  .version('0.0.3')
  .option('-p, --port <n>', 'port no. default is 3000.')
  .option('-d, --db_name [name]', 'db name. default is "devhub_db".')
  .option('-t, --title_name [name]', 'title name. default is "".')
  .parse(process.argv);

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
app.set('basic_user', process.env.BASIC_AUTH_USER ? process.env.BASIC_AUTH_USER : "");
app.set('basic_pass', process.env.BASIC_AUTH_PASS ? process.env.BASIC_AUTH_PASS : "");
app.set('gridfs', process.env.GRIDFS == "true" ? true : false);
app.set('menu_links', menu_links);

console.log(' port : ' + app.get('port'));
console.log(' db_name : ' + app.get('db_name'));
console.log(' title_name : ' + app.get('title_name'));
console.log(' BASIC_AUTH_USER : ' + app.get('basic_user'));
console.log(' BASIC_AUTH_PASS : ' + app.get('basic_pass'));
console.log(' GRIDFS: ' + app.get('gridfs'));

var client_info = require('./lib/client_info');
client_info.options({
  title: app.get('title_name')
});

// set routing
var routes = {
  index: require('./routes/index'),
  notify: require('./routes/notify'),
  memo: require('./routes/memo'),
  upload : app.get('gridfs') ? require('./routes/upload_db') : require('./routes/upload'),
  blog: require('./routes/blog'),
  calendar: require('./routes/calendar'),
};

app.get('/', function(req,res){ routes.index.get(req,res,app); });
app.get('/notify', function(req, res) { routes.notify.get(req,res,io); });
app.get('/memo', function(req, res) { routes.memo.insert(req,res,io); });
app.get('/memo/body', routes.memo.get);

app.post('/upload', routes.upload.post);
app.get('/upload', routes.upload.get);
app.delete('/upload', routes.upload.delete);
app.get('/uploads/:file', routes.upload.serve);

app.get('/blog', routes.blog.get);
app.get('/blog/body', routes.blog.body);
app.get('/blog/body_search', routes.blog.body_search);
app.get('/blog/body_older', routes.blog.body_older);
app.post('/blog', function(req,res){ routes.blog.post(req,res,io); });
app.delete('/blog', routes.blog.delete);
app.get('/blog/reset_tags', routes.blog.reset_tags);

app.get('/calendar', routes.calendar.get);

// set db and listen app
var chat_log = require('./lib/chat_log');
var text_log = require('./lib/text_log');
var blog = require('./lib/blog');
var tag = require('./lib/tag');

var mongo_builder = require('./lib/mongo_builder');
mongo_builder.ready(app.get('db_name'), function(db){
  chat_log.set_db(db);
  text_log.set_db(db);
  blog.set_db(db);
  tag.set_db(db);
  routes.upload.set_db(db);

  server.listen(app.get('port'));
  console.log("listen!!!");
});

console.log('Server running at http://127.0.0.1:' + app.get('port') + '/');
