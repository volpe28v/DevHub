var mongo = require('mongodb');
var db;
var table_tag_name = 'tag';

var TAG_LIMIT = 20;

module.exports.set_db = function(current_db){
  db = current_db;
};

function savePromise(tag){
  return new Promise(function(callback){
    db.collection(table_tag_name, function(err, collection) {
      collection.findOne({tag_name: tag},function(err, target_tag) {
        if (target_tag != null){
          collection.update( {_id: target_tag._id}, {'$set': {tag_name: tag, count: target_tag.count+1}}, {safe: true}, function(){});
        }else{
          collection.save( {tag_name: tag, count: 1}, function(){} );
        }
        callback(tag);
      });
    });
  });
}
 
// input ["tag1","tag2","tag3"]
module.exports.save = function(tags) {
  return Promise.all(tags.map(function(tag){ return savePromise(tag); }));
};

module.exports.get = function(callback){
  db.collection(table_tag_name, function(err, collection) {
    collection.find({}, {limit: TAG_LIMIT, sort: {count: -1}}).toArray(function(err, tags) {
      callback(tags);
    });
  });
};

function deletePromise(tag){
  return new Promise(function(callback){
    db.collection(table_tag_name, function(err, collection) {
      collection.findOne({tag_name: tag},function(err, target_tag) {
        if (target_tag != null){
          if (target_tag.count == 0){ return; }
          collection.update( {_id: target_tag._id}, {'$set': {tag_name: tag, count: target_tag.count - 1}}, {safe: true}, function(){});
          callback(tag);
        }
      });
    });
  });
}

module.exports.delete = function(tags) {
  return Promise.all(tags.map(function(tag){ return deletePromise(tag); }));
};


