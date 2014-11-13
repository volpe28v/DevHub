var SHARE_MEMO_NUMBER = 30;
var CODE_MIN_HEIGHT = 700;
var CODE_OUT_ADJUST_HEIGHT = 300;
var CODE_INDEX_ADJUST_HEIGHT = 50;

function ShareMemoController(param){
  this.socket = param.socket;
  this.setMessage = param.setMessage;
  this.isEditMode = false;
  this.isShownMoveToBlog = false;
  this.memo_number = 1;

  this.doing_up = false;
  this.doing_down = false;

  this.writing_text = [];
  this.text_logs = [];

  // searchBox
  this.keyword = "";
  this.before_keyword = "";
  this.matched_navi_style = "display:none";
  this.matched_index = 0;
  this.matched_num = 0;
  this.matched_doms = [];
  this.matched_title = "";

  this.init_sharememo();
  this.init_socket();
  this.init_dropzone();
}

ShareMemoController.prototype = {
  setName: function(name){
    this.login_name = name;
  },

  setWidth: function(width){
    $('#memo_area').css('width',width + 'px').css('margin',0);
  },

  setFocus: function(){
    var data_no = $(window.localStorage.tabSelectedID).data('no');
    if (this.isEditMode){
      $('#share_memo_' + data_no).find(".code").focus();
    }else{
      var $share_memo = $('#share_memo_' + data_no);
      this.switchEditShareMemo($share_memo, -1);
    }
  },

  top: function(){
    $('#memo_area').animate({ scrollTop: 0 }, 'fast');
  },

  down: function(){
    var that = this;
    if (!this.doing_down){
      $('#memo_area').animate({ scrollTop: $('#memo_area').scrollTop() + 400 }, 'fast', function(){
        that.doing_down = false;
      });
    }
  },

  up: function(){
    var that = this;
    if (!this.doing_up){
      $('#memo_area').animate({ scrollTop: $('#memo_area').scrollTop() - 400 }, 'fast', function(){
      that.doing_up = false;
      });
    }
  },

  prev: function(){
    var data_no = $(window.localStorage.tabSelectedID).data('no');
    data_no -= 1;
    if (data_no <= 0){
      data_no = this.memo_number;
    }
    $("#share_memo_tab_" + data_no).click();
  },

  next: function(){
    var data_no = $(window.localStorage.tabSelectedID).data('no');
    data_no += 1;
    if (data_no > this.memo_number){
      data_no = 1;
    }
    $("#share_memo_tab_" + data_no).click();
  },

  move: function(id){
    var no = id.split("-")[0];
    $("#share_memo_tab_" + no).click();

    // 移動したタブ名を見せたいのでタイムラグを入れる
    setTimeout(function(){
      var pos = $("#share_memo_" + no).find("#" + id).offset().top;
      $('#memo_area').animate({ scrollTop: pos - CODE_INDEX_ADJUST_HEIGHT}, 'fast');
    },700);
  },

  search: function(){
    var that = this;
    if (that.keyword == ""){
      that.before_keyword = that.keyword;
      $(".matched_strong_line").removeClass("matched_strong_line");
      $(".matched_line").removeClass("matched_line");

      $.observable(that).setProperty("matched_num", 0);
      $.observable(that).setProperty("matched_index", 0);
      $.observable(that).setProperty("matched_navi_style", "display: none;");
    }else if(that.before_keyword != that.keyword){
      $(".matched_strong_line").removeClass("matched_strong_line");
      $(".matched_line").removeClass("matched_line");

      that.before_keyword = that.keyword;
      that.matched_doms = [];
      var reg_keyword = new RegExp(that.keyword,"i");
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

      $.observable(that).setProperty("matched_num", that.matched_doms.length);
      $.observable(that).setProperty("matched_index", 0);
      $.observable(that).setProperty("matched_navi_style", "display: inline;");
      $.observable(that).setProperty("matched_title", "");
      if (that.matched_num > 0){
        that.matched_next();
      }
    }else{
      that.matched_next();
    }
  },

  matched_next: function(){
    var index = this.matched_index + 1;
    if (index > this.matched_num){ index = 1; }
    this._matched_move(index);
  },

  matched_prev: function(){
    var index = this.matched_index - 1;
    if (index < 1){ index = this.matched_num; }
    this._matched_move(index);
  },

  _matched_move: function(next_index){
    var $prev_target = $(this.matched_doms[this.matched_index - 1]);
    $.observable(this).setProperty("matched_index", next_index);
    var $next_target = $(this.matched_doms[this.matched_index - 1]);

    $prev_target.removeClass("matched_strong_line").addClass("matched_line");
    $next_target.removeClass("matched_line").addClass("matched_strong_line");

    var no = $next_target.closest(".share-memo").data("no");
    var data_no = $(window.localStorage.tabSelectedID).data('no');
    var $target_tab = $("#share_memo_tab_" + no);
    var title = $target_tab.find(".share-memo-title").text();
    $.observable(this).setProperty("matched_title", title);

    if (data_no != no){
      var no = $next_target.closest(".share-memo").data("no");
      $("#share_memo_tab_" + no).click();

      // 移動したタブ名を見せたいのでタイムラグを入れる
      setTimeout(function(){
        var pos = $next_target.offset().top;
        $('#memo_area').animate({ scrollTop: pos - $("#share-memo").offset().top - $(window).height()/2}, 'fast');
      },700);
    }else{
      var pos = $next_target.offset().top;
      $('#memo_area').animate({ scrollTop: pos - $("#share-memo").offset().top - $(window).height()/2}, 'fast');
    }
  },


  init_sharememo: function(){
    var that = this;

    $.templates("#searchBoxTmpl").link("#search_box", this)
      .on("submit", "#search_form", function(){
        that.search();
        return false;
      })
    .on("focus", ".search-query", function(){
      $(this).switchClass("input-small", "input-large","fast");
    })
    .on("blur", ".search-query", function(){
      if (that.keyword == ""){
        $(this).switchClass("input-large", "input-small","fast");
      }
    })
    .on("click", "#prev_match", function(){
      that.matched_prev();
      return false;
    })
    .on("click", "#next_match",function(){
      that.matched_next();
      return false;
    });


    for (var i = SHARE_MEMO_NUMBER; i > 1; i--){
      $("#share_memo_tab_top").after($('<li/>').addClass("share-memo-tab").attr("data-no",i));
      $("#share_memo_1").after($('<div/>').attr('id',"share_memo_" + i).attr("data-no",i).addClass("share-memo tab-pane"));
      $("#memo_number_option_top").after($('<option/>').attr('value',i).html(i));
    }

    // タブ選択のIDを記憶する
    $("#share_memo_nav").on('click',".share-memo-tab-elem",function(){
      window.localStorage.tabSelectedID = "#" + $(this).attr("id");
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

    $("#scroll_top").click(function(){
      $('#memo_area').animate({ scrollTop: 0 }, 'fast');
    });

    $(".share-memo-tab").each(function(){
      var no = $(this).data('no');
      $(this).append($('#shareMemoTabTmpl').render({no: no}));
    });

    $(".share-memo").each(function(){
      $(this).append($('#shareMemoTmpl').render());
    });

    $(".share-memo").on("click", ".ref-point", function(){
      var id = $(this).attr("id");
      that.setMessage("[ref:" + id + "]");
    });

    // 前回の状態を復元する
    if ( window.localStorage ){
      // タブスタイル
      if ( window.localStorage.tabChanged != 'false' ){
        $('#share_memo_nav').hide();
        $('#share_memo_tabbable').removeClass("tabs-left");
        $('#share_memo_nav').removeClass("nav-tabs");
        $('#share_memo_nav').addClass("nav-pills");
        $('#share_memo_nav').show();
      }
      // タブ選択状態
      if ( window.localStorage.tabSelectedID ){
        $(window.localStorage.tabSelectedID).click();
      }
    }
  },

  init_socket: function(){
    var that = this;
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

    this.switchEditShareMemo = function($share_memo, row, offset){
      that.isEditMode = true;
      offset = offset == undefined ? $(window).height()/3 : offset - 94;
      var no = $share_memo.data('no');
      that.writing_text[no] = that.writing_text[no] ? that.writing_text[no] : { text: "" };

      var $target_code = $share_memo.children(".code");
      $target_code.val(that.writing_text[no].text);
      $('#memo_area').scrollTop(row * 21 + ($share_memo.offset().top - $('#share-memo').offset().top) - offset);

      $target_code.show();
      $target_code.keyup(); //call autofit
      // 編集モード時に選択した行位置を表示する
      if (row >= 0){
        $target_code.caretLine(row);
      }else{
        // キャレット位置指定なしの場合は前回の場所を復元
        $target_code.caretLine();
      }
      $target_code.focus();

      $share_memo.children('pre').hide();
      $share_memo.children('.fix-text').show();
      $share_memo.children('.sync-text').hide();

      code_prev = $target_code.val();
      writing_loop_start(no);
    }

    $('.share-memo').on('click','.sync-text', function(){
      var $share_memo = $(this).closest('.share-memo');
      that.switchEditShareMemo($share_memo, 0);
    });

    $('.share-memo').on('dblclick','pre tr', function(e){
      // クリック時の行数を取得してキャレットに設定する
      var $share_memo = $(this).closest('.share-memo');
      var row = $(this).closest("table").find("tr").index(this);
      that.switchEditShareMemo($share_memo, row, e.pageY);
      return false;
    });

    $('.share-memo').on('dblclick','pre', function(e){
      // 文字列が無い場合は最下部にキャレットを設定する
      var $share_memo = $(this).closest('.share-memo');
      var row = $(this).find("table tr").length - 1;
      that.switchEditShareMemo($share_memo, row, e.pageY);
    });

    // 差分リスト表示
    $('.share-memo').on('click','.diff-button', function(){
      var $share_memo = $(this).closest('.share-memo');
      switchFixShareMemo($share_memo,1);

      var $diff_list = $share_memo.find('.diff-list');
      var share_memo_no = $share_memo.data('no');
      var text_log = that.text_logs[share_memo_no];
      if (text_log == undefined || text_log.length == 0 ){ return; }
      if (that.writing_text[share_memo_no].date != text_log[0].date){
        text_log.unshift(that.writing_text[share_memo_no]);
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
      var base   = difflib.stringAsLines(that.text_logs[share_memo_no][index].text);
      var newtxt = difflib.stringAsLines(that.writing_text[share_memo_no].text);
      var sm = new difflib.SequenceMatcher(base, newtxt);
      var opcodes = sm.get_opcodes();
      var $diff_out = $share_memo.find('.diff-view');
      $diff_out.empty();
      $diff_out.append(diffview.buildView({
        baseTextLines: base,
        newTextLines: newtxt,
        opcodes: opcodes,
        baseTextName: "Current",
        newTextName: that.text_logs[share_memo_no][index].date + " - " + that.text_logs[share_memo_no][index].name,
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
      $share_memo.find('pre').show();
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
      checkbox_callback: function(context, applyCheckStatus){
        var share_memo_no = $(context).closest('.share-memo').data('no');

        // チェック対象のテキストを更新する
        that.writing_text[share_memo_no].text = applyCheckStatus(that.writing_text[share_memo_no].text);

        // 変更をサーバへ通知
        var $target_code = $(context).closest('.share-memo').children('.code');
        $target_code.val(that.writing_text[share_memo_no].text);
        socket.emit('text',{no: share_memo_no, text: $target_code.val()});
      }
    });

    function switchFixShareMemo($share_memo, row, offset){
      that.isEditMode = false;
      offset = offset == undefined ? $(window).height()/3 : offset - 14;
      if ($share_memo.children('.code').css('display') == "none"){ return; }

      // 最新の状態をサーバへ送信する
      var no = writing_loop_timer.code_no;
      var code = $share_memo.children('.code').val();
      if (code_prev != code){
        socket.emit('text',{no: no, text: code});
      }

      // 見栄えを閲覧モードへ
      updateShareMemoBody($share_memo, that.writing_text[no].text);
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
      writing_loop_stop();

      $("#move_to_blog").fadeOut();
    }

    function updateShareMemoBody($target, text){
      $target.find('.code-out').showDecora(text);

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
    }

    $('#share-memo').on('click','.share-memo-tab-elem', function(){
      var writing_no = writing_loop_timer.code_no;
      if ( writing_no != 0){
        $share_memo = $('#share_memo_' + writing_no);
        switchFixShareMemo($share_memo, 1);
      }
      $('#memo_area').animate({ scrollTop: 0 }, 'fast');
      return true;
    });

    $('.share-memo').on('dblclick','.code', function(e){
      switchFixShareMemo($(this).parent(), $(this).caretLine(), e.pageY);
    });

    $('.share-memo').on('click','.fix-text', function(){
      switchFixShareMemo($(this).parent(),1);
    });

    $(".share-memo").on('keydown','.code',function(event){
      // Ctrl - S or Ctrl - enter
      if ((event.ctrlKey == true && event.keyCode == 83) ||
        (event.ctrlKey == true && event.keyCode == 13)) {
        event.returnvalue = false;
        var caret_top = $(this).textareaHelper('caretPos').top + $(this).offset().top;
        switchFixShareMemo($(this).parent(), $(this).caretLine(), caret_top);
        return false;
      }
    });

    function _title(text){
      var blog_lines = text.split('\n');
      var title = "";
      for (var i = 0; i < blog_lines.length; i++){
        var line = blog_lines[i];
        var matched = line.match(/(\S+)/);
        if (matched){
          title = blog_lines[i];
          break;
        }
      };

      title = $('<div/>').html($.decora.to_html(title)).text();
      return title;
    }

    // 選択テキストを blog へ移動する
    $(".share-memo").on('select','.code',function(event){
      var $selected_target = $(this);
      if ($selected_target.selection('get') != ""){
        that.isShownMoveToBlog = true;
        $("#move_to_blog")
          .fadeIn()
          .unbind("click")
          .bind("click", function(){
            $(this).fadeOut();
            var selected_text = $selected_target.selection('get');
            if (selected_text != ""){
              var item = {
                title: _title(selected_text),
                text: selected_text,
                name: that.login_name
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
                }
              });
            }
          });
      }
    });

    var update_timer = [];
    // for share memo
    function update_text(text_log){
      var no = text_log.no == undefined ? 1 : text_log.no;
      that.writing_text[no] = text_log;

      var $target = $('#share_memo_' + no);
      var $target_tab = $('#share_memo_tab_' + no);

      if ( no == writing_loop_timer.code_no ){
        // 編集中の共有メモに他ユーザの変更が来たら編集終了
        if( that.login_name != text_log.name ){
          switchFixShareMemo($target, $target.children('.code').caretLine());
        }
      }else{
        // 同共有メモを編集していない場合はメモ本文を更新
        updateShareMemoBody($target, text_log.text);
      }

      // for writer
      var $text_date = $target.children('.text-date');
      $text_date.html(text_log.date);
      $text_date.removeClass("label-info");
      $text_date.addClass("label-important");
      $text_date.show();

      var title = $('<div/>').html($.decora.to_html(text_log.text.split("\n")[0])).text();
      if (!title.match(/\S/g)){
        title = " - No." + no + " - ";
      }
      var $tab_title = $target_tab.children('.share-memo-title').html(title);
      emojify.run($tab_title.get(0));

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
        $text_date.html(text_log.date);
        $text_date.removeClass("label-important");
        $text_date.addClass("label-info");
        $writer.removeClass("writing-name");
        update_timer[no] = undefined;
      },3000);
    }

    socket.on('text', function(text_log) {
      if (text_log instanceof Array){
        text_log.forEach(function(one_log){
          update_text(one_log);
        });
      }else{
        update_text(text_log);
      }
    });

    socket.on('text_logs_with_no', function(data){
      that.text_logs[data.no] = data.logs;
    });

    var code_prev = "";

    var writing_loop_timer = { id: -1, code_no: 0};
    function writing_loop_start(no){
      $target_code = $('#share_memo_' + no).children('.code');
      var loop = function() {
        var code = $target_code.val();
        if (code_prev != code) {
          socket.emit('text',{no: no, text: code});
          code_prev = code;
        }

        // Blogへ移動ボタンの表示状態を制御
        if (that.isShownMoveToBlog){
          if ($target_code.selection('get') == ""){
            $("#move_to_blog").fadeOut();
            that.isShownMoveToBlog = false;
          }
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
      that.memo_number = data.num;
      $('.share-memo-tab-elem').hide();
      for (var i = 1; i <= that.memo_number; i++){
        $('#share_memo_tab_' + i).fadeIn("fast");
        $('#share_memo_tab_' + i).css("display", "block");
      }
      $('#memo_number').val(that.memo_number);
    });
  },

  init_dropzone: function(){
    var that = this;

    // 閲覧モードの行指定でドロップ
    new DropZone({
      dropTarget: $('.code-out'),
      dropChildSelector: '.code-out-tr',
      alertTarget: $('#alert_memo_area'),
      uploadedAction: function(context, res){
        var share_memo_no = $(context).closest('.share-memo').data('no');
        var row = $(context).closest("table").find("tr").index(context);

        // ドロップ位置にファイルを差し込む
        var text_array = that.writing_text[share_memo_no].text.split("\n");
        text_array.splice(row + 1,0,res.fileName + " ");
        that.writing_text[share_memo_no].text = text_array.join("\n");
        var $target_code = $(context).closest('.share-memo').children('.code');
        $target_code.val(that.writing_text[share_memo_no].text);

        // 変更をサーバへ通知
        socket.emit('text',{no: share_memo_no, text: $target_code.val()});
      }
    });

    // 閲覧モードの行以外の部分にドロップ
    new DropZone({
      dropTarget: $('.code-out'),
      alertTarget: $('#alert_memo_area'),
      uploadedAction: function(context, res){
        var share_memo_no = $(context).closest('.share-memo').data('no');

        // メモの先頭に画像を差し込む
        that.writing_text[share_memo_no].text = res.fileName + ' ' + '\n' + that.writing_text[share_memo_no].text;

        // 変更をサーバへ通知
        var $target_code = $(context).closest('.share-memo').children('.code');
        $target_code.val(that.writing_text[share_memo_no].text);
        socket.emit('text',{no: share_memo_no, text: $target_code.val()});
      }
    });

    // 編集モードへのドロップ
    new DropZone({
      dropTarget: $('.code'),
      alertTarget: $('#alert_memo_area'),
      pasteValid: true,
      uploadedAction: function(context, res){
        var share_memo_no = $(context).closest('.share-memo').data('no');
        var row = $(context).caretLine();

        // メモのキャレット位置にファイルを差し込む
        var text_array = that.writing_text[share_memo_no].text.split("\n");
        text_array.splice(row - 1,0,res.fileName + ' ');
        that.writing_text[share_memo_no].text = text_array.join("\n");
        var $target_code = $(context).closest('.share-memo').children('.code');
        $target_code.val(that.writing_text[share_memo_no].text);
        $(context).caretLine(row);
      }
    });

    // アバターフォームへのドロップ
    new DropZone({
      dropTarget: $('#avatar'),
      fileTarget: $('#upload_avatar'),
      pasteValid: true,
      uploadedAction: function(that, res){
        $('#avatar').val(res.fileName);
      }
    });

    // アバターアップロードボタン
    $('#upload_avatar_button').click(function(){
      $('#upload_avatar').click();
      return false;
    });
  }
}

