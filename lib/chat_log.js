var db;
module.exports.set_db = function(current_db){
  db = current_db;
};

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
