var mongo = require('mongodb');

var db;
var table_latest_text_name = 'latest_text';
var table_log_name = 'text_log';
var LOG_LIMIT = 20;

module.exports.set_db = function(current_db){
  db = current_db;
};

// latest text cache
var text_log = [];

module.exports.update_latest_text = function(text_log){
  db.collection(table_latest_text_name, function(err, collection) {
    collection.findOne({no: text_log.no},function(err, latest_text) {
      if (latest_text != null){
        collection.update( {_id: latest_text._id}, {'$set': text_log }, {safe: true}, function(){});
      }else{
        collection.save( text_log, function(){} );
      }
    });
  });
}

module.exports.get_latest = function(callback){
  db.collection(table_latest_text_name, function(err, collection) {
    collection.find().toArray(function(err, latest_texts) {
      if (latest_texts.length != 0){
        callback(latest_texts);
        text_log = latest_texts;
      }else{
        callback([]);
      }
    });
  });
}

module.exports.get_logs = function(callback){
  db.collection(table_log_name, function(err, collection) {
    collection.find({}, {limit: LOG_LIMIT, sort: {date: -1}}).toArray(function(err, results) {
      callback(results);
    });
  });
}

module.exports.add = function(current_log, callback){
  var that = this;

  this.update_latest_text(current_log);
  this.can_add(current_log,function(result){
    if (result){
      that.add_impl(text_log[current_log.no],function(){
        callback(true);
        text_log[current_log.no] = current_log
      });
    }else{
      callback(false);
      text_log[current_log.no] = current_log
    }
  });
}

// 前回データを履歴に保存するか判定する
module.exports.can_add = function(current_log, callback){
  // 同ユーザの書き込みであれば保存しない
  if (text_log[current_log.no].name == current_log.name ){ callback(false); return; }

  // バックアップ対象が空文字と改行のみの場合は保存しない
  var blank = new RegExp("(^[ \r\n]+$|^$)");
  if (blank.test(text_log[current_log.no].text)) { callback(false); return; }

  // 前回のバックアップと同様であれば保存しない
  db.collection(table_log_name, function(err, collection) {
    collection.find({no: current_log.no}, {limit:1, sort:{date: -1}}).toArray(function(err, logs) {
      if (logs.length > 0 && logs[0].text == text_log[current_log.no].text ){ callback(false); return; }
      callback(true);
    });
  });
}

module.exports.add_on_suspend = function(name, callback){
  var that = this;
  this.can_add_on_suspend(name, function(result){
    if (result){
      that.add_impl(text_log,function(){
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
  db.collection(table_log_name, function(err, collection) {
    collection.find({}, {limit:1, sort:{date: -1}}).toArray(function(err, logs) {
      if (logs.length > 0 && logs[0].text != text_log.text ){ callback(true); return; }
      if (logs.length == 0){ callback(true); return; }

      callback(false);
    });
  });
}

module.exports.add_impl = function(text_log,callback){
  text_log.favo = false;
  db.collection(table_log_name, function(err, collection) {
    collection.insert( text_log, callback );
  });
}

module.exports.remove = function(id,callback){
  db.collection(table_log_name, function(err, collection) {
    collection.remove( {_id: new mongo.ObjectID(id)} ,{safe:true}, function(err, numberOfRemovedDocs) {
      callback();
    });
  });
}

module.exports.is_change = function(msg){
  if (text_log[msg.no] == undefined){ return true;}
  if (text_log[msg.no].text != msg.text){ return true;}

  return false;
}

// for favo method
module.exports.add_favo = function(id, callback){
  db.collection(table_log_name, function(err, collection) {
    collection.update( {_id: new mongo.ObjectID(id)}, {'$set':{ favo: true }}, {safe: true}, function(err, one_log) {
      callback();
    });
  });
}

module.exports.get_favo_logs = function(callback){
  db.collection(table_log_name, function(err, collection) {
    collection.find({ favo: true },{ sort: {date: -1}}).toArray(function(err, results) {
      callback(results);
    });
  });
}

module.exports.remove_favo = function(id, callback){
  db.collection(table_log_name, function(err, collection) {
    collection.update( {_id: new mongo.ObjectID(id)}, {'$set':{ favo: false }}, {safe: true}, function(err, one_log) {
      callback();
    });
  });
}

