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
    useKeyboard: false,
    suppressScrollX: true
  };

  $('body').addClass("perfect-scrollbar-body-style");
  $('#blog_area').addClass("perfect-scrollbar-style");
  $('#blog_area').perfectScrollbar(scrollOption);
  $('#index_header_area').addClass("perfect-scrollbar-style");
  $('#index_header_area').perfectScrollbar(scrollOption);

  var blogViewModel = new BlogViewModel(
    name,
    function(){},
    function(){}
  );

  ko.applyBindings(blogViewModel);

  blogViewModel.loadByID(BLOG_ID);
});
