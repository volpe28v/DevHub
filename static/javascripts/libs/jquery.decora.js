/*!
 * jQuery Decorate Text Plugin
 *
 *  - auto link
 *  - checkbox
 */

(function($) {
  var REG_CHECKBOX = /(-|=)[ ]?\[[ ]?\]|(-|=)[ ]?\[x\]/g,
      SYM_CHECKED = "[x]",
      SYM_UNCHECKED = "[ ]";

  $.fn.decora = function( options ){
    var defaults = {
      checkbox_callback: function(that, applyCheckStatus){}
    };

    var options = $.extend( defaults, options );

    // private method
    Function.prototype.method = function(name, func){
      this.prototype[name] = func;
      return this;
    }
    Function.method('curry', function(){
      var slice = Array.prototype.slice,
          args = slice.apply(arguments),
          that = this;
      return function(){
        return that.apply(null, args.concat(slice.apply(arguments)));
      }
    });

    function _updateCheckboxStatus(check_no, is_checked, target_text){
      var check_index = 0;
      return target_text.replace(REG_CHECKBOX,
        function(){
          var matched_check = arguments[0];
          var current_index = check_index++;
          var sym_prefix = arguments[1] || arguments[2];
          if ( check_no == current_index){
            if (is_checked){
              return sym_prefix + SYM_CHECKED;
            }else{
              return sym_prefix + SYM_UNCHECKED;
            }
          }else{
            return matched_check;
          }
        });
    }

    $(this).on('click',':checkbox', function(){
      var check_no = $(this).data('no');
      var is_checked = $(this).attr("checked") ? true : false;
      var that = this;

      options.checkbox_callback(that, _updateCheckboxStatus.curry(check_no, is_checked))
    });
    return this;
  }

  $.fn.showDecora = function( text ){
    $(this).html(_set_to_table($.decora.to_html(text)));

    $(this).find('tr:has(:header)').addClass("header-tr");
    $(this).find('tr:has(.code-out-pre-border)').addClass("code-out-pre-tr");
    $(this).find('td:has(.code-out-pre)').addClass("code-out-pre-td");
    $(this).find('td:has(.code-out-pre-top)').addClass("code-out-pre-top-td");
    $(this).find('td:has(.code-out-pre-bottom)').addClass("code-out-pre-bottom-td");

    $(this).find('tr:has(.checkbox-draggable)').addClass("draggable-tr");
    $(this).find('tr:has(.text-draggable)').addClass("draggable-text-tr");

    _set_colorbox($(this).find('.thumbnail'));

    // 絵文字表示
    emojify.run($(this).get(0));
  }

  // private method
  function _set_to_table(html){
    var table_html = '<table><tr class="code-out-tr"><td>';
    table_html += html.replace(/[\n]/g,'</td></tr class="code-out-tr"><tr class="code-out-tr"><td>');
    return table_html += "</td></tr></table>";
  }

  function _set_colorbox($dom){
    $dom.colorbox({
      transition: "none",
    rel: "img",
    maxWidth: "100%",
    maxHeight: "100%",
    initialWidth: "200px",
    initialHeight: "200px"
    });
  }

  function _decorate_raw_tag( text ){
    var is_code = text.split("\n")[0].indexOf("code") != -1;
    if (is_code){
      // コードに色付け
      var raw_text = text.replace(/^code/,"");
      var $pretty_tmp_span = $('<span/>').addClass("prettyprint").text(raw_text);
      var $pretty_tmp_div = $('#share_memo_pre_tmp').append($pretty_tmp_span);

      prettyPrint(null, $pretty_tmp_div.get(0));
      raw_text = $pretty_tmp_span.html();
      $pretty_tmp_div.empty();
      raw_text = raw_text.split("\n");

      var first_raw = raw_text[0].replace(/\r\n/g,"").replace(/\n/g,"");
      raw_text[1] = first_raw + raw_text[1];
      raw_text.splice(0,1);

      // 以下のようなクラスを付加する
      // コード  -> code-out-pre code-out-pre-top
      // コード  -> code-out-pre
      // コード  -> code-out-pre code-out-pre-bottom
      var last_class_name = '';
      $.each(raw_text, function(i, val){
        var class_name = "code-out-pre ";
        if (raw_text.length == 1){
          class_name += "code-out-pre-top code-out-pre-bottom";
        }else if (i == 0){
          class_name += "code-out-pre-top ";
          val = val + '</span>';
        }else if (i == raw_text.length - 1){
          class_name += "code-out-pre-bottom ";
          val = '<span class ="' + last_class_name + '">' + val ;
        }else{
          val = '<span class ="' + last_class_name + '">' + val + '</span>';
        }

        raw_text[i] = '<span class="' + class_name + '">' + val + '</span>';
        last_class_name = $("<div/>").html(raw_text[i]).find(":last").get(0).className;
      });

      // コードの前後に空行を追加する
      // (空行)  -> code-out-pre-boder
      raw_text.unshift('<span class="code-out-pre-border"></span>');
      raw_text.push('<span class="code-out-pre-border"></span>');
    }else{
      // 色付けなし
      var raw_text = text.replace(/</g,function(){ return '&lt;';}).replace(/>/g,function(){ return '&gt;';});
      raw_text = raw_text.split("\n");

      // 以下のようなクラスを付加する
      // (空行)  -> code-out-pre-boder
      // コード  -> code-out-pre code-out-pre-top
      // コード  -> code-out-pre
      // コード  -> code-out-pre code-out-pre-bottom
      // (空行)  -> code-out-pre-boder
      $.each(raw_text, function(i, val){
        var class_name = "code-out-pre ";
        if (i == 1){
          if (raw_text.length == 3){
            class_name += "code-out-pre-top code-out-pre-bottom";
          }else{
            class_name += "code-out-pre-top ";
          }
          raw_text[i] = '<span class="' + class_name + '">' + val + '</span>';
        }else if (i == raw_text.length - 2){
          class_name += "code-out-pre-bottom ";
          raw_text[i] = '<span class="' + class_name + '">' + val + '</span>';
        }else if (i == 0 || i == raw_text.length - 1){
          raw_text[i] = '<span class="code-out-pre-border"></span>';
        }else {
          raw_text[i] = '<span class="' + class_name + '">' + val + '</span>';
        }
      });
    }

    return raw_text.join("\n");
  }

  function _decorate_link_tag( text ){
    var linked_text = text.replace(/(\[(.+?)\])?[\(]?((https?|ftp)(:\/\/[-_.!~*\'a-zA-Z0-9;\/?:\@&=+\$,%#]+)|blog\?id=[^\)]+)[\)]?/g,
        function(){
          var matched_link = arguments[3];
          if ( matched_link.match(/(\.jpg|\.jpeg|\.gif|\.png|\.bmp)[?]?/i)){
            return matched_link;
          }else{
            var title_text = arguments[2] ? arguments[2] : matched_link;
            return '<a href="' + matched_link + '" target="_blank" >' + title_text + '</a>';
          }
        });
    return linked_text;
  }

  function _decorate_download_tag( text ){
    var img_text = text.replace(/(\/uploads\/(\S+))/g,
        function(){
          var matched_link = arguments[1];
          var matched_name = arguments[2];
          if ( matched_link.match(/(\.jpg|\.jpeg|\.gif|\.png|\.bmp|\.xap)[?]?/i)){
            return matched_link;
          }else{
            return '<a href="' + matched_link + '" class="btn btn-default btn-mini" ><i class="icon-download-alt"></i>' + matched_name + '</a>';
          }
        });
    return img_text;
  }

  function _decorate_img_tag( text, default_height){
    var img_text = text.replace(/(=?)((\S+?(\.jpg|\.jpeg|\.gif|\.png|\.bmp)([?][\S]*)?)($|\s([0-9]+)|\s))/gi,
        function(){
          var matched_link = arguments[3];
          var height = arguments[7];
          if (height == "" || !isFinite(height)){ // firefox では空文字になるので判定が必要
            height = default_height;
          }
          var prefix = arguments[1] ? arguments[1] : "";
          if (height){
            return prefix + '<a href="' + matched_link + '" class="thumbnail" style="vertical-align: top;"><img src="' + matched_link + '" style="height:' + height+ 'px"/></a>';
          }else{
            return prefix + '<a href="' + matched_link + '" target="_blank" class="thumbnail" style="display: inline-block; vertical-align: top;"><img src="' + matched_link + '"/></a>';
          }
        });
    return img_text;
  }

  // for SilverLight
  function _decorate_xap_tag( text, default_width, default_height){
    var img_text = text.replace(/((\S+?(\.xap))($|\s([0-9]+)\s([0-9]+)|\s))/g, // xxx.xap 180 90
        function(){
          var matched_link = arguments[2];
          var width = arguments[5];
          var height = arguments[6];
          if (width == "" || !isFinite(width)){ // firefox では空文字になるので判定が必要
            width = default_width;
          }
          if (height == "" || !isFinite(height)){ // firefox では空文字になるので判定が必要
            height = default_height;
          }
          return '<object data="data:application/x-silverlight-2," type="application/x-silverlight-2" width="' + width + '" height="' + height + '">' +
                 '  <param name="source" value="' + matched_link + '"/>' +
                 '  <param name="onError" value="onSilverlightError" />' +
                 '  <param name="background" value="white" />' +
                 '  <param name="minRuntimeVersion" value="5.0.61118.0" />' +
                 '  <param name="autoUpgrade" value="true" />' +
                 '  <a href="http://go.microsoft.com/fwlink/?LinkID=149156&v=5.0.61118.0" style="text-decoration:none">' +
                 '    <img src="http://go.microsoft.com/fwlink/?LinkId=161376" alt="Microsoft Silverlight の取得" style="border-style:none"/>' +
                 '  </a>' +
                 '</object>';
        });
    return img_text;
  }

  function _decorate_checkbox( text, no ){
    var check_text = text.replace(REG_CHECKBOX, function(){
      var matched_text = arguments[0];
      var sym_prefix = arguments[1] || arguments[2];
      var checkbox_class = sym_prefix == "-" ? "checkbox-normal" : "checkbox-draggable";
      if ( matched_text.indexOf("x") > 0 ){
        return '<input type="checkbox" class="' + checkbox_class + '" data-no="' + no++ + '" checked />';
      }else{
        return '<input type="checkbox" class="' + checkbox_class + '" data-no="' + no++ + '" />';
      }
    });
    return {text: check_text, no: no};
  }

  function _decorate_draggable( text ){
    var draggable_text = text.replace(/^=(.*)/mg, function(){
      var matched_text = arguments[1];
      return '<span class="text-draggable">' + _decorate_line_color(matched_text) + '</span>';
    });
    return draggable_text;
  }

  function _decorate_header( text ){
    var header_index = 0;
    var header_text = text.replace(/^(#+)[ ]*(.*)$/mg, function(){
      var header_num = arguments[1].length < 4 ? arguments[1].length : 4;
      var matched_text = arguments[2];
      return '<h' + header_num + '>' + _decorate_line_color(matched_text) + '</h' + header_num + '>';
    });
    return header_text;
  }

  function _decorate_line_color( text ){
    // 文字色
    var color_text = text.replace(/^(.+)[ 　](#([a-z]+)|(#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]))$/mg, function(){
      var matched_text = arguments[1];
      var color_name = arguments[3] || arguments[4];
      if (color_name == "r"){ color_name = "#ba2636"; }
      if (color_name == "g"){ color_name = "#387d39"; }
      if (color_name == "b"){ color_name = "#333399"; }
      return '<font color="' + color_name + '">' + matched_text + '</font>';
    });
    // 背景色
    var color_text = color_text.replace(/^(.+)[ 　](%([a-z]+)|(%[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]))$/mg, function(){
      var matched_text = arguments[1];
      var color_name = arguments[3] || arguments[4];
      if (color_name == "r"){ color_name = "#FFE4E1"; }
      if (color_name == "g"){ color_name = "#7FFFD4"; }
      if (color_name == "b"){ color_name = "#AFEEEE"; }
      return '<span style="background-color:' + color_name + '">' + matched_text + '</span>';
    });

    return color_text;
  }

  function _decorate_ref( text ){
    var refed_text = text.replace(/\[ref:(.+?)\]/g,
        function(){
          var matched_id = arguments[1];
          return '<span class="btn btn-default btn-mini ref-point" id="' + matched_id + '"><i class="icon-share"></i></span>';
        });
    return refed_text;
  }

  function _decorate_hr( text ){
    var hr_text = text.replace(/^---[-]*$/mg,
        function(){
          return '<hr></hr>';
        });
    return hr_text;
  }

  $.decora = {
    to_html: function(target_text){
      var bq_sepa_array = target_text.split("```");
      var checkbox_no = 0;
      for ( i = 0; i < bq_sepa_array.length; i++){
        if (i%2 == 0){
          // 装飾有り
          var deco_text = sanitize(bq_sepa_array[i]);
          deco_text = _decorate_link_tag( deco_text );
          deco_text = _decorate_download_tag( deco_text );
          deco_text = _decorate_img_tag( deco_text, 200 );
          deco_text = _decorate_xap_tag( deco_text, 200, 200 );
          var check_result = _decorate_checkbox( deco_text, checkbox_no );
          checkbox_no = check_result.no;
          deco_text = _decorate_draggable( check_result.text );
          deco_text = _decorate_header( deco_text );
          deco_text = _decorate_line_color( deco_text );
          deco_text = _decorate_ref( deco_text );
          deco_text = _decorate_hr( deco_text );
          bq_sepa_array[i] = deco_text;
        }else{
          // 装飾無し
          bq_sepa_array[i] = _decorate_raw_tag(bq_sepa_array[i]);
        }
      }

      return bq_sepa_array.join('');
    },
    message_to_html: function(target_text){
      target_text = sanitize(target_text);
      target_text = target_text.replace(/[\(（](笑|爆|喜|嬉|楽|驚|泣|涙|悲|怒|厳|辛|苦|閃|汗|忙|急|輝)[\)）]/g, function(){ return '<span class="emo">' + arguments[1] + '</span>'});
      target_text = _decorate_link_tag( target_text );
      target_text = _decorate_download_tag( target_text );
      target_text = _decorate_img_tag( target_text, 50 );
      target_text = _decorate_line_color( target_text );
      target_text = _decorate_ref( target_text );
      target_text = _decorate_hr( target_text );

      return target_text;
    }
  };
})(jQuery);

