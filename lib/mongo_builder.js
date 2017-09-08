var mongo = require('mongodb');

var mongo_uri = process.env.MONGODB_URI ? process.env.MONGODB_URI : process.env.MONGOLAB_URI;
module.exports.ready = function(db_name, callback){
  if (mongo_uri){
    mongo.connect(mongo_uri, {}, function(error, db){
      callback(db);
    });
  }else{
    new mongo.Db(db_name, new mongo.Server('127.0.0.1', 27017, {}), {safe:true}).open(function(err,db){
      callback(db);
    });
  }
};
