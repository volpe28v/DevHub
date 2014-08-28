var COOKIE_NAME = "dev_hub_name";
var COOKIE_STYLE_NAME = "dev_hub_style_name";
var COOKIE_EXPIRES = 365;
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

// Controllers
var chatController = null;
var shareMemoController = null;

// for favicon
var faviconNumber = null;

$(function() {
  init_websocket();

  if ($(window).width() < 768){
    is_mobile = true;
  }

  faviconNumber = new FaviconNumber({
    focus_id: "message"
  });

  shareMemoController = new ShareMemoController({
    socket: socket,
    setMessage: function(message){
      chatController.setMessage(message);
    }
  });

  chatController = new ChatController({
    socket: socket,
    faviconNumber: faviconNumber,
    changedLoginName: function(name){
      shareMemoController.setName(name);
      $.cookie(COOKIE_NAME,name,{ expires: COOKIE_EXPIRES });
    },
    showRefPoint: function(id){
      shareMemoController.move(id);
    }
  });

  // for smartphone
  // 本当は bootstrap-responsive のみやりたいが、perfectScrollbar の制御は
  // js側でやらないといけないので解像度で切り分ける
  if (!is_mobile){
    $('body').addClass("perfect-scrollbar-body-style");

    var scrollOption = {
      wheelSpeed: 40,
      useKeyboard: false,
      suppressScrollX: true
    };

    $('#chat_area').addClass("perfect-scrollbar-style");
    $('#chat_area').perfectScrollbar(scrollOption);
    $('#memo_area').addClass("perfect-scrollbar-style");
    $('#memo_area').perfectScrollbar(scrollOption);
  }else{
    // モバイルの場合はフリックイベントでチャットとメモを切り替える
    $('.hidden-phone').remove();
    $('.visible-phone').show();
    $('.text-date').remove();
    $('.checkbox-count').remove();

    // フリック用のサイズ調整
    adjust_display_size_for_mobile();

    $(window).resize(function(){
      adjust_display_size_for_mobile();
    });

    $('#share_memo_nav').hide();
    $('#share_memo_tabbable').removeClass("tabs-left");
    $('#share_memo_nav').removeClass("nav-tabs");
    $('#share_memo_nav').addClass("nav-pills");
    $('#share_memo_nav').show();
  }

//  var style_name = $.cookie(COOKIE_STYLE_NAME) || DEFAULT_STYLE_NAME;
//  change_style(style_name);

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
    chatController.setName($.cookie(COOKIE_NAME));
    chatController.focus();
  }

  $(window).on("blur focus", function(e) {
    faviconNumber.off();
  });

  // ナビバー消去
  $("#both_zen").click(function(){
    $(".navbar").fadeOut();
    $(".dummy-top-space").fadeOut();
  });

  $("#memo_zen").click(function(){
    $(".navbar").fadeOut();
    $(".dummy-top-space").fadeOut();
    $("#chat_area").hide();
    $("#memo_area").removeClass("span7 memo-area");
    $("#memo_area").addClass("span12 memo-area-zen");
  });

  $("#chat_zen").click(function(){
    $(".navbar").fadeOut();
    $(".dummy-top-space").fadeOut();
    $("#memo_area").hide();
    $("#chat_area").removeClass("span5");
    $("#chat_area").addClass("span12");
  });

  // ショートカットキー
  $(document).on("keyup", function (e) {
    if (e.keyCode == 27){ // ESC key return fullscreen mode.
      $(".navbar").fadeIn();
      $(".dummy-top-space").fadeIn();

      $("#memo_area").removeClass("span12 memo-area-zen");
      $("#memo_area").addClass("span7 memo-area");
      $("#chat_area").removeClass("span12");
      $("#chat_area").addClass("span5");

      $("#memo_area").fadeIn();
      $("#chat_area").fadeIn();
    } else if (e.ctrlKey && e.ctrlKey == true ){
      /*
      if (e.keyCode == 73){ // Ctrl - i : focus chat form
        $('#message').focus();
      } else if (e.keyCode == 77){ // Ctrl - m : focus current memo form
        shareMemoController.setFocus();
      } else if (e.keyCode == 72){ // Ctrl - h: select prev share memo
        shareMemoController.prev();
      } else if (e.keyCode == 76){ // Ctrl - l: select next share memo
        shareMemoController.next();
      } else if (e.keyCode == 48){ // Ctrl - 0: move top share memo
        shareMemoController.top();
      } else if (e.keyCode == 74){ // Ctrl - j: move down share memo
        shareMemoController.down();
      } else if (e.keyCode == 75){ // Ctrl - j: move down share memo
        shareMemoController.up();
      }
      */
    }
  });
});

function adjust_display_size_for_mobile(){
    // フリック用のサイズ調整
    var window_width = $(window).width();
    $('.viewport').css('width',window_width + 'px').css('overflow','hidden').css('padding',0);
    $('.flipsnap').css('width',window_width * 2 + 'px');

    chatController.setWidth(window_width);
    shareMemoController.setWidth(window_width);
    Flipsnap('.flipsnap').refresh();
}

function init_websocket(){
  socket.on('connect', function() {
    //console.log('connect');
    socket.emit('name',
      {
        name: $.cookie(COOKIE_NAME),
        avatar: window.localStorage.avatarImage
      });
  });

  socket.on('disconnect', function(){
    //console.log('disconnect');
  });

  socket.on('set_name', function(name) {
    chatController.setName(name);
    $('#login_name').val(name);
  });

  var login_action = function(){
    var name = $('#login_name').val();
    if ( name != "" ){
      $.cookie(COOKIE_NAME,name,{ expires: COOKIE_EXPIRES });
      socket.emit('name', {name: name});
      chatController.setName(name);
      chatController.focus();
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

