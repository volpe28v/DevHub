/*!
 * jQuery Decorate Text Plugin
 *
 *  - auto link
 *  - checkbox
 */

(function($) {
  var REG_CHECKBOX = /-[ ]?\[[ ]?\]|-[ ]?\[x\]/g,
      SYM_CHECKED = "-[x]",
      SYM_UNCHECKED = "-[ ]";

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
          if ( check_no == current_index){
            if (is_checked){
              return SYM_CHECKED;
            }else{
              return SYM_UNCHECKED;
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

  // private method
  function _decorate_raw_tag( text ){
    var raw_text = text.replace(/</g,function(){ return '&lt;';}).replace(/>/g,function(){ return '&gt;';});
    raw_text = raw_text.split("\n");
    $.each(raw_text, function(i, val){
      var class_name = "code-out-pre ";
      if (i == 0){
        class_name += "code-out-pre-top ";
      }
      if (i == raw_text.length - 1 ){
        class_name += "code-out-pre-bottom ";
      }

      raw_text[i] = '<span class="' + class_name + '">' + val + '</span>';
    });
    return raw_text.join("\n");
  }

  function _decorate_link_tag( text ){
    var linked_text = text.replace(/((https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+))/g,
        function(){
          var matched_link = arguments[1];
          if ( matched_link.match(/(\.jpg|\.JPG|\.gif|\.GIF|\.png|\.PNG|\.bmp|\.BMP)$/)){
            return matched_link;
          }else{
            return '<a href="' + matched_link + '" target="_blank" >' + matched_link + '</a>';
          }
        });
    return linked_text;
  }

  function _decorate_download_tag( text ){
    var img_text = text.replace(/(\/uploads\/(\S+))/g,
        function(){
          var matched_link = arguments[1];
          var matched_name = arguments[2];
          if ( matched_link.match(/(\.jpg|\.JPG|\.gif|\.GIF|\.png|\.PNG|\.bmp|\.BMP|\.xap)$/)){
            return matched_link;
          }else{
            return '<a href="' + matched_link + '" class="btn btn-default btn-mini" ><i class="icon-download-alt"></i>' + matched_name + '</a>';
          }
        });
    return img_text;
  }

  function _decorate_img_tag( text, default_height){
    var img_text = text.replace(/((\S+?(\.jpg|\.JPG|\.gif|\.GIF|\.png|\.PNG|\.bmp|\.BMP))($|\s([0-9]+)|\s))/g,
        function(){
          var matched_link = arguments[2];
          var height = arguments[5];
          if (height == "" || !isFinite(height)){ // firefox では空文字になるので判定が必要
            height = default_height;
          }
          if (height){
            return '<a href="' + matched_link + '" class="thumbnail"><img src="' + matched_link + '" style="height:' + height+ 'px"/></a>';
          }else{
            return '<a href="' + matched_link + '" target="_blank" class="thumbnail" style="display: inline-block;"><img src="' + matched_link + '"/></a>';
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
      if ( matched_text.indexOf("x") > 0 ){
        return '<input type="checkbox" data-no="' + no++ + '" checked />';
      }else{
        return '<input type="checkbox" data-no="' + no++ + '" />';
      }
    });
    return {text: check_text, no: no};
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
    var color_text = text.replace(/^(.+)[ 　]#([a-z]+)$/mg, function(){
      var matched_text = arguments[1];
      var color_name = arguments[2];
      if (color_name == "r"){ color_name = "red"; }
      if (color_name == "g"){ color_name = "green"; }
      if (color_name == "b"){ color_name = "blue"; }
      return '<font color="' + color_name + '">' + matched_text + '</font>';
    });
    return color_text;
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
          deco_text = _decorate_header( check_result.text );
          deco_text = _decorate_line_color( deco_text );
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
      target_text = target_text.replace(/(^|\s+)+(SUCCESS|OK|YES)($|\s)+/, function(){ return ' <span class="label label-success">' + arguments[2] + '</span> '});
      target_text = target_text.replace(/(^|\s+)+(FAILURE|NG|NO)($|\s)+/, function(){ return ' <span class="label label-important">' + arguments[1] + '</span> '});
      target_text = target_text.replace(/[\(（](笑|爆|喜|嬉|楽|驚|泣|涙|悲|怒|厳|辛|苦|閃|汗|忙|急|輝)[\)）]/g, function(){ return '<span class="emo">' + arguments[1] + '</span>'});
      target_text = _decorate_link_tag( target_text );
      target_text = _decorate_download_tag( target_text );
      target_text = _decorate_img_tag( target_text, 50 );
      target_text = _decorate_line_color( target_text );

      return target_text;
    }
  };
})(jQuery);

