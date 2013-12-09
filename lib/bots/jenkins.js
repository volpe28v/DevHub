var util = require('../util');
var exec = require('child_process').exec
module.exports.action = function(data, callback){
  //TODO implements here


  /* Example
  if (data.msg.match(/Jenkins/i)){  //自分の名前が呼ばれたら
    // Jenkins へビルドを依頼
    var uri = 'http://localhost:8080/job/XXXXX/build';
    exec('curl -X GET ' + uri, function(err, stdout, stderr) {
      console.log(err);
    })

      // wget を使う場合
//    exec('wget ' + uri, function(err, stdout, stderr) {
//      console.log(err);
//    })

    // 返答を生成
    var reply = {
      name: "Jenkins",
      msg: "@" + data.name + "さん ビルド承りました。"
    };

    // 1秒後に返答する
    setTimeout(function(){
      callback(reply);
    },1000);
  }
  */
};
