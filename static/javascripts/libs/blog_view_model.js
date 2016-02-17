function BlogViewModel(name, start, end){
  var that = this;
  this.name = name;
  this.input_text = ko.observable("");
  this.items = [];
  this.item_count = ko.observable(0);
  this.remain_count = 0;
  this.keyword = ko.observable("");
  this.before_keyword = "";

  this.tags = [];

  this.matched_doms = [];
  this.matched_index = ko.observable(0);
  this.matched_num = ko.observable(0);
  this.matched_title = ko.observable("");
  this.is_visible_navi = ko.observable(false);

  this.load_start = start;
  this.load_end = end;
  this.loading_more = false;
  this.load_more_style = "display: none;";
}

BlogViewModel.prototype = {
  moveTop: function(){
    $('#blog_area').animate({ scrollTop: 0 }, 'fast');
    $('#index_area').animate({ scrollTop: 0 }, 'fast');
  },
 
  moveSearchIndex: function(offset_top){
    var target_top = offset_top;
    var base_top = $("#index_list").offset().top;
    $('#index_area').scrollTop(target_top - base_top - $(window).height()/2 + 54);
  },

  moveSearchLine: function(offset_top){
    var target_top = offset_top;
    var base_top = $("#blog_list").offset().top;
    $('#blog_area').scrollTop(target_top - base_top - $(window).height()/2 + 54 );
  },

  searchClear: function(){
    this.keyword("");
    this.search();
  },
 
  submitSearch: function(){
    var that = this;
    if(!that.search()){
      // 検索済みの場合はマッチ箇所に移動する
      that.next(function(index_top, blog_top){
        that.moveSearchIndex(index_top);
        that.moveSearchLine(blog_top);
      });
    }
    return false;
  },
 
  moveNextMatch: function(){
    var that = this;
    that.next(function(index_top, blog_top){
      that.moveSearchIndex(index_top);
      that.moveSearchLine(blog_top);
    });
  },

  movePrevMatch: function(){
    var that = this;
    that.prev(function(index_top, blog_top){
      that.moveSearchIndex(index_top);
      that.moveSearchLine(blog_top);
    });
  },

  keydownBlogForm: function(data, event, element){
    var that = this;
    // Ctrl - S or Ctrl - enter
    if ((event.ctrlKey == true && event.keyCode == 83) ||
      (event.ctrlKey == true && event.keyCode == 13)) {
      $(element).blur(); //入力を確定するためにフォーカス外す
      that.add();
      $('#blog_form').trigger('autosize.resize');
      return false;
    }

    return true;
  },
 
  hasKeyword: function(){
    return this.keyword() != "" ? true : false;
  },

  search_by_tag: function(tag){
    $('.search-query').val("tag:" + tag);
    $('.search-query').trigger("keyup");
    this.search();
  },

  search: function(){
    this.keyword($('.search-query').val().replace(/^[\s　]+|[\s　]+$/g, ""));
    // キーワード無しの場合は全blog更新
    if (this.keyword() == ""){
      this.before_keyword = "";
      this.refresh();
      return true;
    }

    // キーワード変化無しの場合は移動モード
    if (this.before_keyword == this.keyword()){ return false; }

    // 検索
    this.before_keyword = this.keyword();
    this._search(this.keyword());
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
        // 検索後にスクロールを上部へ
        $('#index_area').scrollTop(0);
        $('#blog_area').scrollTop(0);

        $.observable(that.items).remove(0,that.items.length);
        that.item_count(data.count);
        var blogs = data.body;

        // 検索キーワードを含む行に色付けする
        that.matched_doms = [];
        var reg_keywords = that.keyword().split(" ").map(function(key){ return new RegExp(key,"i"); });
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

        that.matched_num(that.matched_doms.length);
        that.matched_index(0);

        if (that.matched_num() > 0){
          that.is_visible_navi(true);
        }else{
          that.is_visible_navi(false);
        }

        that._change_state_load_more();
        that.load_end();

      }
    });
  },

  _update_tags: function(){
    var that = this;
    // 全タグ数を更新
    this.items.forEach(function(blog){
      $.observable(blog).setProperty("title", that._title(blog.text));
    });
  },

  refresh: function(){
    this.load_start();
    var that = this;
    $.ajax('blog/body' , {
      type: 'GET',
      cache: false,
      success: function(data){
        $('#index_area').scrollTop(0);
        $('#blog_area').scrollTop(0);

        $.observable(that.tags).refresh(data.tags);

        var blogs = data.blogs;
        $.observable(that.items).remove(0,that.items.length);
        that.item_count(blogs.count);
        blogs.body.forEach(function(blog){
          that._addItem(blog);
        });
        that.matched_num(0);
        that.matched_index(0);
        that.is_visible_navi(false);
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
        $.observable(that.tags).refresh(data.tags);
        var blogs = data.blogs;
        blogs.body.forEach(function(blog){
          that._addItem(blog);
        });
      }
    });
  },

  load_more: function(){
    var that = this;
    if (that.keyword() != ""){ return; }
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
    this.remain_count =  this.item_count() - this.items.length;
    if (this.remain_count > 0){
      $.observable(this).setProperty("load_more_style", "display: inline;");
    }else{
      $.observable(this).setProperty("load_more_style", "display: none;");
    }
  },

  add: function(){
    var that = this;
    if (that.input_text() == ""){ return; }

    var item = {
      title: that._title_plane(that.input_text()),
      indexes: that._indexes(that.input_text()),
      display_indexes: "display: none",
      text:  that.input_text(),
      name:  that.name,
      avatar: window.localStorage.avatarImage
    };

    $.ajax('blog' , {
      type: 'POST',
      cache: false,
      data: {blog: item},
      success: function(data){
        $.observable(that.tags).refresh(data.tags);
        that._pushItem(data.blog);
        that._update_tags();
      }
    });

    //$.observable(this).setProperty("input_text", "");
    that.input_text("");
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

    var $target = $(view.contents()).closest('.blog-body');
    $target.find('pre').show();
    $target.find('.edit-form').hide();

    $.ajax('blog' , {
      type: 'POST',
      cache: false,
      data: {blog: {
        _id: blog._id,
        title: this._title_plane(blog.text),
        text: blog.text,
        name: that.name,
        avatar: window.localStorage.avatarImage,
        is_notify: is_notify
      }},
      success: function(data){
        $.observable(that.tags).refresh(data.tags);
        $.observable(blog).setProperty("name", data.blog.name);
        $.observable(blog).setProperty("indexes", that._indexes(data.blog.text));
        $.observable(blog).setProperty("avatar", data.blog.avatar);
        $.observable(blog).setProperty("title", that._title(data.blog.title));
        $.observable(blog).setProperty("date", data.blog.date);
        that._decorate(blog);
        that._update_tags();
      }
    });
  },

  _title_plane: function(text){
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

  _title: function(text){
    var title = this._title_plane(text);
    var that = this;

    // タグ装飾
    title = title.replace(/\[(.+?)\]/g,
      function(){
        var tag = arguments[1];
        var tag_count = 0;
        for (var i = 0; i < that.tags.length; i++){
          if (that.tags[i].tag_name == tag){
            tag_count = that.tags[i].count;
          }
        }

        return '<span class="tag-name label" data-tag="' + tag + '">' + tag + ' (' + tag_count + ')' + '</span>';
      });
    return title;
  },

  _indexes: function(text){
    var indexes = [];

    $.decora.apply_to_deco_and_raw(text,
      function(deco_text){
        deco_text.split("\n").forEach(function(val){
          var matches = val.match(/^(#+)/);
          if (matches){
            var header_level = matches[1].length;
            var header_text = val.replace(/#/g,"");
            indexes.push({header: '<div class="header-level-' + header_level + '">' + header_text + '</div>'});
          }
        });
      },
      function(raw_text){
      }
    );
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
    var that = this;
    var index = view.index;
    var remove_blog = {};
    remove_blog._id = this.items[index]._id;

    $.ajax('blog' , {
      type: 'DELETE',
      cache: false,
      data: {blog: remove_blog},
      success: function(data){
        $.observable(that.tags).refresh(data.tags);
        that._update_tags();
      }
    });

    $.observable(this.items).remove(index);
  },

  next: function(callback){
    var that = this;
    $(this.matched_doms[this.matched_index() - 1])
      .removeClass("matched_strong_line")
      .addClass("matched_line");

    var index = this.matched_index() + 1;
    if (index > this.matched_num()){ index = 1; }

    // タイトルを取得
    var view_index = $.view($(this.matched_doms[index - 1])).index;
    var blog = this.items[view_index];
    var title = this._title(blog.text);

    that.matched_index(index);
    that.matched_title(title);

    callback(
      $(".index-body [data-id=" + blog._id + "]").offset().top,
      $(this.matched_doms[this.matched_index() - 1]).offset().top
    );

    $(this.matched_doms[this.matched_index() - 1])
      .removeClass("matched_line")
      .addClass("matched_strong_line");

    $("a:not([data-id=" + blog._id + "]).index-body-link").removeClass("matched_strong_line");
    $("[data-id=" + blog._id + "].index-body-link").addClass("matched_strong_line");
  },

  prev: function(callback){
    var that = this;
    $(this.matched_doms[this.matched_index() - 1])
      .removeClass("matched_strong_line")
      .addClass("matched_line");

    var index = this.matched_index() - 1;
    if (index < 1){ index = this.matched_num(); }

    // タイトルを取得
    var view_index = $.view($(this.matched_doms[index - 1])).index;
    var blog = this.items[view_index];
    var title = this._title(blog.text);

    that.matched_index(index);
    that.matched_title(title);
 
    callback(
      $(".index-body [data-id=" + blog._id + "]").offset().top,
      $(this.matched_doms[this.matched_index() - 1]).offset().top
    );

    $(this.matched_doms[this.matched_index() - 1])
      .removeClass("matched_line")
      .addClass("matched_strong_line");

    $(".index-body a:not([data-id=" + blog._id + "])").removeClass("matched_strong_line");
    $(".index-body [data-id=" + blog._id + "]").addClass("matched_strong_line");
  },

  toggleIndexes: function(view){
    var index = view.index;
    var blog = this.items[index];
    for (var i = 0; i < this.items.length ; i++){
      if (this.items[i] != blog){
        $.observable(this.items[i]).setProperty("display_indexes", "display: none");
      }
    }

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
