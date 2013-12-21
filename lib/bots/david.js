var util = require('../util');
module.exports.action = function(data, callback){
  // 返答パターンを定義 (text: 本文, interval: 返答時間(s)}
  var messages = util.getMessagesFromJsonFile('david.json');

  if (data.msg.match(/David/i)){  //自分の名前が呼ばれたら
    // メッセージをランダムに選択
    var msg = util.getRandom(messages);

    // 返答を生成
    var reply = {
      name: "David",
      msg: "@" + data.name + "さん " + msg.text,
      interval: msg.interval
    };

    // 返答
    callback(reply);
  }
};
