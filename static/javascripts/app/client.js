global.jQuery = require('jquery');
global.$ = global.jQuery;
global.moment = require('moment');
require('../libs/moment.lang_ja');
require('jquery-ui');
require('bootstrap');

require('jquery-colorbox');
require('jquery.cookie');
require('../libs/livestamp');

var Flipsnap = require('flipsnap');
var emojify = require('emojify.js');
require('perfect-scrollbar/jquery')($);
var socket = require('socket.io-client')('/', {query: 'from=devhub'});

var ko = require('knockout');
ko.mapping = require('knockout.mapping');
require('../libs/knockout.devhub_custom')(ko);

require('../libs/jquery.autosize');
var FaviconNumber = require('../libs/favicon-number');
var DropZone = require('../libs/dropzone');

// ViewModels
var SettingViewModel = require('./setting_view_model');
var MemoController = require('./memo_controller');
var ChatController = require('./chat_controller');

function ClientViewModel(){
  var that = this;

  this.socket = socket;
  this.is_mobile = false;

  this.faviconNumber = new FaviconNumber();

  this.settingViewModel = new SettingViewModel({
    socket: that.socket
  });

  this.memoController = new MemoController({
    socket: that.socket,
    setMessage: function(message){
      that.chatController.setMessage(message);
    },
    zenMode: function(){
      return that.zenMode;
    }
  });

  this.chatController = new ChatController({
    socket: that.socket,
    faviconNumber: that.faviconNumber,
    showRefPoint: function(id){
      that.memoController.move(id);
    },
    doNotification: that.settingViewModel.doNotification,
    settingViewModel: that.settingViewModel
  });

  this.settingViewModel.loginName.subscribe(function(value){
    that.chatController.setName(value);
    that.memoController.setName(value);
  });


  this.zenMode = false;

  this.init = function(){
    that.init_websocket();
    that.settingViewModel.init();
    init_display();
  }

  var init_display = function(){
    if ($(window).width() < 768){
      that.is_mobile = true;
    }

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

    if ( that.settingViewModel.loginName() == null){
      setTimeout(function(){
        $('#name_in').modal("show");
        setTimeout(function(){
          $('#login_name').focus();
        },500);
      },500);
    }else{
      that.chatController.setName(that.settingViewModel.loginName());
      that.memoController.setName(that.settingViewModel.loginName());
      that.chatController.focus();
    }

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
           memoController.setFocus();
           } else if (e.keyCode == 72){ // Ctrl - h: select prev share memo
           memoController.prev();
           } else if (e.keyCode == 76){ // Ctrl - l: select next share memo
           memoController.next();
           } else if (e.keyCode == 48){ // Ctrl - 0: move top share memo
           memoController.top();
           } else if (e.keyCode == 74){ // Ctrl - j: move down share memo
           memoController.down();
           } else if (e.keyCode == 75){ // Ctrl - j: move down share memo
           memoController.up();
           }
           */
      }
    });

    $('a[rel=tooltip]').tooltip({
      placement : 'bottom'
    });

    $('#settings_modal').modal({
      backdrop: true,
      show: false
    });
  }

  this.init_websocket = function(){
    that.socket.on('connect', function() {
      that.settingViewModel.set_avatar();
    });

    that.socket.on('disconnect', function(){
      console.log('disconnect');
    });

    that.socket.on('set_name', function(name) {
      that.settingViewModel.loginName(name);
    });
  }

  this.showChat = function(){
    $('#chat_area').scrollTop(0);
    $('#index_inner').hide();
    $('#calendar_inner').hide();
    $('#chat_inner').fadeIn(function(){
      $('#message').trigger('autosize.resize').focus();
    });
  }

  this.fullscreen_both = function(){
    this.zenMode = true;
    $(".navbar").fadeOut();
    $(".dummy-top-space").fadeOut();
    $("#memo_area").trigger("scroll");
  }

  this.fullscreen_memo = function(){
    this.zenMode = true;
    $(".navbar").fadeOut();
    $(".dummy-top-space").fadeOut();
    $("#chat_area").hide();
    $("#memo_area").removeClass("span7 memo-area");
    $("#memo_area").addClass("span12 memo-area-zen");
    $("#memo_area").trigger("scroll");
  }

  this.fullscreen_chat = function(){
    this.zenMode = true;
    $(".navbar").fadeOut();
    $(".dummy-top-space").fadeOut();
    $("#memo_area").hide();
    $("#chat_area").removeClass("span5");
    $("#chat_area").addClass("span12");
    $("#memo_area").trigger("scroll");
  }

  this.showSetting = function(){
    $('#settings_modal').modal('show');
  }

  this.adjust_display_size_for_mobile = function(){
    // フリック用のサイズ調整
    var window_width = $(window).width();
    $('.viewport').css('width',window_width + 'px').css('overflow','hidden').css('padding',0);
    $('.flipsnap').css('width',window_width * 2 + 'px');

    that.chatController.setWidth(window_width);
    that.memoController.setWidth(window_width);
    Flipsnap('.flipsnap').refresh();
  }
}

$(function() {
  var clientViewModel = new ClientViewModel();
  ko.applyBindings(clientViewModel);
  clientViewModel.init();
});
