var mongo = require('mongodb');
var util = require('../lib/util');
var db;

var table_blog_name = 'blog';

exports.set_db = function(current_db){
  db = current_db;
};

exports.post = function(req, res) {
  var blog = req.body.blog;
  blog.date = util.getFullDate(new Date());
  db.collection(table_blog_name, function(err, collection) {
    if (blog.id){
      collection.findOne({_id: mongo.ObjectID(blog.id)},function(err, target_text) {
        if (target_text != null){
          collection.update( {_id: target_text._id}, {'$set': blog}, {safe: true}, function(){});
        }else{
          collection.save( blog, function(){} );
        }
        res.send({blog: blog});
      });
    }else{
      collection.save( blog, function(){
        res.send({blog: blog});
      });
    }
  });
};

exports.get = function(req, res){
  res.render('blog');
};

exports.body = function(req, res){
  db.collection(table_blog_name, function(err, collection) {
    collection.find().toArray(function(err, latest_texts) {
      var blogs = [];
      if (latest_texts != null && latest_texts.length != 0){
        blogs = latest_texts;
      }
      res.send({body: blogs});
    });
  });
};

exports.delete = function(req, res) {
};


