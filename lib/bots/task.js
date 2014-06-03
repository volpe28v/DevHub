var util = require('../util');
module.exports.action = function(data, callback){
  if (data.msg.match(/task( \d+)?/i)){
    data.text_log.get_uncheck_tasks(RegExp.$1, function(tasks){
      var msg = "";
      if (tasks.length != 0){
        var task = util.getRandom(tasks);
        msg = "「" + task.title + "」の「" + task.text + "」が未完了ですよ。残り" + tasks.length + "つ";
      }else{
        msg = "未完了タスクはありません";
      }

      // リプライを生成
      var reply = {
        name: "Task",
        msg: "@" + data.name + "さん " + msg,
        interval: 2
      };

      // リプライ実行
      callback(reply);
    });
  }
};

