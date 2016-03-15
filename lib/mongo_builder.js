var mongo = require('mongodb');

module.exports.ready = function(db_name, callback){
  if ( process.env.MONGOLAB_URI ){
    mongo.connect(process.env.MONGOLAB_URI, {}, function(error, db){
      callback(db);
    });
  }else{
    new mongo.Db(db_name, new mongo.Server('127.0.0.1', 27017, {}), {safe:true}).open(function(err,db){
      callback(db);
    });
  }
};

