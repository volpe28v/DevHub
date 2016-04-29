var text_log = require('../lib/text_log');
var util = require('../lib/util');

exports.insert = function(req, res, io) {
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
}

exports.get = function(req, res) {
  console.log('/memo/body');
  var id = req.query.id;

  text_log.get(id,function(text_log){
    res.send(text_log);
  });
}
