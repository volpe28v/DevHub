function BlogViewModel(name, start, end){
  this.name = name;
  this.input_text = "";
  this.items = [];
  this.item_count = 0;
  this.remain_count = 0;
  this.keyword = "";
  this.before_keyword = "";

  this.matched_doms = [];
  this.matched_index = 0;
  this.matched_num = 0;
  this.matched_navi_style = "display: none;";

  this.load_start = start;
  this.load_end = end;
  this.loading_more = false;
  this.load_more_style = "display: none;";
}

BlogViewModel.prototype = {
  search: function(){
    // キーワード無しの場合は全blog更新
    if (this.keyword == ""){
      this.refresh();
      return true;
    }

    // キーワード変化無しの場合は移動モード
    if (this.before_keyword == this.keyword){ return false; }

    // 検索
    this.before_keyword = this.keyword;
    this._search(this.keyword);
    return true;
  },

  _search: function(keyword){
    this.load_start();
    var that = this;
    $.ajax('blog/body_search' , {
      type: 'GET',
      cache: false,
      data: {keyword: keyword},
      success: function(data){
        $.observable(that.items).remove(0,that.items.length);
        $.observable(that).setProperty("item_count", data.count);
        var blogs = data.body;
        blogs.forEach(function(blog){
          that._addItem(blog);
        });
        // 検索キーワードに色付け
        if (that.keyword != ""){
          that.matched_doms = $("td:contains('" + that.keyword + "')").css({'cssText': 'background-color: yellow !important;'});

          $.observable(that).setProperty("matched_num", that.matched_doms.length);
        }else{
          $.observable(that).setProperty("matched_num", 0);
        }

        $.observable(that).setProperty("matched_index", 0);
        if (that.matched_num > 0){
          $.observable(that).setProperty("matched_navi_style", "display: inline;");
        }else{
          $.observable(that).setProperty("matched_navi_style", "display: none;");
        }

        that._change_state_load_more();
        that.load_end();
      }
    });
  },

  refresh: function(){
    this.load_start();
    var that = this;
    $.ajax('blog/body' , {
      type: 'GET',
      cache: false,
      success: function(data){
        $.observable(that.items).remove(0,that.items.length);
        $.observable(that).setProperty("item_count", data.count);
        var blogs = data.body;
        blogs.forEach(function(blog){
          that._addItem(blog);
        });
        $.observable(that).setProperty("matched_num", 0);
        $.observable(that).setProperty("matched_index", 0);
        $.observable(that).setProperty("matched_navi_style", "display: none;");
        that._change_state_load_more();
 
        that.load_end();
      }
    });
  },

  load_more: function(){
    var that = this;
    if (that.keyword != ""){ return; }
    if (that.loading_more){ return; }
    
    var last_id = that.items[that.items.length - 1]._id;
    that.loading_more = true;
    $.ajax('blog/body_older' , {
      type: 'GET',
      cache: false,
      data: {_id: last_id},
      success: function(data){
        var blogs = data.body;
        blogs.forEach(function(blog){
          that._addItem(blog);
        });
        that.loading_more = false;
        that._change_state_load_more();
     }
    });
  },

  _change_state_load_more: function(){
    $.observable(this).setProperty("remain_count", this.item_count - this.items.length);
    if (this.remain_count > 0){
      $.observable(this).setProperty("load_more_style", "display: inline;");
    }else{
      $.observable(this).setProperty("load_more_style", "display: none;");
    }
  },

  add: function(){
    if (this.input_text == ""){ return; }

    var item = {text: this.input_text, name: this.name};
    var that = this;
    $.ajax('blog' , {
      type: 'POST',
      cache: false,
      data: {blog: item},
      success: function(data){
        that._pushItem(data.blog);
      }
    });

    $.observable(this).setProperty("input_text", "");
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
    var that = this;
    var index = view.index;
    var blog = this.items[index];

    // 名前・タイトルを更新
    var title = blog.text.split("\n")[0];
    $.observable(blog).setProperty("title", title);
    $.observable(blog).setProperty("name", that.name);

    var $target = $(view.contents()).closest('.blog-body');
    $target.find(".code-out").showDecora(blog.text);
    $target.find('pre').show();
    $target.find('.edit-form').hide();

    $.ajax('blog' , {
      type: 'POST',
      cache: false,
      data: {blog: {_id: blog._id, text: blog.text, name: that.name}},
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

  next: function(callback){
    var index = this.matched_index + 1;
    if (index > this.matched_num){ index = 1; }

    $.observable(this).setProperty("matched_index", index);
    callback($(this.matched_doms[this.matched_index - 1]).offset().top);
  },

  prev: function(callback){
    var index = this.matched_index - 1;
    if (index < 1){ index = this.matched_num; }

    $.observable(this).setProperty("matched_index", index);
    callback($(this.matched_doms[this.matched_index - 1]).offset().top);
  },

  _addItem: function(item){
    var id = item._id;
    for (var i = 0; i < this.items.length; i++){
      if (this.items[i]._id == id){ return; }
    }

    item.title = item.text.split("\n")[0];

    $.observable(this.items).insert(item);
    var $target = $('#' + id);
    $target.find(".code-out").showDecora(item.text);
  },

  _pushItem: function(item){
    var id = item._id;
    item.title = item.text.split("\n")[0];

    $.observable(this.items).insert(0, item);
    var $target = $('#' + id);
    $target.find(".code-out").showDecora(item.text);
  }
}
