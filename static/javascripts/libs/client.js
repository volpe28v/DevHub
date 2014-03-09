var login_name = '';
var LOGIN_COLOR_MAX = 9;
var COOKIE_NAME = "dev_hub_name";
var COOKIE_STYLE_NAME = "dev_hub_style_name";
var COOKIE_EXPIRES = 365;
var CODE_MIN_HEIGHT = 700;
var CODE_OUT_ADJUST_HEIGHT = 200;
var CODE_INDEX_ADJUST_HEIGHT = 50;
var CODE_ADJUST_HEIGHT = 100;
var SHARE_MEMO_NUMBER = 20;
var DEFAULT_STYLE_NAME = 'default';
var STYLE_CONFIG = {
  'default': {
    white_icon: true,
    css_file: 'bootstrap.min.css'
  },
  'journal': {
    white_icon: false,
    css_file: 'bootstrap.journal.css'
  },
  'united': {
    white_icon: true,
    css_file: 'bootstrap.united.css'
  }
};

var socket = io.connect('/');
var is_mobile = false;

// for share memo
var writing_text = [];
var text_logs = [];

// Controllers
var chatController = null;

// for favicon
var faviconNumber = null;

$(function() {
  if ($(window).width() < 768){
    is_mobile = true;
  }

  faviconNumber = new FaviconNumber({
    focus_id: "message"
  });

  chatController = new ChatController({
    socket: socket,
    faviconNumber: faviconNumber
  });

  init_sharememo();
  init_websocket();
  init_dropzone();

  // for smartphone
  // 本当は bootstrap-responsive のみやりたいが、perfectScrollbar の制御は
  // js側でやらないといけないので解像度で切り分ける
  if (!is_mobile){
    $('body').addClass("perfect-scrollbar-body-style");

    $('#chat_area').addClass("perfect-scrollbar-style");
    $('#chat_area').perfectScrollbar({
      wheelSpeed: 40
    });

    $('#memo_area').addClass("perfect-scrollbar-style");
    $('#memo_area').perfectScrollbar({
      wheelSpeed: 40,
      useKeyboard: false
    });
  }else{
    // モバイルの場合はフリックイベントでチャットとメモを切り替える
    $('.hidden-phone').remove();
    $('.visible-phone').show();
    $('.text-writer').remove();
    $('.checkbox-count').remove();

    // フリック用のサイズ調整
    adjust_display_size_for_mobile();

    $(window).resize(function(){
      adjust_display_size_for_mobile();
    });
  }

  var style_name = $.cookie(COOKIE_STYLE_NAME) || DEFAULT_STYLE_NAME;
  change_style(style_name);

  $('a[id^="style-"]').click(function(e) {
    e.preventDefault();
    var new_style_name = $(e.target).attr('id').replace(/^style-/, '');
    change_style(new_style_name);
  });

  if ( $.cookie(COOKIE_NAME) == null && !is_mobile){
    setTimeout(function(){
      $('#name_in').modal("show");
      setTimeout(function(){
          $('#login_name').focus();
        },500);
      },500);
  }else{
    login_name = $.cookie(COOKIE_NAME);
    $('#name').val(login_name);
    $('#message').focus();
  }

  $(window).on("blur focus", function(e) {
    faviconNumber.off();
  });
});

function adjust_display_size_for_mobile(){
    // フリック用のサイズ調整
    var window_width = $(window).width();
    $('.viewport').css('width',window_width + 'px').css('overflow','hidden').css('padding',0);
    $('.flipsnap').css('width',window_width * 2 + 'px');
    $('#chat_area').css('width',window_width + 'px').css('margin',0);
    $('#memo_area').css('width',window_width + 'px').css('margin',0);
    Flipsnap('.flipsnap').refresh();
}

