var blog_model = require('../lib/blog');
var chat_log = require('../lib/chat_log');
var client_info = require('../lib/client_info');
var util = require('../lib/util');

exports.post = function(req, res, io) {
  var blog = req.body.blog;
  var is_needed_notify = blog._id ? (blog.is_notify ? true : false) : true;
  var is_create = blog._id ? false : true;

  function notify(blog){
    var name = "Blog";
    var msg = blog.name + "さんがブログを" + (is_create ? "投稿" : "更新") + "しました\n" + "[" + blog.title + "](blog?id=" + blog._id + ")";
    var avatar = "img/blog.png";
    var data = {name: name, msg: msg, avatar: avatar, date: util.getFullDate(new Date())};

    chat_log.add(data,function(){
      io.sockets.emit('message', data);
      client_info.send_growl_all(data);
    });
  }

  blog.date = util.getFullDate(new Date());
  blog_model.save(blog,function(blog){
    res.send({blog: blog});
    if (is_needed_notify){
      notify(blog);
    }
  });
};

exports.get = function(req, res){
  var id = req.query.id;
  if (id == undefined){
    res.render('blog');
  }else{
    res.render('blog_permalink',{locals:{id: id}});
  }
};

exports.body = function(req, res){
  var blog_id = req.query._id;
  blog_model.find(blog_id, function(blogs, all_count){
    res.send({body: blogs, count: all_count});
  });
};

exports.body_older = function(req, res){
  var last_id = req.query._id;
  blog_model.find_older(last_id, function(blogs){
    res.send({body: blogs});
  });
};

exports.body_search = function(req, res){
  blog_model.search(req.query.keyword,function(blogs){
    res.send({body: blogs, count: blogs.length});
  });
};

exports.delete = function(req, res) {
  var blog = req.body.blog;

  blog_model.delete(blog, function(){
    res.send("delete ok");
  });
};


