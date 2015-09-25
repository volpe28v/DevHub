var chat_log = require('../lib/chat_log');
var bots = require('../lib/bots');
var client_info = require('../lib/client_info');
var util = require('../lib/util');

exports.get = function(req, res, io) {
  console.log('/notify');
  var data = {
    name: unescape(req.query.name),
    msg: unescape(req.query.msg),
    avatar: req.query.avatar != undefined ? unescape(req.query.avatar) : null,
    room_id: req.query.room_id != undefined ? Number(req.query.room_id) : 1,
    date: util.getFullDate(new Date()),
    ext: true
  };

  // 内容が無いものはスルー
  if (data.name == "" || data.msg == ""){ return; }

  chat_log.add(data,function(){
    io.sockets.emit('message' + data.room_id, data);
    res.end('received msg');
  });

  // for bot
  bots.action(data, function(reply){
    setTimeout(function(){
      reply.date = util.getFullDate(new Date());
      chat_log.add(reply);
      io.sockets.emit('message' + data.room_id, reply);
    },reply.interval * 1000);
  });

}