function init_sharememo(){
  for (var i = SHARE_MEMO_NUMBER; i > 1; i--){
    $("#share_memo_tab_top").after($('<li/>').addClass("share-memo-tab").attr("data-no",i));
    $("#share_memo_1").after($('<div/>').attr('id',"share_memo_" + i).attr("data-no",i).addClass("share-memo tab-pane"));
    $("#memo_number_option_top").after($('<option/>').attr('value',i).html(i));
  }
  $("#scroll_top").click(function(){
    $('#memo_area').animate({ scrollTop: 0 }, 'fast');
  });

  $("#share_zen").click(function(){
    if ($("#memo_area").hasClass("memo-area")){
      $("#chat_area").fadeOut(function(){
        $("#memo_area").removeClass("memo-area span7");
        $("#memo_area").addClass("memo-area-zen span11");
      });
    }else{
      $("#memo_area").removeClass("memo-area-zen span11");
      $("#memo_area").addClass("memo-area span7");
      $("#chat_area").fadeIn();
    }
  });

  $(".share-memo-tab").each(function(){
    var no = $(this).data('no');
    $(this).append(
      $('<a/>').addClass("share-memo-tab-elem")
               .attr('id',"share_memo_tab_" + no)
               .attr('href',"#share_memo_" + no)
               .attr('data-toggle',"tab")
               .attr('data-no',no)
               .css('display','none').append(
        $('<span/>').html(" - No." + no + " - ")).append(
        $('<div/>').addClass("writer")).append(
        $('<div/>').append(
          $('<span/>').addClass("timestamp"))));
  });

  $(".share-memo").each(function(){
    $(this).append(
      $('<button/>').addClass("sync-text btn btn-primary").css("float","left").html('<i class="icon-edit icon-white"></i> Edit')).append(
      $('<button/>').addClass("fix-text btn btn-info").css("float","left").css("display","none").html('<i class="icon-edit icon-white"></i> Done')).append(
      $('<button/>').addClass("diff-done btn btn-info").css("float","left").css("display","none").html('<i class="icon-resize-vertical icon-white"></i> Done')).append(
      $('<div/>').addClass("btn-group").css("float","left").append(
        $('<a/>').addClass("btn dropdown-toggle index-button hidden-phone").attr('data-toggle',"dropdown").attr('href',"#").html('<i class="icon-align-left"></i> Index ').append(
          $('<span/>').addClass("caret"))).append(
        $('<ul/>').addClass("dropdown-menu index-list"))).append(
      $('<div/>').addClass("btn-group").css("float","left").append(
        $('<a/>').addClass("btn dropdown-toggle diff-button hidden-phone").attr('data-toggle',"dropdown").attr('href',"#").html('<i class="icon-resize-vertical"></i> Diff ').append(
          $('<span/>').addClass("caret"))).append(
        $('<ul/>').addClass("dropdown-menu diff-list"))).append(
      $('<span/>').addClass("text-writer label label-info")).append(
      $('<span/>').addClass("checkbox-count").css("display","none")).append(
      $('<div/>').addClass('clearfix')).append(
      $('<textarea/>').addClass("code code-unselect").css("display","none").attr("placeholder", "Write here")).append(
      $('<pre/>').addClass("text-base-style").append($('<div/>').addClass("code-out"))).append(
      $('<div/>').addClass("diff-view").css("display","none"));
  });
}


