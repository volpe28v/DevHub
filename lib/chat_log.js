var mongo = require('mongodb');
var db;
var table_name = 'chat_log';
var table_room_name = 'room_name';
var table_active_number = 'chat_active_number';

var CHAT_LIMIT = 30;
var DEFAULT_ACTIVE_NUMBER = 1;

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

module.exports.get = function(data, callback){
  var room_id = data.room_id;
  var room_condition = [];
  if (room_id == 1){
    room_condition = { $or: [{room_id: room_id},{room_id: undefined}] }
  }else{
    room_condition = {room_id: room_id}
  }

  var conditions = [];
  conditions.push(room_condition);

  if (data.name != null && data.name != ""){
    conditions.push({name: data.name});
  }

  if (data.word != null && data.word != ""){
    conditions.push({msg: { $regex: data.word, $options: 'i'}});
  }

  db.collection(table_name, function(err, collection) {
    collection.find({ $and: conditions }, {limit: CHAT_LIMIT, sort:{date: -1}}).toArray(function(err, results) {
      callback(results);
    });
  });
};

module.exports.get_older = function(data, callback){
  var room_id = data.room_id;
  var id = data.id;

  var room_condition = [];
  if (room_id == 1){
    room_condition = { $or: [{room_id: room_id},{room_id: undefined}] }
  }else{
    room_condition = {room_id: room_id}
  }

  var conditions = [];
  conditions.push(room_condition);

  if (data.name != null && data.name != ""){
    conditions.push({name: data.name});
  }

  if (data.word != null && data.word != ""){
    conditions.push({msg: { $regex: data.word, $options: 'i'}});
  }

  db.collection(table_name, function(err, collection) {
    collection.find({_id: new mongo.ObjectID(id)}).toArray(function(err, last_msg){
      conditions.push({ date: {$lte: last_msg[0].date}});
      collection.find({ $and: conditions }, {limit: CHAT_LIMIT, sort:{date: -1}}).toArray(function(err, results) {
        callback(results);
      });
    });
  });
};

module.exports.size = function(room_id,callback){
  if (room_id == 1){
    db.collection(table_name, function(err, collection) {
      collection.count({ $or: [{room_id: room_id},{room_id: undefined}]},function(err, count){
        callback(count);
      });
    });
  }else{
    db.collection(table_name, function(err, collection) {
      collection.count({room_id: room_id},function(err, count){
        callback(count);
      });
    });
  }
};

module.exports.get_active_number = function(callback){
  db.collection(table_active_number, function(err, collection) {
    collection.findOne({},function(err, number) {
      if (number == null){
        number = {num: DEFAULT_ACTIVE_NUMBER};
      }

      callback(number);
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

module.exports.set_room_name = function(room_id, name){
  db.collection(table_room_name, function(err, collection) {
    collection.findOne({no: room_id},function(err, room) {
      if (room != null){
        collection.update( {_id: room._id}, {'$set': {name: name}}, {safe: true}, function(){});
      }else{
        collection.save( {no: room_id, name: name}, function(){} );
      }
    });
  });
}

module.exports.get_room_name = function(room_id, callback){
  db.collection(table_room_name, function(err, collection) {
    collection.findOne({no: room_id},function(err, room) {
      if (room != null){
        callback(room.name);
      }
    });
  });
}
