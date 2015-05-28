var SHARE_MEMO_NUMBER = 30;
var CODE_MIN_HEIGHT = 700;
var CODE_OUT_ADJUST_HEIGHT = 300;
var CODE_INDEX_ADJUST_HEIGHT = 10;

function ShareMemoController(param){
  this.socket = param.socket;
  this.setMessage = param.setMessage;
  this.memo_number = 1;

  this.doing_up = false;
  this.doing_down = false;

  this.memoViewModels = [];
  this.currentMemoNo = 0;

  // searchBox
  this.isSearching = false;
  this.keyword = "";
  this.before_keyword = "";
  this.matched_navi_style = "display:none";
  this.matched_index = 0;
  this.matched_num = 0;
  this.matched_doms = [];
  this.matched_title = "";

  this.init_sharememo();
  this.init_dropzone();
}

ShareMemoController.prototype = {
  currentMemo: function(){
    return this.memoViewModels[this.currentMemoNo-1];
  },

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
    var targetMemo = this.memoViewModels[data_no-1];
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
      $('#memo_area').scrollTop(pos - CODE_INDEX_ADJUST_HEIGHT);
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
    }
    var pos = $next_target.offset().top;
    $('#memo_area').scrollTop(pos - $("#share-memo").offset().top - $(window).height()/2);
  },

  init_sharememo: function(){
    var that = this;

    $.templates("#searchBoxTmpl").link("#search_box", this)
      .on("submit", "#search_form", function(){
        that.search();
        that.isSearching = false;
        return false;
      })
      .on('keyup', ".search-query", function(event){
        that.keyword = $(this).val();
        if (!that.isSearching && event.keyCode != 13){
          that.isSearching = true;
          setTimeout(function(){
            if (that.isSearching){
              that.search();
              that.isSearching = false;
            }
          },1000);
        }
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

    $.templates("#shareMemoTabTmpl").link("#share_memo_nav", this.memoViewModels)
      .on('click','.share-memo-tab-elem', function(){
        // 遷移前のメモを表示モードに戻す
        that.currentMemo().switchFixMode();

        // タブ選択のIDを記憶する
        var memoViewModel = that.memoViewModels[$.view(this).index];

        window.localStorage.tabSelectedID = "#" + $(this).attr("id");
        that.currentMemoNo = memoViewModel.no;

        $('#memo_area').scrollTop(0);
        return true;
      });

    $.templates("#shareMemoTmpl").link(".share-memo-tab-content", this.memoViewModels)
      .on('click','.sync-text', function(){
        that.currentMemo().switchEditShareMemo(0);
      })
      .on("click", ".ref-point", function(){
        var id = $(this).attr("id");
        that.setMessage("[ref:" + id + "]");
      })
      .on('dblclick','pre tr', function(e){
        // クリック時の行数を取得してキャレットに設定する
        var row = $(this).closest("table").find("tr").index(this);
        that.currentMemo().switchEditShareMemo(row, e.pageY);

        return false;
      })
      .on('dblclick','pre', function(e){
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
        var $code_out_pre = $share_memo.find('pre');
        var share_memo_no = $share_memo.data('no');
        var index = $(this).closest(".diff-list").find(".diff-li").index(this);

        // diff 生成
        var $diff_out = $share_memo.find('.diff-view');
        $diff_out.empty();
        $diff_out.append(that.currentMemo().createDiff(index));

        // diff 画面を有効化
        $diff_out.fadeIn();
        $code_out_pre.hide();

        $share_memo.find('.diff-done').show();
        $share_memo.find('.sync-text').hide();
        $share_memo.find('.index-button').hide();

        if (that.currentMemo().diff_block_list.length > 0){
          $('#move_to_diff').fadeIn();
        }

        return true;
      })
      .on('click','.diff-done', function(){
        that.currentMemo().endDiff();
      })
      .on('click','.index-button', function(){
        that.currentMemo().switchFixMode();
        that.currentMemo().showIndexList();
      })
      .on('click','.index-li', function(){
        var index = $(this).closest(".index-list").find(".index-li").index(this);
        var $code_out = $(this).closest('.share-memo').find('.code-out');
        var pos = $code_out.find(":header").eq(index).offset().top - $('#share-memo').offset().top;
        $('#memo_area').scrollTop(pos - CODE_INDEX_ADJUST_HEIGHT);
        return true;
      })
      .decora({
        checkbox_callback: function(context, applyCheckStatus){
          // チェック対象のテキストを更新する
          that.currentMemo().applyToWritingText(applyCheckStatus);
        }
      })
      .on('dblclick','.code', function(e){
        that.currentMemo().switchFixShareMemo($(this).caretLine(), e.pageY);
      })
      .on('click','.fix-text', function(){
        that.currentMemo().switchFixShareMemo(1);
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


    $('#move_to_diff').click(function(){
      var pos = that.currentMemo().getNextDiffPos();
      $('#memo_area').scrollTop(pos - $("#share-memo").offset().top - $(window).height()/2);
    });

    $.templates("#shareMemoNumberTmpl").link("#memo_number", this.memoViewModels);

    for (var i = 1; i <= SHARE_MEMO_NUMBER; i++){
      $.observable(this.memoViewModels).insert(new MemoViewModel({
        no: i,
        socket: this.socket,
        getName: function() { return that.getName(); }
      }));
    }

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