function init_websocket(){
  socket.on('connect', function() {
    //console.log('connect');
    socket.emit('name', {name: $.cookie(COOKIE_NAME)});
  });

  socket.on('disconnect', function(){
    //console.log('disconnect');
  });

  socket.on('set_name', function(name) {
    $('#name').val(name);
    $('#login_name').val(name);
  });

  // for chat
  chatController.bindSocketEvent();

  // for share memo
  $(".code").autofit({min_height: CODE_MIN_HEIGHT});

  function setCaretPos(item, pos) {
    if (item.setSelectionRange) {  // Firefox, Chrome
      item.setSelectionRange(pos, pos);
    } else if (item.createTextRange) { // IE
      var range = item.createTextRange();
      range.collapse(true);
      range.moveEnd("character", pos);
      range.moveStart("character", pos);
      range.select();
    }
  };

  function switchEditShareMemo($share_memo, row){
    var no = $share_memo.data('no');
    writing_text[no] = writing_text[no] ? writing_text[no] : { text: "" };

    var $target_code = $share_memo.children(".code");
    $target_code.val(writing_text[no].text);
    $target_code.fadeIn('fast', function(){
      $target_code.keyup(); //call autofit
      // 編集モード時に選択した行位置を表示する
      $target_code.caretLine(row);
      $('#memo_area').scrollTop(row * 18 - CODE_ADJUST_HEIGHT);
    });
    $share_memo.children('pre').hide();
    $share_memo.children('.fix-text').show();
    $share_memo.children('.sync-text').hide();
    writing_loop_start(no);

    code_prev[no] = $target_code.val();
  }

  $('.share-memo').on('click','.sync-text', function(){
    var $share_memo = $(this).closest('.share-memo');
    switchEditShareMemo($share_memo, 0);
  });

  $('.share-memo').on('dblclick','pre tr', function(){
    // クリック時の行数を取得してキャレットに設定する
    var $share_memo = $(this).closest('.share-memo');
    var row = $(this).closest("table").find("tr").index(this);
    switchEditShareMemo($share_memo, row);
    return false;
  });

  $('.share-memo').on('dblclick','pre', function(){
    // 文字列が無い場合は最下部にキャレットを設定する
    var $share_memo = $(this).closest('.share-memo');
    var row = $(this).find("table tr").length - 1;
    switchEditShareMemo($share_memo, row);
  });

  // 差分リスト表示
  $('.share-memo').on('click','.diff-button', function(){
    var $share_memo = $(this).closest('.share-memo');
    switchFixShareMemo($share_memo,1);

    var $diff_list = $share_memo.find('.diff-list');
    var share_memo_no = $share_memo.data('no');
    var text_log = text_logs[share_memo_no];
    if (text_log == undefined || text_log.length == 0 ){ return; }
    if (writing_text[share_memo_no].date != text_log[0].date){
      text_log.unshift(writing_text[share_memo_no]);
    }

    $diff_list.empty();
    $diff_list.append($('<li/>').append($('<a/>').addClass("diff-li").attr('href',"#").html('<i class="icon-play"></i> Current memo - ' + text_log[0].name)));
    for (var i = 1; i < text_log.length; i++){
      $diff_list.append($('<li/>').append($('<a/>').addClass("diff-li").attr('href',"#").html(text_log[i].date + " - " + text_log[i].name)));
    }
  });

  $('.share-memo').on('mouseover','.diff-li', function(){
    var diff_li_array = $(this).closest(".diff-list").find(".diff-li");
    var index = diff_li_array.index(this);
    diff_li_array.each(function(i, li){
      if (i < index){
        $(li).addClass("in_diff_range");
      }else if(i > index){
        $(li).removeClass("in_diff_range");
      }
    });
  });

  $('.share-memo').on('mouseout','.diff-li', function(){
    var diff_li_array = $(this).closest(".diff-list").find(".diff-li");
    diff_li_array.each(function(i, li){
      $(li).removeClass("in_diff_range");
    });
  });

  // 差分を表示
  $('.share-memo').on('click','.diff-li', function(){
    var $share_memo = $(this).closest('.share-memo');
    var $code_out_pre = $share_memo.find('pre');
    var share_memo_no = $share_memo.data('no');
    var index = $(this).closest(".diff-list").find(".diff-li").index(this);

    // diff 生成
    var base   = difflib.stringAsLines(text_logs[share_memo_no][index].text);
    var newtxt = difflib.stringAsLines(writing_text[share_memo_no].text);
    var sm = new difflib.SequenceMatcher(base, newtxt);
    var opcodes = sm.get_opcodes();
    var $diff_out = $share_memo.find('.diff-view');
    $diff_out.empty();
    $diff_out.append(diffview.buildView({
        baseTextLines: base,
        newTextLines: newtxt,
        opcodes: opcodes,
        baseTextName: "Current",
        newTextName: text_logs[share_memo_no][index].date + " - " + text_logs[share_memo_no][index].name,
        viewType: 1
    }));

    // diff 画面を有効化
    $diff_out.fadeIn();
    $code_out_pre.hide();

    $share_memo.find('.diff-done').show();
    $share_memo.find('.sync-text').hide();
    $share_memo.find('.index-button').hide();
    return true;
  });

  // 差分表示モード終了
  $('.share-memo').on('click','.diff-done', function(){
    var $share_memo = $(this).closest('.share-memo');
    $share_memo.find('pre').fadeIn();
    $share_memo.find('.diff-view').hide();

    $share_memo.find('.diff-done').hide();
    $share_memo.find('.sync-text').show();
    $share_memo.find('.index-button').show();
  });

  // 見出し表示
  $('.share-memo').on('click','.index-button', function(){
    var $share_memo = $(this).closest('.share-memo');
    switchFixShareMemo($share_memo,1);

    var $index_list = $share_memo.find('.index-list');
    var $code_out = $share_memo.find('.code-out');
    $index_list.empty();
    $code_out.find(":header").each(function(){
      var h_num = parseInt($(this).get()[0].localName.replace("h",""));
      var prefix = "";
      for (var i = 1; i < h_num; i++){ prefix += "&emsp;"; }
      $index_list.append($('<li/>').append($('<a/>').addClass("index-li").attr('href',"#").html(prefix + " " + $(this).text())));
    });
  });

  // 見出しへスクロール移動
  $('.share-memo').on('click','.index-li', function(){
    var index = $(this).closest(".index-list").find(".index-li").index(this);
    var $code_out = $(this).closest('.share-memo').find('.code-out');
    var pos = $code_out.find(":header").eq(index).offset().top;
    $('#memo_area').animate({ scrollTop: pos - CODE_INDEX_ADJUST_HEIGHT}, 'fast');
    return true;
  });

  // デコレートされた html へのイベント登録
  $('.share-memo').decora({
    checkbox_callback: function(that, applyCheckStatus){
      var share_memo_no = $(that).closest('.share-memo').data('no');

      // チェック対象のテキストを更新する
      writing_text[share_memo_no].text = applyCheckStatus(writing_text[share_memo_no].text);

      // 変更をサーバへ通知
      var $target_code = $(that).closest('.share-memo').children('.code');
      $target_code.val(writing_text[share_memo_no].text);
      socket.emit('text',{no: share_memo_no, text: $target_code.val()});
    }
  });

  $('#pomo').click(function(){
    var name = $('#name').val();
    var message = $('#message').val();
    $.cookie(COOKIE_NAME,name,{ expires: COOKIE_EXPIRES });

    $('#message').attr('value', '');
    socket.emit('pomo', {name: name, msg: message});
    return false;
  });

  var login_action = function(){
    var name = $('#login_name').val();
    if ( name != "" ){
      $.cookie(COOKIE_NAME,name,{ expires: COOKIE_EXPIRES });
      socket.emit('name', {name: $.cookie(COOKIE_NAME)});
      $('#name').val($.cookie(COOKIE_NAME));
      $('#message').focus();
    }
    $('#name_in').modal('hide')
  };

  $('#login').click(function(){
    login_action();
  });

  $('#login_form').submit(function(){
    login_action();
    return false;
  });

  function switchFixShareMemo($share_memo, row){
    if ($share_memo.children('.code').css('display') == "none"){ return; }

    $share_memo.children('.code').hide();
    $share_memo.children('pre').fadeIn();
    $share_memo.children('.fix-text').hide();
    $share_memo.children('.sync-text').show();

    // 閲覧モード時に編集していたキャレット位置を表示する
    var $target_tr = $share_memo.find('table tr').eq(row - 1);
    if ($target_tr.length > 0){
      $('#memo_area').scrollTop(0);
      $('#memo_area').scrollTop($target_tr.offset().top - CODE_OUT_ADJUST_HEIGHT);
    }
    socket.emit('add_history',{no: $share_memo.data('no')});
    writing_loop_stop();
  }

  $('#share-memo').on('click','.share-memo-tab-elem', function(){
    var writing_no = writing_loop_timer.code_no;
    if ( writing_no != 0){
      $share_memo= $('#share_memo_' + writing_no);
      switchFixShareMemo($share_memo, 1);
    }
    $('#memo_area').animate({ scrollTop: 0 }, 'fast');
    return true;
  });

  $('.share-memo').on('dblclick','.code', function(){
    switchFixShareMemo($(this).parent(), $(this).caretLine());
  });

  $('.share-memo').on('click','.fix-text', function(){
    switchFixShareMemo($(this).parent(),1);
  });

  $(".share-memo").on('keydown','.code',function(event){
    // Ctrl - S or Ctrl - enter
    if ((event.ctrlKey == true && event.keyCode == 83) ||
        (event.ctrlKey == true && event.keyCode == 13)) {
      event.returnvalue = false;
      switchFixShareMemo($(this).parent(), $(this).caretLine());
      return false;
    }
  });

  var update_timer = [];
  // for share memo
  socket.on('text', function(text_log) {
    var no = text_log.no == undefined ? 1 : text_log.no;
    writing_text[no] = text_log;
    var $target = $('#share_memo_' + no);
    var $target_tab = $('#share_memo_tab_' + no);

    // 編集中の共有メモに他ユーザの変更が来たらフォーカスを外す
    if ( no == writing_loop_timer.code_no && login_name != text_log.name ){
      switchFixShareMemo($target, $target.children('.code').caretLine());
    }

    function setToTable(html){
      var table_html = "<table><tr><td>";
      table_html += html.replace(/[\n]/g,"</td></tr><tr><td>");
      return table_html += "</td></tr></table>";
    }

    // for code_out
    var $text_writer = $target.children('.text-writer');
    $text_writer.html(text_log.date);
    $text_writer.removeClass("label-info");
    $text_writer.addClass("label-important");
    $text_writer.show();
    $target.find('.code-out').html(setToTable($.decora.to_html(text_log.text)));
    $target.find('tr:has(:header)').addClass("header-tr");
    setColorbox($target.find('.thumbnail'));

    // チェックボックスの進捗表示
    var checked_count = $target.find("input:checked").length;
    var checkbox_count = $target.find("input[type=checkbox]").length;
    if (checkbox_count > 0){
      $target.find('.checkbox-count').html(checked_count + "/" + checkbox_count + " done").show();
      if (checked_count == checkbox_count){
        $target.find('.checkbox-count').addClass('checkbox-count-done');
      }else{
        $target.find('.checkbox-count').removeClass('checkbox-count-done');
      }
    }else{
      $target.find('.checkbox-count').hide();
    }

    var title = $target.find('.code-out').text().split("\n")[0];
    if (!title.match(/\S/g)){
      title = " - No." + no + " - ";
    }
    $target_tab.children('span').html(title);

    var $writer = $target_tab.children('.writer');
    $writer.addClass("silent-name writing-name");
    $writer.html(text_log.name);

    var $timestamp = $target_tab.find('.timestamp');
    $timestamp.attr("data-livestamp", text_log.date);

    var is_blank = text_log.text == "";
    if (is_blank){
      $writer.hide();
      $timestamp.hide();
    }else{
      $writer.show();
      $timestamp.show();
    }

    if (update_timer[no]){
      clearTimeout(update_timer[no]);
    }
    update_timer[no] = setTimeout(function(){
      $text_writer.html(text_log.date);
      $text_writer.removeClass("label-important");
      $text_writer.addClass("label-info");
      $writer.removeClass("writing-name");
      update_timer[no] = undefined;
    },3000);
  });

  socket.on('text_logs_with_no', function(data){
    text_logs[data.no] = data.logs;
  });

  var code_prev = [];

  var writing_loop_timer = { id: -1, code_no: 0};
  function writing_loop_start(no){
    $target_code = $('#share_memo_' + no).children('.code');
    var loop = function() {
      var code = $target_code.val();
      if (code_prev[no] != code) {
        socket.emit('text',{no: no, text: code});
        code_prev[no] = code;
      }
    };
    // 念のためタイマー止めとく
    if (writing_loop_timer.id != -1){
      writing_loop_stop();
    }
    writing_loop_timer = {id: setInterval(loop, 400), code_no: no};
  }

  function writing_loop_stop(){
    clearInterval(writing_loop_timer.id);
    writing_loop_timer = { id: -1, code_no: 0};
  }

  $('#memo_number').bind('change',function(){
    var num = $(this).val();
    socket.emit('memo_number', {num: num});
  });

  socket.on('memo_number', function(data){
    var num = data.num;
    $('.share-memo-tab-elem').hide();
    for (var i = 1; i <= num; i++){
      $('#share_memo_tab_' + i).fadeIn("fast");
      $('#share_memo_tab_' + i).css("display", "block");
    }
    $('#memo_number').val(num);
  });
};


