var mongo = require('mongodb');
var db;
var table_tag_name = 'tag';

var TAG_LIMIT = 20;

module.exports.set_db = function(current_db){
  db = current_db;
};

function get_tags(line){
  var reg = /\[.+?\]/g;
  var found_tags = line.match(reg);
  if (found_tags == null){ return []; }

  // 重複を排除
  found_tags = found_tags.filter(function (element, index, self) {
      return self.indexOf(element) === index;
  });
  return found_tags.map(function(m){ return m.replace("[","").replace("]",""); });
}

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
module.exports.save = function(line) {
  var tags = get_tags(line);
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
          if (target_tag.count == 0){ callback(tag); return; }
          collection.update( {_id: target_tag._id}, {'$set': {tag_name: tag, count: target_tag.count - 1}}, {safe: true}, function(){
            callback(tag);
          });
        }else{
          callback(tag);
        }
      });
    });
  });
}

module.exports.delete = function(line) {
  var tags = get_tags(line);
  return Promise.all(tags.map(function(tag){ return deletePromise(tag); }));
};


