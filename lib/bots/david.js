var util = require('../util');
module.exports.action = function(data, callback){
  if (data.msg.match(/David/i)){  //自分の名前が呼ばれたら
    var messages = util.getMessagesFromJsonFile('david.json');

    // 発言者でリプライを絞る
    messages = filterWithSender(messages, data.name);

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

function filterWithSender(messages, sender){
  var filtered_messages = [];
  messages.forEach(function(message){
    if (message.sender == undefined){
      filtered_messages.push(message);
    }else{
      if (message.sender.some(function(one_sender){
          return (one_sender == "all" || sender == one_sender)
        })){
        filtered_messages.push(message);
      }
    }
  });

  return filtered_messages;
}

