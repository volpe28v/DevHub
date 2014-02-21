var latest_login_list = [];
var login_name = '';
var suggest_obj = undefined;
var LOGIN_COLOR_MAX = 9;
var COOKIE_NAME = "dev_hub_name";
var COOKIE_CSS_NAME = "dev_hub_css_name";
var COOKIE_EXPIRES = 365;
var CSS_DEFAULT_NAME = "bootstrap.min.css";
var TITLE_ORG = document.title;
var CODE_MIN_HEIGHT = 700;
var CODE_OUT_ADJUST_HEIGHT = 200;
var CODE_INDEX_ADJUST_HEIGHT = 50;
var CODE_ADJUST_HEIGHT = 100;
var SHARE_MEMO_NUMBER = 20;
var DROP_IMAGE_HEIGHT = 200;
var DROP_IMAGE_CHAT_HEIGHT = 60;

var socket = io.connect('/');

// for share memo
var writing_text = [];
var text_logs = [];
var newest_count = 0;

$(function() {
  init_chat();
  init_sharememo();
  init_websocket();
  init_dropzone();

  var css_name = $.cookie(COOKIE_CSS_NAME) || CSS_DEFAULT_NAME;
  $("#devhub-style").attr('href','/stylesheets/' + css_name );

  if ( $.cookie(COOKIE_NAME) == null ){
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
    newest_off();
  });
});

function init_chat(){
  $('#chat_area').perfectScrollbar({
    wheelSpeed: 40
  });
  $('#list').on('click', '.remove_msg', function(){
    var id = "#" + $(this).closest('li').attr('id');
    var data_id = $(this).closest('li').data('id');
    $(id).fadeOut();
    send_remove_msg(data_id);
  });
  $('#list').on('click', '.login-name-base', function(){
    var name = $(this).text();
    $('#message').val($('#message').val() + " @" + name + "さん ");
    $('#message').focus();
  });
}

