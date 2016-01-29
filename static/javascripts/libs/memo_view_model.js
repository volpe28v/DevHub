function DisplayState(parent){
  this.parent = parent;

  this.enter = function(){
    console.log("DisplayState Enter " + parent.no);

    parent.showText();
  }

  this.updateText = function(new_text){
    if (parent.setText(new_text) == false){ return; };
    parent.showText();
  }

  this.exit = function(){

  }
}

function EditState(parent){
  this.parent = parent;

  this.enter = function(){
    console.log("EditState Enter " + parent.no);

    parent.setEditText();
  }

  this.updateText = function(new_text){
    parent.setText(new_text);

    // 編集中の共有メモに他ユーザの変更が来たら編集終了
    if( parent.getName() != new_text.name ){
      var $target = $('#share_memo_' + parent.no);
      parent.switchFixShareMemo($target.children('.code').caretLine());
    }
  }

  this.exit = function(){
    parent.is_save_history = true;
  }
}

function HideState(parent){
  this.parent = parent;

  this.enter = function(){
    console.log("HideState Enter " + parent.no);

  }

  this.updateText = function(new_text){
    parent.setText(new_text);

  }

  this.exit = function(){

  }
}

function DiffState(parent){
  this.parent = parent;

  this.enter = function(){
    console.log("DiffState Enter " + parent.no);
  }

  this.updateText = function(new_text){
    parent.setText(new_text);
  }

  this.exit = function(){
    parent.endDiff();
  }
}

function SearchState(parent){
  this.parent = parent;

  this.enter = function(){
    console.log("SearchState Enter " + parent.no);

  }

  this.updateText = function(new_text){
    parent.setText(new_text);

  }

  this.exit = function(){

  }
}


