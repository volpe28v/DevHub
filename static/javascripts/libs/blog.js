$(function() {
  $.ajax('blog/body' , {
    type: 'GET',
    cache: false,
    success: function(data){
      data.body.forEach(function(blog){
        var $target = $('<div/>')
          .append($('<pre/>').addClass('text-base-style')
            .append($('<div/>').addClass('code-out'))
          );

        $('#blog-list').append($target);

        $target.find('.code-out').html(setToTable($.decora.to_html(blog.text)));
        $target.find('tr:has(.code-out-pre-border)').addClass("code-out-pre-tr");
        $target.find('td:has(.code-out-pre)').addClass("code-out-pre-td");
        $target.find('td:has(.code-out-pre-top)').addClass("code-out-pre-top-td");
        $target.find('td:has(.code-out-pre-bottom)').addClass("code-out-pre-bottom-td");

        setColorbox($target.find('.thumbnail'));
        console.log("blog");
      });
    }
  });
});

function setToTable(html){
  var table_html = '<table><tr class="code-out-tr"><td>';
  table_html += html.replace(/[\n]/g,'</td></tr class="code-out-tr"><tr class="code-out-tr"><td>');
  return table_html += "</td></tr></table>";
}

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
