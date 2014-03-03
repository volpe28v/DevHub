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
});
