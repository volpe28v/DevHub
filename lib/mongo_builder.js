var mongo = require('mongodb');

module.exports.ready = function(callback){
  if ( process.env.MONGOLAB_URI ){
    mongo.connect(process.env.MONGOLAB_URI, {}, function(error, db){
      callback(db);
    });
  }else{
    new mongo.Db('devhub_chat_db', new mongo.Server('localhost', mongo.Connection.DEFAULT_PORT, {}), {}).open(function(err,db){
      callback(db);
    });
  }
};

