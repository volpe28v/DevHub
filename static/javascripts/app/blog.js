global.jQuery = require('jquery');
global.$ = global.jQuery;
require('jquery-ui');
require('jquery-colorbox');
require('jquery.cookie');
var emojify = require('emojify.js');
require('perfect-scrollbar/jquery')($);
var BlogViewModel = require('./blog_view_model');
var ko = require('knockout');
require('../libs/jquery.autosize');
ko.mapping = require('knockout.mapping');
require('../libs/knockout.devhub_custom')(ko);

var COOKIE_NAME = "dev_hub_name";

$(function() {
  var name = $.cookie(COOKIE_NAME);
  emojify.setConfig({
    img_dir: 'img/emoji',  // Directory for emoji images
  });

  // スクロールバーの設定
  var scrollOption = {
    wheelSpeed: 1,
    useKeyboard: false,
    suppressScrollX: true
  };

  $('body').addClass("perfect-scrollbar-body-style");
  $('#blog_area').addClass("perfect-scrollbar-style");
  $('#blog_area').perfectScrollbar(scrollOption);
  $('#index_area').addClass("perfect-scrollbar-style");
  $('#index_area').perfectScrollbar(scrollOption);

  var blogViewModel = new BlogViewModel(
    name,
    function(){
      $('#loading').fadeIn('fast');
    },
    function(){
      $('#loading').fadeOut();
    });

  ko.applyBindings(blogViewModel);

  // ViewとViewModelをバインド
  $('#blog_form').autosize();

  $("#save_btn").click(function(){
    blogViewModel.add();
    $('#blog_form').trigger('autosize.resize');
  })

  function moveSearchIndex(offset_top){
    var target_top = offset_top;
    var base_top = $("#index_list").offset().top;
    $('#index_area').scrollTop(target_top - base_top - $(window).height()/2 + 54);
  }

  function moveSearchLine(offset_top){
    var target_top = offset_top;
    var base_top = $("#blog_list").offset().top;
    $('#blog_area').scrollTop(target_top - base_top - $(window).height()/2 + 54 );
  }

  $("#blog_list").on('inview', '.blog-body:last-child', function(event, isInView, visiblePartX, visiblePartY) {
    blogViewModel.load_more();
  });
  $("#index_list").on('inview', '.index-body:last-child', function(event, isInView, visiblePartX, visiblePartY) {
    blogViewModel.load_more();
  });

  // 初期リスト読み込み
  blogViewModel.refresh();
});
