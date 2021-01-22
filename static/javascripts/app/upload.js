global.jQuery = require('jquery');
global.$ = global.jQuery;
require('jquery-ui');
require('jquery-colorbox');
require('jquery-lazyload');
require('sweetalert');
require('tablesorter');

$(function() {
  $('.delete-button').click(function(){
    var that = this;

    swal({
      title: "Are you sure?",
      text: "You will not be able to recover this file!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!",
      closeOnConfirm: true
    },function(){
      $.ajax('upload?file=' + $(that).attr('data-name') , {
        type: 'DELETE',
        cache: false,
        data: {file: $(that).attr('data-name')},
        success: function(data){
          var size = (data.all_size/1024/1024).toFixed(2);
          $('#all_size_mb').html(size);
        }
      });

      $(that).closest('tr').fadeOut('normal',function(){
        $(this).remove();
      });
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
  $("#file_list").tablesorter();
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
