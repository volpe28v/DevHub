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

// for share memo
var writing_text = [];
var newest_count = 0;

$(function() {
  init_chat();
  init_sharememo();
  init_websocket();

  var css_name = $.cookie(COOKIE_CSS_NAME) || CSS_DEFAULT_NAME;
  $("#devhub-style").attr('href','/stylesheets/' + css_name );

  if ( $.cookie(COOKIE_NAME) == null ){
    setTimeout(function(){
      $('#name_in').modal("show");
      setTimeout(function(){
          $('#login_name').focus();
        },500);
      },100);
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
  $('#list').on('click', '.remove_msg', function(){
    var id = "#" + $(this).closest('li').attr('id');
    var data_id = $(this).closest('li').data('id');
    $(id).fadeOut();
    send_remove_msg(data_id);
  });
}

function init_sharememo(){
  $("#share_zen").click(function(){
    if ($("#memo_area").hasClass("span7")){
      $("#chat_area").fadeOut(function(){
        $("#memo_area").removeClass("span7");
        $("#memo_area").addClass("span11");
      });
    }else{
      $("#memo_area").removeClass("span11");
      $("#memo_area").addClass("span7");
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
      $('<div/>').addClass("btn-group").css("float","left").append(
        $('<a/>').addClass("btn dropdown-toggle index-button").attr('data-toggle',"dropdown").attr('href',"#").html('<i class="icon-align-left"></i> Index ').append(
          $('<span/>').addClass("caret"))).append(
        $('<ul/>').addClass("dropdown-menu index-list"))).append(
      $('<span/>').addClass("text-writer label label-info")).append(
      $('<span/>').addClass("update-log-notify label label-success").css("display","none").html("updated History")).append(
      $('<span/>').addClass("checkbox-count").css("display","none")).append(
      $('<textarea/>').addClass("code code-unselect").css("display","none").attr("placeholder", "Write here")).append(
      $('<pre/>').addClass("text-base-style").append($('<div/>').addClass("code-out")));
  });
}

function init_websocket(){
  var socket = io.connect('/');
  socket.on('connect', function() {
    //console.log('connect');
    socket.emit('name', {name: $.cookie(COOKIE_NAME)});
  });

  socket.on('disconnect', function(){
    //console.log('disconnect');
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
        $('#message').val($('#message').val() + " >" + name + "さん ");
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

  function switchEditShareMemo(target){
    var no = $(target).parent().data('no');
    writing_text[no] = writing_text[no] ? writing_text[no] : { text: "" };

    var $target_code = $(target).parent().children(".code");
    $target_code.val(writing_text[no].text);
    $target_code.focus();
    code_prev[no] = $target_code.val();
    $target_code.keyup(); //call autofit
  }

  $('.share-memo').on('click','.sync-text', function(){
    switchEditShareMemo(this);
  });

  $('.share-memo').on('dblclick','pre', function(){
    switchEditShareMemo(this);
  });

  // 見出し表示
  $('.share-memo').on('click','.index-button', function(){
    var $index_list = $(this).closest('.share-memo').find('.index-list');
    var $code_out = $(this).closest('.share-memo').find('.code-out');
    $index_list.empty();
    $code_out.children(":header").each(function(){
      $index_list.append($('<li/>').append($('<a/>').addClass("index-li").attr('href',"#").html($(this).text())));
    });
  });

  // 見出しへスクロール移動
  $('.share-memo').on('click','.index-li', function(){
    var index = $(this).closest(".index-list").find(".index-li").index(this);
    var $code_out = $(this).closest('.share-memo').find('.code-out');
    var pos = $code_out.children(":header").eq(index).offset().top;
    $('html,body').animate({ scrollTop: pos - 42 }, 'fast');
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

  $(".share-memo").on('focus','.code',function(){
    $(this).fadeIn();
    $(this).parent().find('.code-out').hide();
    $(this).parent().children('.fix-text').show();
    $(this).parent().children('.suspend-text').hide();
    $(this).parent().children('.sync-text').hide();
    writing_loop_start($(this).parent().data('no'));
  });
  $(".share-memo").on('blur','.code',function(){
    $(this).hide();
    $(this).parent().find('.code-out').fadeIn();
    $(this).parent().children('.fix-text').hide();
    $(this).parent().children('.suspend-text').show();
    $(this).parent().children('.sync-text').show();
    writing_loop_stop();
  });
  $(".share-memo").on('keydown','.code',function(event){
    // Ctrl - S or Ctrl - enter
    if ((event.ctrlKey == true && event.keyCode == 83) ||
        (event.ctrlKey == true && event.keyCode == 13)) {
      event.returnvalue = false;
      $(this).trigger('blur');
      writing_loop_stop();
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
      $target.children('.code').trigger('blur');
    }

    function setToTable(html){
      var table_html = "<table><tr><td>";
      table_html += html.replace(/[\n]/g,"</td></tr><tr><td>");
      return table_html += "</td></tr></table>";
    }

    // for code_out
    var $text_writer = $target.children('.text-writer');
    $text_writer.html('Writing by <span style="color: orange;">' + text_log.name + "</span> at " + text_log.date);
    $text_writer.removeClass("label-info");
    $text_writer.addClass("label-important");
    $text_writer.show();
    //$target.find('.code-out').html($.decora.to_html(text_log.text));
    $target.find('.code-out').html(setToTable($.decora.to_html(text_log.text)));

    // チェックボックスの進捗表示
    var checked_count = $target.find("input:checked").length;
    var checkbox_count = $target.find("input[type=checkbox]").length;
    if (checkbox_count > 0){
      $target.find('.checkbox-count').html(checked_count + "/" + checkbox_count + " done").show();
      if (checked_count == checkbox_count){
        $target.find('.checkbox-count').addClass('checkbox-count-done');

        $target.children('pre').addClass("text-highlight",0);
        $target.children('pre').removeClass("text-highlight", 500);
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
      $text_writer.html('Updated by <span style="color: orange;">' + text_log.name + "</span> at " + text_log.date);
      $text_writer.removeClass("label-important");
      $text_writer.addClass("label-info");
      $writer.removeClass("writing-name");
      update_timer[no] = undefined;
    },3000);
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

    $('.update-log-notify').show();
    $('.update-log-notify').fadeOut(2000,function(){ $(this).hide()});
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
    writing_loop_timer = {id: setInterval(loop, 200), code_no: no};
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
    suggest_list.push(">" + list[i].name + "さん");
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
  var socket = io.connect('/');

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
  deco_msg = deco_msg.replace(/((https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+))/g,function(){ return '<a href="' + arguments[1] + '" target="_blank" >' + arguments[1] + '</a>' });

  deco_msg = deco_msg.replace(/(SUCCESS)/, function(){ return '<span style="color: limegreen;">' + arguments[1] + '</span>'});
  deco_msg = deco_msg.replace(/(FAILURE)/, function(){ return '<span style="color: red;">' + arguments[1] + '</span>'});
  deco_msg = deco_msg.replace(/[\(（](笑|爆|喜|嬉|楽|驚|泣|涙|悲|怒|厳|辛|苦|閃|汗|忙|急|輝)[\)）]/g, function(){ return '<span class="emo">' + arguments[1] + '</span>'});

  return deco_msg;
};

function deco_login_name(msg){
  var deco_msg = msg;
  for(var i = 0; i < latest_login_list.length; ++i ){
    var name_color = 'blue';
    var name_reg = RegExp("(>|＞)[ ]*" + latest_login_list[i].name + "( |　|さん|$)", "g");
    deco_msg = deco_msg.replace( name_reg, function(){ return '><span style="color: ' + name_color + ';">' + latest_login_list[i].name + '</span>さん'});
  }
  return deco_msg;
}

function include_target_name(msg,name){
  var name_reg = RegExp("(>|＞)[ ]*" + name + "( |　|さん|$)");
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

