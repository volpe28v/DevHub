var latest_login_list = [];
var login_name = '';
var suggest_obj = undefined;
var LOGIN_COLOR_MAX = 9;
var COOKIE_NAME = "dev_hub_name";
var COOKIE_CSS_NAME = "dev_hub_css_name";
var COOKIE_EXPIRES = 365;
var CSS_DEFAULT_NAME = "bootstrap.min.css";
var TITLE_ORG = document.title;
var CODE_NUM = 3

// for share memo
var writing_text = [];
var newest_count = 0;

$(function() {
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
      socket.emit('message', {name:name,msg:message});
      $('#message').attr('value', '');
    }
    return false;
  });

  $('.share-memo').delegate('.sync-text','click', function(){
    var no = $(this).parent().data('no');
    writing_text[no] = writing_text[no] == undefined ? { text: "" } : writing_text[no];

    $(this).parent().children(".code").val(writing_text[no].text);
    $(this).parent().children(".code").focus();
  });

  $('#suspend_text').click(function(){
    code_prev = writing_text.text;
    socket.emit('suspend_text');
    $('#code').val("");
    $('#code').focus();
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

  $(".share-memo").delegate('.code','focus',function(){
    $(this).fadeIn();
    $(this).parent().children('.code-out').hide();
    $(this).parent().children('.fix-text').show();
    $(this).parent().children('.suspend-text').hide();
    $(this).parent().children('.sync-text').hide();
  });
  $(".share-memo").delegate('.code','blur',function(){
    $(this).hide();
    $(this).parent().children('.code-out').fadeIn();
    $(this).parent().children('.fix-text').hide();
    $(this).parent().children('.suspend-text').show();
    $(this).parent().children('.sync-text').show();
  });

  var update_timer = [];
  // for share memo
  socket.on('text', function(text_log) {
    writing_text[text_log.no] = text_log;
    var text_body = decorate_text(text_log.text);
    var $target = $('#share_memo_' + text_log.no);

    // for code_out
    $target.children('.text-writer').html('Writing by <span style="color: orange;">' + text_log.name + "</span> at " + text_log.date);
    $target.children('.text-writer').removeClass("label-info");
    $target.children('.text-writer').addClass("label-important");
    $target.children('.text-writer').show();
    $target.children('.code-out').html(text_body);
    $('#share_memo_tab_' + text_log.no).children('span').addClass("label label-important");
    $('#share_memo_tab_' + text_log.no).children('span').html(text_log.name);

    if (update_timer[text_log.no]){
      clearTimeout(update_timer[text_log.no]);
    }
    update_timer[text_log.no] = setTimeout(function(){
      $target.children('.text-writer').html('Updated by <span style="color: orange;">' + text_log.name + "</span> at " + text_log.date);
      $target.children('.text-writer').removeClass("label-important");
      $target.children('.text-writer').addClass("label-info");
      $('#share_memo_tab_' + text_log.no).children('span').removeClass("label label-important");
      $('#share_memo_tab_' + text_log.no).children('span').html("");
      update_timer[text_log.no] = undefined;
    },3000);

    // for current_log
    var log_dl = $("<dl/>");
    var log_dt = $("<dt/>");
    var label_span = $("<span/>").addClass("label label-info").html(text_log.name + " at " + text_log.date);
    var log_dd = $("<dd/>");
    var log_pre = $("<pre/>").html(text_body)

    log_dt.append(label_span);
    log_dd.append(log_pre);
    log_dl.append(log_dt).append(log_dd);

    $('#current_log').empty();
    $('#current_log').append(log_dl);
  });

  socket.on('text_logs', function(text_logs){
    var logs_dl = $("<dl/>")
    for ( var i = 0; i < text_logs.length; ++i){
      var text_log_id = "text_log_id_" + text_logs[i]._id.toString();
      var text_body = decorate_text(text_logs[i].text);

      var log_div = $("<div/>").attr("id", text_log_id)
      var log_dt = $("<dt/>")
      var writer_label = $("<span/>").addClass("label").text( text_logs[i].name + " at " + text_logs[i].date )
      var icon = $("<i/>").addClass("icon-repeat")
      var restore_btn = $('<button class="btn btn-mini restore_button"><i class="icon-share-alt"></i> Restore</button>').click(function(){
        var restore_text = text_logs[i].text;
        return function(){
          code_prev = writing_text.text;
          $('#code').val(restore_text)
          $('#share-memo-tab').click()
          $('html,body').animate({ scrollTop: 0 }, 'slow');
        }
      }())

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
          $('#' + target_dom_id).fadeOut()
          socket.emit('remove_text', target_log_id);
          return false;
        }
      }())

      var log_dd = $("<dd/>")
      var log_pre = $("<pre/>").html(text_body)

      log_dt.append(writer_label).append(restore_btn).append(favo_star).append(remove_btn)
      log_dd.append(log_pre)
      log_div.append(log_dt).append(log_dd)
      logs_dl.append(log_div)
    }
    $('#history_logs').empty();
    $('#history_logs').append(logs_dl);

    $('#update_log_notify').show();
    $('#update_log_notify').fadeOut(2000,function(){ $(this).hide()});

  });

  socket.on('favo_logs', function(favo_logs){
    var logs_dl = $("<dl/>")
    for ( var i = 0; i < favo_logs.length; ++i){
      var text_log_id = "favo_log_id_" + favo_logs[i]._id.toString();
      var text_body = decorate_text(favo_logs[i].text);

      var log_div = $("<div/>").attr("id", text_log_id)
      var log_dt = $("<dt/>")
      var writer_label = $("<span/>").addClass("label").addClass("label-warning").text( favo_logs[i].name + " at " + favo_logs[i].date )
      var icon = $("<i/>").addClass("icon-repeat")
      var restore_btn = $('<button class="btn btn-mini restore_button"><i class="icon-share-alt"></i> Restore</button>').click(function(){
        var restore_text = favo_logs[i].text;
        return function(){
          code_prev = writing_text.text;
          $('#code').val(restore_text)
          $('#share-memo-tab').click()
          $('html,body').animate({ scrollTop: 0 }, 'slow');
        }
      }())

      var remove_btn = $('<a href="#" class="remove_text">x</a>').click(function(){
        var target_dom_id = text_log_id
        var target_log_id = favo_logs[i]._id.toString();
        return function(){
          $('#' + target_dom_id).fadeOut()
          socket.emit('remove_favo_text', target_log_id);
          return false;
        }
      }())

      var log_dd = $("<dd/>")
      var log_pre = $("<pre/>").html(text_body)

      log_dt.append(writer_label).append(restore_btn).append(remove_btn)
      log_dd.append(log_pre)
      log_div.append(log_dt).append(log_dd)
      logs_dl.append(log_div)
    }

    $('#favo_logs').empty();
    $('#favo_logs').append(logs_dl);
  });

  var code_prev = [];
  var i = 1;
  $('.code').each(function(){
    code_prev[i++] = $(this).val();
  });
  var loop = function() {
    var i = 1;
    $('.code').each(function(){
      var code = $(this).val();
      var code_out = writing_text[i] ? writing_text[i].text : "";
      if (code_prev[i] != code && code_out != code) {
        socket.emit('text',{no: i, text: code});
        code_prev[i] = code;
      }
      i++;
    });
    setTimeout(loop, 300);
  };
  loop();
};

