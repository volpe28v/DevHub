var COOKIE_NAME = "dev_hub_name";
var COOKIE_EXPIRES = 365;

function ClientViewModel(){
  var that = this;

  this.socket = io.connect('/',{query: 'from=devhub'});
  this.is_mobile = false;
  this.loginName = ko.observable($.cookie(COOKIE_NAME));
  this.loginName.subscribe(function(value){
    that.chatController.setName(value);
    that.shareMemoController.setName(value);
  });
 

  this.chatController = null;
  this.shareMemoController = null;

  this.faviconNumber = null;
  this.zenMode = false;

  this.init = function(){
    that.init_websocket();

    if ($(window).width() < 768){
      that.is_mobile = true;
    }

    that.faviconNumber = new FaviconNumber({
      focus_id: "message"
    });

    that.shareMemoController = new ShareMemoController({
      socket: that.socket,
      setMessage: function(message){
        that.chatController.setMessage(message);
      },
      zenMode: function(){
        return that.zenMode;
      }
    });

    that.chatController = new ChatController({
      socket: that.socket,
      faviconNumber: that.faviconNumber,
      changedLoginName: function(name){
        that.shareMemoController.setName(name);
        $.cookie(COOKIE_NAME,name,{ expires: COOKIE_EXPIRES });
        that.socket.emit('name',
        {
          name: name,
          avatar: window.localStorage.avatarImage
        });
      },
      showRefPoint: function(id){
        that.shareMemoController.move(id);
      }
    });

    // for smartphone
    // 本当は bootstrap-responsive のみやりたいが、perfectScrollbar の制御は
    // js側でやらないといけないので解像度で切り分ける
    if (!that.is_mobile){
      $('body').addClass("perfect-scrollbar-body-style");

      var scrollOption = {
        wheelSpeed: 1,
        useKeyboard: true,
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
      that.adjust_display_size_for_mobile();

      $(window).resize(function(){
        that.adjust_display_size_for_mobile();
      });

      $('#share_memo_nav').hide();
      $('#share_memo_tabbable').removeClass("tabs-left");
      $('#share_memo_nav').removeClass("nav-tabs");
      $('#share_memo_nav').addClass("nav-pills");
      $('#share_memo_nav').show();
    }

    //if ( $.cookie(COOKIE_NAME) == null && !that.is_mobile){
    if ( $.cookie(COOKIE_NAME) == null){
      setTimeout(function(){
        $('#name_in').modal("show");
        setTimeout(function(){
          $('#login_name').focus();
        },500);
      },500);
    }else{
      that.chatController.setName($.cookie(COOKIE_NAME));
      that.shareMemoController.setName($.cookie(COOKIE_NAME));
      that.chatController.focus();
    }

    // ナビバー消去
    $("#both_zen").click(function(){
      that.zenMode = true;
      $(".navbar").fadeOut();
      $(".dummy-top-space").fadeOut();
      $("#memo_area").trigger("scroll");
    });

    $("#memo_zen").click(function(){
      that.zenMode = true;
      $(".navbar").fadeOut();
      $(".dummy-top-space").fadeOut();
      $("#chat_area").hide();
      $("#memo_area").removeClass("span7 memo-area");
      $("#memo_area").addClass("span12 memo-area-zen");
      $("#memo_area").trigger("scroll");
    });

    $("#chat_zen").click(function(){
      that.zenMode = true;
      $(".navbar").fadeOut();
      $(".dummy-top-space").fadeOut();
      $("#memo_area").hide();
      $("#chat_area").removeClass("span5");
      $("#chat_area").addClass("span12");
      $("#memo_area").trigger("scroll");
    });

    // ショートカットキー
    $(document).on("keyup", function (e) {
      if (e.keyCode == 27){ // ESC key return fullscreen mode.
        that.zenMode = false;
        $(".navbar").fadeIn();
        $(".dummy-top-space").fadeIn();

        $("#memo_area").removeClass("span12 memo-area-zen");
        $("#memo_area").addClass("span7 memo-area");
        $("#chat_area").removeClass("span12");
        $("#chat_area").addClass("span5");

        $("#memo_area").fadeIn();
        $("#chat_area").fadeIn();
        $("#memo_area").trigger("scroll");
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
    $('a[rel=tooltip]').tooltip({
      placement : 'bottom'
    });

  }

  this.init_websocket = function(){
    that.socket.on('connect', function() {
      that.socket.emit('name',
        {
          name: $.cookie(COOKIE_NAME),
          avatar: window.localStorage.avatarImage
        });
    });

    that.socket.on('disconnect', function(){
      console.log('disconnect');
    });

    that.socket.on('set_name', function(name) {
      that.loginName(name);
    });
  }

  this.login_action = function(){
    var name = that.loginName();

    if ( name != "" ){
      $.cookie(COOKIE_NAME,name,{ expires: COOKIE_EXPIRES });
      that.socket.emit('name', {name: name});
      that.chatController.focus();
    }
    $('#name_in').modal('hide')
  }

  this.adjust_display_size_for_mobile = function(){
    // フリック用のサイズ調整
    var window_width = $(window).width();
    $('.viewport').css('width',window_width + 'px').css('overflow','hidden').css('padding',0);
    $('.flipsnap').css('width',window_width * 2 + 'px');

    that.chatController.setWidth(window_width);
    that.shareMemoController.setWidth(window_width);
    Flipsnap('.flipsnap').refresh();
  }
}

$(function() {
  var clientViewModel = new ClientViewModel();
  ko.applyBindings(clientViewModel, $('#name_in').get(0));
  clientViewModel.init();
});
