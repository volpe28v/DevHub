var db;
var table_name = 'chat_log';

module.exports.set_db = function(current_db){
  db = current_db;
};

module.exports.add = function(data){
  db.collection(table_name, function(err, collection) {
    collection.save( data, function(){} );
  });
};

module.exports.get = function(callback){
  db.collection(table_name, function(err, collection) {
    collection.find().toArray(function(err, results) {
      callback(results);
    });
  });
};

module.exports.size = function(callback){
  db.collection(table_name, function(err, collection) {
    collection.find().toArray(function(err, results) {
      callback(results.length);
    });
  });
};
