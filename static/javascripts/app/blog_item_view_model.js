global.jQuery = require('jquery');
global.$ = global.jQuery;

var ko = require('knockout');
var Clipboard = require('clipboard');
require('../libs/jquery.decora');

function BlogItemViewModel(item, parent){
  var that = this;

  that._id = ko.observable();
  that.name = ko.observable("");
  that.title = ko.observable("");
  that.text = ko.observable("");
  that.editing_text = ko.observable("");
  that.indexes = ko.observableArray([]);
  that.display_indexes = ko.observable(false);
  that.avatar = ko.observable("");
  that.date = ko.observable("");
  that.has_avatar = ko.observable(false);
  that.matched = ko.observable(0);
  that.editing = ko.observable(false);
  that.copy_title = ko.observable("");
  that.edit_text_changed = ko.observable(false);

  that.editing_text.subscribe(function (val){
    that.edit_text_changed(true);
  });

  that.delayedText = ko.pureComputed(this.editing_text)
    .extend({ rateLimit: { method: "notifyWhenChangesStop", timeout: 500 } });

  that.delayedText.subscribe(function (val) {
    that.indexes(that._indexes(val, that._id()));
    that.title(that._title(val));
  }, that);

  that.isNew = ko.computed(function(){
    return that._id() == null;
  });

  this.initialize = function(item, parent){
    that.parent = parent;

    if (item == null){
      console.log("item is null");
      return;
    }

    that.apply(item);
  }

  this.apply = function(item, editing){
    that._id(item._id);
    that.name(item.name);
    that.title(that._title(item.text));
    that.text(item.text);
    that.editing_text(item.text);
    that.indexes(that._indexes(item.text, item._id));
    that.display_indexes(false);
    that.avatar(item.avatar);
    that.date(item.date);
    that.has_avatar((item.avatar != null && item.avatar != ""));
    that.matched(0);
    that.editing(editing);
    that.copy_title(that._createCopyTitle(item.text, item._id));
    that.edit_text_changed(false);
  }

  this.startEdit = function(){
    that.editing_text(that.text());
    that.editing(true);
    that.edit_text_changed(false);
  }

  this.updateEdit = function(){
    that.text(that.editing_text());
    that.indexes(that._indexes(that.text(), that._id()));
  } 
 
  this.cancelEdit = function(){
    that.title(that._title(that.text()));
    that.indexes(that._indexes(that.text(), that._id()));
    that.editing(false);
  }

  this.updateTitle = function(){
    that.title(that._title(that.text()));
  }

  this.insert = function(row, text){
    var text_array = that.editing_text().split("\n");
    text_array.splice(row,0,text);
    that.editing_text(text_array.join("\n"));
  }

  this.toJS = function(){
    return {
      _id: that._id(),
      title: that._title_plane(that.text()),
      text: that.text()
    };
  }

  this._title = function(text){
    var title = that._title_plane(text);

    // タグ装飾
    title = title.replace(/\[(.+?)\]/g,
      function(){
        var tag = arguments[1];
        var tag_count = 0;
        for (var i = 0; i < that.parent.tags().length; i++){
          if (that.parent.tags()[i].tag_name == tag){
            tag_count = that.parent.tags()[i].count;
            break;
          }
        }

        return '<span class="tag-name label" data-tag="' + tag + '" data-bind="click: function(data, event){ return $parent.selectTagInTitle(data, event, $element)}">' + tag + ' (' + tag_count + ')' + '</span>';
      });
    return title;
  }

  this._title_plane = function(text){
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
  }

  this._createCopyTitle = function(text, id){
    var plane_title = that._title_plane(text);
    var url_base = location.href.split('?')[0];
    return '[' + plane_title + '](' + url_base + '?id=' + id + ')';
  }

  this._indexes = function(text, id){
    var indexes = [];

    var no = 1;
    $.decora.apply_to_deco_and_raw(text,
      function(deco_text){
        deco_text.split("\n").forEach(function(val){
          var matches = val.match(/^(#+)/);
          if (matches){
            var header_level = matches[1].length;
            var header_text = val;
            indexes.push({
              index_class: "header-level-" + header_level,
              body: $.decora.to_html(header_text),
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
  }

  this.editSpecificRow = function(){
    // dummy
  }

  that.initialize(item, parent);
}

module.exports = BlogItemViewModel;
