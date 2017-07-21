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
  this.searching_regs = [];
  this.before_keyword = "";
  this.has_editing = ko.pureComputed(function(){
    var edit_items = ko.utils.arrayFilter(that.items(), function (item, index) {
      return item.editing() == true;
    });
    return edit_items.length != 0;
  });

  this.tag_filter = ko.observable("");
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
    var tag_name = this.tag_name;
    var tag_data = that.tags().filter(function(tag){ return tag.tag_name == tag_name; })[0];

    that.search_or_clear_tag(tag_data);

    $('#tags_modal').modal('hide');
  }

  this.selectTagFromList = function(data, event, element){
    that.search_or_clear_tag(data);
  }

  this.selectTagInTitle = function(data, event, element){
    if (that.load_start == null){ return; }

    var tag_name = $(element).data("tag");
    var tag_data = that.tags().filter(function(tag){ return tag.tag_name == tag_name; })[0];

    that.search_or_clear_tag(tag_data);
  }

  this.search_or_clear_tag = function(data){
    if (data.active()){
      that.searchClear();
      data.active(false);
    }else{
      that.tags().forEach(function(tag){ tag.active(false); });
      data.active(true);
      that.search_by_tag(data.tag_name);
    }
  }

  this.update = function(){
    var blog = this;
    that._update({
      blog: blog,
      is_notify: false,
      editing: false,
    });
  }

  this.updateWithNotify = function(){
    var blog = this;
    that._update({
      blog: blog,
      is_notify: true,
      editing: false,
    });
  }

  this.updateAndEditing = function(){
    var blog = this;
    that._update({
      blog: blog,
      is_notify: false,
      editing: true,
    });
  }

  this._update = function(update_info){
    var blog = update_info.blog;
    var is_notify = update_info.is_notify;
    var editing = update_info.editing;

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
        that.setTags(data.tags);
        blog.apply(data.blog, editing);
        that._update_tags();
      }
    });
  }

  this.setTags = function(tags){
    // 属性を付加
    tags.forEach(function(tag){ tag.active = ko.observable(false); });
    tags.forEach(function(tag){ tag.visible = ko.computed(function(){ return ~tag.tag_name.toLowerCase().indexOf(that.tag_filter().toLowerCase()); })});
    that.tags(tags);
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
          that.setTags(data.tags);
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
    // Ctrl - S
    if (event.ctrlKey == true && event.keyCode == 83){
      // 編集継続
      that._update({
        blog: data,
        is_notify: false,
        editing: true,
      });
      return false;
    // Ctrl - enter
    }else if (event.ctrlKey == true && event.keyCode == 13) {
      // 編集完了
      that._update({
        blog: data,
        is_notify: false,
        editing: false,
      });
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
  }

  this.selectIndexesLink = function(blog){
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

  this.selectUser = function(name){
    that.tags().forEach(function(tag){ tag.active(false); });
    that.keyword("name:" + name);
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

  this._addSearchingItems = function(blogs, regs){
    blogs.forEach(function(blog){
      var matched_doms = that._addItem(blog).find("td").map(function(){
        for (var i = 0; i < regs.length; i++){
          if ($(this).text().match(regs[i])){
            $(this).addClass("matched_line");
            return {dom: this, blog: blog};
          }
        }
        return null;
      });
      Array.prototype.push.apply(that.matched_doms, matched_doms);
    });

    that.matched_num(that.matched_doms.length);
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
        that.item_count(data.blogs.length);
        that.searched_blogs = data.blogs;
        var search_displaying_blogs = that.searched_blogs.splice(0,10);

        // 検索キーワードを含む行に色付けする
        that.matched_doms = [];
        that.searching_regs = data.keys.map(function(key){ return new RegExp(key,"i"); });
        that._addSearchingItems(search_displaying_blogs, that.searching_regs);
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

        that.setTags(data.tags);

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
          that.setTags(data.tags);
          var blogs = data.blogs;
          blogs.body.forEach(function(blog){
            that._addItem(blog, that.initialEditing);
          });
        }
      });
    }
  }

  this.load_more = function(){
    if (that.keyword() != ""){
      // 検索中の場合は残りがあれば表示する
      var search_displaying_blogs = that.searched_blogs.splice(0,5);
      that._addSearchingItems(search_displaying_blogs, that.searching_regs);
      return;
    }

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
    blog.startEdit();
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
    item.insert(row,text);
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
    return $target;
  }

  this.set_ref_point = function(){
    // dummy
  }
}

module.exports = BlogViewModel;
