var mongo = require('mongodb');
var db;
var table_blog_name = 'blog';

var BLOG_LIMIT = 20;

module.exports.set_db = function(current_db){
  db = current_db;
};

module.exports.save = function(blog) {
  return new Promise(function(callback){
    var blog_lines = blog.text.split('\n');

    db.collection(table_blog_name, function(err, collection) {
      if (blog._id){
        collection.findOne({_id: new mongo.ObjectID(blog._id)},function(err, target_blog) {
          if (target_blog != null){
            collection.update( {_id: target_blog._id}, {'$set': {title: blog.title, text: blog.text, name: blog.name, avatar: blog.avatar, date: blog.date}}, {safe: true}, function(){});
            console.log("update " + target_blog._id);
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
  });
};

module.exports.find = function(blog_id){
  return new Promise(function(callback){
    db.collection(table_blog_name, function(err, collection) {
      if (blog_id == undefined){
        collection.find({}, {limit: BLOG_LIMIT, sort: {date: -1}}).toArray(function(err, latest_texts) {
          collection.count(function(err, count){
            var blogs = [];
            if ( count != 0 ){ blogs = latest_texts; }
            callback({body: blogs, count: count});
          });
        });
      }else{
        collection.findOne({_id: new mongo.ObjectID(blog_id)}, function(err, blog){
          callback({body: [blog], count: 1});
        });
      }
    });
  });
};

module.exports.find_older = function(last_id){
  return new Promise(function(callback){
    db.collection(table_blog_name, function(err, collection) {
      collection.findOne({_id: new mongo.ObjectID(last_id)}, function(err, last_blog){
        collection.find({ date: {$lte: last_blog.date}}, {limit: BLOG_LIMIT + 1, sort:{date: -1}}).toArray(function(err, blogs) {
          callback(blogs);
        });
      });
    });
  });
};

module.exports.search = function(keyword){
  return new Promise(function(callback){
    var conditions = keyword.split(" ").map(function(key){
      var nameMatched = key.match(/name:(.+)/);
      var tagMatched = key.match(/tag:(.+)/);
      if (nameMatched){
        return {name: nameMatched[1]};
      }else if (tagMatched){
        return {title: { $regex: '\\[' + tagMatched[1] + '\\]', $options: 'i'}};
      }else{
        return {text: { $regex: key, $options: 'i'}};
      }
    });
    db.collection(table_blog_name, function(err, collection) {
      collection.find({ $and: conditions }, {sort: {date: -1}}).toArray(function(err, latest_texts) {
        var blogs = [];
        if (latest_texts != null && latest_texts.length != 0){
          blogs = latest_texts;
        }
        callback(blogs);
      });
    });
  });
};

module.exports.delete = function(blog, callback) {
  return new Promise(function(callback){
    db.collection(table_blog_name, function(err, collection) {
      collection.remove( {_id: new mongo.ObjectID(blog._id)} ,{safe:true}, function(){
        callback();
      });
    });
  });
};

module.exports.all_titles = function(){
  return new Promise(function(callback){
    db.collection(table_blog_name, function(err, collection) {
      collection.find({}, {title: true}).toArray(function(err, titles) {
        callback(titles);
      });
    });
  });
};


