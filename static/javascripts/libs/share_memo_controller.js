var SHARE_MEMO_NUMBER = 30;
var CODE_MIN_HEIGHT = 700;
var CODE_OUT_ADJUST_HEIGHT = 300;
var CODE_INDEX_ADJUST_HEIGHT = 40;
var CODE_OUT_ADJUST_HEIGHT_BY_CONTROL = 90;
var CONTROL_FIXED_TOP = 40;
var CONTROL_FIXED_ZEN_TOP = 0;

function ShareMemoController(param){
  var that = this;

  this.socket = param.socket;
  this.setMessage = param.setMessage;
  this.zenMode = param.zenMode;
  this.memo_number = 1;

  this.doing_up = false;
  this.doing_down = false;

  this.memoViewModels = ko.observableArray([]);
  this.currentMemoNo = 0;

  this.isMovingTab = false;

  this.control_offset_base = 0;

  // searchBox
  this.isSearching = false;
  this.before_keyword = "";
  this.matched_doms = [];

  this.keyword = ko.observable('');
  this.matched_navi_visible = ko.observable(false);
  this.matched_index = ko.observable(0);
  this.matched_num = ko.observable(0);
  this.matched_title = ko.observable("");

  this.currentMemo = function(){
    console.log(that);
    console.log(that.memoViewModels());
    console.log(that.currentMemoNo);
    return that.memoViewModels()[that.currentMemoNo-1];
  }

  this.select_memo_tab = function(data){
    console.log(that);
    if (that.isMovingTab){ return true; }

    // 遷移前のメモを表示モードに戻す
    that.currentMemo().switchFixMode();

    // タブ選択のIDを記憶する
    //var memoViewModel = that.memoViewModels[$.view(this).index];
    var memoViewModel = data;

    window.localStorage.tabSelectedID = "#share_memo_tab_" + this.no;

    for (var i = 0; i < that.memoViewModels().length; i++){
      that.memoViewModels()[i].unselect();
    }
    that.currentMemoNo = memoViewModel.no;
    that.currentMemo().select();

    $('#memo_area').scrollTop(0);
    that.adjustMemoControllbox();

    return true;
  }
 
  this.init_sharememo();
  this.init_dropzone();
}

