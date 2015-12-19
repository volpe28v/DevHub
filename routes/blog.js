var blog_model = require('../lib/blog');
var tag_model = require('../lib/tag');
var chat_log = require('../lib/chat_log');
var client_info = require('../lib/client_info');
var util = require('../lib/util');

exports.post = function(req, res, io) {
  var blog = req.body.blog;
  var is_needed_notify = blog._id ? (blog.is_notify ? true : false) : true;
  var is_create = blog._id ? false : true;

  function notify(blog){
    var data = {
      name: "Blog",
      msg: blog.name + "さんがブログを" + (is_create ? "投稿" : "更新") + "しました\n" + "[" + blog.title + "](blog?id=" + blog._id + ")",
      avatar: "img/blog.png",
      room_id: 1,
      date: util.getFullDate(new Date())
    }

    chat_log.add(data,function(){
      io.sockets.emit('message' + data.room_id, data);
      io.sockets.emit('message', data);
    });
  }

  blog.date = util.getFullDate(new Date());
  blog_model.save(blog,function(blog){
    res.send({blog: blog});
    if (is_needed_notify){
      notify(blog);
    }
  });

  // タグ更新
  if (is_create){
    var reg = /\[.+?\]/g;
    var tags = blog.title.match(reg).map(function(m){ return m.replace("[","").replace("]",""); });
    tag_model.save(tags);
  }else{

  }
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


