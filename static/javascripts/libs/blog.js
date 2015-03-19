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

  // ViewとViewModelをバインド
  $.templates("#blogInputTmpl").link("#blog_input_form", blogViewModel)
   .on('keydown','#blog_form',function(event){
      // Ctrl - S or Ctrl - enter
      if ((event.ctrlKey == true && event.keyCode == 83) ||
        (event.ctrlKey == true && event.keyCode == 13)) {
        $(this).blur(); //入力を確定するためにフォーカス外す
        blogViewModel.add();
        return false;
      }
    })
    .on("focus", "#blog_form", function(){
      $(this).switchClass("textarea-small", "textarea-large","fast");
    })
    .on("blur", "#blog_form", function(){
      $(this).switchClass("textarea-large", "textarea-small","fast");
    })

  $("#save_btn").click(function(){
      blogViewModel.add();
  })

  function moveSearchIndex(offset_top){
    var target_top = offset_top;
    var base_top = $("#index_list").offset().top;
    $('#index_area').animate({ scrollTop: target_top - base_top - $(window).height()/2 + 54 }, 'fast');
  }

  function moveSearchLine(offset_top){
    var target_top = offset_top;
    var base_top = $("#blog_list").offset().top;
    $('#blog_area').animate({ scrollTop: target_top - base_top - $(window).height()/2 + 54 }, 'fast');
  }

  $.templates("#blogCountTmpl").link("#blog_count", blogViewModel);
  $.templates("#blogNaviTmpl").link("#blog_navi", blogViewModel)
    .on("submit", "#search_form", function(){
      if(!blogViewModel.search()){
        // 検索済みの場合はマッチ箇所に移動する
        blogViewModel.next(function(index_top, blog_top){
          moveSearchIndex(index_top);
          moveSearchLine(blog_top);
        });
      }else{
        // 検索した場合はトップへスクロール
        $('#blog_area').scrollTop(0);
      }
      return false;
    })
    .on("focus", ".search-query", function(){
      $(this).switchClass("input-small", "input-large","fast");
    })
    .on("blur", ".search-query", function(){
      if (!blogViewModel.hasKeyword()){
        $(this).switchClass("input-large", "input-small","fast");
      }
    })
    .on("click", "#prev_match", function(){
      blogViewModel.prev(function(index_top, blog_top){
        moveSearchIndex(index_top);
        moveSearchLine(blog_top);
      });
      return false;
    })
    .on("click", "#next_match",function(){
      blogViewModel.next(function(index_top, blog_top){
        moveSearchIndex(index_top);
        moveSearchLine(blog_top);
      });
      return false;
    })
    .on("click", "#scroll_top", function(){
      $('#blog_area').animate({ scrollTop: 0 }, 'fast');
      $('#index_area').animate({ scrollTop: 0 }, 'fast');
      return false;
    });


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
    })
    .on('inview', '.blog-body:last-child', function(event, isInView, visiblePartX, visiblePartY) {
      blogViewModel.load_more();
    });

  $.templates("#blogIndexTmpl").link("#index_list", blogViewModel.items)
    .on("click","a", function(){
      $target = $("#" + $(this).data('id'));
      var target_top = $target.offset().top;
      var base_top = $("#blog_list").offset().top;
      $('#blog_area').scrollTop(target_top - base_top + 48);
    })
    .on('inview', '.index-body:last-child', function(event, isInView, visiblePartX, visiblePartY) {
      blogViewModel.load_more();
    });

  // 初期リスト読み込み
  blogViewModel.refresh();
});