function change_style(style_name) {
  if (!(style_name in STYLE_CONFIG)) {
    throw Error('invalid style name: ' + style_name);
  }

  var style = STYLE_CONFIG[style_name];
  var css_file = style.css_file;
  $("#devhub-style").attr('href','/stylesheets/' + css_file);
  $.cookie(COOKIE_STYLE_NAME, style_name, { expires: COOKIE_EXPIRES });

  var navbar_icons = $('.nav i[class^="icon-"]');
  if (style.white_icon) {
    navbar_icons.addClass('icon-white');
  }else{
    navbar_icons.removeClass('icon-white');
  }
}

function show_share_memo_alert($target, title, text){
  var $alert = $('<div>').addClass('share-memo-alert alert alert-error').css('display','none')
    .html('<a class="close" data-dismiss="alert">x</a><strong>' + title + '</strong> ' + text )
    .prependTo($target)
    .slideDown('normal', function(){
      var that = this;
      setTimeout(function(){
        if ($(that)){
          $(that).slideUp('normal',function(){
            $(this).remove();
          });
        }
      }, 10000);
    });
}

function show_share_memo_uploading($target, title, text){
  return $alert = $('<div>').addClass('share-memo-alert alert alert-info').css('display','none')
    .html('<a class="close" data-dismiss="alert">x</a><strong>' + title + '</strong> ' + text )
    .prependTo($target)
    .slideDown('normal');
}

