$(function() {
  emojify.setConfig({
    img_dir: 'img/emoji',  // Directory for emoji images
  });

  $.ajax('blog/body' , {
    type: 'GET',
    cache: false,
    success: function(data){
      data.body.forEach(function(blog){
        var $target = $('<div/>')
          .append($('<pre/>').addClass('text-base-style')
            .append($('<div/>').addClass('code-out'))
          );

        $target.find('.code-out').showDecora(blog.text);
        $('#blog-list').append($target);
        console.log("blog");
      });
    }
  });
});
