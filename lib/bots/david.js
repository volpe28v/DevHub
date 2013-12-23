var util = require('../util');
module.exports.action = function(data, callback){
  if (data.msg.match(/David/i)){  //自分の名前が呼ばれたら
    var messages = util.getMessagesFromJsonFile('david.json');

    // 発言者でリプライを絞る
    messages = filterWithSender(messages, data.name);

    // キーワードでリプライを絞る
    messages = filterWithKeyword(messages, data.msg);

    // メッセージをランダムに選択
    var msg = util.getRandom(messages);

    // リプライを生成
    var reply = {
      name: "David",
      msg: "@" + data.name + "さん " + msg.text,
      interval: msg.interval
    };

    // リプライ実行 
    callback(reply);
  }
};

function filterWithSender(messages, sender){
  var includedSenderOnlyMessages = includedSenderOnly(messages, sender);

  if (includedSenderOnlyMessages.length > 0){
    return includedSenderOnlyMessages;
  }else{
    return includedSenderAndNoSender(messages, sender);
  }
}

function includedSenderOnly(messages, sender){
  var filtered_messages = [];
  messages.forEach(function(message){
    if (!util.isUndefined(message.sender)){
      if (message.sender.some(function(one_sender){
          return (sender == one_sender)
        })){
        filtered_messages.push(message);
      }
    }
  });
  return filtered_messages;
}

function includedSenderAndNoSender(messages, sender){
  var filtered_messages = [];
  messages.forEach(function(message){
    if (util.isUndefined(message.sender)){
      filtered_messages.push(message);
    }else{
      if (message.sender.some(function(one_sender){
          return (sender == one_sender)
        })){
        filtered_messages.push(message);
      }
    }
  });
  return filtered_messages;
}

function filterWithKeyword(messages, target_message){
  var includedKeywordMessages = includedKeyword(messages, target_message);

  if (includedKeywordMessages.length > 0){
    return includedKeywordMessages;
  }else{
    return excludedKeyword(messages);
  }
}

function includedKeyword(messages, target_message){
  var has_keyword_messages = [];
  messages.forEach(function(message){
    if (isIncluded(message.keyword, target_message)){
        has_keyword_messages.push(message);
    }
  });

  return has_keyword_messages;
}

function isIncluded(keyword_obj, target){
  if (typeof keyword_obj == 'string'){
    var re = new RegExp(keyword_obj,"i");
    return target.match(re);
  }

  if (Array.isArray(keyword_obj) &&
      keyword_obj.some(function(one_keyword){
        if (one_keyword === ""){ return false; }
        var re = new RegExp(one_keyword,"i");
        return target.match(re);
      }))
  {
    return true;
  }
 
  return false;
}

function excludedKeyword(messages){
  var no_keyword_messages = [];
  messages.forEach(function(message){
    if (util.isUndefined(message.keyword)){
      no_keyword_messages.push(message);
    }
  });

  return no_keyword_messages;
}

