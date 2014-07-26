var COOKIE_NAME = "dev_hub_name";

$(function() {
  var name = $.cookie(COOKIE_NAME);
  emojify.setConfig({
    img_dir: 'img/emoji',  // Directory for emoji images
  });

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

  $.templates("#blogCountTmpl").link("#blog_count", blogViewModel);
  $.templates("#blogNaviTmpl").link("#blog_navi", blogViewModel)
    .on("submit", "#search_form", function(){
      if(!blogViewModel.search()){
        // 検索済みの場合はマッチ箇所に移動する
        blogViewModel.next(function(offset_top){
          $('html,body').animate({ scrollTop: offset_top - $(window).height()/2}, 'fast');
        });
      }else{
        // 検索した場合はトップへスクロール
        $('html,body').scrollTop(0);
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
      blogViewModel.prev(function(offset_top){
        $('html,body').animate({ scrollTop: offset_top - $(window).height()/2}, 'fast');
      });
      return false;
    })
    .on("click", "#next_match",function(){
      blogViewModel.next(function(offset_top){
        $('html,body').animate({ scrollTop: offset_top - $(window).height()/2}, 'fast');
      });
      return false;
    });

  $.templates("#blogBodyTmpl").link("#blog_list", blogViewModel.items)
    .on("click",".edit-blog", function(){
      blogViewModel.edit($.view(this));
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
      $('html,body').animate({ scrollTop: $target.offset().top - 60}, 'fast');
    });

  $.templates("#blogLoadFromIndexTmpl").link("#load_more_from_index", blogViewModel)
    .on("click","button", function(){
      blogViewModel.load_more();
    });

  // 初期リスト読み込み
  blogViewModel.refresh();
});
