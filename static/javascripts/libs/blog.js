var COOKIE_NAME = "dev_hub_name";

$(function() {
  var name = $.cookie(COOKIE_NAME);
  emojify.setConfig({
    img_dir: 'img/emoji',  // Directory for emoji images
  });

  var blogViewModel = new BlogViewModel(name);

  // 保存イベント
  $.templates("#blogInputTmpl").link("#blog_input_form", blogViewModel)
    .on("click","#save_btn",function(){
      blogViewModel.add();
    });

  $.link(true, "#search_form", blogViewModel)
    .submit(function(){
      blogViewModel.search();;
      return false;
    });

  // ViewとViewModelをバインド
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
        event.returnvalue = false;
        blogViewModel.update($.view(this));
        return false;
      }
    });

  $.templates("#blogIndexTmpl").link("#index_list", blogViewModel.items)
    .on("click","a", function(){
      $target = $("#" + $(this).data('id'));
      $('html,body').animate({ scrollTop: $target.offset().top - 60}, 'fast');
    });

  // 初期リスト読み込み
  blogViewModel.refresh();
});
