function MemoViewModel(param){
  this.no = param.no;
  this.socket = param.socket;
  this.getName = param.getName; //function
  this.writing_text = {text: "", name: "" , date: undefined};
  this.text_logs = [];
  this.title = "- No." + this.no + " -";
  this.update_timer = null;
  this.code_prev = "";
  this.writing_loop_timer = { id: -1, code_no: 0};
  this.is_shown_move_to_blog = false;

  this.diff_mode = false;
  this.diff_block_list = [];
  this.diff_index = 0;

  this.initSocket();
}

MemoViewModel.prototype = {
  initSocket: function(){
    var that = this;
    socket.on('text' + this.no, function(text_log) {
      that.setText(text_log);

      if ( that.edit_mode ){
        // 編集中の共有メモに他ユーザの変更が来たら編集終了
        if( that.getName() != text_log.name ){
          var $target = $('#share_memo_' + that.no);
          that.switchFixShareMemo($target.children('.code').caretLine());
        }
      }else{
        // 同共有メモを編集していない場合はメモ本文を更新
        that.showText();
      }
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
  },

  _title: function(text){
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
  },

  setText: function(text_body){
    var that = this;
    this.writing_text = text_body;
    $.observable(this).setProperty("writer", this.writing_text.name);
    $.observable(this).setProperty("title", this._title(this.writing_text.text));

    // バインドだけで実現できない画面処理
    var $target_tab = $('#share_memo_tab_' + this.no);
    var $tab_title = $target_tab.children('.share-memo-title');
    emojify.run($tab_title.get(0));

    var $writer = $target_tab.children('.writer');
    $writer.addClass("writing-name");

    var $timestamp = $target_tab.find('.timestamp');
    $timestamp.attr("data-livestamp", text_body.date);

    var $target = $('#share_memo_' + this.no);
    var $text_date = $target.children('.text-date');
    $text_date.html(text_body.date);
    $text_date.removeClass("label-info");
    $text_date.addClass("label-important");
    $text_date.show();

    var is_blank = text_body.text == "";
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
      $text_date.removeClass("label-important");
      $text_date.addClass("label-info");
      $writer.removeClass("writing-name");
      that.update_timer = null;
    },3000);
  },
  
  switchFixMode: function(){
    if ( this.edit_mode){
      this.switchFixShareMemo(1);
    }

    if ( this.diff_mode ){
      this.endDiff();
    }
  },

  switchFixShareMemo: function(row, offset){
    var $share_memo = $('#share_memo_' + this.no);
    this.edit_mode = false;

    offset = offset == undefined ? $(window).height()/3 : offset - 14;
    if ($share_memo.children('.code').css('display') == "none"){ return; }

    // 最新の状態をサーバへ送信する
    var code = $share_memo.children('.code').val();
    if (this.code_prev != code){
      socket.emit('text',{no: this.no, text: code});
    }

    // 見栄えを閲覧モードへ
    this.showText();
    $share_memo.children('.code').hide();
    $share_memo.children('pre').show();
    $share_memo.children('.fix-text').hide();
    $share_memo.children('.sync-text').show();

    // 閲覧モード時に編集していたキャレット位置を表示する
    var $target_tr = $share_memo.find('table tr').eq(row - 1);
    if ($target_tr.length > 0){
      $('#memo_area').scrollTop(0);
      $('#memo_area').scrollTop($target_tr.offset().top - offset);
    }
    socket.emit('add_history',{no: $share_memo.data('no')});
    this.writingLoopStop();

    $("#move_to_blog").fadeOut();
  },

  writingLoopStop: function(){
    clearInterval(this.writing_loop_timer.id);
    this.writing_loop_timer = { id: -1, code_no: 0};
  },

  switchEditShareMemo: function(row, offset){
    var $share_memo = $('#share_memo_' + this.no);
    this.edit_mode = true;

    offset = offset == undefined ? $(window).height()/3 : offset - 94;
    var $target_code = $share_memo.children(".code");
    $target_code.val(this.writing_text.text);

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
    $share_memo.children('.fix-text').show();
    $share_memo.children('.sync-text').hide();

    this.code_prev = $target_code.val();
    this.writingLoopStart();
  },

  writingLoopStart: function(){
    var that = this;
    $target_code = $('#share_memo_' + this.no).children('.code');
    var loop = function() {
      var code = $target_code.val();
      if (that.code_prev != code) {
        that.socket.emit('text',{no: that.no, text: code});
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
  },

  showText: function(){
    var that = this;
    var $target = $('#share_memo_' + this.no);
    $target.find('.code-out').showDecora(this.writing_text.text);
    $target.find('.code-out').sortable({
      items: "tr:has(.checkbox-draggable),tr:has(.text-draggable)",
      start: function(event,ui){
        that.drag_index = ui.item.index();
      },
      stop: function(event,ui){
        var drag_stop_index = ui.item.index();
        if (drag_stop_index == that.drag_index){ return; }

        var text_array = that.writing_text.text.split("\n");
        text_array.splice(drag_stop_index, 0, text_array.splice(that.drag_index,1));
        that.writing_text.text = text_array.join("\n");
        that.socket.emit('text',{no: that.no, text: that.writing_text.text});
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
      scroll: true
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
  },

  insert: function(row, text){
    var text_array = this.writing_text.text.split("\n");
    text_array.splice(row,0,text);
    this.writing_text.text = text_array.join("\n");

    if (this.edit_mode){
      var $target_code = $('#share_memo_' + this.no).children('.code');
      $target_code.val(this.writing_text.text);
    }else{
      this.socket.emit('text',{no: this.no, text: this.writing_text.text});
    }
 },

  showIndexList: function(){
    var $share_memo = $('#share_memo_' + this.no);

    var $index_list = $share_memo.find('.index-list');
    var $code_out = $share_memo.find('.code-out');
    $index_list.empty();
    $code_out.find(":header").each(function(){
      var h_num = parseInt($(this).get()[0].localName.replace("h",""));
      var prefix = "";
      for (var i = 1; i < h_num; i++){ prefix += "&emsp;"; }
      $index_list.append($('<li/>').append($('<a/>').addClass("index-li").attr('href',"#").html(prefix + " " + $(this).text())));
    });
  },

  _getLogsForDiff: function(){
    var out_logs = this.text_logs;
    if (this.writing_text.date != out_logs[0].date){
      out_logs.unshift(this.writing_text);
    }

    return out_logs;
  },

  showDiffList: function(){
    var $share_memo = $('#share_memo_' + this.no);
    var $diff_list = $share_memo.find('.diff-list');
    var text_log = this._getLogsForDiff();

    $diff_list.empty();
    $diff_list.append($('<li/>').append($('<a/>').addClass("diff-li").attr('href',"#").html('<i class="icon-play"></i> Current memo - ' + text_log[0].name)));
    for (var i = 1; i < text_log.length; i++){
      $diff_list.append($('<li/>').append($('<a/>').addClass("diff-li").attr('href',"#").html(text_log[i].date + " - " + text_log[i].name)));
    }
  },

  createDiff: function(index){
    var base   = difflib.stringAsLines(this.text_logs[index].text);
    var newtxt = difflib.stringAsLines(this.writing_text.text);
    var sm = new difflib.SequenceMatcher(base, newtxt);
    var opcodes = sm.get_opcodes();

    var diff_body = diffview.buildView({
      baseTextLines: base,
      newTextLines: newtxt,
      opcodes: opcodes,
      baseTextName: "Current",
      newTextName: this.text_logs[index].date + " - " + this.text_logs[index].name,
      viewType: 1
    });

    var diff_list = $(diff_body).find(".insert,.delete");
    this.diff_index = 0;
    this.diff_mode = true;

    // 差分グループを生成
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

    $('#move_to_diff .btn').html('<i class="icon-arrow-down icon-white"></i> Next Diff 0/' + this.diff_block_list.length);
    return diff_body;
  },

  getNextDiffPos: function(){
    var pos = this.diff_block_list[this.diff_index].offset().top;
    if (++this.diff_index >= this.diff_block_list.length){ this.diff_index = 0; }

    // ボタンの文字列変更
    if (this.diff_index == 0){
      $('#move_to_diff .btn').html('<i class="icon-arrow-up icon-white"></i> Next Diff ' + this.diff_block_list.length + '/' + this.diff_block_list.length);
    }else{
      $('#move_to_diff .btn').html('<i class="icon-arrow-down icon-white"></i> Next Diff ' + this.diff_index + '/' + this.diff_block_list.length);
    }
    return pos;
  },

  endDiff: function(){
    var $share_memo = $("#share_memo_" + this.no);
    $share_memo.find('pre').show();
    $share_memo.find('.diff-view').hide();

    $share_memo.find('.diff-done').hide();
    $share_memo.find('.sync-text').show();
    $share_memo.find('.index-button').show();

    $('#move_to_diff').fadeOut();
 
    this.diff_index = 0;
    this.diff_mode = false;
    this.diff_block_list = [];
  },

  applyToWritingText: function(func){
    this.writing_text.text = func(this.writing_text.text);
    this.socket.emit('text',{no: this.no, text: this.writing_text.text});
  },

  showMoveToBlogButton: function($selected_target, login_name){
    var that = this;
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
            name: login_name
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
}
