global.jQuery = require('jquery');
global.$ = global.jQuery;
global.moment = require('moment');
require('../libs/moment.lang_ja');
require('jquery-ui');
require('jquery-colorbox');
require('jquery.cookie');
require('../libs/livestamp');
require('perfect-scrollbar/jquery')($);
var BlogViewModel = require('./blog_view_model');
var ko = require('knockout');
require('../libs/jquery.autosize');
ko.mapping = require('knockout.mapping');
require('../libs/knockout.devhub_custom')(ko);


var COOKIE_NAME = "dev_hub_name";
var CODE_INDEX_ADJUST_HEIGHT = 10;

$(function() {
  var name = $.cookie(COOKIE_NAME);

  $('a[rel=tooltip]').tooltip({
    placement : 'bottom'
  });

  // スクロールバーの設定
  var scrollOption = {
    wheelSpeed: 1,
    useKeyboard: true,
    suppressScrollX: true
  };

  $('body').addClass("perfect-scrollbar-body-style");
  $('#blog_area').addClass("perfect-scrollbar-style");
  $('#blog_area').perfectScrollbar(scrollOption);
  $('#index_header_area').addClass("perfect-scrollbar-style");
  $('#index_header_area').perfectScrollbar(scrollOption);

  var blogViewModel = new BlogViewModel(
    name,
    null,
    null,
    Editing
  );

  blogViewModel.has_editing.subscribe(function(editing){
    if (editing){
      $('#blog_area').perfectScrollbar('destroy');
    }else{
      $('#blog_area').perfectScrollbar(scrollOption);
    }
  });

  ko.applyBindings(blogViewModel);

  blogViewModel.loadByID(BLOG_ID);
});
