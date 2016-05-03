var mongo = require('mongodb');

var db;
var table_latest_text_name = 'latest_text';
var table_log_name = 'text_log';
var table_active_number = 'active_number';
var table_tab_numbers = 'tab_numbers';
var LOG_LIMIT = 20;
var DEFAULT_ACTIVE_NUMBER = 3;

module.exports.set_db = function(current_db){
  db = current_db;
};

// latest text cache
var text_log = [];

module.exports.get = function(id, callback){
  db.collection(table_log_name, function(err, collection) {
    collection.findOne({_id: new mongo.ObjectID(id)},function(err, text_log) {
      callback(text_log);
    });
  });
}

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

module.exports.insert_latest_text = function(insert_log, callback){
  db.collection(table_latest_text_name, function(err, collection) {
    collection.findOne({no: insert_log.no}, function(err, latest_text) {
      if (latest_text != null){
        // 最新のテキストに挿入
        var text_lines = latest_text.text.split("\r\n");
        text_lines.splice(insert_log.line, 0, insert_log.text);
        insert_log.text = text_lines.join("\r\n");

        collection.update( {_id: latest_text._id}, {'$set': insert_log }, {safe: true}, function(){});
      }else{
        // 新規に追加
        collection.save( insert_log, function(){} );
      }
      callback(insert_log);
    });
  });
}

module.exports.get_uncheck_tasks = function(no, callback){
  var memo_no = Number(no);
  var condition = {};
  if (isFinite(memo_no) && memo_no > 0){
    condition.no = memo_no;
  }
  console.log(condition.no);
  db.collection(table_latest_text_name, function(err, collection) {
    collection.find(condition).toArray(function(err, latest_texts) {
      var uncheck_tasks = [];
      for ( var i = 0; i < latest_texts.length; i++){
        var title = latest_texts[i].text.split("\n")[0];
        var check_text = latest_texts[i].text.replace(/-[ ]?\[[ ]?\][ ]*(.+)/g, function(){
          var task = {
            title: title,
            text: arguments[1]
          };
          uncheck_tasks.push(task);
        });
      }
      callback(uncheck_tasks);
    });
  });
}

module.exports.get_latest = function(max_number, callback){
  db.collection(table_latest_text_name, function(err, collection) {
    collection.find({no:{$gte: 1,$lte: Number(max_number)}}).toArray(function(err, latest_texts) {
      if (latest_texts != null && latest_texts.length != 0){
        callback(latest_texts);
        text_log = latest_texts;
      }else{
        callback([]);
      }
    });
  });
}

module.exports.get_latest_by_no = function(no, callback){
  db.collection(table_latest_text_name, function(err, collection) {
    collection.findOne({no:no},function(err, result) {
      callback(result);
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

module.exports.get_logs_by_no = function(no, callback){
  db.collection(table_log_name, function(err, collection) {
    collection.find({no: no}, {limit: LOG_LIMIT, sort: {date: -1}}).toArray(function(err, results) {
      callback(results);
    });
  });
}

module.exports.add_history = function(no, callback){
  var that = this;

  db.collection(table_latest_text_name, function(err, collection) {
    collection.findOne({no: no},function(err, latest_text) {
      if (latest_text != null){
        delete latest_text['_id'];
        that.add(latest_text, callback);
      }
    });
  });
}

module.exports.add = function(current_log, callback){
  var that = this;

  this.can_add(current_log,function(result){
    if (result){
      that.add_impl(current_log,function(){
        that.remove_old_history(current_log.no);
        callback(current_log);
      });
    }else{
      callback(null);
    }
  });
}

// 前回データを履歴に保存するか判定する
module.exports.can_add = function(current_log, callback){
  // バックアップ対象が空文字と改行のみの場合は保存しない
  var blank = new RegExp("(^[ \r\n]+$|^$)");
  if (blank.test(current_log.text)) { callback(false); return; }

  // 前回のバックアップと同様であれば保存しない
  db.collection(table_log_name, function(err, collection) {
    collection.find({no: current_log.no}, {limit:1, sort:{date: -1}}).toArray(function(err, logs) {
      if (logs.length > 0 && logs[0].text == current_log.text ){ callback(false); return; }
      callback(true);
    });
  });
}

module.exports.add_impl = function(text_log,callback){
  text_log.favo = false;
  db.collection(table_log_name, function(err, collection) {
    collection.insert( text_log, callback );
  });
}

module.exports.remove_old_history = function(no){
  db.collection(table_log_name, function(err, collection) {
    collection.find({no: no}, {limit: LOG_LIMIT+1, sort: {date: -1}}).toArray(function(err, results) {
      if (results != null && results.length == LOG_LIMIT+1){
        collection.remove( { $and: [{no: no}, {date: {$lt: results[LOG_LIMIT-1].date}}]} ,{safe:true}, function(err, numberOfRemovedDocs) {
        });
      }else{
        console.log("no remove_old_history: " + no);
      }
    });
 });
}

module.exports.remove = function(id,callback){
  db.collection(table_log_name, function(err, collection) {
    collection.remove( {_id: new mongo.ObjectID(id)} ,{safe:true}, function(err, numberOfRemovedDocs) {
      callback();
    });
  });
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

module.exports.get_active_number = function(){
  return new Promise(function(callback){
    db.collection(table_active_number, function(err, collection) {
      collection.findOne({},function(err, number) {
        if (number == null){
          number = {num: DEFAULT_ACTIVE_NUMBER};
        }

        callback(number);
      });
    });
  });
}

module.exports.update_active_number = function(number){
  db.collection(table_active_number, function(err, collection) {
    collection.findOne({},function(err, active_number) {
      if (active_number != null){
        collection.update( {_id: active_number._id}, {'$set': number}, {safe: true}, function(){});
      }else{
        collection.save( number, function(){} );
      }
    });
  });
}

module.exports.get_tab_numbers = function(){
  return new Promise(function(callback){
    db.collection(table_tab_numbers, function(err, collection) {
      collection.findOne({},function(err, data) {
        // コンマ区切りの過去バージョンだった場合の対処
        if (data != null && typeof data.numbers == 'string'){
          data.numbers = data.numbers.split(',');
        }

        callback(data);
      });
    });
  });
}

module.exports.update_tab_numbers = function(numbers){
  db.collection(table_tab_numbers, function(err, collection) {
    collection.findOne({},function(err, tab_numbers) {
      if (tab_numbers != null){
        collection.update( {_id: tab_numbers._id}, {'$set': numbers}, {safe: true}, function(){});
      }else{
        collection.save( numbers, function(){} );
      }
    });
  });
}
