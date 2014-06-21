$(function() {
  $('.delete-button').click(function(){
    $.ajax('upload' , {
      type: 'DELETE',
      cache: false,
      data: {file: $(this).attr('data-name')},
      success: function(data){
        var size = (data.all_size/1024/1024).toFixed(2);
        $('#all_size_mb').html(size);
      }
    });

    $(this).closest('tr').fadeOut('normal',function(){
      $(this).remove();
    });
  });

  $('.file-body').each(function(){
    var file_name = $(this).data('name');
    if (file_name.match(/(\.jpg|\.JPG|\.gif|\.GIF|\.png|\.PNG|\.bmp|\.BMP)$/)){
      $(this)
        .append($('<a/>').attr('href' ,file_name).addClass("thumbnail")
          .append($('<img/>').addClass('lazy').css("height","30px").attr("data-original",file_name)));
    }
  });

  $("img.lazy").lazyload({
    effect : "fadeIn"
  });

  setColorbox($('.thumbnail'));
});

function setColorbox($dom){
    $dom.colorbox({
      transition: "none",
      rel: "img",
      maxWidth: "100%",
      maxHeight: "100%",
      initialWidth: "200px",
      initialHeight: "200px"
    });
}
