var COOKIE_NAME = "dev_hub_name";
var CODE_INDEX_ADJUST_HEIGHT = 10;

$(function() {
  var name = $.cookie(COOKIE_NAME);
  emojify.setConfig({
    img_dir: 'img/emoji',  // Directory for emoji images
  });

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
  $('#blog_permalink_area').addClass("perfect-scrollbar-style");
  $('#blog_permalink_area').perfectScrollbar(scrollOption);
  $('#index_header_area').addClass("perfect-scrollbar-style");
  $('#index_header_area').perfectScrollbar(scrollOption);

  var blogViewModel = new BlogViewModel(
    name,
    function(){
    },
    function(){
    });

  // ViewとViewModelをバインド
  $.templates("#blogBodyTmpl").link("#blog_list", blogViewModel.items)
    .on("click",".edit-blog", function(){
      blogViewModel.edit($.view(this));
    })
    .on("click",".update-notify-blog", function(){
      blogViewModel.update($.view(this), true);
    })
    .on("click",".update-blog", function(){
      blogViewModel.update($.view(this));
    })
    .on("click",".cancel-edit", function(){
      blogViewModel.cancel($.view(this));
    })
    .on("click",".remove-blog", function(){
      if (window.confirm('本当に削除しますか？')){
        blogViewModel.destory($.view(this));
      }
    })
    .on('keydown','.edit-area',function(event){
      // Ctrl - S or Ctrl - enter
      if ((event.ctrlKey == true && event.keyCode == 83) ||
        (event.ctrlKey == true && event.keyCode == 13)) {
        $(this).blur(); //入力を確定するためにフォーカス外す
        blogViewModel.update($.view(this));
        return false;
      }
    });

  $.templates("#blogIndexTmpl").link("#index_header", blogViewModel.items)
    .on("click",".index-li", function(){
      var index = $(this).closest(".index-ul").find(".index-li").index(this);
      var $code_out = $('.code-out');
      var pos = $code_out.find(":header").eq(index).offset().top - $('#blog_list').offset().top;
      $('#blog_permalink_area').animate({ scrollTop: pos - CODE_INDEX_ADJUST_HEIGHT}, 1000, 'easeOutQuint' );
      return true;
    });

  blogViewModel.loadByID(BLOG_ID);
});
