var mongo = require('mongodb').MongoClient;

module.exports.ready = function(db_name, callback){
  var mongo_uri = process.env.MONGODB_URI ? process.env.MONGODB_URI : process.env.MONGOLAB_URI;
  if (mongo_uri){
    mongo.connect(mongo_uri, { useNewUrlParser: true }, function(error, client){
      callback(client.db());
    });
  }else{
    mongo_uri = 'mongodb://localhost:27017';
    mongo.connect(mongo_uri, { useNewUrlParser: true }, function(error, client){
      callback(client.db(db_name));
    });
  }
};
