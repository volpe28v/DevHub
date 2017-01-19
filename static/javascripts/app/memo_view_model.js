var CODE_OUT_ADJUST_HEIGHT = 300;
var CODE_INDEX_ADJUST_HEIGHT = 40;
var CODE_OUT_ADJUST_HEIGHT_BY_CONTROL = 90;
var CONTROL_FIXED_TOP = 40;
var CONTROL_FIXED_ZEN_TOP = 0;
var EMPTY_TITLE = "- Empty -";


global.jQuery = require('jquery');
global.$ = global.jQuery;
require('jquery-ui');
require('textarea-helper');
var moment = require('moment');

var ko = require('knockout');
ko.mapping = require('knockout.mapping');
require('../libs/knockout.devhub_custom')(ko);

require('../libs/jquery.selection.js');

var difflib = require('../libs/difflib');
var diffview = require('../libs/diffview');

var CalendarViewModel = require('./calendar_view_model');

function DisplayState(parent){
  this.parent = parent;

  this.enter = function(){
    parent.showText();
  }

  this.updateText = function(new_text){
    if (parent.setText(new_text) == false){ return; };
    parent.showText();
  }

  this.setIndex = function(no){
    parent._updateIndexPos(no);
  }

  this.insertText = function(row,text){
    parent._insertToLatestText(row,text);
  }

  this.exit = function(){}
}

function EditState(parent){
  this.parent = parent;

  this.enter = function(){
    parent.setEditText();
    parent._updateIndexPos(-1);
  }

  this.updateText = function(new_text){
    parent.setText(new_text);

    // 編集中の共有メモに他ユーザの変更が来たら編集終了
    if( parent.getName() != new_text.name ){
      var $target = $('#share_memo_' + parent.no);
      parent.switchFixShareMemo($target.children('.code').caretLine());
    }
  }

  this.setIndex = function(no){}

  this.insertText = function(row,text){
    parent._insertToEditText(row,text);
  }

  this.exit = function(){
    parent._add_history();
  }
}

function HideState(parent){
  this.parent = parent;

  this.enter = function(){
    parent.is_shown_move_to_blog(false);
    parent.currentWip = 0;
  }

  this.updateText = function(new_text){
    parent.setText(new_text);
  }

  this.setIndex = function(no){}
  this.insertText = function(row,text){}
  this.exit = function(){}
}

function DiffState(parent){
  this.parent = parent;

  this.enter = function(){
    parent.setDisplayControl();
  }

  this.updateText = function(new_text){
    parent.setText(new_text);
  }

  this.setIndex = function(no){}
  this.insertText = function(row,text){}
  this.exit = function(){
    parent.endDiff();
  }
}

function SearchState(parent){
  this.parent = parent;

  this.enter = function(){
    parent.showText();
  }

  this.updateText = function(new_text){
    parent.setText(new_text);
  }

  this.setIndex = function(no){
    parent._updateIndexPos(no);
  }

  this.insertText = function(row,text){}

  this.exit = function(next){
    // 遷移先が Dispay Edit Diff なら検索終了
    if (next == parent.states.display ||
        next == parent.states.edit    ||
        next == parent.states.diff       ){
      parent.notifyEndSearch();
    }
  }
}