ShareMemoController.prototype = {
  setName: function(name){
    this.login_name = name;
  },

  getName: function(){
    return this.login_name;
  },

  setWidth: function(width){
    $('#memo_area').css('width',width + 'px').css('margin',0);
  },

  setFocus: function(){
    var data_no = $(window.localStorage.tabSelectedID).data('no');
    var targetMemo = this.memoViewModels()[data_no-1];
    if (targetMemo.edit_mode){
      $('#share_memo_' + data_no).find(".code").focus();
    }else{
      var $share_memo = $('#share_memo_' + data_no);
      targetMemo.switchEditShareMemo(-1);
    }
  },

  top: function(){
    $('#memo_area').scrollTop(0);
  },

  down: function(){
    var that = this;
    if (!this.doing_down){
      $('#memo_area').scrollTop($('#memo_area').scrollTop() + 400);
      that.doing_down = false;
    }
  },

  up: function(){
    var that = this;
    if (!this.doing_up){
      $('#memo_area').scrollTop($('#memo_area').scrollTop() - 400);
      that.doing_up = false;
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
      var pos = $("#share_memo_" + no).find("#" + id).offset().top - $('#share-memo').offset().top;
      $('#memo_area').scrollTop(pos - CODE_INDEX_ADJUST_HEIGHT - 16);
    },700);
  },

  search: function(keyword){
    var that = this;
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
      for (var i = 0; i < that.memoViewModels().length; i++){
        that.memoViewModels()[i].showText();
      }
 
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
  },

  matched_next: function(){
    var index = this.matched_index() + 1;
    if (index > this.matched_num()){ index = 1; }
    this._matched_move(index);
  },

  matched_prev: function(){
    var index = this.matched_index() - 1;
    if (index < 1){ index = this.matched_num(); }
    this._matched_move(index);
  },

  _matched_move: function(next_index){
    var that = this;
    var $prev_target = $(this.matched_doms[this.matched_index() - 1]);
    this.matched_index(next_index);
    var $next_target = $(this.matched_doms[this.matched_index() - 1]);

    $prev_target.removeClass("matched_strong_line").addClass("matched_line");
    $next_target.removeClass("matched_line").addClass("matched_strong_line");

    var no = $next_target.closest(".share-memo").data("no");
    var data_no = $(window.localStorage.tabSelectedID).data('no');
    var $target_tab = $("#share_memo_tab_" + no);
    var title = $target_tab.find(".share-memo-title").text();
    that.matched_title(title);

    if (data_no != no){
      var no = $next_target.closest(".share-memo").data("no");
      $("#share_memo_tab_" + no).click();
    }
    var pos = $next_target.offset().top;
    $('#memo_area').scrollTop(pos - $("#share-memo").offset().top - $(window).height()/2);
  },

  do_search: function(){
    var that = this;
    that.search(that.keyword());
    that.isSearching = false;
    return false;
  },

  do_incremental_search: function(data, event){
    var that = this;
    if (!that.isSearching && event.keyCode != 13){
      that.isSearching = true;
      setTimeout(function(){
        if (that.isSearching){
          that.search(that.keyword());
          that.isSearching = false;
        }
      },1000);
    }
    if (that.keyword() != ""){
      $("#search_clear").show();
    }else{
      $("#search_clear").hide();
    }
  },

  do_search_clear: function(){
    var that = this;
    that.keyword("");
    that.search("");
    that.isSearching = false;
    $('#memo_area').scrollTop(0);
    $("#search_clear").hide();
  },

  adjustMemoControllbox: function(){
    var that = this;
    var pos = $("#memo_area").scrollTop();
    var offset = $('#share-memo').offset().top;

    // for control
    var $control = $('#share_memo_' + that.currentMemo().no).find('.memo-control');
    var $dummy = $('#share_memo_' + that.currentMemo().no).find('.memo-control-dummy');
    var fixed_top = that.zenMode() ? CONTROL_FIXED_ZEN_TOP : CONTROL_FIXED_TOP;

    if (!$control.hasClass('fixed')){
      var control_offset_base_tmp = $control.offset().top - offset;
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
      if (headers.eq(i).offset().top - offset - CODE_INDEX_ADJUST_HEIGHT - 10 < pos){
        that.currentMemo().setCurrentIndex(i);
        break;
      }
    }
  },


  init_sharememo: function(){
    var that = this;

    ko.applyBindings(that, $('#search_box').get(0));
    ko.applyBindings(that, $('#share-memo').get(0));

    /*
    $.templates("#shareMemoTabTmpl").link("#share_memo_nav", this.memoViewModels)
      .on('click','.share-memo-tab-elem', function(){
        if (that.isMovingTab){ return true; }

        // 遷移前のメモを表示モードに戻す
        that.currentMemo().switchFixMode();

        // タブ選択のIDを記憶する
        var memoViewModel = that.memoViewModels[$.view(this).index];

        window.localStorage.tabSelectedID = "#" + $(this).attr("id");

        for (var i = 0; i < that.memoViewModels.length; i++){
          that.memoViewModels[i].unselect();
        }
        that.currentMemoNo = memoViewModel.no;
        that.currentMemo().select();

        $('#memo_area').scrollTop(0);
        adjustMemoControllbox();

        return true;
      });
    */

    $.templates("#shareMemoTmpl").link(".share-memo-tab-content", this.memoViewModels)
      .on('click','.sync-text', function(){
        // 表示しているメモの先頭にカーソルを当てて編集状態へ
        var pos = $("#memo_area").scrollTop();
        var offset = $('#share-memo').offset().top;
        var $code_out = $('#share_memo_' + that.currentMemo().no).find('.code-out');
        var $code_out_lines = $code_out.find(".code-out-tr");
        var row = 0;
        for (var i = $code_out_lines.length - 1; i >= 0; i--){
          if ($code_out_lines.eq(i).offset().top - offset - CODE_INDEX_ADJUST_HEIGHT < pos){
            row = i;
            break;
          }
        }
 
        that.currentMemo().switchEditShareMemo(row, CODE_OUT_ADJUST_HEIGHT_BY_CONTROL);
      })
      .on("click", ".ref-point", function(){
        var id = $(this).attr("id");
        that.setMessage("[ref:" + id + "]");
      })
      .on('dblclick','.code-out tr', function(e){
        // クリック時の行数を取得してキャレットに設定する
        var row = $(this).closest("table").find("tr").index(this);
        that.currentMemo().switchEditShareMemo(row, e.pageY);

        return false;
      })
      .on('dblclick','.code-out', function(e){
        // 文字列が無い場合は最下部にキャレットを設定する
        var row = $(this).find("table tr").length - 1;
        that.currentMemo().switchEditShareMemo(row, e.pageY);
      })
      .on('click','.diff-button', function(){
        that.currentMemo().switchFixShareMemo(1);
        that.currentMemo().showDiffList();
      })
      .on('mouseover','.diff-li', function(){
        var diff_li_array = $(this).closest(".diff-list").find(".diff-li");
        var index = diff_li_array.index(this);
        diff_li_array.each(function(i, li){
          if (i < index){
            $(li).addClass("in_diff_range");
          }else if(i > index){
            $(li).removeClass("in_diff_range");
          }
        });
      })
      .on('mouseout','.diff-li', function(){
        var diff_li_array = $(this).closest(".diff-list").find(".diff-li");
        diff_li_array.each(function(i, li){
          $(li).removeClass("in_diff_range");
        });
      })
      .on('click','.diff-li', function(){
        var $share_memo = $(this).closest('.share-memo');
        var $code_out = $share_memo.find('.code-out');
        var share_memo_no = $share_memo.data('no');
        var index = $(this).closest(".diff-list").find(".diff-li").index(this);

        // diff 生成
        var $diff_out = $share_memo.find('.diff-view');
        $diff_out.empty();
        $diff_out.append(that.currentMemo().createDiff(index));
        $diff_out.showDecora();

        // diff 画面を有効化
        $diff_out.show();
        $code_out.hide();

        $share_memo.find('.diff-done').show();
        $share_memo.find('.sync-text').hide();

        if (that.currentMemo().diff_block_list.length > 0){
          $('#diff_controller').fadeIn();
        }

        // 一つ目のDiffに移動
        var pos = that.currentMemo().getNextDiffPos();
        $('#memo_area').scrollTop(pos - $share_memo.offset().top - $(window).height()/2);

        return true;
      })
      .on('click','.diff-done', function(){
        that.currentMemo().endDiff();
      })
      .on('click','.wip-jump', function(){
        that.currentMemo().switchFixMode();

        var $code_out = $('#share_memo_' + that.currentMemo().no).find('.code-out');
        var pos = $($code_out.find("tr:contains('[WIP]')")[0]).offset().top - $('#share-memo').offset().top;
        $('#memo_area').scrollTop(pos - CODE_INDEX_ADJUST_HEIGHT + 1);
        return true;
      })
      .decora({
        checkbox_callback: function(context, applyCheckStatus){
          // チェック対象のテキストを更新する
          that.currentMemo().applyToWritingText(applyCheckStatus);
        },
        img_size_callback: function(context, applyImgSize){
          // チェック対象のテキストを更新する
          that.currentMemo().applyToWritingText(applyImgSize);
        }
      })
      .on('dblclick','.code', function(e){
        that.currentMemo().switchFixShareMemo($(this).caretLine(), e.pageY);
      })
      .on('click','.fix-text', function(){
        var $code = $(this).closest('.share-memo').find('.code');
        that.currentMemo().switchFixShareMemo($code.caretLine(), CODE_OUT_ADJUST_HEIGHT_BY_CONTROL);
      })
      .on('keydown','.code',function(event){
        // Ctrl - S or Ctrl - enter
        if ((event.ctrlKey == true && event.keyCode == 83) ||
          (event.ctrlKey == true && event.keyCode == 13)) {
          event.returnvalue = false;
          var caret_top = $(this).textareaHelper('caretPos').top + $(this).offset().top;
          that.currentMemo().switchFixShareMemo($(this).caretLine(), caret_top);
          return false;
        }
      })
      .on('select','.code',function(event){
        that.currentMemo().showMoveToBlogButton($(this), that.login_name);
      });

    $.templates("#shareMemoIndexTmpl").link("#share_memo_index", this.memoViewModels)
      .on('click','.index-li', function(){
        that.currentMemo().switchFixMode();

        var index = $(this).closest(".index-ul").find(".index-li").index(this);
        var $code_out = $('#share_memo_' + that.currentMemo().no).find('.code-out');
        var pos = $code_out.find(":header").eq(index).offset().top - $('#share-memo').offset().top;
        $('#memo_area').scrollTop(pos - CODE_INDEX_ADJUST_HEIGHT);
        return true;
      });

    $('#move_to_diff').click(function(){
      var pos = that.currentMemo().getNextDiffPos();
      $('#memo_area').scrollTop(pos - $("#share-memo").offset().top - $(window).height()/2);
    });

    $('#diff_done').click(function(){
      that.currentMemo().endDiff();
      $('#memo_area').scrollTop(0);
    });

    $.templates("#shareMemoNumberTmpl").link("#memo_number", this.memoViewModels);

    for (var i = 1; i <= SHARE_MEMO_NUMBER; i++){
      //$.observable(this.memoViewModels).insert(new MemoViewModel({
      this.memoViewModels.unshift(new MemoViewModel({
        no: i,
        socket: this.socket,
        getName: function() { return that.getName(); }
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

        socket.emit('memo_tab_numbers', {numbers: tab_numbers});
      }
    });

    $("#memo_index").click(function(){
      $('#chat_area').scrollTop(0);
      that.currentMemo().showIndexList();
    });

    $("#hide_index").click(function(){
      $('#index_inner').hide();
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
      $('#memo_area').scrollTop(0);
    });

    var control_offset_base = 0;
    function adjustMemoControllbox(){
      var pos = $("#memo_area").scrollTop();
      var offset = $('#share-memo').offset().top;

      // for control
      var $control = $('#share_memo_' + that.currentMemo().no).find('.memo-control');
      var $dummy = $('#share_memo_' + that.currentMemo().no).find('.memo-control-dummy');
      var fixed_top = that.zenMode() ? CONTROL_FIXED_ZEN_TOP : CONTROL_FIXED_TOP;

      if (!$control.hasClass('fixed')){
        var control_offset_base_tmp = $control.offset().top - offset;
        if (control_offset_base_tmp < 0){ return; } // 初回表示時は調整しない
        control_offset_base = control_offset_base_tmp;
      }

      if ( control_offset_base < pos){
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
        if (headers.eq(i).offset().top - offset - CODE_INDEX_ADJUST_HEIGHT - 10 < pos){
          that.currentMemo().setCurrentIndex(i);
          break;
        }
      }
    }

    $('#memo_area').scroll(function(){
      adjustMemoControllbox();
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
        this.currentMemoNo = $(window.localStorage.tabSelectedID).data('no');
        $(window.localStorage.tabSelectedID).click();
      }else{
        this.currentMemoNo = 1;
        $('#share_memo_tab_1').click();
      }
    }

    $(".code").autofit({min_height: CODE_MIN_HEIGHT});

    $("body").on('keydown',function(event){
      // F2で共有メモの編集状態へ
      if (event.keyCode == 113){
        that.setFocus();
        return false;
      }
    });

    $('#memo_number').bind('change',function(){
      var num = $(this).val();
      socket.emit('memo_number', {num: num});
    });

    function apply_memo_number(num){
      that.memo_number = num;
      $('.share-memo-tab-elem').each(function(i){
        if (i< that.memo_number){
          $(this).fadeIn("fast");
          $(this).css("display", "block");
        }else{
          $(this).hide();
        }
      });
    }

    socket.on('memo_number', function(data){
      apply_memo_number(data.num);
      $('#memo_number').val(data.num);
    });

    socket.on('memo_tab_numbers', function(data){
      if (data == null){ return; }

      data.numbers.forEach(function(num){
        $('#share_memo_nav').append($('#share_memo_li_' + num));
      });

      apply_memo_number(that.memo_number);
    });
  },

  init_dropzone: function(){
    var that = this;

    // 閲覧モードの行指定でドロップ
    new DropZone({
      dropTarget: $('.code-out'),
      dropChildSelector: '.code-out-tr',
      alertTarget: $('#loading'),
      uploadedAction: function(context, res){
        var row = $(context).closest("table").find("tr").index(context);

        // ドロップ位置にファイルを差し込む
        that.currentMemo().insert(row + 1, res.fileName + " ");
      }
    });

    // 閲覧モードの行以外の部分にドロップ
    new DropZone({
      dropTarget: $('.code-out'),
      alertTarget: $('#loading'),
      uploadedAction: function(context, res){
        // メモの先頭に画像を差し込む
        that.currentMemo().insert(0, res.fileName + " ");
      }
    });

    // 編集モードへのドロップ
    new DropZone({
      dropTarget: $('.code'),
      alertTarget: $('#loading'),
      pasteValid: true,
      uploadedAction: function(context, res){
        var row = $(context).caretLine();

        // メモのキャレット位置にファイルを差し込む
        that.currentMemo().insert(row - 1, res.fileName + " ");
        $(context).caretLine(row);
      }
    });

    // アバターフォームへのドロップ
    new DropZone({
      dropTarget: $('#avatar'),
      alertTarget: $('#loading'),
      fileTarget: $('#upload_avatar'),
      pasteValid: true,
      uploadedAction: function(that, res){
        $('#avatar').val(res.fileName);
        $('#avatar_img').attr('src',res.fileName);
      }
    });

    // アバターアップロードボタン
    $('#upload_avatar_button').click(function(){
      $('#upload_avatar').click();
      return false;
    });
  }
}

