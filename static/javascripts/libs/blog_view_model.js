function BlogViewModel(){
  this.items = [];
}

BlogViewModel.prototype = {
  refresh: function(keyword){
    console.log(keyword);
    var that = this;
    if (this.ajax_req){ this.ajax_req.abort(); }
    $.ajax('blog/body' , {
      type: 'GET',
      cache: false,
      data: {keyword: keyword},
      success: function(data){
        $.observable(that.items).remove(0,that.items.length);
        var blogs = data.body;
        blogs.forEach(function(blog){
          that._addItem(blog);
        });
      }
    });
  },

  add: function(item){
    var that = this;
    $.ajax('blog' , {
      type: 'POST',
      cache: false,
      data: {blog: item},
      success: function(data){
        that._addItem(data.blog);
      }
    });
  },

  edit: function(view){
    var index = view.index;
    var blog = this.items[index];
    blog.pre_text = blog.text;

    var $target = $(view.contents()).closest('.blog-body');
    $target.find('pre').hide();
    $target.find('.edit-form').show();
    $target.find('textarea').focus().autofit({min_height: 100});
  },

  update: function(view){
    var index = view.index;
    var blog = this.items[index];

    // 名前・タイトルを更新
    var title = blog.text.split("\n")[0];
    $.observable(blog).setProperty("title", title);
    $.observable(blog).setProperty("name", name);

    var $target = $(view.contents()).closest('.blog-body');
    $target.find(".code-out").showDecora(blog.text);
    $target.find('pre').show();
    $target.find('.edit-form').hide();

    $.ajax('blog' , {
      type: 'POST',
      cache: false,
      data: {blog: {_id: blog._id, text: blog.text, name: name}},
      success: function(data){
        $.observable(blog).setProperty("date", data.blog.date);
      }
    });
  },
 
  cancel: function(view){
    var index = view.index;
    var blog = this.items[index];
    $.observable(blog).setProperty("text", blog.pre_text);

    var $target = $(view.contents()).closest('.blog-body');
    $target.find('pre').show();
    $target.find('.edit-form').hide();
  },

  destory: function(view){
    var index = view.index;
    var remove_blog = {};
    remove_blog._id = this.items[index]._id;

    $.ajax('blog' , {
      type: 'DELETE',
      cache: false,
      data: {blog: remove_blog},
      success: function(data){
      }
    });

    $.observable(this.items).remove(index);
  },

  _addItem: function(item){
    var id = item._id;
    item.title = item.text.split("\n")[0];

    $.observable(this.items).insert(0,item);
    var $target = $('#' + id);
    $target.find(".code-out").showDecora(item.text);
  }
}