function MemoViewModel(param){
  this.no = param.no;
  this.socket = param.socket;
  this.settingViewModel = param.settingViewModel;
  this.getName = param.getName; //function
  this.notifyEndSearch = param.endSearch; //function
  this.active = param.active;

  this.latest_text = ko.observable({text: "", name: "" , date: undefined});
  this.display_text = ko.observable("");
  this.edit_text = ko.observable("");
  this.delayed_text = ko.pureComputed(this.edit_text)
    .extend({ rateLimit: { method: "notifyWhenChangesStop", timeout: 500 } });

  this.delayed_text.subscribe(function (val) {
    that._updateTextAndHistory();
  }, this);

  this._updateTextAndHistory = function(){
    // 最新メモと差分があれば送信する
    if (that.edit_text() == that.latest_text().text){ return; }

    that.socket.emit('text',{
      no: that.no,
      name: that.getName(),
      avatar: that.settingViewModel.avatar(),
      text: that.edit_text()
    });
  }

  this._add_history = function(){
    that.socket.emit('add_history',{no: that.no});
  }

  this.is_memo_empty = ko.pureComputed(function(){
    return this.latest_text().text == "";
  }, this);

  this.show_empty_alert = ko.pureComputed(function(){
    return this.is_memo_empty() && (this.current_state() == this.states.display);
  },this);

  this.show_title = ko.pureComputed(function(){
    if (this.current_state() == this.states.display ||
        this.current_state() == this.states.edit    ||
        this.current_state() == this.states.diff){
      return true;
    }else{
      return false;
    }
  },this);

  this.states = {
    display: new DisplayState(this),
    edit: new EditState(this),
    hide: new HideState(this),
    diff: new DiffState(this),
    search: new SearchState(this),
  }

  this.set_state = function(next){
    var before = that.current_state();
    that.current_state().exit(next);
    that.current_state(next);
    that.current_state().enter(before);
  }

  this.text_logs = [];
  this.title = ko.observable(EMPTY_TITLE);
  this.bytes = ko.observable("");
  this.hasWip = ko.observable(false);
  this.wipCount = ko.observable(0);
  this.currentWip = 0;
  this.update_timer = ko.observable(null);
  this.writer = ko.observable("");
  this.is_shown_move_to_blog = ko.observable(false);
  this.is_existed_update = true;

  this.checkbox_count = ko.observable(0);
  this.checked_count = ko.observable(0);

  this.indexes = ko.observableArray([]);
  this.diffTitles = ko.observableArray([]);
  this.diff_mode = false;
  this.diff_block_list = [];
  this.diff_index = 0;

  this.currentIndexNo = -1;

  this.calendarViewModel = new CalendarViewModel({
    selectEventHandler: function(index_no){
      that.switchFixShareMemo(1);

      var $code_out = $('#share_memo_' + that.no).find('.code-out');
      var pos = $code_out.find(":header").eq(index_no-1).offset().top - $('#share-memo').offset().top;
      $('#memo_area').scrollTop(pos - CODE_INDEX_ADJUST_HEIGHT);
    },
    editEventHandler: function(){
      that.do_edit();
    },
    addEventHandler: function(title){
      that.switchEditShareMemo(-1);

      var $code = $('#share_memo_' + that.no).find('.code');
      var row = $code.caretLine();
      that.insert(row -1 , "#### " + title);
      $code.caretLine(row);
    }
  });
  this.calendarViewModel.init();

  var that = this;

  this.init = function(){
    // 初期状態
    if (this.active){
      this.current_state = ko.observable(this.states.display);
      this.setDisplayControl();
    }else{
      this.current_state = ko.observable(this.states.hide);
    }

    this.initSocket();
  }

  this.initSocket = function(){
    that.socket.on('text' + this.no, function(text_log) {
      that.current_state().updateText(text_log);
    });

    that.socket.on('text_logs' + this.no, function(data){
      if (Array.isArray(data)){
        that.text_logs = data;
      }else{
        that.text_logs.unshift(data);
        if (that.text_logs.length > 20){
          that.text_logs.pop();
        }
      }
    });
  }

  this._title = function(text){
    if (that.is_memo_empty()){ return EMPTY_TITLE; }

    var text_lines = text.split('\n');
    var title = "";
    for (var i = 0; i < text_lines.length; i++){
      var line = text_lines[i];
      if (line.match(/(\S+)/)){
        title = text_lines[i];
        break;
      }
    };

    // マークダウンの記号を外した文字列をタイトルとする
    title = $('<div/>').html($.decora.to_html(title)).text();
    if ($.trim(title) == 'undefined' || !title.match(/\S/g)){
      title = EMPTY_TITLE;
    }
    return title;
  }

  this.setText = function(text_body){
    // メモのハッシュ値が変更あれば更新する
    if (text_body.hash != undefined && this.latest_text().hash == text_body.hash){ return false; }

    this.is_existed_update = true;
    text_body.date_name = text_body.date + " - " + text_body.name;
    this.latest_text(text_body);
    this.writer(this.latest_text().name);
    this.title(this._title(this.latest_text().text));
    this.bytes(this.latest_text().text.length + "bytes");
    this.hasWip(this.latest_text().text.match(/\[WIP\]/));
    this.wipCount((this.latest_text().text.match(/\[WIP\]/g) || []).length);
    this.currentWip = 0;
    this._updateIndexes();

    if (this.update_timer()){
      clearTimeout(this.update_timer());
    }
    this.update_timer(setTimeout(function(){
      that.update_timer(null);
    },3000));

    return true;
  }

  this.setEditText = function(){
    this.edit_text(this.latest_text().text);
  }

  this.wipJump = function(){
    that.switchFixShareMemo(1);

    that.currentWip = that.wipCount() <= that.currentWip ? 1 : that.currentWip + 1;
    var $code_out = $('#share_memo_' + that.no).find('.code-out');
    var pos = $($code_out.find("tr:contains('[WIP]')")[that.currentWip - 1]).offset().top - $('#share-memo').offset().top;
    $('#memo_area').scrollTop(pos - CODE_INDEX_ADJUST_HEIGHT + 1);
    return true;
  }

  this.switchFixShareMemo = function(row, offset){
    that.set_state(that.states.display);
    that.setDisplayControl();
    that.setDisplayPos(row, offset);
  }

  this.setDisplayPos = function(row, offset){
    var $share_memo = $('#share_memo_' + this.no);

    offset = offset == undefined ? $(window).height()/3 : offset - 14;

    // 閲覧モード時に編集していたキャレット位置を表示する
    var $target_tr = $share_memo.find('.code-out-tr').eq(row - 1);
    if ($target_tr.length > 0){
      $('#memo_area').scrollTop(0);
      $('#memo_area').scrollTop($target_tr.offset().top - offset);
    }
  }

  this.setDisplayControl = function(){
    var $share_memo = $('#share_memo_' + this.no);
    // 見栄えを閲覧モードへ
    $share_memo.children('.code').hide();
    $share_memo.children('pre').show();
    $share_memo.find('.fix-text').hide();
    $share_memo.find('.sync-text').show();

    $('#share_memo_index_' + that.no).show();
    $('#share_memo_calendar_' + that.no).show();
    that.calendarViewModel.show();
    that.is_shown_move_to_blog(false);
  }

  this.unsetDisplayControl = function(){
    $('#share_memo_index_' + that.no).hide();
    $('#share_memo_calendar_' + that.no).hide();
  }

  this.switchEditShareMemo = function(row, offset){
    this.set_state(this.states.edit);

    var $share_memo = $('#share_memo_' + this.no);

    offset = offset == undefined ? $(window).height()/3 : offset - 104;
    var $target_code = $share_memo.children(".code");

    $target_code.show();
    $target_code.keyup(); //for autofit

    // 編集モード時に選択した行位置を表示する
    if (row >= 0){
      $target_code.caretLine(row);
    }else{
      // キャレット位置指定なしの場合は前回の場所を復元
      row = $target_code.caretLine();
    }
    var line_height = Number($share_memo.find('.code').css('line-height').replace('px',''));
    $('#memo_area').scrollTop(row * line_height + ($share_memo.offset().top - $('#share-memo').offset().top) - offset);
    $target_code.focus();

    $share_memo.children('pre').hide();
    $share_memo.find('.fix-text').show();
    $share_memo.find('.sync-text').hide();
  }

  this._getFocusFromInputTask = function(){
    var $focus_dom = $(':focus');
    if ($focus_dom && $focus_dom.hasClass('input-task')){
      var $target = $('#share_memo_' + that.no);
      return $target.find('.code-out-tr').index($focus_dom.closest('tr'));
    }
    return -1;
  },

  this._setFocusToInputTask = function($target, focus_index){
    focus_index++;
    if (focus_index >= 0){
      var $focus_dom = $target.find('.code-out').find('.code-out-tr:eq(' + focus_index + ')').find('.input-task');
      if ($focus_dom){
        $focus_dom.focus();
      }
    }
  }

  this.IsIncludeKeyword = function(reg){
    return that.latest_text().text.match(reg);
  }

  this.showText = function(){
    // メモに更新があれば実行
    if (!this.is_existed_update){
      return;
    }
    this.is_existed_update = false;


    var $target = $('#share_memo_' + this.no);
    var $code_out = $target.find('.code-out');

    var focus_index = this._getFocusFromInputTask();

    that.display_text(that.latest_text().text);

    this._setFocusToInputTask($target, focus_index);

    // チェックボックスの進捗表示
    that.checked_count($code_out.find("input:checked").length);
    that.checkbox_count($code_out.find("input[type=checkbox]").length);
  }

  this.startMemoMoving = function(ui){
    var $target = $('#share_memo_' + this.no);
    var row = $target.find('.code-out-tr').index(ui.item);
    that.drag_index = row;
  }

  this.stopMemoMoving = function(ui){
    var $target = $('#share_memo_' + this.no);
    var drag_stop_index = $target.find('.code-out-tr').index(ui.item);
    if (drag_stop_index == that.drag_index){ return; }

    var text_array = that.latest_text().text.split("\n");
    text_array.splice(drag_stop_index, 0, text_array.splice(that.drag_index,1));
    that.latest_text().text = text_array.join("\n");
    that.socket.emit('text',{
      no: that.no,
      name: that.getName(),
      avatar: that.settingViewModel.avatar(),
      text: that.latest_text().text});
  }

  this.keydownInputTask = function(data, event, element){
    if ( event.keyCode != 13) { return true; }

    var input_text = $(element).val();
    if (input_text == ""){ return false; }

    var $target = $('#share_memo_' + this.no);
    var $this_tr = $(element).closest('tr');
    var input_index = $target.find('.code-out-tr').index($this_tr);

    $(element).val("");

    var text_array = that.latest_text().text.split("\n");
    text_array.splice(input_index, 0, "=[ ] " + input_text);
    that.latest_text().text = text_array.join("\n");
    that.socket.emit('text',{
      no: that.no,
      name: that.getName(),
      avatar: that.settingViewModel.avatar(),
      text: that.latest_text().text});

    return false;
  }

  this.deleteTask = function(data, event, element){
    var $target = $('#share_memo_' + this.no);
    var $this_tr = $(element).closest('tr');
    delete_index = $target.find('.code-out-tr').index($this_tr);

    $this_tr.fadeOut('normal', function(){
      $(this).remove();

      var text_array = that.latest_text().text.split("\n");
      text_array.splice(delete_index, 1);
      that.latest_text().text = text_array.join("\n");
      that.socket.emit('text',{
        no: that.no,
        name: that.getName(),
        avatar: that.settingViewModel.avatar(),
        text: that.latest_text().text});
    });
  }

  this.insert = function(row, text){
    that.current_state().insertText(row,text);
  }

  this._insertToLatestText = function(row, text){
    var org_text = this.latest_text();
    var text_array = org_text.text.split("\n");
    text_array.splice(row,0,text);
    that.edit_text(text_array.join("\n"));
  }

  this._insertToEditText = function(row, text){
    var org_text = this.edit_text();
    var text_array = org_text.split("\n");
    text_array.splice(row,0,text);
    that.edit_text(text_array.join("\n"));
  }

  this.select = function(){
    this.switchFixShareMemo(1);
    this.settingViewModel.selectedMemoNo(this.no);
  }

  this.unselect = function(){
    this.set_state(this.states.hide);
    this.unsetDisplayControl();
  }

  this.displaySpecificRow = function(data, event, element){
    that.switchFixShareMemo($(element).caretLine(), event.pageY);
  }

  this.keydownOnCodeArea = function(data, event, element){
    // Ctrl - S or Ctrl - enter
    if ((event.ctrlKey == true && event.keyCode == 83) ||
        (event.ctrlKey == true && event.keyCode == 13)) {
      event.returnvalue = false;
      that._updateTextAndHistory();
      var caret_top = $(element).textareaHelper('caretPos').top + $(element).offset().top;
      that.switchFixShareMemo($(element).caretLine(), caret_top);
      return false;
    }else{
      that._adjustBlogUI();
      return true;
    }
  }

  this.keyupOnCodeArea = function(data, event, element){
    that._adjustBlogUI();
    return true;
  }

  this.clickOnCodeArea = function(data, event, element){
    that._adjustBlogUI();
    return true;
  }

  this._adjustBlogUI = function(){
    if (!that.is_shown_move_to_blog()){ return; }

    var $target_code = $('#share_memo_' + this.no).children('.code');
    if ($target_code.selection('get') == ""){
      that.is_shown_move_to_blog(false);
    }
  }

  this.selectText = function(data, event, element){
    that.showMoveToBlogButton($(element), that.getName());
  }

  this.beginSearch = function(){
    this.set_state(this.states.search);
    this.setDisplayControl();
    this.settingViewModel.selectedMemoNo(this.no);
  }

  this.endSearch = function(){
    this.set_state(this.states.display);
  }

  this.showIndexList = function(){
    $('#index_inner').fadeIn();
  }

  this.showCalendar = function(){
    $('#calendar_inner').fadeIn();
    that.calendarViewModel.show();
  }

  this.setCurrentIndex = function(no){
    this.current_state().setIndex(no);
  }

  this._updateIndexPos = function(no){
    if (that.currentIndexNo == no){ return; }

    this.currentIndexNo = no;
    var $index_lists = $('#share_memo_index_' + that.no).find('li');
    $index_lists.removeClass('current-index');
    if (no != -1){
      $index_lists.eq(no).addClass('current-index');
    }
  }

  this._updateIndexes = function(){
    var $index_list = $('#share_memo_index_' + this.no);

    that.indexes([]);
    var events = [];
    var index_num = 0;
    $.decora.apply_to_deco_and_raw(this.latest_text().text,
      function(deco_text){
        // 装飾ありの場合は目次候補
        deco_text.split("\n").forEach(function(val){
          var matches = val.match(/^(#+)/);
          if (matches){
            index_num++;
            var header_level = matches[1].length;
            var header_text = val;

            that.indexes.push(
              {
                index_class: "header-level-" + header_level,
                body: $.decora.to_html(header_text)
              });

            events.push({id: index_num, body: header_text});
          }
        });
      },
      function(raw_text){
        // 装飾なしは目次対象外
      });

    that.calendarViewModel.setEvents(events);
  }

  this._getLogsForDiff = function(){
    var out_logs = this.text_logs;
    if (this.latest_text().date != out_logs[0].date){
      out_logs.unshift(this.latest_text());
    }

    return out_logs;
  }

  this.editMemo = function(data, event, element){
    // 文字列が無い場合は最下部にキャレットを設定する
    var row = $(element).find(".code-out-tr").length - 1;
    that.switchEditShareMemo(row, event.pageY);
  }

  this.editSpecificRow = function(data, event, element){
    // クリック時の行数を取得してキャレットに設定する
    var row = $(element).closest("table").find(".code-out-tr").index(element);
    that.switchEditShareMemo(row, event.pageY);

    return false;
  }

  this.showDiffList = function(){
    var $share_memo = $('#share_memo_' + this.no);
    var text_log = this._getLogsForDiff();

    this.diffTitles([]);
    var current_date = moment();
    for (var i = 1; i < text_log.length; i++){
      var diff_date = moment(text_log[i].date);
      var diff_class = "diff-li";
      if (current_date.format("YYYY-MM-DD") == diff_date.format("YYYY-MM-DD")){
        diff_class += " today-diff-list";
      }
      this.diffTitles.push({title: text_log[i].date + " - " + text_log[i].name, diff_class: diff_class});
    }
  }

  this.fill_diff_list = function(element){
    var diff_li_array = $(element).closest(".diff-list").find(".diff-li");
    var index = diff_li_array.index(element);
    diff_li_array.each(function(i, li){
      if (i < index){
        $(li).addClass("in_diff_range");
      }else if(i > index){
        $(li).removeClass("in_diff_range");
      }
    });
  }

  this.unfill_diff_list = function(element){
    var diff_li_array = $(element).closest(".diff-list").find(".diff-li");
    diff_li_array.each(function(i, li){
      $(li).removeClass("in_diff_range");
    });
  }

  this.show_diff = function(element){
    that.set_state(that.states.diff);

    var $share_memo = $(element).closest('.share-memo');
    var $code_out = $share_memo.find('.code-out');
    var share_memo_no = $share_memo.data('no');
    var index = $(element).closest(".diff-list").find(".diff-li").index(element);

    // diff 生成
    var $diff_out = $share_memo.find('.diff-view');
    $diff_out.empty();
    that.createDiff(index, function(diff){
      $diff_out.append(diff);
      $diff_out.showDecora();

      // diff 画面を有効化
      $diff_out.show();
      $code_out.hide();

      $share_memo.find('.diff-done').show();
      $share_memo.find('.sync-text').hide();

      if (that.diff_block_list.length > 0){
        $('#diff_controller').fadeIn();
      }

      // 一つ目のDiffに移動
      var pos = that.getNextDiffPos();
      $('#memo_area').scrollTop(pos - $share_memo.offset().top - $(window).height()/2);
    });

    return true;
  }

  this.createDiff = function(index, callback){
    index++; // 0番目はリストに表示しないので 1番目の履歴は 0で来る
    var text_log = this._getLogsForDiff();

    // メモ本文をサーバから取得する
    $.ajax('memo/body' , {
      type: 'GET',
      cache: false,
      data: {id: text_log[index]._id},
      success: function(data){
        var baseHtml = $.decora.to_html(data.text);
        var newHtml = $.decora.to_html(that.latest_text().text);

        // 差分には現れて欲しくない文字列を削除
        baseHtml = baseHtml.replace(/data-no="\d+"/g,"");
        newHtml = newHtml.replace(/data-no="\d+"/g,"");

        var base   = difflib.stringAsLines(baseHtml);
        var newtxt = difflib.stringAsLines(newHtml);
        var sm = new difflib.SequenceMatcher(base, newtxt);
        var opcodes = sm.get_opcodes();

        var diff_body = diffview.buildView({
          baseTextLines: base,
            newTextLines: newtxt,
            opcodes: opcodes,
            baseTextName: text_log[0].date + ' - ' + text_log[0].name,
            newTextName: text_log[index].date + " - " + text_log[index].name,
            viewType: 1
        });

        that.diff_index = 0;
        that.diff_mode = true;
        that._createDiffBlockList(diff_body);

        $('#move_to_diff .btn').html('<i class="icon-arrow-down icon-white"></i> Next Diff 0/' + that.diff_block_list.length);
        callback(diff_body);
      }
    });
  }

  this._createDiffBlockList = function(diff_body){
    // 差分グループを生成
    var diff_list = $(diff_body).find(".insert,.delete");
    this.diff_block_list = [];
    if (diff_list.length > 0){
      var $diff_table = $(diff_body).closest("table");
      this.diff_block_list.push($(diff_list[0]));

      for (var i = 0; i < diff_list.length; i++){
        var $current_diff_td = $(diff_list[i]);
        var pre_index = $diff_table.find("tr").index($current_diff_td.closest("tr"));

        while(1){
          if (++i >= diff_list.length){ break; }
          var $next_diff_td = $(diff_list[i]);

          var next_index = $diff_table.find("tr").index($next_diff_td.closest("tr"));
          if (next_index - pre_index != 1){
            this.diff_block_list.push($(diff_list[i]));
            break;
          }
          pre_index = next_index;
        }
      }
    }
  }

  this.getNextDiffPos = function(){
    var pos = this.diff_block_list[this.diff_index].offset().top;
    if (++this.diff_index >= this.diff_block_list.length){ this.diff_index = 0; }

    // ボタンの文字列変更
    if (this.diff_index == 0){
      $('#move_to_diff .btn').html('<i class="icon-arrow-up icon-white"></i> Next Diff ' + this.diff_block_list.length + '/' + this.diff_block_list.length);
    }else{
      $('#move_to_diff .btn').html('<i class="icon-arrow-down icon-white"></i> Next Diff ' + this.diff_index + '/' + this.diff_block_list.length);
    }
    return pos;
  }

  this.endDiff = function(){
    var $share_memo = $("#share_memo_" + this.no);
    $share_memo.find('.code-out').show();
    $share_memo.find('.diff-view').hide();

    $share_memo.find('.diff-done').hide();
    $share_memo.find('.sync-text').show();

    $('#diff_controller').fadeOut();

    this.diff_index = 0;
    this.diff_mode = false;
    this.diff_block_list = [];
  }

  this.applyToWritingText = function(func){
    this.latest_text().text = func(this.latest_text().text);
    that.socket.emit('text',{
      no: this.no,
      name: this.getName(),
      avatar: that.settingViewModel.avatar(),
      text: this.latest_text().text});
  },

  this.showMoveToBlogButton = function($selected_target, login_name){
    var $target_code = $('#share_memo_' + that.no).children('.code');
    var selected_text = $target_code.selection('get');
    if (selected_text == ""){ return; }

    this.is_shown_move_to_blog(true);
  }

  this.moveToBlog = function(){
    that.is_shown_move_to_blog(false);

    var $target_code = $('#share_memo_' + that.no).children('.code');
    var selected_text = $target_code.selection('get');
    if (selected_text == ""){ return; }

    var before_pos = $('#share-memo').offset().top * -1;
    if ($(".navbar").is(':visible')){
      before_pos += 40;
    }

    var item = {
      title: that._title(selected_text),
      text: selected_text,
      name: that.getName(),
      avatar: that.settingViewModel.avatar()
    };

    $.ajax('blog' , {
      type: 'POST',
      cache: false,
      data: {blog: item},
      success: function(data){
        var permalink = "[" + data.blog.title + "](blog?id=" + data.blog._id + ")\n";
        $target_code.selection('replace', {
          text: permalink,
          caret: 'start'
        });
        $('#memo_area').scrollTop(before_pos);

        that.edit_text($target_code.val());
      }
    });
  }

  this.do_diff_list = function(){
    that.set_state(that.states.display);
    that.setDisplayControl();
    that.showDiffList();
  }

  this.do_edit = function(){
    // 表示しているメモの先頭にカーソルを当てて編集状態へ
    var pos = $("#memo_area").scrollTop();
    var offset = $('#share-memo').offset().top;
    var $code_out = $('#share_memo_' + that.no).find('.code-out');
    var $code_out_lines = $code_out.find(".code-out-tr");
    var row = 0;
    for (var i = $code_out_lines.length - 1; i >= 0; i--){
      if ($code_out_lines.eq(i).offset().top - offset - CODE_INDEX_ADJUST_HEIGHT < pos){
        row = i;
        break;
      }
    }

    that.switchEditShareMemo(row, CODE_OUT_ADJUST_HEIGHT_BY_CONTROL);
  }

  this.do_fix =  function(element){
    var $code = $('#share_memo_' + that.no).find('.code');
    that.switchFixShareMemo($code.caretLine(), CODE_OUT_ADJUST_HEIGHT_BY_CONTROL);
  }

  this.done_diff = function(){
    that.switchFixShareMemo(1);
    $('#memo_area').scrollTop(0);
  }

  this.init();
}

module.exports = MemoViewModel;