function hide_share_memo_alert($alert){
  $alert.slideUp('normal',function(){
    $(this).remove();
  });
}

function init_dropzone(){
  // File API が使用できない場合は諦めます.
  if(!window.FileReader) {
    show_share_memo_alert('Drop image', 'This browser does not support dropping image files.');
    return false;
  }

  var cancelEvent = function(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  var drop_file_action = function($target, call_back){
    return function(event){
      var that = this;
      var file = event.originalEvent.dataTransfer.files[0];

      upload_file_with_ajax(that, file, $target, call_back);
      return false;
    }
  }

  var select_file_action = function($target, call_back){
    return function(event){
      var that = this;
      var file = $(that).prop('files')[0];

      upload_file_with_ajax(that, file, $target, call_back);
      return false;
    }
  }

  function upload_file_with_ajax(that, file, $target, call_back){
    var $alert = show_share_memo_uploading($target, 'Uploading', 'now uploading "' + file.name + '" ... ');

    var formData = new FormData();
    formData.append('file', file);

    $.ajax('/upload' , {
      type: 'POST',
      contentType: false,
      processData: false,
      data: formData,
      error: function() {
        hide_share_memo_alert($alert);
        show_share_memo_alert($target, 'Drop error', 'failed to file upload.');
      },
      success: function(res) {
        hide_share_memo_alert($alert);
        call_back(that, res);
      }
    });
  }
 
  // 共有メモエリアへの画像ドロップ処理
  var $dropzone = $(".code-out");
  $dropzone.bind("dradenter", cancelEvent);
  $dropzone.bind("dragover", cancelEvent);

  $dropzone.on('drop', drop_file_action($('#alert_memo_area'), function(that, res){
    var share_memo_no = $(that).closest('.share-memo').data('no');

    // メモの先頭に画像を差し込む
    writing_text[share_memo_no].text = res.fileName + ' ' + '\n' + writing_text[share_memo_no].text;

    // 変更をサーバへ通知
    var $target_code = $(that).closest('.share-memo').children('.code');
    $target_code.val(writing_text[share_memo_no].text);
    socket.emit('text',{no: share_memo_no, text: $target_code.val()});
  }));

  // チャットエリアへの画像ドロップ処理
  var $dropchatzone = $("#chat_area");
  $dropchatzone.bind("dradenter", cancelEvent);
  $dropchatzone.bind("dragover", cancelEvent);

  $dropchatzone.on('drop', drop_file_action($('#alert_chat_area'), function(that, res){
    $('#message').val($('#message').val() + ' ' + res.fileName + ' ');
  }));

  // アップロードボタン
  $('#upload_chat_button').click(function(){
    $('#upload_chat').click();
    return false;
  });

  $('#upload_chat').on('change', select_file_action($('#alert_chat_area'), function(that, res){
    $('#message').val($('#message').val() + ' ' + res.fileName + ' ');
  }));
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
