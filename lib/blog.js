var mongo = require('mongodb');
var db;
var table_blog_name = 'blog';

var BLOG_LIMIT = 20;

module.exports.set_db = function(current_db){
  db = current_db;
};

module.exports.save = function(blog, callback) {
  var blog_lines = blog.text.split('\n');

  db.collection(table_blog_name, function(err, collection) {
    if (blog._id){
      collection.findOne({_id: new mongo.ObjectID(blog._id)},function(err, target_text) {
        if (target_text != null){
          blog._id = null;
          collection.update( {_id: target_text._id}, {'$set': {text: blog.text, name: blog.name, date: blog.date}}, {safe: true}, function(){});
          console.log("update " + target_text._id);
        }else{
          collection.save( blog, function(){} );
          console.log("save " + blog._id);
        }
        callback(blog);
      });
    }else{
      collection.save( blog, function(){
        callback(blog);
      });
    }
  });
};

module.exports.find = function(blog_id, callback){
  db.collection(table_blog_name, function(err, collection) {
    if (blog_id == undefined){
      collection.find({}, {limit: BLOG_LIMIT, sort: {date: -1}}).toArray(function(err, latest_texts) {
        collection.count(function(err, count){
          var blogs = [];
          if (latest_texts != null && latest_texts.length != 0){
            blogs = latest_texts;
          }
          callback(blogs);
        });
      });
    }else{
      collection.findOne({_id: new mongo.ObjectID(blog_id)}, function(err, blog){
        callback([blog]);
      });
    }
  });
};

module.exports.find_older = function(last_id, callback){
  db.collection(table_blog_name, function(err, collection) {
    collection.findOne({_id: new mongo.ObjectID(last_id)}, function(err, last_blog){
      collection.find({ date: {$lte: last_blog.date}}, {limit: BLOG_LIMIT + 1, sort:{date: -1}}).toArray(function(err, blogs) {
        callback(blogs);
      });
    });
  });
};

module.exports.search = function(keyword, callback){
  var conditions = keyword.split(" ").map(function(key){ return {text: { $regex: key, $options: 'i'}}; })
  db.collection(table_blog_name, function(err, collection) {
    collection.find({ $and: conditions }, {sort: {date: -1}}).toArray(function(err, latest_texts) {
      var blogs = [];
      if (latest_texts != null && latest_texts.length != 0){
        blogs = latest_texts;
      }
      callback(blogs);
    });
  });
};

module.exports.delete = function(blog, callback) {
  db.collection(table_blog_name, function(err, collection) {
    collection.remove( {_id: new mongo.ObjectID(blog._id)} ,{safe:true}, function(){
      callback();
    });
  });
};


