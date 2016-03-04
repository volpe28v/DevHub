var blog_model = require('../lib/blog');
var tag_model = require('../lib/tag');
var chat_log = require('../lib/chat_log');
var client_info = require('../lib/client_info');
var util = require('../lib/util');

exports.post = function(req, res, io) {
  var blog = req.body.blog;
  var is_needed_notify = blog._id ? (blog.is_notify == 'true' ? true : false) : true;
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

  // タグ更新
  var tag_promise = null;
  if (is_create){
    tag_promise = tag_model.save(blog.title);
  }else{
    tag_promise = blog_model.find(blog._id).then(function(blogs){
      console.log("find: " + blogs.body[0]._id);
      return tag_model.delete(blogs.body[0].title);
    }).then(function(results){
      console.log("tag deleted: " + results.join(" "));
      return tag_model.save(blog.title);
    });
  }

  tag_promise.then(function(results){
    console.log("tag saved: " + results.join(" "));

    blog.date = util.getFullDate(new Date());
    return Promise.all([tag_model.get(), blog_model.save(blog)]);
  }).then(function(results){
    res.send({tags: results[0], blog: results[1]});
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
  Promise.all([tag_model.get(), blog_model.find(blog_id)]).then(function(results){
    res.send({tags: results[0], blogs: results[1]});
  });
};

exports.body_older = function(req, res){
  var last_id = req.query._id;
  blog_model.find_older(last_id).then(function(blogs){
    res.send({body: blogs});
  });
};

exports.body_search = function(req, res){
  blog_model.search(req.query.keyword).then(function(blogs){
    res.send({body: blogs, count: blogs.length});
  });
};

exports.delete = function(req, res) {
  var blog = req.body.blog;

  blog_model.find(blog._id).then(function(blogs){
    return tag_model.delete(blogs.body[0].title);
  }).then(function(results){
    return blog_model.delete(blog);
  }).then(function(){
    return tag_model.get();
  }).then(function(tags){
    res.send({tags: tags});
  });
};

exports.reset_tags = function(req, res){
  console.log("start reset tags");
  function tag_save_task(line){
    return function(){
      return tag_model.save(line);
    }
  }
  tag_model.delete_all().then(function(){
    return blog_model.all_titles();
  }).then(function(titles){
    var tasks = [];
    titles.forEach(function(title){
      if (title.title != undefined){
        tasks.push(tag_save_task(title.title));
      }
    });

    return tasks.reduce(function(promise, task, i) {
      return promise.then(function(_) {
        return task();
      })
    }, Promise.resolve());
  }).then(function(){
    console.log("end reset tags");
    res.send("reset tags ok");
  });
};
