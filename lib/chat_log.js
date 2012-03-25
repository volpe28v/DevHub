mongo = require('mongodb');
var db = new mongo.Db('devhub_chat_db', new mongo.Server('localhost',mongo.Connection.DEFAULT_PORT, {}), {});
 
db.open(function(){});

var chat_log = [];
module.exports.add = function(data){
  db.collection('chat_log', function(err, collection) {
    collection.save( data, function(){} );
  });
};

module.exports.get = function(callback){
  db.collection('chat_log', function(err, collection) {
    collection.find().toArray(function(err, results) {
      callback(results);
    });
  });
};

module.exports.size = function(callback){
  db.collection('chat_log', function(err, collection) {
    collection.find().toArray(function(err, results) {
      callback(results.length);
    });
  });
};
