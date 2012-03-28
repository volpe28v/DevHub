mongo = require('mongodb');
//var db = new mongo.Db('devhub_chat_db', new mongo.Server(process.env.MONGOLAB_URI || 'localhost',process.env.PORT || mongo.Connection.DEFAULT_PORT, {}), {});
 
// Connect to a mongo database via URI
// With the MongoLab addon the MONGOLAB_URI config variable is added to your
// Heroku environment.  It can be accessed as process.env.MONGOLAB_URI
var db = null;
if ( process.env.MONGOLAB_URI ){
  db = mongo.connect(process.env.MONGOLAB_URI, {}, function(error, db){});
}else{
  db = new mongo.Db('devhub_chat_db', new mongo.Server('localhost', mongo.Connection.DEFAULT_PORT, {}), {});
  db.open(function(){});
}

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