function decorate_text( text ){
  text = decorate_link_tag( text );
  return text;
}

function decorate_link_tag( text ){
  var linked_text = text.replace(/((https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+))/g,
      function(){
        var matched_link = arguments[1];
        if ( matched_link.match(/(\.jpg|\.gif|\.png|\.bmp)$/)){
          return '<img src="' + matched_link + '"/>';
        }else{
          return '<a href="' + matched_link + '" target="_blank" >' + matched_link + '</a>';
        }
      });
  return linked_text;
}

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

  var msg_li = get_msg_html(data);

  $('#list').append(msg_li);
  msg_li.fadeIn();
};

function prepend_own_msg(data){
  if (exist_msg(data)){ return };
  var msg_li = get_own_msg_html(data);
  var msg_id = '#msg_' + data._id.toString();

  $('#list').prepend(msg_li);
  $(msg_id + ' .remove_msg').click(function(){
    $(msg_id).fadeOut();
    send_remove_msg(data._id.toString());
  });
  msg_li.fadeIn();
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

  var msg_li = get_msg_html(data);

  $('#list').prepend(msg_li);
  msg_li.fadeIn();
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
  var id = '#msg_' + data._id.toString();
  return $(id).size() > 0;
}

function get_own_msg_html(data){
  return get_msg_li_html(data).addClass("own_msg").html(get_msg_body(data) + ' <span class="own_msg_date">(' + data.date + ')</span><a class="remove_msg" href="#">x</a></td></tr></table>');
}

function get_msg_html(data){
  if (include_target_name(data.msg,login_name)){
    return get_msg_li_html(data).addClass("target_msg").html(get_msg_body(data) + ' <span class="target_msg_date">(' + data.date + ')</span></td></tr></table>');
  }else if ( data.name == login_name ){
    return get_msg_li_html(data).addClass("own_msg").html(get_msg_body(data) + ' <span class="own_msg_date">(' + data.date + ')</span></td></tr></table>');
  }else{
    return get_msg_li_html(data).html(get_msg_body(data) + ' <span class="date">(' + data.date + ')</span></td></tr></table>');
  }
}

function get_msg_li_html(data){
  if ( data._id != undefined ){
    return $('<li/>').attr('style','display:none').attr('id','msg_' + data._id.toString());
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

  return '<table><tr><td nowrap valign="top"><span class="login-name-base ' + name_class + '">' + data.name + '</span></td><td><span class="msg_text ' + msg_class + '">' + decorate_msg(data.msg) + '</span>';
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

