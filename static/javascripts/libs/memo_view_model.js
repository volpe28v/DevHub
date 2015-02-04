function MemoViewModel(no){
  this.no = no;
  this.writing_text = {text: "", name: "" , date: undefined};
  this.text_logs = [];
  this.title = "- No." + no + " -";
  this.update_timer = null;

  this.diff_mode = false;
  this.diff_list = [];
  this.diff_index = 0;
}

MemoViewModel.prototype = {
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

    // バインドだけで実現できない画面処理(いずれなんとかしたい)
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
  insert: function(row, text){
    var text_array = this.writing_text.text.split("\n");
    text_array.splice(row,0,text);
    this.writing_text.text = text_array.join("\n");
  },
  getLogsForDiff: function(){
    var out_logs = this.text_logs;
    if (this.writing_text.date != out_logs[0].date){
      out_logs.unshift(this.writing_text);
    }

    return out_logs;
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

    this.diff_list = $(diff_body).find(".insert,.delete");
    this.diff_index = 0;
    this.diff_mode = true;

    return diff_body;
  },
  getNextDiffPos: function(){
    var $current_diff_td = $(this.diff_list[this.diff_index]);
    var pos = $current_diff_td.offset().top;

    // 次の差分グループを検索
    var $diff_table = $current_diff_td.closest("table");
    var pre_index = $diff_table.find("tr").index($current_diff_td.closest("tr"));
    while(1){
      this.diff_index++;
      var $next_diff_td = $(this.diff_list[this.diff_index]);

      if (this.diff_index >= this.diff_list.length){ this.diff_index = 0 }
      var next_index = $diff_table.find("tr").index($next_diff_td.closest("tr"));
      if (next_index - pre_index != 1){ break; }
      pre_index = next_index;
    }

    return pos;
  },
  endDiff: function(){
    this.diff_list = [];
    this.diff_index = 0;
    this.diff_mode = false;
  },
  applyToWritingText: function(func){
    this.writing_text.text = func(this.writing_text.text);
  }

}
