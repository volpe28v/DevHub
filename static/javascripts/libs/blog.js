$(function() {
  emojify.setConfig({
    img_dir: 'img/emoji',  // Directory for emoji images
  });

  function add_blog(blog){
    var $target = $('<div/>')
          .append($('<pre/>').addClass('text-base-style')
            .append($('<div/>').addClass('code-out'))
          );

    $target.find('.code-out').showDecora(blog.text);
    $('#blog-list').prepend($target);
  }
 
  $.ajax('blog/body' , {
    type: 'GET',
    cache: false,
    success: function(data){
      data.body.forEach(function(blog){
        add_blog(blog);
      });
    }
  });

  $('#save_btn').click(function(){
    var blog_text = $('#blog_form').val();
    if (blog_text == ""){ return; }
    $('#blog_form').val("");

    $.ajax('blog' , {
      type: 'POST',
      cache: false,
      data: {blog: {text: blog_text}},
      success: function(data){
        add_blog(data.blog);
        console.log(data.blog);
      }
    });
  });
});
