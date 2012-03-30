var mongo = require('mongodb');

var db;
var table_name = 'text_log';

module.exports.set_db = function(current_db){
  db = current_db;
};

var text_log = undefined;
var text_logs = [];
var text_log_id = 0;
var favo_logs = [];

module.exports.empty = function(){
  if (text_log == undefined ){
    return true;
  }else{
    return false;
  }
}

module.exports.get_latest = function(){
  return text_log;
}

module.exports.get_logs = function(callback){
  db.collection(table_name, function(err, collection) {
    collection.find().toArray(function(err, results) {
      callback(results);
    });
  });
}

module.exports.add = function(current_log,callback){
  var that = this;
  this.can_add(current_log,function(result){
    if (result){
      that.add_impl(text_log,function(){
        text_log = current_log
        console.log("add_text_log is true")
        callback(true);
      });
    }else{
      text_log = current_log
      callback(false);
    }
  });
}

module.exports.can_add = function(current_log,callback){
  if (text_log == undefined ){ callback(false); return; }
  // 同ユーザの書き込みであれば保留
  if (text_log.name == current_log.name ){ callback(false); return; }

  // バックアップ対象が空文字と改行のみの場合は排除
  var blank = new RegExp("(^[ \r\n]+$|^$)");
  if (blank.test(text_log.text)) { callback(false); return; }

  // 前回のバックアップと同様であれば保留
  db.collection(table_name, function(err, collection) {
    collection.find({}, {limit:1}).toArray(function(err, logs) {
      if (logs.length > 0 && logs[0].text == text_log.text ){ callback(false); return; }
      callback(true);
    });
  });
}

module.exports.add_on_suspend = function(name, callback){
  var that = this;
  this.can_add_on_suspend(name, function(result){
    if (result){
      that.add_impl(text_log,function(){
        console.log("add_text_log_on_suspend is true");
        callback(true);
      });
    }else{
      callback(false);
    }
  });
}

module.exports.can_add_on_suspend = function(name, callback){
  if (text_log == undefined){ callback(false); return; }
  if (text_log.name != name ){ callback(false); return; }

  // バックアップ対象が空文字と改行のみの場合は排除
  var blank = new RegExp("(^[ \r\n]+$|^$)");
  if (blank.test(text_log.text)) { callback(false); return; }

  // 前回のバックアップと同様であれば保留
  db.collection(table_name, function(err, collection) {
    collection.find({}, {limit:1}).toArray(function(err, logs) {
      if (logs.length > 0 && logs[0].text != text_log.text ){ callback(true); return; }
      if (logs.length == 0){ callback(true); return; }

      callback(false);
    });
  });
}

module.exports.add_impl = function(text_log,callback){
  text_log.favo = false;
  db.collection(table_name, function(err, collection) {
    collection.save( text_log, callback );
  });
}

module.exports.remove = function(id,callback){
  console.log("removed id: ", id)
  db.collection(table_name, function(err, collection) {
    collection.remove( {_id: new mongo.ObjectID(id)} ,{safe:true}, function(err, numberOfRemovedDocs) {
      console.log("removed docs: ", numberOfRemovedDocs);
      callback();
    });
  });
}

module.exports.is_change = function(msg){
  if (text_log == undefined){ return true;}
  if (text_log.text != msg){ return true;}

  return false;
}

// for favo method
module.exports.add_favo = function(id){
  db.collection(table_name, function(err, collection) {
    collection.update( {_id: new mongo.ObjectID(id)}, {'$set':{ favo: true }}, {safe: true}, function(err, one_log) {
    });
  });
}

module.exports.get_favo_logs = function(){
  return favo_logs;
}

module.exports.remove_favo = function(id){
  db.collection(table_name, function(err, collection) {
    collection.update( {_id: new mongo.ObjectID(id)}, {'$set':{ favo: false }}, {safe: true}, function(err, one_log) {
    });
  });
}

