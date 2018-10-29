/*!
 * jQuery Decorate Text Plugin
 *
 *  - auto link
 *  - checkbox
 */

var emojify = require('emojify.js');
require('./sanitize');
var prettify = require('prettify');

(function($) {
  var REG_CHECKBOX = /(^([ 　]*)([-=])[ ]?\[([ x])?\])|(([-=])[ ]?\[([ x])?\])/mg,
      SYM_CHECKED = " [x]",
      SYM_UNCHECKED = " [ ]";

  emojify.setConfig({
    img_dir: 'img/emoji',  // Directory for emoji images
  });

  $.fn.decora = function( options ){
    var defaults = {
      checkbox_callback: function(that, applyCheckStatus){},
      img_size_callback: function(that, applyImgSize){}
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
          var prefix = arguments[2];
          if (prefix != undefined){
            var sym_prefix = arguments[3];
            if ( check_no == current_index){
              if (is_checked){
                return prefix + sym_prefix + SYM_CHECKED;
              }else{
                return prefix + sym_prefix + SYM_UNCHECKED;
              }
            }else{
              return matched_check;
            }
          }else{
            var sym_prefix = arguments[6];
            if ( check_no == current_index){
              if (is_checked){
                return sym_prefix + SYM_CHECKED;
              }else{
                return sym_prefix + SYM_UNCHECKED;
              }
            }else{
              return matched_check;
            }
          }
        });
    }

    function _updateImageSize(index, next_height, target_text){
      var current_index = 0;

      var deco_func = function(target_text){
        return target_text.replace(/(=?)((\S+?(\.jpg|\.jpeg|\.gif|\.png|\.bmp)([?][\S]*)?)($|\s([0-9]+)|\s))/gi,
        function(){
          var matched_img = arguments[0];
          current_index++;
          var matched_link = arguments[3];
          if (current_index != index){
            return matched_img;
          }else{
            return matched_link + " " + next_height;
          }
        });
      };

      var bq_sepa_array = target_text.split("```");
      for (var i = 0; i < bq_sepa_array.length; i++){
        if (bq_sepa_array[i] != undefined){
          if (i%2 == 0){
            bq_sepa_array[i] = deco_func(bq_sepa_array[i]);
          }
        }
      }

      return bq_sepa_array.join('```');
    }

    $(this).on('click',':checkbox', function(){
      var check_no = $(this).data('no');
      if (check_no == undefined){ return; }
      var is_checked = $(this).prop("checked") ? true : false;
      var that = this;

      options.checkbox_callback(that, _updateCheckboxStatus.curry(check_no, is_checked));
    })
    .on('mouseenter','.thumbnail', function(){
      var that = this;
      var img_index = $(this).data('index');
      $(this).find("img").resizable({
        aspectRatio: true,
        autoHide: true,
        start: function(e, ui){
          // リサイズ中は colorbox を無効化
          $(that).on('click', function(){ return false; });
          $(this).find('img').css('max-height','');
        },
        stop: function(e, ui){
          var next_height = parseInt($(this).height());
          options.img_size_callback(that, _updateImageSize.curry(img_index, next_height));

          // リサイズ後は colorbox を有効化
          $(that).on('click', function(){ return true; });
        }
      });
    });

    return this;
  }

  $.fn.showDecora = function( text ){
    if (text != undefined){
      $(this).html(_set_to_table($.decora.to_html(text)));
    }

    $(this).find('tr:has(:header)').addClass("header-tr");
    $(this).find('tr:has(.code-out-pre-border)').addClass("code-out-pre-tr");
    $(this).find('td:has(.code-out-pre)').addClass("code-out-pre-td");
    $(this).find('td:has(.code-out-pre-top)').addClass("code-out-pre-top-td");
    $(this).find('td:has(.code-out-pre-bottom)').addClass("code-out-pre-bottom-td");

    $(this).find('tr:has(.checkbox-draggable)').addClass("draggable-tr").removeClass("fixity");

    var delete_button = '<a class="delete-task" data-bind="click: function(data,event){ deleteTask(data, event, $element)}" href="#">x</a>';
    $(this).find('td:has(.checkbox-draggable)').addClass("checkbox-draggable-td").prepend(delete_button);
    $(this).find('tr:has(.text-draggable)').addClass("draggable-tr").removeClass("fixity");
    $(this).find('tr:has(.thumbnail)').addClass("draggable-tr").removeClass("fixity");

    _set_colorbox($(this).find('.thumbnail'));

    // 絵文字表示
    $(this).find("tr").find("*").each(function(){
      emojify.run($(this).get(0));
    });
  }

  // private method
  function _set_to_table(html){
    var table_html = '<table><tr class="code-out-tr fixity" data-bind="event: {dblclick: function(data,event){ editSpecificRow(data, event, $element)}}, dblclickBubble: false"><td class="drag-handle-td">';
    table_html += '<svg class="drag-handle" aria-hidden="true" width="16" height="15" version="1.1" viewBox="0 0 16 15"><path d="M12,4V5H4V4h8ZM4,8h8V7H4V8Zm0,3h8V10H4v1Z"></path></svg></td><td>' + html.replace(/[\n]/g,'</td></tr><tr class="code-out-tr fixity" data-bind="event: {dblclick: function(data,event){ editSpecificRow(data, event, $element)}}, dblclickBubble: false"><td class="drag-handle-td"><svg class="drag-handle" aria-hidden="true" width="16" height="15" version="1.1" viewBox="0 0 16 15"><path d="M12,4V5H4V4h8ZM4,8h8V7H4V8Zm0,3h8V10H4v1Z"></path></svg></td><td>');
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

  function _decorate_html_tag_for_message(target_text){
    target_text = _decorate_inline_code( target_text );
    target_text = sanitize(target_text);
    target_text = target_text.replace(/[\(（](笑|爆|喜|嬉|楽|驚|泣|涙|悲|怒|厳|辛|苦|閃|汗|忙|急|輝)[\)）]/g, function(){ return '<span class="emo">' + arguments[1] + '</span>'});
    target_text = _decorate_link_tag( target_text );
    target_text = _decorate_download_tag( target_text );
    img_result = _decorate_img_tag( target_text, 100, 0);
    target_text = img_result.text;
    target_text = _decorate_line_color( target_text );
    target_text = _decorate_ref( target_text );
    target_text = _decorate_hr( target_text );
    target_text = _decorate_windows_path( target_text );
    target_text = _decorate_table( target_text );

    return target_text;
  }

  function _decorate_raw_tag_for_message(target_text){
    var text_array = target_text.split("\n");
    var first_line = text_array.shift();
    var is_code = first_line.indexOf("code") != -1;
    target_text = text_array.join('\n');
    if (is_code){
      // コードに色付け
      var raw_text = target_text.replace(/^code/,"");
      var $pretty_tmp_pre = $('<pre/>').addClass("prettyprint").text(raw_text);
      var $pretty_tmp_div = $('#share_memo_pre_tmp').append($pretty_tmp_pre);

      prettyPrint(null, $pretty_tmp_div.get(0));
      raw_text = $pretty_tmp_pre.html();
      $pretty_tmp_div.empty();
      return '<pre class="pre-message">' + raw_text + '</pre>';
    }else{
      var raw_text = target_text.replace(/</g,function(){ return '&lt;';}).replace(/>/g,function(){ return '&gt;';});
      return '<pre class="pre-message">' + raw_text + '</pre>';
    }
  }


  function _create_decorate_html_tag(){
    var checkbox_no = 0;
    var img_no = 0;

    return function(deco_text){
      // 装飾有り
      deco_text = _decorate_inline_code( deco_text );
      deco_text = sanitize(deco_text);
      deco_text = _decorate_wip( deco_text );
      deco_text = _decorate_cal_placeholder( deco_text );
      deco_text = _decorate_download_tag( deco_text );

      var img_result = _decorate_img_tag( deco_text, 200, img_no );
      img_no = img_result.no;
      deco_text = img_result.text;

      deco_text = _decorate_xap_tag( deco_text, 200, 200 );

      var check_result = _decorate_checkbox( deco_text, checkbox_no );
      checkbox_no = check_result.no;
      deco_text = check_result.text;

      deco_text = _decorate_link_tag( deco_text );

      deco_text = _decorate_draggable( deco_text );
      deco_text = _decorate_header( deco_text );
      deco_text = _decorate_hr( deco_text );
      deco_text = _decorate_list( deco_text );
      deco_text = _decorate_line_color( deco_text );
      deco_text = _decorate_ref( deco_text );
      deco_text = _decorate_send_message( deco_text );
      deco_text = _decorate_windows_path( deco_text );
      deco_text = _decorate_table( deco_text );

      return deco_text;
    }
  }

  function _decorate_raw_tag( text ){
    var is_code = text.split("\n")[0].indexOf("code") != -1;
    if (is_code){
      // コードに色付け
      var raw_text = text.replace(/^code/,"");
      var $pretty_tmp_pre = $('<pre/>').addClass("prettyprint").text(raw_text);
      var $pretty_tmp_div = $('#share_memo_pre_tmp').append($pretty_tmp_pre);

      prettyPrint(null, $pretty_tmp_div.get(0));
      raw_text = $pretty_tmp_pre.html();
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

  function _decorate_wip( text ){
    var wiped_text = text.replace(/\[WIP\]/g,
        function(){
          return '<span class="label label-important">[WIP]</span>';
        });
    return wiped_text;
  }

  function _decorate_cal_placeholder( text ){
    var cal_text = text.replace(/\[(cal-below|cal-above)\]/g,
        function(){
          var cal_kind = arguments[1];
          return '<span class="cal-placeholder">' + cal_kind + '</span>';
        });
    return cal_text;
  }

  function _decorate_link_tag( text ){
    var linked_text = text.replace(/\[(.+?)\]\((((https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)|(blog\?id=\w+)))\)|((https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+))/g,
        function(){
          var title = arguments[1];
          if (title == null){
            // 生URL
            var link = arguments[7];

            if ( link.match(/(\.jpg|\.jpeg|\.gif|\.png|\.bmp)[?]?/i)){
              return link;
            }else{
              return '<a href="' + link + '" target="_blank" >' + link + '</a>';
            }
          }else{
            var link = arguments[2];
            // タイトル付きURL
            return '<a href="' + link + '" target="_blank" >' + title + '</a>';
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

  function _decorate_img_tag( text, default_height, img_index){
    var img_text = text.replace(/(=?)((\S+?(\.jpg|\.jpeg|\.gif|\.png|\.bmp)([?][\S]*)?)($|\s([0-9]+)|\s))/gi,
        function(){
          img_index++;
          var matched_link = arguments[3];
          var height = arguments[7];
          var height_css = "height:";
          if (height == "" || !isFinite(height)){ // firefox では空文字になるので判定が必要
            height = default_height;
            height_css = "max-height:";
          }
          var prefix = arguments[1] ? arguments[1] : "";
          return prefix + '<a href="' + matched_link + '" data-index="' + img_index + '" class="thumbnail" style="position: relative; vertical-align: top;"><img src="' + matched_link + '" style="' + height_css + height + 'px"/></a>';
        });
    return {text: img_text, no: img_index};
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
      var prefix = arguments[2];
      if (prefix != undefined){
        var sym_prefix = arguments[3];
        var checked = arguments[4] == 'x' ? 'checked' : '';
        var checkbox_class = "checkbox-draggable";
        return prefix + '<input type="checkbox" class="' + checkbox_class + '" data-no="' + no++ + '" ' + checked + ' />';
      }else{
        var checked = arguments[7] == 'x' ? 'checked' : '';
        return '<input type="checkbox" class="checkbox" data-no="' + no++ + '" ' + checked + ' />';
      }
    });
    return {text: check_text, no: no};
  }

  function _decorate_draggable( text ){
    var draggable_text = text.replace(/^=(.*)/mg, function(){
      var matched_text = arguments[1];
      if (matched_text == "[input]"){
        return '<div class="" style="padding-right: 10px"><input type="text" class="input-task" data-bind="event: {keydown: function(data,event){ return keydownInputTask(data,event,$element)}}" style="width:100%; margin-bottom:2px;" placeholder="type task and enter key."></div>';
      }else{
        return '<span class="text-draggable">' + _decorate_line_color(matched_text) + '</span>';
      }
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

  function _decorate_list( text ){
    return text.replace(/^([ ]*)([\*-])[ ]*(.*)$/mg, function(){
      var indent = arguments[1].length;
      var matched_text = arguments[3];
      var li_text = _decorate_line_color(matched_text);
      var level = parseInt(indent / 4);
      if (level == 0){
        return _get_hide_mark_li(level, 'list-ul-1', li_text);
      }else if (level == 1){
        return _get_hide_mark_li(level, 'list-ul-2', li_text);
      }else{
        return _get_hide_mark_li(level, 'list-ul-3', li_text);
      }
    });
  }

  function _get_hide_mark_li(count, ul_class, content){
    var wrapped_content = '<ul class="list-ul ' + ul_class + '"><li>' + content + '</li></ul>';
    for (var i = 0; i < count; i++){
      wrapped_content = '<ul class="hide-mark"><li>' + wrapped_content + '</li></ul>';
    }
    return wrapped_content;
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
          return '<span data-bind="click: $parent.set_ref_point.bind($data, $element)" class="btn btn-default btn-mini ref-point" id="' + matched_id + '"><i class="icon-share"></i></span>';
        });
    return refed_text;
  }

  function _decorate_send_message( text ){
    var message_text = text.replace(/^&lt;=(.+)/mg,
        function(){
          var send_message = arguments[1];
          return '<span data-bind="click: $parent.set_send_message.bind($data, \'' + send_message + '\'),tooltip: \'bottom\'" class="btn btn-info btn-mini" title="チャットに送信する"><i class="icon-comment icon-white"></i> ' + send_message + '</span> ';
        });
    return message_text;
  }

  function _decorate_hr( text ){
    var hr_text = text.replace(/^---[-]*$/mg,
        function(){
          return '<hr></hr>';
        });
    return hr_text;
  }

  function _decorate_windows_path( text ){
    var win_path = text.replace(/((^|[ ]+)((\\\\[^\s　]+|[a-zA-Z]:)\\[^\s　]+)|(^|[ ]+)"((\\\\[^\s　]+|[a-zA-Z]:)\\.+)")/mg,
        function(){
          var prefix = ((arguments[2] || arguments[5] ) || "");
          var matched = arguments[3] || arguments[6];
          return prefix + '<span class="win-path" data-clipboard-text="' + matched + '" data-bind="clippable: true, tooltip: \'bottom\'" title="Copy">' + matched + '</span>';
        });
    return win_path;
  }

  function _decorate_inline_code( text ){
    var inline_code = text.replace(/`{1}([^`]+)`{1}/g,
        function(){
          var matched = arguments[1];
          var formatted = matched.replace(/&/g, '&amp;')
                                 .replace(/'/g, '&#x27;')
                                 .replace(/"/g, '&quot;')
                                 .replace(/</g, '&lt;')
                                 .replace(/>/g, '&gt;')
          return '<span class="inline-code">' + formatted + '</span>';
        });
    return inline_code;
  }

  function _get_table_aligns(aligns_text){
    var AlignCenter = /^[ ]*[:]-+[:][ ]*/;
    var AlignRight  = /^[ ]*[-]-+[:][ ]*/;
    var AlignLeft   = /^[ ]*[:]-+[-][ ]*/;

    var align_rows = aligns_text.split(/\|/);
    align_rows.shift();
    align_rows.pop();

    return align_rows.map(function(row){
      if (row.match(AlignCenter)) return "center";
      if (row.match(AlignRight)) return "right";
      if (row.match(AlignLeft)) return "left";
      return "left"; // デフォルトは左寄せ
    });
  }

  function _decorate_table( text ){
    var text_array = text.split(/\n/);
    var isInTable = false;
    var tabled_text_array = [];
    var table_tmp = "";

    var AlignAll = /^\|[ ]*[:-]-+[:-][ ]*\|/;

    var aligns = [];

    for (var i = 0; i < text_array.length; i++){
      if (text_array[i].match(/^\|/)){
        var rows = text_array[i].split(/\|/);
        // 先頭と末尾の空を排除
        rows.shift();
        rows.pop();

        if (!isInTable){
          isInTable = true;

          // table 作成開始
          table_tmp = '<table class="table table-bordered code-table"><tbody>';
 
          if ((i+1 < text_array.length) && text_array[i+1].match(AlignAll)){
            // ヘッダあり
            aligns = _get_table_aligns(text_array[i+1]);

            var aligned_rows = rows.map(function(row, j){
              return '<th style="text-align: ' + (aligns[j] ? aligns[j] : 'left') + '">' + row + '</th>';
            });

            table_tmp += '<tr class="code-out-tr">' + aligned_rows.join('') + '</tr>';
            i++; // ヘッダ指定行を読み飛ばす
          }else{
            // ヘッダなし
            var aligned_rows = rows.map(function(row, j){
              return '<td style="text-align: ' + (aligns[j] ? aligns[j] : 'left') + '">' + row + '</td>';
            });

            table_tmp += '<tr>' + aligned_rows.join('') + '</tr>';
          }
        }else{
          var aligned_rows = rows.map(function(row, j){
            return '<td style="text-align: ' + (aligns[j] ? aligns[j] : 'left') + '">' + row + '</td>';
          });

          table_tmp += '<tr class="code-out-tr">' + aligned_rows.join('') + '</tr>';
        }
      }else{
        if (isInTable){
          isInTable = false;

          // table を完成させて出力する
          table_tmp += '</tbody></table>';

          tabled_text_array.push(table_tmp);
          aligns = [];
        }

        tabled_text_array.push(text_array[i]);
      }
    }
    if (isInTable){
      table_tmp += '</tbody></table>';
      tabled_text_array.push(table_tmp);
    }

    return tabled_text_array.join('\n');
  }

  $.decora = {
    to_html: function(target_text){
      return this.apply_to_deco_and_raw(
          target_text,
          _create_decorate_html_tag(),
          _decorate_raw_tag);
    },

    message_to_html: function(target_text){
      return this.apply_to_deco_and_raw(
          target_text,
          _decorate_html_tag_for_message,
          _decorate_raw_tag_for_message);
    },

    apply_to_deco_and_raw: function(target_text, deco_func, raw_func){
      var bq_sepa_array = target_text.split("```");
      var base_line = 0;
      for (var i = 0; i < bq_sepa_array.length; i++){
        if (bq_sepa_array[i] != undefined){
          var line = bq_sepa_array[i].split("\n").length;
          if (i%2 == 0){
            // 装飾有り
            if ( typeof deco_func === "function"){
              bq_sepa_array[i] = deco_func(bq_sepa_array[i], base_line);
            }
            base_line += line - 1;
          }else{
            // 装飾無し
            if ( typeof raw_func === "function"){
              bq_sepa_array[i] = raw_func(bq_sepa_array[i], base_line);
            }
            base_line += line -1;
          }
        }
      }

      return bq_sepa_array.join('');
    }
  };
})(jQuery);

