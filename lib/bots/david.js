var util = require('../util');
module.exports.action = function(data, callback){
  //TODO implements here

  // 返答パターンを定義 (text: 本文, interval: 返答時間(s)}
  var messages = [
  {text: "ん、なんか用かい？", interval: 2},
  {text: "俺は今ホームパーティーで忙しいんだ。", interval: 5},
  {text: "出来れば後にしてくれないか。", interval: 7},
  ];

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
