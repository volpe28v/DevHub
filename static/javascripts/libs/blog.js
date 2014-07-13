var COOKIE_NAME = "dev_hub_name";

$(function() {
  var name = $.cookie(COOKIE_NAME);
  emojify.setConfig({
    img_dir: 'img/emoji',  // Directory for emoji images
  });

  // blog のモデルとViewをバインド
  var Blogs = [];
  $.templates("#blogBodyTmpl").link("#blog_list", Blogs);
  $.templates("#blogIndexTmpl").link("#index_list", Blogs);

  function add_blog(blog){
    var id = blog._id;
    blog.title = blog.text.split("\n")[0];

    $.observable(Blogs).insert(0,blog);
    var $target = $('#' + id);
    $target.find(".code-out").showDecora(blog.text);
  }
 
  // 初期リスト読み込み
  $.ajax('blog/body' , {
    type: 'GET',
    cache: false,
    success: function(data){
      var blogs = data.body;
      blogs.forEach(function(blog){
        add_blog(blog);
      });

      console.log(blogs);
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

  // ブログを編集
  $('#blog_list').on("click",".edit-blog", function(){
    var index = $.view(this).index;
    var blog = Blogs[index];
    blog.pre_text = blog.text;

    var $target = $(this).closest('.blog-body');
    $target.find('pre').hide();
    $target.find('.edit-form').show();
    $target.find('textarea').focus().autofit({min_height: 100});
 });

  // ブログを更新
  $('#blog_list').on("click",".update-blog", function(){
    var index = $.view(this).index;
    var blog = Blogs[index];

    // 名前・タイトルを更新
    var title = blog.text.split("\n")[0];
    $.observable(blog).setProperty("title", title);
    $.observable(blog).setProperty("name", name);

    var $target = $(this).closest('.blog-body');
    $target.find(".code-out").showDecora(blog.text);
    $target.find('pre').show();
    $target.find('.edit-form').hide();

    $.ajax('blog' , {
      type: 'POST',
      cache: false,
      data: {blog: {_id: blog._id, text: blog.text, name: name}},
      success: function(data){
        $.observable(blog).setProperty("date", data.blog.date);
      }
    });
  });

  // ブログ編集をキャンセル
  $('#blog_list').on("click",".cancel-edit", function(){
    var index = $.view(this).index;
    var blog = Blogs[index];
    $.observable(blog).setProperty("text", blog.pre_text);

    var $target = $(this).closest('.blog-body');
    $target.find('pre').show();
    $target.find('.edit-form').hide();
  });
 
  // ブログを削除
  $('#blog_list').on("click",".remove-blog", function(){
    if (window.confirm('本当に削除しますか？')){
      var index = $.view(this).index;
      var remove_blog = {};
      remove_blog._id = Blogs[index]._id;

      $.ajax('blog' , {
        type: 'DELETE',
        cache: false,
        data: {blog: remove_blog},
        success: function(data){
        }
      });

      $.observable(Blogs).remove(index);
    }
  });

  // インデクスクリックイベント
  $('#index_list').on("click","a", function(){
    $target = $("#" + $(this).data('id'));
    $('html,body').animate({ scrollTop: $target.offset().top - 60}, 'fast');
  });
});
