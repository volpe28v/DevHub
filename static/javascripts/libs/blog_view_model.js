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
  this.matched_title = "";

  this.load_start = start;
  this.load_end = end;
  this.loading_more = false;
  this.load_more_style = "display: none;";
}

BlogViewModel.prototype = {
  hasKeyword: function(){
    return this.keyword != "" ? true : false;
  },

  search: function(){
    // キーワード無しの場合は全blog更新
    if (this.keyword == ""){
      this.before_keyword = "";
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

        // 検索キーワードを含む行に色付けする
        that.matched_doms = [];
        var reg_keywords = that.keyword.split(" ").map(function(key){ return new RegExp(key,"i"); });
        blogs.forEach(function(blog){
          var matched_doms = that._addItem(blog).find("td").map(function(){
            for (var i = 0; i < reg_keywords.length; i++){
              if ($(this).text().match(reg_keywords[i])){
                $(this).addClass("matched_line");
                return this;
              }
            }
            return null;
          });
          var blog = that.items[that.items.length - 1];
          $.observable(blog).setProperty("matched", matched_doms.length);

          Array.prototype.push.apply(that.matched_doms, matched_doms);
        });

        $.observable(that).setProperty("matched_num", that.matched_doms.length);
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

  // for Permalink
  loadByID: function(id){
    var that = this;
    $.ajax('blog/body' , {
      type: 'GET',
      cache: false,
      data: {_id: id},
      success: function(data){
        var blogs = data.body;
        blogs.forEach(function(blog){
          that._addItem(blog);
        });
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

    var item = {
      title: this._title(this.input_text),
      text:  this.input_text,
      name:  this.name
    };
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
    var title = that._title(blog.text);
    $.observable(blog).setProperty("title", title);
    $.observable(blog).setProperty("name", that.name);

    var $target = $(view.contents()).closest('.blog-body');
    $target.find(".code-out").showDecora(blog.text);
    $target.find('pre').show();
    $target.find('.edit-form').hide();

    var id = $target.attr("id");
    var $index_title = $(".index-body [data-id=" + id + "] .share-memo-title");
    emojify.run($index_title.get(0));

    $.ajax('blog' , {
      type: 'POST',
      cache: false,
      data: {blog: {_id: blog._id, text: blog.text, name: that.name}},
      success: function(data){
        $.observable(blog).setProperty("date", data.blog.date);
      }
    });
  },

  _title: function(text){
    var blog_lines = text.split('\n');
    var title = "";
    for (var i = 0; i < blog_lines.length; i++){
      var line = blog_lines[i];
      var matched = line.match(/(\S+)/);
      if (matched){
        title = blog_lines[i];
        break;
      }
    };

    title = $('<div/>').html($.decora.to_html(title)).text();
    return title;
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
    $(this.matched_doms[this.matched_index - 1])
      .removeClass("matched_strong_line")
      .addClass("matched_line");

    var index = this.matched_index + 1;
    if (index > this.matched_num){ index = 1; }

    // タイトルを取得
    var view_index = $.view($(this.matched_doms[index - 1])).index;
    var blog = this.items[view_index];
    var title = this._title(blog.text);

    $.observable(this).setProperty({
      "matched_index": index,
      "matched_title": title
    });
    callback($(this.matched_doms[this.matched_index - 1]).offset().top);

    $(this.matched_doms[this.matched_index - 1])
      .removeClass("matched_line")
      .addClass("matched_strong_line");

    $(".index-body a:not([data-id=" + blog._id + "])").removeClass("matched_strong_line");
    $(".index-body [data-id=" + blog._id + "]").addClass("matched_strong_line");
  },

  prev: function(callback){
    $(this.matched_doms[this.matched_index - 1])
      .removeClass("matched_strong_line")
      .addClass("matched_line");

    var index = this.matched_index - 1;
    if (index < 1){ index = this.matched_num; }

    // タイトルを取得
    var view_index = $.view($(this.matched_doms[index - 1])).index;
    var blog = this.items[view_index];
    var title = this._title(blog.text);

    $.observable(this).setProperty({
      "matched_index": index,
      "matched_title": title
    });

    callback($(this.matched_doms[this.matched_index - 1]).offset().top);

    $(this.matched_doms[this.matched_index - 1])
      .removeClass("matched_line")
      .addClass("matched_strong_line");

    $(".index-body a:not([data-id=" + blog._id + "])").removeClass("matched_strong_line");
    $(".index-body [data-id=" + blog._id + "]").addClass("matched_strong_line");
  },

  _addItem: function(item){
    var id = item._id;
    for (var i = 0; i < this.items.length; i++){
      if (this.items[i]._id == id){ return; }
    }

    item.title = this._title(item.text);

    $.observable(this.items).insert(item);
    var $target = $('#' + id);
    $target.find(".code-out").showDecora(item.text);

    var id = $target.attr("id");
    var $index_title = $(".index-body [data-id=" + id + "] .share-memo-title");
    emojify.run($index_title.get(0));

    return $target;
  },

  _pushItem: function(item){
    var id = item._id;
    item.title = this._title(item.text);

    $.observable(this.items).insert(0, item);
    var $target = $('#' + id);
    $target.find(".code-out").showDecora(item.text);
  }
}
