var SHARE_MEMO_NUMBER = 30;
var CODE_OUT_ADJUST_HEIGHT = 300;
var CODE_INDEX_ADJUST_HEIGHT = 40;
var CODE_OUT_ADJUST_HEIGHT_BY_CONTROL = 90;
var CONTROL_FIXED_TOP = 40;
var CONTROL_FIXED_ZEN_TOP = 0;

global.jQuery = require('jquery');
global.$ = global.jQuery;
require('jquery-ui');

var ko = require('knockout');
ko.mapping = require('knockout.mapping');
require('../libs/knockout.devhub_custom')(ko);

var MemoViewModel = require('./memo_view_model');

function MemoController(param){
  var that = this;

  this.socket = param.socket;
  this.setMessage = param.setMessage;
  this.zenMode = param.zenMode;

  this.memo_number = ko.observable(1);

  this.doing_up = false;
  this.doing_down = false;

  this.memoViewModels = ko.observableArray([]);
  this.currentMemoNo = window.localStorage.tabSelectedNo ? window.localStorage.tabSelectedNo : 1;
  this.isMovingTab = false;
  this.control_offset_base = 0;

  // searchBox
  this.keyword = ko.observable('');
  // 検索キーワードのインクリメンタルサーチ
  this.delayed_keyword = ko.pureComputed(this.keyword)
    .extend({ rateLimit: { method: "notifyWhenChangesStop", timeout: 500 } });
  this.delayed_keyword.subscribe(function(value){
    that.search();
  }, this);

  this.keyword.subscribe(function(value){
    if (value != ''){
      $("#search_clear").show();
    }else{
      $("#search_clear").hide();
      that.do_search_clear();
    }
  },this);

  this.before_keyword = "";
  this.matched_doms = [];

  this.matched_navi_visible = ko.observable(false);
  this.matched_index = ko.observable(0);
  this.matched_num = ko.observable(0);
  this.matched_title = ko.observable("");

  this.currentMemo = function(){
    return that.memoViewModels()[that.currentMemoNo-1];
  }

  this.select_memo_tab = function(data){
    if (that.isMovingTab){ return true; }

    // タブ選択のIDを記憶する
    var memoViewModel = this;

    window.localStorage.tabSelectedNo = memoViewModel.no;

    that.currentMemo().unselect();
    that.currentMemoNo = memoViewModel.no;
    if (that.keyword() == ""){
      that.currentMemo().select();
    }else{
      // 検索中
      that.currentMemo().beginSearch();
    }

    $('#memo_area').scrollTop(0);
    that.adjustMemoControllbox();

    return true;
  }

  this.setName = function(name){
    this.login_name = name;
  }

  this.getName = function(){
    return this.login_name;
  }

  this.setWidth = function(width){
    $('#memo_area').css('width',width + 'px').css('margin',0);
  }

  this.setFocus = function(){
    var data_no = that.currentMemo().no;
    var targetMemo = this.memoViewModels()[data_no-1];
    if (targetMemo.edit_mode){
      $('#share_memo_' + data_no).find(".code").focus();
    }else{
      var $share_memo = $('#share_memo_' + data_no);
      targetMemo.switchEditShareMemo(-1);
    }
  }

  this.top = function(){
    $('#memo_area').scrollTop(0);
    that.adjustMemoControllbox();
  }

  this.down = function(){
    if (!this.doing_down){
      $('#memo_area').scrollTop($('#memo_area').scrollTop() + 400);
      that.doing_down = false;
    }
  }

  this.up = function(){
    if (!this.doing_up){
      $('#memo_area').scrollTop($('#memo_area').scrollTop() - 400);
      that.doing_up = false;
    }
  }

  this.prev = function(){
    var data_no = that.currentMemo().no;
    data_no -= 1;
    if (data_no <= 0){
      data_no = this.memo_number();
    }
    $("#share_memo_tab_" + data_no).click();
  }

  this.next = function(){
    var data_no = that.currentMemo().no;
    data_no += 1;
    if (data_no > this.memo_number()){
      data_no = 1;
    }
    $("#share_memo_tab_" + data_no).click();
  }

  this.move = function(id){
    var no = id.split("-")[0];
    $("#share_memo_tab_" + no).click();

    // 移動したタブ名を見せたいのでタイムラグを入れる
    setTimeout(function(){
      var pos = $("#share_memo_" + no).find("#" + id).offset().top - $('#share-memo').offset().top;
      $('#memo_area').scrollTop(pos - CODE_INDEX_ADJUST_HEIGHT - 16);
    },700);
  }

  this.search = function(){
    var keyword = that.keyword();
    if (keyword == ""){
      that.before_keyword = keyword;
      $(".matched_strong_line").removeClass("matched_strong_line");
      $(".matched_line").removeClass("matched_line");

      that.matched_num(0);
      that.matched_index(0);
      that.matched_navi_visible(false);
    }else if(that.before_keyword != keyword){
      $(".matched_strong_line").removeClass("matched_strong_line");
      $(".matched_line").removeClass("matched_line");

      // 検索前に一旦最新の表示に更新する
      that.memoViewModels().forEach(function(vm){
        that.currentMemo() == vm ? vm.beginSearch() : vm.showText();
      });

      that.before_keyword = keyword;
      that.matched_doms = [];
      var reg_keyword = new RegExp(keyword,"i");
      $(".code-out").each(function(){
        var matched_doms = $(this).find("td").map(function(){
          if ($(this).text().match(reg_keyword)){
            $(this).addClass("matched_line");
            return this;
          }else{
            return null;
          }
        });
        Array.prototype.push.apply(that.matched_doms, matched_doms);
      });

      that.matched_num(that.matched_doms.length);
      that.matched_index(0);
      that.matched_navi_visible(true);
      that.matched_title("");
      if (that.matched_num() > 0){
        that.matched_next();
      }
    }else{
      if (that.matched_num() > 0){
        that.matched_next();
      }
    }
  }

  this.matched_next = function(){
    var index = this.matched_index() + 1;
    if (index > this.matched_num()){ index = 1; }
    this._matched_move(index);
  }

  this.matched_prev = function(){
    var index = this.matched_index() - 1;
    if (index < 1){ index = this.matched_num(); }
    this._matched_move(index);
  }

  this._matched_move = function(next_index){
    var $prev_target = $(this.matched_doms[this.matched_index() - 1]);
    this.matched_index(next_index);
    var $next_target = $(this.matched_doms[this.matched_index() - 1]);

    $prev_target.removeClass("matched_strong_line").addClass("matched_line");
    $next_target.removeClass("matched_line").addClass("matched_strong_line");

    var no = $next_target.closest(".share-memo").data("no");

    $("#share_memo_tab_" + no).click();

    that.matched_title(that.currentMemo().title());

    var pos = $next_target.offset().top;
    $('#memo_area').scrollTop(pos - $("#share-memo").offset().top - $(window).height()/2);
  }

  this.do_search = function(){
    that.search();
    return false;
  }

  this.do_search_clear = function(){
    that.currentMemo().endSearch();
    $('#memo_area').scrollTop(0);
  }

  this.end_search_control = function(){
    that.keyword("");
    that.search();
  }

  this.adjustMemoControllbox = function(){
    var pos = $("#memo_area").scrollTop();
    var offset = $('#share-memo').offset().top;

    // for control
    var $control = $('#share_memo_' + that.currentMemo().no).find('.memo-control');
    var $dummy = $('#share_memo_' + that.currentMemo().no).find('.memo-control-dummy');
    var fixed_top = that.zenMode() ? CONTROL_FIXED_ZEN_TOP : CONTROL_FIXED_TOP;

    if (!$control.hasClass('fixed')){
      var control_offset = $control.offset();
      if (control_offset == null){ return; } // 初回表示時は調整しない
      var control_offset_base_tmp = control_offset.top - offset;
      if (control_offset_base_tmp < 0){ return; } // 初回表示時は調整しない
      that.control_offset_base = control_offset_base_tmp;
    }

    if ( that.control_offset_base < pos){
      $control.addClass('fixed');
      $control.css("top", fixed_top);
      $dummy.height($control.outerHeight()).show();
    }else{
      $control.removeClass('fixed');
      $dummy.hide();
    }

    // for index cursor
    var $code_out = $('#share_memo_' + that.currentMemo().no).find('.code-out');
    var headers = $code_out.find(":header");
    for (var i = headers.length - 1; i >= 0; i--){
      if (i == 0){
        if (headers.eq(i).offset().top - offset - CODE_INDEX_ADJUST_HEIGHT - 10 >= pos){
          that.currentMemo().setCurrentIndex(-1);
          break;
        }
      }

      if (headers.eq(i).offset().top - offset - CODE_INDEX_ADJUST_HEIGHT - 10 < pos){
        that.currentMemo().setCurrentIndex(i);
        break;
      }
    }
  }

  this.wip_jump = function(){
    that.currentMemo().switchFixShareMemo(1);

    var $code_out = $('#share_memo_' + that.currentMemo().no).find('.code-out');
    var pos = $($code_out.find("tr:contains('[WIP]')")[0]).offset().top - $('#share-memo').offset().top;
    $('#memo_area').scrollTop(pos - CODE_INDEX_ADJUST_HEIGHT + 1);
    return true;
  }

  this.set_ref_point = function(element){
    if ($('#chat_inner').is(':visible')){
      var id = $(element).attr("id");
      that.setMessage("[ref:" + id + "]");
    }else{
      // 無理やりチャットを表示しているがなんとかしたい
      $('#chat_area').scrollTop(0);
      $('#index_inner').hide();
      $('#calendar_inner').hide();
      $('#chat_inner').show();

      setTimeout(function(){
        var id = $(element).attr("id");
        that.setMessage("[ref:" + id + "]");
      },500);
    }
  }

  this.select_index_li = function(data, event, element){
    that.currentMemo().switchFixShareMemo(1);

    var index = $(element).closest(".index-ul").find(".index-li").index(element);
    var $code_out = $('#share_memo_' + that.currentMemo().no).find('.code-out');
    var pos = $code_out.find(":header").eq(index).offset().top - $('#share-memo').offset().top;
    $('#memo_area').scrollTop(pos - CODE_INDEX_ADJUST_HEIGHT);
    return false;
  }

  this.move_diff = function(){
    var pos = that.currentMemo().getNextDiffPos();
    $('#memo_area').scrollTop(pos - $("#share-memo").offset().top - $(window).height()/2);
  }

  this.done_diff = function(){
    that.currentMemo().switchFixShareMemo(1);
    $('#memo_area').scrollTop(0);
  }

  this.change_memo_number = function(){
    that.socket.emit('memo_number', {num: that.memo_number()});
  }

  this.showIndex = function(){
    $('#chat_inner').hide();
    $('#calendar_inner').hide();
    $('#chat_area').scrollTop(0);
    that.currentMemo().showIndexList();
  }

  this.showCalendar = function(){
    $('#chat_area').scrollTop(0);
    $('#chat_inner').hide();
    $('#index_inner').hide();
    that.currentMemo().showCalendar();
  }

  this.init_sharememo = function(){
    for (var i = 1; i <= SHARE_MEMO_NUMBER; i++){
      this.memoViewModels.push(new MemoViewModel({
        no: i,
        active: i == that.currentMemoNo,
        socket: that.socket,
        getName: function() { return that.getName(); },
        endSearch: that.end_search_control
      }));
    }

    $("#share_memo_nav").sortable({
      items: ".share-memo-tab",
      placeholder: 'draggable-placeholder',
      revert: true,
      tolerance: "pointer",
      distance: 20,
      forcePlaceholderSize: true,
      scroll: false,
      start: function(event,ui){
        that.isMovingTab = true;
      },
      stop: function(event,ui){
        that.isMovingTab = false;

        var memo_tabs = $(this).sortable('toArray');
        var tab_numbers = memo_tabs.map(function(m){ return m.replace('share_memo_li_',''); });

        that.socket.emit('memo_tab_numbers', {numbers: tab_numbers});
      }
    });

    $("#tab_change").click(function(){
      if ($('#share_memo_tabbable').hasClass("tabs-left")){
        $('#share_memo_nav').fadeOut("fast",function(){
          $('#share_memo_tabbable').removeClass("tabs-left");
          $('#share_memo_nav').removeClass("nav-tabs");
          $('#share_memo_nav').addClass("nav-pills");
          $('#share_memo_nav').fadeIn();
        });
        window.localStorage.tabChanged = 'true';
      }else{
        $('#share_memo_nav').fadeOut("fast",function(){
          $('#share_memo_tabbable').addClass("tabs-left");
          $('#share_memo_nav').removeClass("nav-pills");
          $('#share_memo_nav').addClass("nav-tabs");
          $('#share_memo_nav').fadeIn();
        });
        window.localStorage.tabChanged = 'false';
      }
    });

    $('#memo_area').scroll(function(){
      that.adjustMemoControllbox();
    });

    // 前回の状態を復元する
    // タブスタイル
    if ( window.localStorage.tabChanged != 'false' ){
      $('#share_memo_nav').hide();
      $('#share_memo_tabbable').removeClass("tabs-left");
      $('#share_memo_nav').removeClass("nav-tabs");
      $('#share_memo_nav').addClass("nav-pills");
      $('#share_memo_nav').show();
    }

    $("body").on('keydown',function(event){
      // F2で共有メモの編集状態へ
      if (event.keyCode == 113){
        that.setFocus();
        return false;
      }
    });

    function apply_memo_number(num){
      if (that.memo_number() != num){
        that.memo_number(num);
      }

      $('.share-memo-tab-elem').each(function(i){
        if ( i < that.memo_number()){
          $(this).fadeIn("fast");
          $(this).css("display", "block");
        }else{
          $(this).hide();
        }
      });
    }

    that.socket.on('memo_number', function(data){
      apply_memo_number(data.num);
    });

    that.socket.on('memo_tab_numbers', function(data){
      if (data == null){ return; }

      data.numbers.forEach(function(num){
        $('#share_memo_nav').append($('#share_memo_li_' + num));
      });

      apply_memo_number(that.memo_number());
    });
  }

  this.init_sharememo();
}

module.exports = MemoController;
