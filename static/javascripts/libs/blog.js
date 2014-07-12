var COOKIE_NAME = "dev_hub_name";

$(function() {
  var name = $.cookie(COOKIE_NAME);
  emojify.setConfig({
    img_dir: 'img/emoji',  // Directory for emoji images
  });

  function add_blog(blog){
    var id = blog._id;
    var title = blog.text.split("\n")[0];

    // ブログの追加
    var $target = $('<div/>').attr("id", id)
          .append($('<div/>').addClass('blog-header')
            .html('<strong>' + blog.name + '</strong> added <span data-livestamp="' + blog.date + '"></span>')
            .append($('<div/>').css('float','right').html('<span class="edit-blog"><i class="icon-pencil"></i></span> <span class="remove-blog"><i class="icon-remove"></i></span>')))
          .append($('<pre/>').addClass('text-base-style')
            .append($('<div/>').addClass('code-out'))
          );

    $target.find('.code-out').showDecora(blog.text);
    $('#blog-list').prepend($target);

    // 見出しの追加
    var $index = $('<li/>')
          .append($('<a/>').attr('href',"#").attr('data-id',id).html(title + ' - <span data-livestamp="' + blog.date + '"></span>'));
    $('#index_list').prepend($index);
  }
 
  // 初期リスト読み込み
  $.ajax('blog/body' , {
    type: 'GET',
    cache: false,
    success: function(data){
      data.body.forEach(function(blog){
        add_blog(blog);
      });
    }
  });

  // 保存イベント
  $('#save_btn').click(function(){
    var blog_text = $('#blog_form').val();
    if (blog_text == ""){ return; }
    $('#blog_form').val("");

    $.ajax('blog' , {
      type: 'POST',
      cache: false,
      data: {blog: {text: blog_text, name: name}},
      success: function(data){
        add_blog(data.blog);
      }
    });
  });

  // インデクスクリックイベント
  $('#index_list').on("click","a", function(){
    $target = $("#" + $(this).data('id'));
    $('html,body').animate({ scrollTop: $target.offset().top - 60}, 'fast');
  });
});
