global.jQuery = require('jquery');
global.$ = global.jQuery;

var ko = require('knockout');
var Clipboard = require('clipboard');
require('../libs/jquery.decora');
require('sweetalert');
var DropZone = require('../libs/dropzone');
var BlogItemViewModel = require('./blog_item_view_model');

function BlogViewModel(name, start, end, editing){
  var that = this;
  this.name = name;
  this.initialEditing = editing;
  this.input_text = ko.observable("");
  this.items = ko.observableArray([]);
  this.item_count = ko.observable(0);
  this.remain_count = 0;
  this.keyword = ko.observable("");
  this.before_keyword = "";
  this.has_editing = ko.pureComputed(function(){
    var edit_items = ko.utils.arrayFilter(that.items(), function (item, index) {
      return item.editing() == true;
    });
    return edit_items.length != 0;
  });

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

  this.clipboard = new Clipboard('.clip');

  this.selectTag = function(data, event, element){
    that.search_by_tag(this.tag_name);
    $('#tags_modal').modal('hide');
  }

  this.selectTagInTitle = function(data, event, element){
    if (that.load_start == null){ return; }

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
    blog.updateEdit();
    var update_blog = blog.toJS();
    if (update_blog.title == ""){ return; }

    update_blog.name = that.name;
    update_blog.avatar = window.localStorage.avatarImage;
    update_blog.is_notify = is_notify;

    $.ajax('blog' , {
      type: 'POST',
      cache: false,
      data: {blog: update_blog},
      success: function(data){
        console.log(data);
        that.tags(data.tags);
        blog.apply(data.blog);
        that._update_tags();
      }
    });
  }

  this.cancel = function(){
    var blog = this;

    if (blog._id() == undefined){
      var url_base = location.href.split('?')[0];
      location.href = url_base;
      return;
    }

    blog.cancelEdit();
  }

  this.destroy = function(goto_blog){
    var blog = this;
    swal({
      title: "Are you sure?",
      text: "You will not be able to recover this blog!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!",
      closeOnConfirm: true
    },function(){
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

          if (goto_blog){
            location.href = "/blog";
          }
        }
      });

      $('#' + blog._id()).fadeOut('normal', function(){
        that.items.remove(blog);
      });
    });
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

  this.selectIndex = function(blog){
    $target = $("#" + blog._id());
    var target_top = $target.offset().top;
    var base_top = $("#blog_list").offset().top;
    $('#blog_area').scrollTop(target_top - base_top);

    that.toggleIndexes(blog);
  }

  this.selectIndexHeader = function(offset, blog){
    var specify_offset = offset ? offset : 0;

    var $code_out = $('#' + blog.id);
    var pos = $code_out.find(":header").eq(blog.no).offset().top - $('#blog_list').offset().top;
    $('#blog_area').scrollTop(pos + specify_offset);

    return true;
  }

  this.moveTop = function(){
    $('#blog_area').animate({ scrollTop: 0 }, 'fast');
    $('#index_area').animate({ scrollTop: 0 }, 'fast');
  }

  this.moveSearchIndex = function(offset_top){
    var target_top = offset_top;
    var base_top = $("#index_list").offset().top;
    $('#index_area').scrollTop(target_top - base_top - $(window).height()/2 + 54);
  }

  this.moveSearchLine = function(offset_top){
    var target_top = offset_top;
    var base_top = $("#blog_list").offset().top;
    $('#blog_area').scrollTop(target_top - base_top - $(window).height()/2 + 54 );
  }

  this.searchClear = function(){
    this.keyword("");
    this.search();
  }

  this.submitSearch = function(){
    var that = this;
    if(!that.search()){
      // 検索済みの場合はマッチ箇所に移動する
      that.next(function(index_top, blog_top){
        that.moveSearchIndex(index_top);
        that.moveSearchLine(blog_top);
      });
    }
    return false;
  }

  this.moveNextMatch = function(){
    var that = this;
    that.next(function(index_top, blog_top){
      that.moveSearchIndex(index_top);
      that.moveSearchLine(blog_top);
    });
  }

  this.movePrevMatch = function(){
    var that = this;
    that.prev(function(index_top, blog_top){
      that.moveSearchIndex(index_top);
      that.moveSearchLine(blog_top);
    });
  }

  this.keydownBlogForm = function(data, event, element){
    var that = this;
    // Ctrl - S or Ctrl - enter
    if ((event.ctrlKey == true && event.keyCode == 83) ||
      (event.ctrlKey == true && event.keyCode == 13)) {
      $(element).blur(); //入力を確定するためにフォーカス外す
      that.add();
      return false;
    }

    return true;
  }

  this.hasKeyword = function(){
    return that.keyword() != "" ? true : false;
  }

  this.search_by_tag = function(tag){
    that.keyword("tag:" + tag);
    that.search();
  }

  this.search = function(){
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
  }

  this._search = function(keyword){
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
  }

  this._update_tags = function(){
    var that = this;
    // 全タグ数を更新
    this.items().forEach(function(blog){
      blog.updateTitle();
    });
  }

  this.refresh = function(){
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
  }

  // for Permalink
  this.loadByID = function(id){
    if (id == ""){
      // 新規追加画面
      var blog = {
        text: "",
        _id: undefined,
        date: new Date(),
      };
      that._addItem(blog, that.initialEditing);
    }else{
      $.ajax('blog/body' , {
        type: 'GET',
        cache: false,
        data: {_id: id},
        success: function(data){
          that.tags(data.tags);
          var blogs = data.blogs;
          blogs.body.forEach(function(blog){
            that._addItem(blog, that.initialEditing);
          });
        }
      });
    }
  }

  this.load_more = function(){
    if (that.keyword() != ""){ return; }
    if (that.loading_more){ return; }

    var last_id = that.items()[that.items().length - 1]._id();
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
  }

  this._change_state_load_more = function(){
    that.remain_count =  that.item_count() - that.items().length;
    if (that.remain_count > 0){
      that.load_more_style = "inline";
    }else{
      that.load_more_style = "none";
    }
  },

  this.edit = function(blog){
    blog.editing_text(blog.text());
    blog.editing(true);
  }

  this.next = function(callback){
    if (that.matched_index() > 0){
      $(that.matched_doms[this.matched_index() - 1].dom)
        .removeClass("matched_strong_line")
        .addClass("matched_line");
    }

    var index = that.matched_index() + 1;
    if (index > that.matched_num()){ index = 1; }

    // タイトルを取得
    var blog = that.matched_doms[index - 1].blog;
    var title = $('<div/>').html(blog.title).text();

    that.matched_index(index);
    that.matched_title(title);

    callback(
      $(".index-body [data-id=" + blog._id + "]").offset().top,
      $(that.matched_doms[that.matched_index() - 1].dom).offset().top
    );

    $(that.matched_doms[that.matched_index() - 1].dom)
      .removeClass("matched_line")
      .addClass("matched_strong_line");

    $("a:not([data-id=" + blog._id + "]).index-body-link").removeClass("matched_strong_line");
    $("[data-id=" + blog._id + "].index-body-link").addClass("matched_strong_line");
  }

  this.prev = function(callback){
    if (that.matched_index() > 0){
      $(that.matched_doms[that.matched_index() - 1].dom)
        .removeClass("matched_strong_line")
        .addClass("matched_line");
    }

    var index = that.matched_index() - 1;
    if (index < 1){ index = that.matched_num(); }

    // タイトルを取得
    var blog = that.matched_doms[index - 1].blog;
    var title = $('<div/>').html(blog.title).text();

    that.matched_index(index);
    that.matched_title(title);

    callback(
      $(".index-body [data-id=" + blog._id + "]").offset().top,
      $(that.matched_doms[that.matched_index() - 1].dom).offset().top
    );

    $(that.matched_doms[that.matched_index() - 1].dom)
      .removeClass("matched_line")
      .addClass("matched_strong_line");

    $(".index-body a:not([data-id=" + blog._id + "])").removeClass("matched_strong_line");
    $(".index-body [data-id=" + blog._id + "]").addClass("matched_strong_line");
  }

  this.toggleIndexes = function(blog){
    that.items().forEach(function(item){
      if (item != blog){ item.display_indexes(false); }
    });

    if (blog.indexes().length <= 0){ return; }

    blog.display_indexes(!blog.display_indexes());
  }

  this.insertText = function(item, row, text){
    var text_array = item.text().split("\n");
    text_array.splice(row,0,text);
    item.text(text_array.join("\n"));
  }

  this._addItem = function(item, initialEditing){
    var id = item._id;
    for (var i = 0; i < that.items().length; i++){
      if (that.items()[i]._id == id){ return; }
    }

    var blog_item = new BlogItemViewModel(item,that);

    that.items.push(blog_item);

    if (initialEditing){
      that.edit(blog_item);
    }

    var $target = $('#' + id);
    that._setDropZone(blog_item, $target.find('.edit-area'));
    return $target;
  }

  this._setDropZone = function(item, $target){
    // 編集モードへのドロップ
    new DropZone({
      dropTarget: $target,
        alertTarget: $('#loading'),
        pasteValid: true,
        uploadedAction: function(context, res){
          if (res.fileName == null){ return; }
          var row = $(context).caretLine();

          // メモのキャレット位置にファイルを差し込む
          that.insertText(item, row - 1, res.fileName + " ");
          $(context).caretLine(row);
        }
    });
  }

  this.set_ref_point = function(){
    // dummy
  }
}

module.exports = BlogViewModel;
