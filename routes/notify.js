var chat_log = require('../lib/chat_log');
var bots = require('../lib/bots');
var client_info = require('../lib/client_info');
var util = require('../lib/util');

exports.get = function(req, res, io) {
  console.log('/notify');
  var name = unescape(req.query.name);
  var msg = unescape(req.query.msg);
  var avatar = req.query.avatar != undefined ? unescape(req.query.avatar) : null;
  var room_id = req.query.room_id != undefined ? req.query.room_id : 1;
  var data = {name: name, msg: msg, avatar: avatar, room_id: room_id, date: util.getFullDate(new Date()), ext: true};

  // 内容が無いものはスルー
  if (name == "" || msg == ""){ return; }

  chat_log.add(data,function(){
    io.sockets.emit('message' + room_id, data);
    client_info.send_growl_all(data);
    res.end('received msg');
  });

  // for bot
  bots.action(data, function(reply){
    setTimeout(function(){
      reply.date = util.getFullDate(new Date());
      chat_log.add(reply);
      io.sockets.emit('message' + room_id, reply);
      client_info.send_growl_all(reply);
    },reply.interval * 1000);
  });

}
