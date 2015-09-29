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
    this.keyword = $('.search-query').val().replace(/^[\s　]+|[\s　]+$/g, "");
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
          var binded_blog = that.items[that.items.length - 1];
          $.observable(binded_blog).setProperty("matched", matched_doms.length);

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
    this.remain_count =  this.item_count - this.items.length;
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
      indexes: this._indexes(this.input_text),
      display_indexes: "display: none",
      text:  this.input_text,
      name:  this.name,
      avatar: window.localStorage.avatarImage
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
    $target.find('textarea').caretLine(0);
    $target.find('textarea').focus().autofit({min_height: 100});
  },

  update: function(view, is_notify){
    var that = this;
    var index = view.index;
    var blog = this.items[index];

    // 名前・タイトルを更新
    var title = that._title(blog.text);
    var indexes = this._indexes(blog.text);
    $.observable(blog).setProperty("title", title);
    $.observable(blog).setProperty("name", that.name);
    $.observable(blog).setProperty("indexes", indexes);

    var $target = $(view.contents()).closest('.blog-body');
    $target.find('pre').show();
    $target.find('.edit-form').hide();

    this._decorate(blog);

    $.ajax('blog' , {
      type: 'POST',
      cache: false,
      data: {blog: {
        _id: blog._id,
        title: title,
        text: blog.text,
        name: that.name,
        is_notify: is_notify
      }},
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

  _indexes: function(text){
    var indexes = [];
    text.split("\n").forEach(function(val){
      var matches = val.match(/^(#+)/);
      if (matches){
        var header_level = matches[1].length;
        var header_text = val.replace(/#/g,"");
        indexes.push({header: '<div class="header-level-' + header_level + '">' + header_text + '</div>'});
      }
    });
    return indexes;
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
    callback(
      $(".index-body [data-id=" + blog._id + "]").offset().top,
      $(this.matched_doms[this.matched_index - 1]).offset().top
    );

    $(this.matched_doms[this.matched_index - 1])
      .removeClass("matched_line")
      .addClass("matched_strong_line");

    $("a:not([data-id=" + blog._id + "]).index-body-link").removeClass("matched_strong_line");
    $("[data-id=" + blog._id + "].index-body-link").addClass("matched_strong_line");
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

    callback(
      $(".index-body [data-id=" + blog._id + "]").offset().top,
      $(this.matched_doms[this.matched_index - 1]).offset().top
    );

    $(this.matched_doms[this.matched_index - 1])
      .removeClass("matched_line")
      .addClass("matched_strong_line");

    $(".index-body a:not([data-id=" + blog._id + "])").removeClass("matched_strong_line");
    $(".index-body [data-id=" + blog._id + "]").addClass("matched_strong_line");
  },

  toggleIndexes: function(view){
    var index = view.index;
    var blog = this.items[index];

    if (blog.indexes.length <= 0){ return; }

    if (blog.display_indexes == "display: none"){
      $.observable(blog).setProperty("display_indexes", "display: block");
    }else{
      $.observable(blog).setProperty("display_indexes", "display: none");
    }
  },

  insertText: function(item, row, text){
    var text_array = item.text.split("\n");
    text_array.splice(row,0,text);
    $.observable(item).setProperty("text", text_array.join("\n"));
  },

  _addItem: function(item){
    var that = this;
    var id = item._id;
    for (var i = 0; i < this.items.length; i++){
      if (this.items[i]._id == id){ return; }
    }

    item.title = this._title(item.text);
    item.indexes = this._indexes(item.text);
    item.display_indexes = "display: none";

    $.observable(this.items).insert(item);

    var $target = $('#' + id);
    this._setDropZone(item, $target.find('.edit-area'));
    return this._decorate(item);
  },

  _setDropZone: function(item, $target){
    var that = this;

    // 編集モードへのドロップ
    new DropZone({
      dropTarget: $target,
        alertTarget: $('#loading'),
        pasteValid: true,
        uploadedAction: function(context, res){
          var row = $(context).caretLine();

          // メモのキャレット位置にファイルを差し込む
          that.insertText(item, row - 1, res.fileName + " ");
          $(context).caretLine(row);
        }
    });
  },

  _pushItem: function(item){
    var id = item._id;
    item.title = this._title(item.text);

    $.observable(this.items).insert(0, item);

    var $target = $('#' + id);
    this._setDropZone(item, $target.find('.edit-area'));
    this._decorate(item);
  },

  _decorate: function(item){
    var id = item._id;
    var $target = $('#' + id);
    $target.find(".code-out").showDecora(item.text);
    $target.find(".code-out tr:first").hide();
    var $body_tooltip = $target.find("span[rel=tooltip]");
    if ($body_tooltip != null){
      $body_tooltip.tooltip({placement: 'bottom'});
    }

    var $blog_title = $target.find(".blog-title");
    emojify.run($blog_title.get(0));

    var $index_title = $(".index-body [data-id=" + id + "] .share-memo-title");
    emojify.run($index_title.get(0));

    var $indexes = $(".index-body [data-id=" + id + "] .index-li");
    $indexes.each(function(){
      emojify.run($(this).get(0));
    });

    var $tooltip = $(".index-body [data-id=" + id + "] span[rel=tooltip]");
    if ($tooltip != null){
      $tooltip.tooltip({placement: 'left'});
    }

    return $target;
  }
}