function MemoViewModel(param){
  this.no = param.no;
  this.socket = param.socket;
  this.getName = param.getName; //function
  this.writing_text = ko.observable({text: "", name: "" , date: undefined});
  this.display_text = ko.observable("");
  this.edit_text = ko.observable("");
  this.delayed_text = ko.pureComputed(this.edit_text).extend({ rateLimit: { method: "notifyWhenChangesStop", timeout: 500 } });
  var is_first = true;
  this.is_save_history = false;
  this.delayed_text.subscribe(function (val) {
    console.log("change stop!");
    if (is_first){ is_first = false; return; }
    console.log("change update!");

    that.socket.emit('text',{
      no: that.no,
      name: that.getName(),
      avatar: window.localStorage.avatarImage,
      text: that.edit_text()
    });

    if (that.is_save_history){
      socket.emit('add_history',{no: that.no});
      that.is_save_history = false;
    }

    // Blogへ移動ボタンの表示状態を制御
    var $target_code = $('#share_memo_' + this.no).children('.code');
    if (that.is_shown_move_to_blog){
      if ($target_code.selection('get') == ""){
        $("#move_to_blog").fadeOut();
        that.is_shown_move_to_blog = false;
      }
    }

  }, this);

  this.states = {
    display: new DisplayState(this),
    edit: new EditState(this),
    hide: new HideState(this),
    diff: new DiffState(this),
    search: new SearchState(this),
  }

  this.current_state = this.states.hide;

  this.set_state = function(next){
    that.current_state.exit();
    that.current_state = next;
    that.current_state.enter();
  }

  this.text_logs = [];
  this.title = ko.observable("- No." + this.no + " -");
  this.bytes = ko.observable("");
  this.update_timer = null;
  this.code_prev = "";
  this.writing_loop_timer = { id: -1, code_no: 0};
  this.writer = ko.observable("");
  this.is_shown_move_to_blog = false;
  this.is_existed_update = true;

  this.indexes = []; //binding
  this.diffTitles = ko.observableArray([]); //binding
  this.diff_mode = false;
  this.diff_block_list = [];
  this.diff_index = 0;

  this.currentIndexNo = -1;

  var that = this;
  this.initSocket = function(){
    socket.on('text' + this.no, function(text_log) {
      that.current_state.updateText(text_log);
    });

    socket.on('text_logs' + this.no, function(data){
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
    var text_lines = text.split('\n');
    var title = "";
    for (var i = 0; i < text_lines.length; i++){
      var line = text_lines[i];
      var matched = line.match(/(\S+)/);
      if (matched){
        title = text_lines[i];
        break;
      }
    };

    title = $('<div/>').html($.decora.to_html(title)).text();
    if (!title.match(/\S/g)){
      title = " - No." + this.no + " - ";
    }
    return title;
  }

  this.setText = function(text_body){
    // メモのハッシュ値が変更あれば更新する
    if (text_body.hash != undefined && this.writing_text().hash == text_body.hash){ return false; }

    this.is_existed_update = true;
    this.writing_text(text_body);
    this.writer(this.writing_text().name);
    this.title(this._title(this.writing_text().text));
    this.bytes(this.writing_text().text.length + "bytes");

    // バインドだけで実現できない画面処理
    var $target_tab = $('#share_memo_tab_' + this.no);
    var $tab_title = $target_tab.children('.share-memo-title');
    emojify.run($tab_title.get(0));

    var $writer = $target_tab.children('.writer');
    $writer.addClass("writing-name");

    var $timestamp = $target_tab.find('.timestamp');
    $timestamp.attr("data-livestamp", this.writing_text().date);

    var $target = $('#share_memo_' + this.no);
    var $text_date = $target.find('.text-date');
    var date_name = this.writing_text().date + " - " + this.writing_text().name;
    $text_date.html(date_name);
    $text_date.addClass("writing-name");
    $text_date.show();

    var is_blank = this.writing_text().text == "";
    if (is_blank){
      $writer.hide();
      $timestamp.hide();
    }else{
      $writer.show();
      $timestamp.show();
    }

    if (this.update_timer){
      clearTimeout(this.update_timer);
    }
    this.update_timer = setTimeout(function(){
      $text_date.removeClass("writing-name");
      $writer.removeClass("writing-name");
      that.update_timer = null;
    },3000);

    return true;
  }

  this.setEditText = function(){
    this.edit_text(this.writing_text().text);
  }

  this.switchFixShareMemo = function(row, offset){
    this.set_state(this.states.display);

    var $share_memo = $('#share_memo_' + this.no);
    this.edit_mode = false;

    offset = offset == undefined ? $(window).height()/3 : offset - 14;
    if ($share_memo.children('.code').css('display') == "none"){ return; }

    // 見栄えを閲覧モードへ
    $share_memo.children('.code').hide();
    $share_memo.children('pre').show();
    $share_memo.find('.fix-text').hide();
    $share_memo.find('.sync-text').show();

    // 閲覧モード時に編集していたキャレット位置を表示する
    var $target_tr = $share_memo.find('table tr').eq(row - 1);
    if ($target_tr.length > 0){
      $('#memo_area').scrollTop(0);
      $('#memo_area').scrollTop($target_tr.offset().top - offset);
    }

    $("#move_to_blog").fadeOut();
  }

  this.writingLoopStop = function(){
    clearInterval(this.writing_loop_timer.id);
    this.writing_loop_timer = { id: -1, code_no: 0};
  }

  this.switchEditShareMemo = function(row, offset){
    this.set_state(this.states.edit);

    var $share_memo = $('#share_memo_' + this.no);
    this.setCurrentIndex(-1);
    this.edit_mode = true;

    offset = offset == undefined ? $(window).height()/3 : offset - 94;
    var $target_code = $share_memo.children(".code");

    $target_code.show();
    $target_code.keyup(); //call autofit
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

    this.code_prev = $target_code.val();
    //this.writingLoopStart();
  }

  this.writingLoopStart = function(){
    $target_code = $('#share_memo_' + this.no).children('.code');
    var loop = function() {
      var code = $target_code.val();
      if (that.code_prev != code) {
        that.socket.emit('text',{
          no: that.no,
          name: that.getName(),
          avatar: window.localStorage.avatarImage,
          text: code});
        that.code_prev = code;
      }

      // Blogへ移動ボタンの表示状態を制御
      if (that.is_shown_move_to_blog){
        if ($target_code.selection('get') == ""){
          $("#move_to_blog").fadeOut();
          that.is_shown_move_to_blog = false;
        }
      }
    };
    // 念のためタイマー止めとく
    if (this.writing_loop_timer.id != -1){
      this.writingLoopStop();
    }
    this.writing_loop_timer = {id: setInterval(loop, 500), code_no: this.no};
  }

  this._getFocusFromInputTask = function(){
    var $focus_dom = $(':focus');
    if ($focus_dom && $focus_dom.hasClass('input-task')){
      return $focus_dom.closest('tr').index();
    }
    return -1;
  },

  this._setFocusToInputTask = function($target, focus_index){
    if (focus_index >= 0){
      var $focus_dom = $target.find('.code-out').find('tr:eq(' + focus_index + ')').find('.input-task');
      if ($focus_dom){
        $focus_dom.focus();
      }
    }
  }

  this.showText = function(){
    // メモに更新があれば実行
    if (!this.is_existed_update){
      console.log("no update");
      return;
    }
    this.is_existed_update = false;

    that.display_text(that.writing_text().text);

    var $target = $('#share_memo_' + this.no);
    var focus_index = this._getFocusFromInputTask();
    var $code_out = $target.find('.code-out');

    this._updateIndexes();

    // WIPの表示
    var $wip_jump = $target.find('.wip-jump');
    if (this.writing_text().text.match(/\[WIP\]/)){
      $wip_jump.show();
    }else{
      $wip_jump.hide();
    }

    $code_out.off('keydown');
    $code_out.off('click');

    if (this.writing_text().text == ""){
      // テキストが空なのでメッセージを表示する
      $code_out.prepend($('<div/>').addClass('memo-alert alert alert-info').
        html('This is a real-time shared memo area.<br>You can edit this by Press "Edit" Button or double click here.'));
    }

    $target.find('.code-out').sortable({
      items: "tr:has(.checkbox-draggable),tr:has(.text-draggable)",
      distance: 6,
      start: function(event,ui){
        that.drag_index = ui.item.index();
      },
      stop: function(event,ui){
        var drag_stop_index = ui.item.index();
        if (drag_stop_index == that.drag_index){ return; }

        var text_array = that.writing_text().text.split("\n");
        text_array.splice(drag_stop_index, 0, text_array.splice(that.drag_index,1));
        that.writing_text().text = text_array.join("\n");
        that.socket.emit('text',{
          no: that.no,
          name: that.getName(),
          avatar: window.localStorage.avatarImage,
          text: that.writing_text().text});
      },
      helper: function(e, tr){
        var $originals = tr.children();
        var $helper = tr.clone();
        $helper.children().each(function(index)
        {
          $(this).width($originals.eq(index).width());
        });
        return $helper;
      },
      placeholder: 'draggable-placeholder',
      revert: true,
      axis: "y",
      scroll: true
    });

    $target.find('.code-out').on('click','.delete-task', function(e){
      var $this_tr = $(this).closest('tr');
      var delete_index = $this_tr.index();

      $this_tr.fadeOut('normal', function(){
        $(this).remove();

        var text_array = that.writing_text().text.split("\n");
        text_array.splice(delete_index, 1);
        that.writing_text().text = text_array.join("\n");
        that.socket.emit('text',{
          no: that.no,
          name: that.getName(),
          avatar: window.localStorage.avatarImage,
          text: that.writing_text().text});
      });
    });

    $target.find('.code-out').on('keydown', '.input-task', function(event){
      if ( event.keyCode != 13) { return true; }

      var $this_tr = $(this).closest('tr');
      var input_index = $this_tr.index();
      var input_text = $(this).val();
      $(this).val("");

      var text_array = that.writing_text().text.split("\n");
      text_array.splice(input_index + 1, 0, "=[ ] " + input_text);
      that.writing_text().text = text_array.join("\n");
      that.socket.emit('text',{
        no: that.no,
        name: that.getName(),
        avatar: window.localStorage.avatarImage,
        text: that.writing_text().text});

      return false;
    });

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

    this._setFocusToInputTask($target, focus_index);
  }

  this.insert = function(row, text){
    var org_text = this.writing_text();
    var text_array = org_text.text.split("\n");
    text_array.splice(row,0,text);
    org_text.text = text_array.join("\n");

    this.writing_text(org_text);

    if (this.edit_mode){
      var $target_code = $('#share_memo_' + this.no).children('.code');
    }else{
      this.socket.emit('text',{
        no: this.no,
        name: this.getName(),
        avatar: window.localStorage.avatarImage,
        text: this.writing_text().text});
    }
  }

  this.select = function(){
    this.switchFixShareMemo(1);
  }

  this.unselect = function(){
    this.set_state(this.states.hide);
  }

  this.showIndexList = function(){
    $('#index_inner').slideToggle('fast');
  }

  this.setCurrentIndex = function(no){
    if (this.currentIndexNo == no){ return; }
    if (this.edit_mode){ return; }

    this.currentIndexNo = no;
    var $index_lists = $('#share_memo_index_' + this.no).find('li');
    $index_lists.removeClass('current-index');
    if (no != -1){
      $index_lists.eq(no).addClass('current-index');
    }
  }

  this._updateIndexes = function(){
    var $index_list = $('#share_memo_index_' + this.no);

    $.observable(that.indexes).remove(0, that.indexes.length);
    $.decora.apply_to_deco_and_raw(this.writing_text().text,
      function(deco_text){
        // 装飾ありの場合は目次候補
        deco_text.split("\n").forEach(function(val){
          var matches = val.match(/^(#+)/);
          if (matches){
            var header_level = matches[1].length;
            var header_text = val.replace(/^#+/g,"");

            $.observable(that.indexes).insert(
              {
                class: "header-level-" + header_level,
                body: $.decora.to_html(header_text)
              });
          }
        });
      },
      function(raw_text){
        // 装飾なしは目次対象外
      });

    var $indexes = $index_list.find(".index-li");
    $indexes.each(function(){
      emojify.run($(this).get(0));
    });
  }

  this._getLogsForDiff = function(){
    var out_logs = this.text_logs;
    if (this.writing_text().date != out_logs[0].date){
      out_logs.unshift(this.writing_text());
    }

    return out_logs;
  }

  this.edit_memo = function(element, event){
    // 文字列が無い場合は最下部にキャレットを設定する
    var row = $(element).find("table tr").length - 1;
    that.switchEditShareMemo(row, event.pageY);
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
    $diff_out.append(that.createDiff(index));
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

    return true;
  }
 
  this.createDiff = function(index){
    index++; // 0番目はリストに表示しないので 1番目の履歴は 0で来る
    var text_log = this._getLogsForDiff();
    var baseHtml = $.decora.to_html(text_log[index].text);
    var newHtml = $.decora.to_html(text_log[0].text);

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

    this.diff_index = 0;
    this.diff_mode = true;
    this._createDiffBlockList(diff_body);

    $('#move_to_diff .btn').html('<i class="icon-arrow-down icon-white"></i> Next Diff 0/' + this.diff_block_list.length);
    return diff_body;
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
    this.writing_text().text = func(this.writing_text().text);
    this.socket.emit('text',{
      no: this.no,
      name: this.getName(),
      avatar: window.localStorage.avatarImage,
      text: this.writing_text().text});
  },

  this.showMoveToBlogButton = function($selected_target, login_name){
    this.is_shown_move_to_blog = true;
    var before_pos = $('#share-memo').offset().top * -1;
    if ($(".navbar").is(':visible')){
      before_pos += 40;
    }

    var selected_text = $selected_target.selection('get');
    if (selected_text != ""){
      $("#move_to_blog")
        .fadeIn()
        .unbind("click")
        .bind("click", function(){
          $(this).fadeOut();
          var item = {
            title: that._title(selected_text),
            text: selected_text,
            name: login_name,
            avatar: window.localStorage.avatarImage
          };

          $.ajax('blog' , {
            type: 'POST',
            cache: false,
            data: {blog: item},
            success: function(data){
              $selected_target.selection('replace', {
                text: '',
                caret: 'start'
              });
              $('#memo_area').scrollTop(before_pos);
            }
          });
        });
    }
  }

  this.initSocket();
}
