var util = require('../util');
module.exports.action = function(data, callback){
  //TODO implements here

  if (data.msg.match(/David/i)){  //自分の名前が呼ばれたら
    // 返答を生成
    var reply = {
      name: "David",
      msg: "@" + data.name + "さん ん、なんか用かい？ 俺は今ホームパーティーで忙しいんだ。出来れば後にしてくれないか。"
    };

    // 1秒後に返答する
    setTimeout(function(){
      callback(reply);
    },1000);
  }

  /* Example 
  if (data.msg.match(/David/i)){  //自分の名前が呼ばれたら
    // 返答を生成
    var reply = {
      name: "David",
      msg: "@" + data.name + "さん ん、なんか用かい？ 俺は今ホームパーティーで忙しいんだ。出来れば後にしてくれないか。"
    };

    // 1秒後に返答する
    setTimeout(function(){
      callback(reply);
    },1000);
  }
  */
};
