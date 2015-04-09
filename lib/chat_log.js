var mongo = require('mongodb');
var db;
var table_name = 'chat_log';

var CHAT_LIMIT = 30;

module.exports.set_db = function(current_db){
  db = current_db;
};

module.exports.add = function(data,callback){
  db.collection(table_name, function(err, collection) {
    collection.save( data, function(){
      if (callback != undefined ){
        callback();
      }
    });
  });
};

module.exports.remove = function(id){
  db.collection(table_name, function(err, collection) {
    collection.remove( {_id: new mongo.ObjectID(id)} ,{safe:true}, function(){});
  });
};


module.exports.get = function(room_id,callback){
  if (room_id == 1){
    db.collection(table_name, function(err, collection) {
      collection.find({ $or: [{room_id: room_id},{room_id: undefined}] }, {limit: CHAT_LIMIT, sort:{date: -1}}).toArray(function(err, results) {
        callback(results);
      });
    });
  }else{
    db.collection(table_name, function(err, collection) {
      collection.find({room_id: room_id}, {limit: CHAT_LIMIT, sort:{date: -1}}).toArray(function(err, results) {
        callback(results);
      });
    });
  }
};

module.exports.get_older = function(room_id, id, callback){
  if (room_id == 1){
    db.collection(table_name, function(err, collection) {
      collection.find({_id: new mongo.ObjectID(id)}).toArray(function(err, last_msg){
        collection.find({ $and: [{ $or: [{room_id: room_id},{room_id: undefined}]},{ date: {$lte: last_msg[0].date}}] }, {limit: CHAT_LIMIT, sort:{date: -1}}).toArray(function(err, results) {
          callback(results);
        });
      });
    });
  }else{
    db.collection(table_name, function(err, collection) {
      collection.find({_id: new mongo.ObjectID(id)}).toArray(function(err, last_msg){
        collection.find({ $and: [{room_id: room_id},{ date: {$lte: last_msg[0].date}}] }, {limit: CHAT_LIMIT, sort:{date: -1}}).toArray(function(err, results) {
          callback(results);
        });
      });
    });
  }
};

module.exports.size = function(room_id,callback){
  db.collection(table_name, function(err, collection) {
    collection.count({room_id: room_id},function(err, count){
      callback(count);
    });
  });
};