function init_sharememo(){
  $('#memo_area').perfectScrollbar({
    wheelSpeed: 40,
    useKeyboard: false
  });

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
      $('<a/>').html(no + " ").addClass("share-memo-tab-elem")
               .attr('id',"share_memo_tab_" + no)
               .attr('href',"#share_memo_" + no)
               .attr('data-toggle',"tab")
               .attr('data-no',no)
               .css('display','none').append(
        $('<span/>')).append(
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
        $('<a/>').addClass("btn dropdown-toggle index-button").attr('data-toggle',"dropdown").attr('href',"#").html('<i class="icon-align-left"></i> Index ').append(
          $('<span/>').addClass("caret"))).append(
        $('<ul/>').addClass("dropdown-menu index-list"))).append(
      $('<div/>').addClass("btn-group").css("float","left").append(
        $('<a/>').addClass("btn dropdown-toggle diff-button").attr('data-toggle',"dropdown").attr('href',"#").html('<i class="icon-resize-vertical"></i> Diff ').append(
          $('<span/>').addClass("caret"))).append(
        $('<ul/>').addClass("dropdown-menu diff-list"))).append(
      $('<span/>').addClass("text-writer label label-info")).append(
      $('<span/>').addClass("checkbox-count").css("display","none")).append(
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
  socket.on('message_own', function(data) {
    prepend_own_msg(data);
    newest_mark();
  });

  socket.on('message', function(data) {
    prepend_msg(data);
    newest_mark();
  });

  socket.on('remove_message', function(data) {
    $('#msg_' + data.id).fadeOut();
  });

  socket.on('list', function(login_list) {
    $('#login_list_loader').hide();

    var out_list = "";
    for (var i = 0; i < login_list.length; ++i){
      var login_elem = "";
      var place = "";
      if ( login_list[i].place != "" ){
        place = "@" + login_list[i].place;
      }
      if ( login_list[i].pomo_min > 0 ){
        login_elem = '<span class="login-elem login-name-pomo"><span class="name">' + login_list[i].name + '</span>' + place + ' <span class="pomo-min">' + login_list[i].pomo_min + 'min</span></span>'
      }else{
        login_elem = '<span class="login-elem login-name' + get_color_id_by_name_id(login_list[i].id) + '"><span class="name">' + login_list[i].name + '</span>' + place + '</span>'
      }
      out_list += login_elem + "<wbr>";
    }
    out_list = "<nobr>" + out_list + "</nobr>";

    if ($('#login_list').html() != out_list){
      $('#login_list').html(out_list);
      $('#login_list').fadeIn();
      suggest_start(login_list);

      // add click event for each login names.
      $('#login_list .login-elem').click(function(){
        var name = $(this).children(".name").text();
        $('#message').val($('#message').val() + " @" + name + "さん ");
        $('#message').focus();
      });
    }

    latest_login_list = login_list.sort(function(a,b){ return b.name.length - a.name.length });
  });

  socket.on('latest_log', function(msgs) {
    for ( var i = 0 ; i < msgs.length; i++){
      append_msg(msgs[i])
    }
  });

  $('#form').submit(function() {
    var name = $('#name').val();
    var message = $('#message').val();
    $.cookie(COOKIE_NAME,name,{ expires: COOKIE_EXPIRES });

    if ( message && name ){
      login_name = name;
      socket.emit('message', {name:name, msg:message});
      $('#message').attr('value', '');
    }
    return false;
  });

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

    var title = $target.find('.code-out').text().split("\n")[0].substr(0,4);
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

  socket.on('text_logs', function(text_logs){
    var logs_dl = $("<dl/>")
    for ( var i = 0; i < text_logs.length; ++i){
      var no = text_logs[i].no == undefined ? 1 : text_logs[i].no; // マルチメモ対応前の救済処置。

      var text_log_id = "text_log_id_" + text_logs[i]._id.toString();
      var text_body = $.decora.to_html(text_logs[i].text);

      var log_div = $("<div/>").attr("id", text_log_id);
      var log_dt = $("<dt/>");
      var writer_label = $("<span/>").addClass("label").text( text_logs[i].name + " at " + text_logs[i].date );
      var icon = $("<i/>").addClass("icon-repeat");
  
      var restore_btn = $("<div/>").addClass("btn-group").append(
                           $("<a/>").addClass("restore-log-button btn btn-mini dropdown-toggle")
                                    .attr("data-toggle","dropdown")
                                    .attr("data-no",i)
                                    .html('<i class="icon-share-alt"></i> Restore to ').append(
                             $("<span/>").addClass("caret"))).append(
                           $("<ul/>").addClass("dropdown-menu"));

      var favo_star = undefined;
      if ( text_logs[i].favo ){
        favo_star = $('<span/>').text('★').addClass("favo_star").toggle(
          function(){
            var target_log_id = text_logs[i]._id.toString();
            return function(){
              $(this).removeClass("favo_star")
                     .addClass("no_favo_star")
                     .text("☆")
              socket.emit('remove_favo_text', target_log_id);
            }
          }(),
          function(){
            var target_log_id = text_logs[i]._id.toString();
            return function(){
              $(this).removeClass("no_favo_star")
                     .addClass("favo_star")
                     .text("★")
              socket.emit('add_favo_text', target_log_id);
            }
          }()
        )
      }else{
        favo_star = $('<span/>').text('☆').addClass("no_favo_star").toggle(
          function(){
            var target_log_id = text_logs[i]._id.toString();
            return function(){
              $(this).removeClass("no_favo_star")
                     .addClass("favo_star")
                     .text("★")
              socket.emit('add_favo_text', target_log_id);
            }
          }(),
          function(){
            var target_log_id = text_logs[i]._id.toString();
            return function(){
              $(this).removeClass("favo_star")
                     .addClass("no_favo_star")
                     .text("☆")
              socket.emit('remove_favo_text', target_log_id);
            }
          }()
        )
      }

      var remove_btn = $('<a href="#" class="remove_text">x</a>').click(function(){
        var target_dom_id = text_log_id
        var target_log_id = text_logs[i]._id.toString();
        return function(){
          $('#' + target_dom_id).fadeOut("normal",function(){
            socket.emit('remove_text', target_log_id);
          });
          return false;
        }
      }())

      var log_dd = $("<dd/>")
      var log_pre = $("<pre/>").html(text_body)

      log_dt.append(
        $("<table/>").append(
          $("<tr/>").append(
            $("<td/>").append(
              favo_star)).append(
            $("<td/>").append(
              writer_label)).append(
            $("<td/>").append(
              restore_btn)))).append(
        remove_btn);
      log_dd.append(log_pre)
      log_div.append(log_dt).append(log_dd)
      logs_dl.append(log_div)
    }
    $('#auto_logs').empty();
    $('#auto_logs').append(logs_dl);

    $('.restore-log-button').click(function(){
      var $restore_target_list = $(this).parent().children('ul');
      var log_no = $(this).data('no');
      var restore_text = text_logs[log_no].text;
      $restore_target_list.empty();
      setRestoreToLists($restore_target_list, log_no, restore_text);
    });
  });

  socket.on('favo_logs', function(favo_logs){
    var logs_dl = $("<dl/>")
    for ( var i = 0; i < favo_logs.length; ++i){
      var no = favo_logs[i].no == undefined ? 1 : favo_logs[i].no;
      var text_log_id = "favo_log_id_" + favo_logs[i]._id.toString();
      var text_body = $.decora.to_html(favo_logs[i].text);

      var log_div = $("<div/>").attr("id", text_log_id)
      var log_dt = $("<dt/>")
      var writer_label = $("<span/>").addClass("label").addClass("label-warning").text( favo_logs[i].name + " at " + favo_logs[i].date )
      var icon = $("<i/>").addClass("icon-repeat")

      var restore_btn = $("<div/>").addClass("btn-group").append(
                           $("<a/>").addClass("restore-favo-button btn btn-mini dropdown-toggle")
                                    .attr("data-toggle","dropdown")
                                    .attr("data-no",i)
                                    .html('<i class="icon-share-alt"></i> Restore to ').append(
                             $("<span/>").addClass("caret"))).append(
                           $("<ul/>").addClass("dropdown-menu"));

      var remove_btn = $('<a href="#" class="remove_text">x</a>').click(function(){
        var target_dom_id = text_log_id
        var target_log_id = favo_logs[i]._id.toString();
        return function(){
          $('#' + target_dom_id).fadeOut("normal",function(){
            socket.emit('remove_favo_text', target_log_id);
          });
          return false;
        }
      }())

      var log_dd = $("<dd/>")
      var log_pre = $("<pre/>").html(text_body)

      log_dt.append(
        $("<table/>").append(
          $("<tr/>").append(
            $("<td/>").append(
              writer_label)).append(
            $("<td/>").append(
              restore_btn)))).append(
        remove_btn);

      log_dd.append(log_pre)
      log_div.append(log_dt).append(log_dd)
      logs_dl.append(log_div)
    }

    $('#favo_logs').empty();
    $('#favo_logs').append(logs_dl);

    $('.restore-favo-button').click(function(){
      var $restore_target_list = $(this).parent().children('ul');
      var log_no = $(this).data('no');
      var restore_text = favo_logs[log_no].text;

      $restore_target_list.empty();
      setRestoreToLists($restore_target_list, log_no, restore_text);
    });
  });

  function setRestoreToLists($restore_target_list, log_no, restore_text){
    $(".share-memo-tab:visible").each(function(){
      var restore_target_no = $(this).data('no');
      $restore_target_list.append(
        $("<li/>").append(
          $("<a/>").html(restore_target_no).click(function(){
            return function(){
              $('#share_memo_' + restore_target_no).children('.code').val(restore_text);
              $('#share_memo_tab_' + restore_target_no).click();
              $('html,body').animate({ scrollTop: 0 }, 'slow');

              socket.emit('text',{no: restore_target_no, text: $('#share_memo_' + restore_target_no).children('.code').val()});
            }();
          })
        )
      );
    });
  }

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

function suggest_start(list){
  var suggest_list = []
  for (var i = 0; i < list.length; ++i){
    suggest_list.push("@" + list[i].name + "さん");
  }

  if (suggest_obj == undefined){
    suggest_obj = new Suggest.LocalMulti("message", "suggest", suggest_list, {interval: 200, dispAllKey: false, prefix: true, highlight: true});
  }else{
    suggest_obj.candidateList = suggest_list;
  }
}

function append_msg(data){
  //TODO: System メッセージを非表示にする。
  //      切り替え可能にするかは検討する。
  if (data.name == "System") { return };
  if (exist_msg(data)){ return };

  var msg = get_msg_html(data);

  $('#list').append(msg.li.addClass(msg.css));
  msg.li.fadeIn();
};

function prepend_own_msg(data){
  if (exist_msg(data)){ return };
  var msg = get_msg_html(data);

  $('#list').prepend(msg.li);
  msg.li.addClass("text-highlight",0);
  msg.li.slideDown('fast',function(){
    msg.li.switchClass("text-highlight", msg.css, 500);
  });
};

function send_remove_msg(id){
  socket.emit('remove_message', {id:id});
}

function prepend_msg(data){
  //TODO: System メッセージを非表示にする。
  //      切り替え可能にするかは検討する。
  if (data.name == "System") { return }
  if (exist_msg(data)){ return };

  var msg = get_msg_html(data);

  $('#list').prepend(msg.li);
  msg.li.addClass("text-highlight",0);
  msg.li.slideDown('fast',function(){
    msg.li.switchClass("text-highlight", msg.css, 500);
  });
};

function newest_mark(){
  if ("message" == $(':focus').attr('id')){ newest_off(); return; }
  newest_count++;
  document.title = "(" + newest_count + ") " + TITLE_ORG;
}

function newest_off(){
  newest_count = 0;
  document.title = TITLE_ORG;
}

function exist_msg(data){
  if (data.msg == undefined) { data.msg = ""; }
  var id = '#msg_' + data._id.toString();
  return $(id).size() > 0;
}

function get_msg_html(data){
  if ( data.name == login_name ){
    return {
      li: get_msg_li_html(data).html(get_msg_body(data) + '<a class="remove_msg">x</a><span class="own_msg_date">' + data.date + '</span></td></tr></table>'),
      css: "own_msg"
    };
  } else if (include_target_name(data.msg,login_name)){
    return {
      li: get_msg_li_html(data).html(get_msg_body(data) + ' <span class="target_msg_date">' + data.date + '</span></td></tr></table>'),
      css: "target_msg"
    };
  }else{
    return {
      li: get_msg_li_html(data).html(get_msg_body(data) + ' <span class="date">' + data.date + '</span></td></tr></table>'),
      css: null
    };
  }
}

function get_msg_li_html(data){
  if ( data._id != undefined ){
    return $('<li/>').attr('style','display:none').attr('id','msg_' + data._id.toString()).attr('data-id', data._id.toString());
  }else{
    return $('<li/>').attr('style','display:none');
  }
}

function get_msg_body(data){
  var date = new Date();
  var id = date.getTime();

  var name_class = "login-name";
  var msg_class = "msg";

  data.id = get_id(data.name)

  if ( data.name == "System" ){
    name_class = "login-name-system";
    msg_class = "msg_ext"
  }else if ( data.ext == true ){
    name_class = "login-name-ext";
    msg_class = "msg_ext"
  }else if ( data.name == "Pomo" ){
    name_class = "login-name-pomosys";
    msg_class = "msg_pomo"
  }else{
    name_class = "login-name" + get_color_id_by_name_id(data.id);
  }

  return '<table><tr><td nowrap valign="top"><span class="login-name-base ' + name_class + '">' + data.name + '</span></td><td width="100%"><span class="msg_text ' + msg_class + '">' + decorate_msg(data.msg) + '</span>';
}

function get_color_id_by_name_id(id){
  if(id == 0){ return 0; } // no exist user.
  return id % LOGIN_COLOR_MAX + 1; // return 1 〜 LOGIN_COLOR_MAX
}

function decorate_msg(msg){
  var deco_msg = msg;

  deco_msg = deco_login_name(deco_msg)
  deco_msg = $.decora.message_to_html(deco_msg);

  return deco_msg;
};

function deco_login_name(msg){
  var deco_msg = msg;
  var name_reg = RegExp("@(.+?)さん", "g");
  deco_msg = deco_msg.replace( name_reg, function(){
    if (arguments[1] == login_name){
      return '<span class="label label-important">' + arguments[0] + '</span>'
    }else{
      return '<span class="label label-info">' + arguments[0] + '</span>'
    }
  });
  return deco_msg;
}

function include_target_name(msg,name){
  var name_reg = RegExp("@" + name + "( |　|さん|$)");
  if (msg.match(name_reg)){
    return true;
  }
  return false;
}

function get_id(name){
  for(var i = 0; i < latest_login_list.length; ++i ){
    if ( latest_login_list[i].name == name ){
      return latest_login_list[i].id;
    }
  }
  return 0;
}

function change_style(css_file){
  //console.log("change to " + css_file );
  $("#devhub-style").attr('href','/stylesheets/' + css_file);
  $.cookie(COOKIE_CSS_NAME,css_file,{ expires: COOKIE_EXPIRES });
}

function show_share_memo_alert(title, text){
  $('.share-memo-alert').remove();
  var $alert = $('<div>').addClass('share-memo-alert alert alert-error').css('display','none')
    .html('<a class="close" data-dismiss="alert">x</a><strong>' + title + '</strong> ' + text )
    .prependTo($('#share-memo'))
    .slideDown('normal', function(){
      var that = this;
      setTimeout(function(){
        if ($(that)){
          $(that).slideUp('normal',function(){
            $(this).remove();
          });
        }
      }, 5000);
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

  var validTypes = ["image/jpeg", "image/gif", "image/png", "image/bmp"];

  var drop_image_action = function(call_back){
    return function(event){
      var that = this;
      var file = event.originalEvent.dataTransfer.files[0];
      if ($.inArray(file.type,validTypes) < 0){
        show_share_memo_alert('Drop error', 'This file type is not supported. Please select the type of "jpg","gif","png","bmp"');
        return false;
      }

      var formData = new FormData();
      formData.append('file', file);

      $.ajax('/upload' , {
        type: 'POST',
        contentType: false,
        processData: false,
        data: formData,
        error: function() {
          show_share_memo_alert('Drop error', 'failed to file upload.');
        },
        success: function(res) {
          call_back(that, res);
        }
      });

      return false;
    }
  }

  // 共有メモエリアへの画像ドロップ処理
  var $dropzone = $(".code-out");
  $dropzone.bind("dradenter", cancelEvent);
  $dropzone.bind("dragover", cancelEvent);

  $dropzone.on('drop', drop_image_action(function(that, res){
    var share_memo_no = $(that).closest('.share-memo').data('no');

    // メモの先頭に画像を差し込む
    writing_text[share_memo_no].text = res.fileName + ' ' + DROP_IMAGE_HEIGHT + '\n' + writing_text[share_memo_no].text;

    // 変更をサーバへ通知
    var $target_code = $(that).closest('.share-memo').children('.code');
    $target_code.val(writing_text[share_memo_no].text);
    socket.emit('text',{no: share_memo_no, text: $target_code.val()});
  }));

  // チャットエリアへの画像ドロップ処理
  var $dropchatzone = $("#chat_area");
  $dropchatzone.bind("dradenter", cancelEvent);
  $dropchatzone.bind("dragover", cancelEvent);

  $dropchatzone.on('drop', drop_image_action(function(that, res){
    $('#message').val($('#message').val() + ' ' + res.fileName + ' ' + DROP_IMAGE_CHAT_HEIGHT + ' ');
  }));
}

