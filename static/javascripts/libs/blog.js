var COOKIE_NAME = "dev_hub_name";

$(function() {
  var name = $.cookie(COOKIE_NAME);
  emojify.setConfig({
    img_dir: 'img/emoji',  // Directory for emoji images
  });

  // blog のモデルとViewをバインド
  var blogViewModel = new BlogViewModel();

  // 保存イベント
  $('#save_btn').click(function(){
    var blog_text = $('#blog_form').val();
    if (blog_text == ""){ return; }
    $('#blog_form').val("");

    var blog = {text: blog_text, name: name};
    blogViewModel.add(blog);
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
    });

  $.templates("#blogIndexTmpl").link("#index_list", blogViewModel.items)
    .on("click","a", function(){
      $target = $("#" + $(this).data('id'));
      $('html,body').animate({ scrollTop: $target.offset().top - 60}, 'fast');
    });

  // 初期リスト読み込み
  blogViewModel.refresh();
});
