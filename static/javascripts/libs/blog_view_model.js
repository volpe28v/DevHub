function BlogViewModel(name, start, end){
  var that = this;
  this.name = name;
  this.input_text = ko.observable("");
  this.items = ko.observableArray([]);
  this.item_count = ko.observable(0);
  this.remain_count = 0;
  this.keyword = ko.observable("");
  this.before_keyword = "";

  this.tags = ko.observableArray([]);

  this.matched_doms = [];
  this.matched_index = ko.observable(0);
  this.matched_num = ko.observable(0);
  this.matched_title = ko.observable("");
  this.is_visible_navi = ko.observable(false);

  this.load_start = start;
  this.load_end = end;
  this.loading_more = false;
  this.load_more_style = "none";

  this.selectTag = function(data, event, element){
    that.search_by_tag(this.tag_name);
    $('#tags_modal').modal('hide');
  }

  this.selectTagInTitle = function(data, event, element){
    var tag = $(element).data("tag");
    that.search_by_tag(tag);
  }

  this.update = function(){
    var blog = this;
    that._update(blog, false);
  }

  this.updateWithNotify = function(){
    var blog = this;
    that._update(blog, true);
  }

  this._update = function(blog, is_notify){
    blog.editing(false);

    var update_blog = ko.toJS(blog);

    update_blog.name = that.name;
    update_blog.title = that._title_plane(update_blog.text);
    update_blog.avatar = window.localStorage.avatarImage; 
    update_blog.is_notify = is_notify;
    delete update_blog.pre_text;

    $.ajax('blog' , {
      type: 'POST',
      cache: false,
      data: {blog: update_blog},
      success: function(data){
        that.tags(data.tags);
        blog.name(data.blog.name);
        blog.indexes(that._indexes(data.blog.text, data.blog._id));
        blog.avatar(data.blog.avatar);
        blog.title(data.blog.title);
        blog.date(data.blog.date);
        blog.has_avatar(data.blog.avatar != null && data.blog.avatar != "");

        that._update_tags();
      }
    });
  }

  this.cancel = function(){
    var blog = this;
    blog.text(blog.pre_text);
    blog.editing(false);
  }

  this.destroy = function(){
    if (!window.confirm('Are you sure?')){
      return true;
    }

    var blog = this;
    var remove_blog = {
      _id: blog._id()
    };

    $.ajax('blog' , {
      type: 'DELETE',
      cache: false,
      data: {blog: remove_blog},
      success: function(data){
        that.tags(data.tags);
        that._update_tags();
      }
    });

    that.items.remove(blog);
  }

  this.keydownEditing = function(data, event, element){
    // Ctrl - S or Ctrl - enter
    if ((event.ctrlKey == true && event.keyCode == 83) ||
        (event.ctrlKey == true && event.keyCode == 13)) {
      that._update(data, false);
      return false;
    }else{
      return true;
    }
  }

  this.selectIndex = function(){
    $target = $("#" + this._id());
    var target_top = $target.offset().top;
    var base_top = $("#blog_list").offset().top;
    $('#blog_area').scrollTop(target_top - base_top + 38);
 
    that.toggleIndexes(this);
  }

  this.selectIndexHeader = function(){
    var $code_out = $('#' + this.id());
    var pos = $code_out.find(":header").eq(this.no()).offset().top - $('#blog_list').offset().top;
    $('#blog_area').scrollTop(pos + 42);

    return true;
  }
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
    this.keyword("tag:" + tag);
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

        that.items([]);
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
                return {dom: this, blog: blog};
              }
            }
            return null;
          });
          var binded_blog = that.items()[that.items().length - 1];
          binded_blog.matched = matched_doms.length;

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
    this.items().forEach(function(blog){
      blog.title(that._title(blog.text()));
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

        that.tags(data.tags);

        var blogs = data.blogs;
        that.items([]);
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
        //$.observable(that.tags).refresh(data.tags);
        that.tags(data.tags);
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

    var last_id = that.items()[that.items().length - 1]._id;
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
    this.remain_count =  this.item_count() - this.items().length;
    if (this.remain_count > 0){
      this.load_more_style = "inline";
    }else{
      this.load_more_style = "none";
    }
  },

  add: function(){
    var that = this;
    if (that.input_text() == ""){ return; }

    var item = {
      title: that._title_plane(that.input_text()),
      indexes: that._indexes(that.input_text(), that._id()),
      display_indexes: false,
      text:  that.input_text(),
      name:  that.name,
      avatar: window.localStorage.avatarImage
    };

    $.ajax('blog' , {
      type: 'POST',
      cache: false,
      data: {blog: item},
      success: function(data){
        that.tags(data.tags);
        that._pushItem(data.blog);
        that._update_tags();
      }
    });

    that.input_text("");
  },

  edit: function(){
    var blog = this;
    blog.pre_text = blog.text();
    blog.editing(true);
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
        for (var i = 0; i < that.tags().length; i++){
          if (that.tags()[i].tag_name == tag){
            tag_count = that.tags()[i].count;
            break;
          }
        }

        return '<span class="tag-name label" data-tag="' + tag + '" data-bind="click: function(data, event){ return $parent.selectTagInTitle(data, event, $element)}">' + tag + ' (' + tag_count + ')' + '</span>';
      });
    return title;
  },

  _indexes: function(text, id){
    var indexes = [];

    $.decora.apply_to_deco_and_raw(text,
      function(deco_text){
        var no = 1;
        deco_text.split("\n").forEach(function(val){
          var matches = val.match(/^(#+)/);
          if (matches){
            var header_level = matches[1].length;
            var header_text = val.replace(/#/g,"");
            indexes.push({
              header: '<div class="header-level-' + header_level + '">' + header_text + '</div>',
              no: no++,
              id: id,
            });
          }
        });
      },
      function(raw_text){
      }
    );
    return indexes;
  },


  next: function(callback){
    var that = this;
    if (this.matched_index() > 0){
      $(this.matched_doms[this.matched_index() - 1].dom)
        .removeClass("matched_strong_line")
        .addClass("matched_line");
    }

    var index = this.matched_index() + 1;
    if (index > this.matched_num()){ index = 1; }

    // タイトルを取得
    var blog = this.matched_doms[index - 1].blog;
    var title = $('<div/>').html(blog.title).text();

    that.matched_index(index);
    that.matched_title(title);

    callback(
      $(".index-body [data-id=" + blog._id + "]").offset().top,
      $(this.matched_doms[this.matched_index() - 1].dom).offset().top
    );

    $(this.matched_doms[this.matched_index() - 1].dom)
      .removeClass("matched_line")
      .addClass("matched_strong_line");

    $("a:not([data-id=" + blog._id + "]).index-body-link").removeClass("matched_strong_line");
    $("[data-id=" + blog._id + "].index-body-link").addClass("matched_strong_line");
  },

  prev: function(callback){
    var that = this;
    if (this.matched_index() > 0){
      $(this.matched_doms[this.matched_index() - 1].dom)
        .removeClass("matched_strong_line")
        .addClass("matched_line");
    }

    var index = this.matched_index() - 1;
    if (index < 1){ index = this.matched_num(); }

    // タイトルを取得
    var blog = this.matched_doms[index - 1].blog;
    var title = $('<div/>').html(blog.title).text();

    that.matched_index(index);
    that.matched_title(title);
 
    callback(
      $(".index-body [data-id=" + blog._id + "]").offset().top,
      $(this.matched_doms[this.matched_index() - 1].dom).offset().top
    );

    $(this.matched_doms[this.matched_index() - 1].dom)
      .removeClass("matched_line")
      .addClass("matched_strong_line");

    $(".index-body a:not([data-id=" + blog._id + "])").removeClass("matched_strong_line");
    $(".index-body [data-id=" + blog._id + "]").addClass("matched_strong_line");
  },

  toggleIndexes: function(blog){
    this.items().forEach(function(item){
      if (item != blog){ item.display_indexes(false); }
    });

    if (blog.indexes().length <= 0){ return; }

    blog.display_indexes(!blog.display_indexes());
  },

  insertText: function(item, row, text){
    var text_array = item.text.split("\n");
    text_array.splice(row,0,text);
    item.text = text_array.join("\n");
  },

  _addItem: function(item){
    var that = this;
    var id = item._id;
    for (var i = 0; i < this.items().length; i++){
      if (this.items()[i]._id == id){ return; }
    }

    item.title = this._title(item.text);
    item.indexes = this._indexes(item.text, item._id);
    item.display_indexes = false;
    item.has_avatar = (item.avatar != null && item.avatar != "");
    item.matched = 0;
    item.editing = false;

    var mapped_item = ko.mapping.fromJS(item);

    that.items.push(mapped_item);

    var $target = $('#' + id);
    this._setDropZone(mapped_item, $target.find('.edit-area'));
    return $target;
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

    var mapped_item = ko.mapping.fromJS(item);
    that.items.unshift(mapped_item);

    var $target = $('#' + id);
    this._setDropZone(mapped_item, $target.find('.edit-area'));
  }
}
